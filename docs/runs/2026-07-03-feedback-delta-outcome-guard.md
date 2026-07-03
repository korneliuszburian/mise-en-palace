# Feedback Delta Outcome Guard

Date: 2026-07-03

## Change

Replaced the `SourceUsefulnessOutcome` membership cast in `feedbackDelta.ts`
with an unknown-first predicate backed by `Set<string>`.

Metadata readback behavior is unchanged: unknown or missing outcome values still
fall back to `"unknown"`.

## Proof

```sh
pnpm --filter @krn/core test -- reviewDomain evidenceBundle
pnpm -C packages/core typecheck
pnpm quality:fallow:ci
```

## Non-Proof

This does not make branded SourceClaimId/SourceDecisionId parsing load-bearing.
Those metadata ID casts remain a separate boundary decision.
