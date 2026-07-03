# KRN Sources

Every source retained here must pass:

```txt
source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier
```

Every retained source must also name source class, decision kind, primary
consumer, falsifier, and what it does not prove. If a source has no consumer or
cannot be falsified locally, keep it out of active KRN guidance.

## Codex Native Surfaces

### AGENTS.md

- URL: https://developers.openai.com/codex/guides/agents-md
- Trust tier: high.
- Source class: official docs.
- Decision kind: adopt.
- Mechanism: Codex discovers durable project instructions from `AGENTS.md`
  layers before work.
- KRN implication: keep `AGENTS.md` thin and use it for repo guidance only.
- Decision: active instructions point to `docs/KRN_KERNEL.md` and forbid broad
  rereads.
- Consumer: root `AGENTS.md` and compact `GOAL.md`/`PLAN.md` guidance.
- Falsifier: repeated Codex runs need broad rereads or miss kernel constraints
  because durable repo guidance is too thin or unclear.
- Does not prove: that a giant `AGENTS.md` improves results.

### Skills

- URL: https://developers.openai.com/codex/skills
- Trust tier: high.
- Source class: official docs.
- Decision kind: adopt.
- Mechanism: skills package reusable workflows with progressive disclosure.
- KRN implication: repo-local KRN workflows belong in `.agents/skills/`.
- Decision: create engineering-discipline skills, not custom prompts or stack
  agents.
- Consumer: repo-local `.agents/skills/*` workflows.
- Falsifier: repeated KRN workflows still require copying long prompt blocks
  into chat or root plans instead of loading a targeted skill.
- Does not prove: that many skills are useful by default.

### Matt Pocock Skills

- URL: https://github.com/mattpocock/skills
- Trust tier: medium.
- Source class: practitioner writing.
- Decision kind: adopt.
- Mechanism: small, adaptable, composable skills encode software-engineering
  feedback loops, shared language, issue-tracker routing, TDD, debugging,
  architecture review, and handoff instead of a single process monolith.
- KRN implication: KRN skills should encode repeated kernel-building
  disciplines and later brain-backed Codex workflows; they must not become a
  decorative skill zoo or alternate runtime authority.
- Decision: keep operational repo-local skills only when they have a clear
  trigger, workflow, forbidden behavior, verification, consumer, and removal
  condition. Treat future brain skills as consumers of KRN memory/source/eval
  readbacks, not as prompt packs.
- Consumer: `docs/architecture/skill-first-krn.md`,
  `.agents/skills/*/SKILL.md`, and skill invariants.
- Falsifier: a retained skill cannot reduce repeated work, cannot name its
  KRN consumer, or claims brain/runtime authority without an executing
  memory/source/eval path.
- Does not prove: Matt Pocock's skill topology should be copied wholesale,
  every KRN workflow deserves a skill, or skills are product readiness.

### Subagents

- URL: https://developers.openai.com/codex/subagents
- Trust tier: high.
- Source class: official docs.
- Decision kind: lab_test.
- Mechanism: Codex can explicitly spawn bounded agents with separate context and
  inherited sandbox/approval controls.
- KRN implication: use subagents as organs for bounded review/exploration.
- Decision: start with only `ts-type-critic`.
- Consumer: `.codex/agents/ts-type-critic.toml` and future read-heavy review
  gates only after evidence.
- Falsifier: read-heavy review tasks repeatedly exceed context budget or miss
  TypeScript boundary problems that a read-only critic could catch.
- Does not prove: that broad swarms improve KRN early.

### Hooks

- URL: https://developers.openai.com/codex/hooks
- Trust tier: high.
- Source class: official docs.
- Decision kind: defer.
- Mechanism: lifecycle hooks can run deterministic command handlers and require
  trust review.
- KRN implication: hooks are mechanical gates and audit surfaces.
- Decision: no hidden semantic architecture in hooks.
- Consumer: future hook ADR/policy only when a deterministic command gate is
  accepted.
- Falsifier: a repeated mechanical pre/post action remains manually enforced
  and creates review misses despite a small deterministic hook being available.
- Does not prove: that hooks are sufficient safety control.

### MCP

- URL: https://developers.openai.com/codex/mcp
- Trust tier: high.
- Source class: official docs.
- Decision kind: defer.
- Mechanism: MCP gives Codex tools/resources/prompts with configuration,
  allowlists, auth, and approval modes.
- KRN implication: MCP is a typed tool boundary, not memory.
- Decision: KRN MCP server is later, after CLI/store contracts exist.
- Consumer: future MCP ADR and typed read-model/tool boundary.
- Falsifier: operators repeatedly need structured KRN readback/tool access that
  cannot be served by CLI/DB read models without brittle shell parsing.
