import { describe, expect, it } from "vitest";

import {
  runHeartbeatWorkerAuthoritySmokeCheck
} from "./heartbeatWorkerAuthoritySmoke.js";

describe("heartbeat worker authority smoke", () => {
  it("exports the DB-backed heartbeat worker authority smoke helper", () => {
    expect(typeof runHeartbeatWorkerAuthoritySmokeCheck).toBe("function");
  });
});
