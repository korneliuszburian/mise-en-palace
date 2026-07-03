ALTER TABLE "memory_activation_traces" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "memory_edges" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "memory_activation_traces" CASCADE;--> statement-breakpoint
DROP TABLE "memory_edges" CASCADE;--> statement-breakpoint
ALTER TABLE "anti_memory_candidates" DROP CONSTRAINT "anti_memory_candidates_source_evidence_non_empty";--> statement-breakpoint
ALTER TABLE "anti_memory_records" DROP CONSTRAINT "anti_memory_records_source_evidence_non_empty";--> statement-breakpoint
ALTER TABLE "anti_memory_candidates" ADD CONSTRAINT "anti_memory_candidates_source_evidence_non_empty" CHECK ("anti_memory_candidates"."invalidated_by_source_claim_id" IS NOT NULL
  OR jsonb_array_length("anti_memory_candidates"."invalidated_by_source_claim_ids") > 0
  OR jsonb_array_length("anti_memory_candidates"."source_lineage") > 0);--> statement-breakpoint
ALTER TABLE "anti_memory_records" ADD CONSTRAINT "anti_memory_records_source_evidence_non_empty" CHECK ("anti_memory_records"."invalidated_by_source_claim_id" IS NOT NULL
  OR jsonb_array_length("anti_memory_records"."invalidated_by_source_claim_ids") > 0
  OR jsonb_array_length("anti_memory_records"."source_lineage") > 0);--> statement-breakpoint
DROP TYPE "public"."memory_activation_decision";--> statement-breakpoint
DROP TYPE "public"."memory_edge_kind";