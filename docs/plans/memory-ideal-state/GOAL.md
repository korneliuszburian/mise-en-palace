# Goal: Memory Ideal State — Observational Memory Brain

## Objective

Make memory one of KRN's strongest product segments by turning the current
Postgres-backed memory/source/retrieval spine into an auditable, temporal,
source-ranged observation and reflection layer.

This is not "better RAG". The target flow is:

```txt
raw event -> observation -> reflection -> candidates -> reviewed memory/source/eval
```

The current M27 target-repo proof is the prerequisite: KRN can now attach a
project-scoped run to a target repo, render a Codex brief, persist evidence,
and prove cleanup. The memory layer must attach to that spine rather than
replace it.

## Primary Sources

- `docs/materials/2026-06-22-big-brain.md`
- `docs/materials/2026-06-22-big-brain-part-2.md`

Trust tier: medium. These are user-provided research syntheses and product
analysis, not canonical implementation truth. They are used as mechanisms to
map into KRN decisions, and every adopted mechanism needs a falsifier.

Repo truth inputs inspected for this plan:

- `docs/KRN_KERNEL.md`
- `PLAN.md`
- `GOAL.md`
- `docs/handoff/handoff.md`
- `docs/handoff/blockers.md`
- `docs/handoff/verification.md`
- `docs/runs/2026-06-22-target-repo-init-connect/*`
- `packages/core/src/memory.ts`
- `packages/core/src/source.ts`
- `packages/core/src/contextAssembly.ts`
- `packages/core/src/eval.ts`
- `packages/db/src/schema/harness.ts`
- `packages/db/src/schema/events.ts`
- `packages/db/src/schema/sources.ts`
- `packages/db/src/schema/memory.ts`
- `packages/db/src/schema/retrieval.ts`
- `packages/harness/src/activation/activationEngine.ts`
- `packages/harness/src/compiler/compileHarnessPlan.ts`
- `packages/cli/src/runEvidenceCaptureCommand.ts`
- `packages/workers/src/jobTypes.ts`

## Source-To-Decision Ledger

