CREATE TYPE "public"."agent_kind" AS ENUM('watcher', 'analytics', 'automation');--> statement-breakpoint
CREATE TYPE "public"."automation_event" AS ENUM('created', 'updated', 'broken', 'needs_input', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."automation_origin" AS ENUM('proactive', 'founder_chat', 'founder_direct');--> statement-breakpoint
CREATE TYPE "public"."chat_role" AS ENUM('user', 'assistant');--> statement-breakpoint
CREATE TYPE "public"."connection_status" AS ENUM('active', 'error', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."finding_kind" AS ENUM('drift', 'stall', 'quality');--> statement-breakpoint
CREATE TYPE "public"."finding_severity" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."finding_source" AS ENUM('mcp_checkin', 'pr_agent', 'manual');--> statement-breakpoint
CREATE TYPE "public"."memory_note_kind" AS ENUM('argument_outcome', 'preference', 'context');--> statement-breakpoint
CREATE TYPE "public"."progress_status" AS ENUM('done', 'in_flight', 'next');--> statement-breakpoint
CREATE TYPE "public"."significance" AS ENUM('info', 'milestone', 'anomaly');--> statement-breakpoint
CREATE TABLE "automations_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"founder_id" uuid NOT NULL,
	"external_id" text,
	"name" text NOT NULL,
	"event" "automation_event" NOT NULL,
	"origin" "automation_origin" DEFAULT 'founder_direct' NOT NULL,
	"detail" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"role" "chat_role" NOT NULL,
	"content" text NOT NULL,
	"reasoning" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"founder_id" uuid NOT NULL,
	"title" text DEFAULT 'New conversation' NOT NULL,
	"starred" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"founder_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"label" text NOT NULL,
	"server_url" text,
	"auth_token" text,
	"toolset_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "connection_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_briefs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"founder_id" uuid NOT NULL,
	"brief_date" date NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "founders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"profile" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"harness" integer DEFAULT 3 NOT NULL,
	"watcher_depth" integer DEFAULT 3 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memory_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"founder_id" uuid NOT NULL,
	"kind" "memory_note_kind" NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "progress_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"founder_id" uuid NOT NULL,
	"item" text NOT NULL,
	"detail" text,
	"status" "progress_status" DEFAULT 'next' NOT NULL,
	"source" text DEFAULT 'founder' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raw_findings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"founder_id" uuid NOT NULL,
	"source" "finding_source" NOT NULL,
	"kind" "finding_kind" NOT NULL,
	"severity" "finding_severity" DEFAULT 'low' NOT NULL,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"repo" text,
	"pr_number" integer,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"interrupted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sub_agent_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"founder_id" uuid NOT NULL,
	"agent" "agent_kind" NOT NULL,
	"summary" text NOT NULL,
	"significance" "significance" DEFAULT 'info' NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"founder_id" uuid NOT NULL,
	"category" "finding_kind" NOT NULL,
	"pattern" text NOT NULL,
	"occurrences" integer DEFAULT 1 NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vision_baselines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"founder_id" uuid NOT NULL,
	"vision" text NOT NULL,
	"scope" text DEFAULT '' NOT NULL,
	"brand" text DEFAULT '' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_current" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watcher_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"founder_id" uuid NOT NULL,
	"key_hash" text NOT NULL,
	"label" text DEFAULT 'default' NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "automations_log" ADD CONSTRAINT "automations_log_founder_id_founders_id_fk" FOREIGN KEY ("founder_id") REFERENCES "public"."founders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_thread_id_chat_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."chat_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_founder_id_founders_id_fk" FOREIGN KEY ("founder_id") REFERENCES "public"."founders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connections" ADD CONSTRAINT "connections_founder_id_founders_id_fk" FOREIGN KEY ("founder_id") REFERENCES "public"."founders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_briefs" ADD CONSTRAINT "daily_briefs_founder_id_founders_id_fk" FOREIGN KEY ("founder_id") REFERENCES "public"."founders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_notes" ADD CONSTRAINT "memory_notes_founder_id_founders_id_fk" FOREIGN KEY ("founder_id") REFERENCES "public"."founders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_items" ADD CONSTRAINT "progress_items_founder_id_founders_id_fk" FOREIGN KEY ("founder_id") REFERENCES "public"."founders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw_findings" ADD CONSTRAINT "raw_findings_founder_id_founders_id_fk" FOREIGN KEY ("founder_id") REFERENCES "public"."founders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_agent_summaries" ADD CONSTRAINT "sub_agent_summaries_founder_id_founders_id_fk" FOREIGN KEY ("founder_id") REFERENCES "public"."founders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tips" ADD CONSTRAINT "tips_founder_id_founders_id_fk" FOREIGN KEY ("founder_id") REFERENCES "public"."founders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vision_baselines" ADD CONSTRAINT "vision_baselines_founder_id_founders_id_fk" FOREIGN KEY ("founder_id") REFERENCES "public"."founders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watcher_keys" ADD CONSTRAINT "watcher_keys_founder_id_founders_id_fk" FOREIGN KEY ("founder_id") REFERENCES "public"."founders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "automations_founder_idx" ON "automations_log" USING btree ("founder_id","created_at");--> statement-breakpoint
CREATE INDEX "messages_thread_idx" ON "chat_messages" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "threads_founder_idx" ON "chat_threads" USING btree ("founder_id","updated_at");--> statement-breakpoint
CREATE INDEX "connections_founder_idx" ON "connections" USING btree ("founder_id");--> statement-breakpoint
CREATE UNIQUE INDEX "briefs_founder_date_idx" ON "daily_briefs" USING btree ("founder_id","brief_date");--> statement-breakpoint
CREATE UNIQUE INDEX "founders_clerk_user_id_idx" ON "founders" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "memory_notes_founder_idx" ON "memory_notes" USING btree ("founder_id","kind");--> statement-breakpoint
CREATE INDEX "progress_founder_idx" ON "progress_items" USING btree ("founder_id","status");--> statement-breakpoint
CREATE INDEX "raw_findings_founder_idx" ON "raw_findings" USING btree ("founder_id","created_at");--> statement-breakpoint
CREATE INDEX "summaries_founder_agent_idx" ON "sub_agent_summaries" USING btree ("founder_id","agent","created_at");--> statement-breakpoint
CREATE INDEX "tips_founder_idx" ON "tips" USING btree ("founder_id","category");--> statement-breakpoint
CREATE INDEX "vision_founder_current_idx" ON "vision_baselines" USING btree ("founder_id","is_current");--> statement-breakpoint
CREATE UNIQUE INDEX "watcher_keys_hash_idx" ON "watcher_keys" USING btree ("key_hash");