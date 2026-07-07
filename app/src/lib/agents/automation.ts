import { db } from "@/db";
import { automationsLog, subAgentSummaries } from "@/db/schema";
import { GROQ_MODELS, groqChat } from "@/lib/llm/groq";

/**
 * Automation sub-agent — GPT-OSS 120B on Groq (built for reliable agentic
 * tool-calling). Two creation paths per the main-agent spec: proactive, or
 * founder-initiated (chat / automation tab). Either way every lifecycle event
 * is logged AND reported to the main agent — it always knows an automation
 * exists. The main agent can never instruct this agent to create one.
 */

export async function automationChat(
  history: { role: "user" | "assistant"; content: string }[],
): Promise<string> {
  return groqChat(
    GROQ_MODELS.automation,
    [
      {
        role: "system" as const,
        content: `You are Neaven's automation agent. You help the founder design and set up automations (the execution engine is Activepieces, embedded in this tab). Be concrete: name the trigger, the steps, and what connected accounts are needed. If an automation is risky (sends external messages, deletes data, spends money), say you'll keep destructive actions disabled until the founder explicitly approves them. Keep answers short and buildable.`,
      },
      ...history,
    ],
    { maxTokens: 1500 },
  );
}

export async function logAutomationEvent(params: {
  founderId: string;
  name: string;
  event: "created" | "updated" | "broken" | "needs_input" | "deleted";
  origin: "proactive" | "founder_chat" | "founder_direct";
  externalId?: string;
  detail?: Record<string, unknown>;
}) {
  await db.insert(automationsLog).values({
    founderId: params.founderId,
    externalId: params.externalId,
    name: params.name,
    event: params.event,
    origin: params.origin,
    detail: params.detail ?? {},
  });

  // Automation events ALWAYS push a summary to the main agent (spec: it must
  // always know when an automation is created, breaks, or needs input).
  await db.insert(subAgentSummaries).values({
    founderId: params.founderId,
    agent: "automation",
    summary: `Automation "${params.name}" ${params.event.replace("_", " ")} (${params.origin.replace("_", " ")})`,
    significance:
      params.event === "broken" || params.event === "needs_input"
        ? "anomaly"
        : "milestone",
    payload: params as unknown as Record<string, unknown>,
  });
}
