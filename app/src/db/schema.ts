import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  date,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const agentKind = pgEnum("agent_kind", [
  "watcher",
  "analytics",
  "automation",
]);

export const findingKind = pgEnum("finding_kind", [
  "drift",
  "stall",
  "quality",
]);

export const findingSeverity = pgEnum("finding_severity", [
  "low",
  "medium",
  "high",
]);

export const findingSource = pgEnum("finding_source", [
  "mcp_checkin",
  "pr_agent",
  "manual",
]);

export const significance = pgEnum("significance", [
  "info",
  "milestone",
  "anomaly",
]);

export const progressStatus = pgEnum("progress_status", [
  "done",
  "in_flight",
  "next",
]);

export const connectionStatus = pgEnum("connection_status", [
  "active",
  "error",
  "revoked",
]);

export const automationEvent = pgEnum("automation_event", [
  "created",
  "updated",
  "broken",
  "needs_input",
  "deleted",
]);

export const automationOrigin = pgEnum("automation_origin", [
  "proactive",
  "founder_chat",
  "founder_direct",
]);

export const chatRole = pgEnum("chat_role", ["user", "assistant"]);

export const memoryNoteKind = pgEnum("memory_note_kind", [
  "argument_outcome", // how the founder responded to pushback — feeds self-calibration
  "preference",
  "context",
]);

// ---------------------------------------------------------------------------
// Founders (Clerk-linked)
// ---------------------------------------------------------------------------

export const founders = pgTable(
  "founders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkUserId: text("clerk_user_id").notNull(),
    email: text("email").notNull(),
    name: text("name"),
    timezone: text("timezone").notNull().default("UTC"),
    onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
    // Background, decision patterns, how they respond to pushback — refined over time.
    profile: jsonb("profile").notNull().default({}),
    // Main agent conversational-aggressiveness dial (1 = gentle, 5 = relentless).
    harness: integer("harness").notNull().default(3),
    // Watcher depth/accuracy dial — a separate setting per the Watcher spec.
    watcherDepth: integer("watcher_depth").notNull().default(3),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("founders_clerk_user_id_idx").on(t.clerkUserId)],
);

// ---------------------------------------------------------------------------
// Vision baseline — versioned; drift is always measured against the CURRENT row
// ---------------------------------------------------------------------------

export const visionBaselines = pgTable(
  "vision_baselines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    founderId: uuid("founder_id")
      .notNull()
      .references(() => founders.id, { onDelete: "cascade" }),
    vision: text("vision").notNull(),
    scope: text("scope").notNull().default(""),
    brand: text("brand").notNull().default(""),
    version: integer("version").notNull().default(1),
    isCurrent: boolean("is_current").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("vision_founder_current_idx").on(t.founderId, t.isCurrent)],
);

// ---------------------------------------------------------------------------
// Progress — what's done, in flight, next
// ---------------------------------------------------------------------------

export const progressItems = pgTable(
  "progress_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    founderId: uuid("founder_id")
      .notNull()
      .references(() => founders.id, { onDelete: "cascade" }),
    item: text("item").notNull(),
    detail: text("detail"),
    status: progressStatus("status").notNull().default("next"),
    source: text("source").notNull().default("founder"), // founder | agent
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("progress_founder_idx").on(t.founderId, t.status)],
);

// ---------------------------------------------------------------------------
// Connections — MCP servers / OAuth'd tools passed into main agent requests
// ---------------------------------------------------------------------------

