import { describe, expect, it } from "vitest";

import {
  maintenanceQueueSmokeTransitionPlan
} from "../dev/smoke/maintenance-queue-smoke.js";

describe("maintenance queue smoke", () => {
  it("plans transition counts from the actual maintenance queue count", () => {
    expect(maintenanceQueueSmokeTransitionPlan(5)).toEqual({
      succeeded: 2,
      skipped: 2,
      failed: 1
    });
    expect(maintenanceQueueSmokeTransitionPlan(6)).toEqual({
      succeeded: 2,
      skipped: 2,
      failed: 2
    });
  });
});
