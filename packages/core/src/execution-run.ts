import type {
  ExecutionRunId,
  HarnessPlanId
} from "./ids.js";
import type { IsoTimestamp } from "./time.js";

export const executionRunStatuses = [
  "planned",
  "running",
  "succeeded",
  "failed",
  "blocked",
  "cancelled"
] as const;

export type ExecutionRunStatus = typeof executionRunStatuses[number];

export interface ExecutionRun {
  id: ExecutionRunId;
  harnessPlanId: HarnessPlanId;
  adapter: string;
  status: ExecutionRunStatus;
  startedAt?: IsoTimestamp;
  completedAt?: IsoTimestamp;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}