- Does not prove: that MCP is safe by default.

### Rules

- URL: https://developers.openai.com/codex/rules
- Trust tier: high.
- Source class: official docs.
- Decision kind: reject.
- Mechanism: rules control command prefixes outside the sandbox and are
  experimental.
- KRN implication: rules are command-policy controls only.
- Decision: do not encode semantic architecture in rules.
- Consumer: local Codex command-policy config only.
- Falsifier: semantic/product behavior is encoded in command rules instead of
  typed KRN plans, skills, tests, or policy gates.
- Does not prove: that rules should be a product brain.

### Permissions And Security

- URLs:
  - https://developers.openai.com/codex/permissions
  - https://developers.openai.com/codex/agent-approvals-security
- Trust tier: high.
- Source class: official docs.
- Decision kind: adopt.
- Mechanism: sandbox, approvals, permission profiles, network policy, and
  destructive tool approval define the local trust boundary.
- KRN implication: do not mix permission profiles and legacy sandbox settings in
  one active config path.
- Decision: bootstrap posture is read/propose for review/subagents,
  workspace-write only for implementation, network off unless explicitly
  allowed.
- Consumer: security/trust-boundary docs, skills, and future permission ADRs.
- Falsifier: a future KRN surface mixes sandbox/approval concepts or grants
  broader execution/network authority without explicit proof and rollback.
- Does not prove: that broad access is acceptable for speed.

### Custom Prompts

- URL: https://developers.openai.com/codex/custom-prompts
- Trust tier: high.
- Source class: official docs.
- Decision kind: reject.
- Mechanism: custom prompts are deprecated in favor of skills.
- KRN implication: reusable KRN workflows should be skills.
- Decision: reject custom prompt library.
- Consumer: skill-first workflow policy and `.agents/skills/*`.
- Falsifier: reusable KRN workflows move into custom prompt snippets instead of
  skills, tests, runbooks, or task contracts.
- Does not prove: that every instruction must become a skill.

## OpenAI Cookbook Patterns

### Goals In Codex

- URL: https://developers.openai.com/cookbook/examples/codex/using_goals_in_codex
- Trust tier: high.
- Source class: official docs.
- Decision kind: adopt.
- Mechanism: goals support continuation with explicit objective and evidence.
- KRN implication: `GOAL.md` should be a current execution contract.
- Decision: keep goal compact and phase-oriented.
- Consumer: root `GOAL.md`.
- Falsifier: `GOAL.md` becomes a ledger/backlog or a completed old slice remains
  the first resume target after compaction.
- Does not prove: that goal should become product brain.

### Iterative Repair Loops

- URL:
  https://developers.openai.com/cookbook/examples/codex/build_iterative_repair_loops_with_codex
- Trust tier: high.
- Source class: official docs.
- Decision kind: adopt.
- Mechanism: review, repair, and validation close the loop.
- KRN implication: KRN repair loops should move through bounded task, evidence,
  review assessment, feedback delta, and verified repair instead of feature
  momentum.
- Decision: use current evidence/review/feedback surfaces for bounded repair
  loops; do not route future work through stale review-capture or doctor-first
  wording.
- Consumer: bounded repair loop tasks, evidence/review/feedback commands, and
  `PLANS.md` next-task synthesis.
- Falsifier: KRN keeps adding features without a failing check, repair, and
  verification loop tied to one behavior.
- Does not prove: that broad automation should run before kernel spine.

### Agent Improvement Loop

- URL: https://developers.openai.com/cookbook/examples/agents_sdk/agent_improvement_loop
- Trust tier: high.
- Source class: official docs.
- Decision kind: adopt.
- Mechanism: traces and feedback feed eval candidates and improvement.
- KRN implication: eval candidates should come from real traces.
- Decision: no broad benchmark lane before dogfood evidence.
- Consumer: eval/golden candidates and Promptfoo smoke adapter.
- Falsifier: eval cases are added without trace/run evidence or without a
  proof/non-proof boundary.
- Does not prove: that green evals prove product quality.

### Memory And Compaction

- URL:
  https://developers.openai.com/cookbook/examples/agents_sdk/building_reliable_agents_memory_compaction
- Trust tier: high.
- Source class: official docs.
- Decision kind: adopt.
- Mechanism: separate working context from durable memory and compact selected
  state.
