import { describe, expect, it } from "vitest";

import * as dbExports from "./index.js";

describe("retrieval substrate smoke export", () => {
  it("exports the M24 retrieval substrate smoke check", () => {
    expect(typeof dbExports.runRetrievalSubstrateSmokeCheck).toBe("function");
  });
});
