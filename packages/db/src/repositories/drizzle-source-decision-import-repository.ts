import { createHash } from "node:crypto";

import { and, asc, desc, eq, gt, inArray, isNotNull, ne, or, sql } from "drizzle-orm";
import type {
  SourceDecisionImportLookup,
  SourceDecisionImportLookupInput,
  SourceDecisionImportReconciliation,
  SourceDecisionImportReconciliationItems,
  SourceDecisionImportReconciliationReport,
  SourceDecisionImportReconciliationRow,
  SourceDecisionImportReconciliationViolation,
  SourceDecisionImportRepository,
  SourceDecisionEvidenceLookup,
  SourceDecisionEvidenceFreshness,
  SourceDecisionEvidenceProvenance,
  SourceDecisionEvidenceStatus
} from "@krn/core/repositories/internal";
import {
  sourceDecisionImportReconciliationLimitMaximum
} from "@krn/core/repositories/internal";

import type { KrnDatabase, KrnDatabaseTransaction } from "../database.js";
import {
  searchDocuments,
  sourceArtifacts,
  sourceChunks,
  sourceClaims,
  sourceDecisionEdges,
  sourceDecisions,
  sourceRejections,
  sourceSnapshots
} from "../schema/index.js";

type SourceEvidenceQueryRow = {
  sourceArtifact: {
    id: string;
    uri: string;
    contentHash: string;
    capturedAt: Date;
  };
  sourceChunk: {
    content: string;
    contentHash: string;
  } | null;
  sourceSnapshot: {
    id: string;
    snapshotUri: string;
    contentHash: string;
    capturedAt: Date;
  } | null;
};

const missingSourceEvidence = (
  evidenceRef: string
): SourceDecisionEvidenceLookup => ({
  status: "missing",
  evidenceRef,
  reason: "no project-scoped captured SourceArtifact or SourceSnapshot matches the URL"
});

const mismatchedSourceEvidence = (
  evidenceRef: string,
  reason: string
): SourceDecisionEvidenceLookup => ({
  status: "digest_mismatch",
  evidenceRef,
  reason
});

const sourceEvidenceHash = (row: SourceEvidenceQueryRow): string =>
  row.sourceSnapshot?.contentHash ?? row.sourceArtifact.contentHash;

const sourceEvidenceCapturedAt = (row: SourceEvidenceQueryRow): string =>
  (row.sourceSnapshot?.capturedAt ?? row.sourceArtifact.capturedAt).toISOString();

const sourceEvidenceProvenance = (
  row: SourceEvidenceQueryRow
): NonNullable<SourceDecisionEvidenceLookup["provenance"]> => {
  if (row.sourceSnapshot === null) {
    return {
      kind: "source_artifact",
      uri: row.sourceArtifact.uri,
      sourceArtifactId: row.sourceArtifact.id
    };
  }

  return {
    kind: "source_snapshot",
    uri: row.sourceSnapshot.snapshotUri,
    sourceArtifactId: row.sourceArtifact.id,
    sourceSnapshotId: row.sourceSnapshot.id
  };
};

const sourceEvidenceLookupFromRow = (
  evidenceRef: string,
  row: SourceEvidenceQueryRow | undefined
): SourceDecisionEvidenceLookup => {
  if (row === undefined) {
    return missingSourceEvidence(evidenceRef);
  }

  if (row.sourceChunk === null) {
    return mismatchedSourceEvidence(
      evidenceRef,
      "captured source has no ordinal-zero SourceChunk containing the captured bytes"
    );
  }

  const capturedHash = sourceEvidenceHash(row);

  if (row.sourceChunk.contentHash !== capturedHash) {
    return mismatchedSourceEvidence(
      evidenceRef,
      "captured source digest does not match the stored SourceChunk bytes"
    );
  }

  return {
    status: "captured",
    evidenceRef,
    content: row.sourceChunk.content,
    contentHash: capturedHash,
    capturedAt: sourceEvidenceCapturedAt(row),
    freshness: "unknown",
    provenance: sourceEvidenceProvenance(row)
  };
};

const sourceEvidenceStatusSet = new Set<string>([
  "captured",
  "missing",
  "digest_mismatch",
  "externally_unverified"
]);

const sourceEvidenceStatusFromMetadata = (
  metadata: Record<string, unknown>
): SourceDecisionEvidenceStatus => {
  const status = metadata["evidenceStatus"];

  return typeof status === "string" && sourceEvidenceStatusSet.has(status)
    ? status as SourceDecisionEvidenceStatus
    : "externally_unverified";
};

