import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

import {
  parseGoldenTaskFixtures
} from "./goldenTask.js";

const readFixture = (): unknown => {
  const fixtureUrl = new URL(
    "../../../tests/fixtures/golden-tasks/memory-behavior.json",
    import.meta.url
  );
  const parsed: unknown = JSON.parse(readFileSync(fixtureUrl, "utf8"));

  return parsed;
};

const readBoundaryFixture = (): unknown => {
  const fixtureUrl = new URL(
    "../../../tests/fixtures/golden-tasks/boundary-behavior.json",
    import.meta.url
  );
  const parsed: unknown = JSON.parse(readFileSync(fixtureUrl, "utf8"));

  return parsed;
};

const readObservationReflectionFixture = (): unknown => {
  const fixtureUrl = new URL(
    "../../../tests/fixtures/golden-tasks/observation-reflection-behavior.json",
    import.meta.url
  );
  const parsed: unknown = JSON.parse(readFileSync(fixtureUrl, "utf8"));

  return parsed;
};

const readEvidenceCaptureFixture = (): unknown => {
  const fixtureUrl = new URL(
    "../../../tests/fixtures/golden-tasks/evidence-capture-behavior.json",
    import.meta.url
  );
  const parsed: unknown = JSON.parse(readFileSync(fixtureUrl, "utf8"));

  return parsed;
};

const readCodexBriefFixture = (): unknown => {
  const fixtureUrl = new URL(
    "../../../tests/fixtures/golden-tasks/codex-brief-behavior.json",
    import.meta.url
  );
  const parsed: unknown = JSON.parse(readFileSync(fixtureUrl, "utf8"));

  return parsed;
};

describe("golden task fixtures", () => {
  test("load deterministically from file fixtures", () => {
    const tasks = parseGoldenTaskFixtures(readFixture());

    expect(tasks.map((task) => task.id)).toEqual([
      "golden-task-memory-001",
      "golden-task-memory-002",
      "golden-task-memory-003",
      "golden-task-runtime-proof-001",
      "golden-task-source-001"
    ]);
    expect(tasks[1]?.cases.map((goldenCase) => goldenCase.id)).toEqual([
      "golden-case-memory-002-a",
      "golden-case-memory-002-b",
      "golden-case-memory-smoke-001",
      "golden-case-memory-smoke-002"
    ]);
    expect(tasks[1]?.cases[1]?.protectedFailureModes.map((failureMode) => failureMode.id)).toEqual([
      "failure-mode-memory-002-a",
      "failure-mode-memory-002-b"
    ]);
  });

  test("load boundary behavior fixtures deterministically", () => {
    const tasks = parseGoldenTaskFixtures(readBoundaryFixture());

    expect(tasks.map((task) => task.id)).toEqual(["golden-task-boundary-001"]);
    expect(tasks[0]?.cases.map((goldenCase) => goldenCase.id)).toEqual([
      "golden-case-audit-001-a",
      "golden-case-context-001-a",
      "golden-case-source-001-a",
      "golden-case-type-001-a"
    ]);
  });

  test("load observation and reflection behavior fixtures deterministically", () => {
    const tasks = parseGoldenTaskFixtures(readObservationReflectionFixture());

    expect(tasks.map((task) => task.id)).toEqual(["golden-task-observation-reflection-001"]);
    expect(tasks[0]?.cases.map((goldenCase) => goldenCase.id)).toEqual([
      "golden-case-anti-memory-001-a",
      "golden-case-gap-001-a",
      "golden-case-observation-001-a",
      "golden-case-reflection-001-a"
    ]);
  });

  test("load evidence capture behavior fixtures deterministically", () => {
    const tasks = parseGoldenTaskFixtures(readEvidenceCaptureFixture());

    expect(tasks.map((task) => task.id)).toEqual(["golden-task-evidence-capture-001"]);
    expect(tasks[0]?.cases.map((goldenCase) => goldenCase.id)).toEqual([
      "golden-case-evidence-dirty-context-001-a",
      "golden-case-evidence-dirty-context-001-b"
    ]);
  });

  test("load Codex brief behavior fixtures deterministically", () => {
    const tasks = parseGoldenTaskFixtures(readCodexBriefFixture());

    expect(tasks.map((task) => task.id)).toEqual(["golden-task-codex-brief-001"]);
    expect(tasks[0]?.cases.map((goldenCase) => goldenCase.id)).toEqual([
      "golden-case-codex-brief-001-a"
    ]);
  });

  test("rejects shape-only fixtures without protected behavior", () => {
    expect(() =>
      parseGoldenTaskFixtures([{
        id: "golden-task-invalid",
        status: "draft",
        title: "Invalid shape-only fixture",
        description: "This should not become eval theater.",
        owner: "memory-eval",
        domains: ["memory"],
        cases: [{
          id: "golden-case-invalid",
          title: "shape-only",
          input: {},
          expectedBehavior: {
            outcome: "flag",
            subject: "",
            rationale: "",
            evidenceRefs: []
          },
          protectedFailureModes: [],
          sourceRefs: [],
          metadata: {}
        }],
        metadata: {},
        createdAt: "2026-06-23T09:20:00.000Z",
        updatedAt: "2026-06-23T09:20:00.000Z"
      }])
    ).toThrow();
  });
});
