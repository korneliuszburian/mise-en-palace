# KRN Full Anti-Slop Review Request

Date: 2026-06-22

Audience: external extended reviewer / ChatGPT Pro with no prior thread context.

Primary request:
perform a full current-state review of this repository and return a concrete,
anti-slop assessment plus a prioritized set of missing layers/tasks that can be
folded back into `docs/plans/memory-ideal-state/PLAN.md`.

Do not assume conversation context. Treat this file and the repository as the
only source of truth.

## Repository

Repo: `mise-en-palace`

Local path used by the operator:

```txt
/home/krn/coding/krn/active/mise-en-palace
```

Current pushed implementation head after integrating the external harsh review
repair layer:

```txt
88cbbba docs(memory): add harsh review repair layer
```

Current branch state expected for review:

```txt
main == origin/main
```

Known local untracked quarry that is not accepted as truth:

```txt
docs/materials/2026-06-22-big-brain.md
docs/materials/2026-06-22-big-brain-part-2.md
```

These files may contain useful research mechanisms, but they must not be
treated as implementation truth unless mapped through:

```txt
source -> mechanism -> KRN implication -> decision/rejection -> falsifier
```

## Product Thesis

KRN is a Codex Operating Layer / AI Engineering Control Plane.

Codex executes. KRN supplies bounded context, service/store-backed memory,
source grounding, policy, skills, eval expectations, traces, review gates, and
feedback.

Kernel law:

```txt
Do not build more context.
Build the machinery that selects, applies, verifies, and forgets context.
```

This repo is not supposed to become:

- a dashboard-first app;
- a prompt pack;
- a benchmark lab;
- a generic multi-agent framework;
- a stack-specific agent zoo;
- a markdown memory folder;
- a Research Foundry;
- a Pattern Vault;
- a hidden autonomous researcher;
- a separate vector/graph DB product.

## Current Canonical Plan

Primary execution plan:

```txt
docs/plans/memory-ideal-state/PLAN.md
```

The plan is intentionally controlled and slice-based. It removed the previous
over-expanded Research Foundry / Pattern Vault / meta-researcher architecture.

The target loop is:

```txt
evidence
  -> observation
  -> reflection
  -> candidates
  -> review
  -> memory
  -> activation
  -> golden proof
```

The long-term visible flow is:

```txt
krn init --connect
krn doctor
krn plan --task "..."
Codex executes from the generated brief
krn evidence capture
krn observe --run <runId>
krn reflect --scope run:<runId>
krn memory review/promote <candidateId>
krn eval run --golden
krn audit slice --since <ref>
```

This full loop is not finished yet.

## Pushed Progress State

Complete in the plan:

```txt
M27    target repo readiness / DB smokes / evidence capture / anti-rot audit
MM-00  observational memory ADR and source-to-decision ledger
MM-01  controlled Memory Brain PLAN.md and roadmap cleanup
MM-02  repo audit baseline
MM-03  AuditBundle core domain contract
MM-04  AuditBundle schemas and persistence
MM-05  pure harness audit checks
MM-06  audit CLI and slice gate
MM-07  audit dogfood
MM-08  observation domain contracts
MM-09  observation IO schemas
MM-10  observation DB schema and migration
MM-11  observation repository adapter
MM-12  evidence/source range linkage
MM-13  observer input builder
MM-14  observation source-range policy matrix
MM-15  manual observe-run CLI
MM-16  observation prefix selector
MM-16/17 review-gate repair layer from external harsh reviews
MM-17A current-state reconciliation gate
MM-16R observation prefix relevance and project-scope hardening
MM-17B observation dogfood with raw recall matrix
MM-17C typed source-range lineage invariants
```

First unchecked execution slices after MM-17C:

```txt
MM-17D  Project-scoped observe runtime
MM-17E  Observation schema/core parity and timestamp validation
```

Recent pushed commits:

