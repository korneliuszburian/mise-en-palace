# Handoff

Objective:
Continue M25 Activation Engine V1. M25.07 activation dogfood is recorded; next
implementation slice is M25.08 anti-rot and handoff.

Last verified state:
M24 is complete and pushed. M25 inventory found an existing deterministic
activation seed in `packages/harness/src/activation/` and an existing persisted
compiler path in `compileHarnessPlan`. A live persisted plan included three
source/memory items and persisted retrieval/activation rows, but produced zero
context exclusions. M25.01 added core activation contracts and harness contract
coverage. M25.02 added search candidate retrieval, project anti-memory reads,
anti-memory conflict exclusions, and named activation trace persistence helpers.
M25.03 added a noisy activation fixture and harness test that prove bounded
inclusions, stale exclusion, anti-memory blocking, source-without-mechanism
rejection, and conflict flags. Typecheck, full tests, and diff hygiene passed
after M25.03. M25.04 added `pnpm db:smoke:activation`; live smoke passed with
retrieval candidates `6`, activation decisions `6`, included decisions `2`,
excluded decisions `2`, conflict decisions `1`, stale decisions `1`, context
items `2`, context exclusions `4`, and cleanup remaining marker count `0`.
M25.05 added top-level activation summary output to `krn plan`, including
context status, bounded inclusions, explicit exclusions, and abstention reason.
Live preview, live persisted plan, activation smoke, typecheck, and full tests
passed after M25.05. M25.06 added doctor activation checks and activation
readiness derivation. No-DB doctor reports activation preview; DB-backed doctor
reports activation runtime proof ready with decisions `22`, inclusions `21`,
exclusions `1`, and activation readiness ready. M25.07 dogfooded activation on
`improve KRN doctor activation readiness`, captured evidence for execution run
`bb33bd3d-02df-4ff3-839b-6f545de88b4c`, and recorded dogfood limitations in
`DOGFOOD.md`.

Changed files:
`packages/core/src/activation.ts`, `packages/core/src/index.ts`,
`packages/harness/src/activation/domainContracts.test.ts`,
`packages/harness/src/activation/types.ts`,
`packages/harness/src/activation/activationEngine.ts`,
`packages/harness/src/activation/conflictFilter.ts`,
`packages/harness/src/activation/rankCandidates.ts`,
`packages/harness/src/compiler/compileHarnessPlan.ts`,
`packages/harness/src/repositories/memoryRepository.ts`,
`packages/db/src/repositories/DrizzleMemoryRepository.ts`,
`packages/cli/src/noStoreRepositories.ts`,
`packages/harness/src/activation/noisyBrainFixture.test.ts`,
`tests/fixtures/activation/noisy-brain-selection.json`,
`packages/db/src/activationSmoke.ts`,
`packages/db/src/activationSmoke.test.ts`,
`packages/db/src/index.ts`,
`packages/cli/src/parseArgs.ts`,
`packages/cli/src/runPlanCommand.ts`,
`packages/cli/src/runDbSmokeCommand.ts`,
`packages/cli/src/runDoctorCommand.ts`,
`packages/cli/src/runCli.test.ts`,
`package.json`, and
`packages/db/src/activationReadiness.ts`,
`docs/runs/2026-06-22-activation-engine/DOGFOOD.md`,
`docs/runs/2026-06-22-activation-engine/*`.

Decisions:
Extend the existing harness activation engine; do not replace it. Use
retrieval/context tables as the primary activation trace persistence for
source/memory/search. Keep core contracts pure: no DB, CLI, Codex skill IDs, or
`requiredSkills` in core. Source-claim safety can override budget/low-ROI
exclusions, but preserves trust, temporal, and anti-memory unsafe reasons.
Activation smoke uses harness activation functions directly and keeps CLI as
dispatch/formatting only. Plan output can format `ContextAssembly`, but must
not reimplement ranking/filtering policy in CLI. Doctor activation readiness is
read-only and must not execute smoke itself.

Blockers/risks:
No hard blocker. M25 is incomplete until anti-rot is complete.

Context selectors:
`GOAL.md` M25 section, `docs/KRN_KERNEL.md`,
`docs/runs/2026-06-22-activation-engine/ACTIVATION_ENGINE_INVENTORY.md`,
`packages/core/src/activation.ts`,
`packages/harness/src/activation/*`,
`tests/fixtures/activation/noisy-brain-selection.json`,
`packages/harness/src/compiler/compileHarnessPlan.ts`,
`packages/harness/src/compiler/index.test.ts`,
`packages/core/src/contextAssembly.ts`,
`packages/db/src/schema/retrieval.ts`, and
`packages/db/src/activationSmoke.ts`,
`packages/db/src/activationReadiness.ts`,
`packages/cli/src/runDbSmokeCommand.ts`, and
`packages/cli/src/runPlanCommand.ts`,
`packages/cli/src/runDoctorCommand.ts`.

Next action:
Run `git diff --check`, commit
`docs(run): record activation dogfood pass`, push, then start M25.08 anti-rot
and handoff.

Do not reread:
`docs/materials/`, broad historical docs, or old repo topology unless a later
M25 slice explicitly needs raw source/audit material.
