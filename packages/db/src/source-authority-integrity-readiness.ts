import postgres, { type Sql, type TransactionSql } from "postgres";

import { inspectDatabaseRequiredTables } from "./readiness-support.js";

export type SourceAuthorityIntegrityViolationKind =
  | "project_mismatch"
  | "claim_chunk_artifact_mismatch"
  | "missing_terminal_review"
  | "conflicting_terminal_review"
  | "claim_decision_status_mismatch"
  | "governing_edge_without_current_reviewed_decision"
  | "incoherent_search_document_provenance"
  | "active_search_without_canonical_authority"
  | "incomplete_import_lifecycle"
  | "captured_evidence_missing_or_mismatched"
  | "governing_evidence_not_current";

interface SourceAuthorityIntegrityViolationBase {
  id: string;
  subjectId: string;
  detail: string;
}

type GeneralSourceAuthorityIntegrityViolationKind = Exclude<
  SourceAuthorityIntegrityViolationKind,
  "governing_evidence_not_current"
>;

interface NonCurrentGoverningEvidenceContext {
  projectId: string | null;
  sourceArtifactId: string;
  sourceChunkId: string | null;
  sourceClaimId: string;
  sourceDecisionId: string;
  evidenceRef: string;
  evidenceFreshness: "stale" | "unknown";
}

export type SourceAuthorityIntegrityViolation =
  | SourceAuthorityIntegrityViolationBase & {
      kind: GeneralSourceAuthorityIntegrityViolationKind;
    }
  | SourceAuthorityIntegrityViolationBase & NonCurrentGoverningEvidenceContext & {
      kind: "governing_evidence_not_current";
    };

export interface SourceAuthorityIntegrityReadinessInput {
  databaseUrl: string;
  storeName?: string;
  schemaIdentity?: string;
}

export interface SourceAuthorityIntegrityReadinessReport {
  storeName: string;
  schemaIdentity: string;
  checkedAt: string;
  requiredTables: readonly string[];
  presentTables: readonly string[];
  missingTables: readonly string[];
  schemaReady: boolean;
  readOnly: boolean;
  violationCount: number;
  violations: readonly SourceAuthorityIntegrityViolation[];
  integrityReady: boolean;
}

const requiredSourceAuthorityTables = [
  "source_artifacts",
  "source_chunks",
  "source_claims",
  "source_decisions",
  "source_decision_edges",
  "source_rejections",
  "search_documents",
  "source_authority_quarantines"
] as const;

type RawViolation = {
  id: string;
  kind: GeneralSourceAuthorityIntegrityViolationKind;
  subjectId: string;
  detail: string;
};

const violation = (
  kind: GeneralSourceAuthorityIntegrityViolationKind,
  subjectId: string,
  detail: string
): SourceAuthorityIntegrityViolation => ({
  id: `${kind}:${subjectId}`,
  kind,
  subjectId,
  detail
});

const inspectNonCurrentGoverningEvidence = async (
  client: Sql | TransactionSql
): Promise<SourceAuthorityIntegrityViolation[]> => {
  const rows = await client<NonCurrentGoverningEvidenceContext[]>`
    select
      coalesce(decision.project_id, sa.project_id)::text as "projectId",
      sa.id::text as "sourceArtifactId",
      sc.source_chunk_id::text as "sourceChunkId",
      sc.id::text as "sourceClaimId",
      decision.id::text as "sourceDecisionId",
      coalesce(nullif(sa.metadata->>'evidenceRef', ''), sa.uri) as "evidenceRef",
      case
        when sa.metadata->>'evidenceFreshness' = 'stale' then 'stale'
        else 'unknown'
      end as "evidenceFreshness"
    from source_decisions decision
    join source_claims sc on sc.id = decision.source_claim_id
    join source_artifacts sa on sa.id = sc.source_artifact_id
    where decision.status = 'adopt'
      and coalesce(sa.metadata->>'evidenceFreshness', 'unknown') <> 'current'
      and not exists (
        select 1 from source_authority_quarantines quarantine
        where quarantine.entity_type = 'source_decision' and quarantine.entity_id = decision.id
      )
    order by decision.id
  `;

  return rows.map((row) => ({
    id: `governing_evidence_not_current:${row.sourceDecisionId}`,
    kind: "governing_evidence_not_current",
    subjectId: row.sourceDecisionId,
    detail:
      `governing SourceDecision evidence freshness is ${row.evidenceFreshness}, not current`,
    ...row
  }));
};

