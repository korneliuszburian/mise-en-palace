import {
  existsSync,
  readFileSync
} from "node:fs";

import {
  describe,
  expect,
  it
} from "vitest";

import { parseKnowledgeUsefulnessFeedbackList } from "../knowledge-read-model.js";

const readRootFile = (path: string): string =>
  readFileSync(new URL(`../../../../${path}`, import.meta.url), "utf8");

const readJsonRootFile = (path: string): unknown =>
  JSON.parse(readRootFile(path));

describe("Knowledge read model invariants", () => {
  it("keeps the TypeScript knowledge decision available as a concrete knowledge read model", () => {
    const pattern = readJsonRootFile(
      "corpus/brain-knowledge/knowledge/ts-boundary-unknown-first-result-state.json"
    );
    const readModel = readJsonRootFile(
      "tests/fixtures/brain-knowledge/read-models/ts-boundary-unknown-first-result-state.json"
    );

    expect(pattern).toMatchObject({
      knowledgeId: "ts-boundary-unknown-first-result-state",
      decisionStatus: "adopt_now",
      confidence: "high",
      reviewability: "ready",
      nextAction: "use"
    });

    expect(readModel).toMatchObject({
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

    if (!isRecord(readModel)) {
      throw new Error("Knowledge read model fixture must be an object.");
    }

    expectNonEmptyString(readModel, "title");
    expectNonEmptyString(readModel, "summary");
    expectNonEmptyString(readModel, "falsifier");
    expectNonEmptyString(readModel, "doesNotProve");
    expectNonEmptyStringArray(readModel, "sourceRefs");
    expectNonEmptyStringArray(readModel, "evidenceRefs");
    expectNonEmptyStringArray(readModel, "consumers");
  });

  it("keeps the explicit knowledge catalog pointed only at corpus files that still exist", () => {
    const catalog = readJsonRootFile("corpus/brain-knowledge/catalog.json");

    if (!isRecord(catalog)) {
      throw new Error("Knowledge catalog must be an object.");
    }

    const knowledgeFiles = catalog["knowledgeFiles"];
    const usefulnessFeedbackFiles = catalog["usefulnessFeedbackFiles"];

    expect(Array.isArray(knowledgeFiles)).toBe(true);
    expect(Array.isArray(usefulnessFeedbackFiles)).toBe(true);

    if (!Array.isArray(knowledgeFiles) || !Array.isArray(usefulnessFeedbackFiles)) {
      return;
    }

    expect(knowledgeFiles.length).toBeGreaterThan(0);

    for (const file of knowledgeFiles) {
      expect(typeof file).toBe("string");

      if (typeof file !== "string") {
        continue;
      }

      const absolute = new URL(`../../../../corpus/brain-knowledge/${file}`, import.meta.url);

      expect(existsSync(absolute), file).toBe(true);
      expect(readJsonRootFile(`corpus/brain-knowledge/${file}`), file).toEqual(expect.any(Object));
    }

    for (const file of usefulnessFeedbackFiles) {
      expect(typeof file).toBe("string");

      if (typeof file !== "string") {
        continue;
      }

      const absolute = new URL(`../../../../corpus/brain-knowledge/${file}`, import.meta.url);
      const parsed = parseKnowledgeUsefulnessFeedbackList(
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
