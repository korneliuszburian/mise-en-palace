# CLI Parse Test Typecheck Widening

Date: 2026-07-03

## Scope

Widen the scoped CLI test typecheck gate to include parser tests:

```txt
packages/cli/src/__tests__/parseBrainArgs.test.ts
packages/cli/src/__tests__/parseCodexArgs.test.ts
packages/cli/src/__tests__/parseDbArgs.test.ts
packages/cli/src/__tests__/parseDoctorArgs.test.ts
packages/cli/src/__tests__/parseEvidenceArgs.test.ts
packages/cli/src/__tests__/parseHeartbeatArgs.test.ts
packages/cli/src/__tests__/parseInitArgs.test.ts
packages/cli/src/__tests__/parseKnowledgeArgs.test.ts
packages/cli/src/__tests__/parseMemoryArgs.test.ts
packages/cli/src/__tests__/parseMemoryConfidence.test.ts
packages/cli/src/__tests__/parseObserveArgs.test.ts
packages/cli/src/__tests__/parsePlanArgs.test.ts
packages/cli/src/__tests__/parseReflectArgs.test.ts
packages/cli/src/__tests__/parseReviewArgs.test.ts
packages/cli/src/__tests__/parseRunArgs.test.ts
packages/cli/src/__tests__/parseSourceArgs.test.ts
```

## Decision

Adopt the parser group into `packages/cli/tsconfig.tests.clean.json`. This is a
low-risk widening slice because it requires no fixture changes, no runtime
changes, and no assertion changes.

## Verification

```txt
rtk pnpm -C packages/cli typecheck:tests:clean
rtk pnpm --filter @krn/cli test -- parse
```

Both passed locally before this report was written.

## Proof

This proves the parser test group satisfies the scoped strict test typecheck
gate and still runs under Vitest.

## Non-Proof

This does not prove full CLI test typecheck, runtime command simplification,
parser design quality, or command-dispatch topology cleanup.

## Next

After CI, close `mise-en-palace-ipfr`. A later issue can decide whether to add
small helper/smoke tests or stop the scoped gate before it becomes a broad
cleanup treadmill.
