import { describe, expect, it } from "vitest";

import {
  formatKnowledgeSelectionLines,
  knowledgeSelectionFromReadbackJson,
  knowledgeSelectionFromMetadata,
  unavailableKnowledgeSelection
} from "../knowledge-selection.js";

const validKnowledgeReadModel = {
  id: "knowledge:ts-boundary-knowledge-parser-exemplar",
  title: "Knowledge parser TypeScript exemplar",
  reviewability: "ready",
  nextAction: "review",
  doesNotProve: "This exemplar does not prove broad TypeScript quality."
};

const validSelectionMetadata = {
  kind: "krn.knowledge.selection.v1",
  status: "selected",
  query: "unknown-first parser exemplar",
  source: "knowledge_catalog",
  selectedKnowledgeIds: ["ts-boundary-knowledge-parser-exemplar"],
  selectedKnowledge: [{
    ...validKnowledgeReadModel,
    knowledgeId: "ts-boundary-knowledge-parser-exemplar",
    targetFit: "target_specific",
    targetFitReasons: ["matched distinctive query token(s): parser, exemplar."]
  }],
  targetFitSummary: {
    verdict: "target_specific_selected_knowledge",
    targetSpecific: 1,
    genericGuardrail: 0,
    adjacentKnowledge: 0,
    noise: 0,
    unknown: 0,
    recommendedUse:
      "Use target-specific selectedKnowledge first, then treat generic or adjacent packets as guardrails.",
    doesNotProve:
      "Target-specific selectedKnowledge does not prove source truth, ranking quality, or product readiness."
  },
  recommendedNextAction:
    "Use target-specific selectedKnowledge first, then treat generic or adjacent packets as guardrails.",
  reason: "Knowledge read model matched the pre-coding plan query.",
  doesNotProve:
    "Selected knowledge does not prove implementation correctness.",
  proof: {
    proves: ["knowledge catalog selected a knowledge read model"],
    doesNotProve: ["implementation correctness"]
  }
};

describe("knowledgeSelection", () => {
  it("parses knowledge read models through finite reviewability and action fields", () => {
    const result = knowledgeSelectionFromReadbackJson(
      "unknown-first parser exemplar",
      JSON.stringify({
        readModels: [validKnowledgeReadModel],
        proof: {
          proves: ["knowledge catalog selected a knowledge read model"],
          doesNotProve: ["implementation correctness"]
        }
      })
    );

    expect(result.status).toBe("selected");
    expect(result.source).toBe("knowledge_catalog");
    expect(result.selectedKnowledge).toEqual([{
      ...validKnowledgeReadModel,
      knowledgeId: "ts-boundary-knowledge-parser-exemplar",
      targetFit: "target_specific",
      targetFitReasons: ["matched distinctive query token(s): parser, exemplar."]
    }]);
    expect(result.targetFitSummary.verdict).toBe("target_specific_selected_knowledge");
    expect(result.recommendedNextAction).toContain("Use target-specific selectedKnowledge");
  });

  it("preserves store-backed readback source for plan metadata", () => {
    const result = knowledgeSelectionFromReadbackJson(
      "unknown-first parser exemplar",
      JSON.stringify({
        source: "memory_store",
        readModels: [validKnowledgeReadModel],
        proof: {
          proves: ["memory store selected a knowledge read model"],
          doesNotProve: ["source truth"]
        }
      })
    );

    expect(result.status).toBe("selected");
    expect(result.source).toBe("memory_store");
    expect(result.proof.proves).toContain("memory store selected a knowledge read model");
  });

  it("rejects knowledge read models with prose next actions", () => {
    const result = knowledgeSelectionFromReadbackJson(
      "unknown-first parser exemplar",
      JSON.stringify({
        readModels: [{
          ...validKnowledgeReadModel,
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
      knowledgeSelectionFromMetadata({
        knowledgeSelection: {
          ...validSelectionMetadata,
          selectedKnowledge: [{
            ...validKnowledgeReadModel,
            knowledgeId: "ts-boundary-knowledge-parser-exemplar",
            reviewability: "good_enough"
          }]
        }
      })
    ).toBeUndefined();
  });

  it("parses valid knowledge selection metadata packets", () => {
    expect(
      knowledgeSelectionFromMetadata({
        knowledgeSelection: validSelectionMetadata
      })
    ).toMatchObject({
      status: "selected",
      selectedKnowledgeIds: ["ts-boundary-knowledge-parser-exemplar"],
      selectedKnowledge: [{
        knowledgeId: "ts-boundary-knowledge-parser-exemplar",
        reviewability: "ready",
        nextAction: "review"
      }]
    });
  });

  it("preserves explicit target-fit summary metadata instead of recomputing it", () => {
    const result = knowledgeSelectionFromMetadata({
      knowledgeSelection: {
        ...validSelectionMetadata,
        targetFitSummary: {
          verdict: "generic_only_selected_knowledge",
          targetSpecific: 0,
          genericGuardrail: 1,
          adjacentKnowledge: 0,
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

  it("formats unavailable brain recall readback with empty-target-fit guidance", () => {
    const selection = unavailableKnowledgeSelection(
      "unknown-first parser exemplar",
      "brain recall command failed"
    );

    expect(selection.targetFitSummary.verdict).toBe("no_selected_knowledge");
    expect(selection.recommendedNextAction).toBe(selection.targetFitSummary.recommendedUse);
    expect(formatKnowledgeSelectionLines(selection)).toContain(
      "Selected KRN context recommended use: Do not infer selected knowledge sufficiency; use source/search evidence or acquire governed evidence first."
    );
  });
});
