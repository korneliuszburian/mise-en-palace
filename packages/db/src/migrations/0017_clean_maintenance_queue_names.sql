ALTER TABLE "worker_jobs" RENAME TO "maintenance_queue_records";--> statement-breakpoint
ALTER TABLE "maintenance_queue_records" RENAME COLUMN "type" TO "job_type";--> statement-breakpoint
ALTER TABLE "maintenance_queue_records" RENAME COLUMN "available_at" TO "run_after";--> statement-breakpoint
ALTER INDEX "worker_jobs_type_idx" RENAME TO "maintenance_queue_records_job_type_idx";--> statement-breakpoint
ALTER INDEX "worker_jobs_status_available_at_idx" RENAME TO "maintenance_queue_records_status_run_after_idx";--> statement-breakpoint
ALTER TYPE "public"."worker_job_status" RENAME TO "worker_job_status_old";--> statement-breakpoint
CREATE TYPE "public"."maintenance_queue_status" AS ENUM('queued', 'running', 'succeeded', 'failed', 'skipped');--> statement-breakpoint
ALTER TABLE "maintenance_queue_records"
  ALTER COLUMN "status"
  DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "maintenance_queue_records"
  ALTER COLUMN "status"
  TYPE "public"."maintenance_queue_status"
  USING (
    case "status"::text
      when 'dead_letter' then 'failed'
      when 'cancelled' then 'skipped'
      else "status"::text
    end
  )::"public"."maintenance_queue_status";--> statement-breakpoint
ALTER TABLE "maintenance_queue_records"
  ALTER COLUMN "status"
  SET DEFAULT 'queued';--> statement-breakpoint
DROP TYPE "public"."worker_job_status_old";
