# Neaven — LLM Implementation Spec

## Overview

This spec covers how Neaven actually talks to its models: which API each agent calls, how prompt caching is wired in, how context growth is handled, and how the main agent's knowledge layer (skills) gets implemented. This is the technical layer underneath the architecture already defined in the Main Agent and Watcher specs.

---

## Model Stack & APIs

| Agent | Model | API | Endpoint pattern |
|---|---|---|---|
| Main agent | Claude Sonnet 5 | Anthropic API | `model: "claude-sonnet-5"` |
| Watcher | Qwen3.6 27B | Groq (OpenAI-compatible) | same `/chat/completions` shape, different base URL |
| Analytics | Qwen3.6 27B | Groq | same |
| Automation | GPT-OSS 120B | Groq | same |

All Groq calls use the OpenAI-compatible interface, so switching the base URL and model name is the only difference in code between the three Groq-hosted agents.

---

## Prompt Caching (Main Agent)

**Why it matters here specifically:** the main agent resends its full memory (Vision, Progress, Connections, Founder Profile) on nearly every request, and that content barely changes turn to turn. This is the textbook case caching is built for — cache reads cost 10% of normal input price.

**Implementation:**
- Use **automatic caching** (`cache_control` at the top level) to start — simplest, handles the cache breakpoint automatically as the conversation grows.
- As the memory sections stabilize (e.g. Vision/Profile change rarely, Connections changes more often), consider moving to **explicit breakpoints** — one for the rarely-changing system prompt + Vision/Profile, one for the more volatile Connections/Progress data. This lets a change in Connections not blow away the cached Vision/Profile prefix.
- Default 5-minute cache TTL is fine for active chat sessions. If a founder is likely to go quiet for over 5 minutes but under an hour (e.g. reviewing something before replying), the 1-hour TTL is worth the extra cost to avoid a full re-cache.
- Minimum cacheable length for Sonnet 5 is 1,024 tokens — the main agent's memory block should comfortably clear this once populated.

**Not used for Groq sub-agents:** Groq's caching model differs from Anthropic's and isn't part of this spec's scope yet — sub-agent calls are cheap enough that caching isn't a priority there.

---

## Context Management (Main Agent)

**The real gap this closes:** we never fully defined what happens when a founder's history with the main agent grows very large over months of use. Two Anthropic-native mechanisms solve this without custom engineering:

