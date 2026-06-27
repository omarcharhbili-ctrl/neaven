# Full Vision — Everything This Product Should Eventually Be

Unscoped idea capture. Nothing here is a v1 commitment — this is the complete picture so nothing gets forgotten while chunking into smaller shippable products.

## Core Identity

Not an AI assistant — an AI **manager**. The difference: an assistant answers when asked. A manager holds the full context of the project (what you're building, your goals, deadlines, objectives, the tools you use) and proactively tells you what to do next. You shouldn't have to think about your next step — it knows where you are and where you're headed.

Built for technical and non-technical solo founders and small teams who currently work across many disconnected apps and have to manually hold and re-explain their own project context everywhere.

## Pillar 1 — The Context / Vision Keeper

- Holds what you're building, who it's for, your goals, deadlines, objectives, and current tool stack.
- Acts as the source of truth every other part of the product checks against.
- Notices when you (or your team) drift from the stated plan.

## Pillar 2 — The Coding / Vibecoding Supervisor

- Monitors coding sessions (vibecoding) in real time.
- Refines bad prompts before they're sent to a coding agent.
- Notices when you're wasting time on a useless feature or problem, or going off-track from the actual project goal.
- Runs agentic loops with coding agents — prompt, wait for code, test, repeat until done — via MCP.
- Should work across whatever coding agent the founder uses (Claude Code, Cursor, Windsurf, etc.), not locked to one.

## Pillar 3 — The Manager Interface

- The felt, day-to-day experience: not a dashboard you remember to check, but something closer to a chat thread with a manager.
- Proactively pings you — what's next, what's drifting, what's done vs. planned.

## Pillar 4 — Non-Technical / Business Layer

- Custom dashboards.
- Custom automations.
- Agents that keep working even while you're asleep.

## Pillar 5 — Native Agents & Text-Only Custom Agent Builder

- A native agent built into the product.
- Users can create their own custom agents and automations/workflows using plain text only — describing what they want, no configuration, no technical knowledge required.
- Positioned as dramatically easier than Zapier or n8n, which still require trigger/action setup even in their "no-code" form.

## Agent Architecture

- **Main agent (orchestrator)** — the smartest model. Does the actual thinking, planning, and reasoning. Has full context: the user, the brief, and status/output from every subagent. Instructs and coordinates everything else.
- **System subagents** — created and controlled by the main agent to execute specific tasks on its behalf (e.g. the coding-loop watcher, a research task). Fully under the orchestrator's direction.
- **User-created subagents** (from the text-only agent builder in Pillar 5) — take instructions only from the user, not from the main agent. The main agent cannot direct them, but it can always see what they're doing, so project-wide context awareness holds even for automations the user built themselves.
- **Resolved:** at setup time, when the user creates a subagent, they choose how much authority the main agent has over it — full control (main agent can direct/pause/override it, same as a system subagent) or partial control (main agent can only observe and flag, never act on it directly). This is a per-agent permission the user sets, not a global rule.

## Connector Ecosystem

- The main agent should connect to a broad range of external tools — calendar, email, other AI tools, and more — via MCP or a similar connector mechanism, not just the dev-stack tools (GitHub, Slack, coding agents) covered in Pillars 2 and 5.
- Reference: Claude's own UI pattern of "Add files or photos / Skills / Connectors / Plugins" as a model for how this could be exposed to the user — a simple expandable menu rather than a complex settings page.
- This connector layer is what both the Watcher (Pillar 2) and the text-only agent builder (Pillar 5) plug into under the hood.

## Pillar 6 — Marketing / Distribution Layer (lowest confidence, still parked here so it isn't lost)

- Social media content tracking.
- The agent has visibility into what you're doing on the marketing/distribution side and helps you with it.
- Exact shape unconfirmed — founder explicitly unsure what this looks like yet.

## Reference Inspirations (full breakdown saved separately as Buffer/ClickUp/CodeRabbit/DataFast/FoundersOS/Greptile/ShipFast/Zapier text files)

- **Founders OS** — plan/execute/measure framework, OKR-to-task cascade, revenue-linked metrics, AI insight summaries. Closest existing analog to Pillar 1.
- **Greptile** — graph-indexed codebase context, swarm-of-agents review, learns from team feedback over time, iterate-until-resolved loop. Closest existing analog to Pillar 2.
- **CodeRabbit** — Slack-based agent across the full SDLC, scheduled and signal-based triggers, standup-style digests. Closest existing analog to Pillar 3.
- **ClickUp** — "software to replace all software," context-aware AI as the core differentiator rather than a bolt-on. Philosophy reference for the overall positioning.
- **Zapier** — Zaps, Agents, Chatbots, and especially MCP as a single governed channel for AI agents to take real actions across apps. Architecture reference for Pillar 5 and the MCP plumbing under Pillar 2.
- **DataFast** — revenue attribution tied to marketing channels. Reference for Pillar 4 once a business dashboard exists.
- **Buffer** — content calendar, AI-assisted captions, unified social inbox, analytics. Reference for Pillar 6.
- **ShipFast** — not a feature reference; a go-to-market lesson on shipping narrow and fast, proving revenue, and building credibility through public traction (e.g. a leaderboard).

## Status

This is the complete idea set as of 2026-06-24. Next step (per founder's own plan): chunk this into smaller, independently shippable products and build/test them one at a time until the full pack exists. See `one-pager.md` for the first proposed chunk (the v1 wedge: a thin slice of Pillars 1-3 sharing one context object).
