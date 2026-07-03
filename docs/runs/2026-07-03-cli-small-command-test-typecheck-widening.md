# CLI Small Command Test Typecheck Widening

Date: 2026-07-03

## Scope

Widen the scoped CLI test typecheck gate to include a small command batch:

```txt
packages/cli/src/__tests__/evidenceCaptureGoldenBehavior.test.ts
packages/cli/src/__tests__/review.test.ts
packages/cli/src/__tests__/run.test.ts
```

## Changes

- Added the batch to `packages/cli/tsconfig.tests.clean.json`.
- Added a local `toGoldenTask` normalizer in
  `evidenceCaptureGoldenBehavior.test.ts` so schema fixtures omit undefined
  optional `projectId` before entering the core `GoldenTask` contract.

## Verification

```txt
rtk pnpm -C packages/cli typecheck:tests:clean
rtk pnpm --filter @krn/cli test -- run review evidenceCaptureGoldenBehavior
```

Both passed locally before this report was written.

## Proof

This proves the selected command tests satisfy the scoped strict test typecheck
gate and still run under Vitest.

## Non-Proof

This does not prove full CLI test typecheck, runtime command simplification,
large command test readiness, or command topology cleanup.

## Next

After CI, close `mise-en-palace-xsyt`. Large command test batches such as source
artifact/search, brain search, heartbeat preview, knowledge cards, plan, and
run-show remain outside this slice on purpose.
