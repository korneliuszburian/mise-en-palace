# Full Repo Reset Audit

Status: verified read-only architecture reset audit.

This is ready for operator decision on repair direction. It does not authorize
implementation repair. Scope boundaries and unread/non-blocking files are
recorded in `STATE.md`.

## Executive Verdict

Verdict: architecture is valuable, but the repo is at a boundary where it can
turn into its own fake control plane if the next step is more meta-tooling.

KRN is not empty theater. The current code contains a real typed/Postgres-backed
spine for memory, source grounding, observation staging, reflection records,
activation, evidence capture, Codex brief rendering, and guarded memory
promotion.

The problem is different: docs and public surfaces are beginning to promote
internal diagnostics, smokes, and quality-gate plans into product direction.
That is exactly the wrong path. The repair should preserve the spine and cut
back misleading public authority.

## Current Architecture Map

Observed from `docs/KRN_KERNEL.md`, root `PLAN.md`,
`docs/plans/memory-ideal-state/PLAN.md`, and the package inventory:

- `packages/core`: pure domain contracts, including AuditBundle and memory /
  source / observation / reflection terms.
- `packages/schema`: Zod IO parsing.
- `packages/db`: Drizzle/Postgres schemas, repositories, migrations, smokes.
- `packages/harness`: activation, compiler, audit checks, golden behavior,
  observation/reflection selection, review gates.
- `packages/cli`: terminal/env/fs command adapters, including `krn audit`.
- `packages/codex-adapter`: Codex-facing renderers.
- `packages/workers`: bounded worker job contracts.

This map has now been validated across the primary package entrypoints,
schemas, repositories, CLI parser/dispatcher, activation/observation/reflection
paths, Promptfoo/golden paths, Codex adapter, worker skeletons, and the
read-only verification commands. Remaining unread historical/test/smoke files
are recorded in `STATE.md` with reasons they are non-blocking for this
architecture decision.

## Findings

### Critical: `krn audit` Is Becoming A KRN-Branded Quality Layer

Evidence:

- `GOAL_REPO_RESET_AUDIT.md` explicitly says anti-slop is not a KRN product
  feature and forbids solving quality by building a new audit layer, quality
  engine, smell-scanner product, or meta-system.
- `docs/plans/memory-ideal-state/PLAN.md` frames QG-06 as "quality gate
  automation in `krn audit`" and blocks feature work behind expanding that
  surface.
- `docs/plans/memory-ideal-state/QG-04H-SMELL-SCAN-AUTOMATION-REQUIREMENTS.md`
  defines placeholder vocabulary scans, duplicate helper scans, large-file
  thresholds, behavior-governing metadata scans, export/dead-code scans, and
  stale-doc scans as QG-06 audit categories.
- `packages/cli/src/runAuditCommand.ts` and
  `packages/harness/src/audit/auditChecks.ts` implement a real deterministic
  audit command/check layer, so this is not only prose.

Why it matters:

This is the exact paradox the reset audit is meant to catch. Quality concerns
are general software engineering discipline. Turning each concern into a
KRN-branded audit product creates a self-licking meta-system: today
`krn audit`, tomorrow a new layer for comments, frontend fact stripping, naming
cleanup, or any other ordinary code-review concern.

The issue is not that mechanical checks are useless. The issue is authority.
Mechanical guards can catch repeated defects; they cannot become KRN's answer
to architecture quality.

What proves it:

The current plan language treats QG-06 as a blocking product direction, while
the reset goal explicitly rejects "anti-slop subsystem" thinking.

What would falsify it:

If the repo deproductizes this surface: QG-06 stops being product direction,
`krn audit` is renamed/reframed as a narrow mechanical guard or deleted, and
quality remains owned by architecture, TypeScript boundaries, behavior tests,
and review.

### Critical: Public Surface Makes Internals Look Like Product

Evidence:

- `packages/cli/src/parseArgs.ts` exposes commands for `init`, `plan`,
  `doctor`, `audit`, DB readiness/smokes, source claim add/reject/link, memory
  candidate add/promote/reject, memory record apply, anti-memory add, evidence
  capture, review assess, observe, reflect, and Codex brief.
- `packages/cli/src/parseDbArgs.ts` exposes many smoke targets directly:
  harness plan/evidence, source graph, memory governance, retrieval substrate,
  activation, Codex adapter, workers, init/connect, and target repo harness.
