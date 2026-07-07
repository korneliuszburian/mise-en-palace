import { describe, expect, it } from "vitest";

import {
  formatBrainKnowledgeSelectionLines,
  brainKnowledgeSelectionFromReadbackJson,
  brainKnowledgeSelectionFromMetadata,
  unavailableBrainKnowledgeSelection
} from "../brain-knowledge-selection.js";

const validKnowledgeCard = {
  id: "pattern:ts-boundary-brain-knowledge-parser-exemplar",
  title: "Brain knowledge parser TypeScript exemplar",
  reviewability: "ready",
  nextAction: "review",
  doesNotProve: "This exemplar does not prove broad TypeScript quality."
};

const validSelectionMetadata = {
  kind: "krn.brainKnowledgePlanSelection.v1",
  status: "selected",
  query: "unknown-first parser exemplar",
  source: "brain_knowledge_catalog",
  selectedKnowledgeIds: ["ts-boundary-brain-knowledge-parser-exemplar"],
  selectedKnowledge: [{
    ...validKnowledgeCard,
    knowledgeId: "ts-boundary-brain-knowledge-parser-exemplar",
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
  reason: "Brain knowledge matched the pre-coding plan query.",
  doesNotProve:
    "Selected brain knowledge does not prove implementation correctness.",
  proof: {
    proves: ["brain knowledge catalog selected a brain knowledge"],
    doesNotProve: ["implementation correctness"]
  }
};

describe("brainKnowledgeSelection", () => {
  it("parses brain knowledge cards through finite reviewability and action fields", () => {
    const result = brainKnowledgeSelectionFromReadbackJson(
      "unknown-first parser exemplar",
      JSON.stringify({
        cards: [validKnowledgeCard],
        proof: {
          proves: ["brain knowledge catalog selected a brain knowledge"],
          doesNotProve: ["implementation correctness"]
        }
      })
    );

    expect(result.status).toBe("selected");
    expect(result.selectedKnowledge).toEqual([{
      ...validKnowledgeCard,
      knowledgeId: "ts-boundary-brain-knowledge-parser-exemplar",
      targetFit: "target_specific",
      targetFitReasons: ["matched distinctive query token(s): parser, exemplar."]
    }]);
    expect(result.targetFitSummary.verdict).toBe("target_specific_selected_knowledge");
    expect(result.recommendedNextAction).toContain("Use target-specific selectedKnowledge");
  });

  it("rejects brain knowledge cards with prose next actions", () => {
    const result = brainKnowledgeSelectionFromReadbackJson(
      "unknown-first parser exemplar",
      JSON.stringify({
        cards: [{
          ...validKnowledgeCard,
          nextAction: "Use before editing TypeScript IO boundaries."
        }]
      })
    );

    expect(result.status).toBe("rejected_or_deferred");
    expect(result.selectedKnowledge).toEqual([]);
    expect(result.selectedKnowledgeIds).toEqual([]);
  });

  it("rejects metadata when selected knowledge items drift from the exemplar enums", () => {
    expect(
      brainKnowledgeSelectionFromMetadata({
        brainKnowledgeSelection: {
          ...validSelectionMetadata,
          selectedKnowledge: [{
            ...validKnowledgeCard,
            knowledgeId: "ts-boundary-brain-knowledge-parser-exemplar",
            reviewability: "good_enough"
          }]
        }
      })
    ).toBeUndefined();
  });

  it("parses valid brain knowledge metadata packets", () => {
    expect(
      brainKnowledgeSelectionFromMetadata({
        brainKnowledgeSelection: validSelectionMetadata
      })
    ).toMatchObject({
      status: "selected",
      selectedKnowledgeIds: ["ts-boundary-brain-knowledge-parser-exemplar"],
      selectedKnowledge: [{
        knowledgeId: "ts-boundary-brain-knowledge-parser-exemplar",
        reviewability: "ready",
        nextAction: "review"
      }]
    });
  });

  it("preserves explicit target-fit summary metadata instead of recomputing it", () => {
    const result = brainKnowledgeSelectionFromMetadata({
      brainKnowledgeSelection: {
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

  it("formats unavailable brain knowledge readback with empty-target-fit guidance", () => {
    const selection = unavailableBrainKnowledgeSelection(
      "unknown-first parser exemplar",
      "brain knowledge command failed"
    );

    expect(selection.targetFitSummary.verdict).toBe("no_selected_knowledge");
    expect(selection.recommendedNextAction).toBe(selection.targetFitSummary.recommendedUse);
    expect(formatBrainKnowledgeSelectionLines(selection)).toContain(
      "Brain knowledge recommended use: Do not infer brain knowledge sufficiency; use source/search evidence or acquire governed evidence first."
    );
  });
});
