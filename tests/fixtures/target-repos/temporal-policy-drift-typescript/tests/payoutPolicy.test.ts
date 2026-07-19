import { strict as assert } from "node:assert";

import {
  decidePayoutPolicy
} from "../src/payoutPolicy.js";

const highRiskEu = decidePayoutPolicy({
  region: "EU",
  riskScore: 95,
  requestedAt: "2026-06-15"
});

assert.equal(highRiskEu.action, "legacy_hold");
assert.equal(highRiskEu.validFrom, "2025-01-01");

const highRiskUs = decidePayoutPolicy({
  region: "US",
  riskScore: 95,
  requestedAt: "2026-06-15"
});

assert.equal(highRiskUs.action, "manual_review");

const observedActions: readonly string[] = [highRiskEu.action, highRiskUs.action];

if (observedActions.includes("auto_approve")) {
  throw new Error("High-risk payout shortcut must not auto-approve.");
}
