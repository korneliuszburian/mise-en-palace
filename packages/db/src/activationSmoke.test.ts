import { describe, expect, it } from "vitest";

import * as dbExports from "./index.js";

describe("activation smoke export", () => {
  it("exports the M25 activation smoke check", () => {
    expect(typeof dbExports.runActivationSmokeCheck).toBe("function");
  });
});
