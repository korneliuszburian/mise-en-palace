import { z } from "zod";
import {
  MetadataSchema,
  OptionalTextSchema,
  RequiredTextSchema,
  TextListSchema
} from "./schemaPrimitives.js";

export const MemoryRecordKindSchema = z.enum([
  "fact",
  "preference",
  "constraint",
  "procedure",
  "pattern",
  "risk"
]);

export const MemoryCandidateStatusSchema = z.enum([
  "proposed",
  "candidate",
  "accepted",
  "rejected",
  "applied",
  "superseded"
]);

export const MemoryPromotionDecisionSchema = z.enum(["accepted", "rejected"]);

export const MemoryApplicationOutcomeSchema = z.enum([
  "helped",
  "hurt",
  "neutral",
  "stale"
]);

export const MemoryFeedbackDirectionSchema = z.enum([
  "positive",
  "negative",
  "correction"
]);

export const MemoryFeedbackEventTypeSchema = z.enum([
  "strengthened",
  "demoted",
  "invalidated",
  "corrected",
  "stale_detected"
]);

export const SourceLineageItemSchema = z.object({
  sourceId: RequiredTextSchema,
  note: OptionalTextSchema
});

const isExplicitUserPreference = (value: {
  kind: z.infer<typeof MemoryRecordKindSchema>;
  isUserPreference: boolean;
}): boolean => value.kind === "preference" && value.isUserPreference;

export const MemoryCandidateInputSchema = z
  .object({
    projectId: OptionalTextSchema,
    executionRunId: OptionalTextSchema,
    feedbackDeltaId: OptionalTextSchema,
    proposedBy: RequiredTextSchema,
    kind: MemoryRecordKindSchema,
    status: MemoryCandidateStatusSchema.default("proposed"),
    summary: RequiredTextSchema,
    body: RequiredTextSchema,
    owner: RequiredTextSchema,
    confidence: z.number().int().min(0).max(100),
    applicationGuidance: RequiredTextSchema,
    invalidationRule: OptionalTextSchema,
    sourceClaimIds: TextListSchema,
    sourceLineage: z.array(SourceLineageItemSchema).default([]),
    isUserPreference: z.boolean().default(false),
    validFrom: OptionalTextSchema,
    validUntil: OptionalTextSchema,
    metadata: MetadataSchema
  })
  .superRefine((value, context) => {
    if (!value.executionRunId && !value.feedbackDeltaId && !isExplicitUserPreference(value)) {
      context.addIssue({
        code: "custom",
        message: "executionRunId or feedbackDeltaId is required unless this is an explicit user preference",
        path: ["executionRunId"]
      });
    }

    if (
      !isExplicitUserPreference(value) &&
      value.sourceLineage.length === 0 &&
      value.sourceClaimIds.length === 0
    ) {
      context.addIssue({
        code: "custom",
        message: "sourceLineage or sourceClaimIds is required unless this is an explicit user preference",
        path: ["sourceLineage"]
      });
    }

    if (!isExplicitUserPreference(value) && !value.invalidationRule) {
      context.addIssue({
        code: "custom",
        message: "invalidationRule is required unless this is an explicit user preference",
        path: ["invalidationRule"]
      });
    }
  });

export const MemoryPromotionInputSchema = z
  .object({
    candidateId: RequiredTextSchema,
    reviewer: RequiredTextSchema,
    decision: MemoryPromotionDecisionSchema,
    rejectionReason: OptionalTextSchema,
    metadata: MetadataSchema
  })
  .superRefine((value, context) => {
    if (value.decision === "rejected" && !value.rejectionReason) {
      context.addIssue({
        code: "custom",
        message: "rejectionReason is required when decision is rejected",
        path: ["rejectionReason"]
      });
    }
  });

export const MemoryApplicationInputSchema = z.object({
  memoryRecordId: RequiredTextSchema,
  executionRunId: RequiredTextSchema,
  taskContractId: OptionalTextSchema,
  contextAssemblyId: OptionalTextSchema,
  expectedUse: RequiredTextSchema,
  outcome: MemoryApplicationOutcomeSchema,
  notes: RequiredTextSchema,
  metadata: MetadataSchema
});

export const MemoryFeedbackEventInputSchema = z.object({
  memoryRecordId: RequiredTextSchema,
  executionRunId: OptionalTextSchema,
  feedbackDeltaId: OptionalTextSchema,
  eventType: MemoryFeedbackEventTypeSchema,
  direction: MemoryFeedbackDirectionSchema,
  note: RequiredTextSchema,
  reason: RequiredTextSchema,
  evidenceRef: OptionalTextSchema,
  metadata: MetadataSchema
});

export const AntiMemoryInputSchema = z
  .object({
    projectId: OptionalTextSchema,
    executionRunId: RequiredTextSchema,
    key: OptionalTextSchema,
    rejectedClaim: RequiredTextSchema,
    reason: RequiredTextSchema,
    invalidatedBySourceClaimId: OptionalTextSchema,
    invalidatedBySourceClaimIds: TextListSchema,
    appliesTo: OptionalTextSchema,
    mayRevisitWhen: OptionalTextSchema,
    owner: RequiredTextSchema,
    confidence: z.number().int().min(0).max(100),
    sourceLineage: z.array(SourceLineageItemSchema).default([]),
    metadata: MetadataSchema
  })
  .superRefine((value, context) => {
    if (
      !value.invalidatedBySourceClaimId &&
      value.invalidatedBySourceClaimIds.length === 0 &&
      value.sourceLineage.length === 0
    ) {
      context.addIssue({
        code: "custom",
        message: "anti-memory requires invalidating source claim or source lineage",
        path: ["invalidatedBySourceClaimId"]
      });
    }
  });

export type MemoryCandidateInput = z.infer<typeof MemoryCandidateInputSchema>;
export type MemoryPromotionInput = z.infer<typeof MemoryPromotionInputSchema>;
export type MemoryApplicationInput = z.infer<typeof MemoryApplicationInputSchema>;
export type MemoryFeedbackEventInput = z.infer<typeof MemoryFeedbackEventInputSchema>;
export type AntiMemoryInput = z.infer<typeof AntiMemoryInputSchema>;

export function parseMemoryCandidateInput(input: unknown): MemoryCandidateInput {
  return MemoryCandidateInputSchema.parse(input);
}

export function parseMemoryPromotionInput(input: unknown): MemoryPromotionInput {
  return MemoryPromotionInputSchema.parse(input);
}

export function parseMemoryApplicationInput(input: unknown): MemoryApplicationInput {
  return MemoryApplicationInputSchema.parse(input);
}

export function parseMemoryFeedbackEventInput(input: unknown): MemoryFeedbackEventInput {
  return MemoryFeedbackEventInputSchema.parse(input);
}

export function parseAntiMemoryInput(input: unknown): AntiMemoryInput {
  return AntiMemoryInputSchema.parse(input);
}
