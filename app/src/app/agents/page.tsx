"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Eye,
  BarChart3,
  Workflow,
  Send,
  Loader2,
  ExternalLink,
} from "lucide-react";

/**
 * Agents — status of the three sub-agents plus the automation tab: talk to
 * the automation agent directly, or open the embedded builder (silently
 * authenticated via the Clerk → Activepieces bridge).
 */

type Summary = {
  id: string;
  agent: "watcher" | "analytics" | "automation";
  summary: string;
  significance: string;
  createdAt: string;
};

type ChatMsg = { role: "user" | "assistant"; content: string };

const AGENT_META = {
  watcher: {
    icon: Eye,
    name: "Watcher",
    blurb: "Supervises coding sessions and code quality. Flags drift, stalls, and security issues.",
  },
  analytics: {
    icon: BarChart3,
    name: "Analytics",
    blurb: "Watches revenue and web analytics. Reports anomalies and milestones.",
  },
  automation: {
    icon: Workflow,
    name: "Automation",
    blurb: "Designs and runs automations. Destructive actions stay disabled until you approve them.",
  },
} as const;

export default function AgentsPage() {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [openingBuilder, setOpeningBuilder] = useState(false);
  const [builderError, setBuilderError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/agents/summaries")
      .then((r) => (r.ok ? r.json() : []))
      .then(setSummaries)
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
          content: res.ok ? data.reply : "The automation agent is unavailable right now.",
        },
      ]);
    } catch {
      setMessages([
        ...next,
        { role: "assistant", content: "The automation agent is unavailable right now." },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const openBuilder = async () => {
    setOpeningBuilder(true);
    setBuilderError(null);
    try {
      const res = await fetch("/api/automation/bridge", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.token) {
        setBuilderError(
          data.error ??
            "The automation engine isn't configured yet (ACTIVEPIECES_URL).",
        );
        return;
      }
      // Token travels in the URL fragment — never sent to any server.
      window.open(`${data.url}/embed/callback#token=${data.token}`, "_blank");
    } catch {
      setBuilderError("Could not reach the automation engine.");
    } finally {
      setOpeningBuilder(false);
    }
  };

  const latestFor = (agent: Summary["agent"]) =>
    summaries.find((s) => s.agent === agent);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Agents</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your co-founder manages three sub-agents. Each reports upward only
          when something is worth surfacing.
        </p>
      </div>

      {/* Sub-agent cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.keys(AGENT_META) as (keyof typeof AGENT_META)[]).map((key) => {
          const meta = AGENT_META[key];
          const latest = latestFor(key);
          return (
            <div key={key} className="rounded-xl border border-border bg-white p-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <meta.icon className="w-4 h-4 text-foreground/70" />
                </div>
                <p className="font-medium text-sm">{meta.name}</p>
              </div>
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                {meta.blurb}
              </p>
              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Last report
                </p>
                <p className="mt-1 text-xs leading-relaxed">
                  {latest ? latest.summary : "Nothing to report yet."}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Automation tab */}
      <div className="rounded-xl border border-border bg-white">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Bot className="w-4 h-4 text-foreground/70" />
            <div>
              <p className="font-medium text-sm">Automation agent</p>
              <p className="text-xs text-muted-foreground">
                Describe what you want automated, or build it visually.
              </p>
            </div>
          </div>
          <button
            onClick={openBuilder}
            disabled={openingBuilder}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted transition-colors disabled:opacity-50"
          >
            {openingBuilder ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ExternalLink className="w-3.5 h-3.5" />
            )}
            Open builder
          </button>
        </div>

        {builderError && (
          <p className="px-5 py-2 text-xs text-warning border-b border-border bg-accent-light/40">
            {builderError}
          </p>
        )}

        <div className="h-72 overflow-y-auto px-5 py-4 space-y-4">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground pt-16 text-center">
              e.g. “When a new user signs up, send me an email and add them to
              my CRM.”
            </p>
          )}
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[75%] rounded-2xl rounded-br-md bg-muted px-4 py-2 text-sm whitespace-pre-wrap">
                  {m.content}
                </div>
              </div>
            ) : (
              <div key={i} className="max-w-[85%]">
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Automation agent
                </p>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {m.content}
                </div>
              </div>
            ),
          )}
          {busy && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-border p-3">
          <div className="flex items-end gap-2 rounded-xl border border-border bg-surface p-1.5 focus-within:ring-2 focus-within:ring-accent/20 focus-within:border-accent">
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
              className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm focus:outline-none"
            />
            <button
              onClick={send}
              disabled={!input.trim() || busy}
              className="p-2 rounded-lg bg-primary text-white disabled:opacity-40 hover:bg-primary-light transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
