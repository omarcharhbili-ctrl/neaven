import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  revenueDaily,
  subAgentSummaries,
  trafficDaily,
  visionBaselines,
} from "@/db/schema";
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

/**
 * Scan one day of traffic/revenue against the trailing week and let the agent
 * decide if it's worth surfacing. Runs nightly for yesterday; can be pointed
 * at any past day to backfill (e.g. a launch spike).
 */
export async function scanTraffic(
  founderId: string,
  day?: string,
): Promise<{ pushed: boolean; summary?: string }> {
  const target =
    day ??
    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const weekAgo = new Date(new Date(target).getTime() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [dayRow] = await db
    .select()
    .from(trafficDaily)
    .where(and(eq(trafficDaily.founderId, founderId), eq(trafficDaily.day, target)));
  if (!dayRow) return { pushed: false };

  const [trailing] = await db
    .select({
      visitors: sql<number>`round(avg(${trafficDaily.visitors}))`,
      pageviews: sql<number>`round(avg(${trafficDaily.pageviews}))`,
    })
    .from(trafficDaily)
    .where(
      and(
        eq(trafficDaily.founderId, founderId),
        gte(trafficDaily.day, weekAgo),
        lt(trafficDaily.day, target),
      ),
    );

  const [rev] = await db
    .select()
    .from(revenueDaily)
    .where(and(eq(revenueDaily.founderId, founderId), eq(revenueDaily.day, target)));

  return evaluateMetrics(founderId, {
    periodLabel: `${target} vs trailing 7-day average`,
    current: {
      visitors: dayRow.visitors,
      pageviews: dayRow.pageviews,
      mrr_dollars: rev ? Math.round(rev.mrrCents / 100) : 0,
    },
    previous: {
      visitors: Number(trailing?.visitors ?? 0),
      pageviews: Number(trailing?.pageviews ?? 0),
      mrr_dollars: rev ? Math.round((rev.mrrCents - rev.newMrrCents + rev.churnedMrrCents) / 100) : 0,
    },
  });
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
