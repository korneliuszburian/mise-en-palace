import {
  activationCandidateKinds,
  activationDecisionStatuses,
  activationExclusionReasons,
  type ActivationCandidateKind,
  type ActivationDecisionStatus,
  type ActivationExclusionReason
} from "./activation.js";

export const retrievalSubjectTypes = [
  "source_artifact",
  "source_chunk",
  "source_claim",
  "memory_record",
  "anti_memory_record",
  "task_contract",
  "search_document",
  "evidence_bundle",
  "review_assessment",
  "architecture_decision",
  "run_event"
] as const;

export type RetrievalSubjectType = (typeof retrievalSubjectTypes)[number];

export const retrievalRunStatuses = ["running", "completed", "abstained", "failed"] as const;

export type RetrievalRunStatus = (typeof retrievalRunStatuses)[number];

export const retrievalRunModes = ["lexical", "vector", "hybrid", "graph", "mixed"] as const;

export type RetrievalRunMode = (typeof retrievalRunModes)[number];

export const retrievalCandidateKinds = activationCandidateKinds;

export type RetrievalCandidateKind = ActivationCandidateKind;

export const retrievalCandidateStatuses = ["candidate", "included", "excluded"] as const;

export type RetrievalCandidateStatus = (typeof retrievalCandidateStatuses)[number];

export const retrievalValidityStatuses = ["active", "expired", "invalidated"] as const;

export type RetrievalValidityStatus = (typeof retrievalValidityStatuses)[number];

export const embeddingModelStatuses = ["active", "deprecated", "disabled"] as const;

export type EmbeddingModelStatus = (typeof embeddingModelStatuses)[number];

export const retrievalActivationDecisionStatuses = activationDecisionStatuses;

export type RetrievalActivationDecisionStatus = ActivationDecisionStatus;

export const activationDecisionInputStatuses = [
  "included",
  "excluded",
  "deferred",
  "conflict",
  "stale"
] as const;

export type ActivationDecisionInputStatus = (typeof activationDecisionInputStatuses)[number];

export const contextExclusionReasons = activationExclusionReasons;

export type ContextExclusionReason = ActivationExclusionReason;

export const nonStaleContextExclusionReasons = [
  "invalidated",
  "low_trust",
  "low_context_roi",
  "over_budget",
  "duplicate",
  "irrelevant",
  "unsafe",
  "superseded"
] as const;

export type NonStaleContextExclusionReason = (typeof nonStaleContextExclusionReasons)[number];

export const activationDecisionSourceSupportStates = [
  "not_applicable",
  "source_claim_supported",
  "source_claim_missing_mechanism",
  "source_claim_missing_does_not_prove"
] as const;

export type ActivationDecisionSourceSupportState =
  (typeof activationDecisionSourceSupportStates)[number];

export const activationTraceRawRecallReasons = ["exact_proof_required", "low_trust"] as const;

export type ActivationTraceRawRecallReason = (typeof activationTraceRawRecallReasons)[number];

export const activationAbstentionReasons = [
  "no_candidates",
  "weak_context",
  "all_excluded",
  "over_budget",
  "unsafe_context"
] as const;
