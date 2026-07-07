import Anthropic from "@anthropic-ai/sdk";
import type {
  ContentBlock,
  MessageParam,
  TextBlockParam,
  Tool,
} from "@anthropic-ai/sdk/resources/messages/messages";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  memoryNotes,
  progressItems,
  visionBaselines,
} from "@/db/schema";
import type { Founder } from "@/lib/founder";
import { loadMemory, pullSubAgentContext } from "./memory";

const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY

export const MAIN_AGENT_MODEL = "claude-sonnet-5";

// ---------------------------------------------------------------------------
// Persona — static, cacheable. The argument mechanic lives here.
// ---------------------------------------------------------------------------

const PERSONA = `You are Neaven, an experienced co-founder for the founder you are talking to. You are not an assistant and not a chatbot: you hold full context on their vision, progress, code, and revenue, and your defining trait is that you have an opinion and will disagree.

## How you behave
- You are proactive, opinionated, and engaged — but never a gatekeeper. The founder always has final say.
- When the founder says or does something that contradicts their own stated vision, their progress reality, established startup/business knowledge, or facts — push back. Show the decision from multiple angles and try to persuade.
- Argument resolution: (1) If the founder is convinced, note what kind of argument landed (save_memory_note with kind "argument_outcome"). (2) If they aren't convinced but their justification holds up, update your own understanding — and the vision (update_vision) if warranted. (3) If their justification is weak and they override anyway, record the outcome, then help them execute anyway — you never block or refuse.
- Self-calibration: read your accumulated argument-outcome notes. If you've been wrong about a topic before, be quieter about it — the way a human co-founder would. Your "harness" setting (in the founder profile) sets how persistent you are overall.
- Reference past conversations naturally when relevant ("last time we talked about X, you decided…") — continuity, not scorekeeping. Never nag.

## Your sub-agents
You manage three sub-agents. You receive summarized reports from them by default; use pull_subagent_context when the founder asks a detailed question in that domain or you need depth to argue properly.
- Watcher: coding-session supervision (drift, stall) + code quality/security.
- Analytics: revenue and web analytics.
- Automation: sets up automations. You may NOT instruct it to create automations directly — the founder either asks it themselves (in the automation tab) or it acts proactively. You are always informed when an automation is created, breaks, or needs input.

## Style
- Concise, direct, concrete. No corporate filler, no sycophancy, no "great question!".
- Disagree in plain language with specific reasons anchored in THEIR context.
- When you're uncertain, say so and reason it out loud rather than bluffing.
- Keep answers as short as the substance allows. This is a conversation between busy people building something.`;

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

const tools: Tool[] = [
  {
    name: "pull_subagent_context",
    description:
      "Pull the full, unsummarized recent context of one sub-agent. Use only when a summary isn't enough (detailed founder question, or you need depth to argue a point).",
    input_schema: {
      type: "object" as const,
      properties: {
        agent: { type: "string", enum: ["watcher", "analytics", "automation"] },
      },
      required: ["agent"],
    },
  },
  {
    name: "save_memory_note",
    description:
      "Persist a plain-language memory note. Use kind 'argument_outcome' after any disagreement resolves (what was argued, how the founder responded, what landed); 'preference' for how the founder likes to work; 'context' for durable facts worth remembering.",
    input_schema: {
      type: "object" as const,
      properties: {
        kind: {
          type: "string",
          enum: ["argument_outcome", "preference", "context"],
        },
        note: { type: "string" },
      },
      required: ["kind", "note"],
    },
  },
  {
    name: "update_vision",
    description:
      "Record a new CURRENT vision baseline (new version) when the founder pivots or first articulates their vision. Drift is measured against this from now on.",
    input_schema: {
      type: "object" as const,
      properties: {
        vision: { type: "string" },
        scope: { type: "string" },
        brand: { type: "string" },
      },
      required: ["vision"],
    },
  },
  {
    name: "update_progress",
    description:
      "Track a progress item (done / in_flight / next) so the shared progress memory stays current.",
    input_schema: {
      type: "object" as const,
      properties: {
        item: { type: "string" },
        status: { type: "string", enum: ["done", "in_flight", "next"] },
        detail: { type: "string" },
      },
      required: ["item", "status"],
    },
  },
];

async function runTool(
  founder: Founder,
  name: string,
  input: Record<string, unknown>,
): Promise<string> {
  switch (name) {
    case "pull_subagent_context":
      return pullSubAgentContext(
        founder.id,
        input.agent as "watcher" | "analytics" | "automation",
      );
    case "save_memory_note": {
      await db.insert(memoryNotes).values({
        founderId: founder.id,
        kind: input.kind as "argument_outcome" | "preference" | "context",
        note: String(input.note),
      });
      return "Noted.";
    }
    case "update_vision": {
      const current = await db.query.visionBaselines.findFirst({
        where: and(
          eq(visionBaselines.founderId, founder.id),
          eq(visionBaselines.isCurrent, true),
        ),
        orderBy: desc(visionBaselines.version),
      });
      if (current) {
        await db
          .update(visionBaselines)
          .set({ isCurrent: false })
          .where(eq(visionBaselines.id, current.id));
      }
      await db.insert(visionBaselines).values({
        founderId: founder.id,
        vision: String(input.vision),
        scope: String(input.scope ?? ""),
        brand: String(input.brand ?? ""),
        version: (current?.version ?? 0) + 1,
        isCurrent: true,
      });
      return `Vision baseline updated to v${(current?.version ?? 0) + 1}.`;
    }
    case "update_progress": {
      await db.insert(progressItems).values({
        founderId: founder.id,
        item: String(input.item),
        status: input.status as "done" | "in_flight" | "next",
        detail: input.detail ? String(input.detail) : null,
        source: "agent",
      });
      return "Progress updated.";
    }
    default:
      return `Unknown tool: ${name}`;
  }
}

