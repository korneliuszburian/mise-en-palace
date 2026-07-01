import { readFileSync } from "node:fs";

import {
  describe,
  expect,
  it
} from "vitest";

const readRootFile = (path: string): string =>
  readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8");

const readJsonRootFile = (path: string): unknown =>
  JSON.parse(readRootFile(path));

const sectionBody = (body: string, heading: string): string => {
  const start = body.indexOf(heading);

  if (start === -1) {
    throw new Error(`Could not find section ${heading}`);
  }

  const nextHeading = body.indexOf("\n## ", start + heading.length);

  return body.slice(start, nextHeading === -1 ? undefined : nextHeading);
};

describe("Brain knowledge read model invariants", () => {
  it("keeps the brain knowledge read model action-oriented and reviewable", () => {
    const readModels = readRootFile("docs/architecture/observability-read-models.md");
    const knowledgeModel = sectionBody(readModels, "## BrainKnowledgeReadModel");

    expect(knowledgeModel).toContain("read-only");
    expect(knowledgeModel).toContain("type BrainKnowledgeReadModel = {");
    expect(knowledgeModel).toContain("kind: BrainKnowledgeKind;");
    expect(knowledgeModel).toContain("status: BrainKnowledgeStatus;");
    expect(knowledgeModel).toContain("confidence: BrainKnowledgeConfidence;");
    expect(knowledgeModel).toContain("reviewability: BrainKnowledgeReviewability;");
    expect(knowledgeModel).toContain("sourceRefs: string[];");
    expect(knowledgeModel).toContain("evidenceRefs: string[];");
    expect(knowledgeModel).toContain("consumers: string[];");
    expect(knowledgeModel).toContain("falsifier: string;");
    expect(knowledgeModel).toContain("doesNotProve: string;");
    expect(knowledgeModel).toContain("temporal:");
    expect(knowledgeModel).toContain("dissent:");
    expect(knowledgeModel).toContain("nextAction:");
  });

  it("keeps UI and search behind the read-only brain knowledge readback contract", () => {
    const readModels = readRootFile("docs/architecture/observability-read-models.md");
    const dashboardGate = readRootFile("docs/decisions/ADR-0025-dashboard-readiness-gate.md");
    const webSearchGate = readRootFile(
      "docs/decisions/ADR-0028-brain-knowledge-web-search-readiness-gate.md"
    );
    const knowledgeModel = sectionBody(readModels, "## BrainKnowledgeReadModel");

    expect(knowledgeModel).toContain(
      "If a knowledge card cannot show evidence refs, source refs, consumer,"
    );
    expect(knowledgeModel).toContain("it is not ready for UI");
    expect(knowledgeModel).toContain(
      "Search may rank and display only read-only BrainKnowledgeReadModel cards."
    );
    expect(knowledgeModel).toContain("must not mutate Memory Core");
    expect(knowledgeModel).toContain("SourceDecision");
    expect(knowledgeModel).toContain("candidate status");
    expect(knowledgeModel).toContain("evidence");
    expect(dashboardGate).toContain("Do not build a dashboard");
    expect(dashboardGate).toContain("read-only boundary over typed read models");
    expect(webSearchGate).toContain("static/read-only web search path");
    expect(webSearchGate).toContain("BrainKnowledgeReadModel");
    expect(webSearchGate).toContain("Mutation: none");
    expect(webSearchGate).toContain("must not mutate Memory Core");
    expect(webSearchGate).toContain("Add dashboard package now");
    expect(webSearchGate).toContain("Add API solely to serve brain knowledge");
    expect(webSearchGate).toContain("Add MCP server before static preview usefulness is proven");
    expect(webSearchGate).toContain("V282 Brain Knowledge Static Web Preview Artifact");
  });

  it("keeps the retained TypeScript pattern available as a concrete knowledge card", () => {
    const pattern = readJsonRootFile(
      "docs/patterns/retained-patterns/ts-boundary-unknown-first-result-state.json"
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

  it("keeps the explicit brain knowledge catalog pointed at retained pattern sources", () => {
    const catalog = readJsonRootFile("docs/brain-knowledge/catalog.json");

    if (!isRecord(catalog)) {
      throw new Error("Brain knowledge catalog must be an object.");
    }

    const patternFiles = catalog["patternFiles"];
    const usefulnessFeedbackFiles = catalog["usefulnessFeedbackFiles"];

    expect(Array.isArray(patternFiles)).toBe(true);
    expect(Array.isArray(usefulnessFeedbackFiles)).toBe(true);
    expect(patternFiles).toContain(
      "../patterns/retained-patterns/active-context-compact-current-truth.json"
    );
    expect(patternFiles).toContain(
      "../patterns/retained-patterns/brain-knowledge-read-only-ui-boundary.json"
    );
    expect(patternFiles).toContain(
      "../patterns/retained-patterns/codex-execplan-living-validation-loop.json"
    );
    expect(patternFiles).toContain(
      "../patterns/retained-patterns/codex-goal-continuation-evidence-contract.json"
    );
    expect(patternFiles).toContain(
      "../patterns/retained-patterns/codex-prompt-task-contract-proof-boundary.json"
    );
    expect(patternFiles).toContain(
      "../patterns/retained-patterns/codex-skill-progressive-disclosure-routing.json"
    );
    expect(patternFiles).toContain(
      "../patterns/retained-patterns/consensus-relation-heartbeat-review-boundary.json"
    );
    expect(patternFiles).toContain(
      "../patterns/retained-patterns/reference-implementation-recipe-clone-boundary.json"
    );
    expect(patternFiles).toContain(
      "../patterns/retained-patterns/ts-boundary-brain-knowledge-parser-exemplar.json"
    );
    expect(patternFiles).toContain("../patterns/retained-patterns/evidence-proof-non-proof-boundary.json");
    expect(patternFiles).toContain("../patterns/retained-patterns/source-to-decision-retention-gate.json");
    expect(patternFiles).toContain(
      "../patterns/retained-patterns/target-repo-write-authority-boundary.json"
    );
    expect(patternFiles).toContain(
      "../patterns/retained-patterns/untrusted-context-warning-boundary.json"
    );
    expect(patternFiles).toContain(
      "../patterns/retained-patterns/ts-boundary-unknown-first-result-state.json"
    );
    expect(usefulnessFeedbackFiles).toContain(
      "usefulness-feedback/v288-external-codex-workflow-patterns.json"
    );
    expect(usefulnessFeedbackFiles).toContain(
      "usefulness-feedback/dvy-01-typescript-exemplar-trial.json"
    );
    expect(usefulnessFeedbackFiles).toContain(
      "usefulness-feedback/cru-01-consensus-relation-heartbeat-review.json"
    );
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
    expect(previewScript).toContain("--catalog-file docs/brain-knowledge/catalog.json");
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
