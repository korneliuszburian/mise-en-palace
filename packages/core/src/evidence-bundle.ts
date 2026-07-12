import type {
  EvidenceBundleId,
  ExecutionRunId
} from "./ids.js";
import {
  readMetadataString,
  readMetadataStringList
} from "./metadata.js";
import { isIsoTimestamp } from "./time.js";
import type { IsoTimestamp } from "./time.js";
import type { EvidenceContract } from "./evidence-contract.js";

export const evidenceBundleStatuses = [
  "draft",
  "captured",
  "verified",
  "rejected"
] as const;

export type EvidenceBundleStatus = typeof evidenceBundleStatuses[number];
export type EvidenceCommandStatus = "passed" | "failed" | "skipped" | "missing" | "not_run";
export const evidenceCommandStatuses = [
  "passed",
  "failed",
  "skipped",
  "missing",
  "not_run"
] as const satisfies readonly EvidenceCommandStatus[];
export type EvidenceCommandProvenance =
  | "default_template"
  | "operator_reported"
  | "captured_output_file"
  | "command_runner"
  | "external_log";
export type DiffRisk = "low" | "medium" | "high";
export type TargetEvidenceMode =
  | "observation_only"
  | "headless_repair"
  | "real_second_operator"
  | "unknown";
export type TargetDirtyState = "clean" | "dirty" | "unknown";
export type TargetChangeOwnership =
  | "external"
  | "owned_by_current_krn_run"
  | "partial"
  | "unknown";
export type TargetStatusFreshness =
  | "fresh_current_task"
  | "stale_prior_selection"
  | "changed_since_selection"
  | "unknown";
export type TargetPatchLifecycle =
  | "none"
  | "accepted_by_target_owner"
  | "rejected_by_target_owner"
  | "stronger_verification_requested"
  | "handed_off_unresolved"
  | "unknown";

export interface EvidenceCommand {
  command: string;
  status: EvidenceCommandStatus;
  provenance?: EvidenceCommandProvenance;
  exitCode?: number;
  outputPath?: string;
  outputRef?: string;
  capturedAt?: IsoTimestamp;
  assertedBy?: string;
  doesNotProve?: string;
}

export interface TargetEvidenceChangedFileInput {
  status: string;
  path: string;
  ownership?: string;
}

export interface TargetEvidenceChangedFile {
  status: string;
  path: string;
  ownership: TargetChangeOwnership;
}

export interface TargetEvidenceInput {
  targetRepo: string;
  mode?: string;
  dirtyBefore?: string;
  dirtyAfter?: string;
  ownedChanges?: string;
  targetStatusFreshness?: string;
  targetPatchLifecycle?: string;
  handoffArtifact?: string;
  targetOwnerDecision?: string;
  allowedWrites?: readonly string[];
  forbiddenWrites?: readonly string[];
  changedFiles?: readonly TargetEvidenceChangedFileInput[];
  commands?: readonly string[];
  doesNotProve?: readonly string[];
}

export interface TargetEvidence {
  targetRepo: string;
  mode: TargetEvidenceMode;
  dirtyBefore: TargetDirtyState;
  dirtyAfter: TargetDirtyState;
  ownedChanges: TargetChangeOwnership;
  targetStatusFreshness: TargetStatusFreshness;
  targetPatchLifecycle: TargetPatchLifecycle;
  handoffArtifact?: string;
  targetOwnerDecision?: string;
  allowedWrites: string[];
  forbiddenWrites: string[];
  changedFiles: TargetEvidenceChangedFile[];
  commands: string[];
  doesNotProve: string[];
}

interface BaseEvidenceCommandReadback {
  command: string;
  provenance: EvidenceCommandProvenance;
  doesNotProve: string;
}

export interface DefaultTemplateEvidenceCommand extends BaseEvidenceCommandReadback {
  kind: "default_template";
  status: "skipped" | "not_run";
  provenance: "default_template";
}

