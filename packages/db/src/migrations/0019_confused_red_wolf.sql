ALTER TABLE "maintenance_queue_records" ADD COLUMN "queue_key" text;--> statement-breakpoint
UPDATE "maintenance_queue_records"
SET "queue_key" = case "job_type"
  when 'embed_source_chunk' then concat(
    'embed_source_chunk:',
    coalesce("payload" ->> 'sourceChunkId', concat('legacy-source-chunk-', "id"::text)),
    ':',
    coalesce("payload" ->> 'embeddingModelId', 'legacy-embedding-model')
  )
  when 'embed_memory_record' then concat(
    'embed_memory_record:',
    coalesce("payload" ->> 'memoryRecordId', concat('legacy-memory-record-', "id"::text)),
    ':',
    coalesce("payload" ->> 'embeddingModelId', 'legacy-embedding-model')
  )
  when 'compact_memory' then concat(
    'compact_memory:',
    coalesce("payload" ->> 'projectId', concat('legacy-project-', "id"::text)),
    ':',
    coalesce("payload" ->> 'memoryRecordId', '-')
  )
  when 'detect_contradiction' then concat(
    'detect_contradiction:',
    coalesce("payload" ->> 'projectId', concat('legacy-project-', "id"::text)),
    ':',
    coalesce("payload" ->> 'memoryRecordId', '-'),
    ':',
    coalesce("payload" ->> 'sourceClaimId', '-')
  )
  when 'expire_stale_memory' then concat(
    'expire_stale_memory:',
    coalesce("payload" ->> 'projectId', concat('legacy-project-', "id"::text)),
    ':',
    coalesce("payload" ->> 'olderThan', concat('legacy-older-than-', "id"::text))
  )
  when 'review_feedback_delta' then concat(
    'review_feedback_delta:',
    coalesce("payload" ->> 'projectId', concat('legacy-project-', "id"::text)),
    ':',
    coalesce("payload" ->> 'feedbackDeltaId', concat('legacy-feedback-delta-', "id"::text))
  )
  else concat('legacy-maintenance-queue:', "job_type", ':', "id"::text)
end;--> statement-breakpoint
ALTER TABLE "maintenance_queue_records" ALTER COLUMN "queue_key" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "maintenance_queue_records_queue_key_unique" ON "maintenance_queue_records" USING btree ("queue_key");--> statement-breakpoint
ALTER TABLE "maintenance_queue_records" ADD CONSTRAINT "maintenance_queue_records_queue_key_non_empty" CHECK (length(trim("maintenance_queue_records"."queue_key")) > 0);
