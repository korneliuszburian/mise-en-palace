# Source Claim Authority Boundary

## Verdict

The activation authority gap was real and is now closed for the harness
activation and compiler paths.

Before this slice, `assembleContext` excluded non-accepted SourceClaims as a
late defense-in-depth guard, but `applyActivationFilters` and the compiler
filter pipeline could still carry `proposed`, `rejected`, or `deprecated`
SourceClaims as clean ranked candidates until assembly. That made readback and
review ambiguous: the candidate pool looked authoritative even though only
accepted SourceClaims should be usable as implementation context.

This slice moves the lifecycle boundary earlier: non-accepted SourceClaims are
marked `unsafe` before trust, temporal, and ContextROI filtering. The assembly
guard remains as defense in depth.

## Source To Decision

```yaml
source_id: repo-local-audit-2huq
title: Non-accepted SourceClaims can survive activation filtering as clean candidates
trust_tier: high
source_class: repo-local evidence
mechanism: SourceClaim lifecycle status was carried as metadata/sourceClaimStatus, but filterActivationCandidates did not enforce accepted-only authority before trust/temporal/ContextROI.
krn_implication: Activation must distinguish reviewed source authority from review candidates before ranking/readback can be mistaken for implementation guidance.
decision_kind: adopt
decision: Add one source-claim authority helper and apply it in activation filters and compiler filtering; keep assembleContext as defense-in-depth.
does_not_prove: This does not prove source truth, SourceDecision linkage for every accepted claim, graph retrieval quality, DB source governance completeness, or product readiness.
consumer: packages/harness/src/activation/activationFilters.ts
falsifier: A proposed/rejected/deprecated SourceClaim passes applyActivationFilters without an explicit unsafe exclusion.
```

## Implementation

- Added `sourceClaimAuthorityExclusion` as the single lifecycle-status helper.
- Added `applySourceClaimAuthorityFilter` to mark non-accepted SourceClaims
  `unsafe` before trust and temporal filters.
- Wired the compiler activation pipeline through the same source-authority
  filter before ContextROI.
- Kept `assembleContext` using the shared helper so direct callers still get
  the accepted-only guard.
- Added focused activation coverage for accepted, proposed, rejected, and
  deprecated SourceClaims.

## Verification

```txt
rtk pnpm --filter @krn/harness test -- activation
rtk proxy pnpm typecheck
rtk pnpm test
rtk pnpm quality:fallow:ci
rtk pnpm eval:brain-battle:smoke
rtk git diff --check
```

Result:

- focused activation: 36 files passed, 203 tests passed;
- workspace typecheck: passed;
- full workspace tests: 147 files passed, 782 tests passed;
- Fallow changed-files gate: passed;
- brain-battle smoke: passed;
- diff whitespace check: passed.

## Proof Boundary

Proves:

- `applyActivationFilters` marks `proposed`, `rejected`, and `deprecated`
  SourceClaims as `unsafe`.
- `accepted` SourceClaims remain eligible for activation.
- Compiler filtering uses the same accepted-only authority boundary before
  ContextROI and context assembly.
- `assembleContext` still prevents non-accepted SourceClaims from becoming
  inclusions if a direct caller bypasses the filter pipeline.

Does not prove:

- Accepted SourceClaims are true.
- Accepted SourceClaims always have linked `SourceDecision` records.
- Source graph edge correctness or ranking quality.
- DB-level source governance is complete.
- Product-loop E2E readiness is complete.
