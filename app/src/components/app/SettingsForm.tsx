"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";

/* The two behavior dials — 1..5 segmented controls, saved to the founder row
   and read by the agents on their next run. */

function Dial({
  label,
  hint,
  low,
  high,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  low: string;
  high: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="border-b border-border py-6">
      <p className="text-[14px] font-medium">{label}</p>
      <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{hint}</p>
      <div className="mt-4 flex items-center gap-3">
        <span className="w-14 text-right font-mono text-[10.5px] uppercase tracking-[0.06em] text-faint-foreground">
          {low}
        </span>
        <div className="flex flex-1 gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => onChange(n)}
              aria-label={`${label}: ${n}`}
              className={`h-8 flex-1 rounded-md border font-mono text-[12px] transition-colors ${
                n === value
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-border text-faint-foreground hover:border-border-strong hover:text-secondary-foreground"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <span className="w-14 font-mono text-[10.5px] uppercase tracking-[0.06em] text-faint-foreground">
          {high}
        </span>
      </div>
    </div>
  );
}

export function SettingsForm({
  initialHarness,
  initialWatcherDepth,
}: {
  initialHarness: number;
  initialWatcherDepth: number;
}) {
  const [harness, setHarness] = useState(initialHarness);
  const [watcherDepth, setWatcherDepth] = useState(initialWatcherDepth);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const dirty = harness !== initialHarness || watcherDepth !== initialWatcherDepth;

  const save = async () => {
    setState("saving");
    const res = await fetch("/api/founder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ harness, watcherDepth }),
    });
    setState(res.ok ? "saved" : "idle");
    if (res.ok) setTimeout(() => setState("idle"), 2000);
  };

  return (
    <div className="mt-6">
      <Dial
        label="Harness — the co-founder's persistence"
        hint="How hard it pushes when you contradict your own vision. It never gatekeeps at any setting; this is tone and tenacity."
        low="gentle"
        high="relentless"
        value={harness}
        onChange={setHarness}
      />
      <Dial
        label="Watcher depth"
        hint="How thorough session and code supervision is. Low flags only the flagrant; high is meticulous."
        low="flagrant"
        high="meticulous"
        value={watcherDepth}
        onChange={setWatcherDepth}
      />
      <div className="flex items-center justify-end gap-3 pt-5">
        {state === "saved" && (
          <span className="inline-flex items-center gap-1.5 font-mono text-[11.5px] text-success">
            <Check className="h-3.5 w-3.5" strokeWidth={2.2} />
            saved
          </span>
        )}
        <button
          onClick={save}
          disabled={!dirty || state === "saving"}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-[13px] font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          {state === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.2} />}
          Save changes
        </button>
      </div>
    </div>
  );
}
