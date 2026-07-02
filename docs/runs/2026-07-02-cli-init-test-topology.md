# CLI Init Test Topology

Date: 2026-07-02
Task: `mise-en-palace-lx3s`

## Scope

Moved the smallest coherent CLI command group into
`packages/cli/src/__tests__/`.

Moved:

- `parseInitArgs.test.ts`
- `runInitCommand.test.ts`

Preserved:

- file basenames;
- test titles;
- public CLI behavior;
- runtime command/parser files;
- source-seed detection semantics.

## Count Delta

- CLI root colocated tests before this slice: 41.
- CLI root colocated tests after this slice: 39.
- CLI tests under `src/__tests__` after this slice: 2.

## Why This Group

The init command group is small, recently touched by source-seed path updates,
and has focused tests that do not require changing CLI command behavior. It is a
safe first CLI topology proof before moving large files such as `runCli.test.ts`
or `runSourceArtifactPreviewCommand.test.ts`.

## Historical Refs

Historical review reports still mention the old root test paths. They were not
rewritten because they are historical evidence, not active routing surfaces.

## Verification

Passed before commit:

```sh
pnpm --filter @krn/cli test -- parseInitArgs runInitCommand
pnpm -C packages/cli typecheck
pnpm typecheck
pnpm test
pnpm quality:fallow:ci
pnpm eval:brain-battle:smoke
git diff --check
```

## Proof

- Vitest still discovers the moved init tests through the same basename filters.
- The init parser and source-seed detection tests still execute after relative
  import updates.
- The first CLI `src/__tests__` island now exists without changing public
  command behavior.
- Workspace tests, workspace typecheck, Fallow changed-file audit, and
  brain-battle smoke still pass after the move.

## Does Not Prove

- CLI topology migration is complete.
- Large CLI tests are safe to move without additional fixture/filter work.
- CLI command naming or parser architecture has improved.
- Test files are included in package `tsc`; current package typecheck proves
  runtime CLI source still typechecks.
