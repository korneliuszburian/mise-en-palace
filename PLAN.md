# KRN Production Roadmap And Single Source Of Truth PLAN

Status: active root `PLAN.md` for production roadmap execution, adopted from current repository evidence after commit `31abe389c2155d4e2dee034fc35948761adb4738`.

Owner: KRN project operators.

Purpose: become the single source of truth for further KRN execution. This document intentionally consolidates the compact current `PLAN.md`, `GOAL.md`, active architecture documents, ADRs, dogfood reports, and current package/source evidence into one forward execution plan. It does not resurrect historical task bodies as active work.

## 0. How To Use This Plan

This document is the active execution map. Historical plans, raw materials, audit reports, dogfood reports, ADRs, and run ledgers remain evidence, not the active queue. A future executor should start here, read only the current phase and the first active task, then inspect source files named by that task.

The plan follows these rules.

1. Repo evidence beats documents. If source code, tests, commands, or current DB runtime contradict a claim, mark the claim as `Requires verification` and do not build on it.
2. Every task is evidence-driven. It must state inputs, outputs, verification, and what its proof does not prove.
3. Do not build broad subsystems from one dogfood report. Convert repeated evidence into bounded repair slices.
4. `PLAN.md` is the single execution plan. Do not add a parallel root `PLANS.md`, new roadmap file, or historical task dump.
5. `GOAL.md` stays compact and points to this plan. It must not become a progress ledger.
6. Every implementation slice must be focused, committed, pushed, and leave the worktree clean.
7. DB runtime truth may be claimed only after DB commands run in the current shell.
8. No `krn audit`, anti-slop layer, broad eval platform, dashboard, worker runtime, source crawler, API, MCP server, plugin package, or agent zoo may be built unless a specific task below authorizes it.

## 1. Evidence Base Used To Reconstruct Current State

This plan is based on the current public repository and the following project evidence.

### 1.1 Canonical current documents

- `README.md`
- `GOAL.md`
- current compact root `PLAN.md`
- `docs/KRN_KERNEL.md`
- `docs/STATE_OF_THE_ART.md`
- `docs/architecture/cli-surfaces.md`
- `docs/architecture/package-surfaces.md`

### 1.2 Current dogfood and validation reports

- `docs/reviews/brain-usefulness/REPORT.md`
- `docs/reviews/brain-usefulness/DOGFOOD_REPORTING.md`
- `docs/reviews/controlled-dogfood/2026-06-25-evidence-dirty-context/REPORT.md`
- `docs/reviews/controlled-dogfood/2026-06-25-evidence-dirty-context-golden/REPORT.md`
- `docs/reviews/controlled-dogfood/2026-06-25-candidate-reviewability-output/REPORT.md`
- `docs/reviews/controlled-dogfood/2026-06-25-db-replay-evidence-metadata/REPORT.md`
- `docs/reviews/controlled-dogfood/2026-06-25-reflection-candidate-reviewability/REPORT.md`

### 1.3 Current architectural decisions

- `docs/decisions/ADR-0001-codex-operating-layer.md`
- `docs/decisions/ADR-0002-memory-is-store-not-files.md`
- `docs/decisions/ADR-0003-skills-are-engineering-disciplines.md`
- `docs/decisions/ADR-0004-thin-final-spine-not-artifact-factory.md`
- `docs/decisions/ADR-0005-read-propose-write-boundary.md`
- `docs/decisions/ADR-0006-review-burden-and-diff-risk.md`
- `docs/decisions/ADR-0007-raw-material-quarantine.md`
- `docs/decisions/ADR-0008-codex-native-surfaces-first.md`
- `docs/decisions/ADR-0009-canonical-harness-spine.md`
- `docs/decisions/ADR-0010-brain-store-postgres-pgvector.md`
- `docs/decisions/ADR-0011-observational-memory-as-staging-layer.md`
- `docs/decisions/ADR-0013-observation-is-staging-not-memory.md`
- `docs/decisions/ADR-0014-activation-is-admission-control.md`
- `docs/decisions/ADR-0015-worker-runtime-boundary.md`
- `docs/decisions/ADR-0016-eval-candidates-remain-proposal-only.md`
- `docs/decisions/ADR-0019-evidence-command-proof-states.md`
- `docs/decisions/ADR-0020-branded-domain-ids.md`

### 1.4 Official Codex planning references

The execution discipline in this plan uses the following OpenAI Codex references as process guidance, not as product proof:

- `https://developers.openai.com/cookbook/articles/codex_exec_plans`
- `https://developers.openai.com/cookbook/examples/codex/using_goals_in_codex`
- `https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide`

The adopted process interpretation is: purpose first, assumptions explicit, evidence-based completion, no vague goals, no plan-only completion for source changes, and plan context embedded in the checked-in plan when it is needed for execution.

### 1.5 Current source evidence summary

The repository currently contains a strict pnpm TypeScript workspace with `core`, `schema`, `db`, `harness`, `cli`, `codex-adapter`, and `workers` packages. The root scripts include `typecheck`, `test`, Promptfoo smoke, DB readiness, DB check, DB smoke, and specific DB smoke targets. The root TypeScript baseline keeps strict flags including `strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noImplicitReturns`, `isolatedModules`, `verbatimModuleSyntax`, and `skipLibCheck: false`.

`@krn/db` root exports only `createKrnDatabase` and `KrnDatabase`. `@krn/cli` root exports only `runCli`, `CliResult`, and `CliRuntime`. `@krn/harness` root exports activation, observations, compiler, golden runner, memory, and reflection surfaces. `@krn/core` exports the domain model including candidate reviewability, activation, context assembly, evidence, feedback, golden tasks, memory, observations, reflection, source, and task contracts.

## 2. Current Product Thesis

KRN is a Codex Operating Layer / AI Engineering Control Plane.

Codex executes. KRN supplies bounded context, store-backed memory, source grounding, policy, skills, eval expectations, traces, review gates, and feedback.

KRN is not a prompt pack, dashboard-first application, benchmark lab, alternative executor, IDE agent, generic multi-agent framework, stack-specific agent zoo, markdown memory folder, anti-slop subsystem, or archive of intentions.

The central law remains:

    Do not build more context.
    Build the machinery that selects, applies, verifies, and forgets context.

