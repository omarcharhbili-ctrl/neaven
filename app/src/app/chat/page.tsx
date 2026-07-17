"use client";

import { Button } from "@/components/Button";
import {
  MessageSquare,
  Send,
  Bot,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  Target,
  TrendingUp,
  Paperclip,
  MoreHorizontal,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

type Message = {
  id: string;
  type: "bot" | "user" | "system";
  content: string;
  time: string;
  actions?: { label: string; variant: "primary" | "secondary" }[];
  isDigest?: boolean;
  digestItems?: { icon: string; text: string; status: "done" | "todo" | "warning" }[];
};

const initialMessages: Message[] = [
  {
    id: "1",
    type: "system",
    content: "Today — June 24, 2026",
    time: "",
  },
  {
    id: "2",
    type: "bot",
    content: "Morning, Omar. Here's your daily rundown.",
    time: "8:00 AM",
    isDigest: true,
    digestItems: [
      { icon: "🎯", text: "3 priority tasks for today (from your overview)", status: "todo" },
      { icon: "📊", text: "Sprint progress: 68% — on pace for July 30", status: "done" },
      { icon: "⚠️", text: "Auth flow is the critical path — stay focused until it's done", status: "warning" },
      { icon: "✅", text: "Yesterday: 4 tasks completed, 2h 15m coding time", status: "done" },
      { icon: "💰", text: "MRR: $0 → need beta users before tracking revenue", status: "todo" },
    ],
  },
  {
    id: "3",
    type: "bot",
    content: "Top priority: finish the auth API routes. You left 2 edge cases yesterday — email verification timeout and rate limiting on login attempts. Want me to scope those into prompts for your next coding session?",
    time: "8:01 AM",
    actions: [
      { label: "Yes, scope the prompts", variant: "primary" },
      { label: "I'll handle it myself", variant: "secondary" },
    ],
  },
  {
    id: "4",
    type: "user",
    content: "Yes, scope them. Also, should I worry about the invoice UI today or stay focused on auth?",
    time: "8:15 AM",
  },
  {
    id: "5",
    type: "bot",
    content: "Stay on auth. Here's my thinking:\n\n• Auth is the launch blocker — nothing else works without it\n• Invoice UI has zero dependencies on auth being incomplete\n• Your overview puts auth at P0, invoice UI at P1\n• 36 days to deadline — auth today, invoice UI tomorrow is the right sequence\n\nI've scoped 2 prompts for your auth session. They'll be ready in Qode when you start coding.",
    time: "8:16 AM",
  },
  {
    id: "6",
    type: "system",
    content: "Qode detected a coding session at 9:15 AM",
    time: "9:15 AM",
  },
  {
    id: "7",
    type: "bot",
    content: "Session started — you're on `feature/auth-flow`. Good, that's aligned with today's priority. I'll keep an eye on things and nudge you if anything drifts.",
    time: "9:16 AM",
  },
  {
    id: "8",
    type: "bot",
    content: "Heads up: your last prompt was about adding a settings page. That's not on the critical path right now. Should I flag this as drift, or are you intentionally switching focus?",
    time: "10:45 AM",
    actions: [
      { label: "Flag as drift — refocus me", variant: "primary" },
      { label: "Intentional — update overview", variant: "secondary" },
    ],
  },
  {
    id: "9",
    type: "user",
    content: "Flag it. You're right, I got distracted.",
    time: "10:47 AM",
  },
  {
    id: "10",
    type: "bot",
    content: "Done. Flagged in Qode, auth prompts re-queued.\n\n→ Next: Email verification timeout handler\n→ After: Rate limiting on login attempts\n\n2 tasks away from completing auth. Let's close this out today.",
    time: "10:47 AM",
  },
];

function ChatBubble({ message }: { message: Message }) {
  if (message.type === "system") {
    return (
      <div className="flex justify-center py-3">
        <span className="text-xs text-muted-foreground bg-surface px-3 py-1 rounded-full border border-border">
          {message.content}
        </span>
      </div>
    );
  }

  const isBot = message.type === "bot";

  return (
    <div className={`flex gap-3 ${isBot ? "" : "flex-row-reverse"} group`}>
      {isBot && (
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0 mt-1">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}

      <div className={`max-w-lg ${isBot ? "" : "text-right"}`}>
        <div
          className={`inline-block px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isBot
              ? "bg-surface border border-border rounded-bl-md text-left"
              : "bg-primary text-white rounded-br-md text-left"
          }`}
        >
          {message.isDigest && message.digestItems ? (
            <div>
              <p className="font-medium mb-3">{message.content}</p>
              <div className="space-y-2">
                {message.digestItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-sm shrink-0">{item.icon}</span>
                    <span className={`text-xs ${item.status === "warning" ? "text-accent font-medium" : "text-muted-foreground"}`}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-line">{message.content}</p>
          )}

          {message.actions && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
              {message.actions.map((action) => (
                <button
                  key={action.label}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    action.variant === "primary"
                      ? "bg-accent text-white hover:bg-orange-600"
                      : "bg-white text-foreground border border-border hover:bg-muted"
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={`flex items-center gap-2 mt-1 ${isBot ? "" : "justify-end"}`}>
          <span className="text-[10px] text-muted-foreground">{message.time}</span>
          {isBot && (
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
              <button className="p-0.5 rounded hover:bg-muted"><ThumbsUp className="w-3 h-3 text-muted-foreground" /></button>
              <button className="p-0.5 rounded hover:bg-muted"><ThumbsDown className="w-3 h-3 text-muted-foreground" /></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    };
    setMessages([...messages, newMsg]);
    setInput("");

    setTimeout(() => {
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: "Let me check that against your overview and get back to you with a recommendation.",
        time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, reply]);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center">
            <Bot className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold">Chat</h1>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            </div>
            <p className="text-xs text-muted-foreground">Thinks with you, not for you — always grounded in the overview</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Calendar className="w-3.5 h-3.5" />
            Digests
          </Button>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="px-6 py-4 border-t border-border bg-white shrink-0">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Talk to your co-founder..."
              rows={1}
              className="w-full px-4 py-3 pr-20 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                <Paperclip className="w-4 h-4" />
              </button>
            </div>
          </div>
          <Button onClick={handleSend} disabled={!input.trim()} className="shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
            <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <Target className="w-3 h-3" /> Ask about priorities
            </button>
            <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Get progress report
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
}
