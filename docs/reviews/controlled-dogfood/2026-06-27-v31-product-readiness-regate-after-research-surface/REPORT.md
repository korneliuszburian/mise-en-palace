# V31 Product Readiness Re-Gate After Research And Surface Hygiene

Status: complete.

Date: 2026-06-27.

Mode: readiness re-gate.

## Executive Verdict

KRN remains:

```txt
controlled-internal-alpha for technical operators: yes / stronger
product-ready: no
widened internal alpha: no
V02-01 real second-operator proof: blocked/deferred
```

V27 through V30 closed a useful loop:

- V27 re-gated after real target observation-only repairs.
- V28 proved research-to-brain can produce decisions and rejections without a
  research subsystem.
- V29 applied the TypeScript half of that research to current code and found no
  repair candidate.
- V30 applied the Codex surface half and repaired root `PLAN.md` context-budget
  drift.

The next product move should not be another meta-surface pass. The next highest
ROI task is a controlled target repair trial with explicit allowed writes,
rollback, target verification, KRN evidence, and no product-ready/V02-01
overclaim.

## Evidence Reviewed

| Slice | Evidence | Verdict |
|---|---|---|
| V27 | `docs/reviews/controlled-dogfood/2026-06-27-v27-controlled-internal-alpha-regate/REPORT.md` | Target observation-only loop is stronger but not product-ready. |
| V28 | `docs/reviews/controlled-dogfood/2026-06-27-v28-research-to-brain-typescript-codex/REPORT.md` | Source-to-decision works as a strict decision filter, not a Research Foundry. |
| V29 | `docs/reviews/controlled-dogfood/2026-06-27-v29-typescript-boundary-research-application/REPORT.md` | High-risk TypeScript boundary patterns are currently under control in `packages`. |
| V30 | `docs/reviews/controlled-dogfood/2026-06-27-v30-codex-surface-context-budget/REPORT.md` | Codex surfaces are compact again; root `PLAN.md` no longer carries stale V28 detail. |
| CI | `faf8ee1` / run `28288615158` | DB readiness/smoke and typecheck/test/promptfoo smoke/diff passed. |

## What Is Now Strong

- Current-shell DB-backed CLI flows have recent proof.
- Observation-only target evidence and write boundaries are clearer.
- Explicit target owner-file input and owner-file priority have real target
  evidence.
- CLI target/evidence ergonomics are better.
- Research-to-brain has a strict source -> decision -> falsifier lane.
- TypeScript boundary checks did not expose high-confidence drift.
- Codex instruction surfaces are cleaner: `PLAN.md` is compact, `PLANS.md`
  owns detailed execution, and `AGENTS.md` stays small.

## What Remains Unproved

- Product readiness.
- Widened internal alpha readiness.
- V02-01 real second-operator usability.
- A controlled target repair where KRN is allowed to change a target repo under
  explicit scope and rollback.
- Target runtime correctness beyond observation-only commands.
- Broad activation quality outside explicit owner-file/read-model cases.
- Reflection/candidate usefulness at product scale.

## Readiness Decision

```txt
controlled-internal-alpha for technical operators: yes / stronger
widened internal alpha: no
product-ready: no
V02-01: blocked/deferred until real second-operator inputs exist
```

Reason:

KRN has enough internal evidence to move from observation-only target loops to a
strictly controlled target repair trial. It does not have evidence that a
second operator can run it unaided, nor evidence that arbitrary target repairs
are safe or useful.

## Next Recommended Task

Promote exactly one task:

```txt
V32 — Controlled Target Repair Trial
```

Goal:

Run one bounded KRN-guided repair against a safe target checkout with explicit
allowed files, forbidden files, pre/post dirty state, rollback, target commands,
KRN plan/evidence/readback, and a report.

Why:

The last real target loops were observation-only. The next product question is
whether KRN can help with a real target change while preserving scope,
evidence, and rollback. This tests product utility more directly than another
research/context hygiene pass.

Strict boundaries:

- do not use this as V02-01 second-operator proof;
- do not claim product readiness;
- do not write to a living target unless the task records allowed files,
  forbidden files, rollback, and pre/post status;
- if no safe target exists, write the blocker and stop the trial rather than
  substituting another meta task;
- prefer a small branch/working-tree change over target commits;
- no target `git reset`, `git clean`, or destructive cleanup;
- no broad target refactor.

## Rejected Next Actions

| Candidate | Decision | Reason |
|---|---|---|
| Another research/source pass | reject for now | V28-V30 already closed the research/context hygiene loop. |
| Activation scoring rewrite | reject for now | Recent target evidence points to owner-file/read-model progress, not broad scoring failure. |
| Dashboard/API/MCP/worker runtime | reject | No V27-V30 evidence requires these surfaces. |
| V02-01 real operator proof | blocked/deferred | Required real second-operator inputs/transcript are still missing. |
| Product-ready claim | reject | No second-operator or target repair evidence. |

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk git fetch --prune` | passed | Remote refs refreshed before V31. | Does not prove future CI. |
| `rtk git status --short --branch` | passed, clean, `main...origin/main` | V31 started from clean synced state. | Does not prove readiness. |
| `rtk git log --oneline -n 8` | passed | Latest local history started at `faf8ee1`. | Does not prove product value. |
| `rtk gh run list --branch main --limit 5` | passed | Latest visible CI before V31 was green. | Does not prove V31 commit CI. |

## Product Boundary

V31 is a decision gate. It does not change KRN source behavior, target behavior,
or Memory Core. It only selects the next product proof.

## Final Decision

Promote V32 controlled target repair trial.
