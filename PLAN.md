# PLAN.md — KRN Final Harness Spine From Current Repository State

This file is a living execution plan for moving `korneliuszburian/mise-en-palace` from the current bootstrap kernel into the first real KRN product spine. It follows the Codex ExecPlan discipline: it is self-contained, it records progress and decisions, it gives exact repository-relative paths, it defines non-obvious terms, and it treats validation as the proof of completion. Keep the sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` up to date as work proceeds.

This plan supersedes the old bootstrap-only direction in `GOAL.md` once it is committed. `GOAL.md` may remain as a compact Codex Goal activation contract, but this `PLAN.md` is the long-running implementation map.

## Codex Goal To Activate

Use this `/goal` in Codex after adding this file to the repository root:

    /goal Implement KRN as a Postgres-backed AI Engineering Harness OS from the current mise-en-palace repository state, verified by a self-contained PLAN.md kept current, passing pnpm typecheck, schema/type tests where introduced, a working krn plan --task vertical slice, a read-only krn doctor, evidence capture, and a recorded dogfood run, while preserving strict TypeScript boundaries, no runtime markdown memory, no .krn truth, no dashboard-first UI, no separate vector/graph/queue stores, no broad subagent system, and no Codex-specific leakage into packages/core. Use the current repository files, official Codex Goal and ExecPlan patterns summarized in this plan, and local source docs only as bounded inputs. Between iterations, update Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective, run the relevant validation command, commit with Conventional Commits, and choose the next smallest slice that advances the canonical harness flow. If blocked, stop with attempted paths, evidence gathered, the blocker, and the exact input that would unlock progress.

This Goal is intentionally narrow enough to audit but broad enough to let Codex choose the next safe slice. It names the desired end state, verification surface, constraints, allowed context, iteration policy, and blocked stop condition.

## Purpose / Big Picture

KRN is a Codex Operating Layer / AI Engineering Control Plane. Codex executes code changes. KRN supplies bounded context, source grounding, store-backed memory, policy, engineering skills, traces, review gates, and feedback loops.

The repository currently contains the kernel language, docs, repo-local skills, one read-only TypeScript critic subagent, and a strict two-package TypeScript workspace. That is not yet a product. After this plan is implemented, a user should be able to run a first real KRN vertical path:

    pnpm typecheck
    pnpm --filter @krn/cli krn plan --task "improve KRN doctor brain store readiness"
    pnpm --filter @krn/cli krn doctor
    pnpm --filter @krn/cli krn evidence capture

The observable result is not a dashboard and not a benchmark report. The observable result is a typed, Postgres-shaped harness path that turns an operator intent into a task contract, selected context, capability plan, Codex adapter brief, evidence contract, review/evidence records, and feedback candidates without pretending that markdown is runtime memory.

## Current Repository Orientation

The repository root is `korneliuszburian/mise-en-palace` on branch `main`.

The current state observed before writing this plan:

- `README.md` says the repo is a KRN kernel workspace, not an application, and lists no CLI implementation, no dashboard, no benchmark lane, no runtime markdown memory, no broad subagent system, no plugin package, and no KRN MCP server as not built.
- `AGENTS.md` is intentionally short. It tells Codex to read `docs/KRN_KERNEL.md`, avoid broad historical rereads, preserve strict TypeScript boundaries, and use Conventional Commits.
- `GOAL.md` is still the bootstrap execution contract. It says Commit 0/1 are complete and Commit 2 is the active strict TypeScript spine.
- `package.json` defines a private ESM pnpm workspace and a root `typecheck` script: `pnpm -r --workspace-concurrency=1 typecheck`.
- `pnpm-workspace.yaml` includes `packages/*`.
- `tsconfig.base.json` uses strict TypeScript settings, including `strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noUnusedLocals`, and `noEmit`.
- `packages/core` and `packages/cli` exist only as shells with `package.json`, `tsconfig.json`, and `src/index.ts` exporting nothing.
- `.agents/skills/` contains initial engineering skills such as `source-to-decision`, `to-issues`, `handoff-compact`, and `typescript-type-safety`.
- `.codex/agents/ts-type-critic.toml` exists as the single read-only/proposal-only TypeScript critic subagent.

Important implication: do not restart from an empty repo. The next move is to close bootstrap and begin the final infra-backed spine.

## Definitions

KRN means the operating layer around Codex. It is not an alternative code-writing agent.

Harness means the system that takes a user task, frames it, selects context and capabilities, prepares a Codex execution brief, records evidence, and converts review feedback into candidates for memory, source, policy, or eval updates.

Brain store means the canonical database where KRN keeps typed project state, memory, sources, run ledgers, context activations, policy results, and feedback. In this plan the brain store is PostgreSQL with pgvector, not markdown, not `.krn`, and not a separate vector database.

Memory Core means typed, temporal, source-linked, confidence-aware, invalidatable memory records. It is not a folder of notes.

Source Graph means source artifacts, claims, decisions, rejections, and edges that explain how evidence supports or fails to support KRN decisions. It is not a list of links.

Activation Engine means the logic that selects a small working set for a task. It ranks lexical, vector, graph, trust, temporal, and context-ROI signals, and it can abstain when context is weak.

Context Assembly means the final selected context for a task: inclusions, exclusions, reasons, expected use, budget, and evidence requirements.

Capability Plan means the selected engineering disciplines, policy gates, tool boundaries, and Codex adapter hints needed for a task. It replaces the old idea of storing `requiredSkills` directly in core task objects.

Codex Adapter means the layer that renders KRN output into Codex-native surfaces such as execution briefs, AGENTS pointers, skills, hooks, MCP references, Goals, and ExecPlans. It must not leak into `packages/core`.

Evidence Contract means the explicit list of proof expected from a run: commands, changed files, test/typecheck output, diff risk, review burden, rollback path, and feedback candidates.

Dogfood means using KRN to improve KRN and recording the evidence. The first dogfood target is improving `krn doctor` brain-store readiness.

## Non-Negotiable Architecture Decisions

KRN now starts from target infrastructure, not from contracts disconnected from storage.

The canonical data plane is PostgreSQL with pgvector. PostgreSQL stores transactional state, JSON metadata, graph edges, full-text search documents, vectors, run events, outbox events, worker jobs, and read-model inputs. pgvector is the vector search path. PostgreSQL full-text search is the lexical path. Relational edge tables are the graph path. Redis, Kafka, Neo4j, Qdrant, LanceDB, Elastic, and OpenSearch are rejected for the first implementation.

Local development may use Docker Postgres with pgvector. PGlite can be used only as a lightweight local/test adapter if it does not distort the canonical Postgres design.

Drizzle owns the database schema and migrations. Zod owns IO/API/CLI validation boundaries. TypeScript stays strict and unknown-first at external boundaries.

Markdown files are allowed as docs, exports, seeds, audit logs, and handoffs. Markdown files are not Memory Core. `.krn/**` must not become runtime product truth.

Dashboard is later and only as a read-model projection over typed objects with actions. Dashboard is not proof that the product exists.

Codex surfaces are adapters. AGENTS.md, skills, hooks, MCP, Goals, and ExecPlans are not the core product brain. The core product is the harness.

## Canonical Harness Flow

All slices must ultimately advance this flow:

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

A slice may implement only part of this flow, but it must not introduce a temporary architecture that contradicts it.

## Hard Non-Goals

Do not create:

- dashboard UI or `apps/` before typed state and read models exist;
- separate vector store, graph store, search store, Redis, or Kafka;
- runtime markdown memory;
- `.krn` runtime truth;
- broad benchmark lane;
- broad eval suite;
- KRN MCP server before DB, repositories, harness compiler, and CLI vertical slice exist;
- broad subagent system;
- project-oriented skill zoo;
- custom prompt library;
- old repo topology import;
- a CLI-first architecture that bypasses the harness;
- fake in-memory-only architecture as the final path.

## Target Package Boundaries

The repository should grow from two packages into the final spine below.

`packages/core` owns pure domain types and pure logic. It must not import database code, CLI code, filesystem code, shell code, environment code, network code, Codex-specific code, or process mutation. It should not use global `ts-reset`.

`packages/schema` owns Zod schemas and JSON/IO contracts. External data stays `unknown` until parsed.

`packages/db` owns Drizzle schema, migrations, SQL helpers, database connection adapters, and repository implementations.

`packages/harness` owns activation engine, harness compiler, context assembly, evidence contracts, and capability planning.

`packages/codex-adapter` owns rendering to Codex-native surfaces: execution brief, AGENTS pointers, skill hints, hook expectations, MCP resource references, Goal references, and ExecPlan references.

`packages/cli` owns terminal commands and user-facing command output. It calls schema parsing and harness services; it does not become the architecture.

`packages/workers` owns job definitions and thin worker skeletons for embedding, compaction, contradiction detection, stale memory expiration, and eval promotion.

`packages/api` and `packages/dashboard` are future packages. Do not create them in the first product spine unless the current plan is explicitly revised after the CLI and brain-store behavior exist.

## Progress

Use this section as the single progress truth while executing the plan. Update every stopping point with a date, evidence, and next action.

- [x] 2026-06-21: Kernel docs exist, including README, AGENTS, KRN kernel docs, source map, failure report, and ADRs.
- [x] 2026-06-21: Repo-local skills exist under `.agents/skills/`, and one read-only/proposal-only TypeScript critic subagent exists under `.codex/agents/`.
- [x] 2026-06-21: Strict pnpm TypeScript workspace spine exists with `packages/core` and `packages/cli` shells.
- [x] 2026-06-21: Root `package.json`, `pnpm-workspace.yaml`, and `tsconfig.base.json` exist.
- [x] 2026-06-21: Added root `PLAN.md`, compacted `GOAL.md` to the activation contract, updated `README.md` current phase, and kept `AGENTS.md` short with a pointer to this living ExecPlan. Evidence: docs-only diff and `pnpm typecheck` for this milestone.
- [x] 2026-06-21: Added `docs/decisions/ADR-0010-brain-store-postgres-pgvector.md` and `docs/architecture/package-boundaries.md`. Evidence: ADR includes source-to-decision mappings and `pnpm typecheck` passed.
- [x] 2026-06-21: Expanded workspace shells for `schema`, `db`, `harness`, `codex-adapter`, and `workers` with empty module entrypoints and strict package tsconfigs. Evidence: `pnpm install --lockfile-only` recognized all 8 workspace projects and `pnpm typecheck` passed across 7 package projects.
- [x] 2026-06-21: Added Vitest only when Zod IO schema boundaries existed, with RED/GREEN tests for unknown-input parsing, source claim decision fields, memory lineage/user-preference rules, and structured evidence commands. Evidence: initial `pnpm --filter @krn/schema test` failed because parse functions were missing, then `pnpm test` passed with 4 tests.
- [x] 2026-06-21: Added Drizzle/Postgres schema foundation for workspaces, projects, repo installations, project kernels, operator intents, task contracts, harness plans, context assemblies, execution runs, evidence bundles, review assessments, feedback deltas, run events, outbox events, and worker jobs. Evidence: `pnpm typecheck`, `pnpm --filter @krn/db db:generate`, `pnpm --filter @krn/db db:check`, and `git diff --check` passed.
- [x] 2026-06-21: Added Memory Core and source graph schema, including memory records, versions, edges, candidates, applications, feedback events, anti-memory, activation traces, source artifacts, chunks, claims, claim edges, decisions, rejections, and snapshots. Evidence: `pnpm typecheck`, `pnpm --filter @krn/db db:generate`, `pnpm --filter @krn/db db:check`, SQL inspection for `mechanism` / `krn_implication` / `does_not_prove`, and `git diff --check` passed.
- [x] 2026-06-21: Added retrieval and activation schema with embedding models, embeddings, search documents, retrieval runs, retrieval candidates, activation decisions, context items, and context exclusions. Evidence: `pnpm typecheck`, `pnpm --filter @krn/db db:generate`, `pnpm --filter @krn/db db:check`, SQL inspection for `CREATE EXTENSION IF NOT EXISTS vector`, `vector(1536)`, HNSW vector index, `tsvector`, GIN search index, context inclusions, context exclusions, and `git diff --check` passed.
- [x] 2026-06-21: Added Zod IO schemas and public parse functions for operator intents, task contracts, memory candidates, source claims, harness compile inputs, and evidence capture inputs. Evidence: `pnpm typecheck`, `pnpm test`, and `git diff --check` passed.
- [x] 2026-06-21: Added pure core domain model types for IDs, time, operator intents, task contracts, harness plans, context assembly, capability plans, Codex adapter plan refs, execution runs, evidence bundles, review assessments, feedback deltas, memory, sources, policy, and eval candidates. Evidence: `pnpm typecheck`, `pnpm test`, `grep -R "requiredSkills" packages/core && exit 1 || true`, forbidden-import search, and `git diff --check` passed.
- [x] 2026-06-21: Added repository interfaces in `packages/harness` and Drizzle/Postgres adapters in `packages/db` for projects, memory, sources, harness runs, event ledger, outbox, and retrieval. Evidence: `pnpm typecheck`, `pnpm test`, `git diff --check`, no `any` in `packages/core packages/harness packages/db/src`, and no forbidden DB/runtime imports or `requiredSkills` in `packages/core`.
- [x] 2026-06-21: Added pure harness activation engine with memory/source query builders, ranking, trust and temporal filters, context ROI budget filtering, and context assembly with explicit inclusions/exclusions. Evidence: TDD RED `pnpm --filter @krn/harness test` failed on missing activation module, then GREEN `pnpm typecheck`, `pnpm test`, `git diff --check`, no `any` in `packages/core packages/harness/src packages/db/src`, and no forbidden DB/CLI/Codex imports in `packages/harness/src` or `packages/core`.
- [x] 2026-06-21: Added harness compiler that persists operator intent, task contract, harness plan, context assembly, retrieval candidates, activation decisions, and context selections through repository ports, then returns capability plan, Codex adapter plan reference, and evidence contract without invoking Codex. Evidence: TDD RED `pnpm --filter @krn/harness test` failed on missing compiler module, then GREEN `pnpm typecheck`, `pnpm test`, `git diff --check`, no `any` in `packages/core packages/harness/src packages/db/src`, and no forbidden DB/CLI/Codex imports in `packages/harness/src` or `packages/core`.
- [x] 2026-06-21: Added Codex adapter renderer for bounded execution briefs, Goal/ExecPlan references, skill hints, hook expectations, context inclusions/exclusions, capability plan, and evidence contract. Evidence: TDD RED `pnpm --filter @krn/codex-adapter test` failed on missing renderer module, then GREEN `pnpm typecheck`, `pnpm test`, `git diff --check`, no `any` in `packages/core packages/harness/src packages/codex-adapter/src packages/db/src`, no `@krn/codex-adapter` imports in `packages/core`, and no process/filesystem/network/MCP calls in `packages/codex-adapter/src`.
- [x] 2026-06-21: Added CLI vertical path `pnpm --filter @krn/cli krn plan --task "..."` with manual arg parsing, schema validation, optional `KRN_DATABASE_URL` Postgres runtime, explicit no-store preview when DB is absent, harness compiler call, and Codex execution brief output. Evidence: `pnpm typecheck`, `pnpm test`, `pnpm --filter @krn/cli krn plan --task "improve KRN doctor brain store readiness"`, `git diff --check`, no `.krn` directory, no `any` in KRN source packages, and no CLI filesystem/process-spawn writes; the only CLI `dashboard` match is a non-goal string.
- [x] 2026-06-21: Added read-only `krn doctor` with Postgres config/reachability, pgvector, migrations, AGENTS.md, `.krn` runtime truth, TypeScript strictness, workspace packages, skills surface, hooks surface, and forbidden-surface checks. Evidence: TDD RED `pnpm --filter @krn/cli test` failed because `doctor` was unknown, then GREEN `pnpm typecheck`, `pnpm test`, `pnpm --filter @krn/cli krn doctor`, `git diff --check`, no `.krn` directory, no `any` in KRN source packages, and no CLI write/spawn calls.
- [x] 2026-06-21: Added `krn evidence capture` with changed-file detection, skipped command evidence placeholders, diff risk, review burden, rollback path, no memory mutation, and feedback-candidate summary. It prints evidence when `KRN_DATABASE_URL` / `KRN_EXECUTION_RUN_ID` are absent instead of faking persistence. Evidence: TDD RED `pnpm --filter @krn/cli test` failed because `evidence capture` was unknown, then GREEN `pnpm typecheck`, `pnpm test`, `pnpm --filter @krn/cli krn evidence capture`, `git diff --check`, no `.krn` directory, no `any` in KRN source packages, and clean-tree behavior covered by CLI tests.
- [x] 2026-06-21: Added `packages/workers` maintenance job skeleton for `embed_source_chunk`, `compact_memory`, `detect_contradiction`, `expire_stale_memory`, and `promote_eval_candidate`, with typed payloads, job descriptions, enqueue ports, and `worker_job.queued` outbox emission. Evidence: TDD RED `pnpm --filter @krn/workers test` failed on missing worker exports, then GREEN `pnpm --filter @krn/workers test`, `pnpm typecheck`, `pnpm test`, no `.krn` directory, no `any` in KRN source packages, and no Redis/Kafka/background worker loop in `packages/workers`.
- [x] 2026-06-21: Refactored repo-local skills to the final harness-spine operational set: `target-infra-adr`, `brain-store-schema`, `activation-engine`, `codex-adapter-plan`, `evidence-review-loop`, `source-to-decision`, `typescript-type-safety`, and `handoff-compact`. Evidence: RED skill-set audit failed on missing target skills and extra broad planning skills, then GREEN skill-set/section/frontmatter audit passed, system `quick_validate.py` passed for all 8 skills, and `pnpm typecheck` passed.
- [x] 2026-06-21: Dogfooded KRN on KRN with `krn plan --task "improve KRN doctor brain store readiness"`, added doctor brain-store readiness status, refreshed Codex adapter skill hints after the skill refactor, and recorded the run in `docs/runs/2026-06-21-first-postgres-backed-harness-dogfood.md`. Evidence: dogfood `krn plan` ran in no-store preview with context abstention, TDD RED/GREEN covered doctor readiness and stale skill hints, `krn doctor` prints `Brain store readiness: preview only...`, and `krn evidence capture` printed feedback candidates without memory mutation.
- [x] 2026-06-21: Added final handoff docs under `docs/handoff/`, updated `GOAL.md` to require matching repo-local operational skills when their triggers apply, then ran final verification and forbidden-surface checks. Evidence: `pnpm typecheck`, `pnpm test`, `pnpm --filter @krn/cli krn plan --task "improve KRN doctor brain store readiness"`, `pnpm --filter @krn/cli krn doctor`, `pnpm --filter @krn/cli krn evidence capture`, `find . -maxdepth 3 -type d | sort`, `grep -R "requiredSkills" packages/core && exit 1 || true`, targeted forbidden-directory/store/core-import/subagent/eval checks, and `git diff --check` passed.
- [x] 2026-06-21: Started M20 local brain-store runtime proof and completed Slice 00 preflight ledger under `docs/runs/2026-06-21-brain-store-proof/`. Evidence: `git status --short --branch`, `git log --oneline -8`, `pnpm typecheck`, and `pnpm test` passed; `GOAL.md` handoff path casing was normalized to `docs/handoff/handoff.md`.
- [x] 2026-06-21: Completed M20 Slice 01 DB runtime inventory in `docs/runs/2026-06-21-brain-store-proof/DB_RUNTIME_INVENTORY.md`. Evidence: `KRN_DATABASE_URL` is canonical in `krn plan`, `krn doctor`, and `krn evidence capture`; Drizzle schema/migrations exist with pgvector SQL in `0002_shocking_post.sql`; no `.env.example`, Compose file, migration readiness command, or DB smoke command exists yet; `pnpm --filter @krn/db db:check` and `pnpm typecheck` passed.
- [x] 2026-06-21: Added M20 Slice 02 local brain-store setup path with `.env.example`, `compose.yaml`, `docs/runbooks/local-brain-store.md`, and env-aware Drizzle config. Evidence: `docker compose config`, `pnpm --filter @krn/db db:check`, and `pnpm typecheck` passed; the runbook documents that live migration and persistence proof remain pending.
- [x] 2026-06-21: Added M20 Slice 03 migration readiness command `pnpm db:ready`, backed by `krn db readiness` and a Drizzle/postgres-js migration readiness helper. Evidence: RED `pnpm --filter @krn/cli test` failed on parser exit `2`, GREEN CLI test passed, `pnpm db:ready` without `KRN_DATABASE_URL` exited `1` with a clear report, Docker Compose local pgvector Postgres became healthy, `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready` passed with migrations expected/applied `3/3`, pgvector available, and brain-store readiness ready; `pnpm test` and `pnpm typecheck` passed.
- [x] 2026-06-21: Refined M20 Slice 04 `krn doctor` DB readiness to stay read-only while checking exact migration count and pgvector readiness. Evidence: RED `pnpm --filter @krn/cli test` failed on missing `deriveBrainStoreReadiness`, GREEN CLI test passed, `pnpm --filter @krn/cli krn doctor` without DB reported preview-only readiness, `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn doctor` reported migrations `verified (3/3 applied)` and brain-store readiness ready, `pnpm typecheck` and `pnpm test` passed.
- [x] 2026-06-21: Added M20 Slice 05 minimal persistence smoke command `pnpm db:smoke`, backed by `krn db smoke` and a Drizzle project repository smoke helper. Evidence: RED `pnpm --filter @krn/cli test` failed on parser exit `2`, GREEN CLI test passed, `pnpm db:smoke` without DB exited `1` with a skipped missing-config report, `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke` inserted/read/cleaned a smoke workspace/project and passed, direct SQL cleanup check returned `0` `krn-smoke-%` workspaces, `pnpm typecheck` and `pnpm test` passed.
- [x] 2026-06-21: Completed M20 Slice 06 final audit and handoff/blocker closure. Evidence: clean `git status --short --branch` before handoff edits, `git log --oneline -8`, healthy `docker compose ps krn-postgres`, `pnpm typecheck`, `pnpm test`, no-env `krn doctor`, live-DB `krn doctor`, live-DB `pnpm db:ready`, live-DB `pnpm db:smoke`, direct smoke cleanup count `0`, and refreshed `docs/handoff/*`.
- [x] 2026-06-21: Started M21 persisted harness spine and completed Slice 00 preflight ledger under `docs/runs/2026-06-21-persisted-harness-spine/`. Evidence: `a312afe docs(goal): define persisted harness spine` is the start commit, `git status --short --branch`, `git log --oneline -10`, `pnpm typecheck`, `pnpm test`, and no-DB `pnpm --filter @krn/cli krn doctor` passed; `GOAL.md` now forces repo-local skill gates for matching slices.
- [x] 2026-06-21: Completed M21 Slice 01 harness persistence inventory in `docs/runs/2026-06-21-persisted-harness-spine/HARNESS_PERSISTENCE_INVENTORY.md`. Evidence: existing harness tables and Drizzle repository writes were mapped; gaps are explicit `--persist`, run aggregate readback, evidence contract persistence, evidence capture persistence, and feedback delta readback; `pnpm --filter @krn/db db:check` and `pnpm typecheck` passed.
- [x] 2026-06-21: Completed M21 Slice 02 minimal schema decision in `docs/runs/2026-06-21-persisted-harness-spine/SCHEMA_DECISION.md`. Evidence: no new migration is needed for primary spine tables; evidence contract expectations will use typed `harness_plans.metadata.evidenceContract` unless implementation falsifies it; `pnpm --filter @krn/db db:check`, `pnpm typecheck`, and live `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready` passed.
- [x] 2026-06-21: Completed M21 Slice 03 repository aggregate readback. Evidence: RED `@krn/db` tests failed on dropped feedback candidates and missing `getHarnessRunByExecutionRunId`, then GREEN `pnpm --filter @krn/db test` passed with 2 tests; `pnpm typecheck`, full `pnpm test`, `pnpm --filter @krn/db db:check`, and no-`any` scan passed.
- [x] 2026-06-21: Completed M21 Slice 04 explicit persisted plan. Evidence: RED CLI tests failed on implicit DB writes and missing `--persist`, GREEN `pnpm --filter @krn/cli test` passed with 11 tests, `pnpm typecheck`, full `pnpm test`, and `pnpm --filter @krn/db db:check` passed; live `krn plan --persist` created execution run `b529e20e-b8ca-4cb5-9342-58578e880945` with evidence contract metadata and one run event; DB-configured preview without `--persist` left `execution_runs` count unchanged.
- [x] 2026-06-21: Completed M21 Slice 05 persisted harness plan smoke path. Evidence: RED CLI test failed on missing `db smoke harness-plan`, GREEN `pnpm --filter @krn/cli test` passed with 12 tests, `pnpm typecheck`, full `pnpm test`, and `pnpm --filter @krn/db db:check` passed; live `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:harness-plan` created execution run `7fc256ef-2868-483c-bd3a-c3283df4b761`, read it back through the repository aggregate, verified evidence contract commands `3` and run events `1`, and cleaned up with remaining marker count `0`.
- [x] 2026-06-21: Completed M21 Slice 06 persisted evidence capture. Evidence: RED CLI tests failed on missing `evidence capture --run-id --persist`, GREEN `pnpm --filter @krn/cli test` passed with 15 tests, `pnpm typecheck`, full `pnpm test`, and `pnpm --filter @krn/db db:check` passed; live capture against execution run `b529e20e-b8ca-4cb5-9342-58578e880945` persisted evidence bundle `41b27f25-efb7-48ed-92ad-00fb88cdf7c4`, review assessment `384bb648-dcf4-43f6-a60e-9003acff047e`, feedback delta `975e26bf-6eae-4fb8-a0ae-80352977331c`, and SQL proof showed 1 evidence bundle, 1 review assessment, 1 feedback delta, and 2 run events.
- [x] 2026-06-21: Completed M21 Slice 07 persisted evidence smoke path. Evidence: RED CLI test failed on missing `db smoke harness-evidence`, GREEN `pnpm --filter @krn/cli test` passed with 16 tests, `pnpm typecheck`, full `pnpm test`, `pnpm --filter @krn/db db:check`, no-`any` scan, and `git diff --check` passed; live `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:harness-evidence` created execution run `8db14bdf-6390-485d-9736-89274c5affff`, evidence bundle `1dbe1d1b-e537-4670-a6cb-2b878b44c7f2`, review assessment `31fe636d-5d61-402b-82bc-64d225cd0c6d`, feedback delta `7bc1b78f-4aeb-48cb-b9e5-2d8b456f1fe9`, verified linked counts `1/1/1`, run events `2`, and cleanup remaining marker count `0`.
- [x] 2026-06-21: Completed M21 Slice 08 doctor harness persistence readiness. Evidence: RED CLI test failed on missing doctor harness readiness behavior, GREEN `pnpm --filter @krn/cli test` passed with 17 tests, `pnpm typecheck`, full `pnpm test`, `pnpm --filter @krn/db db:check`, no-`any` scan, and `git diff --check` passed; no-env doctor reported harness persistence preview-only, live DB doctor reported harness persistence schema `ready (10/10 tables present)` and readiness `ready (schema present; smoke commands available)`, and direct SQL counts before/after live doctor stayed unchanged at `1,1,1,1,2`.

## Surprises & Discoveries

- Observation: The repository already has more than bootstrap docs; it also has a strict pnpm workspace and empty `core`/`cli` packages. Evidence: `package.json` has `pnpm -r --workspace-concurrency=1 typecheck`, and both packages have empty `src/index.ts` entrypoints. Implication: do not run an empty-repo bootstrap goal; continue from the TypeScript spine.
- Observation: The current `GOAL.md` still declares Commit 2 as active and later phases as typed primitives, init dry-run, context build, and review capture. Evidence: `GOAL.md` names Commit 2 as active and lists later phases. Implication: update direction so target infra, DB schema, memory/source graph, and harness compiler start now.
- Observation: Existing skills are compact and useful, but they are still bootstrap-oriented. Evidence: `to-issues` and `source-to-decision` encode bounded outputs and forbidden behavior. Implication: keep their discipline, but add or refactor operational skills around final KRN spine: target-infra-design, brain-store-schema, activation-engine, codex-adapter-plan, evidence-review-loop.
- Observation: `docs/decisions/ADR-0009-canonical-harness-spine.md` already existed in the worktree before the brain-store ADR was added. Evidence: `README.md` and `docs/KRN_KERNEL.md` reference the canonical harness spine. Implication: keep canonical harness spine as ADR-0009 and record the Postgres/pgvector brain-store decision as ADR-0010.
- Observation: The worktree had a partial `codex-adapter` lockfile importer and a root TypeScript path alias before the package shells existed. Evidence: `pnpm-lock.yaml` named `packages/codex-adapter` while `packages/codex-adapter/` was absent. Implication: regenerate the lockfile from actual package manifests and avoid speculative path aliases until imports require them.
- Observation: Drizzle ORM 0.45.2 type declarations pull optional non-Postgres dialect declarations under TypeScript 5.9 when `skipLibCheck` is false. Evidence: `@krn/db` typecheck failed on `gel`, MySQL, SingleStore, SQLite, `Buffer`, and `TextDecoder` declarations before any project-code error appeared. Implication: keep the root strict config unchanged, add a package-local `skipLibCheck` exception only in `packages/db`, and keep KRN code strict.
- Observation: Drizzle generated the pgvector column and HNSW index but did not create the `vector` extension. Evidence: `0002_shocking_post.sql` initially contained `vector(1536)` and `USING hnsw` but no `CREATE EXTENSION`. Implication: keep `packages/db/src/sql/pgvector.ts` as the explicit helper and add `CREATE EXTENSION IF NOT EXISTS vector` manually to the migration that first introduces vector columns.
- Observation: Including Vitest test files in the production schema `tsc` pass pulled Vite/Vitest browser and timer declarations into a library package. Evidence: root `pnpm typecheck` failed on `AbortSignal`, timers, `EventTarget`, and `WebSocket` after tests were added, while `pnpm test` passed. Implication: exclude `*.test.ts` from production typecheck and keep test verification in Vitest.
- Observation: Cross-package imports were first required by repository interfaces and DB adapters, not by empty package shells. Evidence: `packages/harness` now imports `@krn/core`, `packages/db` now imports `@krn/core` and `@krn/harness`, and root `tsconfig.base.json` now has package path aliases. Implication: keep aliases limited to real package boundaries and avoid speculative imports for future packages.
- Observation: Several domain fields are stored as JSONB in the first schema, especially context selections, evidence commands, review findings, source lineage, and feedback candidates. Evidence: repository mappers in `packages/db/src/repositories/mappers.ts` narrow JSON values before returning domain types. Implication: adapters remain a trust boundary; harness/core must not consume raw DB JSON rows.
- Observation: Adding a second package-local Vitest runner required a real `pnpm install`, not only `pnpm install --lockfile-only`. Evidence: the first harness RED run failed before imports with `vitest: not found`; after `pnpm install`, the intended RED failure was the missing activation module. Implication: when adding a new package-level executable dependency, refresh both lockfile and local workspace links before relying on test output.
- Observation: Weak-context tests must avoid accidental term overlap with task non-goals and inherited fixture guidance. Evidence: an intended weak memory candidate was first activated because it contained `dashboard`, then because inherited `applicationGuidance` contained `doctor readiness`. Implication: activation/compiler tests need noisy fixtures that are explicitly unrelated across summary, body, and guidance.
- Observation: Codex adapter can depend on harness/core without changing core import direction. Evidence: `packages/codex-adapter` now imports `@krn/core` and `@krn/harness`, while `rg '@krn/codex-adapter|codex-adapter' packages/core` returns no matches. Implication: Codex-native wording stays at the adapter edge and core remains executor-agnostic.
- Observation: Runtime package execution through Vitest/tsx needs package `exports`, not only TypeScript path aliases. Evidence: the first CLI RED run failed to resolve `@krn/codex-adapter` until source exports were added to the internal packages used at runtime. Implication: source-package exports are part of the workspace contract for CLI and test execution.
- Observation: Importing DB adapters into CLI pulls Drizzle declaration files into CLI typecheck. Evidence: CLI `pnpm typecheck` reproduced the known Drizzle optional-dialect declaration failures until `packages/cli/tsconfig.json` used the same package-local `skipLibCheck` exception as `packages/db`. Implication: any package that directly imports `@krn/db` may need the isolated third-party declaration exception while KRN source remains strict.
- Observation: Doctor can report useful readiness without spawning shell commands. Evidence: `krn doctor` reads repo files directly, checks optional Postgres via SQL only when configured, and reports `KRN_DATABASE_URL` absence as not configured. Implication: doctor remains safe as a read-only command and should not become a hidden quality-gate runner.
- Observation: Evidence capture needs to distinguish proof capture from proof execution. Evidence: `krn evidence capture` records changed files and expected commands but marks `pnpm typecheck`, `pnpm test`, and `git diff --check` as skipped rather than claiming it ran them. Implication: later evidence persistence should store command results only when explicitly supplied or actually run.
- Observation: `packages/workers` inherited the early package-shell `rootDir: "src"` setting, which fails once the package imports `@krn/core` through workspace source exports. Evidence: the first full `pnpm typecheck` after adding worker types failed with TS6059 for `packages/core/src/*`; matching the dependent-package tsconfig pattern fixed the failure. Implication: packages with workspace source imports should not force a package-local `rootDir` unless declarations/build output require it.
- Observation: The available multi-agent validation tool forbids spawning subagents unless the user explicitly asks for subagents or delegation. Evidence: tool metadata exposed the restriction during M17. Implication: M17 used deterministic skill-set audits and `quick_validate.py`; it does not claim subagent forward-testing.
- Observation: The first KRN-on-KRN dogfood exposed stale Codex adapter skill hints after the M17 skill refactor. Evidence: initial dogfood output still referenced removed `select-kernel-patterns`. Implication: adapter hint maps must be updated with repo-local skill topology changes and covered by tests.
- Observation: Final verification kept the bootstrap TypeScript critic but did not introduce a broad subagent system. Evidence: `.codex/agents` contains only `ts-type-critic.toml`. Implication: the original read-only critic remains allowed while broad agent sprawl stays out of the first spine.

## Decision Log

- Decision: Root `PLAN.md` becomes the living ExecPlan for the final harness spine.
  Rationale: A Goal should be a compact completion contract, not the whole product brain. A self-contained PLAN.md can hold the long-running design, progress, decisions, validation, and recovery rules.
  Date/Author: 2026-06-21 / Codex planning pass.

- Decision: PostgreSQL + pgvector is the canonical KRN brain store.
  Rationale: KRN needs one transactional state plane for schema, memory, source graph edges, vector retrieval, full-text retrieval, run ledger, outbox, worker jobs, and later dashboard read models. Starting with separate Qdrant, Neo4j, Elastic, Redis, or Kafka creates integration complexity before the product spine exists.
  Date/Author: 2026-06-21 / Codex planning pass.

- Decision: Drizzle and Zod are adopted now, not later.
  Rationale: The new direction rejects “contracts now, infra later.” Database schema and IO validation must shape the harness from the beginning.
  Date/Author: 2026-06-21 / Codex planning pass.

- Decision: `packages/core` remains pure and Codex-agnostic.
  Rationale: Codex integration is an adapter. Core domain types must survive changes to Codex surfaces, CLI rendering, MCP, hooks, and skills.
  Date/Author: 2026-06-21 / Codex planning pass.

- Decision: `requiredSkills` must not be a core TaskContract field.
  Rationale: Skills are procedural memory / capability bindings selected by a capability compiler. Task contracts should express needs and constraints, not Codex skill names.
  Date/Author: 2026-06-21 / Codex planning pass.

- Decision: No dashboard, broad eval lane, MCP server, or plugin packaging before the first DB-backed CLI vertical path.
  Rationale: The prior failure mode was artifact factory and dashboard/benchmark theater. The first proof must be a working harness path.
  Date/Author: 2026-06-21 / Codex planning pass.

- Decision: Use `drizzle-orm` 0.45.2, `drizzle-kit` 0.31.10, and `postgres` 3.4.9 for the first DB schema slice.
  Rationale: Drizzle's current PostgreSQL docs support both `pg` and `postgres.js` drivers, drizzle-kit owns migration generation/checking, and Drizzle documents pgvector support while requiring explicit extension migration setup. `postgres.js` keeps the first adapter dependency small; pgvector extension SQL is deferred until vector columns are introduced.
  Date/Author: 2026-06-21 / Codex DB schema pass.

- Decision: `packages/db` uses a package-local `skipLibCheck` exception.
  Rationale: Drizzle 0.45.2 declaration files expose optional dialect and peer declarations that fail this repo's strict dependency declaration check under TypeScript 5.9. The exception is isolated to third-party declaration checking in the DB package; KRN source remains strict and the root `skipLibCheck: false` stays unchanged.
  Date/Author: 2026-06-21 / Codex DB schema pass.

- Decision: The first embeddings table uses a 1536-dimension pgvector column and records model dimensions separately.
  Rationale: Drizzle's vector column requires a fixed dimension. The schema records provider/model/dimension metadata and can add a later migration if KRN standardizes on another embedding dimension.
  Date/Author: 2026-06-21 / Codex retrieval schema pass.

- Decision: Full-text search uses a custom Drizzle `tsvector` column helper plus a GIN index.
  Rationale: Drizzle does not expose a native `tsvector` helper in this package version. A local helper keeps the PostgreSQL full-text plan explicit without adding a separate search store.
  Date/Author: 2026-06-21 / Codex retrieval schema pass.

- Decision: Test files are excluded from package production `tsc` and verified by Vitest.
  Rationale: The package `typecheck` script should protect exported library code without importing Vitest/Vite runtime declarations into production compiler settings. Boundary behavior remains covered by `pnpm test`.
  Date/Author: 2026-06-21 / Codex schema validation pass.

- Decision: Repository ports live in `packages/harness`; Postgres adapters live in `packages/db`.
  Rationale: The repository contracts are harness-facing capabilities, while Drizzle schema, transactions, mappers, and Postgres details belong to the DB package. This preserves `packages/core` as pure domain types and keeps CLI/Codex surfaces out of state access.
  Date/Author: 2026-06-21 / Codex repository adapter pass.

- Decision: State writes that pair with version, run-event, or outbox records are implemented as DB transactions.
  Rationale: Memory record creation must preserve its initial version, execution/evidence status changes must preserve run ledger evidence, and review feedback/source-memory candidate creation must preserve outbox visibility. The first spine should not create state without its audit/work signal when both are part of the same operation.
  Date/Author: 2026-06-21 / Codex repository adapter pass.

- Decision: Activation is pure harness logic over candidate records, not DB queries or Codex rendering.
  Rationale: Repository adapters supply candidates, the activation engine ranks and filters them, and later compiler/adapter layers decide how to render the selected context. Keeping activation pure makes exclusions reviewable and prevents CLI, DB, or Codex surfaces from becoming hidden selection policy.
  Date/Author: 2026-06-21 / Codex activation engine pass.

- Decision: Source claims with blank `doesNotProve` are excluded during context assembly.
  Rationale: The kernel decision rule requires source -> mechanism -> KRN implication -> decision/rejection and explicit limits. A source claim without `doesNotProve` is not safe to activate even if it scores highly.
  Date/Author: 2026-06-21 / Codex activation engine pass.

- Decision: The harness compiler accepts resolved workspace/project IDs; CLI slug resolution is deferred to the CLI slice.
  Rationale: M11 should compile a harness plan through repository ports without becoming a CLI parser or project resolver. The schema layer already validates external operator input, while the CLI can later map workspace/project slugs to IDs before calling the compiler.
  Date/Author: 2026-06-21 / Codex harness compiler pass.

- Decision: Evidence contract is a harness artifact, not an `EvidenceBundle`.
  Rationale: An `EvidenceBundle` records proof after execution. M11 needs pre-execution expectations for typecheck, tests, diff risk, review burden, and rollback path; execution capture remains a later CLI/evidence milestone.
  Date/Author: 2026-06-21 / Codex harness compiler pass.

- Decision: Codex adapter output is plain text plus small helper renderers, not a runtime Codex invocation.
  Rationale: M12 should prepare a bounded brief that a CLI can display and a future adapter can pass along. Calling Codex, writing files, implementing MCP, or mutating memory would cross into execution/runtime surfaces that are explicitly later.
  Date/Author: 2026-06-21 / Codex adapter renderer pass.

- Decision: `krn plan --task` supports a no-store preview when `KRN_DATABASE_URL` is absent.
  Rationale: The command must be runnable in the current workspace without pretending that file-backed memory or `.krn` truth exists. The output explicitly says persistence is disabled and uses empty memory/source repositories; when `KRN_DATABASE_URL` exists, the CLI resolves workspace/project rows and uses the Drizzle-backed repositories.
  Date/Author: 2026-06-21 / Codex CLI vertical path pass.

- Decision: CLI argument parsing stays manual for M13.
  Rationale: The first command needs only `plan --task`; adding a parser dependency before more commands exist would not improve the contract enough to justify another runtime dependency.
  Date/Author: 2026-06-21 / Codex CLI vertical path pass.

- Decision: `krn doctor` is read-only inspection, not command execution.
  Rationale: Doctor should explain readiness and remediation without mutating repo state or running quality gates behind the user's back. Typecheck/test remain explicit verification commands, while doctor reads configuration, package files, and optional DB status.
  Date/Author: 2026-06-21 / Codex read-only doctor pass.

- Decision: `krn evidence capture` prints evidence when no execution run is configured.
  Rationale: Evidence capture must be useful on the current worktree but must not invent an `ExecutionRun` or mutate Memory Core. When `KRN_DATABASE_URL` and `KRN_EXECUTION_RUN_ID` are absent, the command clearly reports printed-only persistence.
  Date/Author: 2026-06-21 / Codex evidence capture pass.

- Decision: Worker skeleton behavior is enqueue/describe only.
  Rationale: M16 needs typed maintenance job contracts and a verifiable enqueue handoff to `worker_jobs` plus `outbox_events`, not a long-running daemon. Actual job execution, leasing, retries, and runtime worker commands are later behavior.
  Date/Author: 2026-06-21 / Codex worker skeleton pass.

- Decision: Repo-local skills now target operational harness disciplines, not broad planning meta-work.
  Rationale: M17 should help future Codex runs build the final KRN spine: target infrastructure ADRs, brain-store schema, activation, Codex adapter rendering, evidence review, source decisions, TypeScript safety, and handoff continuity. The broader bootstrap planning skills were removed to reduce trigger ambiguity and context drift.
  Date/Author: 2026-06-21 / Codex operational skill refactor pass.

- Decision: `krn doctor` reports derived brain-store readiness.
  Rationale: The operator needs one line that distinguishes no-store preview from reachable/ready persisted harness state. The check is derived from existing Postgres, pgvector, and migration checks and does not create DB state or run migrations.
  Date/Author: 2026-06-21 / Codex dogfood pass.

## Outcomes & Retrospective

Update this section after each major milestone.

Current outcome: Milestone 0 installed the root `PLAN.md` as the living ExecPlan and compacted `GOAL.md` into the activation contract. Milestone 1 added the canonical harness-spine ADR, the PostgreSQL/pgvector brain-store ADR, and the package boundary map. Milestone 2 added the final harness package shells without runtime behavior. Milestones 4 through 6 added the first Drizzle/Postgres harness, memory, source graph, retrieval, and activation schemas with generated SQL migrations. Milestones 3 and 7 added the first real boundary tests and Zod IO validation schemas. Milestone 8 added the pure core domain model. Milestone 9 added harness repository ports and Drizzle-backed Postgres adapters with typed DB-to-domain mappers. Milestone 10 added the pure activation engine and tests for small high-signal selection, invalidated-memory exclusion, source safety, and explicit exclusion records. Milestone 11 added the harness compiler over repository ports with retrieval trace persistence, weak-context abstention, capability planning, Codex adapter plan references, and evidence contracts. Milestone 12 added the Codex adapter renderer as a pure text-rendering edge. Milestone 13 added the first CLI vertical path for `krn plan --task`. Milestone 14 added the read-only `krn doctor`. Milestone 15 added printed evidence capture with clean-tree behavior and no memory mutation. Milestone 16 added typed maintenance worker job skeletons with enqueue/outbox handoff and no background loop. Milestone 17 aligned repo-local skills with the final harness spine. Milestone 18 used the harness on KRN itself and recorded the first dogfood run. Milestone 19 added final handoff docs and verification evidence. M20 proved local Postgres/pgvector migration readiness and a minimal persistence smoke path. M21 is now active and has a preflight ledger.

Current gaps: M21 still needs full persisted evidence-loop smoke/readback/cleanup proof. Full MemoryStore, SourceStore, eval persistence, and worker execution remain later scope.

## Plan of Work

Work in small vertical slices. Each slice should compile before moving on. Commit after each accepted slice using Conventional Commits. Never hide broken state behind future slices.

### Milestone 0 — Install the Final Plan and Close Bootstrap

Add this file at repository root as `PLAN.md`. Update `GOAL.md` so it is no longer the bootstrap product brain. It should contain only the compact Codex Goal activation contract, current non-goals, and pointer to `PLAN.md` for the living execution plan. Update `README.md` current phase to say the repo is moving from Commit 2 bootstrap into the final Postgres-backed harness spine.

Edit these files:

- `PLAN.md`: add this file.
- `GOAL.md`: replace the long bootstrap-phase roadmap with the compact Goal and pointer to `PLAN.md`.
- `README.md`: update Current Phase from Commit 2 bootstrap to “Final Harness Spine planning installed; next slice is brain-store ADR and package boundaries.”
- `AGENTS.md`: add one short sentence: “For complex KRN implementation work, keep root PLAN.md current as the living ExecPlan.” Keep AGENTS short.

Run:

    pnpm typecheck

Expected result:

    all workspace packages typecheck successfully

Acceptance:

- `PLAN.md` exists.
- `GOAL.md` is compact and not the architecture backlog.
- `AGENTS.md` remains short.
- No runtime behavior is added.
- `pnpm typecheck` passes.

Commit:

    docs(plan): add final KRN harness spine plan

### Milestone 1 — Brain Store ADR and Package Boundary ADR

Create a new ADR for the target data plane and a concise architecture note for packages.

Add:

- `docs/decisions/ADR-0010-brain-store-postgres-pgvector.md`
- `docs/architecture/package-boundaries.md`

`ADR-0010-brain-store-postgres-pgvector.md` must decide:

- PostgreSQL + pgvector is canonical KRN state.
- Graph is relational edge tables first.
- Vector search is pgvector.
- Lexical search is PostgreSQL full-text search.
- Async is PostgreSQL outbox and job tables first.
- PGlite or Docker Postgres may be used for local/test.
- Qdrant, Neo4j, LanceDB, Elastic/OpenSearch, Redis, and Kafka are rejected for first implementation.
- Markdown and `.krn` are not Memory Core.

`docs/architecture/package-boundaries.md` must name each package, what it owns, and what it must not import.

Run:

    pnpm typecheck

Acceptance:

- ADR exists and is clear enough that later implementation does not debate the canonical store.
- Package boundary doc exists.
- No new dependencies are added in this milestone.
- `pnpm typecheck` passes.

Commit:

    docs(adr): choose Postgres pgvector brain store

### Milestone 2 — Expand Workspace Shells Without Behavior

Create package shells for the final spine:

- `packages/schema`
- `packages/db`
- `packages/harness`
- `packages/codex-adapter`
- `packages/workers`

Each package should contain:

- `package.json`
- `tsconfig.json`
- `src/index.ts`

Package names:

- `@krn/schema`
- `@krn/db`
- `@krn/harness`
- `@krn/codex-adapter`
- `@krn/workers`

Use the existing strict base config. Export nothing initially except safe placeholders if TypeScript needs a module boundary. Do not add API or dashboard packages.

Run:

    pnpm typecheck

Acceptance:

- Workspace includes all final spine packages.
- All packages typecheck.
- `packages/core` remains dependency-free.
- No runtime behavior is implemented yet.

Commit:

    build: add final harness workspace packages

### Milestone 3 — Add Test Tooling for Real Boundaries

Add Vitest only when there is a boundary to protect. Start with minimal tests around pure domain fixtures and schema parsing once those exist. If adding the runner before tests, keep it lightweight and explain why in the Decision Log.

Likely edits:

- root `package.json`: add `test` script such as `pnpm -r --workspace-concurrency=1 test` only after at least one package has tests.
- relevant package `package.json` files: add local `test` scripts.
- `vitest.config.ts` only if shared configuration is useful.

Acceptance:

- Tests are not added as theater.
- Every test protects a real boundary: no runtime markdown memory, no `requiredSkills` in core, schema rejects untrusted invalid input, activation rejects context dumps, or source claims require `doesNotProve`.
- `pnpm typecheck` passes.
- `pnpm test` passes once introduced.

Commit:

    test: add boundary tests for KRN spine

### Milestone 4 — Drizzle/Postgres Schema Foundation

Add Drizzle and a Postgres driver. Prefer `postgres` or `pg` after checking Drizzle’s current compatibility and keeping the adapter thin. Add drizzle-kit for migration generation.

Edit:

- root `package.json`: add dev/build scripts only as needed, such as `db:generate` and `db:check`.
- `packages/db/package.json`: add Drizzle dependencies.
- `packages/db/src/schema/harness.ts`: harness tables.
- `packages/db/src/schema/events.ts`: event and outbox tables.
- `packages/db/src/schema/index.ts`: export schemas.
- `packages/db/src/migrations/`: generated SQL migrations if drizzle-kit is configured.

Add schema for:

- `workspaces`
- `projects`
- `repo_installations`
- `project_kernels`
- `operator_intents`
- `task_contracts`
- `harness_plans`
- `context_assemblies`
- `execution_runs`
- `evidence_bundles`
- `review_assessments`
- `feedback_deltas`
- `run_events`
- `outbox_events`
- `worker_jobs`

Design notes:

- Use UUID primary keys.
- Use timestamps with timezone semantics.
- Use JSONB for flexible metadata only when the shape is not yet stable.
- Keep important query/filter fields relational.
- Use enums or text unions consistently; do not hide everything in JSON.
- `run_events` should support append-only event ledger semantics.
- `outbox_events` should include status, payload, attempts, available_at, and last_error.

Run:

    pnpm typecheck
    pnpm --filter @krn/db db:generate

Expected result:

    schema compiles and migration generation succeeds

Acceptance:

- Schema compiles.
- Migrations are generated or the migration command is clearly documented if no DB connection is required.
- No business logic is implemented in DB schema files.
- No separate queue or store is introduced.

Commit:

    feat(db): add canonical harness schema

### Milestone 5 — Memory and Source Graph Schema

Add memory and source graph schema in `packages/db`.

Add files:

- `packages/db/src/schema/memory.ts`
- `packages/db/src/schema/sources.ts`

Memory tables:

- `memory_records`
- `memory_record_versions`
- `memory_edges`
- `memory_candidates`
- `memory_applications`
- `memory_feedback_events`
- `anti_memory_records`
- `memory_activation_traces`

Source graph tables:

- `source_artifacts`
- `source_chunks`
- `source_claims`
- `source_claim_edges`
- `source_decisions`
- `source_rejections`
- `source_snapshots`

Rules to encode in schema or repository validation:

- Memory records require source lineage unless explicitly marked as user preference.
- Memory records require confidence, owner, application guidance, validity/invalidation fields, and feedback counters.
- Source claims require mechanism, KRN implication, `doesNotProve`, trust tier, support type, and consumer.
- Anti-memory is first-class, not a comment field.

Run:

    pnpm typecheck
    pnpm --filter @krn/db db:generate

Acceptance:

- Memory and source graph schema compile.
- Migration includes the new tables.
- There is no markdown memory runtime path.

Commit:

    feat(db): add memory and source graph schema

### Milestone 6 — Retrieval and Activation Schema

Add retrieval/search/activation schema.

Add file:

- `packages/db/src/schema/retrieval.ts`

Tables:

- `embedding_models`
- `embeddings`
- `search_documents`
- `retrieval_runs`
- `retrieval_candidates`
- `activation_decisions`
- `context_items`
- `context_exclusions`

Design notes:

- Include a pgvector column plan. If Drizzle vector support requires custom SQL, isolate it in `packages/db/src/sql/pgvector.ts` and document it.
- Include PostgreSQL full-text search column plan. If generated tsvector columns require raw SQL, isolate it in migrations and document why.
- Include metadata filters, trust tier, TTL/validity fields, invalidation status, and ranking scores.
- `context_exclusions` is as important as `context_items`; KRN wins by not reading 99 percent of available material.

Run:

    pnpm typecheck
    pnpm --filter @krn/db db:generate

Acceptance:

- Retrieval schema compiles.
- No separate vector or search DB is added.
- Context inclusions and exclusions are modeled explicitly.

Commit:

    feat(db): add retrieval and activation schema

### Milestone 7 — Zod IO Schemas

Implement unknown-first validation in `packages/schema`.

Add files:

- `packages/schema/src/operatorIntent.ts`
- `packages/schema/src/taskContract.ts`
- `packages/schema/src/memoryCandidate.ts`
- `packages/schema/src/sourceClaim.ts`
- `packages/schema/src/harnessCompile.ts`
- `packages/schema/src/evidenceCapture.ts`
- `packages/schema/src/index.ts`

Schemas:

- `OperatorIntentInputSchema`
- `TaskContractInputSchema`
- `MemoryCandidateInputSchema`
- `SourceClaimInputSchema`
- `HarnessCompileInputSchema`
- `EvidenceCaptureInputSchema`

Rules:

- Public parse functions accept `unknown`.
- Parsed values become typed domain inputs.
- Do not export `any`.
- Source claim input must require `mechanism`, `krnImplication`, and `doesNotProve`.
- Memory candidate input must require `sourceLineage`, `confidence`, `owner`, and `applicationGuidance`, or explicitly mark the memory as user preference.

Run:

    pnpm typecheck
    pnpm test

Acceptance:

- Invalid CLI/source/memory inputs are rejected in tests.
- Valid minimal inputs parse.
- No schema imports DB code.

Commit:

    feat(schema): add harness IO validation schemas

### Milestone 8 — Pure Core Domain Model

Implement core domain types in `packages/core`. Keep them pure.

Add files under `packages/core/src/`:

- `ids.ts`
- `time.ts`
- `operatorIntent.ts`
- `taskContract.ts`
- `harnessPlan.ts`
- `contextAssembly.ts`
- `capabilityPlan.ts`
- `codexAdapterPlanRef.ts`
- `executionRun.ts`
- `evidenceBundle.ts`
- `reviewAssessment.ts`
- `feedbackDelta.ts`
- `memory.ts`
- `source.ts`
- `policy.ts`
- `eval.ts`
- `index.ts`

Types:

- `OperatorIntent`
- `TaskContract`
- `HarnessPlan`
- `ContextAssembly`
- `ContextInclusion`
- `ContextExclusion`
- `CapabilityRequirement`
- `CapabilityPlan`
- `CodexAdapterPlanRef`
- `ExecutionRun`
- `EvidenceBundle`
- `ReviewAssessment`
- `FeedbackDelta`
- `MemoryRecord`
- `MemoryCandidate`
- `AntiMemoryRecord`
- `SourceClaim`
- `SourceDecisionEdge`
- `PolicyGate`
- `PolicyGateResult`
- `ToolBoundary`
- `EvalCandidate`

Rules:

- No DB imports.
- No CLI imports.
- No filesystem imports.
- No process/env imports.
- No Codex skill names in core.
- No `requiredSkills` field in `TaskContract`.
- Public types must be explicit and strict.

Run:

    pnpm typecheck
    grep -R "requiredSkills" packages/core && exit 1 || true

Acceptance:

- Types compile.
- Core remains pure.
- The grep command finds no `requiredSkills` in `packages/core`.

Commit:

    feat(core): add final harness domain model

### Milestone 9 — Repository Interfaces and Postgres Adapters

Define repository interfaces in a package that does not pollute core. Prefer `packages/harness` for ports and `packages/db` for adapters, or `packages/core` for pure port types only if they remain IO-free abstractions. Do not implement fake in-memory architecture as the final route.

Interfaces:

- `ProjectRepository`
- `MemoryRepository`
- `SourceRepository`
- `HarnessRunRepository`
- `EventLedgerRepository`
- `OutboxRepository`
- `RetrievalRepository`

Adapters in `packages/db`:

- `DrizzleProjectRepository`
- `DrizzleMemoryRepository`
- `DrizzleSourceRepository`
- `DrizzleHarnessRunRepository`
- `DrizzleEventLedgerRepository`
- `DrizzleOutboxRepository`
- `DrizzleRetrievalRepository`

Rules:

- Repositories return domain types, not raw DB rows.
- Writes that create state should also append run/audit events where appropriate.
- Use transactions for state + event/outbox writes.
- Keep SQL escape hatches isolated and documented.

Run:

    pnpm typecheck
    pnpm test

Acceptance:

- Repository methods compile.
- Core has no DB imports.
- Tests can use mocked ports or a PGlite/test Postgres adapter if available, but tests must not imply fake memory is final architecture.

Commit:

    feat(db): add Postgres repository adapters

### Milestone 10 — Activation Engine

Implement activation in `packages/harness`.

Add files:

- `packages/harness/src/activation/memoryQuery.ts`
- `packages/harness/src/activation/sourceQuery.ts`
- `packages/harness/src/activation/rankCandidates.ts`
- `packages/harness/src/activation/trustFilter.ts`
- `packages/harness/src/activation/temporalFilter.ts`
- `packages/harness/src/activation/contextRoi.ts`
- `packages/harness/src/activation/assembleContext.ts`
- `packages/harness/src/activation/index.ts`

Functions:

- `buildMemoryQuery(task: TaskContract): MemoryQuery`
- `buildSourceQuery(task: TaskContract): SourceQuery`
- `rankCandidates(candidates, query): RankedCandidate[]`
- `applyTrustFilter(candidates, policy): Candidate[]`
- `applyTemporalFilter(candidates, now): Candidate[]`
- `applyContextROI(candidates, budget): Candidate[]`
- `assembleContext(input): ContextAssembly`

Behavior:

- Select a small working set.
- Record explicit exclusions.
- Every inclusion has a reason and expected use.
- Memory can abstain.
- Source can abstain.
- Stale, invalidated, low-trust, or irrelevant items are excluded with reasons.
- Do not context dump.

Tests:

- A noisy fixture selects a small high-signal working set.
- Invalidated memory is excluded.
- Source claims without `doesNotProve` are not eligible.
- Activation records both inclusions and exclusions.

Run:

    pnpm typecheck
    pnpm test

Acceptance:

- Activation engine compiles and passes tests.
- Context assembly is reviewable.
- No markdown memory path is introduced.

Commit:

    feat(harness): add activation engine

### Milestone 11 — Harness Compiler

Implement the compiler that turns operator intent into a Codex-ready plan without invoking Codex.

Add files:

- `packages/harness/src/compiler/compileHarnessPlan.ts`
- `packages/harness/src/compiler/createTaskContract.ts`
- `packages/harness/src/compiler/createCapabilityPlan.ts`
- `packages/harness/src/compiler/createEvidenceContract.ts`
- `packages/harness/src/compiler/index.ts`

Flow:

    OperatorIntent
      -> TaskContract
      -> HarnessPlan
      -> ContextAssembly
      -> CapabilityPlan
      -> CodexAdapterPlanRef
      -> EvidenceContract

Rules:

- Use repositories and activation engine.
- Persist activation trace and harness plan.
- Do not invoke Codex.
- Do not mutate memory automatically.
- Do not spawn agents.
- Do not write markdown memory.

Tests:

- Golden fixture flows through compiler.
- Weak context produces abstain/exclusion records rather than broad rereads.
- Evidence contract includes typecheck/test/diff-risk/review-burden expectations.

Run:

    pnpm typecheck
    pnpm test

Acceptance:

- Compiler output has final harness shape.
- The compiler can be called by CLI later.
- Core remains Codex-agnostic.

Commit:

    feat(harness): add Postgres-backed harness compiler

### Milestone 12 — Codex Adapter Renderer

Implement rendering in `packages/codex-adapter`.

Add files:

- `packages/codex-adapter/src/renderExecutionBrief.ts`
- `packages/codex-adapter/src/renderGoalReference.ts`
- `packages/codex-adapter/src/renderExecPlanReference.ts`
- `packages/codex-adapter/src/renderSkillHints.ts`
- `packages/codex-adapter/src/renderHookExpectations.ts`
- `packages/codex-adapter/src/index.ts`

Renderer output should include:

- objective;
- non-goals;
- selected context inclusions;
- selected context exclusions;
- capability plan;
- policy/tool boundaries;
- evidence contract;
- next action;
- references to Goal/ExecPlan when appropriate.

Rules:

- Codex-specific names and surfaces live here, not in core.
- Renderer does not call Codex.
- Renderer does not mutate memory.
- Renderer does not implement MCP server.

Tests:

- Sample CodexAdapterPlan output is stable enough to review.
- No Codex adapter imports appear in `packages/core`.

Run:

    pnpm typecheck
    pnpm test

Acceptance:

- Execution brief is human-readable and bounded.
- Output includes explicit exclusions and evidence requirements.

Commit:

    feat(codex): add adapter plan renderer

### Milestone 13 — CLI Vertical Path: `krn plan --task`

Implement the first user-facing behavior in `packages/cli`.

Command:

    krn plan --task "..."

Behavior:

- Parse args manually or with a tiny dependency only if justified.
- Validate input through `packages/schema`.
- Load config for database connection or test/local adapter.
- Call harness compiler.
- Persist run state if DB is configured.
- Output execution brief, context inclusions/exclusions, evidence contract, and next action.

It must not:

- call Codex;
- spawn agents;
- create `.krn` truth;
- write runtime markdown memory;
- create dashboard;
- bypass schema validation.

Example expected output shape:

    KRN Plan
    Task: improve KRN doctor brain store readiness
    Context included: <n>
    Context excluded: <n>
    Evidence expected: pnpm typecheck, doctor output, diff risk, rollback path
    Next action: implement the smallest missing doctor check

Run:

    pnpm typecheck
    pnpm test
    pnpm --filter @krn/cli krn plan --task "improve KRN doctor brain store readiness"

Acceptance:

- Command runs.
- Output is bounded and final-pattern shaped.
- No forbidden surfaces are created.

Commit:

    feat(cli): add Postgres-backed harness plan command

### Milestone 14 — Read-Only Doctor

Implement:

    krn doctor

Checks:

- Postgres connection/config status.
- pgvector availability when DB is configured.
- migration status if DB is configured.
- AGENTS.md compactness.
- no runtime markdown memory.
- no `.krn` memory truth.
- TypeScript strictness.
- workspace package status.
- skills surface status.
- hooks surface status, if hooks are introduced later.
- forbidden surfaces absent.

Rules:

- Doctor is read-only.
- Doctor prints clear remediation.
- Doctor failure should not mutate repo state.

Run:

    pnpm typecheck
    pnpm test
    pnpm --filter @krn/cli krn doctor

Acceptance:

- Doctor command runs.
- Doctor reports current brain-store readiness honestly.
- Doctor fails or warns if forbidden surfaces exist.

Commit:

    feat(cli): add KRN brain store doctor

### Milestone 15 — Evidence Capture

Implement:

    krn evidence capture

Behavior:

- Record changed files.
- Record commands run if provided or detectable.
- Record typecheck/test status.
- Record diff risk.
- Record review burden.
- Record rollback path.
- Create feedback candidates.
- Append run event.

Rules:

- No automatic memory application.
- Memory writes are candidates unless explicitly accepted.
- Evidence capture can run on a clean tree and say so.

Run:

    pnpm typecheck
    pnpm test
    pnpm --filter @krn/cli krn evidence capture

Acceptance:

- Command runs on clean tree.
- Evidence bundle is persisted or printed depending on DB config.
- No memory mutation except explicit candidate creation.

Commit:

    feat(cli): add evidence capture with feedback candidates

### Milestone 16 — Worker Skeleton

Implement worker job types, not long-running daemon behavior.

Add in `packages/workers`:

- `embed_source_chunk`
- `compact_memory`
- `detect_contradiction`
- `expire_stale_memory`
- `promote_eval_candidate`

Rules:

- Use Postgres `worker_jobs` and `outbox_events` tables.
- No Redis.
- No Kafka.
- No infinite worker loop unless explicitly invoked in a command with safe stop behavior.
- Job payloads are typed.

Run:

    pnpm typecheck
    pnpm test

Acceptance:

- Job types compile.
- Worker skeleton can enqueue/describe jobs.
- No background process is required to verify this milestone.

Commit:

    feat(workers): add KRN maintenance job skeleton

### Milestone 17 — Operational Skill Refactor

Refactor repo-local skills only after the core harness direction is encoded. Keep existing useful skills if they still reduce ambiguity and review burden. Remove or replace skills that are bootstrap-only or too broad.

Target internal skill set:

- `target-infra-adr`: turns architecture choices into ADRs and explicit rejections.
- `brain-store-schema`: designs Drizzle/Postgres schema with lineage, TTL, invalidation, and outbox semantics.
- `activation-engine`: selects context with inclusions, exclusions, trust, time, and context ROI.
- `codex-adapter-plan`: renders bounded Codex briefs without leaking into core.
- `evidence-review-loop`: captures diff risk, review burden, rollback, and feedback candidates.
- keep `source-to-decision` if it continues to prevent decorative sources.
- keep `typescript-type-safety` if it continues to protect unknown-first boundaries.
- keep `handoff-compact` if it produces first-screen resumability.

Rules:

- Skills remain engineering disciplines, not KRN marketing.
- No stack-agent zoo.
- Skill frontmatter remains compact.
- Each skill has trigger, workflow, output, forbidden behavior, and verification.

Run:

    pnpm typecheck

Acceptance:

- Skills align with final product spine.
- No skill duplicates product docs.
- No broad subagent system is introduced.

Commit:

    docs(skills): align operational skills with harness spine

### Milestone 18 — Dogfood KRN on KRN

Run the first product dogfood task:

    pnpm --filter @krn/cli krn plan --task "improve KRN doctor brain store readiness"

Then:

- inspect ContextAssembly;
- inspect context exclusions;
- inspect EvidenceContract;
- implement the smallest doctor improvement suggested by the plan;
- run `pnpm typecheck` and `pnpm test` if available;
- run `krn doctor`;
- run `krn evidence capture`;
- create `FeedbackDelta` or printed feedback candidate output.

Record the run in:

- `docs/runs/2026-06-21-first-postgres-backed-harness-dogfood.md`

The dogfood record must include:

- task;
- plan output summary;
- included context;
- excluded context;
- commands run;
- changed files;
- review burden;
- diff risk;
- rollback path;
- memory/source/eval candidates;
- what the dogfood proved;
- what it did not prove.

Acceptance:

- Dogfood record exists.
- The product has been used on itself.
- Review burden and diff risk are recorded.
- Next safest action is clear.

Commit:

    docs(run): record first Postgres-backed harness dogfood

### Milestone 19 — Final Handoff and Verification

Add handoff docs only after the dogfood run exists.

Add or update:

- `docs/handoff/progress.md`
- `docs/handoff/handoff.md`
- `docs/handoff/decisions.md`
- `docs/handoff/blockers.md`
- `docs/handoff/verification.md`
- `GOAL.md` operational skill-use constraints

Each file must be short and action-oriented. Do not create a new artifact factory.

Final verification commands:

    pnpm typecheck
    pnpm test
    pnpm --filter @krn/cli krn plan --task "improve KRN doctor brain store readiness"
    pnpm --filter @krn/cli krn doctor
    pnpm --filter @krn/cli krn evidence capture
    find . -maxdepth 3 -type d | sort
    grep -R "requiredSkills" packages/core && exit 1 || true

Final forbidden-surface verification:

- no dashboard UI;
- no `apps/` unless explicitly accepted in a later revision;
- no separate vector/graph/search/queue store;
- no runtime markdown memory;
- no `.krn` truth;
- no broad eval suite;
- no broad subagent system;
- no Codex adapter imports in `packages/core`.

Commit:

    docs(run): add final KRN infra handoff

## Concrete First Next Action

The first implementation action after committing this plan is Milestone 0.

Do exactly this:

1. Create root `PLAN.md` from this file.
2. Replace `GOAL.md` with a compact Goal activation contract and pointer to `PLAN.md`.
3. Add one sentence to `AGENTS.md` telling Codex to keep `PLAN.md` current for complex KRN implementation work.
4. Update `README.md` Current Phase.
5. Run `pnpm typecheck`.
6. Commit `docs(plan): add final KRN harness spine plan`.

Do not add Drizzle, Zod, new packages, or runtime code in the same commit. Keep the review diff small.

## Validation and Acceptance for the Whole Plan

The plan is complete only when all of the following are true:

- `pnpm typecheck` passes.
- `pnpm test` passes if tests have been introduced.
- `krn plan --task "improve KRN doctor brain store readiness"` runs and outputs final-pattern plan data.
- `krn doctor` runs read-only and reports brain-store readiness.
- `krn evidence capture` runs and records or prints evidence without automatic memory mutation.
- Drizzle schema and migrations exist for harness, memory, source, retrieval, run events, outbox, and worker jobs.
- Zod schemas parse unknown input at CLI/API boundaries.
- Core domain model is pure and Codex-agnostic.
- Activation engine selects bounded context and records exclusions.
- Codex adapter renderer produces a bounded execution brief.
- A dogfood run is recorded.
- No forbidden surfaces are present.

## Idempotence and Recovery

Every milestone is additive and should leave the repository in a typechecking state. If a milestone fails midway, revert only the files touched in that milestone or split the milestone into a smaller follow-up. Do not proceed to the next milestone with a broken typecheck.

Database migrations should be generated in small slices. If a migration is wrong before it has been shared, regenerate it in the same milestone and record the reason in the Decision Log. If a migration has already been shared, add a corrective migration rather than silently rewriting history unless the repo is explicitly still in local bootstrap and the user approves history rewriting.

If a dependency choice becomes problematic, document the attempted path, error output, and replacement decision in `Surprises & Discoveries` and `Decision Log` before switching.

If context becomes too broad, stop and use the activation-engine principle manually: name what is included, what is excluded, and why.

## Interfaces and Dependencies

Initial dependencies:

- TypeScript is already present and remains strict.
- pnpm is already the package manager.

Dependencies to add when their milestone begins:

- Drizzle ORM and drizzle-kit in the DB milestone.
- A PostgreSQL driver in the DB milestone.
- Zod in the schema milestone.
- Vitest in the first real boundary-test milestone.

Do not add dependencies speculatively. Each dependency must serve the milestone being implemented.

Important interfaces to exist by the end:

    interface ProjectRepository { ... }
    interface MemoryRepository { ... }
    interface SourceRepository { ... }
    interface HarnessRunRepository { ... }
    interface EventLedgerRepository { ... }
    interface OutboxRepository { ... }
    interface RetrievalRepository { ... }

    function buildMemoryQuery(task: TaskContract): MemoryQuery
    function buildSourceQuery(task: TaskContract): SourceQuery
    function assembleContext(input: AssembleContextInput): ContextAssembly
    function compileHarnessPlan(input: HarnessCompileInput): Promise<HarnessCompileResult>
    function renderExecutionBrief(plan: CodexAdapterPlan): string

The exact signatures may evolve, but any change must preserve the canonical flow and be recorded in the Decision Log.

## Artifacts and Notes

Expected final tree shape at a high level:

    .agents/skills/
    .codex/agents/
    docs/
    packages/core/
    packages/schema/
    packages/db/
    packages/harness/
    packages/codex-adapter/
    packages/cli/
    packages/workers/
    PLAN.md
    GOAL.md
    AGENTS.md
    README.md
    package.json
    pnpm-workspace.yaml
    tsconfig.base.json

Not expected yet:

    apps/
    packages/api/
    packages/dashboard/
    .krn/
    runtime markdown memory folders
    qdrant/neo4j/redis/kafka infrastructure
    broad eval or benchmark suites

## Change Notes

2026-06-21: Initial PLAN.md drafted from current repository state, project doctrine, user-provided final infra direction, and Codex Goal/ExecPlan patterns. The plan begins from the existing kernel workspace rather than an empty repository and makes PostgreSQL + pgvector the first implementation spine.
