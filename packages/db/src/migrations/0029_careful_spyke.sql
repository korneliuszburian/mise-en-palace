CREATE TABLE "source_authority_quarantines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"quarantined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "source_authority_quarantines_entity_reason_unique" ON "source_authority_quarantines" USING btree ("entity_type","entity_id","reason");--> statement-breakpoint
CREATE INDEX "source_authority_quarantines_entity_idx" ON "source_authority_quarantines" USING btree ("entity_type","entity_id");
--> statement-breakpoint
INSERT INTO source_authority_quarantines (entity_type, entity_id, reason, metadata)
SELECT 'source_decision', sd.id, 'project_mismatch', to_jsonb(sd)
FROM source_decisions sd
JOIN source_claims sc ON sc.id = sd.source_claim_id
JOIN source_artifacts sa ON sa.id = sc.source_artifact_id
WHERE sd.status IN ('adopt', 'reject')
  AND sd.project_id IS DISTINCT FROM sa.project_id
ON CONFLICT (entity_type, entity_id, reason) DO NOTHING;
--> statement-breakpoint
UPDATE source_decisions sd
SET project_id = NULL,
    status = 'lab_test',
    metadata = sd.metadata || jsonb_build_object('authorityStatus', 'quarantined', 'quarantineReason', 'project_mismatch')
FROM source_claims sc
JOIN source_artifacts sa ON sa.id = sc.source_artifact_id
WHERE sd.source_claim_id = sc.id
  AND sd.status IN ('adopt', 'reject')
  AND sd.project_id IS DISTINCT FROM sa.project_id;
--> statement-breakpoint
INSERT INTO source_authority_quarantines (entity_type, entity_id, reason, metadata)
SELECT 'source_decision', sd.id, 'orphaned_governing_decision', to_jsonb(sd)
FROM source_decisions sd
WHERE sd.status IN ('adopt', 'reject') AND sd.source_claim_id IS NULL
ON CONFLICT (entity_type, entity_id, reason) DO NOTHING;
--> statement-breakpoint
UPDATE source_decisions
SET project_id = NULL,
    status = 'lab_test',
    metadata = metadata || jsonb_build_object('authorityStatus', 'quarantined', 'quarantineReason', 'orphaned_governing_decision')
WHERE status IN ('adopt', 'reject') AND source_claim_id IS NULL;
--> statement-breakpoint
INSERT INTO source_authority_quarantines (entity_type, entity_id, reason, metadata)
SELECT 'source_claim', sc.id, 'missing_terminal_review', to_jsonb(sc)
FROM source_claims sc
WHERE sc.status IN ('accepted', 'rejected', 'deprecated')
  AND NOT EXISTS (
    SELECT 1 FROM source_decisions sd
    WHERE sd.source_claim_id = sc.id AND sd.status IN ('adopt', 'reject', 'defer')
  )
ON CONFLICT (entity_type, entity_id, reason) DO NOTHING;
--> statement-breakpoint
UPDATE source_claims sc
SET status = 'proposed',
    metadata = sc.metadata || jsonb_build_object('authorityStatus', 'quarantined', 'quarantineReason', 'missing_terminal_review')
WHERE sc.status IN ('accepted', 'rejected', 'deprecated')
  AND NOT EXISTS (
    SELECT 1 FROM source_decisions sd
    WHERE sd.source_claim_id = sc.id AND sd.status IN ('adopt', 'reject', 'defer')
  );
--> statement-breakpoint
INSERT INTO source_authority_quarantines (entity_type, entity_id, reason, metadata)
SELECT 'source_claim', sc.id, 'conflicting_terminal_review', to_jsonb(sc)
FROM source_claims sc
WHERE (
  SELECT count(*) FROM source_decisions sd
  WHERE sd.source_claim_id = sc.id AND sd.status IN ('adopt', 'reject', 'defer')
) > 1
ON CONFLICT (entity_type, entity_id, reason) DO NOTHING;
--> statement-breakpoint
INSERT INTO source_authority_quarantines (entity_type, entity_id, reason, metadata)
SELECT 'source_decision', sd.id, 'conflicting_terminal_review', to_jsonb(sd)
FROM source_decisions sd
WHERE sd.source_claim_id IN (
  SELECT sc.id FROM source_claims sc
  WHERE (
    SELECT count(*) FROM source_decisions competing
    WHERE competing.source_claim_id = sc.id AND competing.status IN ('adopt', 'reject', 'defer')
  ) > 1
)
ON CONFLICT (entity_type, entity_id, reason) DO NOTHING;
--> statement-breakpoint
UPDATE source_decisions
SET status = 'lab_test',
    metadata = metadata || jsonb_build_object('authorityStatus', 'quarantined', 'quarantineReason', 'conflicting_terminal_review')
