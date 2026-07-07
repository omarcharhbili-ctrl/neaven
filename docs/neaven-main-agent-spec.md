# Neaven — Main Agent Architecture Spec

## Overview

The main agent is Neaven's core product surface: the AI co-founder the user talks to. It does not act directly in the world — it holds context, reasons, converses, and manages a layer of sub-agents that each carry their own domain context. Its job is to behave like an experienced, engaged co-founder: proactive, opinionated, but never a gatekeeper.

Scope: this spec covers the main agent's memory, its relationship to sub-agents, the argument mechanic, and proactivity. It does not cover UI/UX, onboarding flow design, or sub-agent internals beyond their interface with the main agent.

---

## Memory Architecture

The main agent's context is structured, not a single blob. It's built from:

- **Vision** — the founder's stated goal/direction. Set at onboarding, but not fixed — updates whenever the founder pivots or the agent detects a shift.
- **Progress** — what's done, what's in flight, what's next.
- **Connections** — structured data pulled from external and native tools (inbox, Notion, calendar, revenue, web analytics) plus sub-agent findings.
- **User profile & preferences** — captured at onboarding, refined over time from behavior, chat history, and decision patterns (including how the founder responds to pushback).

Everything the agent references — arguments, drift checks, daily briefs — is compared against the *current* vision and progress, not a frozen onboarding snapshot.

**Connections mechanism:** tools connect the same way Claude's connectors work — user searches, selects, authenticates, and the main agent gains access.

---

## Agent Hierarchy

The main agent is a manager, not a doer. It holds context and makes decisions; it does not execute actions itself (with the one clarified exception below).

**Four sub-agents**, each scoped to only the context it needs:

| Sub-agent | Domain |
|---|---|
| Watcher | Coding session supervision (drift, stall) + code quality, security, scalability |
| Analytics | Revenue and web analytics |
| Automation | Sets up automations |
| Collaboration | Workspace/team context (Notion/ClickUp/Slack-style) — **post-v1, not in MVP** |

