import { describe, expect, it } from "vitest";

import {
  runHeartbeatWorkerBoundarySmokeCheck
} from "./heartbeatWorkerBoundarySmoke.js";

describe("heartbeat worker boundary smoke", () => {
  it("exports the DB-backed heartbeat worker boundary smoke helper", () => {
    expect(typeof runHeartbeatWorkerBoundarySmokeCheck).toBe("function");
  });
});
