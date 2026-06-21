# Handoff

Objective:
Make Memory Governance real enough to persist memory candidates, review/promote
them into MemoryRecord versions, record anti-memory, and link memory to
source/evidence.

Last verified state:
M23 Slice 00 memory governance inventory is complete. M22 final state is the
baseline: source graph persistence, source graph dogfood, doctor source graph
readiness, anti-rot, and global handoff are complete. M23 ledger exists under
`docs/runs/2026-06-21-memory-governance/`, and the current memory governance
surface is recorded in `MEMORY_GOVERNANCE_INVENTORY.md`.

Changed files:

- `docs/runs/2026-06-21-memory-governance/PROGRESS.md`
- `docs/runs/2026-06-21-memory-governance/MEMORY_GOVERNANCE_INVENTORY.md`
- `docs/runs/2026-06-21-memory-governance/DECISIONS.md`
- `docs/runs/2026-06-21-memory-governance/BLOCKERS.md`
- `docs/runs/2026-06-21-memory-governance/VERIFICATION.md`
- `docs/runs/2026-06-21-memory-governance/HANDOFF.md`

Decisions:
M23 should reuse and tighten the existing Postgres/Drizzle memory tables rather
than create a separate memory store. `FeedbackDelta.memoryCandidates` remains a
proposal surface and must not auto-promote MemoryRecords. Markdown run docs are
audit/handoff only, not runtime Memory Core.

Blockers/risks:
No Slice 00 blocker. The current memory tables are not yet sufficient for M23
promotion semantics: candidate review/promotion, current version linkage,
created-from-candidate provenance, application outcome, feedback event type,
and anti-memory source/run linkage need M23.01+ work.

Context selectors:
`GOAL.md`, `PLAN.md`, `docs/handoff/`, M22 run ledger, package manifests,
`packages/db/src/schema/memory.ts`, memory migrations, memory repository port
and Drizzle adapter, core memory types, memory IO schema, evidence capture,
feedback delta schema, and DB smoke commands.

Next action:
Slice 01: add or tighten memory governance schema.

Do not reread:
`docs/materials/` or broad historical docs unless a future task explicitly asks
for raw source/audit material.
