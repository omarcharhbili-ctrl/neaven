import { and, desc, eq } from "drizzle-orm";
import { Check, Eye, BarChart3, Workflow, MessageSquare, ArrowUpRight } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import {
  founders,
  progressItems,
  subAgentSummaries,
  tips,
  visionBaselines,
} from "@/db/schema";
import { getFounder } from "@/lib/founder";
import { getOrCreateDailyBrief, type BriefItem } from "@/lib/agents/brief";

export const dynamic = "force-dynamic";

/* ---------------------------------------------------------------------------
   Today — a worklist, not a card wall. Left: the brief as numbered rows and
   the agent report feed. Right: a thin rail with the Watcher's profile and
   progress. Hairlines do the separating; nothing floats in a box unless it
   must.
--------------------------------------------------------------------------- */

const AGENT_ICON = { watcher: Eye, analytics: BarChart3, automation: Workflow } as const;

const KIND_TAG: Record<BriefItem["kind"], { label: string; cls: string }> = {
  task: { label: "today", cls: "text-accent" },
  next_step: { label: "next", cls: "text-muted-foreground" },
  handled: { label: "handled", cls: "text-success" },
  news: { label: "news", cls: "text-info" },
};

const TIP_DOT: Record<string, string> = {
  quality: "bg-danger",
  drift: "bg-warning",
  stall: "bg-info",
};

