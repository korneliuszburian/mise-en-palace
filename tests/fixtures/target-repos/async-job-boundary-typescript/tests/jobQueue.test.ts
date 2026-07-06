import { describe, expect, it } from "vitest";

import type {
  JobEnvelope
} from "../src/jobQueue.js";

describe("job boundary fixture", () => {
  it("keeps idempotency and retry budget explicit", () => {
    const job: JobEnvelope = {
      id: "job-1",
      idempotencyKey: "tenant:invoice:1",
      retryBudget: 3,
      leaseTimeoutMs: 30000,
      state: "queued"
    };

    expect(job.idempotencyKey).toBe("tenant:invoice:1");
    expect(job.retryBudget).toBe(3);
  });
});
