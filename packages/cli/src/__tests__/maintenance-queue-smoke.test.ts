import { describe, expect, it } from "vitest";

import { formatMaintenanceQueueSmokeReportLines } from "../internal/smoke/maintenance-queue-smoke.js";

describe("maintenance queue smoke report formatting", () => {
  it("prints the transition and cleanup proof lines", () => {
    expect(
      formatMaintenanceQueueSmokeReportLines({
        writeBoundaryValidatedCount: 6,
        enqueuedJobCount: 6,
        queuedReadbackCount: 6,
        runningTransitionCount: 6,
        succeededCount: 2,
        skippedCount: 2,
        failedCount: 2,
        cleanupDeletedCount: 6,
        remainingMarkerCount: 0,
        cleanedUp: true
      })
    ).toEqual([
      "Maintenance write-boundary records validated: 6",
      "Maintenance queue records enqueued: 6",
      "Queued records read back: 6",
      "Queue running transitions: 6",
      "Queue succeeded transitions: 2",
      "Queue skipped transitions: 2",
      "Queue failed transitions: 2",
      "Cleanup deleted queue records: 6",
      "Cleanup remaining marker count: 0",
      "Cleanup: completed",
      "Maintenance queue smoke: passed"
    ]);
  });
});
