import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  connections,
  memoryNotes,
  progressItems,
  subAgentSummaries,
  visionBaselines,
} from "@/db/schema";
import type { Founder } from "@/lib/founder";

/**
 * The main agent's structured memory (per the main-agent spec): Vision,
 * Progress, Connections + sub-agent findings, and the founder profile.
 * Split into a STABLE part (rarely changes → its own cache breakpoint) and a
 * VOLATILE part (changes often → cached separately so churn here doesn't
 * invalidate the stable prefix).
 */
export interface MemoryBlocks {
  stable: string; // vision + founder profile
  volatile: string; // progress + connections + recent sub-agent summaries
}

export async function loadMemory(founder: Founder): Promise<MemoryBlocks> {
  const [vision, progress, conns, summaries, notes] = await Promise.all([
    db.query.visionBaselines.findFirst({
      where: and(
        eq(visionBaselines.founderId, founder.id),
        eq(visionBaselines.isCurrent, true),
      ),
      orderBy: desc(visionBaselines.version),
    }),
    db.query.progressItems.findMany({
      where: eq(progressItems.founderId, founder.id),
      orderBy: desc(progressItems.updatedAt),
      limit: 50,
    }),
    db.query.connections.findMany({
      where: and(
        eq(connections.founderId, founder.id),
        eq(connections.status, "active"),
      ),
    }),
    db.query.subAgentSummaries.findMany({
      where: eq(subAgentSummaries.founderId, founder.id),
      orderBy: desc(subAgentSummaries.createdAt),
      limit: 20,
    }),
    db.query.memoryNotes.findMany({
      where: eq(memoryNotes.founderId, founder.id),
      orderBy: desc(memoryNotes.createdAt),
      limit: 100,
    }),
  ]);

  const profile = founder.profile as Record<string, unknown>;
  const argumentNotes = notes.filter((n) => n.kind === "argument_outcome");
  const otherNotes = notes.filter((n) => n.kind !== "argument_outcome");

  const stable = [
    "## Founder profile",
    `Name: ${founder.name ?? "unknown"}`,
    `Timezone: ${founder.timezone}`,
    `Harness (pushback persistence, 1=gentle 5=relentless): ${founder.harness}`,
    Object.keys(profile).length
      ? `Profile details: ${JSON.stringify(profile)}`
      : "Profile details: not yet captured.",
    "",
    "## Current vision baseline" +
      (vision ? ` (v${vision.version})` : " — NOT SET"),
    vision
      ? [
          `Vision: ${vision.vision}`,
          vision.scope ? `Scope: ${vision.scope}` : null,
          vision.brand ? `Brand: ${vision.brand}` : null,
        ]
          .filter(Boolean)
          .join("\n")
      : "Onboarding has not captured a vision baseline yet. Before anything else, help the founder articulate one, then save it with the update_vision tool.",
    "",
    "## What you've learned about how this founder responds to pushback",
    argumentNotes.length
      ? argumentNotes.map((n) => `- ${n.note}`).join("\n")
      : "- No argument history yet. Calibrate as you go.",
  ].join("\n");

  const volatile = [
    "## Progress",
    progress.length
      ? progress
          .map((p) => `- [${p.status}] ${p.item}${p.detail ? ` — ${p.detail}` : ""}`)
          .join("\n")
      : "No progress items tracked yet.",
    "",
    "## Connected tools",
    conns.length
      ? conns.map((c) => `- ${c.provider}: ${c.label} (${c.status})`).join("\n")
      : "No external tools connected yet.",
    "",
    "## Recent sub-agent reports (summaries — pull full context only when needed)",
    summaries.length
      ? summaries
          .map(
            (s) =>
              `- [${s.agent}/${s.significance}] ${s.summary} (${s.createdAt.toISOString().slice(0, 10)})`,
          )
          .join("\n")
      : "No sub-agent reports yet.",
    "",
    "## Other remembered context",
    otherNotes.length
      ? otherNotes.slice(0, 30).map((n) => `- ${n.note}`).join("\n")
      : "None yet.",
  ].join("\n");

  return { stable, volatile };
}

/** Full (non-summarized) recent context of one sub-agent — the "deep pull". */
export async function pullSubAgentContext(
  founderId: string,
  agent: "watcher" | "analytics" | "automation",
): Promise<string> {
  const rows = await db.query.subAgentSummaries.findMany({
    where: and(
      eq(subAgentSummaries.founderId, founderId),
      eq(subAgentSummaries.agent, agent),
    ),
    orderBy: desc(subAgentSummaries.createdAt),
    limit: 10,
  });
  if (!rows.length) return `No ${agent} context available yet.`;
  return rows
    .map(
      (r) =>
        `[${r.createdAt.toISOString()}] (${r.significance}) ${r.summary}\nFull payload: ${JSON.stringify(r.payload)}`,
    )
    .join("\n\n");
}
