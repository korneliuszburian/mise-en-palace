import { readFileSync } from "node:fs";

import {
  describe,
  expect,
  it
} from "vitest";

import {
  checkRecipeDrift,
  parseRecipeDrift
} from "../drift.js";

const manifestPath = "docs/patterns/reference-recipes/drift.json";

const readRootFile = (path: string): string =>
  readFileSync(new URL(`../../../../../${path}`, import.meta.url), "utf8");

const readManifest = (): unknown => JSON.parse(readRootFile(manifestPath));

describe("recipe drift", () => {
  it("parses the local recipe manifest from unknown JSON", () => {
    expect(parseRecipeDrift(readManifest())).toMatchObject({
      kind: "krn.recipeDrift.v1",
      entries: [
        {
          id: "recipe:brain-knowledge-parser",
          patternId: "ts-boundary-brain-knowledge-parser-exemplar"
        }
      ]
    });
  });

  it("rejects bad hashes and unsafe paths", () => {
    expect(parseRecipeDrift({
      kind: "krn.recipeDrift.v1",
      entries: [
        {
          id: "recipe:bad",
          patternId: "ts-boundary-brain-knowledge-parser-exemplar",
          algorithm: "fnv1a32x8:krn.recipe.v1",
          code: ["../escape.ts"],
          docs: ["docs/patterns/retained-patterns/ts-boundary-brain-knowledge-parser-exemplar.json"],
          sources: ["source"],
          hash: "not-a-sha",
          observedAt: "2026-07-02",
          doesNotProve: "invalid fixture"
        }
      ],
      proof: {
        proves: ["parser rejects invalid manifests"],
        doesNotProve: ["runtime recipe automation"]
      }
    })).toBeUndefined();
  });

  it("keeps the reviewed exemplar and its recipe doc in sync", () => {
    const manifest = parseRecipeDrift(readManifest());

    if (!manifest) {
      throw new Error("Expected recipe drift manifest to parse.");
    }

    const check = checkRecipeDrift(manifest, readRootFile);

    expect(check.ok).toBe(true);
    expect(check.entries[0]).toMatchObject({
      id: "recipe:brain-knowledge-parser",
      ok: true,
      files: [
        "packages/harness/src/brainKnowledgeReadModel.ts",
        "packages/harness/src/brainKnowledgeReadModel.test.ts",
        "docs/patterns/retained-patterns/ts-boundary-brain-knowledge-parser-exemplar.json"
      ]
    });
  });

  it("fails when exemplar code drifts without a recipe update", () => {
    const manifest = parseRecipeDrift(readManifest());

    if (!manifest) {
      throw new Error("Expected recipe drift manifest to parse.");
    }

    const check = checkRecipeDrift(manifest, (path) => {
      const text = readRootFile(path);

      return path === "packages/harness/src/brainKnowledgeReadModel.ts"
        ? `${text}\n// simulated drift\n`
        : text;
    });

    expect(check.ok).toBe(false);
    expect(check.entries[0]?.actual).not.toBe(check.entries[0]?.expected);
  });
});
