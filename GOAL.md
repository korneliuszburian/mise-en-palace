# Goal: M27 — Target Repo Init/Connect Dogfood

Repository root:

`/home/krn/coding/krn/active/mise-en-palace`

## Context

M22–M26 Brain Spine is complete and pushed to `origin/main`.

Verified:

- `pnpm typecheck` passed;
- `pnpm test` passed: 26 files, 120 tests;
- no-env and live DB `krn doctor` passed;
- `pnpm db:ready` passed: 7/7 migrations, pgvector proven;
- all DB smokes from M22–M26 passed;
- forbidden scans passed;
- smoke cleanup counts zero where reported;
- repo is clean on `main...origin/main`.

Completed brain spine:

- persisted harness run spine;
- source graph persistence;
- memory governance persistence;
- retrieval/search substrate;
- activation engine v1;
- Codex execution brief renderer;
- hook expectation projection;
- worker job skeleton.

## Mission

Prove KRN can initialize/connect a separate target repo into the Postgres-backed brain store and run the persisted harness loop against that target repo.

This is the first target-repo product proof.

Do not build dashboard, API, MCP server, plugin package, broad worker runtime, research layer, source crawler, separate vector/graph DB, or runtime markdown memory.

## Target behavior

Use a fixture target repo, not a real external repo by default.

Required target repo flow:

```txt
fixture target repo
  -> krn init --dry-run --repo <fixture>
  -> krn init --connect --repo <fixture> --persist
  -> Project / RepoInstallation / ProjectKernel persisted
  -> thin Codex overlay proposal or fixture-only write
  -> krn plan --project <project-id> --task "improve test script readiness" --persist
  -> activation uses project-scoped source/memory/retrieval state
  -> krn codex brief --run-id <id>
  -> krn evidence capture --run-id <id> --persist
````

If `--connect` does not exist yet, implement it as the smallest honest final-compatible path.

If writing files is needed, restrict writes to a disposable fixture repo and make it explicit.

## Hard boundaries

Do not create:

* dashboard;
* `apps/`;
* public API;
* KRN MCP server;
* plugin package;
* broad worker daemon;
* research layer;
* source crawler;
* runtime markdown memory;
* `.krn` runtime truth;
* separate Qdrant/LanceDB/Neo4j/Elastic store;
* Redis/Kafka queue;
* broad eval suite;
* real external repo mutation without explicit fixture/approval.

Allowed:

* fixture target repo;
* init/connect repository methods;
* repo detection improvements;
* ProjectKernel persistence improvements;
* thin AGENTS.md proposal;
* fixture-only overlay write if explicitly documented;
* smoke tests;
* doctor readiness checks;
* compact run/handoff docs.

## Required reading

Read only:

1. `AGENTS.md`
2. `GOAL.md`
3. `PLAN.md`
4. `docs/handoff/handoff.md`
5. `docs/handoff/blockers.md`
6. `docs/handoff/verification.md`
7. latest M22–M26 run `HANDOFF.md`
8. package manifests
9. DB schema/repository files relevant to projects/repo installations/kernels
10. CLI files for `init`, `plan`, `doctor`, `codex brief`, `evidence capture`
11. test/smoke helpers from M20–M26

Do not reread raw onboarding materials.
Do not read all historical docs.
Do not do external research.

## Slice 00 — Preflight and run ledger

Run:

```bash
git status --short --branch
git log --oneline -20
pnpm typecheck
pnpm test
krn doctor
pnpm db:ready
pnpm db:smoke
pnpm db:smoke:harness-plan
pnpm db:smoke:harness-evidence
pnpm db:smoke:source-graph
pnpm db:smoke:memory-governance
pnpm db:smoke:retrieval-substrate
pnpm db:smoke:activation
pnpm db:smoke:codex-adapter
pnpm db:smoke:worker-jobs
```

Create compact run ledger:

```txt
docs/runs/2026-06-22-target-repo-init-connect/
  PROGRESS.md
  HANDOFF.md
  DECISIONS.md
  BLOCKERS.md
  VERIFICATION.md
