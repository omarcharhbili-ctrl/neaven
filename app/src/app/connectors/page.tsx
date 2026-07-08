"use client";

import { Button } from "@/components/Button";
import {
  Plug,
  Search,
  Check,
  ExternalLink,
  Star,
  Sparkles,
  Zap,
  Cloud,
  Code2,
  BarChart3,
  MessageSquare,
  Mail,
  Calendar,
  Database,
  GitBranch,
  Globe,
  Shield,
  Settings,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";

type Connector = {
  id: string;
  name: string;
  description: string;
  category: string;
  connected: boolean;
  suggested: boolean;
  protocol: "MCP" | "API" | "iPaaS" | "OAuth";
  icon: React.ElementType;
};

const connectors: Connector[] = [
  // Dev tools
  { id: "claude-code", name: "Claude Code", description: "AI coding agent via MCP — prompt monitoring and agentic loops", category: "Development", connected: true, suggested: true, protocol: "MCP", icon: Code2 },
  { id: "cursor", name: "Cursor", description: "AI-powered code editor — session monitoring via MCP", category: "Development", connected: false, suggested: true, protocol: "MCP", icon: Code2 },
  { id: "windsurf", name: "Windsurf", description: "AI coding agent — prompt and session integration", category: "Development", connected: false, suggested: false, protocol: "MCP", icon: Code2 },
  { id: "github", name: "GitHub", description: "Repos, PRs, issues, and deployments", category: "Development", connected: true, suggested: true, protocol: "OAuth", icon: GitBranch },
  { id: "vercel", name: "Vercel", description: "Deployment monitoring, preview URLs, and analytics", category: "Deployment", connected: true, suggested: true, protocol: "API", icon: Cloud },
  // Payments (analytics is built-in)
  { id: "stripe", name: "Stripe", description: "Revenue attribution — see which channels bring paying customers", category: "Payments", connected: false, suggested: true, protocol: "API", icon: BarChart3 },
  { id: "lemonsqueezy", name: "LemonSqueezy", description: "Subscription revenue and payment events", category: "Payments", connected: false, suggested: false, protocol: "API", icon: BarChart3 },
  { id: "shopify", name: "Shopify", description: "E-commerce revenue and order tracking", category: "Payments", connected: false, suggested: false, protocol: "API", icon: BarChart3 },
  // Communication
  { id: "slack", name: "Slack", description: "Team messages, notifications, and co-founder chat", category: "Communication", connected: true, suggested: true, protocol: "OAuth", icon: MessageSquare },
  { id: "discord", name: "Discord", description: "Community and support channel integration", category: "Communication", connected: false, suggested: false, protocol: "API", icon: MessageSquare },
  { id: "gmail", name: "Gmail", description: "Email inbox monitoring for support and feedback", category: "Communication", connected: false, suggested: false, protocol: "OAuth", icon: Mail },
  // Project management
  { id: "linear", name: "Linear", description: "Tasks, sprints, and project tracking", category: "Project Management", connected: false, suggested: true, protocol: "API", icon: Zap },
  { id: "notion", name: "Notion", description: "Docs, wikis, and knowledge base", category: "Project Management", connected: false, suggested: false, protocol: "API", icon: Database },
  // Infrastructure
  { id: "supabase", name: "Supabase", description: "Database, auth, and storage monitoring", category: "Infrastructure", connected: true, suggested: true, protocol: "API", icon: Database },
  { id: "aws", name: "AWS", description: "Cloud infrastructure monitoring and alerts", category: "Infrastructure", connected: false, suggested: false, protocol: "API", icon: Cloud },
  // Calendar
  { id: "google-calendar", name: "Google Calendar", description: "Schedule, deadlines, and time blocking", category: "Productivity", connected: false, suggested: false, protocol: "OAuth", icon: Calendar },
];

const categories = ["All", "Development", "Deployment", "Payments", "Communication", "Project Management", "Infrastructure", "Productivity"];

export default function ConnectorsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [showSuggested, setShowSuggested] = useState(false);

  const filtered = connectors.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || c.category === category;
    const matchesSuggested = !showSuggested || c.suggested;
    return matchesSearch && matchesCategory && matchesSuggested;
  });

  const connectedCount = connectors.filter(c => c.connected).length;
  const suggestedNotConnected = connectors.filter(c => c.suggested && !c.connected);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Plug className="w-5 h-5 text-accent" />
            Connectors
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connect your tools so Neaven can see your full picture. Works via MCP, API, OAuth, or iPaaS.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-border text-xs text-muted-foreground">
          <Check className="w-3.5 h-3.5 text-success" />
          {connectedCount} connected
        </div>
      </div>

      {/* Suggested banner */}
      {suggestedNotConnected.length > 0 && (
        <div className="p-4 rounded-xl bg-accent-light border border-orange-200 mb-6">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Suggested for your stack</p>
              <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                Based on your brief, connecting these tools will unlock more insights and automation.
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedNotConnected.map((c) => (
                  <button
                    key={c.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-orange-200 text-sm hover:border-accent transition-colors"
                  >
                    <c.icon className="w-3.5 h-3.5 text-muted-foreground" />
                    {c.name}
                    <ArrowRight className="w-3 h-3 text-accent" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search connectors..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                category === cat
                  ? "bg-primary text-white"
                  : "bg-surface border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Connector grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((connector) => (
          <div
            key={connector.id}
            className={`p-4 rounded-xl border bg-white hover:shadow-sm transition-all group ${
              connector.connected ? "border-green-200 bg-green-50/30" : "border-border"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                connector.connected ? "bg-green-100" : "bg-surface border border-border"
              }`}>
                <connector.icon className={`w-5 h-5 ${connector.connected ? "text-green-600" : "text-muted-foreground"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">{connector.name}</h3>
                  {connector.suggested && !connector.connected && (
                    <span className="text-[10px] text-accent font-medium px-1.5 py-0.5 rounded-full bg-accent-light border border-orange-200">
                      Suggested
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded-full bg-surface border border-border">
                    {connector.protocol}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{connector.description}</p>
              </div>
              <div className="shrink-0">
                {connector.connected ? (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs text-success font-medium">
                      <Check className="w-3.5 h-3.5" /> Connected
                    </span>
                    <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <Button variant="secondary" size="sm">
                    Connect
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">No connectors match your search.</p>
        </div>
      )}

      {/* Request connector */}
      <div className="mt-8 p-4 rounded-xl border border-dashed border-border text-center">
        <p className="text-sm text-muted-foreground">
          Don&apos;t see the tool you need?{" "}
          <button className="text-accent hover:underline font-medium">Request a connector</button>
        </p>
      </div>
    </div>
  );
}
