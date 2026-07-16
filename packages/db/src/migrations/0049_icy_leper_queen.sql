LOCK TABLE source_claim_edges, source_claims, source_artifacts,
  source_authority_quarantines IN SHARE ROW EXCLUSIVE MODE;
--> statement-breakpoint
INSERT INTO source_authority_quarantines (entity_type, entity_id, reason, metadata)
SELECT
  'source_claim_edge',
  edge.id,
  'self_source_claim_edge',
  to_jsonb(edge)
FROM source_claim_edges edge
WHERE edge.from_source_claim_id = edge.to_source_claim_id
ON CONFLICT (entity_type, entity_id, reason) DO NOTHING;
--> statement-breakpoint
INSERT INTO source_authority_quarantines (entity_type, entity_id, reason, metadata)
SELECT
  'source_claim_edge',
  edge.id,
  'cross_project_source_claim_edge',
  to_jsonb(edge) || jsonb_build_object(
    'fromProjectId', from_artifact.project_id,
    'toProjectId', to_artifact.project_id
  )
FROM source_claim_edges edge
JOIN source_claims from_claim ON from_claim.id = edge.from_source_claim_id
JOIN source_artifacts from_artifact ON from_artifact.id = from_claim.source_artifact_id
JOIN source_claims to_claim ON to_claim.id = edge.to_source_claim_id
JOIN source_artifacts to_artifact ON to_artifact.id = to_claim.source_artifact_id
WHERE from_artifact.project_id IS DISTINCT FROM to_artifact.project_id
ON CONFLICT (entity_type, entity_id, reason) DO NOTHING;
--> statement-breakpoint
WITH ranked_edges AS (
  SELECT
    edge.*,
    first_value(edge.id) OVER (
      PARTITION BY edge.from_source_claim_id, edge.to_source_claim_id, edge.kind
      ORDER BY edge.created_at, edge.id
    ) AS canonical_edge_id,
    row_number() OVER (
      PARTITION BY edge.from_source_claim_id, edge.to_source_claim_id, edge.kind
      ORDER BY edge.created_at, edge.id
    ) AS identity_rank
  FROM source_claim_edges edge
)
INSERT INTO source_authority_quarantines (entity_type, entity_id, reason, metadata)
SELECT
  'source_claim_edge',
  edge.id,
  'duplicate_source_claim_edge_identity',
  to_jsonb(edge) || jsonb_build_object('canonicalSourceClaimEdgeId', edge.canonical_edge_id)
FROM ranked_edges edge
WHERE edge.identity_rank > 1
ON CONFLICT (entity_type, entity_id, reason) DO NOTHING;
--> statement-breakpoint
DELETE FROM source_claim_edges edge
USING source_authority_quarantines quarantine
WHERE quarantine.entity_type = 'source_claim_edge'
  AND quarantine.entity_id = edge.id
  AND quarantine.reason IN (
    'self_source_claim_edge',
    'cross_project_source_claim_edge',
    'duplicate_source_claim_edge_identity'
  );
--> statement-breakpoint
CREATE UNIQUE INDEX "source_claim_edges_semantic_identity_unique" ON "source_claim_edges" USING btree ("from_source_claim_id","to_source_claim_id","kind");
--> statement-breakpoint
ALTER TABLE "source_claim_edges" ADD CONSTRAINT "source_claim_edges_distinct_claims" CHECK ("source_claim_edges"."from_source_claim_id" <> "source_claim_edges"."to_source_claim_id");
--> statement-breakpoint
CREATE OR REPLACE FUNCTION enforce_source_claim_edge_same_project()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  from_project uuid;
  to_project uuid;
BEGIN
  SELECT artifact.project_id INTO from_project
  FROM source_claims claim
  JOIN source_artifacts artifact ON artifact.id = claim.source_artifact_id
  WHERE claim.id = NEW.from_source_claim_id;

  SELECT artifact.project_id INTO to_project
  FROM source_claims claim
  JOIN source_artifacts artifact ON artifact.id = claim.source_artifact_id
  WHERE claim.id = NEW.to_source_claim_id;

  IF from_project IS DISTINCT FROM to_project THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      CONSTRAINT = 'source_claim_edges_same_project',
      MESSAGE = 'SourceClaimEdge requires source records from the same project';
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER source_claim_edges_same_project
BEFORE INSERT OR UPDATE OF from_source_claim_id, to_source_claim_id ON source_claim_edges
FOR EACH ROW EXECUTE FUNCTION enforce_source_claim_edge_same_project();
