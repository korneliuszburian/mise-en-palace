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

Latest verification already passed:
- pnpm typecheck
- pnpm test: 46 files, 241 tests
- pnpm db:ready: 11/11 migrations, pgvector available
- git diff --check
- forbidden surface/dependency scans
- targeted slice checks recorded in Progress through MM-44

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
- golden memory behavior runner
- API
- MCP server
- dashboard
- plugin package
- broad workers runtime
- source crawler
- broad eval suite
- research/pattern subsystem
- fuzzy semantic anti-memory matching
- automatic memory promotion

Known built but not fully integrated:
- observation core contracts, IO schemas, DB schema, repository adapter,
  evidence linkage, manual observe CLI, observer input builder, pure
  observation prefix selector, dogfood evidence, project-scoped observe
  runtime, source-range lineage invariants, datetime validation, and payload
  redaction
- reflection contracts, schemas, DB table, repository, input selector,
  candidate-generation plan, contradiction/gap reports, manual reflect CLI,
  no-Memory-Core mutation proof, and dogfood evidence
- governed MemoryReviewGate promotion through public CLI, memory invalidation,
  feedback-aware activation ranking, negative-feedback health finding,
  explicit anti-memory blocking for source claims/memory/search/observation
  prefix, activation abstention metadata, memory health audit, and audit CLI
  AuditBundle/verification/semantic DB snapshot ingestion
- one reviewed KRN lesson has been promoted through MemoryReviewGate and then
  applied by a later matching plan; evidence is recorded at
  `docs/runs/2026-06-23-memory-dogfood.md`
- SourceClaim and SourceDecisionEdge write boundaries now reject decorative
  support types and missing decision-grade fields before persistence
- rejected/deprecated SourceClaim rows cannot support new SourceDecisionEdge
  writes through either the public CLI path or repository adapter
- observation prefix selector is still not wired into the main context
  assembly/activation runtime path as a stable prefix primitive
