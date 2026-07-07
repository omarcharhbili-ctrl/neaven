import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { rawFindings, tips } from "@/db/schema";
import { getFounder } from "@/lib/founder";
import { WatcherKeys } from "@/components/app/WatcherKeys";

export const dynamic = "force-dynamic";

/* ---------------------------------------------------------------------------
   Watcher — connect a session, read the living profile, see what's in
   working memory and exactly when it ages out. Retention is a feature here,
   not fine print.
--------------------------------------------------------------------------- */

const KIND_STYLE: Record<string, string> = {
  quality: "text-danger",
  drift: "text-warning",
  stall: "text-info",
};

export default async function WatcherPage() {
  const founder = await getFounder();
  if (!founder) redirect("/login");

  const [founderTips, findings] = await Promise.all([
    db.query.tips.findMany({
      where: eq(tips.founderId, founder.id),
      orderBy: [desc(tips.occurrences), desc(tips.updatedAt)],
      limit: 10,
    }),
    db.query.rawFindings.findMany({
      where: eq(rawFindings.founderId, founder.id),
      orderBy: desc(rawFindings.createdAt),
      limit: 12,
    }),
  ]);

  return (
    <div className="mx-auto max-w-[860px] px-8 py-9">
      <header className="animate-rise">
        <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em]">Watcher</h1>
        <p className="mt-1.5 max-w-[560px] text-[13px] leading-relaxed text-muted-foreground">
          Observes your coding sessions and pull requests against the vision
          baseline. It never converses — high-severity findings interrupt with
          one line; everything else waits for your next conversation.
        </p>
      </header>

      {/* Connect */}
      <section className="mt-9">
        <div className="border-b border-border-strong pb-2.5">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Connect a session
          </h2>
        </div>
        <div className="py-5">
          <p className="mb-4 text-[13px] leading-relaxed text-secondary-foreground">
            Claude Code or Cursor checks in with a session key while you work.
            Prefer no standing connection? Paste a one-shot context prompt
            instead — a first-class option, not a degraded one.
          </p>
          <WatcherKeys />
        </div>
      </section>

      {/* Living profile */}
      <section className="mt-8">
        <div className="flex items-baseline justify-between border-b border-border-strong pb-2.5">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Living profile
          </h2>
          <span className="font-mono text-[10.5px] text-faint-foreground">
            patterns, not a log
          </span>
        </div>
        {founderTips.length ? (
          <ul>
            {founderTips.map((tip) => (
              <li key={tip.id} className="flex items-start gap-4 border-b border-border py-3.5">
                <span className={`w-[52px] shrink-0 pt-px font-mono text-[10.5px] uppercase tracking-[0.08em] ${KIND_STYLE[tip.category] ?? "text-muted-foreground"}`}>
                  {tip.category}
                </span>
                <p className="min-w-0 flex-1 text-[13px] leading-relaxed">{tip.pattern}</p>
                {tip.occurrences > 1 && (
                  <span className="shrink-0 font-mono text-[11px] text-faint-foreground">
                    ×{tip.occurrences}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-8 font-mono text-[12px] leading-relaxed text-faint-foreground">
            — empty. Patterns cluster out of repeat findings; they appear after
            your first supervised sessions.
          </p>
        )}
      </section>

      {/* Working memory */}
      <section className="mt-8">
        <div className="flex items-baseline justify-between border-b border-border-strong pb-2.5">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Working memory
          </h2>
          <span className="font-mono text-[10.5px] text-faint-foreground">
            raw findings · pruned after 30 days
          </span>
        </div>
        {findings.length ? (
          <ul>
            {findings.map((f) => (
              <li key={f.id} className="flex items-start gap-4 border-b border-border py-3">
                <span className={`w-[52px] shrink-0 pt-px font-mono text-[10.5px] uppercase tracking-[0.08em] ${KIND_STYLE[f.kind] ?? "text-muted-foreground"}`}>
                  {f.kind}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] leading-relaxed">{f.title}</p>
                  <p className="mt-0.5 font-mono text-[10.5px] text-faint-foreground">
                    {f.source}
                    {f.repo ? ` · ${f.repo}` : ""} · expires{" "}
                    {new Date(f.expiresAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </p>
                </div>
                {f.interrupted && (
                  <span className="shrink-0 pt-px font-mono text-[10px] uppercase tracking-[0.08em] text-accent">
                    interrupted
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-8 font-mono text-[12px] leading-relaxed text-faint-foreground">
            — nothing in working memory. Findings land here from live sessions
            and PR scans, then age out on schedule.
          </p>
        )}
      </section>

      <p className="mt-8 border-t border-border pt-5 font-mono text-[11px] leading-relaxed text-faint-foreground">
        retention: raw findings live 30 days, then they&apos;re gone — only the
        patterns they built remain. what&apos;s stored is exactly what you see
        on this page.
      </p>
    </div>
  );
}
