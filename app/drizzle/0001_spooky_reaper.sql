CREATE TYPE "public"."breakdown_kind" AS ENUM('source', 'page', 'country', 'device');--> statement-breakpoint
CREATE TABLE "revenue_daily" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"founder_id" uuid NOT NULL,
	"day" date NOT NULL,
	"mrr_cents" integer NOT NULL,
	"new_mrr_cents" integer NOT NULL,
	"churned_mrr_cents" integer NOT NULL,
	"customers" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "traffic_breakdown" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"founder_id" uuid NOT NULL,
	"day" date NOT NULL,
	"kind" "breakdown_kind" NOT NULL,
	"key" text NOT NULL,
	"visitors" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "traffic_daily" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"founder_id" uuid NOT NULL,
	"day" date NOT NULL,
	"visitors" integer NOT NULL,
	"pageviews" integer NOT NULL,
	"avg_session_secs" integer NOT NULL,
	"bounce_rate" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "revenue_daily" ADD CONSTRAINT "revenue_daily_founder_id_founders_id_fk" FOREIGN KEY ("founder_id") REFERENCES "public"."founders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traffic_breakdown" ADD CONSTRAINT "traffic_breakdown_founder_id_founders_id_fk" FOREIGN KEY ("founder_id") REFERENCES "public"."founders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traffic_daily" ADD CONSTRAINT "traffic_daily_founder_id_founders_id_fk" FOREIGN KEY ("founder_id") REFERENCES "public"."founders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "revenue_daily_founder_day_idx" ON "revenue_daily" USING btree ("founder_id","day");--> statement-breakpoint
CREATE INDEX "traffic_breakdown_idx" ON "traffic_breakdown" USING btree ("founder_id","kind","day");--> statement-breakpoint
CREATE UNIQUE INDEX "traffic_daily_founder_day_idx" ON "traffic_daily" USING btree ("founder_id","day");