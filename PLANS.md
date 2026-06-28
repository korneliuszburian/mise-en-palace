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
active stream: V310 Executable Brain-QA Case BQ-015
current task: V310-00 Executable Brain-QA Case BQ-015
latest pushed commit checked: 1c23d02 docs(review): close pattern search usefulness feedback
latest CI checked: KRN CI success for 1c23d02f8da56b415271d680c71dca83bd640e2a
```

Known current gap:

```txt
V310-00 Executable Brain-QA Case BQ-015 is the current gap. V309 sketched 30
questions; now one read-only case should prove broad no-match query -> shorter
mechanism query -> retained pattern hit before broader benchmark or runtime
work.
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
3. Mini brain-QA benchmark: V309 sketched 30 KRN questions; execute BQ-015
   first, then later expand corpus QA and compare no-memory, lexical, memory,
   source, hybrid, anti-memory, and graph-stub paths.
4. Ingest v0: source artifact -> content hash -> chunk -> source range -> claim
   -> embedding/search document with permission and temporal metadata.
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

Status: active.

Goal:

```txt
Execute BQ-015 from the V309 sketch: broad no-match query -> shorter mechanism
query -> retained pattern hit.
```

Product rationale:

```txt
KRN needs one executable brain-QA case before widening the benchmark. BQ-015
uses the existing read-only `krn knowledge cards` surface and tests adaptive
query narrowing without new infrastructure.
```

Architectural rationale:

```txt
Self-RAG was retained as a lab-test hypothesis. BQ-015 is the smallest local
falsifier for adaptive retrieval behavior available in current CLI surfaces.
```

Evidence source:

```txt
V309 sketch, BQ-015.
```

Official/external sources:

```txt
Self-RAG entry in docs/KRN_SOURCES.md; pattern cards for evidence proof,
source-to-decision, and active context.
```

Inputs required:

```txt
docs/brain-knowledge/catalog.json
docs/benchmarks/brain-qa/V309_BRAIN_QA_SKETCH.md
```

Files likely touched:

```txt
docs/reviews/controlled-dogfood/2026-06-28-v310-executable-brain-qa-bq-015/REPORT.md
GOAL.md
PLAN.md
PLANS.md
```

Allowed writes:

```txt
docs-only benchmark sketch, report, and compact root-state updates.
```

Forbidden writes:

```txt
broad eval platform, Promptfoo expansion, source crawler, embeddings, ranking,
graph runtime, DB schema, dashboard, API/MCP, worker daemon, Memory Core
mutation, target repo writes, paid/proprietary course ingestion.
```

Output requirements:

```txt
record broad query, no-match guidance, shorter mechanism query, matched card,
selected pattern usefulness, proof/non-proof, and whether this should become a
fixture later.
```

Definition of Done:

- broad query returns no-match guidance;
- shorter mechanism query returns a relevant retained pattern;
- report records proof/non-proof and usefulness;
- no runtime/eval platform is built;
- `git diff --check` passes.

Verification commands:

```sh
git diff --check
```

Acceptance criteria:

```txt
One existing read-only CLI behavior demonstrates adaptive query narrowing in a
way future benchmark execution can reuse.
```

Risk:

```txt
benchmark theater or treating deterministic text search as semantic retrieval.
```

Rollback:

```txt
Remove report/root updates if BQ-015 cannot be executed without new runtime.
```

Next-task synthesis rule:

```txt
After V310, either add a focused fixture for BQ-015 or execute the next
docs/CLI-only brain-QA case.
```

Primary consumer:

```txt
future brain-QA and adaptive retrieval/readback validation.
```

Does not prove:

```txt
product readiness, SOTA quality, semantic retrieval quality, graph retrieval
quality, or full benchmark execution.
```

Falsifier:

```txt
BQ-015 cannot show broad no-match -> shorter query -> retained pattern hit.
```

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
- [ ] V310 Executable Brain-QA Case BQ-015

## Recent Evidence Pointers

- V306 report:
  `docs/reviews/controlled-dogfood/2026-06-28-v306-knowledge-cards-tokenized-text-search/REPORT.md`
- V307 report:
  `docs/reviews/controlled-dogfood/2026-06-28-v307-pattern-search-usefulness-feedback/REPORT.md`
- V308 report:
  `docs/reviews/controlled-dogfood/2026-06-28-v308-research-source-decisions-initial-pack/REPORT.md`
- V309 report:
  `docs/reviews/controlled-dogfood/2026-06-28-v309-mini-brain-qa-benchmark-sketch/REPORT.md`

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
