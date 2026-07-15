CREATE TYPE "public"."usefulness_application_subject_kind" AS ENUM('knowledge', 'source_claim', 'source_decision');--> statement-breakpoint
CREATE TABLE "usefulness_applications" (
	"application_id" text PRIMARY KEY NOT NULL,
	"subject_kind" "usefulness_application_subject_kind" NOT NULL,
	"subject_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"execution_run_id" uuid NOT NULL,
	"task_contract_id" uuid NOT NULL,
	"packet_checksum" text NOT NULL,
	"packet_generated_at" timestamp with time zone NOT NULL,
	"source_run_lifecycle_revision" integer NOT NULL,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usefulness_applications_packet_checksum_sha256" CHECK ("usefulness_applications"."packet_checksum" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "usefulness_applications_lifecycle_revision_positive" CHECK ("usefulness_applications"."source_run_lifecycle_revision" > 0),
	CONSTRAINT "usefulness_applications_applied_after_packet" CHECK ("usefulness_applications"."applied_at" >= "usefulness_applications"."packet_generated_at")
);
--> statement-breakpoint
ALTER TABLE "usefulness_applications" ADD CONSTRAINT "usefulness_applications_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usefulness_applications" ADD CONSTRAINT "usefulness_applications_execution_run_id_execution_runs_id_fk" FOREIGN KEY ("execution_run_id") REFERENCES "public"."execution_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usefulness_applications" ADD CONSTRAINT "usefulness_applications_task_contract_id_task_contracts_id_fk" FOREIGN KEY ("task_contract_id") REFERENCES "public"."task_contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "usefulness_applications_packet_subject_unique" ON "usefulness_applications" USING btree ("execution_run_id","packet_checksum","subject_kind","subject_id");--> statement-breakpoint
CREATE INDEX "usefulness_applications_project_id_idx" ON "usefulness_applications" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "usefulness_applications_task_contract_id_idx" ON "usefulness_applications" USING btree ("task_contract_id");
