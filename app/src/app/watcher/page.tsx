"use client";

import { Button } from "@/components/Button";
import {
  Eye,
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Clock,
  Code2,
  GitBranch,
  Zap,
  RefreshCw,
  Filter,
  MoreHorizontal,
  ChevronDown,
  Bot,
  FileCode,
  Terminal,
  CircleDot,
} from "lucide-react";
import { useState } from "react";

type SessionStatus = "active" | "paused" | "completed";
type AlertType = "drift" | "refined" | "approved" | "loop";

function SessionCard({ agent, branch, duration, prompts, status, alerts }: {
  agent: string;
  branch: string;
  duration: string;
  prompts: number;
  status: SessionStatus;
  alerts: number;
}) {
  const statusConfig = {
    active: { label: "Live", color: "bg-green-500", textColor: "text-green-700 bg-green-50 border-green-200" },
    paused: { label: "Paused", color: "bg-yellow-500", textColor: "text-yellow-700 bg-yellow-50 border-yellow-200" },
    completed: { label: "Completed", color: "bg-muted-foreground", textColor: "text-muted-foreground bg-muted border-border" },
  };

  const s = statusConfig[status];

  return (
    <div className="p-4 rounded-xl border border-border bg-raised hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${s.color} ${status === "active" ? "animate-pulse-dot" : ""}`} />
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${s.textColor}`}>{s.label}</span>
        </div>
        <button className="p-1 rounded hover:bg-muted">
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <Terminal className="w-4 h-4 text-muted-foreground" />
        <p className="text-sm font-medium">{agent}</p>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" /> {branch}</span>
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {duration}</span>
        <span className="flex items-center gap-1"><Code2 className="w-3 h-3" /> {prompts} prompts</span>
        {alerts > 0 && (
          <span className="flex items-center gap-1 text-accent"><AlertTriangle className="w-3 h-3" /> {alerts} alerts</span>
        )}
      </div>
    </div>
  );
}

function PromptEvent({ type, time, prompt, refinedPrompt, reason }: {
  type: AlertType;
  time: string;
  prompt: string;
  refinedPrompt?: string;
  reason: string;
}) {
  const config = {
    drift: { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: "text-accent bg-accent-soft border-orange-200", label: "Drift detected" },
    refined: { icon: <Zap className="w-3.5 h-3.5" />, color: "text-info bg-info-soft border-blue-200", label: "Prompt refined" },
    approved: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "text-success bg-green-50 border-green-200", label: "On track" },
    loop: { icon: <RefreshCw className="w-3.5 h-3.5" />, color: "text-purple-600 bg-purple-50 border-purple-200", label: "Agentic loop" },
  };

  const c = config[type];

  return (
    <div className="flex gap-3 py-4 border-b border-border last:border-0">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${c.color}`}>
        {c.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded border ${c.color}`}>
            {c.label}
          </span>
          <span className="text-xs text-muted-foreground">{time}</span>
        </div>
        <div className="mt-2 p-3 rounded-lg bg-surface border border-border">
          <p className="text-xs text-muted-foreground mb-1">Original prompt:</p>
          <p className="text-sm font-mono">{prompt}</p>
        </div>
        {refinedPrompt && (
          <div className="mt-2 p-3 rounded-lg bg-info-soft border border-blue-200">
            <p className="text-xs text-info mb-1">Refined prompt:</p>
            <p className="text-sm font-mono">{refinedPrompt}</p>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          <Bot className="w-3 h-3 inline mr-1" />
          {reason}
        </p>
      </div>
    </div>
  );
}

export default function WatcherPage() {
  const [activeTab, setActiveTab] = useState<"sessions" | "timeline">("timeline");

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-5 h-5 text-purple-500" />
            <h1 className="text-2xl font-bold">The Watcher</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Monitors your coding sessions, refines prompts, and flags drift from the brief.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-200">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-dot" />
            Watching
          </div>
          <Button variant="secondary" size="sm">
            <Pause className="w-3.5 h-3.5" />
            Pause
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Sessions today", value: "3", icon: Terminal },
          { label: "Prompts watched", value: "47", icon: Code2 },
          { label: "Prompts refined", value: "8", icon: Zap },
          { label: "Drift alerts", value: "3", icon: AlertTriangle },
        ].map((stat) => (
          <div key={stat.label} className="p-4 rounded-xl border border-border bg-raised">
            <stat.icon className="w-4 h-4 text-muted-foreground mb-2" />
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-border">
        {[
          { id: "timeline" as const, label: "Prompt Timeline" },
          { id: "sessions" as const, label: "Sessions" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-accent text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "sessions" && (
        <div className="space-y-3">
          <SessionCard
            agent="Claude Code"
            branch="feature/auth-flow"
            duration="2h 15m"
            prompts={23}
            status="active"
            alerts={2}
          />
          <SessionCard
            agent="Cursor"
            branch="feature/invoice-ui"
            duration="1h 30m"
            prompts={15}
            status="completed"
            alerts={1}
          />
          <SessionCard
            agent="Claude Code"
            branch="fix/api-routes"
            duration="45m"
            prompts={9}
            status="completed"
            alerts={0}
          />
        </div>
      )}

      {activeTab === "timeline" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">Showing events from today&apos;s sessions</p>
            <Button variant="ghost" size="sm">
              <Filter className="w-3.5 h-3.5" />
              Filter
            </Button>
          </div>
          <div className="rounded-xl border border-border bg-raised p-4">
            <PromptEvent
              type="drift"
              time="10:45 AM"
              prompt="Add a dark mode toggle to the settings page"
              reason="This feature isn't on your roadmap and your brief doesn't mention settings UI. The critical path is auth flow. Want to shelve this and refocus?"
            />
            <PromptEvent
              type="refined"
              time="9:23 AM"
              prompt="Create a login page"
              refinedPrompt="Create a login page with email/password and OAuth (Google, GitHub) following the auth flow spec from the brief. Use Supabase Auth. Include error states for invalid credentials and rate limiting."
              reason="Added context from your brief — tech stack (Supabase), OAuth providers, and error handling requirements."
            />
            <PromptEvent
              type="approved"
              time="9:15 AM"
              prompt="Set up Supabase auth client with environment variables and create the auth context provider"
              reason="This prompt is well-scoped and directly maps to the 'Implement auth API routes' task in your brief."
            />
            <PromptEvent
              type="loop"
              time="Yesterday 4:30 PM"
              prompt="Fix the TypeScript errors in the API route handlers"
              reason="Ran 3 iterations of prompt → code → typecheck → fix. All TypeScript errors resolved after iteration 3."
            />
            <PromptEvent
              type="drift"
              time="Yesterday 2:15 PM"
              prompt="Let's add animation to the landing page hero section"
              reason="Landing page polish isn't in your current sprint. Your brief has auth and core invoicing as the focus. Flagged for later."
            />
          </div>
        </div>
      )}
    </div>
  );
}
