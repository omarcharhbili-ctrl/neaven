"use client";

import { Button } from "@/components/Button";
import {
  Bot,
  ExternalLink,
  Loader2,
  Plug,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

/**
 * Automations — the embedded workflow builder.
 *
 * The builder is Neaven's self-hosted automation engine (rebranded
 * Activepieces MIT core). The founder never sees the engine's own auth:
 * /api/automation/bridge silently provisions + signs in a per-founder
 * account and returns a short-lived session token. The token travels to
 * the engine in the URL fragment (never sent to any server) via
 * /embed-bridge.html, which writes the session and hands off to the
 * builder — all inside the iframe below.
 */

type BridgeState =
  | { phase: "loading" }
  | { phase: "unconfigured" }
  | { phase: "error"; message: string }
  | { phase: "ready"; embedUrl: string };

function buildEmbedUrl(url: string, token: string, projectId: string | null) {
  const fragment = new URLSearchParams();
  fragment.set("token", token);
  if (projectId) fragment.set("projectId", projectId);
  return `${url}/embed-bridge.html#${fragment.toString()}`;
}

export default function AutomationsPage() {
  const [state, setState] = useState<BridgeState>({ phase: "loading" });

  const connect = useCallback(async () => {
    setState({ phase: "loading" });
    try {
      const res = await fetch("/api/automation/bridge", { method: "POST" });
      const data = (await res.json().catch(() => null)) as {
        configured?: boolean;
        url?: string;
        token?: string;
        projectId?: string | null;
        error?: string;
      } | null;

      if (!res.ok) {
        setState({
          phase: "error",
          message: data?.error ?? `Bridge request failed (${res.status})`,
        });
        return;
      }
      if (!data?.configured) {
        setState({ phase: "unconfigured" });
        return;
      }
      if (!data.url || !data.token) {
        setState({ phase: "error", message: "Bridge returned an incomplete session." });
        return;
      }
      setState({
        phase: "ready",
        embedUrl: buildEmbedUrl(data.url, data.token, data.projectId ?? null),
      });
    } catch {
      setState({ phase: "error", message: "Could not reach the automation bridge." });
    }
  }, []);

  useEffect(() => {
    void connect();
  }, [connect]);

  return (
    <div className="h-full flex flex-col">
      {/* Slim header — the builder below has its own navigation */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-white shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-accent" />
          <h1 className="text-sm font-semibold">Automations</h1>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            — build workflows that run for you 24/7
          </span>
        </div>
        {state.phase === "ready" && (
          <a href={state.embedUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="sm">
              <ExternalLink className="w-3.5 h-3.5" />
              Full screen
            </Button>
          </a>
        )}
      </div>

      <div className="flex-1 min-h-0 bg-surface">
        {state.phase === "loading" && (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
            <p className="text-sm">Connecting your workspace…</p>
          </div>
        )}

        {state.phase === "unconfigured" && (
          <div className="h-full flex items-center justify-center p-6">
            <div className="max-w-md text-center p-8 rounded-2xl border border-border bg-white">
              <div className="w-12 h-12 rounded-xl bg-accent-light border border-orange-200 flex items-center justify-center mx-auto mb-4">
                <Plug className="w-5 h-5 text-accent" />
              </div>
              <h2 className="font-semibold mb-2">Automation engine not connected</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The engine isn&apos;t configured for this environment yet. Set{" "}
                <code className="px-1 py-0.5 rounded bg-muted text-xs">ACTIVEPIECES_URL</code>{" "}
                and restart the app to enable the workflow builder.
              </p>
            </div>
          </div>
        )}

        {state.phase === "error" && (
          <div className="h-full flex items-center justify-center p-6">
            <div className="max-w-md text-center p-8 rounded-2xl border border-border bg-white">
              <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-5 h-5 text-accent" />
              </div>
              <h2 className="font-semibold mb-2">Couldn&apos;t open the builder</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5 break-words">
                {state.message}
              </p>
              <Button onClick={() => void connect()} size="sm">
                <RefreshCw className="w-3.5 h-3.5" />
                Try again
              </Button>
            </div>
          </div>
        )}

        {state.phase === "ready" && (
          <iframe
            src={state.embedUrl}
            title="Neaven Automations builder"
            className="w-full h-full border-0"
            allow="clipboard-read; clipboard-write"
          />
        )}
      </div>
    </div>
  );
}
