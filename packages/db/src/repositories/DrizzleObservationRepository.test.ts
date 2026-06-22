import { describe, expect, it } from "vitest";

import { DrizzleObservationRepository } from "./DrizzleObservationRepository.js";

const methodNames = [
  "createGroup",
  "addItems",
  "findByRun",
  "findByScope",
  "linkSourceRange",
  "recordFeedback"
] as const;

describe("DrizzleObservationRepository", () => {
  it("exposes MM-11 observation repository methods", () => {
    const prototype = DrizzleObservationRepository.prototype as Record<string, unknown>;

    for (const methodName of methodNames) {
      expect(typeof prototype[methodName]).toBe("function");
    }
  });

  it("requires project scope for scoped observation reads", async () => {
    const repository = new DrizzleObservationRepository({} as never);

    await expect(repository.findByScope({})).rejects.toThrow(
      "findByScope requires projectId"
    );
  });
});
