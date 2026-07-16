CREATE FUNCTION krn_search_document_provenance_violation(input search_documents)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chain_artifact_id uuid;
  chain_chunk_id uuid;
  chain_claim_id uuid;
  chain_decision_id uuid;
  candidate_artifact_id uuid;
  chunk_artifact_id uuid;
  claim_artifact_id uuid;
  claim_chunk_id uuid;
  decision_claim_id uuid;
  artifact_project_id uuid;
  decision_project_id uuid;
BEGIN
  IF input.validity_status <> 'active' THEN
    RETURN NULL;
  END IF;

  chain_artifact_id := input.source_artifact_id;
  IF input.subject_type = 'source_artifact' THEN
    IF chain_artifact_id IS NOT NULL AND chain_artifact_id <> input.subject_id THEN
      RETURN 'subject_artifact_link_mismatch';
    END IF;
    chain_artifact_id := input.subject_id;
  END IF;

  chain_chunk_id := input.source_chunk_id;
  IF input.subject_type = 'source_chunk' THEN
    IF chain_chunk_id IS NOT NULL AND chain_chunk_id <> input.subject_id THEN
      RETURN 'subject_chunk_link_mismatch';
    END IF;
    chain_chunk_id := input.subject_id;
  END IF;

  chain_claim_id := input.source_claim_id;
  IF input.subject_type = 'source_claim' THEN
    IF chain_claim_id IS NOT NULL AND chain_claim_id <> input.subject_id THEN
      RETURN 'subject_claim_link_mismatch';
    END IF;
    chain_claim_id := input.subject_id;
  END IF;

  chain_decision_id := input.source_decision_id;
  IF input.subject_type = 'architecture_decision' THEN
    IF chain_decision_id IS NOT NULL AND chain_decision_id <> input.subject_id THEN
      RETURN 'subject_decision_link_mismatch';
    END IF;
    chain_decision_id := input.subject_id;
  END IF;

  IF chain_decision_id IS NOT NULL THEN
    SELECT decision.source_claim_id, decision.project_id
    INTO decision_claim_id, decision_project_id
    FROM source_decisions decision
    WHERE decision.id = chain_decision_id;
    IF NOT FOUND THEN
      RETURN 'missing_source_decision';
    END IF;

    IF chain_claim_id IS NULL THEN
      chain_claim_id := decision_claim_id;
    ELSIF decision_claim_id IS DISTINCT FROM chain_claim_id THEN
      RETURN 'decision_claim_mismatch';
    END IF;

    IF decision_claim_id IS NULL AND (
      chain_artifact_id IS NOT NULL OR chain_chunk_id IS NOT NULL OR chain_claim_id IS NOT NULL
    ) THEN
      RETURN 'standalone_decision_source_chain_mismatch';
    END IF;
  END IF;

  IF chain_claim_id IS NOT NULL THEN
    SELECT claim.source_artifact_id, claim.source_chunk_id
    INTO claim_artifact_id, claim_chunk_id
    FROM source_claims claim
    WHERE claim.id = chain_claim_id;
    IF NOT FOUND THEN
      RETURN 'missing_source_claim';
    END IF;

    IF chain_chunk_id IS NULL THEN
      chain_chunk_id := claim_chunk_id;
    ELSIF claim_chunk_id IS DISTINCT FROM chain_chunk_id THEN
      RETURN 'claim_chunk_mismatch';
    END IF;
  END IF;

  IF chain_chunk_id IS NOT NULL THEN
    SELECT chunk.source_artifact_id
    INTO chunk_artifact_id
    FROM source_chunks chunk
    WHERE chunk.id = chain_chunk_id;
    IF NOT FOUND THEN
      RETURN 'missing_source_chunk';
    END IF;
  END IF;

  FOREACH candidate_artifact_id IN ARRAY ARRAY[claim_artifact_id, chunk_artifact_id]
  LOOP
    IF candidate_artifact_id IS NOT NULL THEN
      IF chain_artifact_id IS NULL THEN
        chain_artifact_id := candidate_artifact_id;
      ELSIF chain_artifact_id <> candidate_artifact_id THEN
        RETURN 'artifact_chain_mismatch';
      END IF;
    END IF;
  END LOOP;

  IF chain_artifact_id IS NOT NULL THEN
    SELECT artifact.project_id
    INTO artifact_project_id
    FROM source_artifacts artifact
    WHERE artifact.id = chain_artifact_id;
    IF NOT FOUND THEN
      RETURN 'missing_source_artifact';
    END IF;

    IF input.project_id IS DISTINCT FROM artifact_project_id THEN
      RETURN 'artifact_project_mismatch';
    END IF;
  END IF;

  IF chain_decision_id IS NOT NULL AND input.project_id IS DISTINCT FROM decision_project_id THEN
    RETURN 'decision_project_mismatch';
  END IF;

  RETURN NULL;
END
$$;
--> statement-breakpoint
LOCK TABLE source_artifacts, source_chunks, source_claims, source_decisions, search_documents
IN SHARE ROW EXCLUSIVE MODE;
--> statement-breakpoint
INSERT INTO source_authority_quarantines (entity_type, entity_id, reason, metadata)
SELECT
  'search_document',
  search.id,
  'incoherent_search_document_provenance',
  to_jsonb(search) || jsonb_build_object(
    'provenanceViolation', krn_search_document_provenance_violation(search)
  )
