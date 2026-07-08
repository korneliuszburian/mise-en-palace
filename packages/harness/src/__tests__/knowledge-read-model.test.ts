import { readFileSync } from "node:fs";

import {
  describe,
  expect,
  it
} from "vitest";

import {
  knowledgeReadModelFromDecision,
  knowledgeReadModelsWithUsefulnessFeedback,
  parseKnowledgeReadModel,
  parseKnowledgeDecision,
  parseKnowledgeUsefulnessFeedbackList,
  searchKnowledgeReadModels
} from "../knowledge-read-model.js";

const readRootFile = (path: string): string =>
  readFileSync(new URL(`../../../../${path}`, import.meta.url), "utf8");

const readJsonRootFile = (path: string): unknown =>
  JSON.parse(readRootFile(path));

const readModelFixture = (): unknown =>
  readJsonRootFile("tests/fixtures/brain-knowledge/read-models/ts-boundary-unknown-first-result-state.json");

const knowledgeDecisionFixture = (): unknown =>
  readJsonRootFile("tests/fixtures/brain-knowledge/corpus/knowledge/ts-boundary-unknown-first-result-state.json");

const referenceImplementationKnowledgeDecisionFixture = (): unknown =>
  readJsonRootFile("tests/fixtures/brain-knowledge/corpus/knowledge/reference-implementation-recipe-clone-boundary.json");

const knowledgeParserExemplarKnowledgeDecisionFixture = (): unknown =>
  readJsonRootFile("tests/fixtures/brain-knowledge/corpus/knowledge/ts-boundary-knowledge-parser-exemplar.json");

const sourceToDecisionKnowledgeDecisionFixture = (): unknown =>
  readJsonRootFile("tests/fixtures/brain-knowledge/corpus/knowledge/source-to-decision-retention-gate.json");

const parsedReadModelFixture = () => {
  const readModel = parseKnowledgeReadModel(readModelFixture());

  if (readModel === undefined) {
    throw new Error("Expected readModel fixture to parse.");
  }

  return readModel;
};

const parsedKnowledgeDecisionFixture = () => {
  const knowledgeDecision = parseKnowledgeDecision(knowledgeDecisionFixture());

  if (knowledgeDecision === undefined) {
    throw new Error("Expected knowledge decision fixture to parse.");
  }

  return knowledgeDecision;
};

const parsedReferenceImplementationKnowledgeDecisionFixture = () => {
  const knowledgeDecision = parseKnowledgeDecision(referenceImplementationKnowledgeDecisionFixture());

  if (knowledgeDecision === undefined) {
    throw new Error("Expected reference implementation knowledge decision to parse.");
  }

  return knowledgeDecision;
};

const parsedKnowledgeParserExemplarKnowledgeDecisionFixture = () => {
  const knowledgeDecision = parseKnowledgeDecision(knowledgeParserExemplarKnowledgeDecisionFixture());

  if (knowledgeDecision === undefined) {
    throw new Error("Expected knowledge parser exemplar knowledge decision to parse.");
  }

  return knowledgeDecision;
};

const parsedSourceToDecisionKnowledgeDecisionFixture = () => {
  const knowledgeDecision = parseKnowledgeDecision(sourceToDecisionKnowledgeDecisionFixture());

  if (knowledgeDecision === undefined) {
    throw new Error("Expected source-to-decision knowledge decision to parse.");
  }

  return knowledgeDecision;
};

