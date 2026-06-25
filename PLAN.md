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
- use OpenAI Codex ExecPlan/Goal guidance as execution discipline, mapped to
  this repo's canonical `PLAN.md` rather than adding a parallel root
  `PLANS.md`;
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
- KRN-SR-00 Evidence Dirty-Context Reporting is complete:
  `krn evidence capture` accepts repeatable `--intended-file`, classifies
  changed files as intended/unrelated/unknown, preserves command proof
  provenance, and records the dogfood report at
  `docs/reviews/controlled-dogfood/2026-06-25-evidence-dirty-context/REPORT.md`.
- GBC-00 Evidence Dirty-Context Golden Behavior is complete:
  the behavior is covered by a validated GoldenTask fixture and a CLI-owned
  real `runCli` proof, recorded at
  `docs/reviews/controlled-dogfood/2026-06-25-evidence-dirty-context-golden/REPORT.md`.
- CRO-00 Candidate Reviewability Output is complete:
  evidence-capture candidate output now renders deterministic reviewability
  labels and reasons, recorded at
  `docs/reviews/controlled-dogfood/2026-06-25-candidate-reviewability-output/REPORT.md`.
- DBR-00 Current-Shell DB Replay For Evidence Metadata is complete:
  local `krn-postgres` started from the existing compose runbook, `pnpm
  db:ready` passed with 13/13 migrations and pgvector available, and a
  persisted run/evidence/observe/reflect replay exists at
  `79252723-50ed-484a-a7c6-513366130db5`.
- RCR-00 Reflection Candidate Reviewability is complete:
  DB-backed run `a0407c7a-ffca-478e-b209-539488b2bd4c` proved that the
  candidate reviewability helper can move from CLI-only evidence capture into
  reflection candidate output without changing extraction, review gates,
  promotion behavior, or DB schema.
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

- No active unchecked slice remains in this plan.
- Three bounded KRN-on-KRN source repairs now have dogfood usefulness reports.
  Candidate reviewability output is implemented for the evidence-capture
  proposal surface; activation scoring should still wait for DB-backed
  dogfood evidence.
- The next strongest source-repair candidates are another DB-backed
  KRN-on-KRN source repair or reflection candidate reviewability reuse.
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
- Planned KRN-on-KRN source repair prompt:
  `docs/reviews/controlled-dogfood/evidence-dirty-context/GOAL_PROMPT.md`
- Completed KRN-on-KRN source repair report:
  `docs/reviews/controlled-dogfood/2026-06-25-evidence-dirty-context/REPORT.md`
- Completed GoldenTask source repair report:
  `docs/reviews/controlled-dogfood/2026-06-25-evidence-dirty-context-golden/REPORT.md`
- Completed candidate reviewability source repair report:
  `docs/reviews/controlled-dogfood/2026-06-25-candidate-reviewability-output/REPORT.md`
- Current-shell DB replay report:
  `docs/reviews/controlled-dogfood/2026-06-25-db-replay-evidence-metadata/REPORT.md`
- Reflection candidate reviewability report:
  `docs/reviews/controlled-dogfood/2026-06-25-reflection-candidate-reviewability/REPORT.md`
- OpenAI Codex execution references:
  `https://developers.openai.com/cookbook/articles/codex_exec_plans`,
  `https://developers.openai.com/cookbook/examples/codex/using_goals_in_codex`,
  `https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide`
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
- [x] KRN-SR-00 Improve Evidence Dirty-Context Reporting.
- [x] GBC-00 Add Golden Behavior Coverage For Evidence Dirty-Context Capture.
- [x] CRO-00 Improve Candidate Reviewability Output.
- [x] DBR-00 Prove Current-Shell DB Replay For Evidence Metadata.
- [x] RCR-00 Apply Candidate Reviewability To Reflection Candidate Output.

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
- OpenAI's `PLANS.md` article is adopted as a planning pattern, not a filename
  override. This repo keeps root `PLAN.md` as the living execution map to avoid
  plan-sprawl.
- OpenAI Goals guidance maps to KRN goals as evidence-checked completion
  contracts: each goal must name the outcome, constraints, and verification
  surface before implementation.
- OpenAI Codex prompting guidance maps to execution discipline: inspect current
  repo state, batch reads, prefer focused patches, verify, commit, push, and do
  not stop at a plan when source changes are required.

## Worktree And Remote Hygiene

- Before each slice: run `git status --short --branch`.
- During each slice: touch only files required by that slice.
- After each slice: run the slice verification, commit with a focused
  Conventional Commit, push, and confirm a clean worktree.
- If push or verification fails, record the blocker here before starting a new
  slice.

## KRN-SR-00: Improve Evidence Dirty-Context Reporting

status: complete.

priority: P0.

objective:

Use KRN Brain on this actual repo to improve one real source surface:
`krn evidence capture` should make dirty-context review easier by separating
intended files, unrelated dirty files, unknown/unclassified changed files, and
command proof strength.

This is the first KRN-on-KRN source repair trial after the Brain Usefulness
Report and dogfood usefulness reporting standard. It replaces the earlier weak
fixture-repo idea with a real source repair in `mise-en-palace`.

source_decisions:

- OpenAI ExecPlans article: long-running Codex work benefits from a living
  executable plan that stays updated through implementation. KRN keeps this in
  root `PLAN.md` instead of adding a parallel `PLANS.md`.
- OpenAI Goals article: this work should run as a scoped, evidence-checked
  completion contract because the path depends on what code inspection finds.
- OpenAI Codex prompting guide: execute with repo inspection, batched reads,
  focused patches, verification, and no speculative broad refactors.
