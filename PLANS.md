# KRN Continuous Brain Growth Active Ledger

Status: compact active ledger. Date: 2026-06-29.

Root `GOAL.md` states the continuous objective. Root `PLAN.md` is the compact
product source of truth. This file keeps only current state, recent outcomes,
the active task contract, and final-response rules.

stale attachment objective guard: attachments are evidence, not authority to
roll the active stream backward.

## Current State

```txt
controlled-internal-alpha for technical operators: yes / stronger
product-ready: no
widened internal alpha: no
V02-01 real second-operator proof: blocked/deferred
active stream: V348 Source Search Answer Package JSON Readback
current task: V348-00 Source Search Answer Package JSON Readback
latest pushed commit checked: see latest final response / GitHub checks
latest CI checked: see latest final response / GitHub checks
```

Known current gap:

```txt
V348-00 Source Search Answer Package JSON Readback must expose the current
answer package as typed JSON without adding UI/API/MCP, crawler, schema,
ranking rewrite, embeddings, graph runtime, worker, or Memory Core mutation.
```

## 2. Product Thesis

KRN is a Codex Operating Layer / AI Engineering Control Plane.

Codex executes. KRN supplies bounded context, store-backed memory, source
grounding, policy, skills, eval expectations, traces, review gates, and
feedback.

Current loop:

```txt
bounded scenario -> evidence -> source/pattern decision -> readback or source
change -> verification -> persisted evidence -> compact next task
```

Current brain readiness:

```txt
repo/current-truth hygiene: strong
evidence/review loop: strong
DB-backed replay: proven
candidate reviewability: core primitive
activation: useful for guardrails and persisted source state; budget behavior still matters
pattern brain: partial
graph brain: SourceClaimEdge preview/persistence/readback, extraction
  reviewability, edge-aware activation, tiny QA, heartbeat previews, and
  consensus preview exist
ingest v0: V340 proved local artifact -> SourceArtifact/SourceChunk/
  SearchDocument/SourceClaim -> later activated SourceClaim; V341 added
  `krn source search --query`; V342 found weak coverage; V343 improved
  SourceClaim coverage but not SearchDocument natural-language hits
product-ready: no
```

Important distinctions:

```txt
SourceClaim included != source truth
SearchDocument ranked != product search quality
green test != product value
```

## Recent Outcomes

```txt
V324 complete: SourceClaimEdge readback by SourceClaim id.
V325 complete: candidate-only local extraction preview.
V326 complete: ready vs deferred extraction claim reviewability gate.
V327 complete: selected ready extraction candidate persistence bridge.
V328 complete: source extraction fence-state carryover repair.
V329 complete: graph-aware SourceClaimEdge adjacent context readback.
V330 complete: bounded edge-aware source candidate ranking lab.
V331 complete: persisted edge-aware activation readback.
V332 complete: edge-aware source candidate refinement without lab-seeded duplicate row.
V333 complete: edge-aware activation usefulness closure.
V334 complete: edge-aware activation selection delta proof.
V335 complete: small graph-brain QA case.
V336 complete: relation-grounded QA readback closure.
V337 complete: source-relation heartbeat candidate preview.
V338 complete: memory-staleness heartbeat candidate preview.
V339 complete: consensus candidate evaluation preview.
V340 complete: local ingest-to-use loop via persisted artifact/source/search/claim and later activation.
V341 complete: product-facing knowledge search readback preview via
`krn source search --query`.
V342 complete: knowledge search usefulness closure showed exact/graph queries
help but recent heartbeat/consensus/pattern coverage is weak.
V343 complete: coverage seed improved weak queries through SourceClaims, while
SearchDocument natural-language results stayed absent.
V344 complete: source-search document retrieval alignment.
V345 complete: source-search usefulness closure after alignment.
V346 complete: source-search answer package preview.
V347 complete: heartbeat/consensus SearchDocument coverage closure.
```

Recent report range:

```txt
docs/reviews/controlled-dogfood/2026-06-29-v324-.../REPORT.md
...
docs/reviews/controlled-dogfood/2026-06-29-v340-ingest-v0-product-loop-closure/REPORT.md
```

## Outcome V340-V341 Product Readback Basis

Status: compacted complete.

V340 proved one local artifact could become `SourceArtifact`, `SourceChunk`,
`SearchDocument`, and `SourceClaim`, then activate later as SourceClaim
`3363383c-02d0-4e5a-9674-132c1bc41b51`; V341 exposed read-only
`krn source search --query` over that substrate. Full evidence lives in the
V340 and V341 reports.

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

