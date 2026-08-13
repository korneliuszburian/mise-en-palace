ALTER TABLE "memory_feedback_events" ADD COLUMN "run_id" text;--> statement-breakpoint
ALTER TABLE "memory_feedback_events" ADD COLUMN "packet_checksum" text;--> statement-breakpoint
ALTER TABLE "memory_feedback_events" ADD COLUMN "outcome" text;--> statement-breakpoint
ALTER TABLE "memory_feedback_events" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
CREATE UNIQUE INDEX "memory_feedback_events_idempotency_key_unique" ON "memory_feedback_events" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "memory_feedback_events_memory_record_outcome_idx" ON "memory_feedback_events" USING btree ("memory_record_id","outcome");--> statement-breakpoint
ALTER TABLE "memory_feedback_events" ADD CONSTRAINT "memory_feedback_events_packet_outcome_known" CHECK ("memory_feedback_events"."outcome" IS NULL OR "memory_feedback_events"."outcome" IN ('helped', 'hurt', 'stale'));