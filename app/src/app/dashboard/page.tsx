import { desc, eq } from "drizzle-orm";
import {
  Eye,
  BarChart3,
  Workflow,
  Check,
  MessageSquare,
  Radio,
} from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { progressItems, subAgentSummaries, tips } from "@/db/schema";
import { getFounder } from "@/lib/founder";
import { getOrCreateDailyBrief, type BriefItem } from "@/lib/agents/brief";

export const dynamic = "force-dynamic";

/* ---------------------------------------------------------------------------
   Today — the morning surface. The daily brief leads; the Watcher's living
   profile, agent reports, and progress support it. Built to still read
   clearly when months of findings have piled up: capped lists, ranked
   patterns, grouped activity.
--------------------------------------------------------------------------- */

const AGENT_ICON = { watcher: Eye, analytics: BarChart3, automation: Workflow } as const;

const KIND_STYLE: Record<BriefItem["kind"], { label: string; cls: string }> = {
  task: { label: "Today", cls: "bg-accent-soft text-accent" },
  next_step: { label: "Next", cls: "bg-surface text-secondary-foreground" },
  handled: { label: "Handled", cls: "bg-surface text-muted-foreground" },
  news: { label: "News", cls: "bg-info-soft text-info" },
};

const TIP_STYLE: Record<string, string> = {
  quality: "bg-danger-soft text-danger",
  drift: "bg-warning-soft text-warning",
  stall: "bg-info-soft text-info",
};