- `packages/db/src/index.ts` exports readiness checks, smoke paths,
  repositories, and schema from the package root.
- `packages/harness/src/index.ts` exports audit, activation, golden,
  repositories, memory gate, observations, and reflection from one broad barrel.
- `packages/cli/src/index.ts` exports command implementations and parser types.

Why it matters:

This is how a prototype becomes a fake platform. The repo currently has useful
mechanisms, but the package and CLI surfaces do not clearly distinguish:

- operator workflows;
- internal developer smokes;
- repository ports/adapters;
- one-off audit guards;
- future product behavior.

The result is that a fresh agent can mistake exposed internals for the intended
KRN user experience.

What proves it:

The broad package barrels and CLI parser make internal smokes/repositories part
of the easy import/command surface.

What would falsify it:

The public CLI is reduced to a small operator workflow, dev-only smokes are
hidden or explicitly namespaced, and package barrels stop exporting internals as
the default API.

### Important: Promptfoo Smoke Proves Integration, Not Behavior

Evidence:

- `package.json` defines `eval:promptfoo:smoke` against
  `tests/fixtures/promptfoo/krn-golden-smoke.yaml`.
- `tests/fixtures/promptfoo/krn-golden-smoke-provider.mjs` returns output that
  includes `status=passed` for the provided `caseId`.
- `packages/harness/src/goldenPromptfooExport.ts` marks snapshot exports as
  `doesNotExecuteModel: true`, `snapshotOnly: true`, and
  `promptfooDependency: "not_required"`.
- `packages/harness/src/goldenPromptfooResult.ts` safely maps Promptfoo JSONL
  rows into `GoldenBehaviorProof` objects, but it trusts supplied Promptfoo
  success rows as proof inputs.

Why it matters:

This lane is acceptable as a bounded integration smoke and result adapter. It is
not proof that memory, activation, observation, or anti-memory behavior works.
The current local smoke provider is intentionally deterministic and
self-passing.

What proves it:

The provider output is constructed from input vars and emits `status=passed`;
no KRN memory behavior is executed by that fixture.

What would falsify it:

A golden eval lane that runs real KRN behavior proofs, maps results back to
case IDs, fails on behavior regressions, and still keeps `GoldenTask`/KRN proof
objects canonical over Promptfoo.

### Important: Behavior-Governing Metadata Is Still Too Strong

Evidence:

- `packages/harness/src/reflection/reflectionInputSelector.ts` scopes
  `SourceClaim` by `sourceClaim.metadata.projectId === projectId`, while
  source claims are not first-class project-scoped in the core `SourceClaim`
  model.
- `packages/harness/src/activation/rankCandidates.ts` deduplicates candidates
  by metadata keys such as `sourceClaimId` and `memoryRecordId`.
- `packages/harness/src/activation/activationEngine.ts` reads
  `searchDocumentId` from candidate metadata and stores raw evidence recall
  requirements in activation decision metadata.
- `packages/harness/src/activation/assembleContext.ts` stores
  `observationPrefix`, `observationPrefixGate`, and `activationAbstention` in
  `ContextAssembly.metadata`.
- QG-04H already lists several of these as accepted metadata debt.

Why it matters:

Metadata is fine for debug/audit payloads. It is not fine when it decides
cross-project isolation, deduplication identity, activation behavior, or
governance state. These are product semantics and need typed fields or explicit
read models.

What proves it:

Current behavior branches and selectors read those metadata keys directly.

What would falsify it:

Project scoping, linked subject identity, activation abstention, observation
prefix gates, and raw recall triggers move to typed models/read models, leaving
metadata as non-authoritative evidence payload.

### Important: Memory Promotion Is Guarded In CLI But Not Sealed As Architecture

Evidence:

- `packages/cli/src/runMemoryCandidateReviewCommand.ts` requires
  `--evidence-reviewed-ref` for persisted promotion and calls
  `promoteMemoryCandidateThroughGate`.
- `packages/harness/src/memory/memoryReviewGate.ts` checks review input,
  candidate status, source lineage, application guidance, confidence, temporal
  invalidation rule, and source-claim existence.
- `packages/harness/src/repositories/memoryRepository.ts` still exposes
  `createMemoryRecord` and `promoteMemoryCandidate` on the public repository
  interface.
- `packages/db/src/repositories/DrizzleMemoryRepository.ts` implements those
  low-level writes directly.

Why it matters:

