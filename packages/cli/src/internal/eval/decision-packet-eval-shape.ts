import type {
  DecisionPacket
} from "@krn/core";

export type DecisionPacketStatus = "pass" | "fail";
export type PacketQualityLabel = "useful" | "noisy" | "stale_authority" | "miss";
export type NotesBaselineLabel = "usable" | "unsafe" | "miss";
export type BaselineComparisonOutcome = "krn_win" | "notes_win" | "tie";

export interface NotesBaselineResult {
  readonly qualityLabel: NotesBaselineLabel;
  readonly topDecisionIds: readonly string[];
  readonly unsafeDecisionIds: readonly string[];
  readonly failureRationale: string;
}

export interface DecisionPacketScoreBreakdown {
  readonly taskUsefulness: number;
  readonly evidenceFidelity: number;
  readonly temporalCorrectness: number;
  readonly rejectionRecall: number;
  readonly nonProofBoundaries: number;
  readonly total: number;
}

export interface DecisionPacketEvalCaseReadback {
  readonly id: string;
  readonly task: string;
  readonly expectedDecisionId: string;
  readonly expectedStaleDecisionIds: readonly string[];
  readonly expectedRejectedDecisionIds: readonly string[];
  readonly qualityLabel: PacketQualityLabel;
  readonly scores: DecisionPacketScoreBreakdown;
  readonly notesBaseline: NotesBaselineResult;
  readonly comparisonOutcome: BaselineComparisonOutcome;
  readonly status: DecisionPacketStatus;
  readonly reasons: readonly string[];
  readonly packet: DecisionPacket;
}

export interface DecisionPacketEvalResult {
  readonly kind: "krn.decisionPacket.eval.v1";
  readonly fixtureVersion: "1";
  readonly status: DecisionPacketStatus;
  readonly thresholds: {
    readonly minimumUsefulRate: number;
    readonly minimumKrnWinRate: number;
    readonly maximumNotesWinRate: number;
    readonly maximumSevereStaleAuthorityInclusions: number;
    readonly maximumAverageNoiseDecisions: number;
  };
  readonly metrics: {
    readonly caseCount: number;
    readonly usefulCount: number;
    readonly noisyCount: number;
    readonly missCount: number;
    readonly staleAuthorityCount: number;
    readonly notesUsableCount: number;
    readonly notesUnsafeCount: number;
    readonly notesMissCount: number;
    readonly krnWinCount: number;
    readonly notesWinCount: number;
    readonly tieCount: number;
    readonly decisiveComparisonCount: number;
    readonly usefulRate: number;
    readonly krnWinRate: number;
    readonly notesWinRate: number;
    readonly averageNoiseDecisions: number;
    readonly severeStaleAuthorityInclusions: number;
  };
  readonly cases: readonly DecisionPacketEvalCaseReadback[];
  readonly proof: {
    readonly proves: readonly string[];
    readonly doesNotProve: readonly string[];
  };
}

export const decisionPacketCaseStatus = (
  qualityLabel: PacketQualityLabel
): DecisionPacketStatus => qualityLabel === "useful" ? "pass" : "fail";

export const isPassingDecisionPacketCase = (
  testCase: DecisionPacketEvalCaseReadback
): boolean => testCase.status === "pass";

export const comparePacketAgainstNotesBaseline = (
  packetLabel: PacketQualityLabel,
  notesBaselineLabel: NotesBaselineLabel
): BaselineComparisonOutcome => {
  const packetUseful = packetLabel === "useful";
  const notesUsable = notesBaselineLabel === "usable";

  if (packetUseful && !notesUsable) {
    return "krn_win";
  }

  if (!packetUseful && notesUsable) {
    return "notes_win";
  }

  return "tie";
};
