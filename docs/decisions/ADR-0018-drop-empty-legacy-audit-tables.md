# ADR-0018: Drop Empty Legacy Audit Tables

Status: accepted.

Date: 2026-06-24

Decision status: implemented by migration `0012_condemned_wolf_cub.sql`.

## Context

ADR-0017 removed active `AuditBundle` domain, IO, and repository contracts but
kept `audit_bundles` / `audit_findings` as legacy migration-retention schema.
C6-02 exists to decide whether those tables should stay, be exported, or be
dropped.

## Source Decisions

source_id: local Postgres row-count check on
`postgres://krn:krn@localhost:54329/krn`
trust_tier: high for the current local target DB
mechanism: `audit_bundles` and `audit_findings` both returned count `0`.
krn_implication: no local legacy audit evidence exists to export or migrate.
decision: adopt; drop the empty legacy tables in a generated migration.
does_not_prove: every external or future environment has zero legacy rows.
consumer: migration `0012_condemned_wolf_cub.sql` and C6-02 plan closure.
falsifier: a target environment reports non-zero legacy audit rows before
applying migration `0012`.

source_id: ADR-0017 future drop preconditions
trust_tier: high
mechanism: destructive drop requires row/provenance check, rollback/export
path, generated migration review, and DB readiness proof.
krn_implication: dropping is allowed only after proving no retained evidence is
lost in the target DB.
decision: adopt.
does_not_prove: legacy tables should be recreated if another environment has
rows.
consumer: C6-02 implementation and migration verification.
falsifier: drop migration is applied to an environment with non-zero legacy
rows without export/review.

source_id: generated SQL migration
`packages/db/src/migrations/0012_condemned_wolf_cub.sql`
trust_tier: high
mechanism: Drizzle generated explicit drops for `audit_bundles`,
`audit_findings`, and the legacy audit enum types.
krn_implication: active DB schema no longer contains legacy audit storage.
decision: adopt.
does_not_prove: unrelated KRN behavior changed.
consumer: DB schema and migration ledger.
falsifier: `db:check` reports drift or live DB still resolves the dropped
tables/types after migration readiness.

## Decision

Drop the empty legacy audit tables and enum types.

Accepted changes:

- remove `legacyAudit*` schema exports and tests;
- generate migration `0012_condemned_wolf_cub.sql`;
- apply migration locally through
  `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`;
- verify `to_regclass` / `to_regtype` no longer resolves the dropped tables and
  enum types.

## Rejections

- Keep empty legacy tables indefinitely: rejected because no active contract or
  rows remain.
- Recreate a legacy write repository: rejected by ADR-0017.
- Migrate rows into EvidenceBundle lineage: rejected for this target because
  row counts are zero.

## Rollback

Use `git revert <C6-02 commit>` for source rollback. If migration `0012` has
already been applied to a DB that needs legacy rows restored, recreate from a
reviewed export/backup instead of restoring the old write repository. For any
environment with non-zero legacy rows, export/review rows before applying
`0012`.

## Verification

This ADR is upheld when:

- `packages/db/src/schema/index.ts` does not export legacy audit schema;
- package source has no `legacyAudit`, `AuditBundle`,
  `DrizzleAuditBundleRepository`, or `parseAuditBundleInput` symbols;
- `pnpm --filter @krn/db db:check` passes;
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`
  reports 13/13 migrations applied;
- `to_regclass` / `to_regtype` returns null for legacy audit tables and enum
  types after migration.
