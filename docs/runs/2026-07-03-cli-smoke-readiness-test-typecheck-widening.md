# CLI Smoke/Readiness Test Typecheck Widening

Date: 2026-07-03

## Scope

Widen the scoped CLI test typecheck gate to include a small smoke/readiness
group:

```txt
packages/cli/src/__tests__/codexAdapterSmoke.test.ts
packages/cli/src/__tests__/runDbReadinessCommand.test.ts
packages/cli/src/__tests__/runDoctorCommand.test.ts
packages/cli/src/__tests__/targetRepoHarnessSmoke.test.ts
packages/cli/src/__tests__/targetRepoTestingSkill.test.ts
packages/cli/src/__tests__/workerJobSmoke.test.ts
```

## Decision

Adopt this subset into `packages/cli/tsconfig.tests.clean.json`. These tests
already satisfy strict test typecheck and do not require runtime or assertion
changes.

## Verification

```txt
rtk pnpm -C packages/cli typecheck:tests:clean
rtk pnpm --filter @krn/cli test -- codexAdapterSmoke workerJobSmoke targetRepoHarnessSmoke targetRepoTestingSkill runDbReadinessCommand runDoctorCommand
```

Both passed locally before this report was written.

## Proof

This proves the selected smoke/readiness tests satisfy the scoped strict test
typecheck gate and still run under Vitest.

## Non-Proof

This does not prove full CLI test typecheck, runtime command simplification,
DB runtime behavior beyond existing smoke assertions, or command topology
cleanup.

## Next

After CI, close `mise-en-palace-2hqs`. Larger runtime command tests remain
outside this slice on purpose.
