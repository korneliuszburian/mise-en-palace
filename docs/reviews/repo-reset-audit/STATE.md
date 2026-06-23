# Repo Reset Audit State

## Evidence Base Commit

- `e618c9b54ac675c5e80952661ed03320895a002f`
- `e618c9b docs(review): add repo reset audit goal`
- This is the repo commit audited before writing the docs-only audit artifacts.

## Current Branch / Status

- Branch observed: `main...origin/main`
- Current untracked audit/raw files:
  - `docs/materials/2026-06-22-big-brain.md`
  - `docs/materials/2026-06-22-big-brain-part-2.md`
  - `docs/reviews/repo-reset-audit/FULL_REPO_AUDIT.md`
  - `docs/reviews/repo-reset-audit/RAW_MATERIALS_LEDGER.md`
  - `docs/reviews/repo-reset-audit/REPAIR_PLAN.md`
  - `docs/reviews/repo-reset-audit/STATE.md`
  - `docs/reviews/repo-reset-audit/WRONG_ABSTRACTIONS.md`

## Files Read So Far

- `AGENTS.md`
- `docs/KRN_KERNEL.md`
- `GOAL_REPO_RESET_AUDIT.md`
- `README.md`
- `GOAL.md`
- `PLAN.md` major current-state/QG and architecture sections
- `REVIEW.md`
- `docs/plans/memory-ideal-state/GOAL.md`
- `docs/plans/memory-ideal-state/PLAN.md` major current-state/QG and
  memory/observation/reflection/activation/eval sections
- `docs/plans/memory-ideal-state/QG-00-REPO-INVENTORY.md`
- `docs/plans/memory-ideal-state/QG-04-SMELL-BLOAT-AUDIT.md`
- `docs/plans/memory-ideal-state/QG-04H-SMELL-SCAN-AUTOMATION-REQUIREMENTS.md`
- `docs/plans/memory-ideal-state/QG-05-PROMPTFOO-DECISION.md`
- `docs/standards/code-quality.md`
- `docs/standards/typescript-excellence.md`
- `docs/standards/code-vocabulary.md`
- `docs/standards/typescript-boundaries.md`
- `docs/materials/2026-06-22-big-brain.md`
- `docs/materials/2026-06-22-big-brain-part-2.md`
- repository file inventory from `git ls-files`
- package file inventory from `find packages -maxdepth 3 -type f`
- package source inventory and line-count scan across `packages/**/*.ts`
- primary package entrypoints and package manifests
- CLI parser/dispatcher and memory/source/db/audit command paths
- memory/source/observation/reflection/retrieval DB schemas and repositories
- activation, observation prefix, reflection input, golden/Promptfoo, Codex
  adapter, worker skeleton, and package export surfaces
- retrieval repository, retrieval/activation smoke surfaces, DB smoke command
  routing
- repo-level handoff docs targeted QG-05/QG-06 drift scan

## Files Not Fully Reread / Explicitly Marked Non-Blocking

The reset-audit decision does not claim a literal line-by-line reread of every
tracked file. These areas were inspected through inventory, targeted reads, and
verification, then marked non-blocking for this read-only architecture decision:

- Full top-to-bottom reread of very large root `PLAN.md` and
  `docs/plans/memory-ideal-state/PLAN.md`: targeted current-state, QG, memory,
  observation, reflection, activation, and eval sections were read. The
  architecture decision depends on those active sections, not on re-copying the
  entire historical narrative.
- Remaining test files: representative tests for the suspect abstractions were
  inspected where they affected findings; the full test suite was run. Tests
  are verification evidence here, not standalone architecture sources.
- Remaining smoke implementations beyond retrieval/activation and CLI routing:
  the relevant smoke surfaces were inspected to classify them as dev/internal
  proof paths. Live Postgres DB truth was not claimed because DB env was
  unavailable; this is separate from the implemented `@krn/db` package and its
  passing tests.
