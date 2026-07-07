import { redirect } from "next/navigation";
import { getFounder } from "@/lib/founder";
import { SettingsForm } from "@/components/app/SettingsForm";

export const dynamic = "force-dynamic";

/* ---------------------------------------------------------------------------
   Settings — two dials that actually change agent behavior, plus the facts
   about what's stored. Account management lives in the Clerk menu.
--------------------------------------------------------------------------- */

export default async function SettingsPage() {
  const founder = await getFounder();
  if (!founder) redirect("/login");

  return (
    <div className="mx-auto max-w-[720px] px-8 py-9">
      <header className="animate-rise">
        <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em]">Settings</h1>
        <p className="mt-1.5 text-[13px] text-muted-foreground">
          Each agent has its own dial. These take effect on the next
          conversation or check-in.
        </p>
      </header>

      <SettingsForm
        initialHarness={founder.harness}
        initialWatcherDepth={founder.watcherDepth}
      />

      <section className="mt-10 border-t border-border pt-6">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Account & data
        </h2>
        <dl className="mt-4 space-y-3">
          <div className="flex justify-between text-[13px]">
            <dt className="text-muted-foreground">Email</dt>
            <dd>{founder.email}</dd>
          </div>
          <div className="flex justify-between text-[13px]">
            <dt className="text-muted-foreground">Timezone</dt>
            <dd>{founder.timezone}</dd>
          </div>
          <div className="flex justify-between text-[13px]">
            <dt className="text-muted-foreground">Member since</dt>
            <dd>
              {new Date(founder.createdAt).toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </dd>
          </div>
        </dl>
        <p className="mt-6 font-mono text-[11px] leading-relaxed text-faint-foreground">
          data retention: watcher raw findings are pruned after 30 days;
          conversations, patterns, and your vision history persist until you
          delete them. sign-in and account deletion are handled from the
          account menu (top right).
        </p>
      </section>
    </div>
  );
}
