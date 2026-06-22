import { describe, expect, it } from "vitest";

import { DrizzleAuditBundleRepository } from "./DrizzleAuditBundleRepository.js";

const methodNames = [
  "createAuditBundle",
  "getAuditBundleById",
  "cleanupTestAuditBundles"
] as const;

describe("DrizzleAuditBundleRepository", () => {
  it("exposes MM-04 audit bundle persistence methods without CLI/runtime audit behavior", () => {
    const prototype = DrizzleAuditBundleRepository.prototype as Record<string, unknown>;

    for (const methodName of methodNames) {
      expect(typeof prototype[methodName]).toBe("function");
    }
  });
});
