# Shared Brain Vertical Loop Proof

Date: 2026-07-03

Beads: `mise-en-palace-pvtf`

## Objective

Run one real repo task through the KRN loop, promote or reject a resulting memory candidate, then run a related second task that either reuses the memory or explicitly rejects it.

## Task 1

Task: fix CLI top-level help commands where `--help` printed usage but exited with code `2`.

Persisted run:

- operatorIntent: `5e5ced5e-8510-4f64-a9d6-c6c5ba674688`
- taskContract: `01c44512-9735-420b-8252-54af23ffc0a9`
- harnessPlan: `3502fcde-0276-400c-a507-d99a112436a6`
- contextAssembly: `c90ff005-6584-4340-bf9c-18502fc3b8e3`
- executionRun: `212c0033-e270-47d3-af86-dfb03e0925a7`

Implementation:

- `plan --help`, `evidence --help`, and `observe --help` now parse to explicit help command variants.
- `runCli` renders their usage through the existing help-renderer path and returns exit `0`.
- Invalid argument paths still return usage as an error with exit `2`.
- Evidence help routing is recognized in the top-level dispatcher before entering `parseEvidenceArgs`; this avoids increasing the already high-complexity evidence parser. This is a local exception to the parser-local help-variant pattern.

Evidence:

The CLI returned these persisted IDs from local Postgres-backed commands:

- evidenceBundle: `8913c0f4-b017-4f03-b2dd-c86673ef0c4b`
- reviewAssessment: `63e98d22-c041-443d-a3df-7ebde6f21c63`
- feedbackDelta: `292d57f0-094b-4b00-861b-f7e2f980dc98`
- observationGroup: `3f2cd86f-2e07-42f0-b47d-de4a835f5b9f`
- reflectionRecord: `e0bd97b6-6db1-48da-8bad-936fa7810c62`

Verification recorded:

- `pnpm --filter @krn/cli test -- run`
- `pnpm --filter @krn/cli krn plan --help`
- `pnpm --filter @krn/cli krn evidence --help`
- `pnpm --filter @krn/cli krn observe --help`
- `pnpm typecheck`
- `git diff --check`

Memory candidate:

- memoryCandidate: `d0a4ac77-79c4-4a48-a137-a86c2ef3d5ba`
- memoryRecord: `006040aa-db78-4f86-93e9-7b6bec8c452f`
- decision: promoted by `codex`

Promoted pattern:

For the repaired CLI help paths, commands should parse help into an explicit `*Help` command variant and let `runCli` return exit `0`, usage on stdout, and empty stderr. Usage-as-error remains reserved for invalid arguments. Evidence command help currently uses a top-level dispatcher shortcut to avoid adding complexity to `parseEvidenceArgs`.

## Task 2

Task: fix `krn reflect --help` using the accepted CLI help parser pattern.

Persisted run:

- operatorIntent: `29a83c50-07f1-4738-925d-d696938d5586`
- taskContract: `a07c0fb5-2fc4-402b-9e46-e71f1ad2d1d3`
- harnessPlan: `30efddfa-2662-4388-9191-1db85ca45838`
- contextAssembly: `bbcd7f9b-c915-4c4c-a2d8-32ad145264b4`
- executionRun: `1bfbb9e0-9d3a-42a7-8033-4f3531df51a2`

Implementation:

- `reflect --help` now follows the same explicit help variant and `runCli` help-renderer path.

Evidence:

The CLI returned these persisted IDs from local Postgres-backed commands:

- evidenceBundle: `caf59664-28a6-4254-8c7a-ec6d467d4df1`
- reviewAssessment: `f65112e6-59c6-4690-b50f-2cef2771d34a`
- feedbackDelta: `3696d71b-64fd-4bbf-bb63-a2882a5b2940`
- memoryApplication: `fd2f5c10-88b6-46bf-991b-591431ab05ee`

Verification recorded:

- `pnpm --filter @krn/cli test -- run`
- `pnpm --filter @krn/cli krn reflect --help`
- `pnpm typecheck`
- `git diff --check`

## Important Failure Point

The promoted memory was useful when applied manually, but the second persisted plan did not automatically activate the memory record:

- retained pattern selection: `none`
- memory records used: `none`

So this slice proves a store-backed memory promotion and explicit memory application path. It does not prove memory retrieval quality or automatic pattern recall.

## Local Verification

Passed after implementation:

- `pnpm --filter @krn/cli test -- run`
- `pnpm --filter @krn/cli krn plan --help`
- `pnpm --filter @krn/cli krn evidence --help`
- `pnpm --filter @krn/cli krn observe --help`
- `pnpm --filter @krn/cli krn reflect --help`
- `pnpm --filter @krn/cli krn plan -h`
- `pnpm --filter @krn/cli krn evidence -h`
- `pnpm --filter @krn/cli krn observe -h`
- `pnpm --filter @krn/cli krn reflect -h`
- invalid-argument probes for `plan --bogus`, `evidence capture --bad-flag`, `observe --run`, and `reflect --scope`
- focused `-h` parity and invalid-argument tests in `packages/cli/src/__tests__/run.test.ts`
- `pnpm test`
- `pnpm typecheck`
- `pnpm quality:fallow:ci`
- `git diff --check`

## Second Opinion

Claude Code was run through `.agents/skills/second-opinion-claude` with a compact context pack:

- prompt: `.local-lab/second-opinion/shared-brain-vertical-loop/prompt.md`
- result: `.local-lab/second-opinion/shared-brain-vertical-loop/claude.json`
- verdict: `approve_with_fixes`

Triage:

- Must-fix: add negative-path and `-h` parity tests. Applied in `packages/cli/src/__tests__/run.test.ts`.
- Evidence/wording gap: do not imply broad CLI help completeness. Report scoped to repaired commands only.
- Evidence/wording gap: do not imply automatic memory recall. Report keeps manual application separate from retrieval quality.
- Follow-up: exhaustive top-level CLI help matrix filed as `mise-en-palace-glor`.

Final evidence after second-opinion triage:

- evidenceBundle: `56a2778f-0498-42c6-a2a9-96d6aa8a1d07`
- reviewAssessment: `4cb19921-45d7-47ad-8491-a7f85e5464e3`
- feedbackDelta: `ea027ecf-6735-4f62-93f0-229838041801`

## Proof Boundary

Proves:

- real operator task was persisted as task contract and execution run;
- local plan output produced a bounded Codex brief with source-claim exclusions and proof boundaries;
- implementation followed the brief's task intent, but this report does not prove Codex complied with every brief section;
- local Postgres-backed commands returned persisted IDs for evidence, observation, reflection, memory candidate promotion, and memory application;
- a second related task applied the promoted pattern manually;
- `plan`, `evidence`, `observe`, and `reflect` help paths exit successfully for `--help` and `-h`;
- invalid argument examples for the repaired command group remain on the exit `2` usage-as-error path.

Does not prove:

- automatic memory recall selected the promoted memory;
- source truth, ranking quality, or broad CLI help completeness;
- Codex followed every brief section;
- product readiness;
- DB runtime behavior beyond the exercised local commands.
- exhaustive top-level CLI help behavior for commands outside the repaired group.
