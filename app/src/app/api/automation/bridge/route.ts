import { randomBytes } from "crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { connections } from "@/db/schema";
import { getFounder } from "@/lib/founder";

/**
 * Clerk → Activepieces login bridge.
 *
 * The founder never sees an Activepieces login screen: on first use we
 * provision an AP user with a random password (stored server-side only),
 * then every visit silently signs in and hands the AP token + project id to
 * the automation tab, which passes it to the embedded builder.
 *
 * Uses only the MIT-licensed core's public auth API (sign-up / sign-in) —
 * no code from the commercial embedding SDK.
 */

// Public origin of the engine — what the founder's browser loads in the
// iframe (e.g. https://automations.neaven.net; http://localhost:8080 in dev).
const AP_URL = process.env.ACTIVEPIECES_URL;
// Server-to-server origin for the auth calls below. In production this is the
// engine's container name over the shared Docker network, which lets the
// proxy block the engine's sign-up/sign-in endpoints from the public
// internet entirely. Falls back to the public URL for local dev.
const AP_INTERNAL_URL = process.env.ACTIVEPIECES_INTERNAL_URL || AP_URL;

interface ApAuthResponse {
  token: string;
  projectId?: string;
  id: string;
  platformId?: string;
}

export async function POST() {
  const founder = await getFounder();
  if (!founder) return new Response("Unauthorized", { status: 401 });
  if (!AP_URL) {
    // Not configured is an expected state, not a failure — the tab renders a
    // designed "engine not connected" card from this.
    return Response.json({ configured: false });
  }

  // Per-founder AP credential lives in the connections table.
  let conn = await db.query.connections.findFirst({
    where: and(
      eq(connections.founderId, founder.id),
      eq(connections.provider, "activepieces"),
    ),
  });

  let password: string;
  if (conn?.authToken) {
    password = (JSON.parse(conn.authToken) as { password: string }).password;
  } else {
    // First visit — provision the AP account silently.
    password = `Nv1!${randomBytes(18).toString("base64url")}`;
    const signUp = await fetch(`${AP_INTERNAL_URL}/api/v1/authentication/sign-up`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: founder.email,
        password,
        firstName: founder.name?.split(" ")[0] || "Founder",
        lastName: founder.name?.split(" ").slice(1).join(" ") || "Neaven",
        trackEvents: false,
        newsLetter: false,
      }),
    });
    if (!signUp.ok && signUp.status !== 409) {
      // 409 = already exists (e.g. provisioned out-of-band) — anything else
      // is a real failure worth surfacing to the tab.
      const body = await signUp.text();
      return Response.json(
        {
          configured: true,
          error: `Activepieces provisioning failed (${signUp.status}): ${body.slice(0, 200)}`,
        },
        { status: 502 },
      );
    }
    [conn] = await db
      .insert(connections)
      .values({
        founderId: founder.id,
        provider: "activepieces",
        label: "Automation engine",
        serverUrl: AP_URL,
        authToken: JSON.stringify({ password }),
      })
      .returning();
  }

  // Silent sign-in on every visit — tokens are short-lived by design.
  const signIn = await fetch(`${AP_INTERNAL_URL}/api/v1/authentication/sign-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: founder.email, password }),
  });
  if (!signIn.ok) {
    const body = await signIn.text();
    return Response.json(
      {
        configured: true,
        error: `Activepieces sign-in failed (${signIn.status}): ${body.slice(0, 200)}`,
      },
      { status: 502 },
    );
  }

  const auth = (await signIn.json()) as ApAuthResponse;
  return Response.json({
    configured: true,
    url: AP_URL,
    token: auth.token,
    projectId: auth.projectId ?? null,
  });
}
