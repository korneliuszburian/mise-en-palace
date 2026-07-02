import type {
  EvidenceBundleId,
  ExecutionRunId
} from "./ids.js";
import {
  readMetadataString,
  readMetadataStringList
} from "./metadata.js";
import type { IsoTimestamp } from "./time.js";

export type EvidenceBundleStatus = "draft" | "captured" | "verified" | "rejected";
export type EvidenceCommandStatus = "passed" | "failed" | "skipped" | "missing" | "not_run";
export type EvidenceCommandProvenance =
  | "default_template"
  | "operator_reported"
  | "captured_output_file"
  | "command_runner"
  | "external_log";
export type DiffRisk = "low" | "medium" | "high";
export type ReviewBurdenScore = "low" | "medium" | "high";
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

interface BaseNormalizedEvidenceCommand {
  command: string;
  provenance: EvidenceCommandProvenance;
  doesNotProve: string;
}

export interface DefaultTemplateEvidenceCommand extends BaseNormalizedEvidenceCommand {
  kind: "default_template";
  status: "skipped" | "not_run";
  provenance: "default_template";
}

export interface OperatorReportedEvidenceCommand extends BaseNormalizedEvidenceCommand {
  kind: "operator_reported";
  status: EvidenceCommandStatus;
  provenance: "operator_reported";
  exitCode?: number;
  capturedAt?: IsoTimestamp;
  assertedBy?: string;
}

export interface CapturedOutputFileEvidenceCommand extends BaseNormalizedEvidenceCommand {
  kind: "captured_output_file";
  status: EvidenceCommandStatus;
  provenance: "captured_output_file";
  outputRef: string;
  outputPath?: string;
  exitCode?: number;
  capturedAt?: IsoTimestamp;
  assertedBy?: string;
}

export interface CommandRunnerEvidenceCommand extends BaseNormalizedEvidenceCommand {
  kind: "command_runner";
  status: "passed" | "failed";
  provenance: "command_runner";
  exitCode: number;
  capturedAt: IsoTimestamp;
  outputRef?: string;
}

export interface ExternalLogEvidenceCommand extends BaseNormalizedEvidenceCommand {
  kind: "external_log";
  status: EvidenceCommandStatus;
  provenance: "external_log";
  outputRef: string;
  exitCode?: number;
  capturedAt?: IsoTimestamp;
}

export type NormalizedEvidenceCommand =
  | DefaultTemplateEvidenceCommand
  | OperatorReportedEvidenceCommand
  | CapturedOutputFileEvidenceCommand
  | CommandRunnerEvidenceCommand
  | ExternalLogEvidenceCommand;

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

export interface EvidenceReviewRiskScore {
  diffRisk: DiffRisk;
  reviewBurden: ReviewBurdenScore;
  reasons: string[];
}

const isBlank = (value: string): boolean => value.trim().length === 0;

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
    const normalized = normalizeToken(value);

    return allowedValues.has(normalized) ? normalized as TValue : fallback;
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