| Source | Mechanism | KRN implication | Decision | Does not prove | Consumer | Falsifier |
|---|---|---|---|---|---|---|
| `docs/materials/2026-06-22-big-brain.md` | Layered memory: raw substrate, episodic memory, claims/facts, entity graph, working memory, controller, offline consolidation. | KRN memory must be layered and governed; chunks/search docs are evidence and recall surfaces, not final truth. | Adopt. Build Observational Memory over current run/source/memory/retrieval spine. | Does not prove any one external architecture should be copied. | Memory ideal-state goal; future ADR. | If observation layers do not improve dogfood memory failures over current activation, reduce scope. |
| `docs/materials/2026-06-22-big-brain.md` | Temporal knowledge: event time, ingest time, validity windows, stale-state handling, invalidation. | Observation records need `observedAt`, `eventTime`, `ingestedAt`, `referenceTime`, `validFrom`, `validUntil`, and supersession/invalidation links. | Adopt temporal-first schema. | Does not prove a separate graph DB is needed. | DB schema and repository backlog. | If temporal fields are not used by activation/evals by MM-20, simplify. |
| `docs/materials/2026-06-22-big-brain.md` | Offline consolidation / "dreaming" deduplicates, detects contradictions, refreshes communities, and trains control policy. | Reflection must be offline and candidate-producing, not runtime answer generation. | Adopt for deterministic reflection first; defer learned controller. | Does not prove a learned controller should ship early. | Worker jobs, reflector CLI, eval backlog. | Any reflection that auto-promotes MemoryRecord blocks the slice. |
| `docs/materials/2026-06-22-big-brain.md` | Memory controller decides write/update/read/routing/abstention more often than final generation. | Activation 2.0 needs explicit admission, prefix, dynamic retrieval, and raw recall budgets. | Adopt deterministic controller; lab-test learned controller after eval data exists. | Does not prove a small model is better than deterministic policy now. | Activation backlog; MM-23 lab plan. | If deterministic policy handles dogfood failures with lower risk, keep learned controller lab-only. |
| `docs/materials/2026-06-22-big-brain.md` | Benchmarks emphasize retrieval correctness, updates, temporal reasoning, selective forgetting, abstention, and cost. | Memory evals must target real KRN failures: stale memory, contradiction, source range, anti-memory, abstention, and review burden. | Adopt as eval-design direction. | Does not prove broad benchmark lane is useful now. | EvalCandidate backlog. | If evals are detached from dogfood regressions, reject them as benchmark theater. |
| `docs/materials/2026-06-22-big-brain-part-2.md` | Observational Memory: raw messages/events -> observations -> reflections -> stable context. | Add KRN Observational Memory Layer between event/evidence loop and Memory Core. | Adopt, but KRN observations must be source-ranged and Postgres-backed. | Does not prove Mastra text-only logs are enough for KRN. | Observation schema, repository, CLI. | If ObservationItem lacks source range for factual claims, fail. |
| `docs/materials/2026-06-22-big-brain-part-2.md` | Observation log captures what happened, changed, was decided, corrected, uncertain, and what must not be inferred. | Build deterministic observation input from run events, source chunks, evidence, review, feedback, diffs, and user corrections. | Adopt. | Does not prove summaries should become memory truth. | Observer input builder. | If observer writes broad summaries without typed items/kinds, fail. |
| `docs/materials/2026-06-22-big-brain-part-2.md` | Reflection produces SourceClaim, MemoryCandidate, AntiMemoryCandidate, EvalCandidate, not final memory. | Reflection output must go through existing review gates and candidate ledgers. | Adopt as hard promotion gate. | Does not prove reviewer can be skipped. | Reflection CLI/worker. | Any reflection-created MemoryRecord without review is a blocker. |
| `docs/materials/2026-06-22-big-brain-part-2.md` | Stable observation prefix plus targeted recall avoids dumping all memory every turn. | Activation should consume a bounded ObservationPrefix before dynamic retrieval and raw recall. | Adopt after observation vertical slice. | Does not prove prefix should outrank anti-memory or source trust. | Activation 2.0 backlog. | If prefix grows unbounded or hides contradictions, fail. |
| `docs/materials/2026-06-22-big-brain-part-2.md` | Gap-aware answering stores missing data and abstention as first-class signals. | Add durable GapRecord/AbstentionObservation and feed eval candidates. | Adopt. | Does not prove every answer should abstain. | Observation schema, ContextAssembly, evals. | If gap/abstain remains only prose or runtime-only status, fail. |
| `docs/materials/2026-06-22-big-brain-part-2.md` | Anti-memory blocks stale assumptions and unsafe inferences as a peer of memory. | Add AntiMemoryCandidate production from observations/reflections before reviewed AntiMemoryRecord. | Adopt. | Does not prove anti-memory can bypass review. | Memory governance backlog. | If anti-memory warnings cannot trace to source ranges or reviewed rationale, fail. |

## Current Repo State

Present:

- Canonical harness spine exists in code and schema:
  OperatorIntent, TaskContract, HarnessPlan, ContextAssembly, ExecutionRun,
  EvidenceBundle, ReviewAssessment, FeedbackDelta.
- Target repo/project identity exists and is proven:
  Project, RepoInstallation, ProjectKernel, project-scoped persisted planning,
  Codex brief readback, evidence capture, target repo smokes, doctor readiness.
- Source graph exists:
  `source_artifacts`, `source_chunks`, `source_claims`, claim edges,
  source decisions, source decision edges, source rejections, source snapshots.
- Memory governance exists:
  `memory_records`, versions, edges, candidates, applications, feedback events,
  `anti_memory_records`, memory activation traces.
- Retrieval and activation exist:
  embeddings/search docs, retrieval runs/candidates, activation decisions,
  context items/exclusions, lexical search, temporal/trust/ROI filters,
  conflict detection with anti-memory, activation abstention.
- Event and async substrate exists:
  `run_events`, `outbox_events`, `worker_jobs`; maintenance job types include
  embedding, compact memory, contradiction detection, stale memory expiry, and
  eval promotion.
- Evidence capture creates feedback deltas and proposal-only memory signals;
  target dogfood proved no MemoryCandidate or MemoryRecord row is created
  automatically by evidence capture.

Missing:

- No ObservationGroup, ObservationItem, ObservationSourceRange,
  ObservationPrefix, ReflectionRecord, ObservationRepository, or
  ReflectionRepository in core/schema/db/harness.
- No `observation_groups`, `observation_items`,
  `observation_source_ranges`, observation entity edges, observation claim
  edges, reflection records, or observation feedback events in Drizzle schema.
