import {
  maintenanceJobTypes,
  maintenanceQueueStatuses
} from "@krn/core";
import { describe, expect, it } from "vitest";

import { maintenanceQueueStatus } from "../../schema/index.js";
import {
  maintenanceQueueLifecycleStatuses,
  maintenanceQueueTypes
} from "../maintenance-queue-types.js";

describe("maintenance queue repository type ownership", () => {
  it("derives active job types from core maintenance contracts", () => {
    expect(maintenanceQueueTypes).toBe(maintenanceJobTypes);
    expect(maintenanceQueueTypes).toEqual([
      "embed_source_chunk",
      "embed_memory_record",
      "compact_memory",
      "detect_contradiction",
      "expire_stale_memory"
    ]);
  });

  it("derives active lifecycle statuses from core maintenance contracts", () => {
    expect(maintenanceQueueLifecycleStatuses).toBe(maintenanceQueueStatuses);
    expect(maintenanceQueueLifecycleStatuses).toEqual([
      "queued",
      "running",
      "succeeded",
      "failed",
      "skipped"
    ]);
  });

  it("keeps schema-only legacy statuses outside the active repository lifecycle", () => {
    expect(maintenanceQueueStatus.enumValues).toContain("dead_letter");
    expect(maintenanceQueueStatus.enumValues).toContain("cancelled");
    expect(maintenanceQueueLifecycleStatuses).not.toContain("dead_letter");
    expect(maintenanceQueueLifecycleStatuses).not.toContain("cancelled");
  });
});
