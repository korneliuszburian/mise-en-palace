INSERT INTO source_authority_quarantines (entity_type, entity_id, reason, metadata)
SELECT
  'source_claim_edge',
  edge.id,
  'claim_chunk_artifact_mismatch',
  to_jsonb(edge) || jsonb_build_object(
    'quarantined_source_claim_ids', ARRAY(
      SELECT quarantine.entity_id
      FROM source_authority_quarantines quarantine
      WHERE quarantine.entity_type = 'source_claim'
        AND quarantine.reason = 'claim_chunk_artifact_mismatch'
        AND quarantine.entity_id IN (edge.from_source_claim_id, edge.to_source_claim_id)
      ORDER BY quarantine.entity_id
    )
  )
FROM source_claim_edges edge
WHERE EXISTS (
  SELECT 1
  FROM source_authority_quarantines quarantine
  WHERE quarantine.entity_type = 'source_claim'
    AND quarantine.reason = 'claim_chunk_artifact_mismatch'
    AND quarantine.entity_id IN (edge.from_source_claim_id, edge.to_source_claim_id)
)
ON CONFLICT (entity_type, entity_id, reason) DO NOTHING;
--> statement-breakpoint
DELETE FROM source_claim_edges edge
USING source_authority_quarantines quarantine
WHERE quarantine.entity_type = 'source_claim_edge'
  AND quarantine.entity_id = edge.id
  AND quarantine.reason = 'claim_chunk_artifact_mismatch';
