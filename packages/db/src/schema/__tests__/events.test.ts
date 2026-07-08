import { describe, expect, test } from "vitest";

import * as eventsSchema from "../events.js";

describe("event and maintenance queue schema", () => {
  test("exposes the M26 maintenance queue lifecycle status", () => {
    expect(eventsSchema.maintenanceQueueStatus.enumValues).toEqual([
      "queued",
      "running",
      "succeeded",
      "skipped",
      "dead_letter"
    ]);
  });

  test("maps maintenance queue contract names to maintenance SQL columns", () => {
    expect(eventsSchema.maintenanceQueues).toHaveProperty("jobType");
    expect(eventsSchema.maintenanceQueues).toHaveProperty("queueKey");
    expect(eventsSchema.maintenanceQueues).toHaveProperty("runAfter");
    expect(eventsSchema.maintenanceQueues).not.toHaveProperty("queueRecordKeyTemplate");
    expect(eventsSchema.maintenanceQueues.jobType.name).toBe("job_type");
    expect(eventsSchema.maintenanceQueues.queueKey.name).toBe("queue_key");
    expect(eventsSchema.maintenanceQueues.runAfter.name).toBe("run_after");
  });
});
