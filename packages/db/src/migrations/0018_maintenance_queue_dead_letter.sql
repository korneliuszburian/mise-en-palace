ALTER TABLE "maintenance_queue_records" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "maintenance_queue_records" ALTER COLUMN "status" SET DATA TYPE text USING "status"::text;--> statement-breakpoint
DROP TYPE "public"."maintenance_queue_status";--> statement-breakpoint
CREATE TYPE "public"."maintenance_queue_status" AS ENUM('queued', 'running', 'succeeded', 'skipped', 'dead_letter');--> statement-breakpoint
ALTER TABLE "maintenance_queue_records" ALTER COLUMN "status" SET DATA TYPE "public"."maintenance_queue_status" USING (
  case
    when "status" = 'failed' then 'dead_letter'
    else "status"
  end
)::"public"."maintenance_queue_status";--> statement-breakpoint
ALTER TABLE "maintenance_queue_records" ALTER COLUMN "status" SET DEFAULT 'queued'::"public"."maintenance_queue_status";
