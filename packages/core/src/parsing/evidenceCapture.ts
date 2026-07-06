import { z } from "zod";
import type {
  EvidenceCommand
} from "../evidenceBundle.js";
import {
  toEvidenceCommandReadback
} from "../evidenceBundle.js";
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
export const EvidenceCommandKindSchema = EvidenceCommandProvenanceSchema;

const EvidenceCommandInputSchema = z.object({
  kind: EvidenceCommandKindSchema.optional(),
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

type EvidenceCommandInput = z.infer<typeof EvidenceCommandInputSchema>;

const evidenceCommandInputToReadback = (command: EvidenceCommandInput) => {
  const evidenceCommand: EvidenceCommand = {
    command: command.command,
    status: command.status
  };

  const provenance = command.provenance ?? command.kind;
  if (provenance !== undefined) {
    evidenceCommand.provenance = provenance;
  }

  if (command.exitCode !== undefined) {
    evidenceCommand.exitCode = command.exitCode;
  }

  if (command.outputPath !== undefined) {
    evidenceCommand.outputPath = command.outputPath;
  }

  if (command.outputRef !== undefined) {
    evidenceCommand.outputRef = command.outputRef;
  }

  if (command.capturedAt !== undefined) {
    evidenceCommand.capturedAt = command.capturedAt;
  }

  if (command.assertedBy !== undefined) {
    evidenceCommand.assertedBy = command.assertedBy;
  }

  if (command.doesNotProve !== undefined) {
    evidenceCommand.doesNotProve = command.doesNotProve;
  }

  return toEvidenceCommandReadback(evidenceCommand);
};

export const EvidenceCommandSchema = EvidenceCommandInputSchema.superRefine(
  (
    value: z.infer<typeof EvidenceCommandInputSchema>,
    context: z.RefinementCtx
  ) => {
  if (
    value.kind !== undefined &&
    value.provenance !== undefined &&
    value.kind !== value.provenance
  ) {
    context.addIssue({
      code: "custom",
      message: "Evidence command kind must match provenance when both are supplied",
      path: ["kind"]
    });
  }
}).transform(evidenceCommandInputToReadback);

export const DiffRiskSchema = z.enum(["low", "medium", "high"]);

const EvidenceChangedFileClassificationMetadataSchema = z.object({
  intended: TextListSchema,
  unrelated: TextListSchema,
  unknown: TextListSchema,
  unmatchedIntendedFiles: TextListSchema
  }
);

const EvidenceDirtyContextMetadataSchema = z.object({
  hasUnrelatedFiles: z.boolean(),
  unrelatedFileCount: z.number().int().nonnegative()
});

type EvidenceCaptureMetadataInput = z.infer<typeof MetadataSchema> & {
  command?: unknown;
  runId?: unknown;
  intendedFiles?: unknown;
  changedFileClassification?: unknown;
  dirtyContext?: unknown;
};

export const EvidenceCaptureMetadataSchema = MetadataSchema.superRefine(
  (value: EvidenceCaptureMetadataInput, context: z.RefinementCtx) => {
  const command = value.command;
  if (command !== undefined) {
    const result = RequiredTextSchema.safeParse(command);
    if (!result.success) {
      context.addIssue({
        code: "custom",
        message: "evidence metadata command must be a non-empty string",
        path: ["command"]
      });
    }
  }

  const runId = value.runId;
  if (runId !== undefined) {
    const result = RequiredTextSchema.safeParse(runId);
    if (!result.success) {
      context.addIssue({
        code: "custom",
        message: "evidence metadata runId must be a non-empty string",
        path: ["runId"]
      });
    }
  }

  const intendedFiles = value.intendedFiles;
  if (intendedFiles !== undefined) {
    const result = TextListSchema.safeParse(intendedFiles);
    if (!result.success) {
      context.addIssue({
        code: "custom",
        message: "evidence metadata intendedFiles must be an array of non-empty strings",
        path: ["intendedFiles"]
      });
    }
  }

  const changedFileClassification = value.changedFileClassification;
  if (changedFileClassification !== undefined) {
    const result =
      EvidenceChangedFileClassificationMetadataSchema.safeParse(changedFileClassification);
    if (!result.success) {
      context.addIssue({
        code: "custom",
        message:
          "evidence metadata changedFileClassification must include intended, unrelated, unknown, and unmatchedIntendedFiles string arrays",
        path: ["changedFileClassification"]
      });
    }
  }

  const dirtyContext = value.dirtyContext;
  if (dirtyContext !== undefined) {
    const result = EvidenceDirtyContextMetadataSchema.safeParse(dirtyContext);
    if (!result.success) {
      context.addIssue({
        code: "custom",
        message:
          "evidence metadata dirtyContext must include hasUnrelatedFiles and unrelatedFileCount",
        path: ["dirtyContext"]
      });
    }
  }
}).transform((value: EvidenceCaptureMetadataInput) => {
  const metadata: Record<string, unknown> = { ...value };

  if (value.command !== undefined) {
    metadata.command = RequiredTextSchema.parse(value.command);
  }

  if (value.runId !== undefined) {
    metadata.runId = RequiredTextSchema.parse(value.runId);
  }

  if (value.intendedFiles !== undefined) {
    metadata.intendedFiles = TextListSchema.parse(value.intendedFiles);
  }

  if (value.changedFileClassification !== undefined) {
    metadata.changedFileClassification =
      EvidenceChangedFileClassificationMetadataSchema.parse(value.changedFileClassification);
  }

  if (value.dirtyContext !== undefined) {
    metadata.dirtyContext = EvidenceDirtyContextMetadataSchema.parse(value.dirtyContext);
  }

  return metadata;
  }
);

export const EvidenceCaptureInputSchema = z.object({
  executionRunId: OptionalTextSchema,
  changedFiles: TextListSchema,
  commands: z.array(EvidenceCommandSchema).default([]),
  diffRisk: DiffRiskSchema,
  reviewBurden: RequiredTextSchema,
  rollbackPath: RequiredTextSchema,
  metadata: EvidenceCaptureMetadataSchema
});

export type EvidenceCaptureInput = z.infer<typeof EvidenceCaptureInputSchema>;

export function parseEvidenceCaptureInput(input: unknown): EvidenceCaptureInput {
  return EvidenceCaptureInputSchema.parse(input);
}
