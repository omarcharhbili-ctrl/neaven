"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Check, KeyRound, Loader2, Plus } from "lucide-react";

/* Issue and list Watcher API keys (the "Setup MCP" flow). The raw key is
   shown exactly once — only its hash is stored. */

type KeyRow = { id: string; label: string; lastUsedAt: string | null; createdAt: string };

export function WatcherKeys() {
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [freshKey, setFreshKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/watcher/keys");
    if (res.ok) setKeys(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createKey = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/watcher/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: `session-${new Date().toISOString().slice(0, 10)}` }),
      });
      if (res.ok) {
        const data = await res.json();
        setFreshKey(data.key);
        load();
      }
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!freshKey) return;
    await navigator.clipboard.writeText(freshKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div>
      {freshKey ? (
        <div className="animate-rise rounded-lg border border-accent/40 bg-accent-faint p-4">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-accent">
            your key — shown once, store it now
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded bg-background px-3 py-2 font-mono text-[12px]">
              {freshKey}
            </code>
            <button
              onClick={copy}
              className="rounded-lg border border-border-strong p-2 text-secondary-foreground transition-colors hover:border-accent/50 hover:text-foreground"
              aria-label="Copy key"
            >
              {copied ? (
                <Check className="h-4 w-4 text-success" strokeWidth={2.2} />
              ) : (
                <Copy className="h-4 w-4" strokeWidth={1.8} />
              )}
            </button>
          </div>
          <p className="mt-2.5 font-mono text-[11px] leading-relaxed text-muted-foreground">
            POST /api/watcher/checkin · Authorization: Bearer &lt;key&gt; ·
            body {"{ summary, repo }"}
          </p>
        </div>
      ) : (
        <button
          onClick={createKey}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg border border-border-strong px-4 py-2.5 text-[13px] text-secondary-foreground transition-colors hover:border-accent/50 hover:text-foreground disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
          ) : (
            <Plus className="h-4 w-4" strokeWidth={2} />
          )}
          Generate a session key
        </button>
      )}

      {keys.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {keys.map((k) => (
            <li key={k.id} className="flex items-center gap-2.5 font-mono text-[11.5px] text-muted-foreground">
              <KeyRound className="h-3 w-3 text-faint-foreground" strokeWidth={2} />
              {k.label}
              <span className="text-faint-foreground">
                · {k.lastUsedAt ? `last used ${new Date(k.lastUsedAt).toLocaleDateString()}` : "never used"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
