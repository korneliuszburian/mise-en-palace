import type {
  IsoTimestamp,
  MemoryRecord,
  SourceClaim,
  SourceClaimEdge
} from "@krn/core";

import {
  buildMemoryStalenessHeartbeatPreview
} from "./memoryStalenessHeartbeatPreview.js";
import type {
  MemoryStalenessHeartbeatCandidate
} from "./memoryStalenessHeartbeatPreview.js";
import {
  buildKnowledgeAcquisitionHeartbeatPreview
} from "./knowledgeAcquisitionHeartbeatPreview.js";
import type {
  KnowledgeAcquisitionHeartbeatCandidate,
  KnowledgeAcquisitionRequest
} from "./knowledgeAcquisitionHeartbeatPreview.js";
import {
  buildConsensusCandidateEvaluationPreview
} from "./consensusCandidateEvaluationPreview.js";
import type {
  ConsensusCandidateEvaluation,
  ConsensusCandidateEvaluationInput,
  ConsensusCandidateEvaluationPreview
} from "./consensusCandidateEvaluationPreview.js";
import {
  buildSourceRelationHeartbeatPreview
} from "./sourceRelationHeartbeatPreview.js";
import type {
  SourceRelationHeartbeatCandidate
} from "./sourceRelationHeartbeatPreview.js";

export type BrainHeartbeatCandidate =
  | MemoryStalenessHeartbeatCandidate
  | SourceRelationHeartbeatCandidate
  | KnowledgeAcquisitionHeartbeatCandidate
  | ConsensusCandidateEvaluation;

export type BrainHeartbeatReviewEvalDecision =
  | "ready_for_behavior_proof"
  | "needs_more_evidence"
  | "no_reviewable_candidates";

export type BrainHeartbeatReviewEvalNextAction =
  | "add_golden_behavior_case"
  | "improve_candidate_evidence"
  | "seed_or_select_heartbeat_candidate_state";

export type BrainHeartbeatRuntimeLoopStatus =
  | "ready_for_operator_review"
  | "needs_candidate_evidence"
  | "no_candidates";

export type BrainHeartbeatRuntimeLoopNextAction =
  | "review_candidates_and_capture_evidence"
  | "improve_candidate_evidence"
  | "seed_or_select_heartbeat_candidate_state";

export type BrainHeartbeatCandidateReviewDecision =
  | "accept_for_manual_followup"
  | "defer_pending_evidence"
  | "reject_not_actionable";

export type BrainHeartbeatCandidateReviewNextAction =
  | "capture_review_evidence"
  | "request_more_candidate_evidence"
  | "record_rejection_evidence";

export interface BrainHeartbeatReviewEvalClosure {
  kind: "heartbeat_preview_review_eval_closure";
  decision: BrainHeartbeatReviewEvalDecision;
  nextAction: BrainHeartbeatReviewEvalNextAction;
  summary: string;
  candidateIds: readonly string[];
  evidenceRefs: readonly string[];
  mutation: "none";
  doesNotProve: string;
  forbiddenWrites: readonly [
    "memory_records",
    "anti_memory_records",
    "source_claims",
    "source_decisions",
    "source_claim_edges",
    "eval_candidates"
  ];
}

export interface BrainHeartbeatRuntimeLoopReadback {
  kind: "heartbeat_candidate_runtime_loop";
  mode: "manual_candidate_only";
  status: BrainHeartbeatRuntimeLoopStatus;
  nextAction: BrainHeartbeatRuntimeLoopNextAction;
  summary: string;
  inspectedCandidates: number;
  reviewableCandidates: number;
  mutation: "none";
  doesNotProve: string;
  forbiddenWrites: readonly [
    "memory_records",
    "anti_memory_records",
    "source_claims",
    "source_decisions",
    "source_claim_edges",
    "eval_candidates",
    "worker_jobs"
  ];
}

export interface BrainHeartbeatCandidateReviewInput {
  candidateId: string;
  decision: BrainHeartbeatCandidateReviewDecision;
  reason: string;
  evidenceRef: string;
  reviewer?: string;
}

export interface BrainHeartbeatCandidateReviewResult {
  kind: "heartbeat_candidate_review_result";
  candidateId: string;
  candidateFound: boolean;
  decision: BrainHeartbeatCandidateReviewDecision;
  nextAction: BrainHeartbeatCandidateReviewNextAction;
  reason: string;
  reviewer?: string;
  evidenceRefs: readonly string[];
  candidateReviewability?: BrainHeartbeatCandidate["reviewability"];
  mutation: "none";
  doesNotProve: string;
  forbiddenWrites: readonly [
    "memory_records",
    "anti_memory_records",
    "source_claims",
    "source_decisions",
    "source_claim_edges",
    "eval_candidates",
    "worker_jobs"
  ];
}

