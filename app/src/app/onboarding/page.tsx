"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Wordmark } from "@/components/app/Shell";

/* ---------------------------------------------------------------------------
   Onboarding — the baseline gate. Nothing in Neaven works without a vision
   to measure against, so this is one honest form, not a tour.
--------------------------------------------------------------------------- */

export default function OnboardingPage() {
  const router = useRouter();
  const [vision, setVision] = useState("");
  const [scope, setScope] = useState("");
  const [brand, setBrand] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vision,
          scope,
          brand,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong — try again.");
        return;
      }
      router.push("/dashboard");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-6 py-14">
      <Wordmark />
      <div className="mt-10 w-full max-w-[560px]">
        <p className="font-mono text-[11.5px] uppercase tracking-[0.16em] text-accent">
          Before anything else
        </p>
        <h1 className="font-display mt-3 text-[30px] font-semibold leading-tight tracking-[-0.02em]">
          Set the baseline.
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-secondary-foreground">
          Everything Neaven does — the arguments, drift detection, the daily
          brief — is measured against this. It isn&apos;t fixed; when you
          pivot, the baseline moves with you.
        </p>

        <div className="mt-8 space-y-6">
          <div>
            <label className="text-[13px] font-medium">
              The vision <span className="text-accent">*</span>
            </label>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              What you&apos;re building, for whom, and why it wins.
            </p>
            <textarea
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              rows={5}
              placeholder="e.g. A web-first SaaS that gives builders a co-founder-grade second opinion. v1 is a single founder's workflow — chat with pushback, session supervision, live metrics…"
              className="mt-2 w-full resize-none rounded-lg border border-border bg-raised px-3.5 py-3 text-[13.5px] leading-relaxed placeholder:text-faint-foreground focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/15"
            />
          </div>
          <div>
            <label className="text-[13px] font-medium">Scope — what v1 is not</label>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              Exclusions are what drift gets measured against.
            </p>
            <textarea
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              rows={2}
              placeholder="e.g. No mobile app. No team features in v1."
              className="mt-2 w-full resize-none rounded-lg border border-border bg-raised px-3.5 py-3 text-[13.5px] leading-relaxed placeholder:text-faint-foreground focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/15"
            />
          </div>
          <div>
            <label className="text-[13px] font-medium">Brand & tone</label>
            <textarea
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              rows={2}
              placeholder="e.g. Calm, professional, enterprise-grade. Never hype."
              className="mt-2 w-full resize-none rounded-lg border border-border bg-raised px-3.5 py-3 text-[13.5px] leading-relaxed placeholder:text-faint-foreground focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/15"
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-lg border border-danger/40 bg-danger-soft px-3.5 py-2.5 text-[12.5px] text-danger">
            {error}
          </p>
        )}

        <div className="mt-8 flex items-center justify-between">
          <p className="max-w-[280px] font-mono text-[11px] leading-relaxed text-faint-foreground">
            Refine it any time by telling your co-founder the plan changed.
          </p>
          <button
            onClick={submit}
            disabled={busy || vision.trim().length < 20}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-[14px] font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.2} />
            ) : (
              <>
                Open Neaven
                <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