const inspectSearchDocumentProvenanceViolations = async (
  client: Sql | TransactionSql
): Promise<SourceAuthorityIntegrityViolation[]> => {
  const [functionInspection] = await client<{ available: boolean }[]>`
    select to_regprocedure(
      'krn_search_document_provenance_violation(search_documents)'
    ) is not null as available
  `;

  if (functionInspection?.available !== true) {
    return [];
  }

  const rows = await client<RawViolation[]>`
    select
      concat(
        'incoherent_search_document_provenance:',
        search.id::text
      ) as id,
      'incoherent_search_document_provenance'::text as kind,
      search.id::text as "subjectId",
      concat(
        'active SearchDocument canonical provenance is incoherent: ',
        krn_search_document_provenance_violation(search)
      )::text as detail
    from search_documents search
    where krn_search_document_provenance_violation(search) is not null
      and not exists (
        select 1 from source_authority_quarantines quarantine
        where quarantine.entity_type = 'search_document'
          and quarantine.entity_id = search.id
          and quarantine.reason = 'incoherent_search_document_provenance'
      )
    order by search.id
  `;

  return rows.map((row) => violation(row.kind, row.subjectId, row.detail));
};

const inspectViolations = async (
  client: Sql | TransactionSql
): Promise<SourceAuthorityIntegrityViolation[]> => {
  const rows = await client<RawViolation[]>`
    with
    project_mismatches as (
      select
        'project_mismatch'::text as kind,
        sd.id::text as subject_id,
        'SourceDecision project differs from its SourceArtifact project'::text as detail
      from source_decisions sd
      join source_claims sc on sc.id = sd.source_claim_id
      join source_artifacts sa on sa.id = sc.source_artifact_id
      where sd.status in ('adopt', 'reject')
        and sd.project_id is distinct from sa.project_id
        and not exists (
          select 1 from source_authority_quarantines quarantine
          where quarantine.entity_type = 'source_decision' and quarantine.entity_id = sd.id
        )
    ),
    claim_chunk_artifact_mismatches as (
      select
        'claim_chunk_artifact_mismatch'::text as kind,
        sc.id::text as subject_id,
        'SourceClaim source chunk belongs to a different SourceArtifact'::text as detail
      from source_claims sc
      join source_chunks chunk on chunk.id = sc.source_chunk_id
      where chunk.source_artifact_id <> sc.source_artifact_id
        and not exists (
          select 1 from source_authority_quarantines quarantine
          where quarantine.entity_type = 'source_claim'
            and quarantine.entity_id = sc.id
            and quarantine.reason = 'claim_chunk_artifact_mismatch'
        )
    ),
    terminal_review_counts as (
      select
        sc.id,
        sc.status,
        count(sd.id) filter (where sd.status in ('adopt', 'reject', 'defer'))::int as terminal_count,
        count(sd.id) filter (where sd.status = 'adopt')::int as adopt_count,
        count(sd.id) filter (where sd.status = 'reject')::int as reject_count,
        count(sd.id) filter (where sd.status = 'defer')::int as defer_count
      from source_claims sc
      left join source_decisions sd on sd.source_claim_id = sc.id
      group by sc.id, sc.status
    ),
    missing_reviews as (
      select
        'missing_terminal_review'::text as kind,
        id::text as subject_id,
        'terminal SourceClaim status has no matching terminal SourceDecision'::text as detail
      from terminal_review_counts
      where status in ('accepted', 'rejected', 'deprecated') and terminal_count = 0
        and not exists (
          select 1 from source_authority_quarantines quarantine
          where quarantine.entity_type = 'source_claim' and quarantine.entity_id = terminal_review_counts.id
        )
    ),
    conflicting_reviews as (
      select
        'conflicting_terminal_review'::text as kind,
        id::text as subject_id,
        'SourceClaim has multiple or contradictory terminal SourceDecisions'::text as detail
      from terminal_review_counts
      where (terminal_count > 1 or (adopt_count > 0 and reject_count > 0))
        and not exists (
          select 1 from source_authority_quarantines quarantine
          where quarantine.entity_type = 'source_claim' and quarantine.entity_id = terminal_review_counts.id
        )
    ),
    status_mismatches as (
      select
        'claim_decision_status_mismatch'::text as kind,
        trc.id::text as subject_id,
        'SourceClaim lifecycle status does not match its terminal SourceDecision'::text as detail
      from terminal_review_counts trc
      where (
        (trc.status = 'accepted' and (trc.adopt_count <> 1 or trc.terminal_count <> 1)) or
        (trc.status = 'deprecated' and (trc.defer_count <> 1 or trc.terminal_count <> 1)) or
        (trc.status = 'rejected' and (trc.reject_count <> 1 or trc.terminal_count <> 1))
      )
        and not exists (
          select 1 from source_authority_quarantines quarantine
          where quarantine.entity_type = 'source_claim' and quarantine.entity_id = trc.id
        )
    ),
    invalid_edges as (
      select
        'governing_edge_without_current_reviewed_decision'::text as kind,
        sde.id::text as subject_id,
        'SourceDecisionEdge is not linked to the same-project adopted reviewed decision'::text as detail
      from source_decision_edges sde
      left join source_claims sc on sc.id = sde.source_claim_id
      left join source_artifacts sa on sa.id = sc.source_artifact_id
      left join source_decisions sd on sd.id = sde.source_decision_id
      where (
        sde.source_decision_id is null or
        sc.id is null or
        sa.id is null or
        sd.id is null or
        sd.source_claim_id is distinct from sc.id or
        sd.status <> 'adopt' or
        sc.status <> 'accepted' or
        sd.project_id is distinct from sa.project_id
      )
        and not exists (
          select 1 from source_authority_quarantines quarantine
          where quarantine.entity_type = 'source_decision_edge' and quarantine.entity_id = sde.id
        )
    ),
    invalid_search as (
      select
        'active_search_without_canonical_authority'::text as kind,
        sd.id::text as subject_id,
        'active source SearchDocument has no same-project current canonical authority'::text as detail
      from search_documents sd
      left join source_claims sc on sc.id = sd.source_claim_id
      left join source_artifacts sa on sa.id = sc.source_artifact_id
      left join source_decisions decision on decision.id = sd.source_decision_id
      where
        sd.validity_status = 'active' and
        (sd.source_claim_id is not null or sd.source_decision_id is not null) and
        (
          sc.id is null or
          sa.id is null or
          decision.id is null or
          decision.source_claim_id is distinct from sc.id or
          decision.status <> 'adopt' or
          sc.status <> 'accepted' or
          sd.project_id is distinct from sa.project_id or
          decision.project_id is distinct from sa.project_id
        )
        and not exists (
          select 1 from source_authority_quarantines quarantine
          where quarantine.entity_type = 'search_document' and quarantine.entity_id = sd.id
        )
    ),
    incomplete_imports as (
      select distinct
        'incomplete_import_lifecycle'::text as kind,
        sa.id::text as subject_id,
        'imported SourceArtifact is missing a complete status-aware lifecycle'::text as detail
      from source_artifacts sa
      left join source_chunks chunk on chunk.source_artifact_id = sa.id and chunk.ordinal = 0
      left join source_claims sc on sc.source_artifact_id = sa.id
      left join source_decisions decision on decision.source_claim_id = sc.id
      left join source_decision_edges edge on edge.source_claim_id = sc.id and edge.source_decision_id = decision.id
      left join search_documents search on search.source_artifact_id = sa.id
      left join source_rejections rejection on rejection.source_artifact_id = sa.id and rejection.source_claim_id = sc.id
      where sa.import_id is not null
        and not exists (
          select 1 from source_authority_quarantines quarantine
          where quarantine.entity_type = 'source_artifact' and quarantine.entity_id = sa.id
        )
        and (
        chunk.id is null or
        sc.id is null or
        decision.id is null or
        (sa.metadata->>'decisionCorpusStatus' = 'current' and not (
          (
            decision.status = 'adopt' and
            sc.status = 'accepted' and
            edge.id is not null and
            search.id is not null and
            search.validity_status = 'active'
          ) or (
            sa.metadata->>'evidenceStatus' = 'captured' and
            coalesce(sa.metadata->>'evidenceFreshness', 'unknown') <> 'current' and
            decision.status = 'defer' and
            sc.status = 'deprecated' and
            edge.id is null and
            search.id is not null and
            search.validity_status = 'expired'
          )
        )) or
        (sa.metadata->>'decisionCorpusStatus' = 'stale' and (
          decision.status <> 'defer' or sc.status <> 'deprecated' or edge.id is not null or search.id is null or search.validity_status <> 'expired'
        )) or
        (sa.metadata->>'decisionCorpusStatus' = 'rejected' and (
          decision.status <> 'reject' or sc.status <> 'rejected' or rejection.id is null or search.id is not null
        ))
      )
    ),
    invalid_evidence as (
      select
        'captured_evidence_missing_or_mismatched'::text as kind,
        decision.id::text as subject_id,
        'governing SourceDecision does not carry matching captured evidence provenance'::text as detail
      from source_decisions decision
      join source_claims sc on sc.id = decision.source_claim_id
      join source_artifacts sa on sa.id = sc.source_artifact_id
      left join source_chunks chunk on chunk.source_artifact_id = sa.id and chunk.ordinal = 0
      where decision.status = 'adopt' and (
        coalesce(decision.metadata->>'evidenceStatus', '') <> 'captured' or
        nullif(decision.metadata->>'evidenceContentHash', '') is null or
        decision.metadata->>'evidenceContentHash' is distinct from sc.metadata->>'evidenceContentHash' or
        decision.metadata->>'evidenceContentHash' is distinct from sa.metadata->>'evidenceContentHash' or
        decision.metadata->>'evidenceContentHash' is distinct from chunk.metadata->>'evidenceContentHash'
      )
        and not exists (
          select 1 from source_authority_quarantines quarantine
          where quarantine.entity_type = 'source_decision' and quarantine.entity_id = decision.id
        )
    )
    select
      concat(kind, ':', subject_id) as id,
      kind,
      subject_id as "subjectId",
      detail
    from (
      select * from project_mismatches
      union all select * from claim_chunk_artifact_mismatches
      union all select * from missing_reviews
      union all select * from conflicting_reviews
      union all select * from status_mismatches
      union all select * from invalid_edges
      union all select * from invalid_search
      union all select * from incomplete_imports
      union all select * from invalid_evidence
    ) violations
    order by kind, subject_id
  `;

  const violations = rows.map((row) => violation(row.kind, row.subjectId, row.detail));
  const incoherentSearchDocumentProvenance =
    await inspectSearchDocumentProvenanceViolations(client);
  const nonCurrentGoverningEvidence = await inspectNonCurrentGoverningEvidence(client);

  return [
    ...violations,
    ...incoherentSearchDocumentProvenance,
    ...nonCurrentGoverningEvidence
  ].sort((left, right) =>
    left.kind === right.kind
      ? left.subjectId.localeCompare(right.subjectId)
      : left.kind.localeCompare(right.kind)
  );
};

