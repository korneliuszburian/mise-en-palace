export const decisionPacketFormatVersion = "krn.decisionPacket.v1" as const;

export type DecisionPacketFormatVersion = typeof decisionPacketFormatVersion;

export interface DecisionPacketBriefSummary {
  includedContextCount: number;
  observationPrefixCount: number;
  explicitExclusionCount: number;
  sourceClaimUseCount: number;
  memoryRecordUseCount: number;
}

export interface DecisionPacketEvidenceGap {
  id: string;
  reason: string;
  verificationRequired: string;
}

export interface DecisionPacketTaskStandard {
  memoryRecordId: string;
  key: string;
  sourceRefs: readonly string[];
  mechanism: string;
  krnImplication: string;
  decision: string;
  consumer: string;
  falsifier: string;
  validFrom: string;
  validUntil?: string;
  rejectedPath?: string;
  doesNotProve: string;
}

export interface DecisionPacketSourceConsensus {
  decisionLinkedSourceClaimIds: readonly string[];
  caveatedSourceClaimIds: readonly string[];
  sourceDecisionEdgeIds: readonly string[];
  staleDecisionIds: readonly string[];
  rejectedPathIds: readonly string[];
  sourceRejectionIds: readonly string[];
  conflictedDecisionIds: readonly string[];
  evidenceGapIds: readonly string[];
  doesNotProve: string;
}

export type DecisionPacketAbstentionStatus =
  | "ready"
  | "weak_context"
  | "abstain";

export type DecisionPacketAbstentionReason =
  | "missing_governing_decision"
  | "missing_decision_linked_source"
  | "caveated_source_authority"
  | "stale_authority"
  | "missing_rejected_path_evidence"
  | "evidence_gap";

export interface DecisionPacketAbstentionScore {
  status: DecisionPacketAbstentionStatus;
  score: number;
  reasons: readonly DecisionPacketAbstentionReason[];
  evidenceGapIds: readonly string[];
  doesNotProve: string;
}

const unique = <T extends string>(values: readonly T[]): T[] => [...new Set(values)];

export const buildDecisionPacketSourceConsensus = (input: {
  readonly sourceClaimIds: readonly string[];
  readonly caveatedSourceClaimIds: readonly string[];
  readonly sourceDecisionEdgeIds: readonly string[];
  readonly staleDecisionIds: readonly string[];
  readonly rejectedPathIds: readonly string[];
  readonly sourceRejectionIds: readonly string[];
  readonly conflictedDecisionIds: readonly string[];
  readonly evidenceGapIds: readonly string[];
}): DecisionPacketSourceConsensus => {
  const caveatedSourceClaimIds = new Set(input.caveatedSourceClaimIds);

  return {
    decisionLinkedSourceClaimIds: unique(input.sourceClaimIds.filter((sourceClaimId) =>
      !caveatedSourceClaimIds.has(sourceClaimId)
    )),
    caveatedSourceClaimIds: unique(input.caveatedSourceClaimIds),
    sourceDecisionEdgeIds: unique(input.sourceDecisionEdgeIds),
    staleDecisionIds: unique(input.staleDecisionIds),
    rejectedPathIds: unique(input.rejectedPathIds),
    sourceRejectionIds: unique(input.sourceRejectionIds),
    conflictedDecisionIds: unique(input.conflictedDecisionIds),
    evidenceGapIds: unique(input.evidenceGapIds),
    doesNotProve:
      "DecisionPacket source consensus summarizes selected packet signals; it does not prove source truth, complete graph consensus, or repository-wide conflict resolution."
  };
};

const scoreFloor = (value: number): number => Math.max(0, value);

export const buildDecisionPacketAbstentionScore = (input: {
  readonly governingDecisionIds: readonly string[];
  readonly sourceConsensus: DecisionPacketSourceConsensus;
}): DecisionPacketAbstentionScore => {
  const reasons: DecisionPacketAbstentionReason[] = [];
  let score = 100;

  if (input.governingDecisionIds.length === 0) {
    reasons.push("missing_governing_decision");
    score -= 60;
  }

  if (input.sourceConsensus.evidenceGapIds.length > 0) {
    reasons.push("evidence_gap");
    score -= 40;
  }

  if (
    input.governingDecisionIds.length > 0 &&
    input.sourceConsensus.decisionLinkedSourceClaimIds.length === 0
  ) {
    reasons.push("missing_decision_linked_source");
    score -= 35;
  }

  if (input.sourceConsensus.caveatedSourceClaimIds.length > 0) {
    reasons.push("caveated_source_authority");
    score -= 20;
  }

  if (input.sourceConsensus.conflictedDecisionIds.length > 0) {
    reasons.push("stale_authority");
    score -= 35;
  }

  if (
    input.governingDecisionIds.length > 0 &&
    input.sourceConsensus.rejectedPathIds.length === 0 &&
    input.sourceConsensus.sourceRejectionIds.length === 0
  ) {
    reasons.push("missing_rejected_path_evidence");
    score -= 10;
  }

  const boundedScore = scoreFloor(score);
  const status: DecisionPacketAbstentionStatus =
    reasons.includes("missing_governing_decision") ||
    reasons.includes("evidence_gap") ||
    reasons.includes("missing_decision_linked_source")
      ? "abstain"
      : reasons.length > 0
        ? "weak_context"
        : "ready";

  return {
    status,
    score: boundedScore,
    reasons: unique(reasons),
    evidenceGapIds: input.sourceConsensus.evidenceGapIds,
    doesNotProve:
      "DecisionPacket abstention score is a deterministic packet-readiness signal; it does not prove source truth, live Codex obedience, or that missing rejected paths are required for every task."
  };
};

export interface DecisionPacket {
  formatVersion: DecisionPacketFormatVersion;
  governingDecisionIds: readonly string[];
  governingStatements: readonly string[];
  taskStandardDecisions: readonly DecisionPacketTaskStandard[];
  sourceClaimIds: readonly string[];
  caveatedSourceClaimIds: readonly string[];
  sourceDecisionEdgeIds: readonly string[];
  sourceRejectionIds: readonly string[];
  memoryRefs: readonly string[];
  staleDecisionIds: readonly string[];
  rejectedPathIds: readonly string[];
  falsifiers: readonly string[];
  verificationCommands: readonly string[];
  evidenceGaps: readonly DecisionPacketEvidenceGap[];
  sourceConsensus: DecisionPacketSourceConsensus;
  abstentionScore: DecisionPacketAbstentionScore;
  doesNotProve: readonly string[];
  nonProofs: readonly string[];
  noiseDecisionIds: readonly string[];
  severeStaleAuthorityIds: readonly string[];
  brief: DecisionPacketBriefSummary;
}