The operator CLI path is correctly guarded, but the package contract still makes
the bypass path easy to import. This is not a runtime exploit claim; it is an
architecture authority problem.

What proves it:

The low-level repository methods are exported through harness/db package
barrels and can be used outside the gate by any package that imports them.

What would falsify it:

Memory Core write methods become internal adapter details, or the public port
only exposes gate-owned promotion/write paths.

### Important: Observation And Reflection Are Valid Staging Layers, Not A Brain

Evidence:

- `packages/core/src/observations/*` models observation scope, temporal scope,
  source ranges, kinds, policy, and validation.
- `packages/db/src/repositories/DrizzleObservationRepository.ts` enforces source
  ranges and typed evidence linkage for truth-bearing observations.
- `packages/cli/src/runObserveCommand.ts` writes observation groups/items only
  and explicitly prints `Memory mutation: none` and `MemoryRecord created: no`.
- `packages/core/src/reflection/index.ts` enforces candidate-only reflection
  output contracts and reports gaps/contradictions.
- `packages/cli/src/runReflectCommand.ts` persists a `ReflectionRecord` only,
  prints `Candidate rows written: no`, `Memory mutation: none`, and
  `MemoryRecord created: no`.

Why it matters:

These layers are not the same category as QG-06. They encode real product
semantics from the kernel thesis: evidence becomes staged observations;
reflection reports gaps and candidate proposals; Memory Core remains gated.

The danger is naming and surface authority. If docs call this a "living brain"
or imply automated consolidation, the implementation does not support that yet.

What proves it:

The current observe/reflect paths are deterministic, explicit, and non-mutating
with respect to Memory Core.

What would falsify it:

Observation or reflection paths create/promote MemoryRecord, SourceDecision, or
Eval truth without a review gate.

### Important: Worker Jobs Are A Skeleton, Not Maintenance Runtime

Evidence:

- `packages/workers/src/jobTypes.ts` defines maintenance job contracts for
  embedding, compacting memory, detecting contradiction, expiring stale memory,
  and promoting eval candidates.
- `describeMaintenanceJob` returns `requiresBackgroundLoop: false`.
- `packages/workers/src/enqueueMaintenanceJob.ts` only enqueues worker job and
  outbox records through provided repositories.

Why it matters:

This is acceptable as a bounded contract. It must not be described as offline
consolidation, autonomous reflection, or a running maintenance system.

What would falsify it:

Docs and CLI help consistently state that worker execution is not built, or a
future implementation adds explicit runtime worker behavior with evidence.

### Important: README Current State Is Stale

Evidence:

- `README.md:35` says Promptfoo-compatible snapshot export exists but official
  Promptfoo integration is not adopted or rejected yet.
- `README.md:47` lists official Promptfoo runner/adapter decision and
  integration as not built.
- `README.md:71` says QG-05 still decides official Promptfoo integration.
- `docs/plans/memory-ideal-state/QG-05-PROMPTFOO-DECISION.md:8` adopts official
  Promptfoo as a bounded eval-lane runner and result adapter.
- `docs/plans/memory-ideal-state/QG-05-PROMPTFOO-DECISION.md:96-100` names the
  dependency, fixture config, local provider, command, and result bridge.
- `GOAL.md:169` and `PLAN.md:167` also say QG-05 adopted official Promptfoo.

Why it matters:

`README.md` is a first-read surface. A fresh agent using it as current truth
would route the next step toward a completed decision instead of auditing or
repairing the current state.

What proves it:

The conflicting current-state claims are present in the files above.

What would falsify it:

If QG-05 adoption was reverted or demoted in current plan files, or README was
updated to reflect QG-05 as adopted but bounded.

### Important: Handoff Docs Also Carry Stale Current-State Instructions

Evidence:

- `docs/handoff/blockers.md` still says the Promptfoo snapshot export must not
  be treated as final eval integration until QG-05 adopts or rejects official
  Promptfoo.
- `docs/handoff/progress.md` says QG-05 adopts official Promptfoo as a bounded
  eval-lane runner and result adapter.
- `docs/handoff/progress.md` and `docs/handoff/handoff.md` still present QG-06
  / `krn audit` quality gate automation as the next queued step.
- `docs/handoff/verification.md` records QG-05 Promptfoo smoke as passed and
  QG-06 as remaining next.

Why it matters:

The repo has more than one "current state" surface. A future agent can follow
README, GOAL, PLAN, handoff, or memory PLAN and get subtly different next-step
instructions. That is context selection failure before KRN even runs.

