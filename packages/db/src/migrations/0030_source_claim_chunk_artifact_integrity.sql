CREATE UNIQUE INDEX "source_chunks_id_artifact_unique" ON "source_chunks" USING btree ("id","source_artifact_id");
--> statement-breakpoint
INSERT INTO source_authority_quarantines (entity_type, entity_id, reason, metadata)
SELECT
  'source_claim',
  source_claim.id,
  'claim_chunk_artifact_mismatch',
  to_jsonb(source_claim) || jsonb_build_object('chunk_source_artifact_id', chunk.source_artifact_id)
FROM source_claims source_claim
JOIN source_chunks chunk ON chunk.id = source_claim.source_chunk_id
WHERE chunk.source_artifact_id <> source_claim.source_artifact_id
ON CONFLICT (entity_type, entity_id, reason) DO NOTHING;
--> statement-breakpoint
INSERT INTO source_authority_quarantines (entity_type, entity_id, reason, metadata)
SELECT
  'source_decision',
  source_decision.id,
  'claim_chunk_artifact_mismatch',
  to_jsonb(source_decision) || jsonb_build_object(
    'claim_source_artifact_id', source_claim.source_artifact_id,
    'chunk_source_artifact_id', chunk.source_artifact_id
  )
FROM source_decisions source_decision
JOIN source_claims source_claim ON source_claim.id = source_decision.source_claim_id
JOIN source_chunks chunk ON chunk.id = source_claim.source_chunk_id
WHERE chunk.source_artifact_id <> source_claim.source_artifact_id
  AND source_decision.status IN ('adopt', 'reject')
ON CONFLICT (entity_type, entity_id, reason) DO NOTHING;
--> statement-breakpoint
INSERT INTO source_authority_quarantines (entity_type, entity_id, reason, metadata)
SELECT
  'source_decision_edge',
  decision_edge.id,
  'claim_chunk_artifact_mismatch',
  to_jsonb(decision_edge) || jsonb_build_object(
    'claim_source_artifact_id', source_claim.source_artifact_id,
    'chunk_source_artifact_id', chunk.source_artifact_id
  )
FROM source_decision_edges decision_edge
JOIN source_claims source_claim ON source_claim.id = decision_edge.source_claim_id
JOIN source_chunks chunk ON chunk.id = source_claim.source_chunk_id
WHERE chunk.source_artifact_id <> source_claim.source_artifact_id
ON CONFLICT (entity_type, entity_id, reason) DO NOTHING;
--> statement-breakpoint
INSERT INTO source_authority_quarantines (entity_type, entity_id, reason, metadata)
SELECT
  'search_document',
  search_document.id,
  'claim_chunk_artifact_mismatch',
  to_jsonb(search_document) || jsonb_build_object(
    'claim_source_artifact_id', source_claim.source_artifact_id,
    'chunk_source_artifact_id', chunk.source_artifact_id
  )
FROM search_documents search_document
JOIN source_claims source_claim ON source_claim.id = search_document.source_claim_id
JOIN source_chunks chunk ON chunk.id = source_claim.source_chunk_id
WHERE chunk.source_artifact_id <> source_claim.source_artifact_id
  AND search_document.validity_status = 'active'
ON CONFLICT (entity_type, entity_id, reason) DO NOTHING;
--> statement-breakpoint
DELETE FROM source_decision_edges edge
WHERE edge.id IN (
  SELECT quarantine.entity_id
  FROM source_authority_quarantines quarantine
  WHERE quarantine.entity_type = 'source_decision_edge'
    AND quarantine.reason = 'claim_chunk_artifact_mismatch'
);
--> statement-breakpoint
UPDATE search_documents search
SET validity_status = 'invalidated',
    invalidated_at = now(),
    metadata = search.metadata || jsonb_build_object(
      'authorityStatus', 'quarantined',
      'quarantineReason', 'claim_chunk_artifact_mismatch'
    )
WHERE search.id IN (
  SELECT quarantine.entity_id
  FROM source_authority_quarantines quarantine
  WHERE quarantine.entity_type = 'search_document'
    AND quarantine.reason = 'claim_chunk_artifact_mismatch'
);
--> statement-breakpoint
UPDATE source_decisions source_decision
SET project_id = NULL,
    status = 'lab_test',
    metadata = source_decision.metadata || jsonb_build_object(
      'authorityStatus', 'quarantined',
      'quarantineReason', 'claim_chunk_artifact_mismatch'
    )
FROM source_claims source_claim
JOIN source_chunks chunk ON chunk.id = source_claim.source_chunk_id
WHERE source_decision.source_claim_id = source_claim.id
  AND chunk.source_artifact_id <> source_claim.source_artifact_id
  AND source_decision.status IN ('adopt', 'reject');
--> statement-breakpoint
UPDATE source_claims source_claim
SET source_chunk_id = NULL,
    status = 'proposed',
    metadata = source_claim.metadata || jsonb_build_object(
      'authorityStatus', 'quarantined',
      'quarantineReason', 'claim_chunk_artifact_mismatch'
    )
FROM source_chunks chunk
WHERE chunk.id = source_claim.source_chunk_id
  AND chunk.source_artifact_id <> source_claim.source_artifact_id;
--> statement-breakpoint
ALTER TABLE source_claims
  ADD CONSTRAINT source_claims_chunk_artifact_fk
  FOREIGN KEY (source_chunk_id, source_artifact_id)
  REFERENCES source_chunks (id, source_artifact_id)
  MATCH SIMPLE
  ON DELETE SET NULL (source_chunk_id)
  ON UPDATE NO ACTION
  NOT VALID;
--> statement-breakpoint
ALTER TABLE source_claims VALIDATE CONSTRAINT source_claims_chunk_artifact_fk;
