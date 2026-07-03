# CLI Active Proof Routing Repair

Date: 2026-07-03

## Scope

Beads: `mise-en-palace-hvxp`

Goal: repair active proof routing after the CLI root test topology drain.

## Changed

- Updated `eval:brain-battle:smoke` so the CLI portion runs current test
  basenames: `runRunShowCommand` and `evidenceCaptureGoldenBehavior`.
- Replaced active architecture evidence refs that still pointed at deleted
  root-level `packages/cli/src/*.test.ts` files with current
  `packages/cli/src/__tests__/*.test.ts` paths.
- Added an invariant that rejects stale root-level CLI test refs in active proof
  docs and package smoke routing.

## Proof

Commands run:

```sh
rtk pnpm --filter @krn/harness test -- brainBattleMatrixInvariants activePlanInvariants
rtk pnpm --filter @krn/cli test -- runRunShowCommand evidenceCaptureGoldenBehavior
rtk pnpm -r --workspace-concurrency=1 --if-present typecheck
rtk pnpm eval:brain-battle:smoke
rtk bash -lc '! rg --pcre2 -n "packages/cli/src/(?!__tests__/)[^[:space:]|;]+\\.test\\.ts|runRunShowCommand runCli" package.json docs/architecture/brain-battle-eval-matrix.md docs/architecture/cli-surfaces.md packages/harness/src/__tests__/brainBattleMatrixInvariants.test.ts'
rtk pnpm quality:fallow:ci
rtk git diff --check
```

All passed locally.

`rtk pnpm typecheck` printed `TypeScript: No errors found` but returned the
known wrapper non-zero result, so the explicit workspace typecheck command was
used for final verification.

## Non-Proof

- This does not prove assertion-for-assertion equivalence for the historical
  `runCli.test.ts` split.
- This does not add a CLI test `tsc` lane; migrated tests are still outside the
  package runtime typecheck.
- This does not simplify runtime command files or change CLI behavior.

## Next

The next likely quality slice is a scoped CLI test-typecheck cleanup/gate, not a
broad CLI rewrite.
