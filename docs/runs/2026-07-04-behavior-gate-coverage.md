# Behavior Gate Coverage Audit

Date: 2026-07-04

## Summary

Audited the `docs/KRN_KERNEL.md` live primitive map against active behavior
guards, CI routing, and `docs/architecture/behavior-gate-matrix.md`.

This slice does not add new kernel primitives. It makes the current guard
coverage explicit for the four live verbs: select, apply, verify, and forget.

## Coverage

| Verb | Live primitive | CI-invoked guard | Matrix coverage | Non-proof |
| --- | --- | --- | --- | --- |
| select | activation retrieval, ranking, and filters | `pnpm eval:krn:smoke`, `pnpm db:smoke:brain-loop`, `pnpm db:smoke:source-graph` | `Kernel select primitive...` row | Does not prove scoring optimality or ranking quality at scale. |
| apply | compile plan, assemble context, record memory application | `pnpm eval:krn:smoke`, `pnpm db:smoke:brain-loop` | `Kernel apply primitive...` row | Does not prove arbitrary Codex output usefulness. |
| verify | evidence, review, feedback, context, activation, cleanup readback | `pnpm eval:krn:smoke`, `pnpm db:smoke:brain-loop` | `Kernel verify primitive...` row | Does not prove review judgment or product readiness. |
| forget | hurt/stale feedback and anti-memory exclusion on later activation | `pnpm eval:krn:smoke`, `pnpm db:smoke:brain-loop` | `Kernel forget primitive...` row | Does not prove autonomous pruning or every stale claim is detected. |

## Guardrail

`behaviorGateMatrixInvariants` now requires explicit matrix rows for all four
live kernel primitives and checks that their guard text stays tied to the
active scripts/CI path instead of drifting into prose-only claims.

## Verification

```sh
pnpm docs:lint
pnpm eval:krn:smoke
pnpm typecheck
git diff --check
```
