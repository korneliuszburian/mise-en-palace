import type {
  EvidenceBundleId,
  ExecutionRunId
} from "./ids.js";
import type { IsoTimestamp } from "./time.js";

export type EvidenceBundleStatus = "draft" | "captured" | "verified" | "rejected";
export type EvidenceCommandStatus = "passed" | "failed" | "skipped";
export type DiffRisk = "low" | "medium" | "high";
export type ReviewBurdenScore = "low" | "medium" | "high";

export interface EvidenceCommand {
  command: string;
  status: EvidenceCommandStatus;
  exitCode?: number;
  outputPath?: string;
}

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
  bundle.commands.some((entry) => entry.command === command && entry.status === "skipped");

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