```

Record:

* M22–M26 verified state;
* this goal’s boundaries;
* exact next action.

Commit:

`docs(run): add target repo init-connect ledger`

## Slice 01 — Inventory init/connect/project model

Inspect current support for:

* `krn init`;
* repo detection;
* project creation;
* repo installation persistence;
* project kernel persistence;
* AGENTS.md proposal;
* `.codex` proposal;
* fixture repos;
* smoke helpers.

Record in `DECISIONS.md`:

* what exists;
* what is missing;
* exact command shape for M27;
* whether `--connect`, `--persist`, or another flag matches current CLI conventions;
* what will remain intentionally not built.

Verification:

```bash
pnpm typecheck
```

Commit if docs changed:

`docs(run): record init-connect inventory`

## Slice 02 — Add target repo fixture

Add a minimal disposable target repo fixture.

Example shape:

```txt
tests/fixtures/target-repos/typescript-basic/
  package.json
  tsconfig.json
  src/index.ts
```

It should have:

* git-like project shape if existing tests simulate git;
* package manager/script signals;
* TypeScript presence;
* no existing KRN runtime memory;
* no dashboard/app forbidden surfaces.

Do not make fixture large.

Verification:

```bash
pnpm typecheck
pnpm test
```

Commit:

`test(fixtures): add basic target repo fixture`

## Slice 03 — Init/connect DB schema check

Verify existing schema supports:

* project;
* repo installation;
* project kernel;
* project root/path/fingerprint;
* createdAt/updatedAt;
* optional metadata.

If missing, add minimal migration.

Rules:

* no API;
* no dashboard read models;
* no multi-client cloud sync;
* schema must stay compatible with final ProjectRegistry direction.

Verification:

```bash
pnpm typecheck
pnpm db:ready
```

Commit if migration/schema changed:

`feat(db): add target repo project registration schema`

## Slice 04 — Repository methods for init/connect

Add or tighten repository methods:

* createProject;
* createRepoInstallation;
* createProjectKernel;
* getProjectById;
* getProjectByRepoFingerprint/path;
* listRepoInstallationsForProject;
* cleanup fixture project records.

Rules:

* typed read models;
* no raw DB rows leaking to CLI;
* no core imports from db;
* no dashboard/API.

Verification:

```bash
pnpm typecheck
pnpm test
```

Commit:

`feat(db): add target repo registration repository methods`

## Slice 05 — `krn init --dry-run --repo <path>`

Make dry-run work against an explicit repo path.

It should detect:

* repo root/path;
* package manager;
* TypeScript presence;
* package scripts;
* existing AGENTS.md;
* existing `.codex`;
* existing `.agents/skills`;
* forbidden surfaces;
* proposed thin overlay.

It must:

* write nothing;
* clearly print “No files written”;
* produce ProjectKernel proposal;
* produce Codex overlay proposal;
* produce next command suggestion.

Verification:

```bash
krn init --dry-run --repo tests/fixtures/target-repos/typescript-basic
git status --short --branch
pnpm typecheck
pnpm test
```

Commit:

`feat(cli): support target repo init dry run`

## Slice 06 — `krn init --connect --repo <path> --persist`

Implement connect mode.

Behavior with DB ready:

* create or reuse Project;
* create RepoInstallation;
* create ProjectKernel;
* optionally create initial harness run or init event;
* print project ID and repo installation ID;
* write no files unless explicit fixture-only apply flag is used.

Behavior without DB:

* fail clearly with actionable DB readiness message;
* do not write files.

Rules:

* idempotent if same fixture repo is connected twice;
* no dashboard/API;
* no `.krn` runtime truth;
* no automatic memory mutation.

Verification:

```bash
krn init --connect --repo tests/fixtures/target-repos/typescript-basic --persist
pnpm typecheck
pnpm test
```

Commit:

`feat(cli): connect target repo to brain store`

## Slice 07 — Target repo init/connect smoke

Add:

```bash
pnpm db:smoke:init-connect
```

It must:

1. require DB;
2. use target repo fixture;
3. run connect path or repository equivalent;
4. persist Project;
5. persist RepoInstallation;
6. persist ProjectKernel;
7. read records back;
8. verify idempotency if feasible;
9. cleanup;
10. prove cleanup count zero.

Verification:

```bash
pnpm db:smoke:init-connect
pnpm typecheck
pnpm test
```

Commit:

`test(db): add target repo init-connect smoke path`

## Slice 08 — Project-scoped `krn plan --project`

Update persisted planning path to accept project identity from init/connect.

Behavior:

```bash
krn plan --project <project-id> --task "improve test script readiness" --persist
```

Must:

* load ProjectKernel;
* use project-scoped repo metadata;
* create persisted harness run under project;
* run activation with project scope;
* print run ID.

Rules:

* no fallback to global project if `--project` supplied and missing;
* no cross-project leakage;
* no raw onboarding read.

Verification:

```bash
krn plan --project <project-id> --task "improve test script readiness" --persist
pnpm typecheck
pnpm test
```

Commit:

`feat(cli): support project-scoped persisted planning`

## Slice 09 — Full target repo harness smoke

Add:

```bash
pnpm db:smoke:target-repo-harness
```

It must:

1. connect fixture repo;
2. create project-scoped persisted plan;
3. render Codex brief;
4. persist evidence capture;
5. verify records are linked to the target project;
6. cleanup all test rows;
7. prove cleanup count zero.

Verification:

```bash
pnpm db:smoke:target-repo-harness
pnpm typecheck
pnpm test
```

Commit:

`test(db): add target repo harness smoke path`

## Slice 10 — Doctor target repo readiness

Update `krn doctor`.

Add read-only checks for:

* init/connect command availability;
* target repo fixture smoke availability;
* project registration schema readiness;
* no cross-project state leakage proof known/unproven;
* no dashboard/API/MCP server;
* no runtime markdown memory.

Doctor states:

* DB ready but init-connect unverified;
* init-connect smoke proven;
* target repo harness smoke proven.

No writes.

Verification:

```bash
krn doctor
pnpm db:smoke:init-connect
pnpm db:smoke:target-repo-harness
krn doctor
pnpm typecheck
pnpm test
```

Commit:

`feat(cli): report target repo readiness in doctor`

## Slice 11 — Dogfood M27 with fixture repo

Run:

```bash
krn init --dry-run --repo tests/fixtures/target-repos/typescript-basic
krn init --connect --repo tests/fixtures/target-repos/typescript-basic --persist
krn plan --project <project-id> --task "improve test script readiness" --persist
krn codex brief --run-id <run-id>
krn evidence capture --run-id <run-id> --persist
krn doctor
pnpm db:smoke:init-connect
pnpm db:smoke:target-repo-harness
```

Record:

* project ID;
* repo installation ID;
* run ID;
* what was proven;
* what was not proven;
* review burden;
* next safest action.

Commit:

`docs(run): record target repo init-connect dogfood`

## Slice 12 — Anti-rot audit

Run:

```bash
git status --short --branch
git log --oneline -20
pnpm typecheck
pnpm test
krn doctor
pnpm db:ready
pnpm db:smoke
pnpm db:smoke:harness-plan
pnpm db:smoke:harness-evidence
pnpm db:smoke:source-graph
pnpm db:smoke:memory-governance
pnpm db:smoke:retrieval-substrate
pnpm db:smoke:activation
pnpm db:smoke:codex-adapter
pnpm db:smoke:worker-jobs
pnpm db:smoke:init-connect
pnpm db:smoke:target-repo-harness
git diff --check
```

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
* no source crawler;
* no broad eval suite;
* no forbidden dependency;
* core remains library-safe;
* all smoke cleanup counts zero.

Commit:

`docs(run): record target repo anti-rot audit`

## Slice 13 — Final handoff

Update:

* current run docs;
* `docs/handoff/handoff.md`;
* `docs/handoff/blockers.md`;
* `docs/handoff/verification.md`.

Final handoff must state:

* M27 completed or blocked;
* exact commits;
* exact verification;
* DB proof status;
* persisted harness status;
* target repo init/connect status;
* residual blockers;
* not built;
* next safest action.

Commit:

`docs(handoff): update target repo init-connect status`

## Slice 14 — Memory research gap analysis and next-goal plan

After M27 target-repo init/connect work is complete, run a full repo-state
analysis against the accumulated memory research. This is a required final
planning slice, not optional commentary.

This slice exists because the memory research changes the priority of the next
major KRN segment: memory cannot remain "RAG plus candidates". It must become a
first-class, temporal, source-ranged, observation/reflection layer over the
Postgres-backed brain store.

Primary research inputs:

* `docs/materials/2026-06-22-big-brain.md`
* `docs/materials/2026-06-22-big-brain-part-2.md`

Initial research mechanisms to map:

* layered memory: append-only substrate -> episodic observations -> claims /
  facts -> entity and claim graph -> working memory / context prefix;
* temporal knowledge: event time, ingest time, validity windows, stale-state
  handling, contradiction handling, and selective forgetting;
* offline consolidation / "dreaming": reflection jobs that deduplicate,
  detect contradictions, detect stale observations, and produce reviewable
  candidates rather than runtime truth;
* stable observation prefix: small project/topic working set for active
  decisions, corrections, gaps, anti-memory warnings, and temporal caveats;
* raw recall: every durable observation must trace back to source ranges,
  run events, source chunks, review feedback, diffs, or tool traces;
* gap-aware answering: explicit abstention/gap records instead of pretending
  ranking, consensus, or exact source support exists;
* anti-memory as a peer of memory: blocks known-bad claims, stale assumptions,
  unsafe inferences, and overconfident interpretations;
* review gates: observations and reflections may create MemoryCandidate,
  SourceClaim, AntiMemoryCandidate, and EvalCandidate records, but must not
  auto-promote MemoryRecord truth.

Initial repo-state snapshot from current inspection:

* Present:
  * ADR-0009 (`docs/decisions/ADR-0009-canonical-harness-spine.md`) and
    ADR-0010 (`docs/decisions/ADR-0010-brain-store-postgres-pgvector.md`)
    exist and match the observed implementation direction: canonical harness
    spine plus PostgreSQL/pgvector brain store.
  * Postgres-backed harness spine with `operator_intents`, `task_contracts`,
    `harness_plans`, `context_assemblies`, `execution_runs`,
    `evidence_bundles`, `review_assessments`, and `feedback_deltas`.
  * Project/target-repo registration primitives: `projects`,
    `repo_installations`, and `project_kernels`.
  * Source graph primitives: `source_artifacts`, `source_chunks`,
    `source_claims`, source claim/decision edges, source decisions,
    source rejections, and source snapshots.
  * Memory governance primitives: `memory_records`,
    `memory_record_versions`, `memory_edges`, `memory_candidates`,
    `memory_applications`, `memory_feedback_events`, `anti_memory_records`,
    and `memory_activation_traces`.
  * Retrieval/activation primitives: embeddings/search documents,
    `retrieval_runs`, `retrieval_candidates`, `activation_decisions`,
    `context_items`, and `context_exclusions`.
  * Run/event async spine: `run_events`, `outbox_events`, and `worker_jobs`.
  * Activation code that ranks memory/source/search candidates, reads
    anti-memory, persists inclusions/exclusions, and can abstain when no
    useful project-scoped context exists.
* Missing:
  * No `observation_groups`, `observation_items`,
    `observation_source_ranges`, observation entity/claim edges,
    reflection records, or observation feedback events.
  * No core/schema/repository contracts for Observation, ObservationItem,
    ObservationSourceRange, ReflectionRecord, ObservationRepository, or
    ReflectionRepository.
  * No deterministic observation input builder from run events, tool traces,
    source chunks, evidence bundles, review assessments, feedback deltas, and
    user corrections.
  * No CLI/manual vertical slice for `krn observe --run <id>` or
    `krn reflect --scope <scope>`.
  * No ObservationPrefixSelector feeding ActivationEngine before dynamic
    retrieval.
  * No raw-evidence recall path from an observation back to exact source range.
  * No consensus/status ledger for observed/candidate/accepted/contested/
    deprecated/invalidated/superseded/slang/preference/procedure states.
  * No first-class gap/abstention records as memory artifacts; current
    activation abstention is runtime behavior, not an auditable observation
    primitive.
  * No memory eval candidates produced from observation/reflection failures.

Operator-provided analysis to preserve in the final plan:

* The research does not point to "better RAG". It points to an operational
  memory area:

  ```txt
  event -> observation -> reflection -> candidates
  ```

  Memory should become an auditable, temporal, evidence-linked brain, not a
  lightly validated truth cache.
* The observational layer should become an active context source for changes,
  conflicts, gaps, temporal state, and corrections, but it must not become a
  new path for poorly validated truth.
* The current repo already has a practical spine:

  ```txt
  OperatorIntent -> TaskContract -> ContextAssembly -> ExecutionRun
    -> EvidenceBundle -> ReviewAssessment -> FeedbackDelta
  ```

  The next memory layer should attach to that spine instead of replacing it.
* The target architecture is additive:
  * existing event/source/review/evidence/outbox spine;
  * new Observational Memory with ObservationGroup, ObservationItem,
    ObservationSourceRange, and ObservationPrefix;
  * offline ReflectionRecord production;
  * candidate-only outputs: MemoryCandidate, AntiMemoryCandidate,
    SourceClaim, EvalCandidate;
  * Activation 2.0 that combines observationPrefix, ranking/exclusion,
    gap/abstain, and raw recall when confidence is low.
* Runtime behavior should be:

  ```txt
  stable prefix + targeted recall
  ```

  Not:

  ```txt
  dump all memory/retrieval context
  ```

Initial decision:

* Adopt the research direction as a planned next major KRN memory segment.
* Do not implement the full segment during M27.
* Convert the research into a dedicated `docs/plans/memory-ideal-state/GOAL.md`
  with exact current-state evidence, gaps, falsifiers, and executable slices.
* Treat the current M27 target-repo work as the prerequisite project-scoped
  spine that the later memory layer must attach to.

Current-state vs research matrix:

| Research pattern | Current KRN state | Gap | Required direction |
|---|---|---|---|
| Append-only substrate | `run_events`, `outbox_events`, `worker_jobs`, harness run tables exist. | No observation-specific event projection. | Build observation input from run/source/tool/review events without mutating raw evidence. |
| Episodic observations | No observation tables or domain types. | KRN cannot persist "what happened / changed / was corrected" as dated observations. | Add ObservationGroup, ObservationItem, ObservationSourceRange, and feedback events. |
| Temporal knowledge | Memory records and candidates have validity windows; source graph has persisted claims. | No event_time vs ingest_time vs reference_time for observations. | Add temporal anchors to observation groups/items and require stale/validity handling. |
| Source-ranged recall | Source chunks and source claims exist. | Memory/activation can cite subjects, but observations cannot trace to exact run/source/diff ranges. | Every factual observation needs source ranges and raw recall. |
| Reflection / dreaming | Worker skeleton exists; memory candidates and anti-memory exist. | No offline reflector records, contradiction grouping, or candidate production from observations. | Add manual reflector first, then worker jobs for reflection. |
| Stable working memory prefix | Activation ranks memory/source/search dynamically and can abstain. | No small cached observation prefix before retrieval. | Add ObservationPrefixSelector with size, freshness, confidence, and anti-memory limits. |
| Consensus / contested truth | Source claims and anti-memory exist; activation can exclude conflicts. | No claim status ledger for observed/candidate/accepted/contested/deprecated/slang/procedure states. | Add consensus/status ledger and contradiction handling over claims and observations. |
| Gap-aware answering | Activation can return abstained context. | Gaps are not durable memory artifacts or eval triggers. | Add GapRecord/AbstentionObservation and wire to ContextAssembly and eval candidates. |
| Anti-memory | `anti_memory_records` exist and activation reads them. | No AntiMemoryCandidate produced by reflection before review. | Add candidate gate for anti-memory generated by observations/reflections. |
| Small learned controller | Current activation is deterministic scoring over lexical/source/memory/search candidates. | No learned router/admission controller, no "sleep-time" training data. | Plan later memory-controller training only after observation/eval data exists. |

Source-to-decision seed ledger:

| Source | Mechanism | KRN implication | Decision | Falsifier |
|---|---|---|---|---|
| `docs/materials/2026-06-22-big-brain.md` | Layered memory: raw events, episodes, claims, graph, controller, offline consolidation. | KRN must keep Memory Core as a governed belief layer, not as raw RAG chunks. | Adopt as target architecture for next memory goal. | If source-ranged observations cannot improve dogfood evals over current activation, revisit scope. |
| `docs/materials/2026-06-22-big-brain.md` | Temporal claims and validity windows prevent stale memory from acting as current truth. | Observation and claim records need valid_from/valid_until/reference_time and supersession semantics. | Adopt temporal-first schema. | If temporal fields are unused in activation/evals for two milestones, simplify. |
| `docs/materials/2026-06-22-big-brain.md` | Sleep-time consolidation should train/shape the controller, not generate final answers. | Dreaming/reflection must be offline and candidate-producing. | Adopt, but defer learned controller until observation data exists. | If deterministic reflection gives enough quality at lower cost, keep learned controller as lab-test only. |
| `docs/materials/2026-06-22-big-brain-part-2.md` | Observational Memory converts run/source/tool/review events into dated observations and reflections. | KRN needs an Observational Memory Layer between evidence/run events and governed Memory Core. | Adopt as MM target. | If observation records become summaries without source ranges, fail the slice. |
| `docs/materials/2026-06-22-big-brain-part-2.md` | Observation prefix reduces context churn while raw recall remains available for proof. | Activation should consume a bounded observation prefix before dynamic retrieval. | Adopt after schema/repository vertical slice. | If prefix grows without budget or hides contradictions, fail. |
| `docs/materials/2026-06-22-big-brain-part-2.md` | Reflection must produce candidates and preserve contradictions. | Reflections may create SourceClaim, MemoryCandidate, AntiMemoryCandidate, EvalCandidate, never MemoryRecord directly. | Adopt as hard promotion gate. | Any reflection auto-promoting memory is a blocker. |

Neuro / metacognitive / "metaphysical" inspirations to translate into
engineering primitives:

* Hippocampus -> cortex consolidation:
  * engineering primitive: raw run/source events remain episodic; nightly or
    manual reflection consolidates repeated patterns into candidates;
  * guardrail: consolidation never deletes raw episodes and never overwrites
    current truth without review.
* Attention and salience:
  * engineering primitive: observation priority, novelty, risk, recency,
    trust, and expected decision impact affect activation;
  * guardrail: salience is not truth; high-salience observations still require
    source ranges.
* Predictive processing:
  * engineering primitive: store expectation failures: "we expected X, evidence
    showed Y"; use them as future anti-memory/eval candidates;
  * guardrail: do not store chain-of-thought, only externalized expectation,
    observation, correction, and evidence.
* Synaptic pruning / forgetting:
  * engineering primitive: demote stale, low-use, contradicted, or low-trust
    observations through validity windows and invalidation records;
  * guardrail: forgetting is reversible by raw recall; do not erase audit
    lineage.
* Reconsolidation:
  * engineering primitive: when a memory is reused and corrected, create a
    feedback event and candidate version instead of editing the record in
    place;
  * guardrail: reviewer and source lineage are required for promotion.
* Global workspace:
  * engineering primitive: small activation prefix becomes the visible working
    set for Codex; everything else stays recallable but not always active;
  * guardrail: context budget, inclusion/exclusion records, and abstention
    remain explicit.
* Metacognition:
  * engineering primitive: every answer/run can emit confidence, known gaps,
    contradiction flags, and "raw evidence needed";
  * guardrail: uncertainty must be stored as a first-class record, not hidden in
    prose.
* Self-model / identity continuity:
  * engineering primitive: ProjectKernel and memory prefix carry stable project
    policies, current decisions, no-go zones, and active learning goals;
  * guardrail: identity is project-scoped and source-backed, not a personality
    prompt.
* World-model vs belief-state split:
  * engineering primitive: SourceClaim/Observation describe external evidence;
    MemoryRecord describes reviewed KRN belief; AntiMemory describes known
    forbidden inference;
  * guardrail: retrieval cannot collapse those layers into one "truth" string.
* Dreaming as simulation:
  * engineering primitive: reflector can propose eval cases and counterfactual
    risk scenarios from observed failures;
  * guardrail: simulated scenarios are eval candidates, not evidence.

Repo-truth inputs:

* `docs/KRN_KERNEL.md`
* `PLAN.md`
* current `GOAL.md`
* `docs/runs/2026-06-22-target-repo-init-connect/PROGRESS.md`
* `docs/runs/2026-06-22-target-repo-init-connect/HANDOFF.md`
* `docs/runs/2026-06-22-target-repo-init-connect/DECISIONS.md`
* `docs/runs/2026-06-22-target-repo-init-connect/VERIFICATION.md`
* DB schema and repository files for memory, source graph, retrieval,
  activation, harness runs, evidence, feedback, worker jobs, projects,
  repo installations, and project kernels
* CLI files for `plan`, `codex brief`, `evidence capture`, `doctor`, and any
  existing memory/source/retrieval commands
* tests and smokes that prove current memory, retrieval, activation, source
  graph, evidence, feedback, and worker-job behavior

Output one canonical document:

```txt
docs/plans/memory-ideal-state/GOAL.md
```

That document must include:

1. Source-to-decision mapping for each research input:
   source -> mechanism -> KRN implication -> adopt / reject / lab-test /
   defer -> falsifier.
2. Current state of the repo, based only on inspected code, tests, smokes, and
   run evidence.
3. Gap analysis between current state and the desired memory architecture.
4. Explicit missing components for:
   * event-sourced observation log;
   * observation source ranges;
   * temporal observation/reflection records;
   * source claims;
   * entity/claim graph edges;
   * memory candidates;
   * anti-memory candidates;
   * consensus/status ledger;
   * gap/abstention records;
   * offline reflector;
   * observation prefix selection;
   * activation integration;
   * raw evidence recall from every promoted observation;
   * review gates for memory promotion;
   * eval candidates for memory/context/source behavior.
5. What must remain out of scope:
   * automatic memory promotion;
   * runtime markdown memory;
   * `.krn` runtime truth;
   * chain-of-thought storage;
   * separate vector DB;
   * separate graph DB;
   * broad dashboard/API/MCP work unless explicitly planned later.
6. A complete next-goal backlog that can be executed slice by slice to make
   memory one of KRN's strongest product segments.
7. A current-state evidence table with one row per relevant package/file group:
   current behavior, proof file/test/smoke, missing research mechanism, and
   next implementation slice.
8. A strict vocabulary section that separates:
   * raw event;
   * observation;
   * reflection;
   * source claim;
   * memory candidate;
   * anti-memory candidate;
   * memory record;
   * eval candidate;
   * activation prefix;
   * raw evidence recall.

The backlog must be written as an implementation-ready goal, with slices for:

```txt
MM-00 — memory ideal-state ADR and source-to-decision ledger
MM-01 — observation/event-derived memory schema
MM-02 — observation repositories and typed mappers
MM-03 — deterministic observation input builder from run/source/tool/review events
MM-04 — manual `krn observe --run <id>` vertical slice
MM-05 — observation source-range recall from run events, source chunks, diffs,
        tool traces, and review feedback
