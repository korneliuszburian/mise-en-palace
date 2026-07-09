import type {
  IsoTimestamp,
  MemoryRecord,
  SourceClaim,
  SourceClaimEdge
} from "@krn/core";

import {
  buildMemoryStalenessMaintenancePreview
} from "./memory-staleness-maintenance-preview.js";
import type {
  MemoryStalenessMaintenanceCandidate
} from "./memory-staleness-maintenance-preview.js";
import {
  buildKnowledgeAcquisitionMaintenancePreview
} from "./knowledge-acquisition-maintenance-preview.js";
import type {
  KnowledgeAcquisitionMaintenanceCandidate,
  KnowledgeAcquisitionRequest
} from "./knowledge-acquisition-maintenance-preview.js";
import {
  buildConsensusCandidateEvaluationPreview
} from "./consensus-candidate-evaluation-preview.js";
import type {
  ConsensusCandidateEvaluation,
  ConsensusCandidateEvaluationInput,
  ConsensusCandidateEvaluationPreview
} from "./consensus-candidate-evaluation-preview.js";
import {
  buildSourceRelationMaintenancePreview
} from "./source-relation-maintenance-preview.js";
import type {
  SourceRelationMaintenanceCandidate
} from "./source-relation-maintenance-preview.js";

export type MaintenancePreviewCandidate =
  | MemoryStalenessMaintenanceCandidate
  | SourceRelationMaintenanceCandidate
  | KnowledgeAcquisitionMaintenanceCandidate
  | ConsensusCandidateEvaluation;

export type MaintenancePreviewReviewEvalDecision =
  | "ready_for_behavior_proof"
  | "needs_more_evidence"
  | "no_reviewable_candidates";

export type MaintenancePreviewReviewEvalNextAction =
  | "add_golden_behavior_case"
  | "improve_candidate_evidence"
  | "seed_or_select_maintenance_candidate_state";

export type MaintenancePreviewCandidateRoutingStatus =
  | "ready_for_operator_review"
  | "needs_candidate_evidence"
  | "no_candidates";

export type MaintenancePreviewCandidateRoutingNextAction =
  | "review_candidates_and_capture_evidence"
  | "improve_candidate_evidence"
  | "seed_or_select_maintenance_candidate_state";

export type MaintenancePreviewCandidateReviewDecision =
  | "accept_for_manual_followup"
  | "defer_pending_evidence"
  | "reject_not_actionable";

export type MaintenancePreviewCandidateReviewNextAction =
  | "capture_review_evidence"
  | "request_more_candidate_evidence"
  | "record_rejection_evidence";

export interface MaintenancePreviewReviewEvalClosure {
  kind: "maintenance_preview_review_eval_closure";
  decision: MaintenancePreviewReviewEvalDecision;
  nextAction: MaintenancePreviewReviewEvalNextAction;
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

export interface MaintenancePreviewCandidateRoutingReadback {
  kind: "maintenance_candidate_routing";
  mode: "manual_candidate_only";
  status: MaintenancePreviewCandidateRoutingStatus;
  nextAction: MaintenancePreviewCandidateRoutingNextAction;
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
    "maintenance_queue_records"
  ];
}

export interface MaintenancePreviewCandidateReviewInput {
  candidateId: string;
  decision: MaintenancePreviewCandidateReviewDecision;
  reason: string;
  evidenceRef: string;
  reviewer?: string;
}

export interface MaintenancePreviewCandidateReviewResult {
  kind: "maintenance_candidate_review_result";
  candidateId: string;
  candidateFound: boolean;
  decision: MaintenancePreviewCandidateReviewDecision;
  nextAction: MaintenancePreviewCandidateReviewNextAction;
  reason: string;
  reviewer?: string;
  evidenceRefs: readonly string[];
  candidateReviewability?: MaintenancePreviewCandidate["reviewability"];
  mutation: "none";
  doesNotProve: string;
  forbiddenWrites: readonly [
    "memory_records",
    "anti_memory_records",
    "source_claims",
    "source_decisions",
    "source_claim_edges",
    "eval_candidates",
    "maintenance_queue_records"
  ];
}

