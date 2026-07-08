"use client";

import { Logo } from "@/components/Logo";
import { Button } from "@/components/Button";
import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Eye,
  MessageSquare,
  Zap,
  GitBranch,
  Target,
  Clock,
  CheckCircle2,
  Star,
  Users,
  Code2,
  BarChart3,
  Bot,
  Layers,
  Sparkles,
  Play,
  Plug,
  Workflow,
} from "lucide-react";

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/">
            <Logo />
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it works</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">
              Get started free
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <div className="animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-light border border-orange-200 text-sm text-accent font-medium mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            Now in early access
          </div>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.1] animate-fade-in stagger-1">
          Your AI
          <br />
          <span className="relative inline-block">
            <span className="relative z-10">co-founder.</span>
            <span className="absolute bottom-2 left-0 right-0 h-3 bg-accent/20 rounded-sm -z-0" />
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in stagger-2">
          Neaven holds your project context, watches your coding sessions, tracks your metrics,
          and thinks alongside you. The AI layer that knows both your roadmap and your repo.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in stagger-3">
          <Link href="/signup">
            <Button size="lg" className="text-base">
              Start building with Neaven
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Button variant="secondary" size="lg" className="text-base">
            <Play className="w-4 h-4" />
            Watch demo
          </Button>
        </div>

        <p className="mt-4 text-xs text-muted-foreground animate-fade-in stagger-4">
          Free to start &middot; No credit card required
        </p>
      </div>
    </section>
  );
}