The canonical harness spine is:

    OperatorIntent
      -> TaskContract
      -> HarnessPlan
      -> ContextAssembly
      -> ExecutionContract / CodexAdapterPlan
      -> ExecutionRun
      -> EvidenceBundle
      -> ReviewAssessment
      -> FeedbackDelta
      -> MemoryCandidate / SourceDecision / EvalCandidate
      -> reviewed promotion, rejection, or deferral

## 3. Current State Assessment

The percentages below are planning estimates based on current repository evidence. They are not product metrics. They describe how close each area appears to be to a production-quality KRN platform.

| Area | Current state | Completion estimate | Evidence | Missing / Unknown / Requires verification |
| --- | --- | ---: | --- | --- |
| Repo truth / planning hygiene | Current root plan is compact, historical ledgers archived, no active unchecked slice after RCR-00. | 85% | `PLAN.md`, `GOAL.md`, historical archive. | Requires ongoing discipline; not a product feature. |
| Brain for KRN-on-KRN coding | Dogfood-ready. DB-backed plan/evidence/observe/reflect and multiple source repairs exist. | 45% toward product, 70% toward dogfood use | Brain usefulness report, DBR-00, RCR-00. | Product usefulness on target repos unknown. Temporal truth graph incomplete. |
| Adam/Bobbin-style temporal domain brain | Conceptually recognized but not implemented at scale. | 15-25% | ADR-0011, source-to-decision doctrine, anti-memory, activation. | Temporal claim graph, authority model, large corpus ingestion, conflict/supersession missing. |
| Harness runtime | DB-backed plan/evidence/observe/reflect vertical works locally. | 45% | DBR-00 report, harness package, CLI commands. | No production orchestrator, no CI-backed runtime proof, target-repo vertical incomplete. |
| Orchestrator | CLI and goals provide manual orchestration. | 20% | `krn plan`, evidence, observe, reflect, command discipline. | No orchestrator service, no scheduler, no automated state machine. |
| Agents | Codex is executor. Subagents remain conceptual/read-heavy only. | 10% | KRN doctrine, State of the Art. | No product subagent runtime, no agent registry, no multi-agent product workflows. |
| Memory | Store-backed memory candidates, records, review gate, application feedback, anti-memory exist. | 45% | MemoryReviewGate, anti-memory, DB schema, dogfood memory reports. | Temporal truth, demotion, decay, repeated application metrics, product target-repo use missing. |
| Knowledge / source graph | SourceClaim, SourceDecisionEdge, does-not-prove, falsifier discipline exist. | 45% | MM-38, source graph schema/repository, ADRs. | Research-to-brain ingestion lane and trust/authority calculus incomplete. |
| Tooling / CLI | Public operator, governed admin, internal/dev surfaces classified; many commands exist. | 55% | CLI surface doc, tests, package scripts. | Operator UX polish, target-repo init/connect, readback commands incomplete. |
| Execution layer / Codex adapter | Codex brief/adapter surfaces exist; Codex remains external executor. | 25% | `packages/codex-adapter`, README, CLI `codex brief`. | No automated Codex invocation, no `codex exec`/GitHub Action integration. |
| Observability | Evidence, run IDs, review, feedback, DB readback, dogfood reports exist. | 40% | Evidence reports, DBR-00, run ledgers. | No polished readback CLI, no metrics, no dashboard/read models. |
| Evaluation | GoldenTask, Promptfoo adapter, dirty-context golden proof exist. | 35% | GoldenTask fixture, Promptfoo smoke, GBC-00. | No broad dogfood-derived eval suite, no macro-eval population, no eval promotion lifecycle. |
| Safety / trust | Review gates, source grounding, anti-memory, no audit theater, read/propose/write ADR exist. | 40% | ADR-0005, ADR-0014, review gates. | Threat model, prompt-injection tests, secret handling, target-repo safety gates need hardening. |
| UX | CLI and docs exist. | 25% | README, CLI commands. | No dashboard/API/MCP/plugin; internal-alpha UX not proven. |
| Integrations | Codex adapter exists; Promptfoo adapter bounded. | 15% | codex-adapter, Promptfoo smoke. | MCP, GitHub Action, plugin packaging, external repo integration missing. |
| Infrastructure | Postgres/pgvector/Drizzle local proof exists; scripts default to compose DB. | 45% | ADR-0010, DBR-00, package scripts. | CI, deployment, backups, hosted DB, migrations policy, multi-env not complete. |
| Deployment | Not built. | 5% | README Not Built. | Packaging, versioning, release, hosting, secrets, monitoring missing. |

## 4. Architectural Pattern Verification

