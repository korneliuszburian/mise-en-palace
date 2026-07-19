export type PayoutRegion = "EU" | "US" | "OTHER";

export type PayoutPolicyAction = "legacy_hold" | "manual_review";

export interface PayoutPolicyInput {
  readonly region: PayoutRegion;
  readonly riskScore: number;
  readonly requestedAt: string;
}

export interface PayoutPolicyDecision {
  readonly action: PayoutPolicyAction;
  readonly validFrom: "2025-01-01";
  readonly reason: string;
}

export const decidePayoutPolicy = (
  input: PayoutPolicyInput
): PayoutPolicyDecision => {
  if (input.region === "EU" && input.riskScore >= 80) {
    return {
      action: "legacy_hold",
      validFrom: "2025-01-01",
      reason: "Legacy EU high-risk payouts must be held."
    };
  }

  return {
    action: "manual_review",
    validFrom: "2025-01-01",
    reason: "Default manual payout review."
  };
};
