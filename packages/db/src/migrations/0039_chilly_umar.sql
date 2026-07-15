CREATE TABLE "decision_packet_issuances" (
	"execution_run_id" uuid PRIMARY KEY NOT NULL,
	"packet_checksum" text NOT NULL,
	"packet_generated_at" timestamp with time zone NOT NULL,
	"source_run_lifecycle_revision" integer NOT NULL,
	"readback" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "decision_packet_issuances_packet_checksum_sha256" CHECK ("decision_packet_issuances"."packet_checksum" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "decision_packet_issuances_lifecycle_revision_positive" CHECK ("decision_packet_issuances"."source_run_lifecycle_revision" > 0),
	CONSTRAINT "decision_packet_issuances_generated_before_persisted" CHECK ("decision_packet_issuances"."packet_generated_at" <= "decision_packet_issuances"."created_at")
);
--> statement-breakpoint
ALTER TABLE "decision_packet_issuances" ADD CONSTRAINT "decision_packet_issuances_execution_run_id_execution_runs_id_fk" FOREIGN KEY ("execution_run_id") REFERENCES "public"."execution_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "decision_packet_issuances_checksum_unique" ON "decision_packet_issuances" USING btree ("packet_checksum");--> statement-breakpoint
CREATE UNIQUE INDEX "decision_packet_issuances_application_identity_unique" ON "decision_packet_issuances" USING btree ("execution_run_id","packet_checksum","packet_generated_at","source_run_lifecycle_revision");--> statement-breakpoint
ALTER TABLE "usefulness_applications" ADD CONSTRAINT "usefulness_applications_decision_packet_issuance_fk" FOREIGN KEY ("execution_run_id","packet_checksum","packet_generated_at","source_run_lifecycle_revision") REFERENCES "public"."decision_packet_issuances"("execution_run_id","packet_checksum","packet_generated_at","source_run_lifecycle_revision") ON DELETE cascade ON UPDATE no action;
