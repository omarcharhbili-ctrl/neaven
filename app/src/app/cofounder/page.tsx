"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  History,
  Plus,
  Search,
  Star,
  Trash2,
  X,
  ChevronRight,
} from "lucide-react";
import { Markdown } from "@/components/app/Markdown";

/* ---------------------------------------------------------------------------
   Co-founder — one centered conversation. History lives in a slide-over, not
   a permanent rail. The reasoning trace is a console feed: mono, dim, brass
   where it matters — watching it think is the product.
--------------------------------------------------------------------------- */

type ReasoningStep = { type: "thinking" | "consulted"; agent?: string; text: string };

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  reasoning: ReasoningStep[];
  pending?: boolean;
};

type Thread = { id: string; title: string; starred: boolean; updatedAt: string };

function relativeTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/* --- Console trace -------------------------------------------------------- */

function Trace({ steps, live }: { steps: ReasoningStep[]; live: boolean }) {
  const [open, setOpen] = useState(false);
  const expanded = live || open;
  if (!steps.length && !live) return null;

  const consulted = [...new Set(steps.filter((s) => s.type === "consulted").map((s) => s.agent ?? s.text))];

  return (
    <div className="mb-3">
      {live ? (
        <p className="font-mono text-[11.5px] tracking-wide">
          <span className="text-accent">▸</span>{" "}
          <span className="thinking-live">reasoning</span>
        </p>
      ) : (
        <button
          onClick={() => setOpen(!open)}
          className="group inline-flex items-center gap-1.5 font-mono text-[11px] text-faint-foreground transition-colors hover:text-muted-foreground"
        >
          <ChevronRight
            className={`h-3 w-3 transition-transform duration-150 ${open ? "rotate-90" : ""}`}
            strokeWidth={2}
          />
          trace
          {consulted.length > 0 && <span className="text-accent/70">· {consulted.join(", ")}</span>}
        </button>
      )}
      {expanded && (
        <div className="animate-rise mt-2 space-y-2 rounded-lg border border-border bg-raised/60 p-3.5">
          {steps.map((s, i) =>
            s.type === "consulted" ? (
              <p key={i} className="font-mono text-[11.5px] text-accent">
                → {s.text}
              </p>
            ) : (
              <p key={i} className="agent-voice whitespace-pre-wrap">
                {s.text}
              </p>
            ),
          )}
          {live && steps.length === 0 && (
            <p className="agent-voice">…</p>
          )}
        </div>
      )}
    </div>
  );
}

/* --- Page ------------------------------------------------------------------ */

const STARTERS = [
  "Pressure-test a decision I'm about to make.",
  "What should I focus on today — and what should I ignore?",
  "Am I drifting from the vision anywhere?",
];

