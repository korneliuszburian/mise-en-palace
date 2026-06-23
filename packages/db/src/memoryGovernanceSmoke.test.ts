import { describe, expect, it } from "vitest";

import * as dbDevExports from "./dev/index.js";

describe("memory governance smoke export", () => {
  it("exports the M23 memory governance smoke check", () => {
    expect(typeof dbDevExports.runMemoryGovernanceSmokeCheck).toBe("function");
  });
});
