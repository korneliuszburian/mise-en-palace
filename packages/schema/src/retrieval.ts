import { z } from "zod";

const MetadataSchema = z.object({}).catchall(z.unknown()).default({});
const RequiredTextSchema = z.string().trim().min(1);
const OptionalTextSchema = z.string().trim().min(1).optional();
const OptionalIdSchema = OptionalTextSchema;
const BoundedScoreSchema = z.number().int().min(0).max(1000);
const OptionalBoundedScoreSchema = BoundedScoreSchema.optional();
const NonNegativeIntegerSchema = z.number().int().min(0);

export const RetrievalSubjectTypeSchema = z.enum([
  "source_artifact",
  "source_chunk",
  "source_claim",
  "memory_record",
  "anti_memory_record",
  "task_contract",
  "search_document",
  "evidence_bundle",
  "review_assessment",
  "architecture_decision",
  "run_event"
]);

export const RetrievalTrustTierSchema = z.enum([
  "high",
  "medium",
  "low",
  "primary",
  "official",
  "project-decision",
  "source-code",
  "paper",
  "practitioner",
  "secondary",
  "hypothesis"
]);

export const RetrievalValidityStatusSchema = z.enum([
  "active",
  "expired",
  "invalidated"
]);

export const RetrievalRunModeSchema = z.enum([
  "lexical",
  "vector",
  "hybrid",
  "graph",
  "mixed"
]);

export const RetrievalCandidateTypeSchema = z.enum([
  "memory",
  "anti_memory",
  "source",
  "search"
]);

export const RetrievalCandidateStatusSchema = z.enum([
  "candidate",
  "included",
  "excluded"
]);

export const ActivationDecisionSchema = z.enum([
  "included",
  "excluded",
  "abstained",
  "deferred",
  "conflict",
  "stale"
]);

export const ContextExclusionReasonSchema = z.enum([
  "stale",
  "invalidated",
  "low_trust",
  "low_context_roi",
  "over_budget",
  "duplicate",
  "irrelevant",
  "unsafe",
  "superseded"
]);

export const SearchDocumentInputSchema = z
  .object({
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
    trustTier: RetrievalTrustTierSchema.default("medium"),
    validityStatus: RetrievalValidityStatusSchema.default("active"),
    language: RequiredTextSchema.default("english"),
    title: RequiredTextSchema,
    body: RequiredTextSchema,
    searchText: OptionalTextSchema,
    metadataFilters: MetadataSchema,
    validFrom: OptionalTextSchema,
    validUntil: OptionalTextSchema,
    metadata: MetadataSchema
  })
  .transform((value) => ({
    ...value,
    searchText: value.searchText ?? `${value.title}\n${value.body}`
  }));

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
  trustTier: RetrievalTrustTierSchema.default("medium"),
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

export const ActivationDecisionInputSchema = z.object({
  retrievalRunId: RequiredTextSchema,
  retrievalCandidateId: OptionalIdSchema,
  contextAssemblyId: OptionalIdSchema,
  subjectType: RetrievalSubjectTypeSchema,
  subjectId: RequiredTextSchema,
  decision: ActivationDecisionSchema,
  reason: RequiredTextSchema,
  score: OptionalBoundedScoreSchema,
  contextBudgetCost: NonNegativeIntegerSchema.optional(),
  expectedDecisionImpact: OptionalTextSchema,
  metadata: MetadataSchema
});

export const ContextItemInputSchema = z.object({
  contextAssemblyId: RequiredTextSchema,
  subjectType: RetrievalSubjectTypeSchema,
  subjectId: RequiredTextSchema,
  position: z.number().int().positive(),
  reason: RequiredTextSchema,
  expectedUse: RequiredTextSchema,
  tokenEstimate: NonNegativeIntegerSchema.optional(),
  trustTier: RetrievalTrustTierSchema.default("medium"),
  metadata: MetadataSchema
});

export const ContextExclusionInputSchema = z.object({
  contextAssemblyId: RequiredTextSchema,
  subjectType: RetrievalSubjectTypeSchema,
  subjectId: RequiredTextSchema,
  reason: ContextExclusionReasonSchema,
  explanation: RequiredTextSchema,
  score: OptionalBoundedScoreSchema,
  trustTier: RetrievalTrustTierSchema.default("medium"),
  metadata: MetadataSchema
});

export type SearchDocumentInput = z.infer<typeof SearchDocumentInputSchema>;
export type RetrievalRunInput = z.infer<typeof RetrievalRunInputSchema>;
export type RetrievalCandidateInput = z.infer<typeof RetrievalCandidateInputSchema>;
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
