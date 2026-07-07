import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { subAgentSummaries } from "@/db/schema";
import { getFounder } from "@/lib/founder";

/** GET /api/agents/summaries — recent sub-agent reports for the agent center. */
export async function GET() {
  const founder = await getFounder();
  if (!founder) return new Response("Unauthorized", { status: 401 });

  const rows = await db.query.subAgentSummaries.findMany({
    where: eq(subAgentSummaries.founderId, founder.id),
    orderBy: desc(subAgentSummaries.createdAt),
    limit: 30,
    columns: { payload: false },
  });
  return Response.json(rows);
}
