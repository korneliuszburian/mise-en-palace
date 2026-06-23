import {
  describe,
  expect,
  it
} from "vitest";

import {
  parseDoctorArgs
} from "./parseDoctorArgs.js";

describe("parseDoctorArgs", () => {
  it("parses doctor without arguments", () => {
    expect(parseDoctorArgs([])).toEqual({
      command: {
        kind: "doctor"
      }
    });
  });

  it("rejects doctor arguments", () => {
    expect(parseDoctorArgs(["--json"])).toEqual({
      error: "Usage: krn doctor"
    });
  });
});
