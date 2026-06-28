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
active stream: V309 Mini Brain-QA Benchmark Sketch
current task: V309-00 Mini Brain-QA Benchmark Sketch
latest pushed commit checked: 1c23d02 docs(review): close pattern search usefulness feedback
latest CI checked: KRN CI success for 1c23d02f8da56b415271d680c71dca83bd640e2a
```

Known current gap:

```txt
V309-00 Mini Brain-QA Benchmark Sketch is the current gap. V308 added the first
bounded paper/source decision pack; now those retained decisions need
falsifiable KRN brain questions before ingest, graph, heartbeat, consensus,
UI/API/MCP, or broad eval work.
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
3. Mini brain-QA benchmark: start with 30 KRN questions, later expand corpus QA
   and compare no-memory, lexical, memory, source, hybrid, anti-memory, and
   graph-stub paths.
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

Status: active.

Goal:

```txt
Sketch the first 30-question KRN brain-QA benchmark from retained source
decisions and existing product behavior.
```

Product rationale:

```txt
Retained source decisions must become local falsifiers. The next product move
is not another source pack; it is a small benchmark sketch that can later test
whether KRN retrieval, memory, source grounding, anti-memory, temporal behavior,
and graph/global QA actually help.
```

Architectural rationale:

```txt
Benchmark shape comes before ingest/graph/runtime work so those systems are
driven by falsifiable questions instead of impressive architecture.
```

Evidence source:

```txt
V308 retained source decisions and current KRN brain-readiness gaps.
```

Official/external sources:

```txt
MemGPT, Reflexion, Self-RAG, GraphRAG, HippoRAG entries in docs/KRN_SOURCES.md.
```

Inputs required:

```txt
docs/KRN_SOURCES.md
docs/brain-knowledge/catalog.json
current KRN docs/source/activation/memory evidence
```

Files likely touched:

```txt
docs/benchmarks/brain-qa/V309_BRAIN_QA_SKETCH.md
docs/reviews/controlled-dogfood/2026-06-28-v309-mini-brain-qa-benchmark-sketch/REPORT.md
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
30 questions grouped by behavior lane, each with expected evidence type,
retained decision/source link, proof/non-proof boundary, and future execution
mode. No fake numeric precision.
```

Definition of Done:

- 30-question sketch exists.
- Each question maps to a retained KRN decision, source decision, or product
  behavior.
- Lanes include context/memory, source grounding, adaptive retrieval/abstention,
  temporal/anti-memory, evidence/review, graph/global QA, and multi-hop.
- The sketch states what it proves and does not prove.
- No runtime/eval platform is built.
- `git diff --check` passes.

Verification commands:

```sh
git diff --check
```

Acceptance criteria:

```txt
The benchmark sketch can guide one future small executable benchmark without
becoming a broad eval roadmap.
```

Risk:

```txt
benchmark theater or source-decision laundering.
```

Rollback:

```txt
Remove the sketch/report if questions cannot be tied to retained decisions or
product behavior.
```

Next-task synthesis rule:

```txt
After V309, choose either one executable mini brain-QA case or defer benchmark
execution and open the smallest ingest/graph prerequisite.
```

Primary consumer:

```txt
future brain-QA, activation, ingest, graph, and heartbeat validation.
```

Does not prove:

```txt
product readiness, SOTA quality, graph retrieval quality, or benchmark
execution.
```

Falsifier:

```txt
Questions are not tied to retained decisions or cannot falsify any KRN behavior.
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
- [ ] V309 Mini Brain-QA Benchmark Sketch

## Recent Evidence Pointers

- V306 report:
  `docs/reviews/controlled-dogfood/2026-06-28-v306-knowledge-cards-tokenized-text-search/REPORT.md`
- V307 report:
  `docs/reviews/controlled-dogfood/2026-06-28-v307-pattern-search-usefulness-feedback/REPORT.md`
- V308 report:
  `docs/reviews/controlled-dogfood/2026-06-28-v308-research-source-decisions-initial-pack/REPORT.md`

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
