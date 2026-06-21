import type {
  ContextAssemblyId,
  ContextSubjectType,
  HarnessPlanId,
  IsoTimestamp,
  SourceTrustTier
} from "@krn/core";

export type ActivationCandidateKind = "memory" | "anti_memory" | "source" | "search";

export type ActivationExclusionReason =
  | "stale"
  | "invalidated"
  | "low_trust"
  | "low_context_roi"
  | "over_budget"
  | "duplicate"
  | "irrelevant"
  | "unsafe"
  | "superseded";

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
  status?: "active" | "stale" | "invalidated" | "superseded";
  validFrom?: IsoTimestamp;
  validUntil?: IsoTimestamp;
  invalidatedAt?: IsoTimestamp;
  invalidationReason?: string;
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
  high: 3
} as const satisfies Record<SourceTrustTier, number>;

export const markExcluded = (
  candidate: RankedActivationCandidate,
  exclusion: ActivationExclusion
): RankedActivationCandidate => ({
  ...candidate,
  exclusion
});
