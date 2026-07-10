import {
  describe,
  expect,
  it
} from "vitest";

import {
  isCurrentDoctorProof
} from "../doctor-proof.js";
import type {
  DoctorCheck
} from "../run-doctor-command.js";

const capturedAt = new Date("2026-07-10T06:00:00.000Z");

const proofCheck = (
  overrides: Partial<NonNullable<DoctorCheck["proof"]>> = {}
): DoctorCheck => ({
  label: "Target repo harness smoke",
  status: "proven",
  outcome: "proven",
  severity: "pass",
  proof: {
    command: "pnpm db:smoke:target-repo-harness",
    status: "passed",
    capturedAt: capturedAt.toISOString(),
    freshness: "current",
    storeIdentity: "postgres://localhost:54329/krn",
    projectId: "project-fixture",
    ...overrides
  }
});

describe("doctorProof", () => {
  it("accepts a current passed result with store and project identity", () => {
    expect(
      isCurrentDoctorProof(proofCheck(), {
        now: new Date("2026-07-10T06:05:00.000Z"),
        storeIdentity: "postgres://localhost:54329/krn",
        requiresProjectId: true,
        projectId: "project-fixture"
      })
    ).toBe(true);
  });

  it("rejects stale and failed results even when the capability is present", () => {
    const now = new Date("2026-07-10T06:05:00.000Z");

    expect(isCurrentDoctorProof(proofCheck({ freshness: "stale" }), { now })).toBe(false);
    expect(isCurrentDoctorProof(proofCheck({ status: "failed" }), { now })).toBe(false);
  });

  it("rejects evidence bound to a different project or store", () => {
    const now = new Date("2026-07-10T06:05:00.000Z");

    expect(
      isCurrentDoctorProof(proofCheck(), {
        now,
        storeIdentity: "postgres://localhost:54329/other",
        requiresProjectId: true,
        projectId: "project-fixture"
      })
    ).toBe(false);
    expect(
      isCurrentDoctorProof(proofCheck(), {
        now,
        storeIdentity: "postgres://localhost:54329/krn",
        requiresProjectId: true,
        projectId: "other-project"
      })
    ).toBe(false);
  });

  it("rejects a result outside the freshness window", () => {
    expect(
      isCurrentDoctorProof(proofCheck(), {
        now: new Date("2026-07-10T06:16:00.000Z")
      })
    ).toBe(false);
  });
});
