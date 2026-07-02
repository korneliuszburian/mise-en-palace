# Compiler And Smoke Boundary Characterization

Date: 2026-07-02

## Summary

Characterized the current compiler and DB smoke support boundaries without
performing a broad refactor.

The latest audit was directionally right that `compileHarnessPlan` and
`dbSmokeSupport` are concentration points, but it overstated the topology:
`dbSmokeSupport.ts` lives in `@krn/db`, not under the harness compiler, and
`compileHarnessPlan` already has a readable final pipeline. The missing proof was
not another split. The missing proof was a focused characterization test showing
that compiler retrieval, context assembly, activation trace decisions, stored
selection, and retrieval-run completion all share the same persisted
`retrievalRunId` / `contextAssemblyId` contract.

## Changed

- Added a harness compiler characterization test:
  - proves the created context assembly stores `metadata.retrievalRunId`;
  - proves persisted retrieval candidates use that retrieval run;
  - proves activation decisions carry both `retrievalRunId` and
    `contextAssemblyId`;
  - proves stored context selection points at the created assembly;
  - proves retrieval-run completion records inclusion/exclusion counts.
- Extended the fake retrieval repository in the compiler test to capture
  `completeRetrievalRun` calls instead of returning a fixed completed run.
- Left runtime compiler code untouched.

## Live Findings

- `packages/harness/src/compiler/compileHarnessPlan.ts` still orchestrates a
  product-critical path:

  ```txt
  operator intent
  -> task contract
  -> evidence contract
  -> harness plan
  -> activation retrieval
  -> retrieval run
  -> conflict detection
  -> trust/temporal/review/ROI filters
  -> context assembly
  -> activation trace persistence
  -> capability plan
  -> codex adapter plan ref
  ```

- The final implementation is already a flat sequence rather than an opaque
  nested framework.
- `packages/db/src/dbSmokeSupport.ts` is a real support concentration point. It
  combines:
  - DB readiness/runtime creation;
  - smoke workspace/project/task/harness/context seeding;
  - compiler smoke execution;
  - marker counting;
  - cleanup helpers for multiple DB smoke families.
- A future split is justified, but it should be a DB smoke support split, not a
  harness compiler rewrite.

## Stale Or Overstated Audit Claims

- Stale: `packages/harness/src/compiler/dbSmokeSupport.ts` does not exist.
  The file is `packages/db/src/dbSmokeSupport.ts`.
- Overstated: `compileHarnessPlan` does not need an immediate flattening
  rewrite. The current final function is already a readable sequence.
- Still valid: the compiler path needs focused characterization because many DB
  smoke and CLI paths depend on `contextAssembly.metadata.retrievalRunId`.
- Still valid: `dbSmokeSupport.ts` deserves a later bounded split if future DB
  smoke work keeps growing the file.

## Source To Decision

```yaml
source_id: repo-local-compiler-smoke-boundary-audit
source: Beads issue mise-en-palace-fjxt plus current compileHarnessPlan/dbSmokeSupport code
mechanism: compiler output depends on a retrieval-run/context-assembly contract that DB smokes and Codex brief readbacks consume through persisted metadata and activation decisions.
krn_implication: before deleting or splitting compiler/smoke support code, KRN needs a small executable characterization of the live contract.
decision_kind: adopt
decision: add one focused compiler test and one report; defer runtime refactor until the characterized contract is protected.
consumer: @krn/harness compiler tests, DB smokes, run readback, Codex adapter smoke
falsifier: a future compiler change can create a context assembly without a retrievalRunId, decisions without contextAssemblyId, or a completed retrieval run with wrong counts while tests still pass.
```

## Proof

- `rtk pnpm --filter @krn/harness test -- compiler/index`
- `rtk pnpm -C packages/harness typecheck`
- `rtk proxy pnpm typecheck`
- `rtk pnpm test`
- `rtk pnpm quality:fallow:ci`
- `rtk pnpm eval:brain-battle:smoke`
- `rtk git diff --check`

## Non-Proof

- This does not split `dbSmokeSupport.ts`.
- This does not simplify `compileHarnessPlan`.
- This does not prove DB runtime behavior; it uses harness fakes.
- This does not change activation ranking, filtering, source authority, memory
  governance, Codex brief rendering, or DB schema.
- This does not prove all smoke cleanup/count helpers are minimal or correctly
  factored.

## Next Bounded Split

If `dbSmokeSupport.ts` is touched again, split by responsibility instead of by
vibe:

```txt
dbSmokeRuntime.ts       -> readiness, client/db construction, marker runtime
dbSmokeScaffold.ts      -> workspace/project/task/harness/context seed helpers
dbSmokeMarkerRows.ts    -> marker counts and optional context-selection counts
dbSmokeCleanup.ts       -> cleanup task builders and per-smoke cleanup helpers
```

Do not move helpers across package boundaries unless a live consumer requires it.

## Second-Opinion Prompt

Review the current diff after
`docs/runs/2026-07-02-compiler-smoke-boundary-characterization.md`.

Act as a ruthless senior reviewer. Inspect whether the new compiler
characterization test proves a real product contract or just codifies current
implementation trivia. Verify that it protects the retrieval-run/context-assembly
contract consumed by DB smokes, Codex adapter smoke, and run readbacks. Challenge
the claim that `compileHarnessPlan` should not be flattened now: identify any
remaining orchestration seams that still deserve simplification. Inspect
`packages/db/src/dbSmokeSupport.ts` and decide whether the proposed future split
is the right boundary or whether a smaller deletion/inlining move would be
better. Find any stale audit claim that remains uncorrected, any missing proof
command, and the next bounded slice with exact files, risks, verification
commands, and non-goals.
