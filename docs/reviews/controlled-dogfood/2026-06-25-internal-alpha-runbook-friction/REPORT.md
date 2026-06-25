# Internal Alpha Runbook Friction Update

Status: V02-00 completion report.

Date: 2026-06-25
Plan run: `c5f94650-53b9-43c9-87f7-a9daad827322`
Evidence bundle: `697d6e88-7561-475f-81d4-ef8d11538068`
Review assessment: `5e4d1506-60df-42be-a710-c22526904f06`
Feedback delta: `b8347e00-8f34-4fdf-8df8-28d87332e28f`
Observation group: `a6d1a45e-1087-4c59-85bd-62e729ae5e96`
Reflection record: `209fe200-82ed-499e-896d-5e7f20054fc5`
DB used: no, docs-only update.

## Executive Verdict

V02-00 is complete. The internal-alpha install runbook and alpha release note
now explain the operator friction found in V01-01:

- ignored dependency build-script warnings can be expected during install;
- `pnpm alpha:verify` may take a while because it runs typecheck, full tests,
  and preview doctor;
- `pnpm krn doctor` without `KRN_DATABASE_URL` is preview-only for DB-backed
  paths;
- DB-backed truth requires `pnpm db:ready`, `pnpm db:smoke`, or doctor with
  `KRN_DATABASE_URL`.

No source code, tag movement, npm/global install, dashboard/API/MCP/worker, or
product-ready claim was added.

## Files Changed

- `docs/runbooks/internal-alpha-install.md`
- `docs/releases/v0.1.0-alpha.0.md`

## What This Proves

- The checked-in operator docs now address the exact V01-01 friction items.
- The release note no longer leaves the stale impression that G-03 still needs
  the original pre-V01 target-evidence decision; it points to root `PLAN.md` for
  current readiness.

## What This Does Not Prove

- A real second-human operator can complete the flow unaided.
- Non-Docker DB paths work.
- A new alpha tag has been cut.
- Product readiness.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `git diff --check` | passed | Docs diff has no whitespace errors. | Does not prove operator usability. |
| `krn evidence capture --persist` | passed | EvidenceBundle/ReviewAssessment/FeedbackDelta persisted for this docs-only slice. | Does not prove docs are sufficient for a real second operator. |
| `krn observe --persist` / `krn reflect --persist` | passed | Observation/reflection records persisted without Memory mutation. | Reflection produced no findings/candidates. |

## Next Recommended Action

Run a real second-operator controlled alpha trial, or ask the operator whether
to move/create a new alpha tag from the current controlled-internal-alpha state.
