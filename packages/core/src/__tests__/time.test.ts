import { describe, expect, it } from "vitest";

import { isIsoTimestamp, parseTimestampMs } from "../time.js";

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

  it("accepts ISO timestamps but rejects other parseable date formats", () => {
    expect(isIsoTimestamp("2026-06-30T00:00:00.000Z")).toBe(true);
    expect(isIsoTimestamp("2026-06-30T00:00:00+00:00")).toBe(true);
    expect(isIsoTimestamp("June 30, 2026 00:00:00 GMT")).toBe(false);
    expect(isIsoTimestamp("2026-02-31T00:00:00.000Z")).toBe(false);
  });
});