const sourceEvidenceContentHashFromMetadata = (
  metadata: Record<string, unknown>
): string | undefined => {
  const contentHash = metadata["evidenceContentHash"];

  return typeof contentHash === "string" ? contentHash : undefined;
};

const sourceEvidenceCapturedAtFromMetadata = (
  metadata: Record<string, unknown>
): string | undefined => {
  const capturedAt = metadata["evidenceCapturedAt"];

  return typeof capturedAt === "string" ? capturedAt : undefined;
};

const sourceEvidenceFreshnessFromMetadata = (
  metadata: Record<string, unknown>
): SourceDecisionEvidenceFreshness => {
  const freshness = metadata["evidenceFreshness"];

  return freshness === "current" || freshness === "stale" || freshness === "unknown"
    ? freshness
    : "unknown";
};

const sourceEvidenceProvenanceKind = (
  value: unknown
): SourceDecisionEvidenceProvenance["kind"] | undefined => {
  switch (value) {
    case "local_file":
    case "source_artifact":
    case "source_snapshot":
      return value;
    default:
      return undefined;
  }
};

const sourceEvidenceProvenanceFromMetadata = (
  metadata: Record<string, unknown>
): SourceDecisionEvidenceProvenance | undefined => {
  const value = metadata["evidenceProvenance"];

  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const candidate: Record<string, unknown> = Object.fromEntries(
    Object.entries(value)
  );

  const kind = sourceEvidenceProvenanceKind(candidate.kind);

  if (kind === undefined || typeof candidate.uri !== "string") {
    return undefined;
  }

  return {
    kind,
    uri: candidate.uri,
    ...(typeof candidate.path === "string" ? { path: candidate.path } : {}),
    ...(typeof candidate.sourceArtifactId === "string" ? { sourceArtifactId: candidate.sourceArtifactId } : {}),
    ...(typeof candidate.sourceSnapshotId === "string" ? { sourceSnapshotId: candidate.sourceSnapshotId } : {})
  };
};

const reconciliationCorpusDigest = (
  identifiedManifestJson: string,
  missingIdentityManifestJson: string
): string => `sha256:${createHash("sha256")
  .update(identifiedManifestJson)
  .update("\u0000")
  .update(missingIdentityManifestJson)
  .digest("hex")}`;

const boundedReconciliationItems = <T>(
  totalCount: number,
  items: readonly T[]
): SourceDecisionImportReconciliationItems<T> => ({
  totalCount,
  returnedCount: items.length,
  truncated: totalCount > items.length,
  items
});

const assertReconciliationLimit = (limit: number): void => {
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > sourceDecisionImportReconciliationLimitMaximum
  ) {
    throw new Error(
      `source decision import reconciliation limit must be between 1 and ${sourceDecisionImportReconciliationLimitMaximum}`
    );
  }
};

const reconciliationAfterImportPredicate = (afterImportId: string | undefined) =>
  afterImportId === undefined
    ? undefined
    : gt(sourceArtifacts.importId, afterImportId);

const requiredReconciliationImportIds = (
  rows: readonly { importId: string | null }[]
): readonly string[] => rows.map((row) => {
  if (row.importId === null) {
    throw new Error("source decision import reconciliation selected a null import ID");
  }

  return row.importId;
});

const nextReconciliationCursor = (
  imports: SourceDecisionImportReconciliationItems<unknown>,
  selectedImportIds: readonly string[]
): string | null => imports.truncated
  ? selectedImportIds[selectedImportIds.length - 1] ?? null
  : null;

