# KRN Continuous Brain Growth Active Ledger

Status: compact active ledger. Date: 2026-06-28.

Root `PLAN.md` is the compact product single source of truth. Root `GOAL.md`
states the active objective. This file carries only current execution state,
remaining product gaps, and the next bounded task.

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
active stream: V308 Research Source Decisions Initial Pack
current task: V308-00 Research Source Decisions Initial Pack
latest pushed commit checked: a5c415f feat(knowledge): tokenize card text search
latest CI checked: KRN CI success for a5c415fbeef8335164fc84b67e9341af9629b305
```

Known current gap:

```txt
V308-00 Research Source Decisions Initial Pack is the current gap. V307 proved
the tokenized search path can retrieve the source-to-decision gate; the next
gap is adding a small, useful, non-decorative research/source-decision pack.
```

## 2. Product Thesis

KRN is a Codex Operating Layer / AI Engineering Control Plane.

Codex executes. KRN supplies bounded context, store-backed memory, source
grounding, policy, skills, eval expectations, traces, review gates, and
feedback.

Current loop:

```txt
controlled scenario -> evidence -> finding -> condensation decision
  -> rule / skill / guard / eval / memory candidate / source decision / repair
  -> append next bounded task here -> continue
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

These are the only current high-level blocks that matter for the brain roadmap:

1. Pattern Brain execution/readback hardening: keep future search changes
   usefulness-backed.
2. Research/paper/course source decisions: ingest selected public sources such
   as MemGPT, Generative Agents, Reflexion, Self-RAG, GraphRAG, HippoRAG, CoALA,
   Voyager, OpenAI docs, and high-quality TypeScript material through
   source-to-decision, not source hoarding.
3. Mini brain-QA benchmark: 30 initial KRN questions, later 100-300 corpus
   questions, comparing no-memory, lexical, memory, source, hybrid, anti-memory,
   and graph-stub paths.
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

### V306-00 — Knowledge Cards Tokenized Text Search

Status: complete.

Goal:

```txt
Make `krn knowledge cards --text` deterministic and less brittle by matching
query tokens instead of requiring the whole normalized query as one substring.
```

Product rationale:

```txt
Pattern Application Gate operators should be able to ask natural multi-term
questions and still find relevant retained patterns before coding.
```

Architectural rationale:

```txt
This improves read-only pattern-brain recall without adding semantic ranking,
embeddings, API, MCP, dashboard, source crawler, or Memory Core mutation.
```

Evidence source:

```txt
V305 proved no-match guidance, but also exposed that whole-query substring
matching can miss cards containing the individual mechanism terms.
```

Files likely touched:

```txt
packages/harness/src/brainKnowledgeReadModel.ts
packages/harness/src/brainKnowledgeReadModel.test.ts
packages/cli/src/runKnowledgeCardsCommand.ts
packages/cli/src/runKnowledgeCardsCommand.test.ts
docs/reviews/controlled-dogfood/2026-06-28-v306-knowledge-cards-tokenized-text-search/REPORT.md
```

Forbidden writes:

```txt
dashboard, API, MCP, source crawler, DB schema, Memory Core mutation, semantic
ranking, embeddings, broad eval platform, unrelated cleanup.
```

Definition of Done:

- multi-token text search matches cards containing meaningful query tokens;
- no-match guidance from V305 remains visible for zero results;
- `totalCards`, `returnedCards`, and `limit` remain honest;
- output states deterministic filtering does not prove semantic ranking quality;
- focused tests, `pnpm typecheck`, `pnpm test`, and `git diff --check` pass;
- dogfood report records pattern usefulness and proof/non-proof boundaries;
- commit is pushed and CI is checked if triggered.

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-28-v306-knowledge-cards-tokenized-text-search/REPORT.md
```

### V307-00 — Pattern Search Usefulness Feedback Closure

Status: active.

Goal:

```txt
Use the V306 tokenized search behavior in one bounded pre-coding Pattern
Application Gate and record whether selected patterns helped, were neutral,
were noise, were stale, or missed an obvious pattern.
```

Product rationale:

```txt
Search improvements should reduce context waste and pre-coding uncertainty, not
become unmeasured UI comfort.
```

Architectural rationale:

```txt
This closes the usefulness loop before widening knowledge search into ranking,
embeddings, API, MCP, dashboard, or DB search.
```

Evidence source:

```txt
V306 report and the next actual pre-coding pattern gate.
```

Files likely touched:

```txt
docs/reviews/controlled-dogfood/2026-06-28-v307-pattern-search-usefulness-feedback/REPORT.md
GOAL.md
PLAN.md
PLANS.md
```

Forbidden writes:

```txt
ranking, embeddings, API, MCP, dashboard, DB schema, source crawler, target
writes, Memory Core mutation, broad eval platform.
```

Definition of Done:

- one V306-style knowledge-card query is run for the next bounded task;
- selected and rejected/deferred patterns are recorded;
- usefulness is classified as helped / neutral / noise / missing / stale /
  unknown;
- proof and does-not-prove boundaries are recorded;
- next task is either kept small or no follow-up is opened;
- `git diff --check` passes.

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-28-v307-pattern-search-usefulness-feedback/REPORT.md
```

