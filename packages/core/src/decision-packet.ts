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

const unique = (values: readonly string[]): string[] => [...new Set(values)];

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
  doesNotProve: readonly string[];
  nonProofs: readonly string[];
  noiseDecisionIds: readonly string[];
  severeStaleAuthorityIds: readonly string[];
  brief: DecisionPacketBriefSummary;
}
