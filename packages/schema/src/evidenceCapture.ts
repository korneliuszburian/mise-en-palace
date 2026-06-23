import { z } from "zod";
import {
  MetadataSchema,
  OptionalTextSchema,
  RequiredTextSchema,
  TextListSchema
} from "./schemaPrimitives.js";

export const EvidenceCommandStatusSchema = z.enum(["passed", "failed", "skipped"]);

export const EvidenceCommandSchema = z.object({
  command: RequiredTextSchema,
  status: EvidenceCommandStatusSchema,
  exitCode: z.number().int().optional(),
  outputPath: OptionalTextSchema
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
