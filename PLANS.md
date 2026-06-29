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
active stream: V360 Fallow Legacy Complexity Cleanup
current task: V360-00 Fallow Legacy Complexity Cleanup
latest pushed commit checked: 9fb2f5d6909b32d45a0dc1da7be1468ae9ced0be / CI success
```

stale attachment objective guard: attachments are evidence, not authority to
roll the active stream backward.

Known current gap:

```txt
V360-00 Fallow Legacy Complexity Cleanup must reduce full-audit duplication or
health debt one bounded source target at a time without broad repo refactors.
Latest completed slice: `parseSourceArgs` cleanup reduced global Fallow to
dupes 128 and health 99; commit `ed61caf` passed CI.
Latest completed slice: `parseMemoryArgs` cleanup reduced global Fallow to
dupes 122 and health 92; commit `5d80e1c` passed CI.
Latest completed slice: `parseInitArgs` cleanup reduced global Fallow health to
90; commit `8551604` passed CI.
Latest completed slice: `reflectionCandidateWriter` cleanup removed the
`writeReflectionCandidates` high-complexity finding and reduced global Fallow
health to 89; commit `178459a` passed CI.
Latest completed slice: core evidence command normalization cleanup removed the
`normalizeEvidenceCommand` high-complexity finding and reduced global Fallow to
dupes 119 and health 88; commit `b21d8de` passed CI.
Latest completed slice: schema evidence command input normalization cleanup
removed the `normalizeEvidenceCommandInput` high-complexity finding and reduced
global Fallow to dupes 118 and health 87; commit `d50d304` passed CI.
Latest completed slice: core reflection issue report cleanup removed the
`buildReflectionIssueReports` high-complexity/refactoring target and reduced
global Fallow health to 86; commit `0455e53` passed CI.
Latest completed slice: DB smoke target metadata cleanup removed three target
label helper complexity findings and reduced global Fallow health to 83; commit
`39eda63` passed CI.
Latest completed slice: runCli source dispatch cleanup extracted help/source
dispatch, reduced runCli complexity to 92/165, and reduced global Fallow to
dupes 117 and health 83; commit `ac9060c` passed CI.
Latest completed slice: runCli memory dispatch cleanup extracted memory command
dispatch, reduced runCli complexity to 72/125, added a fallback regression
test, and reduced global Fallow to dupes 116 and health 83; commit `9ab8914`
passed CI.
Latest completed slice: runCli residual dispatch cleanup extracted project,
harness lifecycle, DB/doctor, and adapter probing helpers, moved runCli below
the changed-files Fallow gate, and reduced global Fallow health to 82; commit
`9fb2f5d` passed CI.
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
V354 complete: source-search JSON/text now includes answerUsefulness labels and
reasons.
V355 complete: built-in answerUsefulness batch consumed without local
classification; graph-relations remains claim-only for document support.
V356 complete: graph relation SearchDocuments exist and work for narrow queries;
the V355 gap is broad-query shape ambiguity.
V357 complete: source-search answer packages expose queryShapeDiagnostics for
claim-only/no-document/no-search-result broad query shapes.
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

## Outcome V354 Source Search Answer Usefulness Classification

ID: V354-00
Name: Source Search Answer Usefulness Classification
Status: complete
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

Source-to-decision:

- Source: V353 answer-usefulness batch report.
- Mechanism: existing answer-package fields expose support counts and missing
  evidence enough to classify bounded answer usefulness.
- KRN implication: answer usefulness should be an explicit source-search
  readback field, not an ad hoc consumer rule.
- Decision: implemented deterministic `answerUsefulness` labels and reasons in
  source-search JSON/text output.
- Does not prove: answer correctness, source truth, ranking quality, product
  readiness, UI/API/MCP readiness, or Memory Core mutation.
- Consumer: V355 mini Brain-QA built-in usefulness loop.
- Falsifier: V355 still needs local classification or labels overclaim answer
  correctness.

