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
active stream: V377 Brain-QA Pattern Coverage Gap Closure
current task: V377-00 Brain-QA Pattern Coverage Gap Closure
latest checked before V358: a2fba5f / CI success run 28428577576
```

stale attachment objective guard: attachments are evidence, not authority to
roll the active stream backward.

Known current gap:

```txt
V377-00 Brain-QA Pattern Coverage Gap Closure is active.
The current gap is closing the V376 benchmark finding that graph/ingest/heartbeat
questions are source-search useful but do not all have retained pattern coverage.
```

## 2. Product Thesis

KRN is a Codex Operating Layer / AI Engineering Control Plane.

Codex executes. KRN supplies bounded context, store-backed memory, source
grounding, policy, skills, eval expectations, traces, review gates, and
feedback.

Current useful loop:

```txt
bounded product slice
-> DB-backed plan/readback
-> source/pattern decision
-> verification
-> persisted evidence
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
V340 complete: artifact-to-activated-SourceClaim loop.
V341 complete: product-facing `krn source search --query` preview.
V342-V345 complete: search usefulness and SearchDocument alignment.
V346-V350 complete: answer package JSON/readback and mini Brain-QA batch.
V351-V355 complete: missingEvidence specificity and answerUsefulness output.
V356 complete: graph relation SearchDocuments exist and narrow graph queries retrieve them.
V357 complete: source-search answer packages expose queryShapeDiagnostics.
V358 complete: graph mini Brain-QA diagnostic closure passed.
V361 complete: source-search answer packages expose SourceClaimEdge relationSupport.
V362 complete: second local artifact ingest/readback passed and fixed a live
  source chunk repository receiver bug.
V363 complete: brain heartbeat preview aggregates memory-staleness and
  source-relation maintenance candidates without mutation.
V364 complete: `krn heartbeat preview` exposes candidate-only heartbeat readback
  from live Postgres state without mutation.
V365 complete: heartbeat preview emits and renders a candidate-only
  review/eval closure decision and next action.
V366 complete: heartbeat preview review/eval closure is protected by a focused
  worker behavior proof.
V367 complete: consensus eval/candidate lane exists from V339 and was verified
  by current-state audit.
V368 complete: `krn brain search` composes existing knowledge-card and
  source-search readbacks into one read-only product-facing preview.
V369 complete: DB-backed product loop replay covered plan, brief, evidence,
  observe, reflect, run show, and next-run brain search.
V370 complete: source-search answer packages and brain-search preview expose
  graph-aware relation counts and caveats from existing SourceClaimEdge rows.
V371 complete: source artifact preview persisted output now renders one compact
  ingest-loop readback from artifact/chunks to search/claim/edge and emitted
  source/brain search commands.
V372 complete: heartbeat preview now exposes a manual candidate-only runtime
  loop with readiness status, reviewable candidate counts, next action, and
  forbidden writes.
V373 complete: heartbeat preview can record one manual candidate review result;
  the live candidate was deferred because relationEvidenceRefs were empty.
V374 complete: source-relation heartbeat candidates with empty
  relationEvidenceRefs now request missing evidence and are not counted as
  review-ready.
V375 complete: one official Codex hooks mechanism was retained as a queryable
  KRN pattern with consumer, falsifier, does-not-prove, usefulness feedback,
  and eval/golden candidate.
V376 complete: six current local Brain-QA questions ran through `krn brain
  search --json`; source-to-decision/hooks/TypeScript had pattern hits, while
  graph/ingest/heartbeat were source-search useful with uneven retained pattern
  coverage.
