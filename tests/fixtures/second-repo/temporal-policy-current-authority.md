# Temporal Policy Current Authority

Effective 2026-06-01, EU high-risk payouts must return
`hold_for_policy_review`.

High risk means `riskScore >= 80`. The current rule supersedes the prior
`legacy_hold` local target policy and requires returned decisions to expose
`validFrom: "2026-06-01"`.

This source is packet-only authority for the retained temporal-policy-drift
trial; it is not materialized into the baseline-visible target repository.
