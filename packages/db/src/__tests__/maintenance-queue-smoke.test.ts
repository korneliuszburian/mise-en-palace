import { describe, expect, it } from "vitest";

import {
  maintenanceQueueSmokeSettlementPlan
} from "../dev/smoke/maintenance-queue-smoke.js";

describe("maintenance queue smoke", () => {
  it("plans record settlement counts from the actual maintenance queue count", () => {
    expect(maintenanceQueueSmokeSettlementPlan(5)).toEqual({
      success: 2,
      skip: 1,
      retry: 1,
      deadLetter: 1
    });
    expect(maintenanceQueueSmokeSettlementPlan(6)).toEqual({
      success: 2,
      skip: 1,
      retry: 1,
      deadLetter: 2
    });
  });
});
