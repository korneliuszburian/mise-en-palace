import { describe, expect, it } from "vitest";

import {
  workerJobSmokeTransitionPlan
} from "../worker-job-smoke.js";

describe("worker job smoke", () => {
  it("plans transition counts from the actual worker job count", () => {
    expect(workerJobSmokeTransitionPlan(5)).toEqual({
      succeeded: 2,
      skipped: 2,
      failed: 1
    });
    expect(workerJobSmokeTransitionPlan(6)).toEqual({
      succeeded: 2,
      skipped: 2,
      failed: 2
    });
  });
});