WHERE source_claim_id IN (
  SELECT sc.id FROM source_claims sc
  WHERE (
    SELECT count(*) FROM source_decisions competing
    WHERE competing.source_claim_id = sc.id AND competing.status IN ('adopt', 'reject', 'defer')
  ) > 1
);
--> statement-breakpoint
UPDATE source_claims
SET status = 'proposed',
    metadata = metadata || jsonb_build_object('authorityStatus', 'quarantined', 'quarantineReason', 'conflicting_terminal_review')
WHERE id IN (
  SELECT sc.id FROM source_claims sc
  WHERE (
    SELECT count(*) FROM source_decisions competing
    WHERE competing.source_claim_id = sc.id AND competing.status IN ('adopt', 'reject', 'defer')
  ) > 1
);
--> statement-breakpoint
INSERT INTO source_authority_quarantines (entity_type, entity_id, reason, metadata)
SELECT 'source_claim', sc.id, 'claim_decision_status_mismatch', to_jsonb(sc)
FROM source_claims sc
WHERE (
  (sc.status = 'accepted' AND NOT EXISTS (SELECT 1 FROM source_decisions sd WHERE sd.source_claim_id = sc.id AND sd.status = 'adopt')) OR
  (sc.status = 'rejected' AND NOT EXISTS (SELECT 1 FROM source_decisions sd WHERE sd.source_claim_id = sc.id AND sd.status = 'reject')) OR
  (sc.status = 'deprecated' AND NOT EXISTS (SELECT 1 FROM source_decisions sd WHERE sd.source_claim_id = sc.id AND sd.status = 'defer'))
)
ON CONFLICT (entity_type, entity_id, reason) DO NOTHING;
--> statement-breakpoint
UPDATE source_claims sc
SET status = 'proposed',
    metadata = sc.metadata || jsonb_build_object('authorityStatus', 'quarantined', 'quarantineReason', 'claim_decision_status_mismatch')
WHERE (
  (sc.status = 'accepted' AND NOT EXISTS (SELECT 1 FROM source_decisions sd WHERE sd.source_claim_id = sc.id AND sd.status = 'adopt')) OR
  (sc.status = 'rejected' AND NOT EXISTS (SELECT 1 FROM source_decisions sd WHERE sd.source_claim_id = sc.id AND sd.status = 'reject')) OR
  (sc.status = 'deprecated' AND NOT EXISTS (SELECT 1 FROM source_decisions sd WHERE sd.source_claim_id = sc.id AND sd.status = 'defer'))
);
--> statement-breakpoint
INSERT INTO source_authority_quarantines (entity_type, entity_id, reason, metadata)
SELECT 'source_decision', sd.id, 'captured_evidence_missing_or_mismatched', to_jsonb(sd)
FROM source_decisions sd
JOIN source_claims sc ON sc.id = sd.source_claim_id
JOIN source_artifacts sa ON sa.id = sc.source_artifact_id
LEFT JOIN source_chunks chunk ON chunk.source_artifact_id = sa.id AND chunk.ordinal = 0
WHERE sd.status = 'adopt' AND (
  coalesce(sd.metadata->>'evidenceStatus', '') <> 'captured' OR
  nullif(sd.metadata->>'evidenceContentHash', '') IS NULL OR
  sd.metadata->>'evidenceContentHash' IS DISTINCT FROM sc.metadata->>'evidenceContentHash' OR
  sd.metadata->>'evidenceContentHash' IS DISTINCT FROM sa.metadata->>'evidenceContentHash' OR
  sd.metadata->>'evidenceContentHash' IS DISTINCT FROM chunk.metadata->>'evidenceContentHash'
)
ON CONFLICT (entity_type, entity_id, reason) DO NOTHING;
--> statement-breakpoint
UPDATE source_decisions sd
SET status = 'lab_test',
    metadata = sd.metadata || jsonb_build_object('authorityStatus', 'quarantined', 'quarantineReason', 'captured_evidence_missing_or_mismatched')
FROM source_claims sc
JOIN source_artifacts sa ON sa.id = sc.source_artifact_id
LEFT JOIN source_chunks chunk ON chunk.source_artifact_id = sa.id AND chunk.ordinal = 0
WHERE sd.source_claim_id = sc.id
  AND sd.status = 'adopt' AND (
    coalesce(sd.metadata->>'evidenceStatus', '') <> 'captured' OR
    nullif(sd.metadata->>'evidenceContentHash', '') IS NULL OR
    sd.metadata->>'evidenceContentHash' IS DISTINCT FROM sc.metadata->>'evidenceContentHash' OR
    sd.metadata->>'evidenceContentHash' IS DISTINCT FROM sa.metadata->>'evidenceContentHash' OR
    sd.metadata->>'evidenceContentHash' IS DISTINCT FROM chunk.metadata->>'evidenceContentHash'
  );
