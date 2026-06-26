# Memory Feedback And Anti-Memory Guard Expansion Report

Status: V02-04 completion report.

Date: 2026-06-26

## Executive Verdict

V02-04 protects the memory feedback loop from silent Memory Core mutation.
`krn memory record apply` now renders the mutation boundary explicitly, and
the brain-battle smoke includes CLI guards proving helped feedback stays
non-mutating while stale/hurt feedback creates reviewable anti-memory candidate
semantics only.

This does not complete V02-01 and does not prove memory feedback improves
future activation quality.

## Read

- `PLAN.md`
- `GOAL.md`
- `docs/KRN_KERNEL.md`
- `docs/architecture/brain-battle-eval-matrix.md`
- `packages/cli/src/runMemoryRecordApplyCommand.ts`
- `packages/cli/src/runCli.test.ts`
- `packages/harness/src/goldenKrnBehaviorGate.ts`
- `packages/harness/src/goldenKrnBehaviorGate.test.ts`
- `packages/harness/src/activation/goldenMemoryBehavior.test.ts`
- `packages/harness/src/memory/antiMemoryReviewGate.ts`
- `packages/harness/src/memory/antiMemoryReviewGate.test.ts`
- `docs/reviews/controlled-dogfood/2026-06-25-memory-feedback-demotion-loop/REPORT.md`
- `docs/reviews/controlled-dogfood/2026-06-25-anti-memory-conflict-integration/REPORT.md`

## Changed

- Added explicit `Memory Core mutation: none` output to memory record apply
  preview and persisted output.
- Strengthened CLI guards so helped memory application proves no feedback event
  and no follow-up candidate are created.
- Expanded the negative feedback guard to cover both `stale` and `hurt`
  outcomes.
- Guarded stale/hurt behavior so feedback creates a negative feedback event and
  reviewable anti-memory candidate semantics without direct Memory Core
  mutation.
- Included `runCli` memory feedback guards in `eval:brain-battle:smoke`.
- Updated the brain-battle eval matrix and active root plan state.

## DB Used

No.

This slice used deterministic local tests. Live DB mutation/readback was not
used, so current-shell DB truth for memory feedback persistence remains outside
this report.

## Commands Run

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `git fetch --prune` | passed | Local remote refs were refreshed before continuing. | Does not prove CI status for this commit. |
| `git status --short --branch` | passed, dirty with V02-04 edits | Worktree contained only the active V02-04 source/doc edits. | Does not prove behavior correctness. |
| `pnpm eval:brain-battle:smoke` | passed | GoldenGate, run readback, and CLI memory feedback deterministic guards pass. | Does not prove product readiness or live DB behavior. |
| `pnpm typecheck` | passed | Workspace TypeScript compiles after the guard changes. | Does not prove runtime DB behavior. |
| `pnpm test` | passed | Full workspace tests pass after the guard changes. | Does not prove V02-01 or product readiness. |
| `pnpm eval:promptfoo:smoke` | passed, 2/2 | Promptfoo adapter smoke still runs after the brain-battle smoke expansion. | Does not execute KRN behavior. |
| `git diff --check` | passed | Diff has no whitespace errors. | Does not prove behavior correctness. |

## Artifact / Report

- Matrix: `docs/architecture/brain-battle-eval-matrix.md`
- Report: `docs/reviews/controlled-dogfood/2026-06-26-memory-anti-memory-guards/REPORT.md`
- Guard: `pnpm eval:brain-battle:smoke`

## What This Proves

- Helped memory application output remains explicit about no Memory Core
  mutation and no follow-up candidate.
- Stale and hurt memory application feedback with lineage creates negative
  feedback and reviewable anti-memory candidate semantics only.
- The anti-memory activation guard still proves reviewed anti-memory can block a
  tempting stale pattern.
- The brain-battle smoke now includes memory feedback CLI guards.

## What This Does Not Prove

- V02-01 second-operator proof.
- Product readiness.
- Live DB readback for this slice.
- That feedback consistently improves future activation.
- That all stale or harmful memories are detected automatically.
- That anti-memory coverage is complete for every unsafe claim class.

## Candidates Proposed

| Candidate | Reviewability | Evidence | Does not prove |
|---|---|---|---|
| EvalCandidate: keep helped/stale/hurt memory record apply behavior in `eval:brain-battle:smoke`. | ready | CLI memory record apply guards now run from brain-battle smoke. | Does not prove feedback quality at scale. |
| MemoryCandidate: memory feedback must never mutate Memory Core directly; it can create reviewable anti-memory candidates. | needs_more_evidence | CLI behavior and previous memory feedback reports support the rule. | Does not prove every future feedback path obeys the rule without additional guards. |

No MemoryRecord, AntiMemoryRecord, SourceClaim, SourceDecision, or final eval
state was mutated.

## Next Recommended Action

Continue to `V02-05 — Codex Brief And Context ROI Guard Expansion` after full
verification, commit, push, and CI confirmation for V02-04.
