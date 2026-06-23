# KRN Canonical Reset And Continuous Hardening Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` for independent read-heavy audit
> passes, or `superpowers:executing-plans` for inline implementation. Execute
> this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reset KRN from plan-sprawl and productized audit authority into one
canonical, truthful Memory Brain kernel around Codex, then keep hardening it
from execution evidence instead of treating a checked reset queue as the end.

**Architecture:** Preserve the real typed/Postgres-backed spine and remove false
authority from docs and public surfaces before feature work. KRN remains one
operating layer around Codex: bounded context, source-grounded memory, policy,
skills, eval expectations, traces, review gates, and feedback.

**Tech Stack:** pnpm workspace, strict TypeScript, Zod IO schemas,
Drizzle/Postgres/pgvector, Vitest, Promptfoo as bounded eval runner/result
adapter, Codex-facing adapter surfaces.

---

## Active Queue Snapshot

Read this section first. Completed slices below are ledger/checkpoint material,
not required active context unless the current slice explicitly points back to
them.

current_priority: Native Invariant Re-homing.

first_unchecked_slice: `C6-00: Re-home Former Audit Invariants Into Native Mechanisms`.

active_scope:

- keep the `krn audit` product/guardrail/scanner surface removed;
- re-home any retained former audit invariants into native MemoryReviewGate,
  SourceClaim/SourceDecision, and EvidenceBundle mechanisms;
- do not reintroduce `krn audit` as a guardrail, scanner, product UX, or
  internal quality subsystem;
- do not build a broad eval platform, dashboard, worker runtime, or Promptfoo
  authority layer while re-homing native invariants;
- do not promote any C5-00 candidates while re-homing former audit invariants.

completed_checkpoint:

- P0-P7 reset baseline is complete.
- P1-03 removed public `krn audit` CLI/harness audit scanner.
- C6-00A re-homed memory review signals as pure core behavior.
- EVI-00 added typed evidence command status/provenance semantics.
- EVI-01 added explicit `--verification <command=status>` CLI evidence input.
- EVI-02 normalizes evidence command provenance at the DB repository write
  boundary without a schema migration.
- EVI-03 adds a CLI integration regression proof for self-hosting
  plan/evidence/observe/reflect provenance with no MemoryRecord mutation and no
  automatic candidate rows.
- EVI-04 updates the P7 run ledger with the provenance repair closure and
  records that historical EvidenceBundle rows were left unchanged.
- EVI-05 records remote status hygiene before long-running goals.
- EVI-06 expands the P7 selected context from Postgres and records activation
  relevance findings.
- EVI-07 adds typed reflection candidate evidence, blocks high-confidence
  memory candidates backed only by weak/default command evidence, and preserves
  persisted reflection proposal arrays on DB readback.
- EVI-08 proves a reviewed, source-grounded MemoryCandidate can pass
  MemoryReviewGate into MemoryRecord and influence a later activation, while
  missing or weak candidate evidence is rejected before promotion.
- EVI-09 adds typed `GoldenBehaviorProof` provenance so Promptfoo integration
  smoke rows cannot pass as GoldenTask behavior proof. GoldenTask behavior
  proof requires `krn_behavior_execution`.
- EVI-10 makes evidence capture operator output and help text explicit about
  `--verification`, weak default-template rows, persisted IDs, and the absence
  of hidden command execution.
- C0-01 proves self-hosting write-authority context relevance: the store lacked
  direct Memory Core write-authority memory, so a reviewed MemoryCandidate was
  added and promoted through MemoryReviewGate; a live persisted plan then
  selected `memory_record:f950b8b4-5392-4084-9f98-93881fbe961a` first for
  `seal Memory Core write authority`.
- C1-00 implements the CLI taxonomy in help behavior: `krn --help` groups
  public operator, governed admin, and internal/dev commands; `krn db --help`
  labels DB readiness/smokes as internal runtime plumbing proof, not product
  workflow or quality authority.
- C1-01 narrows DB and CLI root package surfaces: `@krn/db` root exports only
  database connection helpers, DB smokes/readiness move to `@krn/db/dev`,
  concrete Drizzle adapters move to `@krn/db/adapters`, schema access moves to
  `@krn/db/schema`, and `@krn/cli` root exports only `runCli`, `CliRuntime`,
  and `CliResult`.
- C1-02 separates harness root from eval/internal surfaces: `@krn/harness`
  root no longer exports Promptfoo adapter helpers or repository ports,
  Promptfoo helpers move to `@krn/harness/eval`, and repository ports move to
  `@krn/harness/repositories`.
- C1-03 splits repository surfaces: `@krn/harness/repositories` is now a
  curated public repository surface without raw Memory Core write ports, while
  `@krn/harness/repositories/internal` keeps full adapter/persistence plumbing
  for DB adapters and runtime internals.
- C2-00 adds reviewed anti-memory candidate storage: reflection candidate
  writer persists anti-memory candidates, CLI `memory anti add` writes
  candidates instead of final records, `memory anti promote/reject` goes through
  AntiMemoryReviewGate, and the memory-governance DB smoke proves
  candidate-to-record promotion on live Postgres.
- C3-00 expands the real GoldenTask behavior gate from three to six KRN
  behavior proofs: stale memory abstention, anti-memory block, raw recall exact
  proof, observation prefix source-range rejection, evidence command provenance,
  and reflection final-truth rejection. Promptfoo smoke remains integration
  proof only.
- C4-00 adds ADR-0015 and defers worker daemon/job executor runtime. Current
  worker truth remains typed contracts, enqueue ports, Postgres lifecycle
  repository/smoke proof, and explicit future write-authority limits.
- C5-00 stages P7 self-hosting feedback as governed rows in live Postgres:
  three proposed SourceClaims, three proposed MemoryCandidates, and one
  AntiMemoryCandidate. It creates no MemoryRecord or AntiMemoryRecord. It also
  records that standalone EvalCandidate add/persist is missing and belongs to
  C5-01.
- C5-01 accepts ADR-0016: `EvalCandidate` remains proposal-only through
  `feedback_deltas.eval_candidates` and `reflection_records.output.evalCandidates`
  until a real standalone consumer/review path exists. No eval table, CLI,
  worker runtime, Promptfoo authority layer, or dashboard was added.
- C5-02 removes the speculative current `promote_eval_candidate` worker job
  contract and `eval_candidates` allowed write. Eval candidate worker work is
  absent until ADR-0016 preconditions are met.

completed_evidence_pointers:

- self-hosting run ledger:
  `docs/runs/2026-06-23-self-hosting-memory-loop.md`;
- CLI surface decision:
  `docs/architecture/cli-surfaces.md`;
- reset/audit decision records:
  `docs/reviews/repo-reset-audit/*`;
- worker runtime boundary:
  `docs/decisions/ADR-0015-worker-runtime-boundary.md`;
- eval candidate staging decision:
  `docs/decisions/ADR-0016-eval-candidates-remain-proposal-only.md`;
- detailed command transcript:
  `Command Evidence` later in this plan, historical reference only.

context_hygiene:

- do not keep completed slices in the active goal window;
- do not reread repo-reset audit materials unless a live slice names them;
- when a slice is complete, update this snapshot to the next unchecked item and
  compress the slice into a checkpoint note plus command evidence;
- prefer deleting or archiving stale completed-detail blocks over expanding
  the active goal.
- every few completed slices, run a plan condensation pass: active state should
  keep the current objective, next unchecked item, command evidence pointers,
  open risks, and rollback notes only. Remove duplicate explanations, demote
  closed task detail to historical ledger, and do not preserve prose that does
  not change execution.

worktree_hygiene:

- run `git status --short --branch` before and after each slice;
- do not start a new slice while completed work is still uncommitted;
- split completed work into focused Conventional Commits;
- push after each completed slice commit;
- treat push plus clean worktree as part of slice completion, not optional
  follow-up;
- if existing dirty state is unrelated to the current slice, leave it untouched
  and record it instead of mixing it into the slice commit;
- first application of this rule may use one catch-up commit for the already
  accumulated EVI/C0 worktree; all following completed slices must return to
  one focused commit and push per slice;
- if a completed slice cannot be committed or pushed, record the exact blocker
  in this snapshot before continuing.

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
mechanism: original audit review allowed a narrow internal guard as a possible
temporary shape, but live operator correction supersedes that: the `krn audit`
surface is removed, and useful invariants must be re-homed into native
Memory/Source/Evidence mechanisms.
krn_implication: general engineering quality belongs to architecture, types,
tests, naming, and review, not a KRN-branded subsystem.
decision: adopt the abstraction rejection; reject retaining `krn audit` as an
internal guardrail layer.
does_not_prove: every old check was useless as a domain invariant.
consumer: docs cleanup, CLI taxonomy, P1-03, C6-00, C6-01.
falsifier: `krn audit` returns as a product, guardrail, or scanner surface.

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

source_id: user milestone review after P7 self-hosting loop.
trust_tier: high as operator/product direction, medium as implementation truth
until checked against live repo.
mechanism: active reset goal is closed, but Memory Brain readiness is not;
Evidence Integrity must become the next hardening program before candidate
generation, worker runtime, dashboard, or broader memory behavior claims.
krn_implication: evidence command provenance is epistemic infrastructure for
ReviewAssessment, FeedbackDelta, Observation, Reflection, MemoryCandidate, and
EvalCandidate. Weak/default command rows must not masquerade as verification
proof.
decision: adopt.
does_not_prove: the proposed model is already implemented or that DB schema
must change before code inspection.
consumer: Evidence Integrity queue EVI-00..EVI-10.
falsifier: KRN builds more memory/reflection/worker/dashboard behavior while
persisted EvidenceBundle command provenance remains weak or ambiguous.

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
- The reset queue through P7-00 is complete, but KRN is not "done".
- Completed slices are ledger/checkpoint material. They should not be kept in
  the active goal window after their follow-up candidates have been extracted.

## Continuous Hardening Law

KRN should keep improving from its own execution evidence.

Every completed slice must leave a compact checkpoint:

- what changed;
- what proof exists;
- what the proof does not prove;
- what review burden remains;
- which memory/source/eval/anti-memory/skill/policy candidates were discovered;
- which concrete follow-up slice owns each real gap;
- what active context can be dropped after the slice closes.

Do not turn those gaps into a new broad audit product. Repair them directly in
the smallest package/doc/CLI boundary that owns the behavior.

After a slice is complete, move detailed analysis out of the active queue or
leave it only as historical ledger. `GOAL.md` should point to the next unchecked
slice, not keep repeating completed work.

Context budget rule:

Every few completed tasks, condense the active plan/state. Keep:

- current objective;
- first unchecked slice;
- current decisions and open risks;
- command evidence pointers;
- rollback notes.

Remove or demote:

- completed implementation detail that has no next action;
- duplicate rationale;
- old prompts copied into active state;
- prose that sounds useful but does not affect execution.

Architecture cleanliness rule:

Every slice must leave the touched boundary cleaner than it found it. Clean
means:

- narrow public surface;
- explicit ownership and lifecycle;
- typed IO and validated external data;
- no compatibility shim for a wrong abstraction unless a real consumer exists;
- no new audit/quality/meta layer for an ordinary engineering concern;
- no speculative abstraction kept "just in case".