| Module / concern | Adopted pattern | Source in project | Why used | Alternatives rejected / deferred | Verification state |
| --- | --- | --- | --- | --- | --- |
| Overall KRN | Codex operating layer / control plane | `docs/KRN_KERNEL.md`, `README.md`, ADR-0001 | Codex executes; KRN governs context, memory, evidence, review, feedback. | Alternative executor, agent zoo, dashboard-first app rejected. | Implemented as workspace/harness, not product-complete. |
| Planning | Living `PLAN.md` + compact `GOAL.md` | current `PLAN.md`, `GOAL.md`, OpenAI ExecPlan/Goals guidance | Keeps single execution truth and evidence-based completion. | Parallel `PLANS.md`, giant goal brain, historical plan reopen rejected. | This document is the active root execution map. |
| Brain store | PostgreSQL + pgvector, Drizzle, Zod | ADR-0010 | One typed state plane for harness, memory, source, retrieval, events, outbox, workers. | Qdrant, Neo4j, LanceDB, Elastic, Redis, Kafka rejected for first spine. | Local DB replay proven; production infra missing. |
| Memory | Store-backed governed memory | ADR-0002, ADR-0011, memory code | Queryable, invalidatable, reviewable, source-linked memory. | Markdown runtime memory, `.krn` truth, automatic promotion rejected. | Candidate/review paths exist; temporal graph incomplete. |
| Observation | Staging layer, not Memory Core | ADR-0011, ADR-0013 | Observations capture event-derived facts without final truth mutation. | Observation as approved memory, chain-of-thought storage rejected. | Manual observe and DB persistence exist; extraction quality needs proof. |
| Reflection | Offline/explicit candidate synthesis | ADR-0011, RCR-00 | Produces candidates/metadata without final truth mutation. | Autonomous dreaming, reflection auto-promotion rejected. | Metadata reviewability exists; useful extraction incomplete. |
| Activation | Admission control | ADR-0014 | Similarity is not permission; activation records inclusions and exclusions. | Prompt assembly as trust boundary, context dump, ranking as permission rejected. | DB-backed activation works; owner-file recall is repaired for the DB readiness case; broader coverage remains unproven. |
| Source graph | Source-to-decision graph | `docs/KRN_KERNEL.md`, State of the Art, MM-38 | Prevents source hoarding through mechanism, does-not-prove, falsifier. | Bibliography/source-hoarding rejected. | Source claims and edges exist; research ingestion lane missing. |
| Review / evidence | Review burden and diff risk as product metrics | ADR-0006, evidence reports | Measures whether Codex work becomes easier to trust. | Green tests as product proof rejected. | Evidence and review artifacts exist; metrics not yet aggregated. |
| CLI | Adapter and operator surface classification | `docs/architecture/cli-surfaces.md` | Separates public operator, governed admin, internal/dev. | `krn audit`, quality engine, hidden dev namespace rejected. | CLI exists and narrowed; UX/product flow incomplete. |
| Package boundaries | Ports/adapters and narrow public surfaces | `docs/architecture/package-surfaces.md` | Prevents internal mechanisms from becoming product APIs. | Broad root barrels for DB/CLI/harness internals rejected. | DB/CLI/harness narrowed; remaining barrels classified. |
| Workers | Contract-only, no runtime daemon | ADR-0015 | Job authority can be designed before execution exists. | Daemon, cron, background maintenance, direct Memory Core worker rejected. | Worker contracts exist; runtime deferred. |
| Eval | GoldenTask canonical, Promptfoo bounded adapter | ADR-0016, GBC-00 | Protects real KRN behavior without giving Promptfoo product authority. | Broad eval platform / Promptfoo as truth rejected. | Golden behavior proof exists; macro-evals missing. |
| Research-to-brain | Source -> mechanism -> implication -> decision/rejection -> falsifier | `docs/KRN_KERNEL.md`, State of the Art | Turns research into decisions rather than source hoarding. | Research Foundry product layer now rejected/deferred. | Doctrine exists; ingestion workflow incomplete. |
| Dashboard/API/MCP | Later read-model/integration layers | README Not Built, State of the Art | Must sit over typed state after behavior proof. | Dashboard-first app, MCP as memory, API before objects rejected. | Not built. |

Research-note: the project references external memory/agent ideas in raw materials and ADR-0011, including Mastra Observational Memory and the Adam/Bobbin/Astropolis analysis. This plan treats those as mechanism inputs only. Claims about papers, doctoral work, or benchmark superiority are `Requires verification` unless already represented in a source-to-decision record in the repo.

## 5. Current Inconsistencies And Unknowns

1. The current repository is dogfood-ready, but not product-ready. README explicitly says the full governed product path is not complete end-to-end.
2. Activation works as DB-backed guardrail selection, and A-02 added bounded owner-file/raw-recall surfacing for the DB readiness case. Broader owner-file coverage remains unproven and should expand only from future misses.
3. Reflection persistence exists, and reflection candidate reviewability metadata now exists, but useful extraction remains unproven at scale.
4. Candidate reviewability is implemented, but candidate quality at scale and promotion usefulness remain unproven.
5. DB runtime works in the current-shell dogfood, but CI, remote, deployment, and production DB posture remain unknown.
6. Worker contracts exist, but no runtime executor exists. This is intentional and should not be described as background maintenance.
7. Promptfoo is a bounded runner/result adapter. It is not Memory Brain proof.
8. Research-to-brain is a doctrine and source-to-decision discipline, not yet a complete ingestion product.
9. Dashboard, API, MCP server, plugin package, source crawler, broad benchmark lane, and production deployment are not built.

## 6. Production Roadmap Overview

This roadmap moves from current DB-backed dogfood hardening to production KRN in dependency order.

- Phase A: Stabilize DB-backed dogfood and activation owner-file recall.
- Phase B: Mature the Brain into temporal source/memory knowledge rather than better RAG.
- Phase C: Complete the governed harness loop for a target repo.
- Phase D: Make research-to-brain and eval-to-brain pipelines first-class but bounded.
- Phase E: Add observability/readback UX before dashboards.
- Phase F: Add integrations and worker execution only after proof-driven gates.
- Phase G: Production packaging, CI, deployment, safety, and v0.1 release.

## 7. Task Contract Legend

Each task below includes the required fields. Priority uses P0/P1/P2/P3. Complexity uses S/M/L/XL. Estimates are relative execution complexity, not time promises.

## Phase A — DB-Backed Dogfood Stabilization

### A-00 — Adopt This PLAN.md As Single Source Of Truth

- ID: `A-00`
- Name: Adopt production roadmap PLAN.md.
- Objective: Replace the compact living queue with this complete SSOT plan while preserving compact current-state semantics and evidence pointers.
- Business rationale: Codex operators need one plan that shows what remains to reach production without re-analyzing the whole repo.
- Architectural rationale: Keeps root `PLAN.md` authoritative while avoiding parallel roadmap files.
- Dependencies: Current `PLAN.md`, `GOAL.md`, dogfood reports, ADRs.
- Input requirements: Current remote clean; no active unchecked slice.
- Output requirements: Root `PLAN.md` contains current state, roadmap, task contracts, acceptance gates, and evidence references.
- Definition of Done: `PLAN.md` is replaced; `GOAL.md` points to it compactly; historical evidence remains archived.
- Verification: `git diff --check`; `rg -n "first_unchecked_slice|current_priority|A-00" PLAN.md GOAL.md`.
- Acceptance criteria: Future Codex agents can start from this plan without reading archived ledgers by default.
- Priority: P0.
- Complexity: M.
- Risks: Reintroducing plan-sprawl. Mitigation: keep completed historical task bodies out of this file.

### A-01 — DB-Backed Owner-File Recall Dogfood

