import Link from "next/link";
import { ArrowRight, Eye, BarChart3, Workflow } from "lucide-react";
import { Wordmark } from "@/components/app/Shell";

/* ---------------------------------------------------------------------------
   Landing — one claim, one proof. The claim: a co-founder that argues back.
   The proof: an actual exchange, on the page, before any feature list.
--------------------------------------------------------------------------- */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="mx-auto flex h-16 max-w-[1080px] items-center justify-between px-6">
        <Wordmark />
        <nav className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-lg px-3.5 py-2 text-[13.5px] text-secondary-foreground transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-accent px-4 py-2 text-[13.5px] font-medium text-on-accent transition-colors hover:bg-accent-hover"
          >
            Get started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-[1080px] px-6 pb-20 pt-20">
        <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-accent">
          The AI co-founder for SaaS builders
        </p>
        <h1 className="font-display mt-5 max-w-[700px] text-[52px] font-semibold leading-[1.04] tracking-[-0.03em]">
          A co-founder
          <br />
          that argues back.
        </h1>
        <p className="mt-6 max-w-[520px] text-[16px] leading-relaxed text-secondary-foreground">
          Neaven holds full context on your vision, progress, code, and revenue
          — and pushes back when a decision contradicts your own goals. Not an
          assistant that executes whatever it&apos;s told.
        </p>
        <div className="mt-9 flex items-center gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-[14px] font-medium text-on-accent transition-colors hover:bg-accent-hover"
          >
            Start building
            <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-border-strong px-5 py-2.5 text-[14px] text-secondary-foreground transition-colors hover:border-accent/50 hover:text-foreground"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* The proof — an argument, verbatim */}
      <section className="border-y border-border bg-raised">
        <div className="mx-auto grid max-w-[1080px] gap-10 px-6 py-16 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
              The argument mechanic
            </p>
            <h2 className="font-display mt-3 text-[28px] font-semibold leading-tight tracking-[-0.02em]">
              It knows your vision.
              <br />
              It holds you to it.
            </h2>
            <p className="mt-4 text-[14px] leading-relaxed text-secondary-foreground">
              Every conversation is measured against your vision baseline. When
              you drift, Neaven says so — with reasons anchored in your own
              context. You always have the final say; it never gatekeeps.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background p-6">
            <div className="flex justify-end">
              <p className="max-w-[85%] rounded-xl bg-higher px-4 py-2.5 text-[13px] leading-relaxed text-secondary-foreground">
                A friend asked for team workspaces. Thinking of spending next
                month building them.
              </p>
            </div>
            <div className="mt-5">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-accent">
                neaven
              </p>
              <p className="agent-voice mt-2 border-l-2 border-accent/40 pl-3">
                v1 scope excludes team features — the founder wrote that
                exclusion themselves. One request isn&apos;t demand signal.
              </p>
              <p className="mt-3 text-[13.5px] leading-relaxed">
                No — I wouldn&apos;t. That directly contradicts the v1 scope
                you set, and one friend asking isn&apos;t demand. What&apos;s
                actually driving this — boredom with v1, or a real segment
                you&apos;re not telling me about?
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Three systems */}
      <section className="mx-auto max-w-[1080px] px-6 py-16">
        <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
          {[
            {
              n: "01",
              icon: Eye,
              title: "The Watcher",
              body: "Sits over your coding sessions and pull requests. Flags drift from the vision, stalls, and quality issues — quietly, only when it matters.",
            },
            {
              n: "02",
              icon: BarChart3,
              title: "Analytics that speak up",
              body: "Revenue and traffic, watched continuously. Real anomalies and milestones get surfaced; routine wobble stays quiet.",
            },
            {
              n: "03",
              icon: Workflow,
              title: "Automations",
              body: "Describe the trigger and the outcome — the automation agent builds it. Destructive actions stay locked until you approve them.",
            },
          ].map((f) => (
            <div key={f.n} className="bg-background p-7">
              <div className="flex items-center justify-between">
                <f.icon className="h-[18px] w-[18px] text-accent" strokeWidth={1.8} />
                <span className="font-mono text-[11px] text-faint-foreground">{f.n}</span>
              </div>
              <h3 className="font-display mt-4 text-[16px] font-semibold tracking-[-0.01em]">
                {f.title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-border">
        <div className="mx-auto flex max-w-[1080px] flex-col items-start justify-between gap-6 px-6 py-14 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-[24px] font-semibold tracking-[-0.02em]">
              Build with someone who disagrees.
            </h2>
            <p className="mt-1.5 text-[13.5px] text-muted-foreground">
              Full context. Real pushback. Your final say.
            </p>
          </div>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-[14px] font-medium text-on-accent transition-colors hover:bg-accent-hover"
          >
            Get started
            <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
          </Link>
        </div>
        <div className="border-t border-border">
          <div className="mx-auto flex max-w-[1080px] items-center justify-between px-6 py-5 text-[12px] text-faint-foreground">
            <Wordmark className="opacity-60" />
            <span>© 2026 Neaven</span>
          </div>
        </div>
      </section>
    </div>
  );
}
