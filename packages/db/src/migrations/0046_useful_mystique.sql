ALTER TABLE "search_documents" ADD CONSTRAINT "search_documents_validity_window" CHECK (("search_documents"."valid_until" IS NULL OR "search_documents"."valid_until" > "search_documents"."valid_from")
        AND ("search_documents"."invalidated_at" IS NULL OR "search_documents"."invalidated_at" >= "search_documents"."valid_from")) NOT VALID;--> statement-breakpoint
ALTER TABLE "search_documents" ADD CONSTRAINT "search_documents_validity_status_timestamps" CHECK ((
        ("search_documents"."validity_status" = 'invalidated' AND "search_documents"."invalidated_at" IS NOT NULL)
        OR ("search_documents"."validity_status" IN ('active', 'expired') AND "search_documents"."invalidated_at" IS NULL)
      )) NOT VALID;--> statement-breakpoint
ALTER TABLE "source_artifacts" ADD CONSTRAINT "source_artifacts_import_tuple_complete" CHECK ((
        ("source_artifacts"."import_id" IS NULL AND "source_artifacts"."import_row_id" IS NULL)
        OR (
          NULLIF(BTRIM("source_artifacts"."import_id"), '') IS NOT NULL
          AND NULLIF(BTRIM("source_artifacts"."import_row_id"), '') IS NOT NULL
        )
      )) NOT VALID;--> statement-breakpoint
ALTER TABLE "source_artifacts" ADD CONSTRAINT "source_artifacts_import_content_hash_sha256" CHECK ("source_artifacts"."import_id" IS NULL OR "source_artifacts"."content_hash" ~ '^[0-9a-f]{64}$') NOT VALID;
