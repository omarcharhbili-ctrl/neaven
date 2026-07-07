import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { subAgentSummaries, visionBaselines } from "@/db/schema";
import { GROQ_MODELS, groqChat, groqJson } from "@/lib/llm/groq";

/**
 * Analytics sub-agent — revenue and web analytics interpretation on
 * Qwen3.6 27B. Event-driven reporting: only clear anomalies or milestones
 * push a summary to the main agent (0 → 10,000 overnight, not everyday
 * movement).
 */

export interface MetricsSnapshot {
  /** e.g. { visitors: 812, signups: 14, mrr: 240 } for a period */
  current: Record<string, number>;
  previous: Record<string, number>;
  periodLabel: string; // "yesterday", "last 7 days", ...
}

export async function evaluateMetrics(
  founderId: string,
  snapshot: MetricsSnapshot,
): Promise<{ pushed: boolean; summary?: string }> {
  // Good analysis interprets movement against the founder's actual context
  // (spec: "not just detecting that a number moved").
  const vision = await db.query.visionBaselines.findFirst({
    where: and(
      eq(visionBaselines.founderId, founderId),
      eq(visionBaselines.isCurrent, true),
    ),
    orderBy: desc(visionBaselines.version),
  });

  const verdict = await groqJson<{
    significant: boolean;
    significance: "anomaly" | "milestone";
    summary: string;
  }>(GROQ_MODELS.analytics, [
    {
      role: "system",
      content: `You are Neaven's analytics agent. Decide if this metrics movement is worth surfacing to the founder's main agent. Only clear anomalies (spike/crash) or real milestones count — routine fluctuation does not. Interpret WHY the movement might matter given the founder's context, not just that a number moved.${vision ? `\n\nFounder's current vision: ${vision.vision}` : ""}\n\nRespond JSON: {"significant": bool, "significance": "anomaly"|"milestone", "summary": "one factual sentence including why it matters"}`,
    },
    {
      role: "user",
      content: `Period: ${snapshot.periodLabel}\nCurrent: ${JSON.stringify(snapshot.current)}\nPrevious: ${JSON.stringify(snapshot.previous)}`,
    },
  ]);

  if (!verdict.significant) return { pushed: false };

  await db.insert(subAgentSummaries).values({
    founderId,
    agent: "analytics",
    summary: verdict.summary,
    significance: verdict.significance,
    payload: snapshot as unknown as Record<string, unknown>,
  });
  return { pushed: true, summary: verdict.summary };
}

/** Founder-facing Q&A over their metrics (used by the analytics tab). */
export async function askAnalytics(
  question: string,
  metricsContext: string,
): Promise<string> {
  return groqChat(GROQ_MODELS.analytics, [
    {
      role: "system",
      content:
        "You are Neaven's analytics agent. Answer questions about the founder's web/revenue metrics factually and concisely, from the data provided. If the data can't answer the question, say exactly what's missing. No speculation dressed as fact.",
    },
    {
      role: "user",
      content: `Metrics data:\n${metricsContext}\n\nQuestion: ${question}`,
    },
  ]);
}
