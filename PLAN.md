# KRN Continuous Hardening Plan

> Canonical living queue for `/home/krn/coding/krn/active/mise-en-palace`.
> Historical completed task bodies were archived by CTX-05; do not treat the
> archive as active execution context unless a future slice explicitly names it.

## Active Queue Snapshot

current_priority: Complete.

first_unchecked_slice: none.

active_scope:

- keep `GOAL.md` compact and `PLAN.md` as the living queue;
- preserve completed evidence through archives, commit history, run ledgers,
  ADRs, and compact checkpoint pointers;
- do not rebuild `krn audit`, anti-slop scanners, dashboard-first surfaces,
  broad eval platforms, or worker runtime while auditing completion evidence;
- use repo/runtime truth over memory or old plans.

completed_checkpoint:

- Reset baseline P0-P7 is complete: root `GOAL.md` and root `PLAN.md` became
  canonical, old memory-plan docs became historical quarry, README was aligned,
  productized QG-06/anti-slop direction was rejected, and the first governed
  self-hosting loop was recorded.
- Evidence Integrity EVI-00..EVI-10 is complete: command provenance,
  explicit verification evidence, DB persistence, self-hosting regression,
  activation relevance review, candidate/review loop proof, Promptfoo boundary,
  and operator evidence ergonomics were repaired or bounded.
- Repo condensation C/COND slices are complete: public `krn audit` and the
  harness scanner were removed, DB/CLI/harness/repository surfaces were narrowed
  or classified, legacy AuditBundle storage/tables were decided and removed
  after DB proof, and useful invariants moved into native domains.
- TypeScript quality TSQ slices through TSQ-12 are complete: evidence proof
  states, branded IDs, JSON/unsafe-cast boundaries, public return types,
  impossible lifecycle states, reflection writer results, eval candidates,
  EvidenceBundle, activation decisions, retrieval completion, context assembly,
  review/feedback/memory candidate, and source claim create-status boundaries
  were decided and/or narrowed.
- Context condensation CTX-00..CTX-05 is complete: recent lifecycle details
  were compacted, and the full historical pre-CTX-05 root plan was archived at
  `docs/plans/historical-ledgers/2026-06-24-root-plan-before-ctx-05-archive.md`.
- Execution hygiene is active: every slice must inspect status, implement
  narrowly, verify, commit, push, and leave a clean worktree.

last_verified_state:

- Last pushed code slice: `67c1249 refactor(source): narrow claim create status`.
- Last pushed docs condensation slice before this plan rewrite:
  `3d4bdae docs(plan): condense lifecycle boundary context`.
- CTX-05 archive snapshot contains 8141 lines of historical root plan content.
- Current root `PLAN.md` is the compact living queue.

open_risks_and_next_candidates:

- No active unchecked slice remains for this goal.
- Future hardening work should start from this compact root `PLAN.md` and add a
  new bounded slice instead of reopening archived historical task bodies.

evidence_pointers:

- Historical root plan snapshot:
  `docs/plans/historical-ledgers/2026-06-24-root-plan-before-ctx-05-archive.md`
- Self-hosting run ledger:
  `docs/runs/2026-06-23-self-hosting-memory-loop.md`
- CLI/package surface decisions:
  `docs/architecture/cli-surfaces.md`,
  `docs/architecture/package-surfaces.md`
- Reset/audit decision records:
  `docs/reviews/repo-reset-audit/*`
- Worker/eval/evidence/ID ADRs:
  `docs/decisions/ADR-0015-worker-runtime-boundary.md`,
  `docs/decisions/ADR-0016-eval-candidates-remain-proposal-only.md`,
  `docs/decisions/ADR-0017-legacy-auditbundle-storage-fate.md`,
  `docs/decisions/ADR-0018-drop-empty-legacy-audit-tables.md`,
  `docs/decisions/ADR-0019-evidence-command-proof-states.md`,
  `docs/decisions/ADR-0020-branded-domain-ids.md`

## Progress

- [x] P0-P7 Canonical reset baseline and first self-hosting loop.
- [x] EVI-00..EVI-10 Evidence Integrity program.
- [x] C0/C1/C2/C3/C4/C5/C6 continuous hardening follow-ups.
- [x] EXEC-00..EXEC-01 executor discipline and slice template gate.
- [x] COND-03..COND-04 package/CLI condensation decisions.
- [x] DEV-DB-00 local DB verification script defaults.
- [x] TSQ-00..TSQ-12 TypeScript lifecycle and boundary hardening.
- [x] CTX-00..CTX-05 context condensation and historical ledger archival.
- [x] VERIFY-00 Audit continuous hardening completion evidence.

## Current Decisions

- `krn audit` is removed as a product/CLI/harness scanner surface. Do not
  recreate it as a guardrail, quality engine, or anti-slop subsystem.
