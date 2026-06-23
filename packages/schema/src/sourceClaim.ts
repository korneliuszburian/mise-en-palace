import { z } from "zod";
import {
  MetadataSchema,
  RequiredTextSchema
} from "./schemaPrimitives.js";

export const SourceArtifactKindSchema = z.enum([
  "doc",
  "file",
  "url",
  "paper",
  "run",
  "operator_input",
  "external_doc"
]);

export const SourceTrustTierSchema = z.enum([
  "primary",
  "official",
  "project-decision",
  "source-code",
  "paper",
  "practitioner",
  "secondary",
  "hypothesis"
]);

export const SourceSupportTypeSchema = z.enum([
  "mechanism",
  "decision",
  "risk",
  "rejection",
  "eval-design",
  "implementation-boundary"
]);

export const SourceClaimStatusSchema = z.enum([
  "proposed",
  "accepted",
  "rejected",
  "deprecated"
]);

export const SourceDecisionTargetTypeSchema = z.enum([
  "harness_run",
  "task_contract",
  "harness_plan",
  "context_assembly",
  "evidence_bundle",
  "review_assessment",
  "feedback_delta",
  "architecture_decision",
  "memory_record",
  "eval_candidate"
]);

export const SourceDecisionEdgeConfidenceSchema = z.enum(["low", "medium", "high"]);

export const SourceRejectionReasonSchema = z.enum([
  "no_mechanism",
  "no_consumer",
  "decorative",
  "stale",
  "conflicting",
  "unsupported",
  "duplicate"
]);

export const SourceArtifactInputSchema = z.object({
  projectId: RequiredTextSchema.optional(),
  kind: SourceArtifactKindSchema.default("operator_input"),
  title: RequiredTextSchema,
  uri: RequiredTextSchema.default("operator://source"),
  contentHash: RequiredTextSchema.optional(),
  trustTier: SourceTrustTierSchema,
  metadata: MetadataSchema
});

export const SourceClaimInputSchema = z.object({
  sourceArtifactId: RequiredTextSchema.optional(),
  sourceChunkId: RequiredTextSchema.optional(),
  executionRunId: RequiredTextSchema.optional(),
  claim: RequiredTextSchema,
  mechanism: RequiredTextSchema,
  krnImplication: RequiredTextSchema,
  doesNotProve: RequiredTextSchema,
  trustTier: SourceTrustTierSchema,
  supportType: SourceSupportTypeSchema,
  consumer: RequiredTextSchema,
  falsifier: RequiredTextSchema,
  revisitWhen: RequiredTextSchema.optional(),
  status: SourceClaimStatusSchema.default("proposed"),
  metadata: MetadataSchema
});

export const SourceDecisionEdgeInputSchema = z.object({
  sourceClaimId: RequiredTextSchema,
  targetType: SourceDecisionTargetTypeSchema,
  targetId: RequiredTextSchema,
  supportType: SourceSupportTypeSchema,
  confidence: SourceDecisionEdgeConfidenceSchema,
  notes: RequiredTextSchema,
  metadata: MetadataSchema
});

export const SourceRejectionInputSchema = z.object({
  projectId: RequiredTextSchema.optional(),
  executionRunId: RequiredTextSchema.optional(),
  sourceArtifactId: RequiredTextSchema.optional(),
  sourceClaimId: RequiredTextSchema.optional(),
  title: RequiredTextSchema,
  attemptedClaim: RequiredTextSchema,
  rejectedBecause: SourceRejectionReasonSchema,
  reason: RequiredTextSchema,
  doesNotProve: RequiredTextSchema,
  consumer: RequiredTextSchema,
  metadata: MetadataSchema
});

export type SourceArtifactInput = z.infer<typeof SourceArtifactInputSchema>;
export type SourceClaimInput = z.infer<typeof SourceClaimInputSchema>;
export type SourceDecisionEdgeInput = z.infer<typeof SourceDecisionEdgeInputSchema>;
export type SourceRejectionInput = z.infer<typeof SourceRejectionInputSchema>;

export function parseSourceArtifactInput(input: unknown): SourceArtifactInput {
  return SourceArtifactInputSchema.parse(input);
}

export function parseSourceClaimInput(input: unknown): SourceClaimInput {
  return SourceClaimInputSchema.parse(input);
}

export function parseSourceDecisionEdgeInput(input: unknown): SourceDecisionEdgeInput {
  return SourceDecisionEdgeInputSchema.parse(input);
}

export function parseSourceRejectionInput(input: unknown): SourceRejectionInput {
  return SourceRejectionInputSchema.parse(input);
}
