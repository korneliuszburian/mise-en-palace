import {
  existsSync,
  readFileSync
} from "node:fs";

import {
  describe,
  expect,
  it
} from "vitest";

import { parseBrainKnowledgeUsefulnessFeedbackList } from "./brain-knowledge-read-model.js";

const readRootFile = (path: string): string =>
  readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8");

const readJsonRootFile = (path: string): unknown =>
  JSON.parse(readRootFile(path));

describe("Brain knowledge read model invariants", () => {
  it("keeps the retained TypeScript pattern available as a concrete knowledge card", () => {
    const pattern = readJsonRootFile(
      "corpus/brain-knowledge/patterns/ts-boundary-unknown-first-result-state.json"
    );
    const card = readJsonRootFile(
      "tests/fixtures/brain-knowledge/cards/ts-boundary-unknown-first-result-state.json"
    );

    expect(pattern).toMatchObject({
      patternId: "ts-boundary-unknown-first-result-state",
      adoptionStatus: "adopt_now",
      confidence: "high",
      reviewability: "ready",
      nextAction: "use"
    });

    expect(card).toMatchObject({
      id: "pattern:ts-boundary-unknown-first-result-state",
      kind: "pattern",
      status: "active",
      confidence: "high",
      reviewability: "ready",
      temporal: {
        kind: "current"
      },
      dissent: {
        kind: "none"
      },
      nextAction: "use"
    });

    if (!isRecord(card)) {
      throw new Error("Brain brain knowledge fixture must be an object.");
    }

    expectNonEmptyString(card, "title");
    expectNonEmptyString(card, "summary");
    expectNonEmptyString(card, "falsifier");
    expectNonEmptyString(card, "doesNotProve");
    expectNonEmptyStringArray(card, "sourceRefs");
    expectNonEmptyStringArray(card, "evidenceRefs");
    expectNonEmptyStringArray(card, "consumers");
  });

  it("keeps the explicit brain knowledge catalog pointed only at corpus files that still exist", () => {
    const catalog = readJsonRootFile("corpus/brain-knowledge/catalog.json");

    if (!isRecord(catalog)) {
      throw new Error("Brain knowledge catalog must be an object.");
    }

    const patternFiles = catalog["patternFiles"];
    const usefulnessFeedbackFiles = catalog["usefulnessFeedbackFiles"];

    expect(Array.isArray(patternFiles)).toBe(true);
    expect(Array.isArray(usefulnessFeedbackFiles)).toBe(true);

    if (!Array.isArray(patternFiles) || !Array.isArray(usefulnessFeedbackFiles)) {
      return;
    }

    expect(patternFiles.length).toBeGreaterThan(0);

    for (const file of patternFiles) {
      expect(typeof file).toBe("string");

      if (typeof file !== "string") {
        continue;
      }

      const absolute = new URL(`../../../corpus/brain-knowledge/${file}`, import.meta.url);

      expect(existsSync(absolute), file).toBe(true);
      expect(readJsonRootFile(`corpus/brain-knowledge/${file}`), file).toEqual(expect.any(Object));
    }

    for (const file of usefulnessFeedbackFiles) {
      expect(typeof file).toBe("string");

      if (typeof file !== "string") {
        continue;
      }

      const absolute = new URL(`../../../corpus/brain-knowledge/${file}`, import.meta.url);
      const parsed = parseBrainKnowledgeUsefulnessFeedbackList(
        readJsonRootFile(`corpus/brain-knowledge/${file}`)
      );

      expect(existsSync(absolute), file).toBe(true);
      expect(parsed, file).not.toBeUndefined();
      expect(parsed?.length, file).toBeGreaterThan(0);
    }
  });

  it("keeps the local static web preview artifact command repeatable and read-only", () => {
    const packageJson = readJsonRootFile("package.json");

    if (!isRecord(packageJson)) {
      throw new Error("Root package.json must be an object.");
    }

    const scripts = packageJson["scripts"];

    if (!isRecord(scripts)) {
      throw new Error("Root package.json scripts must be an object.");
    }

    const previewScript = scripts["brain:knowledge:preview"];

    expect(typeof previewScript).toBe("string");

    if (typeof previewScript !== "string") {
      return;
    }

    expect(previewScript).toContain("brain knowledge");
    expect(previewScript).toContain("--catalog-file corpus/brain-knowledge/catalog.json");
    expect(previewScript).toContain("--html");
    expect(previewScript).toContain(".local-lab/brain-knowledge-preview.html");
    expect(previewScript).not.toContain(" db ");
    expect(previewScript).not.toContain("dashboard");
    expect(previewScript).not.toContain("mcp");
    expect(previewScript).not.toContain("--persist");
  });
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function expectNonEmptyString(record: Record<string, unknown>, key: string): void {
  const value = record[key];

  expect(typeof value).toBe("string");
  expect((value as string).length).toBeGreaterThan(0);
}

function expectNonEmptyStringArray(record: Record<string, unknown>, key: string): void {
  const value = record[key];

  expect(Array.isArray(value)).toBe(true);

  if (!Array.isArray(value)) {
    return;
  }

  expect(value.length).toBeGreaterThan(0);

  for (const item of value) {
    expect(typeof item).toBe("string");
    expect((item as string).length).toBeGreaterThan(0);
  }
}
