Cel:

```txt
krn plan --task "..."
  -> tworzy/persistuje OperatorIntent
  -> TaskContract
  -> HarnessPlan
  -> ContextAssembly
  -> CapabilityPlan / CodexAdapterPlan projection
  -> EvidenceContract

krn evidence capture --run-id ...
  -> dopina EvidenceBundle
  -> ReviewAssessment
  -> FeedbackDelta candidates
```

To ma udowodnić pierwszy realny kręgosłup:

```txt
intent -> plan -> context -> evidence -> review -> feedback
```

Nie pełna pamięć.
Nie pełny source graph.
Nie worker runtime.
Nie dashboard.
Tylko **pierwszy zamknięty, Postgres-backed harness loop**.

To jest zgodne z docelową architekturą: KRN ma być Postgres-backed AI Engineering Harness OS, gdzie canonical flow idzie przez `OperatorIntent -> TaskContract -> HarnessPlan -> ContextAssembly -> CapabilityPlan -> CodexAdapterPlan -> ExecutionRun -> EvidenceBundle -> ReviewAssessment -> FeedbackDelta`, a memory/source/skill/policy/eval updates są dalszym efektem tego loopa.

---

# Dlaczego M21, a nie MemoryStore/SourceStore od razu

Bo M20 udowodnił bazę, ale jeszcze nie udowodnił, że **praca Codexa jako harness run** ma trwały zapis. Pełne memory/source/eval persistence bez run spine byłoby znowu budowaniem organów bez układu nerwowego.

Najpierw:

```txt
persisted harness run
```

Potem:

```txt
memory/source persistence
```

Potem:

```txt
activation retrieval
```

Potem:

```txt
worker maintenance
```

Wasza doktryna mówi, że KRN ma być jednym operacyjnym mózgiem, gdzie context selection, memory application, source grounding, policy control, review intelligence i feedback distillation są funkcjami tego samego control plane, a nie osobnym agent zoo albo artefaktami.

---

# M21 — prompt do Codexa

Wklej:

````md
# Goal: M21 — Persist first KRN harness run spine

Repository root:

`/home/krn/coding/krn/active/mise-en-palace`

## Context

M20 is complete and pushed to `origin/main`.

Verified:

- local `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn`;
- `pnpm db:ready` passed;
- pgvector available;
- migrations proven, 3/3;
- `pnpm db:smoke` passed insert/read/cleanup through `DrizzleProjectRepository`;
- `krn doctor` reports DB readiness accurately;
- no M20 residual blockers.

Current residual later scope:

- full evidence persistence;
- memory persistence;
- source persistence;
- eval persistence;
- worker execution.

## Mission

Implement the first Postgres-backed persisted harness run spine.

Do not build full MemoryStore, SourceStore, EvalStore, dashboard, API, MCP server, broad workers, research layer, plugin package, or runtime markdown memory.

This goal proves that a real KRN planning/evidence loop can be persisted and read back through the target Postgres/Drizzle infrastructure.

## Target user-visible behavior

With DB configured:

```bash
krn plan --task "improve KRN doctor brain store readiness" --persist
```

should create and print a persisted harness run identity, including:

* operator intent;
* task contract;
* harness plan;
* context assembly;
* evidence contract;
* next action;
* persisted IDs.

Then:

```bash
krn evidence capture --run-id <id> --persist
```

should attach or create:

* evidence bundle;
* review assessment;
* feedback delta candidates.

With DB not configured:

* existing preview/no-store behavior must still work;
* no command should crash unclearly;
* doctor must continue distinguishing no-config vs ready.

## Canonical flow for this goal

Implement only this spine:

OperatorIntent
-> TaskContract
-> HarnessPlan
-> ContextAssembly
-> EvidenceContract
-> ExecutionRun / HarnessRun record
-> EvidenceBundle
-> ReviewAssessment
-> FeedbackDelta

Allowed candidate-only outputs:

* MemoryCandidate
* SourceDecisionCandidate
* EvalCandidate
* PolicyRefinementCandidate

Do not auto-apply memory.
Do not create full stores for memory/source/eval.
Do not start workers.

