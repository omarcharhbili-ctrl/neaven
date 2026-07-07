import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  rawFindings,
  subAgentSummaries,
  tips,
  visionBaselines,
} from "@/db/schema";
import { GROQ_MODELS, groqJson } from "@/lib/llm/groq";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export interface WatcherInput {
  founderId: string;
  source: "mcp_checkin" | "pr_agent" | "manual";
  /** What happened — session summary, PR-Agent review body, etc. */
  content: string;
  repo?: string;
  prNumber?: number;
  /** Watcher depth dial (1–5) — governs how picky the evaluator is. */
  depth?: number;
}

interface Evaluation {
  kind: "drift" | "stall" | "quality";
  severity: "low" | "medium" | "high";
  title: string;
  detail: string;
  interrupt: boolean;
  worth_flagging: boolean;
}

/**
 * The Watcher's shared interruption policy: one evaluator for both pipelines
 * (MCP check-ins and PR-Agent scans). Compares input against the CURRENT
 * vision baseline, classifies drift/stall/quality, and applies severity
 * gating. High severity interrupts; low/medium waits for the next open
 * conversation. Never converses — only flags.
 */
export async function evaluateFinding(
  input: WatcherInput,
): Promise<Evaluation | null> {
  const vision = await db.query.visionBaselines.findFirst({
    where: and(
      eq(visionBaselines.founderId, input.founderId),
      eq(visionBaselines.isCurrent, true),
    ),
    orderBy: desc(visionBaselines.version),
  });

  // No baseline → drift isn't measurable (onboarding is the hard gate).
  // Quality findings from PR-Agent still land; drift/stall evaluation waits.
  const visionText = vision
    ? `Vision: ${vision.vision}\nScope: ${vision.scope}\nBrand: ${vision.brand}`
    : "No vision baseline captured yet — do NOT classify anything as drift; only quality/stall.";

  const depth = input.depth ?? 3;

  const evaluation = await groqJson<Evaluation>(GROQ_MODELS.watcher, [
    {
      role: "system",
      content: `You are the Watcher — Neaven's quiet supervision agent. You observe a founder's coding activity and flag ONLY what matters. You never lecture.

Classify the finding and decide whether it clears the interruption bar.

Founder's current vision baseline:
${visionText}

Thoroughness dial: ${depth}/5 (1 = only flagrant issues, 5 = meticulous).

Rules:
- kind: "drift" (work contradicts the stated vision/scope), "stall" (lots of activity, little shipped, signs of being stuck), or "quality" (security, scalability, code quality).
- severity: "high" only for major off-vision decisions, real stuck-states, or severe security/quality breaches. Routine lint-level issues are "low".
- interrupt: true ONLY for high severity — it means breaking into the founder's session right now.
- worth_flagging: false for routine, expected activity (normal back-and-forth, minor nits below the dial's threshold). When false, nothing is stored.
- title: one calm sentence, no exclamation marks. detail: 2-3 sentences max.

Respond with JSON: {"kind","severity","title","detail","interrupt","worth_flagging"}`,
    },
    {
      role: "user",
      content: `Source: ${input.source}${input.repo ? `\nRepo: ${input.repo}` : ""}${input.prNumber ? `\nPR #${input.prNumber}` : ""}\n\n${input.content.slice(0, 8000)}`,
    },
  ]);

  if (!evaluation.worth_flagging) return null;

  const [finding] = await db
    .insert(rawFindings)
    .values({
      founderId: input.founderId,
      source: input.source,
      kind: evaluation.kind,
      severity: evaluation.severity,
      title: evaluation.title,
      body: evaluation.detail,
      repo: input.repo,
      prNumber: input.prNumber,
      interrupted: evaluation.interrupt,
      expiresAt: new Date(Date.now() + THIRTY_DAYS_MS),
    })
    .returning();

  // Anything that cleared the interruption bar becomes a tip immediately,
  // without waiting for the nightly clustering (Watcher spec §Memory Model).
  if (evaluation.interrupt) {
    await upsertTip(input.founderId, evaluation.kind, evaluation.title);
  }

  // Significant events push a summary up to the main agent (event-driven,
  // summary-first). Low-severity routine findings don't.
  if (evaluation.severity === "high" || evaluation.severity === "medium") {
    await db.insert(subAgentSummaries).values({
      founderId: input.founderId,
      agent: "watcher",
      summary: `[${evaluation.kind}/${evaluation.severity}] ${evaluation.title}`,
      significance: evaluation.severity === "high" ? "anomaly" : "info",
      payload: { findingId: finding.id, detail: evaluation.detail, ...input },
    });
  }

  return evaluation;
}

async function upsertTip(
  founderId: string,
  category: "drift" | "stall" | "quality",
  pattern: string,
) {
  const existing = await db.query.tips.findFirst({
    where: and(eq(tips.founderId, founderId), eq(tips.category, category)),
    orderBy: desc(tips.updatedAt),
  });
  // Naive similarity: same category + significant word overlap → same pattern.
  if (existing && similar(existing.pattern, pattern)) {
    await db
      .update(tips)
      .set({
        occurrences: existing.occurrences + 1,
        lastSeenAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(tips.id, existing.id));
    return;
  }
  await db.insert(tips).values({ founderId, category, pattern });
}

function similar(a: string, b: string): boolean {
  const words = (s: string) =>
    new Set(s.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
  const wa = words(a);
  const wb = words(b);
  const shared = [...wa].filter((w) => wb.has(w)).length;
  return shared >= Math.min(wa.size, wb.size) * 0.5 && shared >= 2;
}

/**
 * Nightly clustering job (Watcher spec): cluster repeat raw findings into
 * durable tips, prune expired raw findings. Called from /api/jobs/nightly.
 */
export async function clusterFindingsIntoTips(founderId: string) {
  const recent = await db.query.rawFindings.findMany({
    where: eq(rawFindings.founderId, founderId),
    orderBy: desc(rawFindings.createdAt),
    limit: 100,
  });
  if (recent.length < 3) return { clusters: 0 };

  const { clusters } = await groqJson<{
    clusters: { category: "drift" | "stall" | "quality"; pattern: string; count: number }[];
  }>(GROQ_MODELS.watcher, [
    {
      role: "system",
      content: `Cluster these coding-supervision findings into recurring patterns. Only patterns that appear 2+ times. Each pattern: one plain sentence a founder can act on ("Sessions often stall when...", "Error handling is repeatedly skipped in..."). Respond JSON: {"clusters":[{"category","pattern","count"}]}`,
    },
    {
      role: "user",
      content: recent
        .map((f) => `[${f.kind}/${f.severity}] ${f.title}`)
        .join("\n"),
    },
  ]);

  for (const c of clusters ?? []) {
    if (c.count >= 2) await upsertTip(founderId, c.category, c.pattern);
  }

  // Prune expired working memory (~30 days).
  await db
    .delete(rawFindings)
    .where(
      and(
        eq(rawFindings.founderId, founderId),
        sql`${rawFindings.expiresAt} < now()`,
      ),
    );

  return { clusters: clusters?.length ?? 0 };
}