### V308-00 — Research Source Decisions Initial Pack

Status: active.

Goal:

```txt
Add 3-5 source decisions maximum for the next phase of KRN brain growth.
```

Product rationale:

```txt
KRN needs research condensation to improve future infra, pattern brain, graph,
heartbeat, consensus, and benchmark work without source hoarding.
```

Architectural rationale:

```txt
Every retained source must pass source -> mechanism -> KRN implication ->
decision/rejection -> consumer -> falsifier before it can shape the brain.
```

Evidence source:

```txt
V307 selected pattern:source-to-decision-retention-gate as helped.
```

Files likely touched:

```txt
docs/KRN_SOURCES.md
docs/reviews/controlled-dogfood/2026-06-28-v308-research-source-decisions-initial-pack/REPORT.md
GOAL.md
PLAN.md
PLANS.md
```

Forbidden writes:

```txt
source crawler, broad research archive, dashboard, API, MCP, DB schema,
embeddings, ranking, Memory Core mutation, product UI.
```

Definition of Done:

- 3-5 source decisions maximum are added or explicitly deferred;
- every retained source has mechanism, KRN implication, decision/rejection,
  consumer, falsifier, and does-not-prove;
- no paid/proprietary course material is copied;
- no source is retained only because it sounds impressive;
- `git diff --check` and source-map/pattern invariants pass.

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

## Pattern Gate

For every non-trivial infra, harness, CI/eval, Codex-surface, TypeScript,
target-workflow, security, operator-UX, or research/paper/course-driven slice:

```txt
source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier
```

Use `docs/runbooks/pattern-intake.md`. The pattern gate must query helped
retained patterns, select 1-5 expected-use patterns or explicitly reject/defer
them, and then classify selected patterns as helped / neutral / noise / missing
/ stale / unknown.

Surface Consumer Matrix remains the rule for deciding whether a pattern belongs
in a skill, guard, source decision, eval, memory candidate, or active task.

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

Current candidate after V308:

### V309 — Mini Brain-QA Benchmark Sketch

Status: candidate, not active.
Goal: sketch the first 30-question KRN brain-QA benchmark only if V308 produces
source decisions that need local falsifiers.
Product rationale: convert research/pattern claims into measurable behavior.
Architectural rationale: benchmark before wider ingest/graph/runtime work.
Evidence source: V308 report.
Official/external sources: V308 retained decisions.
Inputs required: V308 outcome.
Files likely touched: benchmark docs/fixtures and report path.
Allowed writes: docs/fixtures only.
Forbidden writes: broad eval platform, dashboard/API/MCP, source crawler.
Output requirements: small benchmark sketch with proof/non-proof boundaries.
Definition of Done: 30-question initial scope or explicit defer.
Verification commands: `git diff --check`; tests only if fixtures are executable.
Acceptance criteria: no fake numeric precision.
Risk: benchmark theater.
Rollback: defer if V308 lacks falsifiable source decisions.
Condensation expectation: one compact report and root state update only.
Next-task synthesis rule: activate only if V308 supports it.
Pattern surface: eval / Pattern Brain.
Primary consumer: future brain-QA and graph/ingest work.
Does not prove: product-ready brain or SOTA quality.
Falsifier: questions do not test any retained decision or product behavior.

### Historical V307 candidate text

Goal: record whether tokenized pattern-card search actually helps the next
pre-coding pattern gate.
Product rationale: prevent search improvements from becoming unmeasured UI
comfort.
Architectural rationale: close pattern usefulness feedback before widening
search surfaces.
Evidence source: V306 report.
Official/external sources: none unless V306 needs source-to-decision.
Inputs required: V306 outcome.
Files likely touched: `PLANS.md`, V306/V307 report paths, possibly tests.
Allowed writes: docs/tests only if V306 evidence justifies them.
Forbidden writes: scoring rewrite, embeddings, API/MCP/dashboard.
Output requirements: one bounded follow-up task or explicit rejection.
Definition of Done: V306 usefulness is classified.
Verification commands: `git diff --check`; source checks if touched.
Acceptance criteria: no new broad roadmap.
Risk: inventing work from vibes.
Rollback: remove candidate if V306 falsifies need.
Condensation expectation: keep under this backlog section.
Next-task synthesis rule: only activate if V306 evidence supports it.
Pattern surface: Pattern Application Gate.
Primary consumer: Codex pre-coding operator.
Does not prove: product-ready search.
Falsifier: V306 already records enough usefulness feedback.

## 15. Progress