export interface BuildBrainHeartbeatPreviewInput {
  now: IsoTimestamp;
  evidenceRef: string;
  memoryRecords: readonly MemoryRecord[];
  sourceClaims: readonly SourceClaim[];
  sourceClaimEdges: readonly SourceClaimEdge[];
  knowledgeAcquisitionRequests?: readonly KnowledgeAcquisitionRequest[];
  consensusCandidates?: readonly ConsensusCandidateEvaluationInput[];
  nearExpiryDays?: number;
  maxCandidates?: number;
  candidateReview?: BrainHeartbeatCandidateReviewInput;
}

export interface BrainHeartbeatPreview {
  generatedAt: IsoTimestamp;
  candidates: readonly BrainHeartbeatCandidate[];
  candidateCounts: {
    memoryStaleness: number;
    sourceRelation: number;
    knowledgeAcquisition: number;
    consensusEvaluation: number;
  };
  skippedCounts: {
    memoryRecords: number;
    sourceClaimEdges: number;
    knowledgeAcquisitionRequests: number;
    consensusCandidates: number;
  };
  consensusEvaluation?: ConsensusCandidateEvaluationPreview;
  mutation: "none";
  proof: string;
  doesNotProve: string;
  reviewEvalClosure: BrainHeartbeatReviewEvalClosure;
  runtimeLoop: BrainHeartbeatRuntimeLoopReadback;
  candidateReviewResult?: BrainHeartbeatCandidateReviewResult;
  priorityOrder: readonly [
    "memory_staleness",
    "source_relation",
    "knowledge_acquisition",
    "consensus_evaluation"
  ];
  forbiddenWrites: readonly [
    "memory_records",
    "anti_memory_records",
    "source_claims",
    "source_decisions",
    "source_claim_edges"
  ];
}

const forbiddenWrites = [
  "memory_records",
  "anti_memory_records",
  "source_claims",
  "source_decisions",
  "source_claim_edges"
] as const;

const reviewEvalClosureForbiddenWrites = [
  "memory_records",
  "anti_memory_records",
  "source_claims",
  "source_decisions",
  "source_claim_edges",
  "eval_candidates"
] as const;

const runtimeLoopForbiddenWrites = [
  "memory_records",
  "anti_memory_records",
  "source_claims",
  "source_decisions",
  "source_claim_edges",
  "eval_candidates",
  "worker_jobs"
] as const;

const priorityOrder = [
  "memory_staleness",
  "source_relation",
  "knowledge_acquisition",
  "consensus_evaluation"
] as const;

const previewDoesNotProve =
  "Brain heartbeat preview does not prove memory truth, source truth, candidate usefulness, autonomous worker execution, scheduling, consensus correctness, or Memory Core mutation.";

const previewProof =
  "Brain heartbeat preview aggregates existing candidate-only maintenance previews over memory, source relation, explicit missing-evidence acquisition state, and consensus candidate evaluation input without mutating Memory Core, source truth, source decisions, eval candidates, or worker runtime state.";

const reviewEvalClosureDoesNotProve =
  "Heartbeat preview review/eval closure does not prove candidate truth, review correctness, production usefulness, scheduler readiness, autonomous worker execution, or Memory Core mutation.";

const runtimeLoopDoesNotProve =
  "Heartbeat runtime loop readback does not prove candidate truth, review correctness, autonomous execution, scheduling readiness, worker daemon readiness, or Memory Core mutation.";

const candidateReviewDoesNotProve =
  "Heartbeat candidate review result does not prove candidate truth, source truth, promotion readiness, scheduler readiness, worker daemon readiness, or Memory Core mutation.";

const remainingBudget = (
  maxCandidates: number | undefined,
  alreadySelected: number
): number | undefined => {
  if (maxCandidates === undefined) {
    return undefined;
  }

  return Math.max(0, maxCandidates - alreadySelected);
};

const hasReviewableEvidence = (candidate: BrainHeartbeatCandidate): boolean =>
  candidate.reviewability === "ready" &&
  candidate.evidenceRefs.length > 0 &&
  candidate.reviewabilityReasons.length > 0 &&
  candidate.doesNotProve.trim().length > 0 &&
  candidate.mutation === "none";

