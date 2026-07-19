import { describe, expect, it } from "vitest";

import {
  retainedTrialDecisionApplicationsFor
} from "../internal/smoke/decision-packet-return-loop-smoke.js";

describe("retained DecisionPacket return-loop trial fixture", () => {
  it("excludes SourceDecision subjects already occupied by return-loop application evidence", () => {
    expect(retainedTrialDecisionApplicationsFor({
      governingDecisionIds: [
        "architecture-decision:stale",
        "architecture-decision:helped",
        "architecture-decision:test"
      ],
      sourceDecisionIds: [
        "source-decision:stale",
        "source-decision:helped",
        "source-decision:test"
      ],
      preAppliedSourceDecisionIds: ["source-decision:helped"]
    })).toEqual([{
      governingDecisionId: "architecture-decision:stale",
      sourceDecisionId: "source-decision:stale",
      check: "target_test",
      changedFiles: ["src/config.ts"]
    }, {
      governingDecisionId: "architecture-decision:test",
      sourceDecisionId: "source-decision:test",
      check: "target_diff_check",
      changedFiles: ["tests/userService.test.ts"]
    }]);
  });
});
