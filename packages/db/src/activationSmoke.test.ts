import { describe, expect, it } from "vitest";

import * as dbDevExports from "./dev/index.js";

describe("activation smoke export", () => {
  it("exports the M25 activation smoke check", () => {
    expect(typeof dbDevExports.runActivationSmokeCheck).toBe("function");
  });
});
