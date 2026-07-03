import { describe, expect, it } from "vitest";

import * as harnessRootExports from "./index.js";

describe("harness root package surface", () => {
  it("keeps promptfoo helpers out of the root export surface", () => {
    expect(typeof harnessRootExports.runGoldenTaskFixtures).toBe("function");
    expect("exportGoldenTasksToPromptfooSnapshot" in harnessRootExports).toBe(false);
    expect("mapPromptfooJsonlRowsToGoldenBehaviorProofs" in harnessRootExports).toBe(false);
  });
});