- reflection still does not create persisted MemoryCandidate/SourceClaim/
  AntiMemory/Eval candidate rows
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
- [x] (2026-06-22) MM-17C complete: enforced typed source-range lineage invariants for truth-bearing observations at the repository boundary. Intended files: `packages/db/src/repositories/DrizzleObservationRepository.ts`, repository tests, current-state pointers, and this PLAN. Non-goals preserved: no migrations, no source crawler, no broad evidence model, no reflection, no Memory Core mutation, no dashboard/API/MCP/server/plugin. Evidence: RED focused DB repository tests failed because mismatched `sourceType`/typed FK combinations were treated as evidence-linked, truth-bearing `risk` observations could persist with decorative source ranges, and `linkSourceRange` validated only the new auxiliary range; GREEN focused DB repository test passed with 20 files / 51 tests; full `pnpm typecheck` passed; full `pnpm test` passed with 39 files / 181 tests; DB-aware `pnpm db:ready` passed with 10/10 migrations and pgvector available; `git diff --check` passed. Next: MM-17D project-scoped observe runtime.
- [x] (2026-06-22) MM-17D complete: removed hardcoded `local` / `mise-en-palace` observe write scope by adding an observe-specific DB runtime that reads persisted runs without creating a default project, then resolves the project from the persisted run or explicit `--project`. Intended files: `packages/cli/src/databaseRuntime.ts`, `packages/cli/src/runObserveCommand.ts`, `packages/cli/src/parseArgs.ts`, `packages/cli/src/runCli.ts`, CLI tests, and this PLAN. Non-goals preserved: no project registry rewrite, no DB schema/migration, no worker, no reflection, no Memory Core mutation, no dashboard/API/MCP/server/plugin. Evidence: focused CLI test passed with 5 files / 80 tests; full `pnpm typecheck` passed; full `pnpm test` passed with 39 files / 181 tests; DB-aware `pnpm db:ready` passed with 10/10 migrations and pgvector available; `git diff --check` passed. Tests prove `krn observe --run` resolves `project-from-run`, writes the observation group under that project, and fails before project resolution when a persisted run has no project scope and no explicit `--project`. Next: MM-17E observation schema/core parity and timestamp validation.
- [x] (2026-06-22) MM-17E complete: hardened observation schema datetime validation and added schema/core parity tests for observation enum coverage and source-range policy. Intended files: `packages/schema/src/observation.ts`, schema tests, `packages/harness/src/observations/observationPrefix.ts`, harness prefix tests, and this PLAN. Non-goals preserved: no package topology refactor, no DB migration, no runtime reflection, no Memory Core mutation, no dashboard/API/MCP/server/plugin/source crawler. Evidence: RED schema test failed because `not-a-date` was accepted; RED harness test failed because offset `validUntil` was compared lexically instead of by parsed time; GREEN focused schema test passed with 1 file / 16 tests; GREEN focused harness test passed with 7 files / 23 tests; full `pnpm typecheck` passed; full `pnpm test` passed with 39 files / 184 tests; DB-aware `pnpm db:ready` passed with 10/10 migrations and pgvector available; `git diff --check` passed. Next: MM-17F observer payload redaction hardening.
- [x] (2026-06-22) MM-17F complete: hardened observer payload redaction so secret-shaped values are redacted even when keys look neutral, before payload truncation. Intended files: `packages/harness/src/observations/observerInput.ts`, observer input tests, and this PLAN. Non-goals preserved: no external secret scanner, no source crawler, no LLM, no observe runtime rewrite, no DB schema/migration, no Memory Core mutation, no dashboard/API/MCP/server/plugin. Evidence: RED focused harness test failed because Bearer/API-key/cookie/private-key/GitHub-token-like values under neutral keys survived; GREEN focused harness observer input test passed with 7 files / 25 tests; full `pnpm typecheck` passed; full `pnpm test` passed with 39 files / 186 tests; DB-aware `pnpm db:ready` passed with 10/10 migrations and pgvector available; `git diff --check` passed. Tests prove redaction reports value paths and truncation runs only after redaction. Next: MM-18 reflection contracts.
- [x] (2026-06-22) MM-18 complete: added pure core reflection domain contracts for ReflectionRecord/Input/Output/Scope/Finding, ContradictionReport, GapReport, and candidate/proposal outputs. Intended files: `packages/core/src/reflection/*`, core export, and this PLAN. Non-goals preserved: no schema, DB tables, repository, CLI, worker, LLM call, Memory Core mutation, source decision truth write, dashboard/API/MCP/server/plugin/source crawler. Evidence: focused core reflection test passed with 3 files / 12 tests; focused core typecheck passed; forbidden reflection import/semantics scan found no DB/Drizzle/fs/process/network/MemoryRecord/createMemoryRecord/promoteMemoryCandidate/SourceDecision strings; full `pnpm typecheck` passed; full `pnpm test` passed with 39 files / 186 tests; DB-aware `pnpm db:ready` passed with 10/10 migrations and pgvector available; `git diff --check` passed. Next: MM-18A reflection candidate-only contract guard.
- [x] (2026-06-22) MM-18A complete: strengthened reflection candidate-only guard with `assessReflectionOutputContract`, diagnostic violations for final-truth targets, and metadata promotion-semantics detection. Intended files: `packages/core/src/reflection/*` and this PLAN. Non-goals preserved: no schema, DB tables, repository, CLI, worker, LLM call, Memory Core mutation, source decision truth write, dashboard/API/MCP/server/plugin/source crawler. Evidence: focused core reflection test passed with 3 files / 13 tests; focused core typecheck passed; forbidden reflection import/semantics scan found no DB/Drizzle/fs/process/network/MemoryRecord/createMemoryRecord/promoteMemoryCandidate/SourceDecision strings; full `pnpm typecheck` passed; full `pnpm test` passed with 39 files / 187 tests; DB-aware `pnpm db:ready` passed with 10/10 migrations and pgvector available; `git diff --check` passed. Tests prove final-truth targets and hidden `createActiveMemory` / `source_decision` metadata are rejected before any reflection runtime exists. Next: MM-19 reflection schemas and DB.
- [x] (2026-06-22) MM-19 complete: added reflection IO schemas and Postgres persistence table for reflection records. Intended files: `packages/schema/src/reflection.ts`, schema tests/export, `packages/db/src/schema/reflections.ts`, DB schema tests/export, migration `packages/db/src/migrations/0010_misty_wolfsbane.sql`, Drizzle meta, and this PLAN. Non-goals preserved: no repository, selector, CLI, worker, LLM call, Memory Core mutation, source decision truth write, dashboard/API/MCP/server/plugin/source crawler. Evidence: focused schema reflection tests passed with 1 file / 18 tests; focused DB reflection schema tests passed with 21 files / 53 tests; focused schema/db typechecks passed; `pnpm --filter @krn/db db:generate` produced `0010_misty_wolfsbane.sql`; SQL inspection confirmed `reflection_status`, `reflection_records`, project/run/task FKs, status/project/run/task/created indexes, and JSONB scope/input/output/metadata; `pnpm --filter @krn/db db:check` passed; full `pnpm typecheck` passed; full `pnpm test` passed with 40 files / 189 tests; DB-aware `pnpm db:ready` applied 11/11 migrations and pgvector was available; `git diff --check` passed. Next: MM-20 reflection repositories and input selector.
- [x] (2026-06-22) MM-20 complete: added `DrizzleReflectionRepository` plus pure harness `selectReflectionInput` over observations, source claims, and anti-memory records. Intended files: `packages/db/src/repositories/DrizzleReflectionRepository.ts`, repository test/export, `packages/harness/src/reflection/*`, harness export, and this PLAN. Non-goals preserved: no new schema/migration, CLI, worker, LLM call, Memory Core mutation, source decision truth write, dashboard/API/MCP/server/plugin/source crawler. Evidence: fixed stale duplicate Progress placeholders for MM-18/MM-18A/MM-19; preflight `pnpm typecheck` passed; preflight `pnpm test` passed with 40 files / 189 tests; focused harness selector test passed with 8 files / 27 tests and proves project isolation plus conflict/gap visibility; focused DB repository test passed with 22 files / 54 tests; focused harness/db typechecks passed; full `pnpm typecheck` passed; full `pnpm test` passed with 41 files / 193 tests; DB-aware `pnpm db:ready` passed with 11/11 migrations and pgvector available; `git diff --check` passed. Next: MM-21 deterministic candidate generation contracts from reflection.
- [x] (2026-06-22) MM-21 complete: added deterministic candidate generation plan contracts for reflection outputs. Intended files: `packages/core/src/reflection/*` and this PLAN. Non-goals preserved: no DB writes, repository changes, CLI, worker, LLM call, Memory Core mutation, source decision truth write, dashboard/API/MCP/server/plugin/source crawler. Evidence: focused core reflection test passed with 3 files / 15 tests; focused core typecheck passed; forbidden core reflection scan found no DB/Drizzle/fs/process/fetch/createMemoryRecord/promoteMemoryCandidate/MemoryRecord/SourceDecision strings; full `pnpm typecheck` passed; full `pnpm test` passed with 41 files / 195 tests; DB-aware `pnpm db:ready` passed with 11/11 migrations and pgvector available; `git diff --check` passed. Tests prove `buildReflectionCandidateGenerationPlan` counts memory/source/anti-memory/policy/eval proposals, preserves sorted candidate links, and blocks generation when candidate-only guard violations exist. Next: MM-22 contradiction and gap reports.
- [x] (2026-06-22) MM-22 complete: added pure contradiction and gap report generation for reflection inputs. Intended files: `packages/core/src/reflection/*`, root `PLAN.md`, `GOAL.md`, handoff progress, and this PLAN. Non-goals preserved: no DB writes, schema/repository changes, CLI, worker, LLM call, Memory Core mutation, source decision truth write, dashboard/API/MCP/server/plugin/source crawler. Evidence: preflight `pnpm typecheck` passed; preflight `pnpm test` passed with 41 files / 195 tests; focused core typecheck passed; focused core reflection tests passed with 3 files / 19 tests after fixing a test fixture that accidentally triggered duplicate-observation reporting; final `pnpm typecheck` passed; final `pnpm test` passed with 41 files / 199 tests; `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready` passed with 11/11 migrations and pgvector available; `git diff --check` passed; forbidden directory scan found no added dashboard/API/MCP/research/pattern surfaces; core reflection scan found no DB/Drizzle/fs/process/fetch/createMemoryRecord/promoteMemoryCandidate imports or calls. Tests prove reports for contested/conflict observations, missing required source ranges with local-note exemption, stale observations, duplicate observations, and unsupported decisions without source-claim links. Next: MM-23 manual reflect CLI.
- [x] (2026-06-22) MM-23 complete: added manual `krn reflect --scope run:<id>|project:<id>|topic:<name> [--project <id>] [--persist]` CLI. Intended files: `packages/cli/src/runReflectCommand.ts`, CLI parser/router/tests, `packages/cli/src/databaseRuntime.ts`, `packages/cli/package.json`, lockfile, root `PLAN.md`, `GOAL.md`, handoff progress, and this PLAN. Non-goals preserved: no schema/migration changes, no worker, no LLM call, no candidate row writes, no Memory Core mutation, no memory promotion, no source decision truth write, no dashboard/API/MCP/server/plugin/source crawler. Evidence: preflight `pnpm typecheck` passed; preflight `pnpm test` passed with 41 files / 199 tests; focused CLI typecheck passed; focused CLI tests passed with 6 files / 84 tests; live preview `krn reflect --scope project:a704c6fa-8b15-4d77-a748-1eb6d5d9f13b` selected 5 observations and 1 anti-memory record; live `--persist` wrote ReflectionRecord `8087f798-20b3-4a1e-95c5-6182d33327c8`; local DB counts after smoke: `reflection_records=2`, `memory_records=1`, `memory_candidates=1`; final `pnpm typecheck` passed; final `pnpm test` passed with 44 files / 211 tests; `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready` passed with 11/11 migrations and pgvector available; `git diff --check` passed; forbidden directory scan found no added dashboard/API/MCP/research/pattern surfaces; new reflect command scan found no Memory Core promotion or source decision write calls. No candidate rows or MemoryRecord rows were created by reflect. Next: MM-24 mutation guard.
- [x] (2026-06-22) MM-24 complete: sealed the manual reflect runtime against direct Memory Core mutation. Intended files: `packages/cli/src/databaseRuntime.ts`, `packages/cli/src/runReflectCommand.test.ts`, root `PLAN.md`, `GOAL.md`, handoff progress, and this PLAN. Non-goals preserved: no schema/migration changes, no worker, no LLM call, no candidate row writes, no Memory Core mutation, no memory promotion, no source decision truth write, no dashboard/API/MCP/server/plugin/source crawler. Evidence: preflight `pnpm typecheck` passed; preflight `pnpm test` passed with 44 files / 211 tests; focused CLI typecheck passed; focused CLI tests passed with 6 files / 86 tests; final `pnpm typecheck` passed; final `pnpm test` passed with 44 files / 213 tests; `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready` passed with 11/11 migrations and pgvector available; `git diff --check` passed; forbidden directory scan found no added dashboard/API/MCP/research/pattern surfaces. The reflect database runtime now returns a read-only memory wrapper exposing only `listAntiMemoryForProject` and `listAntiMemoryForRun`; tests assert the memory surface keys and scan `runReflectCommand.ts` for direct create/promote/reject memory calls. Next: MM-24A repository/runtime no-Memory-Core mutation proof.
- [x] (2026-06-22) MM-24A complete: proved manual reflection does not mutate Memory Core at runtime/repository boundaries. Intended files: `packages/cli/src/runReflectCommand.test.ts`, `docs/runs/2026-06-22-reflection-mutation-proof.md`, root `PLAN.md`, `GOAL.md`, handoff progress, and this PLAN. Non-goals preserved: no schema/migration changes, no worker, no LLM call, no candidate row writes, no Memory Core mutation, no memory promotion, no source decision truth write, no dashboard/API/MCP/server/plugin/source crawler. Evidence: preflight `pnpm typecheck` passed; preflight `pnpm test` passed with 44 files / 213 tests; focused CLI typecheck passed; focused CLI tests passed with 6 files / 87 tests; live proof created ReflectionRecord `17fda5ab-10bb-4a0f-9af6-de63bae668d3`; counts moved `reflection_records` 2->3 while `memory_records` stayed 1->1 and `memory_candidates` stayed 1->1; final `pnpm typecheck` passed; final `pnpm test` passed with 44 files / 214 tests; `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready` passed with 11/11 migrations and pgvector available; `git diff --check` passed; forbidden directory scan found no added dashboard/API/MCP/research/pattern surfaces. Next: MM-25 dogfood reflection on KRN observations.
- [x] (2026-06-22) MM-25 complete: dogfooded manual reflection over MM-17 observation project data and recorded evidence at `docs/runs/2026-06-22-reflection-dogfood.md`. Intended files: dogfood run doc, root `PLAN.md`, `GOAL.md`, handoff progress, and this PLAN. Non-goals preserved: no code changes, no schema/migration changes, no worker, no LLM call, no candidate row writes, no Memory Core mutation, no memory promotion, no dashboard/API/MCP/server/plugin/source crawler. Evidence: preflight `pnpm typecheck` passed; preflight `pnpm test` passed with 44 files / 214 tests; live `krn reflect --scope project:a704c6fa-8b15-4d77-a748-1eb6d5d9f13b --persist` selected 5 observations and 1 anti-memory record, wrote ReflectionRecord `dbe98bf2-e9e0-4aa6-89b0-05b30082a60f`, moved `reflection_records` 3->4, kept `memory_records` 1->1 and `memory_candidates` 1->1, and persisted output counts `findings=0`, `contradictions=0`, `gaps=0`, `memoryCandidates=0`, `sourceClaimCandidates=0`, `antiMemoryCandidates=0`, `evalCandidates=0`; final `pnpm typecheck` passed; final `pnpm test` passed with 44 files / 214 tests; `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready` passed with 11/11 migrations and pgvector available; `git diff --check` passed; forbidden directory scan found no added dashboard/API/MCP/research/pattern surfaces. This proves the reflection surface is operational, but it does not prove candidate quality. Next: MM-26 MemoryRecord invariant hardening.
- [x] (2026-06-22) MM-26 complete: hardened MemoryRecord and MemoryCandidate repository invariants. Intended files: `packages/db/src/repositories/DrizzleMemoryRepository.ts`, repository tests, root `PLAN.md`, `GOAL.md`, handoff progress, and this PLAN. Non-goals preserved: no schema/migration changes, no MemoryReviewGate, no worker, no LLM call, no dashboard/API/MCP/server/plugin/source crawler. Evidence: preflight `pnpm typecheck` passed; preflight `pnpm test` passed with 44 files / 214 tests; focused DB typecheck passed; focused DB tests passed with 22 files / 57 tests; DB-aware `pnpm db:ready` passed with 11/11 migrations and pgvector available; live `krn db smoke memory-governance` passed; final `pnpm typecheck` passed; final `pnpm test` passed with 44 files / 217 tests; final DB-aware `pnpm db:ready` passed with 11/11 migrations and pgvector available; `git diff --check` passed; forbidden directory scan found no added dashboard/API/MCP/research/pattern surfaces. Invariants enforce nonempty source lineage, owner, application guidance, confidence integer 0-100, and validFrom/invalidationRule/ordering for temporal records with validUntil. Next: MM-26A Memory Core write-surface guard before promotion paths.
- [x] (2026-06-23) MM-26A complete: added a Memory Core write-surface guard before governed promotion. Intended files: `packages/cli/src/runMemoryCandidateReviewCommand.ts`, CLI tests, root `PLAN.md`, `GOAL.md`, handoff progress, and this PLAN. Non-goals preserved: no full MemoryReviewGate, no schema/migration changes, no worker, no LLM call, no dashboard/API/MCP/server/plugin/source crawler. Evidence: RED focused CLI test first failed because `krn memory candidate promote --persist` still entered DB runtime; GREEN focused promote tests passed with 6 files / 87 tests after the CLI blocked promote before DB runtime and reported `No MemoryRecord created`; product CLI/harness scan found no direct `promoteMemoryCandidate(` call outside the repository interface/doctor text; full `pnpm typecheck` passed; full `pnpm test` passed with 44 files / 217 tests; DB-aware `pnpm db:ready` passed with 11/11 migrations and pgvector available; `git diff --check` passed; forbidden directory scan found no added dashboard/API/MCP/research/pattern surfaces. Public promotion is now intentionally refused until MM-27 MemoryReviewGate; low-level repository promotion remains internal DB/smoke infrastructure. Next: MM-27 MemoryReviewGate and promotion path.
- [x] (2026-06-23) MM-27 complete: added governed MemoryReviewGate promotion path. Intended files: `packages/harness/src/memory/*`, harness export, CLI parser/review command/tests, DB memory repository metadata helper/tests, root `PLAN.md`, `GOAL.md`, handoff progress, and this PLAN. Non-goals preserved: no invalidation/demotion behavior, no worker, no LLM decision-making, no dashboard/API/MCP/server/plugin/source crawler. Evidence: RED harness test failed on missing `memoryReviewGate`; GREEN focused harness gate tests passed with 9 files / 30 tests and prove missing `evidenceReviewedRef` blocks promotion, missing linked SourceClaim blocks promotion, and valid review calls low-level repository with review-gate metadata; focused CLI promote tests passed with 6 files / 88 tests and prove public promote requires `--evidence-reviewed-ref` before DB runtime and succeeds through MemoryReviewGate when evidence/source claim checks pass; focused DB memory repository test passed with 22 files / 58 tests and proves review-gate metadata is preserved for promoted memory/version metadata; full `pnpm typecheck` passed; full `pnpm test` passed with 45 files / 222 tests; DB-aware `pnpm db:ready` passed with 11/11 migrations and pgvector available; live `pnpm db:smoke:memory-governance` passed and still proves internal low-level DB promotion/version smoke; `git diff --check` passed; forbidden directory scan found no added dashboard/API/MCP/research/pattern surfaces. Next: MM-28 memory invalidation/versioning behavior.
- [x] (2026-06-23) MM-28 complete: added memory invalidation behavior with auditable version preservation. Intended files: `packages/harness/src/repositories/memoryRepository.ts`, `packages/db/src/repositories/DrizzleMemoryRepository.ts`, DB repository tests, memory-governance smoke, DB smoke CLI output, root `PLAN.md`, `GOAL.md`, handoff progress, and this PLAN. Non-goals preserved: no feedback-driven demotion, no automatic invalidation from hurt/stale feedback, no anti-memory expansion, no dashboard/API/MCP/server/plugin/source crawler. Evidence: RED DB repository method exposure test failed because `invalidateMemoryRecord` did not exist; GREEN focused DB repository test passed with 22 files / 58 tests; focused DB and CLI typechecks passed; live `pnpm db:smoke:memory-governance` passed and reported `Memory record invalidated status: invalidated`, `Active memory after invalidation: 0`, existing `Memory record version: 6f1fb3ff-c9ac-4234-90c8-a14025b0a0ae`, and cleanup count `0`; full `pnpm typecheck` passed; full `pnpm test` passed with 45 files / 222 tests; DB-aware `pnpm db:ready` passed with 11/11 migrations and pgvector available; `git diff --check` passed; forbidden directory scan found no added dashboard/API/MCP/research/pattern surfaces. Next: MM-29 feedback application and demotion behavior.
- [x] (2026-06-23) MM-29 complete: made memory application feedback affect activation ranking. Intended files: `packages/harness/src/activation/rankCandidates.ts`, activation types/tests, root `PLAN.md`, `GOAL.md`, handoff progress, and this PLAN. Non-goals preserved: no automatic invalidation from feedback, no review-required demotion/invalidation candidates yet, no anti-memory expansion, no dashboard/API/MCP/server/plugin/source crawler. Evidence: RED focused activation test failed because memory with `negativeFeedbackCount: 4` still ranked above clean memory; GREEN focused activation test passed with 9 files / 31 tests after adding explicit `feedbackScore`, `positiveFeedbackCount`, `negativeFeedbackCount`, and `feedbackPenalty` metadata to memory activation candidates; focused harness typecheck passed; full `pnpm typecheck` passed; full `pnpm test` passed with 45 files / 223 tests; DB-aware `pnpm db:ready` passed with 11/11 migrations and pgvector available; `git diff --check` passed; forbidden directory scan found no added dashboard/API/MCP/research/pattern surfaces. This slice makes hurt/stale feedback change ranking, not status; MM-29A owns review-required demotion/invalidation candidates. Next: MM-29A feedback demotion and invalidation candidates.
- [x] (2026-06-23) MM-29A complete: surfaced repeated hurt/stale feedback as a review-required memory health finding. Intended files: `packages/harness/src/audit/auditChecks.ts`, audit tests, root `PLAN.md`, `GOAL.md`, handoff progress, and this PLAN. Non-goals preserved: no automatic destructive invalidation, no new worker, no DB snapshot reader, no dashboard/API/MCP/server/plugin/source crawler. Evidence: RED focused audit test failed because active memory with `negativeFeedbackCount: 3` produced no finding; GREEN focused audit test passed with 9 files / 32 tests after adding `AuditMemoryRecordSnapshot` and blocking finding `Active memory has unresolved negative feedback`; focused harness typecheck passed; full `pnpm typecheck` passed; full `pnpm test` passed with 45 files / 224 tests; DB-aware `pnpm db:ready` passed with 11/11 migrations and pgvector available; `git diff --check` passed; forbidden directory scan found no added dashboard/API/MCP/research/pattern surfaces. This slice creates a review-required audit/health signal rather than automatic invalidation. Next: MM-30 anti-memory enforcement.
- [x] (2026-06-23) MM-30 complete: enforced anti-memory against explicit memory-record activation candidates. Intended files: `packages/harness/src/activation/conflictFilter.ts`, activation tests, root `PLAN.md`, `GOAL.md`, handoff progress, and this PLAN. Non-goals preserved: no fuzzy semantic matching, no search-document anti-memory expansion, no observation-prefix blocking, no dashboard/API/MCP/server/plugin/source crawler. Evidence: RED focused activation test failed because AntiMemoryRecord with `appliesTo: "brain-store"` did not block a memory candidate whose metadata key was `brain-store`; GREEN focused activation test passed with 9 files / 33 tests after `detectConflicts` matched memory candidates by explicit subject id, candidate metadata key, anti-memory key, and `appliesTo`; focused harness typecheck passed; full `pnpm typecheck` passed; full `pnpm test` passed with 45 files / 225 tests; DB-aware `pnpm db:ready` passed with 11/11 migrations and pgvector available; `git diff --check` passed; forbidden directory scan found no added dashboard/API/MCP/research/pattern surfaces. Next: MM-30A anti-memory enforcement expansion.
- [x] (2026-06-23) MM-30A complete: expanded anti-memory enforcement to linked search-document candidates and observation prefix items. Intended files: `packages/harness/src/activation/conflictFilter.ts`, activation tests, `packages/harness/src/observations/observationPrefix.ts`, observation prefix tests, root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN. Non-goals preserved: no fuzzy semantic matching, no separate graph/vector DB, no source crawler, no dashboard/API/MCP/server/plugin. Evidence: RED focused activation test failed because search documents explicitly linked to an invalidated source claim or memory record were not excluded; RED focused observation prefix test failed because an observation matching anti-memory `key/appliesTo` still entered the prefix; GREEN focused activation test passed with 9 files / 35 tests after search-document blocking was added; GREEN focused observation prefix test passed with 9 files / 35 tests after prefix anti-memory exclusions were added; focused harness typecheck passed; full `pnpm typecheck` passed; full `pnpm test` passed with 45 files / 227 tests; DB-aware `pnpm db:ready` passed with 11/11 migrations and pgvector available; `git diff --check` passed; forbidden directory scan found no added dashboard/API/MCP/research/pattern surfaces. Next: MM-31 memory abstain behavior.
- [x] (2026-06-23) MM-31 complete: added explicit memory/source/search activation abstention metadata when context cannot be safely assembled. Intended files: `packages/harness/src/activation/assembleContext.ts`, activation tests, root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN. Non-goals preserved: no activation v2 rewrite, no observation prefix runtime integration, no DB migration, no CLI surface, no API/MCP/dashboard/server/plugin/source crawler. Evidence: RED focused activation test failed because weak low-trust memory produced `status: abstained` without `metadata.activationAbstention`; GREEN focused activation test passed with 9 files / 36 tests after `assembleContext` attached `ActivationAbstention` metadata; focused harness typecheck passed; full `pnpm typecheck` passed; full `pnpm test` passed with 45 files / 228 tests; DB-aware `pnpm db:ready` passed with 11/11 migrations and pgvector available. Next: MM-32 memory health audit.
- [x] (2026-06-23) MM-32 complete: broadened memory health audit findings for unhealthy Memory Core records. Intended files: `packages/harness/src/audit/auditChecks.ts`, audit tests, root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN. Non-goals preserved: no DB snapshot reader, no audit CLI ingestion upgrade, no automatic invalidation/demotion, no dashboard/API/MCP/server/plugin/source crawler. Evidence: RED focused audit test failed because seeded stale high-confidence, unsupported/no-lineage, no-feedback, no-guidance, and no-invalidation-strategy memory records produced no findings; GREEN focused audit test passed with 9 files / 37 tests after adding health findings; focused harness typecheck passed; full `pnpm typecheck` passed; full `pnpm test` passed with 45 files / 229 tests; DB-aware `pnpm db:ready` passed with 11/11 migrations and pgvector available. Next: MM-32B audit CLI semantic snapshot ingestion.
- [x] (2026-06-23) MM-32B complete: audit CLI now consumes explicit slice evidence, AuditBundle evidence, DB-backed semantic snapshots, and repo-local handoff docs. Intended files: `packages/harness/src/audit/auditChecks.ts`, `packages/db/src/auditSemanticSnapshot.ts`, DB export, `packages/cli/src/databaseRuntime.ts`, `packages/cli/src/parseArgs.ts`, `packages/cli/src/runAuditCommand.ts`, `packages/cli/src/runCli.ts`, audit CLI tests, root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN. Non-goals preserved: no dashboard, no API/MCP/server/plugin, no CI service, no broad benchmark suite, no new DB migration, no source crawler, no runtime markdown memory. Evidence: RED focused CLI test failed because `--fail-on warning` was rejected as usage error; GREEN focused CLI test passed with 6 files / 91 tests after parser/runner support; focused AuditBundle semantic snapshot test passed with DB runtime injection and JSON `semanticSnapshotCounts`; RED handoff-focused CLI test failed because repo handoff docs were not converted into an `AuditHandoffSnapshot`; GREEN handoff-focused CLI test passed with 6 files / 92 tests after adding the repo handoff snapshot builder; focused DB/harness/CLI typechecks passed; full `pnpm typecheck` passed; full `pnpm test` passed with 45 files / 230 tests; DB-aware `pnpm db:ready` passed with 11/11 migrations and pgvector available; `git diff --check` passed; forbidden directory scan found no added dashboard/API/MCP/research/pattern surfaces; final `krn audit slice --since origin/main ...` passed with 0 findings. Audit slice now merges AuditBundle/CLI intended files and verification commands, flags missing/failed verification, reads MemoryCandidate/MemoryRecord/SourceClaim/SourceDecision/EvalCandidate/ObservationGroup/ActivationDecision snapshots where a project/retrieval run is supplied, emits semantic snapshot counts, derives handoff evidence from `docs/handoff/*`, and supports `--fail-on warning` for CI-style slice gates. Next: MM-33 memory dogfood.
- [x] (2026-06-23) MM-33 complete: dogfooded promotion of one reviewed KRN lesson through MemoryReviewGate and proved later application by planning context. Intended files: `docs/runs/2026-06-23-memory-dogfood.md`, root `PLAN.md`, `GOAL.md`, `docs/handoff/*`, and this PLAN. Non-goals preserved: no automatic memory promotion, no reflection worker, no new DB schema/migration, no dashboard/API/MCP/server/plugin, no source crawler, no broad eval suite, no fuzzy anti-memory matching. Evidence: preflight `git status --short --branch` showed only raw research materials untracked; `git log --oneline -5` showed `9df7ca3`; `pnpm --version` reported 10.32.1; preflight `pnpm typecheck` passed; preflight `pnpm test` passed with 45 files / 230 tests; DB before counts were execution_runs=14, source_claims=2, memory_candidates=1, memory_records=1, memory_versions=1, memory_applications=1; live `krn plan --task "MM-33 dogfood MemoryReviewGate promotion for audit semantic snapshot lesson" --persist` created execution run `daafa66b-dd85-4b7c-bcf5-9ccf60c2b170`; live `krn source claim add --persist` created SourceClaim `f0b5c9ee-01aa-41df-9268-7df3f7437068` for commit `9df7ca3`; live `krn memory candidate add --persist` created MemoryCandidate `2b31845c-1e34-4e5e-9862-23d0ce12cb69`; live `krn memory candidate promote --persist --evidence-reviewed-ref ...` passed MemoryReviewGate and created MemoryRecord `41d1a2ef-3578-4e45-947f-42c6739796de`; DB proof shows status active, kind procedure, confidence 90, owner `memory-governance`, source lineage and reviewed SourceClaim `f0b5c9ee-01aa-41df-9268-7df3f7437068`, application guidance, invalidation rule, reviewGate metadata, and MemoryRecordVersion `9200736c-13ac-4ca6-bde9-dc494519cc17` created from the candidate; live follow-up `krn plan --task "close a memory implementation slice with audit semantic snapshots and handoff evidence" --persist` included memory_record `41d1a2ef-3578-4e45-947f-42c6739796de` in context and created execution run `54f6e3e0-d634-4b61-a67c-cde5d558f822`; live `krn memory record apply --persist` recorded MemoryApplication `55a8e695-8665-45da-a19e-b8be578708ea` with outcome `helped`; final counts were execution_runs=16, source_claims=3, memory_candidates=2, memory_records=2, memory_versions=2, memory_applications=2; final full `pnpm typecheck`, `pnpm test`, DB-aware `pnpm db:ready`, `git diff --check`, forbidden directory scan, and `krn audit slice --since origin/main ...` passed with 0 findings. Next: MM-34 SourceClaim and SourceDecisionEdge hardening.
- [x] (2026-06-23) MM-34 complete: hardened SourceClaim and SourceDecisionEdge write boundaries so source records cannot be decorative citations. Intended files: `packages/schema/src/sourceClaim.ts`, schema tests, `packages/db/src/repositories/DrizzleSourceRepository.ts`, focused source repository tests, source/activation/codex smoke fixtures, CLI source usage/tests, root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN. Non-goals preserved: no DB migration, no source crawler, no reflection candidate persistence, no Memory Core mutation, no dashboard/API/MCP/server/plugin, no broad eval suite, no Research Foundry, no Pattern Vault, no runtime markdown memory. Evidence: RED focused DB source repository test failed because `assertSourceClaimGovernance` / `assertSourceDecisionGovernance` helpers did not exist; RED focused schema test failed because SourceClaim `falsifier` was still optional; GREEN focused DB source repository test passed with 23 files / 61 tests; GREEN focused schema test passed with 1 file / 19 tests; GREEN focused CLI test passed with 6 files / 92 tests; full `pnpm typecheck` passed; full `pnpm test` passed with 46 files / 239 tests; DB-aware `pnpm db:smoke:source-graph`, `pnpm db:smoke:activation`, and `pnpm db:smoke:codex-adapter` passed after legacy negative smoke claims were rewritten as decision-grade rejection/risk source records; final `pnpm db:ready`, `git diff --check`, forbidden directory scan, and audit slice check passed. SourceClaim IO now requires `falsifier`; repository writes require claim, mechanism, krnImplication, doesNotProve, trustTier, supportType, consumer, and falsifier; decorative support types are rejected for SourceClaim and SourceDecisionEdge; `adopt`/`reject` SourceDecision writes require a linked SourceClaim. Next: MM-35 source rejection and doesNotProve enforcement.
- [x] (2026-06-23) MM-35 complete: hardened source rejection support boundaries so rejected/deprecated SourceClaim rows cannot support SourceDecisionEdge writes. Intended files: `packages/db/src/repositories/DrizzleSourceRepository.ts`, focused source repository tests, `packages/cli/src/runSourceDecisionLinkCommand.ts`, CLI source decision tests, root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN. Non-goals preserved: no DB migration, no source crawler, no source graph health audit, no trust-tier/temporal scoring, no reflection candidate persistence, no Memory Core mutation, no dashboard/API/MCP/server/plugin. Evidence: RED focused DB source repository test failed because `assertSourceDecisionSourceClaimCanSupport` did not exist; RED focused CLI test failed because rejected SourceClaim still reached `createSourceDecisionEdge`; GREEN focused DB source repository test passed with 23 files / 62 tests; GREEN focused CLI test passed with 6 files / 93 tests; full `pnpm typecheck` passed; full `pnpm test` passed with 46 files / 241 tests; DB-aware `pnpm db:ready` and `pnpm db:smoke:source-graph` passed. Next: MM-36 trust and temporal source behavior.
- [x] (2026-06-23) MM-36 complete: added deterministic trust-tier ranking and temporal override assessment for SourceClaim governance. Intended files: `packages/db/src/repositories/DrizzleSourceRepository.ts`, focused source repository tests, root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN. Non-goals preserved: no DB migration, no source crawler, no source graph health audit, no activation v2 integration, no reflection candidate persistence, no Memory Core mutation, no dashboard/API/MCP/server/plugin. Evidence: RED focused DB source repository test failed because `rankSourceTrustTier` and `assessSourceClaimOverride` were missing; GREEN focused DB source repository test passed with 23 files / 65 tests and proves deterministic trust ranks, blocks a newer weak claim from overriding stronger current consensus without explicit reason, and permits weaker challenge when stronger consensus is stale by `revisitWhen`; focused DB package typecheck passed; full `pnpm typecheck` passed; full `pnpm test` passed with 46 files / 244 tests; DB-aware `pnpm db:ready` passed with 11/11 migrations and pgvector available; DB-aware `pnpm db:smoke:source-graph` passed with cleanup count `0`. Next: MM-37 source graph health audit.
- [x] (2026-06-23) MM-37 complete: broadened source graph health audit over semantic source snapshots. Intended files: `packages/harness/src/audit/auditChecks.ts`, focused audit tests, `packages/db/src/auditSemanticSnapshot.ts`, root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN. Non-goals preserved: no DB migration, no source crawler, no new CLI surface, no activation v2 integration, no reflection candidate persistence, no Memory Core mutation, no dashboard/API/MCP/server/plugin. Evidence: RED focused harness audit test failed because seeded decorative source support, stale accepted claim, unlinked accepted claim, and rejected-claim decision support produced no findings; GREEN focused harness audit test passed with 9 files / 40 tests; focused harness and DB typechecks passed; full `pnpm typecheck` passed; full `pnpm test` passed with 46 files / 245 tests; DB-aware `pnpm db:ready` passed with 11/11 migrations and pgvector available; DB-aware `pnpm db:smoke:source-graph` passed with cleanup count `0`. Next: MM-38 source-to-decision dogfood on memory implementation.
- [x] (2026-06-23) MM-38 complete: dogfooded source-to-decision on the MM-37 source graph health audit implementation decision. Intended files: `docs/runs/2026-06-23-source-to-decision-dogfood.md`, root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN. Non-goals preserved: no DB migration, no source crawler, no new CLI surface, no activation v2 integration, no reflection candidate persistence, no Memory Core mutation, no dashboard/API/MCP/server/plugin. Evidence: live `krn plan --persist` created ExecutionRun `bba64c9a-eb96-47b7-819a-93937e6d8c5d`; live `krn source claim add --persist` created SourceClaim `d5ea7024-7d7a-4291-a050-4de1fbebf605` with mechanism, doesNotProve, falsifier, `implementation-boundary` support, `project-decision` trust, consumer `MM-38 source-to-decision dogfood`, and run linkage; live `krn source decision link --persist` created SourceDecisionEdge `a343ebef-2951-4ba6-b0d7-8eb3af586509` targeting the same harness run with high confidence; DB proof showed run source claims `1` and run source decision edges `1`. Next: MM-39 ActivationEngine v2 query model.
- [x] (2026-06-23) MM-39 complete: added a pure unified ActivationQuery model and builder for task/project scope, needs, budget, and risk. Intended files: `packages/harness/src/activation/types.ts`, `packages/harness/src/activation/memoryQuery.ts`, `packages/harness/src/activation/sourceQuery.ts`, activation tests, root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN. Non-goals preserved: no DB migration, no retrieval merge, no trust/temporal filter change, no activation trace persistence change, no source crawler, no dashboard/API/MCP/server/plugin. Evidence: RED focused activation test failed because `buildActivationQuery` did not exist; GREEN focused activation test passed with 9 files / 41 tests and proves mixed memory/source/observation needs, project/task scope, budget, risk, and extra query terms; focused harness typecheck passed; full `pnpm typecheck` passed; full `pnpm test` passed with 46 files / 246 tests; DB-aware `pnpm db:ready` passed with 11/11 migrations and pgvector available; DB-aware `pnpm db:smoke:activation` passed with cleanup count `0`. Next: MM-40 hybrid candidate merge.
- [x] (2026-06-23) MM-40 complete: added pure hybrid candidate merge across source/search channels and routed activation retrieval through it. Intended files: `packages/harness/src/activation/rankCandidates.ts`, `packages/harness/src/activation/activationEngine.ts`, `packages/harness/src/repositories/types.ts`, `packages/db/src/activationSmoke.ts`, activation tests, root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN. Non-goals preserved: no DB migration, no new retrieval store, no pgvector query implementation, no observation prefix integration, no trust/temporal filter change, no dashboard/API/MCP/server/plugin/source crawler. Evidence: RED focused activation test failed because `mergeActivationCandidates` did not exist; GREEN focused activation test passed with 9 files / 42 tests and proves a SourceClaim candidate and linked SearchDocument candidate merge into one source candidate while preserving search document metadata and graph/lexical signals; focused harness typecheck passed; full `pnpm typecheck` passed; full `pnpm test` passed with 46 files / 247 tests; DB-aware `pnpm db:ready` passed with 11/11 migrations and pgvector available; DB-aware `pnpm db:smoke:activation` passed with cleanup count `0`, retrieval candidates `5`, activation decisions `5`, search candidates `1`, included decisions `2`, conflict decisions `1`, stale decisions `1`, context exclusions `3`. Next: MM-41 trust, temporal, invalidation, and anti-memory filters.
- [x] (2026-06-23) MM-41 complete: added a pure ActivationEngine v2 filter pass for anti-memory, trust, temporal, invalidation, stale, and superseded filtering after candidate merge. Intended files: `packages/harness/src/activation/activationFilters.ts`, activation exports, activation tests, `packages/db/src/activationSmoke.ts`, root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN. Non-goals preserved: no DB migration, no retrieval merge change, no ContextROI/diversity rewrite, no observation prefix integration, no dashboard/API/MCP/server/plugin/source crawler. Evidence: RED focused activation test failed because `applyActivationFilters` did not exist; GREEN focused activation test passed with 9 files / 43 tests and proves merged source/search candidates are blocked by anti-memory while TTL-expired memory is stale and low-confidence memory is low_trust; focused harness and DB typechecks passed; full `pnpm typecheck` passed; full `pnpm test` passed with 46 files / 248 tests; DB-aware `pnpm db:ready` passed with 11/11 migrations and pgvector available; DB-aware `pnpm db:smoke:activation` passed with cleanup count `0`, retrieval candidates `5`, activation decisions `5`, search candidates `1`, included decisions `2`, conflict decisions `1`, stale decisions `1`, context exclusions `3`. Next: MM-42 ContextROI, diversity, dedup, inclusions, and exclusions.
- [x] (2026-06-23) MM-42 complete: hardened ContextROI selection so final activation context deduplicates by canonical subject, preserves requested memory/source/search diversity before filling remaining budget, and emits explicit duplicate/over_budget/low_context_roi exclusions. Intended files: `packages/harness/src/activation/contextRoi.ts`, activation tests, `packages/db/src/activationSmoke.ts`, root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN. Non-goals preserved: no DB migration, no retrieval query change, no anti-memory filter change, no observation prefix integration, no activation trace persistence change, no dashboard/API/MCP/server/plugin/source crawler. Evidence: RED focused activation test failed because ContextROI selected `memory-secondary` instead of the independent search support; GREEN focused activation test passed with 9 files / 44 tests and proves canonical dedup, kind diversity, and explicit duplicate/over_budget exclusions; focused harness and DB typechecks passed; full `pnpm typecheck` passed; full `pnpm test` passed with 46 files / 249 tests; DB-aware `pnpm db:ready` passed with 11/11 migrations and pgvector available; DB-aware `pnpm db:smoke:activation` passed with cleanup count `0`, retrieval candidates `5`, activation decisions `5`, search candidates `1`, included decisions `2`, conflict decisions `1`, stale decisions `1`, context exclusions `3`. Next: MM-43 activation trace and raw recall trigger.
- [x] (2026-06-23) MM-43 complete: added pure activation raw-evidence recall triggers for exact-proof and low-trust inclusions, persisted trigger summaries into activation decision and retrieval run metadata, and made activation smoke prove `Raw evidence recall triggers: 1`. Intended files: `packages/harness/src/activation/activationRawRecall.ts`, activation exports/tests, `packages/harness/src/activation/activationEngine.ts`, `packages/db/src/activationSmoke.ts`, `packages/cli/src/runDbSmokeCommand.ts`, root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN. Non-goals preserved: no DB migration, no raw evidence fetcher implementation, no observation prefix integration, no retrieval query change, no dashboard/API/MCP/server/plugin/source crawler. Evidence: focused activation test passed with 9 files / 45 tests and proves exact-proof source inclusions and low-trust memory inclusions create raw recall triggers with evidence hints; focused harness/db/cli typechecks passed after fixing strict optional input construction; full `pnpm typecheck` passed; full `pnpm test` passed with 46 files / 250 tests; DB-aware `pnpm db:ready` passed with 11/11 migrations and pgvector available; DB-aware `pnpm db:smoke:activation` passed with cleanup count `0`, retrieval candidates `5`, activation decisions `5`, raw evidence recall triggers `1`, and context exclusions `3`. Next: MM-44 observation prefix integration.
- [x] (2026-06-23) MM-44 complete: integrated the hardened observation prefix selector into context assembly as a rendered activation metadata artifact, added source-range counts to selected prefix items, and made activation smoke prove `Observation prefix items: 1`. Intended files: `packages/harness/src/activation/types.ts`, `packages/harness/src/activation/assembleContext.ts`, `packages/harness/src/observations/observationPrefix.ts`, activation/observation tests, `packages/db/src/activationSmoke.ts`, `packages/cli/src/runDbSmokeCommand.ts`, root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN. Non-goals preserved: no DB migration, no Memory Core mutation, no reflection, no promotion, no broad vector search rewrite, no dashboard/API/MCP/server/plugin/source crawler. Evidence: RED focused activation test failed because context with only a valid observation prefix still abstained; GREEN focused activation/observation-prefix tests passed with 9 files / 46 tests and prove source-ranged prefix metadata, selected item count, and low-relevance exclusion; focused harness/db/cli typechecks passed; DB-aware `pnpm db:smoke:activation` passed with cleanup count `0`, retrieval candidates `5`, activation decisions `5`, observation prefix items `1`, raw evidence recall triggers `1`, and context exclusions `3`. Next: MM-44A observation prefix integration gate.
- [x] (2026-06-23) MM-44A complete: added an assembly-side observation prefix gate so manually supplied prefix metadata is rejected when any selected item lacks source ranges. Intended files: `packages/harness/src/activation/assembleContext.ts`, `packages/harness/src/activation/index.test.ts`, root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN. Non-goals preserved: no DB migration, no new prefix fetcher, no reflection, no memory promotion, no broad vector search rewrite, no dashboard/API/MCP/server/plugin/source crawler. Evidence: RED focused activation test failed because an unsourced prefix-only context assembled; GREEN focused activation test passed with 9 files / 47 tests after context assembly omitted `metadata.observationPrefix`, added `metadata.observationPrefixGate` with `missing_source_ranges`, and kept the context abstained when no other inclusions existed. Next: MM-45 activation dogfood.
- [x] (2026-06-23) MM-45 complete: dogfooded activation before/after observation prefix on one KRN memory implementation task and recorded proof at `docs/runs/2026-06-23-activation-observation-prefix-dogfood.md`. Intended files: dogfood run doc, root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN. Non-goals preserved: no DB migration, no new CLI, no prefix fetcher, no reflection, no memory promotion, no dashboard/API/MCP/server/plugin/source crawler. Evidence: DB counts before and after stayed unchanged for `memory_records=4`, `memory_candidates=2`, `observation_groups=1`, `observation_items=5`, and `context_assemblies=18`; before context without candidates/prefix abstained with `no_candidates`; after context with one selected source-ranged observation prefix assembled with `observationPrefixItemCount=1`; verdict `prefix_improves_context_precision_without_candidates`. Next: MM-46 CapabilityRequirement and CapabilityPlan hardening.
- [x] (2026-06-23) MM-46 complete: hardened pure CapabilityRequirement/CapabilityPlan domain fields with explicit requirement priority and binding kinds while keeping TaskContract free of `requiredSkills`. Intended files: `packages/core/src/capabilityPlan.ts`, `packages/harness/src/compiler/createCapabilityPlan.ts`, compiler tests, root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN. Non-goals preserved: no DB migration, no CLI surface, no new skill lifecycle, no binding repository, no TaskContract `requiredSkills`, no dashboard/API/MCP/server/plugin/source crawler. Evidence: RED focused compiler test failed because capability requirements had no priority/binding kinds; GREEN focused compiler test passed with 9 files / 48 tests after requirements gained `priority: "required"` and binding kinds such as `skill`, `rule`, `policy_gate`, and `tool_boundary`; focused core/harness/codex-adapter typechecks passed; grep/audit proof keeps `TaskContract` outside requiredSkills ownership. Next: MM-47 CapabilityCompiler v1.
- [x] (2026-06-23) MM-47 complete: made CapabilityCompiler v1 derive focused schema/db requirements from memory/source/audit task text and verified Codex skill hints route those requirements to brain-store/source/evidence skills. Intended files: `packages/harness/src/compiler/createCapabilityPlan.ts`, `packages/harness/src/compiler/compileHarnessPlan.ts`, compiler tests, Codex adapter skill-hint tests, root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN. Non-goals preserved: no DB migration, no lifecycle repository, no new CLI, no TaskContract `requiredSkills`, no automatic skill growth, no dashboard/API/MCP/server/plugin/source crawler. Evidence: RED focused compiler test failed because a memory/source/audit task did not include `schema_design` or `db_migration`; GREEN focused compiler test passed with 9 files / 49 tests after task text routing added those requirements; focused Codex adapter test passed with 3 files / 7 tests and proves `brain-store-schema`, `source-to-decision`, and `evidence-review-loop` skill hints; focused harness and codex-adapter typechecks passed. Next: MM-48 Skill/rule/policy/tool binding models.
- [x] (2026-06-23) MM-48 complete: added pure core SkillBinding, RulePackBinding, PolicyGateBinding, and ToolBoundaryBinding contracts with conservative validation for invalid binding shapes. Intended files: `packages/core/src/capabilityPlan.ts`, `packages/core/src/capabilityPlan.test.ts`, root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN. Non-goals preserved: no DB migration, no repository, no CLI surface, no lifecycle events, no automatic skill/rule growth, no Codex invocation, no dashboard/API/MCP/server/plugin/source crawler. Evidence: RED focused core test failed because `validateCapabilityBindings` did not exist; GREEN focused core test passed with 4 files / 21 tests after binding contracts and validator were added; focused core/harness/codex-adapter typechecks passed; invalid binding with blank name/reason/evidence is rejected. Next: MM-49 Product-emitted skill/rule lifecycle without auto-growth.
- [x] (2026-06-23) MM-49 complete: added pure core CapabilityBindingCandidate and CapabilityBindingReview contracts with a promotion assessment gate requiring explicit approved review before capability bindings can be treated as promotable. Intended files: `packages/core/src/capabilityPlan.ts`, `packages/core/src/capabilityPlan.test.ts`, root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN. Non-goals preserved: no DB migration, no repository, no CLI, no automatic promotion, no Codex invocation, no dashboard/API/MCP/server/plugin/source crawler. Evidence: RED focused core test failed because `assessCapabilityBindingCandidatePromotion` did not exist; GREEN focused core test passed with 4 files / 22 tests after candidate/review contracts and assessment helper were added; focused core/harness/codex-adapter typechecks passed; proposed candidate is rejected until approved review with evidence ref exists. Next: MM-50 TypeScript/review-risk rule bindings.
- [x] (2026-06-23) MM-50 complete: routed TypeScript boundary and review-risk task text to focused capability requirements without adding lifecycle storage or runtime surfaces. Intended files: `packages/harness/src/compiler/createCapabilityPlan.ts`, `packages/harness/src/compiler/index.test.ts`, root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN. Non-goals preserved: no DB migration, no repository, no CLI, no new binding records, no automatic promotion, no Codex invocation, no dashboard/API/MCP/server/plugin/source crawler. Evidence: RED focused harness test failed because TS boundary/review-risk tasks only had generic `type_safety` evidence; GREEN focused harness test passed with 9 files / 50 tests after `type_safety`, `evidence_capture`, and `review_capture` requirements gained unknown-first/no-type-weakening/review-risk/diff-risk evidence; focused harness and codex-adapter typechecks passed; full `pnpm typecheck` and `pnpm test` passed with 47 files / 259 tests. Next: MM-51 Capability dogfood.
- [x] (2026-06-23) MM-51 complete: dogfooded capability routing on a persisted KRN memory implementation task and recorded proof at `docs/runs/2026-06-23-capability-routing-dogfood.md`. Intended files: dogfood run doc, `packages/cli/src/runCodexBriefCommand.ts`, focused CLI regression test, root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN. Non-goals preserved: no DB migration, no capability repository, no new CLI surface, no binding lifecycle promotion, no Codex invocation, no Memory Core mutation, no dashboard/API/MCP/server/plugin/source crawler. Evidence: live `krn plan --persist` created ExecutionRun `1c6dd716-3903-4d9f-b765-57c20019beff`; first `krn codex brief --run-id` readback exposed generic capability hints because the persisted TaskContract was not passed to `createCapabilityPlan`; RED focused CLI test failed because readback lacked `unknown-first boundary check`; GREEN focused CLI test passed after readback used the persisted TaskContract; final read-only brief preserved small, relevant hints for source-to-decision, typescript-type-safety, test-driven-development, evidence-review-loop, and brain-store-schema. Next: MM-52 EvidenceBundle hardening.
- [x] (2026-06-23) MM-52 complete: added pure core EvidenceBundle completeness assessment for required slice evidence without changing persistence/runtime surfaces. Intended files: `packages/core/src/evidenceBundle.ts`, `packages/core/src/evidenceBundle.test.ts`, root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN. Non-goals preserved: no schema change, no DB migration, no repository change, no CLI change, no review CLI, no candidate extraction, no Memory Core mutation, no dashboard/API/MCP/server/plugin/source crawler. Evidence: RED focused core test failed because `assessEvidenceBundleCompleteness` did not exist; GREEN focused core evidence test passed with 5 files / 25 tests after the helper flagged missing executionRunId, changedFiles, typecheck/test command evidence, diffSummary, sourceRefs, reviewBurden, rollbackPath, and failed required command evidence; focused core typecheck and full core test passed. Next: MM-53 ReviewAssessment and FeedbackDelta hardening.
- [x] (2026-06-23) MM-53 complete: added pure core normalization for ReviewAssessment and FeedbackDelta review signals without changing persistence/runtime surfaces. Intended files: `packages/core/src/reviewAssessment.ts`, `packages/core/src/feedbackDelta.ts`, `packages/core/src/reviewFeedback.test.ts`, root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN. Non-goals preserved: no schema change, no DB migration, no repository change, no CLI change, no review assess command, no candidate extraction, no Memory Core mutation, no dashboard/API/MCP/server/plugin/source crawler. Evidence: RED focused core test failed because `normalizeReviewAssessment` and `normalizeFeedbackDelta` did not exist; GREEN focused core reviewFeedback test passed with 6 files / 29 tests after helpers normalized outcome, review burden, diff risk, and correction labels from review/feedback metadata with conservative fallbacks; focused core typecheck and full core test passed. Next: MM-54 diff risk and review burden scoring v1.
- [x] (2026-06-23) MM-54 complete: added pure core EvidenceBundle review-risk scoring v1 so risky broad diffs score higher than narrow tested diffs. Intended files: `packages/core/src/evidenceBundle.ts`, `packages/core/src/evidenceBundle.test.ts`, root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN. Non-goals preserved: no schema change, no DB migration, no repository change, no CLI integration, no review assess command, no rollback enforcement, no candidate extraction, no Memory Core mutation, no dashboard/API/MCP/server/plugin/source crawler. Evidence: RED focused core evidence test failed because `scoreEvidenceBundleReviewRisk` did not exist; GREEN focused core evidence test passed with 6 files / 31 tests after deterministic scoring ranked docs-only tested diffs as low, narrow core diffs as medium, and broad DB/runtime diffs with failed required commands as high; focused core typecheck and full core test passed. Next: MM-55 rollback path enforcement.
- [x] (2026-06-23) MM-55 complete: added pure core EvidenceBundle rollback-path enforcement for non-doc changes. Intended files: `packages/core/src/evidenceBundle.ts`, `packages/core/src/evidenceBundle.test.ts`, root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN. Non-goals preserved: no schema change, no DB migration, no repository change, no CLI integration, no review assess command, no candidate extraction, no Memory Core mutation, no dashboard/API/MCP/server/plugin/source crawler. Evidence: RED focused core evidence test failed because `assessEvidenceBundleRollbackPath` did not exist; GREEN focused core evidence test passed with 6 files / 33 tests after docs-only diffs were exempted while non-doc core/DB/runtime diffs require a concrete revert or recovery command; focused core typecheck and full core test passed. Next: MM-56 candidate extraction from feedback.
- [x] (2026-06-23) MM-56 complete: added pure core FeedbackDelta candidate-proposal summary over already structured candidate/proposal fields without text mining or final Memory Core mutation. Intended files: `packages/core/src/feedbackDelta.ts`, `packages/core/src/reviewFeedback.test.ts`, root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN. Non-goals preserved: no LLM extraction, no freeform text mining, no schema change, no DB migration, no repository change, no CLI integration, no review assess command, no MemoryRecord creation, no SourceDecision truth write, no candidate promotion, no dashboard/API/MCP/server/plugin/source crawler. Evidence: RED focused core reviewFeedback test failed because `summarizeFeedbackCandidateProposals` did not exist; GREEN focused core reviewFeedback test passed with 6 files / 34 tests after structured memory/eval candidates and metadata source-claim/anti-memory/observation proposal arrays were summarized with `memoryRecordMutation: "none"`; focused core typecheck and full core test passed. Next: MM-56A code vocabulary and TypeScript elegance standard.
- [x] (2026-06-23) MM-56A complete: added the KRN code vocabulary and TypeScript elegance standard so helper names describe actual authority instead of implying hidden extraction, persistence, promotion, or final truth. Intended files: `docs/standards/code-vocabulary.md`, root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN. Non-goals preserved: no TypeScript source change, no schema change, no DB migration, no repository change, no CLI integration, no review assess command, no candidate creation, no Memory Core mutation, no dashboard/API/MCP/server/plugin/source crawler. Evidence: docs standard defines the authority ladder for `summarize`/`normalize`/`assess`/`validate`/`select`/`build`/`create`/`persist`/`promote`/`extract`, separates proposal/candidate/truth vocabulary, records the `extractFeedbackCandidates` anti-pattern, and anchors Matt Pocock-style TypeScript discipline to KRN package boundaries. Next: MM-57 review assess CLI.
- [x] (2026-06-23) MM-57 complete: added `krn review assess` as a manual CLI write path that persists a ReviewAssessment and FeedbackDelta through the existing harness repository. Intended files: `packages/cli/src/parseArgs.ts`, `packages/cli/src/runCli.ts`, `packages/cli/src/runReviewAssessCommand.ts`, `packages/cli/src/runCli.test.ts`, root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN. Non-goals preserved: no schema change, no DB migration, no repository change, no candidate row creation, no MemoryCandidate creation, no MemoryRecord creation, no SourceDecision truth write, no memory promotion, no dashboard/API/MCP/server/plugin/source crawler. Evidence: RED focused CLI test failed because `review assess` parsed as unsupported usage; GREEN focused CLI test passed with 6 files / 94 tests after the parser and runner persisted ReviewAssessment plus FeedbackDelta with outcome/reviewBurden/diffRisk/correctionLabels metadata and `memoryRecordMutation: "none"`; focused CLI typecheck passed. Next: MM-58 feedback dogfood capture from one KRN slice.
- [x] (2026-06-23) MM-58 complete: dogfooded feedback capture on one persisted KRN slice and recorded proof at `docs/runs/2026-06-23-feedback-dogfood.md`. Intended files: dogfood run doc, `packages/cli/src/databaseRuntime.ts`, `packages/cli/src/runCli.ts`, `packages/cli/src/runReviewAssessCommand.ts`, `packages/cli/src/runCli.test.ts`, root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN. Non-goals preserved: no schema change, no DB migration, no MemoryCandidate row creation, no MemoryRecord creation, no SourceDecision truth write, no candidate promotion, no dashboard/API/MCP/server/plugin/source crawler. Evidence: live `krn plan --persist` created ExecutionRun `5db6c5aa-3fcf-48bd-b013-f732c7558e33`; live evidence capture persisted EvidenceBundle `4d2e3247-4469-45bc-99a3-0a4b4095110d`, ReviewAssessment `99ad79d8-f4b1-4018-9721-79676238e882`, and FeedbackDelta `0ba61fdd-179d-455d-bac5-af57515b6f87`; captured FeedbackDelta contains one proposal-only memory candidate and zero SourceDecision/EvalCandidate proposals; first live review assess exposed an over-broad DB runtime dependency, then the command was narrowed to `createReviewAssessDatabaseRuntime`; live `krn review assess --persist` then created ReviewAssessment `c6b0130d-c6d0-4db2-95b5-4076201eee4e` and FeedbackDelta `de8b97e3-1593-4f4c-891a-60c7a3df444c` with `reviewBurden=medium`, `diffRisk=medium`, `correctionLabels=dirty_context`, and `memoryRecordMutation=none`; SQL counts moved from `8/8/8/2/4` to `9/10/10/2/4` for evidence/review/feedback/memory_candidates/memory_records. Next: MM-59 GoldenTask domain model.
- [x] (2026-06-23) MM-59 complete: added the pure GoldenTask domain model for behavior-focused golden eval cases. Intended files: `packages/core/src/goldenTask.ts`, `packages/core/src/goldenTask.test.ts`, `packages/core/src/ids.ts`, `packages/core/src/index.ts`, root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN. Non-goals preserved: no storage or fixture strategy, no DB schema/migration, no repository, no runner, no CLI, no Promptfoo export, no broad benchmark suite, no dashboard/API/MCP/server/plugin/source crawler. Evidence: RED focused core test failed because `./goldenTask.js` did not exist; GREEN focused core test passed with 7 files / 37 tests after adding `GoldenTask`, `GoldenCase`, `ExpectedBehavior`, `ProtectedFailureMode`, and `validateGoldenTaskContract`; focused core typecheck passed. The validator rejects artifact-theater cases without behavior expectations, missing protected failure modes, missing source/evidence refs, and private reasoning metadata. Next: MM-60 GoldenTask storage or fixture strategy.
- [x] (2026-06-23) MM-60 complete: chose file-backed golden task fixtures as the initial strategy and added schema-owned deterministic fixture parsing. Intended files: `tests/fixtures/golden-tasks/memory-behavior.json`, `packages/schema/src/goldenTask.ts`, `packages/schema/src/goldenTask.test.ts`, `packages/schema/src/index.ts`, root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN. Non-goals preserved: no DB schema/migration, no repository, no GoldenTask runtime memory, no eval runner, no CLI, no Promptfoo export, no broad benchmark suite, no dashboard/API/MCP/server/plugin/source crawler. Evidence: RED focused schema test failed because `./goldenTask.js` did not exist; GREEN focused schema test passed with 2 files / 21 tests after `parseGoldenTaskFixtures` validated unknown JSON fixtures and sorted tasks, cases, and protected failure modes by id; focused schema typecheck passed. Decision: file fixtures are seeds/test fixtures only, not Memory Core or runtime truth. Next: MM-61 memory behavior golden cases.
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

