# KRN Continuous Brain Growth Active Ledger

Status: compact active ledger. Date: 2026-06-28.

Root `PLAN.md` is the compact product single source of truth. Root `GOAL.md`
states the active objective. This file carries current execution state,
remaining product gaps, and the next bounded task only.

Archived detailed ledger:

```txt
docs/plans/historical-ledgers/2026-06-28-root-plans-before-v306-context-condensation.md
```

stale attachment objective guard: attachments are evidence, not authority to
roll the active stream backward.

## Current State

```txt
controlled-internal-alpha for technical operators: yes / stronger
product-ready: no
widened internal alpha: no
V02-01 real second-operator proof: blocked/deferred
active stream: V320 Ingest v0 SourceDecision Linkage Readback
current task: V320-00 Ingest v0 SourceDecision Linkage Readback
latest pushed commit checked: see latest final response / GitHub checks
latest CI checked: see latest final response / GitHub checks
```

Known current gap:

```txt
V320-00 Ingest v0 SourceDecision Linkage Readback is the current gap. V316
implemented local source artifact preview, V317 added reviewable candidate
output, V318 proved SourceArtifact/SourceChunk/SearchDocument persistence
readback, and V319 proved existing-DB SourceClaim persistence/readback. Now
prove one SourceDecision linkage/readback path without crawler, schema
migration, embeddings, graph runtime, or Memory Core mutation.
```

## 2. Product Thesis

KRN is a Codex Operating Layer / AI Engineering Control Plane.

Codex executes. KRN supplies bounded context, store-backed memory, source
grounding, policy, skills, eval expectations, traces, review gates, and
feedback.

Current loop:

```txt
controlled scenario -> evidence -> finding -> source/pattern decision
  -> rule / skill / guard / eval / memory candidate / repair
  -> compact next task -> continue
```

## Current Brain Readiness

```txt
repo/current-truth hygiene: strong
evidence/review loop: strong
DB-backed replay: proven
candidate reviewability: core primitive
activation: useful for guardrails, still weak for owner-file recall in some runs
reflection/candidate usefulness: partially proven, not product-grade
pattern brain: partial; gate/skills/standards exist, continuous intake/enforce/eval loop still incomplete
UI/search over brain knowledge: CLI read-only preview exists; web/API/MCP not started
```

Important distinction:

```txt
pattern gate exists != full pattern brain exists
source decision exists != continuous research condensation exists
skill exists != all Codex work is skill-routed
green test != product value
```

## Remaining Product Gaps

1. Pattern Brain execution/readback hardening: keep future search changes
   usefulness-backed.
2. Research/paper/course source decisions: V308 added the first bounded pack;
   future sources still require consumer, falsifier, and does-not-prove.
3. Mini brain-QA benchmark: BQ-015 is executed and covered; BQ-023, BQ-024,
   BQ-025, and BQ-028 are executed; next use that result to start Ingest v0.
4. Ingest v0: local artifact preview, candidate bridge, SearchDocument
   persistence/readback, and SourceClaim persistence/readback exist; next prove
   one existing-DB SourceDecision linkage/readback path without schema work.
5. Graph brain v0: entities, events, claims, relations, duplicates,
   contradictions, supersession, and temporal slices.
6. Heartbeat/dreaming v0: candidate generator only; no final Memory Core
   mutation without review.
7. Consensus v0: eval/candidate layer with preserved dissent, not autonomous
   truth runtime.
8. Product surfaces: web UI/search/API/MCP only after usefulness gates,
   permission/security boundaries, and read-model proof.

## Active Task Queue

### V308-00 — Research Source Decisions Initial Pack

Status: complete.

Outcome:

```txt
Retained five bounded paper decisions in docs/KRN_SOURCES.md:
MemGPT, Reflexion, Self-RAG, GraphRAG, and HippoRAG.
```

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-28-v308-research-source-decisions-initial-pack/REPORT.md
```

### V309-00 — Mini Brain-QA Benchmark Sketch

Status: complete.

Goal:

```txt
Sketch the first 30-question KRN brain-QA benchmark from retained source
decisions and existing product behavior.
```

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-28-v309-mini-brain-qa-benchmark-sketch/REPORT.md
```

### V310-00 — Executable Brain-QA Case BQ-015

Status: complete.

Goal:

```txt
Execute BQ-015 from the V309 sketch: broad no-match query -> shorter mechanism
query -> retained pattern hit.
```

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-28-v310-executable-brain-qa-bq-015/REPORT.md
```

### V311-00 — BQ-015 Fixture Coverage

Status: complete.

Goal:

```txt
Add or confirm focused test coverage for BQ-015.
```

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-28-v311-bq-015-fixture-coverage/REPORT.md
```

### V312-00 — Executable Brain-QA Case BQ-023

Status: complete.

Goal:

```txt
Execute evidence command provenance readback for BQ-023.
```

Product rationale:

```txt
The first brain-QA case covered read-only pattern retrieval. The next case
should exercise evidence/review because evidence provenance is a core KRN brain
strength and product blocker.
```

Architectural rationale:

```txt
Use existing evidence/readback surfaces before new runtime, DB schema, eval
platform, dashboard, API/MCP, source crawler, or graph work.
```

Evidence source:

```txt
V309 BQ-023, evidence integrity reports, and existing evidence command
provenance code/tests.
```

Official/external sources:

```txt
`pattern:evidence-proof-non-proof-boundary` and evidence/review KRN source
decisions.
```

Inputs required:

```txt
docs/brain-knowledge/catalog.json
docs/benchmarks/brain-qa/V309_BRAIN_QA_SKETCH.md
packages/core/src/evidenceBundle.ts
packages/cli/src/runEvidenceCaptureCommand.ts
evidence-related CLI tests
```

Files likely touched:

```txt
docs/reviews/controlled-dogfood/2026-06-28-v312-executable-brain-qa-bq-023/REPORT.md
GOAL.md
PLAN.md
PLANS.md
```

Allowed writes:

```txt
docs/report/root updates; focused tests only if BQ-023 exposes missing coverage.
```

