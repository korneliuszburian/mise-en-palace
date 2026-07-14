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

export type ExecutionRunLifecycleConflict =
  | {
      readonly kind: "status";
      readonly executionRunId: ExecutionRunId;
      readonly expectedStatus: ExecutionRunStatus;
      readonly actualStatus: ExecutionRunStatus;
    }
  | {
      readonly kind: "revision";
      readonly executionRunId: ExecutionRunId;
      readonly expectedLifecycleRevision: number;
      readonly actualLifecycleRevision: number;
    };

export class ExecutionRunLifecycleConflictError extends Error {
  constructor(readonly conflict: ExecutionRunLifecycleConflict) {
    super(
      conflict.kind === "status"
        ? `execution run lifecycle conflict for ${conflict.executionRunId}: expected status ${conflict.expectedStatus} but found ${conflict.actualStatus}`
        : `execution run lifecycle conflict for ${conflict.executionRunId}: expected revision ${conflict.expectedLifecycleRevision} but found ${conflict.actualLifecycleRevision}`
    );
    this.name = "ExecutionRunLifecycleConflictError";
  }
}

export interface ExecutionRun {
  id: ExecutionRunId;
  harnessPlanId: HarnessPlanId;
  adapter: string;
  status: ExecutionRunStatus;
  lifecycleRevision: number;
  startedAt?: IsoTimestamp;
  completedAt?: IsoTimestamp;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}
