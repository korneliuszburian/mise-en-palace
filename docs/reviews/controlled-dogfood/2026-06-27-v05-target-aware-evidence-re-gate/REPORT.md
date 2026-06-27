# V05 Target-Aware Evidence Re-Gate

Status: complete stream re-gate.

Date: 2026-06-27.

## Executive Verdict

V05 materially improved target trial evidence clarity. KRN can now represent
target repo mode, dirty state, ownership, target changed files, target commands,
allowed/forbidden write boundaries, and target-specific proof/non-proof
boundaries in evidence capture and run readback. The behavior is covered by
source tests, real CLI preview, golden fixture guard, full local verification,
and remote CI.

Verdict:

```txt
V05 result: improved
controlled-internal-alpha for technical operators: stronger
product-ready: no
widened internal alpha: no
V02-01 real second-operator proof: still blocked/deferred
next stream: V06 Activation / Owner-File / Context ROI Utility
```

## Evidence Reviewed

| Evidence | Result | Boundary |
|---|---|---|
| `docs/reviews/controlled-dogfood/2026-06-27-target-aware-evidence-current-state/REPORT.md` | confirmed current code gap and minimal repair path | did not implement behavior |
| commit `a6d4ad9` / CI `28283148000` | V05-01 report and plan transition passed remote CI | did not implement target evidence |
| `docs/reviews/controlled-dogfood/2026-06-27-target-aware-evidence-capture-repair/REPORT.md` | target evidence capture/readback implemented | did not prove live DB replay |
| commit `790c176` / CI `28283408599` | source repair passed remote CI | did not prove V02-01 |
| `docs/reviews/controlled-dogfood/2026-06-27-target-aware-evidence-replay/REPORT.md` | golden guard/replay added | did not prove target correctness |
| commit `a7749e2` / CI `28283520050` | guard/replay passed remote CI | did not prove product readiness |

## What Improved

- `krn evidence capture` can accept explicit target evidence inputs.
- Target evidence is separated from KRN repo changed-file classification.
- Target evidence has default `doesNotProve` boundaries.
- Target evidence persists under `EvidenceBundle.metadata.targetEvidence`.
- `krn run show` exposes target evidence in text and JSON readback.
- Golden behavior coverage now fails if target evidence disappears from CLI
  output.
- Existing dirty-context and command provenance behavior still pass.

## What Remains Unproved

- Live DB-backed target evidence replay in a fresh scenario.
- V02-01 real second-operator usability.
- Product readiness.
- Target correctness or target write safety.
- Automatic target git status capture.
- Owner-file recall below target root source seeds.

The remaining strongest product bottleneck is no longer target evidence
representation. It is activation/context utility for exact owner-file discovery.

## Product Decision

Do not open another V05 repair now.

Move to:

```txt
V06 — Activation / Owner-File / Context ROI Utility
```

First active task:

```txt
V06-00 — Activation / Owner-File Recall Below Target Roots
```

Reason:

- V04/V05 target scenarios showed root-level target context and trust exclusions
  are useful.
- They also showed exact owner-file recall below roots remains weak or absent.
- With target evidence now clearer, the next highest ROI is reducing manual
  target source discovery and context waste.

## Verification

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `rtk proxy pnpm typecheck` | passed during V05-03 | Workspace TypeScript compiled after V05 guard changes. | Product readiness. |
| `rtk proxy pnpm test` | passed during V05-03 | Full workspace tests passed. | Target correctness. |
| `rtk proxy pnpm eval:brain-battle:smoke` | passed during V05-03 | Existing deterministic brain-battle smoke passed. | Full brain quality. |
| `rtk proxy git diff --check` | passed during V05-03 | Diff had no whitespace errors. | Semantic completeness beyond checked behavior. |
| GitHub Actions `28283520050` | passed | Pushed V05-03 passed CI with typecheck/tests/eval smoke and DB job. | Product readiness or second-operator usability. |

Final V05-04 commit must still pass CI after this report/plan update.

## Condensation Decision

```txt
finding:
  Target-aware evidence capture is now implemented and guarded enough for the
  next product stream.

frequency:
  V05 stream complete.

candidate_surface:
  V06 activation/context ROI stream.

decision:
  accept and promote V06-00.

rationale:
  Target trials can now preserve target proof boundaries; the next repeated
  limitation is exact owner-file recall and measurable context usefulness.

evidence:
  V05 reports, source repair, golden guard, CI.

does_not_prove:
  product readiness, V02-01, target correctness, or owner-file recall quality.

falsifier:
  V06-00 proves owner-file recall is already adequate and the real bottleneck is
  memory/source usefulness instead.

next_task_id:
  V06-00.
```