- [x] V303 Active Slice Application Gate: complete.
- [x] V304 Knowledge Cards Readback Limit: complete.
- [x] V305 Knowledge Cards No-Match Guidance: complete.
- [x] V306 Knowledge Cards Tokenized Text Search: complete.
- [x] V307 Pattern Search Usefulness Feedback Closure: complete.
- [ ] V308 Research Source Decisions Initial Pack: active.

Detailed old progress is archived in:

```txt
docs/plans/historical-ledgers/2026-06-28-root-plans-before-v306-context-condensation.md
```

## Recent Evidence Pointers

- V303 report:
  `docs/reviews/controlled-dogfood/2026-06-28-v303-active-slice-application-gate/REPORT.md`
- V304 report:
  `docs/reviews/controlled-dogfood/2026-06-28-v304-pattern-gated-source-slice-trial/REPORT.md`
- V305 report:
  `docs/reviews/controlled-dogfood/2026-06-28-v305-knowledge-cards-no-match-guidance/REPORT.md`
- V306 report:
  `docs/reviews/controlled-dogfood/2026-06-28-v306-knowledge-cards-tokenized-text-search/REPORT.md`
- V307 report:
  `docs/reviews/controlled-dogfood/2026-06-28-v307-pattern-search-usefulness-feedback/REPORT.md`
- Latest checked commit before this condensation:
  `173fdd1 feat(knowledge): guide no-match card queries`

## Outcome V306 Knowledge Cards Tokenized Text Search

Status: complete.

Source-to-decision:

- Source: V305 no-match guidance report and current `krn knowledge cards --text`
  behavior.
- Mechanism: whole-query substring matching misses cards when operators write
  natural multi-token queries that differ from hyphenated or compact card terms.
- KRN implication: the pattern gate needs deterministic token matching over
  card semantics before coding, while preserving proof boundaries and avoiding
  semantic ranking claims.
- Decision: add exact-substring compatibility plus deterministic tokenized
  fallback over semantic card fields.
- Does not prove: semantic ranking quality, complete retained-pattern coverage,
  live DB search, Memory Core mutation safety beyond the read-only path, or
  product readiness.
- Consumer: `krn knowledge cards` Pattern Application Gate readback.
- Falsifier: a natural multi-token query such as `unknown first result state`
  fails to find `pattern:ts-boundary-unknown-first-result-state`, or the output
  implies ranking/product quality.

## Outcome V306 Context Condensation

Status: complete.

Source-to-decision:

- Source: user request to stop filling context with redundant plan history.
- Mechanism: active root files are repeatedly reloaded after compaction; long
  historical ledgers consume context and reduce continuation reliability.
- KRN implication: active truth should keep only current state, next task,
  remaining product gaps, and evidence pointers.
- Decision: archive the detailed `PLANS.md` ledger and replace the active file
  with a compact current-state ledger.
- Does not prove: that historical evidence is obsolete or that V306 source work
  is complete.
- Consumer: future Codex continuation after compact.
- Falsifier: a new continuation cannot identify active stream/task, latest
  verified state, remaining product gaps, or next action from root files.

## Outcome V306 Knowledge Cards Search Completion

Status: complete.

Source-to-decision:

- Source: V306 implementation and
  `docs/reviews/controlled-dogfood/2026-06-28-v306-knowledge-cards-tokenized-text-search/REPORT.md`.
- Mechanism: exact substring matching remains compatible, while tokenized
  fallback finds multi-token natural queries without using noisy evidence refs
  or claiming semantic ranking.
- KRN implication: pre-coding Pattern Application Gate operators can find the
  TypeScript boundary pattern with `unknown first result state` while proof
  boundaries stay explicit.
- Decision: mark V306 complete and move the active stream to V307 usefulness
  feedback closure.
- Does not prove: search ranking quality, complete retained-pattern coverage,
  live DB search, memory mutation safety outside the read-only command, or
  product readiness.
- Consumer: V307 Pattern Search Usefulness Feedback Closure.
- Falsifier: V307 cannot show whether tokenized search helped, was neutral,
  produced noise, or missed an obvious retained pattern.

## Outcome V307 Pattern Search Usefulness Feedback Closure

Status: complete.

Source-to-decision:

- Source: V307 knowledge-card query for `research source decision retention
  gate`.
- Mechanism: V306 tokenized search returned exactly one relevant retained
  pattern for the next pre-coding gate.
- KRN implication: the improved search reduced pattern-gate uncertainty and
  supports moving to source-decision work rather than another search repair.
- Decision: mark V307 complete and activate V308 Research Source Decisions
  Initial Pack.
- Does not prove: semantic ranking quality, source truth, research completeness,
  live DB search, Memory Core mutation behavior, or product readiness.
- Consumer: V308 source decision intake.
- Falsifier: V308 cannot use the selected source-to-decision gate to reject
  decorative sources or retain only source decisions with consumers/falsifiers.

## 21. Final Response Format For Codex Runs

Every continuation or completed slice must end with:

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
