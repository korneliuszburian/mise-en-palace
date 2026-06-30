# V378 Second-Operator Launch Packet

Status: complete packet preparation, not V02-01 proof.
Date: 2026-06-30.

## Verdict

V378 prepared a current second-operator launch packet without claiming that a
second-operator trial happened.

Artifact:

```txt
docs/operator-trials/v02-01-second-operator-launch-packet.md
```

V02-01 remains blocked/deferred until real operator inputs and transcript exist.

## Source To Decision

```txt
source: docs/runbooks/second-operator-alpha-trial.md
mechanism: real-second-operator mode requires a real non-author operator,
  structured transcript, support classification, and proof/non-proof boundary.
KRN implication: the launch packet must make missing inputs explicit and reject
  self/headless substitution.
decision: retain the runbook as supporting detail and produce a current packet
  under docs/operator-trials/.
consumer: V02-01 operator handoff.
falsifier: the packet claims V02-01 completion, allows fake transcript, or
  requires hidden author context.
does_not_prove: operator usability until a real operator runs it.

source: docs/runbooks/target-repo-testing.md
mechanism: target work must classify mode, dirty state, write authority,
  patch lifecycle, evidence, and handoff boundaries.
KRN implication: the launch packet must default to observation-only unless
  target writes are explicitly scoped.
decision: adopt the target-mode boundary inside the launch packet.
consumer: V02-01 target repo preflight.
falsifier: the packet permits target writes without explicit write authority.
does_not_prove: arbitrary target write safety.
```

## What Changed

- Added a current V02-01 launch packet under `docs/operator-trials/`.
- Preserved the real-operator boundary.
- Made missing inputs explicit stop conditions.
- Added transcript schema, support labels, DB mode, target dirty-state
  preflight, KRN flow, evidence flow, and verdict labels.
- Did not build UI, API, MCP, dashboard, worker daemon, crawler, DB schema, or
  product server.

## What This Proves

- KRN has a current operator-facing packet for the next V02-01 attempt.
- The packet names required inputs, setup steps, support boundary, target
  preflight, transcript fields, success labels, stop conditions, and
  proof/non-proof boundaries.
- Missing second-operator inputs remain explicit blockers.

## What This Does Not Prove

- A second operator ran the trial.
- The packet is usable in practice.
- DB setup works on another machine.
- Target repo planning succeeds for another operator.
- Product readiness or widened internal alpha.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/harness test -- activePlanInvariants` | passed | Root active-state invariants remain consistent after packet and PLANS condensation. | Packet usability. |
| `git diff --check` | passed | Diff has no whitespace errors. | Packet usability or V02-01 completion. |
| `pnpm quality:fallow:ci` | passed | Fallow found no issues in changed files. | Absence of all quality issues. |
| `pnpm db:ready` | passed | Local Postgres is reachable, 14/14 migrations are applied, and pgvector is available. | CI DB state, another-machine DB setup, or V02-01 completion. |
| `krn plan --persist` | passed | V378 execution run and context assembly were persisted. | Selected context sufficiency or second-operator proof. |
| `krn evidence capture --persist` | passed | EvidenceBundle, ReviewAssessment, and FeedbackDelta were persisted with all changed files classified as intended. | Packet usability or V02-01 completion. |
| `krn observe --persist` | passed | Observation group with 5 items was persisted without Memory Core mutation. | Reflection usefulness or memory quality. |
| `krn reflect --persist` | passed | Reflection selected 5 observations and persisted without candidate rows or Memory Core mutation. | Useful extraction, candidate quality, or product readiness. |

Condensation:

```txt
PLANS.md compacted from 651 lines to 321 lines while preserving invariant-required
current state, active task contract, task schema, latest source-to-decision
outcome, final response contract, and revision note.
```

Persisted IDs:

```txt
executionRun: d10e8031-99be-4473-b7af-0295c485a876
evidenceBundle: 230344e3-5336-4897-ba09-d41257c8ca53
reviewAssessment: 23931d96-6f06-4adb-803a-98b4b2c40d79
feedbackDelta: 12b41aed-de3c-4a41-9795-e0f361606cce
observationGroup: 95c49986-b819-439b-9a4d-3b52b2bad086
reflectionRecord: 53547d4c-00c9-4e03-89c4-a58eef0def45
```

## Next

Run V02-01 only when the required fields exist:

```txt
operator_name:
operator_machine_os:
operator_timezone:
trial_date:
support_channel:
KRN source ref:
target_repo:
target_repo_mode:
target_repo_dirty_state:
target_repo_contains_secrets:
DB mode:
support boundary:
bounded target task:
success criteria:
stop conditions:
operator transcript path:
```

Do not create another local substitute for V02-01.
