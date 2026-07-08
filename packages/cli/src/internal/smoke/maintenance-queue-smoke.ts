import type {
  MaintenanceQueueSmokeReport
} from "@krn/db/dev";

export const formatMaintenanceQueueSmokeReportLines = (
  report: MaintenanceQueueSmokeReport
): string[] => [
  `Maintenance write-boundary records validated: ${report.writeBoundaryValidatedCount}`,
  `Maintenance queue records enqueued: ${report.enqueuedRecordCount}`,
  `Queued records read back: ${report.queuedReadbackCount}`,
  `Queue record claims persisted: ${report.claimedRecordCount}`,
  `Queue success records persisted: ${report.successRecordedCount}`,
  `Queue skip records persisted: ${report.skipRecordedCount}`,
  `Queue failure records persisted: ${report.failureRecordedCount}`,
  `Cleanup deleted queue records: ${report.cleanupDeletedCount}`,
  `Cleanup remaining marker count: ${report.remainingMarkerCount}`,
  `Cleanup: ${report.cleanedUp ? "completed" : "not completed"}`,
  `Maintenance queue smoke: ${report.cleanedUp ? "passed" : "failed"}`
];