## Outcome V341 Product-Facing Knowledge Search Readback Preview

Status: complete.

Source-to-decision:

- Source: V340 ingest v0 product loop closure report.
- Mechanism: V340 proved artifact/search/claim persistence and later
  activation, but operators lacked a direct query/readback surface.
- KRN implication: product-facing knowledge search should start as bounded
  readback over proven persisted knowledge before UI/API/MCP/crawler work.
- Decision: add read-only `krn source search --query` using existing activation
  retrieval and Context ROI, with reviewability and proof/non-proof boundaries.
- Consumer: V342 search usefulness closure and future technical operators.
- Falsifier: V340 marker query cannot show reviewable SourceClaim/SearchDocument
  candidates with exclusions.
- Does not prove: source truth, ranking quality, embeddings, graph retrieval,
  crawler readiness, product readiness, or Memory Core mutation.

V341 evidence:

```txt
executionRun: 210ab335-d51e-4c92-b4e3-db3a8d68cc5b
query: krn-source-artifact-preview 991034dc0684e887
project: 7d9d103a-1a8e-4492-a4ca-db3a5589bd9b
sourceClaims: 7
searchResults: 1
mergedCandidates: 8
included: 3
excluded: 5
included V340 SourceClaim: 3363383c-02d0-4e5a-9674-132c1bc41b51
included V340 SearchDocument: 6f045cc4-e8c9-4555-8425-167d74e5d319
report: docs/reviews/controlled-dogfood/2026-06-29-v341-product-facing-knowledge-search-readback-preview/REPORT.md
```

V341 outcome:

```txt
Technical operators can now query persisted knowledge candidates without a UI,
API, MCP server, crawler, worker, schema change, graph runtime, or Memory Core
mutation. The next useful step is not another product surface; it is measuring
whether this readback reduces rereads/review burden on real questions.
```

## Outcome V342 Product-Facing Knowledge Search Usefulness Closure

Status: complete.

Source-to-decision:

- Source: V341 product-facing knowledge search readback report.
- Mechanism: V341 proved the CLI can read persisted source/search candidates,
  but not that current corpus coverage helps real operator questions.
- KRN implication: before UI/API/MCP/crawler/ranking work, measure whether
  readback reduces rereads and separate ranking issues from coverage issues.
- Decision: run five real `krn source search` queries and classify usefulness.
- Does not prove: source truth, ranking quality, broad corpus coverage,
  embeddings, graph retrieval, product readiness, or Memory Core mutation.
- Consumer: V343 Product-Facing Knowledge Search Coverage Seed.
- Falsifier: real KRN queries do not retrieve useful persisted candidates or
  reduce rereads compared with manual report search.

V342 evidence:

```txt
executionRun: fe155700-02e3-4aa3-8739-fb733fa8066c
queries: exact marker, graph relation, heartbeat, consensus, source-to-decision
strong: exact marker and graph relation
weak: heartbeat, consensus, broad pattern/source-to-decision via source search
report: docs/reviews/controlled-dogfood/2026-06-29-v342-product-facing-knowledge-search-usefulness-closure/REPORT.md
```

V342 outcome:

```txt
`krn source search` is useful where persisted coverage exists. The next
highest-ROI task is a tiny coverage seed for recent heartbeat, consensus,
pattern, and usefulness reports using existing ingest/readback paths.
```

## Outcome V343 Product-Facing Knowledge Search Coverage Seed

Status: complete.

Source-to-decision:

- Source: V342 knowledge search usefulness closure report.
- Mechanism: V342 showed weak query failures were mostly coverage gaps, not
  proof that ranking or UI needed work.
- KRN implication: seed a tiny bounded set of recent knowledge artifacts through
  existing paths before changing ranking or product surfaces.
- Decision: persist four compact artifacts for heartbeat, consensus,
  source-to-decision, and search-usefulness coverage.
- Does not prove: product search quality, broad corpus coverage,
  natural-language SearchDocument retrieval quality, embeddings, graph
  retrieval, product readiness, or Memory Core mutation.
- Consumer: V344 Source Search Document Retrieval Alignment.
- Falsifier: weak V342 queries still fail to retrieve seeded governed claims.

V343 evidence:

