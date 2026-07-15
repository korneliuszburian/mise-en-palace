import type {
  ExecutionRunId,
  ProjectId,
  TaskContractId
} from "./ids.js";
import {
  isIsoTimestamp,
  parseTimestampMs
} from "./time.js";
import type { IsoTimestamp } from "./time.js";

export const usefulnessApplicationSubjectKinds = [
  "knowledge",
  "source_claim",
  "source_decision"
] as const;

export type UsefulnessApplicationSubjectKind =
  typeof usefulnessApplicationSubjectKinds[number];

export interface UsefulnessApplicationEvidence {
  applicationId: string;
  subjectKind: UsefulnessApplicationSubjectKind;
  subjectId: string;
  projectId: ProjectId;
  executionRunId: ExecutionRunId;
  taskContractId: TaskContractId;
  packetChecksum: string;
  packetGeneratedAt: IsoTimestamp;
  sourceRunLifecycleRevision: number;
  appliedAt: IsoTimestamp;
}

export type UsefulnessApplicationEvidenceIdentity = Omit<
  UsefulnessApplicationEvidence,
  "appliedAt"
>;

const packetChecksumPattern = /^[a-f0-9]{64}$/u;
const usefulnessApplicationSubjectKindSet = new Set<string>(
  usefulnessApplicationSubjectKinds
);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const requiredText = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const text = value.trim();
  return text.length === 0 ? undefined : text;
};

const isUsefulnessApplicationSubjectKind = (
  value: string
): value is UsefulnessApplicationSubjectKind =>
  usefulnessApplicationSubjectKindSet.has(value);

export const parseUsefulnessApplicationEvidence = (
  value: unknown
): UsefulnessApplicationEvidence | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const applicationId = requiredText(value.applicationId);
  const subjectKind = requiredText(value.subjectKind);
  const subjectId = requiredText(value.subjectId);
  const projectId = requiredText(value.projectId);
  const executionRunId = requiredText(value.executionRunId);
  const taskContractId = requiredText(value.taskContractId);
  const packetChecksum = requiredText(value.packetChecksum);
  const packetGeneratedAt = requiredText(value.packetGeneratedAt);
  const appliedAt = requiredText(value.appliedAt);
  const sourceRunLifecycleRevision = value.sourceRunLifecycleRevision;

  if (
    applicationId === undefined ||
    subjectKind === undefined ||
    !isUsefulnessApplicationSubjectKind(subjectKind) ||
    subjectId === undefined ||
    projectId === undefined ||
    executionRunId === undefined ||
    taskContractId === undefined ||
    packetChecksum === undefined ||
    !packetChecksumPattern.test(packetChecksum) ||
    packetGeneratedAt === undefined ||
    !isIsoTimestamp(packetGeneratedAt) ||
    appliedAt === undefined ||
    !isIsoTimestamp(appliedAt) ||
    typeof sourceRunLifecycleRevision !== "number" ||
    !Number.isSafeInteger(sourceRunLifecycleRevision) ||
    sourceRunLifecycleRevision < 1
  ) {
    return undefined;
  }

  const packetGeneratedAtMs = parseTimestampMs(packetGeneratedAt);
  const appliedAtMs = parseTimestampMs(appliedAt);

  if (
    packetGeneratedAtMs === undefined ||
    appliedAtMs === undefined ||
    appliedAtMs < packetGeneratedAtMs
  ) {
    return undefined;
  }

  return {
    applicationId,
    subjectKind,
    subjectId,
    projectId,
    executionRunId,
    taskContractId,
    packetChecksum,
    packetGeneratedAt,
    sourceRunLifecycleRevision,
    appliedAt
  };
};

const identityFields = [
  "applicationId",
  "subjectKind",
  "subjectId",
  "projectId",
  "executionRunId",
  "taskContractId",
  "packetChecksum",
  "packetGeneratedAt",
  "sourceRunLifecycleRevision"
] as const satisfies readonly (keyof UsefulnessApplicationEvidenceIdentity)[];

export const parseUsefulnessApplicationEvidenceForIdentity = (
  value: unknown,
  expected: UsefulnessApplicationEvidenceIdentity
): UsefulnessApplicationEvidence | undefined => {
  const evidence = parseUsefulnessApplicationEvidence(value);

  return evidence !== undefined && identityFields.every((field) =>
    evidence[field] === expected[field]
  )
    ? evidence
    : undefined;
};