**Context awareness:** Sonnet 5 automatically tracks its own remaining token budget throughout a conversation — this is built-in, nothing to configure. It lets the main agent manage its own long-running "session" (a founder's entire relationship with Neaven) against how much room is left, rather than guessing.

**Compaction (beta):** when the conversation approaches a token threshold, the API automatically summarizes older context into a `compaction` block and continues from there — the conversation never hard-fails on context limits.
- Trigger threshold: default 150,000 input tokens; adjustable, minimum 50,000.
- Use the default summarization behavior initially. If early testing shows important founder context getting lost in compaction (e.g. a specific past disagreement that matters to the argument mechanic), switch to **custom summarization instructions** that explicitly tell it to preserve founder profile/preference details and past argument outcomes.
- Combine with prompt caching: cache the system prompt separately from the conversation so a compaction event doesn't force a full system-prompt re-cache.

**Not yet decided:** whether to also use context editing (tool result clearing, thinking block clearing) — these are for heavy tool-use workflows and aren't clearly needed yet given the main agent's usage pattern. Revisit once real usage shows whether tool calls (checking sub-agents, pulling connections) are consuming meaningful context.

---

## Knowledge Layer via Skills

This is the concrete implementation of the "curated knowledge layer" described in the Main Agent spec (the PG-essay-style startup/business knowledge meant to give the agent a personality and way of thinking, distinct from raw facts).

**How it maps to the Skills API:**
- Each distilled piece of knowledge (a startup principle, a marketing framework, a specific writer's perspective) becomes a **custom Skill** — a bundle with a `SKILL.md` file plus any supporting material.
- Skills are attached per-request via the `container.skills` array (up to 8 per request) and only get loaded into context when Claude judges them relevant to the current message — this is what keeps the main agent's personality-knowledge from bloating every single request the way stuffing it into the system prompt would.
- Version with `"latest"` during active development of the knowledge layer; pin to specific version numbers once the personality/knowledge set is stable, to avoid an unannounced skill update changing the agent's tone mid-use.

**Open question:** how skills get selected per-conversation — always attach the same core set, or have the main agent (or a lightweight router) decide which 1-3 are relevant based on the current topic? Given the "why it triggers" logic already defined in the argument mechanic (vision/context contradiction, not raw topic-matching), the simplest starting point is: attach the full curated set every time (within the 8-skill limit) and let Claude's own relevance judgment handle it, rather than building a separate selection layer. Revisit if the set grows past 8 skills.

---

## MCP Connector — Main Agent Connections & Automation Permissions

This is a real find from reading the Anthropic MCP connector docs: it changes how much backend work "Connections" and "Automation tool-calling" actually require, versus what we assumed when designing those pieces.

### What it is

The Claude API can connect directly to remote MCP servers inside a single request — no separate MCP client needs to be built or hosted by Neaven. You pass:
- `mcp_servers`: an array defining each server's URL and auth token
- `tools`: a matching `mcp_toolset` entry per server, controlling which of that server's tools are actually usable and how

Claude then calls those tools itself, mid-conversation, whenever the request matches what a tool does. The response includes `mcp_tool_use` and `mcp_tool_result` blocks showing exactly what was called and what came back.

**Constraint to know:** it only works with servers exposed over public HTTP (Streamable HTTP or SSE) — not local/stdio servers. Every connection type we've already planned (Notion, calendar, Gmail-style inbox, revenue tools) is a public API, so this isn't a blocker. It just means if Neaven ever needed to reach a founder's *locally-running* tool, this specific mechanism wouldn't cover that case — a separate problem from what's in scope now.

### 1. Main Agent's "Connections" memory

**What we assumed before:** the main agent's memory doc describes "Connections" as a memory category pulling in inbox, calendar, Notion, revenue, and web analytics data — feeding it was described only conceptually ("connects like Claude's connectors: search, select, authenticate"), without a concrete implementation.

**What this actually gives us:** once a founder authenticates a connector (Notion, calendar, etc. — worked out during onboarding or later), the resulting server URL + OAuth token become one entry in the main agent's `mcp_servers` array on every request. No custom integration code per service, no Neaven-hosted proxy needed for these — the Claude API handles the connection, the tool listing, and the calling directly. Neaven's job becomes: store the founder's server URL/token per connection, and pass them in on each main agent request. That's a meaningfully smaller build than a bespoke MCP client per external tool.

**Multiple connections at once:** the docs confirm multiple MCP servers can be attached to a single request (one `mcp_servers` entry + one `mcp_toolset` entry each). So a founder with Notion + calendar + revenue tool connected all at once is just three array entries, not three separate integrations to maintain.

### 2. Automation Agent's tool-calling permissions

**What we discussed before:** the automation agent builds automations either proactively or on request, and I suggested a "confirmation step before going live" for the first few automations, until trust is established — without a concrete mechanism for what that gate would actually be.

**What this actually gives us:** the `mcp_toolset` config supports exactly the allowlist/denylist control this needs, per tool, on the same server:

- **`default_config`** sets the baseline (e.g. `enabled: false` to lock everything down by default, or `enabled: true` to open everything up by default)
- **`configs`** overrides that per named tool

This means the automation agent's actual server-side permissions can be shaped like: read/search/list tools enabled freely (no friction, no confirmation needed), but destructive or high-stakes actions (delete, publicly share, send irreversible messages) explicitly disabled at the tool level — not just a soft "ask the founder first" convention in the prompt, but an actual hard block the API enforces regardless of what Claude decides to attempt. The "human confirms the risky ones" idea becomes literal: those tools are simply `enabled: false` until a founder-approval flow flips them on for a specific automation, rather than relying on prompting alone to hold the line.

This is a cleaner mechanism than what we'd sketched conversationally — it moves the safety boundary from "hope the model behaves" to "the tool literally isn't callable."

### MCP Tunnels — not applicable

A separate, related feature (MCP tunnels) lets Claude reach MCP servers sitting inside a private network with no public inbound exposure, via an outbound-only tunnel. Not relevant to Neaven's current architecture: the Watcher's own MCP server is meant to be publicly reachable (that's how founders' Claude Code/Cursor sessions connect to it), and every other connection type (Notion, calendar, revenue tools) is already a public API. There's no private-network MCP server in scope that would need this. It's also explicitly a research preview with no uptime guarantee, so not something to build a dependency on regardless. Flagging as "not applicable" rather than silently dropping it, in case a future feature (e.g. reaching something running on a founder's own private infrastructure) makes it relevant later.

---

- Context editing (tool result / thinking block clearing) — not yet needed given current usage pattern.
- Prompt caching on Groq-hosted sub-agents — not a priority at current cost levels.
- Automated skill-selection routing — deferred in favor of attaching the full set and trusting Claude's relevance judgment.
