import { describe, expect, test } from "vitest";

import type {
  ExecutionRunId,
  MemoryRecordId,
  SourceClaimId
} from "./ids.js";

describe("branded KRN ids", () => {
  test("remain runtime strings", () => {
    const executionRunId: ExecutionRunId = "execution-run-1";
    const memoryRecordId: MemoryRecordId = "memory-record-1";
    const sourceClaimId: SourceClaimId = "source-claim-1";

    expect(executionRunId).toBe("execution-run-1");
    expect(memoryRecordId).toBe("memory-record-1");
    expect(sourceClaimId).toBe("source-claim-1");
  });
});