```txt
88cbbba docs(memory): add harsh review repair layer
d20af02 docs(review): update harsh audit request
86344af feat(harness): add observation prefix selector
023a365 feat(cli): add manual observe-run command
03e31db feat(core): add observation source-range policy matrix
ec77c57 feat(harness): add deterministic observer input builder
f7dbc6e feat(db): link observations to raw evidence
d28431d docs(review): expand anti-slop reviewer request
3c62597 feat(db): add observation repository adapter
fec2a45 docs(review): add extended reviewer goal
03442ff feat(db): add observation persistence schema
026a4b9 feat(schema): add observation io schemas
3eda7a7 feat(core): reconcile observation domain contracts
95c9e0c docs(memory): dogfood memory brain audit gate
400b4c7 feat(cli): add memory brain audit gate
ad36518 feat(harness): add memory brain audit checks
cbb9058 feat(db): add audit bundle schemas and persistence
d2d0a4a feat(core): add audit bundle domain contract
4c944e8 docs(memory): record audit baseline
c38eaff docs(memory): add controlled memory brain execution plan
```

## Current Pause Point

The operator paused after MM-16 for a harsh external audit. Two external reports
returned PASS_WITH_RISKS and their findings are now folded into
`docs/plans/memory-ideal-state/PLAN.md` as a blocking repair layer before
reflection, promotion, worker, API/MCP, dashboard, or broad eval work.

The next execution slice after typed source-range lineage hardening is MM-17D:

```txt
MM-17D Project-scoped observe runtime
```

Local DB tooling note:

- local `psql` is now available;
- KRN Postgres is reachable at `postgres://krn:krn@localhost:54329/krn`;
- recent persisted `execution_runs` exist in the local DB;
- no MM-17 dogfood doc has been committed yet.

The reviewer should treat MM-17D and every later slice as planned work unless
the repository head proves otherwise.

## MM-16 Closeout Note

MM-16 is intended to be complete in the repository head that includes:

```txt
feat(harness): add observation prefix selector
```

That slice touched:

```txt
packages/harness/src/observations/observationPrefix.ts
packages/harness/src/observations/observationPrefix.test.ts
packages/harness/src/observations/index.ts
docs/plans/memory-ideal-state/PLAN.md
REVIEW.md
```

Implemented intent:

- add pure `selectObservationPrefix`;
- rank already loaded observations against a `TaskContract`;
- return a small prefix with selected items, reasons, scores, warnings,
  exclusions, and rendered text;
- exclude cross-project, invalidated/deprecated/superseded, stale, low-relevance,
  and budget-overflow observations with explicit reasons.

Important limitation:

- this is not yet wired into context assembly;
- this is not yet wired into `krn observe`;
- this performs no DB reads;
- this performs no LLM call;
- this does not create or promote memory.

Verification expected for the MM-16 head:

```txt
pnpm --filter @krn/harness test -- observations/observationPrefix.test.ts
pnpm --filter @krn/harness typecheck
pnpm typecheck
pnpm test
KRN_DATABASE_URL="${KRN_DATABASE_URL:-postgres://krn:krn@localhost:54329/krn}" pnpm db:ready
```

The reviewer should rerun these commands against the exact checkout being
reviewed. Do not treat this note as a substitute for current command output.

## MM-15 Closeout Note

MM-15 is intended to be complete in the repository head that includes:

```txt
feat(cli): add manual observe-run command
```

That slice touched:

```txt
packages/cli/src/runObserveCommand.ts
packages/cli/src/parseArgs.ts
packages/cli/src/runCli.ts
packages/cli/src/index.ts
packages/cli/src/databaseRuntime.ts
packages/cli/src/runCli.test.ts
docs/plans/memory-ideal-state/PLAN.md
REVIEW.md
```

Implemented intent:

- add `krn observe --run <id> [--persist]`;
- load a persisted harness run from the DB runtime;
- build deterministic observer input through the MM-13 harness builder;
- preview by default and write observation group/items only with explicit
  `--persist`;
