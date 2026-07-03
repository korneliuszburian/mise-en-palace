# CLI Run-Show Test Typecheck Widening

Date: 2026-07-03

## Scope

Widen the scoped CLI test typecheck gate to include:

```txt
packages/cli/src/__tests__/runRunShowCommand.test.ts
```

## Decision

Adopt the run-show command test into `packages/cli/tsconfig.tests.clean.json`.
This test is already part of `eval:brain-battle:smoke`; the slice adds strict
test-file typechecking for the same surface.

## Verification

```txt
rtk pnpm -C packages/cli typecheck:tests:clean
rtk pnpm --filter @krn/cli test -- runRunShowCommand
```

Both passed locally before this report was written.

## Proof

This proves the run-show command test satisfies the scoped strict test typecheck
gate and still runs under Vitest.

## Non-Proof

This does not prove full CLI test typecheck, run-show runtime simplification,
large command test readiness, or command topology cleanup.

## Next

After CI, close `mise-en-palace-l18p`. Remaining large command tests should be
batched by command family, not added all at once.
