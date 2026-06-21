CREATE TYPE "public"."outbox_event_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'dead_letter');--> statement-breakpoint
CREATE TYPE "public"."run_event_severity" AS ENUM('debug', 'info', 'warning', 'error');--> statement-breakpoint
CREATE TYPE "public"."worker_job_status" AS ENUM('queued', 'running', 'succeeded', 'failed', 'dead_letter', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."context_assembly_status" AS ENUM('assembled', 'abstained', 'stale', 'superseded');--> statement-breakpoint
CREATE TYPE "public"."evidence_bundle_status" AS ENUM('draft', 'captured', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."execution_run_status" AS ENUM('planned', 'running', 'succeeded', 'failed', 'blocked', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."feedback_delta_status" AS ENUM('candidate', 'accepted', 'rejected', 'applied');--> statement-breakpoint
CREATE TYPE "public"."harness_plan_status" AS ENUM('draft', 'ready', 'running', 'completed', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."operator_intent_status" AS ENUM('received', 'contracted', 'planned', 'executed', 'reviewed', 'closed');--> statement-breakpoint
CREATE TYPE "public"."review_assessment_status" AS ENUM('pending', 'accepted', 'changes_requested', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."task_contract_status" AS ENUM('draft', 'active', 'superseded', 'closed');--> statement-breakpoint
CREATE TABLE "outbox_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic" text NOT NULL,
	"status" "outbox_event_status" DEFAULT 'pending' NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_at" timestamp with time zone,
	"locked_by" text,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "run_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"execution_run_id" uuid,
	"sequence" integer NOT NULL,
	"type" text NOT NULL,
	"severity" "run_event_severity" DEFAULT 'info' NOT NULL,
	"message" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "worker_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"status" "worker_job_status" DEFAULT 'queued' NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_at" timestamp with time zone,
	"locked_by" text,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "context_assemblies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"harness_plan_id" uuid NOT NULL,
	"status" "context_assembly_status" DEFAULT 'assembled' NOT NULL,
	"token_budget" integer,
	"inclusion_count" integer DEFAULT 0 NOT NULL,
	"exclusion_count" integer DEFAULT 0 NOT NULL,
	"selected_context" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"excluded_context" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidence_bundles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"execution_run_id" uuid NOT NULL,
	"status" "evidence_bundle_status" DEFAULT 'draft' NOT NULL,
	"changed_files" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"commands" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"diff_risk" text NOT NULL,
	"review_burden" text NOT NULL,
	"rollback_path" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "execution_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"harness_plan_id" uuid NOT NULL,
	"adapter" text NOT NULL,
	"status" "execution_run_status" DEFAULT 'planned' NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback_deltas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_assessment_id" uuid NOT NULL,
	"status" "feedback_delta_status" DEFAULT 'candidate' NOT NULL,
	"memory_candidates" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"source_decisions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"eval_candidates" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "harness_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_contract_id" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"status" "harness_plan_status" DEFAULT 'draft' NOT NULL,
	"summary" text NOT NULL,
	"next_action" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operator_intents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"project_id" uuid,
	"source" text NOT NULL,
	"raw_intent" text NOT NULL,
	"normalized_intent" text,
	"status" "operator_intent_status" DEFAULT 'received' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_kernels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"summary" text NOT NULL,
	"active_context_rule" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repo_installations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"repo_url" text NOT NULL,
	"default_branch" text NOT NULL,
	"local_path_hint" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evidence_bundle_id" uuid NOT NULL,
	"status" "review_assessment_status" DEFAULT 'pending' NOT NULL,
	"reviewer" text NOT NULL,
	"summary" text NOT NULL,
	"findings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operator_intent_id" uuid NOT NULL,
	"project_id" uuid,
	"title" text NOT NULL,
	"objective" text NOT NULL,
	"constraints" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"non_goals" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"acceptance" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "task_contract_status" DEFAULT 'draft' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"display_name" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "run_events" ADD CONSTRAINT "run_events_execution_run_id_execution_runs_id_fk" FOREIGN KEY ("execution_run_id") REFERENCES "public"."execution_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "context_assemblies" ADD CONSTRAINT "context_assemblies_harness_plan_id_harness_plans_id_fk" FOREIGN KEY ("harness_plan_id") REFERENCES "public"."harness_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_bundles" ADD CONSTRAINT "evidence_bundles_execution_run_id_execution_runs_id_fk" FOREIGN KEY ("execution_run_id") REFERENCES "public"."execution_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_runs" ADD CONSTRAINT "execution_runs_harness_plan_id_harness_plans_id_fk" FOREIGN KEY ("harness_plan_id") REFERENCES "public"."harness_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_deltas" ADD CONSTRAINT "feedback_deltas_review_assessment_id_review_assessments_id_fk" FOREIGN KEY ("review_assessment_id") REFERENCES "public"."review_assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "harness_plans" ADD CONSTRAINT "harness_plans_task_contract_id_task_contracts_id_fk" FOREIGN KEY ("task_contract_id") REFERENCES "public"."task_contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operator_intents" ADD CONSTRAINT "operator_intents_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operator_intents" ADD CONSTRAINT "operator_intents_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_kernels" ADD CONSTRAINT "project_kernels_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repo_installations" ADD CONSTRAINT "repo_installations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_assessments" ADD CONSTRAINT "review_assessments_evidence_bundle_id_evidence_bundles_id_fk" FOREIGN KEY ("evidence_bundle_id") REFERENCES "public"."evidence_bundles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_contracts" ADD CONSTRAINT "task_contracts_operator_intent_id_operator_intents_id_fk" FOREIGN KEY ("operator_intent_id") REFERENCES "public"."operator_intents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_contracts" ADD CONSTRAINT "task_contracts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "outbox_events_topic_idx" ON "outbox_events" USING btree ("topic");--> statement-breakpoint
CREATE INDEX "outbox_events_status_available_at_idx" ON "outbox_events" USING btree ("status","available_at");--> statement-breakpoint
CREATE INDEX "run_events_execution_run_id_idx" ON "run_events" USING btree ("execution_run_id");--> statement-breakpoint
CREATE INDEX "run_events_type_idx" ON "run_events" USING btree ("type");--> statement-breakpoint
CREATE INDEX "run_events_occurred_at_idx" ON "run_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "run_events_execution_sequence_unique" ON "run_events" USING btree ("execution_run_id","sequence");--> statement-breakpoint
CREATE INDEX "worker_jobs_type_idx" ON "worker_jobs" USING btree ("type");--> statement-breakpoint
CREATE INDEX "worker_jobs_status_available_at_idx" ON "worker_jobs" USING btree ("status","available_at");--> statement-breakpoint
CREATE INDEX "context_assemblies_harness_plan_id_idx" ON "context_assemblies" USING btree ("harness_plan_id");--> statement-breakpoint
CREATE INDEX "context_assemblies_status_idx" ON "context_assemblies" USING btree ("status");--> statement-breakpoint
CREATE INDEX "evidence_bundles_execution_run_id_idx" ON "evidence_bundles" USING btree ("execution_run_id");--> statement-breakpoint
CREATE INDEX "evidence_bundles_status_idx" ON "evidence_bundles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "execution_runs_harness_plan_id_idx" ON "execution_runs" USING btree ("harness_plan_id");--> statement-breakpoint
CREATE INDEX "execution_runs_status_idx" ON "execution_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "execution_runs_adapter_idx" ON "execution_runs" USING btree ("adapter");--> statement-breakpoint
CREATE INDEX "feedback_deltas_review_assessment_id_idx" ON "feedback_deltas" USING btree ("review_assessment_id");--> statement-breakpoint
CREATE INDEX "feedback_deltas_status_idx" ON "feedback_deltas" USING btree ("status");--> statement-breakpoint
CREATE INDEX "harness_plans_task_contract_id_idx" ON "harness_plans" USING btree ("task_contract_id");--> statement-breakpoint
CREATE INDEX "harness_plans_status_idx" ON "harness_plans" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "harness_plans_contract_version_unique" ON "harness_plans" USING btree ("task_contract_id","version");--> statement-breakpoint
CREATE INDEX "operator_intents_workspace_id_idx" ON "operator_intents" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "operator_intents_project_id_idx" ON "operator_intents" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "operator_intents_status_idx" ON "operator_intents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "project_kernels_project_id_idx" ON "project_kernels" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_kernels_project_version_unique" ON "project_kernels" USING btree ("project_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_workspace_slug_unique" ON "projects" USING btree ("workspace_id","slug");--> statement-breakpoint
CREATE INDEX "projects_workspace_id_idx" ON "projects" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "repo_installations_project_id_idx" ON "repo_installations" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "repo_installations_project_repo_unique" ON "repo_installations" USING btree ("project_id","repo_url");--> statement-breakpoint
CREATE INDEX "review_assessments_evidence_bundle_id_idx" ON "review_assessments" USING btree ("evidence_bundle_id");--> statement-breakpoint
CREATE INDEX "review_assessments_status_idx" ON "review_assessments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "task_contracts_operator_intent_id_idx" ON "task_contracts" USING btree ("operator_intent_id");--> statement-breakpoint
CREATE INDEX "task_contracts_project_id_idx" ON "task_contracts" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "task_contracts_status_idx" ON "task_contracts" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "workspaces_slug_unique" ON "workspaces" USING btree ("slug");