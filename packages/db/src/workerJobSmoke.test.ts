import { describe, expect, it } from "vitest";

import {
  runWorkerJobSmokeCheck,
  workerJobSmokeTransitionPlan
} from "./workerJobSmoke.js";

describe("worker job smoke", () => {
  it("exports the M26 worker job smoke helper", () => {
    expect(typeof runWorkerJobSmokeCheck).toBe("function");
  });

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
