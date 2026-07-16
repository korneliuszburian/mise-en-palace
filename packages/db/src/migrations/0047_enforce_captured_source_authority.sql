CREATE OR REPLACE FUNCTION krn_captured_source_authority_violation(
  checked_source_claim_id uuid,
  checked_source_decision_metadata jsonb
)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claim_artifact_id uuid;
  claim_chunk_id uuid;
  chunk_artifact_id uuid;
  artifact_metadata jsonb;
  claim_metadata jsonb;
  chunk_metadata jsonb;
  evidence_content_hash text;
BEGIN
  SELECT
    claim.source_artifact_id,
    claim.source_chunk_id,
    chunk.source_artifact_id,
    artifact.metadata,
    claim.metadata,
    chunk.metadata
  INTO
    claim_artifact_id,
    claim_chunk_id,
    chunk_artifact_id,
    artifact_metadata,
    claim_metadata,
    chunk_metadata
  FROM source_claims claim
  JOIN source_artifacts artifact ON artifact.id = claim.source_artifact_id
  LEFT JOIN source_chunks chunk ON chunk.id = claim.source_chunk_id
  WHERE claim.id = checked_source_claim_id;

  IF NOT FOUND THEN
    RETURN 'source_claim_missing';
  END IF;
  IF claim_chunk_id IS NULL THEN
    RETURN 'source_chunk_missing';
  END IF;
  IF chunk_artifact_id IS NULL OR chunk_artifact_id IS DISTINCT FROM claim_artifact_id THEN
    RETURN 'source_chunk_artifact_mismatch';
  END IF;

  evidence_content_hash := artifact_metadata->>'evidenceContentHash';
  IF nullif(btrim(evidence_content_hash), '') IS NULL THEN
    RETURN 'artifact_evidence_content_hash_missing';
  END IF;
  IF artifact_metadata->>'evidenceStatus' IS DISTINCT FROM 'captured'
     OR claim_metadata->>'evidenceStatus' IS DISTINCT FROM 'captured'
     OR chunk_metadata->>'evidenceStatus' IS DISTINCT FROM 'captured'
     OR checked_source_decision_metadata->>'evidenceStatus' IS DISTINCT FROM 'captured' THEN
    RETURN 'evidence_status_not_captured';
  END IF;
  IF artifact_metadata->>'evidenceFreshness' IS DISTINCT FROM 'current'
     OR claim_metadata->>'evidenceFreshness' IS DISTINCT FROM 'current'
     OR chunk_metadata->>'evidenceFreshness' IS DISTINCT FROM 'current'
     OR checked_source_decision_metadata->>'evidenceFreshness' IS DISTINCT FROM 'current' THEN
    RETURN 'evidence_freshness_not_current';
  END IF;
  IF claim_metadata->>'evidenceContentHash' IS DISTINCT FROM evidence_content_hash
     OR chunk_metadata->>'evidenceContentHash' IS DISTINCT FROM evidence_content_hash
     OR checked_source_decision_metadata->>'evidenceContentHash' IS DISTINCT FROM evidence_content_hash THEN
    RETURN 'evidence_content_hash_mismatch';
  END IF;

  RETURN NULL;
END;
$$;
--> statement-breakpoint
LOCK TABLE source_artifacts, source_chunks, source_claims, source_decisions,
  source_decision_edges, search_documents IN SHARE ROW EXCLUSIVE MODE;
--> statement-breakpoint
INSERT INTO source_authority_quarantines (entity_type, entity_id, reason, metadata)
SELECT
  'source_decision',
  decision.id,
  'captured_evidence_missing_or_mismatched',
  to_jsonb(decision) || jsonb_build_object(
    'capturedEvidenceViolation',
    krn_captured_source_authority_violation(decision.source_claim_id, decision.metadata)
  )
FROM source_decisions decision
WHERE decision.status = 'adopt'
  AND krn_captured_source_authority_violation(
    decision.source_claim_id,
    decision.metadata
  ) IS NOT NULL