**Context distribution:** at onboarding, the main agent distributes only the relevant slice of context to each sub-agent (e.g. Watcher gets technical + vision context, not the founder's background or business-side details).

**Communication:** bidirectional between main agent and each sub-agent.

**Reporting model:** sub-agents send the main agent *summarized* context, not full context, to control token cost. The main agent pulls a sub-agent's full context only when a deeper look is actually needed (e.g. founder asks a detailed question in that domain).

**Update pattern (hybrid, event-driven):** sub-agents push a new summary only when something changes meaningfully — not on a fixed poll. "Worth surfacing" means a clear anomaly or milestone, not routine fluctuation. Examples:
- Analytics: a spike or crash in visitors (e.g. 0 → 10,000 overnight) — not everyday minor movement.
- Watcher: high-severity drift (major off-vision decision), stall (stuck, no code shipped), or a severe security/quality breach — not minor lint issues or normal back-and-forth in a session.
- Automation: any time an automation is created, breaks, or needs input — the main agent should always know when the founder (or the automation agent itself) creates one.

The general principle: significant, unusual, or actionable events push a summary; routine/expected activity doesn't.

**Boundary:** the main agent cannot instruct the automation agent to set up an automation directly.

**Automation creation has two paths:**
1. **Proactive** — the automation agent builds something on its own (e.g. surfaced in the daily brief: "automation is ready").
2. **Founder-initiated** — either conversationally through the main agent (founder never leaves the chat), or directly in the automation tab (drag-and-drop, or talking to the automation agent there).

Either way, once an automation is created, the automation agent reports it to the main agent as a summary update — the main agent always knows an automation exists, regardless of which path created it.

**Transparency:** when the main agent consults a sub-agent or reasons through a decision, this is shown to the founder as a visible reasoning/thinking trace (in the style of current reasoning-model UIs) — not hidden. This both builds trust and demonstrates the depth of context Neaven is working from.

---

## Argument Mechanic

The signature differentiator: the agent pushes back on founder decisions rather than just executing them.

**What the agent argues from:**
- Its own general/common-sense knowledge
- The founder's stated vision and onboarding context
- A curated knowledge layer, built as **skills** rather than jammed into the system prompt — each skill distilled from established startup/business/marketing writing (e.g. Paul Graham-style essays). This is static content, not continuously updated. The point is to give the agent an actual personality and way of thinking, not just facts — avoiding the generic, repetitive feel of a plain system-prompted LLM. The agent indexes these skills and pulls the relevant one(s) based on what the founder is actually asking about, rather than referencing all of them at once.
- Web search for facts/statistics when needed

**When it triggers:** when the founder says or does something that contradicts one of the above reference points.

**Resolution paths:**
1. **Founder is convinced** → agent notes this in memory (what kind of arguments land with this founder, how persuadable they are on what topics).
2. **Founder isn't convinced, but justification holds up** against the agent's references/facts → agent updates its own understanding (and vision, if warranted).
3. **Founder isn't convinced, justification is weak, founder overrides anyway** → the agent does not block or refuse to help. The founder always has final say. The agent's job is to show the decision from multiple angles and try to persuade — not to gatekeep.

**Self-calibration:** no explicit scoring system or rulebook. Argument outcomes are stored as plain-language memory (not a numeric confidence score), and the agent's tone/persistence on similar topics adjusts naturally from that accumulated context — the same way a human co-founder would get quieter about pushing back on something they've been wrong about before. No hardcoded exceptions identified as necessary at this stage.

**Continuity, not scorekeeping:** the agent doesn't run a formal "override tracking" mechanic. It's covered by the fact that the agent remembers all past conversations and naturally references them when relevant ("last time we talked about X, here's what you decided") — reinforcing that it's a high-context, high-quality co-founder, not a nag.

---

## Proactivity

**Daily brief:** every morning, timezone-aware, the agent generates the day's founder tasks. Because SaaS founders always have something to do, this is never empty — it's a running list of what to do today, which can include news relevant to the founder's industry, tasks the agent already handled (e.g. drafted an email, set up an automation), and next steps.

**Surface:** shown via the web app (dashboard/badge) — Neaven is a web app, primarily used on desktop, not a mobile-first product.

---

## Out of Scope (v1)

- Collaboration agent and all team/workspace features (whiteboards, doc sharing, multi-user workspace) — planned for post-v1.
- Formal override-tracking or reputation-scoring mechanic for the agent — unnecessary complexity for now, superseded by general memory/recall.
- Sub-agent heartbeat/liveness detection (distinguishing "silent because nothing happened" from "silent because broken") — not a v1 concern, flagged for later.

---

---

## Model Stack

| Agent | Model | Provider |
|---|---|---|
| Main agent | Claude Sonnet 5 | Anthropic API |
| Watcher | Qwen3.6 27B | Groq |
| Analytics | Qwen3.6 27B | Groq |
| Automation | GPT-OSS 120B | Groq |

Rationale: the main agent's job (arguing, holding a consistent position, remembering nuanced history accurately over long conversations) needs frontier-level reasoning and reliable long-context retrieval — this is specifically where cheaper open models are weakest, so the cost premium is justified here rather than elsewhere. The three sub-agents run on Groq for speed and low cost: Qwen3.6 27B is the strongest model Groq hosts on general reasoning/coding, used for both the Watcher (repo-level code comprehension) and Analytics (data interpretation); GPT-OSS 120B is used for Automation specifically because it was built for reliable agentic tool-calling, which is the actual mechanic automation setup depends on.

Estimated AI API cost per founder over 30 days (no caching applied): ~$1.80 light usage, ~$9 normal daily use, ~$24 intense use. Revisit once real usage data is available — this is a starting point, not a locked budget.

---

## Open Questions

None outstanding at this stage — automation flow, update thresholds, the knowledge layer, and the model stack have all been resolved above.
