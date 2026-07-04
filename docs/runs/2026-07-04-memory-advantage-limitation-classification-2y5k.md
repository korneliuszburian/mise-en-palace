# Memory Advantage Limitation Classification

Bead: `mise-en-palace-2y5k`

## Change

`pnpm eval:memory-advantage` now records `advantageDelta.limitation` for
non-winning advantage deltas. The current neutral and broken-prior cases are
classified as `baseline_already_sufficient` instead of being left as untriaged
aggregate counts.

The broken-prior case is explicitly scoped as `broken_prior_advantage`; it is
not marked fixture-stale or regression-candidate because the simple lexical
baseline already selects the expected evidence-shaped contract and KRN still
hits the expected result.

## Proof

- The four neutral/no-advantage cases carry limitation classifications.
- The broken-prior case carries `scope=broken_prior_advantage`.
- Each limitation records the deterministic proof tuple:
  `simpleRetrieval`, `krn`, and `expected`.

## Non-Proof

- Does not prove broad memory superiority.
- Does not prove fixture truth.
- Does not prove production retrieval quality.
- Does not prove live Codex execution or product readiness.

## Verification

```sh
pnpm --filter @krn/cli test -- memoryAdvantageEval codexOutputComparatorEval
pnpm eval:memory-advantage
pnpm run typecheck
pnpm quality:fallow:ci
pnpm docs:lint
git diff --check
```
