import { and, desc, eq, ne, or } from "drizzle-orm";
import type {
  SourceDecisionImportLookup,
  SourceDecisionImportLookupInput,
  SourceDecisionImportRepository,
  SourceDecisionEvidenceLookup,
  SourceDecisionEvidenceFreshness,
  SourceDecisionEvidenceProvenance,
  SourceDecisionEvidenceStatus
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

  const kind = candidate.kind;

  if (
    (kind !== "local_file" && kind !== "source_artifact" && kind !== "source_snapshot") ||
    typeof candidate.uri !== "string"
  ) {
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
      .leftJoin(sourceDecisions, eq(sourceDecisions.sourceClaimId, sourceClaims.id))
      .leftJoin(sourceDecisionEdges, and(
        eq(sourceDecisionEdges.sourceClaimId, sourceClaims.id),
        eq(sourceDecisionEdges.sourceDecisionId, sourceDecisions.id)
      ))
      .leftJoin(
        searchDocuments,
        and(
          eq(searchDocuments.sourceClaimId, sourceClaims.id),
          eq(searchDocuments.sourceDecisionId, sourceDecisions.id)
        )
      )
      .leftJoin(sourceRejections, eq(sourceRejections.sourceClaimId, sourceClaims.id))
      .where(and(
        eq(sourceArtifacts.projectId, input.projectId),
        eq(sourceArtifacts.importId, input.importId),
        eq(sourceArtifacts.importRowId, input.decisionId)
      ))
      ;
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
    const sourceDecisionEdge = row.sourceDecisionEdge;
    const searchDocument = row.searchDocument;
    const sourceRejection = row.sourceRejection;
    const lifecycleComplete = row.sourceDecision.status === "adopt"
      ? sourceDecisionEdge !== null &&
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
        ...(sourceEvidenceCapturedAtFromMetadata(row.sourceArtifact.metadata) === undefined
          ? {}
          : { evidenceCapturedAt: sourceEvidenceCapturedAtFromMetadata(row.sourceArtifact.metadata) }),
        evidenceFreshness: sourceEvidenceFreshnessFromMetadata(row.sourceArtifact.metadata),
        ...(sourceEvidenceProvenanceFromMetadata(row.sourceArtifact.metadata) === undefined
          ? {}
          : { evidenceProvenance: sourceEvidenceProvenanceFromMetadata(row.sourceArtifact.metadata) }),
        ...(sourceEvidenceReasonFromMetadata(row.sourceArtifact.metadata) === undefined
          ? {}
          : { evidenceReason: sourceEvidenceReasonFromMetadata(row.sourceArtifact.metadata) }),
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
}