What proves it:

The handoff docs disagree about QG-05 status and still route continuation into
the QG-06 audit automation direction rejected by this reset audit.

What would falsify it:

There is one named canonical current-state surface, historical handoffs are
marked as historical/proof ledgers, and active handoff docs no longer route
repair into productized anti-slop automation.

### Important: `krn audit` Does Not Yet Match QG-04H Scope

Evidence:

- `docs/plans/memory-ideal-state/QG-04H-SMELL-SCAN-AUTOMATION-REQUIREMENTS.md:35-37`
  requires QG-06 smell scans to include colocated tests and shared fixtures,
  while excluding only `docs/materials/**` as raw quarry.
- `packages/cli/src/runAuditCommand.ts:122-135` excludes `docs/materials/`,
  `*.test.ts`, `*.spec.ts`, `__tests__`, and `/fixtures/` from repo snapshots.
- `docs/plans/memory-ideal-state/QG-04H-SMELL-SCAN-AUTOMATION-REQUIREMENTS.md:122`
  requires large-file thresholds.
- `docs/plans/memory-ideal-state/QG-04H-SMELL-SCAN-AUTOMATION-REQUIREMENTS.md:165-220`
  requires behavior-governing metadata findings and accepted debt expiry.
- `packages/harness/src/audit/auditChecks.ts:961-969` wires current checks for
  repo surface, architecture drift, boundary, type safety, memory semantics,
  source grounding, eval theater, slice evidence, and handoff only.
- `packages/cli/src/runAuditCommand.test.ts` seeds forbidden surface, package
  boundary, AuditBundle, semantic snapshot, warning gate, and handoff tests,
  but no QG-04H seeded large-file, placeholder, duplicate-helper, or
  behavior-governing metadata tests were observed.

Why it matters:

Even if the narrow guard survives, current `krn audit` cannot satisfy QG-04H by
only flipping a flag; its snapshot scope and test coverage currently skip
entire categories QG-04H says must be scanned.

This is secondary to the more important decision: do not implement broad QG-06
automation just because the plan queued it.

What proves it:

The CLI snapshot filter excludes tests/fixtures and the harness check dispatcher
does not include QG-04H category functions.

What would falsify it:

Implementation of QG-06 changes the snapshot model to include scoped tests and
fixtures, adds seeded tests for QG-04H categories, and exposes those findings
through the existing `krn audit repo/slice` surface.

### Minor: `REVIEW.md` Is Historical, Not Current Truth

Evidence:

- `REVIEW.md` opens by saying it is historical review-request material and not
  the current repo status source.
- It points to README, GOAL, root PLAN, memory PLAN, and QG-00 for current state.

Why it matters:

The reset audit can use `REVIEW.md` as evidence of prior external-review
framing, but not as authoritative package status.

What would falsify it:

No falsifier needed unless a later edit re-promotes `REVIEW.md` as current
status.

## Package Findings

### `packages/core`

Mostly sound. It owns domain vocabulary for memory, source, observation,
reflection, activation, golden tasks, evidence, and Codex adapter references.

Main risk: core contains broad `metadata: Record<string, unknown>` fields across
many records. That is acceptable for evidence/debug payloads, but repeated
behavior-governing keys must move out of metadata.

### `packages/schema`

Mostly sound. It validates IO with Zod and rejects private reasoning metadata
for observation/golden surfaces.

Main risk: schema coverage can make bad abstractions feel safe. Parsing
`GoldenTask` fixtures or observation rows does not itself prove behavior.

### `packages/db`

Real persistence exists. Memory/source/observation/reflection/retrieval schemas
and repositories enforce several meaningful invariants.

Main risks:

- root package exports smokes/readiness/repos/schema too broadly;
- memory write authority is still exposed at repository level;
- several large repository/smoke files are carrying too much responsibility.

Verification boundary: the DB package code and tests passed in this audit. Live
Postgres readiness/smoke commands were not run because this shell did not expose
`KRN_DATABASE_URL`.

### `packages/harness`

This is the strongest package conceptually: activation, observation prefix,
reflection selector/reports, audit checks, golden runner, and MemoryReviewGate
belong here.

Main risks:

- broad package barrel exports too much;
- behavior-governing metadata is used in activation/reflection;
- `audit` lives beside real harness logic and can be overread as a product
  quality authority.

### `packages/cli`

