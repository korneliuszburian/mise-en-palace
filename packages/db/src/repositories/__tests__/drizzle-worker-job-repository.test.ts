import { describe, expect, it } from "vitest";

import { DrizzleWorkerJobRepository } from "../drizzle-worker-job-repository.js";

const methodNames = [
  "enqueueWorkerJob",
  "enqueue",
  "getWorkerJobById",
  "listQueuedWorkerJobs",
  "markWorkerJobRunning",
  "markWorkerJobSucceeded",
  "markWorkerJobFailed",
  "markWorkerJobSkipped",
  "cleanupTestWorkerJobs"
] as const;

describe("DrizzleWorkerJobRepository", () => {
  it("exposes M26 worker job repository methods without maintenance runtime behavior", () => {
    for (const methodName of methodNames) {
      expect(typeof DrizzleWorkerJobRepository.prototype[methodName]).toBe("function");
    }
  });
});
