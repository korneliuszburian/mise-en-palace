import { describe, expect, it } from "vitest";

import type { RankedActivationCandidate } from "../types.js";
import { applyContextROI } from "../context-roi.js";

const candidate = (
  id: string,
  lexicalScore: number,
  trustScore: number
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
  metadata: {},
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
});