V359 complete: Fallow added as JS/TS quality gate.
V360 complete: full Fallow now exits cleanly after bounded cleanup slices.
```

## Active Task V377

ID: V377-00
Name: Brain-QA Pattern Coverage Gap Closure
Status: active

Goal: close the V376 benchmark gap by retaining one or two source-backed
patterns only where V376 evidence shows a reusable mechanism with consumer and
falsifier.

Product rationale: KRN should turn benchmark findings into queryable brain
knowledge only when there is a reusable mechanism, not start a broad benchmark
or research platform.

Allowed writes:

- one or two retained-pattern artifacts if backed by V376 evidence;
- catalog/usefulness-feedback updates needed for readback;
- focused knowledge-card tests if catalog coverage changes;
- a compact V377 report under `docs/reviews/controlled-dogfood/`;
- compact root state after verification.

Forbidden writes:

- autonomous Memory Core mutation;
- scheduler;
- worker daemon;
- DB schema;
- ranking rewrite;
- retrieval semantics rewrite;
- UI/API/MCP;
- dashboard;
- product server;
- crawler;
- embeddings;
- worker runtime;
- broad benchmark platform;
- multi-agent runtime;
- parallel roadmap.
- source-truth mutation.

Definition of Done:

- V376 gap is either closed with one or two retained pattern cards or explicitly
  rejected/deferred with a reason;
- every retained pattern has source, mechanism, KRN implication, consumer,
  falsifier, and does-not-prove;
- readback proves the new pattern is queryable;
- no schema rewrite, crawler, dashboard, API, MCP, broad benchmark platform, source-truth
  mutation, or autonomous runtime is added.

Verification floor:

```txt
pnpm db:ready
targeted tests for touched package
pnpm typecheck
pnpm test
git diff --check
krn evidence capture --persist when a persisted run exists
krn observe --persist
krn reflect --persist
```

Falsifier:

```txt
V377 retains decorative cards without V376 evidence, consumer, or falsifier, or
starts a broad benchmark/retrieval rewrite instead of closing the specific gap.
```

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

Current backlog order:

```txt
1. second-operator proof
2. product UI/API/MCP after usefulness/security gates
```

## 15. Progress

- [x] V358 complete: Graph Mini Brain-QA Query-Shape Diagnostics Closure.
- [x] V359 complete: Fallow Quality Gate And First Cleanup.
- [x] V360 complete: Fallow Legacy Complexity Cleanup.
- [x] V361 complete: Graph Brain V0 Entity/Relation Extraction And Answer Delta.
- [x] V362 complete: Ingest V0 Expansion With Bounded Evidence.
- [x] V363 complete: Heartbeat/Dreaming Candidate Generator V0.
- [x] V364 complete: Heartbeat Preview CLI Readback.
- [x] V365 complete: Heartbeat Preview Review/Eval Closure.
- [x] V366 complete: Heartbeat Preview Golden Behavior Proof.
- [x] V367 complete: Consensus Eval/Candidate Lane.
- [x] V368 complete: Brain Search Product Surface Preview.
- [x] V369 complete: End-To-End Product Loop Replay.
- [x] V370 complete: Graph Brain V1 Readback.
- [x] V371 complete: Ingest V0/V1 Bounded Input Loop.
- [x] V372 complete: Heartbeat/Dreaming Candidate Runtime Loop.
- [x] V373 complete: Heartbeat Runtime Candidate Review Result.
- [x] V374 complete: Source Relation Candidate Evidence Repair.
- [x] V375 complete: Pattern Research Brain Intake Trial.
- [x] V376 complete: Mini Brain-QA Benchmark Slice.
- [x] V373 complete: Heartbeat Runtime Candidate Review Result.
- [x] V374 complete: Source Relation Candidate Evidence Repair.

Next active stream: V375 Pattern Research Brain Intake Trial.

## Outcome V370 Graph Brain V1 Readback

Status: complete.

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-30-v370-graph-brain-v1-readback/REPORT.md
```

Outcome: source-search answer packages now include `graphReadback`, and
brain-search preview surfaces graph-aware counts and caveats from existing
SourceClaimEdge rows. Sequential reflect selected 5 observations but produced
no findings, keeping reflection usefulness as an open product gap.

Next: V371 Ingest V0/V1 Bounded Input Loop.

## Outcome V371 Ingest V0/V1 Bounded Input Loop