export default async function DashboardPage() {
  const founder = await getFounder();
  if (!founder) redirect("/login");

  // Onboarding is a hard gate — no baseline, no product.
  if (!founder.onboardingCompleted) {
    const baseline = await db.query.visionBaselines.findFirst({
      where: and(
        eq(visionBaselines.founderId, founder.id),
        eq(visionBaselines.isCurrent, true),
      ),
    });
    if (!baseline) redirect("/onboarding");
    // Baseline exists (set via chat) — mark the gate passed.
    await db
      .update(founders)
      .set({ onboardingCompleted: true })
      .where(eq(founders.id, founder.id));
  }

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
      limit: 10,
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
  const today = new Date();
  const dateLine = today.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const tipTotals = founderTips.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + t.occurrences;
    return acc;
  }, {});
  const tipSum = Object.values(tipTotals).reduce((a, b) => a + b, 0);

  return (
    <div className="mx-auto flex max-w-[1120px]">
      {/* Working column */}
      <div className="min-w-0 flex-1 px-8 py-9">
        <header className="animate-rise">
          <p className="font-mono text-[11.5px] uppercase tracking-[0.16em] text-muted-foreground">
            {dateLine}
          </p>
          <h1 className="font-display mt-2 text-[28px] font-semibold tracking-[-0.02em]">
            {firstName ? `${firstName}, here's today.` : "Here's today."}
          </h1>
        </header>

        {/* The brief — numbered worklist */}
        <section className="mt-8">
          <div className="flex items-baseline justify-between border-b border-border-strong pb-2.5">
            <h2 className="font-display text-[15px] font-semibold tracking-[-0.01em]">
              The brief
            </h2>
            <Link
              href="/cofounder"
              className="inline-flex items-center gap-1 text-[12px] font-medium text-accent transition-colors hover:text-accent-hover"
            >
              <MessageSquare className="h-3.5 w-3.5" strokeWidth={2} />
              Talk it through
            </Link>
          </div>
          <ol>
            {briefItems.map((item, i) => {
              const tag = KIND_TAG[item.kind] ?? KIND_TAG.task;
              const done = item.done || item.kind === "handled";
              return (
                <li
                  key={i}
                  className="flex items-start gap-4 border-b border-border py-4"
                >
                  <span className="w-6 pt-px text-right font-mono text-[12px] text-faint-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <p
                        className={`text-[14px] font-medium ${
                          done ? "text-muted-foreground line-through decoration-border-strong" : ""
                        }`}
                      >
                        {item.title}
                      </p>
                      {done && <Check className="h-3.5 w-3.5 text-success" strokeWidth={2.5} />}
                    </div>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                      {item.detail}
                    </p>
                  </div>
                  <span className={`pt-px font-mono text-[10.5px] uppercase tracking-[0.1em] ${tag.cls}`}>
                    {tag.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Agent reports feed */}
        <section className="mt-10">
          <div className="border-b border-border-strong pb-2.5">
            <h2 className="font-display text-[15px] font-semibold tracking-[-0.01em]">
              From the agents
            </h2>
          </div>
          {summaries.length ? (
            <ul>
              {summaries.map((s) => {
                const Icon = AGENT_ICON[s.agent];
                return (
                  <li key={s.id} className="flex items-start gap-4 border-b border-border py-3.5">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] leading-relaxed">{s.summary}</p>
                      <p className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.08em] text-faint-foreground">
                        {s.agent} ·{" "}
                        <span
                          className={
                            s.significance === "anomaly"
                              ? "text-warning"
                              : s.significance === "milestone"
                                ? "text-accent"
                                : ""
                          }
                        >
                          {s.significance}
                        </span>{" "}
                        · {new Date(s.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-8 font-mono text-[12px] leading-relaxed text-faint-foreground">
              — quiet. Agents report here on anomalies and milestones, not on a
              schedule.
            </p>
          )}
        </section>
      </div>

      {/* Rail */}
      <aside className="hidden w-[300px] shrink-0 border-l border-border px-6 py-9 lg:block">
        {/* Watcher profile */}
        <div>
          <div className="flex items-baseline justify-between">
            <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Patterns
            </h3>
            <Link href="/watcher" className="text-[11.5px] text-accent hover:text-accent-hover">
              Watcher <ArrowUpRight className="inline h-3 w-3" strokeWidth={2} />
            </Link>
          </div>
          {founderTips.length ? (
            <>
              {tipSum > 0 && (
                <div className="mt-3 flex h-1 overflow-hidden rounded-full bg-higher">
                  {(["quality", "drift", "stall"] as const).map((cat) =>
                    tipTotals[cat] ? (
                      <div
                        key={cat}
                        style={{ width: `${(tipTotals[cat] / tipSum) * 100}%` }}
                        className={TIP_DOT[cat]}
                      />
                    ) : null,
                  )}
                </div>
              )}
              <ul className="mt-3 space-y-3">
                {founderTips.map((tip) => (
                  <li key={tip.id} className="flex items-start gap-2.5">
                    <span className={`mt-[7px] h-[6px] w-[6px] shrink-0 rounded-full ${TIP_DOT[tip.category] ?? "bg-border-strong"}`} />
                    <p className="text-[12px] leading-relaxed text-secondary-foreground">
                      {tip.pattern}
                      {tip.occurrences > 1 && (
                        <span className="ml-1.5 font-mono text-[10px] text-faint-foreground">
                          ×{tip.occurrences}
                        </span>
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-3 font-mono text-[11.5px] leading-relaxed text-faint-foreground">
              No recurring patterns yet — built from your sessions and pull
              requests.
            </p>
          )}
        </div>

        {/* Progress */}
        <div className="mt-9 border-t border-border pt-7">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Progress
          </h3>
          {progress.length ? (
            <ul className="mt-3 space-y-2.5">
              {progress.map((p) => (
                <li key={p.id} className="flex items-center gap-2.5">
                  <span
                    className={`h-[6px] w-[6px] shrink-0 rounded-full ${
                      p.status === "done"
                        ? "bg-success"
                        : p.status === "in_flight"
                          ? "bg-accent"
                          : "bg-border-strong"
                    }`}
                  />
                  <p className="min-w-0 flex-1 truncate text-[12px] text-secondary-foreground">
                    {p.item}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 font-mono text-[11.5px] leading-relaxed text-faint-foreground">
              Fills in as you and Neaven track what&apos;s done, in flight, next.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
