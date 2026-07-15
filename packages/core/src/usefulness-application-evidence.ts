import type {
  ExecutionRunId,
  ProjectId,
  TaskContractId
} from "./ids.js";
import { z } from "zod";
import { compareTargetPaths } from "./target-path-order.js";
import { isIsoTimestamp } from "./time.js";
import type { IsoTimestamp } from "./time.js";

export const usefulnessApplicationSubjectKinds = [
  "knowledge",
  "source_claim"
] as const;

export const persistedUsefulnessApplicationSubjectKinds = [
  ...usefulnessApplicationSubjectKinds,
  "memory_record",
  "source_decision"
] as const;

export type UsefulnessApplicationSubjectKind =
  typeof usefulnessApplicationSubjectKinds[number];
export type PersistedUsefulnessApplicationSubjectKind =
  typeof persistedUsefulnessApplicationSubjectKinds[number];

export interface UsefulnessApplicationTargetState {
  targetRepo: string;
  treeIdentity: string;
  patchIdentity: string;
  changedFiles: string[];
}

export interface UsefulnessApplicationEvidence {
  applicationId: string;
  subjectKind: PersistedUsefulnessApplicationSubjectKind;
  subjectId: string;
  projectId: ProjectId;
  executionRunId: ExecutionRunId;
  taskContractId: TaskContractId;
  packetChecksum: string;
  packetGeneratedAt: IsoTimestamp;
  sourceRunLifecycleRevision: number;
  targetState?: UsefulnessApplicationTargetState;
  appliedAt: IsoTimestamp;
}

export type UsefulnessApplicationEvidenceIdentity = Omit<
  UsefulnessApplicationEvidence,
  "appliedAt" | "subjectKind"
> & { subjectKind: UsefulnessApplicationSubjectKind };

const packetChecksumPattern = /^[a-f0-9]{64}$/u;
const requiredTextSchema = z.string().trim().min(1);
const isoTimestampSchema = requiredTextSchema.refine(isIsoTimestamp);
const targetStateSchema = z.object({
  targetRepo: requiredTextSchema,
  treeIdentity: requiredTextSchema.regex(/^git-tree:(?:[a-f0-9]{40}|[a-f0-9]{64})$/u),
  patchIdentity: requiredTextSchema.regex(/^sha256:[a-f0-9]{64}$/u),
  changedFiles: z.array(requiredTextSchema).min(1).refine((paths) =>
    new Set(paths).size === paths.length &&
    paths.every((path, index) => index === 0 ||
      compareTargetPaths(paths[index - 1]!, path) < 0),
  "target changed files must be unique and sorted"
  )
});
const usefulnessApplicationEvidenceIdentitySchema = z.object({
  applicationId: requiredTextSchema,
  subjectKind: z.enum(usefulnessApplicationSubjectKinds),
  subjectId: requiredTextSchema,
  projectId: requiredTextSchema,
  executionRunId: requiredTextSchema,
  taskContractId: requiredTextSchema,
  packetChecksum: requiredTextSchema.regex(packetChecksumPattern),
  packetGeneratedAt: isoTimestampSchema,
  sourceRunLifecycleRevision: z.number().int().safe().positive(),
  targetState: targetStateSchema.optional()
});
const usefulnessApplicationEvidenceSchema = usefulnessApplicationEvidenceIdentitySchema.extend({
  subjectKind: z.enum([...usefulnessApplicationSubjectKinds, "memory_record"]),
  appliedAt: isoTimestampSchema
}).refine((evidence) =>
  Date.parse(evidence.appliedAt) >= Date.parse(evidence.packetGeneratedAt),
{
  message: "application cannot precede packet generation",
  path: ["appliedAt"]
});

export const parseUsefulnessApplicationEvidenceIdentity = (
  value: unknown
): UsefulnessApplicationEvidenceIdentity | undefined => {
  const result = usefulnessApplicationEvidenceIdentitySchema.safeParse(value);
  if (!result.success) {
    return undefined;
  }
  const { targetState, ...identity } = result.data;
  return targetState === undefined ? identity : { ...identity, targetState };
};

export const parseUsefulnessApplicationEvidence = (
  value: unknown
): UsefulnessApplicationEvidence | undefined => {
  const result = usefulnessApplicationEvidenceSchema.safeParse(value);
  if (!result.success) {
    return undefined;
  }
  const { targetState, ...evidence } = result.data;
  return targetState === undefined ? evidence : { ...evidence, targetState };
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

const sameTargetState = (
  left: UsefulnessApplicationEvidenceIdentity["targetState"],
  right: UsefulnessApplicationEvidenceIdentity["targetState"]
): boolean => left === undefined || right === undefined
  ? left === right
  : left.targetRepo === right.targetRepo &&
    left.treeIdentity === right.treeIdentity &&
    left.patchIdentity === right.patchIdentity &&
    left.changedFiles.length === right.changedFiles.length &&
    left.changedFiles.every((file, index) => file === right.changedFiles[index]);

export const parseUsefulnessApplicationEvidenceForIdentity = (
  value: unknown,
  expected: UsefulnessApplicationEvidenceIdentity
): UsefulnessApplicationEvidence | undefined => {
  const evidence = parseUsefulnessApplicationEvidence(value);

  return evidence !== undefined && identityFields.every((field) =>
    evidence[field] === expected[field]
  ) && sameTargetState(evidence.targetState, expected.targetState)
    ? evidence
    : undefined;
};
