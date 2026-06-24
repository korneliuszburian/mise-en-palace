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

current_priority: Active Plan Condensation After Lifecycle Boundary Hardening.

first_unchecked_slice: `CTX-04: Condense Completed Lifecycle Boundary Context`.

active_scope:

- keep the `krn audit` product/guardrail/scanner surface removed;
- continue from the next typed lifecycle decision after TSQ-10 normalized
  context assembly current status in core and narrowed create/write authority;
- do not reintroduce `krn audit` as a guardrail, scanner, product UX, or
  internal quality subsystem;
- do not build a broad eval platform, dashboard, worker runtime, or Promptfoo
  authority layer while condensing completed lifecycle hardening context;
- do not create a quality subsystem, scanner, or standalone anti-slop layer.

completed_checkpoint:

- Reset baseline: P0-P7 are complete, root `GOAL.md` / `PLAN.md` are canonical,
  old memory-plan docs are historical quarry, and the first governed
  self-hosting loop is recorded.
- Audit/anti-slop cleanup: public `krn audit` CLI/harness scanner is removed,
  legacy `AuditBundle` contracts/tables are gone after zero-row DB proof, and
  retained invariants moved into native Memory/Source/Evidence mechanisms.
- Evidence integrity: command provenance, explicit `--verification`, DB
  provenance normalization, self-hosting provenance regression, operator output
  clarity, and P7 ledger closure are complete.
- Memory/governance spine: reviewed memory and anti-memory candidate paths,
  self-hosting write-authority activation proof, GoldenTask behavior proofs,
  proposal-only eval candidates, and deferred worker runtime are recorded.
- Surface condensation: CLI taxonomy, DB/CLI/harness/repository export
  narrowing, remaining barrel decisions, and local-default root DB scripts are
  complete.
- TypeScript hardening: evidence proof states, branded ID pilot, JSON boundary
  classification, unsafe-cast zero-state, named public return types, lifecycle
  audit, reflection writer result discrimination, memory review result
  narrowing, EvidenceBundle status decision, and activation decision input
  discrimination are complete.
- CTX-01 condenses completed TSQ-05D/E/E-A detail into this checkpoint. Commit
  history remains the detailed evidence ledger:
  `8c7250e`, `1bbcf01`, and `4b429c5`.
- EvalCandidate proposal carrier narrowing is complete. Commit history is the
  detailed evidence ledger: `3501bd0` and `349c768`.
- TSQ-07 narrows EvidenceBundle write authority: repository write input accepts
  only `draft | captured`; broad persisted/read-model status remains for
  historical rows.
- TSQ-08 keeps activation decision persisted/read-model vocabulary broad for
  historical `abstained` rows but narrows public activation decision input to
  current write decisions: `included | excluded | deferred | conflict | stale`.
- TSQ-09 narrows retrieval run completion write authority to terminal statuses:
  `completed | abstained | failed`; persisted/read-model status still includes
  `running` for started runs.
- CTX-03 condenses TSQ-07/08/09 detail into compact ledgers and keeps commit
  history as the detailed evidence ledger.
- TSQ-10 defines `ContextAssemblyCurrentStatus` in core, makes
  `assembleContext` return current statuses only, and narrows context assembly
  create input to `assembled | abstained`.
- TSQ-11 keeps `ReviewAssessment` create status broad because
  `review assess --status` records the current review outcome at creation,
  but narrows `FeedbackDelta` create status to `candidate` and memory /
  anti-memory candidate create status to `proposed | candidate`.
- TSQ-12 keeps `SourceDecision` status broad because `adopt | reject | defer |
  lab_test` is the decision captured at creation, but narrows `SourceClaim`
  create status to `proposed`; `accepted | rejected | deprecated` are
  reviewed/read-model lifecycle states.
- Execution hygiene: executor discipline, slice template gate, commit/push/clean
  worktree requirement, and recurring context-condensation rule are active.

active_handoff:

- objective: continue continuous hardening from the next bounded slice, not
  from historical reset/audit detail;
- last verified state: TSQ-12 passed focused core/schema/harness/db/CLI checks
  before full workspace verification; final command evidence is recorded in
  the TSQ-12 section;
- decisions: do not create a new plan file, do not delete evidence, and keep
  `GOAL.md` compact while `PLAN.md` remains the living queue;
- blockers/risks: full command transcript remains long by design; do not claim
  broad Memory Brain readiness from green tests or smokes;
- context selectors: read `GOAL.md`, this Active Queue Snapshot, CTX-04
  section, and only the source files named by the next slice;
- next action: execute `CTX-04: Condense Completed Lifecycle Boundary Context`;
- do not reread: `docs/materials/`, old memory ideal-state plans, or completed
  task bodies unless the active slice names them.

open_risks_and_next_candidates:

- active `PLAN.md` now carries many completed TSQ lifecycle sections; condense
  completed detail into checkpoint evidence before starting another code slice.

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
- legacy AuditBundle storage fate:
  `docs/decisions/ADR-0017-legacy-auditbundle-storage-fate.md`;
- legacy audit table drop:
  `docs/decisions/ADR-0018-drop-empty-legacy-audit-tables.md`;
- evidence command proof states:
  `docs/decisions/ADR-0019-evidence-command-proof-states.md`;
- branded domain IDs:
  `docs/decisions/ADR-0020-branded-domain-ids.md`;
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

- treat every task/slice as an atomic Git unit: inspect, implement, verify,
  commit, push, and confirm clean status before the next task starts;
- if a task cannot fit one focused Conventional Commit, split the task before
  coding instead of producing a mixed commit;
- run `git status --short --branch` before and after each slice;
- do not start a new slice while completed work is still uncommitted;
- split completed work into focused Conventional Commits;
- push after each completed slice commit;
- treat push plus clean worktree as part of slice completion, not optional
  follow-up;
- if push fails, fix the remote/worktree blocker or record it in this snapshot
  before continuing;
- include only the slice's own `GOAL.md` / `PLAN.md` checkpoint in a slice
  commit; unrelated backlog or policy edits require a separate docs commit;
- if existing dirty state is unrelated to the current slice, leave it untouched
  and record it instead of mixing it into the slice commit;
- do not batch completed tasks into catch-up commits or delayed pushes; if work
  is already mixed, stop and split it into the smallest honest commit before
  continuing;
- if a completed slice cannot be committed or pushed, record the exact blocker
  in this snapshot before continuing.

executor_discipline:

- before coding each implementation slice, record:
  - assumptions;
  - ambiguity/tradeoff;
  - simplest acceptable implementation;
  - files likely touched;
  - files explicitly not touched;
  - non-goals;
  - success criteria;
  - verification;
  - rollback.
- keep the slice final-pattern and surgical: every changed line must trace to
  the slice objective;
- do not fix adjacent slop, broad cleanup, or unrelated dead code in the same
  slice;
- if unrelated slop is found, record it in Surprises & Discoveries or a later
  bounded slice instead of editing it immediately;
- verification must say what commands prove and what they do not prove.

slice_template_gate:

- every future backlog item and every backlog sketch promoted into the active
  queue must include:
  - assumptions;
  - tradeoffs;
  - simplest acceptable implementation;
  - files likely touched;
  - files forbidden to touch;
  - non-goals;
  - success criteria;
  - verification;
  - rollback.
- appendix items written before EXEC-01 are planning sketches, not permission
  to start coding;
- when promoting an older sketch, normalize it into the template first and
  remove duplicate prose that does not change execution;
- completed template details should collapse into a checkpoint note and command
  evidence after commit/push.

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
- C6-01 decided the fate of legacy AuditBundle contracts and active write
  storage: remove the contracts/repository, retain only explicitly legacy table
  definitions for migration compatibility.

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
- at the time of P1-03, legacy `AuditBundle` core/schema/db storage still
  existed and was queued for C6-01; C6-01 later removed the active contracts
  and demoted DB tables to legacy migration-retention schema only.

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

### C6-00: Re-home Former Source/Evidence Audit Invariants

status: complete.

objective:

Move retained source-grounding audit invariants into native SourceClaim /
SourceDecision and EvidenceBundle mechanisms without restoring any audit
scanner, audit CLI, or quality subsystem.

source:

The removed audit checker included useful source-grounding checks: SourceClaims
need mechanism, implication, does-not-prove, consumer, falsifier, and
decision-grade support; stale accepted claims need review; accepted source
claims without decisions risk source hoarding; SourceDecisions need a claim
link, consumer, and falsifier. EvidenceBundle completeness, rollback, and
review-risk helpers already exist in core.

mechanism:

Add pure source review signals to `packages/core/src/source.ts` and keep DB
repository write-time enforcement aligned with those core helpers. Do not
restore `packages/harness/src/audit`, `krn audit`, repo-wide scanners, or
AuditBundle mutation paths.

outcome:

- `assessSourceClaimReviewSignals` reports missing source-to-decision fields,
  decorative support type, stale accepted claims, and accepted claims without
  linked decisions;
- `assessSourceDecisionReviewSignals` reports missing source claim links,
  missing decision fields, and rejected/deprecated claim support;
- source trust ranking, temporal validity, and override assessment moved into
  core source domain code;
- `DrizzleSourceRepository` now uses the core decision-grade support helper
  instead of owning a local copy of that invariant;
- no audit scanner, CLI, or broad quality subsystem was added.

verification:

```sh
pnpm --filter @krn/core test -- source
pnpm --filter @krn/db test -- DrizzleSourceRepository
pnpm typecheck
git diff --check
```

observed:

- focused core source tests passed;
- focused DB source repository tests passed;
- full workspace typecheck passed;
- `git diff --check` passed.

This proves retained source-grounding checks now have pure domain functions and
DB write-time enforcement reuses core support-type authority. It does not prove
all former audit scanner categories should be retained, does not restore a
scanner, and does not decide legacy AuditBundle storage fate.

commit:

```sh
git commit -m "feat(source): add native source review signals"
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

### C6-01: Decide Legacy AuditBundle Storage Fate

status: complete.

objective:

Remove active legacy `AuditBundle` authority after `krn audit` was removed,
without destroying historical DB evidence in the same slice.

source:

Live package inventory found `AuditBundle` only in its own core/schema/db tests,
package barrels, `DrizzleAuditBundleRepository`, and Drizzle audit table
definitions. No CLI, harness, memory, source, evidence, observation,
reflection, or activation runtime consumed the contract.

decision:

ADR-0017 is accepted. `AuditBundle` is no longer a KRN domain/IO/repository
contract. Evidence and review truth belongs in
EvidenceBundle/ReviewAssessment/FeedbackDelta lineage.

mechanism:

- delete `packages/core/src/auditBundle.ts` and its tests;
- delete `packages/schema/src/auditBundle.ts` and parser tests;
- delete `DrizzleAuditBundleRepository` and repository export;
- keep `audit_bundles` / `audit_findings` table definitions only as explicitly
  named `legacyAudit*` migration-retention schema;
- update README, GOAL, PLAN, and ADR-0017 with the data-retention boundary.

does_not_prove:

- legacy DB tables contain no rows;
- legacy DB rows can be dropped without export or provenance review;
- a destructive drop migration is safe.

verification:

```sh
pnpm --filter @krn/core test
pnpm --filter @krn/schema test
pnpm --filter @krn/db test
pnpm typecheck
pnpm test
pnpm --filter @krn/db db:check
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready
git diff --check
rg -n "\\bAuditBundle\\b|parseAuditBundleInput|DrizzleAuditBundleRepository|\\bauditBundle\\b" packages --glob "*.ts"
```

observed:

- focused package tests passed:
  - `pnpm --filter @krn/core test`: 9 files, 47 tests;
  - `pnpm --filter @krn/schema test`: 3 files, 24 tests;
  - `pnpm --filter @krn/db test`: 24 files, 74 tests;
- full `pnpm typecheck` passed;
- full `pnpm test` passed across workspace packages;
- `pnpm --filter @krn/db db:check` passed with the renamed legacy table
  definitions, so no migration drift was introduced;
- plain `pnpm db:ready` failed because this shell lacked `KRN_DATABASE_URL`;
  this proves missing env only, not DB failure;
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`
  passed with Postgres reachable, 12/12 migrations applied, and pgvector
  available;
- `git diff --check` passed;
- active package scan for `AuditBundle`, `parseAuditBundleInput`,
  `DrizzleAuditBundleRepository`, and lowercase `auditBundle` returned no
  matches.

rollback:

```sh
git revert <C6-01 commit>
```

### C6-02: Decide Legacy Audit Table Retention Or Drop Migration

status: complete.

objective:

Decide whether migration-retained legacy audit tables should stay for
compatibility, be exported and dropped, or be migrated into current
EvidenceBundle/ReviewAssessment lineage.

rules:

- inspect target DB row counts and representative provenance first;
- do not drop `audit_bundles`, `audit_findings`, or enum types without export /
  rollback path;
- do not restore `AuditBundle` domain, parser, repository, CLI, scanner, or
  guardrail UX;
- use ADR-0017 future drop preconditions as the acceptance gate.

verification:

```sh
git status --short --branch
psql postgres://krn:krn@localhost:54329/krn -Atc "select 'audit_bundles', count(*) from audit_bundles union all select 'audit_findings', count(*) from audit_findings;"
pnpm --filter @krn/db db:generate
pnpm --filter @krn/db db:check
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready
psql postgres://krn:krn@localhost:54329/krn -Atc "select to_regclass('public.audit_bundles'), to_regclass('public.audit_findings'), to_regtype('public.audit_final_verdict'), to_regtype('public.audit_finding_category'), to_regtype('public.audit_finding_severity'), to_regtype('public.audit_finding_status'), to_regtype('public.audit_risk_estimate');"
git diff --check
```

observed:

- local DB readiness before the drop passed with 12/12 migrations applied and
  pgvector available;
- local DB row counts were `audit_bundles=0` and `audit_findings=0`;
- representative sample query over `audit_bundles` returned no rows;
- generated migration `0012_condemned_wolf_cub.sql` drops `audit_bundles`,
  `audit_findings`, and legacy audit enum types;
- `pnpm --filter @krn/db db:check` passed after generation;
- `pnpm typecheck` passed;
- full `pnpm test` passed across workspace packages;
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`
  applied and verified 13/13 migrations with pgvector available;
- post-migration `to_regclass` / `to_regtype` returned null for legacy audit
  tables and enum types;
- package scan for `legacyAudit`, `AuditBundle`,
  `DrizzleAuditBundleRepository`, and `parseAuditBundleInput` returned no
  active TypeScript matches.

rollback:

```sh
git revert <C6-02 commit>
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
- [x] C6-00 Re-home former memory/source/evidence audit invariants into native
  MemoryReviewGate, SourceClaim/SourceDecision, and EvidenceBundle mechanisms.
- [x] C6-01 Decide whether legacy AuditBundle storage is deleted, renamed, or
  migrated into EvidenceBundle/ReviewAssessment lineage.
- [x] C6-02 Decide legacy audit table retention/export/drop migration after DB
  row/provenance review.
- [x] EXEC-00 Add executor discipline to active slice template.
- [x] EXEC-01 Require slice template for future backlog items.
- [x] COND-03 Decide remaining package barrels.
- [x] COND-04 Decide internal/dev CLI command surface.
- [x] TSQ-00 Decide EvidenceCommand proof-state model.
- [x] TSQ-00A Implement EvidenceCommand discriminated union.
- [x] TSQ-01 Decide branded ID types ADR and pilot.
- [x] TSQ-02 Classify JSON.parse boundaries.
- [x] TSQ-03 Quarantine unsafe casts and TS suppressions.
- [x] TSQ-04 Audit explicit public type boundaries.
- [x] TSQ-05 Audit impossible core lifecycle states.
- [x] TSQ-05A Discriminate reflection candidate writer result.
- [x] CTX-00 Condense completed hardening context.
- [x] TSQ-05B Decide memory promotion result state shape.
- [x] TSQ-05C Narrow memory review gate result candidate status.
- [x] TSQ-05D Decide EvidenceBundle status shape.
- [x] TSQ-05E Decide activation decision shape.
- [x] TSQ-05E-A Discriminate activation decision persistence input.
- [x] CTX-01 Condense lifecycle hardening context.
- [x] TSQ-06 Decide EvalCandidate proposal status shape.
- [x] TSQ-06A Narrow EvalCandidate proposal carriers.
- [x] CTX-02 Condense EvalCandidate hardening context.
- [x] TSQ-07 Decide EvidenceBundle status authority boundary.
- [x] TSQ-08 Decide Activation Decision read-model boundary.
- [x] TSQ-09 Decide Retrieval Run completion status boundary.
- [x] CTX-03 Condense Lifecycle Boundary hardening context.
- [x] TSQ-10 Decide ContextAssembly create status boundary.
- [x] TSQ-11 Decide ReviewAssessment and FeedbackDelta create status boundaries.
- [x] TSQ-12 Decide SourceClaim and SourceDecision create status boundaries.
- [ ] CTX-04 Condense completed lifecycle boundary context.

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
- TSQ-01 found a soft-brand sweet spot: raw strings remain assignable to the
  selected ID types, so DB/CLI/schema IO boundaries do not need a broad
  constructor refactor yet, but already-typed `ExecutionRunId`, `MemoryRecordId`,
  `MemoryCandidateId`, and `SourceClaimId` are no longer mutually assignable.
