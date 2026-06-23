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
  checkActivation,
  checkHarnessPersistence,
  checkMemoryGovernance,
  checkPostgres,
  checkRetrievalSubstrate,
  checkSourceGraph
} from "./doctorDbChecks.js";

describe("doctorDbChecks", () => {
  it("exports focused DB-backed doctor checks", () => {
    expect(checkPostgres).toEqual(expect.any(Function));
    expect(checkHarnessPersistence).toEqual(expect.any(Function));
    expect(checkSourceGraph).toEqual(expect.any(Function));
    expect(checkMemoryGovernance).toEqual(expect.any(Function));
    expect(checkRetrievalSubstrate).toEqual(expect.any(Function));
    expect(checkActivation).toEqual(expect.any(Function));
  });

  it("keeps DB-backed checks read-only at the CLI adapter layer", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const source = await readFile(
      path.join(repoRoot, "packages", "cli", "src", "doctorDbChecks.ts"),
      "utf8"
    );

    expect(source).not.toContain("node:child_process");
    expect(source).not.toContain("writeFile");
    expect(source).not.toContain("appendFile");
    expect(source).not.toContain("rm(");
  });
});
