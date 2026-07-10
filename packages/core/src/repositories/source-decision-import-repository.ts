import type {
  ProjectId,
  SourceClaim,
  SourceDecision
} from "@krn/core";

export interface SourceDecisionImportLookupInput {
  projectId: ProjectId;
  importId: string;
  decisionId: string;
}

export interface SourceDecisionImportReadback {
  decisionId: string;
  contentHash: string;
  sourceArtifactId: string;
  sourceChunkId: string;
  sourceClaimId: string;
  sourceClaimStatus: SourceClaim["status"];
  sourceDecisionId: string;
  sourceDecisionStatus: SourceDecision["status"];
  sourceDecisionEdgeId?: string;
  searchDocumentId?: string;
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
  getSourceDecisionImportRow(
    input: SourceDecisionImportLookupInput
  ): Promise<SourceDecisionImportLookup>;
}
