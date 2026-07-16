CREATE FUNCTION serialize_source_claim_edge_integrity_writes()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_setting('transaction_isolation') <> 'read committed' THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      CONSTRAINT = 'source_claim_edges_same_project',
      MESSAGE = format(
        'SourceClaimEdge integrity writes require read committed isolation, got %s',
        current_setting('transaction_isolation')
      );
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended('krn:source-claim-edge-integrity', 0)
  );
  RETURN NULL;
END
$$;
--> statement-breakpoint
CREATE TRIGGER source_claim_edges_integrity_serialization
BEFORE INSERT OR UPDATE OF from_source_claim_id, to_source_claim_id, kind
ON source_claim_edges
FOR EACH STATEMENT
EXECUTE FUNCTION serialize_source_claim_edge_integrity_writes();
--> statement-breakpoint
CREATE TRIGGER source_artifacts_claim_edge_integrity_serialization
BEFORE UPDATE OF project_id
ON source_artifacts
FOR EACH STATEMENT
EXECUTE FUNCTION serialize_source_claim_edge_integrity_writes();
--> statement-breakpoint
CREATE TRIGGER source_claims_claim_edge_integrity_serialization
BEFORE UPDATE OF source_artifact_id
ON source_claims
FOR EACH STATEMENT
EXECUTE FUNCTION serialize_source_claim_edge_integrity_writes();