describe("Knowledge read model", () => {
  it("parses a concrete knowledge fixture from unknown JSON", () => {
    const readModel = parseKnowledgeReadModel(readModelFixture());

    expect(readModel).toMatchObject({
      id: "pattern:ts-boundary-unknown-first-result-state",
      kind: "pattern",
      status: "active",
      reviewability: "ready",
      confidence: "high",
      nextAction: "use"
    });
  });

  it("rejects readModels missing required evidence boundaries", () => {
    const readModel = parseKnowledgeReadModel({
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

    expect(readModel).toBeUndefined();
  });

  it("rejects invalid read-model enum fields from unknown JSON", () => {
    const readModel = parsedReadModelFixture();

    for (const field of [
      "kind",
      "status",
      "confidence",
      "reviewability",
      "nextAction"
    ]) {
      expect(parseKnowledgeReadModel({
        ...readModel,
        [field]: "invalid"
      })).toBeUndefined();
    }
  });

  it("filters readModels by kind, status, reviewability, and text", () => {
    const readModel = parseKnowledgeReadModel(readModelFixture());

    if (readModel === undefined) {
      throw new Error("Expected readModel fixture to parse.");
    }

    expect(searchKnowledgeReadModels([readModel], {
      kind: "pattern",
      status: "active",
      reviewability: "ready",
      text: "unknown-first"
    })).toEqual([readModel]);

    expect(searchKnowledgeReadModels([readModel], {
      kind: "memory",
      text: "unknown-first"
    })).toEqual([]);

    expect(searchKnowledgeReadModels([readModel], {
      text: "nonexistent"
    })).toEqual([]);
  });

  it("matches text queries by deterministic tokens when whole-query substring misses", () => {
    const readModel = parseKnowledgeReadModel(readModelFixture());

    if (readModel === undefined) {
      throw new Error("Expected readModel fixture to parse.");
    }

    expect(searchKnowledgeReadModels([readModel], {
      text: "unknown first result state"
    })).toEqual([readModel]);

    expect(searchKnowledgeReadModels([readModel], {
      text: "unknown first result state missing"
    })).toEqual([]);
  });

  it("filters readModels by latest usefulness outcome", () => {
    const readModel = parseKnowledgeReadModel(readModelFixture());
    const feedback = parseKnowledgeUsefulnessFeedbackList({
      feedback: [
        {
          knowledgeId: "pattern:ts-boundary-unknown-first-result-state",
          outcome: "helped",
          summary: "The knowledge read model guided an unknown-first boundary repair.",
          evidenceRefs: ["review-evidence/newer.md"],
          doesNotProve: "This feedback does not prove product readiness.",
          observedAt: "2026-06-28"
        }
      ]
    });

    if (readModel === undefined || feedback === undefined) {
      throw new Error("Expected readModel and usefulness feedback fixtures to parse.");
    }

    const readModels = knowledgeReadModelsWithUsefulnessFeedback([readModel], feedback);

    expect(searchKnowledgeReadModels(readModels, {
      usefulnessOutcome: "helped"
    })).toEqual(readModels);
    expect(searchKnowledgeReadModels(readModels, {
      usefulnessOutcome: "noise"
    })).toEqual([]);
    expect(searchKnowledgeReadModels(readModels, {
      usefulnessOutcome: "none"
    })).toEqual([]);
  });

  it("filters readModels with no usefulness feedback", () => {
    const readModel = parseKnowledgeReadModel(readModelFixture());

    if (readModel === undefined) {
      throw new Error("Expected readModel fixture to parse.");
    }

    expect(searchKnowledgeReadModels([readModel], {
      usefulnessOutcome: "none"
    })).toEqual([readModel]);
    expect(searchKnowledgeReadModels([readModel], {
      usefulnessOutcome: "helped"
    })).toEqual([]);
    expect(searchKnowledgeReadModels([readModel], {
      usefulnessOutcome: "none",
      text: "unknown-first"
    })).toEqual([readModel]);
    expect(searchKnowledgeReadModels([readModel], {
      usefulnessOutcome: "none",
      text: "missing text"
    })).toEqual([]);
  });

  it("produces the TypeScript boundary knowledge read model from the knowledge decision", () => {
    const knowledgeDecision = parsedKnowledgeDecisionFixture();
    const expectedReadModel = parseKnowledgeReadModel(readModelFixture());

    if (expectedReadModel === undefined) {
      throw new Error("Expected knowledge fixture to parse.");
    }

    expect(knowledgeReadModelFromDecision(knowledgeDecision)).toEqual(expectedReadModel);
  });

  it("keeps the reference implementation recipe knowledge searchable but deferred", () => {
    const knowledgeDecision = parsedReferenceImplementationKnowledgeDecisionFixture();
    const readModel = knowledgeReadModelFromDecision(knowledgeDecision);

    expect(readModel).toMatchObject({
      id: "pattern:reference-implementation-recipe-clone-boundary",
      kind: "pattern",
      status: "deferred",
      confidence: "medium",
      reviewability: "ready",
      nextAction: "review"
    });
    expect(searchKnowledgeReadModels([readModel], {
      text: "reference implementation clone recipe TypeScript"
    })).toEqual([readModel]);
  });

  it("keeps the knowledge parser exemplar searchable but deferred", () => {
    const knowledgeDecision = parsedKnowledgeParserExemplarKnowledgeDecisionFixture();
    const readModel = knowledgeReadModelFromDecision(knowledgeDecision);

    expect(readModel).toMatchObject({
      id: "pattern:ts-boundary-knowledge-parser-exemplar",
      kind: "pattern",
      status: "deferred",
      confidence: "medium",
      reviewability: "ready",
      nextAction: "review"
    });
    expect(readModel.sourceRefs).toContain("packages/harness/src/knowledge-read-model.ts");
    expect(readModel.evidenceRefs).toContain(
      "packages/harness/src/__tests__/knowledge-read-model-invariants.test.ts"
    );
    expect(searchKnowledgeReadModels([readModel], {
      text: "knowledge parser exemplar unknown-first recipe"
    })).toEqual([readModel]);
  });

  it("preserves optional source-to-decision mechanism fields from unknown JSON", () => {
    const knowledgeDecision = parsedSourceToDecisionKnowledgeDecisionFixture();
    const readModel = knowledgeReadModelFromDecision(knowledgeDecision);

    expect(readModel).toMatchObject({
      id: "pattern:source-to-decision-retention-gate",
      mechanism: "Source-to-decision mapping prevents decorative source hoarding by forcing every retained source or pattern to state why it changes KRN behavior and how it can be falsified.",
      krnImplication: "Brain-knowledge seeds may guide implementation only after the reviewed decision chain is preserved through a store-backed MemoryRecord readback, not by treating catalog JSON as runtime memory."
    });
    expect(searchKnowledgeReadModels([readModel], {
      text: "decorative source hoarding store-backed memoryrecord"
    })).toEqual([readModel]);
    expect(parseKnowledgeDecision({
      ...knowledgeDecision,
      mechanism: ["not", "a", "string"]
    })).toBeUndefined();
  });

  it("maps knowledge decision statuses to knowledge status", () => {
    const knowledgeDecision = parsedKnowledgeDecisionFixture();

    expect(knowledgeReadModelFromDecision({
      ...knowledgeDecision,
      decisionStatus: "adopt_now"
    })).toMatchObject({ status: "active" });
    expect(knowledgeReadModelFromDecision({
      ...knowledgeDecision,
      decisionStatus: "lab"
    })).toMatchObject({ status: "deferred" });
    expect(knowledgeReadModelFromDecision({
      ...knowledgeDecision,
      decisionStatus: "later"
    })).toMatchObject({ status: "deferred" });
    expect(knowledgeReadModelFromDecision({
      ...knowledgeDecision,
      decisionStatus: "reject"
    })).toMatchObject({ status: "rejected" });
  });

  it("parses and applies latest usefulness feedback from unknown JSON", () => {
    const readModel = parseKnowledgeReadModel(readModelFixture());
    const feedback = parseKnowledgeUsefulnessFeedbackList({
      feedback: [
        {
          knowledgeId: "pattern:ts-boundary-unknown-first-result-state",
          outcome: "neutral",
          summary: "Older feedback should not win.",
          evidenceRefs: ["review-evidence/older.md"],
          doesNotProve: "Older feedback does not prove current usefulness.",
          observedAt: "2026-06-27"
        },
        {
          knowledgeId: "pattern:ts-boundary-unknown-first-result-state",
          outcome: "helped",
          summary: "The knowledge read model guided an unknown-first boundary repair.",
          evidenceRefs: ["review-evidence/newer.md"],
          doesNotProve: "This feedback does not prove product readiness.",
          observedAt: "2026-06-28"
        }
      ]
    });

    if (readModel === undefined || feedback === undefined) {
      throw new Error("Expected readModel and usefulness feedback fixtures to parse.");
    }

    expect(knowledgeReadModelsWithUsefulnessFeedback([readModel], feedback)).toMatchObject([
      {
        id: "pattern:ts-boundary-unknown-first-result-state",
        usefulnessFeedback: {
          outcome: "helped",
          summary: "The knowledge read model guided an unknown-first boundary repair.",
          evidenceRefs: ["review-evidence/newer.md"]
        }
      }
    ]);
  });

  it("rejects usefulness feedback missing proof boundaries", () => {
    expect(parseKnowledgeUsefulnessFeedbackList({
      feedback: [
        {
          knowledgeId: "pattern:missing-boundary",
          outcome: "helped",
          summary: "Missing doesNotProve should fail.",
          evidenceRefs: ["review-evidence/report.md"]
        }
      ]
    })).toBeUndefined();
  });

  it("keeps untimestamped feedback only when no newer timestamped feedback exists", () => {
    const readModel = parsedReadModelFixture();
    const feedback = parseKnowledgeUsefulnessFeedbackList({
      feedback: [
        {
          knowledgeId: "pattern:ts-boundary-unknown-first-result-state",
          outcome: "helped",
          summary: "Untimestamped feedback should win only against untimestamped feedback.",
          evidenceRefs: ["review-evidence/untimestamped.md"],
          doesNotProve: "This feedback does not prove product readiness."
        },
        {
          knowledgeId: "pattern:ts-boundary-unknown-first-result-state",
          outcome: "neutral",
          summary: "Timestamped feedback should win against untimestamped feedback.",
          evidenceRefs: ["review-evidence/timestamped.md"],
          doesNotProve: "This feedback does not prove product readiness.",
          observedAt: "2026-06-28"
        }
      ]
    });

    if (feedback === undefined) {
      throw new Error("Expected usefulness feedback fixture to parse.");
    }

    expect(knowledgeReadModelsWithUsefulnessFeedback([readModel], feedback)).toMatchObject([
      {
        usefulnessFeedback: {
          outcome: "neutral",
          evidenceRefs: ["review-evidence/timestamped.md"]
        }
      }
    ]);
  });
});