- General quality is enforced by architecture, narrow package surfaces, typed
  IO, tests, naming, review boundaries, and deletion of wrong abstractions.
- Promptfoo is a bounded runner/result adapter. It is not Memory Brain truth.
- Observation and reflection are staging/candidate paths. They do not mutate
  Memory Core.
- DB runtime truth may be claimed only after DB commands run in the current
  environment.
- Completed task bodies belong in historical ledger archives or commit history,
  not in the active goal window.

## Worktree And Remote Hygiene

- Before each slice: run `git status --short --branch`.
- During each slice: touch only files required by that slice.
- After each slice: run the slice verification, commit with a focused
  Conventional Commit, push, and confirm a clean worktree.
- If push or verification fails, record the blocker here before starting a new
  slice.

## VERIFY-00: Audit Continuous Hardening Completion Evidence

status: complete.

priority: P0.

objective:

Prove or disprove whether the active goal is complete:

```txt
Turn the completed canonical KRN reset into a continuous hardening goal and
backlog, preserving completed evidence while adding follow-up observations and
concrete extension slices from finished tasks.
```

required audit:

- derive requirements from `GOAL.md`, this `PLAN.md`, the archived historical
  ledger, and current git state;
- verify that completed evidence is preserved and discoverable;
- verify that root `PLAN.md` is now a compact living queue, not a copied
  historical task dump;
- verify that follow-up observations and concrete extension slices were added,
  executed, or preserved as bounded future work;
- verify worktree/remote cleanliness;
- verify no active `krn audit`/anti-slop subsystem was reintroduced;
- run docs hygiene checks and relevant test/typecheck commands if source
  changes since the last package slice require them.

success criteria:

- each explicit goal requirement has direct evidence or a named missing item;
- if complete, the active goal can be marked complete only after the audit;
- if incomplete, this plan gains the next concrete bounded slice.

verification:

```sh
git status --short --branch
git log --oneline --decorate -12
rg -n "^- \\[ \\]|first_unchecked_slice|krn audit|anti-slop|Historical" GOAL.md PLAN.md README.md docs packages
git diff --check
```

rollback:

```sh
git revert <VERIFY-00 commit>
```

commit:

```sh
git commit -m "docs(plan): audit continuous hardening completion"
```

outcome:

- Requirement: turn completed reset into a continuous hardening goal and
  backlog.
  Evidence: root `GOAL.md` remains the compact activation contract; this root
  `PLAN.md` is now the compact living queue with completed checkpoint groups,
  explicit decisions, worktree hygiene, and no active historical task dump.
- Requirement: preserve completed evidence.
  Evidence: the full pre-CTX-05 root plan is archived at
  `docs/plans/historical-ledgers/2026-06-24-root-plan-before-ctx-05-archive.md`
  with 8141 lines; the compact plan points to run ledgers, ADRs, architecture
  docs, repo-reset reviews, and commit history.
- Requirement: add follow-up observations and concrete extension slices from
  finished tasks.
  Evidence: the completed progress chain includes EVI, C/COND, EXEC, DEV-DB,
  TSQ, and CTX follow-up slices derived from P7/reset findings, including
  source/review/context lifecycle hardening and historical context cleanup.
- Requirement: keep productized audit/anti-slop direction rejected.
  Evidence: package-source scan found no active `runAudit`, `parseAudit`,
  `AuditBundle`, or `DrizzleAuditBundleRepository` contracts; CLI tests assert
  `audit` is unsupported; README/GOAL/PLAN reject rebuilding `krn audit` as a
  product or guardrail layer.
- Requirement: keep worktree/remote clean.
  Evidence: `git status --short --branch` showed `main...origin/main` clean
  before this audit update.

command_evidence:

```sh
git status --short --branch
git log --oneline --decorate -12
wc -l PLAN.md GOAL.md docs/plans/historical-ledgers/2026-06-24-root-plan-before-ctx-05-archive.md
rg -n "runAudit|parseAudit|AuditBundle|DrizzleAuditBundleRepository|kind: \"audit|case \"audit\"|command.*audit|krn audit" packages/core packages/schema packages/cli packages/db packages/harness packages/workers packages/codex-adapter README.md PLAN.md GOAL.md
rg -n "audit" packages/cli/src/parseArgs.ts packages/cli/src/runCli.ts packages/cli/src/runCli.test.ts README.md
git diff --check
```

does_not_prove:

- This audit does not prove Memory Brain product readiness, cognitive quality,
  worker runtime execution, dashboard/API readiness, or DB runtime state in the
  current shell.
- It proves only that the reset was converted into a compact continuous
  hardening plan/backlog with preserved evidence and no remaining active slice
  under this goal.
