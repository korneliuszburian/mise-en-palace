import { describe, expect, it } from "vitest";

import {
  smokeFixtureClocks
} from "./smokeFixtureClocks.js";

describe("smokeFixtureClocks", () => {
  it("names deterministic fixture clocks used by DB and CLI smokes", () => {
    expect(smokeFixtureClocks.activation).toEqual({
      now: "2026-06-22T05:00:00.000Z",
      past: "2026-06-01T00:00:00.000Z",
      expiredValidUntil: "2026-06-10T00:00:00.000Z"
    });
    expect(smokeFixtureClocks.codexAdapter).toEqual({
      now: "2026-06-22T06:00:00.000Z",
      past: "2026-06-01T00:00:00.000Z",
      expiredValidUntil: "2026-06-10T00:00:00.000Z"
    });
    expect(smokeFixtureClocks.workerJobs).toEqual({
      olderThan: "2026-06-01T00:00:00.000Z",
      runAfter: "2026-06-01T00:00:00.000Z",
      lockedAt: "2026-06-22T06:00:00.000Z"
    });
  });
});