The CLI is useful but too broad. Preview-by-default and explicit `--persist`
are good. The problem is command taxonomy: operator workflows, DB smokes,
internal source/memory primitives, audit guards, and Codex rendering are all
one public surface.

Main risks:

- `runCli.ts` and `parseArgs.ts` are large dispatchers;
- smoke/dev commands look like product commands;
- granular memory/source commands expose internals instead of a small governed
  review workflow.

### `packages/codex-adapter`

Mostly sound. It renders context inclusions/exclusions, evidence contracts,
skill hints, stop conditions, rollback expectation, and `doesNotProve`.

Main risk: it can only be as honest as upstream `ContextAssembly` and evidence
contracts. It must not add hidden runtime semantics.

### `packages/workers`

Skeleton only. Keep as typed job contracts and enqueue behavior. Do not present
as running background maintenance.

## Docs / Plan Consistency Findings

Current confirmed drift:

- README Promptfoo status is stale relative to QG-05 adoption.
- Root/current-state plans and memory-plan QG sections still route continuation
  toward QG-06 / `krn audit` quality gate automation.
- Handoff docs preserve useful proof history, but still present stale QG-05 and
  QG-06 next-step language in different places.

Decision:

Repair docs by naming one current-state truth surface and demoting historical
handoff/run material to proof ledgers. Do not create another parallel plan.

## TypeScript / Code Quality Findings

Strict TypeScript boundaries are directionally strong: schema parsing uses Zod,
external rows/results are validated before use, and the suite passes
typecheck. The architecture debt is not "lack of TS"; it is where behavior
authority is hidden in broad metadata or public barrels.

Confirmed code-quality risks:

- behavior-governing metadata keys in activation/reflection;
- broad package exports that make internals look public;
- large dispatcher/repository/test files carrying too much responsibility;
- mechanical `krn audit` checks being overread as software-quality authority.

Decision:

Fix the known boundaries directly in repair slices. Do not answer this with a
generic metadata scanner or broader quality subsystem.

## Memory / Governance Findings

Current memory/source/observation architecture is directionally right:

- Memory Core has lineage, confidence, owner, guidance, validity, invalidation,
  and feedback counters.
- Memory candidates are separate from active records.
- CLI promotion goes through MemoryReviewGate.
- SourceClaim requires mechanism, implication, does-not-prove, trust, consumer,
  and falsifier.
- Source rejections are first-class.
- Observation staging is source-ranged and non-mutating.
- Reflection persists records and reports gaps/contradictions without mutating
  Memory Core.

The biggest governance gap is package authority, not missing tables:

- low-level Memory Core writes are still public repository methods;
- project scoping for `SourceClaim` sometimes relies on metadata;
- activation identity/dedup uses metadata keys for linked subjects.

## Eval / Promptfoo Findings

Current decision: keep GoldenTask/Promptfoo only as a bounded eval lane.
`GoldenTask` is a KRN-owned contract. Promptfoo is an external runner/result
adapter. The local smoke proves the runner path, not KRN behavior quality.

## CLI / Operator-Surface Findings

`krn audit` is real command code, not only docs, but current code is a bounded
snapshot scanner and semantic snapshot consumer. It must be deproductized,
reduced to a mechanical guard, renamed, or removed. It is not a replacement for
engineering review.

Current public-surface split recommendation:

- public operator: `init/connect`, `doctor`, `plan`, `codex brief`, evidence
  capture/review, observe/reflect as explicit staging commands;
- developer/internal: DB smokes/readiness, audit guard details, repository
  smoke targets;
- governed admin: memory/source review commands, ideally behind a smaller
  review workflow instead of many primitive commands.

## Verification

Passed:

- `git status --short --branch`
- `git log --oneline -20`
- `git diff --check`
- `pnpm exec promptfoo --version` -> `0.121.17`
- `pnpm typecheck`
- `pnpm test`
- `pnpm eval:promptfoo:smoke` -> 2 passed, 0 failed, JSONL written under
  `.local-lab/promptfoo/krn-golden-smoke-results.jsonl`

Not run:

- live Postgres DB readiness/smokes, because `KRN_DATABASE_URL` was not
  configured in this shell. This does not mean the DB package is missing; DB
  package tests passed, but live runtime truth was not claimed.

Important interpretation:

The Promptfoo smoke passing is integration proof only. It does not falsify the
finding that the current smoke provider is deterministic and self-passing.