- No deterministic observation input builder from run events, source chunks,
  evidence bundles, review assessments, feedback deltas, diffs, tool traces,
  or user corrections.
- No `krn observe --run <id>` or `krn reflect --scope <scope>`.
- No ObservationPrefixSelector integrated with ActivationEngine.
- No raw evidence recall API from observation to exact run/source/diff/review
  source range.
- No durable gap/abstention memory artifacts; activation can abstain, but gaps
  are not yet auditable observations or eval triggers.
- No AntiMemoryCandidate type/flow; `anti_memory_records` exist only as
  reviewed records.
- No consensus/status ledger for observed/candidate/accepted/contested/
  deprecated/invalidated/superseded/slang/preference/procedure states.
- No reflection-generated eval candidates for memory/context/source behavior.

## Current State Vs Research Matrix

| Research pattern | Current KRN state | Gap | Required direction |
|---|---|---|---|
| Append-only substrate | `run_events`, `outbox_events`, `worker_jobs`, harness tables exist. | No observation projection from events. | Build event-derived ObservationGroup/Item without mutating raw events. |
| Episodic observations | No observation domain or tables. | KRN cannot persist what happened/changed/corrected as dated observations. | Add observation schema, mappers, repository, smoke. |
| Temporal knowledge | Memory has validity windows; source claims have status; retrieval has validity status. | No observation event/reference/ingest time split. | Add temporal anchors and stale/supersession fields to observations. |
| Source-ranged recall | Source chunks/claims and run events exist. | Observations cannot recall exact raw evidence ranges. | Add ObservationSourceRange over run_event, source_chunk, diff, review, tool trace. |
| Reflection / dreaming | Worker skeleton and memory candidates exist. | No reflector record or candidate production from observations. | Add ReflectionRecord and manual `krn reflect`. |
| Stable working memory prefix | Activation ranks memory/source/search dynamically and can abstain. | No small cached ObservationPrefix before retrieval. | Add prefix selector with budget, freshness, confidence, anti-memory limits. |
| Consensus / contested truth | Source claim edges and anti-memory exist. | No status ledger for observed/candidate/accepted/contested/deprecated/slang/procedure states. | Add claim/observation consensus ledger and contradiction handling. |
| Gap-aware answering | Activation can return abstained ContextAssembly. | Gaps are not durable memory artifacts or eval seeds. | Add gap/abstention observations and eval candidates. |
| Anti-memory | `anti_memory_records` exist and activation reads them. | No AntiMemoryCandidate before review. | Add candidate gate and review flow. |
| Offline controller learning | Deterministic activation exists. | No eval dataset for learned memory controller. | Defer learned controller to MM-23 lab plan. |

## Current Evidence Table

| Package/file group | Current behavior | Proof file/test/smoke | Missing research mechanism | Next slice |
|---|---|---|---|---|
| `packages/db/src/schema/harness.ts` | Harness, project, repo installation, project kernel, evidence, review, feedback tables. | M27 anti-rot; `db:smoke:harness-plan`, `db:smoke:harness-evidence`, target repo smokes. | Observation links into run/evidence/review spine. | MM-01 |
| `packages/db/src/schema/events.ts` | Run events, outbox events, worker jobs. | `db:smoke:harness-plan`, `db:smoke:worker-jobs`. | Observation projection from event ranges. | MM-03 |
| `packages/db/src/schema/sources.ts` | Source artifacts/chunks/claims/edges/decisions/rejections/snapshots. | `db:smoke:source-graph`. | Observation source ranges and observation-claim edges. | MM-05 |
| `packages/db/src/schema/memory.ts` | Memory records/versions/candidates/applications/feedback/anti-memory. | `db:smoke:memory-governance`. | AntiMemoryCandidate, reflection-produced candidate gates. | MM-07, MM-14 |
| `packages/db/src/schema/retrieval.ts` | Search docs, embeddings, retrieval runs/candidates, activation decisions, context items/exclusions. | `db:smoke:retrieval-substrate`, `db:smoke:activation`. | Observation subject type and prefix budget policy. | MM-10, MM-11 |
| `packages/harness/src/activation/*` | Deterministic ranking over memory/source/search, anti-memory conflict filter, trust/temporal/ROI filters. | activation tests and smoke. | ObservationPrefixSelector before dynamic retrieval. | MM-10 |
| `packages/harness/src/compiler/compileHarnessPlan.ts` | Compiles intent into persisted run and ContextAssembly, persists activation trace. | `krn plan --project`, target dogfood. | Observation prefix in ContextAssembly metadata/items. | MM-10 |
| `packages/cli/src/runEvidenceCaptureCommand.ts` | Captures changed files/commands/diff risk and persists evidence/review/feedback; proposal-only memory signals. | target dogfood EvidenceBundle `6c85abdd-...`. | Observation bundle after run. | MM-12 |
| `packages/workers/src/jobTypes.ts` | Manual worker-job skeleton types, no daemon runtime. | `db:smoke:worker-jobs`; doctor readiness. | Observe/reflect job types. | MM-22 |
| `docs/runs/2026-06-22-target-repo-init-connect/*` | Current dogfood/anti-rot evidence and M27 proof IDs. | `ANTI_ROT.md`, `VERIFICATION.md`, `HANDOFF.md`. | Memory ideal-state plan and follow-up goal. | MM-00 |

