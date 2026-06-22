import { describe, expect, it } from "vitest";

import * as reflectionSchema from "./reflections.js";

describe("reflection schema", () => {
  it("exposes reflection status vocabulary", () => {
    expect(reflectionSchema.reflectionStatus.enumValues).toEqual([
      "candidate",
      "reviewed",
      "rejected",
      "superseded"
    ]);
  });

  it("exposes stable query fields and JSON input/output payloads", () => {
    expect("projectId" in reflectionSchema.reflectionRecords).toBe(true);
    expect("executionRunId" in reflectionSchema.reflectionRecords).toBe(true);
    expect("taskContractId" in reflectionSchema.reflectionRecords).toBe(true);
    expect("status" in reflectionSchema.reflectionRecords).toBe(true);
    expect("scope" in reflectionSchema.reflectionRecords).toBe(true);
    expect("input" in reflectionSchema.reflectionRecords).toBe(true);
    expect("output" in reflectionSchema.reflectionRecords).toBe(true);
    expect("metadata" in reflectionSchema.reflectionRecords).toBe(true);
  });
});
