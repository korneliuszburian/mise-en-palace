import type {
  EvidenceBundleId,
  ExecutionRunId
} from "./ids.js";
import type { IsoTimestamp } from "./time.js";

export type EvidenceBundleStatus = "draft" | "captured" | "verified" | "rejected";
export type EvidenceCommandStatus = "passed" | "failed" | "skipped";
export type DiffRisk = "low" | "medium" | "high";

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