- KRN implication: runtime memory must be selected and store-backed.
- Decision: files are export/audit/seed, not Memory Core.
- Consumer: memory/activation architecture and context-condensation rules.
- Falsifier: markdown files become runtime Memory Core or active context grows
  by accumulation instead of selected, store-backed recall.
- Does not prove: that local markdown memory is enough.

### ExecPlans

- URL: https://developers.openai.com/cookbook/articles/codex_exec_plans
- Trust tier: high.
- Source class: official docs.
- Decision kind: adopt.
- Mechanism: ExecPlans preserve objective, discoveries, decisions, validation,
  and next work for long-running implementation.
- KRN implication: root `PLANS.md` is the detailed continuous ExecPlan, while
  root `PLAN.md` stays compact product truth.
- Decision: keep the current `GOAL.md` + compact `PLAN.md` + detailed
  `PLANS.md` split.
- Consumer: root `PLANS.md`, compact root `PLAN.md`, and handoff/compaction
  rules.
- Falsifier: a fresh Codex continuation cannot resume from compact active task
  state without broad rereads or stale completed slices.
- Does not prove: that `PLANS.md` should carry raw logs, old ledgers, or
  decorative research forever.

### Codex Prompting Guide

- URL:
  https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide
- Trust tier: high.
- Source class: official docs.
- Decision kind: adopt.
- Mechanism: Codex performs better when tasks, constraints, expected outputs,
  and verification are explicit.
- KRN implication: every bounded KRN task needs non-goals, allowed writes,
  forbidden writes, verification, proof/non-proof boundaries, rollback, and
  next-task synthesis.
- Decision: keep `PLANS.md` task contracts mandatory for generated active
  tasks.
- Consumer: generated `PLANS.md` task contracts and Codex-facing goal prompts.
- Falsifier: an active task lacks non-goals, allowed/forbidden writes,
  verification, proof/non-proof boundaries, rollback, or next-task synthesis.
- Does not prove: that every small edit needs a verbose prompt.

## Agent Memory And Retrieval Papers

### MemGPT

- URL: https://arxiv.org/abs/2310.08560
- Trust tier: medium.
- Source class: papers.
- Decision kind: adopt.
- Mechanism: virtual context management treats the LLM context window as a
  managed working set over slower durable memory tiers.
- KRN implication: KRN activation should select and evict context deliberately
  from store-backed memory/source/read models instead of treating long prompts
  or markdown ledgers as runtime memory.
- Decision: keep context assembly as a bounded working set and keep Memory Core
  store-backed; do not build file-backed runtime memory or assume a larger
  context window solves recall quality.
- Consumer: activation/context assembly work, context hygiene invariants, and
  future memory-usefulness benchmark cases.
- Falsifier: a future task improves KRN by adding more always-loaded context or
  markdown runtime memory instead of selected store-backed recall and still
  claims memory quality.
- Does not prove: that KRN should copy MemGPT implementation details, train a
  memory manager now, or skip review-gated memory promotion.

### Reflexion

- URL: https://arxiv.org/abs/2303.11366
- Trust tier: medium.
- Source class: papers.
- Decision kind: adopt.
- Mechanism: language-agent feedback can be converted into reflective memory
  that improves later trials without model weight updates.
- KRN implication: KRN feedback deltas and review assessments should create
  reviewable memory/source/eval candidates for future runs, not mutate durable
  truth automatically.
- Decision: retain feedback-to-candidate as the default improvement path and
  reject autonomous reflection writes to final Memory Core.
- Consumer: evidence/review loop, MemoryCandidate review, and future heartbeat
  candidate generation.
- Falsifier: a future reflection/feedback path writes final MemoryRecord truth
  without review or cannot show that feedback changed a later task.
- Does not prove: that verbal reflection is sufficient evidence, that candidate
  quality is good, or that KRN should optimize weights.

### Self-RAG

- URL: https://arxiv.org/abs/2310.11511
- Trust tier: medium.
- Source class: papers.
- Decision kind: lab_test.
- Mechanism: retrieval should be adaptive and critique-aware rather than always
  retrieving a fixed amount of context.
- KRN implication: brain-QA and activation work should test when KRN retrieves,
  abstains, critiques retrieved material, or records that evidence is
  insufficient.
- Decision: keep Self-RAG as an eval hypothesis for mini brain-QA; do not add a
  trained reflection-token model or hidden semantic hook.
- Consumer: V309 mini brain-QA benchmark sketch and future activation
  relevance tests.
- Falsifier: mini brain-QA cannot express cases where retrieval should be
  skipped, expanded, critiqued, or marked insufficient.
- Does not prove: that KRN has adaptive retrieval quality, citation accuracy,
  or a trained Self-RAG-style model.

