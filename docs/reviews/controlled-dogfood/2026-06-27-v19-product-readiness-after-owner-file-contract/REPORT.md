# V19 Product Readiness Re-Gate After Owner-File Contract

Status: readiness gate.

Date: 2026-06-27.

## Executive Verdict

V17 and V18 materially strengthen KRN as a controlled-internal-alpha tool for
technical operators, but they do not unlock widened internal alpha, V02-01, or
product-ready claims.

Current verdict:

```txt
controlled-internal-alpha for technical operators: yes / stronger
widened internal alpha: no / ready to attempt only with real operator inputs
product-ready: no
V02-01 real second-operator proof: blocked/deferred
next stream: V20 Real Target Observation-Only Owner-File Trial
```

The owner-file blocker is no longer the immediate reason to avoid target trials.
KRN now has an explicit owner-file input contract, target evidence boundaries,
DB-backed run/evidence/readback, and a target fixture proof that owner-file-heavy
tasks can select exact owner files.

The remaining blocker is no longer another local fixture. The next proof should
use a real target checkout in observation-only mode, with explicit owner files
when known. This still will not satisfy V02-01 unless a real second operator
runs or directs the trial.

## Scope

Reviewed:

- V11 readiness report;
- V12 second-operator alpha packet;
- V17 owner-file init contract report;
- V18 target owner-file contract application report;
- current `GOAL.md`, `PLAN.md`, and `PLANS.md`;
- current remote CI status on `main`.

Non-goals:

- no target repo writes;
- no new product surface;
- no V02-01 substitution;
- no source crawler;
- no activation scoring rewrite;
- no dashboard/API/MCP/worker runtime;
- no product-ready claim.

## Evidence Table

| Evidence | Product Impact | What It Does Not Prove |
|---|---|---|
| V11 readiness gate | KRN was already controlled-internal-alpha for technical operators, with widened alpha and product-ready rejected. | Does not include V17/V18 owner-file contract repairs. |
| V12 second-operator packet | Real operator / widened-alpha trial packet exists with intake, support boundary, transcript schema, failure taxonomy, and owner-file fields. | Does not prove any non-author operator used it. |
| V17 owner-file contract | `krn init --owner-file "path|root|kind|reason"` gives operators a first-class path for exact target owner files. | Does not prove owner files are complete, correct, or usable by a non-author. |
| V18 target fixture application | DB-backed target fixture flow saw `ownerFiles=2`; owner-file-heavy task selected `tests/readiness.test.ts` first. | Does not prove arbitrary external target behavior. |
| V18 friction repair | `krn init --dry-run` now preserves `--owner-file` flags in `Next command`. | Does not prove operator comprehension or real target success. |
| CI `28286177732` | Latest remote CI passed typecheck, tests, Promptfoo smoke, DB readiness, Drizzle check, DB smoke, and diff check. | Does not prove product readiness or real operator usability. |

## Readiness Decision

### Controlled-Internal-Alpha For Technical Operators

Verdict: yes / stronger.

Why:

- KRN can run DB-backed plan/evidence/observe/reflect loops.
- Target evidence records mode, dirty state, command proof, and does-not-prove
  boundaries.
- Exact target owner files are explicit operator inputs, not fixture lore.
- Owner-file-heavy target fixture planning selected the exact owner file first.
- Dry-run handoff friction for owner-file connect commands is fixed.
- Current CI is green after the V18 repair.

Boundary:

This remains for technical operators who can read runbooks, understand target
proof boundaries, provide owner-file inputs, and avoid overclaiming local
fixture evidence.

### Widened Internal Alpha

Verdict: no / ready to attempt only with real operator inputs.

Why:

- V12 gives the packet.
- V17/V18 remove a key target owner-file contract blocker.
- But no non-author or delegated technical operator transcript exists.
- No real target observation-only or writable trial has been completed after
  the owner-file contract repair.

Required evidence:

```txt
operator:
KRN source:
real target repo:
target repo mode:
DB mode:
support boundary:
target owner files:
bounded target task:
commands:
transcript:
support used:
verdict:
```

### Product-Ready

Verdict: no.

Why:

- Product readiness requires repeated real target and operator evidence.
- Activation quality is only proven for controlled fixtures and owner-file-heavy
  target tasks.
- Reflection/candidate quality remains useful but not product-quality at scale.
- No install/distribution, API/dashboard, or broader operator UX proof exists.

## Remaining Blockers

| Blocker | Status | Evidence | Next Proof Needed |
|---|---|---|---|
| Real target evidence after owner-file contract | missing | V18 used checked-in target fixture only. | Observation-only real target trial with explicit owner files and target evidence. |
| V02-01 second operator | blocked/deferred | V12 packet exists; no operator transcript exists. | Real operator transcript and support classification. |
| Widened internal alpha | not proven | V17/V18 strengthen readiness but are still local/fixture proof. | Non-author or delegated operator run. |
| Product readiness | not ready | No repeated external target/operator evidence. | Multiple successful target/operator runs and support boundaries. |
| Owner-file quality on arbitrary repos | unproven | V18 proves exact selection when owner files are provided in fixture. | Real target owner-file inputs and selected/used/helped/missing review. |

## What Not To Build Next

Do not build next:

- dashboard;
- API server;
- KRN MCP server;
- worker daemon;
- new subagent framework;
- hook runtime;
- source crawler;
- broad eval platform;
- `krn audit`;
- anti-slop scanner;
- another checked-in fixture substitute.

These do not address the current missing proof. The next useful evidence is real
target behavior with no target writes unless explicitly scoped.

## Next Recommended Stream

Move to:

```txt
V20 — Real Target Observation-Only Owner-File Trial
```

First task:

```txt
V20-00 — Real Target Observation-Only Owner-File Trial
```

Objective:

Use a real target checkout, not a checked-in fixture, in observation-only mode.
Provide explicit owner files if they are known, run project-scoped KRN
init/plan/evidence, and decide whether the next blocker is real target
selection, operator friction, owner-file quality, activation selection, or a
specific KRN repair.

Rules:

- Do not write target files.
- Do not call this V02-01.
- Do not call this widened alpha.
- Do not commit target repo changes.
- Do not invent a source crawler.
- If no safe real target exists, record that as the blocker instead of using
  another fixture.

## Command Evidence

| Command | Result | What It Proves | What It Does Not Prove |
|---|---|---|---|
| `rtk git fetch --prune && rtk git status --short --branch && rtk git log --oneline -n 8` | passed | Local `main` was clean and aligned with `origin/main`; latest commits include V17/V18. | Does not prove readiness. |
| `rtk gh run list --branch main --limit 5` | passed | Latest listed CI runs are green through `28286177732`. | Does not prove product behavior or operator usability. |
| `rtk sed ... V11/V12/V17/V18` | passed | Readiness gate inspected current readiness and owner-file evidence. | Does not prove a real target or real operator trial happened. |
| `rtk git diff --check` | passed | Proves this docs diff has no whitespace errors. | Does not prove readiness. |

## Condensation Decision

```txt
finding:
  V17/V18 removed the explicit owner-file contract blocker, but only through
  local/fixture evidence.

frequency:
  repeated readiness blocker since V11: product evidence lacks real target /
  real operator proof.

candidate_surface:
  real target observation-only trial.

decision:
  accept V20-00.

rationale:
  The next highest-ROI evidence is a real target checkout with no writes, not
  another fixture or architecture surface.

evidence:
  V11, V12, V17, V18, current green CI.

does_not_prove:
  V02-01, widened alpha, product readiness.

falsifier:
  V20 cannot identify a safe real target checkout; then the blocker becomes
  target selection/intake, not KRN source behavior.

next_task_id:
  V20-00.
```