Status: complete.

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-30-v371-ingest-v0v1-bounded-input-loop/REPORT.md
```

Outcome: `krn source artifact preview --persist` now renders one compact
`Ingest loop readback` with artifact/chunk/search document/source claim/source
claim edge status and exact source/brain search readback commands. Live DB
readback proved the emitted query returned useful source-search and brain-search
output for the V371 artifact.

Next: V372 Heartbeat/Dreaming Candidate Runtime Loop.

## Outcome V369 End-To-End Product Loop Replay

Status: complete.

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-30-v369-end-to-end-product-loop-replay/REPORT.md
```

Outcome: DB-backed replay covered plan, Codex brief, evidence capture, observe,
reflect, run show, and next-run brain search. It exposed three product gaps:
no knowledge cards for `end-to-end product loop`, reflection produced no
findings, and the feedback candidate was `too_vague`.

Next: V370 Graph Brain V1 Readback.

## Outcome V368 Brain Search Product Surface Preview

Status: complete.

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-30-v368-brain-search-product-surface-preview/REPORT.md
```

Outcome: `krn brain search` composes existing knowledge-card and source-search
readbacks into one read-only no-mutation preview with proof and
does-not-prove boundaries. Live DB readback for `source-to-decision` returned
three knowledge cards, useful source-search output, two supporting claims, one
supporting document, and relation support.

Next: V369 End-To-End Product Loop Replay.

## Outcome V367 Consensus Eval/Candidate Lane

Status: complete.

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-30-v367-consensus-eval-candidate-lane/REPORT.md
```

Outcome: current-state audit verified that V339 already implemented the
candidate-only consensus/eval lane through
`buildConsensusCandidateEvaluationPreview`, with support/dissent/risk evidence,
decision options, reviewability, `doesNotProve`, and no mutation.

Then completed: V368 Brain Search Product Surface Preview.

## Outcome V366 Heartbeat Preview Golden Behavior Proof

Status: complete.

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-30-v366-heartbeat-preview-golden-behavior-proof/REPORT.md
```

Outcome: `packages/workers/src/brainHeartbeatPreview.test.ts` now contains a
focused behavior proof for exact heartbeat preview `reviewEvalClosure` output,
review-ready candidate fields, evidence refs, `doesNotProve`, next action,
forbidden writes, and no mutation.

Next: V367 Consensus Eval/Candidate Lane.

## Outcome V365 Heartbeat Preview Review/Eval Closure

Status: complete.

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-30-v365-heartbeat-preview-review-eval-closure/REPORT.md
```

Outcome: `buildBrainHeartbeatPreview` now emits `reviewEvalClosure`, and
`krn heartbeat preview` renders the decision, next action, candidate ids,
evidence refs, does-not-prove, mutation boundary, and forbidden writes.

Next: V366 Heartbeat Preview Golden Behavior Proof.

## Outcome V358 Graph Mini Brain-QA Query-Shape Diagnostics Closure

Status: complete.

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-30-v358-graph-mini-brain-qa-query-shape-diagnostics/REPORT.md
```

Source-to-decision:

- Source: V356/V357 DB-backed graph source-search readbacks.
- Mechanism: broad `websearch_to_tsquery` can over-constrain
  SearchDocument retrieval while SourceClaims still match; narrow topic queries
  retrieve relation SearchDocuments.
- KRN implication: graph-relations consumers need query-shape diagnostics before
  assuming missing coverage, ranking failure, graph runtime failure, or schema
  gaps.
- Decision: proceed to a bounded graph brain v0 entity/relation extraction and
  answer-delta vertical.
- Does not prove: answer correctness, source truth, ranking quality, graph
  retrieval quality, broad benchmark quality, product readiness, UI/API/MCP
  readiness, embeddings, crawler readiness, worker runtime, or Memory Core
  mutation.
- Consumer: graph mini Brain-QA loop and technical operators consuming
  `krn source search --json`.
- Falsifier: future graph-relations answer packages still require manual DB or
  source inspection to distinguish query shape from missing coverage.

Evidence:

```txt
executionRun: 964b10ca-42e8-48b4-8daf-734ab435a3b6
evidenceBundle: dbe829e3-02c1-4e6f-a0ac-6b76df981aa5
observationGroup: e011a547-434e-4b01-81ff-3bba1cdec63c
reflectionRecord: f32b0c01-b70e-4c4b-814b-771ad19ae791
MemoryRecord created: no
```

## Outcome V361 Graph Brain V0 Entity/Relation Answer Delta

Status: complete.

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-30-v361-graph-brain-v0-entity-relation-answer-delta/REPORT.md
```

