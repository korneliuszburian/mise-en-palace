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
active stream: V363 Heartbeat/Dreaming Candidate Generator V0
current task: V363-00 Heartbeat/Dreaming Candidate Generator V0
latest checked before V358: a2fba5f / CI success run 28428577576
```

stale attachment objective guard: attachments are evidence, not authority to
roll the active stream backward.

Known current gap:

```txt
V363-00 Heartbeat/Dreaming Candidate Generator V0 is active.
The current gap is a candidate-only heartbeat/dreaming surface that can inspect
existing KRN state and propose reviewable follow-up candidates without
autonomous Memory Core mutation, worker daemon, scheduler, crawler, embeddings,
schema, UI/API/MCP, broad benchmark, or consensus runtime.
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
V359 complete: Fallow added as JS/TS quality gate.
V360 complete: full Fallow now exits cleanly after bounded cleanup slices.
```

## Active Task V363

ID: V363-00
Name: Heartbeat/Dreaming Candidate Generator V0
Status: active

Goal: implement the smallest candidate-only heartbeat/dreaming v0 surface over
existing source, memory, evidence, and review state.

Product rationale: V362 closed the second local ingest/readback proof. The next
brain capability is not another ingest proof; it is a bounded "sleep/heartbeat"
path that proposes stale/duplicate/missing-evidence follow-up candidates for
human review.

Allowed writes:

- smallest owning source/test files;
- a compact V363 report under `docs/reviews/controlled-dogfood/`;
- compact root state after verification.

Forbidden writes:

- autonomous Memory Core mutation;
- worker daemon;
- scheduler;
- DB schema;
- ranking rewrite;
- retrieval semantics rewrite;
- UI/API/MCP;
- crawler;
- embeddings;
- worker runtime;
- broad benchmark;
- consensus runtime;
- parallel roadmap.

Definition of Done:

- heartbeat/dreaming v0 emits reviewable candidate output only;
- candidates include evidence refs, does-not-prove, reviewability, and next
  action;
- no MemoryRecord, SourceClaim, SourceDecision, or DB schema mutation is added
  unless explicitly rejected/recorded as a blocking falsifier.

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
V363 mutates Memory Core, starts daemon/scheduler work, or becomes a broad
agent/consensus platform before proving candidate-only review value.
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
1. V363 heartbeat/dreaming candidate generator
2. consensus eval/candidate lane
3. product UI/search/API/MCP after usefulness/security gates
```

## 15. Progress

- [x] V358 complete: Graph Mini Brain-QA Query-Shape Diagnostics Closure.
- [x] V359 complete: Fallow Quality Gate And First Cleanup.
- [x] V360 complete: Fallow Legacy Complexity Cleanup.
- [x] V361 complete: Graph Brain V0 Entity/Relation Extraction And Answer Delta.
- [x] V362 complete: Ingest V0 Expansion With Bounded Evidence.
- [ ] V363 pending: Heartbeat/Dreaming Candidate Generator V0.

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
