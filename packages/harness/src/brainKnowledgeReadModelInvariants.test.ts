import { readFileSync } from "node:fs";

import {
  describe,
  expect,
  it
} from "vitest";

const readRootFile = (path: string): string =>
  readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8");

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

  it("keeps UI and search behind the read-only knowledge card contract", () => {
    const readModels = readRootFile("docs/architecture/observability-read-models.md");
    const dashboardGate = readRootFile("docs/decisions/ADR-0025-dashboard-readiness-gate.md");
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
  });
});
