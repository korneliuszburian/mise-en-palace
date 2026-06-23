# KRN Canonical Reset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` for independent read-heavy audit
> passes, or `superpowers:executing-plans` for inline implementation. Execute
> this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reset KRN from plan-sprawl and productized audit authority into one
canonical, truthful Memory Brain kernel around Codex.

**Architecture:** Preserve the real typed/Postgres-backed spine and remove false
authority from docs and public surfaces before feature work. KRN remains one
operating layer around Codex: bounded context, source-grounded memory, policy,
skills, eval expectations, traces, review gates, and feedback.

**Tech Stack:** pnpm workspace, strict TypeScript, Zod IO schemas,
Drizzle/Postgres/pgvector, Vitest, Promptfoo as bounded eval runner/result
adapter, Codex-facing adapter surfaces.

---

## Source Decision Ledger

source_id: `docs/materials/20206-06-23-audit.md`
trust_tier: medium as user-provided strategic audit, low as implementation
truth until checked against live repo.
mechanism: replace active root `GOAL.md` and root `PLAN.md` instead of appending
another addendum to the old memory plan.
krn_implication: active context must have one canonical execution truth; old
plans become historical quarry.
decision: adopt.
does_not_prove: package source is correct or that old docs can be deleted.
consumer: `GOAL.md`, `PLAN.md`, docs-current-truth reset slices.
falsifier: executor still routes next work through
`docs/plans/memory-ideal-state/PLAN.md` as active truth.

source_id: `docs/reviews/repo-reset-audit/FULL_REPO_AUDIT.md`
trust_tier: high repo-local audit evidence.
mechanism: preserve the real typed/Postgres-backed spine while cutting
misleading public authority around diagnostics, smokes, and quality gates.
krn_implication: repair docs/surfaces first, then harden memory/source/
activation invariants.
decision: adopt.
does_not_prove: DB runtime is available in every shell.
consumer: package verdicts, task queue, verification boundaries.
falsifier: future docs describe smokes or audit results as product proof.

source_id: `docs/reviews/repo-reset-audit/WRONG_ABSTRACTIONS.md`
trust_tier: high repo-local abstraction decision record.
mechanism: `krn audit` may survive only as a narrow internal mechanical guard;
QG-06/productized anti-slop is rejected as product direction.
krn_implication: general engineering quality belongs to architecture, types,
tests, naming, and review, not a KRN-branded subsystem.
decision: adopt.
does_not_prove: all current audit checks should be deleted.
consumer: docs cleanup, CLI taxonomy, future `krn audit` decision.
falsifier: `krn audit` becomes the next product feature or quality engine.

source_id: `docs/STATE_OF_THE_ART.md`
trust_tier: medium doctrine, must yield to live repo and reset audit.
mechanism: KRN is one operating brain around Codex; subagents, skills, MCP,
hooks, evals, and dashboard are organs, not the brain.
krn_implication: do not build a generic agent zoo or dashboard-first app.
decision: adopt.
does_not_prove: any particular current package boundary is correct.
consumer: non-goals, architecture laws.
falsifier: implementation creates runtime agent taxonomy before the harness
spine is proven.

## Purpose / Big Picture

KRN exists to make Codex work continuous, source-grounded, reviewable, and less
vulnerable to stale or noisy context.

The repo is not empty. It already contains real code for memory/source
contracts, DB-backed repositories, observation/reflection staging, activation,
evidence capture, Codex brief rendering, guarded memory review, GoldenTask, and
Promptfoo integration plumbing.

The current failure is authority drift: README/GOAL/PLAN/memory-plan/handoff/QG
surfaces disagree about current truth, and some docs route future work into
QG-06 / `krn audit` quality automation. That makes the repo itself a context
poison source.

This plan resets the active truth surface first, then hardens the real Memory
Brain spine.

## Current State

- Root `GOAL.md` is now a compact activation contract.
- Root `PLAN.md` is now the canonical execution plan.
- Old memory ideal-state plan, QG docs, handoff docs, and raw materials are not
  active execution truth unless a slice explicitly mines them.
- `README.md` is aligned as a doorway to root `GOAL.md` and root `PLAN.md`.
- `docs/materials/20206-06-23-audit.md` is raw/user-provided audit material.
- `docs/reviews/repo-reset-audit/*` are decision-grade audit outputs.
- `docs/materials/2026-06-22-big-brain*.md` remain raw research quarry.

## Smallest Honest KRN Kernel

The smallest honest KRN product is not a dashboard, not a benchmark lane, and
not an agent zoo.

It is this loop:

```txt
OperatorIntent
  -> TaskContract
  -> HarnessPlan
  -> ContextAssembly
  -> CodexAdapterPlan
  -> ExecutionRun
  -> EvidenceBundle
  -> ReviewAssessment
  -> FeedbackDelta
  -> MemoryCandidate / SourceDecision / EvalCandidate
  -> reviewed promotion or rejection
```

`ContextPacket` and Codex briefs are rendered artifacts. They are not the
central domain model.

## Architecture Laws

1. KRN is one operating brain around Codex, not many independent brains.
2. Runtime memory is store/service-backed, not markdown and not `.krn`.
3. PostgreSQL + pgvector is the canonical brain store for this reset.
4. Drizzle owns DB schema/migrations/repositories.
5. Zod owns IO/API/CLI validation boundaries.
6. Observation is event-derived staging, not Memory Core.
7. Reflection creates records, reports, and candidates only; it cannot mutate
   Memory Core.
8. Memory Core requires lineage, confidence, owner, guidance, validity/
   invalidation, and review.
9. Anti-memory is first-class.
10. Activation is admission control, not prompt assembly.
11. Similarity is not permission.
12. Eval runners are adapters, not truth.
13. Promptfoo smoke proves runner integration/result mapping only unless real
   KRN behavior executes.
14. `krn audit` is not a product quality engine.
15. General engineering quality comes from architecture, types, tests, naming,
   and review, not an anti-slop subsystem.
16. Public CLI is an adapter surface; internals must not look like product.
17. Subagents/prosecutor roles are temporary audit lenses, not runtime agents.
18. Hooks are deterministic guardrails, not hidden semantic brains.

## Package Verdicts

- `packages/core`: keep as pure domain. Harden behavior metadata boundaries.
- `packages/schema`: keep as Zod IO boundary. Parsing is not behavior proof.
- `packages/db`: keep as Drizzle/Postgres persistence. Narrow public exports
  and distinguish runtime DB proof from package tests.
