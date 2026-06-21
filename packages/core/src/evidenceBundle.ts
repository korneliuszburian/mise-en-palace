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