- Observation: MM-23 live run-scope smoke on legacy dogfood run `eb16411b-d304-420e-adc7-1fdb86857c1d` returned zero observations even though five observation rows exist for that run.
  Evidence: persisted run scope resolved project `9da67341-0124-407e-b3fa-197f7f850a57`, while the existing dogfood observation rows for the same run are under project `a704c6fa-8b15-4d77-a748-1eb6d5d9f13b`.
  Resolution: Keep reflect run-scope project filtering strict to avoid cross-project leaks. Use project-scope reflect for that legacy dogfood data, and let later project-isolation/dogfood slices decide whether legacy rows need migration or quarantine.

- Observation: MM-25 reflection dogfood over MM-17 observation data produced zero findings, zero contradictions, zero gaps, and zero candidate proposals.
  Evidence: persisted ReflectionRecord `dbe98bf2-e9e0-4aa6-89b0-05b30082a60f` selected five observations and one anti-memory record, but all output proposal/report arrays were empty.
  Resolution: Do not claim candidate quality from MM-25. Treat it as runtime proof only; future candidate/golden slices need richer fixtures or deterministic proposal rules before Memory Core growth is reviewed.

- Observation: Observation prefix selection belongs in harness selection logic, not CLI or DB.
  Evidence: `selectObservationPrefix` consumes `TaskContract` and already-loaded `ObservationItem[]`, returns selected items, warnings, and exclusions without repository or runtime imports.
  Resolution: Keep prefix policy pure and testable; later integration can call it from context assembly or CLI without hiding selection policy in adapters.