## Strict Vocabulary

- Raw event: append-only externalized occurrence such as run_event, source
  chunk ingest, evidence capture, review assessment, feedback delta, diff, tool
  trace, or user correction.
- Observation: dated, typed, source-ranged statement about what happened,
  changed, was decided, corrected, became uncertain, or must not be inferred.
- Reflection: offline synthesis over observations that deduplicates, detects
  contradictions/staleness/gaps, and produces candidates.
- Source claim: evidence-linked claim with mechanism, implication,
  does-not-prove, trust tier, consumer, and falsifier.
- Memory candidate: reviewable proposal to create or update governed
  MemoryRecord.
- AntiMemoryCandidate: reviewable proposal to block a stale, unsafe,
  contradicted, or overconfident inference before it becomes AntiMemoryRecord.
- Memory record: reviewed project-scoped belief state with source lineage,
  validity, application guidance, and feedback.
- Eval candidate: proposed regression case derived from observed failure,
  contradiction, gap, or risky memory behavior.
- Activation prefix: small, bounded working set selected before dynamic
  retrieval; it may contain observations, corrections, gaps, and anti-memory
  warnings.
- Raw evidence recall: exact path from observation/reflection/candidate back to
  source range in run event, source chunk, diff, tool trace, review feedback,
  or other canonical evidence.

## Design Rules

- Observations are not MemoryRecords.
- Reflections are not runtime truth.
- Factual observations require source ranges.
- User preference observations may omit source ranges only when explicitly
  marked as preference and scoped to a user/project.
- Reflection may create MemoryCandidate, SourceClaim, AntiMemoryCandidate, and
  EvalCandidate; it must not auto-promote MemoryRecord.
- Anti-memory is a peer of memory, not an afterthought.
- Gaps and abstentions are durable artifacts, not only prose.
- Chain-of-thought must not be stored.
- Runtime markdown memory, `.krn` runtime truth, separate vector DB, separate
  graph DB, broad dashboard/API/MCP work, broad subagent systems, and automatic
  memory promotion remain out of scope for this goal.

## Neuro / Metacognitive Inspirations As Engineering Primitives

- Hippocampus -> cortex consolidation:
  raw run/source events remain episodic; reflection consolidates repeated
  patterns into candidates. Guardrail: never delete raw episodes or overwrite
  reviewed truth.
- Attention and salience:
  priority, novelty, risk, recency, trust, and expected decision impact affect
  activation. Guardrail: salience is not truth.
- predictive processing:
  store expectation failures: expected X, evidence showed Y. Guardrail: store
  externalized expectation/observation/evidence, not chain-of-thought.
- Synaptic pruning / forgetting:
  stale, low-use, contradicted, or low-trust observations are demoted through
  validity windows and invalidation. Guardrail: forgetting is reversible by raw
  recall.
- Reconsolidation:
  reused and corrected memory creates feedback events and candidate versions.
  Guardrail: reviewer and lineage are required for promotion.
- global workspace:
  activation prefix is the visible working set for Codex; everything else is
  recallable but not always active. Guardrail: budget and exclusions stay
  explicit.
- metacognition:
  runs can emit confidence, known gaps, contradictions, and raw-evidence-needed
  signals. Guardrail: uncertainty is stored as a first-class record.