## Hard boundaries

Do not create:

* dashboard;
* apps/;
* public API;
* KRN MCP server;
* broad worker runtime;
* research layer;
* plugin package;
* runtime markdown memory;
* `.krn` runtime truth;
* separate Qdrant/LanceDB/Neo4j/Elastic store;
* Redis/Kafka queue;
* broad eval suite;
* full MemoryStore implementation;
* full SourceStore implementation;
* automatic memory mutation.

## Required reading

Read only:

1. `AGENTS.md`
2. `GOAL.md`
3. `PLAN.md`
4. `docs/handoff/handoff.md`
5. `docs/handoff/blockers.md`
6. `docs/handoff/verification.md`
7. latest M20 run docs
8. package manifests
9. db schema/migrations/repositories touched by M20
10. CLI command files for `plan`, `doctor`, `evidence capture`
11. harness/core types directly touched by this goal

Do not reread raw onboarding materials.
Do not read all historical docs.

## Required repo-local skills

Use repo-local skills as execution gates, not decorative references.

Before starting a slice that matches a trigger below, read the matching
`.agents/skills/*/SKILL.md`, follow its workflow, and record the used skill in
the run ledger.

Required for this goal:

1. `brain-store-schema` — required before schema, migration, repository,
   mapper, SQL helper, evidence persistence, feedback persistence, or run
   ledger persistence work.
2. `codex-adapter-plan` — required before changing Codex-facing briefs, skill
   hints, capability bindings, execution instructions, or rendered `krn plan`
   output.
3. `typescript-type-safety` — required before any TypeScript source, public
   type, validator, JSON/env/CLI boundary, generic, cast, or test fixture
   change.
4. `evidence-review-loop` — required before evidence capture, review
   assessment, feedback delta implementation, final proof capture, or feedback
   candidate writing.
5. `source-to-decision` — required before using source material, local repo
   evidence, docs, or user-provided material to justify an architecture,
   policy, skill, memory, context, eval, MCP, hook, package-boundary, or
   TypeScript decision.
6. `handoff-compact` — required before Slice 11 final handoff and before any
   pause, compaction, transfer, or resumed-run handoff.

Conditional only:

1. `target-infra-adr` — use only if this goal would add or change storage,
   queues, workers, package topology, runtime authority, or another durable
   surface. If unused, record that M21 stayed inside the existing
   Postgres/Drizzle boundary.
2. `activation-engine` — use only if this goal changes context selection,
   retrieval ranking, memory/source activation, trust filters, temporal
   filters, or context budget behavior. If unused, record that M21 did not
   change activation behavior.

## Slice 00 — Preflight and run ledger

Run:

* `git status --short --branch`
* `git log --oneline -10`
* `pnpm typecheck`
* `pnpm test`
* `krn doctor`

Create compact run ledger:

`docs/runs/2026-06-21-persisted-harness-spine/`

Files:

* `PROGRESS.md`
* `HANDOFF.md`
* `DECISIONS.md`
* `BLOCKERS.md`
* `VERIFICATION.md`

Record:

* M20 final state;
* DB proof status;
* this goal’s hard boundaries;
* required skills used or intentionally not used;
* exact next action.

Commit:

`docs(run): add persisted harness spine ledger`

## Slice 01 — Inventory current harness persistence surface

Inspect existing schema and repositories.

Identify whether tables already exist for:

* operator intents;
* task contracts;
* harness plans;
* context assemblies;
* execution runs / harness runs;
* evidence bundles;
* review assessments;
* feedback deltas;
* run events.

Record in `DECISIONS.md`:

* which tables exist;
* which tables need migration;
* whether current schema names should be reused or minimally extended;
* what is intentionally not implemented.

Verification:

* `pnpm typecheck`

Commit if docs changed:

`docs(run): record harness persistence inventory`

## Slice 02 — Add minimal persisted harness schema if missing

Add only missing DB schema/migration needed for M21.

Required persisted entities:

* operator intent;
* task contract;
* harness plan;
* context assembly;
* evidence contract or evidence expectation field;
* execution/harness run;
* evidence bundle;
* review assessment;
* feedback delta.