Source-to-decision:

- Source: V358 graph mini Brain-QA diagnostic closure, existing
  `sourceArtifactPreviewExtraction` path, relation-grounded QA helper, and
  SourceClaimEdge readback surface.
- Mechanism: KRN already has deterministic local entity/claim/relation
  extraction and persisted SourceClaimEdge rows; source-search answer packages
  did not expose relation support alongside supporting claims and documents.
- KRN implication: source-search answer packages should consume existing
  reviewed relation support before adding graph runtime, schema, ranking,
  crawler, embeddings, UI/API/MCP, or worker execution.
- Decision: adopt read-only answer-package `relationSupport` and reject a new
  extraction layer for this slice.
- Does not prove: source truth, edge correctness, answer correctness, ranking
  quality, graph retrieval quality, extraction quality, broad benchmark
  quality, product readiness, UI/API/MCP readiness, embeddings, crawler
  readiness, worker runtime, or Memory Core mutation.
- Consumer: graph mini Brain-QA loop and technical operators consuming
  `krn source search --json`.
- Falsifier: `relationSupport` fails to appear for included SourceClaims with
  persisted SourceClaimEdge rows, changes ranking/retrieval behavior, mutates DB
  state, or pressures schema/runtime expansion.

Evidence:

```txt
executionRun: 18145922-1603-4644-b715-9efd1c4ea1b1
evidenceBundle: d977e1d5-df92-47a0-b676-36b5a16fa850
observationGroup: db675443-83f6-420f-b414-ee3bae42c9cd
reflectionRecord: 24b7ec1c-b610-4c04-b1f8-45103790ba11
MemoryRecord created: no
```

## Outcome V362 Ingest V0 Expansion With Bounded Evidence

Status: complete.

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-30-v362-ingest-v0-expansion/REPORT.md
```

Source-to-decision:

- Source: V316-V323 ingest v0 reports, V356-V361 source-search/graph readbacks,
  and the live V362 failure.
- Mechanism: the existing artifact preview path already owns local artifact,
  chunk, SearchDocument, reviewed SourceClaim, and SourceClaimEdge persistence;
  the missing proof was a second artifact live replay.
- KRN implication: useful brain growth should prove current verticals under live
  DB conditions before adding crawler, embeddings, schema, ranking, UI/API/MCP,
  worker runtime, broad benchmark, or Memory Core mutation.
- Decision: fix the repository receiver bug and prove second-artifact
  ingest/readback through existing CLI/DB/source-search paths.
- Does not prove: source truth, extraction quality, ranking quality, graph
  retrieval quality, crawler readiness, product readiness, UI/API/MCP
  readiness, worker runtime, broad benchmark quality, or Memory Core mutation.
- Consumer: Ingest v0, source-search answer packages, future graph-brain
  readbacks.
- Falsifier: a second local artifact cannot produce SourceArtifact,
  SourceChunk, SearchDocument, SourceClaim, SourceClaimEdge, and source-search
  `relationSupport` readback in the current shell.

Evidence:

```txt
plan executionRun: f86ff91d-6579-4d10-9b34-679356c2dfb6
sourceArtifact: 561ceab9-f67b-493b-8017-8156d1650bc0
sourceChunk: 6ed506f4-e84f-455e-b2d1-d4a00143a05a
searchDocument: 60c400a7-eabc-4179-a571-6d77660f4b3d
sourceClaim: e4bfcdea-d201-4e0f-9d73-94e200b9fe4f
sourceClaimEdge: 0549c002-d52f-4cf0-a6ba-e5e9a36e2ead
source-search answerUsefulness: useful
evidenceBundle: c9db92e3-1089-4b6c-92bd-9e01273a5b8b
observationGroup: 1821bbc2-76b7-48b2-99ff-4a32547c55fd
reflectionRecord: c6f7b9ab-2ad7-42ea-aa62-1942d4cf6584
reflectionFindings: 4
MemoryRecord created: no
```

## Outcome V363 Heartbeat/Dreaming Candidate Generator V0

Status: complete.

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-30-v363-heartbeat-dreaming-candidate-generator/REPORT.md
```

