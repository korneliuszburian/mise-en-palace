import type {
  IsoTimestamp
} from "@krn/core";

type SmokeClockGroup = Record<string, IsoTimestamp>;

export const smokeFixtureClocks = {
  activation: {
    now: "2026-06-22T05:00:00.000Z",
    past: "2026-06-01T00:00:00.000Z",
    expiredValidUntil: "2026-06-10T00:00:00.000Z"
  },
  brainLoop: {
    now: "2026-07-01T12:00:00.000Z"
  },
  codexAdapter: {
    now: "2026-06-22T06:00:00.000Z",
    past: "2026-06-01T00:00:00.000Z",
    expiredValidUntil: "2026-06-10T00:00:00.000Z"
  },
  heartbeatWorkerAuthority: {
    now: "2026-07-01T12:00:00.000Z",
    expiredAt: "2026-06-01T12:00:00.000Z",
    validFrom: "2026-05-01T12:00:00.000Z"
  },
  workerJobs: {
    olderThan: "2026-06-01T00:00:00.000Z",
    runAfter: "2026-06-01T00:00:00.000Z",
    lockedAt: "2026-06-22T06:00:00.000Z"
  },
  targetRepoHarness: {
    now: "2026-06-22T07:00:00.000Z"
  }
} as const satisfies Record<string, SmokeClockGroup>;