- Self-model / identity continuity:
  ProjectKernel and memory prefix carry stable project policies, current
  decisions, no-go zones, and active learning goals. Guardrail: identity is
  project-scoped and source-backed.
- World-model vs belief-state split:
  SourceClaim/Observation describe evidence; MemoryRecord describes reviewed
  KRN belief; AntiMemory blocks known-bad inference. Guardrail: retrieval
  cannot flatten these into one truth string.
- Dreaming as simulation:
  reflector can propose eval cases and counterfactual risk scenarios.
  Guardrail: simulated scenarios are EvalCandidate, not evidence.

## Implementation Backlog

### MM-00 — memory ideal-state ADR and source-to-decision ledger

Write ADR: Observational Memory is an event-derived layer, not Memory Core.
Include this source-to-decision ledger, out-of-scope list, falsifiers, and
schema direction.

Canonical MM-00 artifacts:

- `docs/decisions/ADR-0011-observational-memory-as-staging-layer.md`
- `docs/plans/memory-ideal-state/SOURCE_LEDGER.md`
- `docs/plans/memory-ideal-state/DECISIONS.md`
- `docs/plans/memory-ideal-state/REJECTIONS.md`
- `docs/plans/memory-ideal-state/FALSIFIERS.md`
- `docs/plans/memory-ideal-state/MM-ROADMAP.md`

MM-00 is docs/decision only. It must not add DB tables, repositories, CLI
runtime, observer workers, reflector workers, source crawlers, dashboard/API/MCP
surfaces, plugins, broad eval suites, or runtime markdown memory.

Verification:

```sh
test -f docs/decisions/ADR-0011-observational-memory-as-staging-layer.md
test -f docs/plans/memory-ideal-state/SOURCE_LEDGER.md
test -f docs/plans/memory-ideal-state/DECISIONS.md
test -f docs/plans/memory-ideal-state/REJECTIONS.md
test -f docs/plans/memory-ideal-state/FALSIFIERS.md
test -f docs/plans/memory-ideal-state/MM-ROADMAP.md
rg "source -> mechanism -> KRN implication" docs/decisions/ADR-0011-observational-memory-as-staging-layer.md
rg "Observational Memory is not Memory Core" docs/plans/memory-ideal-state/DECISIONS.md
rg "MM-24" docs/plans/memory-ideal-state/MM-ROADMAP.md
pnpm typecheck
pnpm test
git diff --check
```

### MM-01 — observation/event-derived memory schema

Add Drizzle schema and migration for:

- `observation_groups`
- `observation_items`
- `observation_source_ranges`
- `observation_entity_edges`
- `observation_claim_edges`
- `reflection_records`
- `observation_feedback_events`

Stable query fields must be relational; JSONB only for unstable metadata.

Verification: schema tests, generated SQL inspection, `pnpm --filter @krn/db db:check`.

### MM-02 — observation repositories and typed mappers

Add core types, repository interfaces, Drizzle adapters, and mappers for
ObservationGroup, ObservationItem, ObservationSourceRange, ReflectionRecord.
External DB JSON stays `unknown` until narrowed.

Verification: mapper tests and typecheck.

### MM-03 — deterministic observation input builder from run/source/tool/review events

Build `buildObservationInput` from run events, source chunks, evidence bundles,
review assessments, feedback deltas, changed files, and user corrections.

Verification: fixture proves deterministic ordering and source references.

### MM-04 — manual `krn observe --run <id>` vertical slice

Add manual command that creates ObservationGroup and ObservationItems for one
ExecutionRun. No background daemon.

Verification: command output, persisted rows, no MemoryRecord mutation.

### MM-05 — observation source-range recall from run events, source chunks, diffs, tool traces, and review feedback

Add source range contract and recall path:

```txt
observation -> source_range -> raw evidence
```

Verification: factual observation without source range is rejected.

### MM-06 — offline reflector records and `krn reflect --scope <scope>`

Add ReflectionRecord and manual CLI over project/run/topic scopes.

Verification: reflection persists a record and does not promote memory.

### MM-07 — MemoryCandidate / SourceClaim / AntiMemoryCandidate / EvalCandidate production gates

Wire reflection output to candidate rows. Add AntiMemoryCandidate domain and
review flow.

Verification: reflection creates candidates, not MemoryRecords.

### MM-08 — consensus/status ledger and contradiction handling

Add statuses:

