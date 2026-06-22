import type {
  ActivationCandidateKind as CoreActivationCandidateKind,
  ActivationExclusionReason as CoreActivationExclusionReason,
  ContextAssemblyId,
  ContextSubjectType,
  HarnessPlanId,
  IsoTimestamp,
  MemoryRecordStatus,
  SourceTrustTier
} from "@krn/core";

export type ActivationCandidateKind = CoreActivationCandidateKind;

export type ActivationExclusionReason = CoreActivationExclusionReason;

export interface ActivationQuery {
  taskContractId: string;
  text: string;
  terms: readonly string[];
  focus: "memory" | "source";
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
  totalScore: number;
  exclusion?: ActivationExclusion;
}

export interface AssembleContextInput {
  id: ContextAssemblyId;
  harnessPlanId: HarnessPlanId;
  candidates: readonly RankedActivationCandidate[];
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