const reconciliationCountsSql = (projectId: string) => ({
  sourceChunkCount: sql<number>`(
    select count(*)::int
    from source_chunks reconciliation_chunk
    where reconciliation_chunk.source_artifact_id = source_artifacts.id
  )`,
  sourceClaimCount: sql<number>`(
    select count(*)::int
    from source_claims reconciliation_claim
    where reconciliation_claim.source_artifact_id = source_artifacts.id
  )`,
  sourceClaimStatus: sql<string | null>`(
    select reconciliation_claim.status::text
    from source_claims reconciliation_claim
    where reconciliation_claim.source_artifact_id = source_artifacts.id
    order by reconciliation_claim.id
    limit 1
  )`,
  sourceDecisionCount: sql<number>`(
    select count(*)::int
    from source_decisions reconciliation_decision
    inner join source_claims reconciliation_claim
      on reconciliation_claim.id = reconciliation_decision.source_claim_id
    where reconciliation_claim.source_artifact_id = source_artifacts.id
      and reconciliation_decision.project_id = ${projectId}
  )`,
  sourceDecisionStatus: sql<string | null>`(
    select reconciliation_decision.status::text
    from source_decisions reconciliation_decision
    inner join source_claims reconciliation_claim
      on reconciliation_claim.id = reconciliation_decision.source_claim_id
    where reconciliation_claim.source_artifact_id = source_artifacts.id
      and reconciliation_decision.project_id = ${projectId}
    order by reconciliation_decision.id
    limit 1
  )`,
  sourceDecisionEdgeCount: sql<number>`(
    select count(*)::int
    from source_decision_edges reconciliation_edge
    inner join source_claims reconciliation_claim
      on reconciliation_claim.id = reconciliation_edge.source_claim_id
    inner join source_decisions reconciliation_decision
      on reconciliation_decision.id = reconciliation_edge.source_decision_id
      and reconciliation_decision.source_claim_id = reconciliation_claim.id
    where reconciliation_claim.source_artifact_id = source_artifacts.id
      and reconciliation_decision.project_id = ${projectId}
  )`,
  searchDocumentCount: sql<number>`(
    select count(*)::int
    from search_documents reconciliation_document
    inner join source_claims reconciliation_claim
      on reconciliation_claim.id = reconciliation_document.source_claim_id
    inner join source_decisions reconciliation_decision
      on reconciliation_decision.id = reconciliation_document.source_decision_id
      and reconciliation_decision.source_claim_id = reconciliation_claim.id
    where reconciliation_claim.source_artifact_id = source_artifacts.id
      and reconciliation_decision.project_id = ${projectId}
      and reconciliation_document.project_id = ${projectId}
  )`,
  searchDocumentValidityStatus: sql<string | null>`(
    select reconciliation_document.validity_status::text
    from search_documents reconciliation_document
    inner join source_claims reconciliation_claim
      on reconciliation_claim.id = reconciliation_document.source_claim_id
    inner join source_decisions reconciliation_decision
      on reconciliation_decision.id = reconciliation_document.source_decision_id
      and reconciliation_decision.source_claim_id = reconciliation_claim.id
    where reconciliation_claim.source_artifact_id = source_artifacts.id
      and reconciliation_decision.project_id = ${projectId}
      and reconciliation_document.project_id = ${projectId}
    order by reconciliation_document.id
    limit 1
  )`,
  sourceRejectionCount: sql<number>`(
    select count(*)::int
    from source_rejections reconciliation_rejection
    inner join source_claims reconciliation_claim
      on reconciliation_claim.id = reconciliation_rejection.source_claim_id
    where reconciliation_claim.source_artifact_id = source_artifacts.id
      and reconciliation_rejection.project_id = ${projectId}
  )`
});

const reconciliationLifecycleCompleteSql = (projectId: string) => {
  const counts = reconciliationCountsSql(projectId);

  return sql<boolean>`(
    ${sourceArtifacts.importRowId} is not null
    and ${counts.sourceChunkCount} = 1
    and ${counts.sourceClaimCount} = 1
    and ${counts.sourceDecisionCount} = 1
    and (
      (
        ${counts.sourceDecisionStatus} = 'adopt'
        and ${counts.sourceClaimStatus} = 'accepted'
        and ${counts.sourceDecisionEdgeCount} = 1
        and ${counts.searchDocumentCount} = 1
        and ${counts.searchDocumentValidityStatus} = 'active'
        and ${counts.sourceRejectionCount} = 0
      )
      or (
        ${counts.sourceDecisionStatus} = 'defer'
        and ${counts.sourceClaimStatus} = 'deprecated'
        and ${counts.sourceDecisionEdgeCount} = 0
        and ${counts.searchDocumentCount} = 1
        and ${counts.searchDocumentValidityStatus} = 'expired'
        and ${counts.sourceRejectionCount} = 0
      )
      or (
        ${counts.sourceDecisionStatus} = 'reject'
        and ${counts.sourceClaimStatus} = 'rejected'
        and ${counts.sourceDecisionEdgeCount} = 0
        and ${counts.searchDocumentCount} = 0
        and ${counts.sourceRejectionCount} = 1
      )
    )
  )`;
};

interface ReconciliationDiagnosticRow {
  sourceArtifactId: string;
  decisionId: string | null;
  contentHash: string;
  sourceChunkCount: number;
  sourceChunkIds: string[];
  sourceClaimCount: number;
  sourceClaimIds: string[];
  sourceClaimStatus: string | null;
  sourceDecisionCount: number;
  sourceDecisionIds: string[];
  sourceDecisionStatus: string | null;
  sourceDecisionEdgeCount: number;
  sourceDecisionEdgeIds: string[];
  searchDocumentCount: number;
  searchDocumentIds: string[];
  searchDocumentValidityStatus: string | null;
  sourceRejectionCount: number;
  sourceRejectionIds: string[];
}

