"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, ExternalLink, Loader2 } from "lucide-react";
import { Markdown } from "@/components/app/Markdown";

/* ---------------------------------------------------------------------------
   Automations — the automation agent's console. Sub-agent status as a ledger
   table, the designer conversation below, the visual builder one click away
   (silently authenticated).
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
  { key: "watcher" as const, name: "Watcher", scope: "sessions & pull requests" },
  { key: "analytics" as const, name: "Analytics", scope: "revenue & traffic" },
  { key: "automation" as const, name: "Automation", scope: "flows & integrations" },
];

export default function AutomationsPage() {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [openingBuilder, setOpeningBuilder] = useState(false);
  const [engineState, setEngineState] = useState<"unknown" | "unconfigured" | "error">("unknown");
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
            : "The automation agent is unreachable right now — your message wasn't lost, try again shortly.",
        },
      ]);
    } catch {
      setMessages([
        ...next,
        { role: "assistant", content: "The automation agent is unreachable right now — your message wasn't lost, try again shortly." },
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

  const latestFor = (agent: Summary["agent"]) => summaries.find((s) => s.agent === agent);

  return (
    <div className="mx-auto max-w-[1120px] px-8 py-9">
      <header className="animate-rise flex items-end justify-between">
        <div>
          <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em]">
            Automations
          </h1>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            Describe the trigger and the outcome — the agent works out the
            steps. Destructive actions stay locked until you approve them.
          </p>
        </div>
        <button
          onClick={openBuilder}
          disabled={openingBuilder}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-[13.5px] font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {openingBuilder ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.2} />
          ) : (
            <ExternalLink className="h-4 w-4" strokeWidth={2.2} />
          )}
          Open builder
        </button>
      </header>

      {engineState !== "unknown" && (
        <p className="animate-rise mt-4 rounded-lg border border-warning/40 bg-warning-soft px-4 py-3 font-mono text-[12px] leading-relaxed text-warning">
          {engineState === "unconfigured"
            ? "engine offline — ACTIVEPIECES_URL isn't set for this environment. The agent below still designs flows."
            : "couldn't reach the engine — it may be restarting. The agent below still works."}
        </p>
      )}

      {/* Sub-agent ledger */}
      <section className="mt-8">
        <div className="border-b border-border-strong pb-2.5">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Sub-agent status
          </h2>
        </div>
        <table className="w-full">
          <tbody>
            {AGENTS.map((a) => {
              const latest = latestFor(a.key);
              return (
                <tr key={a.key} className="border-b border-border">
                  <td className="w-[150px] py-3.5 pr-4 align-top">
                    <p className="text-[13.5px] font-medium">{a.name}</p>
                    <p className="mt-0.5 font-mono text-[10.5px] text-faint-foreground">{a.scope}</p>
                  </td>
                  <td className="py-3.5 pr-4 align-top text-[13px] leading-relaxed text-secondary-foreground">
                    {latest ? latest.summary : <span className="text-faint-foreground">— nothing to report yet</span>}
                  </td>
                  <td className="w-[110px] py-3.5 text-right align-top">
                    {latest && (
                      <span
                        className={`font-mono text-[10.5px] uppercase tracking-[0.08em] ${
                          latest.significance === "anomaly"
                            ? "text-warning"
                            : latest.significance === "milestone"
                              ? "text-accent"
                              : "text-faint-foreground"
                        }`}
                      >
                        {latest.significance}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Designer conversation */}
      <section className="mt-10">
        <div className="border-b border-border-strong pb-2.5">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Design with the agent
          </h2>
        </div>

        <div className="min-h-[220px] py-6">
          {messages.length === 0 && !busy && (
            <p className="py-8 text-center font-mono text-[12px] leading-relaxed text-faint-foreground">
              “when a new user signs up → email me, add them to the CRM”
              <br />
              start with the moment something should happen
            </p>
          )}
          <div className="space-y-6">
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="animate-rise flex justify-end">
                  <div className="max-w-[75%] rounded-xl rounded-br-sm bg-higher px-4 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap">
                    {m.content}
                  </div>
                </div>
              ) : (
                <div key={i} className="animate-rise max-w-[92%]">
                  <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-accent">
                    automation agent
                  </p>
                  <Markdown text={m.content} />
                </div>
              ),
            )}
            {busy && (
              <p className="font-mono text-[11.5px]">
                <span className="text-accent">▸</span>{" "}
                <span className="thinking-live">working it out</span>
              </p>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="flex items-end gap-2 rounded-xl border border-border-strong bg-raised p-1.5 transition-colors focus-within:border-accent/60">
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
            className="flex-1 resize-none bg-transparent px-3 py-2 text-[13.5px] placeholder:text-faint-foreground focus:outline-none"
          />
          <button
            onClick={send}
            disabled={!input.trim() || busy}
            aria-label="Send"
            className="rounded-lg bg-accent p-2 text-on-accent transition-colors hover:bg-accent-hover disabled:bg-higher disabled:text-faint-foreground"
          >
            <ArrowUp className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>
      </section>
    </div>
  );
}