const countReviewableCandidates = (
  candidates: readonly BrainHeartbeatCandidate[]
): number => candidates.filter(hasReviewableEvidence).length;

const buildReviewEvalClosure = (
  candidates: readonly BrainHeartbeatCandidate[],
  evidenceRef: string
): BrainHeartbeatReviewEvalClosure => {
  if (candidates.length === 0) {
    return {
      kind: "heartbeat_preview_review_eval_closure",
      decision: "no_reviewable_candidates",
      nextAction: "seed_or_select_heartbeat_candidate_state",
      summary:
        "No heartbeat candidates were emitted, so there is no behavior/eval candidate to close yet.",
      candidateIds: [],
      evidenceRefs: [evidenceRef],
      mutation: "none",
      doesNotProve: reviewEvalClosureDoesNotProve,
      forbiddenWrites: reviewEvalClosureForbiddenWrites
    };
  }

  const allCandidatesReviewable = candidates.every(hasReviewableEvidence);
  const candidateIds = candidates.map((candidate) => candidate.id);
  const evidenceRefs = [...new Set(candidates.flatMap((candidate) => candidate.evidenceRefs))];

  if (!allCandidatesReviewable) {
    return {
      kind: "heartbeat_preview_review_eval_closure",
      decision: "needs_more_evidence",
      nextAction: "improve_candidate_evidence",
      summary:
        "Heartbeat preview emitted candidates, but at least one candidate is not ready for behavior/eval closure.",
      candidateIds,
      evidenceRefs,
      mutation: "none",
      doesNotProve: reviewEvalClosureDoesNotProve,
      forbiddenWrites: reviewEvalClosureForbiddenWrites
    };
  }

  return {
    kind: "heartbeat_preview_review_eval_closure",
    decision: "ready_for_behavior_proof",
    nextAction: "add_golden_behavior_case",
    summary:
      "Heartbeat preview emitted review-ready candidate output that can be protected by a bounded behavior proof before runtime automation.",
    candidateIds,
    evidenceRefs,
    mutation: "none",
    doesNotProve: reviewEvalClosureDoesNotProve,
    forbiddenWrites: reviewEvalClosureForbiddenWrites
  };
};

const buildRuntimeLoopReadback = (
  candidates: readonly BrainHeartbeatCandidate[],
  reviewEvalClosure: BrainHeartbeatReviewEvalClosure
): BrainHeartbeatRuntimeLoopReadback => {
  const reviewableCandidates = countReviewableCandidates(candidates);
  const statusByDecision = {
    ready_for_behavior_proof: "ready_for_operator_review",
    needs_more_evidence: "needs_candidate_evidence",
    no_reviewable_candidates: "no_candidates"
  } as const satisfies Record<BrainHeartbeatReviewEvalDecision, BrainHeartbeatRuntimeLoopStatus>;
  const nextActionByDecision = {
    ready_for_behavior_proof: "review_candidates_and_capture_evidence",
    needs_more_evidence: "improve_candidate_evidence",
    no_reviewable_candidates: "seed_or_select_heartbeat_candidate_state"
  } as const satisfies Record<BrainHeartbeatReviewEvalDecision, BrainHeartbeatRuntimeLoopNextAction>;
  const summaryByDecision = {
    ready_for_behavior_proof:
      "Heartbeat runtime loop can hand review-ready maintenance candidates to an operator, then capture evidence before any promotion or mutation.",
    needs_more_evidence:
      "Heartbeat runtime loop found maintenance candidates, but their evidence is not ready for operator review.",
    no_reviewable_candidates:
      "Heartbeat runtime loop inspected current state but has no reviewable maintenance candidates to route."
  } as const satisfies Record<BrainHeartbeatReviewEvalDecision, string>;

  return {
    kind: "heartbeat_candidate_runtime_loop",
    mode: "manual_candidate_only",
    status: statusByDecision[reviewEvalClosure.decision],
    nextAction: nextActionByDecision[reviewEvalClosure.decision],
    summary: summaryByDecision[reviewEvalClosure.decision],
    inspectedCandidates: candidates.length,
    reviewableCandidates,
    mutation: "none",
    doesNotProve: runtimeLoopDoesNotProve,
    forbiddenWrites: runtimeLoopForbiddenWrites
  };
};

const nextActionByReviewDecision = {
  accept_for_manual_followup: "capture_review_evidence",
  defer_pending_evidence: "request_more_candidate_evidence",
  reject_not_actionable: "record_rejection_evidence"
} as const satisfies Record<
  BrainHeartbeatCandidateReviewDecision,
  BrainHeartbeatCandidateReviewNextAction