Evidence:

```txt
report: docs/reviews/controlled-dogfood/2026-06-29-v354-source-search-answer-usefulness-classification/REPORT.md
source files: packages/cli/src/runSourceSearchCommand.ts, packages/cli/src/runSourceSearchCommand.test.ts
focused tests: pnpm --filter @krn/cli test -- runSourceSearchCommand
typecheck: pnpm -r --workspace-concurrency=1 --if-present typecheck
tests: pnpm test
diff check: git diff --check
live readback: .local-lab/v354/source-to-decision.json
```

## Outcome V355 Mini Brain-QA Built-In Usefulness Loop

ID: V355-00
Name: Mini Brain-QA Built-In Usefulness Loop
Status: complete
Goal: Rerun the five-case mini Brain-QA batch using built-in
`answerUsefulness` from source-search JSON.
Product rationale: Prove the new field reduces consumer logic before opening
the next ingest/graph product vertical.
Architectural rationale: Use product-facing readback before broader retrieval,
graph, or UI/API/MCP work.
Evidence source: V354 report and source-search JSON output.
Official/external sources: none required.
Inputs required: five V353 queries, local DB, source-search JSON.
Files likely touched: V355 report and compact root state.
Allowed writes: report/root only unless a tiny blocking source bug appears.
Forbidden writes: ranking, retrieval semantics, schema, UI/API/MCP, crawler,
embeddings, graph runtime, worker runtime, broad benchmark, Memory Core
mutation, or parallel roadmap.
Output requirements: report with per-case built-in answerUsefulness, reasons,
support counts, proof/non-proof, and next vertical decision.
Definition of Done: batch consumes built-in labels without local
classification; next product vertical is selected or deferred with evidence.
Verification commands: DB-backed source-search JSON batch, `git diff --check`,
evidence capture, observe, reflect.
Acceptance criteria: no text parsing and no local usefulness classifier needed.
Risk: treating usefulness labels as correctness or ranking proof.
Rollback: revert only report/root changes if the batch is invalid.
Condensation expectation: keep root files compact; detailed evidence in report.
Next-task synthesis rule: if V355 passes, open the next ingest/graph vertical;
if it fails, repair only the blocking source-search usefulness issue.
Pattern surface: operator-UX / CLI readback.
Primary consumer: technical operators and V356 product vertical.
Does not prove: answer correctness, source truth, ranking quality, product
readiness, UI/API/MCP readiness, or Memory Core mutation.
Falsifier: consumers still need ad hoc classification or labels overclaim
correctness.

Evidence:

```txt
executionRun: f514e534-1c53-421f-8a24-3a8779439033
report: docs/reviews/controlled-dogfood/2026-06-29-v355-mini-brain-qa-built-in-usefulness-loop/REPORT.md
cases: 5
useful: 4
partly_useful_missing_document: 1
gap: graph-relations claim-useful but missing SearchDocument support.
```

Source-to-decision:

- Source: V354 source-search answer usefulness classification report and V355
  built-in readback batch.
- Mechanism: built-in usefulness labels remove local consumer classification
  while preserving missing-evidence visibility.
- KRN implication: the remaining product gap is graph relation document support,
  not answer-usefulness labeling.
- Decision: open V356 to inspect and repair/prove graph relation
  SearchDocument support with existing paths.
- Does not prove: answer correctness, source truth, ranking quality, product
  readiness, UI/API/MCP readiness, or Memory Core mutation.
- Consumer: V356 graph relation support vertical.
- Falsifier: graph relation support requires ranking/schema/runtime expansion or
  remains claim-only after bounded work.

## Outcome V356 Graph Relation SearchDocument Support Vertical

