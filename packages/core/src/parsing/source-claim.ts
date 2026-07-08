import { z } from "zod";
import {
  decisionGradeSourceSupportTypes,
  sourceAuthorityLabels
} from "../source.js";
import {
  MetadataSchema,
  RequiredTextSchema
} from "./schema-primitives.js";

export const SourceArtifactKindSchema = z.enum([
  "doc",
  "file",
  "url",
  "paper",
  "run",
  "operator_input",
  "external_doc"
]);

export const SourceAuthorityLabelSchema = z.enum(sourceAuthorityLabels);

export const SourceSupportTypeSchema = z.enum(decisionGradeSourceSupportTypes);

export const SourceClaimStatusSchema = z.enum([
  "proposed",
  "accepted",
  "rejected",
  "deprecated"
]);

export const SourceClaimCreateStatusSchema = z.enum(["proposed"]);

export const SourceDecisionStatusSchema = z.enum([
  "adopt",
  "reject",
  "defer",
  "lab_test"
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
  sourceAuthority: SourceAuthorityLabelSchema,
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
  sourceAuthority: SourceAuthorityLabelSchema,
  supportType: SourceSupportTypeSchema,
  consumer: RequiredTextSchema,
  falsifier: RequiredTextSchema,
  revisitWhen: RequiredTextSchema.optional(),
  status: SourceClaimCreateStatusSchema.default("proposed"),
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

export const SourceDecisionInputSchema = z.object({
  projectId: RequiredTextSchema.optional(),
  sourceClaimId: RequiredTextSchema.optional(),
  status: SourceDecisionStatusSchema,
  decision: RequiredTextSchema,
  rationale: RequiredTextSchema,
  falsifier: RequiredTextSchema,
  consumer: RequiredTextSchema,
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
export type SourceDecisionInput = z.infer<typeof SourceDecisionInputSchema>;
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

export function parseSourceDecisionInput(input: unknown): SourceDecisionInput {
  return SourceDecisionInputSchema.parse(input);
}

export function parseSourceRejectionInput(input: unknown): SourceRejectionInput {
  return SourceRejectionInputSchema.parse(input);
}
