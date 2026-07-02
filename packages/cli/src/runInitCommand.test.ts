import path from "node:path";

import {
  describe,
  expect,
  it
} from "vitest";

import {
  detectSourceSeeds
} from "./runInitCommand.js";

describe("runInitCommand source seed detection", () => {
  it("detects source-to-decision owner seeds in the KRN repo", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const sourceSeeds = await detectSourceSeeds(repoRoot);

    expect(sourceSeeds).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "docs/KRN_SOURCES.md",
          kind: "source_map"
        }),
        expect.objectContaining({
          path: "docs/runbooks/pattern-intake.md",
          kind: "runbook"
        }),
        expect.objectContaining({
          path: "docs/standards/typescript-excellence.md",
          kind: "standard_doc"
        }),
        expect.objectContaining({
          path: ".agents/skills",
          kind: "skill_root"
        }),
        expect.objectContaining({
          path: ".agents/skills/evidence-review-loop/SKILL.md",
          kind: "skill_doc"
        }),
        expect.objectContaining({
          path: "packages/harness/src/__tests__/sourceMapInvariants.test.ts",
          kind: "invariant_test"
        }),
        expect.objectContaining({
          path: "packages/harness/src/__tests__/skillInvariants.test.ts",
          kind: "skill_invariant_test"
        })
      ])
    );
  });
});
