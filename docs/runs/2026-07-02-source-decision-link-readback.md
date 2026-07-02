# Source Decision-Link Readback

## Verdict

Accepted SourceClaims can remain source-search support, but they must no longer
look silently decision-backed.

Before this slice, `krn source search` had a separate `sourceDecisionSupport`
section, but each supporting SourceClaim did not say whether that claim had a
linked `SourceDecisionEdge`. An accepted claim with no edge could therefore
look like the same authority class as an accepted claim with explicit decision
support.

This slice keeps ranking and inclusion behavior unchanged. It adds per-claim
readback:

- `sourceDecisionSupportState: "linked"` when a supporting accepted claim has
  SourceDecisionEdge rows in the readback;
- `sourceDecisionSupportState: "missing"` plus an explicit caveat when it does
  not.

## Source To Decision

```yaml
source_id: repo-local-q4jh
title: Accepted SourceClaims need decision-link readback before they look decision-backed
trust_tier: high
source_class: repo-local evidence
mechanism: source-search answer packages already read SourceDecisionEdge support, but supportingClaims lacked per-claim linked/missing state.
krn_implication: Source-search can use accepted claims as evidence while still separating accepted evidence from decision-linked authority.
decision_kind: adopt
decision: Add per-SourceClaim decision-support readback fields and caveat missing SourceDecisionEdge support.
does_not_prove: This does not prove source truth, SourceDecisionEdge correctness, ranking quality, DB source governance completeness, or product readiness.
consumer: packages/cli/src/runSourceSearchCommand.ts
falsifier: JSON or text source-search readback includes an accepted supporting SourceClaim without linked/missing SourceDecisionEdge state.
```

## Implementation

- Added per-claim `sourceDecisionSupportState` to source-search answer
  candidates.
- Added `sourceDecisionSupportEdgeIds` when linked support exists.
- Added `sourceDecisionSupportCaveat` when an accepted supporting claim has no
  SourceDecisionEdge rows in the readback.
- Kept source-search ranking, inclusion, and accepted-only lifecycle filtering
  unchanged.
- Covered JSON and text readback with focused source-search tests.

## Verification

```txt
rtk pnpm --filter @krn/cli test -- runSourceSearchCommand
rtk proxy pnpm --filter @krn/cli typecheck
rtk pnpm --filter @krn/harness test -- activePlanInvariants contextHygieneInvariants
rtk git diff --check
```

Focused result:

- source-search focused tests passed: 55 files, 334 tests.
- CLI package typecheck passed through `rtk proxy`.
- active-plan/context-hygiene focused tests passed.
- diff whitespace check passed.
- KRN CI `28620282428`: passed after push of `db92485`.

CI supplied the broader typecheck/test/eval/DB smoke gate for this slice.

## Proof Boundary

Proves:

- Accepted supporting SourceClaims expose `linked` state when a
  SourceDecisionEdge is visible.
- Accepted supporting SourceClaims expose `missing` state and caveat when no
  SourceDecisionEdge is visible.
- Text and JSON source-search readback both carry the missing-link caveat.

Does not prove:

- Accepted claims are true.
- SourceDecisionEdge rows are correct.
- Every accepted SourceClaim in the database has decision support.
- Ranking quality or graph retrieval quality.
- Product readiness.
