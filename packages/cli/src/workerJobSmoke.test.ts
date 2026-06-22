import { describe, expect, it } from "vitest";

import { formatWorkerJobSmokeReportLines } from "./workerJobSmoke.js";

describe("worker job smoke report formatting", () => {
  it("prints the transition and cleanup proof lines", () => {
    expect(
      formatWorkerJobSmokeReportLines({
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
      "Worker jobs enqueued: 6",
      "Queued jobs read back: 6",
      "Running transitions: 6",
      "Succeeded transitions: 2",
      "Skipped transitions: 2",
      "Failed transitions: 2",
      "Cleanup deleted jobs: 6",
      "Cleanup remaining marker count: 0",
      "Cleanup: completed",
      "Worker job smoke: passed"
    ]);
  });
});
