"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, Sparkles } from "lucide-react";

/* ---------------------------------------------------------------------------
   Analytics client — one chart, driven by the metric cards above it.
   Chart color is the validated data hue (#0e8a6a), previous period is a
   lighter step of the same hue; everything textual wears text tokens.
--------------------------------------------------------------------------- */

export type DayPoint = {
  day: string;
  visitors: number;
  pageviews: number;
  session: number;
  bounce: number;
  mrr: number;
  prevVisitors: number | null;
  prevPageviews: number | null;
  prevSession: number | null;
  prevBounce: number | null;
  prevMrr: number | null;
};

export type BreakdownRow = { key: string; visitors: number };

type Totals = {
  visitors: number; prevVisitors: number;
  pageviews: number; prevPageviews: number;
  session: number; prevSession: number;
  bounce: number; prevBounce: number;
  mrr: number; prevMrr: number;
  newMrr: number; churnedMrr: number;
  customers: number; prevCustomers: number;
};

const CHART = "#0e8a6a";
const CHART_COMPARE = "#b7d9cb";

const METRICS = [
  { id: "visitors", label: "Unique visitors", format: "compact", upIsGood: true },
  { id: "pageviews", label: "Pageviews", format: "compact", upIsGood: true },
  { id: "session", label: "Avg session", format: "duration", upIsGood: true },
  { id: "bounce", label: "Bounce rate", format: "percent", upIsGood: false },
  { id: "mrr", label: "MRR", format: "money", upIsGood: true },
] as const;

type MetricId = (typeof METRICS)[number]["id"];

function fmt(value: number, format: string): string {
  switch (format) {
    case "compact":
      return value >= 10000
        ? `${(value / 1000).toFixed(1)}K`
        : value.toLocaleString();
    case "duration": {
      const m = Math.floor(value / 60);
      const s = Math.round(value % 60);
      return `${m}m ${s.toString().padStart(2, "0")}s`;
    }
    case "percent":
      return `${Math.round(value)}%`;
    case "money":
      return `$${value.toLocaleString()}`;
    default:
      return String(value);
  }
}