- TSQ-02 found only one production `JSON.parse` boundary, and it already used
  `unknown` plus an object guard in `packages/cli/src/cliFileBoundary.ts`. The
  unsafe pattern was test-only fixture/package JSON reads that cast parsed
  values directly to partial shapes.
- TSQ-03 found no current package-source matches for `as any`, `as unknown as`,
  `@ts-ignore`, or `@ts-expect-error`. This is a stronger result than expected,
  so the slice closes as a classification plus future falsifier instead of a
  code repair.
- TSQ-04 found only three exported function return-type gaps in non-dev,
  non-schema package source: one inferred public-ish DB mapper and two inline
  CLI helper result shapes. After the patch, the AST inventory reports zero
  inferred exported function return types and zero inline object return types.
- TSQ-05 found the riskiest remaining impossible-state model is the reflection
  candidate writer result, not EvidenceCommand. `WriteReflectionCandidatesResult`
  has `status: "ready" | "blocked"` but one shared payload shape, so TypeScript
  still allows blocked results with created candidates and ready results with
  `blockedReasons`.
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
- COND-03 found no current root export of test helpers, fixtures, smokes, DB
  readiness, or adapter internals in the remaining core/schema/codex-adapter/
  workers barrels. The worker root still exports enqueue contracts, but ADR-0015
  and worker docs state this does not imply a daemon, background loop, or job
  executor.
- COND-04 found `krn db` is still a top-level parser family, but top-level help
  and `krn db --help` both label readiness/smoke commands as internal/dev
  runtime-plumbing proof. `package.json` scripts intentionally wrap that
  namespace for local verification, so moving to `krn dev ...` would be rename
  churn without a stronger misuse signal.
- TSQ-00 found that the current `EvidenceCommand` compatibility model still
  allows optional-field proof states before normalization. ADR-0019 adopts a
  discriminated normalized proof-state model but defers implementation to
  TSQ-00A so core/schema/CLI/DB compatibility can be tested in one focused
  source slice.
- TSQ-00A typecheck initially failed because `NormalizedEvidenceCommand` is now
  a real union and CLI rendering tried to read `exitCode` / `outputRef` without
  narrowing. The fix used `in` checks instead of casts, which confirms the
  discriminant is doing useful TypeScript work.
- TSQ-01 found that optional phantom brands are the right pilot shape for the
  current repo: they block typed cross-ID assignment while preserving raw string
  compatibility for existing DB/CLI/schema boundaries. Hard opaque IDs need
  parser constructors first and are deferred.
- TSQ-02 found that `rg -n "JSON\\.parse" packages` also matches one string
  literal in a test objective. That line is not a parse boundary and remains
  classified as documentation text inside a fixture.
- TSQ-03 used the package-source scan as the source of truth and did not add an
  unsafe-type scanner, guardrail, or audit product. The falsifier is simple:
  the package scan returns a real match.
- TSQ-04 classified `packages/cli/src/parseArgHelpers.ts` as internal to the CLI
  package rather than a root package API, but still named its exported helper
  result types because the small change removed the remaining inline object
  return shapes without changing CLI behavior.
- TSQ-05 rejected converting every lifecycle candidate in one slice. The next
  implementation slice is TSQ-05A only, focused on
  `WriteReflectionCandidatesResult`.

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
- 2026-06-24: COND-03 keeps remaining `@krn/core`, `@krn/schema`,
  `@krn/codex-adapter`, and `@krn/workers` barrels as accepted current public
  contracts. The decision is not aesthetic approval of wildcard exports; it is
  a source-backed classification that no test fixtures, smokes, readiness
  probes, DB internals, or adapter internals currently leak through those roots.
  Falsifier: a package root starts exporting helpers whose authority exceeds
  the behavior its package proves.
- 2026-06-24: COND-04 keeps `krn db readiness` and `krn db smoke ...` as
  internal/dev top-level CLI commands. Do not add `krn dev`, do not silently
  rename DB commands, and do not replace them with package scripts only unless
  future evidence shows the current namespace causes operator misuse that help
  and docs cannot prevent.
- 2026-06-24: TSQ-00 accepts ADR-0019. `EvidenceCommand` should become a
  discriminated normalized proof-state model because status/provenance changes
  valid fields. Keep legacy/loose IO parsing and DB JSON readback mapping; do
  not rewrite historical EvidenceBundle rows or broaden the slice into a
  repo-wide TypeScript cleanup.
- 2026-06-24: TSQ-00A implements ADR-0019 without a DB migration. Keep
  `EvidenceCommand` as loose compatibility input, expose
  `NormalizedEvidenceCommand` as the discriminated proof-state union, and
  normalize DB JSON/schema/CLI command evidence before domain use.
- 2026-06-24: TSQ-01 accepts ADR-0020 and pilots soft branded IDs for
  `ExecutionRunId`, `MemoryRecordId`, `MemoryCandidateId`, and `SourceClaimId`.
  Do not hard-brand every ID or add runtime wrapper objects until parser-owned
  IO constructors are explicitly designed.
- 2026-06-24: TSQ-02 rejects global `ts-reset` for core/schema/public APIs.
  Adopt the useful TS Reset mechanism locally instead: parsed JSON is assigned
  to `unknown`, then narrowed by a parser or local guard at the boundary.
- 2026-06-24: TSQ-03 closes unsafe cast quarantine as a zero-current-state.
  There is no present package-source usage to quarantine; future occurrences
  must be handled in the owning slice, not by adding an audit subsystem.
- 2026-06-24: TSQ-04 treats exported function return type inference as a public
  boundary smell only when the function is in a non-dev, non-schema exported
  surface. Fix the two small source gaps found now; do not broaden the slice
  into a full package API redesign.
- 2026-06-24: TSQ-05 selects reflection candidate writer result
  discrimination as the highest-risk impossible-state repair. Evidence command
  proof states are already normalized as a discriminated union; worker jobs are
  keyed by job type and payload; memory promotion gates already enforce runtime
  review constraints, so they are not the first type-shape repair.

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
- Continuous hardening has advanced beyond C0-C6 and EXEC. The first unchecked
  item is always the value in `Active Queue Snapshot`, not this retrospective.
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
- C6-00 found source-grounding invariants were partly enforced in the DB
  adapter and schema, but not exposed as pure core review signals. The retained
  source checks now live in `packages/core/src/source.ts`; DB enforcement
  reuses core decision-grade support-type logic.
- COND-03 found the remaining core/schema/codex-adapter/workers barrels are
  acceptable as current contract surfaces. No source exports were changed; the
  package-surface doc now carries the falsifiers that would reopen the slice.
- COND-04 found current CLI help and tests already enforce the internal/dev DB
  boundary. No parser or command routing changes were made.
- TSQ-00 produced ADR-0019 and the next implementation slice. No TypeScript
  source changed in the decision slice.
- TSQ-00A made normalized command evidence state-dependent:
  `default_template`, `operator_reported`, `captured_output_file`,
  `command_runner`, and `external_log` rows have distinct valid fields.
  Historical/loose rows still normalize through compatibility mapping, and
  weak default-template rows cannot survive as final passed/failed proof.
- TSQ-01 added ADR-0020, `BrandedKrnId<TBrand>`, a four-ID pilot, compile-time
  assignability proof, and a runtime test that branded IDs remain strings.
  Current result: selected high-risk IDs are separated at compile time without
  DB, CLI, schema, or worker refactors.
- TSQ-02 hardened JSON parse boundaries without adding global type patches:
  schema golden-task fixtures parse to `unknown` before schema parser use,
  harness golden fixture ID extraction uses local object/array guards, CLI
  package JSON checks use a local string-record guard, and production
  `readJsonObject` remains an `unknown` plus object-guard boundary.
- TSQ-03 verified the package source currently contains no unsafe casts or
  TypeScript suppressions matching the standard's hard-ban inventory. No source
  repair was needed.
- TSQ-04 removed the remaining public-ish anonymous return boundary findings:
  `mapHarnessPlan` has an explicit `HarnessPlan` return type, and CLI argument
  helpers expose named result interfaces. The post-patch AST inventory found no
  inferred exported function return types or inline object return types in
  non-dev, non-schema package source.
- TSQ-05 produced an impossible-state decision table and one promoted
  implementation slice. No lifecycle model was converted in the audit slice.

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

TSQ-01 verification after piloting branded domain IDs:

```sh
pnpm --filter @krn/core test
pnpm --filter @krn/harness test
pnpm typecheck
pnpm test
git diff --check
rg -n "as any|as unknown as|@ts-ignore|@ts-expect-error|JSON\\.parse" packages/core/src/ids.ts packages/core/src/ids.typecheck.ts packages/core/src/ids.test.ts
```

Observed:

```txt
@krn/core: 10 test files, 50 tests passed.
@krn/harness: 20 test files, 79 tests passed.
workspace typecheck: passed.
workspace test: core/schema/harness/workers/codex-adapter/db/cli passed.
git diff --check: passed with no output.
unsafe-type/JSON scan on touched TS files: no matches.
```

This proves the branded ID pilot compiles under the repo's strict TypeScript
settings, selected core/harness and workspace tests still pass, the touched TS
files did not add local unsafe casts or unchecked JSON, and the diff has no
whitespace errors. It does not prove runtime ID format validation, DB row
semantic correctness, or that every KRN ID family should be branded.

TSQ-02 verification after hardening JSON.parse boundaries:

```sh
rg -n "JSON\\.parse" packages
rg -n "JSON\\.parse\\([^\\n]+\\) as|as \\{ scripts" packages
pnpm --filter @krn/schema test -- goldenTask
pnpm --filter @krn/harness test -- goldenBoundaryBehavior goldenMemoryBehavior goldenObservationReflectionBehavior noisyBrainFixture
pnpm --filter @krn/cli test -- runCli
pnpm typecheck
pnpm test
git diff --check
```

Observed:

```txt
JSON.parse inventory: executable matches now assign parse output to unknown;
one additional match is non-executable text in a test objective.
direct parse-cast scan: no matches.
focused schema test command: 3 test files, 24 tests passed.
focused harness test command: 20 test files, 79 tests passed.
focused CLI test command: 23 test files, 146 tests passed.
workspace typecheck: passed.
workspace test: core/schema/harness/workers/codex-adapter/db/cli passed.
git diff --check: passed with no output.
```

This proves current executable JSON parse sites are inventory-tracked and
unknown-first, the repaired fixture/script tests still pass, the workspace
still compiles and tests, and the diff has no whitespace errors. It does not
prove future JSON parse sites stay safe, runtime JSON payloads are semantically
valid beyond the local guards/parsers, or fetch `.json()` boundaries exist.

TSQ-03 verification after classifying unsafe casts and suppressions:

```sh
if rg -n "as any|as unknown as|@ts-ignore|@ts-expect-error" packages; then exit 1; else test $? -eq 1; fi
pnpm typecheck
pnpm test
git diff --check
```

Observed:

```txt
unsafe cast/suppression package scan: no matches.
workspace typecheck: passed.
workspace test: core/schema/harness/workers/codex-adapter/db/cli passed.
git diff --check: passed with no output.
```

This proves current package source has no matches for the hard-ban unsafe cast
and TypeScript suppression inventory, and that the docs-only classification
does not break workspace typecheck/tests or whitespace checks. It does not
prove future package code cannot introduce unsafe casts, files outside
`packages/` contain no suppressions, or every possible type assertion has been
semantically audited.

TSQ-04 verification after naming public boundary return types:

```sh
node --input-type=module <AST inventory command>
pnpm --filter @krn/db test -- mappers
pnpm --filter @krn/cli test -- parse
pnpm typecheck
pnpm test
git diff --check
```

Observed:

```txt
AST inventory: inferred exported functions: 0.
AST inventory: inline object return types: 0.
focused DB mapper tests: 23 test files, 72 tests passed.
focused CLI parse tests: 23 test files, 146 tests passed.
workspace typecheck: passed.
workspace test: core/schema/harness/workers/codex-adapter/db/cli passed.
git diff --check: passed with no output.
```

This proves the selected non-dev, non-schema package-source inventory has no
exported functions with inferred return types or inline object return types,
and the renamed DB/CLI helper boundaries still compile and pass focused/full
tests. It does not prove every exported type is semantically ideal, every
package wildcard export should stay forever, or non-function public constants
have all been audited.

TSQ-05 verification after impossible-state lifecycle audit:

```sh
pnpm --filter @krn/core test
pnpm typecheck
git diff --check
```

Observed:

```txt
@krn/core: 10 test files, 50 tests passed.
workspace typecheck: passed.
git diff --check: passed with no output.
```

This proves the docs-only lifecycle audit does not break focused core tests,
the workspace still compiles, and the diff has no whitespace errors. It does
not prove `WriteReflectionCandidatesResult` has already been discriminated;
that is TSQ-05A. It also does not prove every lifecycle model is semantically
ideal or that runtime repositories enforce every invariant.

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
- The first unchecked continuous hardening slice is always the value in
  `Active Queue Snapshot`.
- COND, TSQ, and EXEC slices below are queued after the active Evidence
  Integrity closure work unless a narrower slice explicitly promotes one.

Executor rule:

Do not start a broad cleanup goal. Condense only where a public surface, type,
document, or command name gives more authority than implementation evidence
supports.

### EXEC-00: Add Executor Discipline To Active Slice Template

status: complete.

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

observed:

- `executor_discipline` now lives in the active queue snapshot, not as a new
  package, CLI, scanner, audit layer, or quality subsystem;
- progress marks EXEC-00 complete and the active queue no longer points at
  EXEC-00;
- focused docs verification found the Executor Discipline gate and required
  fields in `PLAN.md`;
- `git diff --check` passed.

commit:

```sh
git commit -m "docs(plan): add executor discipline gate"
```

### EXEC-01: Require Slice Template For Future Backlog Items

status: complete.

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

observed:

- `slice_template_gate` now defines the required fields for future backlog
  items and promoted backlog sketches;
- older appendix backlog items are explicitly treated as sketches until
  normalized into the template;
- after EXEC-01, active queue moved to `COND-03`; after COND-03 completion it
  now moves to the first unchecked slice in `Active Queue Snapshot`;
- docs verification found `files forbidden to touch`, `success criteria`, and
  `rollback` in `PLAN.md`;
- `git diff --check` passed.

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

status: complete.

priority: P2.

objective:

Classify broad wildcard exports in core/schema/codex-adapter/workers instead
of deleting them by aesthetics.

assumptions:

- remaining package roots can stay broad only when their exports are stable
  domain, schema, adapter-renderer, or worker-contract surfaces;
- wildcard syntax alone is not a defect if the exported modules are the
  intended contract;
- package roots carry authority, so any test helper, fixture, smoke,
  readiness probe, DB table, concrete adapter, or internal runner leaking
  through them reopens this slice.

tradeoffs:

- keeping accepted barrels avoids churn across import paths and preserves
  existing package ergonomics;
- the risk is future drift, so the decision records falsifiers instead of
  pretending wildcard exports are permanently safe.

simplest acceptable implementation:

- inspect the remaining barrels and directly referenced modules;
- record a source-backed classification in
  `docs/architecture/package-surfaces.md`;
- do not touch package source when no leak is observed.

rules:

- core domain root may stay broad if the exports are stable domain contracts;
- test helpers and fixtures must not go through package root;
- adapter internals must not go through package root;
- workers root should expose contracts, not runtime claims.

files likely touched:

- `docs/architecture/package-surfaces.md`
- selected package indexes only when a decision is trivial and small.

files forbidden to touch:

- package source files unless the inventory proves an internal export leak;
- DB migrations;
- CLI command routing;
- worker runtime/executor code.

non-goals:

- no worker daemon;
- no CLI command move;
- no broad package-barrel rewrite;
- no compatibility layer;
- no audit/quality/anti-slop subsystem.

success criteria:

- every remaining package root is classified as keep/narrow/defer with a
  falsifier;
- `@krn/workers` explicitly says enqueue contracts do not prove runtime
  execution;
- `GOAL.md` and `PLAN.md` point to the next unchecked slice after completion.

verification:

```sh
rg -n "export \\*" packages/*/src/index.ts packages/*/src/**/index.ts
rg -n "schemaPrimitives" packages/schema/src/index.ts packages/schema/src/*.ts
rg -n "requiresBackgroundLoop|daemon|background|runtime|enqueue" packages/workers/src/*.ts packages/workers/README.md docs/decisions/ADR-0015-worker-runtime-boundary.md
rg -n "COND-03|Remaining Barrel|@krn/core|@krn/schema|@krn/codex-adapter|@krn/workers|does_not_prove|falsifier" docs/architecture/package-surfaces.md PLAN.md GOAL.md
git diff --check
```

observed:

- `@krn/core` root and `@krn/core/observations` export domain contracts,
  policy, and validation modules; no test helper or adapter internal is
  exported through the root.
- `@krn/schema` root exports public Zod IO parser modules, while
  `schemaPrimitives.ts` remains internal to schema modules and tests.
