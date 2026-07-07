import { desc, eq } from "drizzle-orm";
import {
  CheckCircle2,
  Circle,
  Eye,
  BarChart3,
  Workflow,
  Sparkles,
} from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { progressItems, subAgentSummaries, tips } from "@/db/schema";
import { getFounder } from "@/lib/founder";
import { getOrCreateDailyBrief, type BriefItem } from "@/lib/agents/brief";

export const dynamic = "force-dynamic";

const AGENT_ICON = {
  watcher: Eye,
  analytics: BarChart3,
  automation: Workflow,
} as const;

const KIND_LABEL: Record<BriefItem["kind"], string> = {
  task: "Today",
  next_step: "Next",
  handled: "Handled",
  news: "News",
};

export default async function DashboardPage() {
  const founder = await getFounder();
  if (!founder) redirect("/login");

  const [brief, founderTips, summaries, progress] = await Promise.all([
    getOrCreateDailyBrief(founder),
    db.query.tips.findMany({
      where: eq(tips.founderId, founder.id),
      orderBy: desc(tips.updatedAt),
      limit: 8,
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
  const firstName = founder.name?.split(" ")[0] ?? "there";

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Good morning, {firstName}.</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s where things stand today.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily brief */}
        <section className="lg:col-span-2 rounded-xl border border-border bg-white">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <Sparkles className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-medium">Today&apos;s brief</h2>
            <span className="ml-auto text-xs text-muted-foreground">
              {brief.briefDate}
            </span>
          </div>
          <ul className="divide-y divide-border">
            {briefItems.map((item, i) => (
              <li key={i} className="flex items-start gap-3 px-5 py-3.5">
                {item.done || item.kind === "handled" ? (
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-success shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 mt-0.5 text-border shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{item.title}</p>
                    <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {KIND_LABEL[item.kind] ?? item.kind}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <div className="px-5 py-3 border-t border-border">
            <Link
              href="/cofounder"
              className="text-xs text-accent hover:underline"
            >
              Talk it through with your co-founder →
            </Link>
          </div>
        </section>

        {/* Watcher patterns — reads tips only, never raw logs */}
        <section className="rounded-xl border border-border bg-white">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <Eye className="w-4 h-4 text-foreground/70" />
            <h2 className="text-sm font-medium">Patterns</h2>
          </div>
          {founderTips.length ? (
            <ul className="divide-y divide-border">
              {founderTips.map((tip) => (
                <li key={tip.id} className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${
                        tip.category === "quality"
                          ? "bg-accent-light text-accent"
                          : tip.category === "drift"
                            ? "bg-muted text-warning"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {tip.category}
                    </span>
                    {tip.occurrences > 1 && (
                      <span className="text-[10px] text-muted-foreground">
                        ×{tip.occurrences}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed">{tip.pattern}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-xs text-muted-foreground text-center">
              No recurring patterns yet. They&apos;ll appear as the Watcher
              observes your sessions and PRs.
            </p>
          )}
        </section>

        {/* Agent activity */}
        <section className="lg:col-span-2 rounded-xl border border-border bg-white">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-medium">Agent activity</h2>
          </div>
          {summaries.length ? (
            <ul className="divide-y divide-border">
              {summaries.map((s) => {
                const Icon = AGENT_ICON[s.agent];
                return (
                  <li key={s.id} className="flex items-start gap-3 px-5 py-3">
                    <Icon className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-relaxed">{s.summary}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {s.agent} · {s.significance} ·{" "}
                        {new Date(s.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-5 py-8 text-xs text-muted-foreground text-center">
              Quiet so far. Sub-agents report here when something is worth
              surfacing — not on a schedule.
            </p>
          )}
        </section>

        {/* Progress */}
        <section className="rounded-xl border border-border bg-white">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-medium">Progress</h2>
          </div>
          {progress.length ? (
            <ul className="divide-y divide-border">
              {progress.map((p) => (
                <li key={p.id} className="flex items-center gap-2.5 px-5 py-2.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      p.status === "done"
                        ? "bg-success"
                        : p.status === "in_flight"
                          ? "bg-warning"
                          : "bg-border"
                    }`}
                  />
                  <p className="text-xs truncate">{p.item}</p>
                  <span className="ml-auto text-[10px] text-muted-foreground shrink-0">
                    {p.status.replace("_", " ")}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-xs text-muted-foreground text-center">
              Progress items appear as you and your co-founder track work.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
