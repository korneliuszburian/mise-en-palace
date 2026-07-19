import {
  decidePayoutPolicy
} from "../src/payoutPolicy.js";

const assertEqual = (actual: unknown, expected: unknown): void => {
  if (actual !== expected) {
    throw new Error(`Expected ${String(expected)}, received ${String(actual)}.`);
  }
};

const highRiskEu = decidePayoutPolicy({
  region: "EU",
  riskScore: 95,
  requestedAt: "2026-06-15"
});

assertEqual(highRiskEu.action, "legacy_hold");
assertEqual(highRiskEu.validFrom, "2025-01-01");

const thresholdRiskEu = decidePayoutPolicy({
  region: "EU",
  riskScore: 80,
  requestedAt: "2026-06-15"
});

assertEqual(thresholdRiskEu.action, "legacy_hold");
assertEqual(thresholdRiskEu.validFrom, "2025-01-01");

const belowThresholdEu = decidePayoutPolicy({
  region: "EU",
  riskScore: 79,
  requestedAt: "2026-06-15"
});

assertEqual(belowThresholdEu.action, "manual_review");

const highRiskUs = decidePayoutPolicy({
  region: "US",
  riskScore: 95,
  requestedAt: "2026-06-15"
});

assertEqual(highRiskUs.action, "manual_review");

const observedActions: readonly string[] = [
  highRiskEu.action,
  thresholdRiskEu.action,
  belowThresholdEu.action,
  highRiskUs.action
];

if (observedActions.includes("auto_approve")) {
  throw new Error("High-risk payout shortcut must not auto-approve.");
}
