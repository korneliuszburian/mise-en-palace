# CLI Doctor Test Typecheck Widening

Date: 2026-07-03

## Scope

Widen the scoped CLI test typecheck gate to include doctor readiness/check tests:

```txt
packages/cli/src/__tests__/doctorDbChecks.test.ts
packages/cli/src/__tests__/doctorReadiness.test.ts
packages/cli/src/__tests__/doctorRepoChecks.test.ts
packages/cli/src/__tests__/doctorStaticChecks.test.ts
```

## Decision

Adopt this doctor group into `packages/cli/tsconfig.tests.clean.json`. These
tests already satisfy strict test typecheck and do not require runtime or
assertion changes.

## Verification

```txt
rtk pnpm -C packages/cli typecheck:tests:clean
rtk pnpm --filter @krn/cli test -- doctorDbChecks doctorReadiness doctorRepoChecks doctorStaticChecks
```

Both passed locally before this report was written.

## Proof

This proves the selected doctor readiness/check tests satisfy the scoped strict
test typecheck gate and still run under Vitest.

## Non-Proof

This does not prove full CLI test typecheck, doctor status model quality,
runtime command simplification, or command topology cleanup.

## Next

After CI, close `mise-en-palace-j7bs`. Larger runtime command tests remain
outside this slice on purpose.
