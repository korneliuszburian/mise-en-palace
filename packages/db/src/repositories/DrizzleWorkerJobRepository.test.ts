import { describe, expect, it } from "vitest";

import { DrizzleWorkerJobRepository } from "./DrizzleWorkerJobRepository.js";

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
  it("exposes M26 worker job repository methods without worker runtime behavior", () => {
    for (const methodName of methodNames) {
      expect(typeof DrizzleWorkerJobRepository.prototype[methodName]).toBe("function");
    }
  });
});
