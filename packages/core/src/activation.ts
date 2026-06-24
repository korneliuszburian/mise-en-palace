import type {
  ContextAssemblyCurrentStatus,
  ContextExclusion,
  ContextInclusion,
  ContextSubjectType
} from "./contextAssembly.js";
import type { TaskContractId } from "./ids.js";
import type { SourceTrustTier } from "./source.js";

export const activationCandidateKinds = [
  "memory",
  "anti_memory",
  "source",
  "search"
] as const;

export type ActivationCandidateKind = typeof activationCandidateKinds[number];

export const activationDecisionStatuses = [
  "included",
  "excluded",
  "abstained",
  "deferred",
  "conflict",
  "stale"
] as const;

export type ActivationDecisionStatus = typeof activationDecisionStatuses[number];

export const activationExclusionReasons = [
  "stale",
  "invalidated",
  "low_trust",
  "low_context_roi",
  "over_budget",
  "duplicate",
  "irrelevant",
  "unsafe",
  "superseded"
] as const;

export type ActivationExclusionReason = typeof activationExclusionReasons[number];

export type ActivationAbstentionReason =
  | "no_candidates"
  | "weak_context"
  | "all_excluded"
  | "over_budget"
  | "unsafe_context";

export type ConflictSetReason =
  | "contradictory_source_claims"
  | "anti_memory_block"
  | "duplicate"
  | "stale_conflict";

export type ConflictResolution = "exclude_all" | "prefer_trusted" | "defer";

export interface ContextBudget {
  maxItems?: number;
  maxTokens?: number;
  reservedTokens?: number;
}

export interface ActivationPolicy {
  id?: string;
  minimumTrustTier: "low" | "medium" | "high";
  budget: ContextBudget;
  allowStale: boolean;
  requireSourceDoesNotProve: boolean;
  metadata?: Record<string, unknown>;
}

export interface TrustAssessment {
  accepted: boolean;
  trustTier: SourceTrustTier;
  reason: string;
  minimumTrustTier?: ActivationPolicy["minimumTrustTier"];
}

export interface ContextROI {
  score: number;
  tokenEstimate: number;
  expectedUse: string;
  expectedDecisionImpact?: string;
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
  metadata: Record<string, unknown>;
}

export interface ActivationInput {
  taskContractId: TaskContractId;
  query: string;
  candidates: readonly ActivationCandidate[];
  policy: ActivationPolicy;
  metadata: Record<string, unknown>;
}

export interface ActivationAbstention {
  reason: ActivationAbstentionReason;
  explanation: string;
  metadata: Record<string, unknown>;
}

export interface ConflictSet {
  id?: string;
  candidateIds: readonly string[];
  reason: ConflictSetReason;
  resolution: ConflictResolution;
  explanation?: string;
}

export interface ActivationTrace {
  taskContractId: TaskContractId;
  retrievalRunId?: string;
  contextAssemblyId?: string;
  policy: ActivationPolicy;
  candidateCount: number;
  includedCount: number;
  excludedCount: number;
  conflictSets: readonly ConflictSet[];
  abstention?: ActivationAbstention;
  metadata: Record<string, unknown>;
}

export interface ActivationResult {
  status: ContextAssemblyCurrentStatus;
  inclusions: readonly ContextInclusion[];
  exclusions: readonly ContextExclusion[];
  trace: ActivationTrace;
  abstention?: ActivationAbstention;
  metadata: Record<string, unknown>;
}

export const createActivationAbstention = (input: {
  reason: ActivationAbstentionReason;
  explanation: string;
  metadata?: Record<string, unknown>;
}): ActivationAbstention => ({
  reason: input.reason,
  explanation: input.explanation,
  metadata: input.metadata ?? {}
});
