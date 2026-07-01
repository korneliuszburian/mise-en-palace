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

const referenceImplementationPatternDecisionFixture = (): unknown =>
  readJsonRootFile("docs/patterns/retained-patterns/reference-implementation-recipe-clone-boundary.json");

const parsedCardFixture = () => {
  const card = parseBrainKnowledgeReadModel(cardFixture());

  if (card === undefined) {
    throw new Error("Expected card fixture to parse.");
  }

  return card;
};

const parsedPatternDecisionFixture = () => {
  const patternDecision = parseRetainedPatternDecision(patternDecisionFixture());

  if (patternDecision === undefined) {
    throw new Error("Expected retained pattern decision fixture to parse.");
  }

  return patternDecision;
};

const parsedReferenceImplementationPatternDecisionFixture = () => {
  const patternDecision = parseRetainedPatternDecision(referenceImplementationPatternDecisionFixture());

  if (patternDecision === undefined) {
    throw new Error("Expected reference implementation retained pattern decision to parse.");
  }

  return patternDecision;
};

describe("Brain knowledge read model", () => {
  it("parses a concrete brain knowledge fixture from unknown JSON", () => {
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

  it("rejects invalid read-model enum fields from unknown JSON", () => {
    const card = parsedCardFixture();

    for (const field of [
      "kind",
      "status",
      "confidence",
      "reviewability",
      "nextAction"
    ]) {
      expect(parseBrainKnowledgeReadModel({
        ...card,
        [field]: "invalid"
      })).toBeUndefined();
    }
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

  it("matches text queries by deterministic tokens when whole-query substring misses", () => {
    const card = parseBrainKnowledgeReadModel(cardFixture());

    if (card === undefined) {
      throw new Error("Expected card fixture to parse.");
    }

    expect(searchBrainKnowledgeCards([card], {
      text: "unknown first result state"
    })).toEqual([card]);

    expect(searchBrainKnowledgeCards([card], {
      text: "unknown first result state missing"
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
    expect(searchBrainKnowledgeCards(cards, {
      usefulnessOutcome: "none"
    })).toEqual([]);
  });

  it("filters cards with no usefulness feedback", () => {
    const card = parseBrainKnowledgeReadModel(cardFixture());

    if (card === undefined) {
      throw new Error("Expected card fixture to parse.");
    }

    expect(searchBrainKnowledgeCards([card], {
      usefulnessOutcome: "none"
    })).toEqual([card]);
    expect(searchBrainKnowledgeCards([card], {
      usefulnessOutcome: "helped"
    })).toEqual([]);
    expect(searchBrainKnowledgeCards([card], {
      usefulnessOutcome: "none",
      text: "unknown-first"
    })).toEqual([card]);
    expect(searchBrainKnowledgeCards([card], {
      usefulnessOutcome: "none",
      text: "missing text"
    })).toEqual([]);
  });

  it("produces the TypeScript boundary knowledge card from the retained pattern decision", () => {
    const patternDecision = parsedPatternDecisionFixture();
    const expectedCard = parseBrainKnowledgeReadModel(cardFixture());

    if (expectedCard === undefined) {
      throw new Error("Expected brain brain knowledge fixture to parse.");
    }

    expect(brainKnowledgeCardFromRetainedPatternDecision(patternDecision)).toEqual(expectedCard);
  });

  it("keeps the reference implementation recipe pattern searchable but deferred", () => {
    const patternDecision = parsedReferenceImplementationPatternDecisionFixture();
    const card = brainKnowledgeCardFromRetainedPatternDecision(patternDecision);

    expect(card).toMatchObject({
      id: "pattern:reference-implementation-recipe-clone-boundary",
      kind: "pattern",
      status: "deferred",
      confidence: "medium",
      reviewability: "ready",
      nextAction: "review"
    });
    expect(searchBrainKnowledgeCards([card], {
      text: "reference implementation clone recipe TypeScript"
    })).toEqual([card]);
  });

  it("maps retained pattern adoption statuses to brain-knowledge status", () => {
    const patternDecision = parsedPatternDecisionFixture();

    expect(brainKnowledgeCardFromRetainedPatternDecision({
      ...patternDecision,
      adoptionStatus: "adopt_now"
    })).toMatchObject({ status: "active" });
    expect(brainKnowledgeCardFromRetainedPatternDecision({
      ...patternDecision,
      adoptionStatus: "lab"
    })).toMatchObject({ status: "deferred" });
    expect(brainKnowledgeCardFromRetainedPatternDecision({
      ...patternDecision,
      adoptionStatus: "later"
    })).toMatchObject({ status: "deferred" });
    expect(brainKnowledgeCardFromRetainedPatternDecision({
      ...patternDecision,
      adoptionStatus: "reject"
    })).toMatchObject({ status: "rejected" });
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

  it("keeps untimestamped feedback only when no newer timestamped feedback exists", () => {
    const card = parsedCardFixture();
    const feedback = parseBrainKnowledgeUsefulnessFeedbackList({
      feedback: [
        {
          cardId: "pattern:ts-boundary-unknown-first-result-state",
          outcome: "helped",
          summary: "Untimestamped feedback should win only against untimestamped feedback.",
          evidenceRefs: ["docs/reviews/untimestamped.md"],
          doesNotProve: "This feedback does not prove product readiness."
        },
        {
          cardId: "pattern:ts-boundary-unknown-first-result-state",
          outcome: "neutral",
          summary: "Timestamped feedback should win against untimestamped feedback.",
          evidenceRefs: ["docs/reviews/timestamped.md"],
          doesNotProve: "This feedback does not prove product readiness.",
          observedAt: "2026-06-28"
        }
      ]
    });

    if (feedback === undefined) {
      throw new Error("Expected usefulness feedback fixture to parse.");
    }

    expect(cardsWithBrainKnowledgeUsefulnessFeedback([card], feedback)).toMatchObject([
      {
        usefulnessFeedback: {
          outcome: "neutral",
          evidenceRefs: ["docs/reviews/timestamped.md"]
        }
      }
    ]);
  });
});
