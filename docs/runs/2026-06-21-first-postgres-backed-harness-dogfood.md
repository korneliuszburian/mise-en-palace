# First Postgres-Backed Harness Dogfood

Date: 2026-06-21

## Task

`pnpm --filter @krn/cli krn plan --task "improve KRN doctor brain store readiness"`

## Plan Output Summary

- Persistence: disabled because `KRN_DATABASE_URL` is not set; this was a
  no-store preview.
- Context included: 0.
- Context excluded: 0.
- Next action: context activation abstained; review exclusions before
  execution.
- Evidence expected: `pnpm typecheck`, `pnpm test`, `git diff --check`.
- Skill hints after dogfood fix: `source-to-decision`,
  `typescript-type-safety`, `test-driven-development`,
  `evidence-review-loop`, `activation-engine`.

## Context

Included context: none.

Excluded context: none.

Interpretation: the product correctly used the weak-context/no-store abstention
path instead of pretending it had store-backed memory or source context.

## Implemented Change

- Added `Brain store readiness` to `krn doctor`.
- In the current no-DB runtime it reports:
  `preview only (set KRN_DATABASE_URL and run migrations for persisted harness state)`.
- Updated Codex adapter skill hints so `policy_gate` maps to the new
  `activation-engine` skill instead of the removed `select-kernel-patterns`
  skill.

## Commands Run

- `pnpm --filter @krn/cli krn plan --task "improve KRN doctor brain store readiness"`: passed.
- `pnpm --filter @krn/cli krn doctor`: passed.
- `pnpm --filter @krn/cli krn evidence capture`: passed; printed evidence only.
- `pnpm --filter @krn/cli test`: RED failed before implementation on missing
  brain-store readiness line, then GREEN passed.
- `pnpm --filter @krn/codex-adapter test`: RED failed before implementation on
  stale `select-kernel-patterns` hint, then GREEN passed.
- `pnpm typecheck`: passed after all M18 changes.
- `pnpm test`: passed after all M18 changes.
- `git diff --check`: passed after all M18 changes.
- Final `pnpm --filter @krn/cli krn doctor`: passed and printed brain-store
  readiness.
- Final `pnpm --filter @krn/cli krn evidence capture`: passed; printed
  feedback candidates and no memory mutation.

## Changed Files

- `packages/cli/src/runDoctorCommand.ts`
- `packages/cli/src/runCli.test.ts`
- `packages/codex-adapter/src/renderSkillHints.ts`
- `packages/codex-adapter/src/renderExecutionBrief.test.ts`
- `docs/runs/2026-06-21-first-postgres-backed-harness-dogfood.md`
- `PLAN.md`

## Evidence Contract

- `pnpm typecheck`: required.
- `pnpm test`: required.
- `git diff --check`: required.

## Review Burden

Review the doctor readiness status derivation, the changed skill-hint mapping,
the RED/GREEN tests, and the fact that persistence remains disabled without
`KRN_DATABASE_URL`.

## Diff Risk

High by final printed evidence capture because the working diff includes
`PLAN.md`, the run record, CLI code/tests, and Codex adapter code/tests. The
behavioral risk remains bounded: no new runtime stores, background workers,
agents, or dashboard surfaces were added, and the changed behavior is covered by
focused tests plus full typecheck/test.

## Rollback Path

Revert the focused dogfood implementation commit. The rollback should remove
the doctor readiness line, restore the previous skill-hint map, and remove this
run record plus the related `PLAN.md` progress entry.

## Feedback Candidates

- Memory candidate: current local runtime is no-store preview when
  `KRN_DATABASE_URL` is absent; do not claim persisted harness state.
- Skill candidate: stale skill hints should be checked after repo-local skill
  refactors.
- Eval candidate: dogfood `krn plan` output should not reference removed
  repo-local skills.
- Source candidate: none.

No memory, source, or eval candidate was applied automatically.

## What This Proved

- The CLI can plan a KRN task against itself without DB persistence.
- Weak context is represented as abstention, not broad reread or fake context.
- The doctor can now summarize brain-store readiness in the no-DB runtime.
- Evidence capture can produce printed feedback candidates on the dogfood diff.

## What This Did Not Prove

- It did not prove a live Postgres connection, pgvector extension, migrations,
  or persisted `ExecutionRun` records.
- It did not prove worker execution, leasing, retries, or background job
  processing.
- It did not prove memory/source/eval promotion because candidates were only
  printed.

## Next Safest Action

Commit the dogfood slice, then move to M19 final handoff and forbidden-surface
verification.
