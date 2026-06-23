import { describe, expect, it } from "vitest";

import * as dbRootExports from "./index.js";

describe("db root package surface", () => {
  it("keeps smoke checks out of the root export surface", () => {
    expect(typeof dbRootExports.createKrnDatabase).toBe("function");
    expect("runActivationSmokeCheck" in dbRootExports).toBe(false);
    expect("runMemoryGovernanceSmokeCheck" in dbRootExports).toBe(false);
    expect("runRetrievalSubstrateSmokeCheck" in dbRootExports).toBe(false);
  });
});