- `packages/harness`: keep as activation/compiler/review-gate layer. Prevent
  audit checks from looking like product-quality authority.
- `packages/cli`: keep as adapter. Classify public operator vs governed admin
  vs internal dev commands.
- `packages/codex-adapter`: keep as Codex renderer. Do not leak Codex-specific
  semantics into `packages/core`.
- `packages/workers`: keep as contract-only until runtime exists. Do not
  describe it as background maintenance/dreaming runtime.

## Public Surface Verdicts

public operator:

```txt
krn init
krn doctor
krn plan
krn evidence capture
krn observe
krn reflect
krn codex brief
```

governed admin:

```txt
krn memory candidate add/promote/reject
krn memory anti add
krn source claim add/reject/link
krn review assess
```

internal/dev:

```txt
krn db readiness
krn db smoke ...
krn audit / guard
repository smokes
```

This is a starting classification. Implementation slices must verify actual CLI
code before changing behavior.

## Memory Lifecycle

```txt
Observation / Evidence / SourceClaim
  -> ReflectionRecord / FeedbackDelta
  -> MemoryCandidate
  -> MemoryReviewGate
  -> MemoryRecord
  -> Activation
  -> MemoryApplication feedback
  -> invalidation / demotion / anti-memory when needed
```

Forbidden: observation, reflection, Promptfoo, or `krn audit` creating Memory
Core truth directly.

## Source / Claim Lifecycle

Source truth must remain decision-grade:

```txt
SourceArtifact
  -> SourceClaim with mechanism / implication / doesNotProve / trust /
     consumer / falsifier
  -> SourceDecisionEdge
  -> SourceDecision or SourceRejection
```

Project scope must not hide in generic metadata.

## Activation Lifecycle

Activation decides what is allowed into context.

It must record inclusion, exclusion, abstention, conflict, trust, temporal
state, anti-memory hit, raw recall trigger, and expected use through typed
fields/read models where those values affect behavior.

## Eval / Promptfoo Lifecycle

`GoldenTask` is the canonical KRN behavior contract.

Promptfoo is a runner/result adapter. Current smoke is integration proof only.

Real behavior gates must execute KRN code paths and fail on invariant breaks.

## Docs Hygiene Rules

Every doc must fit one bucket:

```txt
canonical
standard
ADR
historical ledger
raw material
run proof
delete candidate
```

Historical docs need a banner if future agents can mistake them for current
truth:

```md
> Historical audit/planning ledger.
> Not current execution truth.
> Current canonical execution plan: `/PLAN.md`.
```

Raw materials remain in `docs/materials/` and are never direct implementation
truth.

## Ordered Task Queue

### P0-00: Replace Root `GOAL.md`

status: complete in this docs reset.

files:

- Modify: `GOAL.md`

verification:

```sh
wc -l GOAL.md
rg -n "QG-06|quality gate automation|smell scan automation|anti-slop subsystem|docs/plans/memory-ideal-state/PLAN.md" GOAL.md
git diff --check
```

expected:

- `GOAL.md` stays compact.
- Any old-plan/QG matches are absent or explicitly rejected/historical.

commit:

```sh
git add GOAL.md
git commit -m "docs(goal): reset KRN execution contract"
```

rollback:

```sh
git revert <commit>
```

### P0-01: Replace Root `PLAN.md`

status: complete in this docs reset.

files:

- Modify: `PLAN.md`

verification:

```sh
rg -n "active execution track|QG-06 remains queued|quality gate automation|smell scan automation" PLAN.md
git diff --check
```

expected:

- `PLAN.md` is self-contained.
- It does not send execution back to the old memory plan as active truth.
- It rejects QG-06/productized audit direction.

commit:

```sh
git add PLAN.md
git commit -m "docs(plan): create canonical KRN reset plan"
```

rollback:

```sh
git revert <commit>
```

### P0-02: Mark Historical Planning Ledgers

status: complete.

objective:

Make stale plans/handoffs impossible to mistake for current truth.

files:

- Modify: `docs/plans/memory-ideal-state/PLAN.md`
- Modify: `docs/plans/memory-ideal-state/QG-04H-SMELL-SCAN-AUTOMATION-REQUIREMENTS.md`
- Modify: selected `docs/handoff/*`
- Modify: `REVIEW.md`

non-goals:

- no package source changes;
- no deletion of raw materials;
- no broad rewrite of historical evidence.

steps:

- [ ] Add the historical banner to each target file that still reads like
      current execution truth.
- [ ] Preserve historical content below the banner.
- [ ] Run verification.
- [ ] Commit.

verification:

```sh
rg -n "Current canonical execution plan" docs/plans docs/handoff REVIEW.md
git diff --check
```

commit:

```sh
git add docs/plans docs/handoff REVIEW.md
git commit -m "docs(state): mark historical planning ledgers"
```

rollback:

```sh
git revert <commit>
```

### P0-03: Align README As Doorway

status: complete.

objective:

Make README an honest doorway instead of a stale status ledger.

files:

- Modify: `README.md`

requirements:

- Name root `GOAL.md` and `PLAN.md` as current activation/plan surfaces.
- State that raw materials are quarantine inputs.
- State that Promptfoo smoke is integration proof only.
- State that QG-06/productized anti-slop direction is rejected.
- State what is built, built but not proven, and not built.

non-goals:

- no package source changes;
- no long progress ledger in README.

verification:

```sh
rg -n "Promptfoo|QG-06|quality gate|memory ideal-state|current phase" README.md
git diff --check
```

commit:

```sh
git add README.md
git commit -m "docs(readme): align KRN current state"
```

rollback:

```sh
git revert <commit>
```

### P0-04: Remove Productized QG-06 Direction

status: complete.

objective:

Ensure QG-06, anti-slop, quality-gate automation, and smell-scan language is
historical/rejected/internal-guard only.

files:

- Modify: `README.md`
- Modify: `GOAL.md`
- Modify: `PLAN.md`
- Modify: `docs/plans/memory-ideal-state/PLAN.md`
- Modify: `docs/plans/memory-ideal-state/QG-04H-SMELL-SCAN-AUTOMATION-REQUIREMENTS.md`
- Modify: selected `docs/handoff/*`

non-goals:

- no new audit checks;
- no audit rename yet;
- no quality subsystem.

verification:

```sh
rg -n "anti-slop|quality gate automation|smell scan automation|QG-06|quality engine|audit automation" README.md GOAL.md PLAN.md docs/plans docs/handoff
git diff --check
```