--> statement-breakpoint
INSERT INTO source_authority_quarantines (entity_type, entity_id, reason, metadata)
SELECT 'source_decision_edge', edge.id, 'invalid_governing_edge', to_jsonb(edge)
FROM source_decision_edges edge
LEFT JOIN source_claims sc ON sc.id = edge.source_claim_id
LEFT JOIN source_artifacts sa ON sa.id = sc.source_artifact_id
LEFT JOIN source_decisions sd ON sd.id = edge.source_decision_id
WHERE edge.source_decision_id IS NULL OR sc.id IS NULL OR sa.id IS NULL OR sd.id IS NULL
   OR sd.source_claim_id IS DISTINCT FROM sc.id OR sd.status <> 'adopt'
   OR sc.status <> 'accepted' OR sd.project_id IS DISTINCT FROM sa.project_id
ON CONFLICT (entity_type, entity_id, reason) DO NOTHING;
--> statement-breakpoint
DELETE FROM source_decision_edges edge
WHERE edge.id IN (
  SELECT quarantine.entity_id
  FROM source_authority_quarantines quarantine
  WHERE quarantine.entity_type = 'source_decision_edge' AND quarantine.reason = 'invalid_governing_edge'
);
--> statement-breakpoint
INSERT INTO source_authority_quarantines (entity_type, entity_id, reason, metadata)
SELECT 'search_document', search.id, 'active_search_without_canonical_authority', to_jsonb(search)
FROM search_documents search
LEFT JOIN source_claims sc ON sc.id = search.source_claim_id
LEFT JOIN source_artifacts sa ON sa.id = sc.source_artifact_id
LEFT JOIN source_decisions sd ON sd.id = search.source_decision_id
WHERE search.validity_status = 'active'
  AND (search.source_claim_id IS NOT NULL OR search.source_decision_id IS NOT NULL)
  AND (
    sc.id IS NULL OR sa.id IS NULL OR sd.id IS NULL OR sd.source_claim_id IS DISTINCT FROM sc.id
    OR sd.status <> 'adopt' OR sc.status <> 'accepted'
    OR search.project_id IS DISTINCT FROM sa.project_id OR sd.project_id IS DISTINCT FROM sa.project_id
  )
ON CONFLICT (entity_type, entity_id, reason) DO NOTHING;
--> statement-breakpoint
UPDATE search_documents search
SET validity_status = 'invalidated',
    invalidated_at = now(),
    metadata = search.metadata || jsonb_build_object('authorityStatus', 'quarantined', 'quarantineReason', 'active_search_without_canonical_authority')
WHERE search.id IN (
  SELECT quarantine.entity_id
  FROM source_authority_quarantines quarantine
  WHERE quarantine.entity_type = 'search_document'
    AND quarantine.reason = 'active_search_without_canonical_authority'
);
--> statement-breakpoint
INSERT INTO source_authority_quarantines (entity_type, entity_id, reason, metadata)
SELECT 'source_artifact', artifact.id, 'incomplete_import_lifecycle', to_jsonb(artifact)
FROM source_artifacts artifact
WHERE artifact.import_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM source_authority_quarantines quarantine
    WHERE quarantine.entity_type = 'source_artifact' AND quarantine.entity_id = artifact.id
  )
  AND (
    NOT EXISTS (SELECT 1 FROM source_chunks chunk WHERE chunk.source_artifact_id = artifact.id AND chunk.ordinal = 0) OR
    NOT EXISTS (SELECT 1 FROM source_claims claim WHERE claim.source_artifact_id = artifact.id) OR
    (artifact.metadata->>'decisionCorpusStatus' = 'current' AND NOT EXISTS (
      SELECT 1
      FROM source_claims claim
      JOIN source_decisions decision ON decision.source_claim_id = claim.id
      JOIN source_decision_edges edge ON edge.source_claim_id = claim.id AND edge.source_decision_id = decision.id
      JOIN search_documents search ON search.source_artifact_id = artifact.id
      WHERE claim.source_artifact_id = artifact.id AND claim.status = 'accepted' AND decision.status = 'adopt' AND search.validity_status = 'active'
    )) OR
    (artifact.metadata->>'decisionCorpusStatus' = 'stale' AND NOT EXISTS (
      SELECT 1
      FROM source_claims claim
      JOIN source_decisions decision ON decision.source_claim_id = claim.id
      JOIN search_documents search ON search.source_artifact_id = artifact.id
      WHERE claim.source_artifact_id = artifact.id AND claim.status = 'deprecated' AND decision.status = 'defer' AND search.validity_status = 'expired'
    )) OR
    (artifact.metadata->>'decisionCorpusStatus' = 'rejected' AND NOT EXISTS (
      SELECT 1
      FROM source_claims claim
      JOIN source_decisions decision ON decision.source_claim_id = claim.id
      JOIN source_rejections rejection ON rejection.source_claim_id = claim.id AND rejection.source_artifact_id = artifact.id
      WHERE claim.source_artifact_id = artifact.id AND claim.status = 'rejected' AND decision.status = 'reject'
    ))
  )
