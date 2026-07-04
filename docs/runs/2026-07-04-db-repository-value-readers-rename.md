# DB Repository Value Readers Rename

## Slice

Bead: `mise-en-palace-s5n3`

## Evidence Ref

`packages/db/src/repositories/common.ts` contained repository row guards,
timestamp conversion, unknown metadata readers, and scalar readers used by
Drizzle repositories. The file name `common` hid the persistence-boundary role.

## Rename

```txt
old name: packages/db/src/repositories/common.ts
new name: packages/db/src/repositories/repositoryValueReaders.ts
```

## Mechanism

The replacement name says what the file does: read/narrow values at the
repository adapter boundary. No repository behavior, mapper behavior, schema, or
migration changed.

## Why Not Churn

This rename was accepted because the file is imported by many DB repositories
and sits on the DB-to-domain boundary. It is not a repo-wide `common`/`helper`
sweep and does not rename persisted fields, public domain types, fixture ids, or
historical docs.

## Verification

```txt
rg "./common.js|repositories/common|from \"./common" packages/db/src -g'*.ts'
pnpm --filter @krn/db typecheck
git diff --check
```

## Non-Proof

This does not simplify mapper internals, prove DB runtime behavior, improve
query quality, or justify broader naming sweeps.

## Rollback Risk

Low. Rollback is a filename/import reversal.
