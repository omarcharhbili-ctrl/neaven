"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Loader2,
  Plus,
  Search,
  Send,
  Star,
  ChevronRight,
  Sparkles,
  Trash2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types mirroring the API
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Reasoning trace — collapsed by default, calm disclosure
// ---------------------------------------------------------------------------

function ReasoningTrace({
  steps,
  live,
}: {
  steps: ReasoningStep[];
  live?: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (!steps.length) return null;

  const consulted = steps.filter((s) => s.type === "consulted");
  const label = live
    ? "Thinking…"
    : consulted.length
      ? `Reasoned · consulted ${consulted
          .map((s) => s.agent ?? "memory")
          .filter((v, i, a) => a.indexOf(v) === i)
          .join(", ")}`
      : "Reasoned";

  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronRight
          className={`w-3 h-3 transition-transform ${open ? "rotate-90" : ""}`}
        />
        <Sparkles className="w-3 h-3" />
        {label}
      </button>
      {open && (
        <div className="mt-2 ml-1 pl-3 border-l-2 border-border space-y-2">
          {steps.map((s, i) =>
            s.type === "consulted" ? (
              <p key={i} className="text-xs font-medium text-foreground/80">
                → {s.text}
              </p>
            ) : (
              <p
                key={i}
                className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed"
              >
                {s.text}
              </p>
            ),
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chat page
// ---------------------------------------------------------------------------

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
        data.messages.map(
          (m: Message & { reasoning: ReasoningStep[] | null }) => ({
            ...m,
            reasoning: m.reasoning ?? [],
          }),
        ),
      );
    }
  }, []);

  const newChat = () => {
    setActiveId(null);
    setMessages([]);
    inputRef.current?.focus();
  };

  const send = async () => {
    const text = input.trim();
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

      const patchDraft = (fn: (m: Message) => Message) =>
        setMessages((prev) =>
          prev.map((m) => (m.id === draft.id ? fn(m) : m)),
        );

      let currentThinking = "";
      let thinkingOpen = false;

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
            patchDraft((m) => {
              const steps = startNew
                ? [...m.reasoning, { type: "thinking" as const, text: snapshot }]
                : m.reasoning.map((s, i) =>
                    i === m.reasoning.length - 1 && s.type === "thinking"
                      ? { ...s, text: snapshot }
                      : s,
                  );
              return { ...m, reasoning: steps };
            });
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
                  "Connection dropped — your message was saved, try again.",
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
    <div className="h-full flex">
      {/* Thread list */}
      <aside className="w-64 border-r border-border bg-surface flex flex-col shrink-0">
        <div className="p-3 space-y-2">
          <button
            onClick={newChat}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-light transition-colors"
          >
            <Plus className="w-4 h-4" />
            New conversation
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-4">
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
          <ThreadGroup
            label="Recent"
            threads={recent}
            activeId={activeId}
            onOpen={openThread}
            onStar={toggleStar}
            onDelete={removeThread}
          />
        </div>
      </aside>

      {/* Conversation */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
            {messages.length === 0 && (
              <div className="text-center pt-24">
                <p className="text-lg font-medium">What are you working on?</p>
                <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
                  Neaven knows your vision, progress, and metrics — and will
                  tell you when it disagrees.
                </p>
              </div>
            )}
            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-md bg-muted px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
                    {m.content}
                  </div>
                </div>
              ) : (
                <div key={m.id}>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    Neaven
                  </p>
                  <ReasoningTrace
                    steps={m.reasoning}
                    live={m.pending && !m.content}
                  />
                  {m.content ? (
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {m.content}
                    </div>
                  ) : m.pending ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : null}
                </div>
              ),
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Composer */}
        <div className="border-t border-border bg-white">
          <div className="max-w-3xl mx-auto px-6 py-4">
            <div className="flex items-end gap-2 rounded-xl border border-border bg-surface p-2 focus-within:ring-2 focus-within:ring-accent/20 focus-within:border-accent">
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
                placeholder="Talk it through with your co-founder…"
                className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm focus:outline-none"
              />
              <button
                onClick={send}
                disabled={!input.trim() || streaming}
                className="p-2 rounded-lg bg-primary text-white disabled:opacity-40 hover:bg-primary-light transition-colors"
              >
                {streaming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
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
  if (!threads.length) return null;
  return (
    <div>
      <p className="px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="space-y-0.5">
        {threads.map((t) => (
          <div
            key={t.id}
            className={`group flex items-center rounded-lg text-sm transition-colors ${
              activeId === t.id
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <button
              onClick={() => onOpen(t.id)}
              className="flex-1 truncate text-left px-2 py-1.5"
              title={t.title}
            >
              {t.title}
            </button>
            <button
              onClick={() => onStar(t)}
              className={`p-1 mr-0.5 rounded transition-opacity ${
                t.starred
                  ? "text-accent"
                  : "opacity-0 group-hover:opacity-100 hover:text-foreground"
              }`}
            >
              <Star
                className="w-3.5 h-3.5"
                fill={t.starred ? "currentColor" : "none"}
              />
            </button>
            <button
              onClick={() => onDelete(t)}
              className="p-1 mr-1 rounded opacity-0 group-hover:opacity-100 hover:text-error transition-opacity"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
