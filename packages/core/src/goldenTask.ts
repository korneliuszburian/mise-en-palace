import type {
  GoldenCaseId,
  GoldenTaskId,
  ProjectId,
  ProtectedFailureModeId
} from "./ids.js";
import type { IsoTimestamp } from "./time.js";

export type GoldenTaskStatus = "draft" | "active" | "deprecated";

export type GoldenBehaviorDomain =
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
  domain: GoldenBehaviorDomain;
  severity: ProtectedFailureSeverity;
  title: string;
  mustNot: string;
  detection: string;
}

export interface GoldenCase {
  id: GoldenCaseId;
  title: string;
  input: Record<string, unknown>;
  expectedBehavior: ExpectedBehavior;
  protectedFailureModes: ProtectedFailureMode[];
  sourceRefs: string[];
  metadata: Record<string, unknown>;
}

export interface GoldenTask {
  id: GoldenTaskId;
  projectId?: ProjectId;
  status: GoldenTaskStatus;
  title: string;
  description: string;
  owner: string;
  domains: GoldenBehaviorDomain[];
  cases: GoldenCase[];
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

const forbiddenMetadataKeys = new Set([
  "chainOfThought",
  "chain_of_thought",
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

const validateCase = (goldenCase: GoldenCase): string[] => {
  const findings: string[] = [];
  const prefix = `case ${goldenCase.id}`;

  if (isBlank(goldenCase.title)) {
    findings.push(`${prefix} title is required`);
  }

  if (isBlank(goldenCase.expectedBehavior.subject)) {
    findings.push(`${prefix} expectedBehavior.subject is required`);
  }

  if (isBlank(goldenCase.expectedBehavior.rationale)) {
    findings.push(`${prefix} expectedBehavior.rationale is required`);
  }

  if (goldenCase.expectedBehavior.evidenceRefs.length === 0) {
    findings.push(`${prefix} expectedBehavior.evidenceRefs are required`);
  }

  if (goldenCase.protectedFailureModes.length === 0) {
    findings.push(`${prefix} protectedFailureModes are required`);
  }

  if (goldenCase.sourceRefs.length === 0) {
    findings.push(`${prefix} sourceRefs are required`);
  }

  findings.push(...validateMetadata(goldenCase.metadata, `${prefix}.metadata`));

  for (const failureMode of goldenCase.protectedFailureModes) {
    if (isBlank(failureMode.title)) {
      findings.push(`${prefix} failureMode ${failureMode.id} title is required`);
    }

    if (isBlank(failureMode.mustNot)) {
      findings.push(`${prefix} failureMode ${failureMode.id} mustNot is required`);
    }

    if (isBlank(failureMode.detection)) {
      findings.push(`${prefix} failureMode ${failureMode.id} detection is required`);
    }
  }

  return findings;
};

export const validateGoldenTaskContract = (task: GoldenTask): string[] => {
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
