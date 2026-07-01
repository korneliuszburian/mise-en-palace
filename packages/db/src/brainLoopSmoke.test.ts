import { describe, expect, it } from "vitest";

import * as dbDevExports from "./dev/index.js";

describe("brain loop smoke export", () => {
  it("exports the DB-backed brain loop smoke check", () => {
    expect(typeof dbDevExports.runBrainLoopSmokeCheck).toBe("function");
  });
});