export interface OperatorReportedEvidenceCommand extends BaseEvidenceCommandReadback {
  kind: "operator_reported";
  status: EvidenceCommandStatus;
  provenance: "operator_reported";
  exitCode?: number;
  capturedAt?: IsoTimestamp;
  assertedBy?: string;
}

export interface CapturedOutputFileEvidenceCommand extends BaseEvidenceCommandReadback {
  kind: "captured_output_file";
  status: EvidenceCommandStatus;
  provenance: "captured_output_file";
  outputRef: string;
  outputPath?: string;
  exitCode?: number;
  capturedAt?: IsoTimestamp;
  assertedBy?: string;
}

export interface CommandRunnerEvidenceCommand extends BaseEvidenceCommandReadback {
  kind: "command_runner";
  status: "passed" | "failed";
  provenance: "command_runner";
  exitCode: number;
  capturedAt: IsoTimestamp;
  outputRef?: string;
}

export interface ExternalLogEvidenceCommand extends BaseEvidenceCommandReadback {
  kind: "external_log";
  status: EvidenceCommandStatus;
  provenance: "external_log";
  outputRef: string;
  exitCode?: number;
  capturedAt?: IsoTimestamp;
}

export type EvidenceCommandReadback =
  | DefaultTemplateEvidenceCommand
  | OperatorReportedEvidenceCommand
  | CapturedOutputFileEvidenceCommand
  | CommandRunnerEvidenceCommand
  | ExternalLogEvidenceCommand;

export type EvidenceCommandHelpedProofFailureReason =
  | "not_execution_backed"
  | "unresolved_output_reference"
  | "missing_captured_at"
  | "invalid_captured_at"
  | "invalid_packet_generated_at"
  | "captured_before_packet_issuance"
  | "missing_exit_code"
  | "passed_nonzero_exit_code"
  | "failed_zero_exit_code"
  | "command_not_passed";

export type EvidenceCommandHelpedProofAssessment =
  | {
      status: "eligible";
    }
  | {
      status: "ineligible";
      reason: EvidenceCommandHelpedProofFailureReason;
    };

