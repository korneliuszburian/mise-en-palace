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
export const EvidenceCommandKindSchema = EvidenceCommandProvenanceSchema;

const defaultTemplateCommandDoesNotProve =
  "This command row does not prove the command executed; it is default template evidence only.";

const commandResultDoesNotProve =
  "This command result does not prove memory quality, source truth, review correctness, or production readiness.";

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
type EvidenceCommandStatus = z.infer<typeof EvidenceCommandStatusSchema>;
type EvidenceCommandProvenance = z.infer<typeof EvidenceCommandProvenanceSchema>;

const hasText = (value: string | undefined): value is string =>
  value !== undefined && value.trim().length > 0;

const isPassedOrFailed = (status: EvidenceCommandStatus): status is "passed" | "failed" =>
  status === "passed" || status === "failed";

const inferCommandProvenance = (
  command: EvidenceCommandInput
): EvidenceCommandProvenance => {
  if (hasText(command.provenance)) {
    return command.provenance;
  }

  if (hasText(command.kind)) {
    return command.kind;
  }

  if (hasText(command.outputRef) || hasText(command.outputPath)) {
    return "captured_output_file";
  }

  if (isPassedOrFailed(command.status) && command.exitCode !== undefined) {
    return "operator_reported";
  }

  return "default_template";
};

const normalizeDefaultTemplateStatus = (status: EvidenceCommandStatus): "skipped" | "not_run" =>
  status === "skipped" ? "skipped" : "not_run";

const normalizeEvidenceCommandInput = (command: EvidenceCommandInput) => {
  const outputRef = hasText(command.outputRef)
    ? command.outputRef.trim()
    : hasText(command.outputPath)
      ? command.outputPath.trim()
      : undefined;
  const provenance = inferCommandProvenance(command);
  const doesNotProve = hasText(command.doesNotProve)
    ? command.doesNotProve.trim()
    : provenance === "default_template"
      ? defaultTemplateCommandDoesNotProve
      : commandResultDoesNotProve;

  if (provenance === "captured_output_file" && outputRef !== undefined) {
    return {
      kind: "captured_output_file" as const,
      command: command.command,
      status: command.status,
      provenance,
      outputRef,
      ...(hasText(command.outputPath) ? { outputPath: command.outputPath.trim() } : {}),
      ...(command.exitCode === undefined ? {} : { exitCode: command.exitCode }),
      ...(hasText(command.capturedAt) ? { capturedAt: command.capturedAt.trim() } : {}),
      ...(hasText(command.assertedBy) ? { assertedBy: command.assertedBy.trim() } : {}),
      doesNotProve
    };
  }

  if (provenance === "external_log" && outputRef !== undefined) {
    return {
      kind: "external_log" as const,
      command: command.command,
      status: command.status,
      provenance,
      outputRef,
      ...(command.exitCode === undefined ? {} : { exitCode: command.exitCode }),
      ...(hasText(command.capturedAt) ? { capturedAt: command.capturedAt.trim() } : {}),
      doesNotProve
    };
  }

  if (
    provenance === "command_runner" &&
    isPassedOrFailed(command.status) &&
    command.exitCode !== undefined &&
    hasText(command.capturedAt)
  ) {
    return {
      kind: "command_runner" as const,
      command: command.command,
      status: command.status,
      provenance,
      exitCode: command.exitCode,
      capturedAt: command.capturedAt.trim(),
      ...(outputRef === undefined ? {} : { outputRef }),
      doesNotProve
    };
  }

  if (provenance === "operator_reported") {
    return {
      kind: "operator_reported" as const,
      command: command.command,
      status: command.status,
      provenance,
      ...(command.exitCode === undefined ? {} : { exitCode: command.exitCode }),
      ...(hasText(command.capturedAt) ? { capturedAt: command.capturedAt.trim() } : {}),
      ...(hasText(command.assertedBy) ? { assertedBy: command.assertedBy.trim() } : {}),
      doesNotProve
    };
  }

  return {
    kind: "default_template" as const,
    command: command.command,
    status: normalizeDefaultTemplateStatus(command.status),
    provenance: "default_template" as const,
    doesNotProve: defaultTemplateCommandDoesNotProve
  };
};

export const EvidenceCommandSchema = EvidenceCommandInputSchema.superRefine((value, context) => {
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
}).transform(normalizeEvidenceCommandInput);

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