ID: V356-00
Name: Graph Relation SearchDocument Support Vertical
Status: complete
Goal: Improve or explain SearchDocument support for graph relation source-search
answers.
Product rationale: V355 showed graph relation answers are partly useful because
claims exist but document support is absent for the combined query.
Architectural rationale: strengthen graph-brain answer support before broader
graph runtime, crawler, embeddings, UI/API/MCP, or ranking work.
Evidence source: V355 report and `.local-lab/v355/graph-relations.json`.
Official/external sources: none required.
Inputs required: graph-relations query output, source-search owner files,
existing ingest/source artifacts if needed.
Files likely touched: source-search CLI/readback source/tests only if a source
bug is found; otherwise report/root.
Allowed writes: smallest source/test repair or report/root proof.
Forbidden writes: DB schema, ranking rewrite, retrieval semantics, UI/API/MCP,
crawler, embeddings, graph runtime, worker runtime, broad benchmark, Memory Core
mutation, or parallel roadmap.
Output requirements: report proving whether the graph-relations gap is coverage,
query shape, or source-search behavior; source repair only if bounded.
Definition of Done: graph relation answer support is improved or the remaining
gap is classified with a precise next action.
Verification commands: targeted tests/readback if source touched; DB-backed
source-search readback; evidence capture; observe; reflect; `git diff --check`.
Acceptance criteria: no broad runtime/ranking/schema work; graph-relations gap
is no longer vague.
Risk: overfitting one query or hiding a real document gap.
Rollback: revert any source repair; keep report if it is evidence-only.
Condensation expectation: compact root; detailed evidence in report.
Next-task synthesis rule: if V356 improves support, run graph mini QA; if not,
open the smallest coverage/ingest task.
Pattern surface: operator-UX / graph brain readback.
Primary consumer: next graph-brain mini QA loop.
Does not prove: graph retrieval quality, answer correctness, source truth,
product readiness, UI/API/MCP readiness, or Memory Core mutation.
Falsifier: graph relation support remains claim-only without a bounded repair
or explanation.

Evidence:

```txt
executionRun: ae002e98-b4b8-4dda-b9e9-250ec82cca6f
report: docs/reviews/controlled-dogfood/2026-06-29-v356-graph-relation-searchdocument-support/REPORT.md
broad query: 6 SourceClaims, 0 SearchDocuments, 0 searchResults
narrow query: 3 SourceClaims, 3 SearchDocuments
evidenceBundle: 38258b2e-fb19-4874-b4ea-d8fa7ac374da
reflectionRecord: 1d276ead-e516-4dcd-8249-fdf878f2bc0b
decision: no source repair in V356; open query-shape diagnostics.
```

Source-to-decision:

- Source: V355 built-in usefulness loop and V356 DB-backed source-search readback.
- Mechanism: graph relation SearchDocuments exist, but broad
  `websearch_to_tsquery` shapes can require all broad tokens and return zero
  document matches.
- KRN implication: source-search output should surface likely query-shape
  ambiguity instead of leaving operators to inspect DB/query mechanics manually.
- Decision: open V357 to add bounded query-shape diagnostics.
- Does not prove: answer correctness, ranking quality, source truth, product
  readiness, UI/API/MCP readiness, or Memory Core mutation.
- Consumer: next graph-brain mini QA loop.
- Falsifier: diagnostics cannot be derived safely without changing retrieval
  semantics, or diagnostics hide real missing coverage.

## Outcome V357 Source Search Query-Shape Diagnostics