If the clean architecture move is larger than the current slice, record it as a
bounded follow-up instead of sneaking it into the diff.

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
14. `krn audit` is removed as a CLI/product surface; do not rebuild it as an
    audit/guardrail layer.
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
- `packages/harness`: keep as activation/compiler/review-gate layer. Re-home
  useful Memory/Source/Evidence invariants into native mechanisms instead of a
  broad audit scanner.
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
repository smokes
```

`krn audit` is not an internal/dev command class. It is a removed surface.
Mechanical invariants that were accidentally hosted there must live in their
own domain boundaries.

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

## Completed Reset Ledger

The P0-P7 reset task specs below are historical execution ledger. They are kept
for evidence and rollback context only. Do not execute them as active work and
do not reread them for normal continuation unless a live slice explicitly names
one as evidence.

Active work resumes at the first unchecked item listed in
`Active Queue Snapshot`.

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

- [x] Add the historical banner to each target file that still reads like
      current execution truth.
- [x] Preserve historical content below the banner.
- [x] Run verification.
- [x] Commit.

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

- Remaining matches are historical, explicitly rejected, or superseded by
  removal.

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
- rule that DB smokes are not product UX and audit-shaped surfaces are
  historical/delete candidates.

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

### P1-01: Deproductize `krn audit` (Superseded By P1-03 Code Removal)

objective:

Remove product direction for `krn audit` before the later P1-03 code removal.

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
  candidate, or superseded by P1-03 removal.

commit:

```sh
git add README.md PLAN.md docs
git commit -m "docs(audit): deproductize audit surface"
```

rollback:

```sh
git revert <commit>
```

### P1-03: Remove Public `krn audit` Surface

status: complete.

objective:

Delete the active `krn audit` CLI/scanner surface instead of wrapping it in more
guardrails. Preserve only the underlying Memory/Source/Evidence concerns by
moving them into native mechanisms in later slices.

files:

- Modify: `packages/cli/src/parseArgs.ts`
- Modify: `packages/cli/src/runCli.ts`
- Delete: `packages/cli/src/parseAuditArgs.ts`
- Delete: `packages/cli/src/runAuditCommand.ts`
- Delete: `packages/harness/src/audit/*`
- Delete: `packages/db/src/auditSemanticSnapshot.ts`
- Modify: `README.md`
- Modify: `GOAL.md`
- Modify: `docs/architecture/cli-surfaces.md`
- Modify: `PLAN.md`

non-goals:

- no replacement `krn guard`;
- no internal audit UX;
- no new audit categories;
- no broad repo scanner;
- no deletion of legacy `AuditBundle` storage in this slice.

follow-ups:

- C6-00 re-homes former memory/source/evidence invariants into
  MemoryReviewGate, SourceClaim/SourceDecision, and EvidenceBundle behavior.
- C6-01 decides the fate of legacy AuditBundle storage/contracts.

verification:

```sh
pnpm --filter @krn/cli test -- runCli -t "rejects the removed public audit command"
pnpm --filter @krn/cli test
pnpm --filter @krn/harness test
pnpm --filter @krn/db test
pnpm typecheck
pnpm test
git diff --check
rg -n "runAuditChecks|auditChecks|parseAuditArgs|runAuditCommand|createAuditDatabaseRuntime|AuditDatabaseRuntime|auditSemanticSnapshot" packages --glob "*.ts"
```

observed:

- focused `runCli` removal test passed: `audit repo` is rejected with exit 2;
- `@krn/cli`, `@krn/harness`, and `@krn/db` package tests passed;
- full `pnpm test` passed;
- full `pnpm typecheck` passed;
- `git diff --check` passed;
- removed audit command/scanner/runtime symbols have no active TypeScript
  matches under `packages/`;
- legacy `AuditBundle` core/schema/db storage still exists and is queued for
  C6-01 rather than treated as active audit UX.

rollback:

```sh
git restore README.md GOAL.md PLAN.md docs/architecture/cli-surfaces.md packages/cli packages/db packages/harness
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

status: complete.

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

status: complete.

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

status: complete.

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

status: complete.

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

status: complete.

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

status: complete.

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

status: complete.

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

## Continuous Hardening Queue

The reset work above is complete. The following queue keeps the goal alive by
turning completed-slice observations into concrete repair slices.

### C0-00: Persist Real Evidence Command Outcomes

status: complete as interim repair. Superseded by the broader EVI provenance
program below.

objective:

Make `krn evidence capture --persist` record actual verification command
outcomes instead of defaulting to `skipped` rows after commands were run
outside the capture command.

source:

P7-00 run ledger showed that local `pnpm typecheck` and `pnpm test` passed, but
the persisted EvidenceBundle still contained default `skipped` command rows.

mechanism:

Add an explicit command-outcome input path to evidence capture. Keep external
input unknown until parsed by schema/CLI validation. Do not infer command
success from prose or shell history.

required behavior:

- preview and persisted evidence capture can accept command outcomes;
- each command has command text, status, and optional notes/output ref;
- missing outcomes remain weak rows; this interim slice used `skipped`, later
  superseded by EVI-00 `not_run` defaults;
- persisted EvidenceBundle stores only provided outcomes;
- run ledger can cite the persisted command statuses as proof when statuses are
  supplied.

likely files:

- `packages/cli/src/parseEvidenceArgs.ts`
- `packages/cli/src/runEvidenceCaptureCommand.ts`
- `packages/cli/src/runCli.ts`
- `packages/cli/src/parseArgs.ts`
- `packages/cli/src/parseEvidenceArgs.test.ts`
- `packages/cli/src/runCli.test.ts`
- `docs/runs/2026-06-23-self-hosting-memory-loop.md`
- `PLAN.md`

verification:

```sh
pnpm --filter @krn/cli test -- runCli
pnpm typecheck
pnpm test
git diff --check
```

commit:

```sh
git add packages/core packages/schema packages/cli docs/runs PLAN.md
git commit -m "feat(evidence): persist command outcome provenance"
```

rollback:

```sh
git revert <commit>
```

## Evidence Integrity Program

The P7 loop proved the operational spine, not Memory Brain readiness. Evidence
Integrity is now the top hardening program because every downstream memory,
source, observation, reflection, review, and eval decision inherits the quality
of evidence provenance.

Non-goals for EVI:

- no QG-06;
- no audit product expansion;
- no hidden shell runner;
- no terminal transcript scraping;
- no dashboard;
- no worker runtime;
- no automatic memory promotion;
- no broad Promptfoo lane.

### EVI-00: Define Evidence Command Provenance Model

status: complete.

objective:

Make verification command evidence explicit about status, provenance, output,
assertion source, and what it does not prove.

source:

P7 proved local typecheck/test output existed outside the persisted
EvidenceBundle. C0-00 added explicit command outcomes, but the domain model
still cannot distinguish weak default rows from operator-reported or captured
proof with enough precision.

required model:

```txt
EvidenceCommandResult:
  command
  status: passed | failed | skipped | missing | not_run
  provenance:
    default_template
    operator_reported
    captured_output_file
    command_runner
    external_log
  outputRef?
  capturedAt?
  assertedBy?
  doesNotProve
```

rules:

- preserve backwards compatibility where existing `EvidenceCommand` rows are
  already stored;
- default template rows are visibly weak;
- `doesNotProve` is required or generated for every command row;
- no behavior-governing provenance may hide in undocumented metadata.

likely files:

- `packages/core/src/evidenceBundle.ts`
- `packages/schema/src/*`
- `packages/db/src/repositories/mappers.ts`
- `packages/harness/src/repositories/harnessRunRepository.ts`
- `packages/cli/src/runEvidenceCaptureCommand.ts`
- tests for evidence bundle, DB mapper, and CLI evidence capture.

verification:

```sh
pnpm --filter @krn/core test
pnpm --filter @krn/schema test
pnpm --filter @krn/db test
pnpm --filter @krn/cli test -- runCli
pnpm typecheck
git diff --check
```

observed:

- `EvidenceCommand` now models `passed | failed | skipped | missing | not_run`
  status and explicit provenance.
- `normalizeEvidenceCommand` generates weak/default semantics for legacy rows
  and captured-output/operator-reported semantics for supplied command rows.
- Schema parsing accepts typed provenance fields and rejects invalid/blank
  evidence limits.
- DB mapper normalizes persisted JSON rows at the IO boundary and drops unknown
  command statuses.
- CLI evidence capture persists/render normalized command provenance and labels
  default template rows as weak.
- Verification passed:
  `pnpm --filter @krn/core test -- evidenceBundle`,
  `pnpm --filter @krn/schema test -- index`,
  `pnpm --filter @krn/db test -- mappers`,
  `pnpm --filter @krn/cli test -- runCli -t "evidence"`,
  `pnpm typecheck`, `pnpm test`, and `git diff --check`.
- This closes the typed provenance model only. EVI-02..EVI-04 remain open for
  CLI ergonomics, persistence/regression proof, and P7 run-ledger closure.

commit:

```sh
git add packages/core packages/schema packages/db packages/harness packages/cli PLAN.md
git commit -m "feat(evidence): model verification command provenance"
```

### EVI-01: Capture Explicit Verification Evidence In CLI

status: complete.

objective:

Make `krn evidence capture` accept real verification evidence without implying
that KRN ran commands automatically.

source:

C0-00 added `--command`, `--status`, `--exit-code`, and `--output`. The stronger
operator request prefers a first-class verification syntax, for example
`--verification "pnpm typecheck=passed"`, if that becomes the accepted CLI
shape.

required behavior:

- explicit verification entries can be passed in preview and persisted modes;
- unknown statuses fail parse;
- empty command text fails parse;
- if no explicit verification is supplied, default rows are marked weak/default;
- output separates persisted command provenance, operator/manual command
  output, and missing evidence;
- no hidden shell execution.

likely files:

- `packages/cli/src/parseEvidenceArgs.ts`
- `packages/cli/src/runEvidenceCaptureCommand.ts`
- `packages/cli/src/runCli.test.ts`
- `packages/cli/src/parseEvidenceArgs.test.ts`
- `README.md` if CLI usage needs public operator wording.

verification:

```sh
pnpm --filter @krn/cli test -- parseEvidenceArgs runCli
pnpm typecheck
git diff --check
```

observed:

- `krn evidence capture` accepts repeated
  `--verification <command=status>` entries in preview and persisted command
  input paths.
- Verification entries are parsed at the CLI boundary into typed
  `EvidenceCommandStatus` values with `provenance: "operator_reported"`.
- Unknown statuses and empty command text fail parse.
- No command runner, shell inference, or terminal transcript scraping was
  added.
- Focused verification passed:
  `pnpm --filter @krn/cli test -- parseEvidenceArgs` and
  `pnpm --filter @krn/cli test -- runCli -t "explicit verification"`.

commit:

```sh
git add packages/cli README.md PLAN.md
git commit -m "feat(cli): capture explicit verification evidence"
```

### EVI-02: Persist Command Provenance Without Metadata Convention

status: complete.

objective:

Ensure DB persistence round-trips the typed command provenance model.

rules:

- do not add a migration if existing JSON command storage can represent the
  typed model safely;
- if existing JSON is used, validate/narrow it at mapper or IO boundary;
- do not rely on undocumented metadata keys for provenance;
- historical rows without provenance must map to weak/default semantics.

likely files:

- `packages/db/src/repositories/DrizzleHarnessRunRepository.ts`
- `packages/db/src/repositories/mappers.ts`
- `packages/db/src/schema/*` only if schema cannot represent typed command
  provenance;
- DB repository tests.

verification:

```sh
pnpm --filter @krn/db test
pnpm typecheck
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready
git diff --check
```

observed:

- Existing `evidence_bundles.commands` JSONB storage can represent typed
  command provenance; no migration was added.
- `DrizzleHarnessRunRepository.createEvidenceBundle` normalizes commands before
  insert through `evidenceCommandsForPersistence`.
- The DB mapper still narrows raw JSON on readback and maps historical rows
  without provenance to weak/default semantics.
- Verification passed:
  `pnpm --filter @krn/db test -- DrizzleHarnessRunRepository`,
  `pnpm --filter @krn/db test`, `pnpm typecheck`,
  `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`, and
  `pnpm test`, and `git diff --check`.
- DB readiness proof in this shell: Postgres reachable, 11/11 migrations
  applied, pgvector available, brain store ready.

commit:

```sh
git add packages/db packages/core packages/schema PLAN.md
git commit -m "feat(db): persist evidence command provenance"
```

### EVI-03: Guard Self-Hosting Evidence Provenance

status: complete.

objective:

Turn P7 from a one-time run ledger into a regression proof that catches weak or
false command provenance.

minimum proof:

- plan/evidence/observe/reflect loop is represented;
- EvidenceBundle contains explicit command provenance for typecheck/test;
- observe reports no MemoryRecord creation;
- reflect reports no MemoryRecord creation and no automatic candidate rows;
- weak default command rows are not described as verification proof.

allowed implementation shapes:

- harness GoldenTask behavior test;
- CLI integration-style test with no live DB;
- fixture-backed proof under `tests/fixtures`;
- live DB smoke only if explicitly bounded and not required for every unit
  test.

verification:

```sh
pnpm --filter @krn/harness test -- golden
pnpm --filter @krn/cli test -- runCli
pnpm test
pnpm typecheck
git diff --check
```

observed:

- Added a CLI integration-style regression test with a fake persisted
  self-hosting run containing plan and EvidenceBundle records.
- The test proves explicit `operator_reported` and `captured_output_file`
  command provenance for `pnpm typecheck` and `pnpm test` reaches observe
  payloads and is not replaced by weak/default provenance.
- The same test proves observe reports `MemoryRecord created: no`, reflect
  reports `Candidate rows written: no` and `MemoryRecord created: no`, and the
  persisted reflection output has zero memory candidates.
- No live DB dependency is required for this regression proof.
- Verification passed:
  `pnpm --filter @krn/cli test -- runCli -t "guards self-hosting evidence provenance"`,
  `pnpm --filter @krn/harness test -- golden`,
  `pnpm --filter @krn/cli test -- runCli`, `pnpm typecheck`,
  `pnpm test`, and `git diff --check`.

commit:

```sh
git add packages/harness packages/cli tests PLAN.md
git commit -m "test(evidence): guard self-hosting command provenance"
```

### EVI-04: Close P7 Run Ledger Evidence Gap

status: complete.

objective:

Update the P7 run ledger and root plan after the evidence provenance model is
implemented.

must state:

- original P7 gap;
- what was fixed;
- what remains unproved;
- exact commands run;
- whether historical EvidenceBundle rows were left unchanged or migrated.

files:

- `docs/runs/2026-06-23-self-hosting-memory-loop.md`
- `PLAN.md`
- `README.md` if public claims around evidence capture were too broad.

verification:

```sh
pnpm typecheck
pnpm test
git diff --check
```

observed:

- `docs/runs/2026-06-23-self-hosting-memory-loop.md` now records the original
  P7 command-provenance gap, EVI-00..EVI-03 repairs, exact repair verification
  commands, and remaining non-proofs.
- Historical P7 EvidenceBundle rows were left unchanged and not migrated.
- Future captures can persist explicit verification provenance; the historical
  run remains weak command evidence.
- Verification passed: `pnpm typecheck`, `pnpm test`, and `git diff --check`.

commit:

```sh
git add docs/runs PLAN.md README.md
git commit -m "docs(run): close self-hosting evidence provenance gap"
```

### EVI-05: Remote Status Hygiene Before Long-Running Goals

status: complete.

objective:

Prevent future goals from starting with stale assumptions about whether commits
are only local or visible on GitHub.

observed state after this fetch:

```txt
git fetch --prune: passed
git status --short --branch: main...origin/main [ahead 2], with the current C0/EVI work still uncommitted
git log --oneline --decorate --left-right origin/main...main:
  > cc57a93 (HEAD -> main) feat(evidence): capture explicit command outcomes
  > a45cee4 docs(goal): continue KRN hardening backlog
HEAD: cc57a93
origin/main: 87cac53
```

requirements:

- add a lightweight pre-goal status hygiene note to `GOAL.md` or `PLAN.md`;
- require `git fetch --prune` and left-right log before any new broad goal;
- do not block local work merely because branch is ahead, but record exactly
  what is ahead.

verification:

```sh
git fetch --prune
git status --short --branch
git log --oneline --decorate --left-right origin/main...main
git diff --check
```

commit:

```sh
git add GOAL.md PLAN.md
git commit -m "docs(goal): require remote status hygiene"
```

### EVI-06: Activation Relevance Review For Self-Hosting

status: complete.

objective:

Explain whether selected memory/source context actually helped the P7
self-hosting task.

observed:

- The P7 ledger selected four source claims and two memory records.
- The first EVI-06 DB check timed out because the local `krn-postgres` service
  was not running. Root cause: no Docker container was active and nothing
  listened on `54329`.
- `docker compose up -d krn-postgres` restored the local brain store.
  `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`
  passed with 11/11 migrations and pgvector available.
- DB-backed expansion of execution run
  `00d74890-b18d-498b-90bf-f172c26cffb6` resolved context assembly
  `72fdc214-54cb-4979-91ca-18551e4833f4` with 6 inclusions and 0 exclusions.
- Result: selected context was not dangerous or stale by DB-backed row
  evidence, but it was only partly useful. It strongly supported evidence
  provenance/governance caution and did not directly reduce Memory Core
  write-authority decision burden.
- Decision: keep all six selected items for this run, create no anti-memory
  candidate, add no ranking subsystem, strengthen/demote only the relevant
  evidence-provenance memories later, and carry the direct-relevance gap into
  `C0-01`.

required review table:

```txt
included item
expected use
actual use
helped | hurt | neutral | stale
strengthen | demote | keep | anti-memory candidate
reason
```

non-goals:

- no dashboard;
- no new ranking subsystem before the review proves a specific ranking failure;
- no hard-coded recall.

verification:

```sh
pnpm --filter @krn/harness test -- activation
pnpm typecheck
git diff --check
```

commit:

```sh
git add docs/runs packages/harness PLAN.md
git commit -m "docs(activation): review self-hosting context relevance"
```

### EVI-07: Reflection Candidate Path After Evidence Integrity

status: complete.

objective:

Only after EVI-00..EVI-04, decide how reflection should produce useful
candidate rows from self-hosting evidence without mutating Memory Core.

requirements:

- reflection may create candidate/report records only;
- no MemoryRecord promotion;
- candidates must carry evidence provenance and `doesNotProve`;
- weak/default command evidence cannot produce high-confidence memory
  candidates.

observed:

- `ReflectionCandidateEvidence` is now a typed core contract for reflection
  candidate proposals.
- `buildReflectionCandidateGenerationPlan` blocks invalid candidate evidence
  and blocks high-confidence memory candidates when their evidence provenance is
  `default_template`.
- `writeReflectionCandidates` writes candidate rows only, never MemoryRecord,
  and persists typed reflection candidate evidence under the explicit
  `reflectionCandidateEvidence` metadata key for existing stores.
- `DrizzleReflectionRepository` no longer drops candidate proposal arrays when
  reading persisted `reflection_records.output` JSON.
- No DB migration was added; this slice narrows existing JSONB read/write
  behavior and candidate writer semantics.

verification:

```sh
pnpm --filter @krn/core test -- reflection
pnpm --filter @krn/harness test -- reflection
pnpm --filter @krn/db test -- DrizzleReflectionRepository
pnpm typecheck
git diff --check
```

commit:

```sh
git add packages/core packages/harness packages/db PLAN.md
git commit -m "feat(reflection): stage evidence-grounded candidates"
```

### EVI-08: Candidate To Memory Review Loop Proof

status: complete.

objective:

Prove the loop candidate -> review -> memory -> activation on one small,
reviewed, source-grounded case.

requirements:

- MemoryCandidate has evidence provenance;
- MemoryReviewGate rejects weak or missing provenance;
- reviewed MemoryRecord can influence a later activation;
- anti-memory remains first-class for rejected claims.

observed:

- `MemoryReviewGate` now requires typed candidate evidence provenance under the
  explicit `reflectionCandidateEvidence` metadata key before promotion.
- Missing candidate evidence and weak `default_template` provenance are rejected
  before `promoteReviewedMemoryCandidate` is called.
- Review-gate metadata carries the reviewed candidate evidence alongside
  `evidenceReviewedRef` and reviewed source claim IDs.
- A focused harness proof promotes a reviewed candidate into MemoryRecord and
  then shows that MemoryRecord can enter a later activation context.
- Existing anti-memory activation behavior remains covered in harness memory
  behavior tests; this slice did not add an automatic anti-memory promotion
  path.

verification:

```sh
pnpm --filter @krn/harness test -- memory
pnpm --filter @krn/cli test -- runCli
pnpm typecheck
pnpm test
git diff --check
```

commit:

```sh
git add packages/core packages/harness packages/cli PLAN.md
git commit -m "test(memory): prove reviewed candidate activation loop"
```

### EVI-09: Promptfoo And GoldenTask Boundary For Self-Hosting

objective:

Ensure Promptfoo remains integration/result-adapter proof while GoldenTask or
KRN behavior tests own the self-hosting evidence regression.

requirements:

- Promptfoo smoke must not claim self-hosting behavior proof;
- GoldenTask behavior gate or equivalent KRN test protects the self-hosting
  provenance invariant;
- docs state what each lane proves and does not prove.

verification:

```sh
pnpm --filter @krn/harness test -- golden
pnpm exec promptfoo --version
pnpm eval:promptfoo:smoke
pnpm typecheck
git diff --check
```

commit:

```sh
git add packages/harness tests docs PLAN.md
git commit -m "test(eval): bound self-hosting regression proof"
```

### EVI-10: Operator Ergonomics For Evidence Capture

objective:

Make the evidence capture CLI understandable for a real operator without
turning it into a dashboard or quality engine.

requirements:

- help text shows explicit verification/provenance examples;
- output labels weak/default command rows plainly;
- persisted IDs remain visible;
- no hidden command runner;
- no broad audit/check product language.

verification:

```sh
pnpm --filter @krn/cli test -- runCli
pnpm typecheck
git diff --check
```

commit:

```sh
git add packages/cli README.md PLAN.md
git commit -m "docs(cli): clarify evidence capture provenance"
```

### C0-01: Improve Self-Hosting Context Relevance

objective:

Make `krn plan --task "seal Memory Core write authority" --persist` retrieve
directly relevant Memory Core write-authority context, not mostly adjacent
governance/source-graph context.

source:

P7-00 selected six context items. They were not harmful, but they did not
directly surface the completed Memory Core write-authority decisions from P2
and worker authority decisions from P6.

mechanism:

Inspect activation candidate ranking and selected project memory/source records
for this task. Add a focused regression proof only if the missing context exists
in the store or fixture data. If the store lacks the relevant memory, create a
reviewed MemoryCandidate path rather than hard-coding recall.

verification:

```sh
pnpm --filter @krn/harness test -- activation
pnpm --filter @krn/cli test -- runCli
pnpm typecheck
git diff --check
```

commit:

```sh
git add packages/harness packages/cli PLAN.md
git commit -m "test(activation): improve self-hosting context relevance"
```

### C1-00: Separate Public CLI From Internal Dev Commands

objective:

Move the P1 CLI taxonomy from docs-only classification into command behavior or
help text so users cannot confuse internal smokes with the public operator
workflow. This no longer preserves any `krn audit` guardrail; P1-03 removes that
surface instead.

source:

P1-00 classified public operator, governed admin, and internal/dev surfaces.
P1-03 removes `krn audit` from CLI routing/help. Remaining work is normal public
operator vs governed admin vs DB smoke ergonomics.

mechanism:

Add explicit command grouping in usage/help first. Only rename or hide commands
after the help contract is proved and existing tests are updated.

verification:

```sh
pnpm --filter @krn/cli test -- runCli
pnpm typecheck
git diff --check
```

commit:

```sh
git add packages/cli docs/architecture PLAN.md
git commit -m "feat(cli): separate operator and internal surfaces"
```

### C1-01: Narrow Package Barrels From Planned To Enforced

objective:

Turn `docs/architecture/package-surfaces.md` from a plan into enforced package
exports where broad barrels still expose internals as product API.

source:

P1-02 planned package barrel narrowing but deliberately left broad wildcard
exports outside the first reset slice.

mechanism:

Start with one package at a time. Preserve tests. Prefer named exports for
stable contracts and move smokes/concrete adapters behind explicit internal
paths.

verification:

```sh
pnpm typecheck
pnpm test
git diff --check
```

commit:

```sh
git add packages docs/architecture PLAN.md
git commit -m "refactor(exports): narrow public package surface"
```

### C1-02: Separate Harness Root From Eval/Internal Surfaces

objective:

Narrow `@krn/harness` root so canonical harness behavior is not mixed with
Promptfoo adapter helpers or internal repository plumbing by default.

source:

C1-01 enforced DB and CLI root surfaces first.
`docs/architecture/package-surfaces.md` still records harness root and repository-port barrels as remaining
surface authority debt.

mechanism:

Inspect root imports from `@krn/harness`, then add explicit subpaths only for
surfaces that are already conceptually separate. Do not hide canonical
GoldenTask behavior or MemoryReviewGate. Do not rename package APIs without
updating all consumers and tests.

verification:

```sh
pnpm typecheck
pnpm test
git diff --check
```

commit:

```sh
git add packages/harness packages/db packages/cli packages/codex-adapter docs/architecture PLAN.md GOAL.md
git commit -m "refactor(exports): separate harness package surfaces"
```

### C1-03: Split Repository Port Public And Internal Surfaces

objective:

Separate reviewed public memory/source/harness repository ports from internal
persistence plumbing, especially around Memory Core write authority.

source:

C1-01 left `packages/harness/src/repositories/index.ts` broad on purpose.
Repository-port narrowing depends on MemoryReviewGate and reviewed promotion
authority, so it needs its own slice.

mechanism:

Classify repository ports by public contract vs internal persistence plumbing.
Expose Memory Core write authority through reviewed promotion paths only; do
not make raw persistence writes more convenient.

verification:

```sh
pnpm typecheck
pnpm test
git diff --check
```

commit:

```sh
git add packages/harness packages/db packages/cli docs/architecture PLAN.md GOAL.md
git commit -m "refactor(exports): split repository port surfaces"
```

### C2-00: Add Reviewed Anti-Memory Candidate Storage

objective:

Give reflection unsupported anti-memory proposals a reviewed candidate surface
instead of leaving them as unsupported in-memory proposals.

source:

P3-02 found no anti-memory candidate store or policy candidate store. The writer
therefore reports unsupported staged candidates instead of creating final truth.

mechanism:

Design candidate-only storage and review semantics before any
AntiMemoryRecord write. Do not allow reflection to create final anti-memory.

verification:

```sh
pnpm --filter @krn/core test -- reflection
pnpm --filter @krn/harness test -- reflection
pnpm typecheck
pnpm test
git diff --check
```

commit:

```sh
git add packages/core packages/harness packages/schema packages/db packages/cli PLAN.md
git commit -m "feat(memory): stage reviewed anti-memory candidates"
```

### C3-00: Expand Real Golden Behavior Gate Coverage

status: complete.

objective:

Extend `runKrnBehaviorGoldenGate` beyond the first three invariants to cover
raw recall exact proof, observation prefix source-range rejection, and evidence
capture command provenance once C0-00 exists.

source:

P5-01 created the first real behavior gate but intentionally covered only stale
memory abstention, anti-memory activation block, and reflection final-truth
rejection.

mechanism:

Each new case must execute KRN code paths and produce proof rows for
`runGoldenTaskFixtures`; Promptfoo smoke remains integration only.

outcome:

`runKrnBehaviorGoldenGate` now produces six accepted
`krn_behavior_execution` proof rows. The added rows execute:

- activation raw recall trigger generation for exact-proof source claims;
- context assembly rejection for selected observation prefix items without
  source ranges;
- EvidenceBundle command provenance normalization for weak default rows versus
  operator-reported passed rows.

verification:

```sh
pnpm --filter @krn/harness test -- golden
pnpm typecheck
git diff --check
```

commit:

```sh
git add packages/harness tests PLAN.md
git commit -m "test(eval): expand real KRN behavior gate"
```

### C4-00: Decide Worker Runtime ADR Before Execution

status: complete.

objective:

Before any worker daemon/job executor exists, write an ADR that decides whether
KRN needs a worker runtime now, what writes it may perform, and what falsifies
the decision.

source:

P6-00 and P6-01 proved workers are contract-only and hardened job authority.
They did not authorize runtime execution.

mechanism:

Use source -> mechanism -> KRN implication -> decision/rejection -> falsifier.
If runtime is rejected for now, record the rejection and stop.

outcome:

ADR-0015 records `Decision status: defer`. Workers remain typed contracts,
enqueue ports, and Postgres worker-job lifecycle proof only. No worker daemon,
poller, recurring background loop, job executor, autonomous maintenance, or
Memory Core writer is accepted in this epoch.

verification:

```sh
git diff --check
```

commit:

```sh
git add docs/decisions PLAN.md
git commit -m "docs(workers): decide runtime execution boundary"
```

### C5-00: Convert Self-Hosting Run Gaps Into Candidates

status: complete.

objective:

Turn P7-00 gaps into explicit memory/source/eval/anti-memory candidates through
governed candidate commands rather than leaving them only in a run ledger.

source:

`docs/runs/2026-06-23-self-hosting-memory-loop.md` records one anti-memory
candidate, one eval candidate, and several gaps.

mechanism:

Use governed candidate commands with `--persist` only after DB readiness passes
in the current shell. Do not promote candidates in the same slice.

outcome:

C5-00 persisted:

- source claims:
  `58e28e58-d4c8-4196-861e-cb14caeb08e1`,
  `479b1ce8-9904-42ab-a8d1-393a2bacf685`,
  `302f88f7-71b0-4a86-8521-330dee4713fe`;
- memory candidates:
  `b40cac51-73d6-4974-966b-36833c13e757`,
  `1ea7bb3a-6fa0-404a-b284-adeeb9183b6a`,
  `8beb1776-355f-477d-bba0-ebaeb121cc96`;
- anti-memory candidate:
  `45657a7d-d245-4680-83b2-a6dcddccf5e8`.

Readback confirmed `c5_memory_records=0` and `c5_anti_memory_records=0`.
The P7 eval candidate was not faked as a row. C5-01 owns deciding the governed
EvalCandidate staging path.

verification:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready
pnpm typecheck
git diff --check
```

commit:

```sh
git add docs/runs PLAN.md
git commit -m "docs(run): stage self-hosting feedback candidates"
```

### C5-01: Decide Governed EvalCandidate Staging Path

status: complete.

objective:

Decide whether `EvalCandidate` should remain FeedbackDelta/ReflectionRecord
proposal-only or gain a governed operator add/persist path comparable to
`krn memory candidate add` and `krn memory anti add`.

source:

C5-00 persisted source claim `479b1ce8-9904-42ab-a8d1-393a2bacf685` and memory
candidate `1ea7bb3a-6fa0-404a-b284-adeeb9183b6a`, which record that the P7 eval
candidate could not be staged as a standalone governed row through current CLI
surfaces.

mechanism:

Inspect current `EvalCandidate`, `FeedbackDelta`, reflection candidate writer,
DB mappers, and CLI surfaces. Either write a small ADR/decision that eval
candidates intentionally remain proposal-only, or implement the narrowest
governed staging path. Do not build Promptfoo authority, an eval platform,
dashboard, worker, or automatic promotion.

outcome:

ADR-0016 accepts proposal-only eval candidate staging for the current kernel.
The governed current carriers are:

- `FeedbackDelta.evalCandidates` persisted in
  `feedback_deltas.eval_candidates`;
- `ReflectionRecord.output.evalCandidates` persisted in
  `reflection_records.output`.

No standalone `eval_candidates` table, `krn eval candidate add`, eval review
gate, worker runtime, Promptfoo authority layer, dashboard, or eval platform
was added. The falsifier is a real consumer that needs independent eval
candidate review/promotion/execution beyond parent feedback/reflection
lineage.

The slice also found one follow-up: worker job contracts mentioned
`promote_eval_candidate` and allowed writes to `eval_candidates`. C5-02 aligned
that contract with ADR-0016.

verification:

```sh
pnpm typecheck
pnpm test
git diff --check
```

commit:

```sh
git commit -m "docs(eval): decide governed candidate staging"
```

### C5-02: Align Worker Eval Candidate Contract

status: complete.

objective:

Remove or qualify the speculative worker eval-candidate contract so it does
not imply a current standalone `eval_candidates` table or eval promotion
runtime after ADR-0016.

source:

ADR-0016 accepts proposal-only eval candidate staging. Before C5-02,
`packages/workers/src/jobTypes.ts` included `promote_eval_candidate`,
`PromoteEvalCandidatePayload`, and `allowedWrites: ["worker_jobs",
"outbox_events", "eval_candidates"]`, while `packages/db` had no standalone
`eval_candidates` table.

mechanism:

Inspect worker package tests, DB worker job types/smoke, and ADR-0015. Choose
the smallest honest cleanup:

- either remove/defer `promote_eval_candidate` from current worker job types;
- or rename/qualify it as future-only documentation without exposing it as a
  runnable current job type.

Do not add worker runtime, eval table, eval CLI, or Promptfoo authority in this
slice.

outcome:

The speculative current eval worker surface was removed:

- `packages/workers/src/jobTypes.ts` no longer exports
  `promote_eval_candidate`, `PromoteEvalCandidatePayload`, or
  `eval_candidates` as an allowed write;
- `packages/db/src/repositories/workerJobTypes.ts` no longer accepts
  `promote_eval_candidate` as a current worker job type;
- `packages/db/src/workerJobSmoke.ts` no longer manufactures eval candidate
  smoke payloads;
- worker docs and ADR-0015 now say eval candidate worker jobs are absent until
  ADR-0016 preconditions are met.

This removes the current-contract implication that standalone eval candidate
storage or promotion runtime exists.

verification:

```sh
pnpm --filter @krn/workers test
pnpm --filter @krn/db test -- workerJob
pnpm typecheck
git diff --check
```

observed:

- focused workers tests passed;
- DB worker-job test command passed;
- full workspace typecheck passed;
- `git diff --check` passed.

commit:

```sh
git commit -m "refactor(workers): align eval candidate contract"
```

### C6-00A: Re-home Memory Review Signals

status: complete.

objective:

Recover the useful Memory Core review signals from the removed audit scanner as
a native pure core mechanism. This is not a new audit layer and does not mutate
Memory Core.

source:

The removed scanner contained useful memory checks:

- stale high-confidence memory should require review;
- repeated hurt/stale feedback should require demotion or invalidation review;
- active/stale memory with no positive application feedback is weak evidence of
  usefulness.

mechanism:

`packages/core/src/memory.ts` now exposes `assessMemoryRecordReviewSignals`,
which returns typed review signals for one `MemoryRecord`. Consumers can use the
signals in review/activation flows without a broad repo scanner.

does_not_prove:

- Memory is automatically demoted or invalidated;
- activation consumes the signals yet;
- all former audit invariants have been re-homed.

verification:

```sh
pnpm --filter @krn/core test -- memory
pnpm --filter @krn/core typecheck
```

observed:

- focused memory test passed;
- core typecheck passed.
- after the audit-surface purge and C6-00A, full `pnpm test`,
  `pnpm typecheck`, and `git diff --check` passed.

rollback:

```sh
git restore packages/core/src/memory.ts packages/core/src/memory.test.ts PLAN.md
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
- [x] P1-03 Remove public `krn audit` CLI and harness audit scanner.
- [x] P2-00 Seal Memory Core write authority.
- [x] P2-01 Type SourceClaim project scope.
- [x] P2-02 Promote behavior metadata to typed fields.
- [x] P3-00 Define observation staging doctrine.
- [x] P3-01 Prove observation/reflection invariants.
- [x] P3-02 Create reviewed candidate writer from ReflectionRecord.
- [x] P4-00 Define activation as admission control.
- [x] P4-01 Add noisy context golden proofs.
- [x] P4-02 Type activation trace decisions.
- [x] P5-00 Bound Promptfoo claims.
- [x] P5-01 Add first real behavior eval gate.
- [x] P6-00 Mark worker runtime truth.
- [x] P6-01 Harden worker job contracts.
- [x] P7-00 Run first governed self-hosting loop.
- [x] C0-00 Persist real evidence command outcomes.
- [x] EVI-00 Define evidence command provenance model.
- [x] EVI-01 Capture explicit verification evidence in CLI.
- [x] EVI-02 Persist command provenance without metadata convention.
- [x] EVI-03 Guard self-hosting evidence provenance.
- [x] EVI-04 Close P7 run ledger evidence gap.
- [x] EVI-05 Remote status hygiene before long-running goals.
- [x] EVI-06 Activation relevance review for self-hosting.
- [x] EVI-07 Reflection candidate path after Evidence Integrity.
- [x] EVI-08 Candidate to Memory Review loop proof.
- [x] EVI-09 Promptfoo and GoldenTask boundary for self-hosting.
- [x] EVI-10 Operator ergonomics for evidence capture.
- [x] C0-01 Improve self-hosting context relevance.
- [x] C1-00 Separate public CLI from internal dev commands.
- [x] C1-01 Narrow package barrels from planned to enforced.
- [x] C1-02 Separate harness root from eval/internal surfaces.
- [x] C1-03 Split repository port public and internal surfaces.
- [x] C2-00 Add reviewed anti-memory candidate storage.
- [x] C3-00 Expand real GoldenTask behavior gate coverage.
- [x] C4-00 Decide worker runtime ADR before execution.
- [x] C5-00 Convert self-hosting run gaps into candidates.
- [x] C5-01 Decide governed EvalCandidate staging path.
- [x] C5-02 Align worker EvalCandidate contract.
- [x] C6-00A Re-home memory review signals as pure core behavior.
- [ ] C6-00 Re-home former memory/source/evidence audit invariants into native
  MemoryReviewGate, SourceClaim/SourceDecision, and EvidenceBundle mechanisms.
- [ ] C6-01 Decide whether legacy AuditBundle storage is deleted, renamed, or
  migrated into EvidenceBundle/ReviewAssessment lineage.

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
- User correction: do not add guardrails around `krn audit`; if the surface is
  wrong, remove it. The old audit scanner mixed real Memory/Source/Evidence
  invariants with broad repo-scanner/productized-audit framing, so retained
  invariants must move to native mechanisms rather than remain in audit code.
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
- P4-01 found most noisy-context cases already existed in golden tests/fixtures:
  stale abstention, anti-memory block, broad dump rejection, unsupported source
  decision rejection, and observation prefix source-range gates. The missing
  golden-specific case was raw recall on exact proof.
- P4-02 did not require a DB migration. Activation trace decisions are typed at
  the repository input boundary; the Drizzle adapter serializes those fields
  into existing metadata JSON as a persistence snapshot because the current
  schema has no dedicated columns for these trace fields.
- P5-00 found the README already bounded Promptfoo correctly, but the historical
  QG-05 decision and committed smoke fixture/provider still used wording that
  could be read as behavior proof (`behavior smoke proof`, `KRN golden proof`,
  `status=passed`, and tasks beginning with `Prove ...`). Those surfaces now
  say integration smoke and explicitly state that the smoke does not execute
  KRN behavior.
- P5-00 verification command `rg -n "Promptfoo|promptfoo|smoke|behavior proof|integration smoke" README.md docs tests packages`
  is intentionally broad and noisy because it includes historical run logs and
  unrelated DB smoke files. The bounded decision used target-specific follow-up
  scans for QG-05/Promptfoo fixtures to prove the overclaiming phrases were
  removed from the P5 target surfaces.
- P5-01 found that the existing golden behavior tests already execute real KRN
  functions, but the GoldenTask runner path still depended on supplied proof
  rows. The new gate generates those proof rows by executing real activation
  and reflection contract code for the first three protected invariants.
- P5-01 also found that `ReflectionOutput` correctly disallows final-truth
  targets at the TypeScript boundary. The real gate therefore uses
  `assessReflectionOutputContract` for a reflection-like untrusted payload
  instead of forcing `memory_record` into the typed `ReflectionOutput` union.
- P6-00 found README and root PLAN already bounded worker runtime correctly,
  and `packages/workers` already exposes `requiresBackgroundLoop: false`. The
  only active-doc overclaim found was `docs/architecture/package-boundaries.md`
  saying workers owned "execution boundaries"; that now says enqueue contracts
  and contract/skeleton-only truth.
- P6-00 verification scan is noisy by design because `docs/materials/` contains
  raw source proposals and `docs/runs/` contains historical worker dogfood
  ledgers. The active-current surfaces now distinguish worker job persistence
  and smoke proof from job execution, daemon, throughput, or autonomous
  maintenance.
- P6-01 did not need a worker runtime, DB migration, or schema package change.
  The hardening belongs to typed worker job descriptors: current jobs can
  declare write authority and Memory Core gates without claiming execution.
- P7-00 initially hit the expected DB environment boundary: plain
  `pnpm db:ready` failed because `KRN_DATABASE_URL` was absent in the current
  shell. Starting the local `krn-postgres` compose service and passing the
  runbook URL made the brain store ready in this shell.
- P7-00 found the first self-hosting flow is operational but not yet strong as
  command-proof capture: `krn evidence capture --persist` persisted default
  verification command rows as `skipped` even though `pnpm typecheck` and
  `pnpm test` had just been run manually. The run ledger records the stronger
  local command output separately.
- P7-00 selected six context items. The selected memory/source context helped
  with governance-proof caution and source graph persistence boundaries, but it
  did not directly surface a Memory Core write-authority memory for the P7
  self-hosting objective.
- C0-00 did not need a core or schema package change. `EvidenceCommand` already
  carried `status`, `exitCode`, and `outputPath`; the missing behavior was the
  CLI parser/runtime path from explicit operator-provided outcomes into the
  EvidenceBundle.
- The operator milestone review sharpened C0-00 into a broader Evidence
  Integrity program. Explicit command outcomes are useful, but insufficient
  without typed provenance, `doesNotProve`, weak/default semantics, persistence
  round-trip proof, and a self-hosting regression guard.
- After `git fetch --prune`, remote state was narrower than the older
  `ahead 21` status: `origin/main` was at `87cac53` and local `main` was ahead
  by `a45cee4` before the current uncommitted work.
- After the EVI-05 refresh, remote state is explicit: `git fetch --prune`
  passed, `origin/main` remains at `87cac53`, and local `main` is ahead by two
  commits: `cc57a93 feat(evidence): capture explicit command outcomes` and
  `a45cee4 docs(goal): continue KRN hardening backlog`.
- EVI-06 initially hit `CONNECT_TIMEOUT localhost:54329` because local
  `krn-postgres` was not running. After `docker compose up -d krn-postgres`,
  DB readiness passed with 11/11 migrations and pgvector available, and the
  P7 context IDs were expanded from Postgres for the activation relevance
  review.
- EVI-07 found an existing candidate writer, but memory candidate proposals did
  not carry typed evidence provenance/`doesNotProve`, high-confidence memory
  candidates were not blocked when backed only by default-template command
  evidence, and DB reflection readback discarded persisted candidate proposal
  arrays. The slice fixed those three gaps without adding a migration or
  MemoryRecord mutation path.
- EVI-08 found that `MemoryReviewGate` checked source lineage and review refs
  but did not inspect the candidate evidence provenance introduced by EVI-07.
  The gate now rejects missing or weak candidate evidence before promotion and
  preserves the reviewed candidate evidence in review-gate metadata.
- EVI-09 found that Promptfoo smoke/provider output was already bounded with
  `doesNotExecuteKrnBehavior=true`, but the mapped proof type did not preserve
  the distinction. `GoldenBehaviorProof` now carries explicit provenance and
  `runGoldenTaskFixtures` rejects `promptfoo_integration_smoke` as behavior
  proof even when the Promptfoo row passes.
- EVI-10 found evidence capture already persisted IDs and weak/default command
  labels, but top-level help did not show the operator-facing
  `--verification` flow and preview output still used "Persisted command
  provenance" wording. Help now includes explicit verification examples, and
  evidence capture output states that no shell commands are executed.

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
- 2026-06-23: Public `krn audit` is removed from CLI routing/help and the
  harness audit scanner export is deleted. Useful Memory/Source/Evidence
  invariants from the old scanner are not discarded as concepts; they are
  queued for native MemoryReviewGate, SourceClaim/SourceDecision, and
  EvidenceBundle mechanisms.
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
- 2026-06-23: P4-01 adds `golden-case-memory-005-a` for exact-proof raw recall.
  Golden memory behavior now asserts that included exact-proof source claims
  produce `exact_proof_required` raw recall triggers with source-claim evidence
  hints.
- 2026-06-23: P4-02 types activation trace decisions at the repository port:
  expected use, raw recall, anti-memory hit, exclusion category, source support
  state, and activation abstention reason are explicit inputs. DB metadata is
  retained only as a compatible persistence snapshot, not as caller-side
  behavior authority.
- 2026-06-23: P5-00 keeps Promptfoo as a bounded runner/result adapter only.
  The committed local Promptfoo smoke proves dependency/config/provider/output
  wiring and result writing; it explicitly does not prove KRN memory,
  anti-memory, activation, observation, reflection, or review-gate behavior.
- 2026-06-23: P5-01 adds the first real GoldenTask behavior gate in harness.
  `runKrnBehaviorGoldenGate` generates `GoldenBehaviorProof` records by running
  real KRN behavior for stale-memory abstention, anti-memory activation block,
  and reflection final-truth rejection, then feeds those proofs through
  `runGoldenTaskFixtures`.
- 2026-06-23: P6-00 records worker truth as contract/skeleton only. Worker job
  definitions, enqueue ports, Postgres persistence, and smokes may exist, but
  no worker daemon, job executor, background loop, autonomous maintenance, or
  Memory Core mutation runtime is claimed as built.
- 2026-06-23: P6-01 hardens maintenance worker job contracts before runtime.
  Each job descriptor now declares input schema, idempotency key, completed
  output event, failed state, allowed writes, forbidden writes, and Memory Core
  gate constraints. Current worker contracts forbid direct writes to
  MemoryRecord, AntiMemoryRecord, SourceClaim, and SourceDecision truth.
- 2026-06-23: P7-00 accepts the first governed self-hosting loop as operational
  proof, not candidate-quality proof. The persisted run links plan, evidence,
  observation, feedback, and reflection records while preserving no automatic
  MemoryRecord mutation.
- 2026-06-23: P7-00 records a follow-up product gap: evidence capture must not
  present default `skipped` command rows as verification proof when real command
  output exists outside the persisted EvidenceBundle.
- 2026-06-23: C0-00 adds an explicit evidence command outcome input path to
  `krn evidence capture`. The CLI accepts repeated `--command ... --status ...`
  groups with optional `--exit-code` and `--output`; missing/default outcomes
  are weak `not_run` rows after EVI-00. KRN still does not infer command success
  from prose, shell history, or local output files.
- 2026-06-23: EVI-01 adds explicit
  `--verification <command=status>` syntax for operator-reported command
  evidence. This preserves manual evidence without pretending KRN executed the
  commands.
- 2026-06-23: EVI-02 keeps command provenance in the existing
  `evidence_bundles.commands` JSONB field, but normalizes it at the DB
  repository write boundary and validates/narrows it at mapper readback. No DB
  migration is needed for this slice.
- 2026-06-23: EVI-03 turns the P7 self-hosting provenance gap into a CLI
  regression proof. The proof represents plan/evidence/observe/reflect,
  preserves explicit command provenance into observation payloads, and confirms
  observe/reflect do not create MemoryRecord truth or automatic candidate rows.
- 2026-06-23: EVI-04 closes the P7 run-ledger evidence gap for future work by
  documenting the EVI-00..EVI-03 repairs, exact verification commands, remaining
  non-proofs, and the decision not to rewrite the historical P7 EvidenceBundle
  rows.
- 2026-06-23: EVI-09 makes GoldenTask proof provenance explicit. Promptfoo
  result-adapter rows may be mapped into proof-shaped records for reporting,
  but `promptfoo_integration_smoke` is not accepted as GoldenTask behavior
  proof; behavior proof requires `krn_behavior_execution`.
- 2026-06-23: EVI-10 keeps evidence capture as an operator evidence recorder,
  not a command runner or quality product. CLI help and output now show
  `--verification` examples, weak default-template semantics, and no hidden
  command execution.
- 2026-06-23: Adopt Evidence Integrity as the next priority program after P7.
  Do not continue into candidate generation, worker runtime, dashboard, or
  broader memory behavior until command provenance can say what was run, how it
  was observed, and what it does not prove.

## Outcomes & Retrospective

Current outcome:

- Root activation contract and root execution plan are reset.
- Historical planning ledgers are bannered as non-current truth.
- README is aligned with root `GOAL.md` and root `PLAN.md`.
- Productized QG-06 / anti-slop / audit automation direction is rejected or
  historical wherever the P0-04 scan finds it.
- CLI surfaces are classified in `docs/architecture/cli-surfaces.md`.
- `krn audit` is removed from active CLI routing/help and harness audit scanner
  exports; no QG-06, no new audit categories, no public/internal guardrail UX.
- DB, CLI, harness, and repository public/internal package surfaces are narrowed
  in source and recorded in `docs/architecture/package-surfaces.md`.
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
- Noisy-context golden coverage now includes stale memory abstention,
  anti-memory block, broad context dump rejection, unsupported source decision
  rejection, observation prefix source-range requirement, and raw recall on
  exact proof.
- Activation trace persistence now receives typed decision fields for expected
  use, raw recall, anti-memory hit, exclusion category, source support state,
  and activation abstention reason. DB metadata stores a compatibility snapshot
  of those fields without adding schema columns in this slice.
- Promptfoo/QG-05 current claims are bounded: README says smoke proves runner
  integration and result mapping only, QG-05 says behavior proofs require evals
  that actually execute KRN behavior, and the committed smoke output includes
  `doesNotExecuteKrnBehavior=true`.
- First real GoldenTask behavior gate exists in harness. It covers stale memory
  abstention, anti-memory blocking, and reflection non-mutation by executing
  KRN functions and producing proof rows for `runGoldenTaskFixtures`.
- GoldenTask behavior proof now has typed provenance. Promptfoo
  `promptfoo_integration_smoke` rows are rejected by `runGoldenTaskFixtures`
  as behavior proof; only `krn_behavior_execution` proof can satisfy the
  behavior gate.
- Worker runtime truth is marked at the package and architecture surfaces:
  workers are typed job definitions/enqueue contracts only until a runtime is
  explicitly accepted.
- Worker job contracts now carry explicit write-authority fields and Memory
  Core gate constraints before any worker runtime exists.
- First governed self-hosting loop is recorded in
  `docs/runs/2026-06-23-self-hosting-memory-loop.md`.
- Reset queue P0-P7 is fully checked and P7-00 is committed with final
  verification evidence.
- C0-00 lets future EvidenceBundles persist real command outcome provenance
  when the operator supplies it explicitly.
- Evidence Integrity queue EVI-00..EVI-10 is complete in the current worktree.
- C0-01 found the live DB had no direct Memory Core write-authority memory for
  self-hosting plan activation. The repair used the reviewed MemoryCandidate
  path instead of hard-coded recall.
- C1-00 did not rename commands. It made the existing CLI taxonomy visible in
  help behavior first, preserving command compatibility while removing public
  ambiguity around DB smokes/readiness.
- Continuous hardening queue C0-C5 is active. The first unchecked item is
  C5-01: Decide governed EvalCandidate staging path.
- C3-00 found no need for a new eval subsystem. The existing
  `runKrnBehaviorGoldenGate` path could cover raw recall, observation prefix
  source-range rejection, and EvidenceBundle command provenance by executing
  current KRN functions and passing the resulting `krn_behavior_execution`
  proof rows through `runGoldenTaskFixtures`.
- C4-00 found worker runtime is still premature. The repo already has typed job
  descriptions, enqueue ports, Postgres worker job lifecycle repository, and DB
  smoke proof, but no evidence that a daemon/poller is needed before C5 stages
  self-hosting feedback as governed candidates.
- C5-00 found that memory candidates, anti-memory candidates, and source claims
  have governed operator persistence paths, but standalone EvalCandidate does
  not. The P7 eval candidate is therefore represented as a source claim plus
  memory candidate describing the missing staging path, and C5-01 owns the
  decision.
- C5-01 found that eval candidate proposals are already persisted through
  FeedbackDelta and ReflectionRecord JSON lineage, but worker contracts still
  mention `promote_eval_candidate` and `eval_candidates` as if standalone eval
  candidate lifecycle/storage existed. ADR-0016 keeps eval candidates
  proposal-only for now, and C5-02 cleaned up the worker contract.
- C5-02 removed the current `promote_eval_candidate` worker job type instead
  of adding eval storage. Future eval worker work must first satisfy ADR-0016's
  standalone consumer/review-path preconditions.

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
rg -n "command|CliCommand|run.*Command|parse.*Command|krn audit|audit" packages/cli/src README.md package.json
sed -n '1,520p' packages/cli/src/parseArgs.ts
sed -n '1,860p' packages/cli/src/runCli.ts
sed -n '1,120p' packages/cli/src/parseDbArgs.ts
```

Observed summary:

- `parseArgs.ts` defined public operator, governed admin, DB, and audit command
  variants before P1-03;
- `runCli.ts` routes those variants to command runners and wires optional DB
  runtimes;
- `parseDbArgs.ts` keeps readiness/smoke targets separate from normal operator
  workflows;
- `parseAuditArgs.ts` exposed `krn audit repo` and `krn audit slice`; P1-03
  deletes that parser and command runner.

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
  historical evidence, superseded removal target, or not a quality engine;
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

P4-01 noisy context golden proofs:

```sh
pnpm --filter @krn/harness test -- golden
pnpm typecheck
pnpm test
git diff --check
```

Observed:

- focused harness golden tests passed: 16 files, 86 tests;
- full typecheck passed across 7 workspace projects;
- initial full test failed because fixture outcome `raw_recall` was outside the
  existing golden outcome enum; the case was corrected to outcome `flag`;
- final full test passed across 7 workspace projects: core 8 files/39 tests,
  schema 3 files/25 tests, harness 16 files/86 tests, workers 1 file/3 tests,
  codex-adapter 3 files/7 tests, db 24 files/67 tests, cli 25 files/142 tests;
- `git diff --check` passed with no output.

This proves the required noisy-context golden cases have behavior proof coverage
or explicit fixture coverage. It does not add new activation trace persistence;
P4-02 owns typed trace decisions.

P4-02 typed activation trace decisions:

```sh
pnpm --filter @krn/harness test -- activationTraceDecisions
```

Observed RED before implementation: 2 failing tests. Inclusion decisions lacked
typed `expectedUse`, `rawRecall`, and `sourceSupportState`; exclusion decisions
lacked typed `antiMemoryRecordId`, `exclusionCategory`,
`activationAbstentionReason`, and `sourceSupportState`.

Observed GREEN after implementation: harness focused test run passed, 17 files
and 88 tests.

```sh
pnpm typecheck
pnpm test
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready
git diff --check
```

Observed:

- full typecheck passed across 7 workspace projects;
- full test passed across 7 workspace projects: core 8 files/39 tests, schema
  3 files/25 tests, harness 17 files/88 tests, workers 1 file/3 tests,
  codex-adapter 3 files/7 tests, db 24 files/67 tests, cli 25 files/142 tests;
- DB readiness passed with configured Postgres, reachable database, 11/11
  migrations applied, pgvector available, and brain store readiness ready;
- `git diff --check` passed with no output.

This proves activation trace decision inputs are typed and the current DB
adapter can persist compatibility snapshots without schema drift. It does not
prove dedicated relational columns are needed or rejected for future read-model
queries.

P5-00 bounded Promptfoo claims:

```sh
pnpm --filter @krn/harness test -- goldenPromptfooResult
rg -n "Promptfoo|promptfoo|smoke|behavior proof|integration smoke" README.md docs tests packages
pnpm exec promptfoo --version
pnpm eval:promptfoo:smoke
git diff --check
```

Observed:

- focused harness Promptfoo result mapping test passed: 17 files, 88 tests;
- broad Promptfoo/smoke scan completed; it is intentionally noisy because
  `docs/runs`, DB smoke files, and historical audit docs also contain smoke
  language;
- target negative scan for old overclaims returned no matches for
  `behavior smoke proof`, `KRN golden proof`, `status=passed`, `Prove stale
  memory`, or `Prove active anti-memory` in README, QG-05, Promptfoo fixtures,
  and Promptfoo result mapper tests;
- target positive scan found `integration smoke` and
  `doesNotExecuteKrnBehavior=true` in the committed Promptfoo fixture/provider
  surfaces;
- `pnpm exec promptfoo --version` returned `0.121.17` after the known
  `DecompressInterceptor` experimental warning;
- `pnpm eval:promptfoo:smoke` passed with 2 passed, 0 failed, 0 errors, wrote
  `.local-lab/promptfoo/krn-golden-smoke-results.jsonl`, and the provider
  output included `integrationSmoke=passed` and
  `doesNotExecuteKrnBehavior=true`;
- `git diff --check` passed with no output.

This proves the current Promptfoo smoke claim is bounded to dependency/config/
provider/result-output integration. It does not prove KRN memory,
anti-memory, activation, observation, reflection, or review-gate behavior;
P5-01 owns the first real behavior eval gate.

P5-01 first real behavior eval gate:

```sh
pnpm --filter @krn/harness test -- goldenKrnBehaviorGate
```

Observed RED before implementation: failing suite because
`./goldenKrnBehaviorGate.js` did not exist. This proved the new test required a
real gate rather than passing against existing fixture proof plumbing.

Observed GREEN after implementation: focused harness run passed, 18 files and
89 tests.

```sh
pnpm --filter @krn/harness test -- golden
pnpm test
pnpm typecheck
git diff --check
```

Observed:

- final focused harness golden run passed: 18 files, 89 tests;
- full test passed across 7 workspace projects: core 8 files/39 tests, schema
  3 files/25 tests, harness 18 files/89 tests, workers 1 file/3 tests,
  codex-adapter 3 files/7 tests, db 24 files/67 tests, cli 25 files/142 tests;
- first `pnpm typecheck` failed because the gate tried to construct a typed
  `ReflectionOutput` with forbidden `targetType: "memory_record"`; the fix uses
  `assessReflectionOutputContract` for that untrusted reflection-like payload;
- final `pnpm typecheck` passed across 7 workspace projects;
- `git diff --check` passed with no output.

This proves at least one GoldenTask gate now executes real KRN behavior before
creating proof rows. It does not make Promptfoo a behavior gate; Promptfoo
remains bounded to runner/result-adapter integration until a later slice wires
real behavior execution through that runner.

P6-00 worker runtime truth:

```sh
rg -n "worker|dream|dreaming|background|maintenance" README.md PLAN.md docs packages/workers
git diff --check
```

Observed:

- broad scan completed; matches include raw quarantined materials in
  `docs/materials/`, historical run ledgers in `docs/runs/`, and current
  package/code terms;
- active README already said worker jobs are contracts/skeletons and production
  background execution is not built;
- active root PLAN already said `packages/workers` stays contract-only until
  runtime exists;
- active package-boundary doc was narrowed from "worker execution boundaries"
  to enqueue contracts and contract/skeleton-only truth;
- new `packages/workers/README.md` states no worker daemon, no background loop,
  no job executor, no maintenance runtime, and no job-execution proof;
- `git diff --check` passed with no output.

This proves active worker docs now mark runtime truth honestly. It does not
prove worker job write authority is sufficiently bounded; P6-01 owns that
contract hardening.

P6-01 worker job contract hardening:

```sh
pnpm --filter @krn/workers test
pnpm typecheck
git diff --check
```

Observed:

- worker package tests passed: 1 test file, 4 tests;
- workspace typecheck passed across core, schema, harness, workers,
  codex-adapter, db, and cli;
- `git diff --check` passed with no output.

This proves current worker job descriptors expose the required write-authority
fields and preserve strict TypeScript boundaries. It does not prove a worker
daemon, job executor, or autonomous maintenance runtime exists.

P7-00 first governed self-hosting loop:

```sh
pnpm db:ready
docker compose up -d krn-postgres
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn plan --task "seal Memory Core write authority" --persist
pnpm typecheck
pnpm test
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn evidence capture --run-id 00d74890-b18d-498b-90bf-f172c26cffb6 --persist
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn observe --run 00d74890-b18d-498b-90bf-f172c26cffb6 --persist
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn reflect --scope run:00d74890-b18d-498b-90bf-f172c26cffb6 --persist
```

Observed:

- plain `pnpm db:ready` failed with missing `KRN_DATABASE_URL`, which proves
  DB runtime truth was not available before configuring the current shell;
- local compose Postgres was running, and DB readiness with the runbook URL
  passed with 11 expected/applied migrations and pgvector available;
- persisted `krn plan` assembled 6 context inclusions, 0 exclusions, and
  created execution run `00d74890-b18d-498b-90bf-f172c26cffb6`;
- `pnpm typecheck` passed across core, schema, harness, workers,
  codex-adapter, db, and cli;
- `pnpm test` passed across core 8/39, schema 3/25, harness 18/89, workers
  1/4, codex-adapter 3/7, db 24/67, and cli 25/142;
- persisted evidence capture created evidence bundle
  `29aaedd2-a005-4f9b-afa3-15d305e779c6`, review assessment
  `ff87f61f-386b-4507-baae-d322e6cbf227`, and feedback delta
  `30a815e9-0055-4129-b99c-24662945dc96`;
- persisted observe created observation group
  `1ef45c13-f12c-4fb9-a9a8-4693f587333c` with 5 observation items and
  reported `MemoryRecord created: no`;
- persisted reflect selected 5 observations, wrote reflection record
  `a3c275ef-6aaf-4db6-a09a-44c62c229724`, and reported candidate rows
  written `no`, memory mutation `none`, and `MemoryRecord created: no`.

This proves the first persisted plan -> evidence -> observe -> reflect loop can
run locally with store-backed state and without Memory Core mutation. It does
not prove candidate quality, automatic promotion, worker runtime execution, or
real command-status provenance inside the persisted EvidenceBundle.

C0-00 evidence command outcome provenance:

```sh
pnpm --filter @krn/cli test -- runCli
```

Observed RED:

- after adding tests for explicit command outcomes, focused CLI tests failed
  because `krn evidence capture --command ... --status ...` was still rejected
  by the parser with exit code 2;
- failed tests: `prints supplied evidence command outcomes instead of default
  skipped rows` and `persists supplied evidence command outcomes for a run id`.

Observed GREEN:

- focused CLI suite passed: 25 test files, 145 tests;
- parser tests cover repeated `--command` groups, valid statuses, integer
  exit-code parsing, output refs, and invalid ordering/status/exit-code cases;
- run CLI tests prove preview rendering and persisted `CreateEvidenceBundle`
  command rows use supplied outcomes instead of default skipped rows.

Final verification after EVI backlog expansion:

```sh
pnpm --filter @krn/cli test -- runCli
pnpm test
pnpm typecheck
git fetch --prune
git status --short --branch
git log --oneline --decorate --left-right origin/main...main
git diff --check
```

Observed:

- focused CLI suite passed: 25 files, 145 tests;
- full test passed: core 8/39, schema 3/25, harness 18/89, workers 1/4,
  codex-adapter 3/7, db 24/67, cli 25/145;
- full typecheck passed across core, schema, harness, workers, codex-adapter,
  db, and cli;
- `git fetch --prune` passed;
- remote status before this commit was `main...origin/main [ahead 1]` with
  `origin/main` at `87cac53` and local `main` at `a45cee4`;
- `git diff --check` passed with no output.

This proves future evidence captures can preserve explicit command outcome
provenance. It does not rewrite historical EvidenceBundles, execute the
commands on behalf of the operator, or infer success from local output files.

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

EVI-09 verification after separating Promptfoo adapter proof from GoldenTask
behavior proof:

```sh
pnpm --filter @krn/harness test -- golden
pnpm exec promptfoo --version
pnpm eval:promptfoo:smoke
pnpm typecheck
```

Observed:

- harness golden tests passed: 17 files, 73 tests;
- `pnpm exec promptfoo --version` returned `0.121.17`;
- Promptfoo smoke passed 2/2 and emitted `doesNotExecuteKrnBehavior=true`;
- Promptfoo smoke wrote `.local-lab/promptfoo/krn-golden-smoke-results.jsonl`;
- Promptfoo printed `telemetry.shutdown() timed out during shutdown` after the
  successful eval, but exited with code 0;
- `pnpm typecheck` passed.

This proves Promptfoo still works as a runner/config/provider/result-output
smoke and that `runGoldenTaskFixtures` no longer accepts
`promptfoo_integration_smoke` as behavior proof. It does not prove self-hosting
behavior through Promptfoo, Memory Brain readiness, candidate quality, or live
DB execution.

EVI-10 verification after clarifying evidence capture operator ergonomics:

```sh
pnpm --filter @krn/cli test -- parseEvidenceArgs runCli
pnpm typecheck
git diff --check
```

Observed:

- CLI focused tests passed: 23 files, 140 tests;
- `pnpm typecheck` passed;
- `git diff --check` passed.

This proves help/output now show explicit verification examples, no hidden
command execution, weak/default provenance semantics, and existing persisted ID
output coverage. It does not prove live DB persistence in this slice or
command-runner behavior, which remains a non-goal.

C0-01 verification after improving self-hosting context relevance:

```sh
pnpm --filter @krn/harness test -- activation
pnpm --filter @krn/cli test -- parseMemoryArgs runCli
pnpm typecheck
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn memory candidate add --run-id 00d74890-b18d-498b-90bf-f172c26cffb6 --kind constraint --content "MemoryReviewGate seals Memory Core write authority. Public Memory Core promotion must go through MemoryReviewGate and promoteReviewedMemoryCandidate; raw MemoryRecord writes remain adapter internals." --confidence high --application-guidance "Use when sealing Memory Core write authority or reviewing public MemoryRecord promotion paths." --source-lineage PLAN.md#P2-00 --source-lineage PLAN.md#P6-01 --candidate-evidence-provenance operator_reported --candidate-evidence-ref PLAN.md#P2-00 --candidate-evidence-ref PLAN.md#P6-01 --candidate-evidence-ref docs/runs/2026-06-23-self-hosting-memory-loop.md#activation-relevance-review --candidate-evidence-does-not-prove "This does not prove Memory Brain readiness or candidate quality; it proves the reviewed write-authority decision is available for activation." --invalidation-rule "Revisit if public MemoryRepository exposes raw MemoryRecord creation or worker runtime gains Memory Core writes." --owner krn-kernel --proposed-by C0-01 --persist
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn memory candidate promote --candidate-id 39bb2ed0-56d9-4033-a181-fc807a775252 --reviewer codex --decision accepted --evidence-reviewed-ref docs/runs/2026-06-23-self-hosting-memory-loop.md#activation-relevance-review --metadata slice=C0-01 --persist
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn plan --task "seal Memory Core write authority" --persist
git diff --check
```

Catch-up commit verification after introducing worktree hygiene:

```sh
pnpm test
```

Observed:

- harness activation tests passed: 17 files, 74 tests;
- CLI focused tests passed: 23 files, 141 tests;
- `pnpm typecheck` passed;
- full workspace tests passed: 80 files, 365 tests;
- DB readiness passed with Postgres reachable, 11/11 migrations applied, and
  pgvector available;
- reviewed candidate `39bb2ed0-56d9-4033-a181-fc807a775252` was promoted to
  MemoryRecord `f950b8b4-5392-4084-9f98-93881fbe961a`;
- persisted plan for `seal Memory Core write authority` selected
  `memory_record:f950b8b4-5392-4084-9f98-93881fbe961a` first, ahead of adjacent
  governance/source-graph context;
- persisted IDs from that plan were:
  `contextAssembly:a98d996a-37a9-4ff3-8a0f-2a14eaeebcb2` and
  `executionRun:017d4d0d-b048-493d-a2e2-a182840cc3a8`;
- `git diff --check` passed.

This proves reviewed write-authority memory can be added through
MemoryReviewGate and then selected by a live persisted self-hosting plan. It
does not prove general activation quality, broad Memory Brain readiness, or
worker runtime execution.

C1-00 verification after separating public CLI from internal/dev commands:

```sh
pnpm --filter @krn/cli test -- parseDbArgs runCli
pnpm typecheck
pnpm --filter @krn/cli krn --help
pnpm --filter @krn/cli krn db --help
git diff --check
```

Observed:

- CLI focused tests passed: 23 files, 144 tests;
- `pnpm typecheck` passed;
- `krn --help` printed public operator, governed admin, and internal/dev
  command groups;
- `krn db --help` printed the DB internal/dev boundary;
- `git diff --check` passed.

This proves top-level help groups public operator, governed admin, and
internal/dev commands; `krn db --help` is a normal help path; and DB
readiness/smoke commands are labeled as internal runtime plumbing proof, not
product workflow or quality authority. It does not rename CLI commands, prove
DB runtime behavior, or change command implementations.

C1-01 verification after narrowing DB and CLI package roots:

```sh
rg -n 'export \*' packages/db/src/index.ts packages/cli/src/index.ts packages/db/src/dev/index.ts packages/db/src/repositories/index.ts packages/db/src/schema/index.ts
rg -n 'from "@krn/db"' packages/cli/src -g "*.ts" -C 1
pnpm typecheck
pnpm test
git diff --check
```

Observed:

- `packages/db/src/index.ts` has named root exports for `createKrnDatabase` and
  `KrnDatabase` only;
- DB smoke/readiness exports are reachable through `packages/db/src/dev/index.ts`;
- concrete Drizzle adapters are reachable through `@krn/db/adapters`;
- CLI imports root `@krn/db` only for `createKrnDatabase`;
- full workspace typecheck passed;
- full workspace tests passed: 81 files, 366 tests;
- `git diff --check` passed.

This proves DB and CLI root package surfaces no longer expose DB smoke/dev
helpers, concrete adapters, schema tables, parser internals, or command runners
as default package API. It does not prove harness root/repository-port
narrowing; those remain C1-02 and C1-03.

C1-02 verification after separating harness root from eval/internal surfaces:

```sh
rg -n 'goldenPromptfoo|repositories/index|export \* from "\.\/repositories|export \* from "\.\/goldenPromptfoo' packages/harness/src/index.ts packages/harness/src/eval/index.ts packages/harness/package.json
rg -n 'from "@krn/harness"' packages/db/src packages/cli/src packages/codex-adapter/src -g "*.ts" -C 1
rg -n '@krn/harness/(repositories|eval)' packages/db/src packages/cli/src packages/codex-adapter/src packages/harness/src -g "*.ts"
pnpm typecheck
pnpm test
git diff --check
```

Observed:

- `@krn/harness` root no longer exports Promptfoo adapter helpers or
  repository ports;
- `@krn/harness/eval` exports Promptfoo snapshot/result helpers;
- `@krn/harness/repositories` exports repository ports and persistence-facing
  record/input types;
- DB adapters and CLI preview/runtime tests import repository ports from
  `@krn/harness/repositories`;
- full workspace typecheck passed;
- full workspace tests passed: 82 files, 367 tests;
- `git diff --check` passed.

This proves harness root no longer mixes canonical harness behavior with
Promptfoo adapter helpers or repository-port plumbing by default. It does not
split repository ports into public vs internal authority groups; that remains
C1-03.

C1-03 verification after splitting repository public/internal surfaces:

```sh
rg -n '@krn/harness/repositories' packages -g "*.ts" -C 1
rg -n 'CreateMemoryRecordInput|CreateAntiMemoryRecordInput|MemoryRepository,|MemoryCandidateReviewRepository' packages/harness/src/repositories/index.ts packages/harness/src/repositories/internal/index.ts packages/harness/src/repositories/memoryRepository.ts
pnpm typecheck
pnpm test
git diff --check
```

Observed:

- `@krn/harness/repositories` exports a curated public surface with
  `MemoryActivationRepository` and `MemoryCandidateReviewRepository`;
- public repository index does not export `MemoryRepository`,
  `CreateMemoryRecordInput`, or `CreateAntiMemoryRecordInput`;
- `@krn/harness/repositories/internal` remains the full adapter/persistence
  contract for DB adapters and internal runtime code;
- focused repository surface test passed as part of harness tests;
- full workspace typecheck passed;
- full workspace tests passed: 83 files, 371 tests;
- `git diff --check` passed.

This proves raw Memory Core write ports are no longer in the public repository
subpath. It did not prove direct anti-memory writes are reviewed; that gap is
closed by C2-00 below.

C2-00 verification after adding reviewed anti-memory candidate storage:

```sh
pnpm db:generate
pnpm typecheck
pnpm --filter @krn/core test -- reflection
pnpm --filter @krn/harness test -- reflection antiMemoryReviewGate
pnpm --filter @krn/schema test -- index memoryCandidate
pnpm --filter @krn/db test -- memory DrizzleMemoryRepository memoryMappers mappers
pnpm --filter @krn/cli test -- parseMemoryArgs runCli
pnpm db:check
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:memory-governance
pnpm test
git diff --check
```

Observed:

- `anti_memory_candidates` migration `0011_wet_elektra.sql` adds durable
  candidate storage and links final `anti_memory_records.created_from_candidate_id`;
- reflection candidate writer now persists anti-memory candidates instead of
  reporting them unsupported;
- `krn memory anti add --persist` writes `AntiMemoryCandidate`, not final
  `AntiMemoryRecord`;
- `krn memory anti promote/reject` uses AntiMemoryReviewGate and requires
  reviewed evidence before final anti-memory creation;
- local DB readiness passed: Postgres reachable, 12/12 migrations applied,
  pgvector available;
- memory-governance smoke passed with anti-memory candidate reviewed status
  `accepted`, final anti-memory record created from the candidate, outbox
  events `4`, and cleanup remaining marker count `0`;
- full workspace typecheck passed;
- full workspace tests passed: 84 files, 380 tests;
- `git diff --check` passed.

This proves anti-memory final truth now has a reviewed candidate storage path
and runtime DB proof. It did not expand real GoldenTask behavior coverage; C3-00
below closes that gap.

C3-00 verification after expanding real GoldenTask behavior gate coverage:

```sh
pnpm --filter @krn/harness test -- goldenKrnBehaviorGate goldenMemoryBehavior
pnpm --filter @krn/schema test -- goldenTask
node -e "JSON.parse(require('fs').readFileSync('tests/fixtures/golden-tasks/memory-behavior.json','utf8')); console.log('memory-behavior fixture JSON ok')"
pnpm --filter @krn/harness test -- golden
pnpm typecheck
pnpm test
git diff --check
```

Observed:

- `runKrnBehaviorGoldenGate` now covers six behavior cases with
  `krn_behavior_execution` proof rows;
- new cases cover exact-proof raw recall, observation prefix source-range
  rejection, and EvidenceBundle command provenance;
- memory behavior fixture JSON parses and declares the new cases;
- focused harness golden tests passed: 20 files, 79 tests;
- focused schema golden task tests passed: 3 files, 25 tests;
- full workspace typecheck passed;
- full workspace tests passed: 84 files, 380 tests;
- `git diff --check` passed.

This proves the real GoldenTask behavior gate now executes the added KRN code
paths before `runGoldenTaskFixtures` accepts the proof rows. It does not prove
Promptfoo executes behavior, worker runtime readiness, or global Memory Brain
quality.

C4-00 verification after deciding worker runtime boundary:

```sh
git status --short --branch
rg -n "worker|runtime|job|outbox|write authority|daemon|executor|queue" docs/decisions packages/workers packages/db packages/harness -g "*.md" -g "*.ts"
git diff --check
pnpm typecheck
```

Observed:

- starting status was `main...origin/main` with only the C4 docs changes dirty;
- worker/runtime boundary scan completed; matches are the expected worker
  contracts, DB lifecycle helpers, ADR references, and runtime-boundary docs;
- ADR-0015 records `Decision status: defer` for worker runtime execution;
- current worker boundary remains contracts/enqueue ports plus Postgres
  worker-job lifecycle repository/smoke proof;
- future runtime writes are limited to job-declared allowed writes and still
  forbid direct `memory_records`, `anti_memory_records`, `source_claims`, and
  `source_decisions` writes;
- `git diff --check` passed;
- full workspace typecheck passed;
- no DB command was run for C4, so this slice does not claim new DB runtime
  truth.

This proves the repo has a recorded worker runtime decision before execution
work. It does not prove a worker daemon, job executor, autonomous maintenance,
or production throughput exists.

C5-00 verification after staging self-hosting feedback candidates:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn source claim add ... --persist
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn memory anti add ... --persist
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn memory candidate add ... --persist
psql postgres://krn:krn@localhost:54329/krn -c "<C5 source/memory/anti-memory candidate readback queries>"
psql postgres://krn:krn@localhost:54329/krn -c "<C5 final MemoryRecord/AntiMemoryRecord count query>"
```

Observed:

- DB readiness passed: Postgres reachable, 12/12 migrations applied,
  pgvector available;
- source claims staged:
  `58e28e58-d4c8-4196-861e-cb14caeb08e1`,
  `479b1ce8-9904-42ab-a8d1-393a2bacf685`,
  `302f88f7-71b0-4a86-8521-330dee4713fe`;
- memory candidates staged:
  `b40cac51-73d6-4974-966b-36833c13e757`,
  `1ea7bb3a-6fa0-404a-b284-adeeb9183b6a`,
  `8beb1776-355f-477d-bba0-ebaeb121cc96`;
- anti-memory candidate staged:
  `45657a7d-d245-4680-83b2-a6dcddccf5e8`;
- readback by `metadata.slice=C5-00` returned three source claims, three
  memory candidates, and one anti-memory candidate;
- final truth counts remained `c5_memory_records=0` and
  `c5_anti_memory_records=0`;
- standalone EvalCandidate staging was not faked; C5-01 owns deciding that
  path.

This proves P7 self-hosting feedback is no longer only prose for the surfaces
that have governed persistence. It does not prove candidates are reviewed,
promoted, or high quality.

Worktree/remote hygiene goal update:

```sh
git diff --check
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready
pnpm typecheck
```

Observed:

- `GOAL.md` now makes worktree and remote hygiene an explicit part of the
  current goal;
- completed slices require a focused Conventional Commit, immediate push, and
  clean post-push status before the next slice starts;
- `git diff --check` passed;
- DB readiness passed again in the current environment: Postgres reachable,
  12/12 migrations applied, pgvector available;
- full workspace typecheck passed.

This proves the active goal now carries the user's commit/push cleanliness rule
as an execution requirement. It does not prove future slices will stay clean;
that must be checked after each pushed slice.

C5-01 verification after deciding eval candidate staging:

```sh
git status --short --branch
git diff --check
pnpm typecheck
pnpm test
```

Observed:

- pre-slice status was clean: `## main...origin/main`;
- ADR-0016 accepts proposal-only EvalCandidate staging through
  `FeedbackDelta.evalCandidates` / `feedback_deltas.eval_candidates` and
  `ReflectionRecord.output.evalCandidates` / `reflection_records.output`;
- no standalone `eval_candidates` table, eval CLI, worker runtime, Promptfoo
  authority layer, dashboard, or eval platform was added;
- C5-02 was added as the next slice to align the speculative worker
  `promote_eval_candidate` / `eval_candidates` contract with ADR-0016;
- `git diff --check` passed;
- full workspace typecheck passed;
- full workspace tests passed.

This proves the repo has an explicit eval candidate staging decision and the
docs-only slice does not break the workspace. It does not prove standalone eval
candidate lifecycle, review, promotion, worker execution, or Promptfoo behavior
authority exists.

C5-02 verification after aligning worker eval candidate contract:

```sh
pnpm --filter @krn/workers test
pnpm --filter @krn/db test -- workerJob
pnpm typecheck
git diff --check
```

Observed:

- `@krn/workers` no longer exposes `promote_eval_candidate`,
  `PromoteEvalCandidatePayload`, or `eval_candidates` as a current allowed
  worker write;
- DB worker-job type fixtures no longer accept or smoke-test
  `promote_eval_candidate`;
- ADR-0015 and worker README now state that eval candidate worker jobs are
  absent until ADR-0016 preconditions are met;
- focused workers test passed;
- DB worker-job test command passed;
- full workspace typecheck passed;
- `git diff --check` passed.

This proves current worker contracts no longer imply standalone eval candidate
storage or promotion runtime. It does not prove a future eval candidate worker,
review gate, CLI, table, or Promptfoo/GoldenTask consumer exists.

## Historical Reset Completion Criteria

The reset criteria below are retained as the completed P0-P7 ledger. They are
not the active goal. Current active completion is governed by `Active Queue
Snapshot` and the first unchecked slice.

The reset was complete only when:

1. `GOAL.md` is compact and points to root `PLAN.md`.
2. Root `PLAN.md` remains canonical and current.
3. Stale docs are historical or deleted.
4. QG-06/productized anti-slop is removed as product direction.
5. `krn audit` is removed as a product/guardrail/scanner surface and any useful
   invariants are re-homed into native mechanisms.
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

Completed slice discipline:

- no completed slice is considered done until it has a focused commit;
- push immediately after the commit;
- do not batch unrelated slices into one commit;
- do not carry completed work as active context after push;
- `git status --short --branch` must be recorded before the next slice starts.

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

## Next Epoch Backlog: Evidence Integrity, Repo Condensation, TypeScript Quality

This appendix is append-only backlog after the completed reset ledger and the
current Evidence Integrity progress. It does not create a new plan, a new
reset, or a parallel execution surface.

Current carry-forward:

- EVI-00 through EVI-10 are already represented above and are complete in the
  current worktree.
- The first unchecked continuous hardening slice is C0-01 in `Active Queue
  Snapshot`.
- COND, TSQ, and EXEC slices below are queued after the active Evidence
  Integrity closure work unless a narrower slice explicitly promotes one.

Executor rule:

Do not start a broad cleanup goal. Condense only where a public surface, type,
document, or command name gives more authority than implementation evidence
supports.

### EXEC-00: Add Executor Discipline To Active Slice Template

priority: P0.

objective:

Encode the executor behavior gate directly in this plan without creating a new
quality subsystem.

before each implementation slice, record:

```txt
assumptions:
ambiguity/tradeoff:
simplest acceptable implementation:
files likely touched:
files explicitly not touched:
non-goals:
success criteria:
verification:
rollback:
```

rules:

- think before coding;
- prefer the simplest final-pattern implementation;
- make surgical changes only;
- every changed line must trace to the slice objective;
- do not fix adjacent slop in the same slice;
- if unrelated slop is found, record it in Surprises & Discoveries or as a
  later slice.

verification:

```sh
rg -n "Executor Discipline|assumptions|simplest acceptable implementation|files explicitly not touched" PLAN.md
git diff --check
```

commit:

```sh
git commit -m "docs(plan): add executor discipline gate"
```

### EXEC-01: Require Slice Template For Future Backlog Items

priority: P0.

objective:

Every future slice must use a complete execution template so completed work can
be compressed without losing proof or next actions.

required fields:

```txt
assumptions:
tradeoffs:
simplest acceptable implementation:
files likely touched:
files forbidden to touch:
non-goals:
success criteria:
verification:
rollback:
```

verification:

```sh
rg -n "files forbidden to touch|success criteria|rollback" PLAN.md
git diff --check
```

commit:

```sh
git commit -m "docs(plan): require slice execution template"
```

### COND-00: Narrow DB Root Exports

priority: P1.

objective:

Make `@krn/db` root exports honest. Smokes, readiness helpers, concrete
repositories, and schema internals should not look like default public product
API.

source:

`docs/architecture/package-surfaces.md` already classifies package-surface debt.

target:

- root exports stable DB runtime/factory contracts only;
- smokes/readiness move to explicit dev/internal paths or package scripts;
- schema tables are not casual root API;
- no compatibility layer for imaginary consumers.

files likely touched:

- `packages/db/src/index.ts`
- `packages/db/src/repositories/index.ts`
- `packages/db/src/schema/index.ts`
- imports that currently rely on root wildcard exports.

verification:

```sh
rg -n "export \\*" packages/db/src/index.ts packages/db/src/repositories/index.ts packages/db/src/schema/index.ts
pnpm typecheck
pnpm test
git diff --check
```

commit:

```sh
git commit -m "refactor(db): narrow public package surface"
```

### COND-01: Narrow CLI Root Exports

priority: P1.

objective:

Make `@krn/cli` root exports expose `runCli` and stable adapter types only.
Command runners and DB smoke helpers should remain internal implementation
details.

files likely touched:

- `packages/cli/src/index.ts`
- imports/tests that need explicit internal paths.

verification:

```sh
pnpm --filter @krn/cli test
pnpm typecheck
git diff --check
```

commit:

```sh
git commit -m "refactor(cli): narrow root adapter exports"
```

### COND-02: Narrow Harness Root Exports

priority: P1.

objective:

Separate canonical harness behavior from eval adapters, dev helpers, repository
internals, and removed audit-era surfaces.

target:

- keep activation/compiler/memory review gate/golden behavior as intentional
  harness API;
- keep Promptfoo under eval-adapter naming;
- avoid broad wildcard root exports;
- do not restore audit scanner exports.

files likely touched:

- `packages/harness/src/index.ts`
- nested harness indexes;
- imports/tests.

verification:

```sh
pnpm --filter @krn/harness test
pnpm typecheck
pnpm test
git diff --check
```

commit:

```sh
git commit -m "refactor(harness): narrow product exports"
```

### COND-03: Decide Remaining Package Barrels

priority: P2.

objective:

Classify broad wildcard exports in core/schema/codex-adapter/workers instead
of deleting them by aesthetics.

rules:

- core domain root may stay broad if the exports are stable domain contracts;
- test helpers and fixtures must not go through package root;
- adapter internals must not go through package root;
- workers root should expose contracts, not runtime claims.

files likely touched:

- `docs/architecture/package-surfaces.md`
- selected package indexes only when a decision is trivial and small.

verification:

```sh
rg -n "export \\*" packages/*/src/index.ts packages/*/src/**/index.ts
git diff --check
```

commit:

```sh
git commit -m "docs(exports): decide remaining package barrels"
```

### COND-04: CLI Public Surface Code Move Decision

priority: P2.

objective:

Decide the code-level fate of internal/dev CLI surfaces without silently
renaming commands or recreating an audit/guard layer.

options:

1. keep DB readiness/smokes but hide or clearly mark them as internal/dev;
2. move DB/dev operations under an explicit `krn dev ...` namespace;
3. replace some dev commands with package scripts only.

rules:

- `krn audit` remains removed;
- do not create `krn guard`;
- do not silently rename without a compatibility decision.

verification:

```sh
pnpm --filter @krn/cli test
pnpm typecheck
git diff --check
```

commit:

```sh
git commit -m "docs(cli): decide internal dev command surface"
```

### TSQ-00: EvidenceCommand Discriminated Union Decision

priority: P1.

objective:

Decide whether current `EvidenceCommand` should stay as normalized object fields
or become a discriminated union by provenance.

source:

Total TypeScript describes types as a way to communicate business logic and
maintainability, not only compile-time errors. It also shows literal unions as
the way to restrict possible values and runtime narrowing as the way to move
from wider to narrower types:

- https://www.totaltypescript.com/books/total-typescript-essentials/designing-your-types-in-typescript
- https://www.totaltypescript.com/books/total-typescript-essentials/unions-literals-and-narrowing

rules:

- do not merge this into EVI-00 retroactively;
- decide by current evidence after EVI-04 run-ledger closure;
- if adopted, implement as a small core/schema slice with compatibility
  mapping for persisted rows.

verification:

```sh
pnpm --filter @krn/core test -- evidenceBundle
pnpm --filter @krn/schema test -- evidence
pnpm typecheck
git diff --check
```

commit:

```sh
git commit -m "docs(ts): decide evidence command proof states"
```

### TSQ-01: Branded ID Types ADR And Pilot

priority: P1.

objective:

Decide whether core IDs should remain string aliases or become branded/opaque
types.

current risk:

`packages/core/src/ids.ts` aliases high-risk object IDs to `string`, so
`SourceClaimId`, `MemoryRecordId`, and `ExecutionRunId` are type-compatible.

approach:

- write ADR first;
- pilot only selected high-risk IDs:
  `ExecutionRunId`, `MemoryRecordId`, `MemoryCandidateId`, `SourceClaimId`;
- do not convert the whole repo in one diff.

verification:

```sh
pnpm --filter @krn/core test
pnpm --filter @krn/harness test
pnpm typecheck
git diff --check
```

commit:

```sh
git commit -m "docs(ts): decide branded domain ids"
```

### TSQ-02: JSON.parse Boundary Classification

priority: P1.

objective:

Classify every `JSON.parse` as production safe boundary, test-only acceptable,
or repair candidate.

source:

TS Reset documents rules that make `JSON.parse` and `.json()` return `unknown`,
but it also cautions that `ts-reset` is for applications, not libraries, because
it changes global scope:

- https://www.totaltypescript.com/ts-reset

rules:

- production `JSON.parse` must produce `unknown`;
- validate with Zod or a local guard before domain use;
- no global `ts-reset` in core/schema/public APIs;
- test-only parses need an explicit reason if they bypass validation.

verification:

```sh
rg -n "JSON\\.parse" packages
pnpm typecheck
pnpm test
git diff --check
```

commit:

```sh
git commit -m "refactor(ts): harden json parse boundaries"
```

### TSQ-03: Unsafe Cast Quarantine

priority: P2.

objective:

Classify `as any`, `as unknown as`, `@ts-ignore`, and `@ts-expect-error` usage
as accepted boundary tests, hostile runtime fixtures, or repair candidates.

rules:

- production unsafe casts are not accepted without local proof;
- hostile test fixtures should prefer `unknown` plus parser/guard;
- `@ts-expect-error` must explain the expected failure;
- no `@ts-ignore` without a replacement plan.

verification:

```sh
rg -n "as any|as unknown as|@ts-ignore|@ts-expect-error" packages
pnpm typecheck
pnpm test
git diff --check
```

commit:

```sh
git commit -m "test(ts): quarantine unsafe type fixtures"
```

### TSQ-04: Explicit Public Type Boundary Audit

priority: P1.

objective:

Ensure public package APIs use named exported types instead of anonymous object
shapes that hide boundary contracts.

targets:

- CLI public runtime types;
- DB repository/factory types;
- harness activation/review-gate ports;
- evidence command and activation decision types.

verification:

```sh
pnpm typecheck
pnpm test
git diff --check
```

commit:

```sh
git commit -m "docs(ts): audit public type boundaries"
```

### TSQ-05: Impossible-State Audit For Core Lifecycles

priority: P2.

objective:

Find core lifecycle states where the current model allows invalid combinations
that should become discriminated unions or narrower value objects.

candidate areas:

- EvidenceCommand;
- EvidenceBundle status;
- Reflection candidate writing result;
- Activation decision;
- Worker job descriptor/write authority;
- Memory promotion result.

rules:

- do not convert all candidates in one slice;
- produce one decision table and promote only the highest-risk model to an
  implementation slice.

verification:

```sh
pnpm --filter @krn/core test
pnpm typecheck
git diff --check
```

commit:

```sh
git commit -m "docs(ts): audit impossible lifecycle states"
```
