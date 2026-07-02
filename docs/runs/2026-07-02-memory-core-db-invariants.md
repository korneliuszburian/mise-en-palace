# Memory Core DB Invariants

## Verdict

The audit finding was partially live.

Memory candidate and memory record writes already passed through repository
validators for source lineage, guidance, confidence, and temporal invalidation
strategy. Anti-memory candidate promotion was also gated. The direct
`createAntiMemoryRecord` path missed that validator, and the database schema did
not carry hard constraints for the same Memory Core invariants.

## Source To Decision

```yaml
source_id: repo-local-audit-6vet
title: Memory Core persistence accepts invalid governance state unless invariants are enforced below callers
trust_tier: high
source_class: repo-local evidence
mechanism: Repository validators covered most memory writes, but direct anti-memory records bypassed validation and DB tables lacked CHECK constraints for confidence, lineage, temporal windows, guidance, and edge strength.
krn_implication: Memory Core governance must fail closed at both repository and database boundaries so a future caller or raw write cannot persist unreviewable memory state.
decision_kind: adopt
decision: Add the missing direct anti-memory repository gate and DB CHECK constraints for Memory Core confidence, source evidence/lineage, application guidance, temporal invalidation strategy, and memory edge strength.
does_not_prove: This does not prove graph/source taxonomy normalization, worker runtime safety, or full product-loop E2E behavior.
consumer: packages/db/src/schema/memory.ts
falsifier: A Memory Core row can be persisted with out-of-range confidence, empty source governance, empty guidance, invalid temporal window, or out-of-range edge strength.
```

## Implementation

- Added `assertAntiMemoryCandidateInvariants` to `createAntiMemoryRecord`.
- Added CHECK constraints for memory record, version, candidate, anti-memory
  candidate, anti-memory record, and memory edge invariant boundaries.
- Generated migration `0014_demonic_sir_ram.sql`.
- Added a focused repository test for ungoverned anti-memory record inputs.

## Verification

```txt
rtk pnpm -C packages/db typecheck
rtk pnpm -C packages/db test -- DrizzleMemoryRepository
rtk pnpm -C packages/db db:generate
rtk pnpm -C packages/db db:check
rtk proxy pnpm typecheck
rtk pnpm test
rtk pnpm quality:fallow:ci
rtk pnpm eval:brain-battle:smoke
rtk pnpm db:smoke:memory-governance
rtk pnpm db:smoke
```

Result:

- DB package typecheck: passed.
- DB package tests: 27 files passed, 85 tests passed.
- Drizzle migration generation/check: passed.
- Workspace typecheck: passed.
- Full workspace tests: 129 files passed, 745 tests passed.
- Fallow changed-files gate: passed, with inherited schema duplication
  findings excluded by gate.
- Brain-battle smoke: passed.
- Memory governance DB smoke: passed against local Postgres.
- General DB persistence smoke: passed against local Postgres.

## Migration Risk

This migration can fail on a dirty database that already contains invalid
Memory Core rows. That is the intended governance boundary, but existing data
must be cleaned or archived before applying the migration to such a database.

Rollback is the inverse set of `ALTER TABLE ... DROP CONSTRAINT` statements for
the constraints introduced by `0014_demonic_sir_ram.sql`.

## Proof Boundary

Proves:

- Direct anti-memory record creation now uses the same invariant validator as
  reviewed anti-memory candidate promotion.
- Drizzle generated concrete PostgreSQL CHECK constraints for Memory Core
  confidence, source evidence/lineage, application guidance, temporal windows,
  temporal invalidation strategy, and memory edge strength.
- DB schema snapshots are consistent with the new migration.

Does not prove:

- Existing external databases already satisfy the new constraints.
- Worker jobs enforce Memory Core gates at runtime.
- Product-loop E2E proof is complete.
- Source taxonomy and source-decision authority are fully normalized.