- ID: `A-01`
- Name: Prove or disprove activation owner-file recall.
- Status: complete on 2026-06-25.
- Objective: Run one DB-backed KRN-on-KRN source repair where the expected owner file is known by repo structure, and measure whether activation selects it or only guardrails.
- Business rationale: KRN must reduce operator rereads and source inspection cost, not only supply high-level guardrails.
- Architectural rationale: Activation is admission control, but production use requires owner-file/raw-recall targeting.
- Dependencies: DBR-00, RCR-00, `DOGFOOD_REPORTING.md`.
- Input requirements: Local DB ready; task with clear owner files; KRN plan `--persist`.
- Output requirements: Dogfood report classifying selected/used/helped/missing owner files.
- Definition of Done: Report states whether activation selected owner files, guardrails, both, or neither.
- Verification: `pnpm db:ready`; `krn plan --persist`; `krn evidence capture --persist`; `krn observe --persist`; `krn reflect --persist`; `pnpm typecheck`; `pnpm test`; `git diff --check`.
- Acceptance criteria: If owner-file recall misses obvious files, task opens A-02. If it succeeds, record candidate to defer activation repair.
- Outcome: DB-backed run `1d22a22a-e48f-4327-a8e8-657146394fc8` improved DB readiness endpoint reporting and proved activation selected governance guardrails but missed the owner files `packages/cli/src/runDbReadinessCommand.ts`, `packages/cli/src/runDbReadinessCommand.test.ts`, and existing CLI readiness coverage in `packages/cli/src/runCli.test.ts`.
- Evidence: `docs/reviews/controlled-dogfood/2026-06-25-owner-file-recall-db-readiness/REPORT.md`; evidence bundle `f3e42ea7-24a6-4e60-8111-9c9d48cdd855`; observation group `f528e758-eb08-4884-b773-d73563a71c2b`; reflection record `e1181fd6-9df7-43f6-ad4d-c59f54cdddb7`.
- Priority: P0.
- Complexity: M.
- Risks: Picking a task whose owner file is too obvious from prompt. Mitigation: define expected owner after source inspection, not in the initial task text.

### A-02 — Activation Owner-File / Raw-Recall Read Model Repair

- ID: `A-02`
- Name: Repair activation owner-file recall if A-01 proves repeated miss.
- Status: complete on 2026-06-25.
- Objective: Add the smallest typed read model or retrieval cue that helps activation surface owner files/raw recall targets for source repairs.
- Business rationale: Reduces manual code search and review burden.
- Architectural rationale: Fix likely read-model/raw recall issue before scoring rewrite.
- Dependencies: A-01 must prove a real repeated miss.
- Input requirements: Evidence from at least two DB-backed dogfood runs showing owner-file misses.
- Output requirements: Typed activation trace/read model or retrieval metadata that surfaces owner files with reasons.
- Definition of Done: Activation output includes owner-file/raw-recall candidates with inclusion/exclusion reasons for a dogfood source repair.
- Verification: Targeted activation tests; `pnpm typecheck`; `pnpm test`; DB-backed dogfood report.
- Acceptance criteria: Future DB-backed plan includes owner files or explains exclusion through typed reasons.
- Outcome: Added typed owner-file recall candidates through the existing activation/search path without changing scoring. DB-backed run `5611bfde-7d5f-4f35-8332-1e407889dc85` included owner files for the DB readiness source repair.
- Evidence: `docs/reviews/controlled-dogfood/2026-06-25-activation-owner-file-recall-repair/REPORT.md`; evidence bundle `c3afc052-fbec-44cc-a81d-9217491aeb54`; observation group `5cb31110-6f47-4d43-9944-7ace067ec60f`; reflection record `cd08f447-5266-40d1-a759-294476feae69`.
- Priority: P0 if A-01 fails; P1 otherwise.
- Complexity: L.
- Risks: Accidental scoring rewrite. Mitigation: limit to read model/raw recall and explicitly preserve scoring unless evidence requires it.

## Phase B — Brain Maturation: Temporal Knowledge, Research, Memory

### B-00 — Temporal Claim Graph ADR

- ID: `B-00`
- Name: Design temporal claim graph for living knowledge.
- Status: complete on 2026-06-25.
- Objective: Define how KRN models claims that change over time: supports, contradicts, supersedes, narrows, invalidates, and expires.
- Business rationale: Required to approach Adam/Bobbin-style dynamic knowledge where latest text is not automatically truth.
- Architectural rationale: Moves KRN beyond RAG into temporal, source-grounded knowledge.
- Dependencies: SourceClaim, MemoryCandidate, AntiMemory, ADR-0010, ADR-0011.
- Input requirements: Current source schema; existing source-to-decision dogfoods; raw materials only as evidence quarry.
- Output requirements: ADR and minimal schema/read-model proposal with alternatives and falsifiers.
- Definition of Done: ADR states model, rejected alternatives, no-build boundaries, and first implementation slice.
- Verification: `git diff --check`; architecture review; no package source change unless separately authorized.
- Acceptance criteria: It is clear what is built in B-01 and what remains lab-only.
- Outcome: Accepted ADR-0021 defines temporal claim graph semantics as Postgres-backed source-claim relations, rejects graph DB/crawler/latest-wins/metadata-only semantics, and names B-01 as the first implementation slice.
- Evidence: `docs/decisions/ADR-0021-temporal-claim-graph.md`.
- Priority: P0.
- Complexity: L.
- Risks: Overdesigning graph DB. Mitigation: ADR-0010 keeps first graph in Postgres relational edge tables.

### B-01 — Temporal Claim Edge Schema And Repository

- ID: `B-01`
- Name: Implement temporal claim edges.
- Status: complete on 2026-06-25.
- Objective: Add minimal Postgres-backed relation support for claim support/contradiction/supersession/invalidation where not already modeled.
- Business rationale: Enables reliable knowledge updates and anti-memory decisions.
- Architectural rationale: Extends SourceGraph and Memory governance without separate graph DB.
- Dependencies: B-00 accepted.
- Input requirements: Drizzle migration plan; repository ports; test fixtures.
- Output requirements: Schema, repository methods, tests, and one dogfood source decision using temporal edge.
- Definition of Done: A claim can be marked as superseding or contradicting another claim with evidence and does-not-prove boundary.
- Verification: `pnpm db:generate`; `pnpm --filter @krn/db db:check`; `pnpm test`; `pnpm typecheck`; DB smoke if applicable.
- Acceptance criteria: Activation/Memory tasks can see the edge as candidate metadata or exclusion reason in a later slice.
- Outcome: Added temporal `source_claim_edge_kind` values `narrows`, `invalidates`, and `expires`, domain/repository support for `SourceClaimEdge`, and source graph smoke coverage that creates an `invalidates` edge plus source decision evidence.
- Evidence: `docs/reviews/controlled-dogfood/2026-06-25-temporal-claim-edge-schema/REPORT.md`; migration `packages/db/src/migrations/0013_yummy_the_twelve.sql`; current-shell `pnpm db:smoke:source-graph` passed with cleanup remaining marker count `0`.
- Priority: P1.
- Complexity: L.
- Risks: Creating unused schema theater. Mitigation: require one dogfood run that uses the edge.

