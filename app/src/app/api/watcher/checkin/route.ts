import { createHash } from "crypto";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { founders, watcherKeys } from "@/db/schema";
import { evaluateFinding } from "@/lib/agents/watcher";

/**
 * MCP check-in endpoint — Claude Code / Cursor sessions post periodic
 * summaries here (the "Setup MCP" flow issues the API key). Delivery is
 * connection-state-driven: because this IS a live session, any finding that
 * clears the interruption bar rides back inline in the response.
 */
export async function POST(req: NextRequest) {
  const authz = req.headers.get("authorization") ?? "";
  const key = authz.replace(/^Bearer\s+/i, "");
  if (!key) return new Response("Missing API key", { status: 401 });

  const keyHash = createHash("sha256").update(key).digest("hex");
  const keyRow = await db.query.watcherKeys.findFirst({
    where: eq(watcherKeys.keyHash, keyHash),
  });
  if (!keyRow) return new Response("Invalid API key", { status: 401 });

  const { summary, repo } = (await req.json()) as {
    summary?: string;
    repo?: string;
  };
  if (!summary?.trim()) return new Response("Empty check-in", { status: 400 });

  const founder = await db.query.founders.findFirst({
    where: eq(founders.id, keyRow.founderId),
  });
  if (!founder) return new Response("Founder not found", { status: 404 });

  await db
    .update(watcherKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(watcherKeys.id, keyRow.id));

  const evaluation = await evaluateFinding({
    founderId: founder.id,
    source: "mcp_checkin",
    content: summary,
    repo,
    depth: founder.watcherDepth,
  });

  // Inline delivery: high-severity → interrupt one-liner riding back into the
  // session. Everything else stays quiet (folded into a later conversation).
  if (evaluation?.interrupt) {
    return Response.json({
      status: "flagged",
      interruption: {
        kind: evaluation.kind,
        message: evaluation.title,
      },
    });
  }
  return Response.json({ status: "ok" });
}