export default function CofounderPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const loadThreads = useCallback(async () => {
    const res = await fetch("/api/threads");
    if (res.ok) setThreads(await res.json());
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openThread = useCallback(async (id: string) => {
    setActiveId(id);
    setHistoryOpen(false);
    const res = await fetch(`/api/threads/${id}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(
        data.messages.map((m: Message & { reasoning: ReasoningStep[] | null }) => ({
          ...m,
          reasoning: m.reasoning ?? [],
        })),
      );
    }
  }, []);

  const newChat = () => {
    setActiveId(null);
    setMessages([]);
    setHistoryOpen(false);
    inputRef.current?.focus();
  };

  const send = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || streaming) return;
    setInput("");
    setStreaming(true);

    const userMsg: Message = { id: `local-${Date.now()}`, role: "user", content: text, reasoning: [] };
    const draft: Message = {
      id: `draft-${Date.now()}`,
      role: "assistant",
      content: "",
      reasoning: [],
      pending: true,
    };
    setMessages((prev) => [...prev, userMsg, draft]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: activeId ?? undefined, message: text }),
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let currentThinking = "";
      let thinkingOpen = false;

      const patchDraft = (fn: (m: Message) => Message) =>
        setMessages((prev) => prev.map((m) => (m.id === draft.id ? fn(m) : m)));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const raw of events) {
          const line = raw.trim();
          if (!line.startsWith("data:")) continue;
          const ev = JSON.parse(line.slice(5));

          if (ev.type === "thread") {
            setActiveId((cur) => cur ?? ev.threadId);
          } else if (ev.type === "thinking") {
            currentThinking += ev.text;
            const snapshot = currentThinking;
            const startNew = !thinkingOpen;
            thinkingOpen = true;
            patchDraft((m) => ({
              ...m,
              reasoning: startNew
                ? [...m.reasoning, { type: "thinking" as const, text: snapshot }]
                : m.reasoning.map((s, i) =>
                    i === m.reasoning.length - 1 && s.type === "thinking"
                      ? { ...s, text: snapshot }
                      : s,
                  ),
            }));
          } else if (ev.type === "consulted") {
            currentThinking = "";
            thinkingOpen = false;
            patchDraft((m) => ({
              ...m,
              reasoning: [...m.reasoning, { type: "consulted", agent: ev.agent, text: ev.text }],
            }));
          } else if (ev.type === "text") {
            patchDraft((m) => ({ ...m, content: m.content + ev.text }));
          } else if (ev.type === "error") {
            patchDraft((m) => ({ ...m, content: m.content || ev.text, pending: false }));
          } else if (ev.type === "done") {
            patchDraft((m) => ({ ...m, pending: false }));
          }
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === draft.id
            ? {
                ...m,
                pending: false,
                content:
                  m.content || "The connection dropped mid-response. Your message was saved — send again to continue.",
              }
            : m,
        ),
      );
    } finally {
      setStreaming(false);
      loadThreads();
    }
  };

  const toggleStar = async (t: Thread) => {
    await fetch(`/api/threads/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ starred: !t.starred }),
    });
    loadThreads();
  };

  const removeThread = async (t: Thread) => {
    await fetch(`/api/threads/${t.id}`, { method: "DELETE" });
    if (activeId === t.id) newChat();
    loadThreads();
  };

  const filtered = threads.filter((t) => t.title.toLowerCase().includes(query.toLowerCase()));
  const starred = filtered.filter((t) => t.starred);
  const recent = filtered.filter((t) => !t.starred);

  return (
    <div className="relative flex h-full flex-col">
      {/* Conversation toolbar */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border px-5">
        <p className="min-w-0 truncate font-mono text-[11.5px] uppercase tracking-[0.12em] text-muted-foreground">
          {activeId
            ? threads.find((t) => t.id === activeId)?.title ?? "Conversation"
            : "New conversation"}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={newChat}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12.5px] text-secondary-foreground transition-colors hover:bg-higher hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            New
          </button>
          <button
            onClick={() => setHistoryOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12.5px] text-secondary-foreground transition-colors hover:bg-higher hover:text-foreground"
          >
            <History className="h-3.5 w-3.5" strokeWidth={2} />
            History
            {threads.length > 0 && (
              <span className="font-mono text-[10.5px] text-faint-foreground">{threads.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="animate-rise flex h-full flex-col items-center justify-center px-6 pb-20">
            <p className="font-mono text-[11.5px] uppercase tracking-[0.18em] text-accent">
              Co-founder
            </p>
            <p className="font-display mt-3 text-center text-[28px] font-semibold tracking-[-0.02em]">
              What are you weighing?
            </p>
            <p className="mt-2 max-w-md text-center text-[13px] leading-relaxed text-muted-foreground">
              Full context on your vision, progress, and metrics — and it will
              tell you when it disagrees.
            </p>
            <div className="mt-8 w-full max-w-md space-y-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="group flex w-full items-center justify-between rounded-lg border border-border bg-raised px-4 py-3 text-left text-[13px] text-secondary-foreground transition-all duration-150 hover:border-accent/40 hover:text-foreground"
                >
                  {s}
                  <ArrowUp className="h-3.5 w-3.5 rotate-45 text-faint-foreground transition-colors group-hover:text-accent" strokeWidth={2} />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-[640px] px-6 py-8">
            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="animate-rise mb-7 flex justify-end">
                  <div className="max-w-[85%] rounded-xl rounded-br-sm bg-higher px-4 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap">
                    {m.content}
                  </div>
                </div>
              ) : (
                <div key={m.id} className="animate-rise mb-9">
                  <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-accent">
                    neaven
                  </p>
                  <Trace steps={m.reasoning} live={!!m.pending && !m.content} />
                  {m.content ? (
                    <div className={m.pending ? "stream-cursor" : ""}>
                      <Markdown text={m.content} />
                    </div>
                  ) : null}
                </div>
              ),
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="shrink-0 px-6 pb-5">
        <div className="mx-auto max-w-[640px]">
          <div className="flex items-end gap-2 rounded-xl border border-border-strong bg-raised p-1.5 transition-colors focus-within:border-accent/60">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={Math.min(6, Math.max(1, input.split("\n").length))}
              placeholder="Think it through…"
              className="flex-1 resize-none bg-transparent px-3 py-2 text-[13.5px] leading-relaxed placeholder:text-faint-foreground focus:outline-none"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || streaming}
              aria-label="Send"
              className="rounded-lg bg-accent p-2 text-on-accent transition-colors duration-150 hover:bg-accent-hover disabled:bg-higher disabled:text-faint-foreground"
            >
              <ArrowUp className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </div>
          <p className="mt-1.5 px-1 font-mono text-[10.5px] text-faint-foreground">
            argues from your vision baseline — expect disagreement
          </p>
        </div>
      </div>

      {/* History slide-over */}
      {historyOpen && (
        <>
          <button
            aria-label="Close history"
            onClick={() => setHistoryOpen(false)}
            className="absolute inset-0 z-10 bg-background/60 backdrop-blur-[2px]"
          />
          <aside className="animate-rise absolute inset-y-0 right-0 z-20 flex w-[320px] flex-col border-l border-border bg-raised shadow-[-8px_0_24px_rgba(0,0,0,0.3)]">
            <div className="flex h-11 items-center justify-between border-b border-border px-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                History
              </p>
              <button
                onClick={() => setHistoryOpen(false)}
                className="rounded p-1 text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
            <div className="border-b border-border p-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint-foreground" strokeWidth={1.8} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search"
                  className="w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-3 text-[13px] placeholder:text-faint-foreground focus:border-accent/50 focus:outline-none"
                />
              </div>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
              {[
                { label: "starred", list: starred },
                { label: "recent", list: recent },
              ].map(
                ({ label, list }) =>
                  list.length > 0 && (
                    <div key={label}>
                      <p className="px-2 pb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-faint-foreground">
                        {label}
                      </p>
                      {list.map((t) => (
                        <div
                          key={t.id}
                          className={`group flex items-center rounded-lg text-[12.5px] transition-colors ${
                            activeId === t.id
                              ? "bg-higher text-foreground"
                              : "text-secondary-foreground hover:bg-higher/60"
                          }`}
                        >
                          <button
                            onClick={() => openThread(t.id)}
                            className="min-w-0 flex-1 truncate px-2.5 py-2 text-left"
                            title={t.title}
                          >
                            {t.title}
                          </button>
                          <span className="shrink-0 pr-1.5 font-mono text-[10px] tabular-nums text-faint-foreground group-hover:hidden">
                            {relativeTime(t.updatedAt)}
                          </span>
                          <span className="hidden shrink-0 items-center pr-1 group-hover:flex">
                            <button
                              onClick={() => toggleStar(t)}
                              aria-label={t.starred ? "Unstar" : "Star"}
                              className={`rounded p-1 ${t.starred ? "text-accent" : "text-faint-foreground hover:text-foreground"}`}
                            >
                              <Star className="h-3.5 w-3.5" fill={t.starred ? "currentColor" : "none"} strokeWidth={1.8} />
                            </button>
                            <button
                              onClick={() => removeThread(t)}
                              aria-label="Delete"
                              className="rounded p-1 text-faint-foreground hover:text-danger"
                            >
                              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                            </button>
                          </span>
                        </div>
                      ))}
                    </div>
                  ),
              )}
              {!filtered.length && (
                <p className="px-2 pt-6 text-center font-mono text-[11px] text-faint-foreground">
                  {query ? "no matches" : "no conversations yet"}
                </p>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
