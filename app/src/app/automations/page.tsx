"use client";

import { Button } from "@/components/Button";
import {
  Bot,
  Plus,
  Play,
  Pause,
  Settings,
  MoreHorizontal,
  ChevronRight,
  Zap,
  MessageSquare,
  Mail,
  GitBranch,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Send,
  ArrowRight,
  Workflow,
  PenLine,
  Sparkles,
  X,
  GripVertical,
  Plug,
} from "lucide-react";
import { useState } from "react";

type Automation = {
  id: string;
  name: string;
  description: string;
  status: "active" | "paused" | "draft";
  type: "system" | "custom";
  trigger: string;
  lastRun?: string;
  runs: number;
  authority: "full" | "observe-only";
};

const automations: Automation[] = [
  {
    id: "1",
    name: "Deploy Watcher",
    description: "Monitors Vercel deployments and notifies on failures. Auto-rolls back if production errors spike.",
    status: "active",
    type: "custom",
    trigger: "On every deploy",
    lastRun: "2 hours ago",
    runs: 48,
    authority: "full",
  },
  {
    id: "2",
    name: "Daily Standup Digest",
    description: "Compiles what was done yesterday from git commits and Linear tasks, posts a summary to Slack at 9am.",
    status: "active",
    type: "custom",
    trigger: "Daily at 9:00 AM",
    lastRun: "Today 9:00 AM",
    runs: 21,
    authority: "observe-only",
  },
  {
    id: "3",
    name: "PR Review Assistant",
    description: "Reviews pull requests for code quality, checks against the overview for relevance, and leaves comments.",
    status: "active",
    type: "system",
    trigger: "On PR opened",
    lastRun: "Yesterday",
    runs: 15,
    authority: "full",
  },
  {
    id: "4",
    name: "Customer Feedback Triage",
    description: "Monitors support inbox, categorizes feedback by feature area, flags urgent bugs to Linear.",
    status: "paused",
    type: "custom",
    trigger: "On new email",
    lastRun: "3 days ago",
    runs: 92,
    authority: "observe-only",
  },
  {
    id: "5",
    name: "Weekly Metrics Report",
    description: "Pulls revenue from Stripe, users from analytics, and generates a weekly report with insights.",
    status: "draft",
    type: "custom",
    trigger: "Weekly on Monday",
    runs: 0,
    authority: "observe-only",
  },
];

function AutomationCard({ automation }: { automation: Automation }) {
  const statusConfig = {
    active: { label: "Active", dot: "bg-green-500", badge: "text-green-700 bg-green-50 border-green-200" },
    paused: { label: "Paused", dot: "bg-yellow-500", badge: "text-yellow-700 bg-yellow-50 border-yellow-200" },
    draft: { label: "Draft", dot: "bg-muted-foreground", badge: "text-muted-foreground bg-muted border-border" },
  };
  const s = statusConfig[automation.status];

  return (
    <div className="p-5 rounded-xl border border-border bg-white hover:shadow-sm transition-shadow group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            automation.type === "system" ? "bg-primary text-white" : "bg-accent-light border border-orange-200"
          }`}>
            <Bot className={`w-5 h-5 ${automation.type === "system" ? "text-white" : "text-accent"}`} />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{automation.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${s.badge}`}>
                {s.label}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {automation.type === "system" ? "System" : "Custom"}
              </span>
              <span className="text-[10px] text-muted-foreground">·</span>
              <span className="text-[10px] text-muted-foreground">
                {automation.authority === "full" ? "Full control" : "Observe only"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {automation.status === "active" ? (
            <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground" title="Pause">
              <Pause className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground" title="Start">
              <Play className="w-3.5 h-3.5" />
            </button>
          )}
          <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed mb-4">{automation.description}</p>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {automation.trigger}</span>
          <span className="flex items-center gap-1"><Play className="w-3 h-3" /> {automation.runs} runs</span>
        </div>
        {automation.lastRun && (
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {automation.lastRun}</span>
        )}
      </div>
    </div>
  );
}

function CreateAutomationModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"describe" | "preview">("describe");
  const [description, setDescription] = useState("");

  const sampleNodes = [
    { id: "trigger", label: "Trigger: On deploy", type: "trigger" },
    { id: "check", label: "Check deploy status", type: "action" },
    { id: "condition", label: "If failed?", type: "condition" },
    { id: "notify", label: "Send Slack alert", type: "action" },
    { id: "rollback", label: "Rollback deploy", type: "action" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <h2 className="font-semibold">Create automation</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === "describe" && (
          <div className="p-6">
            <p className="text-sm text-muted-foreground mb-4">
              Describe what you want this automation to do in plain text. Neaven will build the workflow for you.
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Watch my Vercel deployments. If a deploy fails, send me a Slack message with the error details and automatically roll back to the last working version."
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
            />
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">Try one of these:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Monitor deploys and alert on failure",
                  "Send daily standup from git activity",
                  "Triage incoming support emails",
                  "Generate weekly metrics report",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setDescription(suggestion)}
                    className="px-3 py-1.5 rounded-full bg-surface border border-border text-xs text-muted-foreground hover:border-accent hover:text-foreground transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={() => setStep("preview")} disabled={!description.trim()}>
                Generate workflow
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <p className="text-sm font-medium">Workflow generated from your description</p>
            </div>

            {/* Node visualization */}
            <div className="rounded-xl bg-surface border border-border p-6 mb-6">
              <div className="flex flex-col items-center gap-2">
                {sampleNodes.map((node, i) => (
                  <div key={node.id}>
                    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border bg-white cursor-grab hover:shadow-sm transition-shadow ${
                      node.type === "trigger" ? "border-blue-200 bg-blue-50" :
                      node.type === "condition" ? "border-yellow-200 bg-yellow-50" :
                      "border-border"
                    }`}>
                      <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm">{node.label}</span>
                      <button className="p-0.5 rounded hover:bg-muted ml-2">
                        <PenLine className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                    {i < sampleNodes.length - 1 && (
                      <div className="flex justify-center">
                        <div className="w-px h-4 bg-border" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center mt-4">
                Drag to reorder · Click the pencil to edit any step · Add steps with +
              </p>
            </div>

            <div className="rounded-lg bg-accent-light border border-orange-200 p-3 mb-6">
              <p className="text-xs text-accent">
                <Plug className="w-3 h-3 inline mr-1" />
                This automation needs: <strong>Vercel</strong> and <strong>Slack</strong> connectors.
                {" "}<a href="/connectors" className="underline">Connect them →</a>
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-1.5">Co-founder authority over this automation</label>
              <select className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/20">
                <option>Full control — co-founder can direct, pause, and override</option>
                <option>Observe only — co-founder can see activity but not act on it</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">Controls how much your AI co-founder can influence this automation.</p>
            </div>

            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setStep("describe")}>
                ← Back to description
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={onClose}>Save as draft</Button>
                <Button onClick={onClose}>
                  <Play className="w-3.5 h-3.5" />
                  Activate automation
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AutomationsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "paused" | "draft">("all");

  const filtered = filter === "all" ? automations : automations.filter((a) => a.status === filter);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="w-5 h-5 text-accent" />
            Automations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create automations that work for you 24/7. Describe what you want in plain text — tweak the details if you want to.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" />
          Create automation
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl border border-border bg-white">
          <p className="text-2xl font-bold">{automations.filter(a => a.status === "active").length}</p>
          <p className="text-xs text-muted-foreground">Active automations</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-white">
          <p className="text-2xl font-bold">{automations.reduce((acc, a) => acc + a.runs, 0)}</p>
          <p className="text-xs text-muted-foreground">Total runs</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-white">
          <p className="text-2xl font-bold">3</p>
          <p className="text-xs text-muted-foreground">Connectors used</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1 mb-6 border-b border-border">
        {[
          { id: "all" as const, label: "All", count: automations.length },
          { id: "active" as const, label: "Active", count: automations.filter(a => a.status === "active").length },
          { id: "paused" as const, label: "Paused", count: automations.filter(a => a.status === "paused").length },
          { id: "draft" as const, label: "Drafts", count: automations.filter(a => a.status === "draft").length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              filter === tab.id
                ? "border-accent text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs text-muted-foreground">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Automation list */}
      <div className="space-y-3">
        {filtered.map((automation) => (
          <AutomationCard key={automation.id} automation={automation} />
        ))}
      </div>

      {showCreate && <CreateAutomationModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
