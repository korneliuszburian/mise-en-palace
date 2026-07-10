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
  checkMaintenanceQueue,
  checkTargetRepoReadiness
} from "../doctor-static-checks.js";

describe("doctorStaticChecks", () => {
  it("exports focused static doctor checks", () => {
    expect(checkCodexAdapter).toEqual(expect.any(Function));
    expect(checkMaintenanceQueue).toEqual(expect.any(Function));
    expect(checkTargetRepoReadiness).toEqual(expect.any(Function));
  });

  it("returns typed outcomes and severities for audited static checks", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const checks = [
      ...await checkCodexAdapter(repoRoot),
      ...await checkMaintenanceQueue(repoRoot),
      ...await checkTargetRepoReadiness(repoRoot)
    ];
    const typedLabels = new Set([
      "Codex adapter renderer",
      "Execution brief smoke",
      "Codex execution runner",
      "KRN MCP product server",
      "Maintenance queue schema",
      "Maintenance queue repository",
      "Maintenance queue smoke",
      "Maintenance record executor",
      "Redis/Kafka queue",
      "Autonomous maintenance daemon",
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

    expect(checks.find((check) => check.label === "Init-connect smoke")).toMatchObject({
      outcome: "available",
      status: "available (pnpm db:smoke:init-connect; run it for proof)",
      severity: "pass"
    });
    expect(checks.find((check) => check.label === "Target repo harness smoke")).toMatchObject({
      outcome: "available",
      status: "available (pnpm db:smoke:target-repo-harness; run it for proof)",
      severity: "pass"
    });
    expect(checks.find((check) => check.label === "Cross-project leakage proof")).toMatchObject({
      outcome: "runtime_unverified",
      status: "unverified (run pnpm db:smoke:target-repo-harness)",
      severity: "warning"
    });
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
