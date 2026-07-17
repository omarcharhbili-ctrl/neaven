import { NextRequest } from "next/server";
import { getFounder } from "@/lib/founder";
import { automationChat } from "@/lib/agents/automation";

/**
 * POST /api/automation/chat — founder ↔ automation agent, directly in the
 * automation tab (one of the two founder-initiated creation paths).
 */
export async function POST(req: NextRequest) {
  const founder = await getFounder();
  if (!founder) return new Response("Unauthorized", { status: 401 });

  const { history } = (await req.json()) as {
    history: { role: "user" | "assistant"; content: string }[];
  };
  if (!history?.length) return new Response("Empty history", { status: 400 });

  const reply = await automationChat(history.slice(-20));
  return Response.json({ reply });
}
