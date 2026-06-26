# Run Readback And Source Rejection Guard Expansion Report

Status: V02-03 completion report.

Date: 2026-06-26

## Executive Verdict

V02-03 expanded the bounded brain-battle smoke without creating a broad eval
platform. `eval:brain-battle:smoke` now covers both source-to-decision
decorative source rejection and run readback proof-vs-non-proof separation.

This does not complete V02-01 and does not prove product readiness.

## Read

- `PLAN.md`
- `GOAL.md`
- `docs/architecture/brain-battle-eval-matrix.md`
- `packages/harness/src/goldenKrnBehaviorGate.ts`
- `packages/harness/src/goldenKrnBehaviorGate.test.ts`
- `packages/cli/src/runRunShowCommand.ts`
- `packages/cli/src/runRunShowCommand.test.ts`
- `packages/core/src/source.ts`
- `packages/schema/src/sourceClaim.ts`
- `packages/cli/src/runSourceClaimAddCommand.ts`
- `packages/cli/src/runSourceClaimRejectCommand.ts`
- `docs/reviews/controlled-dogfood/2026-06-25-run-evidence-readback/REPORT.md`

## Changed

- Extended `packages/harness/src/goldenKrnBehaviorGate.ts` with a decorative
  source rejection behavior proof using `assessSourceClaimReviewSignals`.
- Added `golden-case-source-decorative-rejection-001-a` to the GoldenGate test.
- Strengthened `packages/cli/src/runRunShowCommand.test.ts` so run readback
  proof claims cannot include command execution, memory quality, source truth,
  review correctness, product readiness, or Memory Core mutation.
- Updated `eval:brain-battle:smoke` to run both harness GoldenGate and CLI
  readback guards.
- Updated `docs/architecture/brain-battle-eval-matrix.md`.
- Updated `PLAN.md` and `GOAL.md` compactly.

## DB Used

No.

This slice used deterministic local tests only. Current-shell DB readback was
not used, so live DB truth for this slice remains unverified.

## Commands Run

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `git fetch --prune` | passed | Local remote refs were refreshed before work. | Does not prove CI status for this commit. |
| `git status --short --branch` | passed, clean before edits | Work started from clean `main...origin/main`. | Does not prove V02-03 behavior. |
| `pnpm eval:brain-battle:smoke` | passed | Harness GoldenGate and CLI run readback deterministic guards pass. | Does not prove product readiness, live DB readback, or external operator usability. |
| `pnpm typecheck` | passed | Workspace TypeScript compiles after the guard changes. | Does not prove runtime DB behavior. |
| `pnpm test` | passed | Full workspace tests pass after the guard changes. | Does not prove V02-01 or product readiness. |
| `pnpm eval:promptfoo:smoke` | passed, 2/2 | Promptfoo adapter smoke still runs after the brain-battle smoke expansion. | Does not execute KRN behavior. |
| `git diff --check` | passed | Diff has no whitespace errors. | Does not prove behavior correctness. |

## Artifact / Report

- Matrix: `docs/architecture/brain-battle-eval-matrix.md`
- Report: `docs/reviews/controlled-dogfood/2026-06-26-run-readback-source-rejection-guards/REPORT.md`
- Guard: `pnpm eval:brain-battle:smoke`

## What This Proves

- The existing source review signal path blocks decorative source retention when
  source-to-decision fields and decision-grade support are missing.
- Run readback JSON keeps proof claims separate from non-proof boundaries.
- The bounded brain-battle smoke now runs both behavior families.

## What This Does Not Prove

- V02-01 second-operator proof.
- Product readiness.
- Live DB readback for this slice.
- Source selection quality.
- That every decorative source is caught before human review.
- That readback UX is sufficient for all operators.

## Candidates Proposed

| Candidate | Reviewability | Evidence | Does not prove |
|---|---|---|---|
| EvalCandidate: keep source decorative rejection in `eval:brain-battle:smoke`. | ready | GoldenGate source rejection proof. | Does not prove source selection quality. |
| EvalCandidate: keep run readback proof/non-proof separation in `eval:brain-battle:smoke`. | ready | CLI readback JSON guard. | Does not prove live DB readback. |

No MemoryRecord, SourceClaim, SourceDecision, or final eval state was mutated.

## Next Recommended Action

Continue to `V02-04 — Memory Feedback And Anti-Memory Guard Expansion` after
full verification, commit, push, and CI confirmation for V02-03.
