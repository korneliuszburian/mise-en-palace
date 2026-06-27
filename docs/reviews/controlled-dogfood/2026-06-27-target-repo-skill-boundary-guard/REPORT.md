# Target Repo Skill Boundary Guard Scenario

Status: complete.
Scenario ID: V04-SC-002.
Mode: source-repair.
Date: 2026-06-27.

## Product Question

Can the high-risk target write-boundary finding condense into a repo skill plus
deterministic guard so future KRN target trials do not treat living target repos
as disposable fixtures?

## Boundary

Allowed reads:

- `docs/runbooks/target-repo-testing.md`;
- `docs/reviews/controlled-dogfood/2026-06-27-headless-wilq-seo-target-trial/REPORT.md`;
- repo skill files under `.agents/skills/`;
- CLI tests.

Allowed writes:

- `.agents/skills/target-repo-testing/SKILL.md`;
- `.agents/skills/target-repo-testing/agents/openai.yaml`;
- `packages/cli/src/targetRepoTestingSkill.test.ts`;
- V04 plan/report docs.

Forbidden writes:

- living target repo files;
- target commits, resets, cleans, or normalization;
- CLI enforcement beyond deterministic skill guard;
- calling this V02-01.

## Commands

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `pnpm --filter @krn/cli test -- targetRepoTestingSkill` | passed | CLI test coverage protects the skill name, metadata, observation-only default, and forbidden target writes. | Does not prove arbitrary target repo safety. |
| `pnpm typecheck` via `rtk proxy pnpm typecheck` | passed | TypeScript still compiles after adding the guard test. | Does not prove product usefulness. |
| `pnpm test` | passed | Workspace tests pass with the new guard. | Does not prove every target workflow. |
| `git diff --check` | passed | Diff has no whitespace errors. | Does not prove semantic correctness. |
| GitHub Actions run `28273514668` for commit `046827b` | passed | Pushed skill/guard slice passed CI, including DB and Promptfoo smoke. | Does not prove future skill invocation. |

## Findings

- The target write-boundary failure is high-risk enough to merit a skill because
  `AGENTS.md` should stay compact and target repo testing is a repeated
  workflow.
- The smallest durable surface is a Codex-readable repo skill plus a text guard
  test, not a hook or target-aware CLI rewrite.
- The guard intentionally protects discoverability and forbidden behavior. It
  does not enforce target write safety at runtime.

## Condensation Decision

- Finding: Target repos are living checkouts and observation-only target trials
  must not patch target files after verification failure.
- Frequency: high-risk after the headless `wilq-seo` trial overstepped target
  repair boundaries.
- Condensation target: skill + guard.
- Decision: accepted.
- Implemented now: yes.
- Evidence: `.agents/skills/target-repo-testing/SKILL.md`;
  `.agents/skills/target-repo-testing/agents/openai.yaml`;
  `packages/cli/src/targetRepoTestingSkill.test.ts`; CI run `28273514668`.
- Why not more: hook/CLI enforcement would be premature before more target
  scenarios show deterministic failure patterns.
- Next bounded repair: run an observation-only target scenario using the skill
  to check whether the skill keeps target dirty state separate.

## What This Proves

- KRN can condense a high-risk target testing finding into a small repo skill.
- A deterministic guard now catches accidental removal of key target write
  boundary language.

## What This Does Not Prove

- V02-01 second-operator usability.
- Product readiness.
- Runtime target write enforcement.
- That every future Codex run will select the skill correctly.

