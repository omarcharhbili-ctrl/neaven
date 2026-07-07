import { and, desc, eq, gte, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  revenueDaily,
  subAgentSummaries,
  trafficBreakdown,
  trafficDaily,
} from "@/db/schema";
import { getFounder } from "@/lib/founder";
import { AnalyticsClient, type DayPoint, type BreakdownRow } from "./AnalyticsClient";

export const dynamic = "force-dynamic";

/* ---------------------------------------------------------------------------
   Analytics — web traffic and revenue, read the way Plausible reads them:
   one restrained time series driven by clickable metric cards, dimensional
   breakdowns as proportional rows, no chart-junk. The Analytics sub-agent
   watches the same tables and its verdicts surface here.
--------------------------------------------------------------------------- */

const RANGES = { "7d": 7, "30d": 30, "90d": 90 } as const;
type RangeKey = keyof typeof RANGES;

function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const founder = await getFounder();
  if (!founder) redirect("/login");

  const { range: rangeParam } = await searchParams;
  const range: RangeKey = (rangeParam as RangeKey) in RANGES ? (rangeParam as RangeKey) : "30d";
  const days = RANGES[range];
  const since = daysAgoISO(days - 1);
  const prevSince = daysAgoISO(days * 2 - 1);

  const [traffic, revenue, breakdownsRaw, agentNotes] = await Promise.all([
    db.query.trafficDaily.findMany({
      where: and(eq(trafficDaily.founderId, founder.id), gte(trafficDaily.day, prevSince)),
      orderBy: trafficDaily.day,
    }),
    db.query.revenueDaily.findMany({
      where: and(eq(revenueDaily.founderId, founder.id), gte(revenueDaily.day, prevSince)),
      orderBy: revenueDaily.day,
    }),
    db
      .select({
        kind: trafficBreakdown.kind,
        key: trafficBreakdown.key,
        visitors: sql<number>`sum(${trafficBreakdown.visitors})::int`,
      })
      .from(trafficBreakdown)
      .where(and(eq(trafficBreakdown.founderId, founder.id), gte(trafficBreakdown.day, since)))
      .groupBy(trafficBreakdown.kind, trafficBreakdown.key)
      .orderBy(desc(sql`sum(${trafficBreakdown.visitors})`)),
    db.query.subAgentSummaries.findMany({
      where: and(
        eq(subAgentSummaries.founderId, founder.id),
        eq(subAgentSummaries.agent, "analytics"),
      ),
      orderBy: desc(subAgentSummaries.createdAt),
      limit: 3,
      columns: { payload: false },
    }),
  ]);

  const currentTraffic = traffic.filter((t) => t.day >= since);
  const previousTraffic = traffic.filter((t) => t.day < since);
  const currentRevenue = revenue.filter((r) => r.day >= since);
  const previousRevenue = revenue.filter((r) => r.day < since);

  // Align current + previous period by index for the comparison series.
  const series: DayPoint[] = currentTraffic.map((t, i) => {
    const rev = currentRevenue.find((r) => r.day === t.day);
    const prev = previousTraffic[i];
    const prevRev = previousRevenue[i];
    return {
      day: t.day,
      visitors: t.visitors,
      pageviews: t.pageviews,
      session: t.avgSessionSecs,
      bounce: t.bounceRate,
      mrr: rev ? Math.round(rev.mrrCents / 100) : 0,
      prevVisitors: prev?.visitors ?? null,
      prevPageviews: prev?.pageviews ?? null,
      prevSession: prev?.avgSessionSecs ?? null,
      prevBounce: prev?.bounceRate ?? null,
      prevMrr: prevRev ? Math.round(prevRev.mrrCents / 100) : null,
    };
  });

  const sum = (rows: number[]) => rows.reduce((a, b) => a + b, 0);
  const avg = (rows: number[]) => (rows.length ? sum(rows) / rows.length : 0);

  const totals = {
    visitors: sum(currentTraffic.map((t) => t.visitors)),
    prevVisitors: sum(previousTraffic.map((t) => t.visitors)),
    pageviews: sum(currentTraffic.map((t) => t.pageviews)),
    prevPageviews: sum(previousTraffic.map((t) => t.pageviews)),
    session: avg(currentTraffic.map((t) => t.avgSessionSecs)),
    prevSession: avg(previousTraffic.map((t) => t.avgSessionSecs)),
    bounce: avg(currentTraffic.map((t) => t.bounceRate)),
    prevBounce: avg(previousTraffic.map((t) => t.bounceRate)),
    mrr: currentRevenue.length ? Math.round(currentRevenue[currentRevenue.length - 1].mrrCents / 100) : 0,
    prevMrr: previousRevenue.length ? Math.round(previousRevenue[previousRevenue.length - 1].mrrCents / 100) : 0,
    newMrr: Math.round(sum(currentRevenue.map((r) => r.newMrrCents)) / 100),
    churnedMrr: Math.round(sum(currentRevenue.map((r) => r.churnedMrrCents)) / 100),
    customers: currentRevenue.length ? currentRevenue[currentRevenue.length - 1].customers : 0,
    prevCustomers: previousRevenue.length ? previousRevenue[previousRevenue.length - 1].customers : 0,
  };

  const breakdowns: Record<string, BreakdownRow[]> = {};
  for (const row of breakdownsRaw) {
    (breakdowns[row.kind] ??= []).push({ key: row.key, visitors: row.visitors });
  }

  // "Active now" — derived from today's seeded traffic (demo-realistic, not a
  // live websocket): today's visitors spread over the day with a deterministic wobble.
  const today = currentTraffic[currentTraffic.length - 1];
  const activeNow = today
    ? Math.max(1, Math.round((today.visitors / 24 / 60) * 42 + (today.visitors % 7)))
    : 0;

  return (
    <AnalyticsClient
      range={range}
      series={series}
      totals={totals}
      breakdowns={breakdowns}
      agentNotes={agentNotes.map((n) => ({
        id: n.id,
        summary: n.summary,
        significance: n.significance,
        createdAt: n.createdAt.toISOString(),
      }))}
      activeNow={activeNow}
    />
  );
}