- KRN Brain Usefulness Report: evidence/review artifacts help most when they
  preserve weak proof or dirty context honestly, but dirty context currently
  increases review burden when not separated clearly.
- Dogfood reporting standard: this source repair must include a full Dogfood
  Brain Usefulness Section in the final run report.

required_reading:

1. `AGENTS.md`
2. `docs/KRN_KERNEL.md`
3. `README.md`
4. `GOAL.md`
5. `PLAN.md`
6. `docs/reviews/brain-usefulness/REPORT.md`
7. `docs/reviews/brain-usefulness/DOGFOOD_REPORTING.md`
8. `docs/runs/2026-06-23-feedback-dogfood.md`
9. `docs/runs/2026-06-23-self-hosting-memory-loop.md`
10. `packages/core/src/evidenceBundle.ts`
11. `packages/schema/src/evidenceBundle.ts`
12. `packages/cli/src/parseEvidenceArgs.ts`
13. `packages/cli/src/runEvidenceCaptureCommand.ts`
14. relevant tests for evidence capture and CLI parsing.

preflight:

```sh
git fetch --prune
git status --short --branch
git log --oneline --decorate --left-right origin/main...main
pnpm typecheck
pnpm test
git diff --check
```

If DB is available:

```sh
pnpm db:ready
```

Do not claim DB runtime truth unless DB commands pass in the current shell.

krn_planning_step:

Before source edits, run KRN planning if available:

```sh
pnpm --filter @krn/cli krn plan \
  --task "Improve evidence capture dirty-context reporting so future dogfood runs distinguish intended files, unrelated dirty files, command proof strength, and weak default command rows"
```

Use `--persist` only if DB readiness passes.

Record selected context, memory, source claims, exclusions, raw recall triggers,
expected evidence, and whether the selected context helped.

target_behavior:

- `krn evidence capture` can accept repeatable intended file inputs or an
  existing equivalent if source inspection finds one.
- Changed files are rendered/classified as:
  - intended;
  - unrelated dirty;
  - unknown/unclassified when no intent is provided.
- Command proof output continues to distinguish:
  - operator-reported passed/failed;
  - captured output file;
  - command-runner evidence if already supported;
  - weak `default_template` / `not_run` rows.
- Review burden output warns when unrelated dirty files are present and states
  what command evidence proves and does not prove.

simplest_acceptable_implementation:

- Prefer adding repeatable `--intended-file <path>` to `krn evidence capture`
  plus a small changed-file classification function and focused CLI rendering.
- If an intended-file mechanism already exists, improve rendering/tests only.
- Do not add a generic file classifier, ignore policy, hidden shell runner, or
  quality system.

likely_files:

- `packages/core/src/evidenceBundle.ts`
- `packages/schema/src/evidenceBundle.ts`
- `packages/cli/src/parseEvidenceArgs.ts`
- `packages/cli/src/runEvidenceCaptureCommand.ts`
- focused CLI/evidence tests
- `docs/reviews/controlled-dogfood/<date>-evidence-dirty-context/REPORT.md`

non_goals:

- no activation scoring changes;
- no memory scoring changes;
- no reflection extraction changes;
- no DB schema/migrations unless source inspection proves current persistence
  cannot represent required fields;
- no dashboard, API, MCP, worker runtime, source crawler, broad eval platform,
  `krn audit`, anti-slop scanner, quality engine, or new package;
- no hidden command execution;
- no automatic cleanup or hiding of dirty files.

tests:

- `--intended-file` parses as repeatable input.
- intended changed files classify as intended.
- dirty changed files not listed as intended classify as unrelated.
- missing intended-file input keeps changed files unknown/unclassified or
  preserves old behavior safely.
- operator-reported command proof still renders provenance and does-not-prove.
- default not-run command rows remain weak proof.

verification:

```sh
pnpm --filter @krn/cli test -- parseEvidenceArgs runEvidenceCaptureCommand
pnpm typecheck
pnpm test
git diff --check
```

If DB persistence is touched:

```sh
pnpm db:ready
pnpm --filter @krn/db db:check
pnpm db:smoke:harness-evidence
```

dogfood_report:

Create:

```txt
docs/reviews/controlled-dogfood/<date>-evidence-dirty-context/REPORT.md
```

The report must use
`docs/reviews/brain-usefulness/DOGFOOD_REPORTING.md` and include:

- KRN plan output summary;
- selected context/memory/source and whether it helped;
- code diff summary;
- command evidence strength;
- review burden delta;
- candidate reviewability;
- Brain ROI;
- what this proves and does not prove.

completion_criteria:

1. KRN was used to plan or guide this source repair, or the report explains why
   KRN planning could not be used.
2. Evidence dirty-context reporting is improved in package source.
3. Focused tests prove the new behavior.
4. `pnpm typecheck` passes.
5. `pnpm test` passes.
6. `git diff --check` passes.
7. Dogfood report exists under
   `docs/reviews/controlled-dogfood/<date>-evidence-dirty-context/REPORT.md`.
8. The dogfood report includes a full Dogfood Brain Usefulness Section.
9. No dashboard, worker runtime, eval platform, source crawler, audit scanner,
   or anti-slop system was added.
10. Commit is focused and pushed.
11. Worktree is clean after push.

suggested_commit:

```sh
git commit -m "feat(evidence): classify dirty context in capture output"
```

completion_evidence:

- `pnpm --filter @krn/cli test -- parseEvidenceArgs runCli` passed.
- `pnpm typecheck` passed.
- `pnpm test` passed.
- `git diff --check` passed.
- `krn evidence capture` preview classified the six intended CLI files as
  intended, with no unrelated or unknown changed files.
- DB runtime truth was not claimed; `pnpm db:ready` timed out before edits.
