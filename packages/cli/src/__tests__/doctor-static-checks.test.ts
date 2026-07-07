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
} from "../doctor-static-checks.js";

describe("doctorStaticChecks", () => {
  it("exports focused static doctor checks", () => {
    expect(checkCodexAdapter).toEqual(expect.any(Function));
    expect(checkWorkerJobs).toEqual(expect.any(Function));
    expect(checkTargetRepoReadiness).toEqual(expect.any(Function));
  });

  it("returns typed outcomes and severities for audited static checks", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const checks = [
      ...await checkCodexAdapter(repoRoot),
      ...await checkWorkerJobs(repoRoot),
      ...await checkTargetRepoReadiness(repoRoot)
    ];
    const typedLabels = new Set([
      "Codex adapter renderer",
      "Execution brief smoke",
      "Codex execution runner",
      "KRN MCP server",
      "Worker job schema",
      "Worker job repository",
      "Worker job smoke",
      "Redis/Kafka queue",
      "Broad worker daemon",
      "Target repo init command",
      "Target repo fixture smoke",
      "Project registration schema",
      "Init-connect smoke",
      "Target repo harness smoke",
      "Cross-project leakage proof",
      "Target repo forbidden surfaces"
    ]);

    for (const check of checks.filter((check) => typedLabels.has(check.label))) {
      expect(check.outcome, check.label).toEqual(expect.any(String));
      expect(check.severity, check.label).toMatch(/^(pass|warning|failure)$/);
    }
  });

  it("does not import write or shell execution modules", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const source = await readFile(
      path.join(repoRoot, "packages", "cli", "src", "doctor-static-checks.ts"),
      "utf8"
    );

    expect(source).not.toContain("node:child_process");
    expect(source).not.toContain("writeFile");
    expect(source).not.toContain("appendFile");
    expect(source).not.toContain("rm(");
  });

  it("does not scan package source trees for static proof", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const source = await readFile(
      path.join(repoRoot, "packages", "cli", "src", "doctor-static-checks.ts"),
      "utf8"
    );

    expect(source).not.toContain("readTreeText");
    expect(source).not.toContain("packagePath(repoRoot, \"cli\", \"src\"");
    expect(source).not.toContain("packagePath(repoRoot, \"codex-adapter\", \"src\"");
    expect(source).not.toContain("packagePath(repoRoot, \"workers\", \"src\"");
  });
});