- Observation: Two external harsh reviews converged on PASS_WITH_RISKS and identified the same near-term failure mode: KRN has real observation/memory substrate now, but can still confuse staging tables, adapters, and green tests with governed Memory Core behavior.
  Evidence: Both reports flagged stale current-state docs, weak MM-17 dogfood, prefix relevance/scope risk, typed lineage gaps, hardcoded observe project scope, redaction gaps, loose timestamp validation, shallow audit snapshots, MemoryReviewGate bypass risk, narrow anti-memory enforcement, and premature confidence.
  Resolution: Insert MM-17A/MM-16R/MM-17B-MM-17F plus later governance/audit/eval repair slices before moving into reflection or promotion work.

- Observation: `krn observe --run` needs a narrower DB runtime than normal plan/evidence commands.
  Evidence: MM-17D removed the default workspace/project bootstrap from observe by adding a run-read-first runtime that resolves the project only after the persisted run is loaded.
  Resolution: Keep observe project-scoped and non-creating; future project registry work can broaden resolution, but observation persistence must not silently fall back to `local/mise-en-palace`.

- Observation: Schema/core observation parity can be guarded without changing package topology.
  Evidence: MM-17E added a test-only relative import from schema tests to the core observation policy source after a package import failed without a declared `@krn/core` dependency.
  Resolution: Keep production schema free of core runtime imports for now, but let tests fail when core observation kinds/provenance policy drift from schema IO coverage.

