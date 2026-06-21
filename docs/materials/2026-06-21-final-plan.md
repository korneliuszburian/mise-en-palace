[Aktualny plan](../../PLAN.md)

---

Masz rację. **Kontrakt bez decyzji o docelowej infrze memory/store to za mało.** To byłoby znowu “ładnie nazwane abstrakcje”, które później dopiero szukają bazy, syncu, graphu i API. To jest dokładnie ten typ płytkości, który może zabić KRN drugi raz.

Zmieniam decyzję:

```txt
Nie robimy: contracts now, infra later.

Robimy:
final target architecture now
  -> schema/store/graph/ledger decided now
  -> implementation slices są tylko transakcjami
  -> każdy slice od początku idzie w docelowy wzorzec
```

Nie mam Twojego `/home/krn/coding/krn/active/mise-en-palace` zamontowanego w tym sandboxie, więc nie będę udawał, że edytuję repo. Ale poniżej dostajesz **ostateczny plan realizacyjny + prompt do Codexa**, już z docelową bazą, memory infra, store patterns, API, workerami, dashboard targetem, skill/routerem i wykluczeniami.

---

# 0. Nowa decyzja nadrzędna

## KRN target stack od teraz

```txt
Canonical data plane:
  PostgreSQL + pgvector

Local/dev/test mode:
  PGlite or Docker Postgres

ORM / schema:
  Drizzle ORM + SQL migrations + raw SQL escape hatches

Validation:
  Zod at IO/API/CLI boundaries

Search:
  Postgres full-text search + pgvector + relational graph edges

Graph:
  Postgres edge tables first, not Neo4j

Queue / async:
  Postgres outbox + job table first, not Redis/Kafka

Realtime:
  Postgres LISTEN/NOTIFY for local/live hints, not durable queue

Memory:
  typed Memory Core in Postgres, not markdown, not `.krn`

Dashboard:
  read-model projection over typed Postgres objects, not first product surface

Codex integration:
  AGENTS.md + Skills + Hooks + MCP adapter + Goals/ExecPlans, all as adapters

Research:
  bounded Research Foundry later; no default swarm during core bootstrap
```

To jest teraz docelowa architektura, nie placeholder.

Powód: Postgres daje nam jedną transakcyjną bazę dla canonical state, event logu, graph edges, JSONB metadata, full-text search i pgvector. pgvector wspiera exact i approximate vector search oraz indeksy HNSW/IVFFlat; Postgres ma natywny full-text search przez `tsvector`/`tsquery` i ranking; JSONB można indeksować przez GIN; to wystarcza na pierwszy prawdziwy Memory/Source/Run control plane bez rozbijania systemu na Neo4j + Qdrant + Elastic + Redis + osobny event store. ([GitHub][1])

---

# 1. Co było błędne w poprzednim kierunku

Poprzedni plan był za bardzo:

```txt
types -> contract tests -> init dry-run -> doctor -> context build
```

To nadal pachniało “feature roadmapą”.

Poprawny plan:

```txt
Target infra decision
  -> canonical schema
  -> typed stores
  -> activation engine
  -> harness compiler
  -> Codex adapter
  -> CLI/API surfaces
  -> dogfood loop
```

Twoje materiały jasno mówią, że stary problem polegał na dashboard-first, benchmark theater, markdown pseudo-memory, goal sprawl i artefaktach bez obniżenia review burden. Memory ma być store/service-backed z lineage, confidence, TTL, invalidation i feedbackiem, a źródła mają wspierać decyzję/mechanizm/ryzyko/odrzucenie, nie być listą linków.

---

# 2. Finalna architektura KRN

## Jedno zdanie

```txt
KRN is a Postgres-backed AI Engineering Harness OS for Codex:
it governs activation, trust, execution, evidence, review, and learning.
```

## Główny przepływ

```txt
OperatorIntent
  -> TaskContract
  -> HarnessPlan
  -> ContextAssembly
  -> CapabilityPlan
  -> CodexAdapterPlan
  -> ExecutionRun
  -> EvidenceBundle
  -> ReviewAssessment
  -> FeedbackDelta
  -> Memory / Source / Skill / Policy / Eval updates
```

## System graph