- `@krn/codex-adapter` root exports Codex-facing contracts and renderers, not
  execution tooling or mutators.
- `@krn/workers` root exports job descriptions and enqueue contracts only.
  ADR-0015, package README, and `requiresBackgroundLoop: false` state that this
  does not prove a daemon, background loop, job executor, or autonomous
  maintenance runtime.
- No package source change was needed.
- Focused docs-only verification passed, including remaining barrel inventory,
  schema primitive visibility check, worker runtime boundary scan, decision
  text scan, and `git diff --check`.

rollback:

```sh
git revert <COND-03 commit>
```

commit:

```sh
git commit -m "docs(exports): decide remaining package barrels"
```

### COND-04: CLI Public Surface Code Move Decision

status: complete.

priority: P2.

objective:

Decide the code-level fate of internal/dev CLI surfaces without silently
renaming commands or recreating an audit/guard layer.

assumptions:

- CLI command names carry product authority, so internal/dev commands need
  visible boundary language in help and docs;
- a command namespace should not be renamed unless live evidence shows the
  current name causes real operator misuse;
- package scripts may wrap internal/dev CLI commands as local verification
  shortcuts without making those commands product workflow.

tradeoffs:

- keeping `krn db ...` preserves existing scripts and operator muscle memory;
- adding `krn dev ...` would make the namespace more explicit but introduces
  compatibility churn and another command family before evidence proves it is
  needed;
- scripts-only would hide useful runtime plumbing behind package-manager
  wrappers and weaken direct CLI verification.

simplest acceptable implementation:

- verify current top-level help, DB help, parser, package scripts, and tests;
- record a decision in `docs/architecture/cli-surfaces.md`;
- do not change parser or routing unless help/tests contradict the intended
  internal/dev boundary.

options:

1. keep DB readiness/smokes but hide or clearly mark them as internal/dev;
2. move DB/dev operations under an explicit `krn dev ...` namespace;
3. replace some dev commands with package scripts only.

rules:

- `krn audit` remains removed;
- do not create `krn guard`;
- do not silently rename without a compatibility decision.

decision:

Keep option 1. `krn db readiness` and `krn db smoke ...` remain top-level
internal/dev commands because live help and tests already classify them as
runtime plumbing proof, not public operator workflow or quality authority.

files likely touched:

- `docs/architecture/cli-surfaces.md`;
- `PLAN.md`;
- `GOAL.md`.

files forbidden to touch:

- `packages/cli/src/parseArgs.ts`;
- `packages/cli/src/parseDbArgs.ts`;
- `packages/cli/src/runCli.ts`;
- package scripts;
- DB smoke implementations.

non-goals:

- no `krn dev` namespace;
- no parser rename;
- no compatibility shim;
- no `krn guard`;
- no audit/quality/anti-slop subsystem.

success criteria:

- `docs/architecture/cli-surfaces.md` records why `krn db` stays internal/dev;
- plan/goal pointer moves to the next unchecked slice after completion;
- CLI help and tests prove the current boundary is visible;
- verification states what this does and does not prove.

verification:

```sh
pnpm --filter @krn/cli krn --help
pnpm --filter @krn/cli krn db --help
pnpm --filter @krn/cli test
pnpm typecheck
git diff --check
```

observed:

- `krn --help` groups `krn db --help`, `krn db readiness`, and
  `krn db smoke ...` under `Internal/dev commands`.
- `krn db --help` says DB readiness and smoke commands prove local runtime
  plumbing only and are not public operator workflow, product quality authority,
  or Memory Brain readiness proof.
- `pnpm --filter @krn/cli test` passed 23 test files and 146 tests, including
  removed `krn audit` rejection and DB smoke/script coverage.
- `pnpm typecheck` passed across the workspace.
- `git diff --check` passed.
- This docs decision did not run DB commands and does not prove DB runtime
  readiness in the current shell.

rollback:

```sh
git revert <COND-04 commit>
```

commit:

```sh
git commit -m "docs(cli): decide internal dev command surface"
```

### TSQ-00: EvidenceCommand Discriminated Union Decision

status: complete.

priority: P1.

objective:

Decide whether current `EvidenceCommand` should stay as normalized object fields
or become a discriminated union by provenance.

assumptions:

- `EvidenceCommand` is a public core/schema/CLI/DB boundary, not a private
  helper type;
- persisted historical EvidenceBundle JSON may contain loose rows, so any final
  model must keep compatibility mapping;
- the decision slice should not mutate TypeScript source.

tradeoffs:

- keeping the current normalized object is simpler today, but it lets invalid
  proof-state combinations exist until normalization;
- a discriminated model is more explicit but touches several package
  boundaries, so implementation needs a separate focused source slice.

simplest acceptable implementation:

- inspect current core/schema/CLI/DB evidence command usage;
- write an ADR that decides the final model and implementation constraints;
- queue a separate implementation slice.

source:

Total TypeScript describes types as a way to communicate business logic and
maintainability, not only compile-time errors. It also shows literal unions as
the way to restrict possible values and runtime narrowing as the way to move
from wider to narrower types:

- https://www.totaltypescript.com/books/total-typescript-essentials/designing-your-types-in-typescript
- https://www.totaltypescript.com/books/total-typescript-essentials/unions-literals-and-narrowing

decision:

Adopt a discriminated normalized command proof-state model in ADR-0019.
Implementation is queued as TSQ-00A.

rules:

- do not merge this into EVI-00 retroactively;
- decide by current evidence after EVI-04 run-ledger closure;
- if adopted, implement as a small core/schema slice with compatibility
  mapping for persisted rows.

files likely touched:

- `docs/decisions/ADR-0019-evidence-command-proof-states.md`;
- `PLAN.md`;
- `GOAL.md`.

files forbidden to touch:

- TypeScript source files;
- DB migrations;
- historical EvidenceBundle rows.

non-goals:

- no code refactor in TSQ-00;
- no repo-wide TypeScript cleanup;
- no DB migration;
- no hidden command runner.

success criteria:

- ADR decides whether to adopt or reject the discriminated model;
- decision records source -> mechanism -> KRN implication -> decision ->
  does_not_prove -> falsifier;
- follow-up implementation slice is bounded if adoption is accepted.

verification:

```sh
rg -n "EvidenceCommand|normalizeEvidenceCommand|EvidenceCommandSchema|commandResultDoesNotProve|provenance" packages docs PLAN.md --glob '!node_modules'
rg -n "ADR-0019|Evidence Command Proof States|TSQ-00A|does_not_prove|falsifier" docs/decisions/ADR-0019-evidence-command-proof-states.md PLAN.md GOAL.md
pnpm typecheck
git diff --check
```

observed:

- current core type has optional `provenance`, optional `doesNotProve`, and
  optional output/assertion fields before normalization;
- schema accepts optional evidence command provenance/limits;
- CLI creates default-template and operator-reported rows;
- DB repository tests prove normalization before persistence;
- ADR-0019 accepts discriminated proof-state modeling and requires
  compatibility mapping for persisted loose rows;
- ADR/plan scan found ADR-0019, TSQ-00A, `does_not_prove`, and falsifier
  coverage in the active surfaces;
- `pnpm typecheck` passed across the workspace;
- `git diff --check` passed;
- no TypeScript source was changed in this decision slice.

rollback:

```sh
git revert <TSQ-00 commit>
```

commit:

```sh
git commit -m "docs(ts): decide evidence command proof states"
```

### TSQ-00A: Implement EvidenceCommand Discriminated Union

status: complete.

priority: P1.

objective:

Implement ADR-0019 by making normalized evidence command proof states
discriminated while preserving legacy IO and DB JSON compatibility.

assumptions:

- historical persisted EvidenceBundle rows may not contain `kind` or required
  final fields;
- the current JSONB persistence shape can likely preserve the mapped command
  proof states without a migration;
- the implementation must preserve current CLI evidence capture behavior.

tradeoffs:

- adding a `kind`/proof-state discriminant improves impossible-state checking
  but requires mapper updates across core/schema/CLI/DB;
- rejecting every legacy loose row would be purer but would break historical
  readback and violate Evidence Integrity compatibility.

simplest acceptable implementation:

- introduce a discriminated normalized command proof type in core;
- keep a legacy/loose input type for schema/CLI/DB boundary parsing;
- normalize all command rows before persistence/rendering/review logic;
- update focused tests around evidenceBundle, schema evidence parsing, CLI
  evidence capture, and DB command normalization.

rules:

- `default_template` rows are weak and cannot be final `passed`/`failed` proof;
- `doesNotProve` is required after normalization;
- `captured_output_file`/`external_log` rows need an output reference;
- `command_runner` rows need `exitCode` and `capturedAt`;
- no DB migration unless JSON storage cannot round-trip the final shape;
- no unrelated TypeScript cleanup.

files likely touched:

- `packages/core/src/evidenceBundle.ts`;
- `packages/core/src/evidenceBundle.test.ts`;
- `packages/schema/src/evidenceCapture.ts`;
- `packages/schema/src/index.test.ts`;
- `packages/cli/src/parseEvidenceArgs.ts`;
- `packages/cli/src/runEvidenceCaptureCommand.ts`;
- focused CLI tests if compiler/runtime expectations require updates;
- `packages/db/src/repositories/DrizzleHarnessRunRepository.ts`;
- focused DB mapper/repository tests.

files forbidden to touch:

- unrelated TypeScript models;
- DB migrations unless explicitly proven necessary;
- worker runtime;
- Promptfoo/eval surfaces;
- historical run ledgers except a concise completion note if needed.

non-goals:

- no evidence command runner;
- no Memory Brain quality scoring;
- no broad public API cleanup;
- no `ts-reset`;
- no rewrite of historical persisted rows.

success criteria:

- core exposes a discriminated normalized command proof type;
- legacy/loose command rows still normalize;
- schema validates/narrows external evidence command input;
- CLI `--verification` and default-template rendering remain compatible;
- DB persistence/readback preserves explicit proof state and weak defaults;
- focused tests plus typecheck pass.

verification:

```sh
pnpm --filter @krn/core test -- evidenceBundle
pnpm --filter @krn/schema test -- evidence
pnpm --filter @krn/cli test -- parseEvidenceArgs runEvidenceCaptureCommand runCli
pnpm --filter @krn/db test -- DrizzleHarnessRunRepository
pnpm typecheck
git diff --check
```

observed:

- core now keeps `EvidenceCommand` as loose compatibility input and exposes
  `NormalizedEvidenceCommand` as a discriminated union with `kind`.
- `normalizeEvidenceCommand` returns distinct `default_template`,
  `operator_reported`, `captured_output_file`, `command_runner`, and
  `external_log` states.
- `default_template` rows are weak; malformed or legacy `passed`/`failed`
  default-template rows normalize to `not_run` instead of final proof.
- schema evidence parsing accepts legacy/loose input and returns normalized
  command proof state with `kind`.
- CLI evidence capture normalizes command rows once and uses union narrowing
  when rendering optional proof fields.
- DB JSON mapping narrows raw command arrays into normalized proof rows before
  domain use; no schema or migration change was required.
- focused verification passed:
  `pnpm --filter @krn/core test -- evidenceBundle`,
  `pnpm --filter @krn/schema test -- evidence`,
  `pnpm --filter @krn/cli test -- parseEvidenceArgs runEvidenceCaptureCommand runCli`,
  and `pnpm --filter @krn/db test -- DrizzleHarnessRunRepository`.
- full workspace `pnpm typecheck`, full workspace `pnpm test`, and
  `git diff --check` passed.

rollback:

```sh
git revert <TSQ-00A commit>
```

### TSQ-01: Branded ID Types ADR And Pilot

priority: P1.

status: complete.

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

assumptions:

- current DB/CLI/schema boundaries still produce raw strings;
- the first value is preventing typed cross-ID mixups, not runtime ID format
  validation;
- a branded pilot must compile without broad casts or package-wide refactors.

tradeoffs:

- soft brands preserve string compatibility but do not validate runtime ID
  format;
- hard brands would be stronger but require parser-owned constructors and a
  larger IO-boundary migration.

simplest acceptable implementation:

- add one generic soft brand helper in `packages/core/src/ids.ts`;
- brand only the four selected high-risk IDs;
- add an ADR and typecheck-backed assignability proof.

files likely touched:

- `packages/core/src/ids.ts`;
- `packages/core/src/ids.typecheck.ts`;
- `packages/core/src/ids.test.ts`;
- `docs/decisions/ADR-0020-branded-domain-ids.md`;
- `GOAL.md`;
- `PLAN.md`.

files forbidden to touch:

- DB schema/migrations;
- CLI parsers;
- schema validators;
- worker runtime behavior;
- unrelated ID families.

non-goals:

- no hard opaque ID constructors;
- no runtime wrapper objects;
- no whole-repo ID conversion;
- no JSON/CLI/DB boundary validation repair in this slice.

success criteria:

- selected IDs are no longer mutually assignable once typed;
- raw strings remain assignable to selected IDs for existing IO compatibility;
- runtime value shape remains a string;
- ADR records the decision, rejections, and falsifiers.

verification:

```sh
pnpm --filter @krn/core test
pnpm --filter @krn/harness test
pnpm typecheck
git diff --check
```

rollback:

```sh
git revert <TSQ-01 commit>
```

commit:

```sh
git commit -m "feat(core): pilot branded domain ids"
```

### TSQ-02: JSON.parse Boundary Classification

priority: P1.

status: complete.

objective:

Classify every `JSON.parse` as production safe boundary, test-only acceptable,
or repair candidate.

source:

TS Reset documents rules that make `JSON.parse` and `.json()` return `unknown`,
but it also cautions that `ts-reset` is for applications, not libraries, because
it changes global scope:

- https://www.totaltypescript.com/ts-reset

source_decision:

source_id: Total TypeScript, "TS Reset".
trust_tier: medium as practitioner TypeScript tooling documentation, not KRN
product truth.
mechanism: TS Reset changes global TypeScript built-in typings so `JSON.parse`
and response `.json()` return `unknown`, and its docs caution that the package
is designed for application code rather than libraries because it mutates
global scope.
krn_implication: KRN should adopt the unknown-first boundary behavior locally
without importing a global reset into core/schema/public package APIs.
decision: reject global `ts-reset` for this slice; require `const parsed:
unknown = JSON.parse(...)` followed by schema parser or local guard.
does_not_prove: every parsed value is semantically valid, every JSON boundary
in future code is safe, or `.json()` fetch boundaries are present in this repo.
consumer: TSQ-02 JSON.parse boundary repairs.
falsifier: executable `JSON.parse` results are trusted directly, or a future
slice adds global `ts-reset` to library/public package code.

rules:

- production `JSON.parse` must produce `unknown`;
- validate with Zod or a local guard before domain use;
- no global `ts-reset` in core/schema/public APIs;
- test-only parses need an explicit reason if they bypass validation.

assumptions:

- current `rg -n "JSON\\.parse" packages` is the authoritative inventory for
  this slice;
- test fixtures may parse JSON, but parsed values must be `unknown` until a
  parser or local guard checks the fields actually used;
- the production CLI `readJsonObject` helper is acceptable if it continues to
  return only guarded JSON objects or `undefined`.

tradeoffs:

- local guards duplicate a few lines across tests, but avoid creating a new
  fixture parsing abstraction for one narrow cleanup;
- not adding `ts-reset` avoids global scope mutation in library/public package
  code, but requires explicit `unknown` assignments at parse sites.

simplest acceptable implementation:

- keep production `readJsonObject` as `unknown` plus object guard;
- replace direct test casts after `JSON.parse` with `unknown` plus local guards
  or existing schema parsers;
- record the classification in this plan.

files likely touched:

- `packages/schema/src/goldenTask.test.ts`;
- `packages/harness/src/goldenBoundaryBehavior.test.ts`;
- `packages/harness/src/activation/goldenMemoryBehavior.test.ts`;
- `packages/harness/src/goldenObservationReflectionBehavior.test.ts`;
- `packages/cli/src/runCli.test.ts`;
- `GOAL.md`;
- `PLAN.md`.

files forbidden to touch:

- production core/schema/domain models;
- DB schema/migrations;
- CLI runtime behavior beyond tests;
- global TypeScript config and global `ts-reset` files.

non-goals:

- no global `ts-reset`;
- no broad fixture loader framework;
- no repair of unrelated unsafe casts; TSQ-03 owns that;
- no runtime ID/parser constructor work.

classification:

- production safe boundary: `packages/cli/src/cliFileBoundary.ts` parses to
  `unknown` and returns only a guarded JSON object or `undefined`;
- schema test parser boundary: `packages/schema/src/goldenTask.test.ts` parses
  fixtures to `unknown` and passes them into `parseGoldenTaskFixtures`;
- harness test fixture boundary: golden fixture case ID helpers parse to
  `unknown` and use local object/array guards before reading `cases[].id`;
- CLI test fixture boundary: `packages/cli/src/runCli.test.ts` reads root
  `package.json` as `unknown` and narrows `scripts` to `Record<string, string>`;
- non-boundary text match: `packages/harness/src/compiler/index.test.ts`
  contains `JSON.parse` only in a string objective.

