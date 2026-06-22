# KRN Memory Brain — Controlled PLAN.md

This PLAN.md is a living execution plan for completing the KRN Memory Brain after M27 and MM-00.

It is written in the style of the OpenAI Cookbook PLANS.md / ExecPlan pattern:
- self-contained enough for a fresh Codex run to resume from this file;
- progress, surprises, decisions, and outcomes must stay current;
- every milestone must produce observable behavior, not just files;
- each slice is small, independently verifiable, and ends with evidence;
- when a slice completes, update this file before committing.

This plan deliberately removes the previous Research Foundry / Pattern Vault / meta-researcher architecture. External materials, courses, Cookbook pages, and local notes may inform decisions, but they do not become product subsystems. Memory behavior is tested through golden tasks and dogfood evals inside the normal eval lane.

The product being built is:

    KRN is a Postgres-backed Codex Operating Layer / AI Engineering Control Plane.
    Codex executes. KRN supplies bounded context, source-grounded memory,
    policy gates, evidence capture, review feedback, and a learning loop.

## Purpose / Big Picture

After this plan is complete, a user can initialize or connect a target repository, ask KRN to plan a Codex task, receive a small source-grounded context packet, run Codex, capture evidence and review feedback, create sourced observations from that run, reflect those observations into candidates, promote reviewed candidates into governed memory, and then prove through golden tasks that KRN avoids stale memory, broad context dumps, unsupported decisions, and hidden runtime truth.

The visible end-to-end behavior is:

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

The plan is finished only when this loop works on KRN itself and one target repo fixture, with verifiable DB state, source lineage, context inclusions/exclusions, anti-memory behavior, review burden, diff risk, rollback evidence, and a compact handoff.

## Cookbook-derived operating rules

These rules are adopted as process mechanics, not as new product layers.

1. PLANS.md / ExecPlan discipline:
   - This plan must remain self-contained and living.
   - Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective are mandatory.
   - Milestones are narrative and independently verifiable.
   - A fresh agent must be able to continue from this file alone plus the repo state.

2. Agent improvement loop:
   - Traces show what happened.
   - Feedback explains what mattered.
   - Evals preserve expectations.
   - Handoff tells Codex what to change next.
   - In KRN this maps to run_events, evidence_bundles, review_assessments, feedback_deltas, eval_candidates, compact handoffs.

3. Iterative repair loop:
   - Review first, repair second, validate third.
   - Do not edit before the current state and expected validation are known.
   - Remaining validation failures become the next repair input.

4. Memory and compaction:
   - Compaction helps the current run continue.
   - Durable memory helps future runs start with useful workflow guidance.
   - Reviewed artifacts, provenance, and uncertainty remain canonical.
   - In KRN, observation/reflection may create candidates, not final truth.

5. SchemaFlow-style stage discipline:
   - Stage outputs are typed.
   - Guardrails run between stages.
   - Artifacts are portable and inspectable.
   - Planning/proposal stages must not create unintended DB/runtime side effects.

6. Macro evals:
   - Lower-level golden cases check individual behavior.
   - Population analysis later looks for recurring behavior patterns across traces.
   - This is an eval/report lane, not a Research Foundry or autonomous optimizer.

7. Promptfoo portability:
   - Golden evals may later export to Promptfoo-compatible configs.
   - KRN does not build a broad eval suite before dogfood and behavior fixtures exist.

## Non-goals

Do not build or reintroduce:

- Research Foundry as a product subsystem.
- Pattern Vault as a product subsystem.
- meta-researcher as runtime, memory, DB schema, CLI, worker, or architecture gate.
- autoresearch loop as product behavior.
- broad autonomous research swarm.
- broad benchmark suite before dogfood/golden memory cases.
- runtime markdown memory.
- `.krn` as runtime truth.
- separate vector DB as first store.
- separate graph DB as first store.
- Redis/Kafka as first queue.
- dashboard before typed objects and read models.
- MCP/API server before core DB/harness behavior is stable.
- hidden chain-of-thought storage.
- automatic memory mutation from reflection.
- automatic skill/rule growth without review/promotion gate.
- stack-specific agent zoo.

Allowed:
- lightweight golden memory behavior tests.
- optional Promptfoo export after golden cases stabilize.
- course/Cookbook/local materials as decision evidence only.
- manual lab-style baseline-vs-candidate comparison inside eval lane only, with no memory mutation.

## Current state

M27 is complete.

Known final M27 commits:
- 7fb2b53 docs(handoff): update target repo init-connect status
- e9b12f2 docs(run): record target repo anti-rot audit
- a049e1e docs(plan): add memory ideal-state follow-up goal

MM-00 is complete.

Known MM-00 commit:
- 80f9ef9 docs(memory): add observational memory ideal-state ADR and ledger

Known pre-plan observation-domain commit:
- acca6d2 feat(core): add observational memory domain contracts

Note: `acca6d2` added MM-08-like pure core observation contracts before this
controlled plan was moved into `docs/plans/memory-ideal-state/PLAN.md`. Do not
mark MM-08 complete from that fact alone. Reconcile the existing contracts
against the controlled MM-08 slice when the plan reaches Gate 1.

Known verification already passed:
- pnpm typecheck
- pnpm test: 29 files, 134 tests
- DB-aware krn doctor
- pnpm db:ready: 8/8 migrations, pgvector available
- all M22-M27 DB smokes
- forbidden surface/dependency/core-safety scans
- git diff --check
- Slice 14 checks for memory plan
- MM-00 docs-only scope checks

Known target repo readiness:
- dry-run: proven
- connect persistence: proven
- Project/RepoInstallation/ProjectKernel: proven
- project-scoped plan: proven
- Codex brief readback: proven
- evidence capture: proven
- cleanup counts: proven as 0
- latest target readiness: ready

Known not built:
- MM-17 dogfood evidence for observation runtime
- reflection/dreaming implementation
- MemoryEval/golden memory behavior runner
- dashboard
- API
- MCP server
- broad workers runtime
- source crawler
- broad eval suite
- plugin package
- research/pattern subsystem

Known built but not fully integrated:
- observation core contracts, IO schemas, DB schema, repository adapter, evidence linkage, manual observe CLI, observer input builder, and pure observation prefix selector
- observation prefix selector is not wired into context assembly or activation runtime
- manual `krn observe --run <id> [--persist]` is not yet dogfooded on a committed KRN run
- observations do not yet flow into reflection, MemoryCandidate creation, MemoryReviewGate, anti-memory, or golden eval behavior
- MemoryRepository has low-level create/promote methods, but the governed MemoryReviewGate product path is not complete yet

Known untracked quarry may exist:
- docs/materials/2026-06-22-big-brain.md
- docs/materials/2026-06-22-big-brain-part-2.md

If these files exist, do not promote them to truth. They may be read as local notes only when a slice explicitly needs them, and any retained mechanism must enter existing source/decision docs or candidate records. They must not create a Pattern Vault or Research Foundry.

## Definitions

Memory Core:
    The reviewed, versioned, source-linked, temporal, confidence-aware, invalidatable, feedback-aware store-backed memory system.

Observation:
    A dated, source-ranged staging record derived from a run, tool trace, review, source chunk, or user/operator note. It is not final memory and not final truth.

Reflection:
    Offline or manual synthesis over observations and evidence that produces candidates, contradictions, gaps, and anti-memory proposals. It cannot mutate Memory Core directly.

MemoryCandidate:
    A proposed memory record requiring review/promotion before entering Memory Core.

AntiMemory:
    First-class records that block stale, rejected, harmful, or known-false claims/patterns from entering context.

SourceClaim:
    A source-grounded claim with trust, mechanism, doesNotProve, temporal scope, and relation to decisions/memory.

ContextAssembly:
    A small task-specific working set with inclusions, exclusions, reasons, expected use, warnings, and abstain behavior.

CapabilityPlan:
    The result of compiling task needs into skill/rule/policy/tool bindings. TaskContract must not be a bag of requiredSkills.

AuditBundle:
    A concise reviewable summary of what changed, what was checked, what risks remain, and how to roll back. It must not contain hidden chain-of-thought.

Golden memory behavior test:
    A behavior fixture that proves memory/context/source/evidence/audit behavior. It is not benchmark theater.

Macro behavior report:
    Later population-level analysis over multiple traces/eval findings. It reports recurring patterns. It is not a research subsystem.

## Canonical architecture

Data plane:
- PostgreSQL + pgvector as canonical brain store.
- Drizzle schema and migrations.
- Zod at IO/API/CLI boundaries.
- Postgres full-text search + pgvector + relational edge tables for retrieval.
- run_events + outbox_events + worker_jobs for audit/async.
- PGlite or Docker Postgres only as local/test mode if already supported.

Package boundaries:
- packages/core: pure domain types and pure logic. No fs, shell, env, network, DB, CLI formatting, Codex invocation, or process mutation.
- packages/schema: Zod schemas and IO contracts.
- packages/db: Drizzle schema, migrations, repositories, DB adapters.
- packages/harness: activation, compiler, context assembly, policy orchestration.
- packages/codex-adapter: Codex brief, AGENTS/skills/hooks/MCP/goal/exec-plan renderers.
- packages/cli: terminal commands and filesystem/shell adapter behavior.
- packages/workers: later maintenance job execution, bounded and explicit.
- packages/api: later HTTP/MCP app boundary after core behavior is stable.
- apps/dashboard or packages/dashboard: later read-model UI only.

Canonical flow:
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
      -> ObservationGroup
      -> ReflectionRecord
      -> MemoryCandidate / SourceClaimCandidate / AntiMemoryCandidate / EvalCandidate
      -> ReviewGate
      -> MemoryRecordVersion / SourceDecisionEdge / GoldenTask

## Required slice operating protocol

Before editing:
1. Read this PLAN.md and the current GOAL/HANDOFF relevant to the slice.
2. Inspect repo state:
       git status --short
       git log --oneline -5
       pnpm --version
3. Identify the next unchecked slice in Progress.
4. State intended touched files in the slice notes before making changes.
5. Confirm the slice non-goals.
6. If DB is touched, inspect current migrations and run db readiness checks.

During editing:
1. Implement the smallest vertical change that satisfies the slice.
2. Keep package boundaries intact.
3. Keep all external input unknown until schema validation.
4. Do not weaken types to make tests pass.
5. Do not create forbidden runtime surfaces.
6. Do not store chain-of-thought.
7. Keep generated docs concise and operational.

After editing:
1. Run required verification.
2. Run slice-specific smoke checks.
3. Run forbidden surface/dependency scans.
4. Update Progress with timestamp and evidence.
5. Update Surprises & Discoveries for unexpected findings.
6. Update Decision Log for any meaningful change.
7. Update Outcomes & Retrospective at milestone boundaries.
8. Produce or update AuditBundle/handoff once the audit layer exists.
9. Commit only when verification and scope checks pass.
10. If blocked, update this plan with exact blocker and next recovery step.

Minimum verification for every slice:
    pnpm typecheck
    pnpm test
    git diff --check

When DB/migrations are touched:
    pnpm db:ready
    existing DB smoke checks relevant to the slice

Forbidden surface scan must prove no accidental:
- Research Foundry package
- Pattern Vault package
- research CLI
- pattern inspect/promote CLI
- runtime markdown memory
- `.krn` runtime truth
- dashboard UI before read models
- MCP/API server before boundary slice
- separate vector/graph DB
- Redis/Kafka
- broad worker daemon
- broad eval suite
- source crawler
- hidden CoT storage

## AuditBundle contract

Once implemented, every implementation slice must produce a concise AuditBundle:

    sliceId
    commitCandidate
    changedFiles
    intendedFiles
    unexpectedFiles
    verificationCommands
    verificationResults
    architecturalDelta
    boundaryFindings
    typeSafetyFindings
    memorySemanticsFindings
    sourceGroundingFindings
    policyFindings
    evalFindings
    reviewBurdenEstimate
    diffRiskEstimate
    rollbackPath
    candidateUpdates
    selfCritiqueSummary
    finalVerdict

selfCritiqueSummary is a short reviewable explanation only. Do not include private reasoning or hidden chain-of-thought.

## Progress

Keep this section current. Add timestamps in Europe/Warsaw local time or UTC, but be consistent within a run.

