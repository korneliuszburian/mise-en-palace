import type {
  JobEnvelope
} from "../src/jobQueue.js";

const job: JobEnvelope = {
  id: "job-1",
  idempotencyKey: "tenant:invoice:1",
  retryBudget: 3,
  leaseTimeoutMs: 30000,
  state: "queued"
};

if (job.idempotencyKey !== "tenant:invoice:1" || job.retryBudget !== 3) {
  throw new Error("Job boundary lost explicit idempotency or retry budget.");
}
