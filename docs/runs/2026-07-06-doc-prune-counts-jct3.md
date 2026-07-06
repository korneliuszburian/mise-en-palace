# Docs Prune And Count Consistency Jct3

Date: 2026-07-06

Bead: `mise-en-palace-jct3`

## Change

Repaired active docs drift after the kernel eval wave:

- refreshed `docs/README.md` inventory counts;
- updated active package-boundary docs after `@krn/schema` removal;
- updated active trust-boundary docs so CLI validation no longer points at a
  removed schema package;
- updated the TypeScript source map so `ts-reset` guidance no longer references
  `packages/schema`;
- updated package-surface notes so removed `@krn/harness/eval` / schema package
  surfaces are not presented as current.

## Archived

Nothing.

## Intentionally Left

- `docs/runs/` and `docs/reviews/` historical evidence files were left in
  place. The docs map explicitly says not to delete old reports without a
  focused owner grep proving no active source, fixture, test, Beads issue, or
  docs map references the artifact.
- Promptfoo boundary docs were left in place because active tests still assert
  Promptfoo remains non-authoritative adapter evidence, not behavior proof.
- Deprecated `@krn/schema` mention in `primitive-ledger.md` was left because it
  is an explicit "do not recreate" decision, not stale current topology.

## Verification

```sh
rg -n "packages/schema|@krn/schema|@krn/harness/eval|packages/schema/src|schemaPrimitives|runCli\\.test|23/17/46|25/19/50|30/30|2 repos|two-target|two target" GOAL.md PLAN.md PLANS.md docs/README.md docs/architecture docs/runbooks docs/KRN_KERNEL.md docs/KRN_SOURCES.md
```

Remaining hits are intentional deprecation/non-authority notes.

## Proves

- Active docs no longer describe removed schema or harness eval package
  surfaces as current.
- Docs inventory counts match the current tree after this report.
- Historical evidence directories remain non-default context.

## Does Not Prove

- Every historical run/review report is useful.
- Docs are globally minimal.
- Future docs counts will stay current without another maintenance slice.
