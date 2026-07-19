import assert from "node:assert/strict";
import test from "node:test";

import {
  validateCodexCapabilityEvalManifest
} from "../contracts.js";
import {
  validManifest
} from "./manifest-fixture.js";

test("Codex capability eval manifest accepts a matched baseline versus KRN contract", () => {
  const result = validateCodexCapabilityEvalManifest(validManifest());

  assert.equal(result.ok, true);
});

test("Codex capability eval manifest rejects missing isolation and KRN capability evidence", () => {
  const manifest = validManifest();
  const result = validateCodexCapabilityEvalManifest({
    ...manifest,
    arms: {
      baseline: {
        ...manifest.arms.baseline,
        capabilities: manifest.arms.krn.capabilities
      },
      krn: {
        ...manifest.arms.krn,
        profile: manifest.arms.baseline.profile,
        capabilities: {
          mcpServers: [],
          skills: []
        }
      }
    }
  });

  assert.equal(result.ok, false);
  assertIssuesInclude(result, [
    "arms.baseline.profile.name must differ from arms.krn.profile.name",
    "arms.baseline.profile.configPath must differ from arms.krn.profile.configPath",
    "baseline arm must not expose KRN MCP servers or skills",
    "krn arm must expose at least one KRN MCP server or skill"
  ]);
});

test("Codex capability eval manifest rejects ungradable or dishonest usage contracts", () => {
  const manifest = validManifest();
  const result = validateCodexCapabilityEvalManifest({
    ...manifest,
    codex: {
      ...manifest.codex,
      execBaseArgs: ["exec", "--profile", "plain-codex-eval"]
    },
    graders: [],
    usage: {
      source: "unavailable",
      requireComparable: true
    }
  });

  assert.equal(result.ok, false);
  assertIssuesInclude(result, [
    "codex.execBaseArgs must include --json so usage and events can be parsed",
    "codex.execBaseArgs must not include --profile; the runner owns arm isolation",
    "graders must contain at least one grader",
    "usage.requireComparable cannot be true when usage.source is unavailable"
  ]);
});

test("Codex capability eval manifest rejects duplicate grader identities", () => {
  const manifest = validManifest();
  const result = validateCodexCapabilityEvalManifest({
    ...manifest,
    graders: [manifest.graders[0], manifest.graders[0]]
  });

  assert.equal(result.ok, false);
  assertIssuesInclude(result, ["grader ids must be unique"]);
});

test("Codex capability eval manifest rejects non-reproducible or mutable arm evidence", () => {
  const manifest = validManifest();
  const result = validateCodexCapabilityEvalManifest({
    ...manifest,
    target: {
      ...manifest.target,
      commit: "HEAD"
    },
    arms: {
      baseline: {
        ...manifest.arms.baseline,
        profile: {
          ...manifest.arms.baseline.profile,
          configPath: "../outside.config.toml",
          hash: "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        }
      },
      krn: {
        ...manifest.arms.krn,
        capabilities: {
          ...manifest.arms.krn.capabilities,
          mcpServers: manifest.arms.krn.capabilities.mcpServers.map((server) => ({
            ...server,
            readOnly: false
          }))
        }
      }
    }
  });

  assert.equal(result.ok, false);
  assertIssuesInclude(result, [
    "target.commit must be a concrete 7-40 hex git commit, not HEAD or a symbolic ref",
    "arms.baseline.profile.configPath must be a repo-relative path without parent traversal",
    "arms.baseline.profile.hash must not be declared in the manifest; the runner derives it from configPath",
    "arms.krn.capabilities.mcpServers.0.readOnly must be true for KRN context evals"
  ]);
});

const assertIssuesInclude = (
  result: ReturnType<typeof validateCodexCapabilityEvalManifest>,
  expectedIssues: readonly string[]
): void => {
  if (result.ok) {
    assert.fail("expected manifest validation to fail");
  }

  for (const expectedIssue of expectedIssues) {
    assert.ok(
      result.issues.includes(expectedIssue),
      `Expected issue "${expectedIssue}" in ${JSON.stringify(result.issues)}`
    );
  }
};
