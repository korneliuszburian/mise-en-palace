import { describe, expect, it } from "vitest";

import * as harnessSchema from "./harness.js";

describe("harness project registration schema", () => {
  it("exposes first-class target repo registration query fields", () => {
    expect("repoFingerprint" in harnessSchema.repoInstallations).toBe(true);
    expect("localPathHint" in harnessSchema.repoInstallations).toBe(true);
    expect(harnessSchema.repoInstallations.localPathHint.name).toBe("local_path_hint");
  });
});