FROM search_documents search
WHERE krn_search_document_provenance_violation(search) IS NOT NULL
ON CONFLICT (entity_type, entity_id, reason) DO NOTHING;
--> statement-breakpoint
UPDATE search_documents search
SET validity_status = 'invalidated',
    invalidated_at = now(),
    metadata = search.metadata || jsonb_build_object(
      'authorityStatus', 'quarantined',
      'quarantineReason', 'incoherent_search_document_provenance',
      'provenanceViolation', krn_search_document_provenance_violation(search)
    )
FROM source_authority_quarantines quarantine
WHERE quarantine.entity_type = 'search_document'
  AND quarantine.entity_id = search.id
  AND quarantine.reason = 'incoherent_search_document_provenance';
--> statement-breakpoint
CREATE FUNCTION enforce_search_document_provenance_coherence()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  violation text;
BEGIN
  violation := krn_search_document_provenance_violation(NEW);
  IF violation IS NOT NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      CONSTRAINT = 'search_documents_provenance_coherence',
      MESSAGE = format('active SearchDocument canonical provenance is incoherent: %s', violation);
  END IF;
  RETURN NEW;
END
$$;
--> statement-breakpoint
CREATE TRIGGER search_documents_provenance_coherence
BEFORE INSERT OR UPDATE OF
  project_id,
  subject_type,
  subject_id,
  source_artifact_id,
  source_chunk_id,
  source_claim_id,
  source_decision_id,
  validity_status
ON search_documents
FOR EACH ROW
EXECUTE FUNCTION enforce_search_document_provenance_coherence();
--> statement-breakpoint
CREATE FUNCTION enforce_referenced_search_document_provenance_coherence()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  incoherent_search_document_id uuid;
  violation text;
BEGIN
  SELECT search.id, krn_search_document_provenance_violation(search)
  INTO incoherent_search_document_id, violation
  FROM search_documents search
  WHERE krn_search_document_provenance_violation(search) IS NOT NULL
  ORDER BY search.id
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      CONSTRAINT = 'search_documents_provenance_coherence',
      MESSAGE = format(
        'canonical source mutation would make active SearchDocument %s incoherent: %s',
        incoherent_search_document_id,
        violation
      );
  END IF;

  RETURN NULL;
END
$$;
--> statement-breakpoint
CREATE TRIGGER source_artifacts_search_document_provenance_coherence
AFTER UPDATE OF id, project_id OR DELETE
ON source_artifacts
FOR EACH ROW
EXECUTE FUNCTION enforce_referenced_search_document_provenance_coherence();
--> statement-breakpoint
CREATE TRIGGER source_chunks_search_document_provenance_coherence
AFTER UPDATE OF id, source_artifact_id OR DELETE
ON source_chunks
FOR EACH ROW
EXECUTE FUNCTION enforce_referenced_search_document_provenance_coherence();
--> statement-breakpoint
CREATE TRIGGER source_claims_search_document_provenance_coherence
AFTER UPDATE OF id, source_artifact_id, source_chunk_id OR DELETE
ON source_claims
FOR EACH ROW
EXECUTE FUNCTION enforce_referenced_search_document_provenance_coherence();
--> statement-breakpoint
CREATE TRIGGER source_decisions_search_document_provenance_coherence
AFTER UPDATE OF id, project_id, source_claim_id OR DELETE
ON source_decisions
FOR EACH ROW
EXECUTE FUNCTION enforce_referenced_search_document_provenance_coherence();
--> statement-breakpoint
CREATE FUNCTION serialize_search_document_provenance_writes()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_setting('transaction_isolation') <> 'read committed' THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      CONSTRAINT = 'search_documents_provenance_coherence',
      MESSAGE = format(
        'SearchDocument provenance writes require read committed isolation, got %s',
        current_setting('transaction_isolation')
      );
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended('krn:search-document-provenance-coherence', 0)
  );
  RETURN NULL;
END
$$;
--> statement-breakpoint
CREATE TRIGGER search_documents_provenance_coherence_serialization
BEFORE INSERT OR UPDATE
ON search_documents
FOR EACH STATEMENT
EXECUTE FUNCTION serialize_search_document_provenance_writes();
--> statement-breakpoint
CREATE TRIGGER source_artifacts_search_document_provenance_serialization
BEFORE UPDATE OF id, project_id OR DELETE
ON source_artifacts
FOR EACH STATEMENT
EXECUTE FUNCTION serialize_search_document_provenance_writes();
--> statement-breakpoint
CREATE TRIGGER source_chunks_search_document_provenance_serialization
BEFORE UPDATE OF id, source_artifact_id OR DELETE
ON source_chunks
FOR EACH STATEMENT
EXECUTE FUNCTION serialize_search_document_provenance_writes();
--> statement-breakpoint
CREATE TRIGGER source_claims_search_document_provenance_serialization
BEFORE UPDATE OF id, source_artifact_id, source_chunk_id OR DELETE
ON source_claims
FOR EACH STATEMENT
EXECUTE FUNCTION serialize_search_document_provenance_writes();
--> statement-breakpoint
CREATE TRIGGER source_decisions_search_document_provenance_serialization
BEFORE UPDATE OF id, project_id, source_claim_id OR DELETE
ON source_decisions
FOR EACH STATEMENT
EXECUTE FUNCTION serialize_search_document_provenance_writes();
