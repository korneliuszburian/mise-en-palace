ALTER TABLE "memory_candidates" ALTER COLUMN "source_lineage" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "memory_record_versions" ALTER COLUMN "source_lineage" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "memory_records" ALTER COLUMN "source_lineage" DROP DEFAULT;