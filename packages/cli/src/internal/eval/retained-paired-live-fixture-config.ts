import {
  cp,
  mkdir,
  rm
} from "node:fs/promises";
import path from "node:path";

import type {
  PairedEvalFamily
} from "./paired-live-codex-repair.js";
import {
  loadDecisionPacketEvalFixture
} from "../../decision-packet-fixture.js";

export type RetainedPairedLiveFixtureFamily = Extract<
  PairedEvalFamily,
  "weak-json" | "async-job" | "temporal-policy-drift"
>;

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

export type RetainedTrialSourceDecisionStatus = "current" | "stale" | "rejected";

export type RetainedTrialSourceDecisionSeedItem = {
  readonly id: string;
  readonly title: string;
  readonly statement: string;
  readonly status: RetainedTrialSourceDecisionStatus;
  readonly evidenceRef: string;
  readonly falsifier: string;
  readonly doesNotProve: string;
};

export type RetainedTrialSourceDecisionSeed = {
  readonly family: RetainedPairedLiveFixtureFamily;
  readonly corpusName: string;
  readonly decisions: readonly RetainedTrialSourceDecisionSeedItem[];
};

const retainedFamilies = new Set<RetainedPairedLiveFixtureFamily>([
  "weak-json",
  "async-job",
  "temporal-policy-drift"
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
    case "temporal-policy-drift": {
      const fixtureRoot = path.join(
        repoRoot,
        "tests/fixtures/target-repos/temporal-policy-drift-typescript"
      );
      return {
        family,
        scenarioName: "temporal-policy-drift-typescript",
        taskPrefix: "temporal policy drift repair",
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

const retainedFamilyDecisionApplicationMappings = {
  "async-job": [
    { check: "target_test", changedFiles: ["src/jobQueue.ts"] },
    { check: "target_typecheck", changedFiles: ["tests/jobQueue.test.ts"] },
    { check: "target_diff_check", changedFiles: ["docs/job-contract.md"] }
  ],
  "temporal-policy-drift": [
    { check: "target_test", changedFiles: ["src/payoutPolicy.ts"] },
    { check: "target_typecheck", changedFiles: ["tests/payoutPolicy.test.ts"] },
    { check: "target_diff_check", changedFiles: ["docs/payout-policy-contract.md"] }
  ]
} as const satisfies Record<
  Exclude<RetainedPairedLiveFixtureFamily, "weak-json">,
  readonly {
    readonly check: string;
    readonly changedFiles: readonly string[];
  }[]
>;

const retainedFamilySourceSeedDecisionIds = {
  "async-job": [
    "async-job-idempotency-key",
    "async-job-retry-budget",
    "async-job-lease-timeout",
    "stale-async-job-forever-retry",
    "rejected-async-job-no-idempotency"
  ],
  "temporal-policy-drift": [
    "temporal-policy-review-action",
    "temporal-policy-valid-from",
    "temporal-policy-high-risk-scope",
    "stale-temporal-policy-legacy-hold",
    "rejected-temporal-policy-auto-approve"
  ]
} as const satisfies Record<
  Exclude<RetainedPairedLiveFixtureFamily, "weak-json">,
  readonly string[]
>;

const retainedFamilyDecisionFixtureFile = (
  family: Exclude<RetainedPairedLiveFixtureFamily, "weak-json">
): string => family === "async-job"
  ? "async-job-decision-packet-vs-notes.json"
  : "temporal-policy-drift-decision-packet-vs-notes.json";

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

  const mappings = retainedFamilyDecisionApplicationMappings[family];
  if (rules.length > mappings.length) {
    throw new Error(
      `${family} retained paired-live fixture has ${rules.length} decision application rules but only ${mappings.length} family mappings`
    );
  }

  return rules.map((rule, index) => {
    const mapping = mappings[index];
    if (mapping === undefined) throw new Error(`Missing ${family} decision application mapping`);
    return {
      ...rule,
      check: mapping.check,
      changedFiles: [...mapping.changedFiles]
    };
  });
};

const retainedSeedDecisionStatusFrom = (
  value: string,
  decisionId: string
): RetainedTrialSourceDecisionStatus => {
  if (value === "current" || value === "stale" || value === "rejected") {
    return value;
  }

  throw new Error(
    `Retained paired-live source seed decision ${decisionId} has unsupported status '${value}'`
  );
};

export const retainedTrialSourceDecisionSeedFor = (
  repoRoot: string,
  family: RetainedPairedLiveFixtureFamily
): RetainedTrialSourceDecisionSeed | undefined => {
  if (family === "weak-json") {
    return undefined;
  }

  const fixture = loadDecisionPacketEvalFixture(path.join(
    repoRoot,
    "tests/fixtures/second-repo",
    retainedFamilyDecisionFixtureFile(family)
  ));
  const decisionsById = new Map(fixture.decisions.map((decision) => [decision.id, decision]));

  return {
    family,
    corpusName: fixture.corpusName,
    decisions: retainedFamilySourceSeedDecisionIds[family].map((id) => {
      const decision = decisionsById.get(id);
      if (decision === undefined) {
        throw new Error(
          `Retained paired-live ${family} source seed fixture is missing decision ${id}`
        );
      }

      return {
        id: decision.id,
        title: decision.title,
        statement: decision.statement,
        status: retainedSeedDecisionStatusFrom(decision.status, decision.id),
        evidenceRef: decision.evidenceRef,
        falsifier: decision.falsifier,
        doesNotProve: decision.doesNotProve
      };
    })
  };
};