- [x] (2026-06-22) M27 complete: target repo readiness, DB smokes, doctor, evidence capture, anti-rot audit, memory ideal-state GOAL.
- [x] (2026-06-22) MM-00 complete: observational memory ADR and source-to-decision ledger.
- [x] (2026-06-22) MM-01 complete: moved the clean Memory Brain plan into `docs/plans/memory-ideal-state/PLAN.md`, restored root `PLAN.md` as repo-wide ExecPlan, aligned controlled GOAL/roadmap/decisions/rejections/falsifiers, kept scope docs-only, and preserved no Research Foundry/Pattern Vault/research CLI/pattern CLI/product meta-researcher surfaces.
- [x] (2026-06-22) MM-02 complete: established repo audit baseline at `docs/plans/memory-ideal-state/AUDIT_BASELINE.md`. Intended files: baseline doc and this PLAN. Non-goals preserved: no runtime, DB schema, migration, CLI, worker, dashboard/API/MCP/server/plugin, source crawler, Research Foundry, Pattern Vault, runtime markdown memory, or `.krn` runtime truth. Evidence: `pnpm --version` 10.32.1; `pnpm typecheck` passed; `pnpm test` passed with 30 files and 139 tests; DB-aware `pnpm db:ready` passed with 8/8 migrations and pgvector available; DB-aware `krn doctor` passed with forbidden surfaces absent; forbidden directory/dependency scans found no forbidden surfaces.
- [x] (2026-06-22) MM-03 complete: added pure AuditBundle domain contract in `packages/core/src/auditBundle.ts`, exported it from `packages/core/src/index.ts`, and added focused tests in `packages/core/src/auditBundle.test.ts`. Intended files: `packages/core/src/auditBundle.ts`, `packages/core/src/auditBundle.test.ts`, `packages/core/src/index.ts`, this PLAN. Non-goals preserved: no DB, schema, CLI, fs/env/network, worker, runtime, migration, dashboard/API/MCP/server/plugin, source crawler, Research Foundry, Pattern Vault, runtime markdown memory, or `.krn` runtime truth. Evidence: RED `pnpm --filter @krn/core test` failed on missing `auditBundle.js`; GREEN focused core tests passed with 2 files and 7 tests; focused core typecheck passed; final full verification recorded in commit.
- [x] (2026-06-22) MM-04 complete: added AuditBundle Zod parse boundary, Drizzle `audit_bundles` / `audit_findings` schema, generated migration `0008_tough_slapstick.sql`, and thin `DrizzleAuditBundleRepository` persistence adapter. Intended files: `packages/schema/src/auditBundle.ts`, schema exports/tests, `packages/db/src/schema/audit.ts`, schema exports/tests, audit repository surface, migration files, this PLAN. Non-goals preserved: no CLI, worker, audit checks, dashboard/API/MCP/server/plugin, source crawler, Research Foundry, Pattern Vault, runtime markdown memory, `.krn` runtime truth, Redis/Kafka, or separate vector/graph DB. Evidence: RED schema test failed on missing `parseAuditBundleInput`; RED DB schema test failed on missing `schema/audit.js`; focused schema/db/core tests and typechecks passed; `pnpm --filter @krn/db db:generate` created migration; `pnpm --filter @krn/db db:check` passed; DB-aware `pnpm db:ready` passed with 9/9 migrations and pgvector available.
- [x] (2026-06-22) MM-05 complete: added pure harness audit checks for repo surfaces, architecture drift, package boundaries, TypeScript safety shortcuts, memory semantics, source grounding, eval theater, and handoff compactness. Intended files: `packages/harness/src/audit/auditChecks.ts`, `packages/harness/src/audit/auditChecks.test.ts`, `packages/harness/src/audit/index.ts`, `packages/harness/src/index.ts`, this PLAN. Non-goals preserved: no CLI command, filesystem traversal, shell/process execution, DB writes, worker, dashboard/API/MCP/server/plugin, source crawler, Research Foundry, Pattern Vault, runtime markdown memory, `.krn` runtime truth, Redis/Kafka, or separate vector/graph DB. Evidence: RED focused harness test failed on missing `auditChecks.js`; GREEN `pnpm --filter @krn/harness test -- audit/auditChecks.test.ts` passed with 5 files / 17 tests; focused harness typecheck passed; final `pnpm typecheck`, `pnpm test`, `git diff --check`, and audit-module forbidden runtime import scan passed. Compact AuditBundle: changed files match intended files; unexpected files none; architectural delta is typed snapshot audit engine only; review burden low; diff risk low; rollback path `git revert <MM-05 commit>`; candidate updates none; final verdict pass.
- [x] (2026-06-22) MM-06 complete: added `krn audit repo` and `krn audit slice --since <ref>` CLI adapter with text and `--json` reports, repo file snapshotting, git changed-file slice snapshotting, and exit-code gate behavior. Intended files: `packages/cli/src/runAuditCommand.ts`, `packages/cli/src/runAuditCommand.test.ts`, `packages/cli/src/parseArgs.ts`, `packages/cli/src/runCli.ts`, `packages/harness/src/audit/auditChecks.ts`, this PLAN. Non-goals preserved: no DB persistence/write path, worker, dashboard/API/MCP/server/plugin, source crawler, broad eval suite, Research Foundry, Pattern Vault, runtime markdown memory, `.krn` runtime truth, Redis/Kafka, or separate vector/graph DB. Evidence: RED focused CLI test failed because `audit` was not parsed/routed; GREEN `pnpm --filter @krn/cli test -- runAuditCommand.test.ts` passed; focused CLI and harness typecheck passed; `pnpm --filter @krn/cli krn audit repo --repo ../..` produced advisory with two existing JSON.parse warnings and no blocking findings; `pnpm --filter @krn/cli krn audit slice --since HEAD --repo ../.. --json` produced advisory with handoff warning only; final `pnpm typecheck`, `pnpm test`, `git diff --check`, dependency scan, forbidden directory scan, and forbidden package-surface scan passed. Compact AuditBundle: changed files match intended files; unexpected files none; architectural delta is CLI adapter plus refined architecture-drift false-positive filtering; review burden medium; diff risk medium; rollback path `git revert <MM-06 commit>`; candidate updates: future type-safety cleanup candidate for existing CLI JSON.parse boundaries; final verdict pass.
- [x] (2026-06-22) MM-07 complete: dogfooded the audit CLI on the current KRN repo and recorded the run at `docs/runs/2026-06-22-memory-brain-audit-dogfood.md`. Intended files: dogfood run doc and this PLAN. Non-goals preserved: no runtime/code changes, DB writes, workers, dashboard/API/MCP/server/plugin, source crawler, broad eval suite, Research Foundry, Pattern Vault, runtime markdown memory, `.krn` runtime truth, Redis/Kafka, or separate vector/graph DB. Evidence: preflight `pnpm typecheck` passed; preflight `pnpm test` passed with 35 files / 157 tests; `pnpm --filter @krn/cli krn audit repo --repo ../.. --json` returned advisory with 2 warnings and 0 blocking findings; `pnpm --filter @krn/cli krn audit slice --since HEAD~1 --repo ../.. --json` returned advisory with 1 handoff warning and 0 blocking findings; forbidden directory/dependency scans passed. Compact AuditBundle: changed files match intended docs-only files; unexpected files none; architectural delta none; review burden low; diff risk low; rollback path `git revert <MM-07 commit>`; candidate updates: future type-safety cleanup for existing CLI `JSON.parse` boundaries; next recommendation MM-08 observation contract reconciliation; final verdict pass.
- [x] (2026-06-22) MM-08 complete: reconciled existing pure observation contracts against the controlled MM-08 requirements. Existing `ObservationScope`, `ObservationGroup`, `ObservationItem`, `ObservationSourceRange`, `ObservationTemporalScope`, kind/priority/confidence/status/provenance vocabulary, source-range policy, and validation helpers were already present from `acca6d2`; this slice added `referencedAt` and `relativeTimeBase` temporal anchors plus focused tests for temporal anchors. Intended files: `packages/core/src/observations/ObservationTemporalScope.ts`, `packages/core/src/observations/index.test.ts`, this PLAN. Non-goals preserved: no Zod schemas, DB schema, migrations, repositories, CLI, workers, observer runtime, reflector runtime, dashboard/API/MCP/server/plugin, source crawler, Research Foundry, Pattern Vault, runtime markdown memory, `.krn` runtime truth, Redis/Kafka, or separate vector/graph DB. Evidence: focused `pnpm --filter @krn/core test -- observations/index.test.ts` passed with 2 files / 9 tests; focused core typecheck passed; core observation boundary scan found no DB/Zod/runtime imports; final `pnpm typecheck`, `pnpm test`, and `git diff --check` passed. Compact AuditBundle: changed files match intended files; unexpected files none; architectural delta is pure domain reconciliation only; review burden low; diff risk low; rollback path `git revert <MM-08 commit>`; candidate updates none; final verdict pass.
- [x] (2026-06-22) MM-09 complete: added schema-owned Zod IO contracts for observation groups, items, temporal scopes, source ranges, entity links, and claim links. Intended files: `packages/schema/src/observation.ts`, `packages/schema/src/index.ts`, `packages/schema/src/index.test.ts`, this PLAN. Non-goals preserved: no DB schema, migrations, repositories, CLI, workers, observer runtime, reflector runtime, dashboard/API/MCP/server/plugin, source crawler, Research Foundry, Pattern Vault, runtime markdown memory, `.krn` runtime truth, Redis/Kafka, separate vector/graph DB, or core runtime imports into schema. Evidence: RED `pnpm --filter @krn/schema test` failed on missing `parseObservationItemInput` / `parseObservationGroupInput`; GREEN focused schema tests passed with 1 file / 13 tests; focused schema typecheck passed; final `pnpm typecheck`, `pnpm test`, `git diff --check`, and forbidden directory scan passed. Compact AuditBundle: changed files match intended files; unexpected files none; architectural delta is IO validation only; review burden low; diff risk low; rollback path `git revert <MM-09 commit>`; candidate updates none; final verdict pass.
- [x] (2026-06-22) MM-10 complete: added Drizzle/Postgres observation staging schema and generated migration `0009_dusty_tattoo.sql` for `observation_groups`, `observation_items`, `observation_source_ranges`, `observation_entity_edges`, `observation_claim_edges`, and `observation_feedback_events`. Intended files: `packages/db/src/schema/observations.ts`, `packages/db/src/schema/observations.test.ts`, `packages/db/src/schema/index.ts`, generated migration files, and this PLAN. Non-goals preserved: no repositories, CLI, observe runtime, worker, reflection, activation prefix selector, dashboard/API/MCP/server/plugin, source crawler, Research Foundry, Pattern Vault, runtime markdown memory, `.krn` runtime truth, Redis/Kafka, or separate vector/graph DB. Evidence: RED `pnpm --filter @krn/db test -- schema/observations.test.ts` failed on missing `./observations.js`; GREEN focused DB schema test and focused DB typecheck passed; `pnpm --filter @krn/db db:generate` created migration; generated SQL was inspected for tables/FKs/indexes; `pnpm --filter @krn/db db:check` passed; DB-aware `pnpm db:ready` passed with 10/10 migrations and pgvector available; final `pnpm typecheck`, `pnpm test`, `git diff --check`, and forbidden dependency/research-surface scans passed. Compact AuditBundle: changed files match intended files; unexpected files none; architectural delta is persistence schema only; review burden medium; diff risk medium; rollback path `git revert <MM-10 commit>`; candidate updates none; final verdict pass.
- [x] (2026-06-22) MM-11 complete: added `DrizzleObservationRepository` with `createGroup`, `addItems`, `findByRun`, `findByScope`, `linkSourceRange`, and `recordFeedback`. Intended files: `packages/db/src/repositories/DrizzleObservationRepository.ts`, `packages/db/src/repositories/DrizzleObservationRepository.test.ts`, `packages/db/src/repositories/index.ts`, and this PLAN. Non-goals preserved: no new migrations, CLI, observe runtime, worker, reflection, activation prefix selector, Memory Core mutation, dashboard/API/MCP/server/plugin, source crawler, Research Foundry, Pattern Vault, runtime markdown memory, `.krn` runtime truth, Redis/Kafka, or separate vector/graph DB. Evidence: RED `pnpm --filter @krn/db test -- repositories/DrizzleObservationRepository.test.ts` failed on missing `./DrizzleObservationRepository.js`; GREEN focused repository test passed with 20 files / 44 tests; focused DB typecheck passed; final `pnpm typecheck`, `pnpm test`, DB-aware `pnpm db:ready` with 10/10 migrations, `git diff --check`, forbidden dependency/research-surface scans, and forbidden directory scan passed. Compact AuditBundle: changed files match intended files; unexpected files none; architectural delta is repository adapter only; review burden medium; diff risk medium; rollback path `git revert <MM-11 commit>`; candidate updates none; final verdict pass.
- [x] (2026-06-22) MM-12 complete: linked observation repository writes to evidence/source-range requirements and added raw-evidence recall from existing typed source-range FKs. Intended files: `packages/db/src/repositories/DrizzleObservationRepository.ts`, `packages/db/src/repositories/DrizzleObservationRepository.test.ts`, and this PLAN. Non-goals preserved: no new migrations, CLI, observe runtime, worker, reflection, activation prefix selector, Memory Core mutation, dashboard/API/MCP/server/plugin, source crawler, Research Foundry, Pattern Vault, runtime markdown memory, `.krn` runtime truth, Redis/Kafka, or separate vector/graph DB. Evidence: RED focused DB repository test failed on missing `recallRawEvidence` and evidence-linkage helper exports; GREEN focused DB repository test passed with 20 files / 48 tests; focused DB typecheck passed; final `pnpm typecheck`, `pnpm test`, DB-aware `pnpm db:ready` with 10/10 migrations, `git diff --check`, forbidden dependency/research-surface scans, and forbidden directory scan passed. Compact AuditBundle: changed files match intended files; unexpected files none; architectural delta is repository-level evidence linkage only; review burden medium; diff risk medium; rollback path `git revert <MM-12 commit>`; candidate updates none; final verdict pass.
- [x] (2026-06-22) MM-13 complete: added a pure harness observer input builder that normalizes run events, evidence bundles, review assessments, and feedback deltas into deterministic observer input items with secret redaction and payload truncation. Intended files: `packages/harness/src/observations/observerInput.ts`, `packages/harness/src/observations/observerInput.test.ts`, `packages/harness/src/observations/index.ts`, `packages/harness/src/index.ts`, and this PLAN. Non-goals preserved: no DB schema/repository changes, migrations, CLI, observe runtime, LLM call, worker, reflection, activation prefix selector, Memory Core mutation, dashboard/API/MCP/server/plugin, source crawler, Research Foundry, Pattern Vault, runtime markdown memory, `.krn` runtime truth, Redis/Kafka, or separate vector/graph DB. Evidence: RED focused harness test failed on missing `./observerInput.js`; GREEN focused harness observer-input test passed with 6 files / 19 tests; focused harness typecheck passed; final `pnpm typecheck`, `pnpm test`, DB-aware `pnpm db:ready`, `git diff --check`, forbidden dependency/research-surface scans, and forbidden directory scan passed. Compact AuditBundle: changed files match intended files; unexpected files none; architectural delta is deterministic harness input normalization only; review burden medium; diff risk medium; rollback path `git revert <MM-13 commit>`; candidate updates none; final verdict pass.
- [x] (2026-06-22) MM-14 complete: made the observation source-range requirement matrix explicit and exhaustively typed for every `ObservationKind` x `ObservationProvenanceKind`, with table-driven tests proving `requiresObservationSourceRange` follows the matrix. Intended files: `packages/core/src/observations/observationPolicy.ts`, `packages/core/src/observations/index.test.ts`, and this PLAN. Non-goals preserved: no schema, DB, migrations, repository changes, CLI, observe runtime, LLM call, worker, reflection, activation prefix selector, Memory Core mutation, dashboard/API/MCP/server/plugin, source crawler, Research Foundry, Pattern Vault, runtime markdown memory, `.krn` runtime truth, Redis/Kafka, or separate vector/graph DB. Evidence: RED focused core test failed because `OBSERVATION_SOURCE_RANGE_POLICY` was missing; GREEN focused core observation test passed with 2 files / 9 tests; focused core typecheck passed; final `pnpm typecheck`, `pnpm test`, DB-aware `pnpm db:ready`, `git diff --check`, forbidden dependency/research-surface scans, and forbidden directory scan passed. Compact AuditBundle: changed files match intended files; unexpected files none; architectural delta is explicit pure core policy only; review burden low; diff risk low; rollback path `git revert <MM-14 commit>`; candidate updates none; final verdict pass.
- [x] (2026-06-22) MM-15 complete: added manual `krn observe --run <id> [--persist]` CLI routing that loads a persisted run, builds deterministic observer input, and creates an observation group/items only when `--persist` is explicit. Intended files: `packages/cli/src/runObserveCommand.ts`, `packages/cli/src/parseArgs.ts`, `packages/cli/src/runCli.ts`, `packages/cli/src/index.ts`, `packages/cli/src/databaseRuntime.ts`, `packages/cli/src/runCli.test.ts`, and this PLAN. Non-goals preserved: no LLM call, observer worker, reflection, activation prefix selector, Memory Core mutation, MemoryRecord creation, dashboard/API/MCP/server/plugin, source crawler, Research Foundry, Pattern Vault, runtime markdown memory, `.krn` runtime truth, Redis/Kafka, or separate vector/graph DB. Evidence: RED focused CLI test failed with exit 2 before parser/command support; GREEN focused CLI test passed with 5 files / 78 tests; focused CLI typecheck passed; final `pnpm typecheck`, `pnpm test`, DB-aware `pnpm db:ready`, `git diff --check`, forbidden dependency/research-surface scans, and forbidden directory scan passed. Compact AuditBundle: changed files match intended files; unexpected files none; architectural delta is manual observe CLI orchestration only; review burden medium; diff risk medium; rollback path `git revert <MM-15 commit>`; candidate updates none; final verdict pass.
- [x] (2026-06-22) MM-16 complete: added a pure harness `selectObservationPrefix` selector that ranks observations against a task, returns a small prefix with reasons, warnings, exclusions, and excludes invalidated/stale/cross-project observations. Intended files: `packages/harness/src/observations/observationPrefix.ts`, `packages/harness/src/observations/observationPrefix.test.ts`, `packages/harness/src/observations/index.ts`, and this PLAN. Non-goals preserved: no DB/repository changes, CLI integration, context assembly integration, observer worker, LLM call, reflection, Memory Core mutation, MemoryRecord creation, dashboard/API/MCP/server/plugin, source crawler, Research Foundry, Pattern Vault, runtime markdown memory, `.krn` runtime truth, Redis/Kafka, or separate vector/graph DB. Evidence: RED focused harness test failed on missing `./observationPrefix.js`; GREEN focused harness observation-prefix test passed with 7 files / 21 tests; focused harness typecheck passed; final `pnpm typecheck`, `pnpm test`, DB-aware `pnpm db:ready`, `git diff --check`, forbidden dependency/research-surface scans, and forbidden directory scan passed. Compact AuditBundle: changed files match intended files; unexpected files none; architectural delta is pure observation prefix selection only; review burden medium; diff risk medium; rollback path `git revert <MM-16 commit>`; candidate updates none; final verdict pass.
- [x] (2026-06-22) MM-16/17 review-gate complete: integrated the two external harsh review reports into this PLAN as an explicit repair layer before MM-17 dogfood and later governance gates. Intended files: this PLAN. Non-goals preserved: no code, DB schema, runtime, CLI, worker, reflection, memory promotion, dashboard/API/MCP/server/plugin, source crawler, Research Foundry, Pattern Vault, runtime markdown memory, `.krn` runtime truth, Redis/Kafka, or separate vector/graph DB. Evidence: reviewers converged on PASS_WITH_RISKS and called out doc drift, weak dogfood, prefix relevance, source-range typed lineage, project scoping, redaction, timestamp validation, audit shallowness, MemoryReviewGate bypass, anti-memory narrowness, and premature confidence; `pnpm typecheck` passed; `pnpm test` passed with 39 files / 178 tests; `git diff --check` passed; scope check showed only this PLAN changed; forbidden directory scan found no added dashboard/API/MCP/research/pattern surfaces. This line records the planning repair only; implementation starts with MM-17A.
- [x] (2026-06-22) MM-17A complete: reconciled public current-state docs before dogfood so README, root GOAL/PLAN, REVIEW, handoff docs, and this PLAN no longer present the repo as having no CLI or no observation persistence. Intended files: `README.md`, `GOAL.md`, root `PLAN.md`, `REVIEW.md`, `docs/handoff/progress.md`, `docs/handoff/blockers.md`, and this PLAN. Non-goals preserved: no code/runtime/schema changes, no observe dogfood, no DB write, no reflection, no Memory Core mutation, no dashboard/API/MCP/server/plugin, no source crawler, no Research Foundry, no Pattern Vault. Evidence: stale-phrase grep found only a root `PLAN.md` line explicitly marked historical; `pnpm typecheck` passed; `pnpm test` passed with 39 files / 178 tests; `git diff --check` passed; forbidden directory scan found no added dashboard/API/MCP/research/pattern surfaces. Next: MM-16R prefix relevance and project-scope hardening.
- [x] (2026-06-22) MM-16R complete: hardened observation prefix relevance and project-scope selection so priority/confidence cannot activate unrelated observations and unscoped observations cannot enter project-scoped prefixes by default. Intended files: `packages/harness/src/observations/observationPrefix.ts`, `packages/harness/src/observations/observationPrefix.test.ts`, and this PLAN. Non-goals preserved: no DB/repository changes, no vector search, no activation v2, no context assembly integration, no Memory Core mutation, no dashboard/API/MCP/server/plugin, no source crawler. Evidence: RED focused harness test failed because unrelated priority/confidence and unscoped observations were selected; GREEN focused harness observation-prefix test passed with 7 files / 22 tests; full `pnpm typecheck` passed; full `pnpm test` passed with 39 files / 179 tests; `git diff --check` passed. Next: MM-17B dogfood observations from a real KRN persisted run with raw recall matrix.
- [x] (2026-06-22) MM-17B complete: dogfooded `krn observe --run` against persisted KRN run `eb16411b-d304-420e-adc7-1fdb86857c1d`, committed evidence at `docs/runs/2026-06-22-observation-dogfood.md`, and proved observation rows/source ranges/raw recall/prefix selection/no MemoryRecord delta. Intended files: dogfood run doc, current-state pointers, and this PLAN. Non-goals preserved: no LLM observer, observer worker, reflection, MemoryRecord creation, promotion, dashboard/API/MCP/server/plugin, source crawler, or broad eval suite. Evidence: DB readiness passed with 10/10 migrations and pgvector available; preview produced 5 observer input items and `Memory mutation: none`; persist created group `efb77ec6-2773-4f4d-a8b7-f1d84b5ff001` and 5 items; counts moved observation_groups 0->1, observation_items 0->5, observation_source_ranges 0->5, memory_records stayed 1->1; source ranges covered run_event/evidence_bundle/review_assessment/feedback_delta typed FKs; `recallRawEvidence` returned raw records for all 5 persisted items; prefix sample selected 3/5 items with explicit exclusions. Next: MM-17C typed source-range lineage invariants.
- [ ] MM-17C: Enforce typed source-range lineage invariants for truth-bearing observations.
- [ ] MM-17D: Remove hardcoded observe project scope and prove project isolation.
- [ ] MM-17E: Add observation schema/core parity and timestamp validation.
- [ ] MM-17F: Harden observer payload redaction for secret-shaped values.
- [ ] MM-18: Add reflection domain contracts.
- [ ] MM-18A: Seal reflection as candidate-only before any manual reflect runtime.
- [ ] MM-19: Add reflection schemas and DB persistence.
- [ ] MM-20: Add reflection repositories and input selector.
- [ ] MM-21: Generate memory/source/anti-memory/eval candidates from reflection.
- [ ] MM-22: Add contradiction and gap reports.
- [ ] MM-23: Add manual reflect CLI.
- [ ] MM-24: Prove reflection cannot mutate Memory Core.
- [ ] MM-24A: Prove reflection cannot mutate Memory Core at repository/runtime boundaries.
- [ ] MM-25: Dogfood reflection on KRN observations.
- [ ] MM-26: Harden MemoryRecord invariants.
- [ ] MM-26A: Add Memory Core write-surface guard before promotion paths.
- [ ] MM-27: Add MemoryReviewGate and promotion path.
- [ ] MM-28: Add memory invalidation/versioning behavior.
- [ ] MM-29: Add memory feedback application and demotion.
- [ ] MM-29A: Convert hurt/stale feedback into review-required demotion/invalidation candidates.
- [ ] MM-30: Enforce anti-memory in retrieval/context.
- [ ] MM-30A: Expand anti-memory enforcement beyond source_claim candidates.
- [ ] MM-31: Add memory abstain behavior.
- [ ] MM-32: Add memory health audit.
- [ ] MM-32B: Make audit CLI consume real AuditBundle/verification and semantic DB snapshots.
- [ ] MM-33: Dogfood promotion of one review lesson.
- [ ] MM-34: Harden SourceClaim and SourceDecisionEdge.
- [ ] MM-35: Add source rejection and doesNotProve enforcement.
- [ ] MM-36: Add trust-tier and temporal source claim behavior.
- [ ] MM-37: Add source graph health audit.
- [ ] MM-38: Dogfood source-to-decision on memory implementation.
- [ ] MM-39: ActivationEngine v2 query model.
- [ ] MM-40: Hybrid lexical/vector/graph candidate merge.
- [ ] MM-41: Trust, temporal, invalidation, and anti-memory filters.
- [ ] MM-42: ContextROI, diversity, dedup, inclusions, and exclusions.
- [ ] MM-43: Activation traces and raw evidence recall trigger.
- [ ] MM-44: Observation prefix integration.
- [ ] MM-44A: Integrate observation prefix only after relevance/project-scope hardening.
- [ ] MM-45: Dogfood activation before/after observations.
- [ ] MM-46: CapabilityRequirement and CapabilityPlan hardening.
- [ ] MM-47: CapabilityCompiler v1.
- [ ] MM-48: Skill/rule/policy/tool binding models.
- [ ] MM-49: Product-emitted skill/rule lifecycle without auto-growth.
- [ ] MM-50: TypeScript/review-risk rule bindings.
- [ ] MM-51: Dogfood capability routing for a memory task.
- [ ] MM-52: EvidenceBundle hardening.
- [ ] MM-53: ReviewAssessment and FeedbackDelta hardening.
- [ ] MM-54: diff risk and review burden scoring v1.
- [ ] MM-55: rollback path enforcement.
- [ ] MM-56: candidate extraction from feedback.
- [ ] MM-57: review assess CLI.
- [ ] MM-58: Dogfood feedback capture from one KRN slice.
- [ ] MM-59: GoldenTask domain model.
- [ ] MM-60: GoldenTask storage or fixture strategy.
- [ ] MM-61: memory behavior golden cases.
- [ ] MM-61-lite: Add early golden smoke cases for stale memory abstain, anti-memory block, and unsupported source decision rejection.
- [ ] MM-62: context/source/audit/type boundary golden cases.
- [ ] MM-63: observation/reflection/anti-memory golden cases.
- [ ] MM-64: golden eval runner.
- [ ] MM-65: optional Promptfoo-compatible export.
- [ ] MM-66: EvalCandidate promotion gate.
- [ ] MM-67: Dogfood first golden suite as regression gate.
- [ ] MM-68: Trace compaction document model for eval analysis.
- [ ] MM-69: RunPopulation/eval_finding/behavior_pattern reporting.
- [ ] MM-70: recurring failure detector report.
- [ ] MM-71: Dogfood recurring pattern detection across KRN runs.
- [ ] MM-72: API/MCP boundary ADR refresh.
- [ ] MM-73: read/propose/write tool model.
- [ ] MM-74: read-only MCP resources after DB/harness stability.
- [ ] MM-75: proposal tools with audit.
- [ ] MM-76: approval-gated write tools.
- [ ] MM-77: prompt-injection and destructive operation tests.
- [ ] MM-78: Dogfood Codex queries KRN memory through read-only resource.
- [ ] MM-79: Project registry hardening.
- [ ] MM-80: per-project memory/source/run isolation.
- [ ] MM-81: cross-project leak tests.
- [ ] MM-82: project-scoped activation/observations/evals.
- [ ] MM-83: Dogfood two repo fixtures with isolated state.
- [ ] MM-84: Dashboard/read-model ADR refresh.
- [ ] MM-85: read models for project, memory, source, review, eval, audit health.
- [ ] MM-86: dashboard export-json command.
- [ ] MM-87: minimal dashboard only if every view has action/owner/threshold.
- [ ] MM-88: Dogfood dashboard/read model identifies actionable issue.
- [ ] MM-89: End-to-end init-connect-plan-evidence-observe-reflect flow.
- [ ] MM-90: End-to-end memory promotion and anti-memory blocking flow.
- [ ] MM-91: End-to-end source-to-decision and golden eval flow.
- [ ] MM-92: Security/policy audit.
- [ ] MM-93: TypeScript API audit.
- [ ] MM-94: Migration audit.
- [ ] MM-95: Final KRN dogfood run.
- [ ] MM-96: Final target repo run.
- [ ] MM-97: Final handoff and release candidate tag.

