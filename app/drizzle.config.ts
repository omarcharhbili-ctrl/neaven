import { defineConfig } from "drizzle-kit";
import { readFileSync } from "fs";

// drizzle-kit runs outside Next.js (which is what normally loads .env.local),
// AND its bundler statically inlines dot-access `process.env.X` reads at
// compile time — so we must load the file ourselves and read the value with a
// dynamic key to defeat the static replacement.
function envFromDotfile(key: string): string | undefined {
  const dynamicEnv: Record<string, string | undefined> = process.env;
  if (dynamicEnv[key]) return dynamicEnv[key];
  try {
    // split on \r?\n — with CRLF endings, `.` won't match \r so a `$`-anchored
    // regex on a "\n"-split line silently fails to match at all
    for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && m[1] === key) return m[2].trim();
    }
  } catch {
    // no .env.local — rely on the environment
  }
  return undefined;
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: envFromDotfile("DATABASE_URL")!,
  },
});
