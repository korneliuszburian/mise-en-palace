# Source Search Answer Package Extract

Date: 2026-07-03

## Change

Extracted source-search answer-package assembly from `sourceSearchReadback.ts`
into `sourceSearchAnswerPackage.ts`.

Moved responsibilities:

- answer usefulness classification;
- missing-evidence and query-shape diagnostics;
- supporting-claim/document grouping;
- graph readback attachment;
- recommended next action and proof boundary strings.

`sourceSearchReadback.ts` now keeps rendering and re-exports the existing
helper functions for compatibility with current tests and CLI callers.

## Proof

```sh
pnpm --filter @krn/cli test -- runSourceSearchCommand
pnpm -C packages/cli typecheck
pnpm quality:fallow:ci
pnpm --filter @krn/harness test -- contextHygieneInvariants
git diff --check
```

CI run `28686887251` passed for commit
`02cd5e9d9c2cff56fc5cc5d0179ce68ccdf9617e`.

## Second Opinion

`second-opinion-claude` reviewed the candidate+answer extraction range against
base `113080dee94fe95f45b64e78624ad440f20d9715`.

Verdict: `approve`, risk `LOW`, no findings. The only evidence gap was pending
CI, resolved by the passing run above.

## Non-Proof

This does not prove source truth, answer correctness, retrieval quality, or
ranking quality. It only moves answer-package construction behind a narrower
runtime boundary.
