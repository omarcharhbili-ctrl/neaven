import Anthropic from "@anthropic-ai/sdk";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { dailyBriefs } from "@/db/schema";
import type { Founder } from "@/lib/founder";
import { loadMemory } from "./memory";
import { MAIN_AGENT_MODEL } from "./main-agent";

const anthropic = new Anthropic();

export interface BriefItem {
  kind: "task" | "news" | "handled" | "next_step";
  title: string;
  detail: string;
  done: boolean;
}

/** The founder's local calendar date — briefs are timezone-aware. */
export function localDate(timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone || "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Generate (or return the existing) daily brief. Never empty — a SaaS founder
 * always has something to do next.
 */
export async function getOrCreateDailyBrief(founder: Founder) {
  const today = localDate(founder.timezone);

  const existing = await db.query.dailyBriefs.findFirst({
    where: and(
      eq(dailyBriefs.founderId, founder.id),
      eq(dailyBriefs.briefDate, today),
    ),
  });
  if (existing) return existing;

  const memory = await loadMemory(founder);

  let items: BriefItem[];
  try {
    const response = await anthropic.messages.create({
      model: MAIN_AGENT_MODEL,
      max_tokens: 2000,
      system:
        "You are Neaven, the founder's AI co-founder, writing the morning brief. From the founder's memory, produce 3-6 concrete items for today. Kinds: 'task' (do today), 'next_step' (queued), 'handled' (something the agents already did), 'news' (only if genuinely relevant). Titles are short imperatives; details are one sentence. Never produce an empty list. Respond with ONLY a JSON array: [{\"kind\",\"title\",\"detail\",\"done\":false}]",
      messages: [
        {
          role: "user",
          content: `# Memory (stable)\n${memory.stable}\n\n# Memory (current)\n${memory.volatile}\n\nGenerate today's brief (${today}).`,
        },
      ],
    });
    const text = response.content.find((b) => b.type === "text")?.text ?? "[]";
    const match = text.match(/\[[\s\S]*\]/);
    items = JSON.parse(match?.[0] ?? "[]") as BriefItem[];
  } catch (err) {
    console.error("brief generation failed:", err);
    items = [];
  }

  if (!items.length) {
    items = [
      {
        kind: "task",
        title: "Set your vision baseline",
        detail:
          "Tell your co-founder where this is going — everything else (drift detection, the daily brief, arguments worth having) hangs off it.",
        done: false,
      },
    ];
  }

  const [created] = await db
    .insert(dailyBriefs)
    .values({ founderId: founder.id, briefDate: today, items })
    .onConflictDoNothing({
      target: [dailyBriefs.founderId, dailyBriefs.briefDate],
    })
    .returning();

  return (
    created ??
    (await db.query.dailyBriefs.findFirst({
      where: and(
        eq(dailyBriefs.founderId, founder.id),
        eq(dailyBriefs.briefDate, today),
      ),
    }))!
  );
}