Forbidden writes:

```txt
broad eval platform, Promptfoo expansion, source crawler, embeddings, ranking,
graph runtime, DB schema, dashboard, API/MCP, worker daemon, Memory Core
mutation, target repo writes, paid/proprietary course ingestion.
```

Output requirements:

```txt
record command provenance states, proof/non-proof boundaries, mutation boundary,
and whether BQ-023 needs focused coverage.
```

Definition of Done:

- evidence command provenance readback is executed or existing coverage is
  inspected and recorded;
- report states what the evidence proves and does not prove;
- no runtime/eval platform is built;
- `git diff --check` passes.

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-28-v312-executable-brain-qa-bq-023/REPORT.md
```

Verification commands:

```sh
git diff --check
git diff --check
```

Acceptance criteria:

```txt
BQ-023 has a concrete next evidence/readback path or a precise missing-coverage
finding.
```

Risk:

```txt
claiming command truth or product readiness from provenance readback alone.
```

Rollback:

```txt
Remove report/root updates if no evidence path can be identified without new
runtime.
```

Next-task synthesis rule:

```txt
After V312, execute the next docs/CLI-only brain-QA case.
```

Primary consumer:

```txt
future brain-QA and evidence/review validation.
```

Does not prove:

```txt
product readiness, command truth beyond recorded provenance, review judgment,
or full benchmark execution.
```

Falsifier:

```txt
BQ-023 cannot show command provenance states and proof/non-proof boundaries
through existing evidence/readback surfaces.
```

### V313-00 — Executable Brain-QA Case BQ-024

Status: complete.

Goal:

```txt
Execute dirty-context changed-file classification readback for BQ-024.
```

Product rationale:

```txt
BQ-023 covered command proof boundaries. The next evidence/review behavior is
whether KRN can classify intended, unrelated, and unknown dirty context so
future reviews do not hide unrelated work.
```

Architectural rationale:

```txt
Use existing evidence capture dirty-context surfaces before new runtime, DB
schema, eval platform, dashboard, API/MCP, source crawler, or graph work.
```

Evidence source:

```txt
V309 BQ-024, V312 report, evidence dirty-context reports, and existing
evidence capture CLI/golden tests.
```

Official/external sources:

```txt
`pattern:evidence-proof-non-proof-boundary` and evidence/review KRN source
decisions.
```

Inputs required:

```txt
docs/benchmarks/brain-qa/V309_BRAIN_QA_SKETCH.md
docs/reviews/controlled-dogfood/2026-06-28-v312-executable-brain-qa-bq-023/REPORT.md
packages/cli/src/runEvidenceCaptureCommand.ts
packages/cli/src/evidenceCaptureGoldenBehavior.test.ts
packages/cli/src/runCli.test.ts
```

Files likely touched:

```txt
docs/reviews/controlled-dogfood/2026-06-28-v313-executable-brain-qa-bq-024/REPORT.md
GOAL.md
PLAN.md
PLANS.md
focused tests only if BQ-024 exposes missing coverage
```

Allowed writes:

```txt
docs/report/root updates; focused tests only if missing coverage is found.
```

Forbidden writes:

```txt
broad eval platform, Promptfoo expansion, source crawler, embeddings, ranking,
graph runtime, DB schema, dashboard, API/MCP, worker daemon, Memory Core
mutation, target repo writes, paid/proprietary course ingestion.
```

Output requirements:

```txt
record intended/unrelated/unknown changed-file classes, dirty-context warning,
proof/non-proof boundaries, mutation boundary, and whether BQ-024 needs focused
coverage.
```

Definition of Done:

- dirty-context classification readback is executed or existing coverage is
  inspected and recorded;
- report states what the evidence proves and does not prove;
- no runtime/eval platform is built;
- `git diff --check` passes.

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-28-v313-executable-brain-qa-bq-024/REPORT.md
```

Verification commands:

```sh
git diff --check
```

Acceptance criteria:

```txt
BQ-024 has a concrete dirty-context readback path or a precise missing-coverage
finding.
```

Risk:

```txt
claiming review judgment or product readiness from changed-file classification
alone.
```

Rollback:

```txt
Remove report/root updates if no evidence path can be identified without new
runtime.
```

Next-task synthesis rule:

```txt
After V313, execute the next docs/CLI-only brain-QA case.
```

Primary consumer:

```txt
future brain-QA and evidence/review validation.
```

Does not prove:

```txt
product readiness, review judgment, command truth, dirty-context correctness
for every path form, or full benchmark execution.
```

Falsifier:

```txt
BQ-024 cannot show intended, unrelated, and unknown changed-file classes through
existing evidence/readback surfaces.
```

### V314-00 — Executable Brain-QA Case BQ-025

Status: complete.

Goal:

```txt
Execute report proof/non-proof boundary readback for BQ-025.
```

Product rationale:

```txt
BQ-023 and BQ-024 covered evidence capture behavior. The next evidence/review
case should verify that report artifacts keep "what this proves" and "what this
does not prove" boundaries explicit.
```

Architectural rationale:

```txt
Use existing reports/readbacks before new runtime, DB schema, eval platform,
dashboard, API/MCP, source crawler, or graph work.
```

Evidence source:

```txt
V309 BQ-025, V312 report, V313 report, and recent controlled-dogfood reports.
```

Official/external sources:

```txt
`pattern:evidence-proof-non-proof-boundary` and evidence/review KRN source
decisions.
```

Inputs required:

```txt
docs/benchmarks/brain-qa/V309_BRAIN_QA_SKETCH.md
docs/reviews/controlled-dogfood/2026-06-28-v312-executable-brain-qa-bq-023/REPORT.md
docs/reviews/controlled-dogfood/2026-06-28-v313-executable-brain-qa-bq-024/REPORT.md
recent controlled-dogfood reports as needed
```

Files likely touched:

```txt
docs/reviews/controlled-dogfood/2026-06-28-v314-executable-brain-qa-bq-025/REPORT.md
GOAL.md
PLAN.md
PLANS.md
focused docs/test guard only if BQ-025 exposes missing coverage
```