### GraphRAG

- URL: https://arxiv.org/abs/2404.16130
- Trust tier: medium.
- Source class: papers.
- Decision kind: lab_test.
- Mechanism: global questions over a corpus can require entity graph structure
  and community summaries rather than nearest-neighbor passage retrieval.
- KRN implication: graph brain v0 should start from entities, claims, edges,
  and summary candidates with source ranges before widening corpus ingest.
- Decision: keep GraphRAG as a graph-brain benchmark hypothesis, not as a reason
  to build a broad graph platform now.
- Consumer: graph brain v0 design and mini brain-QA global-question cases.
- Falsifier: KRN graph work cannot answer or evaluate any corpus-level question
  that lexical/vector-only retrieval misses.
- Does not prove: that GraphRAG is the right implementation, that community
  summaries are accurate, or that KRN should build dashboard/API/MCP first.

### HippoRAG

- URL: https://arxiv.org/abs/2405.14831
- Trust tier: medium.
- Source class: papers.
- Decision kind: lab_test.
- Mechanism: knowledge graphs plus graph traversal/ranking can support
  multi-hop retrieval over integrated external knowledge.
- KRN implication: graph brain v0 should preserve entity/claim edges in a form
  that can later be evaluated for multi-hop retrieval, instead of only storing
  isolated chunks and embeddings.
- Decision: retain HippoRAG as a falsifiable multi-hop graph retrieval
  hypothesis after graph/ingest v0 exists.
- Consumer: future graph retrieval tests and multi-hop brain-QA cases.
- Falsifier: graph v0 produces edges that cannot improve or even be evaluated
  on multi-hop questions compared with lexical/vector readback.
- Does not prove: that KRN needs PageRank now, that a separate graph database is
  justified, or that graph retrieval is product-ready.

### Towards Autonomous Memory Agents

- URL: https://arxiv.org/abs/2602.22406
- Trust tier: medium.
- Source class: papers.
- Decision kind: lab_test.
- Mechanism: autonomous memory agents actively acquire, validate, and curate
  missing knowledge using a cost-aware extraction cascade and memory-selection
  exploration/exploitation, instead of only storing information that happens to
  appear in prior conversations.
- KRN implication: KRN heartbeat/dreaming should be able to propose
  candidate-only knowledge-acquisition or escalation work when source/brain
  search reports missing, stale, contradictory, or low-confidence evidence.
- Decision: lab-test a bounded acquisition/escalation candidate lane; do not
  add autonomous Memory Core mutation, crawler/API/MCP, ranking rewrite, or
  product claims from this paper alone.
- Consumer: heartbeat/dreaming candidate runtime, pattern/research brain,
  source-search missing-evidence readback, and future brain-QA/eval candidates.
- Falsifier: a future missing-evidence run cannot create a reviewable
  acquisition/escalation candidate, or an acquisition path mutates durable
  memory without review-gated acceptance.
- Does not prove: KRN product readiness, source truth, that benchmark gains
  transfer to KRN, that "Oxford" is the paper affiliation, or that autonomous
  retrieval should bypass source/review gates.

## Agent Memory Practitioner Sources

### Mastra Observational Memory

- URLs:
  - https://mastra.ai/research/observational-memory
  - https://mastra.ai/blog/observational-memory
- Trust tier: medium.
- Source class: competitor docs.
- Decision kind: adopt.
- Mechanism: event-derived observations and periodic reflection can keep agent
  context bounded while retaining recall paths to what happened, changed, and
  was decided.
- KRN implication: observation and reflection stay as staging layers over raw
  evidence; they may create reviewable candidates but must not become Memory
  Core or replace exact source provenance.
- Decision: keep ADR-0011's raw event -> observation -> reflection ->
  candidate -> reviewed promotion architecture, while rejecting text-only
  memory, source hoarding, and benchmark claims as KRN product proof.
- Consumer: `docs/decisions/ADR-0011-observational-memory-as-staging-layer.md`.
- Falsifier: a future slice lets observation/reflection directly mutate Memory
  Core, loses raw evidence recall, or treats source-reported memory benchmark
  results as KRN product readiness.
- Does not prove: that KRN should copy Mastra's implementation, add observer or
  reflector workers now, use text-only runtime memory, or build dashboard/API/MCP
  surfaces before local dogfood and golden proof.

## Infrastructure Sources

### PostgreSQL Row Locking For Queue-Like Tables

