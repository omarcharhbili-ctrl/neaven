"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Plus,
  Search,
  Star,
  ChevronRight,
  Trash2,
  Eye,
  BarChart3,
  Workflow,
  Scale,
  CalendarCheck,
  Compass,
} from "lucide-react";
import { Markdown } from "@/components/app/Markdown";

/* ---------------------------------------------------------------------------
   Co-founder — the conversation surface. The reasoning trace is the product's
   signature: watching Neaven think (serif, its own voice) and consult its
   sub-agents should feel like sitting across from someone working through
   your problem, not reading a debug log.
--------------------------------------------------------------------------- */

type ReasoningStep = { type: "thinking" | "consulted"; agent?: string; text: string };

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  reasoning: ReasoningStep[];
  pending?: boolean;
};

type Thread = {
  id: string;
  title: string;
  starred: boolean;
  updatedAt: string;
};

const AGENT_ICON: Record<string, typeof Eye> = {
  watcher: Eye,
  analytics: BarChart3,
  automation: Workflow,
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/* --- Reasoning trace ------------------------------------------------------ */

function ConsultedChip({ agent, text }: { agent?: string; text: string }) {
  const Icon = (agent && AGENT_ICON[agent]) || Compass;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-raised px-2.5 py-[3px] text-[11.5px] font-medium not-italic text-secondary-foreground">
      <Icon className="h-3 w-3 text-accent" strokeWidth={2} />
      {text}
    </span>
  );
}

function ReasoningTrace({ steps, live }: { steps: ReasoningStep[]; live: boolean }) {
  const [open, setOpen] = useState(false);
  const expanded = live || open;
  if (!steps.length && !live) return null;

  const consulted = steps.filter((s) => s.type === "consulted");
  const summary = consulted.length
    ? `Reasoned — consulted ${[...new Set(consulted.map((s) => s.agent ?? "context"))].join(", ")}`
    : "Reasoned before answering";

  return (
    <div className="mb-3">
      {!live && (
        <button
          onClick={() => setOpen(!open)}
          className="group inline-flex items-center gap-1 text-[12px] text-muted-foreground transition-colors hover:text-secondary-foreground"
        >
          <ChevronRight
            className={`h-3 w-3 transition-transform duration-150 ${open ? "rotate-90" : ""}`}
            strokeWidth={2}
          />
          {summary}
        </button>
      )}
      {live && (
        <span className="thinking-live text-[12px] font-medium tracking-wide">
          Thinking
        </span>
      )}
      {expanded && (
        <div className="agent-voice animate-rise mt-2 space-y-2.5 border-l-2 border-accent/30 pl-4">
          {steps.map((s, i) =>
            s.type === "consulted" ? (
              <div key={i}>
                <ConsultedChip agent={s.agent} text={s.text} />
              </div>
            ) : (
              <p key={i} className="whitespace-pre-wrap">
                {s.text}
              </p>
            ),
          )}
        </div>
      )}
    </div>
  );
}

/* --- Empty state ---------------------------------------------------------- */

const STARTERS = [
  {
    icon: Scale,
    label: "Pressure-test a decision",
    prompt:
      "I want to pressure-test a decision I'm about to make. Ask me what it is, then argue the other side properly.",
  },
  {
    icon: CalendarCheck,
    label: "What should I focus on today?",
    prompt: "Given everything you know about where I am, what should I focus on today — and what should I ignore?",
  },
  {
    icon: Compass,
    label: "Am I drifting from the vision?",
    prompt: "Look at my recent progress against the vision baseline. Am I drifting anywhere?",
  },
];

