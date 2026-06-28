import { readFileSync } from "node:fs";

import {
  describe,
  expect,
  it
} from "vitest";

import {
  brainKnowledgeCardFromRetainedPatternDecision,
  parseBrainKnowledgeReadModel,
  parseRetainedPatternDecision,
  searchBrainKnowledgeCards
} from "./brainKnowledgeReadModel.js";

const readRootFile = (path: string): string =>
  readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8");

const readJsonRootFile = (path: string): unknown =>
  JSON.parse(readRootFile(path));

const cardFixture = (): unknown =>
  readJsonRootFile("tests/fixtures/brain-knowledge/cards/ts-boundary-unknown-first-result-state.json");

const patternDecisionFixture = (): unknown =>
  readJsonRootFile("docs/patterns/retained-patterns/ts-boundary-unknown-first-result-state.json");

describe("Brain knowledge read model", () => {
  it("parses a concrete knowledge card fixture from unknown JSON", () => {
    const card = parseBrainKnowledgeReadModel(cardFixture());

    expect(card).toMatchObject({
      id: "pattern:ts-boundary-unknown-first-result-state",
      kind: "pattern",
      status: "active",
      reviewability: "ready",
      confidence: "high",
      nextAction: "use"
    });
  });

  it("rejects cards missing required evidence boundaries", () => {
    const card = parseBrainKnowledgeReadModel({
      id: "pattern:missing-evidence",
      kind: "pattern",
      status: "active",
      title: "Missing evidence",
      summary: "This should not parse.",
      confidence: "low",
      reviewability: "unknown",
      sourceRefs: [],
      evidenceRefs: [],
      consumers: ["test"],
      falsifier: "missing",
      doesNotProve: "missing",
      temporal: {
        kind: "unknown"
      },
      dissent: {
        kind: "unknown"
      },
      nextAction: "unknown"
    });

    expect(card).toBeUndefined();
  });

  it("filters cards by kind, status, reviewability, and text", () => {
    const card = parseBrainKnowledgeReadModel(cardFixture());

    if (card === undefined) {
      throw new Error("Expected card fixture to parse.");
    }

    expect(searchBrainKnowledgeCards([card], {
      kind: "pattern",
      status: "active",
      reviewability: "ready",
      text: "unknown-first"
    })).toEqual([card]);

    expect(searchBrainKnowledgeCards([card], {
      kind: "memory",
      text: "unknown-first"
    })).toEqual([]);

    expect(searchBrainKnowledgeCards([card], {
      text: "nonexistent"
    })).toEqual([]);
  });

  it("produces the TypeScript boundary knowledge card from the retained pattern decision", () => {
    const patternDecision = parseRetainedPatternDecision(patternDecisionFixture());
    const expectedCard = parseBrainKnowledgeReadModel(cardFixture());

    if (patternDecision === undefined) {
      throw new Error("Expected retained pattern decision fixture to parse.");
    }

    if (expectedCard === undefined) {
      throw new Error("Expected brain knowledge card fixture to parse.");
    }

    expect(brainKnowledgeCardFromRetainedPatternDecision(patternDecision)).toEqual(expectedCard);
  });
});
