# Neaven — Automation Agent Spec

## Overview

The Automation agent is one of the main agent's four sub-agents. Its job is building and running automations on the founder's behalf — connecting tools, wiring triggers to actions — without the founder needing to think about the mechanics.

## Engine

Built on Activepieces (self-hosted, MIT-licensed core). Founders never see Activepieces' own branding or login — a custom auth bridge silently authenticates a Clerk-logged-in founder into their own Activepieces project. No separate account, no separate login screen.

## How automations get created

Two paths, both valid:

1. **Proactive** — the Automation agent builds something on its own initiative (e.g. surfaced in the daily brief: "automation is ready").
2. **Founder-initiated** — either conversationally through the main agent chat (founder never leaves the conversation), or directly in a dedicated automation tab (drag-and-drop builder, or talking to the Automation agent there directly).

Either path, once created, the Automation agent reports the event back to the main agent as a summary update.

## Boundary with the main agent

The main agent cannot instruct the Automation agent to set up an automation directly — it can only give context. The main agent always knows an automation exists (created, broken, needs input) because the Automation agent reports every such event up, regardless of which path created it.

## Trust and confirmation

No model is 100% reliable at unsupervised multi-step tool orchestration. Rather than requiring permanent human-in-the-loop approval, the Automation agent shows the founder a one-line confirmation before a newly-built automation goes live the first few times ("built: notify Slack when MRR drops 10%+ — activate?"). Once the founder has seen it get things right consistently, it can go fully silent/autonomous. This is a trust-building step, not a permanent gate.

## Tool permissions

Read/search/list-type actions are enabled freely, no friction. Destructive or high-stakes actions (delete, publicly share, send irreversible messages) are disabled at the tool-permission level by default — an actual hard block the API enforces, not just a prompted convention — until a founder-approval flow explicitly enables them for a specific automation.

## Model

Groq-hosted GPT-OSS 120B — chosen specifically because it's a model built for reliable agentic tool-calling, which is the core mechanic automation-building depends on.

## Reporting to the main agent

Summarized by default, same as the other sub-agents (see main agent spec's reporting model). Every create/break/needs-input event gets reported regardless of size; the main agent can pull full detail on demand if a founder asks something specific.

## Out of Scope (v1)

- Activepieces' official paid Embed SDK — not used; a custom auth bridge is built instead to avoid the ~$800+/month cost.
- Any multi-founder/team automation sharing — out of scope until the Collaboration agent (post-v1).