success criteria:

- every executable `JSON.parse` result is first assigned to `unknown`;
- no executable parse site casts directly to a trusted shape;
- production parse remains guarded;
- tests still prove fixture/script expectations.

verification:

```sh
rg -n "JSON\\.parse" packages
rg -n "JSON\\.parse\\([^\\n]+\\) as|as \\{ scripts" packages
pnpm --filter @krn/schema test -- goldenTask
pnpm --filter @krn/harness test -- goldenBoundaryBehavior goldenMemoryBehavior goldenObservationReflectionBehavior noisyBrainFixture
pnpm --filter @krn/cli test -- runCli
pnpm typecheck
pnpm test
git diff --check
```

rollback:

```sh
git revert <TSQ-02 commit>
```

commit:

```sh
git commit -m "refactor(ts): harden json parse boundaries"
```

### TSQ-03: Unsafe Cast Quarantine

priority: P2.

status: complete.

objective:

Classify `as any`, `as unknown as`, `@ts-ignore`, and `@ts-expect-error` usage
as accepted boundary tests, hostile runtime fixtures, or repair candidates.

source_decision:

source_id: live package inventory from
`rg -n "as any|as unknown as|@ts-ignore|@ts-expect-error" packages`.
trust_tier: high live source scan for current package files.
mechanism: the scan finds no current package-source matches for unchecked
`any`, double assertions, `@ts-ignore`, or `@ts-expect-error`.
krn_implication: there is no current unsafe cast fixture to quarantine in this
slice, and adding a new audit/guardrail layer would be scope drift.
decision: close TSQ-03 as a zero-current-state classification and leave future
unsafe occurrences to the owning implementation slice.
does_not_prove: future code cannot introduce unsafe casts, files outside
`packages/` have no suppressions, or every possible type weakening pattern has
been found.
consumer: TSQ-03 plan checkpoint and command evidence.
falsifier: the package scan returns a real match.

rules:

- production unsafe casts are not accepted without local proof;
- hostile test fixtures should prefer `unknown` plus parser/guard;
- `@ts-expect-error` must explain the expected failure;
- no `@ts-ignore` without a replacement plan.

assumptions:

- the TSQ-03 scope is package source, matching the TypeScript hard-ban
  inventory in `docs/standards/typescript-excellence.md`;
- no-match inventory means no code repair is required in this slice;
- future unsafe casts should be fixed where they are introduced instead of
  being routed through a new scanner subsystem.

tradeoffs:

- closing on a zero-current-state avoids speculative tooling, but relies on
  the existing verification command being rerun when future slices touch TS;
- scanning only the listed hard-ban patterns does not classify every possible
  type assertion, which belongs to TSQ-04/TSQ-05 if it affects public contracts
  or impossible states.

simplest acceptable implementation:

- record the no-match package inventory;
- update `GOAL.md` / active snapshot to the next TypeScript quality slice;
- do not change package code.

files likely touched:

- `GOAL.md`;
- `PLAN.md`.

files forbidden to touch:

- package source;
- TypeScript config;
- audit/scanner tooling;
- unrelated docs.

non-goals:

- no new audit subsystem;
- no broad search beyond the named hard-ban inventory;
- no refactor of ordinary type assertions.

classification:

- accepted boundary tests: none currently found;
- hostile runtime fixtures needing quarantine: none currently found;
- repair candidates: none currently found;
- production unsafe casts/suppressions: none currently found.

success criteria:

- package scan returns no hard-ban matches;
- `PLAN.md` records zero-current-state and falsifier;
- workspace typecheck/tests still pass;
- active queue advances to TSQ-04.

verification:

```sh
! rg -n "as any|as unknown as|@ts-ignore|@ts-expect-error" packages
pnpm typecheck
pnpm test
git diff --check
```

rollback:

```sh
git revert <TSQ-03 commit>
```

commit:

```sh
git commit -m "docs(ts): classify unsafe type fixtures"
```

### TSQ-04: Explicit Public Type Boundary Audit

priority: P1.

status: complete.

objective:

Ensure public package APIs use named exported types instead of anonymous object
shapes that hide boundary contracts.

source_decision:

source_id: TypeScript AST inventory over non-test package source.
trust_tier: high live source inventory.
mechanism: exported function declarations and exported arrow/function
expressions were scanned for inferred return types and inline object return
types, excluding dev and DB schema table modules.
krn_implication: public-ish functions should not leak unnamed object shapes as
their contract; named return types make package authority and review easier to
reason about.
decision: patch the three findings instead of creating a broader API redesign:
DB `mapHarnessPlan` returns `HarnessPlan`, and CLI argument helpers expose
named result interfaces.
does_not_prove: every exported type is semantically perfect, all package root
wildcards are ideal forever, or ordinary non-function object exports are all
domain-clean.
consumer: TSQ-04 source patch and plan checkpoint.
falsifier: the AST inventory reports inferred exported function return types
or inline object return types in non-dev, non-schema package source.

targets:

- CLI public runtime types;
- DB repository/factory types;
- harness activation/review-gate ports;
- evidence command and activation decision types.

assumptions:

- package roots/subpaths define the practical public surface for this private
  workspace;
- DB schema table modules and dev smokes/readiness are explicit non-product
  subpaths, so the audit excludes them from public-domain return-type repair;
- a small source patch is better than a docs-only classification when the live
  inventory finds precise return-type gaps.

tradeoffs:

- the AST inventory checks exported functions, not every exported constant or
  every semantic domain model;
- naming internal CLI helper result types is slightly more explicit than
  strictly required by the root package API, but it avoids leaving an exported
  anonymous shape behind.

simplest acceptable implementation:

- add named return types for the discovered gaps;
- rerun AST inventory until it reports zero inferred/inline exported function
  return types for the chosen scope;
- record scope limits and falsifier in `PLAN.md`.

files likely touched:

- `packages/db/src/repositories/mappers.ts`;
- `packages/cli/src/parseArgHelpers.ts`;
- `GOAL.md`;
- `PLAN.md`.

files forbidden to touch:

- package export topology;
- DB schema/migrations;
- CLI parser behavior;
- unrelated public APIs.

non-goals:

- no package surface redesign;
- no broad barrel cleanup;
- no semantic rewrite of activation/evidence/memory models;
- no new type-audit subsystem.

classification:

- CLI root `runCli`, `CliRuntime`, and `CliResult`: already named;
- evidence command and activation decision domain types: already named;
- harness activation/review-gate ports: already named;
- DB adapter mapper gap: `mapHarnessPlan` needed explicit `HarnessPlan`;
- CLI internal helper gap: `optionValue` and `metadataEntry` needed named
  result interfaces.

success criteria:

- AST inventory reports zero inferred exported function return types and zero
  inline object return types in non-dev, non-schema package source;
- typecheck/tests still pass;
- no package export topology changes are made.

verification:

```sh
node --input-type=module <AST inventory command>
pnpm --filter @krn/db test -- mappers
pnpm --filter @krn/cli test -- parse
pnpm typecheck
pnpm test
git diff --check
```

rollback:

```sh
git revert <TSQ-04 commit>
```

commit:

```sh
git commit -m "refactor(ts): name public boundary return types"
```

### TSQ-05: Impossible-State Audit For Core Lifecycles

priority: P2.

status: complete.

objective:

Find core lifecycle states where the current model allows invalid combinations
that should become discriminated unions or narrower value objects.

source_decision:

source_id: live source inventory of `packages/core/src/evidenceBundle.ts`,
`packages/core/src/reflection/index.ts`,
`packages/harness/src/reflection/reflectionCandidateWriter.ts`,
`packages/harness/src/activation/types.ts`, `packages/workers/src/jobTypes.ts`,
`packages/workers/src/enqueueMaintenanceJob.ts`,
`packages/harness/src/repositories/memoryRepository.ts`,
`packages/harness/src/memory/memoryReviewGate.ts`, and
`packages/harness/src/memory/antiMemoryReviewGate.ts`.
trust_tier: high live source.
mechanism: lifecycle status fields were checked against the payload fields they
make valid or invalid.
krn_implication: when a status changes which fields are valid, the public type
should be a discriminated union or narrower value object instead of relying on
callers to remember the convention.
decision: promote only `WriteReflectionCandidatesResult` to implementation in
TSQ-05A; keep other candidates as classified follow-ups or already-acceptable
models.
does_not_prove: every lifecycle model is perfect, runtime repositories enforce
all invariants, or reflection candidate writer behavior is currently broken.
consumer: TSQ-05A implementation slice.
falsifier: TSQ-05A can still express `status: "blocked"` with created
candidates or `status: "ready"` with blocking reasons.

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

assumptions:

- EvidenceCommand compatibility input may remain loose if the normalized proof
  state is already discriminated and all IO boundaries normalize before domain
  use;
- this audit should select one next implementation target, not rewrite every
  lifecycle in one diff;
- candidate-write paths deserve higher priority than low-risk status labels
  because they can create future MemoryCandidate/SourceClaim/EvalCandidate rows.

tradeoffs:

- choosing reflection candidate writer first leaves EvidenceBundle status and
  MemoryCandidate status as documented risks, but prevents a sprawling type
  rewrite;
- a discriminated writer result is a small final-pattern repair with clear
  tests and low blast radius.

simplest acceptable implementation:

- classify the candidate lifecycle models in one table;
- promote the highest-risk model to TSQ-05A;
- do not change source code in TSQ-05.

files likely touched:

- `GOAL.md`;
- `PLAN.md`.

files forbidden to touch:

- package source;
- DB schema/migrations;
- worker runtime behavior;
- CLI behavior.

non-goals:

- no conversion of all lifecycle models;
- no worker runtime;
- no dashboard/eval platform;
- no audit subsystem.

decision_table:

| Candidate | Live shape | Impossible state risk | Decision |
| --- | --- | --- | --- |
| `EvidenceCommand` | Loose compatibility input plus discriminated `NormalizedEvidenceCommand` | Low after TSQ-00A; loose rows are still needed for legacy/schema/DB compatibility | Keep as-is until a boundary proves unnormalized domain use |
| `EvidenceBundle.status` | `"draft" | "captured" | "verified" | "rejected"` with one object shape | Medium; status does not currently control required fields in type, but completeness helpers enforce command/change/rollback evidence | Defer; revisit only if status begins governing persistence/review workflow |
| `WriteReflectionCandidatesResult` | `status: "ready" | "blocked"` plus all arrays and `blockedReasons` in one interface | High; type permits blocked result with created candidates and ready result with blocking reasons on a candidate-write path | Promote TSQ-05A |
| Activation decisions | `RankedActivationCandidate` plus optional `exclusion`, separate context inclusions/exclusions | Medium; excluded candidates can still be represented as ranked candidates, but downstream context assembly already separates inclusions/exclusions | Defer until activation misuse appears |
| Worker job descriptor/write authority | `MaintenanceJob<TType>` is discriminated by job type and payload; authority map is keyed by job type | Low; allowed/forbidden write authority is already explicit and ADR-0015 keeps runtime absent | Keep as-is |
| Memory promotion result | Gate functions return final record plus candidate/source claims and throw on invalid candidate state | Medium; runtime gate protects promotion, but candidate status itself is broad | Defer behind reflection writer result |

selected_follow_up:

TSQ-05A: Discriminate reflection candidate writer result.

success criteria:

- decision table names one highest-risk implementation slice;
- active queue advances to TSQ-05A;
- no lifecycle model is converted in the audit slice;
- typecheck and focused core tests still pass.

verification:

```sh
pnpm --filter @krn/core test
pnpm typecheck
git diff --check
```

rollback:

```sh
git revert <TSQ-05 commit>
```

commit:

```sh
git commit -m "docs(ts): audit impossible lifecycle states"
```

### DEV-DB-00: Default Local DB URL For Root DB Scripts

priority: P0.

status: complete.

objective:

Make root DB verification scripts work against the repo-local compose Postgres
without requiring every command to manually prefix
`KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn`.

assumptions:

- direct CLI commands should remain strict when `KRN_DATABASE_URL` is absent;
- root `pnpm db:*` scripts are local operator conveniences and may default to
  the compose database while still respecting an explicit `KRN_DATABASE_URL`;
- the local `krn-postgres` container is the intended default DB runtime for
  this workspace.

tradeoffs:

- duplicating the default URL in root DB scripts is less elegant than a helper
  script, but it avoids adding a new abstraction or dependency for shell env
  plumbing;
- direct CLI strictness keeps DB runtime truth explicit for non-root usage.

simplest acceptable implementation:

- add `${KRN_DATABASE_URL:-postgres://krn:krn@localhost:54329/krn}` defaults to
  root DB readiness and smoke scripts only;
- document that root scripts default locally while direct CLI remains strict.

files touched:

- `package.json`;
- `GOAL.md`;
- `PLAN.md`.

files explicitly not touched:

- CLI command implementation;
- DB schema or migrations;
- readiness/smoke runtime code;
- tests.

non-goals:

- no automatic Docker startup;
- no global environment mutation;
- no change to direct CLI missing-env behavior;
- no DB schema or migration change.

success criteria:

- plain `pnpm db:ready` works from repo root when local compose Postgres is
  running;
- plain `pnpm db:smoke` works from repo root when local compose Postgres is
  running;
- direct CLI strictness remains documented.

verification:

```sh
pnpm db:ready
pnpm db:smoke
git diff --check
git status --short --branch
```

command evidence:

- `pnpm db:ready`: passed with Postgres configured, reachable, 13/13 migrations
  applied, pgvector available, and Brain store readiness ready. This proves the
  root readiness script now reaches the local compose DB without manual env
  prefix. It does not prove all DB smokes.
- `pnpm db:smoke`: passed with workspace/project readback matched and cleanup
  completed. This proves the root smoke script can write/read/cleanup using the
  local default DB URL. It does not prove every specialized DB smoke.
- `pnpm typecheck`: passed across workspace packages. This proves the script
  and docs change did not break current TypeScript compilation. It does not
  execute runtime DB flows beyond the DB commands above.
- `git diff --check`: passed. This proves the diff has no whitespace errors.

rollback:

```sh
git revert <DEV-DB-00 commit>
```

commit:

```sh
git commit -m "chore(db): default local verification scripts"
```

### TSQ-05A: Discriminate Reflection Candidate Writer Result

priority: P1.

status: complete.

objective:

Make `WriteReflectionCandidatesResult` state-dependent so blocked writer
results cannot carry created candidates, and ready writer results cannot carry
blocking reasons.

source:

TSQ-05 decision table.

assumptions:

- `writeReflectionCandidates` currently blocks before any repository writes
  when reflection output contract or candidate evidence is invalid;
- existing ready-path writes are behaviorally correct for this slice;
- callers should narrow on `result.status` before reading ready-only or
  blocked-only fields.

tradeoffs:

- removing empty candidate arrays from blocked results is a breaking internal
  type cleanup, but it is the point of the slice: blocked output should not
  look like an empty ready write;
- using a non-empty tuple for `blockedReasons` adds a tiny helper, but it makes
  the blocked invariant visible to TypeScript.

simplest acceptable implementation:

- split `WriteReflectionCandidatesResult` into ready and blocked interfaces;
- return only `blockedReasons` on blocked results;
- return only created/unsupported candidate arrays on ready results;
- update focused tests to narrow by `status`.

rules:

- keep `writeReflectionCandidates` behavior the same unless tests reveal a real
  bug;
- represent blocked and ready result states as a discriminated union;
- blocked result should carry non-empty blocked reasons and no candidate arrays
  beyond empty/absent fields;
- ready result may carry created candidates, eval candidates, source claims,
  and unsupported non-blocking candidates;
- do not create source/eval/memory stores or new writer paths.

likely files:

- `packages/harness/src/reflection/reflectionCandidateWriter.ts`;
- `packages/harness/src/reflection/reflectionCandidateWriter.test.ts`;
- maybe CLI/db tests only if type fallout reaches them;
- `GOAL.md`;
- `PLAN.md`.

files forbidden to touch:

- DB schema or migrations;
- CLI command behavior;
- worker runtime behavior;
- reflection candidate storage paths beyond the result type.

non-goals:

- no new candidate writer path;
- no source/eval/memory store creation;
- no behavior change to which candidates are written;
- no broad lifecycle-model rewrite.

success criteria:

- blocked result type has non-empty `blockedReasons` and no candidate arrays;
- ready result type has candidate arrays and no `blockedReasons`;
- focused tests prove both blocked cases do not write candidates;
- typecheck catches callers that access wrong fields without narrowing.

outcome:

- `WriteReflectionCandidatesResult` is now a discriminated union of
  `BlockedWriteReflectionCandidatesResult` and
  `ReadyWriteReflectionCandidatesResult`;
- blocked results carry non-empty `ReflectionCandidateWriterBlockedReasons` and
  no candidate arrays;
- ready results carry created/unsupported candidate arrays and no
  `blockedReasons`;
- focused tests narrow on `result.status` and assert blocked results do not
  expose candidate arrays.

verification:

```sh
pnpm --filter @krn/harness test -- reflectionCandidateWriter
pnpm typecheck
pnpm test
git diff --check
```