- create candidate fact observations with source ranges back to run evidence;
- report `Memory mutation: none` and avoid MemoryRecord creation.

Important limitation:

- this is still manual operator-triggered CLI behavior;
- this is not an observer worker;
- this performs no LLM call;
- this performs no reflection;
- this performs no activation prefix selection;
- this does not promote anything into Memory Core.

Verification expected for the MM-15 head:

```txt
pnpm --filter @krn/cli test -- runCli.test.ts
pnpm --filter @krn/cli typecheck
pnpm typecheck
pnpm test
KRN_DATABASE_URL="${KRN_DATABASE_URL:-postgres://krn:krn@localhost:54329/krn}" pnpm db:ready
```

The reviewer should rerun these commands against the exact checkout being
reviewed. Do not treat this note as a substitute for current command output.

## MM-14 Closeout Note

MM-14 is intended to be complete in the repository head that includes:

```txt
feat(core): add observation source-range policy matrix
```

That slice touched:

```txt
packages/core/src/observations/observationPolicy.ts
packages/core/src/observations/index.test.ts
docs/plans/memory-ideal-state/PLAN.md
REVIEW.md
```

Implemented intent:

- make the observation source-range policy explicit as
  `OBSERVATION_SOURCE_RANGE_POLICY`;
- cover every current `ObservationKind` and `ObservationProvenanceKind`;
- route `requiresObservationSourceRange(kind, provenanceKind)` through the
  matrix;
- keep source-range exemptions narrow: only `user_preference` and
  `local_operator_note` provenance may omit source ranges.

Important limitation:

- this is a pure core policy matrix;
- this does not add schema, DB, repository, CLI, runtime, worker, reflection,
  activation, or Memory Core mutation behavior.

Verification expected for the MM-14 head:

```txt
pnpm --filter @krn/core test -- observations/index.test.ts
pnpm --filter @krn/core typecheck
pnpm typecheck
pnpm test
KRN_DATABASE_URL="${KRN_DATABASE_URL:-postgres://krn:krn@localhost:54329/krn}" pnpm db:ready
```

The reviewer should rerun these commands against the exact checkout being
reviewed. Do not treat this note as a substitute for current command output.

## MM-13 Closeout Note

MM-13 is intended to be complete in the repository head that includes:

```txt
feat(harness): add deterministic observer input builder
```

That slice touched:

```txt
packages/harness/src/observations/observerInput.ts
packages/harness/src/observations/observerInput.test.ts
packages/harness/src/observations/index.ts
packages/harness/src/index.ts
docs/plans/memory-ideal-state/PLAN.md
REVIEW.md
```

Implemented intent:

- build deterministic observer input from already loaded run events, evidence
  bundles, review assessments, and feedback deltas;
- sort run events by sequence and other inputs deterministically;
- record source type/id/locator, observed time, compact text, payload JSON,
  redaction paths, and truncation records;
- redact secret-like keys and truncate oversized payloads before they reach an
  observer prompt or future observation generator.

Important limitation:

- this is not an observe CLI;
- this is not an observer worker;
- this performs no DB reads;
- this performs no LLM call;
- this creates no ObservationGroup, ObservationItem, MemoryRecord, or candidate.

Verification expected for the MM-13 head:

```txt
pnpm --filter @krn/harness test -- observations/observerInput.test.ts
pnpm --filter @krn/harness typecheck
pnpm typecheck
pnpm test
KRN_DATABASE_URL="${KRN_DATABASE_URL:-postgres://krn:krn@localhost:54329/krn}" pnpm db:ready
```

The reviewer should rerun these commands against the exact checkout being
reviewed. Do not treat this note as a substitute for current command output.

## MM-12 Closeout Note

MM-12 is intended to be complete in the repository head that includes:

```txt
feat(db): link observations to raw evidence
```

That slice touched:

```txt
packages/db/src/repositories/DrizzleObservationRepository.ts
packages/db/src/repositories/DrizzleObservationRepository.test.ts
docs/plans/memory-ideal-state/PLAN.md
REVIEW.md
```

Implemented intent:

- add evidence-linkage helper checks for observation source ranges;
- block factual observations unless they have an evidence-linked source range;
- allow explicit local operator notes to remain unsourced;
- add `recallRawEvidence(observationItemId)` to reconstruct raw run/source/
  evidence/review/feedback material from observation source ranges.

Important limitation:

- source ranges that only carry polymorphic `sourceType` / `sourceId` and no
  typed FK are still returned as unavailable raw evidence;
- tool traces are recalled when represented through existing run event/evidence
  records, not through a dedicated tool trace table;
- MM-13 still needs to build deterministic observer input and must not be
  mistaken for already-built observer runtime.

Verification expected for the MM-12 head:

```txt
pnpm --filter @krn/db test -- repositories/DrizzleObservationRepository.test.ts
pnpm --filter @krn/db typecheck
pnpm typecheck
pnpm test
KRN_DATABASE_URL="${KRN_DATABASE_URL:-postgres://krn:krn@localhost:54329/krn}" pnpm db:ready
```

The reviewer should rerun these commands against the exact checkout being
reviewed. Do not treat this note as a substitute for current command output.

## What Exists

Audit layer:

- `AuditBundle` core contract in `packages/core`;
- audit Zod schemas in `packages/schema`;
- audit DB tables and repository in `packages/db`;
- deterministic audit checks in `packages/harness`;
- `krn audit repo` and `krn audit slice --since <ref>` in `packages/cli`;
- dogfood evidence in
  `docs/runs/2026-06-22-memory-brain-audit-dogfood.md`.

Observation layer:

- pure observation contracts in `packages/core/src/observations`;
- Zod IO schemas in `packages/schema/src/observation.ts`;
- DB schema in `packages/db/src/schema/observations.ts`;
- migration `packages/db/src/migrations/0009_dusty_tattoo.sql`;
- repository adapter in
  `packages/db/src/repositories/DrizzleObservationRepository.ts`.
- repository-level raw evidence recall in
  `DrizzleObservationRepository.recallRawEvidence`.
- repository-level factual observation guard requiring typed evidence-linked
  source ranges.
- deterministic observer input builder in
  `packages/harness/src/observations/observerInput.ts`.
- explicit source-range policy matrix in
  `packages/core/src/observations/observationPolicy.ts`.
- manual observe-run CLI in `packages/cli/src/runObserveCommand.ts`.
- pure observation prefix selector in
  `packages/harness/src/observations/observationPrefix.ts`.

Observation tables:

- `observation_groups`
- `observation_items`
- `observation_source_ranges`
- `observation_entity_edges`
- `observation_claim_edges`
- `observation_feedback_events`

Evidence linkage currently supports typed observation source range links to:

- `run_events`
- `source_chunks`
- `evidence_bundles`
- `review_assessments`
- `feedback_deltas`

Observation doctrine:

- Observation is staging, not Memory Core.
- Observation is not SourceClaim.
- Observation is not final truth.
- Reflection may later create candidates, not mutate Memory Core.
- Raw evidence remains canonical for exact claims.
- Anti-memory is first-class.
- No chain-of-thought storage.
- No markdown runtime memory.

## What Is Not Built Yet

Do not confuse planned slices with implemented behavior.

Not built yet:

- observer worker;
- reflector worker;
- reflection contracts/persistence/repository;
- candidate generation from reflection;
- candidate promotion gates;
- MemoryReviewGate;
- memory invalidation/versioning/demotion;
- anti-memory retrieval enforcement;
- ActivationEngine v2;
- CapabilityCompiler v1;
- golden memory behavior runner;
- macro behavior reports;
- API/MCP boundary;
- dashboard/read models.

Built but not fully integrated yet:

- manual `krn observe --run <id> [--persist]` exists, but MM-17 dogfood is not
  committed yet;