- URL: https://www.postgresql.org/docs/current/sql-select.html
- Trust tier: high.
- Source class: official docs.
- Decision kind: defer.
- Mechanism: PostgreSQL row locking supports `FOR UPDATE ... SKIP LOCKED`,
  which can let concurrent consumers skip already locked rows for queue-like
  tables while accepting an inconsistent view that is not suitable for general
  reads.
- KRN implication: if KRN later accepts a worker executor, the first queue
  claim mechanism should be proven against existing Postgres `worker_jobs` and
  `outbox_events` before adding Redis, Kafka, or another queue service.
- Decision: keep worker runtime deferred, but retain PostgreSQL row locking as
  the first candidate locking mechanism for any future one-shot/manual worker
  executor proof.
- Consumer: `docs/decisions/ADR-0015-worker-runtime-boundary.md`.
- Falsifier: a future worker proof cannot express safe claim, lock, retry,
  timeout, idempotency, and audit behavior over Postgres worker-job/outbox
  tables without a separate queue service.
- Does not prove: that a worker daemon should be built now, that
  `SKIP LOCKED` is correct for every KRN read path, or that queue throughput is
  sufficient without a local worker-executor proof.

## TypeScript Official Sources

### TypeScript Narrowing And Exhaustiveness

- URL: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- Trust tier: high.
- Source class: official docs.
- Decision kind: adopt.
- Mechanism: TypeScript control-flow narrowing and `never` exhaustiveness make
  finite union states explicit at the branch where behavior changes.
- KRN implication: KRN status, provenance, lifecycle, and readback metadata
  unions should be narrowed at IO/render boundaries, and behavior-changing
  branches should fail typecheck when a union member is added but not handled.
- Decision: keep a TypeScript standard rule for finite-state narrowing and
  exhaustiveness at public, CLI, persistence, and readback boundaries.
- Consumer: `docs/standards/typescript-excellence.md` and future bounded
  TypeScript repair slices.
- Falsifier: a future KRN union adds a behavior-relevant member while rendering,
  persistence mapping, or review logic keeps compiling without handling the new
  state.
- Does not prove: that every union needs a switch, that broad type rewrites are
  valuable, or that official handbook examples are sufficient product evidence.

## TypeScript Practitioner Sources

### Designing Your Types

- URL:
  https://www.totaltypescript.com/books/total-typescript-essentials/designing-your-types-in-typescript
- Trust tier: medium.
- Source class: high-quality public course page.
- Decision kind: adopt.
- Mechanism: Type design communicates business and domain logic, not just
  compiler satisfaction.
- KRN implication: authority, provenance, lifecycle, and review state should be
  visible in domain types where those facts govern behavior.
- Decision: keep `docs/standards/typescript-excellence.md` doctrine that KRN
  TypeScript should make wrong authority hard to express.
- Consumer: TypeScript standards and future type-boundary repair slices.
- Falsifier: KRN domain types allow wrong authority, provenance, lifecycle, or
  review states to be represented without validation or review.
- Does not prove: that a broad type rewrite is valuable.

### Unions, Literals, And Narrowing

- URL:
  https://www.totaltypescript.com/books/total-typescript-essentials/unions-literals-and-narrowing
- Trust tier: medium.
- Source class: high-quality public course page.
- Decision kind: adopt.
- Mechanism: literal unions and narrowing constrain finite states and valid
  transitions.
- KRN implication: status, provenance, lifecycle, subject type, and candidate
  states should use narrow unions or discriminated unions when valid fields
  differ by state.
- Decision: keep discriminated-union guidance in
  `docs/standards/typescript-excellence.md`.
- Consumer: TypeScript boundary standard and lifecycle model reviews.
- Falsifier: a future lifecycle/status/provenance model uses optional object
  soup where valid fields differ by state.
- Does not prove: that every object needs a discriminant.

### TS Reset

- URL: https://www.totaltypescript.com/ts-reset
- Trust tier: medium.
- Source class: practitioner writing.
- Decision kind: adopt.
- Mechanism: stricter platform typings can turn unsafe defaults such as
  `JSON.parse` returning `any` into safer unknown-first behavior, but global
  type changes are application-scoped.
- KRN implication: use unknown-first parsing at CLI/file/env/JSON boundaries,
  but reject global `ts-reset` in `packages/core`, `packages/schema`, and public
  package APIs.
- Decision: keep the current `ts-reset` policy in
  `docs/standards/typescript-boundaries.md`.
- Consumer: TypeScript boundary standard and package/app-scope type decisions.
- Falsifier: production code trusts `JSON.parse`, `fetch().json()`, env, CLI,
  file, MCP, or connector output without unknown-first validation.
- Does not prove: that `ts-reset` is forbidden in every private app/test scope.