function AppPreview() {
  return (
    <section className="px-6 pb-20">
      <div className="max-w-5xl mx-auto">
        <div className="relative rounded-xl border border-border bg-white shadow-2xl shadow-black/5 overflow-hidden animate-slide-up stagger-4">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="px-4 py-1 rounded-md bg-muted text-xs text-muted-foreground">
                app.neaven.io/dashboard
              </div>
            </div>
          </div>

          <div className="flex h-[500px]">
            <div className="w-56 border-r border-border bg-surface p-4 flex flex-col gap-1 shrink-0 hidden sm:flex">
              <div className="flex items-center gap-2 px-3 py-2 mb-4">
                <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">N</span>
                </div>
                <span className="text-sm font-semibold">neaven</span>
              </div>
              {[
                { icon: "◉", label: "Dashboard", active: true },
                { icon: "◎", label: "The Brief" },
                { icon: "◈", label: "The Watcher" },
                { icon: "◇", label: "Co-founder" },
                { icon: "▣", label: "Analytics" },
                { icon: "⬡", label: "Agents" },
                { icon: "⊕", label: "Connectors" },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm ${
                    item.active
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span className="text-xs">{item.icon}</span>
                  {item.label}
                </div>
              ))}
            </div>

            <div className="flex-1 p-6 overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold">Good morning, Omar</h3>
                  <p className="text-sm text-muted-foreground">Here&apos;s what to focus on today.</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-dot" />
                  On track
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
                {[
                  { label: "MRR", value: "$2,450", sub: "+18%" },
                  { label: "Users", value: "847", sub: "+124" },
                  { label: "Sprint", value: "68%", sub: "Day 5/10" },
                  { label: "Deadline", value: "36d", sub: "Jul 30" },
                ].map((stat) => (
                  <div key={stat.label} className="p-3 rounded-xl border border-border bg-white">
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-success">{stat.sub}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-accent-light border border-orange-200">
                  <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Finish auth flow before switching tasks</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Auth is your launch blocker. The settings page isn&apos;t on the critical path right now.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-surface border border-border">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Watcher flagged 3 off-roadmap prompts</p>
                    <p className="text-xs text-muted-foreground mt-0.5">During yesterday&apos;s session, 3 prompts didn&apos;t match any brief item.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LogoCloud() {
  return (
    <section className="py-12 border-y border-border bg-surface">
      <div className="max-w-5xl mx-auto px-6">
        <p className="text-center text-xs text-muted-foreground uppercase tracking-wider mb-6">
          Connects with your existing tools
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-40">
          {["Claude Code", "Cursor", "Windsurf", "GitHub", "Vercel", "Supabase", "Slack", "Stripe", "Linear", "Notion"].map((tool) => (
            <span key={tool} className="text-sm font-medium text-foreground">{tool}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      icon: <Brain className="w-5 h-5" />,
      label: "The Brief",
      title: "Your project's source of truth.",
      description: "A conversation — not a form — captures what you're building, your goals, and your deadline. Everything else checks against this.",
      features: ["Natural onboarding", "OKR-to-task cascade", "Drift detection", "Living document"],
      color: "bg-blue-50 text-blue-600 border-blue-200",
    },
    {
      icon: <Eye className="w-5 h-5" />,
      label: "The Watcher",
      title: "Your coding session supervisor.",
      description: "Plugs into your coding agent via MCP. Reads prompts, flags drift, refines bad prompts, and runs agentic loops automatically.",
      features: ["Real-time monitoring", "Prompt refinement", "Drift alerts", "Agentic loops"],
      color: "bg-purple-50 text-purple-600 border-purple-200",
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      label: "Co-founder",
      title: "Your AI thinking partner.",
      description: "Not a dashboard you forget to check. A conversational co-founder that gives you morning briefings, mid-session nudges, and daily recaps.",
      features: ["Morning priorities", "Real-time course corrections", "Daily progress recaps", "Slack-like interface"],
      color: "bg-orange-50 text-orange-600 border-orange-200",
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      label: "Analytics",
      title: "Revenue-first analytics, built in.",
      description: "Add one script tag. Know which channels bring paying customers — not just visitors. Revenue attribution, funnels, live visitors, all without a third-party tool.",
      features: ["Revenue per visitor", "Channel attribution", "Funnels & goals", "Live visitor feed"],
      color: "bg-green-50 text-green-600 border-green-200",
    },
    {
      icon: <Bot className="w-5 h-5" />,
      label: "Agents",
      title: "Build automations with plain text.",
      description: "Describe what you want an agent to do. Neaven builds the workflow. Tweak the nodes and details if you want — or don't.",
      features: ["Text-to-workflow", "Visual node editor", "24/7 automation", "Per-agent permissions"],
      color: "bg-indigo-50 text-indigo-600 border-indigo-200",
    },
    {
      icon: <Plug className="w-5 h-5" />,
      label: "Connectors",
      title: "Talk to every tool you use.",
      description: "Connect via MCP, API, OAuth, or iPaaS. Neaven suggests tools based on your stack and auto-populates your dashboards.",
      features: ["MCP, API, OAuth, iPaaS", "Smart suggestions", "Auto-populated dashboards", "Growing library"],
      color: "bg-cyan-50 text-cyan-600 border-cyan-200",
    },
  ];

  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-accent mb-3">Everything you need</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Six pillars. One context.
            <br />
            Zero tab-switching.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.label} className="group p-6 rounded-2xl border border-border bg-white hover:shadow-lg hover:shadow-black/5 transition-all duration-300">
              <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border mb-4 ${f.color}`}>
                {f.icon}
                {f.label}
              </div>
              <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">{f.description}</p>
              <ul className="space-y-2.5">
                {f.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Name your project, connect your tools",
      description: "Takes 30 seconds. Name your project and connect the tools you already use — Neaven suggests the best ones for your stack.",
      icon: <Plug className="w-5 h-5" />,
    },
    {
      step: "02",
      title: "Fill in The Brief",
      description: "Have a quick conversation about what you're building, your goals, and your deadline. This becomes the source of truth.",
      icon: <Target className="w-5 h-5" />,
    },
    {
      step: "03",
      title: "Start building",
      description: "Code like you normally would. The Watcher monitors sessions, the co-founder nudges you, and analytics populate automatically.",
      icon: <Code2 className="w-5 h-5" />,
    },
    {
      step: "04",
      title: "Create agents for the repetitive stuff",
      description: "Describe automations in plain text — deploy watchers, standup digests, feedback triage — and let them run 24/7.",
      icon: <Bot className="w-5 h-5" />,
    },
  ];

  return (
    <section id="how-it-works" className="py-24 px-6 bg-surface border-y border-border">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-accent mb-3">How it works</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Up and running in under a minute.
          </h2>
        </div>

        <div className="space-y-0">
          {steps.map((step, i) => (
            <div key={step.step} className="flex gap-6 group">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center group-hover:border-accent group-hover:bg-accent-light transition-colors">
                  {step.icon}
                </div>
                {i < steps.length - 1 && <div className="w-px h-full bg-border my-2" />}
              </div>
              <div className="pb-12">
                <p className="text-xs text-accent font-mono font-medium mb-1">{step.step}</p>
                <h3 className="text-lg font-semibold mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DifferentiatorSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-accent mb-3">The gap nobody has filled</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Business tools see your goals.
            <br />
            Coding tools see your code.
            <br />
            <span className="text-accent">Neaven sees both.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-border bg-surface">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-4">
              <BarChart3 className="w-5 h-5 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">Vision keeper tools</h3>
            <p className="text-sm text-muted-foreground mb-3">Founders OS, Monday, Notion</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Hold strategy, OKRs, and goals. Zero visibility into whether the code being written actually serves those goals.
            </p>
          </div>

          <div className="p-6 rounded-2xl border-2 border-accent bg-accent-light relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-accent text-white text-xs font-medium rounded-full">
              Neaven
            </div>
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
              <Layers className="w-5 h-5 text-accent" />
            </div>
            <h3 className="font-semibold mb-1">The fusion layer</h3>
            <p className="text-sm text-accent font-medium mb-3">One shared context object</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Knows your roadmap AND your repo. Every nudge, alert, and automation is grounded in what matters to the business.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-surface">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-4">
              <Code2 className="w-5 h-5 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">Coding supervisor tools</h3>
            <p className="text-sm text-muted-foreground mb-3">Greptile, CodeRabbit, Copilot</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Understand code deeply. Zero visibility into whether the feature being built even matters for the deadline.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const testimonials = [
    {
      quote: "I used to spend 30 minutes every morning figuring out what to work on. Neaven tells me before I even open my editor.",
      name: "Sarah Chen",
      role: "Solo founder, DevToolKit",
      avatar: "SC",
    },
    {
      quote: "The Watcher caught me vibecoding a feature that wasn't on my roadmap. That alone saved me two days of wasted work.",
      name: "Marcus Johnson",
      role: "CTO, Launchpad",
      avatar: "MJ",
    },
    {
      quote: "I described an agent in one sentence and it's been running my deploy monitoring for two weeks. Zero config.",
      name: "Aisha Patel",
      role: "Technical founder, Stackwise",
      avatar: "AP",
    },
  ];

  return (
    <section className="py-24 px-6 bg-surface border-y border-border">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-4 h-4 fill-accent text-accent" />
            ))}
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Trusted by builders who ship.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="p-6 rounded-2xl bg-white border border-border">
              <p className="text-sm text-foreground leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-accent mb-3">Pricing</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Simple, transparent pricing.</h2>
          <p className="text-muted-foreground mt-2">Start free. Upgrade when you need more.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-border bg-white">
            <h3 className="font-semibold text-lg">Free</h3>
            <p className="text-muted-foreground text-sm mt-1">For solo builders getting started</p>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-muted-foreground text-sm">/month</span>
            </div>
            <ul className="space-y-2.5 mb-6">
              {["1 project", "Basic Watcher (5 sessions/week)", "Daily co-founder digest", "3 connectors", "1 custom agent"].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0" />{f}
                </li>
              ))}
            </ul>
            <Link href="/signup"><Button variant="secondary" className="w-full">Get started</Button></Link>
          </div>

          <div className="p-6 rounded-2xl border-2 border-accent bg-white relative">
            <div className="absolute -top-3 right-4 px-2.5 py-0.5 bg-accent text-white text-xs font-medium rounded-full">Popular</div>
            <h3 className="font-semibold text-lg">Pro</h3>
            <p className="text-muted-foreground text-sm mt-1">For serious builders shipping fast</p>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-bold">$29</span>
              <span className="text-muted-foreground text-sm">/month</span>
            </div>
            <ul className="space-y-2.5 mb-6">
              {["Unlimited projects", "Full Watcher (unlimited sessions)", "Real-time nudges & alerts", "Unlimited connectors", "Unlimited agents", "Analytics dashboard", "Priority support"].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0" />{f}
                </li>
              ))}
            </ul>
            <Link href="/signup"><Button className="w-full">Start free trial</Button></Link>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-white">
            <h3 className="font-semibold text-lg">Team</h3>
            <p className="text-muted-foreground text-sm mt-1">For small teams building together</p>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-bold">$79</span>
              <span className="text-muted-foreground text-sm">/month</span>
            </div>
            <ul className="space-y-2.5 mb-6">
              {["Everything in Pro", "Up to 5 team members", "Team-wide context sharing", "Shared agents & workflows", "Dedicated support"].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0" />{f}
                </li>
              ))}
            </ul>
            <Link href="/signup"><Button variant="secondary" className="w-full">Contact us</Button></Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-24 px-6 bg-primary">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Stop building alone.
          <br />
          Get an AI co-founder.
        </h2>
        <p className="mt-4 text-lg text-white/60 max-w-xl mx-auto">
          Join founders who ship faster with an AI that actually understands what they&apos;re building.
        </p>
        <div className="mt-8">
          <Link href="/signup">
            <Button size="lg" className="bg-accent hover:bg-orange-600 text-white text-base">
              Get started free
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Logo />
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">Your AI co-founder for building and shipping.</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Product</h4>
            <ul className="space-y-2">
              {["The Brief", "The Watcher", "Co-founder", "Analytics", "Agents", "Connectors"].map(item => (
                <li key={item}><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Resources</h4>
            <ul className="space-y-2">
              {["Documentation", "Changelog", "Blog", "Support"].map(item => (
                <li key={item}><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Company</h4>
            <ul className="space-y-2">
              {["About", "Careers", "Privacy", "Terms"].map(item => (
                <li key={item}><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">&copy; 2026 Neaven. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground">Twitter</a>
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground">GitHub</a>
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground">Discord</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <AppPreview />
      <LogoCloud />
      <Features />
      <HowItWorks />
      <DifferentiatorSection />
      <Testimonials />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  );
}
