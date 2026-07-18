DROP INDEX "activation_runtime_proofs_lookup_idx";--> statement-breakpoint
ALTER TABLE "activation_runtime_proofs" ADD COLUMN "proof_kind" text DEFAULT 'activation' NOT NULL;--> statement-breakpoint
ALTER TABLE "activation_runtime_proofs" ADD COLUMN "scope_key" text DEFAULT 'activation' NOT NULL;--> statement-breakpoint
ALTER TABLE "activation_runtime_proofs" ADD COLUMN "project_id" text;--> statement-breakpoint
CREATE INDEX "activation_runtime_proofs_lookup_idx" ON "activation_runtime_proofs" USING btree ("proof_kind","scope_key","store_identity","environment_fingerprint_id","status","captured_at");--> statement-breakpoint
ALTER TABLE "activation_runtime_proofs" ADD CONSTRAINT "activation_runtime_proofs_kind_known" CHECK ("activation_runtime_proofs"."proof_kind" in ('activation', 'target_repo_harness'));