command evidence:

- `pnpm --filter @krn/harness test -- reflectionCandidateWriter`: first failed
  because the ready runtime object still included `blockedReasons: []`; after
  removing that field, it passed with 20 test files and 79 tests. This proves
  the focused writer contract and nearby harness tests pass.
- `pnpm typecheck`: passed across workspace packages. This proves callers must
  narrow the discriminated result before reading ready-only or blocked-only
  fields.
- first `pnpm test`: failed in two CLI script expectation tests because
  DEV-DB-00 changed root DB smoke scripts to include default
  `KRN_DATABASE_URL`; fixed separately in pushed commit
  `2b5fedf test(cli): align db smoke script expectations`.
- final `pnpm test`: passed across core/schema/harness/workers/codex-adapter/db
  and CLI. This proves the final workspace test suite passes after TSQ-05A and
  the DEV-DB-00 test expectation fix.
- `git diff --check`: passed. This proves the diff has no whitespace errors.

rollback:

```sh
git revert <TSQ-05A commit>
```

commit:

```sh
git commit -m "refactor(reflection): discriminate candidate writer result"
```

### CTX-00: Condense Completed Hardening Context

priority: P1.

status: complete.

objective:

Reduce active-plan context after the completed TSQ/EVI/COND hardening run so
future workers see the current objective, next unchecked item, open risks, and
evidence pointers without carrying every completed task detail in the active
window.

assumptions:

- completed checkpoint bullets and command evidence pointers are enough active
  context for already-pushed slices;
- detailed completed task bodies may remain historical ledger, but should not
  be the first context workers must process;
- no source or runtime behavior should change in a context-condensation slice.

tradeoffs:

- aggressive deletion saves context but risks losing local recovery detail;
- the safer final-pattern is to compact the active snapshot and demote detail
  to historical ledger, not erase evidence.

simplest acceptable implementation:

- compress the Active Queue Snapshot to current objective, completed checkpoint
  categories, open risks, rollback/evidence pointers, and CTX-00 next action;
- move or collapse duplicate completed prose that does not change execution;
- keep exact command evidence and decision-file pointers reachable.

rules:

- docs-only unless live repo evidence shows a broken plan pointer;
- do not delete decision records, run ledgers, or source evidence;
- do not edit package source;
- do not invent a new planning surface.

likely files:

- `GOAL.md`;
- `PLAN.md`.

files forbidden to touch:

- package source;
- DB schema/migrations;
- historical evidence files unless a broken pointer is found.

non-goals:

- no feature work;
- no test rewriting;
- no audit subsystem;
- no new plan file.

success criteria:

- Active Queue Snapshot is smaller and still names the next unchecked slice;
- completed hardening work is represented as compact checkpoint evidence;
- historical evidence pointers remain available;
- docs-only verification passes.

outcome:

- Active Queue Snapshot now uses compact checkpoint categories instead of
  carrying every completed hardening task as first-read context;
- active handoff fields preserve current objective, last verified state,
  decisions, risks, context selectors, next action, and do-not-reread guidance;
- historical ledger sections, command evidence, run ledgers, and ADR pointers
  remain in `PLAN.md` / referenced docs;
- next unchecked slice is promoted to `TSQ-05B: Decide Memory Promotion Result
  State Shape`.

verification:

```sh
git status --short --branch
git diff --check
pnpm typecheck
```

command evidence:

- pre-slice `git status --short --branch`: clean at `## main...origin/main`;
  verification status after edits showed only `GOAL.md` and `PLAN.md` modified.
  This proves CTX-00 started clean and stayed docs-only.
- `git diff --check`: passed. This proves the docs diff has no whitespace
  errors.
- `pnpm typecheck`: passed across workspace packages. This proves the docs-only
  condensation did not break current TypeScript compilation.

rollback:

```sh
git revert <CTX-00 commit>
```

commit:

```sh
git commit -m "docs(plan): condense completed hardening context"
```

### TSQ-05B: Decide Memory Promotion Result State Shape

priority: P2.

status: complete.

objective:

Inspect memory and anti-memory promotion result models after TSQ-05A and decide
whether they need discriminated unions, narrower value objects, or no change.

source:

TSQ-05 decision table. `Memory promotion result` was deferred behind reflection
candidate writer result; TSQ-05A is now complete.

assumptions:

- current MemoryReviewGate and AntiMemoryReviewGate runtime checks may already
  prevent invalid promotion behavior;
- this slice should decide from live source and tests before changing types;
- no raw MemoryRecord write path should be exposed while inspecting promotion
  result shapes.

source_decisions:

source_id: `packages/harness/src/memory/memoryReviewGate.ts` and
`packages/harness/src/memory/antiMemoryReviewGate.ts`.
trust_tier: high live source.
mechanism: review gates validate candidate status, source/evidence requirements,
reviewer, and evidence review refs before calling reviewed repository promotion
ports. Failure is represented by thrown errors before write; success returns the
candidate, created final record, and reviewed source claims.
krn_implication: promotion gate result does not need a ready/blocked
discriminated union like `WriteReflectionCandidatesResult`; the gate is a
success-only operation with exception-based blocking.
decision: reject a promotion-result discriminated union for now.
does_not_prove: all memory promotion modeling is perfect or that candidate
statuses are narrow enough in returned result types.
consumer: TSQ-05B decision and TSQ-05C follow-up.
falsifier: a caller needs to represent blocked promotion without throwing, or a
future gate starts returning non-exception blocked state.

source_id: `packages/harness/src/repositories/memoryRepository.ts` and
`packages/db/src/repositories/DrizzleMemoryRepository.ts`.
trust_tier: high live source.
mechanism: repository ports `promoteReviewedMemoryCandidate` and
`promoteReviewedAntiMemoryCandidate` return final records, while DB adapter
status guards reject non-promotable candidates and update candidate status to
`accepted`.
krn_implication: repository-level promotion result is final-record oriented; a
new union would add shape without removing an actual impossible state.
decision: defer repository result reshaping; keep final-record returns.
does_not_prove: public gate result candidate status is precise.
consumer: memory repository decision and TSQ-05C.
falsifier: repository callers need both candidate status transition data and
final record in one typed result.

source_id: `packages/core/src/memory.ts`.
trust_tier: high live source.
mechanism: `MemoryCandidate.status` and `AntiMemoryCandidate.status` are broad
workflow unions, but review gates only allow `proposed | candidate` before
promotion.
krn_implication: returned gate `candidate` fields currently remain typed as the
full candidate union even after the gate has proved promotability.
decision: promote TSQ-05C to narrow gate result candidate status to a reviewable
candidate value object.
does_not_prove: DB persistence has a bug or promotion behavior is currently
wrong.
consumer: TSQ-05C implementation slice.
falsifier: a focused type/test slice proves the broad candidate status is needed
by downstream callers.

tradeoffs:

- implementing immediately could overfit a medium-risk finding;
- a decision slice first keeps the next code change small and reviewable if a
  real impossible state remains.

decision_table:

| Candidate | Live shape | Impossible state risk | Decision |
| --- | --- | --- | --- |
| Gate blocked/ready result | No blocked result object; validation throws before write, success returns final record + candidate + reviewed claims | Low; blocked state is not a returned domain value today | No discriminated union |
| Repository promotion result | `promoteReviewedMemoryCandidate` / `promoteReviewedAntiMemoryCandidate` return final records | Low; DB adapter guards status and final record is the consumer value | Keep final-record returns |
| Gate returned candidate status | Result candidate is `MemoryCandidate` / `AntiMemoryCandidate` with broad workflow status union | Medium; after gate validation, TypeScript still permits `accepted/rejected/applied/superseded` candidate status in the success result | Promote TSQ-05C narrower candidate status |

simplest acceptable implementation:

- inspect memory/anti-memory review gate result types, candidate status checks,
  repository ports, and tests;
- produce a small decision table;
- promote one implementation slice only if live source proves a type-level
  impossible state still exists.

rules:

- do not create worker runtime, eval platform, dashboard, or audit scanner;
- do not loosen Memory Core write authority;
- do not change DB schema or migrations in the decision slice;
- do not rewrite every lifecycle model.

likely files:

- `packages/harness/src/memory/memoryReviewGate.ts`;
- `packages/harness/src/memory/antiMemoryReviewGate.ts`;
- `packages/harness/src/repositories/memoryRepository.ts`;
- relevant memory review gate tests;
- `GOAL.md`;
- `PLAN.md`.

files forbidden to touch:

- DB schema/migrations;
- CLI command behavior;
- worker runtime behavior;
- Promptfoo/eval surfaces.

non-goals:

- no MemoryRecord mutation path changes;
- no new public repository write ports;
- no broad memory model rewrite.

success criteria:

- decision table states whether promotion result shape is already safe,
  should become a discriminated union, or needs a narrower candidate-status
  value object;
- active queue advances to a bounded follow-up or records no-op with evidence;
- typecheck passes.

outcome:

- no promotion result discriminated union is promoted;
- repository final-record return shape remains the accepted surface;
- TSQ-05C is promoted to narrow successful gate result candidate status for
  memory and anti-memory candidates.

verification:

```sh
pnpm --filter @krn/harness test -- memoryReviewGate antiMemoryReviewGate
pnpm typecheck
git diff --check
```

command evidence:

- `pnpm --filter @krn/harness test -- memoryReviewGate antiMemoryReviewGate`:
  passed. This proves the focused memory and anti-memory review gate tests still
  pass after the docs decision.
- `pnpm typecheck`: passed across workspace packages. This proves the docs-only
  decision did not break current TypeScript compilation.
- `git diff --check`: passed. This proves the diff has no whitespace errors.

rollback:

```sh
git revert <TSQ-05B commit>
```

commit:

```sh
git commit -m "docs(ts): decide memory promotion result shape"
```

### TSQ-05C: Narrow Memory Review Gate Result Candidate Status

priority: P2.

status: complete.

objective:

Narrow successful MemoryReviewGate and AntiMemoryReviewGate result candidate
types so callers know the gate returned a reviewable candidate status, not the
full candidate lifecycle union.

source:

TSQ-05B decision table.

assumptions:

- gate behavior remains success-only with thrown blocking errors;
- repository promotion ports still return final records;
- only the gate result candidate type needs narrowing, not core candidate
  lifecycle definitions.

tradeoffs:

- adding reviewable candidate aliases is more precise than a promotion-result
  union, but it still adds public exported types;
- changing core candidate status unions would be broader and unnecessary for
  this slice.

simplest acceptable implementation:

- export `ReviewableMemoryCandidate` and `ReviewableAntiMemoryCandidate` as
  narrowed candidate value types in the gate modules or a local shared memory
  type if duplication becomes meaningful;
- update `PromoteMemoryCandidateThroughGateResult.candidate` and
  `PromoteAntiMemoryCandidateThroughGateResult.candidate`;
- add focused type/runtime assertions proving returned candidates are narrowed
  after `result.candidate.status` checks.

rules:

- keep promotion behavior unchanged;
- do not change DB schema/migrations;
- do not expose raw MemoryRecord write ports;
- do not rewrite core `MemoryCandidateStatus` globally.

likely files:

- `packages/harness/src/memory/memoryReviewGate.ts`;
- `packages/harness/src/memory/antiMemoryReviewGate.ts`;
- `packages/harness/src/memory/memoryReviewGate.test.ts`;
- `packages/harness/src/memory/antiMemoryReviewGate.test.ts`;
- maybe `PLAN.md` / `GOAL.md`.

files forbidden to touch:

- DB schema/migrations;
- CLI command behavior unless type fallout requires import-only fixes;
- worker runtime behavior;
- Promptfoo/eval surfaces.

non-goals:

- no new promotion result union;
- no repository return shape change;
- no Memory Core mutation behavior change.

success criteria:

- successful gate result candidate status is typed as `proposed | candidate`;
- focused tests/typecheck prove callers do not see the full candidate status
  union after successful gate promotion;
- behavior and focused review gate tests still pass.

outcome:

- `ReviewableMemoryCandidateStatus` / `ReviewableMemoryCandidate` and
  `ReviewableAntiMemoryCandidateStatus` / `ReviewableAntiMemoryCandidate` are
  exported from the review gate modules;
- successful gate result `candidate` fields are narrowed to reviewable
  `proposed | candidate` status;
- existing gate behavior remains success-only with thrown blocking errors;
- focused tests include compile-time helpers proving result candidate status is
  not the full candidate workflow union.

verification:

```sh
pnpm --filter @krn/harness test -- memoryReviewGate antiMemoryReviewGate
pnpm typecheck
pnpm test
git diff --check
```

command evidence:

- first `pnpm typecheck`: failed because assertion functions written as const
  arrow values did not narrow the call target. This proved the initial
  implementation shape was not valid under the repo TypeScript settings.
- `pnpm --filter @krn/harness test -- memoryReviewGate antiMemoryReviewGate`:
  passed after converting assertions to function declarations. This proves
  focused memory and anti-memory review gate behavior still passes.
- final `pnpm typecheck`: passed across workspace packages. This proves the
  narrowed public gate result types compile across current callers.
- `pnpm test`: passed across core/schema/harness/workers/codex-adapter/db/cli.
  This proves the final workspace test suite passes after the type narrowing.
- `git diff --check`: passed. This proves the diff has no whitespace errors.

rollback:

```sh
git revert <TSQ-05C commit>
```

commit:

```sh
git commit -m "refactor(memory): narrow review gate candidate status"
```

### TSQ-05D: Decide EvidenceBundle Status Shape

priority: P2.

objective:

Inspect `EvidenceBundle.status` and decide whether it should become a
discriminated lifecycle shape or remain a single object shape with explicit
evidence assessment helpers.

source:

TSQ-05 decision table. `EvidenceBundle.status` was deferred unless status starts
governing persistence or review workflow fields.

assumptions:

- existing EvidenceBundle command provenance and assessment helpers may already
  carry the meaningful lifecycle constraints;
- this is a decision slice before any model rewrite;
- evidence status should not become a broad quality subsystem or audit layer.

tradeoffs:

- converting `EvidenceBundle` too early could create churn around persistence
  and schema compatibility;
- leaving status broad is acceptable only if helper assessments make proof
  strength explicit and no status-specific required fields are implied.

simplest acceptable implementation:

- inspect core EvidenceBundle model, schema parser, CLI capture output, DB
  mappers/repository use, and tests;
- produce a decision table for `draft` / `captured` / `verified` / `rejected`;
- promote one implementation slice only if live source shows status-specific
  required fields are currently expressible incorrectly.

rules:

- do not add audit scanner, quality subsystem, dashboard, worker runtime, or
  hidden command runner;
- do not change DB schema/migrations in the decision slice;
- do not rewrite evidence command provenance again unless live source proves a
  status-specific gap.

likely files:

- `packages/core/src/evidenceBundle.ts`;
- `packages/schema/src/evidenceBundle.ts`;
- `packages/cli/src/runEvidenceCaptureCommand.ts`;
- DB evidence bundle mapper/repository tests if needed for source inspection;
- `GOAL.md`;
- `PLAN.md`.

files forbidden to touch:

- DB schema/migrations;
- worker runtime behavior;
- Promptfoo/eval surfaces;
- unrelated CLI commands.

non-goals:

- no EvidenceBundle rewrite in the decision slice;
- no command runner;
- no quality engine or audit layer.

success criteria:

- decision table states whether `EvidenceBundle.status` needs a discriminated
  union, narrower value object, or no change;
- active queue advances to a bounded follow-up or records no-op with evidence;
- typecheck passes.

verification:

```sh
pnpm --filter @krn/core test -- evidenceBundle
pnpm --filter @krn/schema test -- evidenceBundle
pnpm typecheck
git diff --check
```

rollback:

```sh
git revert <TSQ-05D commit>
```

commit:

```sh
git commit -m "docs(ts): decide evidence bundle status shape"
```

status: complete.

source_decision:

```yaml
source_id: packages/core/src/evidenceBundle.ts
trust_tier: high
mechanism: EvidenceBundle.status is a four-value ledger status, while command
  proof strength is normalized through EvidenceCommand provenance/kind plus
  assessEvidenceBundleCompleteness and scoreEvidenceBundleReviewRisk helpers.
krn_implication: proof semantics already live in command provenance and
  assessment helpers; promoting the whole bundle to a discriminated lifecycle
  shape now would create compatibility churn without preventing a live bug.
decision: defer EvidenceBundle lifecycle discrimination and keep the single
  object shape.
does_not_prove: that a "verified" EvidenceBundle value by itself proves human
  review, production readiness, or memory quality.
consumer: PLAN.md TSQ-05D decision and next lifecycle follow-up selection.
falsifier: a writer starts setting "verified" or "rejected" while relying on
  status-specific fields such as verifiedBy, rejectedReason, reviewAssessmentId,
  or command proof guarantees that the current object shape cannot express.
```

decision_table:

| status | live meaning | required status-specific fields? | decision |
| --- | --- | --- | --- |
| `draft` | fixture or not-yet-captured ledger state | no | keep as ledger status |
| `captured` | CLI/DB capture record; command proof comes from command rows | no | keep as ledger status |
| `verified` | historical/test label; not used as proof by capture path | no | do not treat as proof without future writer contract |
| `rejected` | available lifecycle value; no EvidenceBundle-specific writer currently requires rejection fields | no | defer until a real rejection writer appears |

