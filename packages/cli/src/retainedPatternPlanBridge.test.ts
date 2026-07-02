import { describe, expect, it } from "vitest";

import {
  retainedPatternSelectionFromKnowledgeJson,
  retainedPatternSelectionFromMetadata
} from "./retainedPatternPlanBridge.js";

const validPatternCard = {
  id: "pattern:ts-boundary-brain-knowledge-parser-exemplar",
  title: "Brain knowledge parser TypeScript exemplar",
  reviewability: "ready",
  nextAction: "use",
  doesNotProve: "This exemplar does not prove broad TypeScript quality."
};

const validSelectionMetadata = {
  kind: "krn.retainedPatternPlanSelection.v1",
  status: "selected",
  query: "unknown-first parser exemplar",
  source: "brain_knowledge_catalog",
  selectedPatternIds: ["ts-boundary-brain-knowledge-parser-exemplar"],
  selectedPatterns: [{
    ...validPatternCard,
    patternId: "ts-boundary-brain-knowledge-parser-exemplar"
  }],
  reason: "Retained brain knowledge matched the pre-coding plan query.",
  doesNotProve:
    "Selected retained patterns do not prove implementation correctness.",
  proof: {
    proves: ["brain knowledge catalog selected a retained pattern"],
    doesNotProve: ["implementation correctness"]
  }
};

describe("retainedPatternPlanBridge", () => {
  it("parses retained pattern cards through finite reviewability and action fields", () => {
    const result = retainedPatternSelectionFromKnowledgeJson(
      "unknown-first parser exemplar",
      JSON.stringify({
        cards: [validPatternCard],
        proof: {
          proves: ["brain knowledge catalog selected a retained pattern"],
          doesNotProve: ["implementation correctness"]
        }
      })
    );

    expect(result.status).toBe("selected");
    expect(result.selectedPatterns).toEqual([{
      ...validPatternCard,
      patternId: "ts-boundary-brain-knowledge-parser-exemplar"
    }]);
  });

  it("rejects retained pattern cards with prose next actions", () => {
    const result = retainedPatternSelectionFromKnowledgeJson(
      "unknown-first parser exemplar",
      JSON.stringify({
        cards: [{
          ...validPatternCard,
          nextAction: "Use before editing TypeScript IO boundaries."
        }]
      })
    );

    expect(result.status).toBe("rejected_or_deferred");
    expect(result.selectedPatterns).toEqual([]);
    expect(result.selectedPatternIds).toEqual([]);
  });

  it("rejects metadata when selected pattern items drift from the exemplar enums", () => {
    expect(
      retainedPatternSelectionFromMetadata({
        retainedPatternSelection: {
          ...validSelectionMetadata,
          selectedPatterns: [{
            ...validPatternCard,
            patternId: "ts-boundary-brain-knowledge-parser-exemplar",
            reviewability: "good_enough"
          }]
        }
      })
    ).toBeUndefined();
  });

  it("parses valid retained pattern metadata packets", () => {
    expect(
      retainedPatternSelectionFromMetadata({
        retainedPatternSelection: validSelectionMetadata
      })
    ).toMatchObject({
      status: "selected",
      selectedPatternIds: ["ts-boundary-brain-knowledge-parser-exemplar"],
      selectedPatterns: [{
        patternId: "ts-boundary-brain-knowledge-parser-exemplar",
        reviewability: "ready",
        nextAction: "use"
      }]
    });
  });
});
