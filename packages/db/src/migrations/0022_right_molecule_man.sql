ALTER TABLE "source_artifacts" ADD COLUMN "import_id" text;--> statement-breakpoint
ALTER TABLE "source_artifacts" ADD COLUMN "import_row_id" text;--> statement-breakpoint
CREATE UNIQUE INDEX "source_artifacts_project_import_row_unique" ON "source_artifacts" USING btree ("project_id","import_id","import_row_id");