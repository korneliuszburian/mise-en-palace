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

const priorityOrder = ["memory_staleness", "source_relation"] as const;

const previewDoesNotProve =
  "Brain heartbeat preview does not prove memory truth, source truth, candidate usefulness, autonomous worker execution, scheduling, consensus correctness, or Memory Core mutation.";

const previewProof =
  "Brain heartbeat preview aggregates existing candidate-only maintenance previews over memory and source relation state without mutating Memory Core, source truth, source decisions, or worker runtime state.";

const remainingBudget = (
  maxCandidates: number | undefined,
  alreadySelected: number
): number | undefined => {
  if (maxCandidates === undefined) {
    return undefined;
  }

  return Math.max(0, maxCandidates - alreadySelected);
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
    priorityOrder,
    forbiddenWrites
  };
};
