import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  materializeRetainedPairedLiveFixtureSource,
  parseRetainedPairedLiveFixtureArgs,
  retainedFamilyDecisionApplications,
  retainedPairedLiveFixtureConfigFor
} from "../internal/eval/retained-paired-live-fixture-config.js";

const rules = [{
  governingDecisionId: "governing-1",
  sourceDecisionId: "source-1",
  check: "target_test",
  changedFiles: ["src/config.ts"]
}, {
  governingDecisionId: "governing-2",
  sourceDecisionId: "source-2",
  check: "target_diff_check",
  changedFiles: ["tests/userService.test.ts"]
}];

const extendedRules = [
  ...rules,
  {
    governingDecisionId: "governing-3",
    sourceDecisionId: "source-3",
    check: "target_test",
    changedFiles: ["src/userService.ts"]
  }
];

const overlongRules = [
  ...extendedRules,
  {
    governingDecisionId: "governing-4",
    sourceDecisionId: "source-4",
    check: "preflight",
    changedFiles: ["docs/notes.md"]
  }
];

describe("retained paired-live fixture config", () => {
  it("defaults to weak-json and accepts an explicit async-job family", () => {
    expect(parseRetainedPairedLiveFixtureArgs([".local-lab/run"])).toEqual({
      family: "weak-json",
      requestedDirectory: ".local-lab/run"
    });
    expect(parseRetainedPairedLiveFixtureArgs([
      "--",
      ".local-lab/async",
      "--family",
      "async-job"
    ])).toEqual({
      family: "async-job",
      requestedDirectory: ".local-lab/async"
    });
  });

  it("maps async-job to its target fixture and scenario", () => {
    const repoRoot = resolve("/repo");
    const config = retainedPairedLiveFixtureConfigFor(repoRoot, "async-job");

    expect(config).toMatchObject({
      family: "async-job",
      scenarioName: "async-job-boundary",
      taskPrefix: "async job boundary repair"
    });
    expect(config.fixtureRoot).toBe(
      resolve("/repo/tests/fixtures/target-repos/async-job-boundary-typescript")
    );
    expect(config.sourceEntries).toEqual([
      "AGENTS.md",
      "docs",
      "package.json",
      "src",
      "tests",
      "tsconfig.json"
    ]);
  });

  it("remaps async-job decision application rules to async-job owned files", () => {
    expect(retainedFamilyDecisionApplications(extendedRules, "async-job")).toEqual([{
      governingDecisionId: "governing-1",
      sourceDecisionId: "source-1",
      check: "target_test",
      changedFiles: ["src/jobQueue.ts"]
    }, {
      governingDecisionId: "governing-2",
      sourceDecisionId: "source-2",
      check: "target_typecheck",
      changedFiles: ["tests/jobQueue.test.ts"]
    }, {
      governingDecisionId: "governing-3",
      sourceDecisionId: "source-3",
      check: "target_diff_check",
      changedFiles: ["docs/job-contract.md"]
    }]);
  });

  it("fails closed when async-job application rules exceed family mappings", () => {
    expect(() => retainedFamilyDecisionApplications(overlongRules, "async-job"))
      .toThrow("only 3 family mappings");
  });

  it("preserves weak-json decision application rules", () => {
    expect(retainedFamilyDecisionApplications(rules, "weak-json")).toEqual(rules);
  });

  it("materializes the async-job target source without weak-json files", async () => {
    const tempRoot = await mkdtemp(resolve(tmpdir(), "krn-retained-async-job-"));
    const materializedSourceDirectory = resolve(tempRoot, "target-source");

    try {
      await materializeRetainedPairedLiveFixtureSource({
        config: retainedPairedLiveFixtureConfigFor(resolve("../.."), "async-job"),
        materializedSourceDirectory
      });

      await expect(readFile(resolve(materializedSourceDirectory, "src/jobQueue.ts"), "utf8"))
        .resolves.toContain("JobEnvelope");
      await expect(readFile(resolve(materializedSourceDirectory, "tests/jobQueue.test.ts"), "utf8"))
        .resolves.toContain("idempotencyKey");
      await expect(readFile(resolve(materializedSourceDirectory, "src/userService.ts"), "utf8"))
        .rejects.toThrow();
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });
});