### B-02 — Research-To-Brain Minimal Ingestion Lane

- ID: `B-02`
- Name: Convert one external source into SourceClaim and candidates.
- Status: complete on 2026-06-25.
- Objective: Create a bounded workflow for research/source ingestion: source -> mechanism -> KRN implication -> decision/rejection/hypothesis -> falsifier -> SourceClaim / MemoryCandidate / EvalCandidate.
- Business rationale: Lets KRN condense best engineering patterns into reusable brain state.
- Architectural rationale: Turns research into governed knowledge, not source hoarding.
- Dependencies: Source graph, candidate reviewability, evidence provenance.
- Input requirements: One selected source; no broad research batch; explicit trust tier.
- Output requirements: SourceClaim, decision/rejection, candidate outputs, dogfood report.
- Definition of Done: One source is ingested and later activated or explicitly rejected.
- Verification: CLI/source tests if code changes; DB-backed source claim if persisted; report with does-not-prove.
- Acceptance criteria: No decorative source remains without consumer and falsifier.
- Outcome: Ingested one official OpenAI Codex `AGENTS.md` guidance source as SourceClaim `8c7f97ce-8868-4fc2-bda8-4600d2f050f7`, linked it to `PLAN.md#operating-rules`, and proved later DB-backed activation selected it for a matching guidance task.
- Evidence: `docs/reviews/controlled-dogfood/2026-06-25-research-to-brain-agents-guidance/REPORT.md`; activation run `164e9158-d03b-4957-a3cd-72bee3ce3dd1`.
- Priority: P0.
- Complexity: M.
- Risks: Research Foundry creep. Mitigation: one source only.

### B-03 — Memory Application Feedback And Demotion Loop

- ID: `B-03`
- Name: Close memory feedback loop.
- Objective: Record helped/neutral/hurt/stale outcomes and use them for memory strengthening, demotion candidates, or anti-memory candidates.
- Business rationale: Memory must improve future work, not just exist.
- Architectural rationale: Adds feedback semantics before scaling memory retrieval.
- Dependencies: MemoryApplication records, candidate reviewability, dogfood reporting.
- Input requirements: At least two memory application dogfoods.
- Output requirements: CLI/report output for memory feedback; candidate generation for demotion/invalidation when appropriate.
- Definition of Done: A memory used in a run produces feedback and, if negative/stale, a reviewable follow-up candidate.
- Verification: Harness/core tests; DB-backed dogfood; `pnpm test`; `pnpm typecheck`.
- Acceptance criteria: Memory usefulness can be measured across runs.
- Priority: P1.
- Complexity: L.
- Risks: Automatic demotion without review. Mitigation: produce candidates only.

### B-04 — Anti-Memory Conflict Integration

- ID: `B-04`
- Name: Make anti-memory visible in activation decisions.
- Objective: Ensure anti-memory blocks or warns against stale/unsafe/contradicted context and is visible in inclusions/exclusions.
- Business rationale: Prevents repeated resurrection of bad knowledge.
- Architectural rationale: Anti-memory is first-class and must influence admission control.
- Dependencies: AntiMemory candidates, activation trace, temporal claim edges.
- Input requirements: One real anti-memory candidate from dogfood or report.
- Output requirements: Test and DB-backed dogfood showing anti-memory block/exclusion or warning.
- Definition of Done: Activation output states anti-memory hit and reason.
- Verification: Activation tests; DB-backed run; `pnpm test`; `pnpm typecheck`.
- Acceptance criteria: Unsafe/stale candidate does not silently enter Codex context.
- Priority: P1.
- Complexity: M.
- Risks: Overblocking useful context. Mitigation: raw recall and reviewable reasons.

## Phase C — Harness Product Vertical

### C-00 — Target Repo Harness Trial

- ID: `C-00`
- Name: Controlled target-repo internal alpha trial.
- Objective: Use KRN on a real target repository outside KRN, or a real target module with separate project identity, to measure before/after review burden.
- Business rationale: Proves KRN value beyond self-referential dogfood.
- Architectural rationale: Tests project registry, source/memory isolation, and operator workflow.
- Dependencies: A-01/A-02 outcome, B-02 if research/source patterns are involved.
- Input requirements: Target repo selected; commands known; non-goals defined; DB ready.
- Output requirements: Trial report with Dogfood Brain Usefulness Section and product readiness signal.
- Definition of Done: One target repo task is planned, executed, verified, and reviewed through KRN.
- Verification: Target repo typecheck/test; KRN evidence capture; KRN report; `git diff --check` in relevant repo.
- Acceptance criteria: Report states whether KRN is internal-alpha-ready or what blocks it.
- Priority: P0 after A-phase.
- Complexity: L.
- Risks: Fixture theater or target too small. Mitigation: choose real maintenance task with measurable review burden.

### C-01 — Target Repo Registry And Init/Connect Hardening

- ID: `C-01`
- Name: Harden `krn init --dry-run` and `krn init --connect` for target repos.
- Objective: Make repo connection produce project/kernel records, command detection, source seed, and safe output without runtime markdown memory.
- Business rationale: `krn init` is the product entry point promised by State of the Art.
- Architectural rationale: Connects harness to real repositories while preserving project scope.
- Dependencies: C-00 findings.
- Input requirements: Existing init/connect code, target trial report.
- Output requirements: CLI behavior, tests, DB smoke, docs.
- Definition of Done: A target repo can be connected in dry-run and persisted mode with honest output.
- Verification: CLI tests; `db:smoke:init-connect`; DB-backed dogfood.
- Acceptance criteria: No runtime memory files are created; project isolation is explicit.
- Priority: P0.
- Complexity: L.
- Risks: Product UX creep. Mitigation: dry-run first and no dashboard/API.

### C-02 — End-To-End Governed Product Path