- Observation: Observer payload redaction must inspect values before truncation.
  Evidence: MM-17F RED tests showed neutral keys containing Bearer/API-key/cookie/private-key/token-like values survived key-only redaction.
  Resolution: Redact secret-shaped string values recursively and record the exact paths before JSON stringify/truncation.

- Observation: SourceClaim currently does not carry first-class `projectId` in the core type.
  Evidence: MM-20 reflection input selector can isolate source claims only by the existing `metadata.projectId` convention while observations and anti-memory records have explicit project scope.
  Resolution: Keep MM-20 bounded to the current model; source graph hardening should revisit first-class source-claim project scoping before broad reflection/activation use.

- Observation: Explicit anti-memory now covers search documents and observation prefixes, but only when callers provide explicit IDs/keys.
  Evidence: MM-30A added search-document blocking for metadata `sourceClaimId` and `memoryRecordId`, and prefix blocking when an `AntiMemoryRecord` key or `appliesTo` matches an observation id or subject.
  Resolution: Keep fuzzy semantic blocking out of activation until golden behavior proves the explicit path; MM-31 should focus on abstain behavior, not broader anti-memory matching.

- Observation: ContextAssembly already had an `abstained` status, but it did not explain why context was too weak.
  Evidence: MM-31 RED test showed weak low-trust memory produced `status: abstained` with no `metadata.activationAbstention`.
  Resolution: Attach a compact `ActivationAbstention` to context metadata with reason, explanation, candidate count, exclusion count, and exclusion reasons. Keep this in harness selection logic rather than CLI formatting or DB-specific code.

