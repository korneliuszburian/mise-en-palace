CREATE FUNCTION krn_source_authority_rank(authority "public"."source_trust_tier")
RETURNS integer
LANGUAGE sql
IMMUTABLE
STRICT
PARALLEL SAFE
AS $$
  SELECT CASE authority::text
    WHEN 'primary' THEN 100
    WHEN 'official' THEN 100
    WHEN 'project-decision' THEN 100
    WHEN 'source-code' THEN 100
    WHEN 'high' THEN 85
    WHEN 'paper' THEN 85
    WHEN 'medium' THEN 60
    WHEN 'practitioner' THEN 60
    WHEN 'secondary' THEN 60
    WHEN 'low' THEN 25
    WHEN 'hypothesis' THEN 10
  END
$$;
--> statement-breakpoint
LOCK TABLE source_artifacts IN SHARE ROW EXCLUSIVE MODE;
--> statement-breakpoint
LOCK TABLE source_claims IN SHARE ROW EXCLUSIVE MODE;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM source_claims claim
    JOIN source_artifacts artifact ON artifact.id = claim.source_artifact_id
    WHERE krn_source_authority_rank(claim.trust_tier) IS NULL
      OR krn_source_authority_rank(artifact.trust_tier) IS NULL
      OR krn_source_authority_rank(claim.trust_tier) >
        krn_source_authority_rank(artifact.trust_tier)
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      CONSTRAINT = 'source_claims_authority_ceiling',
      MESSAGE = 'cannot enforce SourceClaim authority ceiling while elevated legacy claims exist';
  END IF;
END
$$;
--> statement-breakpoint
CREATE FUNCTION enforce_source_claim_authority_ceiling()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  artifact_authority "public"."source_trust_tier";
  artifact_authority_rank integer;
  claim_authority_rank integer;
BEGIN
  SELECT artifact.trust_tier
  INTO artifact_authority
  FROM source_artifacts artifact
  WHERE artifact.id = NEW.source_artifact_id
  FOR SHARE;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  artifact_authority_rank := krn_source_authority_rank(artifact_authority);
  claim_authority_rank := krn_source_authority_rank(NEW.trust_tier);

  IF artifact_authority_rank IS NULL OR claim_authority_rank IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      CONSTRAINT = 'source_claims_authority_ceiling',
      MESSAGE = 'cannot compare unclassified SourceClaim or SourceArtifact authority';
  END IF;

  IF claim_authority_rank > artifact_authority_rank THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      CONSTRAINT = 'source_claims_authority_ceiling',
      MESSAGE = format(
        'SourceClaim sourceAuthority %s exceeds SourceArtifact sourceAuthority %s',
        NEW.trust_tier,
        artifact_authority
      );
  END IF;

  RETURN NEW;
END
$$;
--> statement-breakpoint
CREATE TRIGGER source_claims_authority_ceiling
BEFORE INSERT OR UPDATE OF source_artifact_id, trust_tier ON source_claims
FOR EACH ROW
EXECUTE FUNCTION enforce_source_claim_authority_ceiling();
--> statement-breakpoint
CREATE FUNCTION enforce_source_artifact_authority_floor()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  new_artifact_authority_rank integer;
  old_artifact_authority_rank integer;
BEGIN
  new_artifact_authority_rank := krn_source_authority_rank(NEW.trust_tier);
  old_artifact_authority_rank := krn_source_authority_rank(OLD.trust_tier);

  IF new_artifact_authority_rank IS NULL OR old_artifact_authority_rank IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      CONSTRAINT = 'source_claims_authority_ceiling',
      MESSAGE = 'cannot compare unclassified SourceArtifact authority';
  END IF;

  IF new_artifact_authority_rank < old_artifact_authority_rank AND EXISTS (
      SELECT 1
      FROM source_claims claim
      WHERE claim.source_artifact_id = OLD.id
        AND (
          krn_source_authority_rank(claim.trust_tier) IS NULL
          OR krn_source_authority_rank(claim.trust_tier) > new_artifact_authority_rank
        )
    ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      CONSTRAINT = 'source_claims_authority_ceiling',
      MESSAGE = format(
        'SourceArtifact sourceAuthority %s is below an existing SourceClaim authority',
        NEW.trust_tier
      );
  END IF;

  RETURN NEW;
END
$$;
--> statement-breakpoint
CREATE TRIGGER source_artifacts_authority_floor
BEFORE UPDATE OF trust_tier ON source_artifacts
FOR EACH ROW
EXECUTE FUNCTION enforce_source_artifact_authority_floor();
