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
    message: "behavior fixture metadata cannot store private reasoning"
  });
};

export const BehaviorFixtureStatusSchema = z.enum(["draft", "active", "deprecated"]);

export const BehaviorFixtureDomainSchema = z.enum([
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
  domain: BehaviorFixtureDomainSchema,
  severity: ProtectedFailureSeveritySchema,
  title: RequiredTextSchema,
  mustNot: RequiredTextSchema,
  detection: RequiredTextSchema
});

const BehaviorFixtureCaseShapeSchema = z.object({
    id: RequiredTextSchema,
    title: RequiredTextSchema,
    input: z.object({}).catchall(z.unknown()).default({}),
    expectedBehavior: ExpectedBehaviorSchema,
    protectedFailureModes: z.array(ProtectedFailureModeSchema).min(1),
    sourceRefs: NonEmptyTextListSchema,
    metadata: MetadataSchema
});

export const BehaviorFixtureCaseSchema = BehaviorFixtureCaseShapeSchema.superRefine(
  (
    value: z.infer<typeof BehaviorFixtureCaseShapeSchema>,
    context: z.RefinementCtx
  ) => {
    rejectForbiddenMetadata(value.metadata, context);
  });

const BehaviorFixtureShapeSchema = z.object({
    id: RequiredTextSchema,
    projectId: OptionalTextSchema,
    status: BehaviorFixtureStatusSchema,
    title: RequiredTextSchema,
    description: RequiredTextSchema,
    owner: RequiredTextSchema,
    domains: z.array(BehaviorFixtureDomainSchema).min(1),
    cases: z.array(BehaviorFixtureCaseSchema).min(1),
    metadata: MetadataSchema,
    createdAt: RequiredTextSchema,
    updatedAt: RequiredTextSchema
});

export const BehaviorFixtureSchema = BehaviorFixtureShapeSchema.superRefine(
  (value: z.infer<typeof BehaviorFixtureShapeSchema>, context: z.RefinementCtx) => {
    rejectForbiddenMetadata(value.metadata, context);
  });

export type BehaviorFixtureInput = z.infer<typeof BehaviorFixtureSchema>;

const byId = <T extends { id: string }>(left: T, right: T): number =>
  left.id.localeCompare(right.id);

const sortBehaviorFixture = (task: BehaviorFixtureInput): BehaviorFixtureInput => ({
  ...task,
  cases: [...task.cases]
    .sort(byId)
    .map((behaviorCase) => ({
      ...behaviorCase,
      protectedFailureModes: [...behaviorCase.protectedFailureModes].sort(byId)
    }))
});

export const parseBehaviorFixtures = (input: unknown): BehaviorFixtureInput[] =>
  z.array(BehaviorFixtureSchema)
    .min(1)
    .parse(input)
    .map(sortBehaviorFixture)
    .sort(byId);
