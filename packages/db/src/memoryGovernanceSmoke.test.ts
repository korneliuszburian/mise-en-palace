import { describe, expect, it } from "vitest";

import * as dbExports from "./index.js";

describe("memory governance smoke export", () => {
  it("exports the M23 memory governance smoke check", () => {
    expect(typeof dbExports.runMemoryGovernanceSmokeCheck).toBe("function");
  });
});