## Surprises & Discoveries

Record unexpected behaviors, bugs, optimizer/type-system issues, migration quirks, or product insights here.

- Observation: Previous roadmap over-expanded Cookbook/autoresearch ideas into Research Foundry, Pattern Vault, and meta-researcher product layers.
  Evidence: Uploaded prior roadmap included Research Foundry/Pattern Vault and pattern intake freeze as required product gates.
  Resolution: This PLAN.md keeps Cookbook patterns as operating mechanics and eval guidance only.

- Observation: Pure observation domain contracts already exist from commit `acca6d2` before this controlled plan became the checked-in memory plan.
  Evidence: `packages/core/src/observations/*` exists and root history contains `acca6d2 feat(core): add observational memory domain contracts`.
  Resolution: Leave controlled MM-08 unchecked until the slice audits and reconciles those contracts against this plan.

- Observation: MM-02 baseline found one filesystem import in a test fixture, not production code.
  Evidence: boundary scan found `packages/harness/src/activation/noisyBrainFixture.test.ts` importing `node:fs`.
  Resolution: Accept as a test fixture read. Future automated audits should classify test-only fixture imports separately from production package-boundary violations.

- Observation: AuditBundle starts as a pure domain contract before schema or persistence.
  Evidence: MM-03 added only `packages/core/src/auditBundle.ts`, its focused test, and a root core export.
  Resolution: Keep IO validation and DB persistence for MM-04.