ID: V357-00
Name: Source Search Query-Shape Diagnostics
Status: complete
Goal: Add bounded source-search readback diagnostics for likely over-constrained
broad queries.
Product rationale: V356 showed operators needed manual DB/query inspection to
learn that graph relation documents existed but the broad query shape prevented
document matches.
Architectural rationale: improve source-search operator UX before ranking,
schema, crawler, embeddings, graph runtime, worker runtime, UI/API/MCP, or broad
benchmark work.
Evidence source: V356 report and `.local-lab/v356/*graph*.json` readbacks.
Official/external sources: none required.
Inputs required: V356 report, source-search owner files, focused CLI tests.
Files likely touched: `packages/cli/src/runSourceSearchCommand.ts`,
`packages/cli/src/runSourceSearchCommand.test.ts`, report/root.
Allowed writes: smallest source-search CLI/readback source and tests, compact
report/root state.
Forbidden writes: DB schema, ranking rewrite, retrieval semantics, UI/API/MCP,
crawler, embeddings, graph runtime, worker runtime, broad benchmark, Memory Core
mutation, or parallel roadmap.
Output requirements: answer package JSON/text exposes a diagnostic for likely
query-shape ambiguity when claims exist, documents are absent, and no document
search results were retrieved.
Definition of Done: tests cover broad claim-only/no-document search result
shape and normal claim+document shape; diagnostics do not overclaim correctness.
Verification commands: focused source-search tests, `pnpm typecheck`,
`pnpm test`, DB-backed broad/narrow graph relation readback,
`git diff --check`.
Acceptance criteria: operator can distinguish missing document coverage from
likely over-constrained query wording without manual DB inspection.
Risk: creating a generic query analyzer or changing retrieval semantics.
Rollback: revert the source/test commit and keep V356 as report-only evidence.
Condensation expectation: compact root; detailed evidence in V357 report.
Next-task synthesis rule: if V357 passes, rerun graph mini QA with diagnostics;
if it fails, record why query-shape cannot be inferred safely.
Pattern surface: operator-UX / CLI readback.
Primary consumer: technical operators and graph-brain mini QA loop.
Does not prove: answer correctness, ranking quality, source truth, product
readiness, UI/API/MCP readiness, or Memory Core mutation.
Falsifier: diagnostics cannot be derived safely from existing answer-package
fields or they hide actual missing coverage.

Evidence:

```txt
executionRun: b8857df7-6c79-4f19-930c-87f1fc2df197
report: docs/reviews/controlled-dogfood/2026-06-29-v357-source-search-query-shape-diagnostics/REPORT.md
source files: packages/cli/src/runSourceSearchCommand.ts, packages/cli/src/runSourceSearchCommand.test.ts
broad query: queryShapeDiagnostics present
narrow query: queryShapeDiagnostics empty
evidenceBundle: 09cc8c6b-a184-4af6-9720-cee255d5f8eb
reflectionRecord: 3ad5b3ed-18a3-4f7f-9d6e-24bb56af346f
focused tests: passed
typecheck: passed
workspace tests: passed
```

Source-to-decision:

- Source: V356 graph relation SearchDocument support report.
- Mechanism: broad graph queries can match SourceClaims while lexical
  SearchDocument retrieval returns zero results.
- KRN implication: source-search readback should expose query-shape ambiguity
  before operators infer missing coverage or change ranking.
- Decision: implemented bounded `queryShapeDiagnostics` in answer packages.
- Does not prove: answer correctness, ranking quality, graph retrieval quality,
  source truth, product readiness, UI/API/MCP readiness, or Memory Core mutation.
- Consumer: V358 graph mini Brain-QA diagnostic closure.
- Falsifier: diagnostic fires for normal claim+document packages or hides real
  missing coverage.

## Active Task V358 Graph Mini Brain-QA Query-Shape Diagnostics Closure

