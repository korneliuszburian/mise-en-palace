# Handoff

Objective:
Continue M25 Activation Engine V1. M25.03 noisy-brain activation fixture is
implemented; next implementation slice is M25.04 activation smoke.

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
after M25.03.

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
`tests/fixtures/activation/noisy-brain-selection.json`, and
`docs/runs/2026-06-22-activation-engine/*`.

Decisions:
Extend the existing harness activation engine; do not replace it. Use
retrieval/context tables as the primary activation trace persistence for
source/memory/search. Keep core contracts pure: no DB, CLI, Codex skill IDs, or
`requiredSkills` in core. Source-claim safety can override budget/low-ROI
exclusions, but preserves trust, temporal, and anti-memory unsafe reasons.

Blockers/risks:
No hard blocker. M25 is incomplete until activation smoke, plan output
hardening, doctor readiness, dogfood, and anti-rot are complete.

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
`packages/cli/src/runPlanCommand.ts`.

Next action:
Commit `test(harness): add noisy brain activation fixture`, push, then start
M25.04 with an activation smoke path that proves both included and excluded
activation decisions.

Do not reread:
`docs/materials/`, broad historical docs, or old repo topology unless a later
M25 slice explicitly needs raw source/audit material.