- deterministic observer input builder exists, but there is no model-backed
  observer and no worker;
- pure observation prefix selector exists, but it is not wired into context
  assembly or activation runtime;
- observation persistence exists, but observations do not yet flow into
  reflection, MemoryCandidate creation, promotion, or anti-memory enforcement.

## Known Advisory Findings

From dogfood audit:

- existing unchecked `JSON.parse` boundary in
  `packages/cli/src/runDoctorCommand.ts`;
- existing unchecked `JSON.parse` boundary in
  `packages/cli/src/runInitCommand.ts`;
- slice audit can warn about missing handoff until automated handoff/audit
  integration is wired.

These are known cleanup candidates, not proof the current memory plan is wrong.

## Files To Inspect First

Start with:

```txt
docs/KRN_KERNEL.md
docs/plans/memory-ideal-state/PLAN.md
docs/plans/memory-ideal-state/GOAL.md
docs/plans/memory-ideal-state/SOURCE_LEDGER.md
docs/plans/memory-ideal-state/DECISIONS.md
docs/plans/memory-ideal-state/REJECTIONS.md
docs/plans/memory-ideal-state/FALSIFIERS.md
docs/plans/memory-ideal-state/MM-ROADMAP.md
docs/plans/memory-ideal-state/AUDIT_BASELINE.md
docs/runs/2026-06-22-memory-brain-audit-dogfood.md
```

Then inspect implementation:

```txt
packages/core/src/observations/
packages/schema/src/observation.ts
packages/db/src/schema/observations.ts
packages/db/src/repositories/DrizzleObservationRepository.ts
packages/harness/src/observations/observerInput.ts
packages/harness/src/observations/observationPrefix.ts
packages/cli/src/runObserveCommand.ts
packages/core/src/auditBundle.ts
packages/schema/src/auditBundle.ts
packages/db/src/schema/audit.ts
packages/db/src/repositories/DrizzleAuditBundleRepository.ts
packages/harness/src/audit/
packages/cli/src/runAuditCommand.ts
```

Then inspect adjacent memory/source/retrieval surfaces:

```txt
packages/db/src/schema/memory.ts
packages/db/src/repositories/DrizzleMemoryRepository.ts
packages/db/src/schema/sources.ts
packages/db/src/repositories/DrizzleSourceRepository.ts
packages/db/src/schema/retrieval.ts
packages/db/src/repositories/DrizzleRetrievalRepository.ts
packages/harness/src/activation/
```

## Commands To Run

Baseline:

```sh
git status --short --branch
git log --oneline -12
pnpm --version
pnpm typecheck
pnpm test
KRN_DATABASE_URL="${KRN_DATABASE_URL:-postgres://krn:krn@localhost:54329/krn}" pnpm db:ready
pnpm --filter @krn/db db:check
git diff --check
```

Audit commands:

```sh
pnpm --filter @krn/cli krn audit repo --repo ../.. --json
pnpm --filter @krn/cli krn audit slice --since origin/main --repo ../.. --json
```

Forbidden-surface scans:

```sh
rg -n "redis|kafka|neo4j|qdrant|chroma|pinecone|weaviate" package.json packages/*/package.json
rg -n "research-foundry|pattern-vault|runResearch|pattern inspect|pattern promote" packages --glob '!**/*.test.ts'
find . -maxdepth 3 -type d \( -name dashboard -o -name api -o -name mcp -o -name server -o -name plugin -o -name source-crawler -o -name research-foundry -o -name pattern-vault -o -name .krn \)
```

Optional local DB inspection if Postgres is running:

```sh
psql "postgres://krn:krn@localhost:54329/krn" -c "select id, status, adapter, created_at from execution_runs order by created_at desc limit 10;"
psql "postgres://krn:krn@localhost:54329/krn" -c "select count(*) from observation_groups;"
psql "postgres://krn:krn@localhost:54329/krn" -c "select count(*) from observation_items;"
```