expected:

- Remaining matches are historical, explicitly rejected, or internal guard only.

commit:

```sh
git add README.md GOAL.md PLAN.md docs/plans docs/handoff
git commit -m "docs(review): reject productized anti-slop layer"
```

rollback:

```sh
git revert <commit>
```

### P1-00: Classify CLI Surfaces

objective:

Create durable CLI taxonomy before changing CLI behavior.

files:

- Create: `docs/architecture/cli-surfaces.md`
- Modify: `PLAN.md`

content required:

- public operator commands;
- governed admin commands;
- internal/dev commands;
- historical/delete candidates;
- rule that DB smokes and audit guard are not product UX.

verification:

```sh
rg -n "public operator|governed admin|internal/dev|krn audit|krn db" docs/architecture/cli-surfaces.md PLAN.md
git diff --check
```

commit:

```sh
git add docs/architecture/cli-surfaces.md PLAN.md
git commit -m "docs(cli): classify operator and internal surfaces"
```

rollback:

```sh
git revert <commit>
```

### P1-01: Deproductize `krn audit`

objective:

Decide whether `krn audit` is deleted, renamed, or retained as an internal
mechanical guard.

files:

- Modify: `README.md`
- Modify: `PLAN.md`
- Modify: `docs/architecture/cli-surfaces.md`
- Modify: `docs/plans/memory-ideal-state/QG-04H-SMELL-SCAN-AUTOMATION-REQUIREMENTS.md`

non-goals:

- no code rename in this slice;
- no new audit categories;
- no anti-slop product.

verification:

```sh
rg -n "krn audit|audit automation|quality engine|anti-slop|smell scan" README.md PLAN.md docs
git diff --check
```

expected:

- All matches classify `krn audit` as historical, rejected, delete/rename
  candidate, or internal guard only.

commit:

```sh
git add README.md PLAN.md docs
git commit -m "docs(audit): deproductize audit guard"
```

rollback:

```sh
git revert <commit>
```

### P1-02: Plan Package Barrel Narrowing

status: complete.

objective:

Identify broad exports that expose internals as product API.

files:

- Modify: `PLAN.md`
- Create: `docs/architecture/package-surfaces.md`

inspect:

```txt
packages/db/src/index.ts
packages/db/src/repositories/index.ts
packages/db/src/schema/index.ts
packages/harness/src/index.ts
packages/harness/src/repositories/index.ts
packages/cli/src/index.ts
```

non-goals:

- no source export changes in this docs slice.

verification:

```sh
rg -n "export \\*" packages/*/src/index.ts packages/*/src/**/index.ts
git diff --check
```

commit:

```sh
git add PLAN.md docs/architecture/package-surfaces.md
git commit -m "docs(exports): plan public surface narrowing"
```

rollback:

```sh
git revert <commit>
```

### P2-00: Seal Memory Core Write Authority

status: complete.

objective:

Make MemoryReviewGate or an equivalent reviewed service the only public
candidate-to-MemoryRecord path.

files likely touched:

- Modify: `packages/harness/src/repositories/memoryRepository.ts`
- Modify: `packages/harness/src/memory/memoryReviewGate.ts`
- Modify: `packages/db/src/repositories/DrizzleMemoryRepository.ts`
- Modify: `packages/db/src/repositories/index.ts`
- Modify: related tests.

rules:

- low-level create/promote methods may exist only inside internal DB adapter or
  explicit test setup;
- public harness-facing port exposes gate-owned verbs;
- CLI promotion keeps `--evidence-reviewed-ref`;
- no automatic promotion.

verification:

```sh
pnpm --filter @krn/harness test -- memory/memoryReviewGate.test.ts
pnpm --filter @krn/db test
pnpm typecheck
git diff --check
```

commit:

```sh
git add packages
git commit -m "refactor(memory): seal public promotion authority"
```

rollback:

```sh
git revert <commit>
```

### P2-01: Type SourceClaim Project Scope

status: complete.

objective:

Remove behavior-governing project scope from generic metadata.

files likely touched:

- Modify: `packages/core/src/source.ts`
- Modify: `packages/db/src/schema/sources.ts`
- Modify: `packages/db/src/repositories/DrizzleSourceRepository.ts`
- Modify: `packages/harness/src/reflection/reflectionInputSelector.ts`
- Modify: schema/migration/test files as required.

decision required:

Choose one before implementation:

- add first-class `projectId` to `SourceClaim`; or
- derive project through typed source-artifact joins.

verification:

```sh
rg -n "metadata\\.projectId" packages
pnpm typecheck
pnpm test
pnpm db:ready
git diff --check
```

commit:

```sh
git add packages
git commit -m "refactor(source): type source claim project scope"
```

rollback:

```sh
git revert <commit>
```

### P2-02: Promote Behavior Metadata To Typed Fields

status: complete.

objective:

Move runtime authority out of generic metadata.

search:

```sh
rg -n "metadata\\.(projectId|sourceClaimId|memoryRecordId|antiMemoryRecordId|searchDocumentId|activationAbstention|observationPrefix|observationPrefixGate)" packages
```

rules:

- no metadata linter product;
- fix known keys directly;
- metadata remains allowed for evidence/debug payload only.

verification:

```sh
pnpm typecheck
pnpm test
git diff --check
```

commit:

```sh
git add packages
git commit -m "refactor(core): type behavior metadata boundaries"
```

rollback:

```sh
git revert <commit>
```

### P3-00: Define Observation Staging Doctrine

status: complete.

objective:

Record observation as event-derived staging, not Memory Core.

files:

- Create: `docs/decisions/ADR-0013-observation-is-staging-not-memory.md`
- Modify: `PLAN.md`

must state:

- source ranges are required for truth-bearing observations;
- raw evidence remains canonical;
- observation cannot mutate Memory Core;
- observation prefix is bounded;
- observation may lead to candidates only through explicit reflection/review.

verification:

```sh
git diff --check
```

commit:

```sh
git add docs/decisions/ADR-0013-observation-is-staging-not-memory.md PLAN.md
git commit -m "docs(memory): define observation staging doctrine"
```

rollback:

```sh
git revert <commit>
```

### P3-01: Prove Observation And Reflection Invariants

status: complete.

objective:

Strengthen tests around staging/candidate-only behavior.

required proofs:

- factual observation without source range is rejected;
- observation does not create MemoryRecord;
- observation prefix rejects unsourced items;
- reflection persists ReflectionRecord only;
- reflection surfaces gaps/contradictions;
- reflection cannot mutate Memory Core.

