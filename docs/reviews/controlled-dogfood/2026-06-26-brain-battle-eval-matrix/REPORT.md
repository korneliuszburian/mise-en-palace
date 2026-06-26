# Brain Battle Eval Matrix And Guarded Eval Harness Report

Status: V02-02 completion report.

Date: 2026-06-26

## Executive Verdict

V02-02 is complete as a bounded eval hardening slice. KRN now has a compact
brain-battle eval matrix and one new deterministic GoldenGate behavior guard
for target read-model trust exclusions. This does not complete V02-01, does not
prove product readiness, and does not create a broad eval platform.

## Read

- `PLAN.md`
- `GOAL.md`
- `package.json`
- `tests/fixtures/promptfoo/`
- `tests/fixtures/golden-tasks/`
- `packages/harness/src/goldenRunner.ts`
- `packages/harness/src/goldenKrnBehaviorGate.ts`
- `packages/harness/src/goldenKrnBehaviorGate.test.ts`
- `packages/harness/src/activation/ownerFileRecall.ts`
- `docs/architecture/promptfoo-adapter-boundary.md`
- `docs/architecture/golden-task-promotion.md`
- `docs/runbooks/second-operator-alpha-trial.md`
- `docs/reviews/controlled-dogfood/2026-06-25-target-activation-read-model/REPORT.md`
- `docs/reviews/controlled-dogfood/2026-06-25-promptfoo-adapter-boundary/REPORT.md`
- `docs/reviews/controlled-dogfood/2026-06-25-run-evidence-readback/REPORT.md`

## Changed

- Added `docs/architecture/brain-battle-eval-matrix.md`.
- Added `eval:brain-battle:smoke` root script.
- Extended `packages/harness/src/goldenKrnBehaviorGate.ts` with a target
  read-model trust exclusion behavior proof.
- Extended `packages/harness/src/goldenKrnBehaviorGate.test.ts` to require the
  new proof.
- Updated `PLAN.md` to mark V02-01 as blocked/deferred and add V02-02.
- Updated `GOAL.md` to record V02-02 completion while preserving the V02-01
  blocker.

## DB Used

No.

This slice used deterministic local tests and Promptfoo adapter smoke. It did
not require live DB readback.

## Commands Run

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `git status --short --branch` | passed, clean before edits except an operator-provided `PLAN.md` packet was present and corrected | Established current worktree state before edits. | Does not prove roadmap completion. |
| `pnpm eval:brain-battle:smoke` | passed, harness GoldenGate tests passed | The new bounded script runs and the target trust exclusion behavior proof passes through real KRN GoldenGate behavior. | Does not prove broad eval quality or product readiness. |
| `pnpm typecheck` | passed via `rtk proxy pnpm typecheck` | Workspace TypeScript compiles after the source change. | Does not prove runtime DB behavior. |
| `pnpm test` | passed | Workspace tests pass, including harness GoldenGate behavior tests. | Does not prove external operator usability. |
| `pnpm eval:promptfoo:smoke` | passed, 2/2 | Promptfoo adapter/config/provider/output path still works. | Does not execute KRN behavior and is not GoldenTask behavior proof. |
| `git diff --check` | passed | Diff has no whitespace errors. | Does not prove behavior correctness. |
| `git status --short --branch` | dirty before commit, expected changed files only | Confirms pending V02-02 changes before commit. | Does not prove remote push or clean final state. |

## Artifact / Report

- Matrix: `docs/architecture/brain-battle-eval-matrix.md`
- Report: `docs/reviews/controlled-dogfood/2026-06-26-brain-battle-eval-matrix/REPORT.md`
- Guard: `pnpm eval:brain-battle:smoke`

## What This Proves

- A deterministic brain-battle smoke can run through existing project machinery.
- Target read-model source seeds and trust exclusions are protected by a real
  KRN behavior proof.
- The guard fails if target planning leaks back to static KRN owner-file recall
  or omits required trust exclusion metadata.
- Promptfoo remains available as an adapter smoke without becoming behavior
  proof.

## What This Does Not Prove

- V02-01 second-operator trial completion.
- Product readiness.
- Exact owner-file recall below target source roots.
- Live DB replay for this slice.
- LLM-as-judge validity.
- Broad eval platform readiness.

## Candidates Proposed

| Candidate | Reviewability | Evidence | Does not prove |
|---|---|---|---|
| EvalCandidate: promote run readback proof/non-proof separation into a deterministic GoldenGate or CLI guard if it recurs as review burden. | defer | `docs/reviews/controlled-dogfood/2026-06-25-run-evidence-readback/REPORT.md`; matrix candidate row. | Does not prove readback UX is currently insufficient. |
| EvalCandidate: source-to-decision decorative source rejection behavior guard. | defer | `docs/architecture/brain-battle-eval-matrix.md`; security/source boundary docs. | Does not prove source selection quality. |

No MemoryRecord, SourceClaim, or final eval state was mutated.

## Next Recommended Action

Run V02-01 when the real second-operator setup exists. If V02-01 remains
blocked, the next bounded local repair should be a deterministic run-readback
proof/non-proof guard only if another dogfood shows the same review burden.
