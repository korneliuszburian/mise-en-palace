# Raw Onboarding Source Quarantine

Status: source/audit quarantine.

This file preserves the supplied onboarding material for the KRN kernel
bootstrap. It is intentionally not linked from `AGENTS.md` as required reading.
Derived docs are the active working context.

Exact duplicate goal blocks from the supplied material are consolidated here;
all unique constraints, patterns, source groups, failure lessons, and phase
requirements are retained.

## Material 1: Bootstrap Sequence And Commit Order

Zaczynamy od pustego repo, ale nie od `src/index.ts`. Zaczynamy od zbudowania
minimalnego środowiska, które ograniczy Codexa zanim zacznie tworzyć slop.

Najkrócej:

```text
Commit 0: kernel language + hard boundaries
Commit 1: Codex-native surfaces
Commit 2: TypeScript spine
Commit 3: typed KRN primitives
Commit 4: first dry-run `krn init`
Commit 5: dogfood loop
```

Pierwsze repo nie ma być aplikacją. Ma być czystym kernel workspace, który od
pierwszego commita mówi Codexowi:

```text
Nie zgaduj architektury.
Nie buduj dashboardu.
Nie twórz memory w markdownach.
Nie rób eval theater.
Nie kopiuj starego repo.
Najpierw zakoduj język, granice i typy.
```

Stare repo zawaliło się przez artifact churn, goal sprawl,
file-backed pseudo-memory i dashboard/benchmark surfaces przed realnym
workflowem.

Pierwszy commit ma być prawie bez kodu.

Minimalna topologia:

```text
README.md
AGENTS.md
docs/
  KRN_KERNEL.md
  KRN_ONBOARDING.md
  KRN_FAILURE_REPORT.md
  KRN_SOURCES.md
  glossary.md
  patterns/KRN_PATTERN_SELECTION.md
  decisions/ADR-0001-codex-operating-layer.md
  decisions/ADR-0002-memory-is-store-not-files.md
  decisions/ADR-0003-skills-are-engineering-disciplines.md
  decisions/ADR-0004-thin-final-spine-not-artifact-factory.md
```

Ten commit ma udowodnić tylko jedno: repo wie, czym nie jest.

`AGENTS.md` ma być cienkie. Codex oficjalnie czyta `AGENTS.md` przed pracą,
więc encyklopedia w tym pliku tworzy context rot. Głębia powinna siedzieć w
osobnych, wybieranych powierzchniach.

Minimalny `AGENTS.md`:

```md
# KRN Agent Instructions

KRN is a Codex Operating Layer / AI Engineering Control Plane.

Codex executes. KRN supplies bounded context, service/store-backed memory,
source grounding, policy, skills, eval expectations, traces, review gates,
and feedback.

Before editing:
1. Read `docs/KRN_KERNEL.md`.
2. Read only the docs needed for the current task.
3. Do not copy old repo topology.
4. Do not build dashboard, benchmark lane, broad multi-agent system, or file-backed runtime memory.
5. If a decision depends on a source, map it through source -> mechanism -> KRN implication -> decision/rejection.

For TypeScript changes:
- preserve strict type boundaries;
- keep external data as `unknown` until validated;
- avoid `any` unless isolated and justified;
- run typecheck before claiming completion.

If the next step requires broad historical rereads, stop and re-scope.
```

Commit 1 creates only skeleton Codex surfaces:

```text
.agents/skills/
  select-kernel-patterns/SKILL.md
  source-to-decision/SKILL.md
  handoff-compact/SKILL.md
  typescript-type-safety/SKILL.md
.codex/agents/
  ts-type-critic.toml
```

Do not create `frontend-agent`, `backend-agent`, `memory-agent`, or
`eval-agent`. Codex custom subagents live in `.codex/agents/` or
`~/.codex/agents/`, but the first one should be read-only/proposal-only.

Before code, create `docs/patterns/KRN_PATTERN_SELECTION.md` with this gate:

```yaml
pattern_id:
name:
source_mechanisms:
solves_paradox:
adoption_status: adopt_now | lab | later | reject
krn_primitive:
implementation_boundary:
failure_mode:
falsifier:
dogfood_task:
owner:
removal_condition:
```

First `adopt_now` patterns:

```text
1. Small Kernel Contract
2. Context Supply Chain
3. Memory Is Store-Backed, Files Are Export
4. Source-To-Decision Graph
5. Skills As Engineering Disciplines
6. Read / Propose / Write Boundary
7. Review Burden + Diff Risk As Product Metrics
8. TypeScript Boundary Discipline
```

`lab/later`:

```text
- 20 subagent research swarm
- dashboard
- broad benchmark lane
- cloud sync
- API multi-client surface
- automatic skill evolution
```

Only after that: TypeScript spine, strict boundary discipline, typed
primitives, `krn init --dry-run`, `krn context build`, `krn review capture`,
and first dogfood task: use KRN to add `krn doctor`.

Hard no for first days:

```text
- dashboard
- cloud API
- multi-client registry
- broad research swarm
- eval suite
- benchmark lane
- old repo import
- memory in markdown as runtime
- 10 subagents
- stack-specific agent zoo
```

## Material 2: KRN State Of The Art

KRN is a Codex Operating Layer / AI Engineering Control Plane.

Codex executes. KRN supplies:

- bounded context;
- service/store-backed memory;
- source grounding;
- policy;
- skills;
- eval expectations;
- traces;
- review gates;
- feedback loops.

Docelowy produkt:

```text
krn init turns any repo into an agent-ready, source-grounded,
memory-aware, eval-driven, reviewable Codex CLI working environment.
```

KRN nie jest:

- prompt packiem;
- dashboard-first appką;
- benchmark labem;
- alternatywą dla Codexa;
- IDE agentem;
- generic multi-agent frameworkiem;
- zbiorem przypadkowych skillów;
- próbą stworzenia 35 wyspecjalizowanych agentów;
- repozytorium dokumentów, które agent ma ciągle rereadować.

Najkrótsza definicja:

```text
Codex is the executor.
KRN is the operating brain around the executor.
```

KRN ma sprawić, że zwykły użytkownik Codexa może wejść do dowolnego repo i
dostać środowisko pracy, które wie czym jest projekt, wie czego nie powinno
czytać, potrafi dobrać mały task-specific context packet, dobrać memory entries
z lineage/TTL/confidence/application guidance, wskazać sources wspierające
decyzje, wymusić pre-edit gate, zebrać run trace/diff/tests/review feedback,
przetwarzać realne błędy na memory/source/eval candidates, zmniejszać review
burden i diff risk, oraz nie udawać że green evals lub dashboard views są
dowodem jakości.

KRN jest realny dopiero wtedy, gdy codzienna praca z Codexem staje się bardziej
ciągła po kompaktowaniu, mniej chaotyczna, lepiej ugruntowana w źródłach,
mniej kosztowna review-wise, mniej podatna na context rot, mniej podatna na
memory poisoning, i bardziej powtarzalna bez zamiany workflowu w rytuał.

Poprzednie repo `krn-gas-town` należy zamrozić jako archive / research quarry.
Nie kontynuujemy jego goal chain. Nie kopiujemy jego topologii. Nie traktujemy
jego `.krn/**` jako runtime truth. Nie traktujemy jego `docs/memory/**` jako
Memory Core. Nie kontynuujemy dashboard / benchmark / eval expansion.

Stare repo jest wartościowe tylko jako product thesis quarry, source quarry,
anti-pattern quarry, failure report, selected mechanism bank, and negative
evidence.

Wartościowe były: KRN jako Codex Operating Layer, idea cienkiego `AGENTS.md`,
source-to-decision mapping, MemoryStore selection/application boundary, bounded
context packet, source graph check, pre-edit engineering gate, eval lane split,
reviewed bootstrap/proposal semantics, schema-backed contracts, known-bad
fixtures, and recognition that dashboard and benchmark can fake progress.

Największe błędy:

- artifact factory zamiast operating layer;
- file-backed pseudo-memory;
- eval theater;
- goal as product brain;
- research as source hoarding.

Repo produkowało goal files, eval reports, source ledgers, memory notes,
benchmark lanes, dashboard view-models and status reports, but did not prove one
daily workflow:

```text
task -> context packet -> Codex run -> diff/tests/review -> memory/source/eval feedback
```

Runtime memory must be store/service-backed: queryable, temporal,
source-linked, confidence-aware, TTL-aware, invalidatable, feedback-aware, and
retrievable as small packets. Files can be export, audit trail, seed, source
bank, or human-readable backup. Files are not Memory Core.

Evals help only when they protect real contracts, known failures, golden tasks,
security boundaries, memory behavior, source behavior, context behavior, review
burden, or diff risk. Eval theater is adding evals per idea, treating schema
validity as product quality, dashboard snapshots as progress, or green reports
without review burden delta.

Goal should contain current objective, constraints, success evidence, stop
condition, and next action. Goal must not become product thesis, implementation
cursor, source ledger, anti-slop rulebook, progress ledger, verification
evidence, architecture backlog, and runtime instruction set all at once.

Research pipeline:

```text
source candidate
  -> mechanism
  -> KRN implication
  -> decision / rejection / hypothesis
  -> consumer
  -> falsifier
```

Source without mechanism is decoration. Mechanism without decision is a note.
Decision without falsifier is religion.

KRN should be one operational brain, not agent zoo. Brain functions are problem
framing, context selection, source grounding, memory application, execution
contract, policy control, review intelligence, feedback distillation, pattern
selection, and handoff compression. Subagents, skills, MCP, hooks, evals, and
dashboard are organs. They are not separate brains.

Codex paradox taxonomy:

- Stateless Agent, Stateful Project.
- More Context, Worse Reasoning.
- Memory Helps, Stale Memory Poisons.
- Sources Improve Trust And Create Bloat.
- Skills Standardize Excellence Or Mistakes.
- Subagents Parallelize Cognition And Chaos.
- Goals Enable Autonomy And Drift.
- Hooks Enforce Policy And Can Hide Semantics.
- Dashboard Clarifies Or Becomes Vanity UI.
- Research Discovers Patterns And Delays Product.
- Fast Code Increases Review Burden.

Chosen patterns:

- Small Kernel Contract.
- Context Supply Chain.
- Memory Is Store-Backed, Files Are Export.
- Source-To-Decision Graph.
- Skills As Engineering Disciplines.
- Read / Propose / Write Boundary.
- Review Burden + Diff Risk As Product Metrics.
- TypeScript Boundary Discipline.

Patterns not adopted as default:

- Broad Multi-Agent System: later/lab.
- Dashboard First: reject now/later.
- Broad Benchmark Lane: reject now/later.
- Runtime Memory In Markdown: reject.
- Full Autoresearch As Daily Workflow: lab only.

Skill architecture has internal engineering skills and later product-emitted
skills. Internal engineering skills include `select-kernel-patterns`,
`source-to-decision`, `grill-with-sources`, `to-kernel-prd`, `to-issues`,
`handoff-compact`, and `typescript-type-safety`. Product-emitted skills later
include `krn-context-build`, `krn-source-ground`, `krn-memory-apply`,
`krn-pre-edit-gate`, `krn-review-capture`, and `krn-handoff`.

Initial subagent: `ts-type-critic`, read-only/proposal-only. It reviews
TypeScript files, tsconfig, public exported types, external data boundaries,
casts/any/unknown/generics, validation/schema code, and type weakening. It does
not implement primary changes.

Context supply chain:

```text
task
  -> repo detection
  -> source selection
  -> memory selection
  -> policy selection
  -> skill selection
  -> compression
  -> context packet
  -> Codex run
  -> trace/review feedback
  -> memory/source/eval candidates
```

`ContextPacket` fields include id, projectId, task, objective, nonGoals,
selectedSources, selectedMemory, requiredSkills, policyGates, expectedEvidence,
riskNotes, nextAction, and budget.

Resume packet must fit in first screen of chat and include current objective,
last verified state, changed files, decisions made, next action, blockers,
context selectors to rerun, and warnings.

Memory lifecycle:

```text
raw source / trace / review / user feedback
  -> candidate extraction
  -> classification
  -> source lineage
  -> confidence
  -> TTL / valid time
  -> invalidation rule
  -> owner
  -> storage
  -> retrieval
  -> application in context packet
  -> feedback
  -> strengthen / decay / invalidate / delete
```

MemoryEntry includes id, projectId, type, content, sourceLineage, owner,
confidence, validFrom, validUntil, ttl, invalidationRule, lastUsedAt,
applicationGuidance, and feedback with applied/corrected/rejected counts and
lastOutcome.

SourceRef includes id, title, url, type, trustTier, mechanism, krnImplication,
doesNotProve, and use. SourceDecisionEdge links sourceId and decisionId with
supportType, confidence, and notes.

Tool boundary classes: read, propose, write, destructive. Research subagents
default read-only. Reviewers default read-only/proposal-only. Main Codex writes
only when task requires it. Destructive operations need explicit approval.

MCP is a typed boundary for resources, tools, prompts, external systems, and
internal KRN state. MCP is not magic memory. It requires least privilege, auth
boundary, allowlists, audit, approval policy, and idempotency for write tools.

Hooks are deterministic gates. Allowed: detect secrets, block destructive
patterns, log run events, enforce typecheck/test requirements, validate context
packet shape, capture tool-use evidence. Forbidden: hidden semantic decisions,
hidden architecture selection, silent memory mutation, replacing
human-visible review.

TypeScript doctrine: strict mode, strict type boundaries, external data as
`unknown` until validated, avoid `any`, avoid double assertions, explicit public
APIs, typecheck before completion, runtime validation near external boundaries.