function EmptyState({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="animate-rise flex h-full flex-col items-center justify-center px-6 pb-24">
      <p className="font-serif text-[26px] italic tracking-[-0.01em] text-foreground">
        What are you weighing?
      </p>
      <p className="mt-2 max-w-md text-center text-[13.5px] leading-relaxed text-muted-foreground">
        Neaven holds your vision, progress, and metrics — and it will tell you
        when it disagrees.
      </p>
      <div className="mt-8 flex flex-col gap-2 sm:flex-row">
        {STARTERS.map((s) => (
          <button
            key={s.label}
            onClick={() => onPick(s.prompt)}
            className="group flex items-center gap-2.5 rounded-xl border border-border bg-raised px-4 py-3 text-left text-[13px] text-secondary-foreground transition-all duration-150 hover:border-accent/40 hover:text-foreground"
          >
            <s.icon
              className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-accent"
              strokeWidth={1.8}
            />
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* --- Page ----------------------------------------------------------------- */

export default function CofounderPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
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
    inputRef.current?.focus();
  };

  const send = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || streaming) return;
    setInput("");
    setStreaming(true);

    const userMsg: Message = {
      id: `local-${Date.now()}`,
      role: "user",
      content: text,
      reasoning: [],
    };
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
              reasoning: [
                ...m.reasoning,
                { type: "consulted", agent: ev.agent, text: ev.text },
              ],
            }));
          } else if (ev.type === "text") {
            patchDraft((m) => ({ ...m, content: m.content + ev.text }));
          } else if (ev.type === "error") {
            patchDraft((m) => ({
              ...m,
              content: m.content || ev.text,
              pending: false,
            }));
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
                  m.content ||
                  "The connection dropped mid-response. Your message was saved — send again to continue.",
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

  const filtered = threads.filter((t) =>
    t.title.toLowerCase().includes(query.toLowerCase()),
  );
  const starred = filtered.filter((t) => t.starred);
  const recent = filtered.filter((t) => !t.starred);

  return (
    <div className="flex h-full">
      {/* Thread rail */}
      <aside className="flex w-[232px] shrink-0 flex-col border-r border-border">
        <div className="space-y-2 p-3">
          <button
            onClick={newChat}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-[13px] font-medium text-background transition-colors duration-150 hover:bg-primary-light"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.2} />
            New conversation
          </button>
          <div className="relative">
            <Search
              className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint-foreground"
              strokeWidth={1.8}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="w-full rounded-lg border border-border bg-raised py-1.5 pl-8 pr-3 text-[13px] placeholder:text-faint-foreground focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/15"
            />
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-2 pb-3">
          {starred.length > 0 && (
            <ThreadGroup
              label="Starred"
              threads={starred}
              activeId={activeId}
              onOpen={openThread}
              onStar={toggleStar}
              onDelete={removeThread}
            />
          )}
          {recent.length > 0 && (
            <ThreadGroup
              label="Recent"
              threads={recent}
              activeId={activeId}
              onOpen={openThread}
              onStar={toggleStar}
              onDelete={removeThread}
            />
          )}
          {!filtered.length && (
            <p className="px-3 pt-6 text-center text-[12px] leading-relaxed text-faint-foreground">
              {query ? "No conversations match." : "Conversations live here."}
            </p>
          )}
        </div>
      </aside>

      {/* Conversation */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <EmptyState onPick={(p) => send(p)} />
          ) : (
            <div className="mx-auto max-w-[680px] space-y-7 px-6 py-10">
              {messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="animate-rise flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-br-md border border-border bg-surface px-4 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap">
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="animate-rise">
                    <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Neaven
                      <span className="inline-block h-[5px] w-[5px] rounded-full bg-accent" />
                    </p>
                    <ReasoningTrace
                      steps={m.reasoning}
                      live={!!m.pending && !m.content}
                    />
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
        <div className="px-6 pb-5">
          <div className="mx-auto max-w-[680px]">
            <div className="flex items-end gap-2 rounded-2xl border border-border bg-raised p-2 shadow-[0_1px_3px_rgba(26,38,32,0.05)] transition-shadow focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/15">
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
                placeholder="Think it through with Neaven…"
                className="flex-1 resize-none bg-transparent px-2.5 py-1.5 text-[14px] leading-relaxed placeholder:text-faint-foreground focus:outline-none"
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || streaming}
                aria-label="Send"
                className="rounded-xl bg-accent p-2 text-white transition-colors duration-150 hover:bg-accent-hover disabled:bg-border disabled:text-faint-foreground"
              >
                <ArrowUp className="h-4 w-4" strokeWidth={2.2} />
              </button>
            </div>
            <p className="mt-1.5 px-2 text-[11px] text-faint-foreground">
              Neaven argues from your vision baseline — it may disagree with you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ThreadGroup({
  label,
  threads,
  activeId,
  onOpen,
  onStar,
  onDelete,
}: {
  label: string;
  threads: Thread[];
  activeId: string | null;
  onOpen: (id: string) => void;
  onStar: (t: Thread) => void;
  onDelete: (t: Thread) => void;
}) {
  return (
    <div>
      <p className="px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-faint-foreground">
        {label}
      </p>
      <div className="space-y-px">
        {threads.map((t) => (
          <div
            key={t.id}
            className={`group flex items-center rounded-lg text-[13px] transition-colors duration-100 ${
              activeId === t.id
                ? "bg-surface text-foreground"
                : "text-secondary-foreground hover:bg-surface/70"
            }`}
          >
            <button
              onClick={() => onOpen(t.id)}
              className="min-w-0 flex-1 truncate px-3 py-[7px] text-left"
              title={t.title}
            >
              {t.title}
            </button>
            <span className="shrink-0 pr-1 text-[10.5px] tabular-nums text-faint-foreground group-hover:hidden">
              {relativeTime(t.updatedAt)}
            </span>
            <span className="hidden shrink-0 items-center pr-1 group-hover:flex">
              <button
                onClick={() => onStar(t)}
                aria-label={t.starred ? "Unstar" : "Star"}
                className={`rounded p-1 transition-colors ${
                  t.starred ? "text-warning" : "text-faint-foreground hover:text-foreground"
                }`}
              >
                <Star className="h-3.5 w-3.5" fill={t.starred ? "currentColor" : "none"} strokeWidth={1.8} />
              </button>
              <button
                onClick={() => onDelete(t)}
                aria-label="Delete"
                className="rounded p-1 text-faint-foreground transition-colors hover:text-danger"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