ON CONFLICT (entity_type, entity_id, reason) DO NOTHING;
--> statement-breakpoint
UPDATE search_documents search
SET validity_status = 'invalidated',
    invalidated_at = now(),
    metadata = search.metadata || jsonb_build_object('authorityStatus', 'quarantined', 'quarantineReason', 'incomplete_import_lifecycle')
WHERE search.source_artifact_id IN (
  SELECT entity_id FROM source_authority_quarantines
  WHERE entity_type = 'source_artifact' AND reason = 'incomplete_import_lifecycle'
);
--> statement-breakpoint
UPDATE source_decisions decision
SET status = 'lab_test',
    project_id = NULL,
    metadata = decision.metadata || jsonb_build_object('authorityStatus', 'quarantined', 'quarantineReason', 'incomplete_import_lifecycle')
WHERE decision.source_claim_id IN (
  SELECT claim.id FROM source_claims claim
  JOIN source_artifacts artifact ON artifact.id = claim.source_artifact_id
  JOIN source_authority_quarantines quarantine ON quarantine.entity_type = 'source_artifact' AND quarantine.entity_id = artifact.id AND quarantine.reason = 'incomplete_import_lifecycle'
);
--> statement-breakpoint
UPDATE source_claims claim
SET status = 'proposed',
    metadata = claim.metadata || jsonb_build_object('authorityStatus', 'quarantined', 'quarantineReason', 'incomplete_import_lifecycle')
WHERE claim.source_artifact_id IN (
  SELECT entity_id FROM source_authority_quarantines
  WHERE entity_type = 'source_artifact' AND reason = 'incomplete_import_lifecycle'
);
--> statement-breakpoint
UPDATE source_claims claim
SET status = 'proposed',
    metadata = claim.metadata || jsonb_build_object('authorityStatus', 'quarantined', 'quarantineReason', 'related_decision_quarantined')
WHERE claim.status IN ('accepted', 'rejected', 'deprecated')
  AND EXISTS (
    SELECT 1
    FROM source_authority_quarantines quarantine
    JOIN source_decisions decision ON decision.id = quarantine.entity_id
    WHERE quarantine.entity_type = 'source_decision'
      AND quarantine.entity_id = decision.id
      AND quarantine.reason IN ('project_mismatch', 'orphaned_governing_decision', 'captured_evidence_missing_or_mismatched', 'conflicting_terminal_review')
      AND decision.source_claim_id = claim.id
  );
--> statement-breakpoint
ALTER TABLE source_decision_edges ALTER COLUMN source_decision_id SET NOT NULL;
--> statement-breakpoint
ALTER TABLE source_decisions ADD CONSTRAINT source_decisions_id_claim_unique UNIQUE (id, source_claim_id);
--> statement-breakpoint
ALTER TABLE source_decision_edges ADD CONSTRAINT source_decision_edges_decision_claim_fk
  FOREIGN KEY (source_decision_id, source_claim_id) REFERENCES source_decisions (id, source_claim_id);
--> statement-breakpoint
CREATE UNIQUE INDEX source_decision_edges_identity_unique
  ON source_decision_edges (source_claim_id, source_decision_id, target_type, target_id, support_type);
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
  SELECT decision.status, decision.source_claim_id, decision.project_id, claim.status, artifact.project_id
  INTO decision_status, decision_claim, decision_project, claim_status, artifact_project
  FROM source_decisions decision
  JOIN source_claims claim ON claim.id = NEW.source_claim_id
  JOIN source_artifacts artifact ON artifact.id = claim.source_artifact_id
  WHERE decision.id = NEW.source_decision_id;
  IF decision_claim IS DISTINCT FROM NEW.source_claim_id OR decision_status <> 'adopt'
     OR claim_status <> 'accepted' OR decision_project IS DISTINCT FROM artifact_project THEN
    RAISE EXCEPTION 'SourceDecisionEdge requires same-project adopted reviewed SourceDecision';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER source_decisions_project_coherence
BEFORE INSERT OR UPDATE OF project_id, source_claim_id, status ON source_decisions
FOR EACH ROW EXECUTE FUNCTION enforce_source_decision_project_coherence();
--> statement-breakpoint
CREATE TRIGGER source_decision_edges_coherence
BEFORE INSERT OR UPDATE OF source_decision_id, source_claim_id ON source_decision_edges
FOR EACH ROW EXECUTE FUNCTION enforce_source_decision_edge_coherence();