```txt
                         ┌──────────────────────┐
                         │    OperatorIntent     │
                         └──────────┬───────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         KRN HARNESS OS                               │
│                                                                     │
│  Contract -> Plan -> Activate -> Execute -> Evidence -> Review       │
│      ▲                                                │              │
│      └──────────── Learn <- Feedback <- Trace <───────┘              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
          │              │               │               │
          ▼              ▼               ▼               ▼
   Memory Core     Source Graph    Capability Router    Policy Gates
          │              │               │               │
          └──────────────┴───────────────┴───────────────┘
                                 ▼
                         PostgreSQL + pgvector
```

---

# 3. Docelowa infra memory

## 3.1 Kanoniczna baza

**Decyzja: Postgres + pgvector jako canonical KRN brain store.**

Nie Qdrant jako pierwsza baza.
Nie Neo4j jako pierwsza baza.
Nie SQLite jako canonical truth.
Nie markdown.
Nie `.krn`.

Dlaczego:

```txt
Postgres:
  transactions
  migrations
  relational graph edges
  JSONB metadata
  full-text search
  vector search via pgvector
  append-only event ledger
  outbox/jobs
  API/dashboard read models
```

pgvector wystarcza na embedding retrieval i wspiera HNSW/IVFFlat; Postgres full-text search wystarcza na lexical retrieval; GIN/JSONB wystarcza na metadata filtering; relational edge tables wystarczą na source/memory/decision graph. ([GitHub][1])

## 3.2 Local mode

Dla lokalnego developmentu/testów:

```txt
preferred:
  Docker Postgres + pgvector

optional embedded/dev:
  PGlite
```

PGlite jest WASM Postgres packaged as TypeScript/JavaScript client, działa w Node/Bun/browser i wspiera wiele extensionów, w tym pgvector. To jest świetne do lightweight tests / local prototyping, ale canonical production state nadal projektujemy pod Postgres. ([GitHub][2])

## 3.3 Co odrzucamy teraz

```txt
Qdrant:
  odrzucamy teraz jako primary store.
  Przyda się dopiero przy wielkiej skali vector search / heavy filtered ANN.

Neo4j:
  odrzucamy teraz jako primary graph.
  Graph edges w Postgres wystarczą; osobny graph DB zwiększa operacyjny ciężar.

LanceDB:
  odrzucamy teraz.
  Dobre embedded vector workloads, ale KRN potrzebuje transactional brain + graph + runs.

Elastic/OpenSearch:
  odrzucamy teraz.
  Postgres FTS wystarczy na start.

Redis/Kafka:
  odrzucamy teraz.
  Postgres outbox/job table wystarczy, zanim będziemy mieli realny throughput problem.
```

Qdrant i LanceDB są mocnymi narzędziami, ale wnoszą dodatkowy storage plane; Neo4j ma vector/full-text capabilities, ale oddzielny graph DB na tym etapie rozbija spójność state’u. KRN potrzebuje najpierw jednego spójnego brain store, nie czterech specjalistycznych mózgów. ([Qdrant][3])

---

# 4. Memory Core: finalny model

Memory nie jest “long-term / short-term” jako foldery. To jest **temporal, governed, feedback-aware memory system**.

## Memory types

```txt
working_memory
  session-local, expires fast, not canonical truth

episodic_memory
  run traces, events, review outcomes

semantic_memory
  decisions, constraints, architecture boundaries, preferences

procedural_memory
  skills, rule packs, repair loops, review workflows

source_memory
  extracted source claims and source-to-decision edges

anti_memory
  invalidated claims, rejected patterns, do-not-use rules

policy_memory
  repeated review feedback turned into gates/rules
```

## Memory write path

```txt
EvidenceBundle
  -> ReviewAssessment
  -> FeedbackDelta
  -> MemoryCandidate
  -> MemoryReviewGate
  -> MemoryRecordVersion
  -> Embedding + edges + activation metadata
```

Nie ma automatycznego “agent powiedział, więc memory updated”.

## Memory retrieval path

```txt
TaskContract
  -> MemoryQuery
  -> lexical candidates
  -> vector candidates
  -> graph expansion
  -> trust/TTL/invalidation filter
  -> ContextROI scoring
  -> diversity/dedup
  -> ContextAssembly
  -> ActivationTrace persisted
```

To odpowiada korekcie z rozmowy: KRN nie wygrywa linkami, tylko tym, że umie nie użyć 99% zasobów. ActivationPolicy, TrustAssessment, ContextROI, AntiMemory i CapabilityCompiler są prawdziwymi elementami przewagi.