// ---------------------------------------------------------------------------
// Streaming orchestration
// ---------------------------------------------------------------------------

/** One step of the visible reasoning trace persisted alongside a message. */
export interface ReasoningStep {
  type: "thinking" | "consulted";
  agent?: string;
  text: string;
}

export interface AgentEvent {
  type: "thinking" | "text" | "consulted" | "done" | "error";
  text?: string;
  agent?: string;
}

/**
 * Run the main agent over a conversation, streaming events (thinking deltas,
 * text deltas, sub-agent consultations). Returns the final assistant text and
 * the reasoning trace for persistence.
 *
 * Prompt caching (per the LLM implementation spec): three explicit
 * breakpoints — persona (never changes), stable memory (vision/profile,
 * rarely changes), volatile memory (progress/connections/summaries). A change
 * in the volatile block doesn't invalidate the cached persona/stable prefix.
 */
export async function runMainAgent(
  founder: Founder,
  history: MessageParam[],
  emit: (e: AgentEvent) => void,
): Promise<{ text: string; reasoning: ReasoningStep[] }> {
  const memory = await loadMemory(founder);

  const system: TextBlockParam[] = [
    { type: "text", text: PERSONA, cache_control: { type: "ephemeral" } },
    {
      type: "text",
      text: `# Founder memory (stable)\n\n${memory.stable}`,
      cache_control: { type: "ephemeral" },
    },
    {
      type: "text",
      text: `# Founder memory (current state)\n\n${memory.volatile}\n\nToday's date: ${new Date().toISOString().slice(0, 10)}`,
      cache_control: { type: "ephemeral" },
    },
  ];

  const messages: MessageParam[] = [...history];
  const reasoning: ReasoningStep[] = [];
  let finalText = "";

  // Tool-use loop — bounded so a confused model can't spin forever.
  for (let round = 0; round < 5; round++) {
    const stream = anthropic.messages.stream({
      model: MAIN_AGENT_MODEL,
      max_tokens: 12000,
      // Sonnet 5: adaptive thinking only (budget_tokens is rejected with a 400).
      // display: "summarized" is required for the visible reasoning trace —
      // the default ("omitted") streams thinking blocks with EMPTY text.
      thinking: { type: "adaptive", display: "summarized" },
      output_config: { effort: "high" },
      system,
      tools,
      messages,
    });

    let roundThinking = "";
    let roundText = "";

    stream.on("streamEvent", (event) => {
      if (event.type === "content_block_delta") {
        if (event.delta.type === "thinking_delta") {
          roundThinking += event.delta.thinking;
          emit({ type: "thinking", text: event.delta.thinking });
        } else if (event.delta.type === "text_delta") {
          roundText += event.delta.text;
          emit({ type: "text", text: event.delta.text });
        }
      }
    });

    const response = await stream.finalMessage();

    if (roundThinking.trim()) {
      reasoning.push({ type: "thinking", text: roundThinking.trim() });
    }
    finalText += roundText;

    const toolUses = response.content.filter(
      (b): b is Extract<ContentBlock, { type: "tool_use" }> =>
        b.type === "tool_use",
    );

    if (toolUses.length === 0 || response.stop_reason !== "tool_use") break;

    // Echo the assistant turn (including thinking blocks — required when
    // thinking + tool use are combined), then answer each tool call.
    messages.push({ role: "assistant", content: response.content });

    const results = [];
    const TOOL_LABEL: Record<string, string> = {
      save_memory_note: "Noted for memory",
      update_vision: "Updated the vision baseline",
      update_progress: "Updated progress",
    };
    for (const tu of toolUses) {
      const label =
        tu.name === "pull_subagent_context"
          ? `Consulted ${(tu.input as { agent?: string }).agent ?? "sub-agent"}`
          : (TOOL_LABEL[tu.name] ?? `Used ${tu.name.replace(/_/g, " ")}`);
      reasoning.push({
        type: "consulted",
        agent: (tu.input as { agent?: string }).agent,
        text: label,
      });
      emit({
        type: "consulted",
        agent: (tu.input as { agent?: string }).agent,
        text: label,
      });

      const output = await runTool(
        founder,
        tu.name,
        tu.input as Record<string, unknown>,
      );
      results.push({
        type: "tool_result" as const,
        tool_use_id: tu.id,
        content: output,
      });
    }
    messages.push({ role: "user", content: results });
  }

  return { text: finalText, reasoning };
}