- Observation: Memory health audit can cover more semantic failure modes before DB-backed audit ingestion exists.
  Evidence: MM-32 extended the existing `AuditMemoryRecordSnapshot` path to flag stale high-confidence records, active records without lineage, missing application feedback, missing application guidance, and temporal records without invalidation strategy.
  Resolution: Keep MM-32 as snapshot-level semantic audit only. MM-32B owns CLI/AuditBundle/DB snapshot ingestion so the audit can inspect real persisted state.

- Observation: `krn review assess` needs a narrow review-assess DB runtime, not the broad planning runtime.
  Evidence: MM-58 live dogfood first failed after `review assess --persist` tried to resolve workspace/project through the broad `createDatabaseRuntime`, even though the command only needs `createReviewAssessment` and `createFeedbackDelta`.
  Resolution: Add `createReviewAssessDatabaseRuntime` and route the command through that narrower adapter surface; keep review assessment writes independent from local/mise-en-palace project bootstrap.

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

- Decision: Start GoldenTask persistence with file fixtures, not a DB table.
  Rationale: Repo evidence shows `EvalCandidate` and feedback proposal arrays exist, but there is no GoldenTask runner, promotion gate, or read/write lifecycle yet. The existing safe fixture pattern is `tests/fixtures/**`, and MM-60 only needs deterministic fixture loading. Mechanism: JSON fixtures are parsed as unknown at the schema boundary and sorted deterministically before later runner slices consume them. KRN implication: GoldenTask files are seed/test fixtures, not runtime memory or Memory Core. Decision: adopt file fixtures for MM-60, defer DB-backed GoldenTask storage until a later runner/promotion slice proves a query/review lifecycle need. Does not prove: golden behavior correctness, runner quality, production eval storage, or Promptfoo compatibility. Consumer: `packages/schema/src/goldenTask.ts` and `tests/fixtures/golden-tasks/memory-behavior.json`. Falsifier: MM-61-MM-67 require reviewed GoldenTask promotion, cross-project query, or persisted result history that cannot be represented safely by deterministic fixtures.
  Date/Author: 2026-06-23 / MM-60.

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

Gate 1 MM-17D outcome:
- `krn observe --run` no longer uses hardcoded `local` / `mise-en-palace` as its persistence scope.
- The observe command reads the persisted run first, resolves project scope from the run or explicit `--project`, and writes observations only after that project is resolved.
- Persisted runs without project scope fail with a clear `--project <project-id>` requirement before any observation project runtime is resolved.
- The slice remains manual deterministic observation staging only: no worker, no reflection, no MemoryRecord, no promotion, and no dashboard/API/MCP/server/plugin behavior.

Gate 1 MM-17E outcome:
- Observation IO timestamps are validated as timezone-bearing datetimes and normalized to UTC ISO strings at parse time.
- Schema tests compare observation kind/provenance enum coverage and source-range requirement behavior against the core observation policy source.
- Observation prefix stale checks use parsed datetime values rather than string ordering, so offset timestamps cannot bypass stale exclusion.
- No DB schema, repository, worker, reflection, or Memory Core behavior changed.

Gate 1 MM-17F outcome:
- Observer input redacts secret-looking string values as well as secret-looking keys.
- Redaction covers Bearer/JWT-like values, API-key-like values, GitHub-token-like values, cookie/session strings, and private-key blocks.
- Redaction records source paths before payload truncation, so truncated observer payloads cannot preserve an unredacted secret suffix or prefix.
- No external scanner, LLM, worker, DB, observe runtime, reflection, or Memory Core behavior changed.

Gate 2 MM-18 outcome:
- Pure reflection contracts now exist in `packages/core/src/reflection`.
- Reflection output can carry findings, contradictions, gaps, and proposals for memory/source-claim/anti-memory/policy/eval candidates.
- Candidate target constants intentionally exclude active memory and source-decision targets.
- Reflection still has no schema, persistence, repository, CLI, worker, LLM call, Memory Core mutation, or promotion behavior.

Gate 2 MM-18A outcome:
- Reflection output contract assessment now returns explicit violations instead of only a boolean.
- The guard rejects final-truth target links and promotion-semantics metadata before reflection persistence or runtime exists.
- Reflection remains candidate-only and core-pure: no DB, repository, CLI, worker, LLM call, or Memory Core mutation behavior.

Gate 2 MM-19 outcome:
- Reflection IO schemas now parse candidate-only reflection records and reject final-truth targets or mutation metadata.
- `reflection_records` persists project/run/task/status as relational query fields and stores scope/input/output/metadata as JSONB payloads.
- Live DB readiness now reports 11/11 migrations applied with pgvector available.
- No reflection repository, input selector, CLI, worker, LLM call, or Memory Core mutation behavior exists yet; MM-20 owns repository and selector behavior.

Gate 2 MM-20 outcome:
- Reflection persistence now has a thin DB repository with create/get/list-by-scope methods.
- Reflection input selection is pure harness logic over already loaded observations, source claims, and anti-memory records.
- Selector tests prove project isolation and prove conflict/gap observations stay visible for reflection instead of being hidden.
- No reflection CLI, worker, LLM call, candidate generation, Memory Core mutation, or source-decision truth write exists yet.

Gate 2 MM-21 outcome:
- Reflection output can now be converted into a deterministic candidate generation plan.
- The plan counts memory/source-claim/anti-memory/policy/eval proposals and remains blocked when candidate-only contract violations exist.
- No candidate rows, MemoryRecord rows, SourceDecision rows, CLI, worker, LLM call, or runtime mutation path was added.

Gate 2 MM-22 outcome:
- Reflection can now derive deterministic contradiction and gap reports from already-loaded observation and decision snapshots.
- Reports cover contested/conflict observations, missing required source ranges, stale observations, duplicate observations, and unsupported decisions without source-claim links.
- The helper emits findings plus contradiction/gap reports only; no DB rows, candidate rows, MemoryRecord rows, SourceDecision rows, CLI, worker, LLM call, or runtime mutation path was added.

Gate 2 MM-23 outcome:
- Manual `krn reflect --scope run:<id>|project:<id>|topic:<name>` exists with preview by default and explicit `--persist` for DB writes.
- Persisted reflect writes a ReflectionRecord only; candidate row creation, MemoryRecord creation, source decision writes, promotion, worker execution, and LLM calls remain out of scope.
- The CLI uses a narrow reflect DB runtime rather than the broad planning runtime, keeping the write surface to reflection persistence.

Gate 2 MM-24 outcome:
- Reflect runtime now physically exposes only read-only anti-memory listing on its memory surface.
- Tests prove the reflect command source contains no direct memory create/promote/reject calls and that the injected runtime surface does not expose promotion methods.
- This is a CLI/runtime guard only; MM-24A still owns repository/runtime row-count proof and broader mutation-boundary checks.

Gate 2 MM-24A outcome:
- Runtime proof is recorded in `docs/runs/2026-06-22-reflection-mutation-proof.md`.
- `krn reflect --persist` created a ReflectionRecord while leaving MemoryRecord and MemoryCandidate counts unchanged.
- Reflection remains staging/report persistence only; MemoryReviewGate and candidate row creation are still future slices.

Gate 2 MM-25 outcome:
- Reflection dogfood is recorded in `docs/runs/2026-06-22-reflection-dogfood.md`.
- The current MM-17 observation set is readable by reflect and can produce a persisted ReflectionRecord.
- The dogfood output produced zero findings and zero candidate proposals, so it proves runtime wiring but not memory-learning quality.

Gate 3 MM-26 outcome:
- Memory Core repository writes now enforce source lineage, owner, application guidance, confidence bounds, and temporal invalidation requirements.
- The invariant applies to direct MemoryRecord creation, MemoryCandidate creation, and candidate promotion readback validation.
- This is still not MemoryReviewGate; MM-26A/MM-27 own sealing public write surfaces and reviewed promotion.

Gate 3 MM-30A outcome:
- Anti-memory enforcement now covers explicit memory-record candidates, source-claim candidates, search documents with linked `sourceClaimId` / `memoryRecordId` metadata, and observation prefix items whose id or subject matches anti-memory `key` / `appliesTo`.
- Blocked search-document candidates carry anti-memory conflict metadata and are excluded with unsafe context reasons through the existing activation conflict path.
- Observation prefix selection can receive active anti-memory records and excludes matching staging observations before rendering a prefix.
- No fuzzy semantic blocker, source crawler, dashboard/API/MCP/server/plugin, or separate graph/vector DB behavior was added.

Gate 3 MM-31 outcome:
- Context assembly now abstains with an explicit `ActivationAbstention` metadata record instead of only setting `status: abstained`.
- Abstention reasons distinguish no candidates, weak context, over-budget context, unsafe context, and all-excluded fallback.
- Weak memory/source/search support remains a warning/metadata signal, not a padding mechanism and not a Memory Core mutation.
- No activation v2 rewrite, DB migration, CLI surface, dashboard/API/MCP/server/plugin, or source crawler behavior was added.

Gate 3 MM-32 outcome:
- Memory health audit now flags stale high-confidence memory, active memory with no lineage/source-claim support, active memory with no application feedback, memory records lacking application guidance, and temporal memory without an invalidation strategy.
- Existing repeated negative feedback blocking findings remain intact.
- The audit still consumes supplied snapshots only; it does not yet read DB state or AuditBundle verification output directly.
- No automatic invalidation/demotion, DB snapshot reader, audit CLI ingestion upgrade, dashboard/API/MCP/server/plugin, or source crawler behavior was added.

Gate 3 MM-33 outcome:
- One reviewed KRN lesson has been promoted through the governed public
  MemoryReviewGate path.
- The promoted memory is source-linked, confidence-aware, owned, guided,
  invalidation-aware, versioned, and carries review-gate evidence metadata.
- A later matching `krn plan --persist` selected that memory into context, and
  `krn memory record apply --persist` recorded the application as `helped`.
- This closes the first real reviewed-memory dogfood loop, but it does not
  prove golden memory behavior, fuzzy anti-memory, API/MCP/dashboard readiness,
  or automatic promotion safety.

Gate 4 MM-34 outcome:
- SourceClaim IO now requires a falsifier, so source mapping must include a
  testable failure condition before CLI preview or persistence.
- `DrizzleSourceRepository` rejects SourceClaim and SourceDecisionEdge writes
  with decorative support types such as generic/background support.
- `DrizzleSourceRepository.createSourceDecision` rejects `adopt` and `reject`
  decisions without a linked SourceClaim.
- Legacy negative smoke examples now use decision-grade `rejection`/`risk`
  support types instead of persisting decorative claims.
- No DB migration was required; the hardening lives at IO and repository
  boundaries over the existing relational source graph schema.

Gate 4 MM-35 outcome:
- Public `krn source decision link --persist` now rejects SourceClaims with
  `rejected` or `deprecated` status before attempting to create a decision
  edge.
- `DrizzleSourceRepository.createSourceDecisionEdge` now reads the linked
  SourceClaim and rejects rejected/deprecated claims at the repository boundary.
- Existing `source claim reject` remains the explicit workflow for decorative
  or unsupported sources; rejected claims are not reusable as decision support.
