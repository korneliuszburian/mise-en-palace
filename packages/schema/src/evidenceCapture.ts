import { z } from "zod";

const MetadataSchema = z.object({}).catchall(z.unknown()).default({});

export const EvidenceCommandStatusSchema = z.enum(["passed", "failed", "skipped"]);

export const EvidenceCommandSchema = z.object({
  command: z.string().trim().min(1),
  status: EvidenceCommandStatusSchema,
  exitCode: z.number().int().optional(),
  outputPath: z.string().trim().min(1).optional()
});

export const DiffRiskSchema = z.enum(["low", "medium", "high"]);

export const EvidenceCaptureInputSchema = z.object({
  executionRunId: z.string().uuid().optional(),
  changedFiles: z.array(z.string().trim().min(1)).default([]),
  commands: z.array(EvidenceCommandSchema).default([]),
  diffRisk: DiffRiskSchema,
  reviewBurden: z.string().trim().min(1),
  rollbackPath: z.string().trim().min(1),
  metadata: MetadataSchema
});

export type EvidenceCaptureInput = z.infer<typeof EvidenceCaptureInputSchema>;

export function parseEvidenceCaptureInput(input: unknown): EvidenceCaptureInput {
  return EvidenceCaptureInputSchema.parse(input);
}