verification:

```sh
pnpm --filter @krn/core test -- observations reflection
pnpm --filter @krn/schema test -- observation reflection
pnpm --filter @krn/db test -- Observation Reflection
pnpm --filter @krn/cli test -- runReflectCommand runObserveCommand
pnpm typecheck
git diff --check
```

commit:

```sh
git add packages
git commit -m "test(memory): prove staging invariants"
```

rollback:

```sh
git revert <commit>
```

### P3-02: Create Reviewed Candidate Writer From ReflectionRecord

status: complete.

objective:

Add explicit candidate creation from reflection outputs without MemoryRecord
promotion.

rules:

- creates candidates only;
- preserves source ranges/source claims;
- emits memory/source/anti-memory/eval candidates where types support it;
- no automatic promotion.

verification:

```sh
pnpm typecheck
pnpm test
pnpm db:ready
git diff --check
```

commit:

```sh
git add packages
git commit -m "feat(memory): create reviewed candidates from reflection records"
```

rollback:

```sh
git revert <commit>
```

### P4-00: Define Activation As Admission Control

status: complete.

objective:

Record activation as the trust boundary for context admission.

files:

- Create: `docs/decisions/ADR-0014-activation-is-admission-control.md`
- Modify: `PLAN.md`

must state:

- similarity is not permission;
- activation filters trust, temporal state, anti-memory, source support, budget,
  and context ROI;
- activation can abstain;
- activation must produce inclusions and exclusions;
- exact proof / low trust / conflict can require raw recall.

verification:

```sh
git diff --check
```

commit:

```sh
git add docs/decisions/ADR-0014-activation-is-admission-control.md PLAN.md
git commit -m "docs(activation): define admission control doctrine"
```

rollback:

```sh
git revert <commit>
```

### P4-01: Add Noisy Context Golden Proofs

objective:

Prove activation rejects bad context instead of dumping everything.

required cases:

- stale memory abstention;
- anti-memory block;
- broad context dump rejection;
- unsupported source decision rejection;
- observation prefix source-range requirement;
- raw recall trigger on exact proof.

verification:

```sh
pnpm --filter @krn/harness test -- golden
pnpm test
pnpm typecheck
git diff --check
```

commit:

```sh
git add packages tests
git commit -m "test(activation): prove noisy context rejection"
```

rollback:

```sh
git revert <commit>
```

### P4-02: Type Activation Trace Decisions

objective:

Move behavior-governing activation trace fields out of metadata where they
affect behavior.

fields:

- abstention reason;
- raw recall trigger;
- anti-memory hit;
- exclusion category;
- source support state;
- expected use.

verification:

```sh
pnpm typecheck
pnpm test
pnpm db:ready
git diff --check
```

commit:

```sh
git add packages
git commit -m "feat(activation): type activation trace decisions"
```

rollback:

```sh
git revert <commit>
```

### P5-00: Bound Promptfoo Claims

objective:

Make every Promptfoo doc/fixture state integration smoke only unless real KRN
behavior executes.

files:

- Modify: `README.md`
- Modify: QG-05 docs
- Modify: Promptfoo fixtures/tests if naming overclaims behavior.

verification:

```sh
rg -n "Promptfoo|promptfoo|smoke|behavior proof|integration smoke" README.md docs tests packages
pnpm exec promptfoo --version
pnpm eval:promptfoo:smoke
git diff --check
```

commit:

```sh
git add README.md docs tests packages
git commit -m "docs(eval): bound Promptfoo integration claims"
```

rollback:

```sh
git revert <commit>
```

### P5-01: Add First Real Behavior Eval Gate

objective:

Make at least one GoldenTask path execute real KRN behavior, not fixture
self-pass only.

required invariants:

- anti-memory blocks activation;
- stale/weak memory abstains;
- reflection cannot mutate Memory Core.

verification:

```sh
pnpm --filter @krn/harness test -- golden
pnpm test
pnpm typecheck
git diff --check
```

commit:

```sh
git add packages tests
git commit -m "test(eval): add KRN memory behavior regression gate"
```

rollback:

```sh
git revert <commit>
```

### P6-00: Mark Worker Runtime Truth

objective:

Ensure workers are described as contracts/skeleton only until a runtime exists.

verification:

```sh
rg -n "worker|dream|dreaming|background|maintenance" README.md PLAN.md docs packages/workers
git diff --check
```

expected:

- No doc claims background maintenance/dreaming runtime exists.

commit:

```sh
git add README.md PLAN.md docs packages/workers
git commit -m "docs(workers): mark maintenance runtime as not built"
```

rollback:

```sh
git revert <commit>
```

### P6-01: Harden Worker Job Contracts

objective:

Before any worker runtime, every job contract defines write authority.

required fields:

- input schema;
- idempotency key;
- output event;
- failure state;
- allowed writes;
- forbidden writes;
- Memory Core gate constraints.

verification:

```sh
pnpm --filter @krn/workers test
pnpm typecheck
git diff --check
```

commit:

```sh
git add packages/workers packages/core
git commit -m "feat(workers): harden maintenance job contracts"
```

rollback:

```sh
git revert <commit>
```

### P7-00: Run First Governed Self-Hosting Loop

objective:

Use KRN to improve KRN and record whether it reduces review burden.

flow:

```sh
pnpm --filter @krn/cli krn plan --task "seal Memory Core write authority" --persist
pnpm typecheck
pnpm test
pnpm --filter @krn/cli krn evidence capture --persist
pnpm --filter @krn/cli krn observe --run <runId> --persist
pnpm --filter @krn/cli krn reflect --scope run:<runId> --persist
```

output:

- Create: `docs/runs/<date>-self-hosting-memory-loop.md`

record:

- whether selected memory helped;
- review burden before/after;
- gaps;
- anti-memory candidates;
- eval candidates;
- rollback path.

verification:

```sh
pnpm typecheck
pnpm test
pnpm db:ready
git diff --check
```

commit:

```sh
git add docs/runs packages
git commit -m "docs(run): prove first governed self-hosting loop"
```

rollback:

```sh
git revert <commit>
```

## Progress

