# Codex Brief And Context ROI Guard Expansion Report

Status: V02-05 completion report.

Date: 2026-06-26

## Executive Verdict

V02-05 promotes Codex brief and ContextROI discipline into the bounded
brain-battle smoke. The smoke now protects the Codex-facing execution contract
and the context packet boundary without rewriting activation scoring or adding a
new eval platform.

This does not prove Codex follows the brief, product readiness, or optimal
context scoring for every target repo.

## Read

- `PLAN.md`
- `GOAL.md`
- `docs/KRN_KERNEL.md`
- `docs/architecture/brain-battle-eval-matrix.md`
- `.agents/skills/codex-adapter-plan/SKILL.md`
- `.agents/skills/activation-engine/SKILL.md`
- `packages/codex-adapter/src/renderExecutionBrief.ts`
- `packages/codex-adapter/src/renderExecutionBrief.test.ts`
- `packages/codex-adapter/src/codexBriefGoldenBehavior.test.ts`
- `packages/harness/src/goldenKrnBehaviorGate.ts`
- `packages/harness/src/goldenKrnBehaviorGate.test.ts`
- `packages/harness/src/activation/contextRoi.ts`
- `packages/harness/src/activation/assembleContext.ts`
- `packages/harness/src/activation/index.test.ts`
- `packages/harness/src/goldenBoundaryBehavior.test.ts`
- `docs/reviews/controlled-dogfood/2026-06-25-codex-brief-contract-hardening/REPORT.md`

## Changed

- Added Codex adapter golden behavior to `eval:brain-battle:smoke`.
- Tightened Codex brief golden assertions so the proof covers inclusion reason,
  `expected_use`, explicit exclusion reason/explanation, rollback path,
  rollback expectation, stop condition, and proof boundaries.
- Added a GoldenGate ContextROI behavior proof that keeps one selected context
  item with `expectedUse` and records extra candidates as explicit
  `over_budget` exclusions.
- Updated the brain-battle eval matrix and active root plan state.

## DB Used

No.

This slice used deterministic local tests. Live DB readback was not needed for
the Codex brief / ContextROI guard expansion.

## Commands Run

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `git fetch --prune` | passed | Local remote refs were refreshed before starting V02-05. | Does not prove CI status for this commit. |
| `git status --short --branch` | passed, clean before edits | Work started from clean `main...origin/main`. | Does not prove behavior correctness. |
| `pnpm eval:brain-battle:smoke` | passed | Harness GoldenGate, CLI readback/memory feedback guards, and Codex brief golden behavior pass. | Does not prove Codex follows the brief or product readiness. |
| `pnpm typecheck` | passed | Workspace TypeScript compiles after the guard changes. | Does not prove runtime behavior. |
| `pnpm test` | passed | Full workspace tests pass after the guard changes. | Does not prove V02-01 or product readiness. |
| `pnpm eval:promptfoo:smoke` | passed, 2/2 | Promptfoo adapter smoke still runs after the brain-battle smoke expansion. | Does not execute KRN behavior. |
| `git diff --check` | passed | Diff has no whitespace errors. | Does not prove behavior correctness. |

## Artifact / Report

- Matrix: `docs/architecture/brain-battle-eval-matrix.md`
- Report: `docs/reviews/controlled-dogfood/2026-06-26-codex-brief-context-roi-guards/REPORT.md`
- Guard: `pnpm eval:brain-battle:smoke`

## What This Proves

- Codex brief rendering keeps selected context reason and expected use visible.
- Codex brief rendering keeps explicit exclusion reason and explanation visible.
- Codex brief rendering keeps review burden, rollback, stop condition, and
  proof boundaries visible.
- ContextROI can keep a small one-item packet and preserve over-budget
  exclusions as reviewable evidence.
- These guards now run from the bounded brain-battle smoke.

## What This Does Not Prove

- V02-01 second-operator proof.
- Product readiness.
- Codex execution compliance.
- Context scoring optimality for arbitrary target repos.
- That every exclusion reason class appears in every Codex brief.

## Candidates Proposed

| Candidate | Reviewability | Evidence | Does not prove |
|---|---|---|---|
| EvalCandidate: keep Codex brief golden behavior in `eval:brain-battle:smoke`. | ready | Codex adapter golden behavior now runs from the smoke. | Does not prove Codex follows the brief. |
| EvalCandidate: keep ContextROI over-budget / expectedUse behavior in GoldenGate. | ready | GoldenGate ContextROI case executes real harness behavior. | Does not prove scoring quality across all repos. |

No MemoryRecord, AntiMemoryRecord, SourceClaim, SourceDecision, or final eval
state was mutated.

## Next Recommended Action

Continue to `V02-06 — Operator-Facing Readback / Doctor Friction Repair` after
full verification, commit, push, and CI confirmation for V02-05.