export const connections = pgTable(
  "connections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    founderId: uuid("founder_id")
      .notNull()
      .references(() => founders.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(), // notion | calendar | gmail | stripe | ...
    label: text("label").notNull(),
    serverUrl: text("server_url"), // MCP server URL, passed via mcp_servers per request
    authToken: text("auth_token"), // OAuth token — v1 plaintext, encrypt before GA
    // mcp_toolset allow/deny config — hard tool-level permissions (LLM spec §MCP)
    toolsetConfig: jsonb("toolset_config").notNull().default({}),
    status: connectionStatus("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("connections_founder_idx").on(t.founderId)],
);

// ---------------------------------------------------------------------------
// Sub-agent summaries — event-driven pushes, summary-first reporting model
// ---------------------------------------------------------------------------

export const subAgentSummaries = pgTable(
  "sub_agent_summaries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    founderId: uuid("founder_id")
      .notNull()
      .references(() => founders.id, { onDelete: "cascade" }),
    agent: agentKind("agent").notNull(),
    summary: text("summary").notNull(),
    significance: significance("significance").notNull().default("info"),
    // Full underlying context for the main agent's on-demand deep pull.
    payload: jsonb("payload").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("summaries_founder_agent_idx").on(t.founderId, t.agent, t.createdAt)],
);

// ---------------------------------------------------------------------------
// Watcher two-tier memory: raw findings (working memory, ~30d) + durable tips
// ---------------------------------------------------------------------------

export const rawFindings = pgTable(
  "raw_findings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    founderId: uuid("founder_id")
      .notNull()
      .references(() => founders.id, { onDelete: "cascade" }),
    source: findingSource("source").notNull(),
    kind: findingKind("kind").notNull(),
    severity: findingSeverity("severity").notNull().default("low"),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    repo: text("repo"),
    prNumber: integer("pr_number"),
    meta: jsonb("meta").notNull().default({}),
    interrupted: boolean("interrupted").notNull().default(false), // cleared the live-interruption bar
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), // pruned after ~30 days
  },
  (t) => [index("raw_findings_founder_idx").on(t.founderId, t.createdAt)],
);

export const tips = pgTable(
  "tips",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    founderId: uuid("founder_id")
      .notNull()
      .references(() => founders.id, { onDelete: "cascade" }),
    category: findingKind("category").notNull(),
    pattern: text("pattern").notNull(),
    occurrences: integer("occurrences").notNull().default(1),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("tips_founder_idx").on(t.founderId, t.category)],
);

// ---------------------------------------------------------------------------
// Watcher MCP check-in keys ("Setup MCP" flow)
// ---------------------------------------------------------------------------

export const watcherKeys = pgTable(
  "watcher_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    founderId: uuid("founder_id")
      .notNull()
      .references(() => founders.id, { onDelete: "cascade" }),
    keyHash: text("key_hash").notNull(), // sha256 of the API key — raw key shown once
    label: text("label").notNull().default("default"),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("watcher_keys_hash_idx").on(t.keyHash)],
);

// ---------------------------------------------------------------------------
// Automations log — main agent always knows an automation exists
// ---------------------------------------------------------------------------

export const automationsLog = pgTable(
  "automations_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    founderId: uuid("founder_id")
      .notNull()
      .references(() => founders.id, { onDelete: "cascade" }),
    externalId: text("external_id"), // Activepieces flow id
    name: text("name").notNull(),
    event: automationEvent("event").notNull(),
    origin: automationOrigin("origin").notNull().default("founder_direct"),
    detail: jsonb("detail").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("automations_founder_idx").on(t.founderId, t.createdAt)],
);

// ---------------------------------------------------------------------------
// Main agent chat
// ---------------------------------------------------------------------------

export const chatThreads = pgTable(
  "chat_threads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    founderId: uuid("founder_id")
      .notNull()
      .references(() => founders.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("New conversation"),
    starred: boolean("starred").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("threads_founder_idx").on(t.founderId, t.updatedAt)],
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => chatThreads.id, { onDelete: "cascade" }),
    role: chatRole("role").notNull(),
    content: text("content").notNull(),
    // Visible reasoning trace: [{ type: "thinking" | "consulted", agent?, text }]
    reasoning: jsonb("reasoning").notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("messages_thread_idx").on(t.threadId, t.createdAt)],
);

// ---------------------------------------------------------------------------
// Daily briefs — one per founder per day, timezone-aware, never empty
// ---------------------------------------------------------------------------

export const dailyBriefs = pgTable(
  "daily_briefs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    founderId: uuid("founder_id")
      .notNull()
      .references(() => founders.id, { onDelete: "cascade" }),
    briefDate: date("brief_date").notNull(),
    // [{ kind: "task" | "news" | "handled" | "next_step", title, detail, done }]
    items: jsonb("items").notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("briefs_founder_date_idx").on(t.founderId, t.briefDate)],
);

// ---------------------------------------------------------------------------
// Memory notes — plain-language memory (argument outcomes, preferences).
// No numeric scores: tone self-calibrates from accumulated context.
// ---------------------------------------------------------------------------

export const memoryNotes = pgTable(
  "memory_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    founderId: uuid("founder_id")
      .notNull()
      .references(() => founders.id, { onDelete: "cascade" }),
    kind: memoryNoteKind("kind").notNull(),
    note: text("note").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("memory_notes_founder_idx").on(t.founderId, t.kind)],
);
