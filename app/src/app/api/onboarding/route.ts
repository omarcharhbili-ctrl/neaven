import { NextRequest } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { founders, visionBaselines } from "@/db/schema";
import { getFounder } from "@/lib/founder";

/**
 * POST /api/onboarding — capture the vision baseline and open the product.
 * Onboarding is a hard gate (Watcher spec): drift isn't measurable without a
 * baseline to drift from.
 */
export async function POST(req: NextRequest) {
  const founder = await getFounder();
  if (!founder) return new Response("Unauthorized", { status: 401 });

  const { vision, scope, brand, timezone } = (await req.json()) as {
    vision?: string;
    scope?: string;
    brand?: string;
    timezone?: string;
  };
  if (!vision?.trim() || vision.trim().length < 20) {
    return Response.json(
      { error: "Write at least a couple of sentences — this is what Neaven argues from." },
      { status: 400 },
    );
  }

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
    vision: vision.trim(),
    scope: scope?.trim() ?? "",
    brand: brand?.trim() ?? "",
    version: (current?.version ?? 0) + 1,
    isCurrent: true,
  });
  await db
    .update(founders)
    .set({
      onboardingCompleted: true,
      ...(timezone ? { timezone } : {}),
      updatedAt: new Date(),
    })
    .where(eq(founders.id, founder.id));

  return Response.json({ ok: true });
}
