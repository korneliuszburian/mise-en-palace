LOCK TABLE source_claims, source_decisions, search_documents
  IN SHARE ROW EXCLUSIVE MODE;
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
JOIN source_claims claim ON claim.id = decision.source_claim_id
JOIN source_authority_quarantines quarantine
  ON quarantine.entity_type = 'source_decision'
 AND quarantine.entity_id = decision.id
 AND quarantine.reason = 'captured_evidence_missing_or_mismatched'
WHERE decision.status = 'lab_test'
  AND decision.project_id IS NULL
  AND decision.metadata->>'quarantineReason' = 'captured_evidence_missing_or_mismatched'
  AND claim.status = 'proposed'
  AND claim.metadata->>'quarantineReason' = 'captured_evidence_missing_or_mismatched'
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
  AND search.validity_status = 'active'
  AND EXISTS (
    SELECT 1
    FROM source_decisions decision
    JOIN source_claims claim ON claim.id = decision.source_claim_id
    WHERE (
      decision.id = search.source_decision_id
      OR (
        search.source_decision_id IS NULL
        AND decision.source_claim_id = search.source_claim_id
      )
    )
      AND decision.status = 'lab_test'
      AND decision.project_id IS NULL
      AND decision.metadata->>'quarantineReason' = 'captured_evidence_missing_or_mismatched'
      AND claim.status = 'proposed'
      AND claim.metadata->>'quarantineReason' = 'captured_evidence_missing_or_mismatched'
  );