- Observation: AuditBundle persistence needs grouped finding rows plus compact JSON evidence fields.
  Evidence: MM-04 created relational `audit_bundles` and `audit_findings` tables with indexes for slice, verdict, category, severity, status, project, and execution run; command lists and candidate updates remain JSONB payload fields.
  Resolution: Keep stable query fields relational and defer CLI/audit check behavior to MM-05/MM-06.

- Observation: MM-05 audit checks are more stable as pure checks over typed snapshots than as direct filesystem scanners.
  Evidence: `packages/harness/src/audit/auditChecks.ts` accepts `AuditRepoSnapshot` and produces `AuditFinding[]` without fs/process/DB imports; seeded violation fixtures prove detection.
  Resolution: Keep snapshot construction and command output for MM-06 CLI, while MM-05 owns deterministic check behavior.

- Observation: Architecture-drift audit must distinguish current adoption from historical/rejected-plan evidence.
  Evidence: First repo-root `krn audit repo --repo ../..` smoke failed on `PLAN.md` lines documenting prior Research Foundry/Pattern Vault mistakes and non-goals.
  Resolution: Keep the audit line-based and require adoption terms without negation/history markers such as `do not`, `must not`, `prior`, or `evidence:`.

- Observation: First dogfood audit found real type-safety warnings in CLI JSON parsing.
  Evidence: `krn audit repo --repo ../.. --json` returned advisory findings for `packages/cli/src/runDoctorCommand.ts` and `packages/cli/src/runInitCommand.ts`.
  Resolution: Record as cleanup candidates; do not widen MM-07 beyond dogfood evidence.

- Observation: MM-08 started with existing observation contracts already present from `acca6d2`.
  Evidence: `packages/core/src/observations/*` already included the required domain objects, source-range policy, and validation helpers.
  Resolution: Treat MM-08 as reconciliation against the controlled plan; add only missing temporal anchor vocabulary and tests.

- Observation: Schema package cannot import core runtime exports under current package tsconfig without pulling core source outside schema rootDir.
  Evidence: An attempted `@krn/core` import in observation schemas made focused schema typecheck fail with TS6059 rootDir errors.
  Resolution: Keep MM-09 schemas structurally aligned with core contracts and duplicate only the IO boundary validation matrix needed at schema boundary; do not change package build topology in this slice.

- Observation: Observation source ranges need both a polymorphic source identifier and typed FK columns.
  Evidence: MM-10 links observation source ranges to run events, source chunks, evidence bundles, review assessments, feedback deltas, and execution runs while preserving `source_type`/`source_id` for future source classes.
  Resolution: Keep exact recall lineage relational where stable, and reserve JSONB for scope/metadata payloads rather than query-critical fields.

- Observation: MM-12 did not need another schema slice because MM-10 already carried the typed evidence FK columns needed for exact recall.
  Evidence: `DrizzleObservationRepository.recallRawEvidence` can resolve observation source ranges through `runEventId`, `sourceChunkId`, `evidenceBundleId`, `reviewAssessmentId`, and `feedbackDeltaId`.
  Resolution: Keep MM-12 as repository behavior only; MM-13 can build observer input on top of the existing lineage instead of changing persistence again.

- Observation: MM-13 can stay DB-agnostic by accepting already loaded run/evidence/review snapshots.
  Evidence: `buildObserverInput` in `packages/harness/src/observations/observerInput.ts` has no DB, fs, process, network, CLI, worker, or model imports.
  Resolution: Keep query orchestration for a later CLI/runtime slice; this slice only defines deterministic normalization, ordering, redaction, and truncation behavior.

- Observation: The original source-range helper already enforced the right broad behavior, but the policy was implicit because it ignored `kind`.
  Evidence: MM-14 replaced the provenance-only helper with `OBSERVATION_SOURCE_RANGE_POLICY`, a typed `ObservationKind` x `ObservationProvenanceKind` matrix covered by table-driven tests.
  Resolution: Keep the current exemption rule narrow: only `user_preference` and `local_operator_note` provenance can omit source ranges.

- Observation: The first observe CLI can stay manual and deterministic while still writing real observation rows.
  Evidence: `runObserveCommand` uses `buildObserverInput`, persisted harness run data, and `observationRepository.createGroup/addItems`; it does not call an LLM, worker, reflection path, memory repository, or Memory Core mutation path.
  Resolution: Keep MM-15 as manual operator-triggered staging only; MM-16 owns selection/prefix behavior and later slices own dogfood/runtime broadening.

- Observation: Observation prefix selection belongs in harness selection logic, not CLI or DB.
  Evidence: `selectObservationPrefix` consumes `TaskContract` and already-loaded `ObservationItem[]`, returns selected items, warnings, and exclusions without repository or runtime imports.
  Resolution: Keep prefix policy pure and testable; later integration can call it from context assembly or CLI without hiding selection policy in adapters.

- Observation: Two external harsh reviews converged on PASS_WITH_RISKS and identified the same near-term failure mode: KRN has real observation/memory substrate now, but can still confuse staging tables, adapters, and green tests with governed Memory Core behavior.
  Evidence: Both reports flagged stale current-state docs, weak MM-17 dogfood, prefix relevance/scope risk, typed lineage gaps, hardcoded observe project scope, redaction gaps, loose timestamp validation, shallow audit snapshots, MemoryReviewGate bypass risk, narrow anti-memory enforcement, and premature confidence.
  Resolution: Insert MM-17A/MM-16R/MM-17B-MM-17F plus later governance/audit/eval repair slices before moving into reflection or promotion work.

## Decision Log

- Decision: Remove Research Foundry and Pattern Vault from the Memory Brain target architecture.
  Rationale: The user only wants a lightweight way to test memory behavior, not a new memory/product layer. Cookbook/autoresearch ideas must not become DB/CLI/runtime subsystems.
  Date/Author: 2026-06-22 / planning pass.

- Decision: Golden memory behavior tests are part of the normal eval lane.
  Rationale: KRN must prove memory/context/source behavior, but avoid broad benchmark theater and avoid building a meta-research product.
  Date/Author: 2026-06-22 / planning pass.

- Decision: Observational Memory remains a staging layer, not Memory Core.
  Rationale: Observations are useful evidence-derived records, but only reviewed candidates become governed memory.
  Date/Author: MM-00 / ADR-0011.

- Decision: Every implementation slice must be auditable and independently verifiable.
  Rationale: The user cannot supervise every slice; KRN must create compact evidence, scope checks, rollback paths, and handoffs without storing chain-of-thought.
  Date/Author: 2026-06-22 / planning pass.

- Decision: Treat the two harsh review reports as a blocking repair layer, not advisory notes.
  Rationale: Both reports independently found that continuing directly into reflection/worker/promotion work would amplify unproven observation semantics and governance bypasses. The next slices must first reconcile docs, prove observe dogfood, harden prefix relevance/scope, enforce typed lineage, close redaction/timestamp drift, and add later MemoryReviewGate/audit/anti-memory/eval safeguards.
  Date/Author: 2026-06-22 / external review integration.

## Outcomes & Retrospective

Update after each milestone gate and at completion.

Initial expected outcome:
- This plan should let Codex continue from a single file, implement one thin slice at a time, and avoid drifting into research/pattern/meta architecture.
- The final product should demonstrate a real memory loop:
      evidence -> observation -> reflection -> candidates -> review -> memory -> activation -> golden proof.

Gate 0 MM-01 outcome:
- The controlled Memory Brain plan now lives at `docs/plans/memory-ideal-state/PLAN.md`.
- Root `PLAN.md` remains the repo-wide KRN ExecPlan.
- Research Foundry, Pattern Vault, research DB/CLI, pattern CLI, and meta-researcher runtime are rejected as product architecture.
- Golden memory behavior tests remain allowed only inside the normal eval lane.

Gate 0 MM-02 outcome:
- `docs/plans/memory-ideal-state/AUDIT_BASELINE.md` records the current package boundaries, DB readiness, doctor status, forbidden surface checks, not-built list, and raw quarry status.
- The baseline is manual and documentation-only; MM-03 starts the pure AuditBundle domain contract that will later automate this shape.

Gate 0 MM-03 outcome:
- `AuditBundle`, `AuditFinding`, verification command results, candidate updates, risk estimates, and final verdict types exist in `packages/core`.
- `resolveAuditFinalVerdict` and `getHighestAuditFindingSeverity` provide conservative pure helpers for audit summaries.
- No schema, persistence, CLI, or runtime audit behavior exists yet; MM-04 owns schemas and persistence.

Gate 0 MM-04 outcome:
- AuditBundle IO schemas exist in `packages/schema`.
- AuditBundle persistence tables exist in `packages/db` with migration `0008_tough_slapstick.sql`.
- `DrizzleAuditBundleRepository` provides a thin create/get/cleanup adapter without CLI/runtime audit behavior.
- Live DB readiness now reports 9/9 migrations applied.

Gate 0 MM-05 outcome:
- `packages/harness/src/audit/auditChecks.ts` exports deterministic audit checks for forbidden surfaces, architecture drift, package boundaries, type-safety shortcuts, memory semantics, source grounding, eval theater, and handoff compactness.
- The audit checks consume typed snapshots and return `AuditFinding[]`; they do not scan the filesystem, run shell commands, write DB rows, or add CLI/runtime behavior.
- Seeded violation tests prove each required audit category detects intentional failures.
- MM-06 owns CLI snapshot construction, human/JSON reports, and slice gate integration.

