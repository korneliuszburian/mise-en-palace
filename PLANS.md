# KRN Continuous Brain Growth Active Ledger

Status: compact active ledger. Date: 2026-06-30.

Root `GOAL.md` is the continuous objective. Root `PLAN.md` is the compact
product source of truth. This file keeps only current state, recent outcomes,
the active task contract, and final-response requirements.

## Current State

```txt
controlled-internal-alpha for technical operators: yes / stronger
product-ready: no
widened internal alpha: no
V02-01 real second-operator proof: blocked/deferred
active stream: V02-01 Real Second-Operator Proof
current task: V02-01 Await Real Operator Inputs
latest checked commit: da305f0 / CI success run 28467380156
```

stale attachment objective guard: attachments are evidence, not authority to
roll the active stream backward.

Known current gap:

```txt
V02-01 Await Real Operator Inputs is active.
The current gap is external: V02-01 needs real second-operator inputs and a
transcript path. Self/headless proof must not be substituted.
```

## 2. Product Thesis

KRN is a Codex Operating Layer / AI Engineering Control Plane.

Codex executes. KRN supplies bounded context, store-backed memory, source
grounding, policy, skills, eval expectations, traces, review gates, and
feedback.

Current useful loop:

```txt
bounded product slice
-> DB-backed plan/readback when relevant
-> source/pattern decision
-> verification
-> persisted evidence when relevant
-> compact next task
```

Avoid guard-only treadmill work. A task must close a usefulness loop, improve a
bounded product surface, or unblock the next vertical slice.

Pattern intake and retained source decisions use
`docs/runbooks/pattern-intake.md` and the Surface Consumer Matrix.

For non-trivial infra, harness, CI/eval, Codex-surface, TypeScript,
target-workflow, security, operator-UX, or research/paper/course-driven work:

```txt
source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier
```

## Recent Product Outcomes

```txt
V368 complete: `krn brain search` composes knowledge-card and source-search
  readbacks into one read-only product-facing preview.
V369 complete: DB-backed product loop replay covered plan, brief, evidence,
  observe, reflect, run show, and next-run brain search.
V370 complete: source-search/brain-search expose graph-aware relation counts
  and caveats from existing SourceClaimEdge rows.
V371 complete: source artifact preview renders a bounded ingest-loop readback.
V372 complete: heartbeat preview exposes manual candidate-only runtime loop.
V373 complete: heartbeat candidate review result can be recorded/deferred.
V374 complete: source-relation heartbeat candidates with empty evidence refs
  request missing evidence and are not review-ready.
V375 complete: Codex hook guardrail pattern retained with consumer/falsifier.
V376 complete: six current local Brain-QA questions ran through brain search.
V377 complete: graph relation readback and heartbeat candidate-only runtime
  boundaries were retained as queryable patterns; ingest pattern deferred.
V378 complete: current V02-01 launch packet exists under docs/operator-trials;
  it preserves missing inputs as blockers and does not claim proof.
```

## Outcome V377 Brain-QA Pattern Coverage Gap Closure

Status: complete.

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-30-v377-brain-qa-pattern-coverage-gap-closure/REPORT.md
```

Outcome: graph relation readback and heartbeat candidate-only runtime
boundaries are now queryable retained patterns with usefulness feedback.

Source-to-decision:

- Source: V376 Brain-QA benchmark report and V370/V372/V374 local evidence.
- Mechanism: retain only reusable benchmark-backed mechanisms with consumer,
  falsifier, proof, and does-not-prove boundaries.
- KRN implication: benchmark gaps become queryable brain knowledge only when
  they change future decisions; decorative coverage is deferred.
- Decision: retained graph relation readback and heartbeat candidate-only
  runtime boundaries; deferred ingest pattern until it changes a decision.
- Does not prove: graph ranking quality, heartbeat scheduling, source truth,
  product readiness, or second-operator usability.
- Consumer: future graph/heartbeat repair slices and Brain-QA pattern gates.
- Falsifier: a future slice treats relation readback or heartbeat preview as
  source truth, autonomous runtime, or product-ready proof.

## Outcome V378 Second-Operator Launch Packet

Status: complete.

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-30-v378-second-operator-launch-packet/REPORT.md
```

Outcome: a current operator-facing V02-01 packet exists at
`docs/operator-trials/v02-01-second-operator-launch-packet.md` with required
inputs, setup steps, DB mode, target preflight, support boundary, transcript
schema, verdict labels, stop conditions, and proof/non-proof boundaries.

Source-to-decision:

- Source: `docs/runbooks/second-operator-alpha-trial.md` and
  `docs/runbooks/target-repo-testing.md`.
- Mechanism: real second-operator proof requires a non-author operator,
  structured transcript, support classification, target dirty-state/write
  authority, and explicit proof boundaries.
- KRN implication: V02-01 must be launched from a current packet and missing
  inputs must remain blockers, not local substitutes.