export interface EvidenceBundle {
  id: EvidenceBundleId;
  executionRunId: ExecutionRunId;
  status: EvidenceBundleStatus;
  changedFiles: string[];
  commands: EvidenceCommand[];
  diffRisk: DiffRisk;
  reviewBurden: string;
  rollbackPath: string;
  metadata: EvidenceBundleMetadata;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface EvidenceBundleMetadata extends Record<string, unknown> {
  diffSummary?: unknown;
  sourceRefs?: unknown;
  targetEvidence?: unknown;
}

export interface EvidenceBundleMetadataReadback {
  diffSummary?: string;
  sourceRefs: string[];
}

export const defaultTemplateCommandDoesNotProve =
  "This command row does not prove the command executed; it is default template evidence only.";

export const commandResultDoesNotProve =
  "This command result does not prove memory quality, source truth, review correctness, or production readiness.";
export const targetEvidenceDoesNotProve = [
  "Target evidence does not prove KRN source correctness.",
  "Target evidence does not prove full target verification unless every target gate is represented by command evidence.",
  "Target evidence does not prove product readiness or V02-01 second-operator usability."
] as const;
const observationOnlyDefaultAllowedWrites = ["none"] as const;
const observationOnlyDefaultForbiddenWrites = [
  "target source edits",
  "target commits",
  "target resets or cleans",
  "target production/runtime writes"
] as const;

const hasText = (value: string | undefined): value is string =>
  value !== undefined && value.trim().length > 0;

const normalizeToken = (value: string | undefined): string =>
  value?.trim().toLowerCase().replaceAll("-", "_") ?? "";

const createTokenNormalizer = <TValue extends string>(
  values: readonly TValue[],
  fallback: TValue
): ((value: string | undefined) => TValue) => {
  const allowedValues = new Set<string>(values);

  return (value) => {
    const token = normalizeToken(value);

    return allowedValues.has(token) ? token as TValue : fallback;
  };
};

const targetEvidenceModeValues = [
  "observation_only",
  "headless_repair",
  "real_second_operator",
  "unknown"
] as const satisfies readonly TargetEvidenceMode[];

const targetDirtyStateValues = [
  "clean",
  "dirty",
  "unknown"
] as const satisfies readonly TargetDirtyState[];

const targetChangeOwnershipValues = [
  "external",
  "owned_by_current_krn_run",
  "partial",
  "unknown"
] as const satisfies readonly TargetChangeOwnership[];

const targetStatusFreshnessValues = [
  "fresh_current_task",
  "stale_prior_selection",
  "changed_since_selection",
  "unknown"
] as const satisfies readonly TargetStatusFreshness[];

const targetPatchLifecycleValues = [
  "none",
  "accepted_by_target_owner",
  "rejected_by_target_owner",
  "stronger_verification_requested",
  "handed_off_unresolved",
  "unknown"
] as const satisfies readonly TargetPatchLifecycle[];

export const normalizeTargetEvidenceMode = createTokenNormalizer(
  targetEvidenceModeValues,
  "unknown"
);

export const normalizeTargetDirtyState = createTokenNormalizer(
  targetDirtyStateValues,
  "unknown"
);

export const normalizeTargetChangeOwnership = createTokenNormalizer(
  targetChangeOwnershipValues,
  "unknown"
);

export const normalizeTargetStatusFreshness = createTokenNormalizer(
  targetStatusFreshnessValues,
  "unknown"
);

export const normalizeTargetPatchLifecycle = createTokenNormalizer(
  targetPatchLifecycleValues,
  "unknown"
);

const normalizedStringList = (values: readonly string[] | undefined): string[] => [
  ...new Set((values ?? [])
    .map((value) => value.trim())
    .filter((value) => value.length > 0))
];

const trimmedOptionalString = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();

  return trimmed === undefined || trimmed.length === 0 ? undefined : trimmed;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const parseEvidenceBundleMetadataReadback = (
  input: unknown
): EvidenceBundleMetadataReadback => {
  if (!isRecord(input)) {
    return { sourceRefs: [] };
  }

  const metadata = input as EvidenceBundleMetadata;
  const diffSummary = trimmedOptionalString(readMetadataString(metadata, "diffSummary"));

  return {
    ...(diffSummary === undefined ? {} : { diffSummary }),
    sourceRefs: normalizedStringList(readMetadataStringList(metadata, "sourceRefs"))
  };
};

export const normalizeTargetEvidence = (
  input: TargetEvidenceInput
): TargetEvidence => {
  const mode = normalizeTargetEvidenceMode(input.mode);
  const ownedChanges = normalizeTargetChangeOwnership(input.ownedChanges);
  const allowedWrites = normalizedStringList(input.allowedWrites);
  const forbiddenWrites = normalizedStringList(input.forbiddenWrites);
  const handoffArtifact = trimmedOptionalString(input.handoffArtifact);
  const targetOwnerDecision = trimmedOptionalString(input.targetOwnerDecision);

  return {
    targetRepo: input.targetRepo.trim(),
    mode,
    dirtyBefore: normalizeTargetDirtyState(input.dirtyBefore),
    dirtyAfter: normalizeTargetDirtyState(input.dirtyAfter),
    ownedChanges,
    targetStatusFreshness: normalizeTargetStatusFreshness(input.targetStatusFreshness),
    targetPatchLifecycle: normalizeTargetPatchLifecycle(input.targetPatchLifecycle),
    ...(handoffArtifact === undefined ? {} : { handoffArtifact }),
    ...(targetOwnerDecision === undefined ? {} : { targetOwnerDecision }),
    allowedWrites: mode === "observation_only" && allowedWrites.length === 0
      ? [...observationOnlyDefaultAllowedWrites]
      : allowedWrites,
    forbiddenWrites: mode === "observation_only" && forbiddenWrites.length === 0
      ? [...observationOnlyDefaultForbiddenWrites]
      : forbiddenWrites,
    changedFiles: (input.changedFiles ?? [])
      .map((file) => ({
        status: file.status.trim(),
        path: file.path.trim(),
        ownership: normalizeTargetChangeOwnership(file.ownership ?? ownedChanges)
      }))
      .filter((file) => file.status.length > 0 && file.path.length > 0),
    commands: normalizedStringList(input.commands),
    doesNotProve: normalizedStringList(input.doesNotProve).length === 0
      ? [...targetEvidenceDoesNotProve]
      : normalizedStringList(input.doesNotProve)
  };
};

const targetChangedFilesField = (
  record: Record<string, unknown>
): TargetEvidenceChangedFileInput[] => {
  const value = record.changedFiles;

  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item): TargetEvidenceChangedFileInput[] => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      return [];
    }

    const changedFile = item as Record<string, unknown>;
    const status = readMetadataString(changedFile, "status");
    const path = readMetadataString(changedFile, "path");

    if (status === undefined || path === undefined) {
      return [];
    }

    const ownership = readMetadataString(changedFile, "ownership");

    return [{
      status,
      path,
      ...(ownership === undefined ? {} : { ownership })
    }];
  });
};

