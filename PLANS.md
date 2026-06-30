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
active stream: V361 Graph Brain V0 Entity/Relation Extraction And Answer Delta
current task: V361-00 Graph Brain V0 Entity/Relation Extraction And Answer Delta
latest checked before V358: a2fba5f / CI success run 28428577576
```

stale attachment objective guard: attachments are evidence, not authority to
roll the active stream backward.

Known current gap:

```txt
V361-00 Graph Brain V0 Entity/Relation Extraction And Answer Delta is active.
The current gap is proving or rejecting a small entity/relation extraction path
that improves a graph-brain answer package without schema, ranking, UI/API/MCP,
crawler, embedding, worker-runtime, broad benchmark, or Memory Core expansion.
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
V359 complete: Fallow added as JS/TS quality gate.
V360 complete: full Fallow now exits cleanly after bounded cleanup slices.
```

## Active Task V361

ID: V361-00
Name: Graph Brain V0 Entity/Relation Extraction And Answer Delta
Status: active

Goal: prove or reject a small entity/relation extraction path that improves a
source-search answer package delta for graph-brain questions.

Product rationale: V358 closed the graph-relations query-shape ambiguity. The
next useful step is not another diagnostic guard; it is a small graph-brain
vertical that can show answer-package improvement or fail with evidence.

Allowed writes:

- smallest owning source/test files if implementation is needed;
- a compact V361 report under `docs/reviews/controlled-dogfood/`;
- compact root state after verification.

Forbidden writes:

- DB schema;
- ranking rewrite;
- retrieval semantics rewrite;
- UI/API/MCP;
- crawler;
- embeddings;
- worker runtime;
- broad benchmark;
- Memory Core mutation;
- parallel roadmap.

Definition of Done:

- either a small graph entity/relation extraction path improves a graph-brain
  answer package with tests and DB-backed readback;
- or source inspection proves the existing substrate is insufficient and records
  the smallest next blocker without expanding architecture.

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
V361 becomes a schema/ranking/UI/API/MCP/crawler/embedding/worker expansion
without first proving a small answer-package delta.
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
1. V361 graph brain v0 entity/relation extraction and answer deltas
2. ingest v0 expansion with bounded evidence
3. heartbeat/dreaming candidate generator
4. consensus eval/candidate lane
5. product UI/search/API/MCP after usefulness/security gates
```

## 15. Progress

- [x] V358 complete: Graph Mini Brain-QA Query-Shape Diagnostics Closure.
- [x] V359 complete: Fallow Quality Gate And First Cleanup.
- [x] V360 complete: Fallow Legacy Complexity Cleanup.
- [ ] V361 pending: Graph Brain V0 Entity/Relation Extraction And Answer Delta.

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