- Historical run ledgers under `docs/runs/**`: these are proof history, not
  current architecture authority. Current-state drift was checked through
  README, GOAL, PLAN, memory-plan, QG, and handoff surfaces.

## Current Package-by-Package Understanding

Complete for this reset-audit decision:

- `krn audit` implementation was inspected through:
  - `packages/cli/src/runAuditCommand.ts`
  - `packages/cli/src/runAuditCommand.test.ts`
  - `packages/harness/src/audit/auditChecks.ts`
  - `packages/harness/src/audit/auditChecks.test.ts`
  - `packages/core/src/auditBundle.ts`
  - `packages/schema/src/auditBundle.ts`
  - `packages/db/src/repositories/DrizzleAuditBundleRepository.ts`
- Current implementation is a deterministic file/slice/semantic-snapshot guard.
  It is not and should not be treated as architecture review or a product
  quality engine.
- Current CLI snapshot collection excludes tests and fixtures, while QG-04H
  claims future QG-06 smell scans should include tests and fixtures. That is a
  concrete mismatch, but the larger correction is to deproductize or delete
  QG-06 rather than expand it by default.
- `packages/core` mostly owns real domain contracts. Main debt is broad
  metadata fields where repeated behavior keys have started to matter.
- `packages/schema` is mostly correct unknown-first IO validation. It must not
  make fixture parsing look like behavior proof.
- `packages/db` contains real Postgres schemas/repositories, but broad exports
  expose repositories, schemas, readiness and smoke utilities as package root
  surface. DB implementation exists; live DB readiness/smoke proof was skipped
  only because `KRN_DATABASE_URL` was not present in this shell.
- `packages/harness` contains the right core mechanisms: activation,
  observation prefix, reflection selector/reports, golden runner, and
  MemoryReviewGate. Main debts: broad exports, audit-as-quality framing, and
  metadata-governed activation/reflection behavior.
- `packages/cli` is useful but too broad: operator workflows, internal DB
  smokes, audit guards, source/memory primitives, evidence/review, observe,
  reflect, and Codex brief are one surface.
- `packages/codex-adapter` is mostly sound and renders `doesNotProve`, stop
  conditions, evidence contracts, inclusions/exclusions, and rollback
  expectations.
- `packages/workers` is skeleton only: typed enqueue/outbox job contracts, no
  background loop.

Package fitness for implementation repair still requires targeted rereads per
repair slice. This audit is sufficient to decide direction, not to authorize
source changes.

## Raw-Material Mechanisms Extracted So Far

- Temporal/source-linked memory beyond chunk retrieval.
- Observations as source-ranged staging, not Memory Core.
- Reflection/offline consolidation as candidate/gap/contradiction generation,
  not truth mutation.
- Gap/abstention behavior as product behavior.
- Anti-memory as first-class blocking behavior.
- Eval runners as adapters, not truth.
- Anti-slop as general engineering discipline, not KRN product subsystem.

## Confirmed Bad Assumptions

- Productizing "anti-slop" as a KRN audit/quality subsystem is the wrong
  direction. The user wanted an anti-slop audit against explicit engineering
  standards, not a reusable KRN anti-slop auditing layer.
- `README.md` current Promptfoo status is stale relative to current `GOAL.md`,
  root `PLAN.md`, memory `GOAL.md`, and
  `docs/plans/memory-ideal-state/QG-05-PROMPTFOO-DECISION.md`.
- Current `krn audit` scope does not satisfy QG-04H's future QG-06 scope
  requirements, but that mismatch should not be answered by blindly expanding
  `krn audit`.
- `tests/fixtures/promptfoo/krn-golden-smoke-provider.mjs` returns
  `status=passed` deterministically; Promptfoo smoke proves integration, not
  memory behavior.
- `SourceClaim` project selection in reflection currently uses
  `sourceClaim.metadata.projectId`, which is behavior-governing metadata.
