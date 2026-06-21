# Handoff

Objective:
Make Memory Governance real enough to persist memory candidates, review/promote
them into MemoryRecord versions, record anti-memory, and link memory to
source/evidence.

Last verified state:
M23 Slice 05 CLI memory candidate add is complete. M22 final state is the
baseline: source graph persistence, source graph dogfood, doctor source graph
readiness, anti-rot, and global handoff are complete. M23 ledger exists under
`docs/runs/2026-06-21-memory-governance/`, Slice 00 inventory is recorded in
`MEMORY_GOVERNANCE_INVENTORY.md`, Slice 01 added the durable M23 schema fields
plus migration `packages/db/src/migrations/0004_cool_toro.sql`, and Slice 02
added Zod IO parsers for memory candidates, promotion, application feedback,
feedback events, and anti-memory. Slice 03 added the core/harness read models,
repository port methods, Drizzle adapter methods, mapper fields, and tests for
candidate review/promotion, application feedback, and anti-memory run linkage.
Slice 04 added `pnpm db:smoke:memory-governance` and verified live DB cleanup
to zero marker rows. Slice 05 added `krn memory candidate add` preview/persist
routing with schema validation, source-claim validation on persist, confidence
aliases, and `architecture-boundary` to `constraint` mapping.

Changed files:

- `docs/runs/2026-06-21-memory-governance/PROGRESS.md`
- `docs/runs/2026-06-21-memory-governance/MEMORY_GOVERNANCE_INVENTORY.md`
- `docs/runs/2026-06-21-memory-governance/DECISIONS.md`
- `docs/runs/2026-06-21-memory-governance/BLOCKERS.md`
- `docs/runs/2026-06-21-memory-governance/VERIFICATION.md`
- `docs/runs/2026-06-21-memory-governance/HANDOFF.md`
- `packages/core/src/memory.ts`
- `packages/core/src/ids.ts`
- `packages/db/src/schema/memory.ts`
- `packages/db/src/schema/memory.test.ts`
- `packages/schema/src/memoryCandidate.ts`
- `packages/schema/src/index.test.ts`
- `packages/db/src/repositories/mappers.ts`
- `packages/db/src/repositories/mappers.test.ts`
- `packages/db/src/repositories/DrizzleMemoryRepository.ts`
- `packages/db/src/repositories/DrizzleMemoryRepository.test.ts`
- `packages/harness/src/repositories/memoryRepository.ts`
- `packages/db/src/memoryGovernanceSmoke.ts`
- `packages/db/src/memoryGovernanceSmoke.test.ts`
- `packages/db/src/index.ts`
- `packages/cli/src/parseArgs.ts`
- `packages/cli/src/databaseRuntime.ts`
- `packages/cli/src/runMemoryCandidateAddCommand.ts`
- `packages/cli/src/runCli.ts`
- `packages/cli/src/runDbSmokeCommand.ts`
- `packages/cli/src/runCli.test.ts`
- `package.json`
- `packages/db/src/migrations/0004_cool_toro.sql`
- `packages/db/src/migrations/meta/0004_snapshot.json`
- `packages/db/src/migrations/meta/_journal.json`
- `packages/harness/src/activation/types.ts`

Decisions:
M23 should reuse and tighten the existing Postgres/Drizzle memory tables rather
than create a separate memory store. `FeedbackDelta.memoryCandidates` remains a
proposal surface and must not auto-promote MemoryRecords. Markdown run docs are
audit/handoff only, not runtime Memory Core. Slice 01 preserves old memory
status values for compatibility, adds M23 vocabulary, and keeps the DB default
for `memory_candidates.status` as `candidate` to avoid Postgres enum/default
ordering risk while still allowing explicit `proposed` writes. Slice 02 keeps
unknown-input parsing in `packages/schema` and defaults candidate IO status to
`proposed`. Slice 03 keeps promotion explicit and transactional; when no
promotion `recordKey` is provided it derives `memory:<candidateId>`.
Slice 04 makes runtime memory governance proof a DB smoke command with
marker-based cleanup. Slice 05 keeps candidate-add preview mode no-store,
maps `architecture-boundary` to stored kind `constraint`, accepts
`low`/`medium`/`high` confidence aliases, and validates source-claim existence
before persist.

Blockers/risks:
No hard blocker through Slice 05. Remaining behavior is unproven until later
slices add candidate promote/reject, record apply, anti-memory add, evidence
capture candidates, doctor readiness, dogfood, and anti-rot.

Context selectors:
`GOAL.md`, `PLAN.md`, `docs/handoff/`, M22 run ledger, package manifests,
`packages/db/src/schema/memory.ts`, memory migrations, memory repository port
and Drizzle adapter, core memory types, memory IO schema, evidence capture,
feedback delta schema, and DB smoke commands.

Next action:
Slice 06: add CLI `krn memory candidate promote/reject`.

Do not reread:
`docs/materials/` or broad historical docs unless a future task explicitly asks
for raw source/audit material.
