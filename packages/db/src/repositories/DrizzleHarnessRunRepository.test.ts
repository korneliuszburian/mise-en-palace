import { describe, expect, it } from "vitest";

import { DrizzleHarnessRunRepository } from "./DrizzleHarnessRunRepository.js";

describe("DrizzleHarnessRunRepository", () => {
  it("exposes persisted run aggregate readback by execution run id", () => {
    expect(typeof DrizzleHarnessRunRepository.prototype.getHarnessRunByExecutionRunId).toBe(
      "function"
    );
  });
});
