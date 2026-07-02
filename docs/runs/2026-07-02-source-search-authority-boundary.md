# Source-Search Authority Boundary

## Verdict

`krn source search` had a real readback leak and this slice closes it.

The compiler/context assembly path already applied accepted-only SourceClaim
authority filtering. `runSourceSearchCommand` still consumed raw activation
candidates, applied ContextROI directly, and then built `supportingClaims` from
non-excluded candidates. That let `proposed`, `rejected`, and `deprecated`
SourceClaims look like source-search support.

This slice applies the same lifecycle filter before source-search ContextROI.
SearchDocument readback remains unchanged.

## Source To Decision

```yaml
source_id: repo-local-review-52kw
title: Source-search readback bypasses accepted-only SourceClaim filtering
trust_tier: high
source_class: repo-local evidence
mechanism: runSourceSearchCommand retrieved activation candidates and applied ContextROI without applySourceClaimAuthorityFilter.
krn_implication: Read-only answer packages must not present review-candidate SourceClaims as governed authority.
decision_kind: adopt
decision: Apply the existing source-claim authority filter before source-search ContextROI and cover accepted/proposed/rejected/deprecated JSON readback.
does_not_prove: This does not prove source truth, ranking quality, SourceDecision linkage for accepted claims, graph retrieval quality, or product readiness.
consumer: packages/cli/src/runSourceSearchCommand.ts
falsifier: krn source search JSON includes a proposed/rejected/deprecated SourceClaim in answerPackage.supportingClaims.
```

## Implementation

- Changed `runSourceSearchCommand` to call `applySourceClaimAuthorityFilter`
  before `applyContextROI`.
- Kept SourceDocument/SearchDocument candidate behavior unchanged.
- Updated focused source-search fixtures so authority-supporting SourceClaims
  are accepted by default.
- Added JSON regression coverage proving accepted claims remain supporting
  claims while proposed, rejected, and deprecated claims are explicit `unsafe`
  exclusions.

## Verification

```txt
rtk pnpm --filter @krn/cli test -- runSourceSearchCommand
rtk pnpm --filter @krn/cli test -- source
rtk pnpm --filter @krn/harness test -- activation
rtk proxy pnpm typecheck
rtk pnpm test
rtk pnpm quality:fallow:ci
rtk pnpm eval:brain-battle:smoke
```

Focused result before implementation:

- failed because `answerPackage.supportingClaims` included accepted, proposed,
  rejected, and deprecated SourceClaims.

Focused result after implementation:

- `@krn/cli` source-search focused tests passed: 55 files, 334 tests.

Broader local result:

- CLI source scope: 55 files passed, 334 tests passed.
- Harness activation scope: 36 files passed, 203 tests passed.
- Workspace typecheck: passed through `rtk proxy pnpm typecheck`.
- Full workspace tests: 147 files passed, 783 tests passed.
- Fallow changed-files gate: passed on 8 changed files.
- Brain-battle smoke: passed.

## Proof Boundary

Proves:

- `krn source search` no longer packages non-accepted SourceClaims as
  supporting claims.
- `accepted` SourceClaims remain eligible for source-search answer support.
- `proposed`, `rejected`, and `deprecated` SourceClaims remain visible only as
  explicit `unsafe` exclusions in JSON readback.
- SearchDocument support is preserved.

Does not prove:

- Accepted SourceClaims are true.
- Accepted SourceClaims always have linked `SourceDecision` records.
- Brain-search summaries consume every source-search exclusion field perfectly.
- Source graph relation correctness or ranking quality.
- Product readiness.
