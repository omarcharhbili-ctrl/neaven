import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, after } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { connections, founders } from "@/db/schema";
import { evaluateFinding } from "@/lib/agents/watcher";

/**
 * GitHub webhook ingest — the Watcher's PR-Agent pipeline.
 *
 * PR-Agent reviews PRs and posts its findings as GitHub comments; GitHub then
 * delivers those comment events here. This route MUST never block anything:
 * it verifies the signature, ACKs 200 immediately, and does all evaluation
 * after the response is sent (Next's `after()`), matching the resilience
 * requirement in the infrastructure reference.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();

  // --- HMAC verification (GitHub App webhook secret) ---
  const secret = process.env.GITHUB_APP_WEBHOOK_SECRET;
  const signature = req.headers.get("x-hub-signature-256") ?? "";
  if (!secret) return new Response("Webhook not configured", { status: 503 });
  const expected = `sha256=${createHmac("sha256", secret).update(raw).digest("hex")}`;
  if (
    signature.length !== expected.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return new Response("Bad signature", { status: 401 });
  }

  const event = req.headers.get("x-github-event") ?? "";
  const payload = JSON.parse(raw) as GithubPayload;

  // ACK first — everything below runs after the response is flushed.
  after(async () => {
    try {
      await processEvent(event, payload);
    } catch (err) {
      // Never let pipeline errors surface to GitHub — it would just retry.
      console.error("github webhook processing failed:", err);
    }
  });

  return new Response("ok", { status: 202 });
}

interface GithubPayload {
  action?: string;
  repository?: { full_name: string };
  sender?: { login: string; type: string };
  comment?: { body: string; user?: { login: string; type: string } };
  review?: { body: string | null; user?: { login: string; type: string } };
  issue?: { number: number; pull_request?: unknown };
  pull_request?: { number: number; title?: string };
}

async function processEvent(event: string, payload: GithubPayload) {
  const repo = payload.repository?.full_name;
  if (!repo) return;

  const founderId = await founderForRepo(repo);
  if (!founderId) return;

  // PR-Agent's output arrives as comments/reviews authored by the GitHub App
  // (a Bot sender). Human comments are normal activity — not findings.
  const commentBody =
    payload.comment?.body ?? payload.review?.body ?? undefined;
  const author =
    payload.comment?.user ?? payload.review?.user ?? payload.sender;
  const isBot = author?.type === "Bot";

  const prNumber =
    payload.pull_request?.number ?? payload.issue?.number ?? undefined;

  if (
    (event === "issue_comment" ||
      event === "pull_request_review" ||
      event === "pull_request_review_comment") &&
    payload.action === "created" &&
    commentBody &&
    isBot
  ) {
    await evaluateFinding({
      founderId,
      source: "pr_agent",
      content: `PR-Agent review comment on ${repo}#${prNumber}:\n\n${commentBody}`,
      repo,
      prNumber,
    });
  }
}

/**
 * Map a repository to its founder. A GitHub connection row whose label is the
 * repo full name wins; otherwise fall back to the sole founder (v1 runs
 * single-tenant — revisit when multiple founders share an install).
 */
async function founderForRepo(repo: string): Promise<string | null> {
  const conn = await db.query.connections.findFirst({
    where: eq(connections.label, repo),
  });
  if (conn) return conn.founderId;

  const all = await db.select({ id: founders.id }).from(founders).limit(2);
  return all.length === 1 ? all[0].id : null;
}
