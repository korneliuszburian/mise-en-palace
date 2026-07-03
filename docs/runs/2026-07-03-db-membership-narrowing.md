# DB Membership Narrowing

Date: 2026-07-03

## Change

DB readback mappers no longer narrow literal unions through `set.has(value as T)`
membership checks in the touched surfaces:

- `memoryMappers.ts`
- `workerJobMappers.ts`
- `DrizzleRetrievalRepository.ts`

The runtime behavior is unchanged: unsupported values are still filtered or
rejected at the same boundaries.

## Proof

```sh
pnpm --filter @krn/db test -- memoryMappers workerJobMappers DrizzleRetrievalRepository
pnpm -C packages/db typecheck
rg -n "has\\([^\\n]* as|return value as WorkerJob|memoryRecordKinds\\.has\\([^\\n]* as|memoryCandidateStatuses\\.has\\([^\\n]* as|contextExclusionReasons\\.has\\([^\\n]* as" packages/db/src/repositories/memoryMappers.ts packages/db/src/repositories/workerJobMappers.ts packages/db/src/repositories/DrizzleRetrievalRepository.ts
```

The final `rg` returned no matches.

## Non-Proof

This does not remove all `as` usage in DB tests or in unrelated repository
readbacks. It only tightens current mapper membership guards.