export const targetEvidenceFromMetadata = (
  input: unknown
): TargetEvidence | undefined => {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return undefined;
  }

  const record = input as Record<string, unknown>;
  const targetRepo = readMetadataString(record, "targetRepo");

  if (targetRepo === undefined) {
    return undefined;
  }
  const mode = readMetadataString(record, "mode");
  const dirtyBefore = readMetadataString(record, "dirtyBefore");
  const dirtyAfter = readMetadataString(record, "dirtyAfter");
  const ownedChanges = readMetadataString(record, "ownedChanges");
  const targetStatusFreshness = readMetadataString(record, "targetStatusFreshness");
  const targetPatchLifecycle = readMetadataString(record, "targetPatchLifecycle");
  const handoffArtifact = readMetadataString(record, "handoffArtifact");
  const targetOwnerDecision = readMetadataString(record, "targetOwnerDecision");

  return normalizeTargetEvidence({
    targetRepo,
    ...(mode === undefined ? {} : { mode }),
    ...(dirtyBefore === undefined ? {} : { dirtyBefore }),
    ...(dirtyAfter === undefined ? {} : { dirtyAfter }),
    ...(ownedChanges === undefined ? {} : { ownedChanges }),
    ...(targetStatusFreshness === undefined ? {} : { targetStatusFreshness }),
    ...(targetPatchLifecycle === undefined ? {} : { targetPatchLifecycle }),
    ...(handoffArtifact === undefined ? {} : { handoffArtifact }),
    ...(targetOwnerDecision === undefined ? {} : { targetOwnerDecision }),
    allowedWrites: readMetadataStringList(record, "allowedWrites"),
    forbiddenWrites: readMetadataStringList(record, "forbiddenWrites"),
    changedFiles: targetChangedFilesField(record),
    commands: readMetadataStringList(record, "commands"),
    doesNotProve: readMetadataStringList(record, "doesNotProve")
  });
};

const isPassedOrFailed = (status: EvidenceCommandStatus): status is "passed" | "failed" =>
  status === "passed" || status === "failed";

const inferCommandProvenance = (command: EvidenceCommand): EvidenceCommandProvenance => {
  if (hasText(command.outputRef) || hasText(command.outputPath)) {
    return "captured_output_file";
  }

  if (
    (command.status === "passed" || command.status === "failed") &&
    command.exitCode !== undefined
  ) {
    return "operator_reported";
  }

  return "default_template";
};

