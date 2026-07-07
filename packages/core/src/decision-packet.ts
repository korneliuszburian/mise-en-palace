export const decisionPacketFormatVersion = "krn.decisionPacket.v1" as const;

export type DecisionPacketFormatVersion = typeof decisionPacketFormatVersion;

export interface DecisionPacketBriefSummary {
  includedContextCount: number;
  observationPrefixCount: number;
  explicitExclusionCount: number;
  sourceClaimUseCount: number;
  memoryRecordUseCount: number;
}

export interface DecisionPacket {
  formatVersion: DecisionPacketFormatVersion;
  governingDecisionIds: readonly string[];
  governingStatements: readonly string[];
  sourceClaimIds: readonly string[];
  caveatedSourceClaimIds: readonly string[];
  sourceDecisionEdgeIds: readonly string[];
  sourceRejectionIds: readonly string[];
  memoryRefs: readonly string[];
  staleDecisionIds: readonly string[];
  rejectedPathIds: readonly string[];
  falsifiers: readonly string[];
  doesNotProve: readonly string[];
  nonProofs: readonly string[];
  noiseDecisionIds: readonly string[];
  severeStaleAuthorityIds: readonly string[];
  brief: DecisionPacketBriefSummary;
}
