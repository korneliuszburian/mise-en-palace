import { describe, expect, it } from "vitest";

import type { RankedActivationCandidate } from "../types.js";
import { applyContextROI } from "../context-roi.js";

const candidate = (
  id: string,
  lexicalScore: number,
  trustScore: number,
  metadata: Record<string, unknown> = {}
): RankedActivationCandidate => ({
  id,
  kind: "source",
  subjectType: "source_claim",
  subjectId: id,
  text: id,
  sourceAuthority: "high",
  reason: id,
  expectedUse: id,
  tokenEstimate: 24,
  metadata,
  lexicalScore,
  vectorScore: 0,
  graphScore: 0,
  temporalScore: 0,
  contextRoiScore: 0,
  feedbackScore: 0,
  totalScore: lexicalScore + trustScore
});

describe("task relevance context ROI", () => {
  it("does not use authority score to backfill a packet with weakly matched context", () => {
    const selected = applyContextROI([
      candidate("task-bound", 200, 30),
      candidate("generic-authority", 100, 30),
      candidate("trust-only", 0, 30)
    ], {
      maxInclusions: 6,
      minimumTaskRelevanceScore: 20,
      minimumTaskRelevanceRatio: 0.6
    });

    expect(selected.map(({ subjectId, exclusion }) => ({
      subjectId,
      reason: exclusion?.reason
    }))).toEqual([
      { subjectId: "task-bound", reason: undefined },
      { subjectId: "generic-authority", reason: "low_context_roi" },
      { subjectId: "trust-only", reason: "low_context_roi" }
    ]);
  });

  it("retains distinct concerns for applicable task scopes without unrelated authority", () => {
    const scoped = (id: string, lexicalScore: number, taskScope: string, matchedTerm: string) =>
      candidate(id, lexicalScore, 30, {
        taskScopes: ["frontend", "services-section"],
        taskConcerns: [taskScope],
        activationQueryTerms: [
          "component",
          "pattern",
          "selection",
          "responsive",
          "layout",
          "custom",
          "properties",
          "css",
          "architecture",
          "services",
          "section"
        ],
        matchedQueryTerms: [matchedTerm]
      });
    const selected = applyContextROI([
      scoped("reuse", 600, "pattern-selection", "pattern"),
      scoped("responsive", 500, "responsive-layout", "responsive"),
      scoped("layout-owner", 300, "component-layout", "layout"),
      scoped("variable-api", 300, "css-custom-properties", "custom"),
      scoped("methodology", 300, "css-architecture", "css"),
      candidate("unrelated", 300, 30, {
        taskScopes: ["frontend", "component-security", "services-section-fragment"],
        taskConcerns: ["security-review"],
        activationQueryTerms: ["component", "services", "section"],
        matchedQueryTerms: ["component"]
      })
    ], {
      maxInclusions: 6,
      minimumTaskRelevanceScore: 20,
      minimumTaskRelevanceRatio: 0.6,
      preserveApplicableTaskConcernCoverage: true
    });

    expect(selected.map(({ subjectId, exclusion }) => ({
      subjectId,
      reason: exclusion?.reason
    }))).toEqual([
      { subjectId: "reuse", reason: undefined },
      { subjectId: "responsive", reason: undefined },
      { subjectId: "layout-owner", reason: undefined },
      { subjectId: "variable-api", reason: undefined },
      { subjectId: "methodology", reason: undefined },
      { subjectId: "unrelated", reason: "low_context_roi" }
    ]);
  });
});
