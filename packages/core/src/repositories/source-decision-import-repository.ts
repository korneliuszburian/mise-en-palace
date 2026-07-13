import type {
  ProjectId,
  SourceClaim,
  SourceDecision
} from "@krn/core";

export type SourceDecisionEvidenceStatus =
  | "captured"
  | "missing"
  | "digest_mismatch"
  | "externally_unverified";

export type SourceDecisionEvidenceFreshness = "current" | "stale" | "unknown";

export interface SourceDecisionEvidenceProvenance {
  kind: "local_file" | "source_artifact" | "source_snapshot";
  uri: string;
  path?: string;
  sourceArtifactId?: string;
  sourceSnapshotId?: string;
}

export interface SourceDecisionEvidenceLookup {
  status: SourceDecisionEvidenceStatus;
  evidenceRef: string;
  content?: string;
  contentHash?: string;
  capturedAt?: string;
  freshness?: SourceDecisionEvidenceFreshness;
  provenance?: SourceDecisionEvidenceProvenance;
  reason?: string;
}

export interface SourceDecisionImportLookupInput {
  projectId: ProjectId;
  importId: string;
  decisionId: string;
}

export const sourceDecisionImportReconciliationLimitMaximum = 25;

export interface SourceDecisionImportReconciliationItems<T> {
  totalCount: number;
  returnedCount: number;
  truncated: boolean;
  items: readonly T[];
}

export type SourceDecisionImportReconciliationViolation =
  | "missing_import_row_id"
  | "source_chunk_cardinality"
  | "source_claim_cardinality"
  | "source_decision_cardinality"
  | "source_claim_status"
  | "source_decision_edge_cardinality"
  | "search_document_cardinality"
  | "search_document_validity"
  | "source_rejection_cardinality";

export interface SourceDecisionImportReconciliationComponents {
  sourceChunks: SourceDecisionImportReconciliationItems<string>;
  sourceClaims: SourceDecisionImportReconciliationItems<string>;
  sourceDecisions: SourceDecisionImportReconciliationItems<string>;
  sourceDecisionEdges: SourceDecisionImportReconciliationItems<string>;
  searchDocuments: SourceDecisionImportReconciliationItems<string>;
  sourceRejections: SourceDecisionImportReconciliationItems<string>;
}

export interface SourceDecisionImportReconciliationRow {
  sourceArtifactId: string;
  decisionId: string | null;
  contentHash: string;
  lifecycle: "complete" | "partial";
  violations: readonly SourceDecisionImportReconciliationViolation[];
  components: SourceDecisionImportReconciliationComponents;
}

export interface SourceDecisionImportReconciliation {
  importId: string;
  lifecycle: "complete" | "partial";
  corpusDigest: string;
  rowCount: number;
  completeRowCount: number;
  partialRowCount: number;
  equivalentImportIds: SourceDecisionImportReconciliationItems<string>;
  rows: SourceDecisionImportReconciliationItems<SourceDecisionImportReconciliationRow>;
}

export interface SourceDecisionImportReconciliationReport {
  limit: number;
  afterImportId: string | null;
  nextAfterImportId: string | null;
  imports: SourceDecisionImportReconciliationItems<SourceDecisionImportReconciliation>;
}

export interface SourceDecisionImportReadback {
  decisionId: string;
  evidenceRef: string;
  contentHash: string;
  evidenceStatus: SourceDecisionEvidenceStatus;
  evidenceContentHash?: string;
  evidenceCapturedAt?: string;
  evidenceFreshness?: SourceDecisionEvidenceFreshness;
  evidenceProvenance?: SourceDecisionEvidenceProvenance;
  evidenceReason?: string;
  sourceArtifactId: string;
  sourceChunkId: string;
  sourceClaimId: string;
  sourceClaimStatus: SourceClaim["status"];
  sourceDecisionId: string;
  sourceDecisionStatus: SourceDecision["status"];
  sourceDecisionEdgeId?: string;
  searchDocumentId?: string;
  searchDocumentValidityStatus?: "active" | "expired" | "invalidated";
  sourceRejectionId?: string;
}

export type SourceDecisionImportLookup =
  | {
      status: "missing";
    }
  | {
      status: "partial";
      sourceArtifactId: string;
      contentHash: string;
    }
  | {
      status: "complete";
      row: SourceDecisionImportReadback;
    };

export interface SourceDecisionImportRepository {
  getCapturedSourceEvidence(input: {
    projectId: ProjectId;
    evidenceRef: string;
  }): Promise<SourceDecisionEvidenceLookup>;

  getSourceDecisionImportRow(
    input: SourceDecisionImportLookupInput
  ): Promise<SourceDecisionImportLookup>;

  listSourceDecisionImportReconciliation(input: {
    projectId: ProjectId;
    limit: number;
    afterImportId?: string;
  }): Promise<SourceDecisionImportReconciliationReport>;
}