export interface BuildMaintenancePreviewInput {
  now: IsoTimestamp;
  evidenceRef: string;
  memoryRecords: readonly MemoryRecord[];
  sourceClaims: readonly SourceClaim[];
  sourceClaimEdges: readonly SourceClaimEdge[];
  knowledgeAcquisitionRequests?: readonly KnowledgeAcquisitionRequest[];
  consensusCandidates?: readonly ConsensusCandidateEvaluationInput[];
  nearExpiryDays?: number;
  maxCandidates?: number;
  candidateReview?: MaintenancePreviewCandidateReviewInput;
}

export interface MaintenancePreview {
  generatedAt: IsoTimestamp;
  candidates: readonly MaintenancePreviewCandidate[];
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
  reviewEvalClosure: MaintenancePreviewReviewEvalClosure;
  manualCandidateRouting: MaintenancePreviewCandidateRoutingReadback;
  candidateReviewResult?: MaintenancePreviewCandidateReviewResult;
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

const candidateRoutingForbiddenWrites = [
  "memory_records",
  "anti_memory_records",
  "source_claims",
  "source_decisions",
  "source_claim_edges",
  "eval_candidates",
  "maintenance_queue_records"
] as const;

const priorityOrder = [
  "memory_staleness",
  "source_relation",
  "knowledge_acquisition",
  "consensus_evaluation"
] as const;

const previewDoesNotProve =
  "Brain maintenance preview does not prove memory truth, source truth, candidate usefulness, autonomous maintenance execution, scheduling, consensus correctness, or Memory Core mutation.";

const previewProof =
  "Maintenance candidate preview aggregates existing candidate-only maintenance previews over memory, source relation, explicit missing-evidence acquisition state, and consensus candidate evaluation input without mutating Memory Core, source truth, source decisions, eval candidates, or queued maintenance jobs.";

const reviewEvalClosureDoesNotProve =
  "Maintenance preview review/eval closure does not prove candidate truth, review correctness, production usefulness, scheduler readiness, autonomous maintenance execution, or Memory Core mutation.";

const candidateRoutingDoesNotProve =
  "Maintenance candidate routing readback does not prove candidate truth, review correctness, autonomous execution, scheduling readiness, maintenance daemon readiness, or Memory Core mutation.";

const candidateReviewDoesNotProve =
  "Maintenance candidate review result does not prove candidate truth, source truth, promotion readiness, scheduler readiness, maintenance daemon readiness, or Memory Core mutation.";

const remainingBudget = (
  maxCandidates: number | undefined,
  alreadySelected: number
): number | undefined => {
  if (maxCandidates === undefined) {
    return undefined;
  }

  return Math.max(0, maxCandidates - alreadySelected);
};

const hasReviewableEvidence = (candidate: MaintenancePreviewCandidate): boolean =>
  candidate.reviewability === "ready" &&
  candidate.evidenceRefs.length > 0 &&
  candidate.reviewabilityReasons.length > 0 &&
  candidate.doesNotProve.trim().length > 0 &&
  candidate.mutation === "none";

const countReviewableCandidates = (
  candidates: readonly MaintenancePreviewCandidate[]
): number => candidates.filter(hasReviewableEvidence).length;

const buildReviewEvalClosure = (
  candidates: readonly MaintenancePreviewCandidate[],
  evidenceRef: string
): MaintenancePreviewReviewEvalClosure => {
  if (candidates.length === 0) {
    return {
      kind: "maintenance_preview_review_eval_closure",
      decision: "no_reviewable_candidates",
      nextAction: "seed_or_select_maintenance_candidate_state",
      summary:
        "No maintenance candidates were emitted, so there is no behavior/eval candidate to close yet.",
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
      kind: "maintenance_preview_review_eval_closure",
      decision: "needs_more_evidence",
      nextAction: "improve_candidate_evidence",
      summary:
        "Maintenance preview emitted candidates, but at least one candidate is not ready for behavior/eval closure.",
      candidateIds,
      evidenceRefs,
      mutation: "none",
      doesNotProve: reviewEvalClosureDoesNotProve,
      forbiddenWrites: reviewEvalClosureForbiddenWrites
    };
  }

  return {
    kind: "maintenance_preview_review_eval_closure",
    decision: "ready_for_behavior_proof",
    nextAction: "add_golden_behavior_case",
    summary:
      "Maintenance preview emitted review-ready candidate output that can be protected by a bounded behavior proof before any automated maintenance path.",
    candidateIds,
    evidenceRefs,
    mutation: "none",
    doesNotProve: reviewEvalClosureDoesNotProve,
    forbiddenWrites: reviewEvalClosureForbiddenWrites
  };
};

const buildCandidateRoutingReadback = (
  candidates: readonly MaintenancePreviewCandidate[],
  reviewEvalClosure: MaintenancePreviewReviewEvalClosure
): MaintenancePreviewCandidateRoutingReadback => {
  const reviewableCandidates = countReviewableCandidates(candidates);
  const statusByDecision = {
    ready_for_behavior_proof: "ready_for_operator_review",
    needs_more_evidence: "needs_candidate_evidence",
    no_reviewable_candidates: "no_candidates"
  } as const satisfies Record<MaintenancePreviewReviewEvalDecision, MaintenancePreviewCandidateRoutingStatus>;
  const nextActionByDecision = {
    ready_for_behavior_proof: "review_candidates_and_capture_evidence",
    needs_more_evidence: "improve_candidate_evidence",
    no_reviewable_candidates: "seed_or_select_maintenance_candidate_state"
  } as const satisfies Record<MaintenancePreviewReviewEvalDecision, MaintenancePreviewCandidateRoutingNextAction>;
  const summaryByDecision = {
    ready_for_behavior_proof:
      "Maintenance candidate routing can hand review-ready maintenance candidates to an operator, then capture evidence before any promotion or mutation.",
    needs_more_evidence:
      "Maintenance candidate routing found maintenance candidates, but their evidence is not ready for operator review.",
    no_reviewable_candidates:
      "Maintenance candidate routing inspected current state but has no reviewable maintenance candidates to route."
  } as const satisfies Record<MaintenancePreviewReviewEvalDecision, string>;

  return {
    kind: "maintenance_candidate_routing",
    mode: "manual_candidate_only",
    status: statusByDecision[reviewEvalClosure.decision],
    nextAction: nextActionByDecision[reviewEvalClosure.decision],
    summary: summaryByDecision[reviewEvalClosure.decision],
    inspectedCandidates: candidates.length,
    reviewableCandidates,
    mutation: "none",
    doesNotProve: candidateRoutingDoesNotProve,
    forbiddenWrites: candidateRoutingForbiddenWrites
  };
};

const nextActionByReviewDecision = {
  accept_for_manual_followup: "capture_review_evidence",
  defer_pending_evidence: "request_more_candidate_evidence",
  reject_not_actionable: "record_rejection_evidence"
} as const satisfies Record<
  MaintenancePreviewCandidateReviewDecision,
  MaintenancePreviewCandidateReviewNextAction
>;

const buildCandidateReviewResult = (
  candidates: readonly MaintenancePreviewCandidate[],
  input: MaintenancePreviewCandidateReviewInput | undefined
): MaintenancePreviewCandidateReviewResult | undefined => {
  if (input === undefined) {
    return undefined;
  }

  const candidate = candidates.find((item) => item.id === input.candidateId);

  return {
    kind: "maintenance_candidate_review_result",
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
    forbiddenWrites: candidateRoutingForbiddenWrites
  };
};

export const buildMaintenancePreview = (
  input: BuildMaintenancePreviewInput
): MaintenancePreview => {
  const memoryPreview = buildMemoryStalenessMaintenancePreview({
    now: input.now,
    memoryRecords: input.memoryRecords,
    evidenceRef: input.evidenceRef,
    ...(input.nearExpiryDays === undefined ? {} : { nearExpiryDays: input.nearExpiryDays }),
    ...(input.maxCandidates === undefined ? {} : { maxCandidates: input.maxCandidates })
  });
  const sourceBudget = remainingBudget(input.maxCandidates, memoryPreview.candidates.length);
  const sourcePreview = buildSourceRelationMaintenancePreview({
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
  const acquisitionPreview = buildKnowledgeAcquisitionMaintenancePreview({
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
  const manualCandidateRouting = buildCandidateRoutingReadback(candidates, reviewEvalClosure);

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
    manualCandidateRouting,
    ...(candidateReviewResult === undefined ? {} : { candidateReviewResult }),
    priorityOrder,
    forbiddenWrites
  };
};

export type MaintenanceCandidatePreview = MaintenancePreview;
export type BuildMaintenanceCandidatePreviewInput = BuildMaintenancePreviewInput;

export const buildMaintenanceCandidatePreview = (
  input: BuildMaintenanceCandidatePreviewInput
): MaintenanceCandidatePreview => buildMaintenancePreview(input);