---

# 5. Docelowy schema model

## Core tables

```sql
workspaces
users
projects
repo_installations
project_kernels
architecture_boundaries
decisions
```

## Harness tables

```sql
operator_intents
task_contracts
harness_plans
context_assemblies
context_items
context_exclusions
capability_requirements
capability_bindings
codex_adapter_plans
execution_runs
tool_traces
evidence_bundles
review_assessments
feedback_deltas
```

## Memory tables

```sql
memory_records
memory_record_versions
memory_edges
memory_applications
memory_feedback_events
anti_memory_records
memory_candidates
memory_activation_traces
```

## Source graph tables

```sql
source_artifacts
source_chunks
source_claims
source_claim_edges
source_decisions
source_rejections
source_snapshots
```

## Retrieval/search tables

```sql
embedding_models
embeddings
search_documents
retrieval_runs
retrieval_candidates
activation_decisions
```

## Skills/rules/policy

```sql
skill_manifests
skill_versions
skill_lifecycle_events
rule_packs
rule_pack_versions
rule_compatibility_edges
rule_activation_records
policy_gates
policy_gate_results
tool_boundaries
```

## Async/audit

```sql
run_events
audit_events
outbox_events
worker_jobs
```

## Eval

```sql
eval_candidates
eval_promotions
golden_tasks
regression_failures
```

To nie jest “za dużo tabel na start”. To jest **jeden spójny docelowy model**, ale implementowany w cienkich pionowych przekrojach. Pierwszy slice nie musi wypełniać wszystkich tabel, ale schema direction ma być znany od początku.

---

# 6. Event/ledger pattern

KRN powinien mieć append-only event ledger:

```txt
OperatorIntentCreated
TaskContractCreated
HarnessPlanCreated
ContextAssembled
CapabilityBound
PolicyGateEvaluated
ExecutionStarted
ToolCalled
EvidenceCaptured
ReviewAssessed
FeedbackProposed
MemoryCandidateAccepted
MemoryRecordInvalidated
EvalCandidateCreated
```

Event sourcing jest właściwym mental model dla audytu pracy agenta: każda zmiana stanu jest zapisana jako event, a read models / dashboard / feedback mogą być odbudowane z ledgeru. Fowler opisuje event sourcing jako przechowywanie każdej zmiany stanu w sekwencji eventów; transactional outbox pozwala publikować eventy tylko wtedy, gdy transakcja bazy faktycznie się zatwierdzi. ([martinfowler.com][4])

Dlatego:

```txt
No Kafka now.
No Redis queue now.
Postgres outbox first.
Worker relay later.
```

---

# 7. Search / retrieval engine

## Hybrid retrieval

```txt
1. lexical search:
   PostgreSQL full-text search

2. vector search:
   pgvector embeddings

3. graph expansion:
   memory/source/decision/policy edges

4. trust filtering:
   T0 primary > T1 evidence > T2 decisions > T3 memory > T4 summaries > T5 hypothesis

5. temporal filtering:
   TTL, valid_from, valid_until, invalidation

6. context ROI:
   token cost vs expected decision impact

7. final assembly:
   7–20 high-signal items, explicit exclusions
```

Nie robimy naive RAG. Robimy **activation engine**.

Papers wspierają tę decyzję: `Lost in the Middle` pokazuje, że LLM-y nie używają długiego kontekstu równomiernie, więc większy context dump nie jest rozwiązaniem; MemGPT daje dobry OS-style mental model pamięci hierarchicznej i zarządzania finite context window; GraphRAG pokazuje wartość struktury grafowej nad samymi snippetami; LangChain porządkuje context engineering jako write/select/compress/isolate. ([arXiv][5])

---

# 8. Skills / rules / senior engineering layer

Skille nie są `requiredSkills`.

Skille są **procedural memory / engineering cognition modules**.

```txt
TaskContract
  -> CapabilityRequirement
  -> CapabilityCompiler
  -> SkillBinding / RulePackBinding / MCPToolBinding / SubagentProbe
```

Codex skills są progressive-disclosure surface: Codex widzi initial skill list w ograniczonym budżecie, a pełne instrukcje ładuje dopiero po wyborze; OpenAI podaje, że initial skills list używa maksymalnie około 2% context window albo 8 000 znaków, gdy okno jest nieznane. ([OpenAI Developers][6])