outcome:

- no TypeScript model rewrite in this slice;
- no DB schema or migration change;
- no audit scanner, command runner, quality layer, or evidence status authority
  was added;
- next bounded lifecycle decision is activation decision shape.

command_evidence:

- `pnpm --filter @krn/core test -- evidenceBundle`: passed, 10 test files and
  50 tests. This proves the current core EvidenceBundle model, command
  normalization, completeness, rollback, and review-risk helpers still pass; it
  does not prove memory quality or production readiness.
- `pnpm --filter @krn/schema test -- evidenceBundle`: passed, 3 test files and
  24 tests. This proves the schema package test command named by the slice
  passes; it does not prove there is an EvidenceBundle status schema requiring
  a lifecycle rewrite.
- `pnpm typecheck`: passed across the current workspace. This proves the
  docs-only decision did not break current TypeScript compilation.
- `git diff --check`: passed. This proves the diff has no whitespace errors.

### TSQ-05E: Decide Activation Decision Shape

priority: P2.

objective:

Inspect activation decision/status surfaces and decide whether they should
become discriminated decision records or remain represented as ranked candidates
with explicit inclusions, exclusions, abstention, and persisted activation
decision rows.

source:

TSQ-05 decision table. Activation decisions were deferred until live misuse
appears.

assumptions:

- current activation code may already separate included context, excluded
  candidates, abstention, observation prefix gates, and persisted decision
  records clearly enough;
- this is a decision slice before any model rewrite;
- activation status cleanup must not become a broad retrieval or quality
  subsystem.

tradeoffs:

- discriminating every activation candidate too early could churn ranking,
  context assembly, and repository persistence at once;
- leaving the model as-is is acceptable only if excluded candidates cannot be
  mistaken for selected context and abstention carries explicit reasons.

simplest acceptable implementation:

- inspect `packages/core/src/activation.ts`,
  `packages/core/src/contextAssembly.ts`,
  `packages/harness/src/activation/types.ts`,
  `packages/harness/src/activation/assembleContext.ts`, and repository
  activation decision types;
- produce a decision table for included, excluded, abstained, deferred,
  conflict, and stale decisions;
- promote an implementation slice only if live source shows ambiguous decision
  shape or a field that is valid only for one status.

rules:

- do not change retrieval algorithms in the decision slice;
- do not add dashboard, quality scanner, audit layer, Promptfoo authority, or
  worker runtime;
- do not rewrite activation persistence unless live source proves a status
  shape bug.

likely files:

- `packages/core/src/activation.ts`;
- `packages/core/src/contextAssembly.ts`;
- `packages/harness/src/activation/types.ts`;
- `packages/harness/src/activation/assembleContext.ts`;
- `packages/harness/src/repositories/types.ts`;
- activation tests if needed for source inspection;
- `GOAL.md`;
- `PLAN.md`.

files forbidden to touch:

- DB schema/migrations;
- retrieval ranking algorithm behavior;
- Promptfoo/eval surfaces;
- unrelated CLI commands.

non-goals:

- no activation rewrite in the decision slice;
- no new quality subsystem;
- no dashboard or worker runtime.

success criteria:

- decision table states whether activation decision shapes need
  discrimination, narrower value objects, or no change;
- active queue advances to a bounded follow-up or records no-op with evidence;
- typecheck passes.

verification:

```sh
pnpm --filter @krn/core test -- activation contextAssembly
pnpm --filter @krn/harness test -- activation
pnpm typecheck
git diff --check
```

rollback:

```sh
git revert <TSQ-05E commit>
```

commit:

```sh
git commit -m "docs(ts): decide activation decision shape"
```

status: complete.

source_decision:

```yaml
source_id: packages/harness/src/activation/assembleContext.ts
trust_tier: high
mechanism: Context activation already materializes selected items as
  ContextAssembly.inclusions, rejected candidates as ContextAssembly.exclusions,
  and no-context outcomes as activationAbstention with explicit reasons.
krn_implication: the context assembly model does not need a broad
  discriminated-union rewrite to prevent excluded context from being mistaken
  for selected context.
decision: adopt current context assembly shape and focus the follow-up on
  persistence input narrowing.
does_not_prove: activation ranking quality, retrieval quality, or that persisted
  activation decision inputs are already type-safe.
consumer: PLAN.md TSQ-05E decision and TSQ-05E-A follow-up.
falsifier: an excluded candidate can enter ContextAssembly.inclusions without
  losing its exclusion reason, or an abstained assembly can omit
  activationAbstention.
```

```yaml
source_id: packages/harness/src/repositories/retrievalRepository.ts
trust_tier: high
mechanism: RecordActivationDecisionInput has one object shape with
  decision-specific fields such as expectedUse, rawRecall, antiMemoryRecordId,
  exclusionCategory, sourceSupportState, and activationAbstentionReason all
  optional regardless of decision status.
krn_implication: persistence is the real type-safety gap; status-specific
  decision fields should be represented as a discriminated union at the
  repository input boundary.
decision: promote TSQ-05E-A to narrow RecordActivationDecisionInput without DB
  schema or ranking behavior changes.
does_not_prove: that the database enum or historical rows are wrong.
consumer: TSQ-05E-A implementation slice.
falsifier: live callers already require impossible decision/input pairings at
  compile time without optional metadata conventions.
```

decision_table:

| decision | live meaning | required status-specific fields? | decision |
| --- | --- | --- | --- |
| `included` | selected subject entered `ContextAssembly.inclusions` | yes: context link, expected use/impact, optional raw-recall/source support | narrow repository input |
| `excluded` | subject was rejected from context with an exclusion reason | yes: exclusion category/reason should be explicit | narrow repository input |
| `conflict` | exclusion caused by conflict, currently anti-memory block | yes: conflict reason/anti-memory linkage should not be loose metadata | narrow repository input |
| `stale` | stale candidate exclusion | yes: stale should be an exclusion-shaped decision | narrow repository input |
| `deferred` | enum-supported future subject decision | unclear current writer | keep only with explicit defer reason if retained |
| `abstained` | run-level no-context outcome | not a subject-level decision in current writer | keep as retrieval-run completion state, not normal subject decision input |

outcome:

- no activation ranking or context assembly rewrite in this slice;
- no DB schema or migration change;
- no dashboard, worker, eval, audit, or quality layer was added;
- next bounded implementation slice is repository input narrowing.

command_evidence:

- `pnpm --filter @krn/core test -- activation contextAssembly`: passed, 10 test
  files and 50 tests. This proves current core activation/context contracts
  still compile and pass their test suite under the focused command; it does
  not prove retrieval ranking quality.
- `pnpm --filter @krn/harness test -- activation`: passed, 20 test files and
  79 tests. This proves focused harness activation behavior, including context
  exclusions and activation trace decision tests, still passes; it does not
  prove the repository input boundary is already narrow enough.
- `pnpm typecheck`: passed across the current workspace. This proves the
  docs-only decision and next-slice plan did not break TypeScript compilation.
- `git diff --check`: passed. This proves the diff has no whitespace errors.

### TSQ-05E-A: Discriminate Activation Decision Persistence Input

priority: P2.

objective:

Replace the single optional `RecordActivationDecisionInput` object shape with a
decision-discriminated input boundary so included, excluded, conflict, stale,
deferred, and abstention-related activation decisions cannot be mixed
incorrectly at compile time.

source:

TSQ-05E decision. Context assembly is explicit enough; persistence input is the
type-safety gap.

assumptions:

- DB schema can stay unchanged because existing columns/metadata can store the
  same persisted shape;
- callers should not need ranking behavior changes;
- `abstained` is currently a retrieval-run completion state, not a normal
  subject-level activation decision writer path.

tradeoffs:

- narrowing the repository input may require test fixture updates;
- removing `abstained` from normal record input may need a compatibility alias
  only if live callers use it;
- keeping DB enum values broader than write input is acceptable for historical
  rows and compatibility.

simplest acceptable implementation:

- define a discriminated union for `RecordActivationDecisionInput` in
  `packages/harness/src/repositories/retrievalRepository.ts`;
- keep `ActivationDecisionRecord["decision"]` unchanged for persisted read
  models;
- update `persistActivationTrace` and focused tests to satisfy the narrower
  input;
- keep persistence mapping behavior equivalent and avoid DB migrations.

rules:

- do not change retrieval ranking, context assembly selection, or DB schema;
- do not add quality scanner, audit layer, worker runtime, or dashboard;
- do not hide decision-specific fields in arbitrary metadata if a typed field
  already exists.

likely files:

- `packages/harness/src/repositories/retrievalRepository.ts`;
- `packages/harness/src/activation/activationEngine.ts`;
- `packages/harness/src/activation/activationTraceDecisions.test.ts`;
- `packages/harness/src/compiler/index.test.ts` if repository fake types need
  alignment;
- DB repository mapper tests only if compile-time narrowing exposes type drift;
- `GOAL.md`;
- `PLAN.md`.

files forbidden to touch:

- DB schema/migrations;
- retrieval ranking algorithms;
- context assembly selection behavior;
- Promptfoo/eval surfaces;
- unrelated CLI commands.

non-goals:

- no behavior change to activation ranking;
- no DB migration;
- no broad activation redesign.

success criteria:

- `RecordActivationDecisionInput` is a discriminated union or equivalent typed
  final-pattern boundary;
- included/excluded/conflict/stale/deferred inputs expose only the fields valid
  for that decision shape;
- abstention remains represented by retrieval run completion unless a live
  subject-level writer proves otherwise;
- focused activation trace tests and typecheck pass.

verification:

```sh
pnpm --filter @krn/harness test -- activationTraceDecisions
pnpm --filter @krn/harness test -- activation
pnpm typecheck
git diff --check
```

rollback:

```sh
git revert <TSQ-05E-A commit>
```

commit:

```sh
git commit -m "refactor(activation): discriminate decision persistence input"
```

status: complete.

implementation_notes:

- `RecordActivationDecisionInput` is now a decision-discriminated union at the
  retrieval repository input boundary.
- Included activation decisions require `contextAssemblyId`,
  `expectedDecisionImpact`, and `expectedUse`; raw recall and source-support
  state remain typed fields.
- Excluded, stale, and conflict decisions require explicit exclusion category;
  stale is its own exclusion-shaped decision.
- Conflict decisions require typed `antiMemoryRecordId` instead of relying on
  metadata conventions.
- `abstained` remains represented by retrieval run completion, not normal
  subject-level activation decision input.
- DB schema, migrations, retrieval ranking, and context assembly selection were
  not changed.

changed_files:

- `packages/harness/src/repositories/retrievalRepository.ts`;
- `packages/harness/src/activation/activationEngine.ts`;
- `packages/db/src/retrievalSubstrateSmoke.ts`;
- `GOAL.md`;
- `PLAN.md`.

command_evidence:

- `pnpm --filter @krn/harness test -- activationTraceDecisions`: passed, 20
  test files and 79 tests under the focused command. This proves the activation
  trace writer still records included/conflict decisions as expected; it does
  not prove retrieval ranking quality.
- `pnpm --filter @krn/harness typecheck`: passed. This proves the harness
  package accepts the new discriminated repository input boundary.
- `pnpm --filter @krn/db typecheck`: passed. This proves DB repository/smoke
  call-sites compile against the narrower input.
- `pnpm --filter @krn/harness test -- activation`: passed, 20 test files and
  79 tests. This proves focused harness activation behavior still passes after
  the input narrowing.
- `pnpm typecheck`: passed across the current workspace. This proves current
  packages compile with the new input union.
- `pnpm test`: passed across core, schema, harness, workers, codex-adapter, db,
  and cli. This proves the current workspace test suite passes; it does not
  prove Memory Brain quality or production readiness.
- `git diff --check`: passed. This proves the diff has no whitespace errors.

### CTX-01: Condense Lifecycle Hardening Context

priority: P1.

objective:

Condense active `GOAL.md` / `PLAN.md` state after TSQ-05D, TSQ-05E, and
TSQ-05E-A so completed lifecycle-detail blocks do not stay in the active
context window.

source:

Context hygiene rule in the Active Queue Snapshot: every few completed slices,
run a plan condensation pass.

assumptions:

- completed lifecycle decisions should remain discoverable as historical
  evidence;
- the active queue should keep only current objective, next unchecked item,
  compact checkpoint, command evidence pointers, risks, and rollback notes;
- this is docs-only unless live repo evidence shows a broken pointer.

tradeoffs:

- over-condensing can hide useful rollback/evidence details;
- under-condensing keeps finished work in active context and wastes future
  context budget.

simplest acceptable implementation:

- collapse TSQ-05D/E/E-A active details into checkpoint bullets and command
  evidence pointers;
- keep the completed detailed sections as historical ledger only if they no
  longer sit in the active window;
- update `GOAL.md` to the next concrete unchecked slice after condensation.

rules:

- do not edit TypeScript source in the condensation slice;
- do not delete evidence;
- do not create a new plan file;
- do not revive repo-reset audit or anti-slop layers.

likely files:

- `GOAL.md`;
- `PLAN.md`.

files forbidden to touch:

- TypeScript source;
- DB schema/migrations;
- CLI command surfaces;
- old raw materials.

non-goals:

- no behavior change;
- no broad cleanup;
- no new architecture layer.

success criteria:

- active snapshot is shorter and names one next unchecked runtime/docs slice;
- completed TSQ-05D/E/E-A details are compacted into checkpoint evidence;
- root `GOAL.md` stays compact;
- typecheck and diff hygiene pass.

verification:

```sh
pnpm typecheck
git diff --check
```

rollback:

```sh
git revert <CTX-01 commit>
```

commit:

```sh
git commit -m "docs(plan): condense lifecycle hardening context"
```

status: complete.

outcome:

- Active Queue Snapshot now points to `TSQ-06` and keeps TSQ-05D/E/E-A as a
  compact checkpoint with commit references instead of active reading context.
- `GOAL.md` stays compact and points to the next unchecked slice.
- The Progress checklist now marks TSQ-05D, TSQ-05E, and TSQ-05E-A complete,
  records CTX-01, and names TSQ-06 as the next typed lifecycle decision.
- Historical TSQ-05D/E/E-A details remain in the ledger for rollback/evidence,
  but future context selectors do not require rereading them.

command_evidence:

- `pnpm typecheck`: passed across the current workspace. This proves the
  docs-only condensation and next-slice plan did not break TypeScript
  compilation; it does not prove EvalCandidate proposal status quality.
- `git diff --check`: passed. This proves the diff has no whitespace errors.

### TSQ-06: Decide EvalCandidate Proposal Status Shape

priority: P2.

objective:

Inspect current `EvalCandidate` proposal carriers and decide whether the
proposal-only paths need a narrower status shape than the broad core
`EvalCandidateStatus`.

source:

ADR-0016 keeps EvalCandidate proposal-only for the current kernel: no standalone
eval candidate table, CLI, review gate, worker runtime, Promptfoo authority, or
eval platform exists.

assumptions:

- `FeedbackDelta.evalCandidates` and `ReflectionRecord.output.evalCandidates`
  are current proposal carriers;
- broad `EvalCandidateStatus = "candidate" | "accepted" | "rejected" |
  "promoted"` may be appropriate only for future standalone lifecycle, not for
  proposal-only storage;
- this is a decision slice before any model rewrite.

tradeoffs:

- narrowing proposal carriers could improve type truth but may require mapping
  compatibility for stored JSON rows;
- leaving the broad status is acceptable only if current writers cannot imply
  accepted/promoted eval truth without a governed lifecycle.

simplest acceptable implementation:

- inspect `packages/core/src/eval.ts`,
  `packages/core/src/feedbackDelta.ts`,
  `packages/core/src/reflection/index.ts`,
  `packages/harness/src/reflection/reflectionCandidateWriter.ts`, and DB
  feedback/reflection mappers;
- produce a decision table for candidate, accepted, rejected, and promoted in
  proposal-only carriers;
- promote one implementation slice only if live source shows current proposal
  paths can express final eval authority incorrectly.

rules:

- do not add an `eval_candidates` table;
- do not add eval CLI, review gate, worker runtime, Promptfoo authority,
  dashboard, or eval platform;
- do not change DB schema/migrations in the decision slice;
- do not use Promptfoo smoke as KRN behavior proof.

likely files:

- `packages/core/src/eval.ts`;
- `packages/core/src/feedbackDelta.ts`;
- `packages/core/src/reflection/index.ts`;
- `packages/harness/src/reflection/reflectionCandidateWriter.ts`;
- DB feedback/reflection mappers if needed for source inspection;
- `GOAL.md`;
- `PLAN.md`.

files forbidden to touch:

- DB schema/migrations;
- CLI command surfaces;
- worker runtime behavior;
- Promptfoo/eval platform surfaces.

non-goals:

- no standalone eval candidate lifecycle;
- no eval platform;
- no behavior gate rewrite;
- no Promptfoo authority change.

success criteria:

