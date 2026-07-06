import type {
  ExecutionRunId,
  HarnessPlanId
} from "./ids.js";
import type { IsoTimestamp } from "./time.js";

export type ExecutionRunStatus =
  | "planned"
  | "running"
  | "succeeded"
  | "failed"
  | "blocked"
  | "cancelled";

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
