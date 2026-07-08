ALTER TABLE "memory_candidates" ALTER COLUMN "kind" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "memory_records" ALTER COLUMN "kind" SET DATA TYPE text;--> statement-breakpoint
UPDATE "memory_candidates" SET "kind" = 'procedure' WHERE "kind" = 'pattern';--> statement-breakpoint
UPDATE "memory_records" SET "kind" = 'procedure' WHERE "kind" = 'pattern';--> statement-breakpoint
DROP TYPE "public"."memory_record_kind";--> statement-breakpoint
CREATE TYPE "public"."memory_record_kind" AS ENUM('fact', 'preference', 'constraint', 'procedure', 'risk');--> statement-breakpoint
ALTER TABLE "memory_candidates" ALTER COLUMN "kind" SET DATA TYPE "public"."memory_record_kind" USING "kind"::"public"."memory_record_kind";--> statement-breakpoint
ALTER TABLE "memory_records" ALTER COLUMN "kind" SET DATA TYPE "public"."memory_record_kind" USING "kind"::"public"."memory_record_kind";
