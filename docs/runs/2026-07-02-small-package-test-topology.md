# Small-Package Test Topology Slice

Date: 2026-07-02
Beads: `mise-en-palace-gah2`

## Objective

Continue the naming/layout audit hardening by moving small-package root tests
into package-local `src/__tests__` islands without changing runtime behavior.

This slice intentionally avoids CLI, DB, harness-root, and package-renaming work.
Those surfaces have larger import and smoke-filter blast radius and stay in
follow-up issues.

## Changed Topology

Moved 19 root-level tests:

- `packages/schema/src/*.test.ts` -> `packages/schema/src/__tests__/`
- `packages/codex-adapter/src/*.test.ts` -> `packages/codex-adapter/src/__tests__/`
- `packages/core/src/*.test.ts` -> `packages/core/src/__tests__/`

Left alone:

- domain-local tests already under subdirectories, including
  `packages/core/src/observations/index.test.ts` and
  `packages/core/src/reflection/index.test.ts`
- worker tests already migrated by the prior layout pilot
- DB, harness-root, and CLI tests, which are tracked as separate higher-risk
  follow-up slices

## Topology Count

After this slice:

```txt
total_tests=131
tests_in___tests__=26
colocated_tests=105
```

The remaining colocated count is expected. This slice proves the small-package
pattern only; it does not claim repo-wide topology cleanup.

## Verification

Package tests:

```txt
pnpm --filter @krn/schema test
pnpm --filter @krn/codex-adapter test
pnpm --filter @krn/core test
```

Package typechecks:

```txt
pnpm -C packages/schema typecheck
pnpm -C packages/codex-adapter typecheck
pnpm -C packages/core typecheck
```

All six narrow checks passed before this report was written. The package test
commands are the evidence that the moved test files were discovered and their
runtime imports still execute. The package typecheck commands prove runtime
package source still typechecks after the move; they do not prove moved test
files are included in `tsc`, because the current package configs exclude test
files.

Workspace checks:

```txt
pnpm test
pnpm typecheck
pnpm quality:fallow:ci
pnpm eval:brain-battle:smoke
git diff --check
```

`pnpm typecheck` was verified through `rtk proxy pnpm typecheck`; direct
`rtk pnpm typecheck` invokes the RTK TypeScript shortcut and prints TypeScript
help with exit code 1, so it is not the workspace typecheck command.

## Proof

This proves:

- schema, codex-adapter, and core root tests can live in `src/__tests__`
  without changing runtime code
- package-local Vitest discovery still finds the moved tests
- package runtime sources still typecheck after relative import updates
- the `recipes/__tests__` topology exemplar can be repeated outside one lab
  island

## Non-Proof

This does not prove:

- CLI test topology is safe to migrate
- harness-root smoke filters are safe to rewrite
- DB/readiness tests can move without path or environment regressions
- moved test files are included in `tsc` package typecheck
- repo naming has been shortened
- product behavior improved
- the KRN end-to-end loop is governed or complete

## Next Slice Recommendation

Continue with `mise-en-palace-mvrx` only for bounded naming shortening if the
next second opinion agrees. Otherwise, take `mise-en-palace-o5xg` and migrate
harness-root tests only after proving smoke filters by exact command.

## Second-Opinion Prompt

Review the current diff/state after commit `5cb04e9` plus this small-package
test-topology slice. Challenge whether moving schema, codex-adapter, and core
root tests into `src/__tests__` actually improves repo maintainability or only
adds churn. Inspect naming/layout debt still present in CLI, harness root, DB,
and workers. Identify any broken import assumptions, smoke-filter risks, or
test-discovery blind spots. Then propose the next bounded slice that best
pushes the repo toward a senior, boring, explainable topology without broad
renames, behavior changes, or AI-control-plane ceremony.
