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

export const executionRunLifecycleCreatedEventType =
  "execution_run.lifecycle.created" as const;
export const executionRunLifecycleTransitionedEventType =
  "execution_run.lifecycle.transitioned" as const;

export type ExecutionRunLifecycleEventType =
  | typeof executionRunLifecycleCreatedEventType
  | typeof executionRunLifecycleTransitionedEventType;

export interface ExecutionRunLifecycleCreatedEventPayload {
  readonly status: ExecutionRunStatus;
  readonly lifecycleRevision: number;
}

export interface ExecutionRunLifecycleTransitionedEventPayload {
  readonly fromStatus: ExecutionRunStatus;
  readonly toStatus: ExecutionRunStatus;
  readonly lifecycleRevision: number;
}

interface ExecutionRunLifecycleEventRecordBase {
  readonly id: string;
  readonly executionRunId: ExecutionRunId;
  readonly sequence: number;
  readonly severity: "info";
  readonly message: string;
  readonly occurredAt: IsoTimestamp;
}

export interface ExecutionRunLifecycleCreatedEventRecord
  extends ExecutionRunLifecycleEventRecordBase {
  readonly type: typeof executionRunLifecycleCreatedEventType;
  readonly payload: ExecutionRunLifecycleCreatedEventPayload;
}

export interface ExecutionRunLifecycleTransitionedEventRecord
  extends ExecutionRunLifecycleEventRecordBase {
  readonly type: typeof executionRunLifecycleTransitionedEventType;
  readonly payload: ExecutionRunLifecycleTransitionedEventPayload;
}

export type ExecutionRunLifecycleEventRecord =
  | ExecutionRunLifecycleCreatedEventRecord
  | ExecutionRunLifecycleTransitionedEventRecord;

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

export type UpdateExecutionRunStatusResult =
  | {
      readonly kind: "transitioned";
      readonly executionRun: ExecutionRun;
      readonly lifecycleEvent: ExecutionRunLifecycleTransitionedEventRecord;
    }
  | {
      readonly kind: "already_at_status";
      readonly executionRun: ExecutionRun;
    };

export const executionRunLifecycleCreatedEvent = (
  executionRun: Pick<ExecutionRun, "status" | "lifecycleRevision">
): {
  readonly type: typeof executionRunLifecycleCreatedEventType;
  readonly severity: "info";
  readonly message: string;
  readonly payload: ExecutionRunLifecycleCreatedEventPayload;
} => ({
  type: executionRunLifecycleCreatedEventType,
  severity: "info",
  message: `Execution run created with status ${executionRun.status}.`,
  payload: {
    status: executionRun.status,
    lifecycleRevision: executionRun.lifecycleRevision
  }
});

export const executionRunLifecycleTransitionedEvent = (
  previous: Pick<ExecutionRun, "status">,
  executionRun: Pick<ExecutionRun, "status" | "lifecycleRevision">
): {
  readonly type: typeof executionRunLifecycleTransitionedEventType;
  readonly severity: "info";
  readonly message: string;
  readonly payload: ExecutionRunLifecycleTransitionedEventPayload;
} => ({
  type: executionRunLifecycleTransitionedEventType,
  severity: "info",
  message: `Execution run transitioned from ${previous.status} to ${executionRun.status}.`,
  payload: {
    fromStatus: previous.status,
    toStatus: executionRun.status,
    lifecycleRevision: executionRun.lifecycleRevision
  }
});