function Delta({
  now,
  prev,
  upIsGood,
  format,
}: {
  now: number;
  prev: number;
  upIsGood: boolean;
  format: string;
}) {
  if (!prev) return null;
  const pct = ((now - prev) / prev) * 100;
  if (!isFinite(pct)) return null;
  const up = pct >= 0;
  const good = up === upIsGood;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11.5px] font-medium ${
        good ? "text-success" : "text-danger"
      }`}
      title={`vs previous period: ${fmt(prev, format)}`}
    >
      <Icon className="h-3 w-3" strokeWidth={2.2} />
      {Math.abs(pct).toFixed(pct >= 10 ? 0 : 1)}%
    </span>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  format,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number }[];
  label?: string;
  format: string;
}) {
  if (!active || !payload?.length) return null;
  const current = payload.find((p) => p.dataKey === "current");
  const prev = payload.find((p) => p.dataKey === "previous");
  return (
    <div className="rounded-lg border border-border bg-raised px-3 py-2 shadow-[0_2px_8px_rgba(26,38,32,0.08)]">
      <p className="text-[11px] text-muted-foreground">
        {new Date(label ?? "").toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
        })}
      </p>
      {current && (
        <p className="mt-1 flex items-center gap-2 text-[13px]">
          <span className="inline-block h-[2px] w-3.5 rounded" style={{ background: CHART }} />
          <span className="font-semibold tabular-nums">{fmt(current.value, format)}</span>
          <span className="text-[11px] text-muted-foreground">this period</span>
        </p>
      )}
      {prev != null && prev.value != null && (
        <p className="mt-0.5 flex items-center gap-2 text-[13px]">
          <span className="inline-block h-[2px] w-3.5 rounded" style={{ background: CHART_COMPARE }} />
          <span className="font-semibold tabular-nums text-secondary-foreground">
            {fmt(prev.value, format)}
          </span>
          <span className="text-[11px] text-muted-foreground">previous</span>
        </p>
      )}
    </div>
  );
}

function BreakdownCard({ title, rows }: { title: string; rows: BreakdownRow[] }) {
  const top = rows.slice(0, 7);
  const max = top[0]?.visitors ?? 1;
  const total = rows.reduce((a, r) => a + r.visitors, 0);
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-raised shadow-[0_1px_2px_rgba(26,38,32,0.04)]">
      <div className="flex items-baseline justify-between border-b border-border px-5 py-3">
        <h2 className="text-[13px] font-semibold tracking-[-0.01em]">{title}</h2>
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-faint-foreground">
          Visitors
        </span>
      </div>
      <div className="space-y-px p-2">
        {top.map((r) => (
          <div
            key={r.key}
            className="group relative flex items-center justify-between rounded-md px-3 py-[7px] transition-colors hover:bg-surface"
            title={`${r.key}: ${r.visitors.toLocaleString()} visitors (${Math.round((r.visitors / total) * 100)}%)`}
          >
            <div
              className="absolute inset-y-1 left-0 rounded-md"
              style={{
                width: `${(r.visitors / max) * 100}%`,
                background: CHART,
                opacity: 0.1,
              }}
            />
            <span className="relative min-w-0 truncate text-[13px]">{r.key}</span>
            <span className="relative flex items-baseline gap-2">
              <span className="text-[13px] font-medium tabular-nums">
                {r.visitors.toLocaleString()}
              </span>
              <span className="w-8 text-right text-[11px] tabular-nums text-faint-foreground">
                {Math.round((r.visitors / total) * 100)}%
              </span>
            </span>
          </div>
        ))}
        {!top.length && (
          <p className="px-3 py-6 text-center text-[12px] text-faint-foreground">
            No data in this period.
          </p>
        )}
      </div>
    </section>
  );
}

export function AnalyticsClient({
  range,
  series,
  totals,
  breakdowns,
  agentNotes,
  activeNow,
}: {
  range: "7d" | "30d" | "90d";
  series: DayPoint[];
  totals: Totals;
  breakdowns: Record<string, BreakdownRow[]>;
  agentNotes: { id: string; summary: string; significance: string; createdAt: string }[];
  activeNow: number;
}) {
  const [metric, setMetric] = useState<MetricId>("visitors");
  const meta = METRICS.find((m) => m.id === metric)!;

  const chartData = useMemo(
    () =>
      series.map((p) => ({
        day: p.day,
        current: p[metric],
        previous: p[
          `prev${metric[0].toUpperCase()}${metric.slice(1)}` as keyof DayPoint
        ] as number | null,
      })),
    [series, metric],
  );

  const xTicks = useMemo(() => {
    const step = Math.max(1, Math.floor(series.length / 5));
    return series.filter((_, i) => i % step === 0).map((p) => p.day);
  }, [series]);

  const totalsFor: Record<MetricId, [number, number]> = {
    visitors: [totals.visitors, totals.prevVisitors],
    pageviews: [totals.pageviews, totals.prevPageviews],
    session: [totals.session, totals.prevSession],
    bounce: [totals.bounce, totals.prevBounce],
    mrr: [totals.mrr, totals.prevMrr],
  };

  return (
    <div className="mx-auto max-w-[1060px] px-8 py-9">
      {/* Header + filter row */}
      <header className="animate-rise flex items-end justify-between">
        <div>
          <h1 className="text-[21px] font-semibold tracking-[-0.015em]">Analytics</h1>
          <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            {activeNow} active now
          </p>
        </div>
        <nav className="flex items-center gap-1 rounded-lg border border-border bg-raised p-1">
          {(["7d", "30d", "90d"] as const).map((r) => (
            <Link
              key={r}
              href={`/analytics?range=${r}`}
              className={`rounded-md px-3 py-1 text-[12.5px] font-medium transition-colors ${
                range === r
                  ? "bg-accent-soft text-accent"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r === "7d" ? "7 days" : r === "30d" ? "30 days" : "90 days"}
            </Link>
          ))}
        </nav>
      </header>

      {/* Metric cards — they drive the chart */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {METRICS.map((m) => {
          const [now, prev] = totalsFor[m.id];
          const selected = metric === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMetric(m.id)}
              className={`rounded-xl border p-4 text-left transition-all duration-150 ${
                selected
                  ? "border-accent/50 bg-raised shadow-[0_1px_3px_rgba(26,38,32,0.06)]"
                  : "border-border bg-raised hover:border-border-strong"
              }`}
            >
              <p className="text-[11.5px] text-muted-foreground">{m.label}</p>
              <p className="mt-1 text-[20px] font-semibold tracking-[-0.01em]">
                {fmt(now, m.format)}
              </p>
              <div className="mt-0.5 h-4">
                <Delta now={now} prev={prev} upIsGood={m.upIsGood} format={m.format} />
              </div>
              <div
                className={`mt-2 h-[3px] rounded-full transition-colors ${selected ? "" : "bg-transparent"}`}
                style={selected ? { background: CHART } : undefined}
              />
            </button>
          );
        })}
      </div>

      {/* The chart */}
      <section className="mt-4 rounded-xl border border-border bg-raised p-5 shadow-[0_1px_2px_rgba(26,38,32,0.04)]">
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-semibold tracking-[-0.01em]">{meta.label}</h2>
          <div className="flex items-center gap-4 text-[11.5px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-[2px] w-4 rounded" style={{ background: CHART }} />
              This period
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-[2px] w-4 rounded" style={{ background: CHART_COMPARE }} />
              Previous period
            </span>
          </div>
        </div>
        <div className="mt-4 h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeWidth={1} />
              <XAxis
                dataKey="day"
                ticks={xTicks}
                tickFormatter={(d: string) =>
                  new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                }
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
                dy={6}
              />
              <YAxis
                width={44}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                tickFormatter={(v: number) => fmt(v, meta.format === "money" ? "money" : "compact")}
                axisLine={false}
                tickLine={false}
                tickCount={5}
              />
              <Tooltip
                content={<ChartTooltip format={meta.format} />}
                cursor={{ stroke: "var(--border-strong)", strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="previous"
                stroke={CHART_COMPARE}
                strokeWidth={2}
                fill="none"
                dot={false}
                activeDot={{ r: 4, fill: CHART_COMPARE, stroke: "var(--raised)", strokeWidth: 2 }}
                connectNulls
              />
              <Area
                type="monotone"
                dataKey="current"
                stroke={CHART}
                strokeWidth={2}
                fill={CHART}
                fillOpacity={0.1}
                dot={false}
                activeDot={{ r: 4, fill: CHART, stroke: "var(--raised)", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Revenue strip */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { label: "New MRR this period", value: `+$${totals.newMrr.toLocaleString()}` },
          { label: "Churned this period", value: `−$${totals.churnedMrr.toLocaleString()}` },
          {
            label: "Paying customers",
            value: totals.customers.toLocaleString(),
            delta: totals.customers - totals.prevCustomers,
          },
        ].map((tile) => (
          <div key={tile.label} className="rounded-xl border border-border bg-raised p-4">
            <p className="text-[11.5px] text-muted-foreground">{tile.label}</p>
            <p className="mt-1 flex items-baseline gap-2 text-[18px] font-semibold tracking-[-0.01em]">
              {tile.value}
              {"delta" in tile && tile.delta !== undefined && tile.delta !== 0 && (
                <span className={`text-[11.5px] font-medium ${tile.delta > 0 ? "text-success" : "text-danger"}`}>
                  {tile.delta > 0 ? "+" : ""}
                  {tile.delta}
                </span>
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Agent verdicts */}
      {agentNotes.length > 0 && (
        <section className="mt-4 rounded-xl border border-border bg-raised px-5 py-4 shadow-[0_1px_2px_rgba(26,38,32,0.04)]">
          <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-accent" strokeWidth={2} />
            Analytics agent
          </p>
          <ul className="mt-2 space-y-2">
            {agentNotes.map((n) => (
              <li key={n.id} className="flex items-start gap-2.5">
                <span
                  className={`mt-[5px] h-[7px] w-[7px] shrink-0 rounded-full ${
                    n.significance === "anomaly" ? "bg-warning" : "bg-accent"
                  }`}
                />
                <p className="agent-voice">
                  {n.summary}
                  <span className="ml-2 not-italic font-sans text-[11px] text-faint-foreground">
                    {new Date(n.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Breakdowns */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <BreakdownCard title="Top sources" rows={breakdowns.source ?? []} />
        <BreakdownCard title="Top pages" rows={breakdowns.page ?? []} />
        <BreakdownCard title="Countries" rows={breakdowns.country ?? []} />
        <BreakdownCard title="Devices" rows={breakdowns.device ?? []} />
      </div>
    </div>
  );
}
