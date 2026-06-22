ALTER TABLE "repo_installations" ADD COLUMN "repo_fingerprint" text;--> statement-breakpoint
CREATE INDEX "repo_installations_local_path_hint_idx" ON "repo_installations" USING btree ("local_path_hint");--> statement-breakpoint
CREATE UNIQUE INDEX "repo_installations_repo_fingerprint_unique" ON "repo_installations" USING btree ("repo_fingerprint");