Matt Pocock’s skills są dobrym wzorem, bo są opisane jako małe, łatwe do adaptacji i composable, a Sandcastle pokazuje rozdzielenie “engineering harness” od sandboxed execution plane. Nie kopiujemy jego repo, bierzemy wzorce: małe skills, trigger discipline, TDD/review loops, sandbox jako osobna warstwa. ([GitHub][7])

## Initial engineering skills

```txt
grill-requirements
  wymusza doprecyzowanie celu i non-goals

investigate-codepath
  mapuje realne codepaths przed edycją

reconcile-sources
  źródła -> mechanism -> implication -> decision/rejection

design-contract
  modeluje domenę przed implementacją

type-boundary-review
  unknown/validation/public API/casts/any

diff-risk-review
  minimalizuje review burden i rollback risk

repair-loop
  implement -> verify -> inspect -> repair

handoff
  first-screen resumability

rule-pack-router
  wybiera APoSD/Clean Architecture/DDD/DDIA/Refactoring/Release It pressure
```

Rule-packi z `agent-rules-books` traktujemy jako **decision pressure**, nie jako always-on AGENTS dump. Repo opisuje rule sety inspirowane książkami o software design, architecture, refactoring, legacy code, reliability i data-intensive systems, a jego publiczna strona zaleca `mini/full` jako focused skills i `nano` jako tiny always-on context. ([GitHub][8])

---

# 9. Codex integration

## AGENTS.md

`AGENTS.md` ma być cienki. OpenAI mówi wprost, że AGENTS.md daje durable project guidance i “keep it small”; ma służyć rules, build/test commands, review expectations i repo conventions. ([OpenAI Developers][9])

## Skills

Skills są adapterem do capability routera. Nie są core fieldem. ([OpenAI Developers][6])

## Hooks

Hooks są policy/trace guardrails, nie semantycznym mózgiem. OpenAI opisuje hook events takie jak `PreToolUse`, `PostToolUse`, `PreCompact`, `SubagentStart`, `Stop`; to mapujemy na KRN policy gates, evidence capture i compaction discipline. ([OpenAI Developers][10])

## MCP

MCP jest późniejszym typed boundary do KRN API: memory query, source graph query, harness plan, evidence capture, policy checks. OpenAI opisuje MCP jako sposób podłączenia modeli do tools/context, a Codex używa go do external tools i third-party context. ([OpenAI Developers][11])

## Subagents

Subagenty są read-heavy probes, nie drugi mózg. OpenAI zaleca subagents jako start dla read-heavy exploration, tests, triage i summarization, a ostrożność przy write-heavy równoległości. ([OpenAI Developers][12])

---

# 10. API / dashboard target

Dashboard nie znika. Ale dashboard jest read-model projection.

```txt
Postgres canonical state
  -> read models
  -> API
  -> dashboard
```

Dashboard screens:

```txt
Projects
Harness Runs
Context Activations
Memory Health
Source Graph
Decision Graph
Review Burden
Diff Risk
Policy Violations
Skill Lifecycle
Eval Candidates
Research Foundry
```

Warunek:

```txt
Dashboard field musi mieć action.
No vanity metrics.
```

Przykład:

```txt
Memory Health:
  stale memory count
  hurt-count memories
  anti-memory hits
  high-confidence old records
  records without application feedback

Action:
  invalidate / demote / review / re-embed / merge
```

---

# 11. TypeScript product stack

## Runtime decisions

```txt
Package manager:
  pnpm

Language:
  TypeScript strict

DB:
  PostgreSQL + pgvector

ORM/migrations:
  Drizzle ORM

DB driver:
  postgres.js or node-postgres, decided by adapter needs

Validation:
  Zod at IO/API/CLI boundaries

Tests:
  Vitest

CLI:
  minimal manual parser or CAC later; no heavy CLI framework first

API:
  Hono or Fastify later; choose when API package starts

Build:
  tsup later when packaging/publish matters

Do not use:
  global ts-reset in packages/core
```

Drizzle supports TypeScript schema as source of truth and migration generation/application with drizzle-kit; Zod is TypeScript-first validation for untrusted data; Vitest is the likely small test layer; tsup/build tooling waits until packaging matters. ([Drizzle ORM][13])

## Package boundaries