- [x] P0-00 Replace root `GOAL.md` with compact execution contract.
- [x] P0-01 Replace root `PLAN.md` with canonical reset plan.
- [x] P0-02 Mark historical planning ledgers.
- [x] P0-03 Align README as doorway.
- [x] P0-04 Remove productized QG-06 direction.
- [x] P1-00 Classify CLI surfaces.
- [x] P1-01 Deproductize `krn audit`.
- [x] P1-02 Plan package barrel narrowing.
- [x] P2-00 Seal Memory Core write authority.
- [x] P2-01 Type SourceClaim project scope.
- [x] P2-02 Promote behavior metadata to typed fields.
- [x] P3-00 Define observation staging doctrine.
- [x] P3-01 Prove observation/reflection invariants.
- [x] P3-02 Create reviewed candidate writer from ReflectionRecord.
- [x] P4-00 Define activation as admission control.
- [ ] P4-01 Add noisy context golden proofs.
- [ ] P4-02 Type activation trace decisions.
- [ ] P5-00 Bound Promptfoo claims.
- [ ] P5-01 Add first real behavior eval gate.
- [ ] P6-00 Mark worker runtime truth.
- [ ] P6-01 Harden worker job contracts.
- [ ] P7-00 Run first governed self-hosting loop.

## Surprises & Discoveries

- `docs/materials/20206-06-23-audit.md` intentionally exists with `20206` in
  the filename; do not silently rename it during this reset.
- README no longer routes work through the old memory ideal-state plan.
  Remaining stale QG-06/productized-audit language lives in historical docs and
  must be cleaned up or explicitly rejected by P0-04.
- DB package implementation exists, but live DB runtime truth still depends on
  `KRN_DATABASE_URL` in the current shell.
- Historical handoff and memory-plan files still contain old QG-06 wording as
  ledger evidence, but target files now carry reset-decision banners or
  historical-note wording that rejects QG-06/productized audit automation as
  active product direction.
- README now points readers to root `GOAL.md` and root `PLAN.md`; old memory
  ideal-state docs are described as historical ledgers, not active truth.
- Package surface inventory found broad wildcard exports beyond the P1-02
  target set in core/schema/codex-adapter/workers. They are recorded as out of
  first-slice scope unless later evidence shows they leak internals as product
  authority.
- P2-00 did not require DB schema or migration changes. The durable object is
  still MemoryCandidate -> MemoryRecord; the changed boundary is the public
  harness-facing promotion port.
- P2-01 did not require a new SourceClaim column because source artifacts
  already carry typed `projectId`, and DB `listClaimsForProject` already derives
  claim scope through a typed SourceArtifact join.
- P2-02 did not require a DB migration. Runtime behavior now uses typed
  activation candidate fields and typed `ContextAssembly` fields; DB smoke keeps
  persisted context prefix/search merge values as explicit debug snapshots
  (`observationPrefixSnapshot`, `mergedSearchDocumentIds`) rather than behavior
  authority.
- P2-02 exposed duplicate dedupe logic in both merge ranking and ContextROI.
  Both paths now use the same typed source/memory record identity fields instead
  of reading `metadata.sourceClaimId` or `metadata.memoryRecordId`.
- P3-00 found existing ADR-0011 already defines observational memory as staging.
  ADR-0013 therefore does not replace it with a new architecture; it narrows the
  reset doctrine around source ranges, non-mutation, bounded prefixes, and
  metadata not being authority.
- P3-01 found there was no small direct `runObserveCommand.test.ts`; observe
  invariants were covered through the large CLI integration test. Added a
  direct command test so the planned `runObserveCommand` verification has an
  explicit unit surface.
- P3-02 found there is no anti-memory candidate store or policy candidate store
  in the current spine. The writer therefore does not create `AntiMemoryRecord`
  or policy truth; it returns those proposals as unsupported staged candidates
  until a reviewed candidate store exists.
- P3-02 found SourceClaim candidate state is `proposed`, not `candidate`; the
  writer uses the existing SourceClaim status vocabulary instead of expanding
  source status in this slice.
- P4-00 did not need a new activation architecture. The existing plan law
  already says activation is admission control; ADR-0014 makes the falsifiers
  explicit before adding golden noisy-context proofs.

## Decision Log

- 2026-06-23: Adopt the audit recommendation to replace root `GOAL.md` and
  root `PLAN.md` instead of adding another addendum to the old plan.
- 2026-06-23: Reject QG-06/productized anti-slop as active product direction.
- 2026-06-23: Before P1-01, `krn audit` was kept only as a
  delete/rename/internal-guard candidate.
- 2026-06-23: Treat old memory ideal-state plan, QG docs, handoffs, and raw
  materials as historical quarry unless a slice explicitly promotes a decision.
- 2026-06-23: Marked old memory plan, QG-04H requirements, REVIEW, and handoff
  files as historical ledgers instead of current execution truth.
- 2026-06-23: README is a doorway, not a progress ledger; it rejects
  productized QG-06/anti-slop direction and bounds Promptfoo smoke claims.
- 2026-06-23: Productized QG-06 / anti-slop / audit automation is removed as
  active direction in root surfaces and classified as historical/rejected in
  old memory-plan and handoff surfaces.
- 2026-06-23: Public `krn audit` is deprecated as product direction. It may
  remain only as temporary internal/dev mechanics until a code slice removes it
  from public CLI or moves checks behind an explicit internal script.
- 2026-06-23: Package public surfaces should be narrowed from broad barrels to
  stable named contracts; smokes, concrete repositories, schema tables, and CLI
  command runners should not be default product API.
- 2026-06-23: Public `MemoryRepository` no longer exposes raw
  `createMemoryRecord` or raw `promoteMemoryCandidate`. Reviewed promotion is
  exposed as `promoteReviewedMemoryCandidate` and is called through
  `MemoryReviewGate`; raw create/promote remains only on the concrete DB
  adapter for internal setup/smoke use.
- 2026-06-23: SourceClaim project scope is derived through typed
  SourceArtifact project scope/read-model selection, not through
  `SourceClaim.metadata.projectId`.
- 2026-06-23: Behavior-governing activation metadata is promoted to typed
  fields. `ActivationCandidate` owns search/source/memory/anti-memory identity
  fields and conflict reason; `ContextAssembly` owns observation prefix, prefix
  gate, and activation abstention. Metadata may still carry debug snapshots, but
  merge, conflict, raw recall, ContextROI, and context assembly do not trust
  generic `metadata.*` keys for these decisions.
- 2026-06-23: ADR-0013 adopts ADR-0011 as the source doctrine and makes the
  reset-specific decision explicit: observation is event-derived staging,
  truth-bearing observations require source ranges, raw evidence remains
  canonical, observation/reflection cannot mutate Memory Core, and observation
  prefix is bounded activation input.
