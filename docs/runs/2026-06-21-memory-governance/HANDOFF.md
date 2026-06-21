# Handoff

Objective:
Make Memory Governance real enough to persist memory candidates, review/promote
them into MemoryRecord versions, record anti-memory, and link memory to
source/evidence.

Last verified state:
M23 Slice 01 memory governance schema is complete. M22 final state is the
baseline: source graph persistence, source graph dogfood, doctor source graph
readiness, anti-rot, and global handoff are complete. M23 ledger exists under
`docs/runs/2026-06-21-memory-governance/`, Slice 00 inventory is recorded in
`MEMORY_GOVERNANCE_INVENTORY.md`, and Slice 01 added the durable M23 schema
fields plus migration `packages/db/src/migrations/0004_cool_toro.sql`.

Changed files:

- `docs/runs/2026-06-21-memory-governance/PROGRESS.md`
- `docs/runs/2026-06-21-memory-governance/MEMORY_GOVERNANCE_INVENTORY.md`
- `docs/runs/2026-06-21-memory-governance/DECISIONS.md`
- `docs/runs/2026-06-21-memory-governance/BLOCKERS.md`
- `docs/runs/2026-06-21-memory-governance/VERIFICATION.md`
- `docs/runs/2026-06-21-memory-governance/HANDOFF.md`
- `packages/core/src/memory.ts`
- `packages/db/src/schema/memory.ts`
- `packages/db/src/schema/memory.test.ts`
- `packages/db/src/repositories/mappers.ts`
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
ordering risk while still allowing explicit `proposed` writes.

Blockers/risks:
No hard blocker through Slice 01. Remaining behavior is unproven until later
slices add IO schemas, repository promotion/rejection/apply methods, CLI
commands, evidence capture candidates, doctor readiness, smoke, dogfood, and
anti-rot.

Context selectors:
`GOAL.md`, `PLAN.md`, `docs/handoff/`, M22 run ledger, package manifests,
`packages/db/src/schema/memory.ts`, memory migrations, memory repository port
and Drizzle adapter, core memory types, memory IO schema, evidence capture,
feedback delta schema, and DB smoke commands.

Next action:
Slice 02: add memory governance IO schemas.

Do not reread:
`docs/materials/` or broad historical docs unless a future task explicitly asks
for raw source/audit material.