const normalizeDefaultTemplateStatus = (
  status: EvidenceCommandStatus
): DefaultTemplateEvidenceCommand["status"] =>
  status === "skipped" ? "skipped" : "not_run";

const normalizedCommandOutputRef = (
  command: EvidenceCommand
): string | undefined =>
  hasText(command.outputRef)
    ? command.outputRef.trim()
    : hasText(command.outputPath)
      ? command.outputPath.trim()
      : undefined;

const normalizedCommandDoesNotProve = (
  command: EvidenceCommand,
  provenance: EvidenceCommandProvenance
): string =>
  hasText(command.doesNotProve)
    ? command.doesNotProve.trim()
    : provenance === "default_template"
      ? defaultTemplateCommandDoesNotProve
      : commandResultDoesNotProve;

type OptionalCommandExecutionDetails = {
  exitCode?: number;
  capturedAt?: IsoTimestamp;
};

const optionalCommandExecutionDetails = (
  command: EvidenceCommand
): OptionalCommandExecutionDetails => ({
  ...(command.exitCode === undefined ? {} : { exitCode: command.exitCode }),
  ...(hasText(command.capturedAt) ? { capturedAt: command.capturedAt.trim() } : {})
});

const optionalCommandAssertionDetails = (
  command: EvidenceCommand
): Pick<OperatorReportedEvidenceCommand, "assertedBy"> | Record<string, never> =>
  hasText(command.assertedBy) ? { assertedBy: command.assertedBy.trim() } : {};

const normalizeDefaultTemplateCommand = (
  command: EvidenceCommand
): DefaultTemplateEvidenceCommand => (
  {
    kind: "default_template",
    command: command.command,
    status: normalizeDefaultTemplateStatus(command.status),
    provenance: "default_template",
    doesNotProve: defaultTemplateCommandDoesNotProve
  }
);

export const toEvidenceCommandReadback = (
  command: EvidenceCommand
): EvidenceCommandReadback => {
  const provenance = command.provenance ?? inferCommandProvenance(command);
  const outputRef = normalizedCommandOutputRef(command);
  const doesNotProve = normalizedCommandDoesNotProve(command, provenance);

  switch (provenance) {
    case "captured_output_file":
      if (outputRef !== undefined) {
        return {
          kind: "captured_output_file",
          command: command.command,
          status: command.status,
          provenance,
          outputRef,
          ...(hasText(command.outputPath) ? { outputPath: command.outputPath.trim() } : {}),
          ...optionalCommandExecutionDetails(command),
          ...optionalCommandAssertionDetails(command),
          doesNotProve
        };
      }
      break;

    case "external_log":
      if (outputRef !== undefined) {
        return {
          kind: "external_log",
          command: command.command,
          status: command.status,
          provenance,
          outputRef,
          ...optionalCommandExecutionDetails(command),
          doesNotProve
        };
      }
      break;

    case "command_runner":
      if (
        isPassedOrFailed(command.status) &&
        command.exitCode !== undefined &&
        hasText(command.capturedAt)
      ) {
        return {
          kind: "command_runner",
          command: command.command,
          status: command.status,
          provenance,
          exitCode: command.exitCode,
          capturedAt: command.capturedAt.trim(),
          ...(outputRef === undefined ? {} : { outputRef }),
          doesNotProve
        };
      }
      break;

    case "operator_reported":
      return {
        kind: "operator_reported",
        command: command.command,
        status: command.status,
        provenance,
        ...optionalCommandExecutionDetails(command),
        ...optionalCommandAssertionDetails(command),
        doesNotProve
      };

    case "default_template":
      break;
  }

  return normalizeDefaultTemplateCommand(command);
};

const ineligibleCommandHelpedProof = (
  reason: EvidenceCommandHelpedProofFailureReason
): EvidenceCommandHelpedProofAssessment => ({
  status: "ineligible",
  reason
});