const normalizedOptionalString = (value: string | undefined): string | undefined => {
  const normalized = value?.trim();

  return normalized === undefined || normalized.length === 0 ? undefined : normalized;
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
  const diffSummary = normalizedOptionalString(readMetadataString(metadata, "diffSummary"));

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
  const handoffArtifact = normalizedOptionalString(input.handoffArtifact);
  const targetOwnerDecision = normalizedOptionalString(input.targetOwnerDecision);

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

export const normalizeEvidenceCommand = (
  command: EvidenceCommand
): NormalizedEvidenceCommand => {
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

const hasRequiredCommand = (
  bundle: EvidenceBundle,
  requiredCommand: string
): boolean =>
  bundle.commands.some((command) => command.command === requiredCommand);

const requiredCommandPassed = (
  bundle: EvidenceBundle,
  requiredCommand: string
): boolean =>
  bundle.commands.some((command) =>
    command.command === requiredCommand && command.status === "passed"
  );

const clampRisk = (score: number): DiffRisk => {
  if (score >= 2) {
    return "high";
  }

  if (score >= 1) {
    return "medium";
  }

  return "low";
};

const docsOnly = (changedFiles: readonly string[]): boolean =>
  changedFiles.length > 0 && changedFiles.every((file) =>
    file.startsWith("docs/") ||
    file === "README.md" ||
    file === "PLAN.md" ||
    file === "GOAL.md" ||
    file === "AGENTS.md"
  );

const commandFailed = (bundle: EvidenceBundle, command: string): boolean =>
  bundle.commands.some((entry) => entry.command === command && entry.status === "failed");

const commandSkippedOrMissing = (bundle: EvidenceBundle, command: string): boolean =>
  !hasRequiredCommand(bundle, command) ||
  bundle.commands.some((entry) =>
    entry.command === command &&
    (entry.status === "skipped" || entry.status === "missing" || entry.status === "not_run")
  );

const requiredCommandsPassed = (bundle: EvidenceBundle): boolean =>
  ["pnpm typecheck", "pnpm test"].every((command) => requiredCommandPassed(bundle, command));

const touchesDatabaseOrMigration = (changedFiles: readonly string[]): boolean =>
  changedFiles.some((file) =>
    file.startsWith("packages/db/") ||
    file.includes("/migrations/") ||
    file.includes("/schema/")
  );

const touchesCoreDomain = (changedFiles: readonly string[]): boolean =>
  changedFiles.some((file) => file.startsWith("packages/core/src/"));

const hasConcreteRollbackCommand = (rollbackPath: string): boolean => {
  const normalized = rollbackPath.toLowerCase();

  return (
    normalized.includes("git revert") ||
    normalized.includes("git restore") ||
    normalized.includes("git checkout") ||
    normalized.includes("rollback") ||
    normalized.includes("restore from") ||
    normalized.includes("re-run")
  );
};

export const assessEvidenceBundleCompleteness = (
  bundle: EvidenceBundle
): string[] => {
  const findings: string[] = [];
  const metadata = parseEvidenceBundleMetadataReadback(bundle.metadata);

  if (isBlank(bundle.executionRunId)) {
    findings.push("executionRunId is required");
  }

  if (bundle.changedFiles.length === 0) {
    findings.push("changedFiles are required");
  }

  for (const command of ["pnpm typecheck", "pnpm test"] as const) {
    if (!hasRequiredCommand(bundle, command)) {
      findings.push(`${command} evidence is required`);
    } else if (!requiredCommandPassed(bundle, command)) {
      findings.push(`${command} evidence must pass`);
    }
  }

  if (metadata.diffSummary === undefined) {
    findings.push("diffSummary is required");
  }

  if (metadata.sourceRefs.length === 0) {
    findings.push("sourceRefs are required");
  }

  if (isBlank(bundle.reviewBurden)) {
    findings.push("reviewBurden is required");
  }

  if (isBlank(bundle.rollbackPath)) {
    findings.push("rollbackPath is required");
  }

  return findings;
};

export const assessEvidenceBundleRollbackPath = (
  bundle: EvidenceBundle
): string[] => {
  if (docsOnly(bundle.changedFiles)) {
    return [];
  }

  if (isBlank(bundle.rollbackPath)) {
    return ["rollbackPath is required for non-doc changes"];
  }

  if (!hasConcreteRollbackCommand(bundle.rollbackPath)) {
    return ["rollbackPath must include a concrete revert or recovery command"];
  }

  return [];
};

export const scoreEvidenceBundleReviewRisk = (
  bundle: EvidenceBundle
): EvidenceReviewRiskScore => {
  let diffRiskScore = 0;
  let reviewBurdenScore = 0;
  const reasons: string[] = [];

  if (docsOnly(bundle.changedFiles)) {
    reasons.push("docs-only diff");
  }

  if (bundle.changedFiles.length > 5) {
    diffRiskScore += 1;
    reviewBurdenScore += 1;
    reasons.push(`broad diff touches ${bundle.changedFiles.length} files`);
  }

  if (touchesDatabaseOrMigration(bundle.changedFiles)) {
    diffRiskScore += 2;
    reviewBurdenScore += 2;
    reasons.push("database or migration files changed");
  } else if (touchesCoreDomain(bundle.changedFiles)) {
    diffRiskScore += 1;
    reviewBurdenScore += 1;
    reasons.push("core domain files changed");
  }

  for (const command of ["pnpm typecheck", "pnpm test"] as const) {
    if (commandFailed(bundle, command)) {
      diffRiskScore += 2;
      reviewBurdenScore += 2;
      reasons.push(`required command failed: ${command}`);
    } else if (commandSkippedOrMissing(bundle, command)) {
      diffRiskScore += 1;
      reviewBurdenScore += 1;
      reasons.push(`required command missing or skipped: ${command}`);
    }
  }

  if (requiredCommandsPassed(bundle)) {
    reasons.push("required commands passed");
  }

  return {
    diffRisk: clampRisk(diffRiskScore),
    reviewBurden: clampRisk(reviewBurdenScore),
    reasons
  };
};
