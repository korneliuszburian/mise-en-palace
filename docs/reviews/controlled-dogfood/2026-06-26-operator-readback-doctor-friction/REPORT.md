# Operator Readback / Doctor Friction Repair Report

Status: V02-06 completion report.

Date: 2026-06-26

## Executive Verdict

V02-06 reduced a concrete operator-facing ambiguity: `krn run show` previously
failed without `KRN_DATABASE_URL` but did not tell the operator how to unblock
readback or what DB configuration still would not prove. The command and help
now make the persisted-run / DB prerequisite explicit without changing
persistence, packaging, or doctor readiness semantics.

This does not complete V02-01 and does not prove live DB readback for this
slice.

## Read

- `PLAN.md`
- `GOAL.md`
- `docs/KRN_KERNEL.md`
- `packages/cli/src/runRunShowCommand.ts`
- `packages/cli/src/parseRunArgs.ts`
- `packages/cli/src/runCli.ts`
- `packages/cli/src/runCli.test.ts`
- `packages/cli/src/runDoctorCommand.ts`
- `packages/cli/src/doctorReadiness.ts`
- `packages/cli/src/runRunShowCommand.test.ts`
- `README.md`

## Changed

- Added a missing-DB operator message for `krn run show`:
  - required `KRN_DATABASE_URL`;
  - next action with local DB URL and `pnpm db:ready`;
  - proof boundary explaining what DB config does not prove.
- Updated `krn run --help` to state that run show requires
  `KRN_DATABASE_URL`, a persisted execution run, and DB verification first.
- Added CLI tests for the run show help and missing DB path.
- Left doctor readiness behavior unchanged because current doctor output already
  reports preview-only DB-dependent readiness and explicit smoke commands.

## DB Used

No.

This slice repaired no-DB operator guidance. Live DB readback was not used, so
runtime DB truth remains outside this report.

## Commands Run

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `git fetch --prune` | passed | Local remote refs were refreshed before starting V02-06. | Does not prove CI status for this commit. |
| `git status --short --branch` | passed, clean before edits | Work started from clean `main...origin/main`. | Does not prove behavior correctness. |
| `pnpm --filter @krn/cli test -- runCli runRunShowCommand parseRunArgs` | passed | CLI run show help, missing DB guidance, and existing run readback tests pass. | Does not prove live DB readback. |
| `pnpm typecheck` | passed | Workspace TypeScript compiles after the CLI output changes. | Does not prove runtime behavior. |
| `pnpm test` | passed | Full workspace tests pass after the CLI output changes. | Does not prove V02-01 or product readiness. |
| `pnpm eval:brain-battle:smoke` | passed | Brain-battle smoke remains green after the CLI guidance change. | Does not prove live DB behavior. |
| `pnpm eval:promptfoo:smoke` | passed, 2/2 | Promptfoo adapter smoke still runs. | Does not execute KRN behavior. |
| `git diff --check` | passed | Diff has no whitespace errors. | Does not prove behavior correctness. |

## Artifact / Report

- Report: `docs/reviews/controlled-dogfood/2026-06-26-operator-readback-doctor-friction/REPORT.md`
- Guard: `pnpm --filter @krn/cli test -- runCli runRunShowCommand parseRunArgs`

## What This Proves

- `krn run --help` now names the DB/persisted-run prerequisite.
- `krn run show` without DB config now gives the operator a next action instead
  of a bare missing-env error.
- The missing-DB message preserves proof boundaries instead of implying DB
  config proves the requested run or command evidence.
- The change does not alter readback mutation semantics.

## What This Does Not Prove

- V02-01 second-operator proof.
- Product readiness.
- Live DB readback for this slice.
- That all operator friction is resolved.
- That the requested run exists after setting `KRN_DATABASE_URL`.

## Candidates Proposed

| Candidate | Reviewability | Evidence | Does not prove |
|---|---|---|---|
| MemoryCandidate: operator readback commands should include next action and does-not-prove when blocked by missing DB config. | ready | `krn run show` missing DB guidance and CLI tests. | Does not prove every DB-backed command has equivalent guidance. |

No MemoryRecord, AntiMemoryRecord, SourceClaim, SourceDecision, or final eval
state was mutated.

## Next Recommended Action

Continue to `V02-07 — Target Battle Trial Packet Refresh` after full
verification, commit, push, and CI confirmation for V02-06.