```txt
packages/core
  pure domain, no IO

packages/schema
  Zod schemas + JSON contracts

packages/db
  Drizzle schema + migrations + repositories

packages/harness
  compiler + activation engine

packages/codex-adapter
  AGENTS/skills/hooks/MCP/goal/execplan renderers

packages/cli
  terminal adapter

packages/api
  future HTTP/MCP app API

packages/workers
  compaction, embedding, contradiction, eval promotion

packages/dashboard
  future UI
```

`packages/core` stays library-safe: no fs, no shell, no env, no network, no Codex invocation, no CLI formatting, no process mutation. That boundary already appears in the KRN standards you supplied.

---

# 12. Final runtime flow

```txt
krn init --connect
  -> detect repo
  -> create Project row
  -> create ProjectKernel
  -> write thin AGENTS.md / .codex refs only if approved
  -> register repo installation
  -> seed initial source pointers
  -> create first OperatorIntent

krn plan --task "..."
  -> create TaskContract
  -> retrieve Memory/Source candidates from Postgres
  -> run ActivationPolicy
  -> create ContextAssembly
  -> create CapabilityPlan
  -> create CodexAdapterPlan
  -> materialize ExecutionBrief

Codex executes
  -> hooks capture tool traces
  -> policy gates annotate/deny risky actions
  -> evidence bundle captured

krn review
  -> ReviewAssessment
  -> FeedbackDelta
  -> MemoryCandidates / SourceDecisions / EvalCandidates

workers
  -> embed chunks
  -> compact memory
  -> detect contradictions
  -> expire stale records
  -> promote eval candidates
  -> update dashboard read models
```

---

# 13. Implementation plan — teraz już nie płytki

To jest plan do wklejenia Codexowi. Jest docelowy od początku.

