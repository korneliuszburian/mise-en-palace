import type {
  ContextExclusion,
  ContextInclusion,
  ProjectId,
  TaskContractId
} from "@krn/core";

import type {
  ActivationDecisionRecord,
  RetrievalCandidateKind,
  RetrievalCandidateRecord,
  RetrievalCandidateStatus,
  RetrievalRunRecord,
  RetrievalSubjectType
} from "./types.js";

export interface StartRetrievalRunInput {
  projectId?: ProjectId;
  taskContractId?: TaskContractId;
  query: string;
  tokenBudget?: number;
  metadataFilters?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface CompleteRetrievalRunInput {
  retrievalRunId: string;
  status: RetrievalRunRecord["status"];
  completedAt: string;
  metadata?: Record<string, unknown>;
}

export interface AddRetrievalCandidateInput {
  retrievalRunId: string;
  kind: RetrievalCandidateKind;
  status?: RetrievalCandidateStatus;
  subjectType: RetrievalSubjectType;
  subjectId: string;
  trustTier: "high" | "medium" | "low";
  lexicalScore?: number;
  vectorScore?: number;
  graphScore?: number;
  temporalScore?: number;
  contextRoiScore?: number;
  totalScore?: number;
  reason: string;
  metadata?: Record<string, unknown>;
}

export interface RecordActivationDecisionInput {
  retrievalRunId: string;
  contextAssemblyId?: string;
  subjectType: RetrievalSubjectType;
  subjectId: string;
  decision: ActivationDecisionRecord["decision"];
  reason: string;
  score?: number;
  metadata?: Record<string, unknown>;
}

export interface StoreContextSelectionInput {
  contextAssemblyId: string;
  inclusions: ContextInclusion[];
  exclusions: ContextExclusion[];
}

export interface RetrievalRepository {
  startRetrievalRun(input: StartRetrievalRunInput): Promise<RetrievalRunRecord>;
  completeRetrievalRun(input: CompleteRetrievalRunInput): Promise<RetrievalRunRecord>;
  addCandidate(input: AddRetrievalCandidateInput): Promise<RetrievalCandidateRecord>;
  recordActivationDecision(input: RecordActivationDecisionInput): Promise<ActivationDecisionRecord>;
  storeContextSelection(input: StoreContextSelectionInput): Promise<void>;
}
