import { z } from "zod";

import {
  activationAbstentionReasons,
  activationDecisionInputStatuses,
  activationDecisionSourceSupportStates,
  activationTraceRawRecallReasons,
  contextExclusionReasons,
  nonStaleContextExclusionReasons,
  retrievalActivationDecisionStatuses,
  retrievalCandidateKinds,
  retrievalCandidateStatuses,
  retrievalRunModes,
  retrievalSubjectTypes,
  retrievalValidityStatuses
} from "../retrieval-model.js";
import { sourceAuthorityLabels } from "../source-model.js";
import {
  MetadataSchema,
  OptionalTextSchema,
  RequiredTextSchema
} from "./schema-primitives.js";
const OptionalIdSchema = OptionalTextSchema;
const BoundedScoreSchema = z.number().int().min(0).max(1000);
const OptionalBoundedScoreSchema = BoundedScoreSchema.optional();
const NonNegativeIntegerSchema = z.number().int().min(0);

export const RetrievalSubjectTypeSchema = z.enum(retrievalSubjectTypes);

export const RetrievalSourceAuthoritySchema = z.enum(sourceAuthorityLabels);

export const RetrievalValidityStatusSchema = z.enum(retrievalValidityStatuses);

export const RetrievalRunModeSchema = z.enum(retrievalRunModes);

export const RetrievalCandidateTypeSchema = z.enum(retrievalCandidateKinds);

export const RetrievalCandidateStatusSchema = z.enum(retrievalCandidateStatuses);

export const ActivationDecisionSchema = z.enum(retrievalActivationDecisionStatuses);

export const ActivationDecisionInputDecisionSchema = z.enum(activationDecisionInputStatuses);

export const ContextExclusionReasonSchema = z.enum(contextExclusionReasons);

export const NonStaleContextExclusionReasonSchema = z.enum(nonStaleContextExclusionReasons);

export const ActivationDecisionSourceSupportStateSchema = z.enum(
  activationDecisionSourceSupportStates
);

export const ActivationTraceRawRecallReasonSchema = z.enum(activationTraceRawRecallReasons);

export const ActivationTraceRawRecallSchema = z.object({
  required: z.boolean(),
  reasons: z.array(ActivationTraceRawRecallReasonSchema).default([]),
  evidenceHints: z.array(RequiredTextSchema).default([])
});

export const ActivationAbstentionReasonSchema = z.enum(activationAbstentionReasons);

const SearchDocumentInputShapeSchema = z.object({
  projectId: OptionalIdSchema,
  subjectType: RetrievalSubjectTypeSchema,
  subjectId: RequiredTextSchema,
  sourceArtifactId: OptionalIdSchema,
  sourceChunkId: OptionalIdSchema,
  sourceClaimId: OptionalIdSchema,
  memoryRecordId: OptionalIdSchema,
  antiMemoryRecordId: OptionalIdSchema,
  evidenceBundleId: OptionalIdSchema,
  reviewAssessmentId: OptionalIdSchema,
  sourceDecisionId: OptionalIdSchema,
  runEventId: OptionalIdSchema,
  sourceAuthority: RetrievalSourceAuthoritySchema.default("medium"),
  validityStatus: RetrievalValidityStatusSchema.default("active"),
  language: RequiredTextSchema.default("english"),
  title: RequiredTextSchema,
  body: RequiredTextSchema,
  searchText: OptionalTextSchema,
  metadataFilters: MetadataSchema,
  validFrom: OptionalTextSchema,
  validUntil: OptionalTextSchema,
  metadata: MetadataSchema
});

export const SearchDocumentInputSchema = SearchDocumentInputShapeSchema.transform(
  (value: z.infer<typeof SearchDocumentInputShapeSchema>) => ({
    ...value,
    searchText: value.searchText ?? `${value.title}\n${value.body}`
  })
);

export const RetrievalRunInputSchema = z.object({
  projectId: OptionalIdSchema,
  executionRunId: OptionalIdSchema,
  taskContractId: OptionalIdSchema,
  query: RequiredTextSchema,
  mode: RetrievalRunModeSchema.default("mixed"),
  budget: NonNegativeIntegerSchema.optional(),
  tokenBudget: NonNegativeIntegerSchema.optional(),
  metadataFilters: MetadataSchema,
  metadata: MetadataSchema
});

export const RetrievalCandidateInputSchema = z.object({
  retrievalRunId: RequiredTextSchema,
  searchDocumentId: OptionalIdSchema,
  candidateType: RetrievalCandidateTypeSchema,
  status: RetrievalCandidateStatusSchema.default("candidate"),
  subjectType: RetrievalSubjectTypeSchema,
  subjectId: RequiredTextSchema,
  sourceAuthority: RetrievalSourceAuthoritySchema.default("medium"),
  lexicalScore: OptionalBoundedScoreSchema,
  vectorScore: OptionalBoundedScoreSchema,
  graphScore: OptionalBoundedScoreSchema,
  temporalScore: OptionalBoundedScoreSchema,
  contextRoiScore: OptionalBoundedScoreSchema,
  totalScore: OptionalBoundedScoreSchema,
  score: OptionalBoundedScoreSchema,
  reason: RequiredTextSchema,
  metadata: MetadataSchema
});

