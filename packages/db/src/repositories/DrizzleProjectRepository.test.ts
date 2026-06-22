import { describe, expect, it } from "vitest";

import { DrizzleProjectRepository } from "./DrizzleProjectRepository.js";

const methodNames = [
  "getProjectByRepoFingerprint",
  "getProjectByRepoPath",
  "listRepoInstallationsForProject",
  "cleanupFixtureProjectRecords"
] as const;

describe("DrizzleProjectRepository", () => {
  it("exposes M27 target repo registration methods", () => {
    const prototype = DrizzleProjectRepository.prototype as Record<string, unknown>;

    for (const methodName of methodNames) {
      expect(typeof prototype[methodName]).toBe("function");
    }
  });
});
