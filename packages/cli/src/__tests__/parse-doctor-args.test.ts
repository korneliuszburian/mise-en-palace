import {
  describe,
  expect,
  it
} from "vitest";

import {
  parseDoctorArgs
} from "../parse-doctor-args.js";

describe("parseDoctorArgs", () => {
  it("parses doctor without arguments", () => {
    expect(parseDoctorArgs([])).toEqual({
      command: {
        kind: "doctor"
      }
    });
  });

  it("parses database backend options", () => {
    expect(parseDoctorArgs(["--backend", "sqlite", "--db-path=.krn/memory.db"])).toEqual({
      command: {
        kind: "doctor",
        backend: "sqlite",
        dbPath: ".krn/memory.db"
      }
    });
  });

  it("rejects doctor arguments", () => {
    expect(parseDoctorArgs(["--json"])).toEqual({
      error: "Usage: krn doctor [--backend sqlite|postgres] [--db-path <path>]"
    });
    expect(parseDoctorArgs(["--backend="])).toEqual({
      error: "Usage: krn doctor [--backend sqlite|postgres] [--db-path <path>]"
    });
  });
});
