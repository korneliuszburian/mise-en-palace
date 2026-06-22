import { describe, expect, it } from "vitest";

import { DrizzleReflectionRepository } from "./DrizzleReflectionRepository.js";

const methodNames = [
  "createReflectionRecord",
  "getReflectionRecordById",
  "listReflectionRecordsByScope"
] as const;

describe("DrizzleReflectionRepository", () => {
  it("exposes MM-20 reflection persistence methods without runtime reflection behavior", () => {
    for (const methodName of methodNames) {
      expect(typeof DrizzleReflectionRepository.prototype[methodName]).toBe("function");
    }
  });
});
