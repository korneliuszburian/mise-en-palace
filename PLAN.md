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
- Brain usefulness validation is complete as a docs/review pass:
  `docs/reviews/brain-usefulness/REPORT.md` found the brain dogfood-ready for
  KRN-on-KRN work but not internal-alpha-ready or product-ready.
- BUR-00 Brain Usefulness Reporting is complete:
  `docs/reviews/brain-usefulness/DOGFOOD_REPORTING.md` defines the reusable
  dogfood-run reporting format for selected / used / helped / missing / stale
  context, candidate reviewability, command proof strength, review burden delta,
  observation/reflection usefulness, source usefulness, memory usefulness, and
  Brain ROI.
- Execution hygiene is active: every slice must inspect status, implement
  narrowly, verify, commit, push, and leave a clean worktree.

last_verified_state:

- Last pushed review slice before BUR-00:
  `9110e13 docs(review): validate KRN brain usefulness`.
- Last pushed planning slice before BUR-00:
  `ec950c2 docs(plan): add brain usefulness reporting slice`.
- Last pushed code slice: `67c1249 refactor(source): narrow claim create status`.
- CTX-05 archive snapshot contains 8141 lines of historical root plan content.
- Current root `PLAN.md` is the compact living queue.

open_risks_and_next_candidates:

- No active unchecked slice remains for this goal.
- Use `docs/reviews/brain-usefulness/DOGFOOD_REPORTING.md` in 2-3 future
  dogfood runs before considering activation scoring repair, candidate quality
  repair, reflection quality repair, or an internal-alpha target repo trial.
- Future hardening work should stay bounded and should not reopen archived
  historical task bodies.

evidence_pointers:

- Historical root plan snapshot:
  `docs/plans/historical-ledgers/2026-06-24-root-plan-before-ctx-05-archive.md`
- Self-hosting run ledger:
  `docs/runs/2026-06-23-self-hosting-memory-loop.md`
- Brain usefulness validation report:
  `docs/reviews/brain-usefulness/REPORT.md`
- Dogfood usefulness reporting format:
  `docs/reviews/brain-usefulness/DOGFOOD_REPORTING.md`
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
- [x] BUV-00 Brain usefulness validation report.
- [x] BUR-00 Add Dogfood Brain Usefulness Reporting Standard.

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
- Brain usefulness should be measured before behavior rewrites. Use the
  dogfood reporting format for 2-3 runs before changing activation scoring,
  memory scoring, reflection extraction, or candidate generation.

## Worktree And Remote Hygiene

- Before each slice: run `git status --short --branch`.
- During each slice: touch only files required by that slice.
- After each slice: run the slice verification, commit with a focused
  Conventional Commit, push, and confirm a clean worktree.
- If push or verification fails, record the blocker here before starting a new
  slice.