External data boundaries: `JSON.parse`, `fetch().json()`, file reads, env vars,
CLI args, MCP responses, API connector responses, plugin output, user-provided
config. Pipeline: unknown input -> schema/validator/parser -> domain type ->
business logic.

`ts-reset` policy: may be used in application packages, should not be used in
published library packages, should not be globally installed without explicit
decision, never use it to hide missing validation, document where global typings
are altered. For KRN, `packages/cli` may be a candidate; `packages/core` and
`packages/sdk` should avoid it.

Final architecture path:

```text
kernel contract
  -> pattern selection
  -> engineering skills
  -> typed primitives
  -> dry-run init
  -> context packet
  -> Codex run
  -> review capture
  -> Memory/Source/Eval candidates
  -> dogfood
  -> promotion
```

Hard stops:

- broad historical rereads;
- copying old repo structure;
- dashboard before typed objects;
- benchmark lane before dogfood traces;
- memory in markdown as runtime;
- many subagents before output contracts;
- code before pattern selection;
- evals without known failure/contract;
- broad research without hypothesis and budget;
- TypeScript weakening to move faster.

Canonical source groups: Codex native surfaces, OpenAI Cookbook/Agents patterns,
memory research, agent/skill/reflection research, practitioner engineering
sources, context engineering/repo map, security/tool boundary, competitor and
comparator sources.

Vocabulary rules:

- Brain decomposes into context selection, memory retrieval/application, source
  grounding, policy control, review feedback, and pattern selection.
- Memory is not markdown notes, source list, or compaction summary; memory is
  store-backed, typed, temporal, source-linked, confidence-aware, invalidatable,
  and feedback-aware.
- Context is not everything relevant; context is a task-specific working set
  selected under budget with non-goals and application guidance.
- Skill is not a prompt snippet, project ritual, or stack agent; skill is a
  reusable engineering discipline with trigger, lifecycle, verification, and
  removal condition.
- Eval is not proof of product quality; eval is a regression guard for real
  contract/failure/golden task/security boundary.
- Source is not an impressive link; source is a mechanism carrier with
  decision/risk/rejection support and `doesNotProve`.
- Dashboard is not product proof; dashboard is an action surface over typed
  objects.
- Subagent is not another brain; subagent is a bounded role with separate
  context and output contract, usually read-only/proposal-only.

## Material 3: Plan-Mode Corrections Before Implementation

Before implementation, amend the plan with these constraints:

1. `GOAL.md` is the canonical execution contract for this bootstrap only. It
   must stay compact and phase-oriented. It is not product brain, source map,
   memory layer, or full architecture.
2. Preserve raw onboarding materials under `docs/materials/` as source/audit
   only. Do not make raw materials required reading from `AGENTS.md`. Derived
   thin docs are the active working context.
3. Use `quick_validate.py` only if it exists in the active skill tooling. If
   absent, do not invent it silently; either use available Codex validation or
   create a tiny local validator after documenting its contract.
4. Do not mix Codex permission profiles with legacy `sandbox_mode` settings in
   the same active config path. Choose one permission model for bootstrap and
   document it.
5. Treat Codex Rules as experimental command-policy controls only. Do not
   encode semantic architecture in rules.
6. Keep `GOAL.md`, `AGENTS.md`, and skills small enough to avoid recreating
   context rot.

First implementation limit:

```text
Docs/surfaces only:
- raw material preserved
- derived docs
- ADRs
- skills
- one subagent
- no packages yet
- no TS workspace yet
```

## Material 4: Built-In Skill Pipeline

Skill creation should use the built-in `$skill-creator` discipline:

- skills are modular folders with required `SKILL.md`;
- `SKILL.md` frontmatter must include `name` and `description`;
- `description` is the primary triggering mechanism and must include when to
  use the skill;
- keep skills concise because the context window is shared;
- set the right degrees of freedom: instructions for flexible work, scripts for
  deterministic repeated work;
- use progressive disclosure: metadata first, `SKILL.md` after trigger, bundled
  resources as needed;
- keep `SKILL.md` under 500 lines when possible;
- move detailed references into `references/`;
- do not add extraneous skill files such as `README.md`, installation guides,
  quick references, or changelogs;
- when creating a skill from scratch, run `init_skill.py` if active tooling is
  available;
- validate with `quick_validate.py` if active tooling is available;
- forward-test complex skills with fresh subagents only when justified and
  without leaking expected answers.

`$skill-installer` is different. It installs curated or GitHub-hosted skills
into `$CODEX_HOME/skills`; it is not the authoring path for repo-local KRN
skills.

