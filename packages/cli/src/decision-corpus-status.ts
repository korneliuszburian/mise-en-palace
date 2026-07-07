import {
  stringValue
} from "./fixture-parse-support.js";

export type DecisionCorpusStatus = "current" | "stale" | "rejected";

export interface DecisionCorpusBaseRow {
  readonly id: string;
  readonly title: string;
  readonly statement: string;
  readonly status: DecisionCorpusStatus;
  readonly evidenceRef: string;
  readonly falsifier: string;
  readonly doesNotProve: string;
}

const decisionCorpusStatuses = new Set<DecisionCorpusStatus>([
  "current",
  "stale",
  "rejected"
]);

const parseDecisionCorpusStatus = (
  value: unknown,
  label: string
): DecisionCorpusStatus => {
  const status = stringValue(value, label);

  if (!decisionCorpusStatuses.has(status as DecisionCorpusStatus)) {
    throw new Error(`${label} must be current, stale, or rejected`);
  }

  return status as DecisionCorpusStatus;
};

export const parseDecisionCorpusBaseRow = (
  value: Record<string, unknown>,
  index: number
): DecisionCorpusBaseRow => ({
  id: stringValue(value["id"], `decisions[${index}].id`),
  title: stringValue(value["title"], `decisions[${index}].title`),
  statement: stringValue(value["statement"], `decisions[${index}].statement`),
  status: parseDecisionCorpusStatus(value["status"], `decisions[${index}].status`),
  evidenceRef: stringValue(value["evidenceRef"], `decisions[${index}].evidenceRef`),
  falsifier: stringValue(value["falsifier"], `decisions[${index}].falsifier`),
  doesNotProve: stringValue(value["doesNotProve"], `decisions[${index}].doesNotProve`)
});