interface ReconciliationImportSummary {
  importId: string;
  rowCount: number;
  completeRowCount: number;
  missingIdentityCount: number;
  identifiedManifestJson: string;
  missingIdentityManifestJson: string;
}

const reconciliationCardinalityViolations = (
  row: ReconciliationDiagnosticRow
): SourceDecisionImportReconciliationViolation[] => {
  const violations: SourceDecisionImportReconciliationViolation[] = [];

  if (row.decisionId === null) violations.push("missing_import_row_id");
  if (row.sourceChunkCount !== 1) violations.push("source_chunk_cardinality");
  if (row.sourceClaimCount !== 1) violations.push("source_claim_cardinality");
  if (row.sourceDecisionCount !== 1) violations.push("source_decision_cardinality");

  return violations;
};

const expectedReconciliationLifecycle = (
  sourceDecisionStatus: string | null
) => sourceDecisionStatus === "adopt"
  ? { claim: "accepted", edges: 1, documents: 1, validity: "active", rejections: 0 }
  : sourceDecisionStatus === "defer"
    ? { claim: "deprecated", edges: 0, documents: 1, validity: "expired", rejections: 0 }
    : { claim: "rejected", edges: 0, documents: 0, validity: null, rejections: 1 };

const reconciliationLifecycleViolations = (
  row: ReconciliationDiagnosticRow
): SourceDecisionImportReconciliationViolation[] => {
  const violations: SourceDecisionImportReconciliationViolation[] = [];
  const expected = expectedReconciliationLifecycle(row.sourceDecisionStatus);

  if (row.sourceClaimCount === 1 && row.sourceClaimStatus !== expected.claim) {
    violations.push("source_claim_status");
  }
  if (row.sourceDecisionEdgeCount !== expected.edges) {
    violations.push("source_decision_edge_cardinality");
  }
  if (row.searchDocumentCount !== expected.documents) {
    violations.push("search_document_cardinality");
  }
  if (
    expected.validity !== null &&
    row.searchDocumentCount === 1 &&
    row.searchDocumentValidityStatus !== expected.validity
  ) {
    violations.push("search_document_validity");
  }
  if (row.sourceRejectionCount !== expected.rejections) {
    violations.push("source_rejection_cardinality");
  }

  return violations;
};

const reconciliationViolations = (
  row: ReconciliationDiagnosticRow
): SourceDecisionImportReconciliationViolation[] => {
  const violations = reconciliationCardinalityViolations(row);

  if (row.sourceDecisionCount === 1) {
    violations.push(...reconciliationLifecycleViolations(row));
  }

  return violations;
};

const reconciliationRowFromDiagnostic = (
  row: ReconciliationDiagnosticRow
): SourceDecisionImportReconciliationRow => {
  const violations = reconciliationViolations(row);

  return {
    sourceArtifactId: row.sourceArtifactId,
    decisionId: row.decisionId,
    contentHash: row.contentHash,
    lifecycle: violations.length === 0 ? "complete" : "partial",
    violations,
    components: {
      sourceChunks: boundedReconciliationItems(row.sourceChunkCount, row.sourceChunkIds),
      sourceClaims: boundedReconciliationItems(row.sourceClaimCount, row.sourceClaimIds),
      sourceDecisions: boundedReconciliationItems(row.sourceDecisionCount, row.sourceDecisionIds),
      sourceDecisionEdges: boundedReconciliationItems(
        row.sourceDecisionEdgeCount,
        row.sourceDecisionEdgeIds
      ),
      searchDocuments: boundedReconciliationItems(
        row.searchDocumentCount,
        row.searchDocumentIds
      ),
      sourceRejections: boundedReconciliationItems(
        row.sourceRejectionCount,
        row.sourceRejectionIds
      )
    }
  };
};

const sourceEvidenceReasonFromMetadata = (
  metadata: Record<string, unknown>
): string | undefined => {
  const reason = metadata["evidenceReason"];

  return typeof reason === "string" ? reason : undefined;
};

export class DrizzleSourceDecisionImportRepository implements SourceDecisionImportRepository {
  constructor(private readonly db: KrnDatabase | KrnDatabaseTransaction) {}

