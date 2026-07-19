import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  materializeRetainedPairedLiveFixtureSource,
  parseRetainedPairedLiveFixtureArgs,
  retainedFamilyDecisionApplications,
  retainedPairedLiveFixtureConfigFor,
  retainedTrialSourceDecisionSeedFor
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
  it("defaults to weak-json and accepts explicit retained families", () => {
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
    expect(parseRetainedPairedLiveFixtureArgs([
      ".local-lab/temporal",
      "--family=temporal-policy-drift"
    ])).toEqual({
      family: "temporal-policy-drift",
      requestedDirectory: ".local-lab/temporal"
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

  it("maps temporal-policy-drift to its target fixture and scenario", () => {
    const repoRoot = resolve("/repo");
    const config = retainedPairedLiveFixtureConfigFor(repoRoot, "temporal-policy-drift");

    expect(config).toMatchObject({
      family: "temporal-policy-drift",
      scenarioName: "temporal-policy-drift-typescript",
      taskPrefix: "temporal policy drift typescript repair"
    });
    expect(config.fixtureRoot).toBe(
      resolve("/repo/tests/fixtures/target-repos/temporal-policy-drift-typescript")
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

  it("remaps temporal-policy decision application rules to temporal owner files", () => {
    expect(retainedFamilyDecisionApplications(extendedRules, "temporal-policy-drift")).toEqual([{
      governingDecisionId: "governing-1",
      sourceDecisionId: "source-1",
      check: "target_test",
      changedFiles: ["src/payoutPolicy.ts"]
    }, {
      governingDecisionId: "governing-2",
      sourceDecisionId: "source-2",
      check: "target_typecheck",
      changedFiles: ["tests/payoutPolicy.test.ts"]
    }, {
      governingDecisionId: "governing-3",
      sourceDecisionId: "source-3",
      check: "target_diff_check",
      changedFiles: ["docs/payout-policy-contract.md"]
    }]);
  });

  it("fails closed when async-job application rules exceed family mappings", () => {
    expect(() => retainedFamilyDecisionApplications(overlongRules, "async-job"))
      .toThrow("only 3 family mappings");
  });

  it("preserves weak-json decision application rules", () => {
    expect(retainedFamilyDecisionApplications(rules, "weak-json")).toEqual(rules);
  });

  it("loads a target-specific async-job source seed from the decision corpus", () => {
    const seed = retainedTrialSourceDecisionSeedFor(resolve("../.."), "async-job");

    expect(seed).toMatchObject({
      family: "async-job",
      corpusName: "async-job-boundary-typescript-fourth-repo"
    });
    expect(seed?.decisions.map((decision) => ({
      id: decision.id,
      status: decision.status
    }))).toEqual([{
      id: "async-job-idempotency-key",
      status: "current"
    }, {
      id: "async-job-retry-budget",
      status: "current"
    }, {
      id: "async-job-lease-timeout",
      status: "current"
    }, {
      id: "stale-async-job-forever-retry",
      status: "stale"
    }, {
      id: "rejected-async-job-no-idempotency",
      status: "rejected"
    }]);
    expect(seed?.decisions.map((decision) => decision.evidenceRef)).toContain(
      "tests/fixtures/target-repos/async-job-boundary-typescript/docs/job-contract.md"
    );
  });

  it("loads a target-specific temporal-policy source seed from the decision corpus", () => {
    const seed = retainedTrialSourceDecisionSeedFor(resolve("../.."), "temporal-policy-drift");

    expect(seed).toMatchObject({
      family: "temporal-policy-drift",
      corpusName: "temporal-policy-drift-typescript-retained"
    });
    expect(seed?.decisions.map((decision) => ({
      id: decision.id,
      status: decision.status
    }))).toEqual([{
      id: "temporal-policy-review-action",
      status: "current"
    }, {
      id: "temporal-policy-valid-from",
      status: "current"
    }, {
      id: "temporal-policy-high-risk-scope",
      status: "current"
    }, {
      id: "stale-temporal-policy-legacy-hold",
      status: "stale"
    }, {
      id: "rejected-temporal-policy-auto-approve",
      status: "rejected"
    }]);
    expect(seed?.decisions.filter((decision) => decision.status === "current").map((decision) => decision.evidenceRef))
      .toEqual([
        "tests/fixtures/second-repo/temporal-policy-current-authority.md",
        "tests/fixtures/second-repo/temporal-policy-current-authority.md",
        "tests/fixtures/second-repo/temporal-policy-current-authority.md"
      ]);
    expect(seed?.decisions.map((decision) => decision.evidenceRef)).toContain(
      "tests/fixtures/target-repos/temporal-policy-drift-typescript/docs/payout-policy-contract.md"
    );
  });

  it("does not seed target-specific source decisions for weak-json retained fixtures", () => {
    expect(retainedTrialSourceDecisionSeedFor(resolve("../.."), "weak-json")).toBeUndefined();
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

  it("materializes the temporal-policy target source without weak-json files", async () => {
    const tempRoot = await mkdtemp(resolve(tmpdir(), "krn-retained-temporal-policy-"));
    const materializedSourceDirectory = resolve(tempRoot, "target-source");

    try {
      await materializeRetainedPairedLiveFixtureSource({
        config: retainedPairedLiveFixtureConfigFor(resolve("../.."), "temporal-policy-drift"),
        materializedSourceDirectory
      });

      await expect(readFile(resolve(materializedSourceDirectory, "src/payoutPolicy.ts"), "utf8"))
        .resolves.toContain("legacy_hold");
      await expect(readFile(resolve(materializedSourceDirectory, "tests/payoutPolicy.test.ts"), "utf8"))
        .resolves.toContain("legacy_hold");
      await expect(readFile(resolve(materializedSourceDirectory, "src/userService.ts"), "utf8"))
        .rejects.toThrow();
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });
});
