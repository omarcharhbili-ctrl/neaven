"use client";

import { Logo } from "@/components/Logo";
import { Button } from "@/components/Button";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Plug,
  Sparkles,
  Code2,
  GitBranch,
  Cloud,
  MessageSquare,
  BarChart3,
  Database,
  Zap,
  Calendar,
  Mail,
  Globe,
  ChevronRight,
  Bot,
  Star,
} from "lucide-react";

type OnboardingStep = "welcome" | "connect" | "ready";

type Tool = {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  category: string;
  recommended: boolean;
  connected: boolean;
};

const tools: Tool[] = [
  { id: "claude-code", name: "Claude Code", description: "Monitor coding sessions via MCP", icon: Code2, category: "Coding", recommended: true, connected: false },
  { id: "cursor", name: "Cursor", description: "AI editor session monitoring", icon: Code2, category: "Coding", recommended: true, connected: false },
  { id: "github", name: "GitHub", description: "Repos, PRs, and code activity", icon: GitBranch, category: "Dev", recommended: true, connected: false },
  { id: "vercel", name: "Vercel", description: "Deployments and hosting", icon: Cloud, category: "Deploy", recommended: true, connected: false },
  { id: "supabase", name: "Supabase", description: "Database, auth, and storage", icon: Database, category: "Backend", recommended: true, connected: false },
  { id: "slack", name: "Slack", description: "Team chat and notifications", icon: MessageSquare, category: "Comms", recommended: false, connected: false },
  { id: "stripe", name: "Stripe", description: "Payments and revenue tracking", icon: BarChart3, category: "Revenue", recommended: false, connected: false },
  { id: "linear", name: "Linear", description: "Tasks and project tracking", icon: Zap, category: "PM", recommended: false, connected: false },
  { id: "google-analytics", name: "Google Analytics", description: "Traffic and user analytics", icon: Globe, category: "Analytics", recommended: false, connected: false },
  { id: "google-calendar", name: "Google Calendar", description: "Deadlines and scheduling", icon: Calendar, category: "Schedule", recommended: false, connected: false },
];

export default function OnboardingPage() {
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [connectedTools, setConnectedTools] = useState<Set<string>>(new Set());
  const [projectName, setProjectName] = useState("");

  const toggleTool = (id: string) => {
    const next = new Set(connectedTools);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setConnectedTools(next);
  };

  const recommended = tools.filter(t => t.recommended);
  const others = tools.filter(t => !t.recommended);

  return (
    <div className="min-h-screen bg-raised flex flex-col">
      {/* Minimal header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            {["welcome", "connect", "ready"].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-medium ${
                  step === s ? "bg-accent text-white" :
                  ["welcome", "connect", "ready"].indexOf(step) > i ? "bg-success text-white" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {["welcome", "connect", "ready"].indexOf(step) > i ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                {i < 2 && <div className="w-8 h-px bg-border" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        {step === "welcome" && (
          <div className="max-w-lg w-full text-center animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
              <Bot className="w-7 h-7 text-accent" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Hey, welcome to Neaven</h1>
            <p className="text-muted-foreground text-sm mb-8 max-w-sm mx-auto">
              Let&apos;s get you set up in under a minute. First, what&apos;s your project called?
            </p>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g., InvoiceFlow, MyStartup, Side Project..."
              className="w-full max-w-sm mx-auto px-4 py-3 rounded-xl border border-border text-sm text-center focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              autoFocus
            />
            <div className="mt-8">
              <Button
                onClick={() => setStep("connect")}
                disabled={!projectName.trim()}
                size="lg"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              You can fill in the details later in The Brief
            </p>
          </div>
        )}

        {step === "connect" && (
          <div className="max-w-2xl w-full animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">Connect your tools</h1>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Neaven works best when it can see what you&apos;re working with.
                Connect a few tools now — the more context it has, the more useful it becomes.
              </p>
            </div>

            {/* Recommended */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-accent" />
                <h2 className="text-sm font-semibold">Recommended for builders</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {recommended.map((tool) => {
                  const isConnected = connectedTools.has(tool.id);
                  return (
                    <button
                      key={tool.id}
                      onClick={() => toggleTool(tool.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        isConnected
                          ? "border-accent bg-accent-light"
                          : "border-border hover:border-accent/50 hover:bg-surface"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isConnected ? "bg-accent text-white" : "bg-surface border border-border"
                      }`}>
                        {isConnected ? <Check className="w-4 h-4" /> : <tool.icon className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{tool.name}</p>
                        <p className="text-xs text-muted-foreground">{tool.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Others */}
            <div className="mb-8">
              <h2 className="text-sm font-semibold mb-3 text-muted-foreground">More tools</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {others.map((tool) => {
                  const isConnected = connectedTools.has(tool.id);
                  return (
                    <button
                      key={tool.id}
                      onClick={() => toggleTool(tool.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        isConnected
                          ? "border-accent bg-accent-light"
                          : "border-border hover:border-accent/50 hover:bg-surface"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isConnected ? "bg-accent text-white" : "bg-surface border border-border"
                      }`}>
                        {isConnected ? <Check className="w-4 h-4" /> : <tool.icon className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{tool.name}</p>
                        <p className="text-xs text-muted-foreground">{tool.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep("welcome")}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {connectedTools.size} selected
                </span>
                <Button onClick={() => setStep("ready")} size="lg">
                  {connectedTools.size > 0 ? "Connect & continue" : "Skip for now"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === "ready" && (
          <div className="max-w-lg w-full text-center animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-6">
              <Check className="w-7 h-7 text-success" />
            </div>
            <h1 className="text-2xl font-bold mb-2">You&apos;re all set</h1>
            <p className="text-muted-foreground text-sm mb-4 max-w-sm mx-auto">
              <strong>{projectName}</strong> is ready to go
              {connectedTools.size > 0 && ` with ${connectedTools.size} tool${connectedTools.size > 1 ? "s" : ""} connected`}.
              Your AI co-founder is already learning your context.
            </p>
            <div className="p-4 rounded-xl bg-surface border border-border mb-8 text-left max-w-sm mx-auto">
              <p className="text-xs text-muted-foreground mb-3">Here&apos;s what happens next:</p>
              <div className="space-y-2">
                {[
                  "Your dashboard is populated with data from connected tools",
                  "Open The Brief to tell Neaven what you're building",
                  "Start coding — The Watcher picks up sessions automatically",
                  "Your co-founder sends your first daily briefing tomorrow at 8am",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-xs text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <Link href="/dashboard">
              <Button size="lg">
                Go to dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