function SectionCard({
  title,
  meta,
  action,
  children,
}: {
  title: string;
  meta?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-raised shadow-[0_1px_2px_rgba(26,38,32,0.04)]">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div className="flex items-baseline gap-2">
          <h2 className="text-[13.5px] font-semibold tracking-[-0.01em]">{title}</h2>
          {meta && <span className="text-[11.5px] text-faint-foreground">{meta}</span>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyRow({
  icon: Icon,
  text,
  action,
}: {
  icon: typeof Eye;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <div className="rounded-full border border-border bg-surface p-2.5">
        <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.6} />
      </div>
      <p className="mt-3 max-w-[260px] text-[12.5px] leading-relaxed text-muted-foreground">
        {text}
      </p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export default async function DashboardPage() {
  const founder = await getFounder();
  if (!founder) redirect("/login");

  const [brief, founderTips, summaries, progress] = await Promise.all([
    getOrCreateDailyBrief(founder),
    db.query.tips.findMany({
      where: eq(tips.founderId, founder.id),
      orderBy: [desc(tips.occurrences), desc(tips.updatedAt)],
      limit: 6,
    }),
    db.query.subAgentSummaries.findMany({
      where: eq(subAgentSummaries.founderId, founder.id),
      orderBy: desc(subAgentSummaries.createdAt),
      limit: 8,
      columns: { payload: false },
    }),
    db.query.progressItems.findMany({
      where: eq(progressItems.founderId, founder.id),
      orderBy: desc(progressItems.updatedAt),
      limit: 8,
    }),
  ]);

  const briefItems = brief.items as BriefItem[];
  const firstName = founder.name?.split(" ")[0];
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const hour = new Date().getHours();
  const daypart = hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Evening";

  // Category distribution for the Watcher's living profile bar.
  const tipTotals = founderTips.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + t.occurrences;
    return acc;
  }, {});
  const tipSum = Object.values(tipTotals).reduce((a, b) => a + b, 0);

  return (
    <div className="mx-auto max-w-[1060px] px-8 py-9">
      {/* Header */}
      <header className="animate-rise">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {today}
        </p>
        <h1 className="mt-1 font-serif text-[27px] italic tracking-[-0.01em]">
          {daypart}{firstName ? `, ${firstName}` : ""}.
        </h1>
      </header>

      <div className="mt-7 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Daily brief — the lead */}
        <div className="lg:col-span-2">
          <SectionCard
            title="The brief"
            meta={`${briefItems.filter((i) => i.kind === "task").length} for today`}
            action={
              <Link
                href="/cofounder"
                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-accent transition-colors hover:text-accent-hover"
              >
                <MessageSquare className="h-3.5 w-3.5" strokeWidth={2} />
                Talk it through
              </Link>
            }
          >
            <ul className="divide-y divide-border/70">
              {briefItems.map((item, i) => {
                const style = KIND_STYLE[item.kind] ?? KIND_STYLE.task;
                const done = item.done || item.kind === "handled";
                return (
                  <li key={i} className="flex items-start gap-3.5 px-5 py-3.5">
                    <span
                      className={`mt-[3px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border ${
                        done
                          ? "border-accent bg-accent text-white"
                          : "border-border-strong bg-raised"
                      }`}
                    >
                      {done && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-[13.5px] font-medium ${done ? "text-muted-foreground line-through decoration-border-strong" : ""}`}
                        >
                          {item.title}
                        </p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-px text-[10px] font-semibold uppercase tracking-wide ${style.cls}`}
                        >
                          {style.label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
                        {item.detail}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </SectionCard>
        </div>

        {/* Watcher patterns — living profile, reads from tips only */}
        <SectionCard
          title="Patterns"
          meta={founderTips.length ? `${founderTips.length} recurring` : undefined}
        >
          {founderTips.length ? (
            <>
              {tipSum > 0 && (
                <div className="px-5 pt-4">
                  <div className="flex h-1.5 overflow-hidden rounded-full bg-surface">
                    {(["quality", "drift", "stall"] as const).map((cat) =>
                      tipTotals[cat] ? (
                        <div
                          key={cat}
                          style={{ width: `${(tipTotals[cat] / tipSum) * 100}%` }}
                          className={
                            cat === "quality"
                              ? "bg-danger/70"
                              : cat === "drift"
                                ? "bg-warning/70"
                                : "bg-info/70"
                          }
                        />
                      ) : null,
                    )}
                  </div>
                </div>
              )}
              <ul className="divide-y divide-border/70">
                {founderTips.map((tip) => (
                  <li key={tip.id} className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-px text-[10px] font-semibold uppercase tracking-wide ${TIP_STYLE[tip.category] ?? "bg-surface text-muted-foreground"}`}
                      >
                        {tip.category}
                      </span>
                      {tip.occurrences > 1 && (
                        <span className="font-mono text-[10.5px] text-faint-foreground">
                          ×{tip.occurrences}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed">{tip.pattern}</p>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <EmptyRow
              icon={Eye}
              text="No recurring patterns yet. The Watcher builds this profile from your coding sessions and pull requests."
              action={
                <Link
                  href="/watcher"
                  className="text-[12px] font-medium text-accent hover:text-accent-hover"
                >
                  Set up the Watcher →
                </Link>
              }
            />
          )}
        </SectionCard>

        {/* Agent activity */}
        <div className="lg:col-span-2">
          <SectionCard title="Agent reports" meta={summaries.length ? undefined : "quiet"}>
            {summaries.length ? (
              <ul className="divide-y divide-border/70">
                {summaries.map((s) => {
                  const Icon = AGENT_ICON[s.agent];
                  return (
                    <li key={s.id} className="flex items-start gap-3.5 px-5 py-3">
                      <span className="mt-0.5 rounded-lg border border-border bg-surface p-1.5">
                        <Icon className="h-3.5 w-3.5 text-secondary-foreground" strokeWidth={1.8} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] leading-relaxed">{s.summary}</p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-faint-foreground">
                          <span className="capitalize">{s.agent}</span>
                          <span>·</span>
                          <span
                            className={
                              s.significance === "anomaly"
                                ? "font-medium text-warning"
                                : s.significance === "milestone"
                                  ? "font-medium text-accent"
                                  : ""
                            }
                          >
                            {s.significance}
                          </span>
                          <span>·</span>
                          {new Date(s.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyRow
                icon={Radio}
                text="Quiet is normal. Sub-agents report here when something is worth surfacing — anomalies and milestones, not noise."
              />
            )}
          </SectionCard>
        </div>

        {/* Progress */}
        <SectionCard title="Progress">
          {progress.length ? (
            <ul className="divide-y divide-border/70">
              {progress.map((p) => (
                <li key={p.id} className="flex items-center gap-2.5 px-5 py-2.5">
                  <span
                    className={`h-[7px] w-[7px] shrink-0 rounded-full ${
                      p.status === "done"
                        ? "bg-success"
                        : p.status === "in_flight"
                          ? "bg-warning"
                          : "bg-border-strong"
                    }`}
                  />
                  <p className="min-w-0 flex-1 truncate text-[12.5px]">{p.item}</p>
                  <span className="shrink-0 text-[10.5px] uppercase tracking-wide text-faint-foreground">
                    {p.status.replace("_", " ")}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyRow
              icon={Check}
              text="Progress fills in as you and Neaven track what's done, in flight, and next."
            />
          )}
        </SectionCard>
      </div>
    </div>
  );
}