Gate 0 MM-06 outcome:
- `krn audit repo [--repo <path>] [--json]` builds a repo snapshot in `packages/cli`, runs the harness audit checks, emits text or JSON, and exits non-zero only on blocking findings.
- `krn audit slice --since <ref> [--repo <path>] [--json]` builds a changed-file snapshot from git diff, runs the same checks, includes handoff compactness, and works as a slice gate.
- Seeded CLI tests prove clean repo pass, forbidden surface fail, and slice boundary violation fail.
- Dogfood smoke on the current repo root returns advisory, not fail: two existing CLI `JSON.parse` type-safety warnings remain as future cleanup candidates, while the current slice gate reports only missing handoff warning before commit.

Gate 0 MM-07 outcome:
- The audit CLI has been dogfooded on KRN itself and recorded in `docs/runs/2026-06-22-memory-brain-audit-dogfood.md`.
- Current repo state is audit-advisory, not audit-fail: no blocking architecture/surface/boundary findings were reported.
- Known warnings are explicit: two existing CLI `JSON.parse` boundaries and one slice handoff warning.
- Gate 0 audit foundation is ready to support MM-08 observation contract reconciliation.

Gate 1 MM-08 outcome:
- Pure observation domain contracts are reconciled with the controlled plan.
- Observations remain staging records, not Memory Core, SourceClaim, or final truth.
- Source-range policy and validation remain pure core logic with explicit user-preference/local-operator-note exemptions.
- Temporal scope now names `referencedAt` and `relativeTimeBase` for future relative-date and referenced-time handling.

Gate 1 MM-09 outcome:
- Observation IO schemas now exist in `packages/schema`.
- External observation group/item input is parsed from `unknown` through Zod before use.
- Unsourced factual/run-event observations and private reasoning metadata are rejected at the schema boundary.
- At MM-09 close, no DB, repository, CLI, worker, or runtime observation behavior existed yet; MM-10 owned persistence schema.

Gate 1 MM-10 outcome:
- Observation staging persistence now exists in `packages/db` with migration `0009_dusty_tattoo.sql`.
- The schema separates groups, items, source ranges, entity edges, claim edges, and feedback events.
- Query-critical fields are relational: project, run, task, group, kind, status, priority, provenance, temporal anchors, and source references.
- Live DB readiness now reports 10/10 migrations applied.
- At MM-10 close, no repository, observe CLI/runtime, worker, reflection, activation prefix selector, or Memory Core mutation behavior existed yet; MM-11 owned repositories.

Gate 1 MM-11 outcome:
- Observation repository adapter now exists in `packages/db`.
- Repository reads return core `ObservationGroup`, `ObservationItem`, and `ObservationSourceRange` shapes rather than raw DB rows.
- `findByScope` requires `projectId`, so project-scoped observation reads cannot silently become global reads.
- Source ranges, entity links, claim links, and feedback events are written through typed repository methods.
- At MM-11 close, no observe CLI/runtime, worker, reflection, activation prefix selector, or Memory Core mutation behavior existed yet; MM-12 owned evidence/source range linkage.

Gate 1 MM-12 outcome:
- Observation writes now enforce source-range requirements at the repository boundary before inserting items or linking ranges.
- Factual observations cannot be stored through this repository path unless at least one source range carries a typed evidence FK.
- Explicit local operator/user preference style notes may remain unsourced when the core observation source-range policy allows that provenance.
- `recallRawEvidence(observationItemId)` can reconstruct raw material from linked `run_events`, `source_chunks`, `evidence_bundles`, `review_assessments`, and `feedback_deltas` where those links exist.
- Source types without a typed evidence FK remain recallable only as unavailable source-range records; MM-13 owns deterministic observer input building, not broader evidence ingestion.
- At MM-12 close, no observe CLI/runtime, worker, reflection, activation prefix selector, or Memory Core mutation behavior existed yet; MM-13 owned observer input construction.

Gate 1 MM-13 outcome:
- `buildObserverInput` creates a deterministic observer input packet from already loaded run events, evidence bundles, review assessments, and feedback deltas.
- Run events are ordered by sequence; evidence and review records are ordered deterministically.
- The builder records counts, source type/id/locator, observed time, human text, compact payload JSON, redaction paths, and truncation records.
- Secret-like keys are redacted before output, and oversized payload JSON is truncated with retained/original character counts.
- At MM-13 close, no observe CLI/runtime, DB query orchestration, worker, LLM observer call, reflection, activation prefix selector, or Memory Core mutation behavior existed yet; MM-14 owned the source-range policy matrix.

Gate 1 MM-14 outcome:
- `OBSERVATION_SOURCE_RANGE_POLICY` is the canonical pure core source-range matrix for every observation kind and provenance kind.
- `requiresObservationSourceRange(kind, provenanceKind)` now reads from that matrix instead of a hidden provenance-only exemption set.
- Table-driven tests cover every current observation kind and provenance kind.
- The only source-range exemptions remain explicit `user_preference` and `local_operator_note` provenance.
- At MM-14 close, no schema, DB, repository, observe CLI/runtime, worker, reflection, activation prefix selector, or Memory Core mutation behavior existed yet; MM-15 owned the first manual observe-run CLI.

Gate 1 MM-15 outcome:
- `krn observe --run <id> [--persist]` is parsed and routed through the CLI.
- The command reads a persisted harness run, builds deterministic observer input, and reports item/redaction/truncation counts.
- Without `--persist`, the command previews only; with `--persist`, it creates one observation group and candidate fact observations with source ranges back to the run evidence.
- The command reports `Memory mutation: none` and does not call the memory repository or create MemoryRecord rows.
- At MM-15 close, no observer worker, LLM observer call, reflection, activation prefix selector, or Memory Core mutation behavior existed yet; MM-16 owned observation prefix selection.

Gate 1 MM-16 outcome:
- `selectObservationPrefix` returns a small task-scoped observation prefix with selected observations, reasons, scores, warnings, exclusions, and rendered text.
- The selector excludes cross-project, invalidated/deprecated/superseded, and stale observations with explicit reasons.
- Ranking is deterministic and based on task-term matches, priority, and confidence.
- Budget overflow is recorded as an exclusion instead of silently disappearing.
- No DB integration, context assembly integration, observe CLI integration, observer worker, LLM call, reflection, or Memory Core mutation behavior exists yet; MM-17 owns dogfooding observations from a KRN run.

## Milestones

### Gate 0 — Plan correction and audit foundation

Purpose:
Replace the over-expanded roadmap with a clean Memory Brain plan, then add the audit machinery that lets the user stop manually supervising every slice.

At the end:
- docs/plans/memory-ideal-state/PLAN.md is this living ExecPlan.
- research/pattern layer is removed from memory roadmap.
- repo audit baseline exists.
- AuditBundle exists and is integrated into slice handoff.
- `krn audit repo` and `krn audit slice --since <ref>` can produce reviewable summaries.

Slices:

MM-01 — Replace roadmap with clean PLAN.md and controlled GOAL
- Scope: docs only.
- Update docs/plans/memory-ideal-state/PLAN.md, GOAL.md, MM-ROADMAP.md, DECISIONS.md, REJECTIONS.md, FALSIFIERS.md.
- Remove target architecture entries for Research Foundry, Pattern Vault, research experiment DB/CLI, pattern promote CLI, meta-researcher runtime.
- Keep only golden memory behavior tests and optional Promptfoo export in eval lane.
- Verification:
      pnpm typecheck
      pnpm test
      git diff --check
      staged-docs-only scope check
      grep proves no roadmap slice creates Research Foundry/Pattern Vault/research DB/research CLI/pattern CLI.

MM-02 — Repo audit baseline
- Scope: inspect current repo and write baseline audit docs/artifact.
- Create or update docs/plans/memory-ideal-state/AUDIT_BASELINE.md.
- Record package boundaries, current DB readiness, current forbidden surfaces, current not-built list.
- Verification:
      pnpm typecheck
      pnpm test
      pnpm db:ready
      krn doctor if available
      forbidden surface scan.

MM-03 — AuditBundle core domain contract
- Scope: packages/core only.
- Add pure AuditBundle and audit finding types.
- No DB, no CLI, no fs/env/network in core.
- Verification:
      typecheck
      unit tests for finalVerdict and finding severity.

MM-04 — AuditBundle schemas and persistence
- Scope: packages/schema and packages/db.
- Add Zod schemas and audit_bundles/audit_findings tables or compatible existing tables.
- Add migrations.
- Verification:
      typecheck
      tests
      db:ready
      migration smoke.

MM-05 — Audit checks
- Scope: packages/harness or dedicated audit module, plus tests.
- Implement RepoSurfaceAudit, ArchitectureDriftAudit, BoundaryAudit, TypeSafetyAudit, MemorySemanticsAudit, SourceGroundingAudit, EvalTheaterAudit, HandoffCompactAudit.
- Slice note (2026-06-22): implement a pure harness audit-check module over typed snapshot inputs, exported for later CLI use. Intended files: `packages/harness/src/audit/*`, `packages/harness/src/index.ts`, focused harness tests, and this PLAN. Non-goals: no CLI command, no filesystem traversal, no shell/process execution, no DB writes, no worker, no dashboard/API/MCP/server/plugin, no source crawler, no Research Foundry, no Pattern Vault, no runtime markdown memory, no `.krn` runtime truth, no Redis/Kafka, and no separate vector/graph DB.
- Verification:
      fixtures with intentional violations are detected.

MM-06 — Audit CLI and slice gate
- Scope: packages/cli.
- Add `krn audit repo` and `krn audit slice --since <ref>`.
- Output compact human-readable report and machine-readable JSON.
- Slice note (2026-06-22): implement CLI adapter only. Intended files: `packages/cli/src/parseArgs.ts`, `packages/cli/src/runCli.ts`, `packages/cli/src/runAuditCommand.ts`, focused CLI tests, and this PLAN. The CLI may read repo files and git status/diff to build `AuditRepoSnapshot`, but audit decisions must come from `@krn/harness` checks. Non-goals: no DB persistence/write path, no worker, no dashboard/API/MCP/server/plugin, no source crawler, no broad eval suite, no Research Foundry, no Pattern Vault, no runtime markdown memory, no `.krn` runtime truth, no Redis/Kafka, and no separate vector/graph DB.
- Verification:
      command smoke
      clean repo produces pass/advisory
      seeded violation produces fail.

MM-07 — Audit dogfood
- Run audit on KRN itself.
- Capture evidence and compact handoff.
- Commit docs/run entry with results.
- Verification:
      audit output exists
      no forbidden surfaces
      next slice recommendation is clear.

### Gate 1 — Observational Memory staging layer

Purpose:
Turn run/source/tool/review history into dated, source-ranged observations. Observations are evidence staging records, not Memory Core.

At the end:
- Observation domain/schema/DB/repositories exist.
- Observations link back to evidence/source ranges.
- `krn observe --run <id>` can create observation records from an existing run.
- Observation prefix selector can provide a small activation prefix.
- Observations cannot become memory directly.

Slices:

MM-08 — Observation domain contracts
- Add ObservationScope, ObservationGroup, ObservationItem, ObservationSourceRange, ObservationTemporalScope, ObservationKind, ObservationPriority, ObservationConfidence, ObservationStatus, ObservationProvenanceKind.
- Add requiresObservationSourceRange and validateObservationContract.
- Rule: factual/procedural/decision/risk/conflict/slang/gap observations need source ranges except explicit user preference/local operator note.
- Slice note (2026-06-22): reconcile the existing `packages/core/src/observations/*` contracts from `acca6d2` against the controlled MM-08 requirements. Intended files: `packages/core/src/observations/*`, core observation tests, core exports if needed, and this PLAN. Non-goals: no Zod schemas, DB schema, migrations, repositories, CLI, workers, observer runtime, reflector runtime, dashboard/API/MCP/server/plugin, source crawler, Research Foundry, Pattern Vault, runtime markdown memory, `.krn` runtime truth, Redis/Kafka, or separate vector/graph DB.
- Verification:
      tests reject factual observation without source range
      tests allow explicit user preference without source range
      no DB imports in core.

MM-09 — Observation IO schemas
- Add Zod schemas for observation inputs/outputs.
- Treat all external input as unknown until parsed.
- Slice note (2026-06-22): add schema-owned Zod IO contracts for observation groups, items, temporal scopes, source ranges, entity links, and claim links. Intended files: `packages/schema/src/observation.ts`, schema exports/tests, and this PLAN. Non-goals: no DB schema, migrations, repositories, CLI, workers, observer runtime, reflector runtime, dashboard/API/MCP/server/plugin, source crawler, Research Foundry, Pattern Vault, runtime markdown memory, `.krn` runtime truth, Redis/Kafka, or separate vector/graph DB.
- Verification:
      invalid fixtures fail
      schema inference matches core contracts.

