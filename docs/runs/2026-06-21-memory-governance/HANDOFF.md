# Handoff

Objective:
Make Memory Governance real enough to persist memory candidates, review/promote
them into MemoryRecord versions, record anti-memory, and link memory to
source/evidence.

Last verified state:
M23 Slice 10 doctor memory governance readiness is complete. M22 final state is the
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
aliases, and `architecture-boundary` to `constraint` mapping. Slice 06 added
`krn memory candidate promote/reject` preview/persist routing, source-claim
`doesNotProve` output on promotion, rejection reason persistence, and no
auto-apply behavior. Slice 07 added `krn memory record apply` preview/persist
routing, typed MemoryFeedbackEvent persistence, and `hurt`/`stale` feedback
event creation linked to the MemoryApplication evidence ref. Slice 08 added
`krn memory anti add` preview/persist routing, invalidating SourceClaim
validation, and AntiMemoryRecord persistence without positive MemoryRecord
creation. Slice 09 updated `krn evidence capture` to emit incomplete
proposal-only `memoryCandidates`, persist those proposals in FeedbackDelta,
and avoid creating MemoryCandidate rows or MemoryRecords automatically.
Slice 10 updated `krn doctor` to report memory governance schema readiness,
MemoryRepository reachability, memory governance smoke availability, runtime
proof ready/unverified status, runtime markdown memory absence, and automatic
memory mutation absence.

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
- `packages/db/src/memoryGovernanceReadiness.ts`
- `packages/db/src/memoryGovernanceSmoke.test.ts`
- `packages/db/src/index.ts`
- `packages/cli/src/parseArgs.ts`
- `packages/cli/src/databaseRuntime.ts`
- `packages/cli/src/runMemoryCandidateAddCommand.ts`
- `packages/cli/src/runMemoryCandidateReviewCommand.ts`
- `packages/cli/src/runMemoryRecordApplyCommand.ts`
- `packages/cli/src/runMemoryAntiAddCommand.ts`
- `packages/cli/src/runEvidenceCaptureCommand.ts`
- `packages/cli/src/runCli.ts`
- `packages/cli/src/runDbSmokeCommand.ts`
- `packages/cli/src/runDoctorCommand.ts`
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
before persist. Slice 06 keeps review explicit, derives record keys in the
repository, surfaces source-claim limits on promotion, and does not record
memory applications during candidate review. Slice 07 records `hurt`/`stale`
application outcomes as MemoryFeedbackEvent instead of creating demotion
candidates. Slice 08 keeps anti-memory separate from positive MemoryRecord
creation, defaults owner/confidence for the GOAL target command, and validates
invalidating source claims before persist. Slice 09 keeps evidence capture
proposal-only for memory: changed-file evidence may become an incomplete
FeedbackDelta memory proposal, but capture does not call MemoryRepository,
does not promote, and does not create MemoryRecords. Slice 10 keeps doctor
read-only. It does not run smoke or write proof records; it reports memory
governance runtime proof as unverified until durable dogfood memory records
exist.

Blockers/risks:
No hard blocker through Slice 10. Remaining behavior is unproven until later
slices add dogfood and anti-rot. Memory governance runtime proof remains
`unverified` until Slice 11 creates durable MemoryCandidate, MemoryRecord,
MemoryApplication, and AntiMemory records.

Context selectors:
`GOAL.md`, `PLAN.md`, `docs/handoff/`, M22 run ledger, package manifests,
`packages/db/src/schema/memory.ts`, memory migrations, memory repository port
and Drizzle adapter, core memory types, memory IO schema, evidence capture,
feedback delta schema, and DB smoke commands.

Next action:
Slice 11: dogfood memory governance with live DB.

Do not reread:
`docs/materials/` or broad historical docs unless a future task explicitly asks
for raw source/audit material.
