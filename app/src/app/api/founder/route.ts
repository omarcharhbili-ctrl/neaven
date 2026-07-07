import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { founders } from "@/db/schema";
import { getFounder } from "@/lib/founder";

/** PATCH /api/founder — the two dials: harness (main agent pushback
 *  persistence) and watcherDepth (supervision thoroughness). */
export async function PATCH(req: NextRequest) {
  const founder = await getFounder();
  if (!founder) return new Response("Unauthorized", { status: 401 });

  const body = (await req.json()) as { harness?: number; watcherDepth?: number };
  const clamp = (n: number) => Math.min(5, Math.max(1, Math.round(n)));

  const [updated] = await db
    .update(founders)
    .set({
      ...(body.harness !== undefined ? { harness: clamp(body.harness) } : {}),
      ...(body.watcherDepth !== undefined ? { watcherDepth: clamp(body.watcherDepth) } : {}),
      updatedAt: new Date(),
    })
    .where(eq(founders.id, founder.id))
    .returning({ harness: founders.harness, watcherDepth: founders.watcherDepth });

  return Response.json(updated);
}