ON CONFLICT (entity_type, entity_id, reason) DO NOTHING;
--> statement-breakpoint
INSERT INTO source_authority_quarantines (entity_type, entity_id, reason, metadata)
SELECT
  'source_decision_edge',
  edge.id,
  'captured_evidence_missing_or_mismatched',
  to_jsonb(edge)
FROM source_decision_edges edge
JOIN source_decisions decision ON decision.id = edge.source_decision_id
JOIN source_authority_quarantines quarantine
  ON quarantine.entity_type = 'source_decision'
 AND quarantine.entity_id = decision.id
 AND quarantine.reason = 'captured_evidence_missing_or_mismatched'
WHERE decision.status = 'adopt'
ON CONFLICT (entity_type, entity_id, reason) DO NOTHING;
--> statement-breakpoint
INSERT INTO source_authority_quarantines (entity_type, entity_id, reason, metadata)
SELECT
  'search_document',
  search.id,
  'captured_evidence_missing_or_mismatched',
  to_jsonb(search)
FROM search_documents search
JOIN source_decisions decision
  ON decision.id = search.source_decision_id
  OR (
    search.source_decision_id IS NULL
    AND decision.source_claim_id = search.source_claim_id
  )
JOIN source_authority_quarantines quarantine
  ON quarantine.entity_type = 'source_decision'
 AND quarantine.entity_id = decision.id
 AND quarantine.reason = 'captured_evidence_missing_or_mismatched'
WHERE decision.status = 'adopt'
  AND search.validity_status = 'active'
ON CONFLICT (entity_type, entity_id, reason) DO NOTHING;
--> statement-breakpoint
UPDATE search_documents search
SET validity_status = 'invalidated',
    invalidated_at = greatest(now(), search.valid_from),
    metadata = search.metadata || jsonb_build_object(
      'authorityStatus', 'quarantined',
      'quarantineReason', 'captured_evidence_missing_or_mismatched'
    )
FROM source_authority_quarantines quarantine
WHERE quarantine.entity_type = 'search_document'
  AND quarantine.entity_id = search.id
  AND quarantine.reason = 'captured_evidence_missing_or_mismatched'
  AND search.validity_status = 'active';
--> statement-breakpoint
DELETE FROM source_decision_edges edge
USING source_decisions decision, source_authority_quarantines quarantine
WHERE decision.id = edge.source_decision_id
  AND decision.status = 'adopt'
  AND quarantine.entity_type = 'source_decision'
  AND quarantine.entity_id = decision.id
  AND quarantine.reason = 'captured_evidence_missing_or_mismatched';
--> statement-breakpoint
UPDATE source_claims claim
SET status = 'proposed',
    metadata = claim.metadata || jsonb_build_object(
      'authorityStatus', 'quarantined',
      'quarantineReason', 'captured_evidence_missing_or_mismatched'
    )
FROM source_decisions decision
JOIN source_authority_quarantines quarantine
  ON quarantine.entity_type = 'source_decision'
 AND quarantine.entity_id = decision.id
 AND quarantine.reason = 'captured_evidence_missing_or_mismatched'
WHERE decision.source_claim_id = claim.id
  AND decision.status = 'adopt';
--> statement-breakpoint
UPDATE source_decisions decision
SET status = 'lab_test',
    project_id = NULL,
    metadata = decision.metadata || jsonb_build_object(
      'authorityStatus', 'quarantined',
      'quarantineReason', 'captured_evidence_missing_or_mismatched'
    )
FROM source_authority_quarantines quarantine
WHERE quarantine.entity_type = 'source_decision'
  AND quarantine.entity_id = decision.id
  AND quarantine.reason = 'captured_evidence_missing_or_mismatched'
  AND decision.status = 'adopt';
--> statement-breakpoint
CREATE OR REPLACE FUNCTION enforce_source_decision_project_coherence()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  claim_project uuid;
  captured_evidence_violation text;
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
  IF NEW.status = 'adopt' THEN
    captured_evidence_violation := krn_captured_source_authority_violation(
      NEW.source_claim_id,
      NEW.metadata
    );
    IF captured_evidence_violation IS NOT NULL THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        CONSTRAINT = 'source_decisions_captured_evidence',
        MESSAGE = 'adopted SourceDecision requires coherent captured-current evidence',
        DETAIL = captured_evidence_violation;
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
  decision_metadata jsonb;
  captured_evidence_violation text;
