import { readFileSync } from "node:fs";

import {
  describe,
  expect,
  it
} from "vitest";

import {
  brainKnowledgeCardFromRetainedPatternDecision,
  cardsWithBrainKnowledgeUsefulnessFeedback,
  parseBrainKnowledgeReadModel,
  parseRetainedPatternDecision,
  parseBrainKnowledgeUsefulnessFeedbackList,
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

  it("filters cards by latest usefulness outcome", () => {
    const card = parseBrainKnowledgeReadModel(cardFixture());
    const feedback = parseBrainKnowledgeUsefulnessFeedbackList({
      feedback: [
        {
          cardId: "pattern:ts-boundary-unknown-first-result-state",
          outcome: "helped",
          summary: "The retained pattern guided an unknown-first boundary repair.",
          evidenceRefs: ["docs/reviews/newer.md"],
          doesNotProve: "This feedback does not prove product readiness.",
          observedAt: "2026-06-28"
        }
      ]
    });

    if (card === undefined || feedback === undefined) {
      throw new Error("Expected card and usefulness feedback fixtures to parse.");
    }

    const cards = cardsWithBrainKnowledgeUsefulnessFeedback([card], feedback);

    expect(searchBrainKnowledgeCards(cards, {
      usefulnessOutcome: "helped"
    })).toEqual(cards);
    expect(searchBrainKnowledgeCards(cards, {
      usefulnessOutcome: "noise"
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

  it("parses and applies latest usefulness feedback from unknown JSON", () => {
    const card = parseBrainKnowledgeReadModel(cardFixture());
    const feedback = parseBrainKnowledgeUsefulnessFeedbackList({
      feedback: [
        {
          cardId: "pattern:ts-boundary-unknown-first-result-state",
          outcome: "neutral",
          summary: "Older feedback should not win.",
          evidenceRefs: ["docs/reviews/older.md"],
          doesNotProve: "Older feedback does not prove current usefulness.",
          observedAt: "2026-06-27"
        },
        {
          cardId: "pattern:ts-boundary-unknown-first-result-state",
          outcome: "helped",
          summary: "The retained pattern guided an unknown-first boundary repair.",
          evidenceRefs: ["docs/reviews/newer.md"],
          doesNotProve: "This feedback does not prove product readiness.",
          observedAt: "2026-06-28"
        }
      ]
    });

    if (card === undefined || feedback === undefined) {
      throw new Error("Expected card and usefulness feedback fixtures to parse.");
    }

    expect(cardsWithBrainKnowledgeUsefulnessFeedback([card], feedback)).toMatchObject([
      {
        id: "pattern:ts-boundary-unknown-first-result-state",
        usefulnessFeedback: {
          outcome: "helped",
          summary: "The retained pattern guided an unknown-first boundary repair.",
          evidenceRefs: ["docs/reviews/newer.md"]
        }
      }
    ]);
  });

  it("rejects usefulness feedback missing proof boundaries", () => {
    expect(parseBrainKnowledgeUsefulnessFeedbackList({
      feedback: [
        {
          cardId: "pattern:missing-boundary",
          outcome: "helped",
          summary: "Missing doesNotProve should fail.",
          evidenceRefs: ["docs/reviews/report.md"]
        }
      ]
    })).toBeUndefined();
  });
});