Keep schema minimal but final-pattern named.

Rules:

* use Drizzle schema;
* generate migration;
* no broad memory/source/eval tables unless already present;
* feedback delta may store candidates as typed JSONB if that is the smallest honest final-compatible shape;
* do not add separate vector/graph DB.

Verification:

* migration compiles;
* `pnpm typecheck`;
* `pnpm db:ready` with live DB if available.

Commit:

`feat(db): add persisted harness run schema`

## Slice 03 — Add repository methods for harness run spine

Add repository layer methods, preferably in existing db package style.

Required operations:

* create operator intent;
* create task contract;
* create harness plan;
* create context assembly;
* create harness/execution run;
* read harness run by ID;
* append evidence bundle;
* append review assessment;
* append feedback delta.

Rules:

* repositories return typed domain/read models, not raw DB rows;
* no core package imports from db;
* no CLI direct SQL if repository pattern exists;
* no automatic memory mutation.

Verification:

* `pnpm typecheck`;
* repository smoke/unit tests if existing test style supports it.

Commit:

`feat(db): add harness run repository methods`

## Slice 04 — Persist `krn plan --persist`

Update `krn plan`.

Behavior:

```bash
krn plan --task "..." --persist
```

With DB ready:

* creates persisted operator intent;
* creates task contract;
* creates harness plan;
* creates context assembly;
* creates harness/execution run;
* prints run ID and summary;
* prints evidence contract and next action.

Without DB or without `--persist`:

* retains preview/no-store behavior;
* clearly says no DB writes happened.

Rules:

* persistence must be explicit through `--persist`;
* no memory writes except candidate placeholders if already part of feedback delta later;
* no raw onboarding reads;
* no `.krn` writes.

Verification:

* no-env command still works preview-only;
* live DB command persists and prints run ID;
* `pnpm typecheck`;
* `pnpm test`.

Commit:

`feat(cli): persist harness plan runs`

## Slice 05 — Add persisted plan smoke test

Add a smoke test/script:

```bash
pnpm db:smoke:harness-plan
```

It should:

* require configured DB;
* create one persisted harness plan run;
* read it back;
* verify core fields;
* clean up created rows or use a deterministic test marker and cleanup;
* prove cleanup count is zero or test marker removed.

If DB is absent, it must skip/fail clearly with actionable message.

Verification:

* `pnpm db:smoke:harness-plan` passes with live DB;
* cleanup verified;
* `pnpm typecheck`;
* `pnpm test`.

Commit:

`test(db): add persisted harness plan smoke path`

## Slice 06 — Persist `krn evidence capture --run-id --persist`

Update evidence capture.

Behavior:

```bash
krn evidence capture --run-id <id> --persist
```

With DB ready:

* loads harness run;
* records evidence bundle;
* records review assessment;
* records feedback delta candidates;
* links them to run ID;
* prints persisted IDs.

Without DB or without `--persist`:

* retains preview behavior;
* clearly says no DB writes happened.

Rules:

* do not auto-apply memory;
* do not create full MemoryStore;
* do not create eval suite;
* candidates only.

Verification:

* live DB capture persists linked records;
* no-env capture remains preview/read-only;
* `pnpm typecheck`;
* `pnpm test`.

Commit:

`feat(cli): persist evidence capture for harness runs`

## Slice 07 — Add persisted evidence smoke test

Add:

```bash
pnpm db:smoke:harness-evidence
```

It should:

* create or reuse a test harness run;
* persist evidence capture;
* read linked evidence/review/feedback back;
* verify linkage;
* cleanup all test rows.

Verification:

* live DB smoke passes;
* cleanup verified;
* `pnpm typecheck`;
* `pnpm test`.

Commit:

`test(db): add persisted evidence capture smoke path`

## Slice 08 — Doctor verifies persisted harness capability

Update `krn doctor`.

Add DB readiness sub-checks for:

* DB configured;
* DB reachable;
* pgvector available;
* migrations verified;
* harness persistence schema ready;
* project repository smoke known;
* harness plan smoke command available;
* evidence persistence smoke command available.

