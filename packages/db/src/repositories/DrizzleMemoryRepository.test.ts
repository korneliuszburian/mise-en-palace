import { describe, expect, it } from "vitest";

import { DrizzleMemoryRepository } from "./DrizzleMemoryRepository.js";

const methodNames = [
  "createMemoryCandidate",
  "getMemoryCandidateById",
  "promoteMemoryCandidate",
  "rejectMemoryCandidate",
  "getMemoryRecordById",
  "listMemoryRecordsForProject",
  "recordMemoryApplication",
  "createAntiMemoryRecord",
  "listAntiMemoryForRun"
] as const;

describe("DrizzleMemoryRepository", () => {
  it("exposes M23 memory governance repository methods", () => {
    for (const methodName of methodNames) {
      expect(typeof DrizzleMemoryRepository.prototype[methodName]).toBe("function");
    }
  });
});