```md
# KRN Final Product Implementation Run — Harness + Memory Infra First

Repository root:

`/home/krn/coding/krn/active/mise-en-palace`

## Mission

Implement KRN as a Postgres-backed AI Engineering Harness OS for Codex.

Do not implement contracts disconnected from target infrastructure.

The target architecture is decided now:

- PostgreSQL + pgvector is the canonical KRN brain store.
- Postgres full-text search + pgvector + relational edge tables form the retrieval layer.
- Postgres append-only run/event ledger + outbox/job tables form the audit/async layer.
- Drizzle ORM owns schema/migrations.
- Zod owns IO/API/CLI validation boundaries.
- Markdown and `.krn/` files are exports/cache/audit only, never Memory Core.
- Codex surfaces are adapters: AGENTS.md, skills, hooks, MCP, goals, ExecPlans.
- CLI is an adapter, not architecture.
- Dashboard is a read-model over typed objects, not an initial product surface.

## Canonical flow

OperatorIntent
  -> TaskContract
  -> HarnessPlan
  -> ContextAssembly
  -> CapabilityPlan
  -> CodexAdapterPlan
  -> ExecutionRun
  -> EvidenceBundle
  -> ReviewAssessment
  -> FeedbackDelta
  -> Memory / Source / Skill / Policy / Eval updates

## Hard non-goals

Do not create:

- dashboard UI
- apps/
- separate Qdrant/LanceDB/Neo4j/Elastic store
- Redis/Kafka queue
- runtime markdown memory
- `.krn` runtime memory truth
- broad benchmark lane
- broad eval suite
- KRN MCP server implementation before DB/harness exists
- broad subagent system
- project-oriented skill zoo
- old repo topology import

## Slice 00 — Target infra ADR

Create:

`docs/decisions/ADR-0001-krn-brain-store-postgres-pgvector.md`

Decision:

- Postgres + pgvector is canonical KRN state.
- Graph is modeled as relational edge tables.
- Vector search is pgvector.
- Lexical search is Postgres full-text search.
- Async is Postgres outbox/job table first.
- PGlite or Docker Postgres may be used for local/test.
- Qdrant/Neo4j/LanceDB/Redis/Kafka are explicitly rejected for first implementation.

Verification:

- ADR exists.
- No dependencies added.
- `pnpm typecheck`.

Commit:

`docs(adr): choose Postgres pgvector brain store`

## Slice 01 — Package boundaries

Create or adjust package plan:

packages/core
packages/schema
packages/db
packages/harness
packages/codex-adapter
packages/cli

Rules:

- core is pure.
- schema owns Zod boundary schemas.
- db owns Drizzle schema/migrations/repositories.
- harness owns activation/compiler.
- codex-adapter owns Codex-specific surfaces.
- cli owns terminal commands.

Verification:

- package boundaries documented.
- no IO in core.
- `pnpm typecheck`.

Commit:

`docs(architecture): define KRN package boundaries`

## Slice 02 — Drizzle/Postgres schema foundation

Add DB schema for:

- workspaces
- projects
- repo_installations
- project_kernels
- operator_intents
- task_contracts
- harness_plans
- context_assemblies
- execution_runs
- evidence_bundles
- review_assessments
- feedback_deltas
- run_events
- outbox_events

Do not implement all business logic yet.

Use Drizzle schema + migration.

Verification:

- migration generated.
- schema compiles.
- no external DB required unless test infra already exists.
- `pnpm typecheck`.

Commit:

`feat(db): add canonical harness schema`

## Slice 03 — Memory and source schema

Add DB schema for:

- source_artifacts
- source_chunks
- source_claims
- source_decision_edges
- source_rejections
- memory_records
- memory_record_versions
- memory_edges
- memory_candidates
- memory_applications
- memory_feedback_events
- anti_memory_records

Rules:

- memory records require source lineage, confidence, owner, validity/invalidation, application guidance.
- source claims require mechanism, doesNotProve, trust tier, support type, consumer.
- anti-memory is first-class.

Verification:

- migration generated.
- typecheck.
- schema review notes.

Commit:

`feat(db): add memory and source graph schema`

## Slice 04 — Retrieval schema

Add schema for:

- embedding_models
- embeddings
- search_documents
- retrieval_runs
- retrieval_candidates
- activation_decisions
- context_items
- context_exclusions

Include:

- vector column plan for pgvector.
- full-text column plan for Postgres FTS.
- metadata filters.
- trust/TTL/invalidation fields.

Verification:

- schema compiles.
- no separate vector DB.
- no markdown memory.

Commit:

`feat/db): add retrieval and activation schema`

## Slice 05 — Zod IO schemas

Add Zod schemas for:

- OperatorIntentInput
- TaskContractInput
- MemoryCandidateInput
- SourceClaimInput
- HarnessCompileInput
- EvidenceCaptureInput

Rules:

- all untrusted input is unknown until parsed.
- parsed data becomes domain input.
- no `any`.

Verification:

- typecheck.
- tests for invalid inputs if test runner exists.

Commit:

`feat(schema): add harness IO validation schemas`

## Slice 06 — Core domain model

Add pure core types:

- OperatorIntent
- TaskContract
- HarnessPlan
- ContextAssembly
- ContextInclusion
- ContextExclusion
- CapabilityRequirement
- CapabilityPlan
- CodexAdapterPlanRef
- ExecutionRun
- EvidenceBundle
- ReviewAssessment
- FeedbackDelta
- MemoryRecord
- MemoryCandidate
- AntiMemoryRecord
- SourceClaim
- SourceDecisionEdge
- PolicyGate
- ToolBoundary
- EvalCandidate

Rules:

- no requiredSkills in core.
- no Codex skill names in TaskContract.
- no DB imports in core.
- no CLI imports in core.

Verification:

- `pnpm typecheck`.
- public exports reviewed.
- grep for `requiredSkills` in core should fail/no result.

Commit:

`feat(core): add final harness domain model`

## Slice 07 — Repository interfaces + Postgres adapters

Add real interfaces and first adapters:

- ProjectRepository
- MemoryRepository
- SourceRepository
- HarnessRunRepository
- EventLedgerRepository
- OutboxRepository

Implement Postgres adapters thinly using Drizzle.

Rules:

- no fake in-memory-only architecture as final path.
- tests may use PGlite/test Postgres if available.
- repositories return typed results, not raw DB rows.

Verification:

- typecheck.
- repository methods compile.
- no DB writes from core.

Commit:

`feat(db): add Postgres repository adapters`

## Slice 08 — Activation engine

Implement:

- buildMemoryQuery(task)
- buildSourceQuery(task)
- rankCandidates()
- applyTrustFilter()
- applyTemporalFilter()
- applyContextROI()
- assembleContext()

Rules:

- may be simple but must use final concepts.
- explicit inclusions and exclusions.
- memory can abstain.
- source can abstain.
- every included item needs reason and expected use.

Verification:

- fixture: noisy brain selects small working set.
- no context dump.
- typecheck/tests.

Commit:

`feat(harness): add activation engine`

## Slice 09 — Harness compiler

Implement:

OperatorIntent
  -> TaskContract
  -> HarnessPlan
  -> ContextAssembly
  -> CapabilityPlan
  -> CodexAdapterPlan
  -> EvidenceContract

Rules:

- uses repositories/activation engine.
- does not invoke Codex.
- does not mutate memory automatically.
- persists activation trace and harness plan.

Verification:

- golden fixture flows through compiler.
- typecheck/tests.

Commit:

`feat(harness): add Postgres-backed harness compiler`

## Slice 10 — Codex adapter plan

Implement renderer for:

- execution brief
- AGENTS.md pointers
- skill binding hints
- hook expectations
- MCP resource references
- goal/ExecPlan references

Rules:

- Codex specifics live in codex-adapter package.
- core stays Codex-agnostic.
- no MCP server implementation yet.
- no subagent zoo.

Verification:

- sample CodexAdapterPlan output.
- typecheck/tests.

Commit:

`feat(codex): add adapter plan renderer`

## Slice 11 — CLI vertical path

Implement:

`krn plan --task "..."`

It must:

- parse input via schema.
- call harness compiler.
- persist run state to Postgres/PGlite/test store if configured.
- output execution brief.
- output context inclusions/exclusions.
- output evidence contract.
- output next action.

It must not:

- write markdown memory.
- create `.krn` runtime truth.
- call Codex.
- spawn agents.

Verification:

- command runs.
- typecheck.
- generated output has final harness shape.

Commit:

`feat(cli): add Postgres-backed harness plan command`

## Slice 12 — Doctor

Implement:

`krn doctor`

Checks:

- Postgres connection/config status.
- pgvector availability if DB configured.
- migrations status.
- AGENTS.md compactness.
- no runtime markdown memory.
- no `.krn` memory truth.
- TypeScript strictness.
- skills surface status.
- hooks surface status.
- forbidden surfaces absent.

Verification:

- command runs read-only.
- no writes.
- typecheck/tests.

Commit:

`feat(cli): add KRN brain store doctor`

## Slice 13 — Evidence capture

Implement:

`krn evidence capture`

It records:

- changed files
- commands run
- typecheck/test results if available
- diff risk
- review burden
- rollback path
- feedback candidates
- run event

It must not auto-apply memory.

Verification:

- clean-tree run works.
- typecheck/tests.
- no memory mutation except explicit candidate write.

Commit:

`feat(cli): add evidence capture with feedback candidates`

## Slice 14 — Worker skeleton

Implement only worker skeleton and job types:

- embed_source_chunk
- compact_memory
- detect_contradiction
- expire_stale_memory
- promote_eval_candidate

No heavy background processing yet.

Use Postgres job table/outbox.

Verification:

- job types compile.
- no infinite workers.
- no Redis/Kafka.

Commit:

`feat(workers): add KRN maintenance job skeleton`

## Slice 15 — Dogfood

Use KRN on KRN:

`krn plan --task "improve KRN doctor brain store readiness"`

Then:

- inspect ContextAssembly
- inspect exclusions
- inspect EvidenceContract
- run doctor
- run evidence capture
- create FeedbackDelta

Verification:

- dogfood record exists.
- review burden assessed.
- next safest action clear.

Commit:

`docs(run): record first Postgres-backed harness dogfood`

## Slice 16 — Final handoff

Update:

- PROGRESS.md
- HANDOFF.md
- DECISIONS.md
- BLOCKERS.md
- VERIFICATION.md

Verify:

- `pnpm typecheck`
- `pnpm test` if available
- no forbidden stores
- no dashboard
- no broad eval
- no memory markdown
- no requiredSkills in core
- no separate vector/graph DB

Commit:

`docs(run): add final KRN infra handoff`
```