- ID: `C-02`
- Name: Prove governed path from evidence to memory activation.
- Objective: Complete one governed path: evidence -> observation -> reflection -> candidates -> review -> memory/source update -> activation in a later task -> golden proof.
- Business rationale: This is the current README gap and the core product value path.
- Architectural rationale: Integrates all brain/harness layers without shortcuts.
- Dependencies: B-03, C-00, C-01.
- Input requirements: DB ready, selected dogfood task, reviewable candidate.
- Output requirements: Run ledger, promoted memory/source if justified, later activation proof, golden/regression proof.
- Definition of Done: A promoted record from one run materially helps a later run and is recorded as helped.
- Verification: DB-backed commands, tests, dogfood report, golden behavior case.
- Acceptance criteria: No direct mutation bypasses review gates.
- Priority: P0.
- Complexity: XL.
- Risks: Forcing promotion prematurely. Mitigation: allow rejection/deferral if candidate is not ready.

### C-03 — Codex Brief And Execution Contract Hardening

- ID: `C-03`
- Name: Improve Codex-facing execution brief.
- Objective: Ensure Codex brief renders objective, constraints, selected context, non-goals, expected evidence, review burden, and rollback in a concise format.
- Business rationale: KRN must guide Codex execution without giant prompts.
- Architectural rationale: Codex adapter renders after activation; it must not make independent trust decisions.
- Dependencies: A-01, C-00.
- Input requirements: Existing codex-adapter and `krn codex brief` command.
- Output requirements: Renderer/test updates and one dogfood brief report.
- Definition of Done: A Codex brief can drive a bounded source repair without rereading broad docs.
- Verification: codex-adapter tests; CLI brief tests; dogfood report.
- Acceptance criteria: Brief does not include unreviewed/stale context without reason.
- Priority: P1.
- Complexity: M.
- Risks: Prompt bloat. Mitigation: strict budget and first-screen summary.

## Phase D — Evaluation And Observability

### D-00 — Dogfood-Derived GoldenTask Promotion Lane

- ID: `D-00`
- Name: Promote repeated dogfood failures to GoldenTasks.
- Objective: Define when a dogfood finding becomes a GoldenTask fixture and behavior proof.
- Business rationale: Converts real failures into regression protection.
- Architectural rationale: Keeps evals tied to real KRN behavior, not fixture theater.
- Dependencies: GBC-00, candidate reviewability, dogfood reports.
- Input requirements: At least two repeated findings or one critical invariant.
- Output requirements: Policy doc and first non-evidence GoldenTask case.
- Definition of Done: A dogfood-derived behavior case fails if invariant regresses.
- Verification: Schema fixture test, behavior proof test, `pnpm test`.
- Acceptance criteria: Promptfoo remains adapter, not truth.
- Priority: P1.
- Complexity: M.
- Risks: Broad eval platform creep. Mitigation: one case per real failure.

### D-01 — Promptfoo Adapter Boundary Hardening

- ID: `D-01`
- Name: Keep Promptfoo bounded to runner/result adapter.
- Objective: Ensure Promptfoo output maps to KRN GoldenTask or eval candidate records without becoming product truth.
- Business rationale: External eval runner useful only if connected to actionable repair.
- Architectural rationale: Eval runner is adapter; GoldenTask is domain contract.
- Dependencies: D-00.
- Input requirements: Existing Promptfoo smoke and fixtures.
- Output requirements: Adapter tests and docs if needed.
- Definition of Done: Promptfoo smoke cannot be mistaken for memory behavior proof.
- Verification: `pnpm exec promptfoo --version`; `pnpm eval:promptfoo:smoke`; adapter tests.
- Acceptance criteria: Report states what Promptfoo proves and does not prove.
- Priority: P2.
- Complexity: M.
- Risks: Eval theater. Mitigation: no new Promptfoo suite without KRN behavior consumer.

### D-02 — Operator Readback UX For Runs And Evidence

- ID: `D-02`
- Name: Add run/evidence readback CLI UX.
- Objective: Let operators read persisted plan/evidence/observation/reflection metadata without ad hoc SQL.
- Business rationale: Reduces review burden and makes DB-backed proof usable.
- Architectural rationale: Builds read UX over typed state before dashboard/API.
- Dependencies: DBR-00, C-02.
- Input requirements: Persisted run records and repository read methods.
- Output requirements: CLI read/report command or enhancement to existing commands.
- Definition of Done: Operator can retrieve a run summary with evidence classification and candidate reviewability.
- Verification: CLI tests, DB-backed smoke, dogfood report.
- Acceptance criteria: Output distinguishes proof from non-proof and does not mutate state.
- Priority: P1.
- Complexity: L.
- Risks: Dashboard-by-terminal sprawl. Mitigation: only run/evidence summary first.

### D-03 — Observability Read Models

- ID: `D-03`
- Name: Define typed read models for review burden, context ROI, memory usefulness.
- Objective: Create read-model definitions for dashboard/API later without building dashboard now.
- Business rationale: Product readiness requires actionable metrics.
- Architectural rationale: Read models should derive from typed DB state and reports.
- Dependencies: D-02, C-02.
- Input requirements: Run/evidence/memory/application records.
- Output requirements: ADR or schema/read model proposal.
- Definition of Done: Read models have owner, data source, action, and falsifier.
- Verification: Docs review; no source unless accepted.
- Acceptance criteria: Dashboard remains deferred until read models are useful.
- Priority: P2.
- Complexity: M.
- Risks: Vanity metrics. Mitigation: every metric must have action.

## Phase E — Safety, Trust, And Runtime Authority

### E-00 — Security And Trust Boundary Review

- ID: `E-00`
- Name: Threat model KRN memory/source/tool boundaries.
- Objective: Identify prompt injection, untrusted text, file IO, command execution, env/secrets, DB trust, and model-output-as-truth risks.
- Business rationale: KRN stores durable control signals; poisoning can affect future runs.
- Architectural rationale: Trust boundaries must be explicit before target repo alpha expands.
- Dependencies: C-00 or first target repo trial.
- Input requirements: CLI/file IO, schema parsers, source ingestion, memory promotion, adapter surfaces.
- Output requirements: Threat model doc and bounded repair queue.
- Definition of Done: Critical trust boundaries have tests or repair tasks.
- Verification: Security review checklist; targeted tests if changes.
- Acceptance criteria: No untrusted text can become final memory/source truth without review.
- Priority: P0 before public alpha.
- Complexity: L.
- Risks: Generic security theater. Mitigation: restrict to current entry points and dogfood evidence.

### E-01 — Policy Gates And Hook Boundary Design

