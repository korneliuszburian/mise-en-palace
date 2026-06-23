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

  return JSON.parse(readFileSync(fixtureUrl, "utf8")) as unknown;
};

describe("golden task fixtures", () => {
  test("load deterministically from file fixtures", () => {
    const tasks = parseGoldenTaskFixtures(readFixture());

    expect(tasks.map((task) => task.id)).toEqual([
      "golden-task-memory-001",
      "golden-task-memory-002"
    ]);
    expect(tasks[1]?.cases.map((goldenCase) => goldenCase.id)).toEqual([
      "golden-case-memory-002-a",
      "golden-case-memory-002-b"
    ]);
    expect(tasks[1]?.cases[1]?.protectedFailureModes.map((failureMode) => failureMode.id)).toEqual([
      "failure-mode-memory-002-a",
      "failure-mode-memory-002-b"
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
