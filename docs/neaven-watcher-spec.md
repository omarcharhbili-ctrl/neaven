# Neaven — Watcher: Session & Code Quality Supervision Spec

## Overview

The Watcher is the second of Neaven's two founder-facing personas. Where the main agent talks, remembers, and argues, the Watcher only observes and quietly flags. It watches two things — live coding sessions and code quality — and never converses directly with the founder; anything it surfaces either interrupts briefly or gets folded into a main agent conversation later.

The founder never sees the underlying machinery (MCP, Qodo/PR-Agent) — only the Watcher as a single consistent voice.

---

## Input Pipelines

Two independent, invisible-to-the-founder pipelines feed the Watcher:

1. **MCP check-ins** — Claude Code or Cursor connects to Neaven's hosted MCP server via a "Setup MCP" flow in the app (generates an API key). At a tunable cadence — placeholder used: every 5 prompts or 10 minutes, whichever comes first, not a locked spec — it sends a summary of what the founder is doing.
2. **Qodo/PR-Agent scans** — triggered by GitHub webhooks on push. Checks security, scalability, and code quality.

**No-connection fallback:** founders who don't want a persistent MCP connection can use a one-shot "Copy Context Prompt" (inspired by Stitch AI's export panel) — pasted once, no standing connection required. This is a first-class option, not a degraded one.

---

## The Evaluator

One shared **interruption policy** processes findings from both pipelines — not two separate bots reasoning independently. It compares everything against the **vision baseline** captured during mandatory onboarding (vision, scope, brand). Onboarding is a hard gate: no tool is usable before it's complete, because drift isn't measurable without a baseline to drift from.

Findings sort into three flavors:
- **Drift** — off-vision (scope creep, features contradicting the stated direction)
- **Stall** — lots of conversation/activity, little actual code shipped (possible stuck state)
- **Quality** — security, scalability, and code quality issues (Qodo's domain)

---

## Delivery

Delivery is determined by **connection state**, not by urgency:

| State | Delivery |
|---|---|
| Live MCP session | Inline, riding back in the tool response, shown right inside Claude Code/Cursor |
| No active session | Email digest + in-app badge (MVP). Real OS push notifications deferred until there's demand. |

**Severity gating:**
- **High severity** → interrupts immediately, one-liner, easy to engage or dismiss, never a lecture.
- **Low/medium severity** → waits. Folded naturally into the next open-ended conversation with the main agent — never ambushing a founder who came in to do something specific.

**Depth/Accuracy setting:** founder-configurable dial specific to the Watcher, controlling how deep/thorough its session and code quality supervision is. Distinct from the main agent's own **Harness** setting (conversational aggressiveness) — each agent has its own dial, configured independently by the founder.

---

## Memory Model

Two-tier, not a flat log:

- **Raw findings** — working memory only, feeds the real-time interruption check. Pruned after ~30 days.
- **Tips** — durable, generated nightly by a scheduled clustering job (using Groq) that clusters repeat raw findings into patterns. Anything that already cleared the interruption bar (i.e. was significant enough to flag live) becomes a tip automatically too, without waiting for the nightly clustering.

**The dashboard only ever reads from tips, never raw logs.** It updates after every session as a living profile — mistake category distributions shifting over time — not a growing table of individual entries. Old detail fades into the trend it built rather than piling up forever.

---

## Trust & Retention

Data retention is a visible, explicit feature — founders can see exactly what's stored and for how long before it ages out. This matters specifically for this audience: solo SaaS founders being asked to connect their codebase to a tool won't do it if it looks like a black box quietly accumulating history on them. Retention transparency is treated as a trust mechanic, not backend hygiene.

---

## Relationship to the Main Agent

The main agent gets a **summarized** version of the Watcher's findings by default — same reporting model as every other sub-agent, to control token cost. When something needs a closer look (a founder asks a detailed question, or a flagged issue needs more context to argue about properly), the main agent pulls the Watcher's full, unsummarized context on demand. It's not full visibility at all times — it's summary-first, deep-pull when needed.

Because the main agent owns the dashboard the founder sees (patterns, tips, recurring problems), it always has at least the summarized version of everything the Watcher surfaces — enough to display and reference it, with the option to go deeper. This is also what makes the argument mechanic work end-to-end: the Watcher only flags and never argues, but if a founder ignores or dismisses a real problem the Watcher raised, the main agent is the one that picks it up in conversation and pushes back ("are you sure about this?").

If a founder tells the main agent a flagged pattern was intentional (not actually drift/stall), that resolution becomes context the main agent redistributes back down to the Watcher — the same mechanism used to give every sub-agent whatever it needs to do its job. The Watcher doesn't independently negotiate with the founder; it just receives updated context and adjusts what it flags going forward.

---

## Out of Scope (v1)

- Real OS-level push notifications — email + in-app badge only for now.
- Locking the MCP check-in cadence to a fixed number — "every 5 prompts or 10 minutes" is a placeholder, not a final spec.
