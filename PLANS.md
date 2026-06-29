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
active stream: V342 Product-Facing Knowledge Search Usefulness Closure
current task: V342-00 Product-Facing Knowledge Search Usefulness Closure
latest pushed commit checked: see latest final response / GitHub checks
latest CI checked: see latest final response / GitHub checks
```

Known current gap:

```txt
V342-00 Product-Facing Knowledge Search Usefulness Closure must measure whether
the V341 readback reduces rereads/review burden on real KRN questions before
any UI/API/MCP/crawler/ranking work.
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
  `krn source search --query` readback over that persisted substrate
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
```

Recent report range:

```txt
docs/reviews/controlled-dogfood/2026-06-29-v324-.../REPORT.md
...
docs/reviews/controlled-dogfood/2026-06-29-v340-ingest-v0-product-loop-closure/REPORT.md
```

## Outcome V340 Ingest v0 Product Loop Closure

Status: complete.

Source-to-decision:

- Source: V339 consensus/eval preview report.
- Mechanism: KRN needed one bounded local artifact path before crawler, UI,
  API, MCP, worker daemon, schema expansion, or broad eval work.
- KRN implication: product-facing knowledge search should grow from a proven
  artifact-to-activated-knowledge path.
- Decision: use existing local artifact preview, persisted `SearchDocument`,
  `SourceClaim`, activation, and run readback surfaces; add no product surface.
- Does not prove: source truth, product search quality, broad corpus ingest,
  embeddings, graph retrieval, crawler readiness, product readiness, or Memory
  Core mutation.
- Consumer: V341 Product-Facing Knowledge Search Readback Preview.
- Falsifier: persisted local artifact claim/search document cannot be read back
  or activated in a later plan by marker query.

V340 evidence:

```txt
artifact: docs/reviews/controlled-dogfood/2026-06-29-v340-ingest-v0-product-loop-closure/ARTIFACT.md
sourceArtifact: f6db868a-4c82-406a-8371-9ab7d8594fc5
searchDocument: 6f045cc4-e8c9-4555-8425-167d74e5d319
sourceClaim: 3363383c-02d0-4e5a-9674-132c1bc41b51
activationRun: dab76e12-054e-4ac1-a4b4-783e42f69ed4
retrievalRun: 31fb0db3-0277-4caa-b978-5b6e19a24143
```

V340 outcome:

```txt
The V340 SourceClaim was included in a later persisted plan. The matching
SearchDocument was readable and ranked, but excluded over budget. This proves a
bounded reviewable artifact-to-activated-knowledge path, not product search
quality.
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

## 15. Progress

- [x] V340 complete: artifact-to-activated-SourceClaim loop.
- [x] V341 complete: product-facing knowledge search readback preview.
- [ ] V342 current task: product-facing knowledge search usefulness closure.

## Active Task Contract

### V342-00 Product-Facing Knowledge Search Usefulness Closure

Objective:

```txt
Run `krn source search` on 3-5 real KRN knowledge questions and decide whether
the preview reduces rereads, review burden, and context uncertainty.
```

Allowed:

```txt
read-only CLI usage
DB-backed readback dogfood
compact usefulness report/root state update
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
1. 3-5 real queries are run through `krn source search`;
2. candidates are classified helped/neutral/noise/missing;
3. review burden/reread delta is recorded;
4. output limitations and non-proof boundaries are explicit;
5. next product move is either bounded repair or hold for more evidence;
6. root state stays compact and advances to the next highest-ROI task.
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
