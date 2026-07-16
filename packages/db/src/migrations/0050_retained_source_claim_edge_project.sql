CREATE OR REPLACE FUNCTION enforce_retained_source_claim_edge_same_project()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  violating_edge_id uuid;
BEGIN
  IF TG_TABLE_NAME = 'source_artifacts' THEN
    SELECT edge.id INTO violating_edge_id
    FROM source_claim_edges edge
    JOIN source_claims from_claim ON from_claim.id = edge.from_source_claim_id
    JOIN source_artifacts from_artifact ON from_artifact.id = from_claim.source_artifact_id
    JOIN source_claims to_claim ON to_claim.id = edge.to_source_claim_id
    JOIN source_artifacts to_artifact ON to_artifact.id = to_claim.source_artifact_id
    WHERE (from_artifact.id = NEW.id OR to_artifact.id = NEW.id)
      AND (CASE WHEN from_artifact.id = NEW.id THEN NEW.project_id ELSE from_artifact.project_id END)
        IS DISTINCT FROM
        (CASE WHEN to_artifact.id = NEW.id THEN NEW.project_id ELSE to_artifact.project_id END)
    ORDER BY edge.id
    LIMIT 1;
  ELSE
    SELECT edge.id INTO violating_edge_id
    FROM source_claim_edges edge
    JOIN source_claims other_claim ON other_claim.id = CASE
      WHEN edge.from_source_claim_id = NEW.id THEN edge.to_source_claim_id
      ELSE edge.from_source_claim_id
    END
    JOIN source_artifacts other_artifact ON other_artifact.id = other_claim.source_artifact_id
    JOIN source_artifacts new_artifact ON new_artifact.id = NEW.source_artifact_id
    WHERE NEW.id IN (edge.from_source_claim_id, edge.to_source_claim_id)
      AND new_artifact.project_id IS DISTINCT FROM other_artifact.project_id
    ORDER BY edge.id
    LIMIT 1;
  END IF;

  IF violating_edge_id IS NOT NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      CONSTRAINT = 'source_claim_edges_same_project',
      MESSAGE = 'SourceClaimEdge endpoint ownership update would cross projects',
      DETAIL = violating_edge_id::text;
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER source_artifacts_retained_claim_edge_project
BEFORE UPDATE OF project_id ON source_artifacts
FOR EACH ROW EXECUTE FUNCTION enforce_retained_source_claim_edge_same_project();
--> statement-breakpoint
CREATE TRIGGER source_claims_retained_claim_edge_project
BEFORE UPDATE OF source_artifact_id ON source_claims
FOR EACH ROW EXECUTE FUNCTION enforce_retained_source_claim_edge_same_project();
