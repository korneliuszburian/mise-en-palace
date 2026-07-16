CREATE TABLE IF NOT EXISTS "source_authority_quarantines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"quarantined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "source_authority_quarantines_entity_reason_unique"
  ON "source_authority_quarantines" ("entity_type", "entity_id", "reason");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "source_authority_quarantines_entity_idx"
  ON "source_authority_quarantines" ("entity_type", "entity_id");
--> statement-breakpoint
LOCK TABLE source_artifacts, source_chunks, source_claims, source_decisions,
  source_decision_edges, search_documents IN SHARE ROW EXCLUSIVE MODE;
--> statement-breakpoint
INSERT INTO source_authority_quarantines (entity_type, entity_id, reason, metadata)
SELECT 'source_decision', decision.id, 'forward_lineage_project_mismatch', to_jsonb(decision)
FROM source_decisions decision
JOIN source_claims claim ON claim.id = decision.source_claim_id
JOIN source_artifacts artifact ON artifact.id = claim.source_artifact_id
WHERE decision.status IN ('adopt', 'reject')
  AND decision.project_id IS DISTINCT FROM artifact.project_id
ON CONFLICT (entity_type, entity_id, reason) DO NOTHING;
--> statement-breakpoint
UPDATE source_decisions decision
SET project_id = NULL,
    status = 'lab_test',
    metadata = decision.metadata || jsonb_build_object(
      'authorityStatus', 'quarantined',
      'quarantineReason', 'forward_lineage_project_mismatch'
    )
FROM source_claims claim
JOIN source_artifacts artifact ON artifact.id = claim.source_artifact_id
WHERE decision.source_claim_id = claim.id
  AND decision.status IN ('adopt', 'reject')
  AND decision.project_id IS DISTINCT FROM artifact.project_id;
--> statement-breakpoint
INSERT INTO source_authority_quarantines (entity_type, entity_id, reason, metadata)
SELECT 'source_claim', claim.id, 'forward_lineage_claim_chunk_artifact_mismatch',
  to_jsonb(claim) || jsonb_build_object('chunk_source_artifact_id', chunk.source_artifact_id)
FROM source_claims claim
JOIN source_chunks chunk ON chunk.id = claim.source_chunk_id
WHERE chunk.source_artifact_id <> claim.source_artifact_id
ON CONFLICT (entity_type, entity_id, reason) DO NOTHING;
--> statement-breakpoint
INSERT INTO source_authority_quarantines (entity_type, entity_id, reason, metadata)
SELECT 'source_decision_edge', edge.id, 'forward_lineage_invalid_governing_edge', to_jsonb(edge)
FROM source_decision_edges edge
LEFT JOIN source_claims claim ON claim.id = edge.source_claim_id
LEFT JOIN source_artifacts artifact ON artifact.id = claim.source_artifact_id
LEFT JOIN source_decisions decision ON decision.id = edge.source_decision_id
LEFT JOIN source_chunks chunk ON chunk.id = claim.source_chunk_id
WHERE edge.source_decision_id IS NULL
   OR claim.id IS NULL
   OR artifact.id IS NULL
   OR decision.id IS NULL
   OR decision.source_claim_id IS DISTINCT FROM claim.id
   OR decision.status <> 'adopt'
   OR claim.status <> 'accepted'
   OR decision.project_id IS DISTINCT FROM artifact.project_id
   OR (claim.source_chunk_id IS NOT NULL AND chunk.source_artifact_id IS DISTINCT FROM claim.source_artifact_id)
ON CONFLICT (entity_type, entity_id, reason) DO NOTHING;
--> statement-breakpoint
DELETE FROM source_decision_edges edge
USING source_authority_quarantines quarantine
WHERE quarantine.entity_type = 'source_decision_edge'
  AND quarantine.entity_id = edge.id
  AND quarantine.reason = 'forward_lineage_invalid_governing_edge';
--> statement-breakpoint
INSERT INTO source_authority_quarantines (entity_type, entity_id, reason, metadata)
SELECT 'search_document', search.id, 'forward_lineage_claim_chunk_artifact_mismatch', to_jsonb(search)
FROM search_documents search
JOIN source_claims claim ON claim.id = search.source_claim_id
JOIN source_chunks chunk ON chunk.id = claim.source_chunk_id
WHERE chunk.source_artifact_id <> claim.source_artifact_id
  AND search.validity_status = 'active'
ON CONFLICT (entity_type, entity_id, reason) DO NOTHING;
--> statement-breakpoint
UPDATE search_documents search
SET validity_status = 'invalidated',
    invalidated_at = now(),
    metadata = search.metadata || jsonb_build_object(
      'authorityStatus', 'quarantined',
      'quarantineReason', 'forward_lineage_claim_chunk_artifact_mismatch'
    )
WHERE EXISTS (
  SELECT 1
  FROM source_authority_quarantines quarantine
  WHERE quarantine.entity_type = 'search_document'
    AND quarantine.entity_id = search.id
    AND quarantine.reason = 'forward_lineage_claim_chunk_artifact_mismatch'
);
--> statement-breakpoint
UPDATE source_decisions decision
SET project_id = NULL,
    status = 'lab_test',
    metadata = decision.metadata || jsonb_build_object(
      'authorityStatus', 'quarantined',
      'quarantineReason', 'forward_lineage_claim_chunk_artifact_mismatch'
    )
FROM source_claims claim
JOIN source_chunks chunk ON chunk.id = claim.source_chunk_id
WHERE decision.source_claim_id = claim.id
  AND chunk.source_artifact_id <> claim.source_artifact_id
  AND decision.status IN ('adopt', 'reject');