export const inspectSourceAuthorityIntegrity = async (
  input: SourceAuthorityIntegrityReadinessInput
): Promise<SourceAuthorityIntegrityReadinessReport> => {
  const databaseUrl = input.databaseUrl.trim();

  if (databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for source authority integrity readiness");
  }

  const client = postgres(databaseUrl, { max: 1, onnotice: () => undefined });
  const checkedAt = new Date().toISOString();

  try {
    const tableInspection = await inspectDatabaseRequiredTables(client, requiredSourceAuthorityTables);
    if (!tableInspection.schemaReady) {
      return {
        storeName: input.storeName ?? "postgres",
        schemaIdentity: input.schemaIdentity ?? "unknown",
        checkedAt,
        ...tableInspection,
        readOnly: true,
        violationCount: 0,
        violations: [],
        integrityReady: false
      };
    }

    return await client.begin("isolation level repeatable read read only", async (tx) => {
      const transactionRows = await tx<{
        isolationLevel: string;
        readOnly: string;
      }[]>`
        select
          current_setting('transaction_isolation') as "isolationLevel",
          current_setting('transaction_read_only') as "readOnly"
      `;
      const violations = await inspectViolations(tx);
      const transaction = transactionRows[0];
      const snapshotReadOnly = transaction?.readOnly === "on";
      const snapshotRepeatable = transaction?.isolationLevel === "repeatable read";

      return {
        storeName: input.storeName ?? "postgres",
        schemaIdentity: input.schemaIdentity ?? "unknown",
        checkedAt,
        ...tableInspection,
        readOnly: snapshotReadOnly,
        violationCount: violations.length,
        violations,
        integrityReady: snapshotReadOnly && snapshotRepeatable && violations.length === 0
      };
    });
  } finally {
    await client.end();
  }
};
