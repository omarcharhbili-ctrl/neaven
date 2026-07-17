"use client";

import { Button } from "@/components/Button";
import {
  Bot,
  Eye,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  Target,
  Zap,
  BarChart3,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

function StatCard({ label, value, sub, trend, icon: Icon }: {
  label: string;
  value: string;
  sub: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ElementType;
}) {
  return (
    <div className="p-5 rounded-xl border border-border bg-white hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        {trend === "up" && (
          <span className="text-xs text-success flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" /> +12%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}

function CofounderInsight({ priority, title, description, action, actionHref }: {
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  action: string;
  actionHref: string;
}) {
  const colors = {
    high: "bg-orange-50 border-orange-200",
    medium: "bg-blue-50 border-blue-200",
    low: "bg-surface border-border",
  };
  const badges = {
    high: "bg-accent text-white",
    medium: "bg-blue-500 text-white",
    low: "bg-muted text-muted-foreground",
  };

  return (
    <div className={`p-4 rounded-xl border ${colors[priority]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center shrink-0 mt-0.5">
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded ${badges[priority]}`}>
                {priority}
              </span>
            </div>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
          </div>
        </div>
        <Link href={actionHref}>
          <Button variant="ghost" size="sm" className="shrink-0 text-xs">
            {action}
            <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

function ActivityItem({ time, text, type }: {
  time: string;
  text: string;
  type: "qode" | "cofounder" | "system";
}) {
  const icons = {
    qode: <Eye className="w-3.5 h-3.5 text-purple-500" />,
    cofounder: <Bot className="w-3.5 h-3.5 text-accent" />,
    system: <Zap className="w-3.5 h-3.5 text-muted-foreground" />,
  };

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className="w-7 h-7 rounded-full bg-surface flex items-center justify-center shrink-0 mt-0.5">
        {icons[type]}
      </div>
      <div className="flex-1">
        <p className="text-sm">{text}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{time}</p>
      </div>
    </div>
  );
}

function TaskItem({ title, status, priority }: {
  title: string;
  status: "todo" | "in-progress" | "done";
  priority: "high" | "medium" | "low";
}) {
  const statusColors = {
    todo: "bg-muted text-muted-foreground",
    "in-progress": "bg-blue-100 text-blue-700",
    done: "bg-green-100 text-green-700",
  };
  const statusLabels = {
    todo: "To do",
    "in-progress": "In progress",
    done: "Done",
  };
  const priorityDots = {
    high: "bg-error",
    medium: "bg-warning",
    low: "bg-muted-foreground",
  };

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
      <div className={`w-1.5 h-1.5 rounded-full ${priorityDots[priority]}`} />
      <p className="text-sm flex-1">{title}</p>
      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColors[status]}`}>
        {statusLabels[status]}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Good morning, Omar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here&apos;s what to focus on today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-200">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-dot" />
            On track
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            June 24, 2026
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Target} label="Sprint progress" value="68%" sub="Day 5 of 10" trend="up" />
        <StatCard icon={CheckCircle2} label="Tasks completed" value="12/18" sub="4 in review" />
        <StatCard icon={Clock} label="Days to deadline" value="36" sub="July 30, 2026" />
        <StatCard icon={BarChart3} label="Focus score" value="8.2" sub="Above average" trend="up" />
      </div>

      {/* Co-founder insights */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bot className="w-5 h-5 text-accent" />
            Co-founder insights
          </h2>
          <Link href="/chat">
            <Button variant="ghost" size="sm">
              Open chat
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
        <div className="space-y-3">
          <CofounderInsight
            priority="high"
            title="Finish auth flow before switching tasks"
            description="Your overview says auth is the launch blocker. I noticed you started on the settings page — that's not on the critical path. Suggest: finish the login/signup flow first."
            action="View overview"
            actionHref="/overview"
          />
          <CofounderInsight
            priority="medium"
            title="3 prompts drifted from the overview yesterday"
            description="During your last coding session, 3 prompts were unrelated to any roadmap item. Qode flagged them — want to review?"
            action="Review"
            actionHref="/qode"
          />
          <CofounderInsight
            priority="low"
            title="Weekly progress update ready"
            description="You completed 8 tasks this week, refactored the API layer, and are on pace for the July 30 deadline. Full report available."
            action="View report"
            actionHref="/chat"
          />
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks */}
        <div className="rounded-xl border border-border bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Today&apos;s tasks</h3>
            <span className="text-xs text-muted-foreground">From your overview</span>
          </div>
          <div>
            <TaskItem title="Complete login page UI" status="done" priority="high" />
            <TaskItem title="Implement auth API routes" status="in-progress" priority="high" />
            <TaskItem title="Add email verification flow" status="todo" priority="high" />
            <TaskItem title="Write auth unit tests" status="todo" priority="medium" />
            <TaskItem title="Update API documentation" status="todo" priority="low" />
          </div>
        </div>

        {/* Activity feed */}
        <div className="rounded-xl border border-border bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent activity</h3>
            <span className="text-xs text-muted-foreground">Last 24h</span>
          </div>
          <div>
            <ActivityItem
              type="cofounder"
              text="Morning briefing sent: 3 priorities for today"
              time="8:00 AM"
            />
            <ActivityItem
              type="qode"
              text="Coding session detected — monitoring started"
              time="9:15 AM"
            />
            <ActivityItem
              type="qode"
              text="Prompt refined: added context from overview before send"
              time="9:23 AM"
            />
            <ActivityItem
              type="qode"
              text="Drift alert: prompt unrelated to roadmap"
              time="10:45 AM"
            />
            <ActivityItem
              type="cofounder"
              text="Mid-day check: 'You're 2 tasks ahead of yesterday's pace'"
              time="12:30 PM"
            />
            <ActivityItem
              type="system"
              text="Overview updated: deadline confirmed July 30"
              time="Yesterday"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