Doctor must distinguish:

* no DB configured: preview-only OK, persistence not proven;
* DB ready but harness persistence unverified;
* DB ready and harness persistence verified.

No writes.

Verification:

* no-env doctor output is actionable;
* live DB doctor output reports harness persistence readiness;
* `pnpm typecheck`;
* `pnpm test`.

Commit:

`feat(cli): report harness persistence readiness in doctor`

## Slice 09 — Dogfood persisted harness loop

Run with live DB:

```bash
krn plan --task "improve KRN doctor harness persistence readiness" --persist
krn evidence capture --run-id <id> --persist
krn doctor
pnpm db:smoke:harness-plan
pnpm db:smoke:harness-evidence
```

Record in run docs:

* run ID;
* persisted entities;
* what was proven;
* what was not proven;
* review burden;
* next missing capability.

Verification:

* `pnpm typecheck`;
* `pnpm test`;
* smoke scripts pass;
* no forbidden surfaces.

Commit:

`docs(run): record persisted harness loop dogfood`

## Slice 10 — Anti-rot audit

Run:

* `git status --short --branch`
* `git log --oneline -12`
* `pnpm typecheck`
* `pnpm test`
* `krn doctor`
* `pnpm db:ready`
* `pnpm db:smoke`
* `pnpm db:smoke:harness-plan`
* `pnpm db:smoke:harness-evidence`

Verify:

* no dashboard;
* no apps/;
* no public API;
* no MCP server;
* no broad workers;
* no research layer;
* no runtime markdown memory;
* no separate vector/graph DB;
* no Redis/Kafka;
* no full MemoryStore/SourceStore;
* no automatic memory mutation;
* no broad eval suite;
* no forbidden dependency;
* core remains library-safe.

Commit:

`docs(run): record persisted harness anti-rot audit`

## Slice 11 — Final handoff

Update:

* current run `PROGRESS.md`
* current run `HANDOFF.md`
* current run `DECISIONS.md`
* current run `BLOCKERS.md`
* current run `VERIFICATION.md`
* `docs/handoff/handoff.md`
* `docs/handoff/blockers.md`
* `docs/handoff/verification.md`

Final handoff must state:

* M21 completed or blocked;
* exact commits;
* exact verification;
* DB proof status;
* persisted harness proof status;
* residuals;
* not built;
* next safest action.

Commit:

`docs(handoff): update persisted harness spine status`

## Final output

Return:

Completed:

* ...

Commits:

* ...

Verification:

* ...

DB proof status:

* ...

Persisted harness status:

* plan persisted / unproven
* evidence persisted / unproven
* linked feedback delta persisted / unproven
* cleanup proven / unproven

Residual blockers:

* ...

Not built:

* dashboard
* API
* MCP server
* broad workers
* research layer
* runtime markdown memory
* separate vector/graph DB
* full MemoryStore
* full SourceStore
* broad eval suite

Next safest action:

* one concrete action only

````

---

# Najważniejsza decyzja w M21

Dałbym `--persist` jako jawny warunek zapisu.

Czyli:

```bash
krn plan --task "..."
```

zostaje preview/no-store.

```bash
krn plan --task "..." --persist
```

pisze do DB.

To chroni przed jednym z najbardziej toksycznych błędów narzędzi agentowych: “komenda wygląda jak read/propose, ale po cichu zapisuje state”. KRN ma jawnie rozróżniać read/propose/write/destructive, a tool boundary i approval/audit to jedna z kanonicznych zasad systemu.

---

# Po M21 kolejność jest taka

Jeżeli M21 przejdzie, następny sensowny ciąg:

```txt
M22 — SourceClaim persistence + source-to-decision edges
M23 — MemoryCandidate -> MemoryRecord reviewed promotion
M24 — Activation engine v1: retrieve/rank/filter 7–20 items
M25 — Worker skeleton execution: embed/expire/contradiction jobs
M26 — Codex adapter hardening: execution brief + hooks expectations
M27 — first target-repo init --connect dogfood
```
