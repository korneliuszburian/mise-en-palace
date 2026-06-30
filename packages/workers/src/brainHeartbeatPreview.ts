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
  buildSourceRelationHeartbeatPreview
} from "./sourceRelationHeartbeatPreview.js";
import type {
  SourceRelationHeartbeatCandidate
} from "./sourceRelationHeartbeatPreview.js";

export type BrainHeartbeatCandidate =
  | MemoryStalenessHeartbeatCandidate
  | SourceRelationHeartbeatCandidate;

export type BrainHeartbeatReviewEvalDecision =
  | "ready_for_behavior_proof"
  | "needs_more_evidence"
  | "no_reviewable_candidates";

export type BrainHeartbeatReviewEvalNextAction =
  | "add_golden_behavior_case"
  | "improve_candidate_evidence"
  | "seed_or_select_heartbeat_candidate_state";

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

export interface BuildBrainHeartbeatPreviewInput {
  now: IsoTimestamp;
  evidenceRef: string;
  memoryRecords: readonly MemoryRecord[];
  sourceClaims: readonly SourceClaim[];
  sourceClaimEdges: readonly SourceClaimEdge[];
  nearExpiryDays?: number;
  maxCandidates?: number;
}

export interface BrainHeartbeatPreview {
  generatedAt: IsoTimestamp;
  candidates: readonly BrainHeartbeatCandidate[];
  candidateCounts: {
    memoryStaleness: number;
    sourceRelation: number;
  };
  skippedCounts: {
    memoryRecords: number;
    sourceClaimEdges: number;
  };
  mutation: "none";
  proof: string;
  doesNotProve: string;
  reviewEvalClosure: BrainHeartbeatReviewEvalClosure;
  priorityOrder: readonly ["memory_staleness", "source_relation"];
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

const priorityOrder = ["memory_staleness", "source_relation"] as const;

const previewDoesNotProve =
  "Brain heartbeat preview does not prove memory truth, source truth, candidate usefulness, autonomous worker execution, scheduling, consensus correctness, or Memory Core mutation.";

const previewProof =
  "Brain heartbeat preview aggregates existing candidate-only maintenance previews over memory and source relation state without mutating Memory Core, source truth, source decisions, or worker runtime state.";

const reviewEvalClosureDoesNotProve =
  "Heartbeat preview review/eval closure does not prove candidate truth, review correctness, production usefulness, scheduler readiness, autonomous worker execution, or Memory Core mutation.";

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
  const candidates = [
    ...memoryPreview.candidates,
    ...sourcePreview.candidates
  ];

  return {
    generatedAt: input.now,
    candidates,
    candidateCounts: {
      memoryStaleness: memoryPreview.candidates.length,
      sourceRelation: sourcePreview.candidates.length
    },
    skippedCounts: {
      memoryRecords: memoryPreview.skippedMemoryCount,
      sourceClaimEdges: sourcePreview.skippedEdgeCount
    },
    mutation: "none",
    proof: previewProof,
    doesNotProve: previewDoesNotProve,
    reviewEvalClosure: buildReviewEvalClosure(candidates, input.evidenceRef),
    priorityOrder,
    forbiddenWrites
  };
};