```txt
observed, candidate, accepted, contested, deprecated, invalidated,
superseded, joke_or_slang, preference, procedure
```

Verification: contradictory observations remain visible and are not merged away.

### MM-09 — gap/abstention records as durable memory-context artifacts

Add GapRecord or gap ObservationItem kind for abstentions and missing evidence.

Verification: activation abstention can create a durable gap candidate.

### MM-10 — observation prefix selector integrated with ActivationEngine

Add `selectObservationPrefix(taskContract)` and include bounded observation
items before dynamic retrieval.

Verification: ContextAssembly can include observation prefix items under budget.

### MM-11 — activation budget policy for stable prefix vs dynamic retrieval vs raw recall

Add explicit budget split:

```txt
stable prefix + dynamic retrieval + raw evidence recall
```

Verification: tests prove prefix cannot crowd out anti-memory or required raw
evidence.

### MM-12 — evidence-capture observation bundle after Codex runs

Extend evidence capture to produce observation candidates from changed files,
commands, diff risk, review burden, rollback path, and feedback candidates.

Verification: evidence capture creates observation bundle but no MemoryRecord.

### MM-13 — memory application feedback and reconsolidation loop

Connect memory application outcomes/corrections to observation feedback events
and candidate versions.

Verification: stale/hurt feedback creates reviewable candidate, not direct edit.

### MM-14 — anti-memory candidate review flow and stale-assumption invalidation

Add AntiMemoryCandidate review/promotion to AntiMemoryRecord.

Verification: stale assumption is blocked in activation after reviewed promotion.

### MM-15 — ProjectKernel identity continuity and project-scoped memory prefix

Tie ProjectKernel, active decisions, no-go zones, and observation prefix to
project scope.

Verification: target repo project gets its own prefix; no cross-project leakage.

### MM-16 — metacognitive run output: confidence, gaps, contradictions, raw evidence needed

Expose confidence/gap/contradiction/raw-evidence-needed in run output and
Codex brief.

Verification: Codex brief renders these without dumping raw context.

### MM-17 — salience/novelty/risk scoring without treating salience as truth

Add scoring fields for priority, novelty, risk, recency, trust, and decision
impact.

Verification: high salience does not bypass trust/source-range gates.

### MM-18 — temporal stale-state detector and selective forgetting/pruning policy

Add detector for valid_until, supersession, stale observations, and pruning
candidates.

Verification: stale observation is excluded or caveated; raw recall remains.

### MM-19 — reflection-generated eval candidates for memory/context/source behavior

Generate EvalCandidate from memory failure, contradiction, source range gap, or
abstention.

Verification: eval candidate links to observation/reflection/source evidence.

### MM-20 — dogfood evals for memory, anti-memory, contradiction, source range, and abstention behavior

Add focused dogfood evals only for real KRN contracts.

Verification: evals fail on missing source range, hidden contradiction, or
auto-promotion.

### MM-21 — doctor/readiness checks for observational memory

Update `krn doctor` for observation schema/repository/CLI/smoke/readiness and
forbidden auto-promotion checks.

Verification: no-env preview and DB-aware ready states.

### MM-22 — manual worker-job skeleton for observe/reflect tasks, no daemon runtime

Add job types:

- `observe_run_events`
- `observe_source_thread`
- `reflect_observation_groups`

No broad daemon runtime.

Verification: worker job smoke enqueues/transitions/cleans rows.

### MM-23 — optional learned memory-controller lab plan, only after MM eval data exists

Write lab-only plan for learned admission/routing controller using MM eval
data.

Verification: no runtime dependency and no production path.

### MM-24 — full dogfood proof and anti-rot audit

Run observe/reflect/dogfood on a target repo run and prove source ranges,
candidates, anti-memory, prefix, gaps, doctor, and cleanup.

Verification: full typecheck/test/smoke/doctor/anti-rot matrix.

## Completion Criteria

- Observation schema exists and is store-backed.
- Factual observations require exact source ranges.
- Reflection creates candidates only.
- AntiMemoryCandidate exists before AntiMemoryRecord promotion.
- Gap/abstention records are durable.
- Activation can use bounded observation prefix.
- Raw evidence recall works for every promoted observation-derived candidate.
- Doctor reports observational memory readiness.
- Dogfood proof demonstrates memory, anti-memory, contradiction, source range,
  and abstention behavior.
