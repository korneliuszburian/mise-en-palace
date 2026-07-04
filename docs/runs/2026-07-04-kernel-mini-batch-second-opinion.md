# Kernel Mini-Batch Second Opinion

## Scope

Reviewed committed range: `8835eb90..5f2337c4`

Included:

- `fd82b623` source claim add project-resolution alignment;
- `e7fed058` anti-vanity naming gate and source decisions;
- `5f2337c4` DB repository value readers rename.

## Claude Verdict

`second-opinion-claude` returned:

```txt
verdict: approve_with_fixes
risk_class: LOW
another_loop_required: false
```

## Accepted Finding

F1: the source-claim add test asserted `repoPathHint` with a loose substring
match while the report described it as current-repo-path proof.

Triage: `accept_and_fix`.

Fix: the regression now computes the expected repo root with `findRepoRoot` and
asserts exact equality against the captured `DatabaseRuntimeInput.repoPathHint`.

## Evidence Gap Closed

Claude noted CI for `5f2337c4` was pending at review start. GitHub Actions run
`28690676995` completed successfully for both jobs:

- DB readiness and smoke;
- Typecheck, tests, and eval smoke.

## Verification After Fix

```txt
pnpm --filter @krn/cli test -- source
pnpm typecheck
git diff --check
```

## Non-Proof

This review does not prove broad source truth, product readiness, or that every
future naming change is justified. It only falsified this mini-batch against the
provided acceptance criteria and local evidence.
