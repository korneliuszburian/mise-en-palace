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

const normalizedCommandOutputRef = (
  command: EvidenceCommandInput
): string | undefined => {
  const outputRef = command.outputRef?.trim();
  if (outputRef !== undefined && outputRef.length > 0) {
    return outputRef;
  }

  const outputPath = command.outputPath?.trim();
  return outputPath === undefined || outputPath.length === 0 ? undefined : outputPath;
};

const normalizedCommandDoesNotProve = (
  command: EvidenceCommandInput,
  provenance: EvidenceCommandProvenance
): string => {
  const explicitLimit = command.doesNotProve?.trim();
  if (explicitLimit !== undefined && explicitLimit.length > 0) {
    return explicitLimit;
  }

  return provenance === "default_template"
    ? defaultTemplateCommandDoesNotProve
    : commandResultDoesNotProve;
};

interface EvidenceCommandNormalizationContext {
  command: EvidenceCommandInput;
  provenance: EvidenceCommandProvenance;
  outputRef?: string;
  doesNotProve: string;
}

type OptionalCommandExecutionDetails = {
  exitCode?: number;
  capturedAt?: string;
};

const optionalCommandExecutionDetails = (
  command: EvidenceCommandInput
): OptionalCommandExecutionDetails => ({
  ...(command.exitCode === undefined ? {} : { exitCode: command.exitCode }),
  ...(hasText(command.capturedAt) ? { capturedAt: command.capturedAt.trim() } : {})
});

const optionalAssertedBy = (
  command: EvidenceCommandInput
): { assertedBy?: string } => ({
  ...(hasText(command.assertedBy) ? { assertedBy: command.assertedBy.trim() } : {})
});

const buildEvidenceCommandNormalizationContext = (
  command: EvidenceCommandInput
): EvidenceCommandNormalizationContext => {
  const outputRef = normalizedCommandOutputRef(command);
  const provenance = inferCommandProvenance(command);
  const context: EvidenceCommandNormalizationContext = {
    command,
    provenance,
    doesNotProve: normalizedCommandDoesNotProve(command, provenance)
  };

  return outputRef === undefined ? context : { ...context, outputRef };
};

const normalizeCapturedOutputFileCommand = (
  context: EvidenceCommandNormalizationContext
) => {
  const { command, outputRef, provenance, doesNotProve } = context;

  if (provenance === "captured_output_file" && outputRef !== undefined) {
    return {
      kind: "captured_output_file" as const,
      command: command.command,
      status: command.status,
      provenance,
      outputRef,
      ...(hasText(command.outputPath) ? { outputPath: command.outputPath.trim() } : {}),
      ...optionalCommandExecutionDetails(command),
      ...optionalAssertedBy(command),
      doesNotProve
    };
  }

  return undefined;
};

const normalizeExternalLogCommand = (
  context: EvidenceCommandNormalizationContext
) => {
  const { command, outputRef, provenance, doesNotProve } = context;

  if (provenance === "external_log" && outputRef !== undefined) {
    return {
      kind: "external_log" as const,
      command: command.command,
      status: command.status,
      provenance,
      outputRef,
      ...optionalCommandExecutionDetails(command),
      doesNotProve
    };
  }

  return undefined;
};

const normalizeCommandRunnerCommand = (
  context: EvidenceCommandNormalizationContext
) => {
  const { command, outputRef, provenance, doesNotProve } = context;
  const capturedAt = command.capturedAt?.trim();

  if (provenance !== "command_runner" || !isPassedOrFailed(command.status)) {
    return undefined;
  }

  if (command.exitCode === undefined || capturedAt === undefined || capturedAt.length === 0) {
    return undefined;
  }

  return {
    kind: "command_runner" as const,
    command: command.command,
    status: command.status,
    provenance,
    exitCode: command.exitCode,
    capturedAt,
    ...(outputRef === undefined ? {} : { outputRef }),
    doesNotProve
  };
};

const normalizeOperatorReportedCommand = (
  context: EvidenceCommandNormalizationContext
) => {
  const { command, provenance, doesNotProve } = context;

  if (provenance === "operator_reported") {
    return {
      kind: "operator_reported" as const,
      command: command.command,
      status: command.status,
      provenance,
      ...optionalCommandExecutionDetails(command),
      ...optionalAssertedBy(command),
      doesNotProve
    };
  }

  return undefined;
};

const normalizeDefaultTemplateCommand = (command: EvidenceCommandInput) => (
  {
    kind: "default_template" as const,
    command: command.command,
    status: normalizeDefaultTemplateStatus(command.status),
    provenance: "default_template" as const,
    doesNotProve: defaultTemplateCommandDoesNotProve
  }
);

const normalizeEvidenceCommandInput = (command: EvidenceCommandInput) => {
  const context = buildEvidenceCommandNormalizationContext(command);
  const capturedOutput = normalizeCapturedOutputFileCommand(context);
  if (capturedOutput !== undefined) {
    return capturedOutput;
  }

  const externalLog = normalizeExternalLogCommand(context);
  if (externalLog !== undefined) {
    return externalLog;
  }

  const commandRunner = normalizeCommandRunnerCommand(context);
  if (commandRunner !== undefined) {
    return commandRunner;
  }

  return normalizeOperatorReportedCommand(context) ?? normalizeDefaultTemplateCommand(command);
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

const EvidenceChangedFileClassificationMetadataSchema = z.object({
  intended: TextListSchema,
  unrelated: TextListSchema,
  unknown: TextListSchema,
  unmatchedIntendedFiles: TextListSchema
});

const EvidenceDirtyContextMetadataSchema = z.object({
  hasUnrelatedFiles: z.boolean(),
  unrelatedFileCount: z.number().int().nonnegative()
});

export const EvidenceCaptureMetadataSchema = MetadataSchema.superRefine((value, context) => {
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
}).transform((value) => {
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
});

export const EvidenceCaptureInputSchema = z.object({
  executionRunId: z.string().uuid().optional(),
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