---

# 14. Najważniejsze uproszczenia

## Niepotrzebne wzorce wykluczone

```txt
Separate vector DB:
  no, pgvector first.

Separate graph DB:
  no, edge tables first.

Separate queue:
  no, Postgres outbox/job table first.

Separate dashboard-first app:
  no, read models first.

Memory markdown:
  no.

RequiredSkills:
  no.

ContextPacket as center:
  no.

Broad research swarm:
  no default.

Broad eval suite:
  no.

Skill zoo:
  no.
```

## Realne wzorce zostają

```txt
Ports and adapters
Event ledger
Transactional outbox
Hybrid retrieval
Graph edges
Memory governance
Anti-memory
Activation policy
Capability compiler
Evidence-gated execution
Review-burden loop
Progressive disclosure
Small AGENTS.md
Codex hooks as policy/trace adapters
MCP as typed external-context adapter
```

---

# 15. Krótki finalny prompt do startu

Wklej Codexowi to jako pierwszą wiadomość, jeśli chcesz zacząć realizację:

```md
We are changing direction.

Do not implement contracts disconnected from infrastructure.

KRN target architecture is now decided:

- PostgreSQL + pgvector is the canonical KRN brain store.
- Drizzle owns DB schema and migrations.
- Zod owns IO/API/CLI validation boundaries.
- Postgres full-text search + pgvector + relational edge tables are the retrieval layer.
- Postgres append-only run_events + outbox_events + worker_jobs are the audit/async layer.
- Memory Core is Postgres-backed, not markdown and not `.krn`.
- Source Graph is Postgres-backed.
- Graph DB, separate vector DB, Redis/Kafka, dashboard UI, MCP server, plugin packaging, and broad subagent system are rejected for this first product implementation.
- CLI is an adapter.
- Codex surfaces are adapters.
- The core product is the harness.

Implement the final-pattern KRN spine through real target infra:

OperatorIntent
  -> TaskContract
  -> HarnessPlan
  -> ContextAssembly
  -> CapabilityPlan
  -> CodexAdapterPlan
  -> ExecutionRun
  -> EvidenceBundle
  -> ReviewAssessment
  -> FeedbackDelta
  -> Memory / Source / Skill / Policy / Eval updates

Start with ADR + DB schema + memory/source/harness tables.
Then implement repositories, activation engine, harness compiler, and one CLI vertical path.

Do not create temporary architecture.
Thin implementation is allowed.
Fake architecture is not.
```

