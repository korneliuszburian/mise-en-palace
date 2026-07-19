CREATE TABLE "paired_live_eval_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"run_id" uuid NOT NULL,
	"feedback_delta_id" uuid,
	"candidate_id" text NOT NULL,
	"candidate_status" text DEFAULT 'candidate' NOT NULL,
	"title" text NOT NULL,
	"scenario" text NOT NULL,
	"family" text NOT NULL,
	"expected_signal" text NOT NULL,
	"artifact_status" text NOT NULL,
	"outcome" text NOT NULL,
	"usefulness_outcome" text NOT NULL,
	"packet_checksum" text NOT NULL,
	"packet_evidence_ref" text NOT NULL,
	"artifact_hash" text NOT NULL,
	"artifact_ref" text NOT NULL,
	"manifest_hash" text NOT NULL,
	"manifest_ref" text NOT NULL,
	"checker_revision" text NOT NULL,
	"checker_evidence_ref" text NOT NULL,
	"environment_profile_hash" text NOT NULL,
	"environment_evidence_ref" text NOT NULL,
	"source_evidence" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"evidence_refs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "paired_live_eval_evidence_candidate_status_known" CHECK ("paired_live_eval_evidence"."candidate_status" = 'candidate'),
	CONSTRAINT "paired_live_eval_evidence_artifact_status_known" CHECK ("paired_live_eval_evidence"."artifact_status" in ('passed', 'invalid', 'blocked', 'unverified')),
	CONSTRAINT "paired_live_eval_evidence_outcome_known" CHECK ("paired_live_eval_evidence"."outcome" in ('win', 'tie', 'loss', 'invalid', 'unknown')),
	CONSTRAINT "paired_live_eval_evidence_usefulness_known" CHECK ("paired_live_eval_evidence"."usefulness_outcome" in ('helped', 'neutral', 'hurt', 'unknown')),
	CONSTRAINT "paired_live_eval_evidence_nonpassed_not_helped" CHECK ("paired_live_eval_evidence"."artifact_status" = 'passed' or "paired_live_eval_evidence"."usefulness_outcome" <> 'helped'),
	CONSTRAINT "paired_live_eval_evidence_invalid_not_helped" CHECK ("paired_live_eval_evidence"."outcome" <> 'invalid' or "paired_live_eval_evidence"."usefulness_outcome" <> 'helped'),
	CONSTRAINT "paired_live_eval_evidence_candidate_prefix" CHECK ("paired_live_eval_evidence"."candidate_id" like 'paired-target-repair:%'),
	CONSTRAINT "paired_live_eval_evidence_packet_ref_matches" CHECK ("paired_live_eval_evidence"."packet_evidence_ref" = 'packet:' || "paired_live_eval_evidence"."packet_checksum"),
	CONSTRAINT "paired_live_eval_evidence_artifact_ref_matches" CHECK ("paired_live_eval_evidence"."artifact_ref" = 'artifact:sha256:' || "paired_live_eval_evidence"."artifact_hash"),
	CONSTRAINT "paired_live_eval_evidence_manifest_ref_matches" CHECK ("paired_live_eval_evidence"."manifest_ref" = 'manifest:sha256:' || "paired_live_eval_evidence"."manifest_hash"),
	CONSTRAINT "paired_live_eval_evidence_checker_ref_matches" CHECK ("paired_live_eval_evidence"."checker_evidence_ref" = 'checker:' || "paired_live_eval_evidence"."checker_revision"),
	CONSTRAINT "paired_live_eval_evidence_environment_ref_matches" CHECK ("paired_live_eval_evidence"."environment_evidence_ref" = 'environment:sha256:' || "paired_live_eval_evidence"."environment_profile_hash"),
	CONSTRAINT "paired_live_eval_evidence_artifact_hash_format" CHECK ("paired_live_eval_evidence"."artifact_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "paired_live_eval_evidence_manifest_hash_format" CHECK ("paired_live_eval_evidence"."manifest_hash" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE UNIQUE INDEX "paired_live_eval_evidence_candidate_unique" ON "paired_live_eval_evidence" USING btree ("candidate_id");--> statement-breakpoint
CREATE UNIQUE INDEX "paired_live_eval_evidence_artifact_unique" ON "paired_live_eval_evidence" USING btree ("artifact_hash");--> statement-breakpoint
CREATE INDEX "paired_live_eval_evidence_project_idx" ON "paired_live_eval_evidence" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "paired_live_eval_evidence_run_idx" ON "paired_live_eval_evidence" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "paired_live_eval_evidence_outcome_idx" ON "paired_live_eval_evidence" USING btree ("project_id","scenario","outcome","usefulness_outcome");--> statement-breakpoint
CREATE INDEX "paired_live_eval_evidence_created_idx" ON "paired_live_eval_evidence" USING btree ("created_at");