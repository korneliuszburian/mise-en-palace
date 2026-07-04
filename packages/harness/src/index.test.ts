import { describe, expect, it } from "vitest";

import * as harnessRootExports from "./index.js";

describe("harness root package surface", () => {
  it("keeps promptfoo helpers out of the root export surface", () => {
    expect(typeof harnessRootExports.runBehaviorFixtures).toBe("function");
    expect("exportBehaviorFixturesToPromptfooSnapshot" in harnessRootExports).toBe(false);
    expect("mapPromptfooJsonlRowsToBehaviorFixtureProofs" in harnessRootExports).toBe(false);
  });
});