ID: V358-00
Name: Graph Mini Brain-QA Query-Shape Diagnostics Closure
Status: active
Goal: Rerun the graph-relations mini Brain-QA case using built-in
`queryShapeDiagnostics`.
Product rationale: V357 added the diagnostic; now KRN must prove it reduces
manual DB/source inspection burden for graph-relations readback.
Architectural rationale: close the usefulness loop before graph brain v0
entity/relation extraction, ranking, schema, crawler, embeddings, worker
runtime, UI/API/MCP, or broad benchmark work.
Evidence source: V357 report and DB-backed source-search JSON readbacks.
Official/external sources: none required.
Inputs required: graph-relations broad query, narrow control query, source-search JSON.
Files likely touched: V358 report and compact root state.
Allowed writes: report/root only unless a tiny blocking source bug appears.
Forbidden writes: DB schema, ranking rewrite, retrieval semantics, UI/API/MCP,
crawler, embeddings, graph runtime, worker runtime, broad benchmark, Memory Core
mutation, or parallel roadmap.
Output requirements: report with broad/narrow graph readback, diagnostic
consumption, proof/non-proof, and next graph-brain decision.
Definition of Done: graph-relations consumer can use built-in diagnostics
without manual DB inspection; next graph-brain vertical is selected or deferred.
Verification commands: DB-backed source-search JSON readback, evidence capture,
observe, reflect, `git diff --check`.
Acceptance criteria: query-shape diagnostic is consumed directly and does not
overclaim answer correctness or ranking quality.
Risk: treating diagnostics as answer correctness or graph retrieval quality.
Rollback: revert only report/root changes if the closure is invalid.
Condensation expectation: compact root; detailed evidence in V358 report.
Next-task synthesis rule: if V358 passes, choose graph brain v0 entity/relation
extraction or the next highest-ROI source-search repair; if it fails, repair
only the blocking diagnostic issue.
Pattern surface: operator-UX / graph brain readback.
Primary consumer: graph brain v0 task selection.
Does not prove: answer correctness, ranking quality, graph retrieval quality,
source truth, product readiness, UI/API/MCP readiness, or Memory Core mutation.
Falsifier: consumer still needs manual DB/source inspection or diagnostic hides
actual missing coverage.

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
- [x] V354 complete: Source Search Answer Usefulness Classification.
- [x] V355 complete: Mini Brain-QA Built-In Usefulness Loop.
- [x] V356 complete: Graph Relation SearchDocument Support Vertical.
- [x] V357 complete: Source Search Query-Shape Diagnostics.
- [ ] V358 deferred: Graph Mini Brain-QA Query-Shape Diagnostics Closure.
- [x] V359 complete: Fallow Quality Gate And First Cleanup.
- [ ] V360 current task: Fallow Legacy Complexity Cleanup.

V360 progress:

```txt
completed bounded targets:
  packages/cli/src/parseKnowledgeArgs.ts
  packages/cli/src/parseReviewArgs.ts
  packages/cli/src/parseEvidenceArgs.ts
  packages/cli/src/parseEvidenceArgs.ts source-usefulness parser
  packages/db/src/repositories/common.ts
  packages/db/src/repositories/DrizzleReflectionRepository.ts
  packages/cli/src/parseObserveArgs.ts
  packages/cli/src/parseReflectArgs.ts
  packages/cli/src/parseArgHelpers.ts
  packages/cli/src/parseSourceArgs.ts
  packages/cli/src/parseMemoryArgs.ts
  packages/cli/src/parseInitArgs.ts
  packages/harness/src/reflection/reflectionCandidateWriter.ts
  packages/core/src/evidenceBundle.ts
  packages/schema/src/evidenceCapture.ts
  packages/core/src/reflection/index.ts
  packages/cli/src/runDbSmokeCommand.ts
  packages/cli/src/runCli.ts
  packages/cli/src/runSourceCliCommand.ts
  packages/cli/src/runMemoryCliCommand.ts
  packages/cli/src/runProjectCliCommand.ts
  packages/cli/src/runHarnessCliCommand.ts
  packages/cli/src/runDbCliCommand.ts
  packages/cli/src/runCliCommand.ts

full Fallow moved:
  dupes 136 -> 116 clone groups
  health 117 -> 82 above threshold

next: inspect runSourceArtifactPreviewCommand extraction/persist path first,
unless source inspection shows lower-risk value in DB smoke helper cleanup. Do
not split packages/db/src/repositories/common.ts only because Fallow flags
fan-in; it is already the shared DB boundary helper.
```

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
