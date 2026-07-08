import { describe, expect, it } from "vitest";

import { formatMaintenanceQueueSmokeReportLines } from "../internal/smoke/maintenance-queue-smoke.js";

describe("maintenance queue smoke report formatting", () => {
  it("prints the transition and cleanup proof lines", () => {
    expect(
      formatMaintenanceQueueSmokeReportLines({
        writeBoundaryValidatedCount: 6,
        enqueuedRecordCount: 6,
        queuedReadbackCount: 6,
        claimedRecordCount: 6,
        successRecordedCount: 2,
        skipRecordedCount: 2,
        failureRecordedCount: 2,
        cleanupDeletedCount: 6,
        remainingMarkerCount: 0,
        cleanedUp: true
      })
    ).toEqual([
      "Maintenance write-boundary records validated: 6",
      "Maintenance queue records enqueued: 6",
      "Queued records read back: 6",
      "Queue record claims persisted: 6",
      "Queue success records persisted: 2",
      "Queue skip records persisted: 2",
      "Queue failure records persisted: 2",
      "Cleanup deleted queue records: 6",
      "Cleanup remaining marker count: 0",
      "Cleanup: completed",
      "Maintenance queue smoke: passed"
    ]);
  });
});
