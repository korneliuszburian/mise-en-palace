# Handoff

Objective:
Continue M25 Activation Engine V1. M25.01 activation domain contracts are
implemented; next implementation slice is M25.02 activation engine v1 behavior.

Last verified state:
M24 is complete and pushed. M25 inventory found an existing deterministic
activation seed in `packages/harness/src/activation/` and an existing persisted
compiler path in `compileHarnessPlan`. A live persisted plan included three
source/memory items and persisted retrieval/activation rows, but produced zero
context exclusions. M25.01 added core activation contracts and harness contract
coverage; typecheck, full tests, boundary scan, and diff hygiene passed.

Changed files:
`packages/core/src/activation.ts`, `packages/core/src/index.ts`,
`packages/harness/src/activation/domainContracts.test.ts`,
`packages/harness/src/activation/types.ts`, and
`docs/runs/2026-06-22-activation-engine/*`.

Decisions:
Extend the existing harness activation engine; do not replace it. Use
retrieval/context tables as the primary activation trace persistence for
source/memory/search. Keep core contracts pure: no DB, CLI, Codex skill IDs, or
`requiredSkills` in core.

Blockers/risks:
No hard blocker. M25 is incomplete until activation handles noisy corpus
compression with explicit exclusions, search candidates, anti-memory, conflict
sets, smoke, plan integration, doctor readiness, dogfood, and anti-rot.

Context selectors:
`GOAL.md` M25 section, `docs/KRN_KERNEL.md`,
`docs/runs/2026-06-22-activation-engine/ACTIVATION_ENGINE_INVENTORY.md`,
`packages/core/src/activation.ts`,
`packages/harness/src/activation/*`,
`packages/harness/src/compiler/compileHarnessPlan.ts`,
`packages/core/src/contextAssembly.ts`,
`packages/db/src/schema/retrieval.ts`, and
`packages/cli/src/runPlanCommand.ts`.

Next action:
Commit `feat(core): add activation domain contracts`, push, then start M25.02
with RED tests for search candidates, anti-memory blocking, conflict sets, and
activation result/trace behavior.

Do not reread:
`docs/materials/`, broad historical docs, or old repo topology unless a later
M25 slice explicitly needs raw source/audit material.
