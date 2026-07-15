import type {
  ExecutionRunId,
  ProjectId,
  TaskContractId
} from "./ids.js";
import { z } from "zod";
import { isIsoTimestamp } from "./time.js";
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
const requiredTextSchema = z.string().trim().min(1);
const isoTimestampSchema = requiredTextSchema.refine(isIsoTimestamp);
const usefulnessApplicationEvidenceIdentitySchema = z.object({
  applicationId: requiredTextSchema,
  subjectKind: z.enum(usefulnessApplicationSubjectKinds),
  subjectId: requiredTextSchema,
  projectId: requiredTextSchema,
  executionRunId: requiredTextSchema,
  taskContractId: requiredTextSchema,
  packetChecksum: requiredTextSchema.regex(packetChecksumPattern),
  packetGeneratedAt: isoTimestampSchema,
  sourceRunLifecycleRevision: z.number().int().safe().positive()
});
const usefulnessApplicationEvidenceSchema = usefulnessApplicationEvidenceIdentitySchema.extend({
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
  return result.success ? result.data : undefined;
};

export const parseUsefulnessApplicationEvidence = (
  value: unknown
): UsefulnessApplicationEvidence | undefined => {
  const result = usefulnessApplicationEvidenceSchema.safeParse(value);
  return result.success ? result.data : undefined;
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
