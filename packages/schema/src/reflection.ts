import { z } from "zod";

const MetadataSchema = z.object({}).catchall(z.unknown()).default({});
const RequiredTextSchema = z.string().trim().min(1);
const OptionalTextSchema = z.string().trim().min(1).optional();
const TextListSchema = z.array(RequiredTextSchema).default([]);

const forbiddenMetadataKeys = new Set([
  "chainOfThought",
  "chain_of_thought",
  "reasoningTrace",
  "reasoning_trace",
  "privateReasoning",
  "private_reasoning",
  "createActiveMemory",
  "create_active_memory",
  "memory_record",
  "source_decision"
]);

const rejectForbiddenMetadata = (
  value: Record<string, unknown>,
  context: z.RefinementCtx
): void => {
  for (const key of Object.keys(value)) {
    if (forbiddenMetadataKeys.has(key)) {
      context.addIssue({
        code: "custom",
        message: "reflection metadata cannot store private reasoning or final-truth mutation semantics",
        path: [key]
      });
    }
  }
};

export const ReflectionStatusSchema = z.enum([
  "candidate",
  "reviewed",
  "rejected",
  "superseded"
]);

export const ReflectionFindingKindSchema = z.enum([
  "candidate_signal",
  "contradiction",
  "gap",
  "risk",
  "correction",
  "policy_signal"
]);

export const ReflectionSeveritySchema = z.enum([
  "low",
  "medium",
  "high",
  "critical"
]);

export const ReflectionCandidateOutputTargetSchema = z.enum([
  "memory_candidate",
  "source_claim_candidate",
  "anti_memory_candidate",
  "policy_candidate",
  "eval_candidate"
]);

export const ReflectionScopeSchema = z.object({
  projectId: RequiredTextSchema,
  executionRunId: OptionalTextSchema,
  taskContractId: OptionalTextSchema,
  observationGroupIds: TextListSchema
});

export const ReflectionInputSchema = z.object({
  scope: ReflectionScopeSchema,
  observationItemIds: TextListSchema,
  sourceClaimIds: TextListSchema,
  antiMemoryKeys: TextListSchema,
  generatedAt: RequiredTextSchema,
  metadata: MetadataSchema
});

export const ReflectionFindingSchema = z.object({
  id: RequiredTextSchema,
  kind: ReflectionFindingKindSchema,
  severity: ReflectionSeveritySchema,
  summary: RequiredTextSchema,
  observationItemIds: TextListSchema,
  evidenceRefs: TextListSchema,
  metadata: MetadataSchema
});

export const ContradictionReportSchema = z.object({
  id: RequiredTextSchema,
  summary: RequiredTextSchema,
  observationItemIds: TextListSchema,
  conflictingClaims: TextListSchema,
  evidenceRefs: TextListSchema,
  severity: ReflectionSeveritySchema,
  metadata: MetadataSchema
});

export const GapReportSchema = z.object({
  id: RequiredTextSchema,
  summary: RequiredTextSchema,
  missingEvidence: RequiredTextSchema,
  observationItemIds: TextListSchema,
  severity: ReflectionSeveritySchema,
  metadata: MetadataSchema
});

export const ReflectionCandidateLinkSchema = z.object({
  targetType: ReflectionCandidateOutputTargetSchema,
  targetId: OptionalTextSchema,
  summary: RequiredTextSchema,
  evidenceRefs: TextListSchema
});

export const ReflectionOutputSchema = z
  .object({
    id: RequiredTextSchema,
    scope: ReflectionScopeSchema,
    status: ReflectionStatusSchema,
    summary: RequiredTextSchema,
    findings: z.array(ReflectionFindingSchema).default([]),
    contradictions: z.array(ContradictionReportSchema).default([]),
    gaps: z.array(GapReportSchema).default([]),
    candidateLinks: z.array(ReflectionCandidateLinkSchema).default([]),
    memoryCandidates: z.array(MetadataSchema).default([]),
    sourceClaimCandidates: z.array(MetadataSchema).default([]),
    antiMemoryCandidates: z.array(MetadataSchema).default([]),
    policyCandidates: z.array(MetadataSchema).default([]),
    evalCandidates: z.array(MetadataSchema).default([]),
    metadata: MetadataSchema,
    createdAt: RequiredTextSchema,
    updatedAt: RequiredTextSchema
  })
  .superRefine((value, context) => {
    rejectForbiddenMetadata(value.metadata, context);
  });

export const ReflectionRecordInputSchema = z
  .object({
    projectId: RequiredTextSchema,
    executionRunId: OptionalTextSchema,
    taskContractId: OptionalTextSchema,
    status: ReflectionStatusSchema.default("candidate"),
    summary: RequiredTextSchema,
    scope: ReflectionScopeSchema,
    input: ReflectionInputSchema,
    output: ReflectionOutputSchema,
    metadata: MetadataSchema
  })
  .superRefine((value, context) => {
    rejectForbiddenMetadata(value.metadata, context);
  });

export type ReflectionRecordInput = z.infer<typeof ReflectionRecordInputSchema>;
export type ReflectionInputInput = z.infer<typeof ReflectionInputSchema>;
export type ReflectionOutputInput = z.infer<typeof ReflectionOutputSchema>;

export function parseReflectionRecordInput(input: unknown): ReflectionRecordInput {
  return ReflectionRecordInputSchema.parse(input);
}