MM-06 — offline reflector records and `krn reflect --scope <scope>`
MM-07 — MemoryCandidate / SourceClaim / AntiMemoryCandidate / EvalCandidate
        production gates
MM-08 — consensus/status ledger and contradiction handling
MM-09 — gap/abstention records as durable memory-context artifacts
MM-10 — observation prefix selector integrated with ActivationEngine
MM-11 — activation budget policy for stable prefix vs dynamic retrieval vs raw recall
MM-12 — evidence-capture observation bundle after Codex runs
MM-13 — memory application feedback and reconsolidation loop
MM-14 — anti-memory candidate review flow and stale-assumption invalidation
MM-15 — ProjectKernel identity continuity and project-scoped memory prefix
MM-16 — metacognitive run output: confidence, gaps, contradictions, raw evidence needed
MM-17 — salience/novelty/risk scoring without treating salience as truth
MM-18 — temporal stale-state detector and selective forgetting/pruning policy
MM-19 — reflection-generated eval candidates for memory/context/source behavior
MM-20 — dogfood evals for memory, anti-memory, contradiction, source range,
        and abstention behavior
MM-21 — doctor/readiness checks for observational memory
MM-22 — manual worker-job skeleton for observe/reflect tasks, no daemon runtime
MM-23 — optional learned memory-controller lab plan, only after MM eval data exists
MM-24 — full dogfood proof and anti-rot audit
```

Rules:

* Do not implement the full observational memory layer inside M27 unless it is
  already required by an earlier slice.
* Do not treat research materials as runtime context. Convert them into
  source-to-decision entries and executable backlog.
* Do not copy competitor architecture blindly. Extract mechanisms and map them
  to KRN's Postgres-backed brain store, source graph, activation engine,
  evidence loop, and review gates.
* Every adopted pattern needs a falsifier and at least one future test/smoke
  expectation.
* The plan must distinguish current facts, inferred gaps, rejected paths, and
  future implementation tasks.

Verification:

```bash
test -f docs/plans/memory-ideal-state/GOAL.md
rg "docs/materials/2026-06-22-big-brain.md" docs/plans/memory-ideal-state/GOAL.md
rg "docs/materials/2026-06-22-big-brain-part-2.md" docs/plans/memory-ideal-state/GOAL.md
rg "MM-00" docs/plans/memory-ideal-state/GOAL.md
rg "AntiMemoryCandidate" docs/plans/memory-ideal-state/GOAL.md
rg "Hippocampus|metacognition|predictive processing|global workspace" docs/plans/memory-ideal-state/GOAL.md
git diff --check
```

Completion definition for this goal update:

* `GOAL.md` itself must name both research files.
* `GOAL.md` must contain a current-state vs research matrix.
* `GOAL.md` must state what is present and missing in the repo today.
* `GOAL.md` must require `docs/plans/memory-ideal-state/GOAL.md` as the final
  canonical memory plan after M27.
* `GOAL.md` must include executable MM slices that cover the full ideal-memory
  path from observation schema through dogfood proof.
* `GOAL.md` must translate neuro/metacognitive/metaphysical inspiration into
  concrete KRN primitives and guardrails.
* `GOAL.md` must preserve M27 boundaries: no automatic memory promotion, no
  runtime markdown memory, no separate vector/graph DB, no broad dashboard/API
  work in this slice.

Commit:

`docs(plan): add memory ideal-state follow-up goal`

## Final output

Return:

Completed:

* ...

Commits:

* ...

Verification:

* ...

Target repo status:

* dry-run proven / unproven
* connect persistence proven / unproven
* project kernel persisted / unproven
* project-scoped plan proven / unproven
* project-scoped evidence capture proven / unproven
* cleanup proven / unproven

Residual blockers:

* ...

Not built:

* dashboard
* API
* MCP server
* broad workers runtime
* research layer
* runtime markdown memory
* separate vector/graph DB
* source crawler
* broad eval suite
* plugin package

Next safest action:

* one concrete action only

````

# Po M27

Jeśli M27 przejdzie, kolejność widzę tak:

```txt
M28 — init overlay apply mode for fixture repos only
M29 — policy/tool boundary hardening for generated overlays
M30 — real repo pilot: one non-KRN repo, dry-run only
M31 — real repo pilot: connect + plan + brief + evidence
M32 — worker execution v1: expire stale memory / embed placeholders / contradiction check
M33 — MCP server read-only prototype for KRN state
M34 — dashboard read-model prototype
````

Najważniejsze: **M27 jest ostatnim dużym krokiem przed wejściem na “real target repo”**. Jeżeli to przejdzie, KRN przestaje być narzędziem, które działa tylko na sobie.

[1]: https://developers.openai.com/codex/app/windows?utm_source=chatgpt.com "Windows – Codex app"
[2]: https://developers.openai.com/codex/app/features?utm_source=chatgpt.com "Features – Codex app"