- decision table states whether proposal-only eval candidates need a narrower
  type or no change;
- active queue advances to a bounded follow-up or records no-op with evidence;
- typecheck passes.

verification:

```sh
pnpm --filter @krn/core test -- eval feedbackDelta reflection
pnpm typecheck
git diff --check
```

rollback:

```sh
git revert <TSQ-06 commit>
```

commit:

```sh
git commit -m "docs(ts): decide eval candidate proposal status shape"
```

status: complete.

source_decisions:

```yaml
source_id: docs/decisions/ADR-0016-eval-candidates-remain-proposal-only.md
trust_tier: high
mechanism: ADR-0016 accepts FeedbackDelta and ReflectionRecord output as current
  eval proposal carriers while rejecting standalone eval candidate table, CLI,
  review gate, worker promotion, Promptfoo authority, dashboard, and eval
  platform.
krn_implication: current proposal carriers must not imply accepted, rejected, or
  promoted eval lifecycle truth.
decision: adopt and narrow current proposal carriers rather than creating a new
  eval subsystem.
does_not_prove: standalone eval candidate storage will never be needed.
consumer: TSQ-06 decision and TSQ-06A implementation slice.
falsifier: operators need independent eval candidate review, dedupe, promotion,
  scheduling, activation, or execution outside FeedbackDelta/ReflectionRecord
  lineage.
```

```yaml
source_id: packages/core/src/reflection/index.ts
trust_tier: high
mechanism: ReflectionEvalCandidateProposal omits EvalCandidate.status and
  carries proposal evidence; reflection candidate writer later materializes
  EvalCandidate output with status "candidate".
krn_implication: reflection proposal input is already candidate-only and does
  not need a broad status rewrite.
decision: keep reflection proposal input shape.
does_not_prove: FeedbackDelta proposal storage is equally narrow.
consumer: TSQ-06 decision table.
falsifier: reflection output starts accepting EvalCandidate.status from
  generated proposals.
```

```yaml
source_id: packages/core/src/feedbackDelta.ts
trust_tier: high
mechanism: FeedbackDelta.evalCandidates is typed as EvalCandidate[], whose
  status union includes candidate, accepted, rejected, and promoted.
krn_implication: the current feedback proposal carrier can represent final eval
  lifecycle states even though ADR-0016 says no governed standalone lifecycle
  exists.
decision: promote TSQ-06A to introduce a proposal-only EvalCandidate carrier for
  FeedbackDelta and related readback.
does_not_prove: existing persisted JSON rows contain invalid statuses.
consumer: TSQ-06A implementation slice.
falsifier: FeedbackDelta.evalCandidates can no longer express accepted,
  rejected, or promoted without a standalone lifecycle.
```

decision_table:

| status | proposal-only meaning today | current carrier risk | decision |
| --- | --- | --- | --- |
| `candidate` | valid proposal state in FeedbackDelta/reflection lineage | safe | keep |
| `accepted` | future standalone review state, not current proposal truth | can be represented in FeedbackDelta today | remove from proposal carrier |
| `rejected` | future standalone review state, not current proposal truth | can be represented in FeedbackDelta today | remove from proposal carrier |
| `promoted` | future standalone lifecycle state, not current proposal truth | can be represented in FeedbackDelta today | remove from proposal carrier |

outcome:

- no standalone eval candidate storage, CLI, review gate, worker runtime,
  Promptfoo authority, dashboard, or eval platform was added;
- reflection proposal input remains acceptable because it has no status field;
- `FeedbackDelta.evalCandidates` and DB feedback readback need a proposal-only
  carrier in TSQ-06A.

command_evidence:

- `pnpm --filter @krn/core test -- eval feedbackDelta reflection`: passed, 10
  files / 50 tests. This proves the current core eval, feedback delta, and
  reflection behavior still match the decision slice; it does not prove TSQ-06A
  implementation is complete.
- `pnpm typecheck`: passed across the workspace. This proves the docs-only
  decision did not introduce a type failure; it does not prove runtime DB
  behavior.
- `git diff --check`: passed. This proves whitespace hygiene for the current
  diff.

### TSQ-06A: Narrow EvalCandidate Proposal Carriers

priority: P2.

objective:

Introduce a proposal-only eval candidate carrier so FeedbackDelta and reflection
writer proposal outputs cannot express accepted, rejected, or promoted eval
truth before a standalone eval lifecycle exists.

source:

TSQ-06 decision and ADR-0016.

assumptions:

- `EvalCandidate` may remain the future standalone lifecycle type;
- current FeedbackDelta/reflection carriers should expose only `status:
  "candidate"`;
- DB schema can stay unchanged because JSONB already stores proposal arrays.

tradeoffs:

- persisted JSON readback may need to filter or normalize non-candidate statuses
  to avoid importing final lifecycle truth;
- keeping `EvalCandidate` broad preserves future standalone lifecycle language
  but requires a separate proposal type for current carriers.

simplest acceptable implementation:

- add a proposal-only eval candidate type in `packages/core/src/eval.ts`;
- change `FeedbackDelta.evalCandidates` and reflection writer ready output to
  use the proposal-only type where appropriate;
- update DB feedback mapper readback to only preserve candidate-status proposal
  rows, or normalize missing/legacy status to candidate only when safe;
- update focused tests.

rules:

- do not add `eval_candidates` table;
- do not add eval CLI, review gate, worker runtime, Promptfoo authority,
  dashboard, or eval platform;
- do not change DB schema/migrations;
- do not treat Promptfoo smoke as behavior proof.

likely files:

- `packages/core/src/eval.ts`;
- `packages/core/src/feedbackDelta.ts`;
- `packages/harness/src/reflection/reflectionCandidateWriter.ts`;
- `packages/db/src/repositories/mappers.ts`;
- focused core/harness/db tests;
- `GOAL.md`;
- `PLAN.md`.

files forbidden to touch:

- DB schema/migrations;
- CLI command surfaces;
- worker runtime behavior;
- Promptfoo/eval platform surfaces.

non-goals:

- no standalone eval lifecycle;
- no eval promotion/review behavior;
- no dashboard or eval platform;
- no Promptfoo authority changes.

success criteria:

- FeedbackDelta eval proposal carrier cannot compile with accepted, rejected, or
  promoted status;
- reflection writer still emits proposal-only eval candidates;
- DB feedback readback does not import final eval lifecycle truth into
  proposal-only carriers;
- focused tests and typecheck pass.

verification:

```sh
pnpm --filter @krn/core test -- eval feedbackDelta reflection
pnpm --filter @krn/harness test -- reflectionCandidateWriter
pnpm --filter @krn/db test -- mappers
pnpm typecheck
git diff --check
```

rollback:

```sh
git revert <TSQ-06A commit>
```

commit:

```sh
git commit -m "refactor(eval): narrow proposal candidate status"
```

status: complete.

outcome:

- added `EvalCandidateProposal` as the current proposal-only eval carrier with
  `status: "candidate"`;
- kept broad `EvalCandidateStatus` / `EvalCandidate` for a future standalone
  lifecycle, without adding storage, CLI, review gate, worker runtime, Promptfoo
  authority, dashboard, or eval platform;
- changed `FeedbackDelta.evalCandidates` and reflection candidate writer ready
  output to `EvalCandidateProposal[]`;
- changed DB feedback readback so missing legacy eval proposal status is
  normalized to `candidate` only when required proposal fields are present, and
  accepted/rejected/promoted lifecycle rows are not imported into the proposal
  carrier;
- added focused tests for proposal-only status typing and DB readback filtering.

command_evidence:

- `pnpm --filter @krn/core test -- eval feedbackDelta reflection`: passed, 10
  files / 51 tests. This proves focused core eval, feedback, and reflection
  tests accept the proposal-only carrier; it does not prove standalone eval
  lifecycle behavior exists.
- `pnpm --filter @krn/harness test -- reflectionCandidateWriter`: passed, 20
  files / 79 tests. This proves the reflection writer still emits
  candidate-only eval proposals and preserves existing candidate writer
  behavior; it does not prove eval candidates are reviewed or promoted.
- `pnpm --filter @krn/db test -- mappers`: passed, 23 files / 73 tests. This
  proves DB mapper readback filters final eval lifecycle statuses from
  FeedbackDelta proposal carriers; it does not prove live Postgres runtime
  readiness.
- `pnpm typecheck`: passed across the workspace. This proves the public type
  boundary compiles with `FeedbackDelta.evalCandidates` narrowed to
  `EvalCandidateProposal[]`.
- `pnpm test`: passed across workspace packages. This proves current test suites
  still pass after the carrier narrowing; it does not prove Memory Brain
  readiness.
- `git diff --check`: passed. This proves whitespace hygiene for the current
  diff.

### CTX-02: Condense EvalCandidate Hardening Context

priority: P1.

objective:

Condense active `GOAL.md` / `PLAN.md` state after TSQ-06 and TSQ-06A so the
EvalCandidate decision and implementation do not stay in the active context
window, then select one next bounded hardening slice from live open risks.

source:

Context hygiene rule in the Active Queue Snapshot and TSQ-06A outcome.

assumptions:

- TSQ-06/06A evidence remains discoverable in commit history and historical
  ledger sections;
- the active queue should keep only current objective, next unchecked item,
  compact checkpoint, command evidence pointers, open risks, and rollback notes;
- there is no active unchecked implementation slice after TSQ-06A until CTX-02
  selects one.

tradeoffs:

- over-condensing can hide useful rollback details;
- under-condensing keeps finished EvalCandidate detail in active context and
  wastes future context budget.

simplest acceptable implementation:

- collapse TSQ-06/06A active detail into checkpoint bullets and command evidence
  pointers;
- update `GOAL.md` to exactly one next unchecked hardening slice;
- choose the next slice from remaining live risks without rereading raw
  materials or old reset audit docs.

rules:

- do not edit TypeScript source in CTX-02;
- do not delete evidence;
- do not create a new plan file;
- do not revive repo-reset audit or anti-slop layers;
- do not choose a broad cleanup goal.

likely files:

- `GOAL.md`;
- `PLAN.md`.

files forbidden to touch:

- TypeScript source;
- DB schema/migrations;
- CLI command surfaces;
- old raw materials.

non-goals:

- no behavior change;
- no broad cleanup;
- no new architecture layer;
- no eval platform or worker runtime.

success criteria:

- active snapshot is shorter and no longer carries TSQ-06/06A detail as active
  reading context;
- `GOAL.md` stays compact;
- one next concrete unchecked slice is named;
- typecheck and diff hygiene pass.

verification:

```sh
pnpm typecheck
git diff --check
```

rollback:

```sh
git revert <CTX-02 commit>
```

commit:

```sh
git commit -m "docs(plan): condense eval candidate hardening context"
```

status: complete.

outcome:

- active snapshot no longer carries TSQ-06/TSQ-06A as active reading context;
- EvalCandidate hardening is represented by compact checkpoint and commit
  pointers: `3501bd0` and `349c768`;
- next bounded slice is TSQ-07, focused on the remaining
  `EvidenceBundle.status` authority risk;
- no TypeScript source, DB schema, CLI surface, worker runtime, eval platform,
  dashboard, or audit/anti-slop layer was changed.

selection_notes:

- `rg` found current evidence bundle creation paths using `status: "captured"`
  in DB smokes and no broad source use of `verified` / `rejected` as proof
  authority;
- `EvidenceBundle.status` remains a live type-safety risk because the enum
  still includes `verified` / `rejected` while completeness/review helpers carry
  the real proof semantics;
- activation persistence input has already been narrowed; its broader DB enum
  read model is retained for historical rows and is lower priority than the
  remaining EvidenceBundle authority boundary.

command_evidence:

- `pnpm typecheck`: passed across the workspace. This proves the docs-only
  condensation and next-slice selection did not break TypeScript compilation;
  it does not prove the EvidenceBundle status boundary decision is complete.
- `git diff --check`: passed. This proves whitespace hygiene for the current
  diff.

### TSQ-07: Decide EvidenceBundle Status Authority Boundary

status: complete.

compact_ledger:

- commit: `5c257a1 refactor(evidence): narrow bundle write status`.
- decision: `EvidenceBundle.status` remains broad persisted/read-model
  vocabulary, but repository write input is narrowed to `draft | captured`.
- mechanism: `CreateEvidenceBundleInput.status` no longer accepts
  `verified | rejected`; proof semantics remain in command provenance,
  completeness, rollback, and review evidence.
- falsifier: a governed review flow needs to write `verified | rejected`
  directly to evidence bundles with explicit review provenance.
- verification: focused evidence/CLI/DB/harness tests, workspace typecheck,
  workspace tests, and `git diff --check` passed in the TSQ-07 commit.
- does_not_prove: DB runtime readiness or Memory Brain quality.
- rollback: `git revert 5c257a1`.

### TSQ-08: Decide Activation Decision Read-Model Boundary

status: complete.

compact_ledger:

- commit: `816312c refactor(schema): narrow activation decision input`.
- decision: activation decision persisted/read-model vocabulary remains broad
  for historical `abstained` rows, but public activation decision input is
  narrowed to `included | excluded | deferred | conflict | stale`.
- mechanism: `ActivationDecisionInputSchema` is now a strict discriminated
  union; `parseActivationDecisionInput({ decision: "abstained", ... })` fails.
- falsifier: current write API needs `abstained` decision rows instead of
  recording abstention on the retrieval run.
- verification: schema tests, focused activation/harness tests, DB mapper tests,
  workspace typecheck, workspace tests, and `git diff --check` passed in the
  TSQ-08 commit.
- does_not_prove: DB runtime readiness, activation ranking quality, or broader
  Memory Brain readiness.
- rollback: `git revert 816312c`.

### TSQ-09: Decide Retrieval Run Completion Status Boundary

status: complete.

compact_ledger:

- commit: `2f84e50 refactor(retrieval): narrow completion status input`.
- decision: retrieval run persisted/read-model status remains broad, but
  completion write input is narrowed to terminal statuses:
  `completed | abstained | failed`.
- mechanism: `CompleteRetrievalRunInput.status` now uses
  `CompleteRetrievalRunStatus`; `running` remains a start/current read-model
  state and cannot be supplied to completion input.
- falsifier: `CompleteRetrievalRunInput["status"]` accepts `running`.
- verification: harness typecheck, focused harness/db tests, workspace
  typecheck, workspace tests, and `git diff --check` passed in the TSQ-09
  commit.
- does_not_prove: DB runtime readiness, activation ranking quality, or broader
  Memory Brain readiness.
- rollback: `git revert 2f84e50`.

### CTX-03: Condense Lifecycle Boundary Hardening Context

priority: P1.

objective:

Compress completed TSQ-07, TSQ-08, and TSQ-09 detail into the active checkpoint
so the next implementation slice does not carry repeated lifecycle decision
detail in the active context window.

source:

User rule to remove completed-task context and keep `PLAN.md` as a compact
living execution map.

assumptions:

- completed TSQ-07/08/09 sections remain useful as ledger evidence;
- active workers need only checkpoint decisions, rollback commits, and next
  action;
- no source code change is needed for this slice.

tradeoffs:

- deleting too much ledger detail weakens auditability;
- leaving all detail in active context increases execution drag.

simplest acceptable implementation:

- condense active snapshot into a compact lifecycle-boundary checkpoint;
- keep detailed TSQ-07/08/09 sections as ledger or compress them only if their
  source decisions and command evidence remain discoverable;
- advance the active queue to the next bounded hardening candidate.

rules:

- do not delete evidence;
- do not create a new plan file;
- do not edit old raw materials;
- do not mix code changes into this docs condensation slice.

likely files:

- `PLAN.md`;
- `GOAL.md`.

files forbidden to touch:

- package source files;
- DB schema/migrations;
- old raw materials.

non-goals:

- no implementation;
- no audit subsystem;
- no dashboard/eval platform.

success criteria:

- active queue snapshot is shorter and points to one next unchecked slice;
- TSQ-07/08/09 proof remains discoverable;
- `GOAL.md` remains compact;
- docs-only verification passes.

verification:

```sh
git status --short --branch
git diff --check
```

rollback:

```sh
git revert <CTX-03 commit>
```

commit:

```sh
git commit -m "docs(plan): condense lifecycle boundary context"
```

status: complete.

outcome:

- TSQ-07, TSQ-08, and TSQ-09 detailed sections were reduced to compact
  ledger checkpoints with commit ids, decisions, falsifiers, verification, and
  rollback commands;
- detailed proof remains recoverable from commit history:
  `5c257a1`, `816312c`, and `2f84e50`;
- active snapshot now points at TSQ-10 instead of completed lifecycle
  boundary slices;
- no package source, DB schema, worker runtime, eval surface, dashboard, or
  audit/anti-slop layer was changed in this condensation slice.

selection_notes:

- `CreateContextAssemblyInput.status?: ContextAssembly["status"]` remains the
  next concrete lifecycle boundary candidate because `ContextAssemblyStatus`
  includes `assembled | abstained | stale | superseded`;
- `assembled` and `abstained` appear to be current create/write statuses, while
  `stale` and `superseded` may belong to read-model or historical lifecycle
  state;