Allowed writes:

```txt
docs/report/root updates; focused guard only if missing coverage is found.
```

Forbidden writes:

```txt
broad eval platform, Promptfoo expansion, source crawler, embeddings, ranking,
graph runtime, DB schema, dashboard, API/MCP, worker daemon, Memory Core
mutation, target repo writes, paid/proprietary course ingestion.
```

Output requirements:

```txt
record proof/non-proof sections, report coverage status, mutation boundary, and
whether BQ-025 needs focused coverage.
```

Definition of Done:

- report proof/non-proof boundary readback is executed or existing coverage is
  inspected and recorded;
- report states what the evidence proves and does not prove;
- no runtime/eval platform is built;
- `git diff --check` passes.

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-28-v314-executable-brain-qa-bq-025/REPORT.md
```

Verification commands:

```sh
git diff --check
```

Acceptance criteria:

```txt
BQ-025 has a concrete proof/non-proof report readback path or a precise
missing-coverage finding.
```

Risk:

```txt
claiming product value from report structure alone.
```

Rollback:

```txt
Remove report/root updates if no proof/non-proof readback path can be
identified without new runtime.
```

Next-task synthesis rule:

```txt
After V314, execute the next docs/readback brain-QA case.
```

Primary consumer:

```txt
future brain-QA and evidence/review validation.
```

Does not prove:

```txt
product readiness, report truth, reviewer correctness, or full benchmark
execution.
```

Falsifier:

```txt
BQ-025 cannot show explicit proof/non-proof boundaries in current
report/readback artifacts.
```

### V315-00 — Executable Brain-QA Case BQ-028

Status: complete.

Goal:

```txt
Execute compact-root product-gap readback for BQ-028.
```

Product rationale:

```txt
After evidence/review readbacks, the next product-facing brain-QA case should
show whether compact root state is sufficient to recover unresolved product
gaps without rereading historical ledgers.
```

Architectural rationale:

```txt
Use compact root state and selected current reports before new runtime, DB
schema, eval platform, dashboard, API/MCP, source crawler, or graph work.
```

Evidence source:

```txt
V309 BQ-028, GOAL.md, PLAN.md, PLANS.md, V312-V314 reports, and selected current
reports only if needed.
```

Official/external sources:

```txt
`pattern:active-context-compact-current-truth` and `pattern:evidence-proof-non-proof-boundary`.
```

Inputs required:

```txt
GOAL.md
PLAN.md
PLANS.md
docs/benchmarks/brain-qa/V309_BRAIN_QA_SKETCH.md
docs/reviews/controlled-dogfood/2026-06-28-v314-executable-brain-qa-bq-025/REPORT.md
selected current reports only if compact root state is insufficient
```

Files likely touched:

```txt
docs/reviews/controlled-dogfood/2026-06-28-v315-executable-brain-qa-bq-028/REPORT.md
GOAL.md
PLAN.md
PLANS.md
focused docs/test guard only if BQ-028 exposes missing coverage
```

Allowed writes:

```txt
docs/report/root updates; focused guard only if missing coverage is found.
```

Forbidden writes:

```txt
historical ledger rereads, broad eval platform, Promptfoo expansion, source
crawler, embeddings, ranking, graph runtime, DB schema, dashboard, API/MCP,
worker daemon, Memory Core mutation, target repo writes, paid/proprietary
course ingestion.
```

Output requirements:

```txt
record product gaps recovered from compact state, any selected report refs,
proof/non-proof boundaries, mutation boundary, and whether BQ-028 needs focused
coverage.
```

Definition of Done:

- compact product-gap readback is executed or missing coverage is recorded;
- report states what the evidence proves and does not prove;
- no runtime/eval platform or historical-ledger reread is used;
- `git diff --check` passes.

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-28-v315-executable-brain-qa-bq-028/REPORT.md
```

Verification commands:

```sh
git diff --check
```

Acceptance criteria:

```txt
BQ-028 has a concrete compact-root product-gap readback path or a precise
missing-coverage finding.
```

Risk:

```txt
claiming arbitrary corpus QA or product readiness from compact root state.
```

Rollback:

```txt
Remove report/root updates if no compact product-gap readback path can be
identified without historical ledgers or new runtime.
```

Next-task synthesis rule:

```txt
After V315, start the next highest-ROI product-facing gap instead of extending
docs/readback-only brain-QA.
```

Primary consumer:

```txt
future compact-state continuation and product-gap planning.
```

Does not prove:

```txt
arbitrary corpus QA, graph retrieval, product readiness, or full benchmark
execution.
```

Falsifier:

```txt
BQ-028 cannot identify the main unresolved product gaps from compact current
state and selected reports without historical ledger rereads.
```

### V316-00 — Ingest v0 Local Source Artifact Preview

Status: complete.

Goal:

```txt
Inspect current source/search substrate and implement or record the smallest
local source artifact -> hash -> chunk/source-range preview path.
```

Product rationale:

```txt
The compact product-gap readback identifies Ingest v0 as the next highest-ROI
product-facing gap. KRN cannot become a useful brain without a bounded path from
source artifacts into reviewable chunks/source ranges.
```

Architectural rationale:

```txt
Start local and preview-only before source crawler, DB schema migration, worker,
API/MCP, dashboard, embeddings, ranking, graph runtime, or Memory Core mutation.
```

Evidence source:

```txt
V315 report, GOAL.md, PLAN.md, PLANS.md, current source/search/schema code.
```

Official/external sources:

```txt
`pattern:active-context-compact-current-truth`, `pattern:evidence-proof-non-proof-boundary`,
and source-to-decision KRN decisions if source behavior changes.
```

Inputs required:

```txt
GOAL.md
PLAN.md
PLANS.md
docs/reviews/controlled-dogfood/2026-06-28-v315-executable-brain-qa-bq-028/REPORT.md
source/search/schema/CLI files discovered by targeted search
```

Files likely touched:

```txt
docs/reviews/controlled-dogfood/2026-06-28-v316-ingest-v0-local-source-artifact-preview/REPORT.md
GOAL.md
PLAN.md
PLANS.md
focused package source/tests only if a small existing owner surface supports it
```