---

# 16. Odpowiedź na Twoje pytanie “czemu nie od razu?”

Powinniśmy byli.

Właściwa decyzja brzmi:

```txt
Memory infra, baza, schema, graph, retrieval, event ledger, API direction
muszą być ustalone przed kodowaniem harnessu.
```

Kontrakty bez tego byłyby zbyt miękkie.

Teraz końcowy kierunek jest taki:

```txt
Postgres-backed Harness OS.
Nie contract-only.
Nie CLI-first.
Nie memory-later.
Nie dashboard-later-as-magic.
Nie vector-db zoo.

Od pierwszego commita:
schema, store, graph, memory governance, activation, evidence, feedback.
```

I to jest plan, od którego realnie zaczynamy narzędzie.

[1]: https://github.com/pgvector/pgvector?utm_source=chatgpt.com "pgvector/pgvector: Open-source vector similarity search for ..."
[2]: https://github.com/electric-sql/pglite?utm_source=chatgpt.com "electric-sql/pglite: Embeddable Postgres with real-time, ..."
[3]: https://qdrant.tech/documentation/manage-data/indexing/?utm_source=chatgpt.com "Indexing"
[4]: https://martinfowler.com/eaaDev/EventSourcing.html?utm_source=chatgpt.com "Event Sourcing"
[5]: https://arxiv.org/abs/2307.03172?utm_source=chatgpt.com "Lost in the Middle: How Language Models Use Long Contexts"
[6]: https://developers.openai.com/codex/skills?utm_source=chatgpt.com "Agent Skills – Codex"
[7]: https://github.com/mattpocock/skills?utm_source=chatgpt.com "mattpocock/skills: Skills for Real Engineers. Straight from ..."
[8]: https://github.com/ciembor/agent-rules-books?utm_source=chatgpt.com "ciembor/agent-rules-books: AGENTS.md rules / skills for AI ..."
[9]: https://developers.openai.com/codex/concepts/customization?utm_source=chatgpt.com "Customization – Codex"
[10]: https://developers.openai.com/codex/hooks?utm_source=chatgpt.com "Hooks – Codex"
[11]: https://developers.openai.com/codex/mcp?utm_source=chatgpt.com "Model Context Protocol – Codex"
[12]: https://developers.openai.com/codex/concepts/subagents?utm_source=chatgpt.com "Subagents – Codex"
[13]: https://orm.drizzle.team/docs/migrations?utm_source=chatgpt.com "Migrations - Drizzle ORM"

---
