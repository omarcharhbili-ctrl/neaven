"use client";

import { useEffect, useRef, useState } from "react";
import {
  Eye,
  BarChart3,
  Workflow,
  ArrowUp,
  ExternalLink,
  Loader2,
  PlugZap,
} from "lucide-react";
import { Markdown } from "@/components/app/Markdown";

/* ---------------------------------------------------------------------------
   Automations — the automation agent's home. Describe what you want automated
   in plain language, or open the visual builder (silently authenticated via
   the Clerk → engine bridge). Sub-agent status up top: each one reports
   upward only when something matters.
--------------------------------------------------------------------------- */

type Summary = {
  id: string;
  agent: "watcher" | "analytics" | "automation";
  summary: string;
  significance: string;
  createdAt: string;
};

type ChatMsg = { role: "user" | "assistant"; content: string };

const AGENTS = [
  {
    key: "watcher" as const,
    icon: Eye,
    name: "Watcher",
    blurb: "Supervises coding sessions and pull requests. Flags drift, stalls, and quality issues against your vision baseline.",
  },
  {
    key: "analytics" as const,
    icon: BarChart3,
    name: "Analytics",
    blurb: "Watches revenue and web analytics. Speaks up on real anomalies and milestones — not routine wobble.",
  },
  {
    key: "automation" as const,
    icon: Workflow,
    name: "Automation",
    blurb: "Designs and runs automations. Destructive actions stay disabled until you explicitly approve them.",
  },
];

export default function AutomationsPage() {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [openingBuilder, setOpeningBuilder] = useState(false);
  const [engineState, setEngineState] = useState<"unknown" | "unconfigured" | "error">(
    "unknown",
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/agents/summaries")
      .then((r) => (r.ok ? r.json() : []))
      .then(setSummaries)
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setBusy(true);
    const next: ChatMsg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    try {
      const res = await fetch("/api/automation/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: next }),
      });
      const data = await res.json();
      setMessages([
        ...next,
        {
          role: "assistant",
          content: res.ok
            ? data.reply
            : "The automation agent is unreachable right now. Your message wasn't lost — try again in a moment.",
        },
      ]);
    } catch {
      setMessages([
        ...next,
        {
          role: "assistant",
          content:
            "The automation agent is unreachable right now. Your message wasn't lost — try again in a moment.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const openBuilder = async () => {
    setOpeningBuilder(true);
    try {
      const res = await fetch("/api/automation/bridge", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (data.configured === false) {
        setEngineState("unconfigured");
        return;
      }
      if (!res.ok || !data.token) {
        setEngineState("error");
        return;
      }
      // Token travels in the URL fragment — it never reaches any server log.
      // /embed-bridge.html is Neaven's page mounted into the engine's frontend
      // (see automation-engine/bridge/) — it stores the session and hands off.
      const fragment = new URLSearchParams({
        token: data.token,
        ...(data.projectId ? { projectId: data.projectId } : {}),
      });
      window.open(`${data.url}/embed-bridge.html#${fragment.toString()}`, "_blank");
    } catch {
      setEngineState("error");
    } finally {
      setOpeningBuilder(false);
    }
  };

  const latestFor = (agent: Summary["agent"]) =>
    summaries.find((s) => s.agent === agent);

  return (
    <div className="mx-auto max-w-[1060px] px-8 py-9">
      <header className="animate-rise flex items-end justify-between">
        <div>
          <h1 className="text-[21px] font-semibold tracking-[-0.015em]">Automations</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Three sub-agents work under your co-founder. Each reports upward only
            when something is worth surfacing.
          </p>
        </div>
        <button
          onClick={openBuilder}
          disabled={openingBuilder}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-raised px-3.5 py-2 text-[13px] font-medium transition-colors duration-150 hover:border-accent/40 hover:text-accent disabled:opacity-50"
        >
          {openingBuilder ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
          ) : (
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
          )}
          Open visual builder
        </button>
      </header>

      {engineState !== "unknown" && (
        <div className="animate-rise mt-4 flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3.5">
          <PlugZap className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
          <div className="text-[12.5px] leading-relaxed text-secondary-foreground">
            {engineState === "unconfigured" ? (
              <>
                <span className="font-medium text-foreground">
                  The automation engine isn&apos;t connected yet.
                </span>{" "}
                Once it&apos;s deployed, you&apos;ll be signed into the builder
                automatically — no separate account. You can still design
                automations with the agent below; they&apos;ll be ready to wire up.
              </>
            ) : (
              <>
                <span className="font-medium text-foreground">
                  Couldn&apos;t reach the automation engine.
                </span>{" "}
                It may be restarting — the agent below still works.
              </>
            )}
          </div>
        </div>
      )}

      {/* Sub-agent cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {AGENTS.map((a) => {
          const latest = latestFor(a.key);
          return (
            <div
              key={a.key}
              className="rounded-xl border border-border bg-raised p-5 shadow-[0_1px_2px_rgba(26,38,32,0.04)]"
            >
              <div className="flex items-center gap-2.5">
                <span className="rounded-lg border border-border bg-surface p-1.5">
                  <a.icon className="h-4 w-4 text-secondary-foreground" strokeWidth={1.8} />
                </span>
                <p className="text-[13.5px] font-semibold">{a.name}</p>
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
                {a.blurb}
              </p>
              <div className="mt-4 border-t border-border pt-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-faint-foreground">
                  Last report
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-secondary-foreground">
                  {latest ? latest.summary : "Nothing to report yet."}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Automation agent conversation */}
      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-raised shadow-[0_1px_2px_rgba(26,38,32,0.04)]">
        <div className="border-b border-border px-5 py-3.5">
          <p className="text-[13.5px] font-semibold tracking-[-0.01em]">
            Design an automation
          </p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Describe the trigger and the outcome — the agent works out the steps.
          </p>
        </div>

        <div className="h-[340px] space-y-5 overflow-y-auto px-5 py-5">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="agent-voice max-w-sm">
                “When a new user signs up, send me an email and add them to my CRM.”
              </p>
              <p className="mt-2 text-[11.5px] text-faint-foreground">
                Start with the moment something should happen.
              </p>
            </div>
          )}
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="animate-rise flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-br-md border border-border bg-surface px-4 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap">
                  {m.content}
                </div>
              </div>
            ) : (
              <div key={i} className="animate-rise max-w-[92%]">
                <p className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Automation agent
                  <span className="inline-block h-1 w-1 rounded-full bg-accent" />
                </p>
                <Markdown text={m.content} />
              </div>
            ),
          )}
          {busy && (
            <span className="thinking-live text-[12px] font-medium tracking-wide">
              Working it out
            </span>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-border p-3">
          <div className="flex items-end gap-2 rounded-xl border border-border bg-background p-1.5 transition-shadow focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/15">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="Describe an automation…"
              className="flex-1 resize-none bg-transparent px-2.5 py-1.5 text-[13.5px] placeholder:text-faint-foreground focus:outline-none"
            />
            <button
              onClick={send}
              disabled={!input.trim() || busy}
              aria-label="Send"
              className="rounded-lg bg-accent p-2 text-white transition-colors duration-150 hover:bg-accent-hover disabled:bg-border disabled:text-faint-foreground"
            >
              <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
