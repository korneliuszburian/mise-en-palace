import type {
  MaintenanceQueueSmokeReport
} from "@krn/db/dev";

export const formatMaintenanceQueueSmokeReportLines = (
  report: MaintenanceQueueSmokeReport
): string[] => [
  `Maintenance write-boundary records validated: ${report.writeBoundaryValidatedCount}`,
  `Maintenance queue records enqueued: ${report.enqueuedJobCount}`,
  `Queued records read back: ${report.queuedReadbackCount}`,
  `Queue running transitions: ${report.runningTransitionCount}`,
  `Queue succeeded transitions: ${report.succeededCount}`,
  `Queue skipped transitions: ${report.skippedCount}`,
  `Queue failed transitions: ${report.failedCount}`,
  `Cleanup deleted queue records: ${report.cleanupDeletedCount}`,
  `Cleanup remaining marker count: ${report.remainingMarkerCount}`,
  `Cleanup: ${report.cleanedUp ? "completed" : "not completed"}`,
  `Maintenance queue smoke: ${report.cleanedUp ? "passed" : "failed"}`
];
