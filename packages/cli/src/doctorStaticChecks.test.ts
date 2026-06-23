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
  checkCodexAdapter,
  checkTargetRepoReadiness,
  checkWorkerJobs
} from "./doctorStaticChecks.js";

describe("doctorStaticChecks", () => {
  it("exports focused static doctor checks", () => {
    expect(checkCodexAdapter).toEqual(expect.any(Function));
    expect(checkWorkerJobs).toEqual(expect.any(Function));
    expect(checkTargetRepoReadiness).toEqual(expect.any(Function));
  });

  it("does not import write or shell execution modules", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const source = await readFile(
      path.join(repoRoot, "packages", "cli", "src", "doctorStaticChecks.ts"),
      "utf8"
    );

    expect(source).not.toContain("node:child_process");
    expect(source).not.toContain("writeFile");
    expect(source).not.toContain("appendFile");
    expect(source).not.toContain("rm(");
  });
});
