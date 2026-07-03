# Run-Show DB Smoke CI Gate

Date: 2026-07-03
Beads: `mise-en-palace-otyu`

## Change

The DB CI job now runs `pnpm db:smoke:run-show` after the DB-backed brain-loop
smoke and before worker/source graph smoke checks.

## Proof

- `pnpm db:smoke:run-show` passed locally before adding the CI step.
- `.github/workflows/ci.yml` now includes `DB run show smoke`.

## Boundary

Proves the run-show DB smoke is part of the recurring CI DB gate.

Does not broaden CI to every DB smoke target or prove run-show projection
quality beyond existing run-show tests and the DB readback smoke.