  async getCapturedSourceEvidence(input: {
    projectId: string;
    evidenceRef: string;
  }): Promise<SourceDecisionEvidenceLookup> {
    const rows = await this.db
      .select({
        sourceArtifact: sourceArtifacts,
        sourceChunk: sourceChunks,
        sourceSnapshot: sourceSnapshots
      })
      .from(sourceArtifacts)
      .leftJoin(sourceChunks, and(
        eq(sourceChunks.sourceArtifactId, sourceArtifacts.id),
        eq(sourceChunks.ordinal, 0)
      ))
      .leftJoin(sourceSnapshots, and(
        eq(sourceSnapshots.sourceArtifactId, sourceArtifacts.id),
        eq(sourceSnapshots.snapshotUri, input.evidenceRef)
      ))
      .where(and(
        eq(sourceArtifacts.projectId, input.projectId),
        ne(sourceArtifacts.sourceAuthority, "project-decision"),
        or(
          eq(sourceArtifacts.uri, input.evidenceRef),
          eq(sourceSnapshots.snapshotUri, input.evidenceRef)
        )
      ))
      .orderBy(desc(sourceSnapshots.capturedAt), desc(sourceArtifacts.capturedAt))
      .limit(1);
    return sourceEvidenceLookupFromRow(input.evidenceRef, rows[0]);
  }

  async findEquivalentSourceDecisionImportIds(input: {
    projectId: string;
    manifest: readonly { decisionId: string; contentHash: string }[];
  }): Promise<readonly string[]> {
    if (input.manifest.length === 0) {
      return [];
    }

    const manifest = Object.fromEntries(
      [...input.manifest]
        .sort((left, right) => left.decisionId.localeCompare(right.decisionId))
        .map((row) => [row.decisionId, row.contentHash])
    );
    const rows = await this.db
      .select({ importId: sourceArtifacts.importId })
      .from(sourceArtifacts)
      .where(and(
        eq(sourceArtifacts.projectId, input.projectId),
        isNotNull(sourceArtifacts.importId)
      ))
      .groupBy(sourceArtifacts.importId)
      .having(sql`
        count(*) = ${input.manifest.length}
        and count(*) filter (where ${sourceArtifacts.importRowId} is null) = 0
        and jsonb_object_agg(
          ${sourceArtifacts.importRowId},
          ${sourceArtifacts.contentHash}
        ) = ${JSON.stringify(manifest)}::jsonb
      `)
      .orderBy(asc(sourceArtifacts.importId))
      .limit(2);

    return rows.flatMap((row) => row.importId === null ? [] : [row.importId]);
  }