```txt
heartbeat SourceClaim: 04b097d5-7338-4b78-be55-e85d0cbb7aff
consensus SourceClaim: 55e3d7ea-b97d-4495-bec2-1154a8a10b09
source-to-decision SourceClaim: 125366b1-8bd9-4092-92d8-1aa1d2ed46ae
search-usefulness SourceClaim: 5b1e25a1-c01e-44d8-849b-1e1ec233a835
executionRun: 7f22c16e-bddf-4b1b-8e49-b2f68dc0f76b
report: docs/reviews/controlled-dogfood/2026-06-29-v343-product-facing-knowledge-search-coverage-seed/REPORT.md
```

V343 outcome:

```txt
Weak queries now retrieve specific SourceClaims. Seeded SearchDocuments were
created and hash-read back, but natural-language `krn source search` still
reported searchResults: 0, so V344 should inspect document retrieval alignment.
```

## 15. Progress

- [x] V340 complete: artifact-to-activated-SourceClaim loop.
- [x] V341 complete: product-facing knowledge search readback preview.
- [x] V342 complete: product-facing knowledge search usefulness closure.
- [x] V343 complete: product-facing knowledge search coverage seed.
- [x] V344 complete: source search document retrieval alignment.
- [x] V345 complete: source search usefulness closure after document alignment.
- [x] V346 complete: source search answer package preview.
- [x] V347 complete: heartbeat/consensus SearchDocument coverage closure.
- [ ] V348 current task: source search answer package JSON readback.

## Active Task Contract

### V344-00 Source Search Document Retrieval Alignment

Objective:

```txt
Inspect why seeded SearchDocuments have hash readback but no natural-language
`krn source search` hits, and repair only a bounded owner-file issue.
```

Allowed:

```txt
source/retrieval owner-file inspection
bounded source repair if proven
focused tests and DB-backed readback
compact report/root state update
```

Non-goals:

```txt
dashboard
API/MCP
crawler
worker daemon
new schema unless source proves current shape cannot carry readback
broad eval platform
autonomous truth runtime
Memory Core mutation
ranking rewrite
UI/API/MCP/crawler work
new DB schema
embeddings or graph runtime
ranking rewrite
```

Pattern gate:

```txt
source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier
```

Runbook: `docs/runbooks/pattern-intake.md`.
Surface Consumer Matrix: pattern/source decisions must name the consumer surface
before retention.

Success criteria:

```txt
1. owner files for artifact SearchDocument persistence and source search are identified;
2. current behavior is explained as intended or repaired with tests;
3. weak V343 document queries are rerun with DB evidence;
4. no crawler/UI/API/MCP/schema/ranking rewrite/graph runtime is added;
5. root state stays compact and advances to the next highest-ROI task.
```

## Outcome V344 Source Search Document Retrieval Alignment

Status: complete.

Source-to-decision:

- Source: V343 coverage seed report and current DB readback.
- Mechanism: `krn source search` built lexical SearchDocument retrieval from the
  whole synthetic TaskContract text, so PostgreSQL FTS searched proof-boundary
  constraints and non-goals in addition to the operator query.
- KRN implication: source-search document retrieval should use the operator
  query only, while CLI output separately carries proof/non-proof boundaries.
- Decision: pass a query-only source ActivationQuery to
  `retrieveActivationCandidates` in `runSourceSearchCommand`; no schema,
  ranking rewrite, embeddings, graph runtime, crawler, UI/API/MCP, or Memory
  Core mutation.
- Does not prove: broad product search quality, embeddings, graph retrieval,
  crawler readiness, product readiness, or second-operator usability.
- Consumer: V345 Source Search Usefulness Closure After Document Alignment.
- Falsifier: repaired source search does not reduce rereads or returns noisy
  SearchDocuments that do not help a real Pattern Application Gate.

V344 evidence:

```txt
changed:
  packages/cli/src/runSourceSearchCommand.ts
  packages/cli/src/runSourceSearchCommand.test.ts
report:
  docs/reviews/controlled-dogfood/2026-06-29-v344-source-search-document-retrieval-alignment/REPORT.md
evidenceBundle: 114cc144-da04-4acb-b119-2e18ea984ab3
observationGroup: 002d0674-5376-4d17-85d7-abd8f84eca83
reflectionRecord: 304d33f1-f11b-4dba-b44b-8f025807d471
DB readback:
  memory staleness heartbeat candidate MemoryRecord -> searchResults: 1, e0cbc2e9-fdef-41e9-aacc-2262c64ae152
  consensus candidate dissent decision options -> searchResults: 1, 3eb44f5a-bc41-4630-ab82-cfbf552c270d
  source-to-decision retention gate consumer falsifier -> searchResults: 1, 64d78b2b-bb04-4039-a4ad-c72ecf2f6d47
  product-facing knowledge search usefulness coverage seed -> searchResults: 1, e4028fde-2a3b-418c-a429-62cd2c697079
```

