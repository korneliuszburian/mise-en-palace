import { describe, expect, it } from "vitest";

import {
  assessTemporalWindow,
  isIsoTimestamp,
  parseTimestampMs
} from "../time.js";

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

describe("assessTemporalWindow", () => {
  const now = "2026-06-24T08:00:00.000Z";

  it("uses an inclusive start, exclusive end, and fail-closed temporal states", () => {
    const cases = [
      [{ validFrom: now }, { status: "current" }],
      [{ validFrom: "2026-06-24T08:00:00.001Z" }, {
        status: "historical",
        reason: "before_valid_from"
      }],
      [{ validUntil: now }, {
        status: "historical",
        reason: "valid_until_elapsed"
      }],
      [{ invalidatedAt: now }, {
        status: "historical",
        reason: "invalidated"
      }],
      [{ validFrom: "not-a-timestamp" }, {
        status: "invalid",
        reason: "invalid_valid_from"
      }],
      [{ validUntil: "not-a-timestamp" }, {
        status: "invalid",
        reason: "invalid_valid_until"
      }],
      [{ validUntil: "June 24, 2026 08:00:00 GMT" }, {
        status: "invalid",
        reason: "invalid_valid_until"
      }],
      [{ invalidatedAt: "not-a-timestamp" }, {
        status: "invalid",
        reason: "invalid_invalidated_at"
      }]
    ] as const;

    for (const [input, expected] of cases) {
      expect(assessTemporalWindow(input, now)).toEqual(expected);
    }

    expect(assessTemporalWindow({}, "not-a-timestamp")).toEqual({
      status: "invalid",
      reason: "invalid_now"
    });
  });
});
