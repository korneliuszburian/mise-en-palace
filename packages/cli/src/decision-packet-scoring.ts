import {
  tokenOverlapScore
} from "./eval-text-scoring.js";

export type DecisionPacketScoringStatus = "current" | "stale" | "rejected";

export interface DecisionPacketScoringRow {
  readonly id: string;
  readonly title: string;
  readonly statement: string;
  readonly status: DecisionPacketScoringStatus;
}

export interface RankedDecisionPacketRow {
  readonly id: string;
  readonly score: number;
  readonly status: DecisionPacketScoringStatus;
}

const decisionStatusScore = (
  status: DecisionPacketScoringStatus
): number => {
  switch (status) {
    case "current":
      return 30;
    case "rejected":
      return -200;
    case "stale":
      return -200;
  }
};

export const rankDecisionRows = <Decision extends DecisionPacketScoringRow>(
  decisions: readonly Decision[],
  task: string
): readonly RankedDecisionPacketRow[] =>
  decisions
    .map((decision) => ({
      id: decision.id,
      score: tokenOverlapScore(task, `${decision.title} ${decision.statement}`) +
        decisionStatusScore(decision.status),
      status: decision.status
    }))
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id));
