import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { chatThreads } from "@/db/schema";
import { getFounder } from "@/lib/founder";

/** GET /api/threads — the founder's threads, most recently active first. */
export async function GET() {
  const founder = await getFounder();
  if (!founder) return new Response("Unauthorized", { status: 401 });

  const threads = await db.query.chatThreads.findMany({
    where: eq(chatThreads.founderId, founder.id),
    orderBy: desc(chatThreads.updatedAt),
    limit: 100,
  });
  return Response.json(threads);
}