--> statement-breakpoint
UPDATE source_claims claim
SET source_chunk_id = NULL,
    status = 'proposed',
    metadata = claim.metadata || jsonb_build_object(
      'authorityStatus', 'quarantined',
      'quarantineReason', 'forward_lineage_claim_chunk_artifact_mismatch'
    )
FROM source_chunks chunk
WHERE chunk.id = claim.source_chunk_id
  AND chunk.source_artifact_id <> claim.source_artifact_id;
--> statement-breakpoint
ALTER TABLE source_decision_edges ALTER COLUMN source_decision_id SET NOT NULL;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'source_decisions'::regclass
      AND conname = 'source_decisions_id_claim_unique'
  ) THEN
    ALTER TABLE source_decisions
      ADD CONSTRAINT source_decisions_id_claim_unique UNIQUE (id, source_claim_id);
  END IF;
END
$$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'source_decision_edges'::regclass
      AND conname = 'source_decision_edges_decision_claim_fk'
  ) THEN
    ALTER TABLE source_decision_edges
      ADD CONSTRAINT source_decision_edges_decision_claim_fk
      FOREIGN KEY (source_decision_id, source_claim_id)
      REFERENCES source_decisions (id, source_claim_id);
  END IF;
END
$$;
--> statement-breakpoint
INSERT INTO source_authority_quarantines (entity_type, entity_id, reason, metadata)
SELECT 'source_decision_edge', edge.id, 'forward_lineage_duplicate_governing_edge', to_jsonb(edge)
FROM source_decision_edges edge
WHERE EXISTS (
  SELECT 1
  FROM source_decision_edges competing
  WHERE competing.source_claim_id = edge.source_claim_id
    AND competing.source_decision_id = edge.source_decision_id
    AND competing.target_type = edge.target_type
    AND competing.target_id = edge.target_id
    AND competing.support_type = edge.support_type
    AND competing.id <> edge.id
)
ON CONFLICT (entity_type, entity_id, reason) DO NOTHING;
--> statement-breakpoint
DELETE FROM source_decision_edges edge
USING source_authority_quarantines quarantine
WHERE quarantine.entity_type = 'source_decision_edge'
  AND quarantine.entity_id = edge.id
  AND quarantine.reason = 'forward_lineage_duplicate_governing_edge';
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS source_decision_edges_identity_unique
  ON source_decision_edges (source_claim_id, source_decision_id, target_type, target_id, support_type);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS source_chunks_id_artifact_unique
  ON source_chunks (id, source_artifact_id);
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'source_claims'::regclass
      AND conname = 'source_claims_chunk_artifact_fk'
  ) THEN
    ALTER TABLE source_claims
      ADD CONSTRAINT source_claims_chunk_artifact_fk
      FOREIGN KEY (source_chunk_id, source_artifact_id)
      REFERENCES source_chunks (id, source_artifact_id)
      MATCH SIMPLE
      ON DELETE SET NULL (source_chunk_id)
      ON UPDATE NO ACTION
      NOT VALID;
    ALTER TABLE source_claims VALIDATE CONSTRAINT source_claims_chunk_artifact_fk;
  END IF;
END
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION enforce_source_decision_project_coherence()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  claim_project uuid;
BEGIN
  IF NEW.status IN ('adopt', 'reject') AND NEW.source_claim_id IS NULL THEN
    RAISE EXCEPTION 'governing SourceDecision requires source_claim_id';
  END IF;
  IF NEW.status IN ('adopt', 'reject') THEN
    SELECT artifact.project_id INTO claim_project
    FROM source_claims claim
    JOIN source_artifacts artifact ON artifact.id = claim.source_artifact_id
    WHERE claim.id = NEW.source_claim_id;
    IF NEW.project_id IS DISTINCT FROM claim_project THEN
      RAISE EXCEPTION 'governing SourceDecision project must match SourceArtifact project';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION enforce_source_decision_edge_coherence()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  decision_status source_decision_status;
  decision_claim uuid;
  claim_status source_claim_status;
  decision_project uuid;
  artifact_project uuid;
BEGIN
  SELECT decision.status, decision.source_claim_id, decision.project_id,
    claim.status, artifact.project_id
  INTO decision_status, decision_claim, decision_project, claim_status, artifact_project
  FROM source_decisions decision
  JOIN source_claims claim ON claim.id = NEW.source_claim_id
  JOIN source_artifacts artifact ON artifact.id = claim.source_artifact_id
  WHERE decision.id = NEW.source_decision_id;
  IF decision_claim IS DISTINCT FROM NEW.source_claim_id
     OR decision_status <> 'adopt'
     OR claim_status <> 'accepted'
     OR decision_project IS DISTINCT FROM artifact_project THEN
    RAISE EXCEPTION 'SourceDecisionEdge requires same-project adopted reviewed SourceDecision';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS source_decisions_project_coherence ON source_decisions;
--> statement-breakpoint
CREATE TRIGGER source_decisions_project_coherence
BEFORE INSERT OR UPDATE OF project_id, source_claim_id, status ON source_decisions
FOR EACH ROW EXECUTE FUNCTION enforce_source_decision_project_coherence();
--> statement-breakpoint
DROP TRIGGER IF EXISTS source_decision_edges_coherence ON source_decision_edges;
--> statement-breakpoint
CREATE TRIGGER source_decision_edges_coherence
BEFORE INSERT OR UPDATE OF source_decision_id, source_claim_id ON source_decision_edges
FOR EACH ROW EXECUTE FUNCTION enforce_source_decision_edge_coherence();