  // fallow-ignore-next-line complexity -- replay readback enforces duplicate and status-specific graph completeness at the store boundary
  async getSourceDecisionImportRow(
    input: SourceDecisionImportLookupInput
  ): Promise<SourceDecisionImportLookup> {
    const rows = await this.db
      .select({
        sourceArtifact: sourceArtifacts,
        sourceChunk: sourceChunks,
        sourceClaim: sourceClaims,
        sourceDecision: sourceDecisions,
        sourceDecisionEdge: sourceDecisionEdges,
        searchDocument: searchDocuments,
        sourceRejection: sourceRejections
      })
      .from(sourceArtifacts)
      .leftJoin(sourceChunks, eq(sourceChunks.sourceArtifactId, sourceArtifacts.id))
      .leftJoin(sourceClaims, eq(sourceClaims.sourceArtifactId, sourceArtifacts.id))
      .leftJoin(sourceDecisions, and(
        eq(sourceDecisions.sourceClaimId, sourceClaims.id),
        eq(sourceDecisions.projectId, input.projectId)
      ))
      .leftJoin(sourceDecisionEdges, and(
        eq(sourceDecisionEdges.sourceClaimId, sourceClaims.id),
        eq(sourceDecisionEdges.sourceDecisionId, sourceDecisions.id)
      ))
      .leftJoin(
        searchDocuments,
        and(
          eq(searchDocuments.sourceClaimId, sourceClaims.id),
          eq(searchDocuments.sourceDecisionId, sourceDecisions.id),
          eq(searchDocuments.projectId, input.projectId)
        )
      )
      .leftJoin(sourceRejections, and(
        eq(sourceRejections.sourceClaimId, sourceClaims.id),
        eq(sourceRejections.projectId, input.projectId)
      ))
      .where(and(
        eq(sourceArtifacts.projectId, input.projectId),
        eq(sourceArtifacts.importId, input.importId),
        eq(sourceArtifacts.importRowId, input.decisionId)
      ))
      .limit(2);
    const row = rows[0];

    if (row === undefined) {
      return { status: "missing" };
    }

    if (
      rows.length > 1 ||
      row.sourceChunk === null ||
      row.sourceClaim === null ||
      row.sourceDecision === null
    ) {
      return {
        status: "partial",
        sourceArtifactId: row.sourceArtifact.id,
        contentHash: row.sourceArtifact.contentHash
      };
    }

    const evidenceContentHash = sourceEvidenceContentHashFromMetadata(row.sourceArtifact.metadata);
    const evidenceCapturedAt = sourceEvidenceCapturedAtFromMetadata(row.sourceArtifact.metadata);
    const evidenceProvenance = sourceEvidenceProvenanceFromMetadata(row.sourceArtifact.metadata);
    const evidenceReason = sourceEvidenceReasonFromMetadata(row.sourceArtifact.metadata);
    const sourceDecisionEdge = row.sourceDecisionEdge;
    const searchDocument = row.searchDocument;
    const sourceRejection = row.sourceRejection;
    const lifecycleComplete = row.sourceDecision.status === "adopt"
      ? row.sourceClaim.status === "accepted" &&
        sourceDecisionEdge !== null &&
        searchDocument !== null &&
        searchDocument.validityStatus === "active" &&
        sourceRejection === null
      : row.sourceDecision.status === "defer"
        ? sourceDecisionEdge === null &&
          searchDocument !== null &&
          searchDocument.validityStatus === "expired" &&
          sourceRejection === null &&
          row.sourceClaim.status === "deprecated"
        : row.sourceDecision.status === "reject" &&
          sourceDecisionEdge === null &&
          searchDocument === null &&
          sourceRejection !== null &&
          row.sourceClaim.status === "rejected";

    if (!lifecycleComplete) {
      return {
        status: "partial",
        sourceArtifactId: row.sourceArtifact.id,
        contentHash: row.sourceArtifact.contentHash
      };
    }

    return {
      status: "complete",
      row: {
        decisionId: input.decisionId,
        evidenceRef: typeof row.sourceArtifact.metadata["evidenceRef"] === "string"
          ? row.sourceArtifact.metadata["evidenceRef"]
          : row.sourceArtifact.uri,
        contentHash: row.sourceArtifact.contentHash,
        evidenceStatus: sourceEvidenceStatusFromMetadata(row.sourceArtifact.metadata),
        ...(evidenceContentHash === undefined
          ? {}
          : { evidenceContentHash }),
        ...(evidenceCapturedAt === undefined
          ? {}
          : { evidenceCapturedAt }),
        evidenceFreshness: sourceEvidenceFreshnessFromMetadata(row.sourceArtifact.metadata),
        ...(evidenceProvenance === undefined
          ? {}
          : { evidenceProvenance }),
        ...(evidenceReason === undefined
          ? {}
          : { evidenceReason }),
        sourceArtifactId: row.sourceArtifact.id,
        sourceChunkId: row.sourceChunk.id,
        sourceClaimId: row.sourceClaim.id,
        sourceClaimStatus: row.sourceClaim.status,
        sourceDecisionId: row.sourceDecision.id,
        sourceDecisionStatus: row.sourceDecision.status,
        ...(row.sourceDecisionEdge === null
          ? {}
          : { sourceDecisionEdgeId: row.sourceDecisionEdge.id }),
        ...(searchDocument === null
          ? {}
          : {
              searchDocumentId: searchDocument.id,
              searchDocumentValidityStatus: searchDocument.validityStatus
            }),
        ...(sourceRejection === null
          ? {}
          : { sourceRejectionId: sourceRejection.id })
      }
    };
  }

