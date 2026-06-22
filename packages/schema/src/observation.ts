import { z } from "zod";

const MetadataSchema = z.object({}).catchall(z.unknown()).default({});
const RequiredTextSchema = z.string().trim().min(1);
const OptionalTextSchema = z.string().trim().min(1).optional();
const isoDateTimeWithZonePattern =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/u;
const normalizeIsoDateTime = (value: string): string => (
  new Date(Date.parse(value)).toISOString()
);
const isIsoDateTime = (value: string): boolean => (
  isoDateTimeWithZonePattern.test(value) &&
  !Number.isNaN(Date.parse(value))
);
const IsoTextSchema = RequiredTextSchema
  .refine(isIsoDateTime, { message: "invalid_iso_datetime" })
  .transform(normalizeIsoDateTime);
const OptionalIsoTextSchema = IsoTextSchema.optional();

const nowIso = (): string => new Date().toISOString();

const forbiddenMetadataKeys = new Set([
  "chainOfThought",
  "chain_of_thought",
  "reasoningTrace",
  "reasoning_trace",
  "privateReasoning",
  "private_reasoning"
]);

const rejectPrivateReasoningMetadata = (
  value: Record<string, unknown>,
  context: z.RefinementCtx
): void => {
  for (const key of Object.keys(value)) {
    if (forbiddenMetadataKeys.has(key)) {
      context.addIssue({
        code: "custom",
        message: "private reasoning metadata is not allowed",
        path: [key]
      });
    }
  }
};

const sourceRangeExemptProvenance = new Set([
  "user_preference",
  "local_operator_note"
]);

const requiresSourceRange = (provenanceKind: string): boolean =>
  !sourceRangeExemptProvenance.has(provenanceKind);

export const ObservationKindSchema = z.enum([
  "fact",
  "decision",
  "correction",
  "risk",
  "procedure",
  "conflict",
  "slang",
  "gap",
  "preference",
  "operator_note"
]);

export const ObservationPrioritySchema = z.enum([
  "low",
  "medium",
  "high",
  "critical"
]);

export const ObservationConfidenceSchema = z.enum(["low", "medium", "high"]);

export const ObservationStatusSchema = z.enum([
  "observed",
  "candidate",
  "accepted",
  "contested",
  "deprecated",
  "invalidated",
  "superseded"
]);

export const ObservationProvenanceKindSchema = z.enum([
  "run_event",
  "source_chunk",
  "tool_trace",
  "diff",
  "evidence_bundle",
  "review_assessment",
  "feedback_delta",
  "user_correction",
  "user_preference",
  "local_operator_note"
]);

export const ObservationEntityKindSchema = z.enum([
  "workspace",
  "project",
  "repo",
  "file",
  "package",
  "source",
  "memory",
  "policy",
  "eval"
]);

export const ObservationSourceRangeTypeSchema = z.enum([
  "run_event",
  "source_chunk",
  "tool_trace",
  "diff",
  "evidence_bundle",
  "review_assessment",
  "feedback_delta",
  "operator_input"
]);

export const ObservationScopeSchema = z.object({
  workspaceId: OptionalTextSchema,
  projectId: OptionalTextSchema,
  executionRunId: OptionalTextSchema,
  taskContractId: OptionalTextSchema,
  targetRepoPath: OptionalTextSchema
});

export const ObservationTemporalScopeSchema = z.object({
  observedAt: IsoTextSchema,
  eventTime: OptionalIsoTextSchema,
  ingestedAt: IsoTextSchema,
  referencedAt: OptionalIsoTextSchema,
  referenceTime: OptionalIsoTextSchema,
  relativeTimeBase: OptionalIsoTextSchema,
  validFrom: OptionalIsoTextSchema,
  validUntil: OptionalIsoTextSchema,
  invalidatedAt: OptionalIsoTextSchema,
  supersededAt: OptionalIsoTextSchema
});

export const ObservationSourceRangeSchema = z.object({
  id: RequiredTextSchema,
  sourceType: ObservationSourceRangeTypeSchema,
  sourceId: RequiredTextSchema,
  locator: RequiredTextSchema,
  excerpt: OptionalTextSchema,
  capturedAt: IsoTextSchema
});

export const ObservationEntityLinkSchema = z.object({
  entityKind: ObservationEntityKindSchema,
  entityId: RequiredTextSchema,
  relation: RequiredTextSchema
});

export const ObservationClaimLinkSchema = z.object({
  sourceClaimId: RequiredTextSchema,
  relation: z.enum(["supports", "contradicts", "qualifies", "supersedes"])
});

export const ObservationGroupInputSchema = z
  .object({
    id: RequiredTextSchema,
    projectId: OptionalTextSchema,
    executionRunId: OptionalTextSchema,
    scope: ObservationScopeSchema,
    title: RequiredTextSchema,
    summary: RequiredTextSchema,
    source: RequiredTextSchema,
    metadata: MetadataSchema,
    createdAt: OptionalIsoTextSchema,
    updatedAt: OptionalIsoTextSchema
  })
  .superRefine((value, context) => {
    rejectPrivateReasoningMetadata(value.metadata, context);
  })
  .transform((value) => {
    const timestamp = nowIso();

    return {
      ...value,
      metadata: value.metadata,
      createdAt: value.createdAt ?? timestamp,
      updatedAt: value.updatedAt ?? timestamp
    };
  });

export const ObservationItemInputSchema = z
  .object({
    id: RequiredTextSchema,
    groupId: RequiredTextSchema,
    scope: ObservationScopeSchema,
    kind: ObservationKindSchema,
    status: ObservationStatusSchema.default("observed"),
    priority: ObservationPrioritySchema,
    confidence: ObservationConfidenceSchema,
    provenanceKind: ObservationProvenanceKindSchema,
    subject: RequiredTextSchema,
    summary: RequiredTextSchema,
    body: RequiredTextSchema,
    temporalScope: ObservationTemporalScopeSchema,
    sourceRanges: z.array(ObservationSourceRangeSchema).default([]),
    entityLinks: z.array(ObservationEntityLinkSchema).default([]),
    claimLinks: z.array(ObservationClaimLinkSchema).default([]),
    metadata: MetadataSchema,
    createdAt: OptionalIsoTextSchema,
    updatedAt: OptionalIsoTextSchema
  })
  .superRefine((value, context) => {
    rejectPrivateReasoningMetadata(value.metadata, context);

    if (requiresSourceRange(value.provenanceKind) && value.sourceRanges.length === 0) {
      context.addIssue({
        code: "custom",
        message: "source_range_required",
        path: ["sourceRanges"]
      });
    }
  })
  .transform((value) => {
    const timestamp = nowIso();

    return {
      ...value,
      metadata: value.metadata,
      createdAt: value.createdAt ?? timestamp,
      updatedAt: value.updatedAt ?? timestamp
    };
  });

export type ObservationGroupInput = z.infer<typeof ObservationGroupInputSchema>;
export type ObservationItemInput = z.infer<typeof ObservationItemInputSchema>;
export type ObservationSourceRangeInput = z.infer<typeof ObservationSourceRangeSchema>;
export type ObservationTemporalScopeInput = z.infer<typeof ObservationTemporalScopeSchema>;

export function parseObservationGroupInput(input: unknown): ObservationGroupInput {
  return ObservationGroupInputSchema.parse(input);
}

export function parseObservationItemInput(input: unknown): ObservationItemInput {
  return ObservationItemInputSchema.parse(input);
}
