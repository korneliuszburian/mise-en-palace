import {
  maintenanceJobTypes,
  workerJobStatuses
} from "@krn/core";
import { describe, expect, it } from "vitest";

import { workerJobStatus } from "../../schema/index.js";
import {
  workerJobLifecycleStatuses,
  workerJobTypes
} from "../worker-job-types.js";

describe("worker job repository type ownership", () => {
  it("derives active job types from core maintenance contracts", () => {
    expect(workerJobTypes).toBe(maintenanceJobTypes);
    expect(workerJobTypes).toEqual([
      "embed_source_chunk",
      "embed_memory_record",
      "compact_memory",
      "detect_contradiction",
      "expire_stale_memory"
    ]);
  });

  it("derives active lifecycle statuses from core maintenance contracts", () => {
    expect(workerJobLifecycleStatuses).toBe(workerJobStatuses);
    expect(workerJobLifecycleStatuses).toEqual([
      "queued",
      "running",
      "succeeded",
      "failed",
      "skipped"
    ]);
  });

  it("keeps schema-only legacy statuses outside the active repository lifecycle", () => {
    expect(workerJobStatus.enumValues).toContain("dead_letter");
    expect(workerJobStatus.enumValues).toContain("cancelled");
    expect(workerJobLifecycleStatuses).not.toContain("dead_letter");
    expect(workerJobLifecycleStatuses).not.toContain("cancelled");
  });
});
