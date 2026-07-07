import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { founders } from "@/db/schema";

export type Founder = typeof founders.$inferSelect;

/**
 * Resolve the signed-in Clerk user to a founder row, creating it on first
 * visit. Returns null when unauthenticated (route protection should normally
 * prevent that).
 */
export async function getFounder(): Promise<Founder | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await db.query.founders.findFirst({
    where: eq(founders.clerkUserId, userId),
  });
  if (existing) return existing;

  const user = await currentUser();
  const [created] = await db
    .insert(founders)
    .values({
      clerkUserId: userId,
      email: user?.primaryEmailAddress?.emailAddress ?? "",
      name: user?.fullName ?? user?.firstName ?? null,
    })
    .onConflictDoNothing({ target: founders.clerkUserId })
    .returning();

  // onConflictDoNothing returns nothing if a concurrent request won the race.
  return (
    created ??
    (await db.query.founders.findFirst({
      where: eq(founders.clerkUserId, userId),
    })) ??
    null
  );
}

/** Like getFounder but throws — for API routes that require auth. */
export async function requireFounder(): Promise<Founder> {
  const founder = await getFounder();
  if (!founder) throw new Error("UNAUTHENTICATED");
  return founder;
}
