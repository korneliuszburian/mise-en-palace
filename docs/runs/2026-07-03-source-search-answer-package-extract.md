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
```

## Non-Proof

This does not prove source truth, answer correctness, retrieval quality, or
ranking quality. It only moves answer-package construction behind a narrower
runtime boundary.
