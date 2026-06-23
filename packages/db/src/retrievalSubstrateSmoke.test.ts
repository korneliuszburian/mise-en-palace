import { describe, expect, it } from "vitest";

import * as dbDevExports from "./dev/index.js";

describe("retrieval substrate smoke export", () => {
  it("exports the M24 retrieval substrate smoke check", () => {
    expect(typeof dbDevExports.runRetrievalSubstrateSmokeCheck).toBe("function");
  });
});
