import type {
  ActivationCandidateKind as CoreActivationCandidateKind,
  ActivationExclusionReason as CoreActivationExclusionReason,
  ContextAssemblyId,
  ContextSubjectType,
  HarnessPlanId,
  IsoTimestamp,
  MemoryRecordStatus,
  ProjectId,
  SourceTrustTier
} from "@krn/core";
import type {
  ObservationPrefix
} from "../observations/observationPrefix.js";

export type ActivationCandidateKind = CoreActivationCandidateKind;

export type ActivationExclusionReason = CoreActivationExclusionReason;

export type ActivationQueryFocus = "memory" | "source" | "observation" | "mixed";

export type ActivationQueryNeed =
  | "memory"
  | "source"
  | "observation"
  | "anti_memory"
  | "search";

export type ActivationQueryRisk = "low" | "medium" | "high";

export interface ActivationQueryScope {
  taskContractId: string;
  projectId?: ProjectId;
}

export interface ActivationQueryBudget {
  maxItems: number;
  maxTokens: number;
  reserveTokens: number;
}

export interface ActivationQuery {
  taskContractId: string;
  projectId?: ProjectId;
  text: string;
  terms: readonly string[];
  focus: ActivationQueryFocus;
  needs: readonly ActivationQueryNeed[];
  scope: ActivationQueryScope;
  budget: ActivationQueryBudget;
  risk: ActivationQueryRisk;
}

export interface ActivationCandidate {
  id: string;
  kind: ActivationCandidateKind;
  subjectType: ContextSubjectType;
  subjectId: string;
  text: string;
  trustTier: SourceTrustTier;
  reason: string;
  expectedUse: string;
  tokenEstimate: number;
  status?: MemoryRecordStatus;
  validFrom?: IsoTimestamp;
  validUntil?: IsoTimestamp;
  invalidatedAt?: IsoTimestamp;
  invalidationReason?: string;
  hasMechanism?: boolean;
  doesNotProve?: string;
  lexicalScore?: number;
  vectorScore?: number;
  graphScore?: number;
  temporalScore?: number;
  contextRoiScore?: number;
  feedbackScore?: number;
  searchDocumentId?: string;
  searchDocumentIds?: readonly string[];
  sourceClaimId?: string;
  memoryRecordId?: string;
  antiMemoryRecordId?: string;
  conflictReason?: "anti_memory_block";
  metadata: Record<string, unknown>;
}

export interface ActivationExclusion {
  reason: ActivationExclusionReason;
  explanation: string;
}

export interface RankedActivationCandidate extends ActivationCandidate {
  lexicalScore: number;
  vectorScore: number;
  graphScore: number;
  temporalScore: number;
  contextRoiScore: number;
  feedbackScore: number;
  totalScore: number;
  exclusion?: ActivationExclusion;
}

export type ActivationRetrievalInputStatus =
  | "candidates_available"
  | "missing_project_scope"
  | "empty_activation_store"
  | "no_matching_candidates";

export type ActivationTargetReadModelStatus =
  | "not_provided"
  | "provided";

export interface ActivationRetrievalDiagnostics {
  projectScoped: boolean;
  inputStatus: ActivationRetrievalInputStatus;
  memoryRecordCount: number;
  sourceClaimCount: number;
  searchResultCount: number;
  ownerFileCandidateCount: number;
  antiMemoryRecordCount: number;
  mergedCandidateCount: number;
  targetReadModelStatus: ActivationTargetReadModelStatus;
  sourceSeedCount: number;
  targetOwnerFileCount: number;
  trustExclusionCount: number;
  doesNotProve: string;
}

export interface AssembleContextInput {
  id: ContextAssemblyId;
  harnessPlanId: HarnessPlanId;
  candidates: readonly RankedActivationCandidate[];
  observationPrefix?: ObservationPrefix;
  tokenBudget?: number;
  createdAt: IsoTimestamp;
  metadata?: Record<string, unknown>;
}

export const trustRank = {
  low: 1,
  medium: 2,
  high: 3,
  primary: 3,
  official: 3,
  "project-decision": 3,
  "source-code": 3,
  paper: 2,
  practitioner: 2,
  secondary: 1,
  hypothesis: 1
} as const satisfies Record<SourceTrustTier, number>;

export const markExcluded = (
  candidate: RankedActivationCandidate,
  exclusion: ActivationExclusion
): RankedActivationCandidate => ({
  ...candidate,
  exclusion
});
