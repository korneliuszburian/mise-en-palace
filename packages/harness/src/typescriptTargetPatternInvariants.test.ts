import { readFileSync } from "node:fs";

import {
  describe,
  expect,
  it
} from "vitest";

const readRootFile = (path: string): string =>
  readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8");

const repairedTargetFiles = [
  "tests/fixtures/target-repos/weak-json-boundary-typescript/src/config.ts",
  "tests/fixtures/target-repos/weak-json-boundary-typescript/src/userService.ts",
  "tests/fixtures/target-repos/weak-json-boundary-typescript/tests/userService.test.ts"
] as const;

const weakScenarioFiles = [
  "tests/fixtures/target-repos/weak-json-boundary-typescript/scenarios/weak-json-boundary/files/src/config.ts",
  "tests/fixtures/target-repos/weak-json-boundary-typescript/scenarios/weak-json-boundary/files/src/userService.ts",
  "tests/fixtures/target-repos/weak-json-boundary-typescript/scenarios/weak-json-boundary/files/tests/userService.test.ts"
] as const;

describe("TypeScript target pattern invariants", () => {
  it("keeps the retained TypeScript boundary pattern reviewable", () => {
    const pattern = readRootFile("docs/patterns/typescript-boundary-patterns.md");

    expect(pattern).toContain("pattern_id: ts-boundary-unknown-first-result-state");
    expect(pattern).toContain("consumer: V258 Pattern Enforcement Gate");
    expect(pattern).toContain("falsifier:");
    expect(pattern).toContain("candidate_output:");
    expect(pattern).toContain("type: EvalCandidate");
    expect(pattern).toContain("reviewability: ready");
  });

  it("keeps the weak scenario as a real falsifier for the retained pattern", () => {
    const weakScenario = weakScenarioFiles.map(readRootFile).join("\n");

    expect(weakScenario).toContain("parseJsonConfig(raw: string): any");
    expect(weakScenario).toContain("JSON.parse(raw)");
    expect(weakScenario).toContain("CreatedUser | null");
    expect(weakScenario).not.toContain("CreateUserResult");
  });

  it("keeps the repaired TypeScript target aligned with the retained pattern", () => {
    const repairedTarget = repairedTargetFiles.map(readRootFile).join("\n");

    expect(repairedTarget).toContain("parseJsonConfig(raw: string): unknown");
    expect(repairedTarget).toContain('export type UserRole = "admin" | "member";');
    expect(repairedTarget).toContain("export type CreateUserResult =");
    expect(repairedTarget).toContain('kind: "created"');
    expect(repairedTarget).toContain('kind: "invalid_input"');
    expect(repairedTarget).toContain('reason: "invalid_json" | "invalid_shape"');
    expect(repairedTarget).toContain("parseCreateUserInput(value: unknown)");
    expect(repairedTarget).toContain("Expected malformed JSON to return invalid_json.");
    expect(repairedTarget).toContain("Expected missing email to return invalid_shape.");
    expect(repairedTarget).toContain("Expected invalid role to return invalid_shape.");

    expect(repairedTarget).not.toMatch(/\bany\b/u);
    expect(repairedTarget).not.toContain("CreatedUser | null");
    expect(repairedTarget).not.toContain("@ts-ignore");
    expect(repairedTarget).not.toContain("as unknown as");
  });
});
