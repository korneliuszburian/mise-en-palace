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
  doesNotProve: readonly string[];
  nonProofs: readonly string[];
  noiseDecisionIds: readonly string[];
  severeStaleAuthorityIds: readonly string[];
  brief: DecisionPacketBriefSummary;
}