  private async listReconciliationDiagnostics(
    projectId: string,
    importId: string,
    limit: number
  ): Promise<ReconciliationDiagnosticRow[]> {
    const counts = reconciliationCountsSql(projectId);
    const lifecycleComplete = reconciliationLifecycleCompleteSql(projectId);

    return this.db
      .select({
        sourceArtifactId: sourceArtifacts.id,
        decisionId: sourceArtifacts.importRowId,
        contentHash: sourceArtifacts.contentHash,
        ...counts,
        sourceChunkIds: sql<string[]>`array(
          select reconciliation_chunk.id::text
          from source_chunks reconciliation_chunk
          where reconciliation_chunk.source_artifact_id = source_artifacts.id
          order by reconciliation_chunk.id
          limit ${limit}
        )`,
        sourceClaimIds: sql<string[]>`array(
          select reconciliation_claim.id::text
          from source_claims reconciliation_claim
          where reconciliation_claim.source_artifact_id = source_artifacts.id
          order by reconciliation_claim.id
          limit ${limit}
        )`,
        sourceDecisionIds: sql<string[]>`array(
          select reconciliation_decision.id::text
          from source_decisions reconciliation_decision
          inner join source_claims reconciliation_claim
            on reconciliation_claim.id = reconciliation_decision.source_claim_id
          where reconciliation_claim.source_artifact_id = source_artifacts.id
            and reconciliation_decision.project_id = ${projectId}
          order by reconciliation_decision.id
          limit ${limit}
        )`,
        sourceDecisionEdgeIds: sql<string[]>`array(
          select reconciliation_edge.id::text
          from source_decision_edges reconciliation_edge
          inner join source_claims reconciliation_claim
            on reconciliation_claim.id = reconciliation_edge.source_claim_id
          inner join source_decisions reconciliation_decision
            on reconciliation_decision.id = reconciliation_edge.source_decision_id
            and reconciliation_decision.source_claim_id = reconciliation_claim.id
          where reconciliation_claim.source_artifact_id = source_artifacts.id
            and reconciliation_decision.project_id = ${projectId}
          order by reconciliation_edge.id
          limit ${limit}
        )`,
        searchDocumentIds: sql<string[]>`array(
          select reconciliation_document.id::text
          from search_documents reconciliation_document
          inner join source_claims reconciliation_claim
            on reconciliation_claim.id = reconciliation_document.source_claim_id
          inner join source_decisions reconciliation_decision
            on reconciliation_decision.id = reconciliation_document.source_decision_id
            and reconciliation_decision.source_claim_id = reconciliation_claim.id
          where reconciliation_claim.source_artifact_id = source_artifacts.id
            and reconciliation_decision.project_id = ${projectId}
            and reconciliation_document.project_id = ${projectId}
          order by reconciliation_document.id
          limit ${limit}
        )`,
        sourceRejectionIds: sql<string[]>`array(
          select reconciliation_rejection.id::text
          from source_rejections reconciliation_rejection
          inner join source_claims reconciliation_claim
            on reconciliation_claim.id = reconciliation_rejection.source_claim_id
          where reconciliation_claim.source_artifact_id = source_artifacts.id
            and reconciliation_rejection.project_id = ${projectId}
          order by reconciliation_rejection.id
          limit ${limit}
        )`
      })
      .from(sourceArtifacts)
      .where(and(
        eq(sourceArtifacts.projectId, projectId),
        eq(sourceArtifacts.importId, importId)
      ))
      .orderBy(
        asc(lifecycleComplete),
        sql`${sourceArtifacts.importRowId} asc nulls first`,
        asc(sourceArtifacts.id)
      )
      .limit(limit);
  }

  private async findEquivalentImportIdsForPage(
    projectId: string,
    summaries: readonly ReconciliationImportSummary[],
    limit: number
  ): Promise<ReadonlyMap<string, SourceDecisionImportReconciliationItems<string>>> {
    const eligibleSummaries = summaries.filter((summary) => summary.missingIdentityCount === 0);

    if (eligibleSummaries.length === 0) {
      return new Map();
    }

    const selectedImportValues = sql.join(
      eligibleSummaries.map((summary) => sql`(
        ${summary.importId}::text,
        ${summary.identifiedManifestJson}::jsonb
      )`),
      sql`, `
    );
    const rows = await this.db.execute<{
      selectedImportId: string;
      totalCount: number;
      items: string[];
    }>(sql`
      with selected_imports("importId", "identifiedManifest") as (
        values ${selectedImportValues}
      ),
      project_import_manifests as materialized (
        select
          ${sourceArtifacts.importId} as "importId",
          count(*) filter (where ${sourceArtifacts.importRowId} is null)::int
            as "missingIdentityCount",
          coalesce(
            jsonb_object_agg(${sourceArtifacts.importRowId}, ${sourceArtifacts.contentHash})
              filter (where ${sourceArtifacts.importRowId} is not null),
            '{}'::jsonb
          ) as "identifiedManifest"
        from ${sourceArtifacts}
        where ${sourceArtifacts.projectId} = ${projectId}
          and ${sourceArtifacts.importId} is not null
        group by ${sourceArtifacts.importId}
      ),
      equivalent_pairs as (
        select
          selected."importId" as "selectedImportId",
          candidate."importId" as "equivalentImportId",
          count(*) over (partition by selected."importId")::int as "totalCount",
          row_number() over (
            partition by selected."importId"
            order by candidate."importId"
          )::int as ordinal
        from selected_imports selected
        inner join project_import_manifests candidate
          on candidate."missingIdentityCount" = 0
          and candidate."identifiedManifest" = selected."identifiedManifest"
          and candidate."importId" <> selected."importId"
      )
      select
        selected."importId" as "selectedImportId",
        coalesce(max(pairs."totalCount"), 0)::int as "totalCount",
        coalesce(
          array_agg(pairs."equivalentImportId" order by pairs."equivalentImportId")
            filter (where pairs.ordinal <= ${limit}),
          array[]::text[]
        ) as items
      from selected_imports selected
      left join equivalent_pairs pairs
        on pairs."selectedImportId" = selected."importId"
      group by selected."importId"
    `);

    return new Map(rows.map((row) => [
      row.selectedImportId,
      boundedReconciliationItems(row.totalCount, row.items)
    ]));
  }

