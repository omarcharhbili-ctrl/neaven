import { NextRequest } from "next/server";
import { db } from "@/db";
import { founders } from "@/db/schema";
import { clusterFindingsIntoTips } from "@/lib/agents/watcher";
import { scanTraffic } from "@/lib/agents/analytics";
import { getOrCreateDailyBrief } from "@/lib/agents/brief";

export const maxDuration = 300;

/**
 * Nightly job — invoked by cron (curl from the server, or any scheduler):
 *   curl -X POST -H "Authorization: Bearer $CRON_SECRET" .../api/jobs/nightly
 *
 * Per founder: cluster raw findings into durable tips (Watcher spec), prune
 * expired working memory, and pre-generate the morning brief.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authz = req.headers.get("authorization") ?? "";
  if (!secret || authz !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Optional ?day=YYYY-MM-DD points the analytics scan at a past day (backfill).
  const day = req.nextUrl.searchParams.get("day") ?? undefined;

  const all = await db.select().from(founders);
  const results = [];
  for (const founder of all) {
    try {
      const clustering = await clusterFindingsIntoTips(founder.id);
      const scan = await scanTraffic(founder.id, day);
      await getOrCreateDailyBrief(founder);
      results.push({
        founderId: founder.id,
        ...clustering,
        analyticsPushed: scan.pushed,
        analyticsSummary: scan.summary,
        brief: true,
      });
    } catch (err) {
      console.error(`nightly job failed for founder ${founder.id}:`, err);
      results.push({ founderId: founder.id, error: true });
    }
  }
  return Response.json({ processed: results.length, results });
}
