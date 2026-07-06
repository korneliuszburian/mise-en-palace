export type JobState =
  | "queued"
  | "leased"
  | "completed"
  | "retryable_failed"
  | "dead_lettered";

export interface JobEnvelope {
  readonly id: string;
  readonly idempotencyKey: string;
  readonly retryBudget: number;
  readonly leaseTimeoutMs: number;
  readonly state: JobState;
}

export interface JobClock {
  readonly nowMs: () => number;
}
