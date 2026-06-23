import { describe, expect, it } from "vitest";

import * as harnessEvalExports from "./eval/index.js";
import * as harnessRootExports from "./index.js";

describe("harness root package surface", () => {
  it("keeps Promptfoo adapter helpers behind the eval subpath", () => {
    expect(typeof harnessRootExports.runGoldenTaskFixtures).toBe("function");
    expect("exportGoldenTasksToPromptfooSnapshot" in harnessRootExports).toBe(false);
    expect("mapPromptfooJsonlRowsToGoldenBehaviorProofs" in harnessRootExports).toBe(false);
    expect(typeof harnessEvalExports.exportGoldenTasksToPromptfooSnapshot).toBe("function");
    expect(typeof harnessEvalExports.mapPromptfooJsonlRowsToGoldenBehaviorProofs).toBe("function");
  });
});