const ActivationDecisionBaseInputShape = {
  retrievalRunId: RequiredTextSchema,
  retrievalCandidateId: OptionalIdSchema,
  subjectType: RetrievalSubjectTypeSchema,
  subjectId: RequiredTextSchema,
  reason: RequiredTextSchema,
  score: OptionalBoundedScoreSchema,
  contextBudgetCost: NonNegativeIntegerSchema.optional(),
  expectedDecisionImpact: OptionalTextSchema,
  sourceSupportState: ActivationDecisionSourceSupportStateSchema.optional(),
  activationAbstentionReason: ActivationAbstentionReasonSchema.optional(),
  metadata: MetadataSchema
};

export const ActivationDecisionInputSchema = z.discriminatedUnion("decision", [
  z.object({
    ...ActivationDecisionBaseInputShape,
    decision: z.literal("included"),
    contextAssemblyId: RequiredTextSchema,
    expectedDecisionImpact: RequiredTextSchema,
    expectedUse: RequiredTextSchema,
    rawRecall: ActivationTraceRawRecallSchema.optional(),
    antiMemoryRecordId: z.never().optional(),
    exclusionCategory: z.never().optional(),
    activationAbstentionReason: z.never().optional()
  }).strict(),
  z.object({
    ...ActivationDecisionBaseInputShape,
    decision: z.literal("excluded"),
    contextAssemblyId: RequiredTextSchema,
    expectedUse: z.never().optional(),
    rawRecall: z.never().optional(),
    antiMemoryRecordId: z.never().optional(),
    exclusionCategory: NonStaleContextExclusionReasonSchema
  }).strict(),
  z.object({
    ...ActivationDecisionBaseInputShape,
    decision: z.literal("conflict"),
    contextAssemblyId: RequiredTextSchema,
    expectedUse: z.never().optional(),
    rawRecall: z.never().optional(),
    antiMemoryRecordId: RequiredTextSchema,
    exclusionCategory: ContextExclusionReasonSchema
  }).strict(),
  z.object({
    ...ActivationDecisionBaseInputShape,
    decision: z.literal("stale"),
    contextAssemblyId: RequiredTextSchema,
    expectedUse: z.never().optional(),
    rawRecall: z.never().optional(),
    antiMemoryRecordId: z.never().optional(),
    exclusionCategory: z.literal("stale")
  }).strict(),
  z.object({
    ...ActivationDecisionBaseInputShape,
    decision: z.literal("deferred"),
    contextAssemblyId: OptionalIdSchema,
    expectedUse: z.never().optional(),
    rawRecall: z.never().optional(),
    antiMemoryRecordId: z.never().optional(),
    exclusionCategory: z.never().optional(),
    activationAbstentionReason: z.never().optional()
  }).strict()
]);

export const ContextItemInputSchema = z.object({
  contextAssemblyId: RequiredTextSchema,
  subjectType: RetrievalSubjectTypeSchema,
  subjectId: RequiredTextSchema,
  position: z.number().int().positive(),
  reason: RequiredTextSchema,
  expectedUse: RequiredTextSchema,
  tokenEstimate: NonNegativeIntegerSchema.optional(),
  sourceAuthority: RetrievalSourceAuthoritySchema.default("medium"),
  metadata: MetadataSchema
});

export const ContextExclusionInputSchema = z.object({
  contextAssemblyId: RequiredTextSchema,
  subjectType: RetrievalSubjectTypeSchema,
  subjectId: RequiredTextSchema,
  reason: ContextExclusionReasonSchema,
  explanation: RequiredTextSchema,
  score: OptionalBoundedScoreSchema,
  sourceAuthority: RetrievalSourceAuthoritySchema.default("medium"),
  metadata: MetadataSchema
});

export type SearchDocumentInput = z.infer<typeof SearchDocumentInputSchema>;
export type RetrievalRunInput = z.infer<typeof RetrievalRunInputSchema>;
export type RetrievalCandidateInput = z.infer<typeof RetrievalCandidateInputSchema>;
export type ActivationDecisionInputDecision = z.infer<
  typeof ActivationDecisionInputDecisionSchema
>;
export type ActivationTraceRawRecall = z.infer<typeof ActivationTraceRawRecallSchema>;
export type ActivationDecisionInput = z.infer<typeof ActivationDecisionInputSchema>;
export type ContextItemInput = z.infer<typeof ContextItemInputSchema>;
export type ContextExclusionInput = z.infer<typeof ContextExclusionInputSchema>;

export function parseSearchDocumentInput(input: unknown): SearchDocumentInput {
  return SearchDocumentInputSchema.parse(input);
}

export function parseRetrievalRunInput(input: unknown): RetrievalRunInput {
  return RetrievalRunInputSchema.parse(input);
}

export function parseRetrievalCandidateInput(input: unknown): RetrievalCandidateInput {
  return RetrievalCandidateInputSchema.parse(input);
}

export function parseActivationDecisionInput(input: unknown): ActivationDecisionInput {
  return ActivationDecisionInputSchema.parse(input);
}

export function parseContextItemInput(input: unknown): ContextItemInput {
  return ContextItemInputSchema.parse(input);
}

export function parseContextExclusionInput(input: unknown): ContextExclusionInput {
  return ContextExclusionInputSchema.parse(input);
}