Allowed writes:

```txt
docs/report/root updates; focused source/tests for a local preview-only ingest
path if current substrate supports it.
```

Forbidden writes:

```txt
source crawler, DB schema migration, broad eval platform, Promptfoo expansion,
embeddings/ranking runtime, graph runtime, dashboard, API/MCP, worker daemon,
Memory Core mutation, target repo writes, paid/proprietary course ingestion.
```

Output requirements:

```txt
record inspected owner files, decision to implement/defer, artifact hash/chunk
preview behavior if implemented, proof/non-proof boundaries, mutation boundary,
and next product-facing action.
```

Definition of Done:

- existing source/search substrate is inspected with targeted reads;
- either a smallest local preview path is implemented with focused tests, or a
  precise missing-substrate finding is recorded;
- no forbidden runtime/platform work is added;
- report states what evidence proves and does not prove;
- verification matches touched files.

Verification commands:

```sh
git diff --check
```

If package source changes:

```sh
pnpm typecheck
pnpm test
git diff --check
```

Acceptance criteria:

```txt
V316 has either a working local source artifact preview path or a precise,
bounded missing-substrate finding that enables the next implementation slice.
```

Risk:

```txt
accidentally building a source crawler, schema migration, or broad ingestion
platform instead of a local preview slice.
```

Rollback:

```txt
Revert focused source/docs changes; no persistent schema/runtime changes should
exist.
```

Next-task synthesis rule:

```txt
If preview path is implemented, add focused coverage/readback and decide next
ingest v0 persistence/search step. If missing substrate is found, open the
smallest owner-surface repair.
```

Primary consumer:

```txt
future source grounding, graph brain, pattern intake, and product-facing
knowledge ingestion.
```

Does not prove:

```txt
mass ingest, source crawler readiness, DB persistence, graph retrieval, product
readiness, or arbitrary corpus QA.
```

Falsifier:

```txt
V316 cannot produce a local artifact preview or precise missing-substrate
finding without broad schema/runtime work.
```

### V317-00 — Ingest v0 Source Candidate Bridge

Status: complete.

Goal:

```txt
Inspect source claim/search document candidate surfaces and implement or record
the smallest local artifact preview -> reviewable candidate bridge.
```

Product rationale:

```txt
V316 made source files previewable as hash/chunk/source-range evidence. The next
brain step is making that evidence reviewable as claim/search-document candidate
output before persistence, embeddings, graph retrieval, or crawler work.
```

Architectural rationale:

```txt
Keep Ingest v0 candidate-first and preview-only. Do not mutate SourceGraph,
Memory Core, DB schema, embeddings, graph runtime, API/MCP, dashboard, worker,
or source crawler.
```

Evidence source:

```txt
V316 report, local source artifact preview output, existing SourceClaim and
SearchDocument schemas, current CLI source surfaces.
```

Official/external sources:

```txt
`pattern:evidence-proof-non-proof-boundary`, `pattern:source-to-decision-retention-gate`,
and `pattern:ts-boundary-unknown-first-result-state`.
```

Inputs required:

```txt
GOAL.md
PLAN.md
PLANS.md
docs/reviews/controlled-dogfood/2026-06-28-v316-ingest-v0-local-source-artifact-preview/REPORT.md
focused source/search CLI/schema owner files discovered by targeted search
```

Files likely touched:

```txt
focused CLI/core/schema source/tests if a small owner surface supports it
docs/reviews/controlled-dogfood/2026-06-28-v317-ingest-v0-source-candidate-bridge/REPORT.md
GOAL.md
PLAN.md
PLANS.md
```

Allowed writes:

```txt
focused preview/candidate source/tests and bounded docs/root updates.
```

Forbidden writes:

```txt
source crawler, DB schema migration, persistence requirement, embeddings/ranking
runtime, graph runtime, dashboard, API/MCP, worker daemon, Memory Core mutation,
target repo writes, broad eval platform, paid/proprietary course ingestion.
```

Output requirements:

```txt
record inspected owner files, candidate bridge behavior if implemented,
proof/non-proof boundaries, mutation boundary, and next ingest action.
```

Definition of Done:

- candidate/search owner surface is inspected with targeted reads;
- either a smallest preview -> candidate bridge is implemented with focused
  tests, or a precise missing-substrate finding is recorded;
- no forbidden runtime/platform work is added;
- report states proof and does-not-prove boundaries.

Verification commands:

```sh
git diff --check
```

If package source changes:

```sh
pnpm typecheck
pnpm test
git diff --check
```

Acceptance criteria:

```txt
V317 has either working reviewable source/search candidate output from preview
evidence or a precise bounded missing-substrate finding.
```

Risk:

```txt
turning a candidate bridge into crawler, persistence, schema, or ranking work.
```

Rollback:

```txt
Revert focused source/docs changes; no persistent schema/runtime changes should
exist.
```

Condensation expectation:

```txt
Keep root state compact; put detailed evidence in the V317 report.
```

Next-task synthesis rule:

```txt
If candidate bridge exists, decide whether next Ingest v0 step is persistence,
search document readback, or graph/entity preview. If not, open the smallest
missing owner-surface repair.
```

Pattern surface:

```txt
CLI/readback behavior, TypeScript boundary, source-to-decision candidate lane.
```

Primary consumer:

```txt
future source grounding, graph brain, pattern intake, and product-facing
knowledge ingestion.
```

Does not prove:

```txt
source truth, DB persistence, crawler readiness, embeddings, graph retrieval,
or product readiness.
```

Falsifier:

```txt
V317 cannot bridge preview evidence into reviewable candidate output without
broad schema/runtime work.
```

### V318-00 — Ingest v0 SearchDocument Persistence Readback

Status: complete.

Goal:

```txt
Persist and read back one explicit local artifact preview through existing DB
SourceArtifact/SourceChunk/SearchDocument paths.
```

Product rationale:

```txt
V316/V317 made local artifact evidence previewable and candidate-shaped. The
next brain step is proving one bounded existing-DB readback path before crawler,
embeddings, graph, UI, API/MCP, or worker work.
```

Architectural rationale:

```txt
Use existing schema/repositories only. Do not add DB schema, source crawler,
embeddings/ranking runtime, graph runtime, dashboard, API/MCP, worker daemon, or
Memory Core mutation.
```

Evidence source:

```txt
V317 report, local source artifact preview/candidate output, existing
SourceArtifact/SourceChunk/SearchDocument DB repository paths.
```

Official/external sources:

```txt
`pattern:evidence-proof-non-proof-boundary`, `pattern:source-to-decision-retention-gate`,
and `pattern:ts-boundary-unknown-first-result-state`.
```

Inputs required:

```txt
GOAL.md
PLAN.md
PLANS.md
docs/reviews/controlled-dogfood/2026-06-28-v317-ingest-v0-source-candidate-bridge/REPORT.md
focused DB/source/search repository and CLI owner files discovered by targeted search
```

Files likely touched:

```txt
focused CLI/DB source/tests if current repository surfaces support it
docs/reviews/controlled-dogfood/2026-06-28-v318-ingest-v0-search-document-persistence-readback/REPORT.md
GOAL.md
PLAN.md
PLANS.md
```

Allowed writes:

```txt
focused existing-DB readback source/tests and bounded docs/root updates.
```

Forbidden writes:

```txt
DB schema migration, source crawler, embeddings/ranking runtime, graph runtime,
dashboard, API/MCP, worker daemon, Memory Core mutation, target repo writes,
broad eval platform, paid/proprietary course ingestion.
```

Output requirements:

```txt
record inspected repository surfaces, persistence/readback behavior if
implemented, proof/non-proof boundaries, mutation boundary, and next ingest
action.
```

Definition of Done:

- existing source/search DB repository surface is inspected with targeted reads;
- either smallest preview -> DB source/search readback is implemented with
  focused tests, or a precise missing-substrate finding is recorded;
- no forbidden schema/runtime/platform work is added;
- report states proof and does-not-prove boundaries.

Verification commands:

```sh
git diff --check
```

If package source changes:

```sh
pnpm typecheck
pnpm test
git diff --check
```

If DB path is exercised:

```sh
pnpm db:ready
pnpm db:smoke
```

Acceptance criteria:

```txt
V318 has either working existing-DB source/search persistence readback for one
local preview or a precise bounded missing-substrate finding.
```

Risk:

```txt
turning readback into schema/crawler/embedding/graph/platform work.
```

Rollback:

```txt
Revert focused source/docs changes; no schema/runtime platform changes should
exist.
```

Condensation expectation:

```txt
Keep root state compact; put detailed evidence in the V318 report.
```

Next-task synthesis rule:

```txt
If persistence readback works, decide whether next Ingest v0 step is lexical
retrieval readback, source claim review path, or graph/entity preview. If not,
open the smallest repository-surface repair.
```

Pattern surface:

```txt
DB readback, CLI/readback behavior, TypeScript boundary, source/search substrate.
```

Primary consumer:

```txt
future source grounding, graph brain, pattern intake, and product-facing
knowledge ingestion.
```

Does not prove:

```txt
source truth, crawler readiness, embeddings, graph retrieval, product readiness,
or mass corpus ingest.
```

Falsifier:

```txt
V318 cannot persist/read back one local preview through existing source/search
DB paths without broad schema/runtime work.
```

### V319-00 — Ingest v0 SourceClaim Review Path

Status: complete.

Goal:

```txt
Persist and read back one explicit SourceClaim linked to a local
SourceArtifact/SourceChunk using existing repository paths.
```

Product rationale:

```txt
V318 proved local artifacts can enter the source/search substrate. The next
Ingest v0 step is proving source claims can be attached to that substrate with
mechanism, consumer, falsifier, and does-not-prove boundaries.
```

Architectural rationale:

```txt
Use existing SourceRepository and SourceClaim schema only. Do not infer claim
truth from file content and do not add schema, crawler, embeddings, graph
runtime, dashboard, API/MCP, worker daemon, or Memory Core mutation.
```

Evidence source:

```txt
V318 report, existing `krn source claim add --persist`, SourceClaim schema, and
SourceArtifact/SourceChunk repository paths.
```

Official/external sources:

```txt
`pattern:evidence-proof-non-proof-boundary`, `pattern:source-to-decision-retention-gate`,
and `pattern:ts-boundary-unknown-first-result-state`.
```

Inputs required:

```txt
GOAL.md
PLAN.md
PLANS.md
docs/reviews/controlled-dogfood/2026-06-28-v318-ingest-v0-search-document-persistence-readback/REPORT.md
focused source claim add/repository owner files discovered by targeted search
```

Files likely touched:

```txt
focused CLI/source tests if existing surfaces need one small bridge
docs/reviews/controlled-dogfood/2026-06-28-v319-ingest-v0-sourceclaim-review-path/REPORT.md
GOAL.md
PLAN.md
PLANS.md
```

Allowed writes:

```txt
focused existing-DB source-claim readback source/tests and bounded docs/root updates.
```

Forbidden writes:

```txt
DB schema migration, source crawler, embeddings/ranking runtime, graph runtime,
dashboard, API/MCP, worker daemon, Memory Core mutation, target repo writes,
broad eval platform, paid/proprietary course ingestion.
```

Output requirements:

```txt
record inspected source-claim surfaces, persistence/readback behavior if
implemented, proof/non-proof boundaries, mutation boundary, and next ingest
action.
```

Definition of Done:

- existing SourceClaim DB repository surface is inspected with targeted reads;
- either smallest local artifact/chunk -> SourceClaim readback is implemented
  with focused tests, or a precise missing-substrate finding is recorded;
- no forbidden schema/runtime/platform work is added;
- report states proof and does-not-prove boundaries.

Verification commands:

```sh
git diff --check
```

If package source changes:

```sh
pnpm typecheck
pnpm test
git diff --check
```

If DB path is exercised:

