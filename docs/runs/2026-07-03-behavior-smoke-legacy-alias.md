# Behavior Smoke Legacy Alias

Date: 2026-07-03

## Verdict

The active deterministic behavior/docs gate is `pnpm eval:krn:smoke`.
`pnpm eval:brain-battle:smoke` remains only as a compatibility alias and now
prints that boundary before delegating.

## Behavior Change

- `eval:brain-battle:smoke` emits a legacy-alias message and delegates to
  `eval:krn:smoke`.
- `behaviorGateMatrixInvariants` fails if other package scripts depend on the
  stale command name.
- `docs/architecture/behavior-gate-matrix.md` documents the old name as a
  legacy alias, not behavior proof authority.

## Proof

- `pnpm eval:krn:smoke`
- `pnpm --filter @krn/harness test -- behaviorGateMatrixInvariants`

## Non-Proof

This does not improve eval quality, Codex adherence, source truth, promptfoo
behavior, or product readiness. It only removes stale proof-command ambiguity
from active routing while preserving compatibility for existing callers.