MM-10 — Observation DB schema
- Add observation_groups, observation_items, observation_source_ranges, observation_entity_edges, observation_claim_edges, observation_feedback_events.
- Include project_id scope and temporal columns.
- Slice note (2026-06-22): add Drizzle/Postgres schema and generated migration for observation staging tables only. Intended files: `packages/db/src/schema/observations.ts`, `packages/db/src/schema/observations.test.ts`, `packages/db/src/schema/index.ts`, generated migration files, and this PLAN. Stable query fields must be relational: project/run/group/kind/status/priority/provenance/temporal/source references. JSONB is limited to scope/metadata payloads. Non-goals: no repositories, no CLI, no observe runtime, no worker, no reflection, no activation prefix selector, no dashboard/API/MCP/server/plugin, no source crawler, no Research Foundry, no Pattern Vault, no runtime markdown memory, no `.krn` runtime truth, no Redis/Kafka, and no separate vector/graph DB.
- Verification:
      migration applies
      db:ready passes
      no source crawler.

MM-11 — Observation repositories
- Add ObservationRepository with createGroup, addItems, findByRun, findByScope, linkSourceRange, recordFeedback.
- Return domain types, not raw DB rows.
- Slice note (2026-06-22): add a thin DB repository adapter for the existing observation staging tables. Intended files: `packages/db/src/repositories/DrizzleObservationRepository.ts`, `packages/db/src/repositories/DrizzleObservationRepository.test.ts`, `packages/db/src/repositories/index.ts`, optional pure core observation feedback type if recordFeedback needs a domain return shape, and this PLAN. Repository methods must return core observation domain objects, enforce project scope for scoped reads, and keep source-range lineage explicit. Non-goals: no new migrations unless a schema defect blocks repository behavior, no CLI, no observe runtime, no worker, no reflection, no activation prefix selector, no Memory Core mutation, no dashboard/API/MCP/server/plugin, no source crawler, no Research Foundry, no Pattern Vault, no runtime markdown memory, no `.krn` runtime truth, no Redis/Kafka, and no separate vector/graph DB.
- Verification:
      repository tests
      project scoping tests.

MM-12 — Evidence/source range linkage
- Link observations to run_events, tool_traces, evidence_bundles, source_chunks, review_feedback where available.
- Verification:
      observation can recall raw evidence
      factual observation without evidence source is blocked or marked as explicit unsourced note.

MM-13 — Observer input builder
- Build deterministic observer input from run events/tool traces/evidence/review.
- No LLM call required in this slice unless existing infra supports it.
- Verification:
      fixture run produces normalized observer input
      input excludes secrets and oversized raw dumps.

MM-14 — Observation source-range policy matrix
- Implement and test source requirement matrix for every ObservationKind.
- Verification:
      table-driven tests cover all kinds and provenance exceptions.

MM-15 — Manual observe-run CLI
- Add `krn observe --run <id>`.
- For first version, generate deterministic observation candidates from structured evidence; optional model-backed enrichment must be gated and off by default.
- Verification:
      command creates observation group
      no MemoryRecord is created
      audit records observation != memory.

MM-16 — Observation prefix selector
- Add selectObservationPrefix(taskContract/projectId).
- Output small prefix with observations, warnings, confidence, and reasons.
- Verification:
      noisy fixture returns small prefix
      stale/invalidated observations excluded.

MM-17A — Current-state reconciliation gate
- Objective: reconcile public current-state truth before dogfood. README, root PLAN/GOAL if present, this memory PLAN current-state section, REVIEW, and handoff/audit docs must not claim “no CLI,” “observation DB not built,” or “observation repository/runtime not built” after MM-16.
- Source: both harsh review reports independently flagged documentation drift as a critical risk.
- Intended files: `README.md`, root `PLAN.md`/`GOAL.md` if they contain stale state, `docs/plans/memory-ideal-state/PLAN.md`, `REVIEW.md`, and any current handoff/status doc that contradicts MM-16.
- Verification:
      grep proves stale phrases are gone or scoped as historical evidence only
      docs identify current head, completed MM-16, and MM-17 as next
      no code/runtime/schema changes
      pnpm typecheck
      pnpm test
      git diff --check
      staged docs-only scope check.
- Non-goals: no observe dogfood, no DB write, no reflection, no Memory Core mutation, no dashboard/API/MCP/server/plugin, no source crawler, no Research Foundry, no Pattern Vault.
- Falsifier: a fresh agent can still read a canonical current-state doc and believe observation DB/CLI/repository are not built.

MM-16R — Observation prefix relevance and scope hardening
- Objective: priority/confidence may boost relevant observations, but must not make unrelated observations relevant. Unscoped observations must not enter a project-scoped prefix by default.
- Source: both harsh review reports flagged priority/confidence-only selection and project-scope looseness.
- Intended files: `packages/harness/src/observations/observationPrefix.ts`, `packages/harness/src/observations/observationPrefix.test.ts`, this PLAN.
- Verification:
      high-priority/high-confidence observation with zero task/entity/source/run relation is excluded
      relevant lower-priority observation can be included when it matches task terms or run/task scope
      observation with different projectId is excluded
      observation without projectId is excluded or explicitly quarantined in project-scoped selection
      warnings/exclusions explain the reason.
- Non-goals: no vector search, no activation v2, no DB/repository changes, no context assembly integration, no Memory Core mutation.
- Falsifier: unrelated observation appears in prefix because it is high priority or high confidence.

MM-17 — Observation dogfood
- Observe one KRN evidence run.
- Capture resulting observation group and handoff.
- Verification:
      observations have source ranges
      observation prefix can be selected for a follow-up task.

MM-17B — Observation dogfood with raw recall matrix
- Objective: run real DB-backed `krn observe --run <persisted KRN run> --persist`, commit dogfood evidence, and prove observation rows/source ranges/raw evidence recall/no MemoryRecord mutation.
- Source: both harsh review reports said MM-17 must be behavioral proof, not a docs laurel.
- Intended files: `docs/runs/<date>-observation-dogfood.md`, this PLAN, and only tests/code if dogfood exposes a defect that blocks proof.
- Verification:
      `psql` before/after counts for observation_groups, observation_items, observation_source_ranges, memory_records
      `krn observe --run <id>` preview output captured
      `krn observe --run <id> --persist` output captured
      persisted observation group id and item ids captured
      source ranges have typed evidence FKs where expected
      `recallRawEvidence` sample proves raw evidence can be reconstructed
      `selectObservationPrefix` sample proves a follow-up task can select a small prefix
      memory_records count is unchanged
      pnpm typecheck
      pnpm test
      pnpm db:ready
      git diff --check
      forbidden scans.
- Non-goals: no LLM observer, no observer worker, no reflection, no MemoryRecord, no promotion, no dashboard/API/MCP/server/plugin.
- Falsifier: dogfood doc only says command ran, but does not prove persisted observations, raw recall, prefix selection, and no memory delta.

MM-17C — Typed source-range lineage invariants
- Objective: enforce sourceType to typed-FK consistency and typed raw-evidence linkage for truth-bearing observations.
- Source: both reports flagged adapter-level lineage, missing typed FK checks for non-fact truth-bearing kinds, and inconsistent sourceType/FK combinations.
- Intended files: `packages/db/src/repositories/DrizzleObservationRepository.ts`, repository tests, schema tests if IO create input is extended, this PLAN.
- Verification:
      `sourceType: "run_event"` requires `runEventId`
      `sourceType: "source_chunk"` requires `sourceChunkId`
      `sourceType: "evidence_bundle"` requires `evidenceBundleId`
      `sourceType: "review_assessment"` requires `reviewAssessmentId`
      `sourceType: "feedback_delta"` requires `feedbackDeltaId`
      multiple canonical typed FKs on one range are rejected
      truth-bearing kinds fact/decision/correction/risk/procedure/conflict require at least one typed evidence-linked range unless provenance is explicit user_preference/local_operator_note
      `linkSourceRange` validates combined existing + new ranges so auxiliary ranges do not break an already evidenced fact.
- Non-goals: no new source crawler, no broad evidence model, no reflection, no Memory Core mutation.
- Falsifier: a truth-bearing observation can be persisted with only decorative sourceId and no recallable raw evidence FK.

MM-17D — Project-scoped observe runtime
- Objective: remove hardcoded observe project assumptions and prove observe writes under the project associated with the persisted run or an explicit project argument.
- Source: both reports flagged hardcoded `local` / `mise-en-palace` and cross-project leakage risk.
- Intended files: `packages/cli/src/runObserveCommand.ts`, `packages/cli/src/databaseRuntime.ts` if needed, CLI tests, this PLAN.
- Verification:
      observe derives project/workspace from persisted run aggregate when available
      or command requires explicit `--project` when project cannot be resolved
      two-project test proves observing project A run does not create/select project B observations
      prefix selector excludes unscoped observations in project-scoped mode.
- Non-goals: no multi-project dashboard, no API/MCP, no broad project registry rewrite unless current runtime cannot resolve scope.
- Falsifier: `krn observe --run` still writes to hardcoded local/mise-en-palace scope.

MM-17E — Observation schema/core parity and timestamp validation
- Objective: prevent core/schema observation policy drift and make temporal comparisons valid.
- Source: both reports flagged schema/core policy duplication and loose ISO timestamp validation.
- Intended files: `packages/schema/src/observation.ts`, schema tests, core/schema parity tests or shared fixtures, this PLAN.
- Verification:
      schema rejects invalid datetime strings for observedAt/ingestedAt/validUntil/reference fields
      stale comparison uses normalized datetime or parsed epoch, not arbitrary string ordering
      test fails when core ObservationKind/ObservationProvenanceKind differs from schema enum coverage
      test fails when source-range exemption policy diverges between core and schema.
- Non-goals: no package topology refactor unless required, no DB migration unless schema behavior cannot be represented otherwise.
- Falsifier: adding a new observation kind/provenance changes core behavior without schema test failure.

MM-17F — Observer payload redaction hardening
- Objective: prevent secret-shaped values from being persisted in observer payloads, not only secret-looking keys.
- Source: harsh review flagged key-only redaction as insufficient before dogfood persists payloads.
- Intended files: `packages/harness/src/observations/observerInput.ts`, `packages/harness/src/observations/observerInput.test.ts`, this PLAN.
- Verification:
      key-based secrets are redacted
      neutral key containing `Bearer ...`, token-like strings, API-key-like strings, cookies, or private-key blocks is redacted
      redaction report lists paths
      truncated payload cannot expose unredacted secret suffix/prefix.
- Non-goals: no external secret scanner unless already accepted, no source crawler, no LLM.
- Falsifier: secret-shaped value survives into `ObserverInputItem.payload`.

### Gate 2 — Reflection / dreaming as candidate generation

Purpose:
Synthesize observations into candidates, gaps, contradictions, and anti-memory proposals. Reflection is offline/manual or explicitly invoked. It does not mutate Memory Core.

At the end:
- Reflection records exist.
- Reflection creates MemoryCandidate, SourceClaimCandidate, AntiMemoryCandidate, EvalCandidate.
- Reflection records contradictions and gaps.
- `krn reflect --scope ...` works.
- Tests prove reflection cannot write MemoryRecord.

Slices:

MM-18 — Reflection domain contracts
- Add ReflectionRecord, ReflectionInput, ReflectionOutput, ReflectionScope, ReflectionFinding, ContradictionReport, GapReport.
- Verification:
      pure tests
      no DB imports in core.

MM-18A — Reflection candidate-only contract guard
- Objective: make reflection outputs candidate-only before any manual reflect runtime exists. Reflection may produce findings, gaps, contradictions, SourceClaimCandidate, MemoryCandidate, AntiMemoryCandidate, PolicyCandidate, and EvalCandidate records, but cannot create MemoryRecord or SourceDecision truth directly.
- Source: both harsh reports warned that reflection would amplify weak observation semantics unless mutation paths are sealed first.
- Intended files: `packages/core/src/reflection/*`, reflection tests, import/audit tests if the module exists, this PLAN.
- Verification:
      reflection contracts expose candidate/proposal outputs only
      no reflection type imports MemoryRecord write commands or repository adapters
      tests assert reflection output cannot contain promotion-to-memory semantics
      forbidden import scan proves reflection core has no DB/Drizzle/fs/process/network imports.
- Non-goals: no reflection DB tables, no CLI, no worker, no LLM call, no Memory Core mutation.
- Falsifier: a reflection output type or helper can create or imply an active MemoryRecord.

MM-19 — Reflection schemas and DB
- Add schemas and DB tables for reflection_records and reflection_inputs/outputs if needed.
- Verification:
      migrations
      schema tests.

MM-20 — Reflection repositories and input selector
- Add ReflectionRepository.
- Build input selector over observation groups, source claims, anti-memory warnings, and task/project scope.
- Verification:
      selector respects project isolation
      selector includes contradictions instead of hiding them.

MM-21 — Candidate generation from reflection
- Add deterministic candidate generation contracts first.
- Candidates:
      MemoryCandidate
      SourceClaimCandidate
      AntiMemoryCandidate
      EvalCandidate
- Verification:
      reflection creates candidates only
      no direct MemoryRecord insert.

MM-22 — Contradiction and gap reports
- Add reports for contested claims, missing source ranges, stale observations, duplicate observations, and unsupported decisions.
- Verification:
      fixtures produce expected contradiction/gap findings.

MM-23 — Manual reflect CLI
- Add `krn reflect --scope run:<id>|project:<id>|topic:<name>`.
- CLI writes ReflectionRecord and candidates.
- Verification:
      command smoke
      no automatic promotion.