- 2026-06-23: P3-01 treats the existing core/db/reflect tests as retained proof
  and adds only the missing direct observe-command proof. The slice strengthens
  tests without changing observation/reflection production behavior.
- 2026-06-23: Reflection candidate writing is explicit and candidate-only.
  `writeReflectionCandidates` creates MemoryCandidate records, creates
  SourceClaim records only when a source repository and source artifact are
  supplied, emits typed EvalCandidate values in memory, and reports unsupported
  anti-memory/policy/source proposals instead of creating final truth.
- 2026-06-23: ADR-0014 defines activation as the trust boundary between recall
  and context. Similarity/ranking is not permission; activation must produce
  typed inclusions, exclusions, abstention, and raw recall triggers where
  applicable.

## Outcomes & Retrospective

Current outcome:

- Root activation contract and root execution plan are reset.
- Historical planning ledgers are bannered as non-current truth.
- README is aligned with root `GOAL.md` and root `PLAN.md`.
- Productized QG-06 / anti-slop / audit automation direction is rejected or
  historical wherever the P0-04 scan finds it.
- CLI surfaces are classified in `docs/architecture/cli-surfaces.md`.
- `krn audit` is deproductized in docs: no QG-06, no new audit categories, no
  public product UX claim.
- Package barrel narrowing is planned in `docs/architecture/package-surfaces.md`.
- Package source is touched from P2-00 onward.
- Memory Core promotion authority is sealed at the public harness port:
  candidate-to-record promotion goes through reviewed promotion naming and
  MemoryReviewGate metadata.
- SourceClaim project scope no longer depends on `metadata.projectId` in
  package code.
- Behavior-governing metadata debt named by P2-02 has been typed in package
  code. The plan search for `metadata.projectId`, `metadata.sourceClaimId`,
  `metadata.memoryRecordId`, `metadata.antiMemoryRecordId`,
  `metadata.searchDocumentId`, `metadata.activationAbstention`,
  `metadata.observationPrefix`, and `metadata.observationPrefixGate` returns no
  package matches.
- Observation staging doctrine is captured in
  `docs/decisions/ADR-0013-observation-is-staging-not-memory.md`.
- Observation/reflection staging invariants are now backed by focused tests:
  core source-range and reflection contracts, DB observation/reflection
  repository contracts, CLI reflect non-mutation, CLI observe source-ranged
  staging, and activation prefix rejection.
- Reviewed candidate writing from ReflectionRecord exists as a harness service
  and is covered by tests. It does not promote MemoryRecord and does not create
  AntiMemoryRecord/policy truth.
- Activation admission-control doctrine is captured in
  `docs/decisions/ADR-0014-activation-is-admission-control.md`.
- Next safe action is P4-01: add noisy context golden proofs.

## Command Evidence

Initial evidence for this reset:

```sh
git status --short --branch
```

Observed before editing:

```txt
## main...origin/main
?? docs/materials/20206-06-23-audit.md
```

This proves the only observed dirty file before the docs reset was the new raw
audit material. It does not prove code correctness.

Additional verification must be appended by each implementing slice.

P0-00/P0-01 verification run after replacing root `GOAL.md` and `PLAN.md`:

```sh
wc -l GOAL.md PLAN.md
```

Observed:

```txt
  126 GOAL.md
 1272 PLAN.md
 1398 total
```

This proves `GOAL.md` is compact relative to the previous long activation
contract. It does not prove future slices are implemented.

```sh
rg -n "docs/plans/memory-ideal-state/PLAN.md|QG-06|quality gate automation|smell scan|anti-slop subsystem" GOAL.md PLAN.md
```

Observed matches are in explicit rejection, historical-quarry language, or
verification commands. This proves the root files no longer route active work
into the old memory plan or productized QG-06 direction. It does not prove
README/handoff docs are repaired; P0-02 through P0-04 still own that work.

```sh
git diff --check
```

Observed: passed with no output.

P1-00 CLI surface classification:

```sh
rg -n "command|CliCommand|run.*Command|parse.*Command|krn audit|audit" packages/cli/src packages/harness/src/audit README.md package.json
sed -n '1,520p' packages/cli/src/parseArgs.ts
sed -n '1,860p' packages/cli/src/runCli.ts
sed -n '1,120p' packages/cli/src/parseDbArgs.ts
sed -n '1,280p' packages/cli/src/parseAuditArgs.ts
```

Observed summary:

- `parseArgs.ts` defines public operator, governed admin, DB, and audit command
  variants;
- `runCli.ts` routes those variants to command runners and wires optional DB
  runtimes;
- `parseDbArgs.ts` keeps readiness/smoke targets separate from normal operator
  workflows;
- `parseAuditArgs.ts` exposes `krn audit repo` and `krn audit slice`, which are
  now classified as internal/dev and historical/delete candidates pending P1-01.

```sh
rg -n "public operator|governed admin|internal/dev|krn audit|krn db" docs/architecture/cli-surfaces.md PLAN.md
git diff --check
```

Observed: required classification terms found in
`docs/architecture/cli-surfaces.md` and `PLAN.md`; `git diff --check` passed
with no output.

P1-01 deproductize `krn audit`:

```sh
rg -n "krn audit|audit automation|quality engine|anti-slop|smell scan" README.md PLAN.md docs
git diff --check
```

Observed summary:

- `README.md`, root `PLAN.md`, `docs/architecture/cli-surfaces.md`, and
  QG-04H reset text classify `krn audit` as deprecated product direction,
  temporary internal/dev mechanics, historical evidence, or not a quality
  engine;
- `docs/materials/` matches are raw quarantined source material, not active
  implementation truth;
- `docs/reviews/repo-reset-audit/` matches are decision-grade audit evidence
  supporting the deproductization decision;
- historical ledger matches remain historical and are not current execution
  truth;
- `git diff --check` passed with no output.

P1-02 package surface inventory:

```sh
sed -n '1,240p' packages/db/src/index.ts
sed -n '1,220p' packages/db/src/repositories/index.ts
sed -n '1,240p' packages/db/src/schema/index.ts
sed -n '1,260p' packages/harness/src/index.ts
sed -n '1,220p' packages/harness/src/repositories/index.ts
sed -n '1,240p' packages/cli/src/index.ts
rg -n "export \\*" packages/*/src/index.ts packages/*/src/**/index.ts
```

Observed summary:

- DB root exports readiness, smokes, concrete repositories, and schema tables;
- harness root exports audit, activation, Promptfoo/golden helpers, memory,
  reflection, and repository ports through one barrel;
