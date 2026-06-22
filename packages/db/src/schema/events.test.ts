import { describe, expect, test } from "vitest";

import * as eventsSchema from "./events.js";

describe("event and worker job schema", () => {
  test("exposes the M26 worker job lifecycle status", () => {
    expect(eventsSchema.workerJobStatus.enumValues).toEqual([
      "queued",
      "running",
      "succeeded",
      "failed",
      "skipped",
      "dead_letter",
      "cancelled"
    ]);
  });

  test("maps worker job contract names to the existing SQL columns", () => {
    expect(eventsSchema.workerJobs).toHaveProperty("jobType");
    expect(eventsSchema.workerJobs).toHaveProperty("runAfter");
    expect(eventsSchema.workerJobs.jobType.name).toBe("type");
    expect(eventsSchema.workerJobs.runAfter.name).toBe("available_at");
  });
});