  private async summarizeImports(
    projectId: string,
    importIds: readonly string[]
  ): Promise<readonly ReconciliationImportSummary[]> {
    const lifecycleComplete = reconciliationLifecycleCompleteSql(projectId);
    const rows = await this.db
      .select({
        importId: sourceArtifacts.importId,
        rowCount: sql<number>`count(*)::int`,
        completeRowCount: sql<number>`count(*) filter (where ${lifecycleComplete})::int`,
        missingIdentityCount: sql<number>`count(*) filter (
          where ${sourceArtifacts.importRowId} is null
        )::int`,
        identifiedManifestJson: sql<string>`coalesce(
          jsonb_object_agg(${sourceArtifacts.importRowId}, ${sourceArtifacts.contentHash})
            filter (where ${sourceArtifacts.importRowId} is not null),
          '{}'::jsonb
        )::text`,
        missingIdentityManifestJson: sql<string>`coalesce(
          jsonb_object_agg(${sourceArtifacts.id}::text, ${sourceArtifacts.contentHash})
            filter (where ${sourceArtifacts.importRowId} is null),
          '{}'::jsonb
        )::text`
      })
      .from(sourceArtifacts)
      .where(and(
        eq(sourceArtifacts.projectId, projectId),
        inArray(sourceArtifacts.importId, importIds)
      ))
      .groupBy(sourceArtifacts.importId);
    const summariesByImportId = new Map(rows.flatMap((row) => row.importId === null
      ? []
      : [[row.importId, { ...row, importId: row.importId }] as const]
    ));

    return importIds.map((importId) => {
      const summary = summariesByImportId.get(importId);

      if (summary === undefined) {
        throw new Error(`source decision import reconciliation lost import ${importId}`);
      }

      return summary;
    });
  }

  private reconcileImport(
    summary: ReconciliationImportSummary,
    diagnostics: readonly ReconciliationDiagnosticRow[],
    equivalentImportIds: SourceDecisionImportReconciliationItems<string>
  ): SourceDecisionImportReconciliation {
    const rows = diagnostics.map(reconciliationRowFromDiagnostic);
    const partialRowCount = summary.rowCount - summary.completeRowCount;

    return {
      importId: summary.importId,
      lifecycle: partialRowCount === 0 ? "complete" : "partial",
      corpusDigest: reconciliationCorpusDigest(
        summary.identifiedManifestJson,
        summary.missingIdentityManifestJson
      ),
      rowCount: summary.rowCount,
      completeRowCount: summary.completeRowCount,
      partialRowCount,
      equivalentImportIds,
      rows: boundedReconciliationItems(summary.rowCount, rows)
    };
  }

  async listSourceDecisionImportReconciliation(input: {
    projectId: string;
    limit: number;
    afterImportId?: string;
  }): Promise<SourceDecisionImportReconciliationReport> {
    assertReconciliationLimit(input.limit);

    const importIdRows = await this.db
      .select({
        importId: sourceArtifacts.importId,
        totalCount: sql<number>`count(*) over()::int`
      })
      .from(sourceArtifacts)
      .where(and(
        eq(sourceArtifacts.projectId, input.projectId),
        isNotNull(sourceArtifacts.importId),
        reconciliationAfterImportPredicate(input.afterImportId)
      ))
      .groupBy(sourceArtifacts.importId)
      .orderBy(asc(sourceArtifacts.importId))
      .limit(input.limit);
    const selectedImportIds = requiredReconciliationImportIds(importIdRows);
    const summaries = await this.summarizeImports(input.projectId, selectedImportIds);
    const [diagnostics, equivalentImportIdsByImport] = await Promise.all([
      Promise.all(selectedImportIds.map((importId) =>
        this.listReconciliationDiagnostics(input.projectId, importId, input.limit)
      )),
      this.findEquivalentImportIdsForPage(input.projectId, summaries, input.limit)
    ]);
    const imports = summaries.map((summary, index) => {
      const importDiagnostics = diagnostics[index];

      if (importDiagnostics === undefined) {
        throw new Error(
          `source decision import reconciliation lost diagnostics for ${summary.importId}`
        );
      }

      return this.reconcileImport(
        summary,
        importDiagnostics,
        equivalentImportIdsByImport.get(summary.importId) ?? boundedReconciliationItems(0, [])
      );
    });
    const boundedImports = boundedReconciliationItems(
      importIdRows[0]?.totalCount ?? 0,
      imports
    );

    return {
      limit: input.limit,
      afterImportId: input.afterImportId ?? null,
      nextAfterImportId: nextReconciliationCursor(boundedImports, selectedImportIds),
      imports: boundedImports
    };
  }
}
