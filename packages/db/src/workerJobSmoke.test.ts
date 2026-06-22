import { describe, expect, it } from "vitest";

import { runWorkerJobSmokeCheck } from "./workerJobSmoke.js";

describe("worker job smoke", () => {
  it("exports the M26 worker job smoke helper", () => {
    expect(typeof runWorkerJobSmokeCheck).toBe("function");
  });
});
