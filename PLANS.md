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
active stream: V341 Product-Facing Knowledge Search Readback Preview
current task: V341-00 Product-Facing Knowledge Search Readback Preview
latest pushed commit checked: see latest final response / GitHub checks
latest CI checked: see latest final response / GitHub checks
```

Known current gap:

```txt
V340 closed one small artifact-to-activated-SourceClaim loop.
V341-00 Product-Facing Knowledge Search Readback Preview must turn that substrate into the smallest product-facing
knowledge search/readback preview before any UI/API/MCP/crawler work.
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
  SearchDocument/SourceClaim -> later activated SourceClaim
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

## 15. Progress

- [x] V340 complete: artifact-to-activated-SourceClaim loop.
- [ ] V341 current task: product-facing knowledge search readback preview.

## Active Task Contract

### V341-00 Product-Facing Knowledge Search Readback Preview

Objective:

```txt
Given a query, show persisted knowledge candidates, why they are reviewable,
what was excluded, and what the readback does not prove.
```

Allowed:

```txt
small CLI/readback surface or existing-surface extension
focused tests
DB-backed readback dogfood
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
1. query readback shows persisted SourceClaim/SearchDocument candidates;
2. output includes reviewability/proof/non-proof boundaries;
3. exclusions or no-match guidance are visible;
4. tests cover the behavior;
5. DB-backed dogfood records readback evidence;
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
