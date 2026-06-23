import { z } from "zod";
import {
  MetadataSchema,
  OptionalTextSchema,
  RequiredTextSchema,
  TextListSchema
} from "./schemaPrimitives.js";

export const EvidenceCommandStatusSchema = z.enum([
  "passed",
  "failed",
  "skipped",
  "missing",
  "not_run"
]);
export const EvidenceCommandProvenanceSchema = z.enum([
  "default_template",
  "operator_reported",
  "captured_output_file",
  "command_runner",
  "external_log"
]);

export const EvidenceCommandSchema = z.object({
  command: RequiredTextSchema,
  status: EvidenceCommandStatusSchema,
  provenance: EvidenceCommandProvenanceSchema.optional(),
  exitCode: z.number().int().optional(),
  outputPath: OptionalTextSchema,
  outputRef: OptionalTextSchema,
  capturedAt: OptionalTextSchema,
  assertedBy: OptionalTextSchema,
  doesNotProve: OptionalTextSchema
});

export const DiffRiskSchema = z.enum(["low", "medium", "high"]);

export const EvidenceCaptureInputSchema = z.object({
  executionRunId: z.string().uuid().optional(),
  changedFiles: TextListSchema,
  commands: z.array(EvidenceCommandSchema).default([]),
  diffRisk: DiffRiskSchema,
  reviewBurden: RequiredTextSchema,
  rollbackPath: RequiredTextSchema,
  metadata: MetadataSchema
});

export type EvidenceCaptureInput = z.infer<typeof EvidenceCaptureInputSchema>;

export function parseEvidenceCaptureInput(input: unknown): EvidenceCaptureInput {
  return EvidenceCaptureInputSchema.parse(input);
}