- ID: `E-01`
- Name: Define deterministic policy gates and future hook mapping.
- Objective: Map KRN policy decisions to deterministic Codex hook/MCP boundaries without hidden semantic decisions.
- Business rationale: Operators need guardrails for destructive or unsafe actions.
- Architectural rationale: Hooks are guardrails, not the semantic brain.
- Dependencies: E-00, Codex adapter.
- Input requirements: OpenAI Codex hooks docs, current policy types.
- Output requirements: ADR and first low-risk hook expectation in codex-adapter output.
- Definition of Done: One policy gate has evidence output and no hidden mutation.
- Verification: codex-adapter tests; policy tests.
- Acceptance criteria: Hook boundary is read/propose/write aware.
- Priority: P2.
- Complexity: M.
- Risks: Hidden semantic brain in hooks. Mitigation: deterministic checks only.

### E-02 — Worker Runtime Acceptance Gate

- ID: `E-02`
- Name: Re-evaluate worker runtime only after bottleneck proof.
- Objective: Decide whether to implement a one-shot worker executor for a concrete job type.
- Business rationale: Some maintenance may need async execution, but only after operator burden proves it.
- Architectural rationale: ADR-0015 defers worker runtime; first runtime must start from Postgres worker_jobs/outbox and preserve write boundaries.
- Dependencies: Concrete self-hosting bottleneck; E-00.
- Input requirements: Job type, idempotency key, allowed writes, failure semantics.
- Output requirements: ADR update; maybe one-shot executor, not daemon.
- Definition of Done: Either defer remains documented, or one job has safe one-shot executor proof.
- Verification: worker tests, DB job smoke, no Memory Core mutation.
- Acceptance criteria: No daemon/background loop before one-shot proof.
- Priority: P3 until bottleneck exists.
- Complexity: L.
- Risks: Hidden agency. Mitigation: one-shot/manual only.

## Phase F — Integrations And Product Interfaces

### F-00 — Read-Only MCP/API Boundary Proof

- ID: `F-00`
- Name: Add read-only typed external boundary after CLI readback proves useful.
- Objective: Expose KRN project/run/memory/source read resources through a read-only MCP/API prototype.
- Business rationale: Integrations need typed state access without direct DB/CLI parsing.
- Architectural rationale: MCP/API must be adapter over typed read models, not memory truth.
- Dependencies: D-02, D-03, E-00.
- Input requirements: Stable read models and threat model.
- Output requirements: Read-only proof, tests, docs.
- Definition of Done: External consumer can read run summary without write authority.
- Verification: integration tests, security review, no write endpoints.
- Acceptance criteria: No Memory Core mutation or source decision mutation via MCP/API.
- Priority: P2.
- Complexity: L.
- Risks: API product creep. Mitigation: read-only first.

### F-01 — Codex Automation Integration

- ID: `F-01`
- Name: Evaluate Codex exec/GitHub Action integration.
- Objective: Determine whether KRN should automate parts of Codex execution after CLI/dogfood proof.
- Business rationale: Product value may improve if KRN can drive repeatable Codex tasks.
- Architectural rationale: Codex remains executor; KRN supplies plan/evidence/review contracts.
- Dependencies: C-02, E-00, C-03.
- Input requirements: Stable Codex brief and target repo alpha findings.
- Output requirements: Decision record; maybe prototype in `.local-lab` or CI branch.
- Definition of Done: Either defer or prove one automated run without losing review control.
- Verification: target repo run, evidence capture, security gates.
- Acceptance criteria: Automation cannot bypass review or write policies.
- Priority: P2.
- Complexity: L.
- Risks: Autonomous drift. Mitigation: proposal-only or explicit approval modes.

### F-02 — Dashboard Readiness Gate

- ID: `F-02`
- Name: Decide dashboard after read models prove actions.
- Objective: Define whether dashboard should be built and which views have actions.
- Business rationale: Dashboard is useful only if it reduces decision latency or review burden.
- Architectural rationale: UI must be over typed read models, not status theater.
- Dependencies: D-03, C-02, target repo alpha.
- Input requirements: Read models with action thresholds.
- Output requirements: Dashboard ADR or rejection/defer.
- Definition of Done: Every proposed view has owner, threshold, and action.
- Verification: design review; no UI code unless ADR accepts first slice.
- Acceptance criteria: Dashboard is not used as product proof.
- Priority: P3.
- Complexity: M.
- Risks: Vanity UI. Mitigation: action-per-view gate.

## Phase G — Productionization And Release

### G-00 — CI Verification Pipeline

- ID: `G-00`
- Name: Establish CI proof for typecheck, tests, DB schema, Promptfoo smoke.
- Objective: Move core verification from local-only reports to repeatable CI.
- Business rationale: Production readiness requires remote verification, not only operator shell proof.
- Architectural rationale: Commands already exist; CI should run them with clear does-not-prove boundaries.
- Dependencies: local tests stable; DB service available in CI or separate DB job.
- Input requirements: GitHub Actions or accepted CI runner.
- Output requirements: CI workflow, status badges if desired, docs.
- Definition of Done: PR/commit runs typecheck/tests and optionally DB check/smoke.
- Verification: Green CI run; documented skipped checks if DB unavailable.
- Acceptance criteria: CI failure blocks release claims.
- Priority: P0 before external alpha.
- Complexity: M.
- Risks: Slow/flaky CI. Mitigation: separate fast and DB jobs.

### G-01 — Migration And Backup Policy

- ID: `G-01`
- Name: Define production migration, backup, and replay policy.
- Objective: Establish how KRN brain-store migrations, backups, and rollback are handled.
- Business rationale: Memory/source/evidence state is durable product value.
- Architectural rationale: Postgres is canonical state; migrations need operational governance.
- Dependencies: ADR-0010, DB schema stable enough for alpha.
- Input requirements: Current migrations, Drizzle check, DB replay reports.
- Output requirements: Runbook and tests/smoke as applicable.
- Definition of Done: Operator can back up, restore, migrate, and verify local brain store.
- Verification: local backup/restore smoke or documented dry run.
- Acceptance criteria: No production claims without backup path.
- Priority: P1.
- Complexity: M.
- Risks: Data loss. Mitigation: explicit backup before destructive migrations.

### G-02 — Packaging And Versioning