- CLI root exports parser, `runCli`, and selected command runner modules,
  including DB readiness/smoke runners;
- additional wildcard exports exist in core/schema/codex-adapter/workers, but
  P1-02 limits the first narrowing plan to DB, harness, CLI, and nested
  repository/schema indexes named by the slice.

```sh
rg -n "export \\*" packages/*/src/index.ts packages/*/src/**/index.ts
git diff --check
```

Observed: wildcard export inventory produced the expected broad barrel list;
`git diff --check` passed with no output.

P2-00 Memory Core write authority:

```sh
pnpm --filter @krn/harness test -- memory/memoryReviewGate.test.ts
```

Observed RED before implementation: 1 failing test,
`uses the reviewed promotion port instead of raw candidate promotion`, with
`TypeError: input.memoryRepository.promoteMemoryCandidate is not a function`.

Observed GREEN after implementation: 15 harness test files passed; 82 tests
passed.

```sh
rg -n "createMemoryRecord\\(|promoteMemoryCandidate\\(" packages/harness/src/repositories/memoryRepository.ts packages/harness/src/memory/memoryReviewGate.ts packages/cli/src/databaseRuntime.ts
pnpm --filter @krn/db test
pnpm typecheck
pnpm test
git diff --check
```

Observed:

- `rg` returned no matches in the public harness memory port, MemoryReviewGate,
  or CLI database runtime boundary;
- DB tests passed: 24 files, 67 tests;
- full typecheck passed across 7 workspace projects;
- full test passed across 7 workspace projects: 78 test files, 363 tests;
- `git diff --check` passed with no output.

P2-01 SourceClaim project scope:

Decision: derive SourceClaim project scope through typed SourceArtifact joins
and read-model selection. Do not add a redundant `projectId` column to
`SourceClaim` in this slice.

```sh
pnpm --filter @krn/harness test -- reflection/reflectionInputSelector.test.ts
```

Observed RED before implementation: 1 failing test,
`does not use SourceClaim metadata for project scoping`, expected
`["source-claim-typed-scope"]` and received `[]`.

Observed GREEN after implementation: 15 harness test files passed; 83 tests
passed.

```sh
rg -n "metadata\\.projectId" packages
rg -n "listClaimsForProject|sourceArtifacts\\.projectId|source_claims.*project" packages/db/src/repositories/DrizzleSourceRepository.ts packages/db/src/schema/sources.ts packages/harness/src/repositories/sourceRepository.ts
pnpm typecheck
pnpm test
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready
git diff --check
```

Observed:

- `metadata.projectId` returned no matches under `packages`;
- typed project scoping is represented by `SourceRepository.listClaimsForProject`
  and `DrizzleSourceRepository` filtering through `sourceArtifacts.projectId`;
- full typecheck passed across 7 workspace projects;
- full test passed across 7 workspace projects: 78 test files, 364 tests;
- initial `pnpm db:ready` without `KRN_DATABASE_URL` failed as expected with
  "Postgres config: missing KRN_DATABASE_URL";
- after `docker compose up -d krn-postgres`,
  `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`
  passed with Postgres reachable, 11/11 migrations applied, pgvector available,
  and brain store readiness ready;
- `git diff --check` passed with no output.

P2-02 behavior metadata typed fields:

```sh
pnpm --filter @krn/harness test -- activation/index.test.ts activation/goldenMemoryBehavior.test.ts
```

Observed RED before implementation: 8 failing activation tests after changing
expectations to require typed `searchDocumentIds`, `antiMemoryRecordId`,
`conflictReason`, `observationPrefix`, `observationPrefixGate`, and
`activationAbstention` instead of metadata-owned values.

Observed GREEN after implementation: 15 harness test files passed; 83 tests
passed.

```sh
rg -n "metadata\\.(projectId|sourceClaimId|memoryRecordId|antiMemoryRecordId|searchDocumentId|activationAbstention|observationPrefix|observationPrefixGate)" packages
pnpm typecheck
pnpm test
git diff --check
```

Observed:

- final `rg` returned no matches under `packages`;
- full typecheck passed across 7 workspace projects;
- full test passed across 7 workspace projects: core 8 files/39 tests, schema
  3 files/25 tests, harness 15 files/83 tests, workers 1 file/3 tests,
  codex-adapter 3 files/7 tests, db 24 files/67 tests, cli 24 files/140 tests;
- `git diff --check` passed with no output.

This proves the named behavior-governing metadata reads are gone from package
code and the workspace test suite passes. It does not prove DB runtime smoke,
because P2-02 did not require DB runtime commands or schema migration.

P3-00 observation staging doctrine:

```sh
cat docs/decisions/ADR-0011-observational-memory-as-staging-layer.md
sed -n '230,270p' docs/reviews/repo-reset-audit/FULL_REPO_AUDIT.md
sed -n '518,531p' docs/reviews/repo-reset-audit/FULL_REPO_AUDIT.md
sed -n '448,482p' docs/reviews/repo-reset-audit/REPAIR_PLAN.md
```

Observed summary:

- ADR-0011 already accepts observation as source-ranged temporal staging and
  rejects reflection auto-promotion;
- the reset audit says current observe/reflect paths are deterministic,
  explicit, and non-mutating with respect to Memory Core;
- the repair plan says to keep observation/reflection as staging while removing
  autonomous brain, dreaming, self-healing, and auto-promotion language.

```sh
git diff --check
```

Observed: passed with no output.

This proves the ADR text is whitespace-clean and grounded in existing reset
evidence. It does not prove implementation invariants; P3-01 owns those tests.

P3-01 observation/reflection invariant proofs:

```sh
pnpm --filter @krn/core test -- observations reflection
pnpm --filter @krn/schema test -- observation reflection
pnpm --filter @krn/db test -- Observation Reflection
pnpm --filter @krn/cli test -- runReflectCommand runObserveCommand
pnpm typecheck
git diff --check
```

Observed:

- core scoped tests passed: 8 files, 39 tests;
- schema scoped tests passed: 3 files, 25 tests;
- db scoped tests passed: 24 files, 67 tests;
- cli scoped tests passed after adding direct observe-command tests: 25 files,
  142 tests;
- full typecheck passed across 7 workspace projects;
- `git diff --check` passed with no output.

