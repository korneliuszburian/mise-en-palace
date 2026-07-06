import type {
  GoldenCaseId,
  GoldenTaskId,
  ProjectId,
  ProtectedFailureModeId
} from "./ids.js";
import type { IsoTimestamp } from "./time.js";

export type BehaviorFixtureStatus = "draft" | "active" | "deprecated";

export type BehaviorFixtureDomain =
  | "memory"
  | "context"
  | "source"
  | "observation"
  | "reflection"
  | "anti_memory"
  | "audit"
  | "type_boundary"
  | "capability";

export type ExpectedBehaviorOutcome =
  | "include"
  | "exclude"
  | "abstain"
  | "flag"
  | "rank"
  | "persist"
  | "reject";

export type ProtectedFailureSeverity = "advisory" | "warning" | "blocking";

export interface ExpectedBehavior {
  outcome: ExpectedBehaviorOutcome;
  subject: string;
  rationale: string;
  evidenceRefs: string[];
}

export interface ProtectedFailureMode {
  id: ProtectedFailureModeId;
  domain: BehaviorFixtureDomain;
  severity: ProtectedFailureSeverity;
  title: string;
  mustNot: string;
  detection: string;
}

export interface BehaviorFixtureCase {
  id: GoldenCaseId;
  title: string;
  input: Record<string, unknown>;
  expectedBehavior: ExpectedBehavior;
  protectedFailureModes: ProtectedFailureMode[];
  sourceRefs: string[];
  metadata: Record<string, unknown>;
}

/**
 * Offline behavior fixture contract.
 *
 * A BehaviorFixture is not a live pipeline row and does not claim linkage to
 * TaskContract, HarnessPlan, or ExecutionRun by itself. It constrains KRN
 * behavior only when a runner supplies accepted `krn_behavior_execution` proof
 * for its cases.
 */
export interface BehaviorFixture {
  id: GoldenTaskId;
  projectId?: ProjectId;
  status: BehaviorFixtureStatus;
  title: string;
  description: string;
  owner: string;
  domains: BehaviorFixtureDomain[];
  cases: BehaviorFixtureCase[];
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

const forbiddenMetadataKeys = new Set([
  "chainOfThought",
  "chain_of_thought",
  "reasoningTrace",
  "reasoning_trace",
  "privateReasoning",
  "private_reasoning",
  "hiddenReasoning",
  "hidden_reasoning"
]);

const isBlank = (value: string): boolean => value.trim().length === 0;

const validateMetadata = (
  metadata: Record<string, unknown>,
  path: string
): string[] =>
  Object.keys(metadata).flatMap((key) =>
    forbiddenMetadataKeys.has(key)
      ? [`${path}.${key} is forbidden`]
      : []
  );

const requiredCaseFinding = (
  condition: boolean,
  finding: string
): string[] => condition ? [finding] : [];

const validateExpectedBehavior = (
  expectedBehavior: ExpectedBehavior,
  prefix: string
): string[] => [
  ...requiredCaseFinding(
    isBlank(expectedBehavior.subject),
    `${prefix} expectedBehavior.subject is required`
  ),
  ...requiredCaseFinding(
    isBlank(expectedBehavior.rationale),
    `${prefix} expectedBehavior.rationale is required`
  ),
  ...requiredCaseFinding(
    expectedBehavior.evidenceRefs.length === 0,
    `${prefix} expectedBehavior.evidenceRefs are required`
  )
];

const validateFailureMode = (
  failureMode: ProtectedFailureMode,
  prefix: string
): string[] => [
  ...requiredCaseFinding(
    isBlank(failureMode.title),
    `${prefix} failureMode ${failureMode.id} title is required`
  ),
  ...requiredCaseFinding(
    isBlank(failureMode.mustNot),
    `${prefix} failureMode ${failureMode.id} mustNot is required`
  ),
  ...requiredCaseFinding(
    isBlank(failureMode.detection),
    `${prefix} failureMode ${failureMode.id} detection is required`
  )
];

const validateCaseRequiredCollections = (
  behaviorCase: BehaviorFixtureCase,
  prefix: string
): string[] => [
  ...requiredCaseFinding(
    behaviorCase.protectedFailureModes.length === 0,
    `${prefix} protectedFailureModes are required`
  ),
  ...requiredCaseFinding(
    behaviorCase.sourceRefs.length === 0,
    `${prefix} sourceRefs are required`
  )
];

const validateCase = (behaviorCase: BehaviorFixtureCase): string[] => {
  const findings: string[] = [];
  const prefix = `case ${behaviorCase.id}`;

  if (isBlank(behaviorCase.title)) {
    findings.push(`${prefix} title is required`);
  }

  findings.push(...validateExpectedBehavior(behaviorCase.expectedBehavior, prefix));
  findings.push(...validateCaseRequiredCollections(behaviorCase, prefix));
  findings.push(...validateMetadata(behaviorCase.metadata, `${prefix}.metadata`));

  for (const failureMode of behaviorCase.protectedFailureModes) {
    findings.push(...validateFailureMode(failureMode, prefix));
  }

  return findings;
};

export const validateBehaviorFixture = (task: BehaviorFixture): string[] => {
  const findings: string[] = [];

  if (isBlank(task.title)) {
    findings.push("title is required");
  }

  if (isBlank(task.description)) {
    findings.push("description is required");
  }

  if (isBlank(task.owner)) {
    findings.push("owner is required");
  }

  if (task.domains.length === 0) {
    findings.push("domains are required");
  }

  if (task.cases.length === 0) {
    findings.push("cases are required");
  }

  findings.push(...validateMetadata(task.metadata, "metadata"));
  findings.push(...task.cases.flatMap(validateCase));

  return findings;
};
