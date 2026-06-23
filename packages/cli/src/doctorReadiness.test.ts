import {
  readFile
} from "node:fs/promises";
import path from "node:path";
import {
  describe,
  expect,
  it
} from "vitest";

import {
  deriveActivationReadiness,
  deriveBrainStoreReadiness,
  deriveCodexAdapterReadiness,
  deriveHarnessPersistenceReadiness,
  deriveMemoryGovernanceReadiness,
  deriveRetrievalSubstrateReadiness,
  deriveSourceGraphReadiness,
  deriveTargetRepoReadiness,
  deriveWorkerJobReadiness
} from "./doctorReadiness.js";

describe("doctorReadiness", () => {
  it("exports focused readiness derivation helpers", () => {
    expect(deriveBrainStoreReadiness).toEqual(expect.any(Function));
    expect(deriveHarnessPersistenceReadiness).toEqual(expect.any(Function));
    expect(deriveSourceGraphReadiness).toEqual(expect.any(Function));
    expect(deriveMemoryGovernanceReadiness).toEqual(expect.any(Function));
    expect(deriveRetrievalSubstrateReadiness).toEqual(expect.any(Function));
    expect(deriveActivationReadiness).toEqual(expect.any(Function));
    expect(deriveCodexAdapterReadiness).toEqual(expect.any(Function));
    expect(deriveWorkerJobReadiness).toEqual(expect.any(Function));
    expect(deriveTargetRepoReadiness).toEqual(expect.any(Function));
  });

  it("keeps readiness derivation pure and read-only", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const source = await readFile(
      path.join(repoRoot, "packages", "cli", "src", "doctorReadiness.ts"),
      "utf8"
    );

    expect(source).not.toContain("@krn/db");
    expect(source).not.toContain("node:fs");
    expect(source).not.toContain("node:child_process");
    expect(source).not.toContain("writeFile");
    expect(source).not.toContain("appendFile");
    expect(source).not.toContain("rm(");
  });
});