BEGIN
  SELECT decision.status, decision.source_claim_id, decision.project_id,
    claim.status, artifact.project_id, decision.metadata
  INTO decision_status, decision_claim, decision_project, claim_status,
    artifact_project, decision_metadata
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
  captured_evidence_violation := krn_captured_source_authority_violation(
    NEW.source_claim_id,
    decision_metadata
  );
  IF captured_evidence_violation IS NOT NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      CONSTRAINT = 'source_decision_edges_captured_evidence',
      MESSAGE = 'SourceDecisionEdge requires coherent captured-current evidence',
      DETAIL = captured_evidence_violation;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION enforce_retained_captured_source_authority()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  checked_decision record;
  captured_evidence_violation text;
BEGIN
  IF TG_TABLE_NAME = 'source_artifacts' THEN
    SELECT decision.id, decision.source_claim_id, decision.metadata
    INTO checked_decision
    FROM source_decisions decision
    JOIN source_claims claim ON claim.id = decision.source_claim_id
    WHERE decision.status = 'adopt'
      AND claim.source_artifact_id = NEW.id
    ORDER BY decision.id
    LIMIT 1;
  ELSIF TG_TABLE_NAME = 'source_chunks' THEN
    SELECT decision.id, decision.source_claim_id, decision.metadata
    INTO checked_decision
    FROM source_decisions decision
    JOIN source_claims claim ON claim.id = decision.source_claim_id
    WHERE decision.status = 'adopt'
      AND claim.source_chunk_id = NEW.id
    ORDER BY decision.id
    LIMIT 1;
  ELSE
    SELECT decision.id, decision.source_claim_id, decision.metadata
    INTO checked_decision
    FROM source_decisions decision
    WHERE decision.status = 'adopt'
      AND decision.source_claim_id = NEW.id
    ORDER BY decision.id
    LIMIT 1;
  END IF;

  IF FOUND THEN
    captured_evidence_violation := krn_captured_source_authority_violation(
      checked_decision.source_claim_id,
      checked_decision.metadata
    );
    IF captured_evidence_violation IS NOT NULL THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        CONSTRAINT = 'retained_captured_source_authority',
        MESSAGE = 'governing source authority must retain coherent captured-current evidence',
        DETAIL = captured_evidence_violation;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS source_decisions_project_coherence ON source_decisions;
--> statement-breakpoint
CREATE TRIGGER source_decisions_project_coherence
BEFORE INSERT OR UPDATE OF project_id, source_claim_id, status, metadata ON source_decisions
FOR EACH ROW EXECUTE FUNCTION enforce_source_decision_project_coherence();
--> statement-breakpoint
DROP TRIGGER IF EXISTS source_decision_edges_coherence ON source_decision_edges;
--> statement-breakpoint
CREATE TRIGGER source_decision_edges_coherence
BEFORE INSERT OR UPDATE OF source_decision_id, source_claim_id ON source_decision_edges
FOR EACH ROW EXECUTE FUNCTION enforce_source_decision_edge_coherence();
--> statement-breakpoint
CREATE TRIGGER source_artifacts_retain_captured_authority
AFTER UPDATE OF metadata ON source_artifacts
FOR EACH ROW EXECUTE FUNCTION enforce_retained_captured_source_authority();
--> statement-breakpoint
CREATE TRIGGER source_chunks_retain_captured_authority
AFTER UPDATE OF source_artifact_id, metadata ON source_chunks
FOR EACH ROW EXECUTE FUNCTION enforce_retained_captured_source_authority();
--> statement-breakpoint
CREATE TRIGGER source_claims_retain_captured_authority
AFTER UPDATE OF source_artifact_id, source_chunk_id, metadata ON source_claims
FOR EACH ROW EXECUTE FUNCTION enforce_retained_captured_source_authority();