- TSQ-10 must inspect live source before narrowing.

command_evidence:

- `git status --short --branch`: worktree contained only `GOAL.md` and
  `PLAN.md` changes for this docs-only slice.
- `git diff --check`: passed.

### TSQ-10: Decide ContextAssembly Create Status Boundary

priority: P2.

objective:

Inspect context assembly create/write status authority. Decide whether
`CreateContextAssemblyInput.status` should be narrower than
`ContextAssembly["status"]`, because create should likely accept only current
assembly outcomes instead of read-model lifecycle states like `stale` or
`superseded`.

source:

CTX-03 live-source scan found
`packages/harness/src/repositories/harnessRunRepository.ts` using
`status?: ContextAssembly["status"]` and
`packages/core/src/contextAssembly.ts` defining
`ContextAssemblyStatus = "assembled" | "abstained" | "stale" | "superseded"`.

assumptions:

- persisted/read-model context assembly status may remain broad;
- create input likely needs only `assembled | abstained`;
- stale/superseded may require a separate update/supersede path if ever used.

tradeoffs:

- broad create input preserves compatibility but can encode historical lifecycle
  states as newly created assemblies;
- narrowing create input should not require DB migration if persisted status
  remains broad.

simplest acceptable implementation:

- inspect `packages/harness/src/repositories/harnessRunRepository.ts`,
  `packages/db/src/repositories/DrizzleHarnessRunRepository.ts`,
  `packages/core/src/contextAssembly.ts`, and focused harness/db tests;
- decide whether create status should be `assembled | abstained`;
- implement a narrow exported input status type and type-level/runtime tests if
  live source confirms the broad write gap.

rules:

- do not change activation selection/ranking behavior;
- do not change DB schema/migrations;
- do not create lifecycle engine/update APIs;
- do not fold unrelated status boundaries into this slice.

likely files:

- `packages/harness/src/repositories/harnessRunRepository.ts`;
- `packages/harness/src/repositories/index.ts`;
- focused repository tests;
- `GOAL.md`;
- `PLAN.md`.

files forbidden to touch:

- DB schema/migrations;
- activation ranking/filtering algorithms;
- Promptfoo/eval surfaces;
- old raw materials.

non-goals:

- no DB migration;
- no activation rewrite;
- no dashboard/eval platform;
- no audit scanner revival.

success criteria:

- decision table states which context assembly statuses are create input,
  read-model/historical only, or require a separate update path;
- implementation exists if `CreateContextAssemblyInput` can currently encode an
  impossible create state;
- active queue advances to the next bounded slice or records no-op with
  evidence;
- typecheck passes.

verification:

```sh
pnpm --filter @krn/harness test -- repositories
pnpm --filter @krn/db test -- DrizzleHarnessRunRepository mappers
pnpm typecheck
git diff --check
```

rollback:

```sh
git revert <TSQ-10 commit>
```

commit:

```sh
git commit -m "refactor(context): narrow assembly create status input"
```

status: complete.

source_decisions:

1. source: `packages/core/src/contextAssembly.ts`
   mechanism: `ContextAssemblyStatus` mixed current assembly outcomes with
   historical/read-model lifecycle states.
   KRN implication: downstream write APIs could not distinguish what can be
   newly assembled from what can only describe an older/superseded context.
   decision: add `ContextAssemblyCurrentStatus = "assembled" | "abstained"` and
   keep `ContextAssemblyStatus` broad as current plus historical states.
   falsifier: current context assembly output needs `stale` or `superseded`.

2. source: `packages/harness/src/activation/assembleContext.ts`
   mechanism: runtime assembly already computes only `assembled` or
   `abstained`, but returned the broad `ContextAssembly` type.
   KRN implication: callers had to carry broad lifecycle states even when the
   source function had normalized current outcomes.
   decision: return `AssembledContextAssembly` with `ContextAssemblyCurrentStatus`.
   falsifier: `assembleContext` must produce historical lifecycle states.

3. source: `packages/harness/src/repositories/harnessRunRepository.ts`
   mechanism: `CreateContextAssemblyInput.status` previously referenced
   `ContextAssembly["status"]`.
   KRN implication: create/write boundary could compile with `stale` or
   `superseded`.
   decision: add `CreateContextAssemblyStatus = ContextAssemblyCurrentStatus`
   and use it for create input.
   falsifier: `CreateContextAssemblyInput["status"]` accepts
   `stale | superseded`.

decision_table:

| status | current assembly output | create/write input | read-model/historical | rule |
| --- | --- | --- | --- | --- |
| `assembled` | yes | yes | yes | normal selected context result. |
| `abstained` | yes | yes | yes | current no-context result. |
| `stale` | no | no | yes | lifecycle/read-model state, not create. |
| `superseded` | no | no | yes | lifecycle/read-model state, not create. |

implementation:

- added `contextAssemblyCurrentStatuses` and `ContextAssemblyCurrentStatus` in
  core;
- changed `ActivationResult.status` to use `ContextAssemblyCurrentStatus`;
- changed `assembleContext` to return `AssembledContextAssembly`;
- changed `CreateContextAssemblyInput.status` to `CreateContextAssemblyStatus`;
- added type/runtime coverage for current context assembly statuses and create
  input exclusion of `stale | superseded`;
- did not change DB schema, DB mapper, activation ranking, or context selection
  behavior.

command_evidence:

```sh
pnpm --filter @krn/core test -- contextAssembly
pnpm --filter @krn/core typecheck
pnpm --filter @krn/harness typecheck
pnpm --filter @krn/db typecheck
pnpm --filter @krn/harness test -- repositories activation
pnpm --filter @krn/db test -- DrizzleHarnessRunRepository mappers
pnpm typecheck
pnpm test
git diff --check
```

what_this_proves:

- current assembly status is normalized in core, not hidden by a cast;
- `assembleContext` and create/write input use current status vocabulary;
- existing focused and workspace checks pass with the narrowed boundary.

what_this_does_not_prove:

- DB runtime readiness; no live DB command was run for this slice;
- activation ranking quality;
- broader Memory Brain readiness.

### TSQ-11: Decide ReviewAssessment And FeedbackDelta Create Status Boundaries

priority: P2.

objective:

Inspect review and feedback create/write status authority. Decide whether
`CreateReviewAssessmentInput.status` and `CreateFeedbackDeltaInput.status`
should be narrower than their broad persisted/read-model status types.

source:

TSQ-10 live-source scan found
`packages/harness/src/repositories/harnessRunRepository.ts` still using
`status?: ReviewAssessment["status"]` and
`status?: FeedbackDelta["status"]` at create/write boundaries.

assumptions:

- persisted/read-model statuses may remain broad;
- review creation likely needs `pending | accepted | changes_requested | rejected`
  only if it is truly recording review outcome at creation;
- feedback delta creation likely needs proposal/current statuses only, not
  applied lifecycle state unless a governed apply path exists.

tradeoffs:

- narrowing too aggressively could fight current CLI review assessment flows;
- leaving statuses broad can encode post-review/application states as initial
  creation authority.

simplest acceptable implementation:

- inspect `packages/harness/src/repositories/harnessRunRepository.ts`,
  `packages/core/src/reviewAssessment.ts`,
  `packages/core/src/feedbackDelta.ts`,
  `packages/cli/src/runReviewAssessCommand.ts`,
  `packages/db/src/repositories/DrizzleHarnessRunRepository.ts`, and focused
  tests;
- decide whether one or both create inputs need named status subsets;
- implement only the proven boundary changes and type tests.

rules:

- do not change review outcome semantics without source evidence;
- do not change DB schema/migrations;
- do not create lifecycle engine/update APIs;
- do not fold memory/source candidate status work into this slice.

likely files:

- `packages/harness/src/repositories/harnessRunRepository.ts`;
- `packages/harness/src/repositories/index.ts`;
- focused repository/CLI tests;
- `GOAL.md`;
- `PLAN.md`.

files forbidden to touch:

- DB schema/migrations;
- memory/source candidate promotion paths;
- Promptfoo/eval surfaces;
- old raw materials.

non-goals:

- no DB migration;
- no review engine rewrite;
- no dashboard/eval platform;
- no audit scanner revival.

success criteria:

- decision table states which review/feedback statuses are create input,
  read-model/historical only, or require separate update/apply paths;
- implementation exists for every proven broad create/write gap;
- active queue advances to the next bounded slice or records no-op with
  evidence;
- typecheck passes.

verification:

```sh
pnpm --filter @krn/harness test -- repositories
pnpm --filter @krn/cli test -- runReviewAssessCommand
pnpm --filter @krn/db test -- DrizzleHarnessRunRepository mappers
pnpm typecheck
git diff --check
```

rollback:

```sh
git revert <TSQ-11 commit>
```

commit:

```sh
git commit -m "refactor(review): narrow create lifecycle statuses"
```

outcome:

- `CreateReviewAssessmentInput.status` intentionally remains broad. Live CLI
  evidence shows `krn review assess --status` creates the current review
  outcome, so `pending | accepted | changes_requested | rejected` are valid
  creation outcomes rather than later-only lifecycle states.
- `FeedbackDeltaCreateStatus = "candidate"` and
  `FeedbackDeltaLifecycleStatus = "accepted" | "rejected" | "applied"` now
  separate initial feedback delta creation from later review/application states.
- `CreateFeedbackDeltaInput.status` now accepts only
  `FeedbackDeltaCreateStatus`.
- `MemoryCandidateCreateStatus = "proposed" | "candidate"` and
  `MemoryCandidateLifecycleStatus =
  "accepted" | "rejected" | "applied" | "superseded"` now separate candidate
  creation from review/promotion lifecycle states.
- `CreateMemoryCandidateInput.status` and
  `CreateAntiMemoryCandidateInput.status` now accept only
  `MemoryCandidateCreateStatus`.
- `MemoryCandidateInputSchema` and `AntiMemoryCandidateInputSchema` now reject
  review lifecycle statuses at parse time.
- DB schema/mappers were unchanged.

command evidence:

```sh
pnpm --filter @krn/core test -- reviewFeedback
pnpm --filter @krn/core typecheck
pnpm --filter @krn/harness typecheck
pnpm --filter @krn/cli test -- runReviewAssessCommand
pnpm --filter @krn/harness test -- repositories
pnpm --filter @krn/db test -- DrizzleHarnessRunRepository mappers
pnpm --filter @krn/core test -- memory reviewFeedback
pnpm --filter @krn/schema test -- index
rtk proxy pnpm --filter @krn/core typecheck
rtk proxy pnpm --filter @krn/schema typecheck
rtk proxy pnpm --filter @krn/harness typecheck
rtk proxy pnpm --filter @krn/cli typecheck
rtk proxy pnpm --filter @krn/db typecheck
rtk proxy pnpm test
git diff --check
```

does_not_prove:

- These checks do not prove DB runtime readiness; no DB runtime command ran in
  this slice.
- They do not prove SourceClaim/SourceDecision create-status semantics; TSQ-12
  owns that decision.
- Plain `rtk pnpm typecheck` is not used as command evidence because the local
  `rtk` proxy treated the workspace typecheck as a raw `tsc` help invocation
  and returned code 1 while summarizing "No errors found"; package-level
  `rtk proxy pnpm --filter ... typecheck` commands are the valid TS evidence
  for this slice.

### TSQ-12: Decide SourceClaim And SourceDecision Create Status Boundaries

priority: P2.

objective:

Inspect source claim and source decision create/write status authority. Decide
whether `CreateSourceClaimInput.status` and `CreateSourceDecisionInput.status`
should stay as broad domain status types or gain named create-status subsets.

source:

TSQ-11 live-source scan found `packages/harness/src/repositories/sourceRepository.ts`
still using `status?: SourceClaim["status"]` and
`status: SourceDecision["status"]` at source create boundaries.

assumptions:

- `SourceDecisionStatus` may already be a creation decision vocabulary rather
  than a lifecycle state machine;
- `SourceClaimStatus` needs live-source inspection because `accepted`,
  `rejected`, and `deprecated` may represent imported/current source truth, not
  necessarily a later review transition.

tradeoffs:

- narrowing without evidence can block legitimate source imports or direct
  decision capture;
- leaving broad status types at create boundaries can let review/deprecation
  states masquerade as initial provenance if no create path owns them.

simplest acceptable implementation:

- inspect source domain types, source CLI flows, repository create paths, DB
  mapper defaults, and focused tests;
- introduce named create-status types only where live create paths prove a
  narrower authority boundary;
- otherwise record the no-op decision with evidence.

rules:

- do not normalize source statuses into memory candidate statuses;
- do not change DB schema/migrations;
- do not create a source review engine;
- do not fold context condensation into this slice.

likely files:

- `packages/core/src/source.ts`;
- `packages/harness/src/repositories/sourceRepository.ts`;
- `packages/db/src/repositories/DrizzleSourceRepository.ts`;
- source repository/schema tests if implementation is needed;
- `GOAL.md`;
- `PLAN.md`.

files forbidden to touch:

- memory candidate promotion paths;
- evidence command provenance;
- Promptfoo/eval surfaces;
- old raw materials.

non-goals:

- no DB migration;
- no source crawler/importer;
- no audit scanner revival.

success criteria:

- decision table states which source statuses are create input,
  read-model/historical only, or require separate update paths;
- implementation exists for every proven broad create/write gap;
- active queue advances to a condensation slice or another bounded lifecycle
  decision;
- typecheck passes.

verification:

```sh
pnpm --filter @krn/core test -- source
pnpm --filter @krn/db test -- DrizzleSourceRepository
pnpm typecheck
git diff --check
```

rollback:

```sh
git revert <TSQ-12 commit>
```

commit:

```sh
git commit -m "refactor(source): decide create status boundaries"
```

outcome:

- `SourceClaimCreateStatus = "proposed"` and
  `SourceClaimLifecycleStatus = "accepted" | "rejected" | "deprecated"` now
  separate initial source claim creation from review/deprecation states.
- `CreateSourceClaimInput.status` now accepts only
  `SourceClaimCreateStatus`.
- `SourceClaimInputSchema` now rejects reviewed/deprecated lifecycle statuses at
  parse time.
- Test fixtures that used memory-style `status: "candidate"` for SourceClaim
  override checks were normalized to `status: "proposed"`.
- `SourceDecisionStatus` remains unchanged. `adopt | reject | defer |
  lab_test` is the current decision vocabulary captured at creation, not a
  later lifecycle state; `adopt` and `reject` already require a source claim.
- DB schema/mappers were unchanged.

command evidence:

```sh
rtk proxy pnpm --filter @krn/core test -- source
rtk proxy pnpm --filter @krn/schema test -- index
rtk proxy pnpm --filter @krn/harness test -- repositories
rtk proxy pnpm --filter @krn/db test -- DrizzleSourceRepository
rtk proxy pnpm --filter @krn/core typecheck
rtk proxy pnpm --filter @krn/schema typecheck
rtk proxy pnpm --filter @krn/harness typecheck
rtk proxy pnpm --filter @krn/db typecheck
rtk proxy pnpm --filter @krn/cli typecheck
rtk proxy pnpm test
git diff --check
```

does_not_prove:

- These checks do not prove DB runtime readiness; no DB runtime command ran in
  this slice.
- They do not prove every source graph lifecycle transition exists; they only
  bound source claim creation and preserve existing source decision creation
  semantics.

### CTX-04: Condense Completed Lifecycle Boundary Context

priority: P2.

objective:

Condense active `PLAN.md` / `GOAL.md` state after TSQ-10, TSQ-11, and TSQ-12 so
completed lifecycle-boundary detail does not remain in the active execution
window.

source:

The Active Queue Snapshot now carries enough completed lifecycle checkpoint
detail, but the historical ledger still contains long TSQ sections. The user
explicitly asked to avoid keeping completed tasks as active context and to
periodically remove/demote excess information.

assumptions:

- completed implementation evidence should remain discoverable in commit
  history and compact command evidence;
- active state should preserve only next action, compact checkpoint, open risks,
  and rollback pointers.

tradeoffs:

- over-condensing can hide useful rollback detail;
- under-condensing keeps context expensive and encourages agents to reread
  completed work.

simplest acceptable implementation:

- compact TSQ-10/TSQ-11/TSQ-12 active detail into checkpoint bullets;
- keep command evidence pointers and commit hashes;
- keep the next unchecked item explicit;
- do not alter source behavior.

rules:

- docs-only slice;
- no source/package changes;
- do not delete evidence artifacts;
- do not create a new plan file.

likely files:

- `PLAN.md`;
- `GOAL.md`.

files forbidden to touch:

- package source;
- DB schema/migrations;
- old raw materials.

non-goals:

- no code refactor;
- no broad repo cleanup;
- no audit scanner revival.

success criteria:

- Active Queue Snapshot is shorter and points to the next real unchecked slice;
- completed TSQ-10/11/12 detail is represented as compact checkpoint evidence;
- `GOAL.md` remains compact;
- docs diff is clean.

verification:

```sh
git status --short --branch
git diff --check
```

rollback:

```sh
git revert <CTX-04 commit>
```

commit:

```sh
git commit -m "docs(plan): condense lifecycle boundary context"
```
