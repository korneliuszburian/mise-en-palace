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

export interface SourceDecisionImportReconciliation {
  importId: string;
  rowCount: number;
  completeRowCount: number;
  partialRowCount: number;
  decisionIds: readonly string[];
  contentHashes: readonly string[];
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
  }): Promise<readonly SourceDecisionImportReconciliation[]>;
}
