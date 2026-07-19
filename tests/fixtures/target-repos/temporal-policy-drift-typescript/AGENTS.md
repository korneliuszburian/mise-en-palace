# Temporal Policy Drift Target

Repair only the payout policy files named by the task. Local documentation may
be stale; if a supplied current org/source authority is available, use it as the
current policy and preserve the stale/rejected boundary in the repair notes.

Expected owner files:

- `docs/payout-policy-contract.md`
- `src/payoutPolicy.ts`
- `tests/payoutPolicy.test.ts`

Do not add a workflow engine, scheduler, dashboard, external policy service, or
parent KRN source dependency.