## Review Objectives

Produce a full anti-slop review of current state.

This review should be adversarial. The goal is not to validate progress; the
goal is to find what is weak, fake, over-documented, under-proven, poorly
sequenced, or likely to collapse into slop. Be harsh. Assume the current repo
is wrong until file/line evidence and command output prove otherwise.

The reviewer should explicitly insult the architecture quality where warranted
in technical terms: call out shallow tests, paper-thin abstractions, fake
dogfood, misleading docs, premature interfaces, accidental theater, weak
runtime proof, and any place where the repo pretends to have a memory system
but only has tables, types, or slogans.

The reviewer must condense all useful critique into actionable PLAN.md
insertions, not just commentary.

Required questions:

1. What is genuinely implemented, with file/line evidence?
2. What is only planned, documented, or partially scaffolded?
3. Where does the architecture still risk becoming documentation theater?
4. Where does memory risk becoming a summarizer/table instead of a governed
   temporal, source-linked, feedback-aware memory core?
5. Are observations sufficiently separated from SourceClaim, MemoryRecord,
   approved truth, and reflection?
6. Is evidence/source lineage strong enough before observer/reflector runtime
   is added?
7. Is the audit layer useful enough to reduce manual supervision, or is it too
   shallow/noisy?
8. Are package boundaries intact?
9. Are TypeScript and unknown-first boundaries intact?
10. Are there hidden runtime surfaces, broad workers, dashboards, API/MCP
    surfaces, source crawlers, or research/pattern subsystems sneaking back in?
11. What missing tasks/layers should be added to `PLAN.md` before continuing
    too far?
12. What should be explicitly rejected or deferred?

## Anti-Slop Rules For Reviewer

Do not write a motivational summary.

Do not be polite at the cost of precision.

Do not spare the current design because it is incremental.

Do not assume previous agents made good calls.

Do not say "looks good" without evidence.

Do not treat green tests as proof of product behavior unless the tests cover the
specific behavior.

Do not treat docs as implementation.

Do not treat table existence as memory correctness.

Do not recommend broad new subsystems unless you can map them to an existing
KRN primitive and a falsifier.

Do not propose a dashboard, API, MCP server, source crawler, Redis/Kafka,
separate vector DB, separate graph DB, Research Foundry, Pattern Vault, or
agent zoo unless you also explain why the current plan's explicit rejection is
wrong.

Do not ask to store chain-of-thought.

Do not collapse all future work into "RAG improvements." This system is about:

```txt
selection -> application -> verification -> forgetting
```

## Expected Output Format

Return the review in this exact shape:

```md
# Executive Verdict

- Verdict: PASS / PASS_WITH_RISKS / FAIL
- One-sentence reason:
- Highest-risk area:
- Next safest slice:

# Current-State Map

| Area | Status | Evidence | Risk |
|---|---|---|---|

# Findings

## Critical

Each finding:
- Title:
- Evidence:
- Why it matters:
- Recommended fix:
- PLAN.md insertion point:

## Important

Same structure.

## Minor

Same structure.

# Missing PLAN.md Layers

For each proposed addition:
- Slice ID or insertion point:
- Objective:
- Files likely touched:
- Verification:
- Non-goals:
- Falsifier:

# Rejections / Deferrals

For each rejected idea:
- Idea:
- Why reject/defer:
- What would change the decision:

# Suggested Next 5 Slices

1. ...
2. ...
3. ...
4. ...
5. ...

# Evidence Gaps

List exact files/commands/data needed to settle uncertainty.

# Final Reviewer Notes

Hard facts vs interpretation must be separated.
```

## Bias For This Review

Be blunt. The goal is not to make the current repo sound better. The goal is to
protect KRN from building the wrong memory system.

The strongest acceptable output is one that says exactly:

- what is real;
- what is not real yet;
- what is brittle;
- what would become slop if continued;
- what to add to `PLAN.md`;
- what to avoid building.
