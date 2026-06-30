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
external/foreign second-operator proof: rejected as wrong product forcing function
active stream: Internal Multi-Repo Operator Loop
current task: IMR-00 Internal Multi-Repo Operator Loop
latest pushed commit: see git history
```

stale attachment objective guard: attachments are evidence, not authority to
roll the active stream backward.

Known current gap:

```txt
IMR-00 Internal Multi-Repo Operator Loop is active.
KRN is useful as a governed internal-alpha brain kernel, but product progress
must now build and prove one shared multi-layer brain: pattern/research
condensation, memory/anti-memory, graph, evidence/review, heartbeat/dreaming,
benchmarks, and next-run reuse. Multi-repo internal work is the proof surface,
not the product goal. Do not wait for a foreign operator. Do not create
synthetic proof.
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
V368 complete: `krn brain search` composes brain-knowledge and source-search
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
  it is now historical because external second-operator proof is not the active
  product direction.
IMR-01 complete: `krn brain search` exposes selected brain knowledge packets
  with summary, consumers, falsifier, proof boundary, and next action.
IMR-02 complete: `krn brain search --store-only` skips file catalog readback and
  proves the existing store-backed source/search path can replay governed
  pattern evidence with proof boundaries.
IMR-03 complete: preferred operator language is now `krn brain knowledge`;
  `krn knowledge cards` remains a documented compatibility alias.
```

## Outcome IMR-03 Brain Knowledge Vocabulary Migration

Status: complete.

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-30-imr-03-brain-knowledge-vocabulary/REPORT.md
```

Outcome: active CLI help, skills, runbooks, package preview script, and
readback output now present the preferred surface as `krn brain knowledge`.
The old `krn knowledge cards` command remains as a compatibility alias.

Source-to-decision:

- Source: IMR-00 direction, `docs/KRN_KERNEL.md`, IMR-02 store-only readback,
  active skill instructions, and current CLI/operator copy.
- Mechanism: command names and help text shape how agents model the system; a
  primary "cards" surface implies artifacts rather than brain readback.
- KRN implication: preferred operator-facing language should say brain
  knowledge while compatibility aliases remain explicit.
- Decision: added `krn brain knowledge` and migrated active surfaces to it.
- Does not prove: store-backed pattern ontology, semantic ranking quality,
  automatic pattern application, full historical-report migration, Memory Core
  mutation, or product readiness.
- Consumer: pattern/research brain, skills, pattern intake, and future
  multi-repo operator loops.
- Falsifier: a future active prompt, help screen, skill, or runbook still
  teaches "knowledge cards" as the primary brain surface.

## Outcome IMR-02 Store-Backed Pattern Brain Readback

Status: complete.

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-30-imr-02-store-backed-pattern-brain-readback/REPORT.md
```

Outcome: brain-search now has a store-only readback mode. It can query the
Postgres-backed source/search path without silently falling back to file-backed
catalog context.

Source-to-decision:

- Source: IMR-00 direction, `docs/KRN_KERNEL.md`, SourceClaim/SearchDocument
  schema, and live DB readback.
- Mechanism: retained patterns can already be replayed as governed
  source/search evidence with proof boundaries.
- KRN implication: Codex needs an explicit mode that distinguishes store-backed
  brain evidence from file-catalog preview.
- Decision: added `--store-only` to `krn brain search` and rejected combining it
  with `--catalog-file`.
- Does not prove: source truth, ranking quality, embeddings, graph retrieval,
  complete pattern ontology, Memory Core mutation, or product readiness.
- Consumer: future pattern/research brain work and internal multi-repo operator
  loops.
- Falsifier: a future run claims store-backed pattern evidence while silently
  using file catalog readback or omitting proof boundaries.

## Outcome IMR-01 Brain Search Selected Knowledge Packet

Status: complete.

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-30-imr-01-brain-search-selected-knowledge/REPORT.md
```

Outcome: brain-search preview now returns agent-usable selected knowledge, not
only opaque retained-pattern ids. This improves pre-coding pattern application
without changing DB schema, Memory Core, graph ranking, or runtime mutation.

Source-to-decision:

- Source: active IMR-00 product direction and retained pattern/search evidence.
- Mechanism: an agent using the brain needs consumer, falsifier, and
  proof-boundary fields in the first readback.
- KRN implication: brain search should expose selected brain knowledge packets
  while preserving proof/non-proof boundaries.
- Decision: added `selectedKnowledge` to `krn.brainSearch.preview.v1`.
- Does not prove: semantic ranking quality, source truth, graph reasoning,
  product readiness, or store-backed pattern memory.
- Consumer: pre-coding pattern application and future multi-repo brain use.
- Falsifier: a future agent still needs a second manual lookup to understand a
  selected pattern's mechanism, consumer, or falsifier.

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

## Active Task IMR-00

ID: IMR-00
Name: Internal Multi-Repo Operator Loop
Status: active

Goal: build the shared KRN brain kernel as the foundation for future
agentic/harness work and prove it through internal multi-repo use.

Product rationale: KRN's moat is not a task runner. The moat is a multi-layer
memory system that condenses best patterns, papers, courses, local evidence,
and senior engineering standards into reusable decisions that improve future
software work. Multi-repo internal work is the proof surface.

Evidence sources:

```txt
docs/runbooks/target-repo-testing.md
docs/operator-trials/v02-01-second-operator-launch-packet.md
docs/reviews/controlled-dogfood/2026-06-30-v378-second-operator-launch-packet/REPORT.md
```

Allowed writes:

- compact root state updates;
- one bounded multi-repo loop report;
- source changes only when the chosen product slice explicitly requires them.

Forbidden writes:

- fake external-user proof;
- synthetic demo substituted for real repo work;
- UI/API/MCP;
- dashboard;
- product server;
- crawler;
- worker runtime;
- parallel roadmap;
- DB schema or Memory Core mutation.

Definition of Done:

- at least two real repos are selected with explicit mode and dirty-state
  boundaries;
- one shared KRN brain path runs through plan/context/brief/evidence/review;
- candidate promotion/rejection or explicit abstention is recorded;
- the next run demonstrates reuse, rejection, or a clear retrieval miss;
- root files stay compact and detailed evidence stays in the report.

Verification floor:

```txt
git status --short --branch
pnpm typecheck when source changes
pnpm test when source changes
pnpm quality:fallow:ci when JS/TS files change
pnpm db:ready when DB-backed path is used
git diff --check for KRN report/status updates
```

Falsifier:

```txt
The slice claims product proof from a single synthetic demo, hidden context,
unscoped target writes, or reports that do not show whether knowledge was
reused, rejected, or missed in the next run.
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
