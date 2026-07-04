# Kernel Next Slice Synthesis

Context: post-refactor queue was empty (`bd ready` reported no open issues) and
CI was green for `ec89a32d`.

## Rejected Stale Candidates

- CapabilityPlan binding cleanup is already complete. `capabilityPlan.ts` now
  exposes only `CapabilityRequirement` and `CapabilityPlan`; no
  `PolicyGateBinding`, `CapabilityBinding`, `SkillBinding`, or
  `RulePackBinding` definitions remain.
- Vector/hybrid retrieval already requires `embeddingModelId`.
  `DrizzleRetrievalRepository.searchVector` and `searchHybrid` reject missing
  model scope, and focused repository tests cover that boundary.
- Source decision gaps are currently clean in the local DB:
  `krn source decision gaps --json` reported one accepted claim, one linked
  claim, and zero missing decision edges.
- CLI test typecheck is no longer a whitelist gap. `tsconfig.tests.clean.json`
  includes `src/**/*.test.ts`, and the CLI test tree currently has 58 test
  files under `src/__tests__`.

## Selected Candidate

### `mise-en-palace-2n9m` — Require embedding model scope in worker embed jobs

Evidence:

- `@krn/workers` payloads still declare `embeddingModelId?: string` for
  `embed_source_chunk` and `embed_memory_record`
  (`packages/workers/src/jobTypes.ts:27` and
  `packages/workers/src/jobTypes.ts:33`).
- Those same job descriptions use idempotency keys with `{embeddingModelId}`.
  The keys live in `packages/workers/src/jobTypes.ts:206` and
  `packages/workers/src/jobTypes.ts:213`.
- Retrieval-side vector and hybrid search now require explicit
  `embeddingModelId` to avoid mixed-model comparison.

Decision:

Make embedding model scope required in worker embed job payload contracts and
focused tests.

Proof:

- proves worker embed job contracts cannot omit model scope;
- keeps retrieval model-scope invariant aligned with future embedding job
  enqueue/readback contracts.

Non-proof:

- no worker daemon;
- no scheduler;
- no embedding executor;
- no DB migration;
- no vector ranking quality proof.

## Implementation Outcome

`mise-en-palace-2n9m` made `embeddingModelId` required for
`embed_source_chunk` and `embed_memory_record` worker payloads. The DB worker
enqueue input now derives payload shape from `MaintenanceJob<K>["payload"]`,
and `DrizzleWorkerJobRepository` projects the typed payload into a JSON object
at the persistence boundary.

Verification:

- `pnpm -C packages/workers typecheck`
- `pnpm -C packages/db typecheck`
- `pnpm --filter @krn/workers test`
- `pnpm --filter @krn/db test -- workerJob`

Proof:

- embed worker job contracts cannot omit model scope at typed enqueue callsites;
- worker smoke fixtures preserve model scope in queued embed payloads.

Non-proof:

- no runtime embedding executor exists;
- no idempotent execution or scheduler behavior is proven;
- persisted historical worker rows are not backfilled.
