# Payout Policy Contract

The public boundary is `decidePayoutPolicy(input)`. It receives a payout request
with `region`, `riskScore`, and `requestedAt`, then returns a finite policy
decision with an action and a policy effective date.

Current local documentation is intentionally allowed to lag behind supplied
org/source authority. If the task supplies a bounded current authority, the
implementation and tests must follow that authority. If no current authority is
supplied, do not invent a newer policy.

Legacy local policy:

- EU high-risk payouts used `legacy_hold`.
- High risk means `riskScore >= 80`.
- Other requests use `manual_review`.

Rejected shortcuts:

- auto-approve a high-risk payout;
- add a workflow engine when the task asks only for a policy boundary repair;
- call an external policy service to discover a fixture-local policy.
