CREATE TYPE "public"."source_claim_status" AS ENUM('proposed', 'accepted', 'rejected', 'deprecated');--> statement-breakpoint
CREATE TYPE "public"."source_decision_edge_confidence" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."source_decision_target_type" AS ENUM('harness_run', 'task_contract', 'harness_plan', 'context_assembly', 'evidence_bundle', 'review_assessment', 'feedback_delta', 'architecture_decision', 'memory_record', 'eval_candidate');--> statement-breakpoint
CREATE TYPE "public"."source_rejection_reason" AS ENUM('no_mechanism', 'no_consumer', 'decorative', 'stale', 'conflicting', 'unsupported', 'duplicate');--> statement-breakpoint
ALTER TYPE "public"."source_support_type" ADD VALUE 'mechanism';--> statement-breakpoint
ALTER TYPE "public"."source_support_type" ADD VALUE 'decision';--> statement-breakpoint
ALTER TYPE "public"."source_support_type" ADD VALUE 'risk';--> statement-breakpoint
ALTER TYPE "public"."source_support_type" ADD VALUE 'rejection';--> statement-breakpoint
ALTER TYPE "public"."source_support_type" ADD VALUE 'eval-design';--> statement-breakpoint
ALTER TYPE "public"."source_support_type" ADD VALUE 'implementation-boundary';--> statement-breakpoint
ALTER TYPE "public"."source_trust_tier" ADD VALUE 'primary';--> statement-breakpoint
ALTER TYPE "public"."source_trust_tier" ADD VALUE 'official';--> statement-breakpoint
ALTER TYPE "public"."source_trust_tier" ADD VALUE 'project-decision';--> statement-breakpoint
ALTER TYPE "public"."source_trust_tier" ADD VALUE 'source-code';--> statement-breakpoint
ALTER TYPE "public"."source_trust_tier" ADD VALUE 'paper';--> statement-breakpoint
ALTER TYPE "public"."source_trust_tier" ADD VALUE 'practitioner';--> statement-breakpoint
ALTER TYPE "public"."source_trust_tier" ADD VALUE 'secondary';--> statement-breakpoint
ALTER TYPE "public"."source_trust_tier" ADD VALUE 'hypothesis';--> statement-breakpoint
CREATE TABLE "source_decision_edges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_claim_id" uuid NOT NULL,
	"target_type" "source_decision_target_type" NOT NULL,
	"target_id" text NOT NULL,
	"support_type" "source_support_type" NOT NULL,
	"confidence" "source_decision_edge_confidence" NOT NULL,
	"notes" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "source_claims" ADD COLUMN "execution_run_id" uuid;--> statement-breakpoint
ALTER TABLE "source_claims" ADD COLUMN "falsifier" text;--> statement-breakpoint
ALTER TABLE "source_claims" ADD COLUMN "revisit_when" text;--> statement-breakpoint
ALTER TABLE "source_claims" ADD COLUMN "status" "source_claim_status" DEFAULT 'proposed' NOT NULL;--> statement-breakpoint
ALTER TABLE "source_rejections" ADD COLUMN "execution_run_id" uuid;--> statement-breakpoint
ALTER TABLE "source_rejections" ADD COLUMN "title" text DEFAULT 'untitled source rejection' NOT NULL;--> statement-breakpoint
ALTER TABLE "source_rejections" ADD COLUMN "attempted_claim" text DEFAULT 'unspecified attempted claim' NOT NULL;--> statement-breakpoint
ALTER TABLE "source_rejections" ADD COLUMN "rejected_because" "source_rejection_reason" DEFAULT 'unsupported' NOT NULL;--> statement-breakpoint
ALTER TABLE "source_decision_edges" ADD CONSTRAINT "source_decision_edges_source_claim_id_source_claims_id_fk" FOREIGN KEY ("source_claim_id") REFERENCES "public"."source_claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "source_decision_edges_source_claim_id_idx" ON "source_decision_edges" USING btree ("source_claim_id");--> statement-breakpoint
CREATE INDEX "source_decision_edges_target_idx" ON "source_decision_edges" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "source_decision_edges_support_type_idx" ON "source_decision_edges" USING btree ("support_type");--> statement-breakpoint
CREATE INDEX "source_decision_edges_confidence_idx" ON "source_decision_edges" USING btree ("confidence");--> statement-breakpoint
ALTER TABLE "source_claims" ADD CONSTRAINT "source_claims_execution_run_id_execution_runs_id_fk" FOREIGN KEY ("execution_run_id") REFERENCES "public"."execution_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_rejections" ADD CONSTRAINT "source_rejections_execution_run_id_execution_runs_id_fk" FOREIGN KEY ("execution_run_id") REFERENCES "public"."execution_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "source_claims_execution_run_id_idx" ON "source_claims" USING btree ("execution_run_id");--> statement-breakpoint
CREATE INDEX "source_claims_status_idx" ON "source_claims" USING btree ("status");--> statement-breakpoint
CREATE INDEX "source_rejections_execution_run_id_idx" ON "source_rejections" USING btree ("execution_run_id");--> statement-breakpoint
CREATE INDEX "source_rejections_rejected_because_idx" ON "source_rejections" USING btree ("rejected_because");