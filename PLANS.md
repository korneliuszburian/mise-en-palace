# KRN Continuous Brain Growth Active Ledger

Status: compact active ledger. Date: 2026-06-29.

Root `GOAL.md` states the continuous objective. Root `PLAN.md` is the compact
product source of truth. This file keeps only current state, recent outcomes,
the active task contract, and response requirements.

## Current State

```txt
controlled-internal-alpha for technical operators: yes / stronger
product-ready: no
widened internal alpha: no
V02-01 real second-operator proof: blocked/deferred
active stream: V354 Source Search Answer Usefulness Classification
current task: V354-00 Source Search Answer Usefulness Classification
latest pushed commit checked: 462a47a before V353 closeout
```

stale attachment objective guard: attachments are evidence, not authority to
roll the active stream backward.

Known current gap:

```txt
V354-00 Source Search Answer Usefulness Classification must move V353 local
answer-usefulness labels into source-search JSON without changing ranking,
schema, retrieval semantics, product surfaces, or Memory Core state.
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

Pattern intake and retained source decisions use `docs/runbooks/pattern-intake.md`.
Surface Consumer Matrix routing remains required for source/pattern work.

Current readiness:

```txt
repo/current-truth hygiene: strong
evidence/review loop: DB-backed
candidate reviewability: core primitive
source-search readback: useful but still pre-product
pattern brain: partial
ingest v0: one local artifact-to-use loop proven
graph brain: relation/readback previews exist
heartbeat/dreaming: candidate previews only
consensus: eval/candidate preview only
product-ready: no
```

Important distinctions:

```txt
SourceClaim included != source truth
SearchDocument ranked != product search quality
answer usefulness != answer correctness
green test != product value
```

## Recent Outcomes

```txt
V340 complete: artifact-to-activated-SourceClaim loop.
V341 complete: product-facing `krn source search --query` preview.
V342 complete: search usefulness closure showed coverage gaps.
V343 complete: coverage seed for recent source-search weak spots.
V344 complete: SearchDocument retrieval alignment.
V345 complete: search usefulness closure after alignment.
V346 complete: answer package preview.
V347 complete: heartbeat/consensus SearchDocument coverage closure.
V348 complete: answer package JSON readback.
V349 complete: JSON consumer proof over two answer packages.
V350 complete: five-case mini Brain-QA JSON batch.
V351 complete: missingEvidence specificity repair.
V352 complete: source-search JSON diagnostics usefulness closure.
V353 complete: answer usefulness classified over five JSON answer packages.
```

## Outcome V353 Mini Brain-QA Answer Usefulness Closure

Status: complete.

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-29-v353-mini-brain-qa-answer-usefulness-closure/REPORT.md
```

Evidence:

```txt
executionRun: 64a00778-f3cd-4c71-9edd-7957210acf0e
cases: 5
useful: 4
partly_useful_missing_document: 1
not_useful: 0
allRawCandidatesInspectable: true
memoryMutation: none
```

Source-to-decision:

- Source: V353 JSON batch summary and V352 diagnostics closure.
- Mechanism: existing answer-package fields expose supporting claim/document
  counts, missing evidence, raw candidate inspectability, and proof boundaries.
- KRN implication: consumers can classify bounded answer usefulness without
  parsing text, but this should be part of the operator-facing output.
- Decision: open V354 to add deterministic answer usefulness classification to
  source-search JSON.
- Consumer: technical operators and the next mini Brain-QA loop.
- Falsifier: classification cannot be derived from existing answer-package
  fields without making answer-correctness or ranking-quality claims.
- Does not prove: answer correctness, source truth, ranking quality, broad
  benchmark quality, product readiness, UI/API/MCP readiness, or Memory Core
  mutation.

## Active Task V354 Source Search Answer Usefulness Classification

ID: V354-00
Name: Source Search Answer Usefulness Classification
Status: active
Goal: Add deterministic answer-usefulness classification to
`krn source search --json`.
Product rationale: V353 proved answer usefulness can be classified, but the
classification currently lives in an ad hoc local consumer.
Architectural rationale: Improve operator-facing readback before adding UI,
API, MCP, crawler, embeddings, graph runtime, worker runtime, broad benchmark,
or ranking work.
Evidence source: V353 report and `.local-lab/v353/answer-usefulness-summary.json`.
Official/external sources: none required unless implementation introduces a new
pattern.
Inputs required: V353 report, source-search JSON owner files, focused tests.
Files likely touched: source-search CLI/readback source and tests.
Allowed writes: smallest owning source/test files, compact report, root state.
Forbidden writes: DB schema, ranking rewrite, retrieval semantics, UI/API/MCP,
crawler, embeddings, graph runtime, worker runtime, broad benchmark, Memory Core
mutation, or parallel roadmap.
Output requirements: JSON includes usefulness classification and reasons derived
from existing answer-package evidence.
Definition of Done: supported claim+document cases classify useful; claim-only
document-gap cases classify partly useful; no-evidence cases classify not useful
or unknown without overclaiming.
Verification commands: targeted CLI/source-search tests, `pnpm typecheck`,
`pnpm test`, `git diff --check`.
Acceptance criteria: consumers no longer need local ad hoc usefulness
classification for V353-style answer packages.
Risk: overclaiming answer usefulness as answer correctness or ranking quality.
Rollback: revert the source/test commit and keep V353 as report-only evidence.
Condensation expectation: keep root files compact; put detailed evidence in the
V354 report.
Next-task synthesis rule: if V354 passes, run a mini Brain-QA loop using the new
field; if it fails, record why answer-package fields are insufficient.
Pattern surface: operator-UX / CLI readback / TypeScript boundary.
Primary consumer: technical operators consuming `krn source search --json`.
Does not prove: answer correctness, source truth, ranking quality, product
readiness, UI/API/MCP readiness, or Memory Core mutation.
Falsifier: useful/missing/unsupported cases cannot be classified
deterministically from current answer-package fields.

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

- [x] V350 complete: five-case mini Brain-QA JSON batch.
- [x] V351 complete: missingEvidence specificity repair.
- [x] V352 complete: source-search JSON diagnostics usefulness closure.
- [x] V353 complete: answer usefulness closure.
- [ ] V354 current task: Source Search Answer Usefulness Classification.

## Verification Policy

Use the narrowest relevant verification.

```txt
docs/plan-only: git diff --check
source: pnpm typecheck, pnpm test, git diff --check
DB/eval-affecting: pnpm db:ready, relevant DB smoke/readback
```

If Vitest hits a temporary-directory write error, use
`TMPDIR=/home/krn/.cache/krn-tmp pnpm test`. Do not set `TMPDIR` under the repo.

After each bounded slice, commit, push, and confirm CI. Use a full
`git rev-parse HEAD` SHA for CI lookup; if empty, use branch readback and match
`headSha`.

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
