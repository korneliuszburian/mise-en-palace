import {
  describe,
  expect,
  it
} from "vitest";

import {
  hasDoctorFailure
} from "../run-doctor-command.js";
import type {
  DoctorCheck
} from "../run-doctor-command.js";

describe("runDoctorCommand", () => {
  it("uses typed severity before legacy status wording for failure policy", () => {
    const typedFailure: DoctorCheck = {
      label: "Custom check",
      status: "looks harmless after wording cleanup",
      outcome: "blocked",
      severity: "failure"
    };
    const typedPassOverLegacyBlocked: DoctorCheck = {
      label: "Memory store readiness",
      status: "blocked (legacy wording would have failed)",
      outcome: "ready",
      severity: "pass"
    };

    expect(hasDoctorFailure([typedFailure])).toBe(true);
    expect(hasDoctorFailure([typedPassOverLegacyBlocked])).toBe(false);
  });

  it("keeps legacy failure rules for checks without typed severity", () => {
    expect(
      hasDoctorFailure([
        {
          label: "Memory store readiness",
          status: "blocked (legacy check)"
        }
      ])
    ).toBe(true);
  });
});
