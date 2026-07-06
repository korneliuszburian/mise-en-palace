import { describe, expect, it } from "vitest";

import {
  formatRetainedPatternSelectionLines,
  retainedPatternSelectionFromKnowledgeJson,
  retainedPatternSelectionFromMetadata,
  unavailableRetainedPatternSelection
} from "../retained-pattern-selection.js";

const validPatternCard = {
  id: "pattern:ts-boundary-brain-knowledge-parser-exemplar",
  title: "Brain knowledge parser TypeScript exemplar",
  reviewability: "ready",
  nextAction: "review",
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
    patternId: "ts-boundary-brain-knowledge-parser-exemplar",
    targetFit: "target_specific",
    targetFitReasons: ["matched distinctive query token(s): parser, exemplar."]
  }],
  targetFitSummary: {
    verdict: "target_specific_selected_knowledge",
    targetSpecific: 1,
    genericGuardrail: 0,
    adjacentPattern: 0,
    noise: 0,
    unknown: 0,
    recommendedUse:
      "Use target-specific selectedKnowledge first, then treat generic or adjacent packets as guardrails.",
    doesNotProve:
      "Target-specific selectedKnowledge does not prove source truth, ranking quality, or product readiness."
  },
  recommendedNextAction:
    "Use target-specific selectedKnowledge first, then treat generic or adjacent packets as guardrails.",
  reason: "Retained brain knowledge matched the pre-coding plan query.",
  doesNotProve:
    "Selected retained patterns do not prove implementation correctness.",
  proof: {
    proves: ["brain knowledge catalog selected a retained pattern"],
    doesNotProve: ["implementation correctness"]
  }
};

describe("retainedPatternSelection", () => {
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
      patternId: "ts-boundary-brain-knowledge-parser-exemplar",
      targetFit: "target_specific",
      targetFitReasons: ["matched distinctive query token(s): parser, exemplar."]
    }]);
    expect(result.targetFitSummary.verdict).toBe("target_specific_selected_knowledge");
    expect(result.recommendedNextAction).toContain("Use target-specific selectedKnowledge");
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
        nextAction: "review"
      }]
    });
  });

  it("preserves explicit target-fit summary metadata instead of recomputing it", () => {
    const result = retainedPatternSelectionFromMetadata({
      retainedPatternSelection: {
        ...validSelectionMetadata,
        targetFitSummary: {
          verdict: "generic_only_selected_knowledge",
          targetSpecific: 0,
          genericGuardrail: 1,
          adjacentPattern: 0,
          noise: 0,
          unknown: 0,
          recommendedUse:
            "Treat selectedKnowledge as generic guardrails; use target/source evidence first before considering selected knowledge sufficient.",
          doesNotProve:
            "Generic-only selectedKnowledge does not prove target-specific context was selected."
        },
        recommendedNextAction: "stored target-fit summary was preserved"
      }
    });

    expect(result?.targetFitSummary.verdict).toBe("generic_only_selected_knowledge");
    expect(result?.recommendedNextAction).toBe("stored target-fit summary was preserved");
  });

  it("formats unavailable retained pattern readback with empty-target-fit guidance", () => {
    const selection = unavailableRetainedPatternSelection(
      "unknown-first parser exemplar",
      "brain knowledge command failed"
    );

    expect(selection.targetFitSummary.verdict).toBe("no_selected_knowledge");
    expect(selection.recommendedNextAction).toBe(selection.targetFitSummary.recommendedUse);
    expect(formatRetainedPatternSelectionLines(selection)).toContain(
      "Retained pattern recommended use: Do not infer brain knowledge sufficiency; use source/search evidence or acquire governed evidence first."
    );
  });
});