- Activation/retrieval use metadata keys such as `sourceClaimId`,
  `memoryRecordId`, `antiMemoryRecordId`, `searchDocumentId`,
  `observationPrefix`, and `activationAbstention` for behavior/read-model
  semantics.
- CLI and package barrels expose internals too broadly.
- Memory promotion is guarded in CLI by MemoryReviewGate, but repository
  interfaces still expose lower-level Memory Core write/promotion methods.

## Resolved Suspect Areas

From `GOAL_REPO_RESET_AUDIT.md`, the suspect areas resolve as follows:

- `krn audit`: confirmed wrong as product/quality direction; may survive only
  as narrow mechanical guard.
- QG-04H / QG-06 smell-scan automation framing: confirmed wrong as product
  direction; reduce/delete.
- AuditBundle: keep as evidence container, not review authority.
- GoldenTask / Promptfoo: keep bounded; current smoke is integration proof only.
- Observation / Reflection / AntiMemory / Activation: mostly valid KRN
  mechanisms when kept in their precise authority.
- CLI public operator surface: confirmed too broad.
- stale root plans and handoffs: README drift confirmed; other current-state
  docs/handoff drift also confirmed around QG-05/QG-06.

## Questions Resolved For This Audit

- `krn audit` is a bounded diagnostic in code but is framed too strongly in
  docs/plans; repair must deproductize or delete that authority.
- Memory, observation, reflection, source decisions, candidates, and truth
  records are mostly separated by real invariants, but Memory Core write
  authority and behavior-governing metadata still need tightening.
- Official Promptfoo is now a bounded eval runner/result adapter; current local
  smoke is only integration proof.
- Current docs do not have one clean truth surface; R-10 must reconcile README,
  GOAL, PLAN, memory plan, QG docs, and handoff state.

## Architecture Decisions For Repair

- `krn audit`: deproductize or delete. Only a narrow mechanical guard may
  survive after audit and user approval.
- QG-04H/QG-06: reject as product direction; reduce to specific deterministic
  guards only if they protect concrete recurring defects.
- GoldenTask/Promptfoo: keep as bounded eval lane; state clearly that current
  Promptfoo smoke is not behavior proof.
- Observation/reflection: keep as staging/candidate/reporting mechanisms; no
  brain-magic or Memory Core mutation.
- MemoryReviewGate: keep and strengthen; seal low-level Memory Core write
  authority.
- Activation/source/memory metadata: repair known behavior-governing metadata
  directly instead of building generic metadata scanner product.
- No implementation repair authorized or started.

## Completion Audit

- Required artifacts exist: `STATE.md`, `FULL_REPO_AUDIT.md`,
  `RAW_MATERIALS_LEDGER.md`, `WRONG_ABSTRACTIONS.md`, and `REPAIR_PLAN.md`.
- Both raw research files were mapped through source -> mechanism -> KRN
  implication -> decision/rejection -> falsifier.
- Every named suspect abstraction from the goal is evaluated with keep, delete,
  rename, reduce, or harden direction.
- `krn audit` / QG-06 / productized anti-slop is explicitly identified as the
  central wrong abstraction.
- No implementation files were changed during the audit phase.
- DB runtime truth is not claimed because `KRN_DATABASE_URL` was not configured
  and DB readiness/smoke commands were not run. This is not a claim that the DB
  package is unimplemented.

## Commands Already Run

