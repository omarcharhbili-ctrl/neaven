/* Seed 90 days of realistic analytics for every founder in the dev DB.
   Growth trend + weekly seasonality + noise, a launch spike 12 days ago,
   dimensional breakdowns, and MRR history. Idempotent: wipes + reseeds.
   Run from app/:  node scripts/seed-analytics.cjs */
const { Pool } = require("pg");
const { readFileSync } = require("fs");
const path = require("path");

for (const line of readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const DAYS = 90;
const SPIKE_DAY_OFFSET = 12; // launch spike N days ago

// Deterministic PRNG so reseeding produces the same story.
let rngState = 42;
const rand = () => {
  rngState = (rngState * 1103515245 + 12345) % 2 ** 31;
  return rngState / 2 ** 31;
};

const SOURCES = [
  ["Google", 0.31], ["Direct", 0.24], ["X / Twitter", 0.14], ["GitHub", 0.11],
  ["Hacker News", 0.08], ["Product Hunt", 0.06], ["LinkedIn", 0.04], ["Reddit", 0.02],
];
const PAGES = [
  ["/", 0.38], ["/pricing", 0.17], ["/blog/why-founders-need-pushback", 0.13],
  ["/docs/getting-started", 0.11], ["/blog/vision-drift", 0.08], ["/changelog", 0.07], ["/about", 0.06],
];
const COUNTRIES = [
  ["United States", 0.32], ["Germany", 0.13], ["United Kingdom", 0.11], ["France", 0.09],
  ["India", 0.08], ["Canada", 0.07], ["Morocco", 0.06], ["Netherlands", 0.05], ["Australia", 0.04],
];
const DEVICES = [["Desktop", 0.68], ["Mobile", 0.27], ["Tablet", 0.05]];

function dayISO(offsetBack) {
  const d = new Date();
  d.setDate(d.getDate() - offsetBack);
  return d.toISOString().slice(0, 10);
}

async function seedFounder(founderId) {
  await pool.query("DELETE FROM traffic_daily WHERE founder_id = $1", [founderId]);
  await pool.query("DELETE FROM traffic_breakdown WHERE founder_id = $1", [founderId]);
  await pool.query("DELETE FROM revenue_daily WHERE founder_id = $1", [founderId]);

  let mrrCents = 78000; // $780 at the start of the window
  let customers = 13;

  for (let back = DAYS - 1; back >= 0; back--) {
    const day = dayISO(back);
    const t = (DAYS - 1 - back) / (DAYS - 1); // 0 → 1 across the window
    const weekday = new Date(day).getDay();
    const weekendDip = weekday === 0 || weekday === 6 ? 0.62 : 1;
    const spike = back === SPIKE_DAY_OFFSET ? 4.6 : back === SPIKE_DAY_OFFSET - 1 ? 2.1 : 1;

    const base = 140 + 260 * t; // steady growth 140 → 400/day
    const visitors = Math.round(base * weekendDip * spike * (0.85 + rand() * 0.3));
    const pageviews = Math.round(visitors * (2.1 + rand() * 0.7));
    const avgSession = Math.round(95 + 60 * t + rand() * 45);
    const bounce = Math.round(62 - 9 * t + rand() * 8 - (spike > 1 ? 6 : 0));

    await pool.query(
      "INSERT INTO traffic_daily (founder_id, day, visitors, pageviews, avg_session_secs, bounce_rate) VALUES ($1,$2,$3,$4,$5,$6)",
      [founderId, day, visitors, pageviews, avgSession, bounce],
    );

    const dims = [
      ["source", SOURCES], ["page", PAGES], ["country", COUNTRIES], ["device", DEVICES],
    ];
    for (const [kind, entries] of dims) {
      for (const [key, share] of entries) {
        // HN/PH dominate the spike day — that's what a launch looks like
        let s = share;
        if (spike > 1 && kind === "source") {
          if (key === "Hacker News") s = 0.42;
          else if (key === "Product Hunt") s = 0.13;
          else s = share * 0.55;
        }
        const v = Math.round(visitors * s * (0.9 + rand() * 0.2));
        if (v > 0) {
          await pool.query(
            "INSERT INTO traffic_breakdown (founder_id, day, kind, key, visitors) VALUES ($1,$2,$3,$4,$5)",
            [founderId, day, kind, key, v],
          );
        }
      }
    }

    // Revenue: slow compounding, a churn dent mid-window, post-launch bump.
    let newMrr = 0;
    let churned = 0;
    if (rand() < 0.38 + 0.25 * t + (back <= SPIKE_DAY_OFFSET ? 0.2 : 0)) {
      const seats = 1 + Math.floor(rand() * 2);
      newMrr = seats * (rand() < 0.3 ? 7900 : 2900); // pro vs starter plans
      customers += seats;
    }
    if (back === 47 || rand() < 0.05) {
      churned = 2900;
      customers = Math.max(1, customers - 1);
    }
    mrrCents += newMrr - churned;
    await pool.query(
      "INSERT INTO revenue_daily (founder_id, day, mrr_cents, new_mrr_cents, churned_mrr_cents, customers) VALUES ($1,$2,$3,$4,$5,$6)",
      [founderId, day, mrrCents, newMrr, churned, customers],
    );
  }
}

(async () => {
  const founders = await pool.query("SELECT id, email FROM founders");
  if (!founders.rows.length) {
    console.log("No founders in DB — sign in once first.");
    process.exit(1);
  }
  for (const f of founders.rows) {
    rngState = 42; // same story for every founder
    await seedFounder(f.id);
    const check = await pool.query(
      "SELECT count(*) c, min(day) f, max(day) l FROM traffic_daily WHERE founder_id = $1",
      [f.id],
    );
    console.log(`seeded ${f.email}: ${check.rows[0].c} days (${check.rows[0].f} → ${check.rows[0].l})`);
  }
  await pool.end();
})();