```sh
pnpm db:ready
pnpm db:smoke
```

Acceptance criteria:

```txt
V319 has either working existing-DB SourceClaim review/path readback for one
local artifact/chunk or a precise bounded missing-substrate finding.
```

Risk:

```txt
turning SourceClaim review into autonomous source truth, crawler, graph, or
schema work.
```

Rollback:

```txt
Revert focused source/docs changes; no schema/runtime platform changes should
exist.
```

Condensation expectation:

```txt
Keep root state compact; put detailed evidence in the V319 report.
```

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-29-v319-ingest-v0-sourceclaim-review-path/REPORT.md
```

Next-task synthesis rule:

```txt
If SourceClaim readback works, decide whether next Ingest v0 step is source
decision linkage, graph/entity preview, or activation over persisted local
source/search state. If not, open the smallest repository-surface repair.
```

Pattern surface:

```txt
DB readback, CLI/readback behavior, TypeScript boundary, source-to-decision substrate.
```

Primary consumer:

```txt
future source grounding, graph brain, consensus/eval candidates, and
product-facing knowledge ingestion.
```

Does not prove:

```txt
source truth, crawler readiness, embeddings, graph retrieval, product readiness,
or mass corpus ingest.
```

Falsifier:

```txt
V319 cannot persist/read back one governed SourceClaim linked to local artifact
evidence without broad schema/runtime work.
```

### V320-00 — Ingest v0 SourceDecision Linkage Readback

Status: active.

Goal: link one persisted/proposed SourceClaim to a bounded SourceDecision or
SourceDecisionEdge through existing repository paths and read it back.

Use: V319 report, SourceDecision/SourceDecisionEdge schema, SourceRepository
contracts, and Drizzle source repository owner files.

Allowed: focused source-decision linkage/readback source/tests and a compact
report at
`docs/reviews/controlled-dogfood/2026-06-29-v320-ingest-v0-sourcedecision-linkage-readback/REPORT.md`.

Forbidden: DB schema migration, source crawler, embeddings/ranking runtime,
graph runtime, dashboard, API/MCP, worker daemon, Memory Core mutation, target
repo writes, broad eval platform.

Done when: existing SourceDecision/SourceDecisionEdge repository surface is
inspected; either smallest SourceClaim -> SourceDecision linkage/readback works
with focused tests or a precise missing-substrate finding is recorded; report
states proof/non-proof boundaries.

Verify: `pnpm typecheck`, `pnpm test`, `git diff --check`; add `pnpm db:ready`
and `pnpm db:smoke` when DB path is exercised.

Falsifier: V320 cannot link/read back one bounded source decision through
existing repository contracts without broad schema/runtime work.

## Pattern Gate

For every non-trivial infra, harness, CI/eval, Codex-surface, TypeScript,
target-workflow, security, operator-UX, or research/paper/course-driven slice:

```txt
source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier
```

Use `docs/runbooks/pattern-intake.md` when source/pattern intake needs the full
procedure. Query retained pattern cards when relevant. Classify selected
patterns after execution as helped / neutral / noise / missing / stale /
unknown.

Surface Consumer Matrix remains the rule for deciding whether a retained
pattern belongs in a skill, guard, source decision, eval, memory candidate,
CLI/readback behavior, bounded repair, or rejection.

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

- [x] V303 Active Slice Application Gate
- [x] V304 Knowledge Cards Readback Limit
- [x] V305 Knowledge Cards No-Match Guidance
- [x] V306 Knowledge Cards Tokenized Text Search
- [x] V307 Pattern Search Usefulness Feedback Closure
- [x] V308 Research Source Decisions Initial Pack
- [x] V309 Mini Brain-QA Benchmark Sketch
- [x] V310 Executable Brain-QA Case BQ-015
- [x] V311 BQ-015 Fixture Coverage
- [x] V312 Executable Brain-QA Case BQ-023
- [x] V313 Executable Brain-QA Case BQ-024
- [x] V314 Executable Brain-QA Case BQ-025
- [x] V315 Executable Brain-QA Case BQ-028
- [x] V316 Ingest v0 Local Source Artifact Preview
- [x] V317 Ingest v0 Source Candidate Bridge
- [x] V318 Ingest v0 SearchDocument Persistence Readback
- [x] V319 Ingest v0 SourceClaim Review Path
- [ ] V320 Ingest v0 SourceDecision Linkage Readback

## Recent Evidence Pointers

- V306 report:
  `docs/reviews/controlled-dogfood/2026-06-28-v306-knowledge-cards-tokenized-text-search/REPORT.md`
- V307 report:
  `docs/reviews/controlled-dogfood/2026-06-28-v307-pattern-search-usefulness-feedback/REPORT.md`
- V308 report:
  `docs/reviews/controlled-dogfood/2026-06-28-v308-research-source-decisions-initial-pack/REPORT.md`
- V309 report:
  `docs/reviews/controlled-dogfood/2026-06-28-v309-mini-brain-qa-benchmark-sketch/REPORT.md`
- V310 report:
  `docs/reviews/controlled-dogfood/2026-06-28-v310-executable-brain-qa-bq-015/REPORT.md`
- V311 report:
  `docs/reviews/controlled-dogfood/2026-06-28-v311-bq-015-fixture-coverage/REPORT.md`
- V312 report:
  `docs/reviews/controlled-dogfood/2026-06-28-v312-executable-brain-qa-bq-023/REPORT.md`
- V313 report:
  `docs/reviews/controlled-dogfood/2026-06-28-v313-executable-brain-qa-bq-024/REPORT.md`
- V314 report:
  `docs/reviews/controlled-dogfood/2026-06-28-v314-executable-brain-qa-bq-025/REPORT.md`
- V315 report:
  `docs/reviews/controlled-dogfood/2026-06-28-v315-executable-brain-qa-bq-028/REPORT.md`
- V316 report:
  `docs/reviews/controlled-dogfood/2026-06-28-v316-ingest-v0-local-source-artifact-preview/REPORT.md`
- V317 report:
  `docs/reviews/controlled-dogfood/2026-06-28-v317-ingest-v0-source-candidate-bridge/REPORT.md`
- V318 report:
  `docs/reviews/controlled-dogfood/2026-06-28-v318-ingest-v0-search-document-persistence-readback/REPORT.md`
- V319 report:
  `docs/reviews/controlled-dogfood/2026-06-29-v319-ingest-v0-sourceclaim-review-path/REPORT.md`

## Outcome V319 Ingest v0 SourceClaim Review Path

Status: complete.

Source-to-decision:

- Source: V318 report, existing SourceClaim schema/repository contracts, and
  local DB readiness/readback evidence.
- Mechanism: explicit local artifact preview can persist a governed SourceClaim
  linked to persisted SourceArtifact/SourceChunk evidence and verify readback
  by id through existing Postgres repository paths.
- KRN implication: Ingest v0 can now move from local source/search/claim
  persistence to bounded SourceDecision linkage before graph, crawler,
  embeddings, or product UI/API work.
- Decision: persist SourceClaim from `krn source artifact preview --persist`
  only when complete explicit source-claim fields are supplied.
- Rejection: do not infer SourceClaim truth from file content and do not create
  SourceClaim rows for absent or incomplete claim fields.
- Does not prove: source truth, claim correctness, SourceDecision quality,
  automatic extraction, embeddings, graph retrieval, crawler readiness, mass
  corpus ingest, or product readiness.
- Consumer: V320 Ingest v0 SourceDecision Linkage Readback.
- Falsifier: complete explicit SourceClaim fields cannot be linked to persisted
  SourceArtifact/SourceChunk rows and read back in the current shell.

## Outcome V318 Ingest v0 SearchDocument Persistence Readback

Status: complete.

Source-to-decision:

- Source: V317 report, existing SourceArtifact/SourceChunk/SearchDocument DB
  repository contracts, and local DB readiness/smoke evidence.
- Mechanism: explicit local artifact preview can persist SourceArtifact,
  SourceChunk, and SearchDocument rows and verify lexical readback through the
  existing Postgres substrate.
- KRN implication: Ingest v0 can now attach governed source claims to persisted
  local artifact/chunk evidence before crawler, embeddings, graph runtime, or
  product UI/API work.
- Decision: add explicit `--persist` to `krn source artifact preview` for
  existing DB source/search persistence/readback.
- Does not prove: source truth, claim correctness, embeddings, graph retrieval,
  crawler readiness, mass corpus ingest, or product readiness.
- Consumer: V319 Ingest v0 SourceClaim Review Path.
- Falsifier: `--persist` cannot write and read back SourceArtifact,
  SourceChunk, and SearchDocument rows in the current shell.

## Outcome V317 Ingest v0 Source Candidate Bridge

Status: complete.

Source-to-decision:

- Source: V316 report, local artifact preview output, `SourceClaimInputSchema`,
  `SearchDocumentInputSchema`, and candidate reviewability helper.
- Mechanism: local artifact hash/chunk/source-range evidence can be shaped into
  reviewable SearchDocument and SourceClaim candidates without persistence.
- KRN implication: Ingest v0 can require reviewable candidate output before DB
  persistence, embeddings, graph retrieval, or crawler work.
- Decision: extend `krn source artifact preview` with a Candidate bridge:
  SearchDocument candidate by default and SourceClaim candidate only with
  explicit operator claim fields.
- Does not prove: source truth, claim correctness, DB persistence, crawler
  readiness, embeddings, graph retrieval, or product readiness.
- Consumer: V318 Ingest v0 SearchDocument Persistence Readback.
- Falsifier: candidate output cannot feed existing DB source/search readback
  without broad schema/runtime work.

## Outcome V316 Ingest v0 Local Source Artifact Preview

Status: complete.

Source-to-decision:

- Source: V315 report, compact root state, existing `krn source claim add`
  preview behavior, and source/search owner file inspection.
- Mechanism: one explicit local source file can be rendered as hash,
  line-based chunk preview, and source ranges without persistence or runtime
  platform work.
- KRN implication: Ingest v0 can begin with reviewable local source artifact
  evidence before source crawler, DB schema, embeddings, graph runtime, or
  Memory Core mutation.
- Decision: add `krn source artifact preview --file <path>` as a read-only
  local preview path.
- Does not prove: source truth, claim correctness, DB persistence, crawler
  readiness, embeddings, graph retrieval, or product readiness.
- Consumer: V317 Ingest v0 Source Candidate Bridge.
- Falsifier: preview output cannot feed a reviewable candidate bridge without
  broad schema/runtime work.

## Outcome V315 Executable Brain-QA Case BQ-028

Status: complete.

Source-to-decision:

- Source: compact root `GOAL.md`, `PLAN.md`, `PLANS.md`, and V314 report.
- Mechanism: compact active state carries current product readiness, unresolved
  gaps, and next-task synthesis without historical ledger rereads.
- KRN implication: the project can continue from compact state and should now
  move to a product-facing Ingest v0 slice.
- Decision: close BQ-028 and activate V316 Ingest v0 Local Source Artifact
  Preview.
- Does not prove: arbitrary corpus QA, graph retrieval, product readiness,
  second-operator usability, or that Ingest v0 is already implemented.
- Consumer: V316 Ingest v0 Local Source Artifact Preview.
- Falsifier: compact state cannot recover product gaps without historical
  ledger rereads.

## Outcome V314 Executable Brain-QA Case BQ-025

Status: complete.

Source-to-decision:

- Source: V309 BQ-025 and V310-V313 mini brain-QA reports.
- Mechanism: report evidence is reviewable only when each proof states both what
  it proves and what it does not prove.
- KRN implication: brain-QA report artifacts can preserve proof boundaries
  without adding a new guard platform.
- Decision: record BQ-025 as executed and activate BQ-028 compact product-gap
  readback.
- Does not prove: report truth, future report compliance, product value,
  product readiness, reviewer correctness, or full benchmark quality.
- Consumer: V315 BQ-028 compact product-gap readback.
- Falsifier: reports omit non-proof boundaries while root state claims
  evidence/review proof quality.

## Outcome V313 Executable Brain-QA Case BQ-024

Status: complete.

Source-to-decision:

- Source: V309 BQ-024, `evidenceCaptureGoldenBehavior.test.ts`,
  `runCli.test.ts`, and `tests/fixtures/golden-tasks/evidence-capture-behavior.json`.
- Mechanism: dirty-context readback is useful only when intended, unrelated,
  and unknown changed files are separated and review burden is explicit.
- KRN implication: brain-QA evidence cases can reuse existing golden behavior
  before adding runtime/eval platforms.
- Decision: record BQ-024 as executed and activate adjacent BQ-025 report
  proof/non-proof boundaries.
- Does not prove: review judgment, all path normalization edge cases, DB replay
  for this run, product readiness, or full benchmark quality.
- Consumer: V314 BQ-025 report proof/non-proof boundaries.
- Falsifier: dirty files can be hidden or mixed while tests and reports stay
  green.

## Outcome V312 Executable Brain-QA Case BQ-023

Status: complete.

Source-to-decision:

- Source: V309 BQ-023, `krn evidence capture` CLI output, and evidence command
  normalization tests.
- Mechanism: command evidence is useful only when provenance and proof limits
  are visible at readback time.
- KRN implication: brain-QA evidence cases can execute through existing CLI
  surfaces before adding DB/runtime/eval platforms.
- Decision: record BQ-023 as executed and activate adjacent BQ-024 dirty-context
  classification.
- Does not prove: command execution truth, DB replay for this run, review
  correctness, product readiness, command-runner CLI execution, or full
  benchmark quality.
- Consumer: V313 BQ-024 dirty-context classification.
- Falsifier: weak/default command rows can appear as passed proof while tests
  and reports stay green.

## Outcome V311 BQ-015 Fixture Coverage

Status: complete.

Source-to-decision:

- Source: V310 BQ-015 report and `packages/cli/src/runKnowledgeCardsCommand.test.ts`.
- Mechanism: a manual brain-QA case only stays useful if CI catches regression
  in the behavior it proved.
- KRN implication: first executable brain-QA case should be covered before
  widening benchmark scope.
- Decision: add focused CLI test coverage for broad no-match query -> shorter
  mechanism query -> retained pattern hit.
- Does not prove: semantic retrieval quality, ranking quality,
  retained-pattern completeness, live DB-backed search, graph retrieval
  quality, or product readiness.
- Consumer: V312 and future brain-QA executable cases.
- Falsifier: BQ-015 no-match/retry behavior regresses while CLI tests stay
  green.

## Outcome V310 Executable Brain-QA Case BQ-015

Status: complete.

Source-to-decision:

- Source: V309 BQ-015 and `krn knowledge cards` read-only CLI output.
- Mechanism: broad deterministic text queries can miss retained patterns, while
  shorter mechanism queries can recover relevant cards with no-match guidance
  and proof/non-proof boundaries.
- KRN implication: mini brain-QA can begin with existing read-only CLI behavior
  before new eval/runtime surfaces.
- Decision: record BQ-015 as the first executable brain-QA case and activate
  V311 to add or confirm focused coverage.
- Does not prove: semantic retrieval quality, ranking quality, retained-pattern
  completeness, live DB-backed search, graph retrieval quality, or product
  readiness.
- Consumer: V311 BQ-015 Fixture Coverage.
- Falsifier: BQ-015 behavior is not covered by tests and can regress while CI
  stays green.

## Outcome V309 Mini Brain-QA Benchmark Sketch

Status: complete.

Source-to-decision:

- Source: V308 retained source decisions and V309 Pattern Gate readback.
- Mechanism: retained source decisions need local falsifiable behavior
  questions before they can guide ingest, graph, heartbeat, consensus, UI/API,
  MCP, or broad eval work.
- KRN implication: KRN should execute one small read-only benchmark case before
  widening the benchmark or adding runtime surfaces.
- Decision: create a 30-question sketch and activate BQ-015 as the first
  executable case.
- Does not prove: product readiness, SOTA quality, semantic retrieval quality,
  graph retrieval quality, citation accuracy, or benchmark execution.
- Consumer: V310 Executable Brain-QA Case BQ-015.
- Falsifier: V310 cannot execute broad no-match -> shorter mechanism query ->
  retained pattern hit with proof/non-proof boundaries.

## Outcome V308 Research Source Decisions Initial Pack

Status: complete.

Source-to-decision:

- Source: V307 selected `pattern:source-to-decision-retention-gate` and the
  first retained paper pack in `docs/KRN_SOURCES.md`.
- Mechanism: research sources only help KRN if each one names a mechanism,
  local implication, decision/rejection, consumer, falsifier, and
  does-not-prove boundary.
- KRN implication: paper-backed brain work should create falsifiable local
  benchmark/design hypotheses, not a broad research archive or SOTA claim.
- Decision: retain five bounded decisions: MemGPT and Reflexion as adopted
  architecture constraints; Self-RAG, GraphRAG, and HippoRAG as lab-test
  hypotheses for V309 and later graph/activation work.
- Does not prove: product readiness, SOTA quality, source completeness, graph
  retrieval quality, adaptive retrieval quality, or that any paper should be
  copied directly.
- Consumer: V309 mini brain-QA benchmark sketch and future activation, ingest,
  graph, heartbeat, and memory-usefulness validation.
- Falsifier: V309 cannot derive local falsifiable questions from the retained
  source decisions.

## 21. Final Response Format For Codex Runs

Every continuation or completed slice must end with:

```txt
DB used:
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

For every non-trivial infra, harness, CI, eval, Codex-surface, TypeScript,
target-workflow, security, operator-UX, or research/paper/course-driven slice,
use:

```txt
source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier
```

If attachments, old prompts, or summaries conflict with root active state, read them as historical evidence.
do not roll the active stream backward.

## 23. Plan Revision Note

At creation time this file replaced a long append-only active ledger with a
compact current-state ledger. Historical details remain available through the
archive path and linked reports, but active execution resumes from the root
state above.