This proves the named staging invariants are covered by tests: factual
observations without source ranges are rejected, observation prefix rejects
unsourced items, reflect persists ReflectionRecord only, reflect reports
gaps/contradictions, and observe/reflect command surfaces state no Memory Core
mutation. It does not prove a live DB runtime smoke; P3-01 was a package test
slice.

P3-02 reflection candidate writer:

```sh
pnpm --filter @krn/harness test -- reflection/reflectionCandidateWriter.test.ts
```

Observed RED before implementation: missing
`./reflectionCandidateWriter.js` module in
`reflection/reflectionCandidateWriter.test.ts`.

Observed GREEN after implementation: 16 harness test files passed; 85 tests
passed.

```sh
pnpm typecheck
pnpm test
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready
git diff --check
```

Observed:

- full typecheck passed across 7 workspace projects;
- full test passed across 7 workspace projects: core 8 files/39 tests, schema
  3 files/25 tests, harness 16 files/85 tests, workers 1 file/3 tests,
  codex-adapter 3 files/7 tests, db 24 files/67 tests, cli 25 files/142 tests;
- DB readiness passed with configured Postgres, reachable database, 11/11
  migrations applied, pgvector available, and brain store readiness ready;
- `git diff --check` passed with no output.

This proves the writer creates supported candidate records/values and blocks
final-truth reflection output under package tests. It does not prove
anti-memory or policy candidate persistence, because those candidate stores do
not exist in this spine yet.

P4-00 activation admission-control doctrine:

```sh
ls docs/decisions
rg -n "Activation|activation|admission|context admission|anti-memory|raw recall|abstain|ContextAssembly" docs/decisions docs/KRN_KERNEL.md docs/reviews/repo-reset-audit/FULL_REPO_AUDIT.md PLAN.md
git diff --check
```

Observed summary:

- no prior activation-specific ADR existed;
- kernel and reset audit evidence already locate activation between retrieval
  and context assembly, and require typed behavior decisions;
- ADR-0014 now states similarity is not permission, activation can abstain,
  activation must emit inclusions/exclusions, and raw recall can be required
  for exact proof, low trust, or conflict cases;
- `git diff --check` passed with no output.

This proves the doctrine is recorded and whitespace-clean. It does not prove
behavioral rejection of noisy context; P4-01 owns those golden tests.

P0-04 verification after rejecting productized QG-06 direction:

```sh
rg -n "anti-slop|quality gate automation|smell scan automation|QG-06|quality engine|audit automation" README.md GOAL.md PLAN.md docs/plans docs/handoff
```

Observed summary:

- root `GOAL.md`, `README.md`, and root `PLAN.md` matches are rejection,
  non-goal, or verification-command text;
- old memory-plan/QG docs with QG-06 matches now carry a reset-decision banner
  that rejects QG-06/productized audit automation as active direction;
- handoff matches are historical notes or old ledger evidence under the
  historical banner.

This proves the P0-04 search surface no longer presents productized QG-06 /
anti-slop / audit automation as current execution truth. It does not decide
whether the `krn audit` command is deleted, renamed, or retained as an internal
guard; P1-01 owns that decision.

```sh
git diff --check
```

Observed: passed with no output.

P0-03 verification after aligning README:

```sh
rg -n "Promptfoo|QG-06|quality gate|memory ideal-state|current phase" README.md
```

Observed:

```txt
31:- reject productized QG-06 / anti-slop / audit-authority direction;
54:  evidence/review feedback, GoldenTask, and Promptfoo adapter primitives.
65:- Promptfoo is adopted only as a bounded eval runner/result adapter. The local
66:  Promptfoo smoke proves runner integration and result mapping only; it does
```

This proves README references QG-06 only as rejected direction and Promptfoo
only as bounded adapter/integration smoke. It does not prove the remaining
historical docs are fully rewritten; P0-04 owns the broader stale-direction
scan.

```sh
git diff --check
```

Observed: passed with no output.

P0-02 verification after marking historical ledgers:

```sh
rg -n "Current canonical execution plan" docs/plans docs/handoff REVIEW.md
```

Observed:

```txt
REVIEW.md:5:> Current canonical execution plan: `/PLAN.md`.
docs/handoff/blockers.md:5:> Current canonical execution plan: `/PLAN.md`.
docs/handoff/decisions.md:5:> Current canonical execution plan: `/PLAN.md`.
docs/handoff/progress.md:5:> Current canonical execution plan: `/PLAN.md`.
docs/handoff/handoff.md:5:> Current canonical execution plan: `/PLAN.md`.
docs/handoff/verification.md:5:> Current canonical execution plan: `/PLAN.md`.
docs/plans/memory-ideal-state/QG-04H-SMELL-SCAN-AUTOMATION-REQUIREMENTS.md:5:> Current canonical execution plan: `/PLAN.md`.
docs/plans/memory-ideal-state/PLAN.md:5:> Current canonical execution plan: `/PLAN.md`.
```

This proves the P0-02 target files now advertise `/PLAN.md` as canonical
current truth. It does not remove stale historical claims inside those files;
P0-04 owns active QG-06/productized anti-slop cleanup.

```sh
git diff --check
```

Observed: passed with no output.

## Final Completion Criteria

The reset is complete only when:

1. `GOAL.md` is compact and points to root `PLAN.md`.
2. Root `PLAN.md` remains canonical and current.
3. Stale docs are historical or deleted.
4. QG-06/productized anti-slop is removed as product direction.
5. `krn audit` is internalized/deproductized or explicitly slated for
   deletion/rename.
6. CLI surface taxonomy exists.
7. MemoryReviewGate is the only public Memory Core promotion path.
8. Behavior-governing metadata debt is typed or explicitly tracked.
9. SourceClaim project scoping is typed or safely derived.
10. Observation/reflection are proven staging/candidate-only.
11. Activation has noisy-context behavior proofs.
12. Promptfoo smoke is not overclaimed.
13. Workers are not described as runtime.
14. A self-hosting memory loop is run and recorded.
15. Every slice has command evidence and rollback.

## Commit Discipline

Use Conventional Commits.

Every commit must answer:

```txt
what changed?
why now?
what invariant is stronger?
what commands prove it?
what does not prove it?
rollback path?
```

Do not make broad commits. Do not mix docs-current-truth reset with package
source hardening.

## Stop Conditions

Stop and report if:

- local DB is unavailable for a DB-required slice;
- typecheck/test cannot run;
- repo state has unrelated dirty changes that affect the slice;
- a slice requires destructive deletion not already authorized by this plan;
- evidence contradicts this plan;
- the next action requires broad historical rereads instead of a bounded slice.
