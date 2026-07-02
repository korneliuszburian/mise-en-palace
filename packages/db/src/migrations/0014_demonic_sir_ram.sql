ALTER TABLE "anti_memory_candidates" ADD CONSTRAINT "anti_memory_candidates_confidence_range" CHECK ("anti_memory_candidates"."confidence" >= 0 AND "anti_memory_candidates"."confidence" <= 100);--> statement-breakpoint
ALTER TABLE "anti_memory_candidates" ADD CONSTRAINT "anti_memory_candidates_source_evidence_non_empty" CHECK ("anti_memory_candidates"."invalidated_by_source_claim_id" IS NOT NULL OR jsonb_array_length("anti_memory_candidates"."invalidated_by_source_claim_ids") > 0 OR jsonb_array_length("anti_memory_candidates"."source_lineage") > 0);--> statement-breakpoint
ALTER TABLE "anti_memory_candidates" ADD CONSTRAINT "anti_memory_candidates_temporal_window" CHECK ("anti_memory_candidates"."valid_until" IS NULL OR "anti_memory_candidates"."valid_until" > "anti_memory_candidates"."valid_from");--> statement-breakpoint
ALTER TABLE "anti_memory_records" ADD CONSTRAINT "anti_memory_records_confidence_range" CHECK ("anti_memory_records"."confidence" >= 0 AND "anti_memory_records"."confidence" <= 100);--> statement-breakpoint
ALTER TABLE "anti_memory_records" ADD CONSTRAINT "anti_memory_records_source_evidence_non_empty" CHECK ("anti_memory_records"."invalidated_by_source_claim_id" IS NOT NULL OR jsonb_array_length("anti_memory_records"."invalidated_by_source_claim_ids") > 0 OR jsonb_array_length("anti_memory_records"."source_lineage") > 0);--> statement-breakpoint
ALTER TABLE "anti_memory_records" ADD CONSTRAINT "anti_memory_records_temporal_window" CHECK ("anti_memory_records"."valid_until" IS NULL OR "anti_memory_records"."valid_until" > "anti_memory_records"."valid_from");--> statement-breakpoint
ALTER TABLE "memory_candidates" ADD CONSTRAINT "memory_candidates_confidence_range" CHECK ("memory_candidates"."confidence" >= 0 AND "memory_candidates"."confidence" <= 100);--> statement-breakpoint
ALTER TABLE "memory_candidates" ADD CONSTRAINT "memory_candidates_application_guidance_non_empty" CHECK (length(btrim("memory_candidates"."application_guidance")) > 0);--> statement-breakpoint
ALTER TABLE "memory_candidates" ADD CONSTRAINT "memory_candidates_source_lineage_non_empty" CHECK (jsonb_array_length("memory_candidates"."source_lineage") > 0);--> statement-breakpoint
ALTER TABLE "memory_candidates" ADD CONSTRAINT "memory_candidates_temporal_invalidation_strategy" CHECK ("memory_candidates"."valid_until" IS NULL OR (
  "memory_candidates"."valid_until" > "memory_candidates"."valid_from"
  AND "memory_candidates"."invalidation_rule" IS NOT NULL
  AND length(btrim("memory_candidates"."invalidation_rule")) > 0
));--> statement-breakpoint
ALTER TABLE "memory_edges" ADD CONSTRAINT "memory_edges_strength_range" CHECK ("memory_edges"."strength" >= 0 AND "memory_edges"."strength" <= 100);--> statement-breakpoint
ALTER TABLE "memory_record_versions" ADD CONSTRAINT "memory_record_versions_confidence_range" CHECK ("memory_record_versions"."confidence" >= 0 AND "memory_record_versions"."confidence" <= 100);--> statement-breakpoint
ALTER TABLE "memory_record_versions" ADD CONSTRAINT "memory_record_versions_application_guidance_non_empty" CHECK (length(btrim("memory_record_versions"."application_guidance")) > 0);--> statement-breakpoint
ALTER TABLE "memory_record_versions" ADD CONSTRAINT "memory_record_versions_source_lineage_non_empty" CHECK (jsonb_array_length("memory_record_versions"."source_lineage") > 0);--> statement-breakpoint
ALTER TABLE "memory_record_versions" ADD CONSTRAINT "memory_record_versions_temporal_invalidation_strategy" CHECK ("memory_record_versions"."valid_until" IS NULL OR (
  "memory_record_versions"."valid_until" > "memory_record_versions"."valid_from"
  AND "memory_record_versions"."invalidation_rule" IS NOT NULL
  AND length(btrim("memory_record_versions"."invalidation_rule")) > 0
));--> statement-breakpoint
ALTER TABLE "memory_records" ADD CONSTRAINT "memory_records_confidence_range" CHECK ("memory_records"."confidence" >= 0 AND "memory_records"."confidence" <= 100);--> statement-breakpoint
ALTER TABLE "memory_records" ADD CONSTRAINT "memory_records_application_guidance_non_empty" CHECK (length(btrim("memory_records"."application_guidance")) > 0);--> statement-breakpoint
ALTER TABLE "memory_records" ADD CONSTRAINT "memory_records_source_lineage_non_empty" CHECK (jsonb_array_length("memory_records"."source_lineage") > 0);--> statement-breakpoint
ALTER TABLE "memory_records" ADD CONSTRAINT "memory_records_temporal_invalidation_strategy" CHECK ("memory_records"."valid_until" IS NULL OR (
  "memory_records"."valid_until" > "memory_records"."valid_from"
  AND "memory_records"."invalidation_rule" IS NOT NULL
  AND length(btrim("memory_records"."invalidation_rule")) > 0
));