const commandCaptureAssessment = (
  command: CommandRunnerEvidenceCommand,
  packetGeneratedAt: IsoTimestamp
): EvidenceCommandHelpedProofAssessment | undefined => {
  const capturedAt = command.capturedAt?.trim();

  if (capturedAt === undefined || capturedAt.length === 0) {
    return ineligibleCommandHelpedProof("missing_captured_at");
  }

  const capturedAtMillis = Date.parse(capturedAt);

  if (!isIsoTimestamp(capturedAt) || !Number.isFinite(capturedAtMillis)) {
    return ineligibleCommandHelpedProof("invalid_captured_at");
  }

  const packetGeneratedAtMillis = Date.parse(packetGeneratedAt);

  if (!Number.isFinite(packetGeneratedAtMillis)) {
    return ineligibleCommandHelpedProof("invalid_packet_generated_at");
  }

  return capturedAtMillis < packetGeneratedAtMillis
    ? ineligibleCommandHelpedProof("captured_before_packet_issuance")
    : undefined;
};

const commandStatusAssessment = (
  command: CommandRunnerEvidenceCommand
): EvidenceCommandHelpedProofAssessment => {
  if (command.status === "passed") {
    if (command.exitCode === undefined) {
      return ineligibleCommandHelpedProof("missing_exit_code");
    }

    return command.exitCode === 0
      ? { status: "eligible" }
      : ineligibleCommandHelpedProof("passed_nonzero_exit_code");
  }

  if (command.status === "failed" && command.exitCode === 0) {
    return ineligibleCommandHelpedProof("failed_zero_exit_code");
  }

  return ineligibleCommandHelpedProof("command_not_passed");
};

export const assessEvidenceCommandHelpedProof = (input: {
  command: EvidenceCommandReadback;
  packetGeneratedAt: IsoTimestamp;
}): EvidenceCommandHelpedProofAssessment => {
  if (
    input.command.kind === "captured_output_file" ||
    input.command.kind === "external_log"
  ) {
    return ineligibleCommandHelpedProof("unresolved_output_reference");
  }

  if (input.command.kind !== "command_runner") {
    return ineligibleCommandHelpedProof("not_execution_backed");
  }

  return commandCaptureAssessment(input.command, input.packetGeneratedAt) ??
    commandStatusAssessment(input.command);
};

export const evidenceBundleProvesHelped = (input: {
  bundle: EvidenceBundle;
  evidenceContract: EvidenceContract | undefined;
  packetChecksum: string;
  packetGeneratedAt: IsoTimestamp;
}): boolean => {
  const bundleCreatedAt = Date.parse(input.bundle.createdAt);
  const packetGeneratedAt = Date.parse(input.packetGeneratedAt);

  if (
    (input.bundle.status !== "captured" && input.bundle.status !== "verified") ||
    readMetadataString(input.bundle.metadata, "decisionPacketChecksum") !== input.packetChecksum ||
    readMetadataString(input.bundle.metadata, "decisionPacketGeneratedAt") !== input.packetGeneratedAt ||
    input.evidenceContract === undefined ||
    !Number.isFinite(bundleCreatedAt) ||
    !Number.isFinite(packetGeneratedAt) ||
    bundleCreatedAt < packetGeneratedAt
  ) {
    return false;
  }

  const requiredCommands = new Set(
    input.evidenceContract.commands
      .filter((command) => command.required)
      .map((command) => command.command)
  );

  if (requiredCommands.size === 0) {
    return false;
  }

  const provenCommands = new Set(input.bundle.commands
    .map(toEvidenceCommandReadback)
    .filter((command) =>
      assessEvidenceCommandHelpedProof({
        command,
        packetGeneratedAt: input.packetGeneratedAt
      }).status === "eligible")
    .map((command) => command.command));

  return [...requiredCommands].every((command) => provenCommands.has(command));
};
