import type {
  WorkerJobSmokeReport
} from "@krn/db";

export const formatWorkerJobSmokeReportLines = (
  report: WorkerJobSmokeReport
): string[] => [
  `Worker jobs enqueued: ${report.enqueuedJobCount}`,
  `Queued jobs read back: ${report.queuedReadbackCount}`,
  `Running transitions: ${report.runningTransitionCount}`,
  `Succeeded transitions: ${report.succeededCount}`,
  `Skipped transitions: ${report.skippedCount}`,
  `Failed transitions: ${report.failedCount}`,
  `Cleanup deleted jobs: ${report.cleanupDeletedCount}`,
  `Cleanup remaining marker count: ${report.remainingMarkerCount}`,
  `Cleanup: ${report.cleanedUp ? "completed" : "not completed"}`,
  `Worker job smoke: ${report.cleanedUp ? "passed" : "failed"}`
];
