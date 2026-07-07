import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Workflow, Cable } from "lucide-react";
import { db } from "@/db";
import { connections } from "@/db/schema";
import { getFounder } from "@/lib/founder";

export const dynamic = "force-dynamic";

/* ---------------------------------------------------------------------------
   Connectors — what's wired into Neaven's memory. Live connections from the
   database; planned ones stated as planned, not faked.
--------------------------------------------------------------------------- */

const PLANNED = [
  { name: "Notion", detail: "docs & workspace context" },
  { name: "Google Calendar", detail: "schedule awareness" },
  { name: "Gmail", detail: "inbox context" },
  { name: "Stripe", detail: "live revenue, beyond seeded data" },
];

const PROVIDER_ICON: Record<string, typeof Cable> = {
  activepieces: Workflow,
};

export default async function ConnectorsPage() {
  const founder = await getFounder();
  if (!founder) redirect("/login");

  const rows = await db.query.connections.findMany({
    where: eq(connections.founderId, founder.id),
    orderBy: desc(connections.createdAt),
    columns: { authToken: false },
  });

  return (
    <div className="mx-auto max-w-[860px] px-8 py-9">
      <header className="animate-rise">
        <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em]">Connectors</h1>
        <p className="mt-1.5 max-w-[560px] text-[13px] leading-relaxed text-muted-foreground">
          Everything connected here feeds the co-founder&apos;s memory — it
          argues better the more real context it holds.
        </p>
      </header>

      <section className="mt-9">
        <div className="border-b border-border-strong pb-2.5">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Connected
          </h2>
        </div>
        {rows.length ? (
          <ul>
            {rows.map((c) => {
              const Icon = PROVIDER_ICON[c.provider] ?? Cable;
              return (
                <li key={c.id} className="flex items-center gap-4 border-b border-border py-4">
                  <Icon className="h-4 w-4 shrink-0 text-secondary-foreground" strokeWidth={1.8} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-medium">{c.label}</p>
                    <p className="mt-0.5 font-mono text-[10.5px] text-faint-foreground">
                      {c.provider} · since{" "}
                      {new Date(c.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.08em] ${
                      c.status === "active" ? "text-success" : "text-danger"
                    }`}
                  >
                    <span className={`h-[6px] w-[6px] rounded-full ${c.status === "active" ? "bg-success" : "bg-danger"}`} />
                    {c.status}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="py-8 font-mono text-[12px] leading-relaxed text-faint-foreground">
            — nothing connected yet. The automation engine connects itself the
            first time you open the builder.
          </p>
        )}
      </section>

      <section className="mt-8">
        <div className="border-b border-border-strong pb-2.5">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Planned
          </h2>
        </div>
        <ul>
          {PLANNED.map((p) => (
            <li key={p.name} className="flex items-center justify-between border-b border-border py-3.5">
              <div>
                <p className="text-[13.5px] text-secondary-foreground">{p.name}</p>
                <p className="mt-0.5 font-mono text-[10.5px] text-faint-foreground">{p.detail}</p>
              </div>
              <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-faint-foreground">
                planned
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-5 font-mono text-[11px] leading-relaxed text-faint-foreground">
          connections attach per-request as MCP servers — one entry each, no
          bespoke integrations to maintain.
        </p>
      </section>
    </div>
  );
}