MM-24 — Mutation guard
- Add test/audit proving reflection cannot mutate Memory Core directly.
- Verification:
      attempted direct promotion path fails.

MM-24A — Reflection no-Memory-Core mutation proof
- Objective: turn “reflection cannot mutate Memory Core” into a repository/runtime invariant, not a documentation statement.
- Source: both reports flagged MemoryRepository promotion paths as dangerous once reflection and CLI paths arrive.
- Intended files: reflection repository/tests, manual reflect CLI tests if MM-23 exists, memory repository boundary tests, audit checks if available, this PLAN.
- Verification:
      running reflection leaves `memory_records` row count unchanged
      reflection runtime path has no direct call to `createMemoryRecord` or `promoteMemoryCandidate`
      import scan blocks reflection modules from depending on low-level memory promotion APIs
      audit finding exists for forbidden reflection-to-memory mutation.
- Non-goals: no MemoryReviewGate implementation in this slice unless needed to block mutation, no auto-promotion, no dashboard/API/MCP.
- Falsifier: `krn reflect` or reflection repository code can change `memory_records`.

MM-25 — Reflection dogfood
- Reflect over the observation group from MM-17.
- Capture memory/source/anti-memory/eval candidates.
- Verification:
      candidates are reviewable
      contradictions/gaps are visible.

### Gate 3 — Governed Memory Core

Purpose:
Promote only reviewed candidates into temporal, source-linked, invalidatable, feedback-aware Memory Core.

At the end:
- MemoryRecord invariants are enforced.
- Promotion path exists.
- Invalidation, versioning, feedback, demotion, anti-memory, abstain, and health audit work.
- One real KRN review lesson is promoted and later applied.

Slices:

MM-26 — MemoryRecord invariant hardening
- Enforce source lineage, application guidance, confidence, owner, validity/invalidation for temporal records.
- Verification:
      invalid memory fixtures rejected.

MM-26A — Memory write-surface guard
- Objective: make MemoryReviewGate or a dedicated promotion service the only product/runtime path from candidate to active MemoryRecord, while keeping low-level repository methods internal/test-only.
- Source: both harsh reports found `MemoryRepository.createMemoryRecord` and `promoteMemoryCandidate` before the review gate and called it the highest-risk governance bypass.
- Intended files: `packages/core/src/memory*`, `packages/harness/src/memory*` or equivalent gate module, `packages/db/src/repositories/DrizzleMemoryRepository.ts`, CLI tests when promotion commands exist, audit checks, this PLAN.
- Verification:
      candidate promotion requires reviewer identity, source lineage, raw evidence inspection reference, application guidance, invalidation strategy for temporal memory, and bounded confidence
      normal CLI/worker/harness paths cannot call low-level `createMemoryRecord` directly
      direct repository promotion is allowed only behind gate/internal smoke tests and is flagged by audit elsewhere
      confidence is constrained to the accepted scale.
- Non-goals: no auto-promotion, no dashboard/API/MCP, no LLM decision-making.
- Falsifier: a candidate becomes active memory through a status check or direct repository call without review gate evidence.

MM-27 — MemoryReviewGate and promotion
- Add review gate for MemoryCandidate -> MemoryRecordVersion.
- CLI may be `krn memory review` and `krn memory promote` if consistent with existing CLI.
- Verification:
      candidate without required evidence cannot promote
      approved candidate promotes with version.

MM-28 — Invalidation and versioning
- Add supersede/invalidate/demote/version behavior.
- Verification:
      invalidated memory excluded from activation
      previous version remains auditable.

MM-29 — Feedback application
- Apply MemoryFeedbackEvent to strengthen/decay/demote memory.
- Verification:
      hurt/stale feedback changes ranking or status.

MM-29A — Feedback demotion and invalidation candidates
- Objective: convert repeated `hurt`/`stale` feedback into review-required demotion or invalidation candidates instead of counters that never affect active memory.
- Source: harsh review flagged memory feedback counters without demotion/invalidation as slow memory poisoning.
- Intended files: memory feedback policy module, memory repository tests, memory health audit tests, this PLAN.
- Verification:
      repeated hurt/stale feedback creates review-required demotion/invalidation candidate or health finding
      active memory is not silently trusted after negative feedback threshold
      no automatic invalidation happens without review unless an explicit policy says so
      activation can surface warning or abstain when memory has unresolved negative feedback.
- Non-goals: no automatic destructive memory deletion, no dashboard, no broad eval suite.
- Falsifier: stale/hurt feedback increments counters indefinitely with no candidate, status, warning, or audit finding.

MM-30 — Anti-memory enforcement
- Ensure AntiMemoryRecord blocks stale/rejected/harmful patterns during activation.
- Verification:
      anti-memory fixture excludes tempting stale memory.

MM-30A — Anti-memory enforcement expansion
- Objective: apply anti-memory to memory records, source claims, search documents, and observation prefixes using explicit IDs/keys before considering fuzzy matching.
- Source: both reports found current anti-memory enforcement too narrow, blocking only source_claim candidates by invalidated source claim id.
- Intended files: `packages/harness/src/activation/conflictFilter.ts`, activation tests, observation prefix integration tests when present, memory/retrieval models if needed, this PLAN.
- Verification:
      anti-memory referencing a memory key excludes matching memory_record candidate with trace reason
      anti-memory referencing a source claim excludes source_claim and derived search_document candidates where link is explicit
      anti-memory can block an observation prefix item before context assembly
      activation trace persists exclusion reason.
- Non-goals: no fuzzy semantic blocker, no separate graph/vector DB, no broad crawler.
- Falsifier: stale/rejected material enters context through memory_record, search_document, or observation prefix despite active anti-memory.

MM-31 — Memory abstain behavior
- Retrieval can explicitly abstain when confidence/source/temporal support is weak.
- Verification:
      weak-memory fixture returns abstain warning.

MM-32 — Memory health audit
- Audit stale high-confidence memory, missing application feedback, unsupported memory, high hurt count, and no lineage.
- Verification:
      seeded bad memory records produce findings.

MM-32B — Audit CLI consumes real AuditBundle and semantic DB snapshots
- Objective: upgrade audit from useful file/snapshot smoke alarm to a slice gate that can inspect intended files, verification evidence, and DB-backed memory/source/eval/observation state.
- Source: both reports flagged `intendedFiles: []`, empty verification command state, and missing semantic memory/source/eval snapshots.
- Intended files: `packages/cli/src/runAuditCommand.ts`, audit snapshot builders, audit tests, DB snapshot readers if available, this PLAN.
- Verification:
      audit can ingest intended files from AuditBundle or explicit CLI options
      missing verification output produces finding
      DB-backed snapshot readers cover MemoryCandidate, MemoryRecord, SourceClaim, SourceDecision, EvalCandidate, ObservationGroup, and ActivationDecision where tables exist
      audit distinguishes file-scan proof from semantic memory governance proof
      optional `--fail-on warning` exists for CI/slice gate usage.
- Non-goals: no dashboard, no CI service, no broad benchmark suite.
- Falsifier: audit can report pass/advisory for an implementation slice while intended files, verification commands, and semantic DB snapshots are all empty.

MM-33 — Memory dogfood
- Promote one reviewed KRN lesson.
- Later plan must show it applied or abstained correctly.
- Verification:
      promoted memory has lineage, guidance, confidence, invalidation strategy.

### Gate 4 — Source Graph

Purpose:
Make sources decision-supporting records, not decorative citations.

At the end:
- Source claims and decision edges enforce mechanism, doesNotProve, trust, temporal scope.
- Unsupported and decorative sources are rejected.
- Source graph health audit catches bloat.

Slices:

MM-34 — SourceClaim and SourceDecisionEdge hardening
- Enforce claim type, mechanism, trust tier, support type, consumer, doesNotProve.
- Verification:
      decorative source fixture rejected.

MM-35 — Source rejection workflow
- Add source_rejections behavior and CLI/report surface if needed.
- Verification:
      rejected source cannot support decision.

MM-36 — Trust and temporal source behavior
- Add trust scoring and temporal validity for claims.
- Verification:
      latest weak source cannot override stronger older consensus without reason.

MM-37 — Source graph health audit
- Detect decorative sources, decisions without sources, sources without consumers, stale claims.
- Verification:
      seeded failures detected.

MM-38 — Source dogfood
- Apply source-to-decision to one KRN memory/observation decision.
- Verification:
      decision has source edge and doesNotProve.

### Gate 5 — Activation Engine v2

Purpose:
Replace naive retrieval with a task-specific activation engine that selects a small field of awareness.

At the end:
- Activation combines memory, source, observation, anti-memory, trust, temporal filters, context ROI, dedup, exclusions, and raw recall triggers.
- ContextAssembly is small, reasoned, and auditable.

Slices:

MM-39 — ActivationQuery model
- Unify task, project, scope, memory/source/observation needs, budget, and risk.
- Verification:
      pure tests.

MM-40 — Hybrid candidate merge
- Merge lexical, vector, graph, source, memory, and observation candidates.
- Use existing Postgres/pgvector/FTS capabilities; no new store.
- Verification:
      fixture with duplicates merges correctly.

MM-41 — Trust/temporal/invalidation/anti-memory filters
- Filter invalid, stale, low-trust, blocked, and superseded candidates.
- Verification:
      anti-memory and TTL fixtures pass.

MM-42 — ContextROI, diversity, dedup, inclusions/exclusions
- Rank final context by expected decision impact vs cost.
- Persist inclusions and exclusions with reasons.
- Verification:
      noisy fixture returns small context with explicit exclusions.

MM-43 — Activation trace and raw recall trigger
- Persist activation decision trace.
- Trigger raw evidence recall when exact proof is needed or confidence is low.
- Verification:
      low-confidence task asks for raw recall instead of confident answer.

MM-44 — Observation prefix integration
- Include small observation prefix when it improves context.
- Verification:
      prefix is small and source-ranged.

MM-44A — Observation prefix integration gate
- Objective: wire observation prefix into activation/context assembly only after relevance, project-scope, typed-lineage, and anti-memory hardening are complete.
- Source: both reports warned that prefix integration before hardening would reintroduce context bloat through a new channel.
- Intended files: `packages/harness/src/activation/*`, `packages/harness/src/observations/observationPrefix.ts`, context assembly tests, this PLAN.
- Verification:
      irrelevant high-priority observation is excluded from activation context
      unscoped observation is excluded from project-scoped context
      valid project-scoped observation appears as a small rendered prefix with source-range reason
      anti-memory can exclude observation prefix items
      prefix remains a rendered activation artifact, not MemoryRecord truth.
- Non-goals: no reflection, no memory promotion, no broad vector search rewrite.
- Falsifier: activation/context assembly includes a broad observation dump or unrelated high-priority note.

MM-45 — Activation dogfood
- Compare one KRN memory task before/after observation prefix.
- Verification:
      context precision improves or result is marked revisit; no automatic product mutation.

### Gate 6 — Capability Compiler

Purpose:
Choose skill/rule/policy/tool bindings based on task needs without turning TaskContract into requiredSkills.

At the end:
- CapabilityCompiler maps task requirements to bindings.
- Skill/rule/policy lifecycle is reviewed and auditable.
- Product-emitted skills remain bounded engineering disciplines.

Slices:

MM-46 — Capability domain hardening
- Add/adjust CapabilityRequirement, CapabilityPlan, binding kinds.
- Verification:
      grep proves TaskContract does not own requiredSkills as core primitive.

MM-47 — CapabilityCompiler v1
- Compile task/risk/context into skill/rule/policy/tool bindings.
- Verification:
      fixtures route memory task to memory/source/audit skills.

MM-48 — Binding models
- Add SkillBinding, RulePackBinding, PolicyGateBinding, ToolBoundaryBinding.
- Verification:
      invalid binding rejected.

MM-49 — Lifecycle without auto-growth
- Add skill/rule lifecycle events and review gate.
- No automatic skill/rule promotion.
- Verification:
      candidate requires review.

MM-50 — TypeScript and review-risk bindings
- Bind TS boundary review and diff-risk review when relevant.
- Verification:
      TS boundary fixture triggers type-review binding.

MM-51 — Capability dogfood
- Use compiler on a KRN memory implementation task.
- Verification:
      selected bindings are small, relevant, and auditable.

### Gate 7 — Evidence and review feedback loop

Purpose:
Make every run teach KRN without automatically mutating memory.

At the end:
- EvidenceBundle, ReviewAssessment, FeedbackDelta, candidates, risk scoring, rollback, and review CLI are hardened.
- One KRN slice is captured and produces candidates.

Slices:

MM-52 — EvidenceBundle hardening
- Ensure changed files, commands, tests, typecheck, diff summary, run IDs, and source references are captured.
- Verification:
      missing required evidence is rejected or flagged.

MM-53 — ReviewAssessment / FeedbackDelta hardening
- Normalize reviewer feedback, outcome, burden, risk, correction labels.
- Verification:
      fixtures produce stable deltas.

MM-54 — diff risk and review burden scoring v1
- Implement conservative heuristics.
- Verification:
      risky broad diff scores higher than narrow tested diff.

