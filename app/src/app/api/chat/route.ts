import { NextRequest } from "next/server";
import { asc, eq } from "drizzle-orm";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages/messages";
import { db } from "@/db";
import { chatMessages, chatThreads } from "@/db/schema";
import { getFounder } from "@/lib/founder";
import { runMainAgent } from "@/lib/agents/main-agent";

export const maxDuration = 300;

/**
 * POST /api/chat — { threadId?, message } → SSE stream of AgentEvents.
 * Creates the thread on first message; persists both sides + reasoning trace.
 */
export async function POST(req: NextRequest) {
  const founder = await getFounder();
  if (!founder) return new Response("Unauthorized", { status: 401 });

  const { threadId, message } = (await req.json()) as {
    threadId?: string;
    message?: string;
  };
  if (!message?.trim()) return new Response("Empty message", { status: 400 });

  // Resolve or create the thread (title from the first message).
  let thread = threadId
    ? await db.query.chatThreads.findFirst({
        where: eq(chatThreads.id, threadId),
      })
    : undefined;
  if (thread && thread.founderId !== founder.id)
    return new Response("Not found", { status: 404 });
  if (!thread) {
    [thread] = await db
      .insert(chatThreads)
      .values({
        founderId: founder.id,
        title: message.slice(0, 80),
      })
      .returning();
  }

  const history = await db.query.chatMessages.findMany({
    where: eq(chatMessages.threadId, thread.id),
    orderBy: asc(chatMessages.createdAt),
    limit: 60,
  });

  await db.insert(chatMessages).values({
    threadId: thread.id,
    role: "user",
    content: message,
  });

  const llmHistory: MessageParam[] = [
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: message },
  ];

  const encoder = new TextEncoder();
  const threadIdFinal = thread.id;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      send({ type: "thread", threadId: threadIdFinal });

      try {
        const { text, reasoning } = await runMainAgent(
          founder,
          llmHistory,
          send,
        );

        const [saved] = await db
          .insert(chatMessages)
          .values({
            threadId: threadIdFinal,
            role: "assistant",
            content: text,
            reasoning,
          })
          .returning();
        await db
          .update(chatThreads)
          .set({ updatedAt: new Date() })
          .where(eq(chatThreads.id, threadIdFinal));

        send({ type: "done", threadId: threadIdFinal, messageId: saved.id });
      } catch (err) {
        console.error("main agent error:", err);
        send({
          type: "error",
          text: "Something went wrong talking to the main agent.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
