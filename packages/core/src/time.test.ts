import { describe, expect, it } from "vitest";

import { parseTimestampMs } from "./time.js";

describe("parseTimestampMs", () => {
  it("parses valid timestamp strings to epoch milliseconds", () => {
    expect(parseTimestampMs("2026-06-30T00:00:00.000Z")).toBe(
      Date.parse("2026-06-30T00:00:00.000Z")
    );
  });

  it("returns undefined for missing or invalid timestamps", () => {
    expect(parseTimestampMs(undefined)).toBeUndefined();
    expect(parseTimestampMs("not-a-date")).toBeUndefined();
  });
});