- No DB migration was required; MM-35 tightened write semantics over existing
  SourceClaim status and SourceDecisionEdge tables.

Gate 4 MM-36 outcome:
- Source trust tiers now have deterministic ranks for source governance
  assessment.
- `assessSourceClaimOverride` blocks a newer weak SourceClaim from overriding
  stronger current consensus unless the caller supplies an explicit override
  reason.
- `revisitWhen` acts as the temporal staleness boundary for this slice:
  stronger consensus past its revisit time is not treated as current blocking
  consensus.
- No DB migration was required; MM-36 added source policy behavior over
  existing SourceClaim fields.

Gate 4 MM-37 outcome:
- Source graph health audit now detects decorative SourceClaim support types,
  stale accepted SourceClaims, accepted SourceClaims with no SourceDecision,
  and SourceDecisions that still reference rejected/deprecated claims.
- DB-backed audit semantic snapshots now include SourceClaim `trustTier`,
  `supportType`, and `revisitWhen` so health checks can run from persisted
  source graph state.
- No DB migration or new CLI surface was required; MM-37 expanded semantic
  audit behavior over existing source tables and snapshots.

Gate 4 MM-38 outcome:
- A live KRN implementation decision is now dogfooded through the source graph:
  SourceClaim `d5ea7024-7d7a-4291-a050-4de1fbebf605` records mechanism,
  doesNotProve, falsifier, consumer, trust, support type, and run linkage for
  the MM-37 source graph health audit decision.
- SourceDecisionEdge `a343ebef-2951-4ba6-b0d7-8eb3af586509` links that claim to
  ExecutionRun `bba64c9a-eb96-47b7-819a-93937e6d8c5d`.
- DB proof shows the dogfood run has one source claim and one source decision
  edge; this proves source-to-decision plumbing for one implementation decision,
  not ActivationEngine v2 trust filtering or source graph query quality.

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
- Slice note (2026-06-23): harden source graph inputs and repository writes so
  SourceClaim and SourceDecisionEdge cannot become decorative citations.
  Intended files: `packages/schema/src/sourceClaim.ts`, schema tests,
  `packages/db/src/repositories/DrizzleSourceRepository.ts`, focused source
  repository tests, source graph smoke if needed, CLI source command tests if
  parser behavior changes, root `PLAN.md`, `GOAL.md`, handoff files, and this
  PLAN. Non-goals: no new DB migration unless a storage invariant cannot be
  enforced in adapters, no source crawler, no reflection candidate persistence,
  no Memory Core mutation, no dashboard/API/MCP/server/plugin, no broad eval
  suite, no Research Foundry, no Pattern Vault, no runtime markdown memory.
- Verification:
      decorative source fixture rejected.

MM-35 — Source rejection workflow
- Add source_rejections behavior and CLI/report surface if needed.
- Slice note (2026-06-23): existing `source claim reject` CLI and
  `source_rejections` persistence already exist, so this slice hardens the
  missing support boundary: rejected/deprecated SourceClaim rows must not be
  usable as SourceDecisionEdge support. Intended files:
  `packages/db/src/repositories/DrizzleSourceRepository.ts`, focused source
  repository tests, `packages/cli/src/runSourceDecisionLinkCommand.ts`, CLI
  source decision tests, root `PLAN.md`, `GOAL.md`, handoff files, and this
  PLAN. Non-goals: no new DB migration, no source crawler, no source graph
  health audit, no trust-tier/temporal scoring, no reflection candidate
  persistence, no Memory Core mutation, no dashboard/API/MCP/server/plugin.
- Verification:
      rejected source cannot support decision.

MM-36 — Trust and temporal source behavior
- Add trust scoring and temporal validity for claims.
- Slice note (2026-06-23): implement this as a thin source-governance policy
  over existing SourceClaim fields, not a migration. `trustTier` becomes a
  deterministic rank input and `revisitWhen` is the temporal review/staleness
  boundary for this slice. Intended files:
  `packages/db/src/repositories/DrizzleSourceRepository.ts`, focused source
  repository tests, root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN.
  Non-goals: no DB migration, no source crawler, no source graph health audit,
  no activation v2 integration, no reflection candidate persistence, no Memory
  Core mutation, no dashboard/API/MCP/server/plugin.
- Verification:
      latest weak source cannot override stronger older consensus without reason.

MM-37 — Source graph health audit
- Detect decorative sources, decisions without sources, sources without consumers, stale claims.
- Slice note (2026-06-23): extend the existing source grounding audit over
  semantic snapshots rather than adding schema or crawler behavior. Intended
  files: `packages/harness/src/audit/auditChecks.ts`, focused audit tests,
  `packages/db/src/auditSemanticSnapshot.ts`, root `PLAN.md`, `GOAL.md`,
  handoff files, and this PLAN. Non-goals: no DB migration, no source crawler,
  no new CLI surface, no activation v2 integration, no reflection candidate
  persistence, no Memory Core mutation, no dashboard/API/MCP/server/plugin.
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

Gate 5 MM-39 outcome:
- `ActivationQuery` now models task id, project id, focus, needs, scope,
  budget, risk, text, and query terms.
- `buildActivationQuery` builds a pure query contract from `TaskContract` plus
  explicit memory/source/observation needs, budget, risk, and extra terms.
- Existing `buildMemoryQuery` and `buildSourceQuery` now use the unified query
  builder while preserving their focused defaults.
- No retrieval merge, trust/temporal filtering change, activation persistence
  change, DB migration, or new runtime surface was added.

Gate 5 MM-40 outcome:
- `mergeActivationCandidates` now deduplicates ranked activation candidates by
  canonical source/memory subject and preserves lexical, vector, graph,
  temporal, context ROI, feedback, merged candidate ids, merged kinds, and
  search document ids.
- `retrieveActivationCandidates` now returns merged memory/source/search
  candidates before downstream conflict, trust, temporal, and context ROI
  filters run.
- Search results linked to SourceClaims or MemoryRecords can now enrich the
  canonical candidate instead of entering context as duplicate nearby text.
- No DB migration, new retrieval store, vector query implementation, trust/
  temporal filter change, or observation prefix integration was added.

Gate 5 MM-41 outcome:
- `applyActivationFilters` now provides a pure post-merge filter pass for
  anti-memory conflict detection, trust filtering, and temporal/invalidation
  filtering.
- Activation smoke now uses the same unified filter pass instead of composing
  conflict, trust, and temporal filters inline.
- A merged source/search candidate blocked by anti-memory remains a single
  excluded candidate with linked search-document metadata; expired memory is
  stale and low-confidence memory is low_trust.
- No DB migration, retrieval merge change, ContextROI/diversity rewrite, or
  observation prefix integration was added.

Gate 5 MM-42 outcome:
- `applyContextROI` now deduplicates final candidates by canonical source or
  memory subject before budget selection.
- ContextROI can preserve requested kind diversity, so a small budget can keep
  memory/source/search support instead of filling with near-duplicate high
  scores.
- Duplicate, low-ROI, and over-budget candidates remain in the output as
  explicit exclusions for audit/context assembly.
- Activation smoke now passes through the diversity-aware ContextROI policy.
- No DB migration, retrieval query change, anti-memory filter change,
  activation trace persistence change, or observation prefix integration was
  added.

Gate 5 MM-43 outcome:
- `buildActivationRawRecallTriggers` now marks included candidates that need
  exact proof or have low trust before response/runtime use.
- `persistActivationTrace` stores raw recall requirements on inclusion
  activation decisions and summarizes triggers on the retrieval run metadata.
- Activation smoke now proves one persisted raw evidence recall trigger and
  reports it in CLI output.
- No DB migration, raw evidence fetcher, retrieval query change, or observation
  prefix integration was added.

Gate 5 MM-44 outcome:
- `assembleContext` now accepts the existing hardened `ObservationPrefix` and
  stores it as `metadata.observationPrefix` with rendered text, selected items,
  warnings, and exclusions.
- Observation prefix items now carry `sourceRangeCount`, so context metadata can
  prove selected prefix items are source-ranged without turning them into
  MemoryRecord truth.
- A context with useful observation prefix items can be `assembled` even when no
  memory/source/search candidates are included; the prefix remains metadata,
  not a new `ContextSubjectType`.
- Activation smoke now persists and reports one observation prefix item.
- No DB migration, Memory Core mutation, reflection, promotion, broad vector
  search rewrite, or observation fetcher was added.

Gate 5 MM-44A outcome:
- `assembleContext` now treats observation prefix integration as gated
  metadata, not an unconditional context source.
- If any selected prefix item has `sourceRangeCount <= 0`, context assembly
  rejects the prefix metadata, records `metadata.observationPrefixGate` with
  `missing_source_ranges`, and keeps a prefix-only context abstained.
- Valid selector output from MM-44 is unchanged: source-ranged prefix items can
  still be attached as rendered activation metadata.
- No DB migration, prefix fetcher, reflection, memory promotion, broad vector
  search rewrite, or new runtime surface was added.

Gate 5 MM-45 outcome:
- Activation dogfood compared the same KRN memory implementation task before
  and after observation prefix.
- Before prefix, context correctly abstained with `no_candidates`.
- After prefix, context assembled with one source-ranged observation prefix
  item and no memory/source/search inclusions.
- DB before/after counts proved no Memory Core, observation, or context
  persistence mutation during the dogfood proof.
- The proof is recorded at
  `docs/runs/2026-06-23-activation-observation-prefix-dogfood.md`.

Slices:

MM-39 — ActivationQuery model
- Unify task, project, scope, memory/source/observation needs, budget, and risk.
- Slice note (2026-06-23): implement this as a pure harness query contract
  and builder over existing TaskContract text. Intended files:
  `packages/harness/src/activation/types.ts`,
  `packages/harness/src/activation/memoryQuery.ts`, activation tests, root
  `PLAN.md`, `GOAL.md`, handoff files, and this PLAN. Non-goals: no DB
  migration, no retrieval merge, no trust/temporal filter change, no activation
  trace persistence change, no source crawler, no dashboard/API/MCP/server/plugin.
- Verification:
      pure tests.

MM-40 — Hybrid candidate merge
- Merge lexical, vector, graph, source, memory, and observation candidates.
- Use existing Postgres/pgvector/FTS capabilities; no new store.
- Slice note (2026-06-23): implement this as pure candidate merge behavior over
  existing ranked activation candidates, then route retrieval through it.
  Intended files: `packages/harness/src/activation/rankCandidates.ts`,
  activation tests, root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN.
  Non-goals: no DB migration, no new retrieval store, no pgvector query
  implementation, no observation prefix integration, no trust/temporal filter
  change, no dashboard/API/MCP/server/plugin/source crawler.
- Verification:
      fixture with duplicates merges correctly.

MM-41 — Trust/temporal/invalidation/anti-memory filters
- Filter invalid, stale, low-trust, blocked, and superseded candidates.
- Slice note (2026-06-23): add a pure ActivationEngine v2 filter pass that
  applies anti-memory conflict detection, trust filtering, and temporal/
  invalidation filtering after candidate merge. Intended files:
  `packages/harness/src/activation/activationFilters.ts`, activation exports,
  activation tests, root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN.
  Non-goals: no DB migration, no retrieval merge change, no ContextROI/
  diversity rewrite, no observation prefix integration, no dashboard/API/MCP/
  server/plugin/source crawler.
- Verification:
      anti-memory and TTL fixtures pass.

MM-42 — ContextROI, diversity, dedup, inclusions/exclusions
- Rank final context by expected decision impact vs cost.
- Persist inclusions and exclusions with reasons.
- Slice note (2026-06-23): harden pure ContextROI selection so final context
  deduplicates candidates by canonical subject, preserves source/memory/search
  diversity before filling remaining budget, and emits explicit duplicate/
  over_budget/low_context_roi exclusions instead of silently dropping
  candidates. Intended files: `packages/harness/src/activation/contextRoi.ts`,
  activation tests, root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN.
  Non-goals: no DB migration, no retrieval query change, no anti-memory filter
  change, no observation prefix integration, no activation trace persistence
  change, no dashboard/API/MCP/server/plugin/source crawler.
- Verification:
      noisy fixture returns small context with explicit exclusions.

MM-43 — Activation trace and raw recall trigger
- Persist activation decision trace.
- Trigger raw evidence recall when exact proof is needed or confidence is low.
- Slice note (2026-06-23): add a pure raw-evidence recall trigger helper for
  included activation candidates and persist the trigger summary into activation
  trace metadata. Trigger reasons should cover high-risk/exact-proof source or
  search inclusions and low-trust included context. Intended files:
  `packages/harness/src/activation/activationRawRecall.ts`, activation exports,
  activation tests, `packages/harness/src/activation/activationEngine.ts`,
  `packages/db/src/activationSmoke.ts`, root `PLAN.md`, `GOAL.md`, handoff
  files, and this PLAN. Non-goals: no DB migration, no raw evidence fetcher
  implementation, no observation prefix integration, no retrieval query change,
  no dashboard/API/MCP/server/plugin/source crawler.
- Verification:
      low-confidence task asks for raw recall instead of confident answer.

MM-44 — Observation prefix integration
- Include small observation prefix when it improves context.
- Slice note (2026-06-23): integrate the existing hardened observation prefix
  selector into context assembly as a rendered activation metadata artifact,
  not as MemoryRecord truth and not as a new broad context dump. Prefix items
  must carry source-range count and context assembly metadata must preserve the
  rendered text, selected items, warnings, and exclusions. Intended files:
  `packages/harness/src/activation/types.ts`,
  `packages/harness/src/activation/assembleContext.ts`,
  `packages/harness/src/observations/observationPrefix.ts`, activation/
  observation tests, `packages/db/src/activationSmoke.ts`, root `PLAN.md`,
  `GOAL.md`, handoff files, and this PLAN. Non-goals: no DB migration, no
  Memory Core mutation, no reflection, no promotion, no broad vector search
  rewrite, no dashboard/API/MCP/server/plugin/source crawler.
