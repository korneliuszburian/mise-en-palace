CREATE TYPE "public"."observation_claim_relation" AS ENUM('supports', 'contradicts', 'qualifies', 'supersedes');--> statement-breakpoint
CREATE TYPE "public"."observation_confidence" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."observation_entity_kind" AS ENUM('workspace', 'project', 'repo', 'file', 'package', 'source', 'memory', 'policy', 'eval');--> statement-breakpoint
CREATE TYPE "public"."observation_feedback_event_type" AS ENUM('used', 'ignored', 'helped', 'hurt', 'stale', 'corrected');--> statement-breakpoint
CREATE TYPE "public"."observation_kind" AS ENUM('fact', 'decision', 'correction', 'risk', 'procedure', 'conflict', 'slang', 'gap', 'preference', 'operator_note');--> statement-breakpoint
CREATE TYPE "public"."observation_priority" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."observation_provenance_kind" AS ENUM('run_event', 'source_chunk', 'tool_trace', 'diff', 'evidence_bundle', 'review_assessment', 'feedback_delta', 'user_correction', 'user_preference', 'local_operator_note');--> statement-breakpoint
CREATE TYPE "public"."observation_source_range_type" AS ENUM('run_event', 'source_chunk', 'tool_trace', 'diff', 'evidence_bundle', 'review_assessment', 'feedback_delta', 'operator_input');--> statement-breakpoint
CREATE TYPE "public"."observation_status" AS ENUM('observed', 'candidate', 'accepted', 'contested', 'deprecated', 'invalidated', 'superseded');--> statement-breakpoint
CREATE TYPE "public"."observation_usefulness" AS ENUM('positive', 'negative', 'neutral', 'unknown');--> statement-breakpoint
CREATE TABLE "observation_claim_edges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"observation_item_id" uuid NOT NULL,
	"source_claim_id" uuid NOT NULL,
	"relation" "observation_claim_relation" NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "observation_entity_edges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"observation_item_id" uuid NOT NULL,
	"entity_kind" "observation_entity_kind" NOT NULL,
	"entity_id" text NOT NULL,
	"relation" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "observation_feedback_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"observation_item_id" uuid NOT NULL,
	"project_id" uuid,
	"execution_run_id" uuid,
	"event_type" "observation_feedback_event_type" NOT NULL,
	"usefulness" "observation_usefulness" DEFAULT 'unknown' NOT NULL,
	"note" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "observation_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid,
	"project_id" uuid,
	"execution_run_id" uuid,
	"task_contract_id" uuid,
	"target_repo_path" text,
	"scope" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"source" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "observation_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"workspace_id" uuid,
	"project_id" uuid,
	"execution_run_id" uuid,
	"task_contract_id" uuid,
	"target_repo_path" text,
	"kind" "observation_kind" NOT NULL,
	"status" "observation_status" DEFAULT 'observed' NOT NULL,
	"priority" "observation_priority" DEFAULT 'medium' NOT NULL,
	"confidence" "observation_confidence" DEFAULT 'medium' NOT NULL,
	"provenance_kind" "observation_provenance_kind" NOT NULL,
	"subject" text NOT NULL,
	"summary" text NOT NULL,
	"body" text NOT NULL,
	"observed_at" timestamp with time zone NOT NULL,
	"event_time" timestamp with time zone,
	"ingested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"referenced_at" timestamp with time zone,
	"reference_time" timestamp with time zone,
	"relative_time_base" timestamp with time zone,
	"valid_from" timestamp with time zone,
	"valid_until" timestamp with time zone,
	"invalidated_at" timestamp with time zone,
	"superseded_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "observation_source_ranges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"observation_item_id" uuid NOT NULL,
	"source_type" "observation_source_range_type" NOT NULL,
	"source_id" text NOT NULL,
	"execution_run_id" uuid,
	"run_event_id" uuid,
	"source_chunk_id" uuid,
	"evidence_bundle_id" uuid,
	"review_assessment_id" uuid,
	"feedback_delta_id" uuid,
	"locator" text NOT NULL,
	"excerpt" text,
	"captured_at" timestamp with time zone NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "observation_claim_edges" ADD CONSTRAINT "observation_claim_edges_observation_item_id_observation_items_id_fk" FOREIGN KEY ("observation_item_id") REFERENCES "public"."observation_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation_claim_edges" ADD CONSTRAINT "observation_claim_edges_source_claim_id_source_claims_id_fk" FOREIGN KEY ("source_claim_id") REFERENCES "public"."source_claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation_entity_edges" ADD CONSTRAINT "observation_entity_edges_observation_item_id_observation_items_id_fk" FOREIGN KEY ("observation_item_id") REFERENCES "public"."observation_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation_feedback_events" ADD CONSTRAINT "observation_feedback_events_observation_item_id_observation_items_id_fk" FOREIGN KEY ("observation_item_id") REFERENCES "public"."observation_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation_feedback_events" ADD CONSTRAINT "observation_feedback_events_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation_feedback_events" ADD CONSTRAINT "observation_feedback_events_execution_run_id_execution_runs_id_fk" FOREIGN KEY ("execution_run_id") REFERENCES "public"."execution_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation_groups" ADD CONSTRAINT "observation_groups_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation_groups" ADD CONSTRAINT "observation_groups_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation_groups" ADD CONSTRAINT "observation_groups_execution_run_id_execution_runs_id_fk" FOREIGN KEY ("execution_run_id") REFERENCES "public"."execution_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation_groups" ADD CONSTRAINT "observation_groups_task_contract_id_task_contracts_id_fk" FOREIGN KEY ("task_contract_id") REFERENCES "public"."task_contracts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation_items" ADD CONSTRAINT "observation_items_group_id_observation_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."observation_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation_items" ADD CONSTRAINT "observation_items_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation_items" ADD CONSTRAINT "observation_items_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation_items" ADD CONSTRAINT "observation_items_execution_run_id_execution_runs_id_fk" FOREIGN KEY ("execution_run_id") REFERENCES "public"."execution_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation_items" ADD CONSTRAINT "observation_items_task_contract_id_task_contracts_id_fk" FOREIGN KEY ("task_contract_id") REFERENCES "public"."task_contracts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation_source_ranges" ADD CONSTRAINT "observation_source_ranges_observation_item_id_observation_items_id_fk" FOREIGN KEY ("observation_item_id") REFERENCES "public"."observation_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation_source_ranges" ADD CONSTRAINT "observation_source_ranges_execution_run_id_execution_runs_id_fk" FOREIGN KEY ("execution_run_id") REFERENCES "public"."execution_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation_source_ranges" ADD CONSTRAINT "observation_source_ranges_run_event_id_run_events_id_fk" FOREIGN KEY ("run_event_id") REFERENCES "public"."run_events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation_source_ranges" ADD CONSTRAINT "observation_source_ranges_source_chunk_id_source_chunks_id_fk" FOREIGN KEY ("source_chunk_id") REFERENCES "public"."source_chunks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation_source_ranges" ADD CONSTRAINT "observation_source_ranges_evidence_bundle_id_evidence_bundles_id_fk" FOREIGN KEY ("evidence_bundle_id") REFERENCES "public"."evidence_bundles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation_source_ranges" ADD CONSTRAINT "observation_source_ranges_review_assessment_id_review_assessments_id_fk" FOREIGN KEY ("review_assessment_id") REFERENCES "public"."review_assessments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation_source_ranges" ADD CONSTRAINT "observation_source_ranges_feedback_delta_id_feedback_deltas_id_fk" FOREIGN KEY ("feedback_delta_id") REFERENCES "public"."feedback_deltas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "observation_claim_edges_item_id_idx" ON "observation_claim_edges" USING btree ("observation_item_id");--> statement-breakpoint