MM-55 — rollback path enforcement
- Require rollback path for non-doc/runtime/DB changes.
- Verification:
      missing rollback path triggers audit finding.

MM-56 — candidate extraction from feedback
- Extract MemoryCandidate, SourceClaimCandidate, AntiMemoryCandidate, EvalCandidate, ObservationCandidate as appropriate.
- Verification:
      feedback creates candidates, not final memory.

MM-57 — review assess CLI
- Add `krn review assess` or extend existing evidence capture.
- Verification:
      command writes ReviewAssessment and FeedbackDelta.

MM-58 — Feedback dogfood
- Capture feedback from one KRN slice.
- Verification:
      candidates generated and review burden/diff risk recorded.

### Gate 8 — Golden memory behavior evals

Purpose:
Prove KRN memory/context/source behavior with small golden cases. This is not a broad research/eval subsystem.

At the end:
- Golden cases exist.
- Runner exists.
- Memory, context, source, observation/reflection, anti-memory, audit, and TS boundary behavior are protected.
- Optional Promptfoo export exists only after core runner is stable.

Slices:

MM-59 — GoldenTask domain
- Add GoldenTask, GoldenCase, ExpectedBehavior, ProtectedFailureMode.
- Verification:
      pure tests.

MM-60 — Storage or fixture strategy
- Choose DB-backed or file fixture strategy based on existing eval architecture.
- Files may be fixtures, not runtime memory.
- Verification:
      fixtures load deterministically.

MM-61 — Memory behavior cases
- Cases:
      selects source-linked memory
      rejects stale memory
      abstains when weak
      respects temporal validity
      uses application guidance
- Verification:
      runner or fixture tests fail before behavior and pass after implementation.

MM-61-lite — Early golden memory smoke cases
- Objective: add a tiny behavior smoke set before the broad golden runner so the most dangerous memory failures have regression pressure early.
- Source: harsh review recommended early golden cases for stale memory abstain, anti-memory block, and unsupported source decision rejection before broader eval infrastructure.
- Intended files: existing test/fixture location for activation/source/memory behavior, this PLAN, and only minimal runner glue if no suitable test harness exists.
- Verification:
      stale memory case expects abstain or exclusion, not confident use
      active anti-memory blocks a tempting stale/rejected pattern
      unsupported SourceDecision is rejected or flagged
      each case fails against intentionally bad behavior and passes against desired behavior.
- Non-goals: no broad benchmark suite, no Promptfoo export, no research eval theater.
- Falsifier: the smoke cases only validate schema shape and do not protect behavior.

MM-62 — Context/source/audit/TS boundary cases
- Cases:
      rejects broad dump
      requires source doesNotProve
      audit finds forbidden surface
      unknown-first boundary enforced
- Verification:
      tests pass.

MM-63 — Observation/reflection/anti-memory cases
- Cases:
      observation != memory
      reflection creates candidates only
      anti-memory blocks rejected pattern
      gap report visible
- Verification:
      tests pass.

MM-64 — Golden eval runner
- Add `krn eval run --golden` or test runner integration.
- Verification:
      command/test emits pass/fail report.

MM-65 — Optional Promptfoo export
- Add export only if golden cases are stable.
- No Promptfoo dependency unless already accepted or isolated.
- Verification:
      exported config validates if Promptfoo available; otherwise snapshot only.

MM-66 — EvalCandidate promotion gate
- Promote real failures to golden tasks through review.
- Verification:
      candidate requires review.

MM-67 — Golden eval dogfood
- Run golden suite after a memory change.
- Verification:
      suite blocks at least one known-bad behavior fixture.

### Gate 9 — Macro behavior reports, not research layer

Purpose:
Analyze repeated failures across KRN traces once enough runs exist. This is reporting/eval, not Research Foundry.

At the end:
- KRN can compact traces into small docs and report recurring behavior patterns.
- Reports recommend inspection, not automatic architecture changes.

Slices:

MM-68 — Trace compaction document model
- Compact run traces into reviewable documents.
- Verification:
      compact doc contains outcome, findings, evidence links.

MM-69 — RunPopulation and finding models
- Add run_population, eval_finding, behavior_pattern types/storage if needed.
- Verification:
      multiple traces grouped.

MM-70 — Recurring failure detector report
- Add `krn eval macro --since <ref>` or equivalent report.
- Verification:
      seeded traces produce recurring pattern.

MM-71 — Macro report dogfood
- Run over KRN traces and record one actionable pattern or "insufficient data".
- Verification:
      no automatic code/memory mutation.

### Gate 10 — API/MCP boundary

Purpose:
Expose KRN state safely after DB/harness behavior is stable.

At the end:
- Boundary is read/propose/write.
- Read-only resources work.
- Proposal tools are audited.
- Write tools require approval.
- Destructive operations and prompt injection are tested.

Slices:

MM-72 — API/MCP boundary ADR refresh
- Docs decision only.
- Verification:
      no server implementation.

MM-73 — Tool model
- Add read/propose/write/destructive tool boundary model.
- Verification:
      destructive default denies without approval.

MM-74 — Read-only resources
- Implement minimal read-only MCP/API resources if boundary is ready.
- Resources: project, context, memory, source, run.
- Verification:
      no write side effects.

MM-75 — Proposal tools
- Add plan/evidence/audit/eval proposal tools.
- Verification:
      proposals create auditable candidate, not mutation.

MM-76 — Approval-gated write tools
- Add write behavior only with explicit approval token/audit event.
- Verification:
      denied write test.

MM-77 — Security tests
- Prompt-injection and destructive operation tests.
- Verification:
      known attacks blocked or flagged.

MM-78 — MCP/API dogfood
- Codex queries KRN memory/source through read-only resource.
- Verification:
      no memory write happens.

### Gate 11 — Multi-project scaling

Purpose:
Ensure memory/source/run state is isolated by project and repo installation.

At the end:
- Multiple repos/projects work without memory leakage.
- Activation and observations are project-scoped.

Slices:

MM-79 — Project registry hardening
- Harden project/repo installation lifecycle.
- Verification:
      duplicate connect is safe.

MM-80 — Project isolation
- Enforce project_id in memory/source/run/observation/eval paths.
- Verification:
      cross-project leak tests.

MM-81 — Activation/observation/eval scoping
- Ensure selectors use project scope.
- Verification:
      fixture with two projects selects only correct records.

MM-82 — Project CLI status
- Add or harden `krn projects list` and `krn project status` if needed.
- Verification:
      two repo fixtures.

MM-83 — Multi-project dogfood
- Run two project fixtures and prove isolation.
- Verification:
      no cross-project context/memory.

### Gate 12 — Dashboard/read models, only if useful

Purpose:
Add dashboard/read models only after typed objects exist. The dashboard is not product proof.

At the end:
- JSON read models exist.
- Optional UI exists only if every view has owner, threshold, and action.

Slices:

MM-84 — Dashboard/read-model ADR refresh
- Docs decision.
- Verification:
      no UI yet.

MM-85 — Health read models
- Read models for project, memory, source, review, eval, audit health.
- Verification:
      JSON export works.

MM-86 — export-json command
- Add `krn dashboard export-json` or equivalent.
- Verification:
      command read-only.

MM-87 — Minimal dashboard, optional
- Only if still useful and read models are stable.
- Every view has action/owner/threshold.
- Verification:
      no vanity-only view.

MM-88 — Dashboard/read-model dogfood
- Read model identifies one actionable issue.
- Verification:
      action is traceable to typed object.

### Gate 13 — Product finish hardening

Purpose:
Prove the full loop and prepare release candidate.

At the end:
- KRN works as a source-grounded, memory-aware, eval-driven, reviewable Codex operating layer.
- All finish criteria are proven.

Slices:

MM-89 — E2E init-connect-plan-evidence-observe-reflect
- Run full flow on KRN or fixture target repo.
- Verification:
      DB state and CLI outputs prove each step.

MM-90 — E2E memory promotion and anti-memory
- Promote reviewed memory and prove anti-memory blocks stale/rejected path.
- Verification:
      golden cases pass.

MM-91 — E2E source-to-decision and golden eval
- Use source graph and golden runner on real task.
- Verification:
      unsupported decisions down / decorative source blocked.

MM-92 — Security/policy audit
- Run full policy/audit suite.
- Verification:
      destructive writes denied without approval.

MM-93 — TypeScript API audit
- Check public APIs, unknown-first boundaries, casts, any, generics.
- Verification:
      no weakening.

MM-94 — Migration audit
- Verify migrations, rollback notes, DB smoke tests.
- Verification:
      db:ready and migration smoke pass.

MM-95 — Final KRN dogfood
- Use KRN to plan/execute/capture/review one final KRN improvement.
- Verification:
      review burden and diff risk recorded.

MM-96 — Final target repo run
- Use KRN on one target repo fixture.
- Verification:
      context, evidence, observation, memory behavior proven.

MM-97 — Final handoff and release candidate
- Update HANDOFF, VERIFICATION, DECISIONS, BLOCKERS, PROGRESS.
- Tag release candidate if repository policy permits.
- Verification:
      pnpm typecheck
      pnpm test
      pnpm db:ready
      all DB smokes
      golden eval suite
      audit repo
      audit slice
      git diff --check
      forbidden surface scan
      not-built list honest.

## Concrete execution template for each slice

At the start of each slice, add a Progress line:

    - [ ] (YYYY-MM-DD HH:MM TZ) MM-XX started: <title>. Intended files: <list>. Non-goals: <list>.

Then inspect:

    git status --short
    git log --oneline -5
    pnpm typecheck
    pnpm test

If the slice touches DB:

    pnpm db:ready
    inspect migrations directory
    inspect db schema exports

Implement only the slice.

After implementation, run:

    pnpm typecheck
    pnpm test
    git diff --check

If DB touched:

    pnpm db:ready
    existing DB smokes for the touched area

Run forbidden scan using existing scripts if present. If scripts do not exist yet, use grep/find commands and record the exact command used.

Before commit:
- Update Progress to done or blocked.
- Update Decision Log if a choice was made.
- Update Surprises & Discoveries if something unexpected happened.
- Update Outcomes & Retrospective at gate boundary.
- Add compact handoff/audit artifact once the audit layer exists.

Commit format:
    feat(scope): ...
    fix(scope): ...
    docs(scope): ...
    test(scope): ...
    refactor(scope): ...

Each commit message should name the slice in the body when practical.

## Acceptance criteria for finish

KRN is finished for this plan when all are true:

- `krn init --connect` prepares a target repo safely.
- `krn doctor` verifies DB, migrations, pgvector, repo surfaces, strictness, and forbidden state.
- `krn plan --task` produces ContextAssembly, CapabilityPlan, CodexAdapterPlan, EvidenceContract.
- ContextAssembly is small and includes explicit inclusions/exclusions.
- `krn evidence capture` stores diff/commands/tests/review/diff risk/rollback and candidates.
- Observational Memory captures source-ranged observations from runs/tool traces/reviews/sources.
- Reflection produces candidates, contradictions, gaps, and anti-memory candidates.
- Reflection cannot mutate Memory Core.
- Memory Core is temporal, source-linked, confidence-aware, invalidatable, and feedback-aware.
- Anti-memory blocks stale/rejected/harmful patterns.
- ActivationEngine applies trust, temporal, anti-memory, ContextROI, dedup, and abstain logic.
- CapabilityCompiler chooses skill/rule/policy/tool bindings without TaskContract becoming requiredSkills.
- Source graph enforces mechanism, doesNotProve, trust, temporal scope, and source rejection.
- AuditBundle exists for implementation slices and includes rollback, scope, boundary, type, memory semantics, and eval findings.
- Golden memory behavior tests prove memory/context/source/evidence/audit behavior.
- Macro behavior report can analyze recurring patterns if enough traces exist.
- API/MCP write paths require approval if built.
- Dashboard, if built, is read-model-only with action/owner/threshold per view.
- No runtime markdown memory.
- No `.krn` runtime truth.
- No Research Foundry.
- No Pattern Vault.
- No meta-researcher runtime.
- No separate vector/graph DB.
- No broad agent zoo.
- No hidden CoT storage.
- No green-eval theater without review burden/diff risk evidence.

## Recovery and rollback

If a slice fails verification:
1. Do not continue to the next slice.
2. Record failure in Progress and Surprises & Discoveries.
3. If the change is small, repair within the same slice using review -> repair -> validate.
4. If repair grows scope, revert or split the slice.
5. Keep rollback path explicit:
       git diff
       git restore <files>
       git reset --hard <last-good-commit> only if approved by repo policy
6. Never hide failed attempts by deleting evidence from the plan.

If an architectural conflict is discovered:
1. Stop implementation.
2. Add Decision Log entry with options and chosen path.
3. Update affected milestones before coding.
4. Run audit again.

## Notes for future contributors

This plan intentionally uses Cookbook-style process mechanics but keeps KRN product architecture focused. Do not reintroduce research/pattern/meta layers because the plan mentions Cookbook, macro evals, Promptfoo, or autoresearch-like comparison. Those ideas are allowed only as:
- validation patterns;
- small golden behavior tests;
- report-style population analysis;
- human-reviewed decision evidence.

The central law remains:

    Do not build more context.
    Build the machinery that selects, applies, verifies, and forgets context.
