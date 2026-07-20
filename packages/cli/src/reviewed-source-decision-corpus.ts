import {
  assertUniqueIds,
  isRecord,
  recordArray,
  stringArrayValue,
  stringValue
} from "./fixture-parse-support.js";
import {
  parseDecisionCorpusBaseRow,
  type DecisionCorpusStatus
} from "./decision-corpus-status.js";
import type {
  SourceCoverageScope
} from "./source-coverage.js";

export interface ReviewedSourceDecisionRow {
  readonly id: string;
  readonly title: string;
  readonly statement: string;
  readonly status: DecisionCorpusStatus;
  readonly taskScopes: readonly string[];
  readonly evidenceRef: string;
  readonly falsifier: string;
  readonly doesNotProve: string;
  readonly noteText: string;
}

export interface ReviewedSourceDecisionCorpus {
  readonly version: "1";
  readonly corpusName: string;
  readonly coverageScope?: SourceCoverageScope;
  readonly decisions: readonly ReviewedSourceDecisionRow[];
}

const parseDecision = (
  value: Record<string, unknown>,
  index: number
): ReviewedSourceDecisionRow => ({
  ...parseDecisionCorpusBaseRow(value, index),
  taskScopes: value["taskScopes"] === undefined
    ? []
    : stringArrayValue(value["taskScopes"], `decisions[${index}].taskScopes`),
  noteText: stringValue(value["noteText"], `decisions[${index}].noteText`)
});

const parseCoverageScope = (
  value: unknown
): SourceCoverageScope | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (!isRecord(value)) {
    throw new Error("coverageScope must be an object");
  }

  const declaredRows = recordArray(value["declaredRows"], "coverageScope.declaredRows")
    .map((row, index) => ({
      decisionId: stringValue(row["decisionId"], `coverageScope.declaredRows[${index}].decisionId`),
      evidenceRefs: stringArrayValue(
        row["evidenceRefs"],
        `coverageScope.declaredRows[${index}].evidenceRefs`
      )
    }));

  assertUniqueIds(declaredRows.map((row) => row.decisionId), "coverage scope rows");

  return { declaredRows };
};

export const parseReviewedSourceDecisionCorpus = (
  value: unknown
): ReviewedSourceDecisionCorpus => {
  if (!isRecord(value)) {
    throw new Error("reviewed source decision corpus must be an object");
  }

  if (value["version"] !== "1") {
    throw new Error("reviewed source decision corpus version must be 1");
  }

  const decisions = recordArray(value["decisions"], "decisions").map(parseDecision);
  const coverageScope = parseCoverageScope(value["coverageScope"]);

  assertUniqueIds(decisions.map((decision) => decision.id), "reviewed source decisions");

  return {
    version: "1",
    corpusName: stringValue(value["corpusName"], "corpusName"),
    ...(coverageScope === undefined ? {} : { coverageScope }),
    decisions
  };
};