>;

const buildCandidateReviewResult = (
  candidates: readonly BrainHeartbeatCandidate[],
  input: BrainHeartbeatCandidateReviewInput | undefined
): BrainHeartbeatCandidateReviewResult | undefined => {
  if (input === undefined) {
    return undefined;
  }

  const candidate = candidates.find((item) => item.id === input.candidateId);

  return {
    kind: "heartbeat_candidate_review_result",
    candidateId: input.candidateId,
    candidateFound: candidate !== undefined,
    decision: input.decision,
    nextAction: nextActionByReviewDecision[input.decision],
    reason: input.reason,
    ...(input.reviewer === undefined ? {} : { reviewer: input.reviewer }),
    evidenceRefs: [input.evidenceRef],
    ...(candidate === undefined ? {} : { candidateReviewability: candidate.reviewability }),
    mutation: "none",
    doesNotProve: candidateReviewDoesNotProve,
    forbiddenWrites: runtimeLoopForbiddenWrites
  };
};

export const buildBrainHeartbeatPreview = (
  input: BuildBrainHeartbeatPreviewInput
): BrainHeartbeatPreview => {
  const memoryPreview = buildMemoryStalenessHeartbeatPreview({
    now: input.now,
    memoryRecords: input.memoryRecords,
    evidenceRef: input.evidenceRef,
    ...(input.nearExpiryDays === undefined ? {} : { nearExpiryDays: input.nearExpiryDays }),
    ...(input.maxCandidates === undefined ? {} : { maxCandidates: input.maxCandidates })
  });
  const sourceBudget = remainingBudget(input.maxCandidates, memoryPreview.candidates.length);
  const sourcePreview = buildSourceRelationHeartbeatPreview({
    now: input.now,
    sourceClaims: input.sourceClaims,
    sourceClaimEdges: input.sourceClaimEdges,
    evidenceRef: input.evidenceRef,
    ...(sourceBudget === undefined ? {} : { maxCandidates: sourceBudget })
  });
  const acquisitionBudget = remainingBudget(
    input.maxCandidates,
    memoryPreview.candidates.length + sourcePreview.candidates.length
  );
  const acquisitionPreview = buildKnowledgeAcquisitionHeartbeatPreview({
    now: input.now,
    requests: input.knowledgeAcquisitionRequests ?? [],
    evidenceRef: input.evidenceRef,
    ...(acquisitionBudget === undefined ? {} : { maxCandidates: acquisitionBudget })
  });
  const consensusBudget = remainingBudget(
    input.maxCandidates,
    memoryPreview.candidates.length +
      sourcePreview.candidates.length +
      acquisitionPreview.candidates.length
  );
  const consensusPreview = buildConsensusCandidateEvaluationPreview({
    generatedAt: input.now,
    candidates: input.consensusCandidates ?? [],
    ...(consensusBudget === undefined ? {} : { maxCandidates: consensusBudget })
  });
  const candidates = [
    ...memoryPreview.candidates,
    ...sourcePreview.candidates,
    ...acquisitionPreview.candidates,
    ...consensusPreview.evaluations
  ];
  const reviewEvalClosure = buildReviewEvalClosure(candidates, input.evidenceRef);
  const candidateReviewResult = buildCandidateReviewResult(candidates, input.candidateReview);

  return {
    generatedAt: input.now,
    candidates,
    candidateCounts: {
      memoryStaleness: memoryPreview.candidates.length,
      sourceRelation: sourcePreview.candidates.length,
      knowledgeAcquisition: acquisitionPreview.candidates.length,
      consensusEvaluation: consensusPreview.evaluations.length
    },
    skippedCounts: {
      memoryRecords: memoryPreview.skippedMemoryCount,
      sourceClaimEdges: sourcePreview.skippedEdgeCount,
      knowledgeAcquisitionRequests: acquisitionPreview.skippedRequestCount,
      consensusCandidates: consensusPreview.skippedCandidateCount
    },
    ...(input.consensusCandidates === undefined ? {} : { consensusEvaluation: consensusPreview }),
    mutation: "none",
    proof: previewProof,
    doesNotProve: previewDoesNotProve,
    reviewEvalClosure,
    runtimeLoop: buildRuntimeLoopReadback(candidates, reviewEvalClosure),
    ...(candidateReviewResult === undefined ? {} : { candidateReviewResult }),
    priorityOrder,
    forbiddenWrites
  };
};