V344 outcome:

```txt
Seeded SearchDocuments now appear in natural-language source-search results.
The next task should measure usefulness after alignment instead of adding a new
retrieval feature.
```

## Outcome V345 Source Search Usefulness Closure After Document Alignment

Status: complete.

Source-to-decision:

- Source: V344 source-search document retrieval alignment report and V345 DB
  readback.
- Mechanism: V344 made source search retrieve documents from the operator query;
  V345 confirmed seeded natural-language Pattern Application Gate queries now
  return both governed SourceClaims and matching SearchDocuments.
- KRN implication: source search is useful enough to drive pre-coding decisions
  on seeded knowledge, but the raw candidate list still requires manual answer
  synthesis.
- Decision: execute V346 Source Search Answer Package Preview before crawler,
  UI/API/MCP, ranking rewrite, embeddings, graph runtime, worker daemon, schema,
  or Memory Core mutation.
- Does not prove: source truth, broad product search quality, ranking quality,
  embeddings, graph retrieval, crawler readiness, product readiness, or Memory
  Core mutation safety.
- Consumer: technical operators using source search as a Pattern Application
  Gate.
- Falsifier: answer-package preview hides proof boundaries, overclaims source
  truth, or does not reduce rereads compared with raw source-search output.

V345 evidence:

```txt
executionRun: 16f1946d-4758-49ca-9725-3a2ed9d08ca8
report: docs/reviews/controlled-dogfood/2026-06-29-v345-source-search-usefulness-closure-after-document-alignment/REPORT.md
evidenceBundle: c59290f6-4171-4797-b053-ae66ee533d70
observationGroup: 8749b98a-0a7c-4944-abc4-47ae42aac415
reflectionRecord: da630ae4-006c-44b2-bc7f-d8b7fadc87ad
source-to-decision query: 11 SourceClaims, 1 SearchDocument
search-usefulness query: 11 SourceClaims, 1 SearchDocument
future-task scan: 11 SourceClaims, 0 SearchDocuments
helped SourceClaims: 125366b1-8bd9-4092-92d8-1aa1d2ed46ae, 5b1e25a1-c01e-44d8-849b-1e1ec233a835, 04b097d5-7338-4b78-be55-e85d0cbb7aff, 55e3d7ea-b97d-4495-bec2-1154a8a10b09
helped SearchDocuments: 64d78b2b-bb04-4039-a4ad-c72ecf2f6d47, e4028fde-2a3b-418c-a429-62cd2c697079
```

V345 outcome:

```txt
Repaired source search reduces rereads for seeded Pattern Application Gate
questions. The next highest-ROI product-facing brain task is a compact answer
package over existing source-search results, not a new retrieval subsystem.
```

## Outcome V346 Source Search Answer Package Preview

Status: complete.

Source-to-decision:

- Source: V345 usefulness closure and V346 DB readback.
- Mechanism: source search had governed candidates but required manual
  synthesis; V346 renders an answer package over existing candidates while
  preserving raw output.
- KRN implication: operator-facing search should show answer, supporting
  claims/documents, missing evidence, does-not-prove, and recommended next
  action before raw candidate details.
- Decision: keep answer package preview; next close the heartbeat/consensus
  missing-SearchDocument coverage gap it exposed.
- Does not prove: source truth, answer correctness, ranking quality, broad
  coverage, product readiness, or Memory Core mutation safety.
- Consumer: technical operators using source search as a Pattern Application
  Gate.
- Falsifier: answer package hides proof boundaries, hides raw candidates, or
  fails to reduce rereads.

V346 evidence:

```txt
executionRun: 87cbd38e-77b3-4034-b140-06ebd70645c1
report: docs/reviews/controlled-dogfood/2026-06-29-v346-source-search-answer-package-preview/REPORT.md
evidenceBundle: 586aac55-3252-4202-ac51-3097b2cd086b
observationGroup: 75501912-4c0c-41d8-aeeb-3c75e0a33295
reflectionRecord: c13ca094-5d38-4eff-9735-657c1f6b2e52
changed: packages/cli/src/runSourceSearchCommand.ts, packages/cli/src/runSourceSearchCommand.test.ts
source-to-decision package: 5 supporting SourceClaims, 1 supporting SearchDocument
future-task package: 6 supporting SourceClaims, 0 supporting SearchDocuments
verification: CLI targeted test, workspace typecheck, full workspace test, db:ready, git diff --check
```