- `pwd` -> `/home/krn/coding/krn/active/mise-en-palace`
- `git status --short --branch` -> `## main...origin/main` plus the two untracked raw material files
- `ls -la` -> confirmed root shape and existing audit goal file
- `sed -n '1,260p' docs/KRN_KERNEL.md` -> read kernel contract
- `sed -n '1,260p' GOAL_REPO_RESET_AUDIT.md` and `sed -n '261,560p' GOAL_REPO_RESET_AUDIT.md` -> read full audit goal
- `sed -n '1,260p' PLAN.md` -> read current-state addendum and beginning of root plan
- `git rev-parse HEAD` -> `e618c9b54ac675c5e80952661ed03320895a002f`
- `git log --oneline -20` -> latest reset-audit and QG commits recorded
- `git ls-files` -> tracked-file inventory captured in terminal output
- `find packages -maxdepth 3 -type f | sort` -> package inventory captured in terminal output
- `rg -n "Promptfoo|promptfoo|QG-05" ...` -> confirmed README Promptfoo drift
- `rg -n "isExcludedPath|docs/materials|\\.test\\.ts|fixtures|placeholder|Large-File|metadata|runAuditChecks|runTypeSafetyAudit|runBoundaryAudit" ...` -> confirmed QG-04H/current-audit scope mismatch evidence
- `find packages -type f -name '*.ts' | ...` -> package TS file counts:
  cli 70, codex-adapter 10, core 39, db 71, harness 55, schema 16, workers 4.
- `find packages -type f -name '*.ts' -print0 | xargs -0 wc -l | sort -nr | head -80`
  -> 47,606 package TS lines; largest files include
  `packages/cli/src/runCli.test.ts` 3872,
  `packages/harness/src/audit/auditChecks.ts` 971,
  `packages/db/src/repositories/DrizzleObservationRepository.ts` 943,
  `packages/schema/src/index.test.ts` 915,
  `packages/harness/src/activation/index.test.ts` 805,
  `packages/cli/src/doctorDbChecks.ts` 783,
  `packages/cli/src/doctorReadiness.ts` 734.
- `sed` reads of source/memory/observation/reflection/activation/golden/Codex
  adapter/worker/package export files captured evidence for the updated audit
  artifacts.
- `find docs ... handoff` and `rg ... docs/handoff README.md GOAL.md PLAN.md`
  -> confirmed handoff docs still contain stale Promptfoo/QG-06 continuation
  claims.
- `sed` reads of `DrizzleRetrievalRepository.ts`,
  `retrievalSubstrateSmoke.ts`, `activationSmoke.ts`, and
  `runDbSmokeCommand.ts` -> confirmed retrieval has real typed substrate while
  DB smokes remain dev/internal proof paths.
- `git status --short --branch` -> `## main...origin/main` with only untracked
  raw material files and `docs/reviews/`.
- `git log --oneline -20` -> latest commit
  `e618c9b docs(review): add repo reset audit goal`, followed by QG-05 and
  QG-04H commits.
- `git diff --check` -> passed.
- `pnpm exec promptfoo --version` -> `0.121.17` after Node experimental warning.
- `pnpm typecheck` -> passed across 7 workspace package scopes.
- `pnpm test` -> passed across workspace packages:
  core 8 files / 39 tests, schema 3 / 25, harness 15 / 81, workers 1 / 3,
  codex-adapter 3 / 7, db 24 / 67, cli 24 / 140.
- `pnpm eval:promptfoo:smoke` -> passed 2/2 Promptfoo smoke cases and wrote
  `.local-lab/promptfoo/krn-golden-smoke-results.jsonl`; interpretation is
  integration smoke only, not memory behavior proof.
- `printenv KRN_DATABASE_URL` -> not configured, so DB readiness/smoke commands
  were not run in this shell.
- memory quick pass:
  `/home/krn/.codex/memories/MEMORY.md` lines 83-111 and rollout summaries
  `2026-06-22T14-00-15-hlPq-read_only_big_brain_architecture_analysis.md`
  and
  `2026-06-22T11-46-53-meta-krn_memory_brain_architecture_analysis.md`
  used only as stale-aware routing context; live repo evidence is primary.

## Next Exact Action After Artifact Commit

1. Present audit outcome to the operator.
2. Do not implement repair work until the operator chooses a repair slice.
3. If repair is approved, start from R-00/R-02/R-10 docs deproductization
   before touching package source.

## What To Read First After Context Loss

1. `docs/reviews/repo-reset-audit/STATE.md`
2. `GOAL_REPO_RESET_AUDIT.md`
3. `docs/KRN_KERNEL.md`
4. `git status --short --branch`