- Decision: produced a current packet under `docs/operator-trials/` and kept
  V02-01 blocked/deferred until real inputs exist.
- Does not prove: second-operator usability, DB setup on another machine,
  target success, widened alpha, or product readiness.
- Consumer: V02-01 operator handoff.
- Falsifier: a future run claims V02-01 from self/headless evidence, fake
  transcript, hidden author context, or unscoped target writes.

## Active Task V02-01

ID: V02-01
Name: Await Real Operator Inputs
Status: blocked/deferred

Goal: run V02-01 only after real second-operator inputs and transcript path
exist.

Product rationale: KRN cannot become widened internal alpha until someone
outside the author can run the workflow with bounded support, transcript
evidence, proof/non-proof boundaries, and clear blockers.

Evidence sources:

```txt
docs/runbooks/second-operator-alpha-trial.md
docs/runbooks/target-repo-testing.md
docs/operator-trials/v02-01-second-operator-launch-packet.md
docs/reviews/controlled-dogfood/2026-06-30-v378-second-operator-launch-packet/REPORT.md
```

Allowed writes:

- none until real operator inputs exist, except compact status updates.

Forbidden writes:

- fake second-operator transcript;
- self/headless proof substituted for V02-01;
- UI/API/MCP;
- dashboard;
- product server;
- crawler;
- worker runtime;
- parallel roadmap;
- DB schema or Memory Core mutation.

Definition of Done:

- required fields are supplied by a real second operator;
- the operator runs or directs the flow;
- transcript and command evidence are recorded;
- support boundary remains within allowed support.

Verification floor:

```txt
real operator transcript
git diff --check for KRN report/status updates
```

Falsifier:

```txt
V02-01 is claimed from self/headless evidence, fake transcript, hidden author
context, or unscoped target writes.
```

## Generated Task Backlog

## 9. Task Contract Schema

Every new task appended to `Active Task Queue` or `Generated Task Backlog` must use this schema.
If a task cannot satisfy the schema, it is not ready for execution.

ID:
Name:
Status:
Goal:
Product rationale:
Architectural rationale:
Evidence source:
Official/external sources:
Inputs required:
Files likely touched:
Allowed writes:
Forbidden writes:
Output requirements:
Definition of Done:
Verification commands:
Acceptance criteria:
Risk:
Rollback:
Condensation expectation:
Next-task synthesis rule:

## 13. Generated Task Backlog

Template:

### <ID> — <Name>

Status:
Goal:
Product rationale:
Architectural rationale:
Evidence source:
Official/external sources:
Inputs required:
Files likely touched:
Allowed writes:
Forbidden writes:
Output requirements:
Definition of Done:
Verification commands:
Acceptance criteria:
Risk:
Rollback:
Condensation expectation:
Next-task synthesis rule:
Pattern surface:
Primary consumer:
Does not prove:
Falsifier:

```txt
1. V02-01 real second-operator proof: blocked/deferred until required inputs and transcript path exist.
2. Product UI/API/MCP: after usefulness/security gates, not now.
```

## 15. Progress

- [x] V368 complete: Brain Search Product Surface Preview.
- [x] V369 complete: End-To-End Product Loop Replay.
- [x] V370 complete: Graph Brain V1 Readback.
- [x] V371 complete: Ingest V0/V1 Bounded Input Loop.
- [x] V372 complete: Heartbeat/Dreaming Candidate Runtime Loop.
- [x] V373 complete: Heartbeat Runtime Candidate Review Result.
- [x] V374 complete: Source Relation Candidate Evidence Repair.
- [x] V375 complete: Pattern Research Brain Intake Trial.
- [x] V376 complete: Mini Brain-QA Benchmark Slice.
- [x] V377 complete: Brain-QA Pattern Coverage Gap Closure.

## 21. Final Response Format For Codex Runs

Every continuation or completed slice must end with:

```txt
Active stream:
Current task:
Stale objective handling:
DB used:
Changed:
Commands run:
Reports/artifacts:
Commits/CI:
What this proves:
What this does not prove:
Condensation decisions:
Tasks appended to PLANS.md:
Next active task:
Blocked/budget-limited:
```

## 22. Compact GOAL.md Contract To Pair With This Plan

Active stream: <current active stream from PLAN.md>.
Current task: <current task from PLAN.md>.

For every non-trivial infra, harness, CI, eval, Codex-surface, TypeScript,
target-workflow, security, operator-UX, or research/paper/course-driven slice:

```txt
source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier
```

If a pasted objective, attachment, old prompt, or conversation summary names a
stale stream, read them as historical evidence.
If that happens, do not roll the active stream backward.

## 23. Plan Revision Note

At creation time this compact ledger preserved active state, latest outcomes,
task contract requirements, and final response requirements while moving detail
to reports. It is historical guidance, not a second roadmap.