CREATE INDEX "observation_claim_edges_source_claim_id_idx" ON "observation_claim_edges" USING btree ("source_claim_id");--> statement-breakpoint
CREATE INDEX "observation_claim_edges_relation_idx" ON "observation_claim_edges" USING btree ("relation");--> statement-breakpoint
CREATE INDEX "observation_entity_edges_item_id_idx" ON "observation_entity_edges" USING btree ("observation_item_id");--> statement-breakpoint
CREATE INDEX "observation_entity_edges_entity_idx" ON "observation_entity_edges" USING btree ("entity_kind","entity_id");--> statement-breakpoint
CREATE INDEX "observation_entity_edges_relation_idx" ON "observation_entity_edges" USING btree ("relation");--> statement-breakpoint
CREATE INDEX "observation_feedback_events_item_id_idx" ON "observation_feedback_events" USING btree ("observation_item_id");--> statement-breakpoint
CREATE INDEX "observation_feedback_events_project_id_idx" ON "observation_feedback_events" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "observation_feedback_events_execution_run_id_idx" ON "observation_feedback_events" USING btree ("execution_run_id");--> statement-breakpoint
CREATE INDEX "observation_feedback_events_event_type_idx" ON "observation_feedback_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "observation_feedback_events_usefulness_idx" ON "observation_feedback_events" USING btree ("usefulness");--> statement-breakpoint
CREATE INDEX "observation_groups_workspace_id_idx" ON "observation_groups" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "observation_groups_project_id_idx" ON "observation_groups" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "observation_groups_execution_run_id_idx" ON "observation_groups" USING btree ("execution_run_id");--> statement-breakpoint
CREATE INDEX "observation_groups_task_contract_id_idx" ON "observation_groups" USING btree ("task_contract_id");--> statement-breakpoint
CREATE INDEX "observation_groups_created_at_idx" ON "observation_groups" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "observation_items_group_id_idx" ON "observation_items" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "observation_items_workspace_id_idx" ON "observation_items" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "observation_items_project_id_idx" ON "observation_items" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "observation_items_execution_run_id_idx" ON "observation_items" USING btree ("execution_run_id");--> statement-breakpoint
CREATE INDEX "observation_items_task_contract_id_idx" ON "observation_items" USING btree ("task_contract_id");--> statement-breakpoint
CREATE INDEX "observation_items_kind_idx" ON "observation_items" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "observation_items_status_idx" ON "observation_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "observation_items_priority_idx" ON "observation_items" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "observation_items_provenance_kind_idx" ON "observation_items" USING btree ("provenance_kind");--> statement-breakpoint
CREATE INDEX "observation_items_observed_at_idx" ON "observation_items" USING btree ("observed_at");--> statement-breakpoint
CREATE INDEX "observation_items_valid_until_idx" ON "observation_items" USING btree ("valid_until");--> statement-breakpoint
CREATE INDEX "observation_source_ranges_item_id_idx" ON "observation_source_ranges" USING btree ("observation_item_id");--> statement-breakpoint
CREATE INDEX "observation_source_ranges_source_type_idx" ON "observation_source_ranges" USING btree ("source_type");--> statement-breakpoint
CREATE INDEX "observation_source_ranges_execution_run_id_idx" ON "observation_source_ranges" USING btree ("execution_run_id");--> statement-breakpoint
CREATE INDEX "observation_source_ranges_run_event_id_idx" ON "observation_source_ranges" USING btree ("run_event_id");--> statement-breakpoint
CREATE INDEX "observation_source_ranges_source_chunk_id_idx" ON "observation_source_ranges" USING btree ("source_chunk_id");--> statement-breakpoint
CREATE INDEX "observation_source_ranges_evidence_bundle_id_idx" ON "observation_source_ranges" USING btree ("evidence_bundle_id");--> statement-breakpoint
CREATE INDEX "observation_source_ranges_review_assessment_id_idx" ON "observation_source_ranges" USING btree ("review_assessment_id");--> statement-breakpoint
CREATE INDEX "observation_source_ranges_feedback_delta_id_idx" ON "observation_source_ranges" USING btree ("feedback_delta_id");