V346 outcome:

```txt
`krn source search` now gives a compact answer package before raw candidates.
The next task should close the heartbeat/consensus missing-SearchDocument gap,
not add a new retrieval subsystem.
```

## Outcome V347 Heartbeat/Consensus SearchDocument Coverage Closure

Status: complete.

Source-to-decision:

- Source: V346 answer package report, V343 coverage seed report, and V347 DB
  readback.
- Mechanism: topic-specific heartbeat and consensus queries retrieve their
  SearchDocuments, while the broad combined heartbeat/consensus/eval query does
  not.
- KRN implication: answer packages should guide operators to split broad
  mixed-topic queries before changing retrieval, ranking, or coverage.
- Decision: repair query guidance only; reject retrieval, ranking, schema,
  crawler, UI/API/MCP, graph runtime, worker, or coverage changes for this
  slice.
- Does not prove: source truth, ranking quality, semantic query understanding,
  product readiness, or Memory Core mutation safety.
- Consumer: technical operators using answer packages for next-task decisions.
- Falsifier: specific heartbeat/consensus queries cannot retrieve documents, or
  broad-query guidance still implies retrieval/coverage repair first.

V347 evidence:

```txt
executionRun: 394ad4fb-a73d-4a71-86f8-bcb072d168fd
report: docs/reviews/controlled-dogfood/2026-06-29-v347-heartbeat-consensus-search-document-coverage-closure/REPORT.md
evidenceBundle: 6f62e321-4403-4d56-9417-5cfbf3a4d821
observationGroup: b5ebeb81-dc4c-4275-a59f-e4b4829ab754
reflectionRecord: 9e34d736-c256-4c85-b077-a4c09c6b5fa9
changed: packages/cli/src/runSourceSearchCommand.ts, packages/cli/src/runSourceSearchCommand.test.ts
heartbeat-specific: 11 SourceClaims, 1 SearchDocument
consensus-specific: 11 SourceClaims, 1 SearchDocument
broad-composite-after: 11 SourceClaims, 0 SearchDocuments, query-split guidance
verification: CLI targeted test, workspace typecheck, db:ready, git diff --check
```

V347 outcome:

```txt
The missing document was a broad-query guidance gap, not missing heartbeat or
consensus coverage. The next product-facing step is typed JSON readback for the
answer package.
```

### V348-00 Source Search Answer Package JSON Readback

Objective:

```txt
Expose the current source-search answer package as typed JSON readback while
preserving the existing text output and raw candidates.
```

Allowed:

```txt
bounded CLI JSON output over existing answer package data
focused tests
DB-backed readback
focused tests if source changes
compact report/root state update
bounded next-task synthesis from evidence
```

Non-goals:

```txt
dashboard
API/MCP
crawler
worker daemon
new schema
broad eval platform
ranking rewrite
embeddings or graph runtime
autonomous truth runtime
Memory Core mutation
candidate promotion
```

Success criteria:

```txt
1. JSON output includes answer, supportingClaims, supportingDocuments,
   missingEvidence, doesNotProve, recommendedNextAction, and raw candidates;
2. text output remains available;
3. no retrieval/ranking/schema/product-surface change is introduced;
4. focused tests cover JSON and text behavior;
5. root state stays compact.
```

## Verification Policy

Use the narrowest relevant verification for each slice.

Docs/plan-only changes: `git diff --check`.
Source changes: `pnpm typecheck`, `pnpm test`, `git diff --check`.
DB/eval-affecting changes: `pnpm db:ready`, relevant DB smoke/readback.

If Vitest fails with a temporary-directory write error, use
`TMPDIR=/home/krn/.cache/krn-tmp pnpm test`. Do not set `TMPDIR` under the repo
checkout.

After each bounded slice, commit, push, and confirm CI when appropriate. Use a
full `git rev-parse HEAD` SHA for `gh run list --commit`; if empty, use branch
readback and match `headSha`.

## 21. Final Response Format For Codex Runs

Every continuation or completed slice must end with:

```txt
Active stream:
Current task:
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
target-workflow, security, operator-UX, or research/paper/course-driven slice,
use:

```txt
source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier
```

If pasted objectives, attachments, old prompts, or conversation summaries name
stale streams, read them as historical evidence and do not roll the active stream backward.

## 23. Plan Revision Note

At creation time this compact ledger replaced a larger active ledger shape.
Historical details belong in reports and archives, not in active context.
