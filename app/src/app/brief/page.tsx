"use client";

import { Button } from "@/components/Button";
import {
  Brain,
  Edit3,
  Target,
  Users,
  Calendar,
  Wrench,
  Rocket,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  BarChart3,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import { useState } from "react";

function BriefSection({ icon: Icon, title, children, editable = true }: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  editable?: boolean;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="p-5 rounded-xl border border-border bg-raised group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-accent" />
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        {editable && (
          <button
            onClick={() => setEditing(!editing)}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function OKRItem({ objective, keyResults, progress }: {
  objective: string;
  keyResults: { text: string; progress: number; }[];
  progress: number;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-surface transition-colors text-left"
      >
        {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
        <div className="flex-1">
          <p className="text-sm font-medium">{objective}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs text-muted-foreground w-8 text-right">{progress}%</span>
        </div>
      </button>
      {expanded && (
        <div className="px-3 pb-3 pl-10 space-y-2">
          {keyResults.map((kr) => (
            <div key={kr.text} className="flex items-center gap-3">
              <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${kr.progress >= 100 ? "bg-success" : "bg-info/70"}`}
                  style={{ width: `${Math.min(kr.progress, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground flex-1">{kr.text}</p>
              <span className="text-xs text-muted-foreground">{kr.progress}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BriefPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-5 h-5 text-accent" />
            <h1 className="text-2xl font-bold">The Brief</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Your project&apos;s source of truth. Everything Neaven does checks against this.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Clock className="w-3.5 h-3.5" />
            History
          </Button>
          <Button size="sm">
            <Edit3 className="w-3.5 h-3.5" />
            Edit brief
          </Button>
        </div>
      </div>

      {/* Brief health */}
      <div className="p-4 rounded-xl bg-green-50 border border-green-200 mb-6 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
        <div>
          <p className="text-sm font-medium text-green-900">Brief is healthy</p>
          <p className="text-xs text-green-700">Last updated 2 days ago. All sections filled. No conflicts detected.</p>
        </div>
      </div>

      {/* Brief sections */}
      <div className="space-y-4 mb-8">
        <BriefSection icon={Rocket} title="What you're building">
          <p className="text-sm text-muted-foreground leading-relaxed">
            A SaaS platform that helps freelancers manage invoicing and contracts automatically.
            The core value prop is removing the manual work of creating, sending, and tracking invoices
            while keeping everything legally compliant with auto-generated contract templates.
          </p>
        </BriefSection>

        <BriefSection icon={Users} title="Who it's for">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Freelance designers and developers who currently use spreadsheets or basic tools for invoicing.
            Primary persona: solo freelancer making $50-200k/year, juggling 3-8 clients, spending 5+ hours/month
            on admin work they hate.
          </p>
        </BriefSection>

        <BriefSection icon={Target} title="Key goals">
          <div className="space-y-2">
            {[
              { goal: "Launch MVP by July 30, 2026", status: "on-track" },
              { goal: "Get 50 beta users by August 15", status: "on-track" },
              { goal: "Validate automated invoicing saves time", status: "pending" },
              { goal: "Achieve 60% week-2 retention", status: "pending" },
            ].map((g) => (
              <div key={g.goal} className="flex items-center gap-2">
                {g.status === "on-track" ? (
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <p className="text-sm text-muted-foreground">{g.goal}</p>
              </div>
            ))}
          </div>
        </BriefSection>

        <BriefSection icon={Calendar} title="Timeline & deadlines">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <div>
                  <p className="text-sm font-medium">MVP Launch</p>
                  <p className="text-xs text-muted-foreground">Auth, invoicing, dashboard</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">July 30</p>
                <p className="text-xs text-muted-foreground">36 days left</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-info-soft0" />
                <div>
                  <p className="text-sm font-medium">Public Launch</p>
                  <p className="text-xs text-muted-foreground">Marketing, onboarding, pricing</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">Sept 15</p>
                <p className="text-xs text-muted-foreground">83 days left</p>
              </div>
            </div>
          </div>
        </BriefSection>

        <BriefSection icon={Wrench} title="Tools & stack">
          <div className="flex flex-wrap gap-2">
            {[
              "Claude Code",
              "Next.js",
              "Supabase",
              "Tailwind CSS",
              "GitHub",
              "Vercel",
              "Linear",
              "Figma",
            ].map((tool) => (
              <span key={tool} className="px-3 py-1 rounded-full bg-surface border border-border text-xs font-medium text-muted-foreground">
                {tool}
              </span>
            ))}
          </div>
        </BriefSection>
      </div>

      {/* OKRs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-accent" />
            Objectives & Key Results
          </h2>
          <Button variant="ghost" size="sm">
            <Plus className="w-3.5 h-3.5" />
            Add objective
          </Button>
        </div>
        <div className="space-y-3">
          <OKRItem
            objective="Ship MVP with core invoicing features"
            progress={65}
            keyResults={[
              { text: "Complete auth flow (login, signup, email verification)", progress: 80 },
              { text: "Build invoice creation & sending UI", progress: 60 },
              { text: "Implement payment tracking dashboard", progress: 40 },
              { text: "Deploy to production on Vercel", progress: 0 },
            ]}
          />
          <OKRItem
            objective="Acquire 50 beta users"
            progress={20}
            keyResults={[
              { text: "Set up landing page with waitlist", progress: 100 },
              { text: "Launch on 3 communities (IndieHackers, HN, Twitter)", progress: 0 },
              { text: "Get 50 signups with email confirmation", progress: 0 },
            ]}
          />
          <OKRItem
            objective="Validate core value proposition"
            progress={10}
            keyResults={[
              { text: "5 user interviews completed", progress: 40 },
              { text: "Measure time saved vs manual invoicing", progress: 0 },
              { text: "Achieve 60% week-2 retention", progress: 0 },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
