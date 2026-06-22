CREATE TYPE "public"."audit_final_verdict" AS ENUM('pass', 'advisory', 'needs_review', 'fail');--> statement-breakpoint
CREATE TYPE "public"."audit_finding_category" AS ENUM('architecture', 'boundary', 'type_safety', 'memory_semantics', 'source_grounding', 'policy', 'eval', 'handoff', 'verification');--> statement-breakpoint
CREATE TYPE "public"."audit_finding_severity" AS ENUM('info', 'advisory', 'warning', 'blocking');--> statement-breakpoint
CREATE TYPE "public"."audit_finding_status" AS ENUM('open', 'accepted', 'resolved', 'waived');--> statement-breakpoint
CREATE TYPE "public"."audit_risk_estimate" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TABLE "audit_bundles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid,
	"execution_run_id" uuid,
	"slice_id" text NOT NULL,
	"commit_candidate" text,
	"changed_files" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"intended_files" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"unexpected_files" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"verification_commands" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"verification_results" text NOT NULL,
	"architectural_delta" text NOT NULL,
	"review_burden_estimate" "audit_risk_estimate" NOT NULL,
	"diff_risk_estimate" "audit_risk_estimate" NOT NULL,
	"rollback_path" text NOT NULL,
	"candidate_updates" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"self_critique_summary" text NOT NULL,
	"final_verdict" "audit_final_verdict" NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_findings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audit_bundle_id" uuid NOT NULL,
	"category" "audit_finding_category" NOT NULL,
	"severity" "audit_finding_severity" NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"evidence_refs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"recommendation" text NOT NULL,
	"status" "audit_finding_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_bundles" ADD CONSTRAINT "audit_bundles_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_bundles" ADD CONSTRAINT "audit_bundles_execution_run_id_execution_runs_id_fk" FOREIGN KEY ("execution_run_id") REFERENCES "public"."execution_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_findings" ADD CONSTRAINT "audit_findings_audit_bundle_id_audit_bundles_id_fk" FOREIGN KEY ("audit_bundle_id") REFERENCES "public"."audit_bundles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_bundles_project_id_idx" ON "audit_bundles" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "audit_bundles_execution_run_id_idx" ON "audit_bundles" USING btree ("execution_run_id");--> statement-breakpoint
CREATE INDEX "audit_bundles_slice_id_idx" ON "audit_bundles" USING btree ("slice_id");--> statement-breakpoint
CREATE INDEX "audit_bundles_final_verdict_idx" ON "audit_bundles" USING btree ("final_verdict");--> statement-breakpoint
CREATE INDEX "audit_bundles_created_at_idx" ON "audit_bundles" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_findings_bundle_id_idx" ON "audit_findings" USING btree ("audit_bundle_id");--> statement-breakpoint
CREATE INDEX "audit_findings_category_idx" ON "audit_findings" USING btree ("category");--> statement-breakpoint
CREATE INDEX "audit_findings_severity_idx" ON "audit_findings" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "audit_findings_status_idx" ON "audit_findings" USING btree ("status");