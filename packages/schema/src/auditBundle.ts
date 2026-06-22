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

export const AuditFindingSeveritySchema = z.enum([
  "info",
  "advisory",
  "warning",
  "blocking"
]);

export const AuditFindingCategorySchema = z.enum([
  "architecture",
  "boundary",
  "type_safety",
  "memory_semantics",
  "source_grounding",
  "policy",
  "eval",
  "handoff",
  "verification"
]);

export const AuditFindingStatusSchema = z.enum([
  "open",
  "accepted",
  "resolved",
  "waived"
]);

export const AuditFinalVerdictSchema = z.enum([
  "pass",
  "advisory",
  "needs_review",
  "fail"
]);

export const AuditCommandStatusSchema = z.enum(["passed", "failed", "skipped"]);

export const AuditRiskEstimateSchema = z.enum(["low", "medium", "high"]);

export const AuditCandidateUpdateKindSchema = z.enum([
  "memory_candidate",
  "source_claim_candidate",
  "anti_memory_candidate",
  "eval_candidate",
  "policy_candidate",
  "none"
]);

export const AuditCommandResultSchema = z.object({
  command: RequiredTextSchema,
  status: AuditCommandStatusSchema,
  exitCode: z.number().int().optional(),
  summary: OptionalTextSchema
});

export const AuditFindingInputSchema = z.object({
  category: AuditFindingCategorySchema,
  severity: AuditFindingSeveritySchema,
  title: RequiredTextSchema,
  summary: RequiredTextSchema,
  evidenceRefs: TextListSchema,
  recommendation: RequiredTextSchema,
  status: AuditFindingStatusSchema.default("open")
});

export const AuditCandidateUpdateSchema = z.object({
  kind: AuditCandidateUpdateKindSchema,
  summary: RequiredTextSchema,
  targetRef: OptionalTextSchema,
  requiresReview: z.boolean().default(true)
});

export const AuditBundleInputSchema = z
  .object({
    projectId: OptionalTextSchema,
    executionRunId: OptionalTextSchema,
    sliceId: RequiredTextSchema,
    commitCandidate: OptionalTextSchema,
    changedFiles: TextListSchema,
    intendedFiles: TextListSchema,
    unexpectedFiles: TextListSchema,
    verificationCommands: z.array(AuditCommandResultSchema).default([]),
    verificationResults: RequiredTextSchema,
    architecturalDelta: RequiredTextSchema,
    boundaryFindings: z.array(AuditFindingInputSchema).default([]),
    typeSafetyFindings: z.array(AuditFindingInputSchema).default([]),
    memorySemanticsFindings: z.array(AuditFindingInputSchema).default([]),
    sourceGroundingFindings: z.array(AuditFindingInputSchema).default([]),
    policyFindings: z.array(AuditFindingInputSchema).default([]),
    evalFindings: z.array(AuditFindingInputSchema).default([]),
    reviewBurdenEstimate: AuditRiskEstimateSchema,
    diffRiskEstimate: AuditRiskEstimateSchema,
    rollbackPath: RequiredTextSchema,
    candidateUpdates: z.array(AuditCandidateUpdateSchema).default([]),
    selfCritiqueSummary: RequiredTextSchema,
    finalVerdict: AuditFinalVerdictSchema,
    metadata: MetadataSchema
  })
  .superRefine((value, context) => {
    rejectPrivateReasoningMetadata(value.metadata, context);
  });

export type AuditBundleInput = z.infer<typeof AuditBundleInputSchema>;
export type AuditFindingInput = z.infer<typeof AuditFindingInputSchema>;
export type AuditCommandResultInput = z.infer<typeof AuditCommandResultSchema>;

export function parseAuditBundleInput(input: unknown): AuditBundleInput {
  return AuditBundleInputSchema.parse(input);
}
