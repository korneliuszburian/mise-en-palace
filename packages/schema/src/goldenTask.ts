import { z } from "zod";
import {
  MetadataSchema,
  NonEmptyTextListSchema,
  OptionalTextSchema,
  RequiredTextSchema,
  privateReasoningMetadataKeys,
  rejectForbiddenMetadataKeys
} from "./schemaPrimitives.js";

const forbiddenMetadataKeys = new Set([
  ...privateReasoningMetadataKeys,
  "hiddenReasoning",
  "hidden_reasoning"
]);

const rejectForbiddenMetadata = (
  value: Record<string, unknown>,
  context: z.RefinementCtx
): void => {
  rejectForbiddenMetadataKeys(value, context, {
    keys: forbiddenMetadataKeys,
    message: "golden task metadata cannot store private reasoning"
  });
};

export const GoldenTaskStatusSchema = z.enum(["draft", "active", "deprecated"]);

export const GoldenBehaviorDomainSchema = z.enum([
  "memory",
  "context",
  "source",
  "observation",
  "reflection",
  "anti_memory",
  "audit",
  "type_boundary",
  "capability"
]);

export const ExpectedBehaviorOutcomeSchema = z.enum([
  "include",
  "exclude",
  "abstain",
  "flag",
  "rank",
  "persist",
  "reject"
]);

export const ProtectedFailureSeveritySchema = z.enum([
  "advisory",
  "warning",
  "blocking"
]);

export const ExpectedBehaviorSchema = z.object({
  outcome: ExpectedBehaviorOutcomeSchema,
  subject: RequiredTextSchema,
  rationale: RequiredTextSchema,
  evidenceRefs: NonEmptyTextListSchema
});

export const ProtectedFailureModeSchema = z.object({
  id: RequiredTextSchema,
  domain: GoldenBehaviorDomainSchema,
  severity: ProtectedFailureSeveritySchema,
  title: RequiredTextSchema,
  mustNot: RequiredTextSchema,
  detection: RequiredTextSchema
});

export const GoldenCaseSchema = z
  .object({
    id: RequiredTextSchema,
    title: RequiredTextSchema,
    input: z.object({}).catchall(z.unknown()).default({}),
    expectedBehavior: ExpectedBehaviorSchema,
    protectedFailureModes: z.array(ProtectedFailureModeSchema).min(1),
    sourceRefs: NonEmptyTextListSchema,
    metadata: MetadataSchema
  })
  .superRefine((value, context) => {
    rejectForbiddenMetadata(value.metadata, context);
  });

export const GoldenTaskSchema = z
  .object({
    id: RequiredTextSchema,
    projectId: OptionalTextSchema,
    status: GoldenTaskStatusSchema,
    title: RequiredTextSchema,
    description: RequiredTextSchema,
    owner: RequiredTextSchema,
    domains: z.array(GoldenBehaviorDomainSchema).min(1),
    cases: z.array(GoldenCaseSchema).min(1),
    metadata: MetadataSchema,
    createdAt: RequiredTextSchema,
    updatedAt: RequiredTextSchema
  })
  .superRefine((value, context) => {
    rejectForbiddenMetadata(value.metadata, context);
  });

export type GoldenTaskFixture = z.infer<typeof GoldenTaskSchema>;

const byId = <T extends { id: string }>(left: T, right: T): number =>
  left.id.localeCompare(right.id);

const sortGoldenTask = (task: GoldenTaskFixture): GoldenTaskFixture => ({
  ...task,
  cases: [...task.cases]
    .sort(byId)
    .map((goldenCase) => ({
      ...goldenCase,
      protectedFailureModes: [...goldenCase.protectedFailureModes].sort(byId)
    }))
});

export const parseGoldenTaskFixtures = (input: unknown): GoldenTaskFixture[] =>
  z.array(GoldenTaskSchema)
    .min(1)
    .parse(input)
    .map(sortGoldenTask)
    .sort(byId);
