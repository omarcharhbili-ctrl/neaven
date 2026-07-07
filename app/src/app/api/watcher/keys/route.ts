import { createHash, randomBytes } from "crypto";
import { NextRequest } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { watcherKeys } from "@/db/schema";
import { getFounder } from "@/lib/founder";

/** GET /api/watcher/keys — list (hashes never leave the server). */
export async function GET() {
  const founder = await getFounder();
  if (!founder) return new Response("Unauthorized", { status: 401 });

  const keys = await db.query.watcherKeys.findMany({
    where: eq(watcherKeys.founderId, founder.id),
    orderBy: desc(watcherKeys.createdAt),
    columns: { id: true, label: true, lastUsedAt: true, createdAt: true },
  });
  return Response.json(keys);
}

/** POST /api/watcher/keys — "Setup MCP" flow. Returns the raw key ONCE. */
export async function POST(req: NextRequest) {
  const founder = await getFounder();
  if (!founder) return new Response("Unauthorized", { status: 401 });

  const { label } = (await req.json().catch(() => ({}))) as { label?: string };
  const rawKey = `nv_watch_${randomBytes(24).toString("hex")}`;

  await db.insert(watcherKeys).values({
    founderId: founder.id,
    keyHash: createHash("sha256").update(rawKey).digest("hex"),
    label: label?.slice(0, 60) || "default",
  });

  return Response.json({ key: rawKey }, { status: 201 });
}
