# QG-03 Export / Dead-Code Audit

Date: 2026-06-23

Scope: export surface, dead code, zombie aliases, unused public types, and
large-file candidates. This slice performs cleanup only where the evidence is
clear and low-risk.

## Tool Decision

Adopted for QG-03:

```txt
pnpm dlx knip --reporter json
```

Mechanism: Knip inspects workspace entry points, exports, files, dependencies,
and duplicate exports. It produced actionable findings without requiring a
repo topology change.

Rejected for QG-03:

```txt
pnpm dlx ts-prune --version
```

Reason: the tool failed before useful analysis because this repo does not have
a root `tsconfig.json`; it uses package configs extending
`tsconfig.base.json`. Adding a fake root config only for ts-prune would be
audit theater unless QG-03 first proves Knip is insufficient.

Does not prove: Knip does not prove all duplication, overlong functions,
monolithic files, or semantic bloat. QG-04 owns that.

## Initial Findings

Initial Knip findings:

```txt
tests/fixtures/target-repos/typescript-basic/src/index.ts
  unused file
packages/db/src/sql/pgvector.ts
  unused export: PGVECTOR_EXTENSION_SQL
packages/cli/src/noStoreRepositories.ts
  unused exported type: NoStoreUnusedMemoryWrites
packages/cli/src/databaseRuntime.ts
  unused exported types: ObserveProjectRuntime, ReflectRunSnapshot
packages/cli/src/runReviewAssessCommand.ts
  unused exported type: ReviewAssessCommand
packages/cli/src/runMemoryCandidateAddCommand.ts
  unused exported types: MemoryCandidateAddCommand, CreateMemoryCandidateAddDatabaseRuntime
packages/cli/src/runMemoryCandidateReviewCommand.ts
  unused exported types: MemoryCandidateReviewCommand, CreateMemoryCandidateReviewDatabaseRuntime
packages/cli/src/runMemoryRecordApplyCommand.ts
  unused exported types: MemoryRecordApplyCommand, CreateMemoryRecordApplyDatabaseRuntime
packages/cli/src/runMemoryAntiAddCommand.ts
  unused exported types: MemoryAntiAddCommand, CreateMemoryAntiAddDatabaseRuntime
packages/cli/src/runAuditCommand.ts
  unused exported types: AuditCommandScope, AuditCommandFormat, AuditCliCommand
packages/harness/src/activation/assembleContext.ts
  duplicate exports: assembleContext / assembleActivatedContext
packages/harness/src/activation/contextRoi.ts
  duplicate exports: applyContextROI / scoreContextROI
```

## Cleanup Applied

Removed:

- `PGVECTOR_EXTENSION_SQL`, because no production or test path used it.
- `NoStoreUnusedMemoryWrites`, because it was a dead type alias.
- `assembleActivatedContext`, because it was an unused compatibility alias for
  `assembleContext`.
- `scoreContextROI`, because it was an unused compatibility alias for
  `applyContextROI`.

Changed from public export to local type:

- `ObserveProjectRuntime`;
- `ReflectRunSnapshot`;
- `ReviewAssessCommand`;
- `MemoryCandidateAddCommand`;
- `CreateMemoryCandidateAddDatabaseRuntime`;
- `MemoryCandidateReviewCommand`;
- `CreateMemoryCandidateReviewDatabaseRuntime`;
- `MemoryRecordApplyCommand`;
- `CreateMemoryRecordApplyDatabaseRuntime`;
- `MemoryAntiAddCommand`;
- `CreateMemoryAntiAddDatabaseRuntime`;
- `AuditCommandScope`;
- `AuditCommandFormat`;
- `AuditCliCommand`.

These types remain where local implementation needs them. They no longer leak
through package barrels as public API.

## Remaining Accepted Finding

Knip still reports:

```txt
tests/fixtures/target-repos/typescript-basic/src/index.ts
```

Decision: accepted as a test fixture entry file. It is intentionally not
imported by KRN runtime code; it is part of a target-repo fixture used by smoke
and dogfood surfaces.

Falsifier: if runtime code imports this fixture as product truth, QG-01
boundary audit must block it.

## Large-File Inventory For QG-04

Largest production files observed during QG-03:

```txt
packages/cli/src/parseArgs.ts                         2181 lines
packages/cli/src/runDoctorCommand.ts                  2124 lines
packages/harness/src/audit/auditChecks.ts              971 lines
packages/db/src/repositories/DrizzleObservationRepository.ts 943 lines
packages/db/src/repositories/mappers.ts                939 lines
packages/db/src/activationSmoke.ts                     718 lines
packages/cli/src/runCli.ts                             714 lines
packages/db/src/repositories/DrizzleMemoryRepository.ts 648 lines
packages/cli/src/runDbSmokeCommand.ts                  597 lines
packages/db/src/retrievalSubstrateSmoke.ts             571 lines
```

QG-03 does not claim these are wrong. QG-04 must inspect whether each large
file has one responsibility or should be split.

## Verification

Passed:

```txt
pnpm dlx knip --reporter json
pnpm --filter @krn/cli typecheck
pnpm --filter @krn/harness typecheck
pnpm --filter @krn/db typecheck
```

Post-cleanup Knip result:

```txt
tests/fixtures/target-repos/typescript-basic/src/index.ts
  accepted fixture-only finding
```

