ALTER TABLE source_decision_edges
  DROP CONSTRAINT IF EXISTS source_decision_edges_source_decision_id_source_decisions_id_fk;
--> statement-breakpoint
ALTER TABLE source_decision_edges
  ADD CONSTRAINT source_decision_edges_source_decision_id_source_decisions_id_fk
  FOREIGN KEY (source_decision_id)
  REFERENCES source_decisions (id)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE source_claims
  DROP CONSTRAINT IF EXISTS source_claims_chunk_artifact_fk;
--> statement-breakpoint
ALTER TABLE source_claims
  ADD CONSTRAINT source_claims_chunk_artifact_fk
  FOREIGN KEY (source_chunk_id, source_artifact_id)
  REFERENCES source_chunks (id, source_artifact_id)
  MATCH SIMPLE
  ON DELETE NO ACTION
  ON UPDATE NO ACTION
  NOT VALID;
--> statement-breakpoint
ALTER TABLE source_claims VALIDATE CONSTRAINT source_claims_chunk_artifact_fk;
