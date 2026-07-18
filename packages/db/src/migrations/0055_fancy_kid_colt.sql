CREATE TYPE "public"."activation_runtime_proof_status" AS ENUM('passed', 'failed');--> statement-breakpoint
CREATE TABLE "activation_runtime_proofs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"environment_fingerprint_id" text NOT NULL,
	"store_identity" text NOT NULL,
	"status" "activation_runtime_proof_status" NOT NULL,
	"captured_at" timestamp with time zone NOT NULL,
	"cleanup_remaining_marker_count" integer NOT NULL,
	"report" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activation_runtime_proofs_cleanup_count_nonnegative" CHECK ("activation_runtime_proofs"."cleanup_remaining_marker_count" >= 0)
);
--> statement-breakpoint
CREATE INDEX "activation_runtime_proofs_lookup_idx" ON "activation_runtime_proofs" USING btree ("store_identity","environment_fingerprint_id","status","captured_at");