# Multi-Repo Shared-Brain Reuse Proof

Date: 2026-07-03

Bead: `mise-en-palace-1c5x`

## Objective

Run a third related task through KRN and prove whether the promoted Shared Brain
Vertical memory can be reused or must be rejected.

## Finding

The previous SBV MemoryRecord existed and was active, but it was attached to the
older `mise-en-palace` project row:

- memoryRecord: `006040aa-db78-4f86-93e9-7b6bec8c452f`
- memory project: `ae9962f9-0b20-4a43-97fe-d715062c4478`
- current repo-connected project: `7d9d103a-1a8e-4492-a4ca-db3a5589bd9b`

The first third-task plan therefore selected no memory. This was not a ranking
quality issue; it was project-lineage drift.

## Implementation

`krn memory candidate add --run-id ... --persist` now derives the MemoryCandidate
project from the persisted run spine when the run is available:

- `taskContract.projectId`
- fallback `operatorIntent.projectId`
- fallback existing runtime project

This keeps future MemoryCandidates scoped to the run they were created from
instead of whichever project the command runtime happens to resolve.

Files changed:

- `packages/cli/src/runMemoryCandidateAddCommand.ts`
- `packages/cli/src/__tests__/memory.test.ts`
- `packages/cli/src/parseArgs.ts`
- `packages/cli/src/parseReviewArgs.ts`
- `packages/cli/src/runCli.ts`
- `packages/cli/src/__tests__/run.test.ts`

## Third Task

Task: fix `krn review --help` using the accepted CLI help parser pattern and
keep invalid review args on usage-as-error.

Plan IDs:

- taskContract: `904ce874-2b2c-43bc-84cf-e6fb9b6eaa46`
- contextAssembly: `e554fc18-c104-415c-a2cc-a8188e382280`
- executionRun: `91539000-2145-4644-9c01-692cf2271603`

The plan included the store-backed memory:

- memoryRecord: `3b3b3ea5-3145-4bba-b762-1061921cffbd`
- trust: `high`
- expected use: add explicit `*Help` command variant, wire runCli help renderer,
  and test exit code/stdout/stderr.

Implementation:

- added `reviewAssessHelp`;
- made `review --help` and `review -h` exit `0` with usage on stdout;
- kept invalid `review --bogus` on exit `2` usage-as-error.

DB readback:

- evidenceBundle: `c1027ce5-c650-4782-8c53-69cfeab86292`
- reviewAssessment: `83f63f3e-1172-424a-99d0-b204707dff24`
- feedbackDelta: `da0df09c-e4d4-4b95-ae89-1a0d9c721bab`
- memoryApplication: `d5f0d222-55a2-4103-bbbc-9211cd38a357`
- outcome: `helped`

## Verification

Passed:

- `pnpm --filter @krn/cli test -- run memory`
- `pnpm --filter @krn/cli krn review --help`
- `pnpm --filter @krn/cli krn review -h`
- `pnpm --filter @krn/cli krn review --bogus` returned exit `2`
- `pnpm -w typecheck`
- `pnpm test`
- `pnpm quality:fallow:ci`
- `git diff --check`

## Second Opinion

Claude Code was run through `.agents/skills/second-opinion-claude`:

- first verdict: `approve_with_fixes`, LOW
- accepted fixes: add fallback project test, remove whitespace diff noise, add
  explicit invalid `review --bogus` test
- follow-up verdict: `approve`, LOW
- follow-up result:
  `.local-lab/second-opinion/1c5x-store-backed-sbv-reuse/claude-followup.json`

## Proof Boundary

Proves:

- `memory candidate add --run-id` now preserves run project lineage when a
  persisted run is available;
- store-backed MemoryRecord reuse works for a third related task when memory is
  correctly scoped to the connected project;
- the third task used the selected memory and recorded a helped memory
  application;
- `review --help` and `review -h` now follow the successful help path.

Does not prove:

- retained-pattern catalog selection; it still returned `rejected_or_deferred`;
- broad CLI help completeness;
- cross-repo semantic memory transfer quality;
- product readiness.
