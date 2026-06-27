import type {
  EvidenceBundleId,
  ExecutionRunId
} from "./ids.js";
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
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
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

const hasText = (value: string | undefined): value is string =>
  value !== undefined && value.trim().length > 0;

const normalizeToken = (value: string | undefined): string =>
  value?.trim().toLowerCase().replaceAll("-", "_") ?? "";

const targetEvidenceModes = new Set<TargetEvidenceMode>([
  "observation_only",
  "headless_repair",
  "real_second_operator",
  "unknown"
]);

const targetDirtyStates = new Set<TargetDirtyState>(["clean", "dirty", "unknown"]);

const targetChangeOwnerships = new Set<TargetChangeOwnership>([
  "external",
  "owned_by_current_krn_run",
  "partial",
  "unknown"
]);

export const normalizeTargetEvidenceMode = (
  value: string | undefined
): TargetEvidenceMode => {
  const normalized = normalizeToken(value);

  return targetEvidenceModes.has(normalized as TargetEvidenceMode)
    ? normalized as TargetEvidenceMode
    : "unknown";
};

export const normalizeTargetDirtyState = (
  value: string | undefined
): TargetDirtyState => {
  const normalized = normalizeToken(value);

  return targetDirtyStates.has(normalized as TargetDirtyState)
    ? normalized as TargetDirtyState
    : "unknown";
};

export const normalizeTargetChangeOwnership = (
  value: string | undefined
): TargetChangeOwnership => {
  const normalized = normalizeToken(value);

  return targetChangeOwnerships.has(normalized as TargetChangeOwnership)
    ? normalized as TargetChangeOwnership
    : "unknown";
};

const normalizedStringList = (values: readonly string[] | undefined): string[] => [
  ...new Set((values ?? [])
    .map((value) => value.trim())
    .filter((value) => value.length > 0))
];

export const normalizeTargetEvidence = (
  input: TargetEvidenceInput
): TargetEvidence => {
  const ownedChanges = normalizeTargetChangeOwnership(input.ownedChanges);

  return {
    targetRepo: input.targetRepo.trim(),
    mode: normalizeTargetEvidenceMode(input.mode),
    dirtyBefore: normalizeTargetDirtyState(input.dirtyBefore),
    dirtyAfter: normalizeTargetDirtyState(input.dirtyAfter),
    ownedChanges,
    allowedWrites: normalizedStringList(input.allowedWrites),
    forbiddenWrites: normalizedStringList(input.forbiddenWrites),
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

const stringField = (
  record: Record<string, unknown>,
  key: string
): string | undefined => {
  const value = record[key];

  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
};

const stringListField = (
  record: Record<string, unknown>,
  key: string
): string[] => {
  const value = record[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string =>
    typeof item === "string" && item.trim().length > 0
  );
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
    const status = stringField(changedFile, "status");
    const path = stringField(changedFile, "path");

    if (status === undefined || path === undefined) {
      return [];
    }

    const ownership = stringField(changedFile, "ownership");

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
  const targetRepo = stringField(record, "targetRepo");

  if (targetRepo === undefined) {
    return undefined;
  }
  const mode = stringField(record, "mode");
  const dirtyBefore = stringField(record, "dirtyBefore");
  const dirtyAfter = stringField(record, "dirtyAfter");
  const ownedChanges = stringField(record, "ownedChanges");

  return normalizeTargetEvidence({
    targetRepo,
    ...(mode === undefined ? {} : { mode }),
    ...(dirtyBefore === undefined ? {} : { dirtyBefore }),
    ...(dirtyAfter === undefined ? {} : { dirtyAfter }),
    ...(ownedChanges === undefined ? {} : { ownedChanges }),
    allowedWrites: stringListField(record, "allowedWrites"),
    forbiddenWrites: stringListField(record, "forbiddenWrites"),
    changedFiles: targetChangedFilesField(record),
    commands: stringListField(record, "commands"),
    doesNotProve: stringListField(record, "doesNotProve")
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

export const normalizeEvidenceCommand = (
  command: EvidenceCommand
): NormalizedEvidenceCommand => {
  const outputRef = hasText(command.outputRef)
    ? command.outputRef.trim()
    : hasText(command.outputPath)
      ? command.outputPath.trim()
      : undefined;
  const provenance = command.provenance ?? inferCommandProvenance(command);
  const doesNotProve = hasText(command.doesNotProve)
    ? command.doesNotProve.trim()
    : provenance === "default_template"
      ? defaultTemplateCommandDoesNotProve
      : commandResultDoesNotProve;

  if (provenance === "captured_output_file" && outputRef !== undefined) {
    return {
      kind: "captured_output_file",
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
      kind: "external_log",
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

  if (provenance === "operator_reported") {
    return {
      kind: "operator_reported",
      command: command.command,
      status: command.status,
      provenance: "operator_reported",
      ...(command.exitCode === undefined ? {} : { exitCode: command.exitCode }),
      ...(hasText(command.capturedAt) ? { capturedAt: command.capturedAt.trim() } : {}),
      ...(hasText(command.assertedBy) ? { assertedBy: command.assertedBy.trim() } : {}),
      doesNotProve
    };
  }

  return {
    kind: "default_template",
    command: command.command,
    status: normalizeDefaultTemplateStatus(command.status),
    provenance: "default_template",
    doesNotProve: defaultTemplateCommandDoesNotProve
  };
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

const stringListMetadata = (
  metadata: Record<string, unknown>,
  key: string
): string[] => {
  const value = metadata[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && !isBlank(item));
};

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

  if (typeof bundle.metadata.diffSummary !== "string" || isBlank(bundle.metadata.diffSummary)) {
    findings.push("diffSummary is required");
  }

  if (stringListMetadata(bundle.metadata, "sourceRefs").length === 0) {
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