Source-to-decision:

- Source: V338 memory-staleness heartbeat preview, V337 source-relation
  heartbeat preview, V362 ingest/readback proof, and the V363 DB-backed plan.
- Mechanism: existing previews already emit reviewable maintenance candidates;
  the missing layer was one brain-heartbeat aggregate with shared budget,
  proof/non-proof, reviewability, and mutation boundary.
- KRN implication: heartbeat/dreaming starts as candidate-only review output
  before autonomous worker execution or memory/source truth mutation.
- Decision: add and export `buildBrainHeartbeatPreview` in `@krn/workers`.
- Does not prove: candidate usefulness, source truth, memory truth, autonomous
  dreaming, consensus correctness, operator UX, or product readiness.
- Consumer: heartbeat CLI/readback, consensus candidate evaluation, and
  maintenance-review workflows.
- Falsifier: the preview emits MemoryRecord, SourceClaim, SourceDecision, DB
  schema, worker, scheduler, crawler, embedding, UI/API/MCP, broad benchmark, or
  consensus runtime side effects.

Evidence:

```txt
executionRun: ef6bcf83-6850-4af9-9a7b-bd56d69720f4
evidenceBundle: 29b2ce4c-0741-4c13-aad3-9a232bf0c03a
observationGroup: 791c2ac8-6231-4b11-bd08-4903bf0b355d
reflectionRecord: 1fd8114c-ffe7-4c7d-9ca3-9ecc05e9e2ba
MemoryRecord created: no
Candidate rows written: no
```

## Outcome V364 Heartbeat Preview CLI Readback

Status: complete.

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-30-v364-heartbeat-preview-cli-readback/REPORT.md
```

Source-to-decision:

- Source: V337/V338 heartbeat previews, V363 aggregate preview, and V364 live
  DB readback.
- Mechanism: candidate-only heartbeat helpers already produced reviewable
  maintenance candidates; operators needed a narrow CLI readback before runtime
  automation.
- KRN implication: heartbeat/dreaming should stay candidate-only and
  operator-reviewable before daemon/scheduler/mutation work.
- Decision: add `krn heartbeat preview` as read-only Postgres CLI output.
- Does not prove: memory truth, source truth, candidate usefulness, autonomous
  worker execution, consensus quality, or product readiness.
- Consumer: technical operator heartbeat readback and future review/eval closure.
- Falsifier: operators still need manual DB/source inspection to see heartbeat
  candidates, evidence refs, reviewability, next action, or mutation boundary.

Evidence:

```txt
executionRun: 18ad49a6-2599-4756-8abe-996850e50065
evidenceBundle: eaffec05-e0c6-4ba7-8fc3-790e58e786e9
observationGroup: 887a579b-bb62-4025-add9-c56b195dd628
reflectionRecord: d2b43a36-4382-480c-a1c9-60a9f7496f19
MemoryRecord created: no
Candidate rows written: no
```

## 21. Final Response Format For Codex Runs

Every continuation or completed slice must end with:

```txt
Active stream:
- ...

Current task:
- ...

Stale objective handling:
- ...

DB used:
- yes/no

Commands run:
- ...

Reports/artifacts:
- ...

Commits/CI:
- ...

What this proves:
- ...

What this does not prove:
- ...

Condensation decisions:
- ...

Tasks appended to PLANS.md:
- ...

Next active task:
- ...

Blocked/budget-limited:
- yes/no
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