- Verification:
      prefix is small and source-ranged.

MM-44A — Observation prefix integration gate
- Objective: wire observation prefix into activation/context assembly only after relevance, project-scope, typed-lineage, and anti-memory hardening are complete.
- Source: both reports warned that prefix integration before hardening would reintroduce context bloat through a new channel.
- Intended files: `packages/harness/src/activation/*`, `packages/harness/src/observations/observationPrefix.ts`, context assembly tests, this PLAN.
- Slice note (2026-06-23): add a context assembly gate that rejects an
  observation prefix if selected items are not source-ranged, even if a caller
  manually constructs a prefix. This complements selector relevance,
  project-scope, and anti-memory tests already in place. Intended files:
  `packages/harness/src/activation/assembleContext.ts`,
  `packages/harness/src/activation/index.test.ts`, root `PLAN.md`, `GOAL.md`,
  handoff files, and this PLAN. Non-goals: no DB migration, no new prefix
  fetcher, no reflection, no memory promotion, no broad vector search rewrite,
  no dashboard/API/MCP/server/plugin/source crawler.
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
- Slice note (2026-06-23): run a dogfood proof over existing activation APIs
  that compares the same KRN memory task with no observation prefix and with a
  selected source-ranged observation prefix. Record DB before/after counts for
  Memory Core tables to prove the dogfood did not mutate memory. Intended
  files: `docs/runs/2026-06-23-activation-observation-prefix-dogfood.md`,
  root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN. Non-goals: no DB
  migration, no new CLI, no prefix fetcher, no reflection, no memory promotion,
  no dashboard/API/MCP/server/plugin/source crawler.
- Verification:
      context precision improves or result is marked revisit; no automatic product mutation.

### Gate 6 — Capability Compiler

Purpose:
Choose skill/rule/policy/tool bindings based on task needs without turning TaskContract into requiredSkills.

At the end:
- CapabilityCompiler maps task requirements to bindings.
- Skill/rule/policy lifecycle is reviewed and auditable.
- Product-emitted skills remain bounded engineering disciplines.

Gate 6 MM-46 outcome:
- `CapabilityRequirement` now carries explicit `priority` and `bindingKinds`.
- `createCapabilityPlan` emits required requirements with bounded binding kinds
  such as `skill`, `rule`, `policy_gate`, and `tool_boundary`.
- `TaskContract` remains free of `requiredSkills`; capability binding stays in
  CapabilityPlan/CapabilityCompiler layers.
- No DB, CLI, lifecycle repository, or runtime surface was added.

Gate 6 MM-47 outcome:
- CapabilityCompiler v1 now derives additional schema/db requirements from
  memory/source/audit task text.
- Memory/source/audit task fixtures route to `schema_design`, `db_migration`,
  `source_grounding`, `evidence_capture`, and `review_capture`.
- Codex adapter skill hints for those requirements include `brain-store-schema`,
  `source-to-decision`, and `evidence-review-loop`.
- TaskContract still does not own `requiredSkills`, and no automatic skill
  growth or lifecycle repository was added.

Gate 6 MM-48 outcome:
- Pure core binding contracts now exist for `SkillBinding`, `RulePackBinding`,
  `PolicyGateBinding`, and `ToolBoundaryBinding`.
- `validateCapabilityBindings` rejects empty binding names, reasons, and
  evidence requirements.
- Bindings remain plan artifacts only; no lifecycle storage, CLI, execution
  authority, or automatic skill/rule growth was added.

Gate 6 MM-49 outcome:
- Capability binding candidates now require explicit review before promotion.
- `assessCapabilityBindingCandidatePromotion` rejects proposed/unreviewed
  candidates and requires approved review, reviewer, and reviewed evidence ref.
- The lifecycle remains pure core assessment only; no storage, CLI, execution
  authority, or automatic skill/rule growth was added.

Gate 6 MM-50 outcome:
- CapabilityCompiler now detects TypeScript boundary task text and strengthens
  `type_safety` evidence with unknown-first boundary and no-type-weakening
  requirements.
- Review-risk/diff-risk task text now strengthens `evidence_capture` and
  `review_capture` with changed-file, diff-risk, and review-risk evidence.
- The routing remains CapabilityPlan requirements only; no binding repository,
  CLI, Codex invocation, lifecycle promotion, or runtime surface was added.

Gate 6 MM-51 outcome:
- A persisted memory implementation task selected small, relevant, auditable
  capability hints across source grounding, TypeScript safety, tests,
  evidence/review capture, and brain-store schema.
- `krn codex brief --run-id` now preserves task-text capability routing from
  the persisted TaskContract instead of reconstructing generic hints.
- The dogfood remained read-only for Codex and did not mutate Memory Core or
  promote capability bindings.

Slices:

MM-46 — Capability domain hardening
- Add/adjust CapabilityRequirement, CapabilityPlan, binding kinds.
- Slice note (2026-06-23): harden the existing pure CapabilityPlan domain by
  making every `CapabilityRequirement` carry explicit priority and binding
  kinds. This prepares MM-47/MM-48 without moving skill/rule/tool selection
  into `TaskContract`. Intended files: `packages/core/src/capabilityPlan.ts`,
  `packages/harness/src/compiler/createCapabilityPlan.ts`, compiler tests,
  root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN. Non-goals: no DB
  migration, no CLI surface, no new skill lifecycle, no binding repository, no
  TaskContract `requiredSkills`, no dashboard/API/MCP/server/plugin/source
  crawler.
- Verification:
      grep proves TaskContract does not own requiredSkills as core primitive.

MM-47 — CapabilityCompiler v1
- Compile task/risk/context into skill/rule/policy/tool bindings.
- Slice note (2026-06-23): make the existing `createCapabilityPlan` act as
  CapabilityCompiler v1 by deriving additional requirements from TaskContract
  task text and context state. Memory/source/audit tasks must route to small,
  relevant requirements that the Codex adapter can render as skill hints.
  Intended files: `packages/harness/src/compiler/createCapabilityPlan.ts`,
  `packages/harness/src/compiler/compileHarnessPlan.ts`, compiler tests,
  Codex adapter tests if needed, root `PLAN.md`, `GOAL.md`, handoff files, and
  this PLAN. Non-goals: no DB migration, no lifecycle repository, no new CLI,
  no TaskContract `requiredSkills`, no automatic skill growth, no dashboard/
  API/MCP/server/plugin/source crawler.
- Verification:
      fixtures route memory task to memory/source/audit skills.

MM-48 — Binding models
- Add SkillBinding, RulePackBinding, PolicyGateBinding, ToolBoundaryBinding.
- Slice note (2026-06-23): add pure core binding model contracts plus a
  conservative validator for invalid binding shapes. Bindings remain proposed
  plan artifacts, not lifecycle records and not runtime execution authority.
  Intended files: `packages/core/src/capabilityPlan.ts`, focused core tests,
  root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN. Non-goals: no DB
  migration, no repository, no CLI surface, no lifecycle events, no automatic
  skill/rule growth, no Codex invocation, no dashboard/API/MCP/server/plugin/
  source crawler.
- Verification:
      invalid binding rejected.

MM-49 — Lifecycle without auto-growth
- Add skill/rule lifecycle events and review gate.
- No automatic skill/rule promotion.
- Slice note (2026-06-23): add pure core candidate/review-gate contracts for
  capability bindings so product-emitted skill/rule/policy/tool bindings remain
  proposals until explicitly reviewed. Intended files:
  `packages/core/src/capabilityPlan.ts`, focused core tests, root `PLAN.md`,
  `GOAL.md`, handoff files, and this PLAN. Non-goals: no DB migration, no
  repository, no CLI, no automatic promotion, no Codex invocation, no dashboard/
  API/MCP/server/plugin/source crawler.
- Verification:
      candidate requires review.

MM-50 — TypeScript and review-risk bindings
- Bind TS boundary review and diff-risk review when relevant.
- Slice note (2026-06-23): strengthen CapabilityCompiler routing for
  TypeScript boundary and review-risk tasks by making existing
  `type_safety`, `evidence_capture`, and `review_capture` requirements carry
  concrete evidence for unknown-first parsing, no type weakening, changed-file
  review, and diff-risk review. Intended files:
  `packages/harness/src/compiler/createCapabilityPlan.ts`, focused compiler
  tests, root `PLAN.md`, `GOAL.md`, handoff files, and this PLAN. Non-goals:
  no DB migration, no repository, no CLI, no new binding records, no automatic
  promotion, no Codex invocation, no dashboard/API/MCP/server/plugin/source
  crawler.
- Verification:
      TS boundary fixture triggers type-review binding.

MM-51 — Capability dogfood
- Use compiler on a KRN memory implementation task.
- Slice note (2026-06-23): run live persisted capability routing dogfood on a
  KRN memory implementation task, record selected hints, and make the
  read-only Codex brief readback preserve the same task-text routing as
  `krn plan`. Intended files: dogfood run doc, `packages/cli/src/
  runCodexBriefCommand.ts`, focused CLI test, root `PLAN.md`, `GOAL.md`,
  handoff files, and this PLAN. Non-goals: no DB migration, no capability
  repository, no new CLI surface, no binding lifecycle promotion, no Codex
  invocation, no Memory Core mutation, no dashboard/API/MCP/server/plugin/
  source crawler.
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
- Slice note (2026-06-23): add a pure core EvidenceBundle completeness
  assessment helper that flags missing execution run linkage, changed files,
  required typecheck/test command evidence, diff summary, source references,
  review burden, rollback path, and failed required command evidence. Intended
  files: `packages/core/src/evidenceBundle.ts`, focused core tests, root
  `PLAN.md`, `GOAL.md`, handoff files, and this PLAN. Non-goals: no schema
  change, no DB migration, no repository change, no CLI change, no review CLI,
  no candidate extraction, no Memory Core mutation, no dashboard/API/MCP/
  server/plugin/source crawler.
- Verification:
      missing required evidence is rejected or flagged.

MM-53 — ReviewAssessment / FeedbackDelta hardening
- Normalize reviewer feedback, outcome, burden, risk, correction labels.
- Intended files: `packages/core/src/reviewAssessment.ts`,
  `packages/core/src/feedbackDelta.ts`,
  `packages/core/src/reviewFeedback.test.ts`, root `PLAN.md`, `GOAL.md`,
  handoff files, and this PLAN.
- Non-goals: no schema change, no DB migration, no repository change, no CLI
  change, no review assess command, no candidate extraction, no Memory Core
  mutation, no dashboard/API/MCP/server/plugin/source crawler.
- Verification:
      fixtures produce stable deltas.

MM-54 — diff risk and review burden scoring v1
- Implement conservative heuristics.
- Intended files: `packages/core/src/evidenceBundle.ts`,
  `packages/core/src/evidenceBundle.test.ts`, root `PLAN.md`, `GOAL.md`,
  handoff files, and this PLAN.
- Non-goals: no schema change, no DB migration, no repository change, no CLI
  integration, no review assess command, no rollback enforcement, no candidate
  extraction, no Memory Core mutation, no dashboard/API/MCP/server/plugin/
  source crawler.
- Verification:
      risky broad diff scores higher than narrow tested diff.

MM-55 — rollback path enforcement
- Require rollback path for non-doc/runtime/DB changes.
- Intended files: `packages/core/src/evidenceBundle.ts`,
  `packages/core/src/evidenceBundle.test.ts`, root `PLAN.md`, `GOAL.md`,
  handoff files, and this PLAN.
- Non-goals: no schema change, no DB migration, no repository change, no CLI
  integration, no review assess command, no candidate extraction, no Memory
  Core mutation, no dashboard/API/MCP/server/plugin/source crawler.
- Verification:
      missing rollback path triggers audit finding.

MM-56 — candidate proposal summary from feedback
- Summarize already structured MemoryCandidate, SourceClaimCandidate,
  AntiMemoryCandidate, EvalCandidate, and ObservationCandidate proposals from
  FeedbackDelta.
- This is not LLM extraction, not freeform text mining, not promotion, and not
  final truth.
- Intended files: `packages/core/src/feedbackDelta.ts`,
  `packages/core/src/reviewFeedback.test.ts`, root `PLAN.md`, `GOAL.md`,
  handoff files, and this PLAN.
- Non-goals: no LLM extraction, no freeform text mining, no schema change, no
  DB migration, no repository change, no CLI integration, no review assess
  command, no MemoryRecord creation, no SourceDecision truth write, no
  candidate promotion, no dashboard/API/MCP/server/plugin/source crawler.
- Verification:
      feedback summarizes candidate proposals, not final memory.

MM-56A — code vocabulary and TypeScript elegance standard
- Establish naming/vocabulary rules for core helpers and proposal/gate/review
  concepts, explicitly avoiding over-powerful names like "extract" when a
  function only summarizes structured data.
- Ground the standard in existing KRN package boundaries and a Matt
  Pocock-style TypeScript discipline: precise names, explicit public types,
  unknown-first boundaries, small pure helpers, no magic runtime authority.
- Verification:
      docs/rules prevent candidate-summary helpers from being named as mutating
      or AI extraction surfaces.

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
