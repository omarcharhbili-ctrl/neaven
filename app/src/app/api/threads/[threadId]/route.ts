import { NextRequest } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { chatMessages, chatThreads } from "@/db/schema";
import { getFounder } from "@/lib/founder";

async function ownedThread(threadId: string, founderId: string) {
  return db.query.chatThreads.findFirst({
    where: and(eq(chatThreads.id, threadId), eq(chatThreads.founderId, founderId)),
  });
}

/** GET /api/threads/:id — thread + its messages (with reasoning traces). */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const founder = await getFounder();
  if (!founder) return new Response("Unauthorized", { status: 401 });

  const { threadId } = await params;
  const thread = await ownedThread(threadId, founder.id);
  if (!thread) return new Response("Not found", { status: 404 });

  const messages = await db.query.chatMessages.findMany({
    where: eq(chatMessages.threadId, thread.id),
    orderBy: asc(chatMessages.createdAt),
  });
  return Response.json({ thread, messages });
}

/** PATCH /api/threads/:id — rename / star. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const founder = await getFounder();
  if (!founder) return new Response("Unauthorized", { status: 401 });

  const { threadId } = await params;
  const thread = await ownedThread(threadId, founder.id);
  if (!thread) return new Response("Not found", { status: 404 });

  const body = (await req.json()) as { title?: string; starred?: boolean };
  const [updated] = await db
    .update(chatThreads)
    .set({
      ...(body.title !== undefined ? { title: body.title.slice(0, 120) } : {}),
      ...(body.starred !== undefined ? { starred: body.starred } : {}),
    })
    .where(eq(chatThreads.id, thread.id))
    .returning();
  return Response.json(updated);
}

/** DELETE /api/threads/:id */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const founder = await getFounder();
  if (!founder) return new Response("Unauthorized", { status: 401 });

  const { threadId } = await params;
  const thread = await ownedThread(threadId, founder.id);
  if (!thread) return new Response("Not found", { status: 404 });

  await db.delete(chatThreads).where(eq(chatThreads.id, thread.id));
  return new Response(null, { status: 204 });
}
