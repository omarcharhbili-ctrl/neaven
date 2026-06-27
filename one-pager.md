# AI SaaS One-Pager — "The Manager, Not the Assistant"

## The Problem

Solo and team founders — technical and non-technical — work across a fragmented stack of disconnected apps. They have to manually hold the context of their own project in their heads: what they're building, why, the deadline, the tools in use, and whether today's work actually moves the needle. AI tools today only make this worse by adding another disconnected assistant to the pile — one with no memory of the plan and no visibility into what's actually happening in the work.

## The Core Insight

Two categories of AI tool already exist and are already validated, charging real money, with real customers:

- **Business-side "vision keeper" tools** (e.g. Founders OS): hold strategy, OKRs, goals, deadlines, and revenue metrics, and try to connect strategy to daily execution. They have zero visibility into the actual technical work happening in code.
- **Technical-side "coding supervisor" tools** (e.g. Greptile, CodeRabbit): deeply understand a codebase, review and test AI-generated code, learn team standards, and run iterate-until-resolved loops with coding agents via MCP. They have zero visibility into the founder's goals, deadlines, or whether the work even matters to the business.

**Nobody has fused these two.** That fusion — one shared context object driving both a business dashboard and a coding-session supervisor — is the differentiated wedge. Not "all-in-one software," but "the one layer that knows both your roadmap and your repo."

## Who It's For

Solo and small-team founders (technical and non-technical) who are actively building — especially those "vibecoding" with AI coding agents (Claude Code, Cursor, Windsurf) without a structured process, and who lack the bandwidth for a human PM/manager to keep them on track.

## What It Is (v1 / MVP scope)

A thin slice across the full vision, not deep in any one layer yet:

1. **The Brief** (shared context, Founders-OS-inspired) — a short onboarding conversation, not a form: what you're building, for whom, your deadline, your goals, your current tools. This becomes the source of truth.
2. **The Watcher** (coding-session supervisor, Greptile/CodeRabbit-inspired) — plugs into the founder's coding agent via MCP. Reads prompts, diffs, and session activity. Flags drift from the brief ("this isn't on your roadmap"), refines bad prompts, and can run an iterate-until-resolved loop (prompt → code → test → repeat) similar to CodeRabbit's agent loop or Greptile's `/greploop`.
3. **The Manager** (the felt interface) — a chat-style surface (Slack-like), not a dashboard you have to remember to check. Morning digest of what's next, mid-session nudges, end-of-day recap tied back to the deadline.

## Feature Map — What to Borrow Natively, From Whom

| Inspiration | What to lift | Where it lands |
|---|---|---|
| Founders OS | Plan → Execute → Measure framework, OKR-to-task cascade, AI insight summaries | The Brief (v1) |
| Greptile | Graph-indexed codebase context, learns from feedback over time, iterate-until-resolved loop | The Watcher (v1) |
| CodeRabbit | Slack-style agent across the SDLC, scheduled + signal-based triggers, standup-style digests | The Manager (v1) |
| Zapier | MCP as a single governed channel for agents to act through (not 9,000 integrations — the governance pattern) | The Watcher's plumbing (v1) |
| ClickUp | Context-aware AI as the core, not a bolt-on (philosophy, not feature set) | Guiding principle, not a v1 build target |
| DataFast | Revenue attribution tied to marketing channels | v2 — once there's a business dashboard worth attaching it to |
| Buffer | Content calendar, AI-assisted captions, unified social inbox | v2/v3 — explicitly parked, lowest confidence fit |
| ShipFast | Not a feature — a go-to-market lesson: ship narrow, prove revenue fast, build credibility via public traction (e.g. a leaderboard) | Distribution strategy, not product scope |

## What's Explicitly Cut From v1

Custom dashboard builder, full automation engine, social/content tracking, revenue attribution. All are legitimate v2+ additions once the core loop (plan → watch → nudge) is proven to work and founders trust being watched this closely.

## Riskiest Assumption

That founders actually want to be watched this closely and will trust an AI manager's nudges enough to act on them, rather than finding it intrusive or just another notification to ignore.

## Suggested Next Step

Validate the riskiest assumption before building: talk to 5-10 solo/team founders who vibecode regularly about whether they'd want a tool watching their sessions and nudging them, and how they'd react to it. In parallel, a scrappy prototype of just The Watcher (MCP hook into Claude Code/Cursor + a Slack-style nudge) is the fastest way to test whether the core loop has legs before investing in The Brief or The Manager polish.
