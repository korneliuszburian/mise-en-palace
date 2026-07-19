import {
  cp,
  mkdir,
  rm
} from "node:fs/promises";
import path from "node:path";

import type {
  PairedEvalFamily
} from "./paired-live-codex-repair.js";

export type RetainedPairedLiveFixtureFamily = Extract<PairedEvalFamily, "weak-json" | "async-job">;

export type RetainedDecisionApplicationRule = {
  readonly governingDecisionId: string;
  readonly sourceDecisionId: string;
  readonly check: string;
  readonly changedFiles: readonly string[];
};

export type RetainedPairedLiveFixtureConfig = {
  readonly family: RetainedPairedLiveFixtureFamily;
  readonly scenarioName: string;
  readonly taskPrefix: string;
  readonly fixtureRoot: string;
  readonly sourceEntries: readonly string[];
  readonly scenarioOverlayRoot?: string;
};

const retainedFamilies = new Set<RetainedPairedLiveFixtureFamily>([
  "weak-json",
  "async-job"
]);

const defaultFamily: RetainedPairedLiveFixtureFamily = "weak-json";

const retainedFamilyFrom = (value: string): RetainedPairedLiveFixtureFamily => {
  if (retainedFamilies.has(value as RetainedPairedLiveFixtureFamily)) {
    return value as RetainedPairedLiveFixtureFamily;
  }
  throw new Error(
    `Unsupported retained paired-live family '${value}'. Supported families: ${[...retainedFamilies].join(", ")}`
  );
};

export const parseRetainedPairedLiveFixtureArgs = (
  args: readonly string[]
): {
  readonly requestedDirectory?: string;
  readonly family: RetainedPairedLiveFixtureFamily;
} => {
  let family: RetainedPairedLiveFixtureFamily = defaultFamily;
  let passthroughSeparatorSeen = false;
  const positional: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === undefined) continue;
    if (argument === "--" && !passthroughSeparatorSeen) {
      passthroughSeparatorSeen = true;
      continue;
    }
    if (argument === "--family") {
      const value = args[index + 1];
      if (value === undefined) {
        throw new Error("Missing value for --family");
      }
      family = retainedFamilyFrom(value);
      index += 1;
      continue;
    }
    if (argument.startsWith("--family=")) {
      family = retainedFamilyFrom(argument.slice("--family=".length));
      continue;
    }
    positional.push(argument);
  }

  return {
    family,
    ...(positional[0] === undefined ? {} : { requestedDirectory: positional[0] })
  };
};

export const retainedPairedLiveFixtureConfigFor = (
  repoRoot: string,
  family: RetainedPairedLiveFixtureFamily
): RetainedPairedLiveFixtureConfig => {
  switch (family) {
    case "async-job": {
      const fixtureRoot = path.join(
        repoRoot,
        "tests/fixtures/target-repos/async-job-boundary-typescript"
      );
      return {
        family,
        scenarioName: "async-job-boundary",
        taskPrefix: "async job boundary repair",
        fixtureRoot,
        sourceEntries: ["AGENTS.md", "docs", "package.json", "src", "tests", "tsconfig.json"]
      };
    }
    case "weak-json": {
      const fixtureRoot = path.join(
        repoRoot,
        "tests/fixtures/target-repos/weak-json-boundary-typescript"
      );
      const scenarioName = "weak-json-boundary";
      return {
        family,
        scenarioName,
        taskPrefix: "weak json boundary repair",
        fixtureRoot,
        sourceEntries: [
          ".gitignore",
          "AGENTS.md",
          "README.md",
          "docs",
          "package.json",
          "src",
          "tests",
          "tsconfig.json"
        ],
        scenarioOverlayRoot: path.join(fixtureRoot, "scenarios", scenarioName, "files")
      };
    }
  }
};

export const materializeRetainedPairedLiveFixtureSource = async (input: {
  readonly config: RetainedPairedLiveFixtureConfig;
  readonly materializedSourceDirectory: string;
}): Promise<void> => {
  await rm(input.materializedSourceDirectory, { force: true, recursive: true });
  await mkdir(input.materializedSourceDirectory, { recursive: true });

  for (const entry of input.config.sourceEntries) {
    await cp(
      path.join(input.config.fixtureRoot, entry),
      path.join(input.materializedSourceDirectory, entry),
      { recursive: true }
    );
  }

  if (input.config.scenarioOverlayRoot !== undefined) {
    await cp(input.config.scenarioOverlayRoot, input.materializedSourceDirectory, {
      recursive: true
    });
  }
};

const asyncJobDecisionApplicationMappings = [
  { check: "target_test", changedFiles: ["src/jobQueue.ts"] },
  { check: "target_typecheck", changedFiles: ["tests/jobQueue.test.ts"] },
  { check: "target_diff_check", changedFiles: ["docs/job-contract.md"] }
] as const;

export const retainedFamilyDecisionApplications = (
  rules: readonly RetainedDecisionApplicationRule[],
  family: RetainedPairedLiveFixtureFamily
): RetainedDecisionApplicationRule[] => {
  if (family === "weak-json") {
    return rules.map((rule) => ({
      ...rule,
      changedFiles: [...rule.changedFiles]
    }));
  }

  if (rules.length > asyncJobDecisionApplicationMappings.length) {
    throw new Error(
      `Async-job retained paired-live fixture has ${rules.length} decision application rules but only ${asyncJobDecisionApplicationMappings.length} family mappings`
    );
  }

  return rules.map((rule, index) => {
    const mapping = asyncJobDecisionApplicationMappings[index];
    if (mapping === undefined) throw new Error("Missing async-job decision application mapping");
    return {
      ...rule,
      check: mapping.check,
      changedFiles: [...mapping.changedFiles]
    };
  });
};