- ID: `G-02`
- Name: Prepare packages for internal alpha distribution.
- Objective: Define versioning, package outputs, CLI install path, and release notes.
- Business rationale: Target repo use requires reproducible install, not local repo hacking.
- Architectural rationale: Product interfaces must be explicit and narrow.
- Dependencies: C-01, C-02, G-00.
- Input requirements: Public package surface decisions; root package strategy.
- Output requirements: Build/package plan and first internal version tag.
- Definition of Done: Operator can install or run KRN in a repeatable internal alpha mode.
- Verification: clean clone install; `pnpm typecheck`; CLI smoke.
- Acceptance criteria: No internal paths required for normal operator workflow.
- Priority: P1.
- Complexity: L.
- Risks: Premature publishing. Mitigation: internal alpha only.

### G-03 — Internal Alpha Release Gate

- ID: `G-03`
- Name: Decide internal-alpha readiness.
- Objective: Evaluate whether KRN can be used on controlled target repos by operators beyond the author.
- Business rationale: Moves from dogfood to real user value.
- Architectural rationale: Requires full governed path, safety, CI, readback, and target trial proof.
- Dependencies: C-00, C-02, E-00, G-00.
- Input requirements: At least two target repo trials or one strong real repo trial with repeated use.
- Output requirements: Release readiness report and go/no-go decision.
- Definition of Done: Readiness is classified as not-ready, dogfood-only, internal-alpha, or defer.
- Verification: Release checklist, CI, dogfood reports, target repo evidence.
- Acceptance criteria: No product-ready claim; internal-alpha must state limitations.
- Priority: P0 after C/D/E/G foundations.
- Complexity: M.
- Risks: Overclaiming. Mitigation: explicit what-this-does-not-prove section.

### G-04 — v0.1 Production Roadmap Gate

- ID: `G-04`
- Name: Define v0.1 production roadmap after internal alpha.
- Objective: Convert internal-alpha findings into production tasks for deployment, UX, integration, security, and scale.
- Business rationale: Prevents jumping from dogfood to product prematurely.
- Architectural rationale: Production scope must be driven by observed alpha gaps.
- Dependencies: G-03.
- Input requirements: Internal alpha report.
- Output requirements: v0.1 roadmap update.
- Definition of Done: Plan distinguishes production blockers from later/lab work.
- Verification: Architecture review and command evidence.
- Acceptance criteria: Roadmap tasks remain bounded and dependency-ordered.
- Priority: P1.
- Complexity: M.
- Risks: Plan-sprawl returning. Mitigation: archive alpha details and keep root active queue focused.

## 8. Current Active Queue Recommendation

The next active slice should be:

    B-03 — Memory Application Feedback And Demotion Loop

B-02 is complete. Continue with B-03 as a memory feedback loop slice. Do not add automatic demotion, automatic Memory Core mutation, dashboard, API, MCP, worker runtime, broad eval platform, or source crawler.

## 9. Completion Gates By Stage

### Dogfood-ready gate

Already achieved for KRN-on-KRN workflow/review brain. Evidence includes Brain Usefulness Report, DBR-00, RCR-00, and source repairs.

### Internal-alpha gate

KRN is internal-alpha-ready only when all are true:

1. A DB-backed target repo trial exists.
2. KRN improves at least one real coding task with lower or clearer review burden.
3. Activation either selects owner files or has a bounded repair in progress.
4. Evidence capture, observe, reflect, candidates, review, and at least one later activation link are demonstrated.
5. CI verifies typecheck/tests and at least non-DB checks; DB checks are either in CI or explicitly documented as local-only.
6. Safety/trust boundary review has no critical unresolved issue.

### Product-ready gate

KRN is product-ready only when all are true:

1. Governed end-to-end loop works on multiple target repos.
2. Memory/source/eval candidates regularly become useful reviewed state or are rejected cleanly.
3. Activation has measurable context relevance and owner-file recall.
4. Temporal claim/conflict/supersession model is implemented enough to prevent stale truth in real tasks.
5. Research-to-brain lane turns external sources into decisions without source hoarding.
6. CI/CD, migration, backup, security, packaging, and operator UX are all documented and tested.
7. Dashboard/API/MCP, if built, are read-model/action surfaces over proven typed state, not product proof.

## 10. What Not To Build Until Explicitly Authorized

Do not build:

- `krn audit` resurrection;
- anti-slop subsystem;
- quality scanner;
- dashboard-first UI;
- worker daemon or background loop;
- broad eval platform;
- standalone eval candidate storage/promotion;
- source crawler;
- Research Foundry as product layer;
- Pattern Vault as product layer;
- generic multi-agent framework;
- stack-specific agent zoo;
- runtime markdown memory;
- separate vector, graph, search, or queue systems before Postgres spine bottleneck proof;
- activation scoring rewrite before DB-backed owner-file recall evidence.

## 11. Required Final Response Format For Future Goals

Every goal executed under this plan must end with:

    Read:
    - ...

    Changed:
    - ...

    DB used:
    - yes/no

    Commands run:
    - ...

    Artifact/report:
    - ...

    What this proves:
    - ...

    What this does not prove:
    - ...

    Candidates proposed:
    - ...

    Next recommended action:
    - ...

## 12. Immediate Next Goal Prompt

Use this if the operator wants to continue immediately.

    Goal: DB-Backed Owner-File Recall Dogfood

    Mission:
      Run one DB-backed KRN-on-KRN source repair where KRN should ideally surface the owner files or raw recall targets. Do not change activation scoring. Measure whether DB-backed activation selects owner files, guardrails, both, or neither.

    Required:
      - git fetch --prune
      - git status --short --branch
      - pnpm db:ready
      - krn plan --persist
      - source inspection
      - minimal source repair only if a bounded owner-file-heavy task is selected
      - evidence capture --persist
      - observe --persist
      - reflect --persist
      - dogfood report using DOGFOOD_REPORTING.md
      - pnpm typecheck
      - pnpm test
      - git diff --check

    Non-goals:
      - no activation scoring change;
      - no memory scoring change;
      - no reflection extraction rewrite;
      - no dashboard;
      - no worker runtime;
      - no MCP/API;
      - no eval platform;
      - no krn audit;
      - no anti-slop scanner.

    Completion:
      - report states whether activation owner-file recall is good, mixed, weak, or unknown;
      - if weak, open A-02 as the next bounded slice;
      - if good, choose B-02 research-to-brain or C-00 target repo trial next.
