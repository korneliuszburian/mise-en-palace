# KRN Brain Usefulness Validation Plan

> Canonical living queue for validating whether the current KRN Memory Brain
> improves real dogfood work. This is a bounded validation goal, not a new
> architecture or implementation program.

## Active Queue Snapshot

current_priority: Brain Usefulness Validation.

first_unchecked_slice: `BUV-00: Produce Brain Usefulness Report`.

active_scope:

- validate whether selected memory, source grounding, observation/reflection,
  evidence/review, candidate paths, and activation choices helped real KRN
  dogfood work;
- create exactly one primary artifact:
  `docs/reviews/brain-usefulness/REPORT.md`;
- inspect 3 to 5 real dogfood runs, including
  `docs/runs/2026-06-23-self-hosting-memory-loop.md`;
- do not add architecture, product surfaces, CLI commands, schemas, dashboard,
  worker runtime, eval platform, source crawler, new memory layer, `krn audit`,
  anti-slop subsystem, or quality scanner;
- do not mutate Memory Core, promote memory, change activation behavior, or fix
  issues during this validation goal.

completed_context:

- The previous reset/continuous-hardening goal is complete.
- Root `PLAN.md` previously reached:

```txt
current_priority: Complete.
first_unchecked_slice: none.
```

- Full historical reset/hardening evidence is preserved at:
  `docs/plans/historical-ledgers/2026-06-24-root-plan-before-ctx-05-archive.md`.
- The previous completion audit did not prove Memory Brain product readiness,
  cognitive quality, worker runtime execution, dashboard/API readiness, or DB
  runtime state in the current shell.

evidence_pointers:

- `docs/runs/2026-06-23-self-hosting-memory-loop.md`
- recent run ledgers under `docs/runs/`
- `docs/architecture/cli-surfaces.md`
- `docs/architecture/package-surfaces.md`
- relevant ADRs only if selected runs reference them:
  - `docs/decisions/ADR-0015-worker-runtime-boundary.md`
  - `docs/decisions/ADR-0016-eval-candidates-remain-proposal-only.md`
  - `docs/decisions/ADR-0019-evidence-command-proof-states.md`
  - `docs/decisions/ADR-0020-branded-domain-ids.md`

## Progress

- [ ] BUV-00 Produce Brain Usefulness Report.

## Operating Rules

- Repo evidence beats memory.
- Use committed run ledgers and docs if local DB is unavailable.
- Claim DB runtime truth only if DB commands pass in the current shell.
- If package source is touched accidentally, stop and either revert or split
  scope; then run `pnpm typecheck`, `pnpm test`, and `git diff --check`.
- Keep `GOAL.md` compact. Do not expand it into a progress ledger.
- Commit and push the completed docs/report slice. Leave worktree clean.

## BUV-00: Produce Brain Usefulness Report

priority: P0.

objective:

Create `docs/reviews/brain-usefulness/REPORT.md` answering:

```txt
Did the current KRN Memory Brain help real KRN dogfood work,
or did it mainly produce well-structured ledger artifacts?
```

required_read_order:

1. `AGENTS.md`
2. `docs/KRN_KERNEL.md`
3. `README.md`
4. `GOAL.md`
5. `PLAN.md`
6. `docs/runs/2026-06-23-self-hosting-memory-loop.md`
7. recent run ledgers under `docs/runs/`
8. selected architecture docs and ADRs only when relevant to selected runs.

preflight:

```sh
git fetch --prune
git status --short --branch
git log --oneline --decorate --left-right origin/main...main
git log --oneline --decorate -20
```

Record in the report:

- remote/local state;
- worktree state;
- latest commit;
- ahead/behind state;
- whether DB was used.

dogfood_run_selection:

- Select 3 to 5 recent KRN dogfood runs.
- Include `docs/runs/2026-06-23-self-hosting-memory-loop.md`.
- Prefer varied brain functions:
  - one self-hosting/planning run;
  - one memory or anti-memory governance run;
  - one source/evidence/review run;
  - one TypeScript/package-boundary hardening run if available;
  - one context-condensation or plan-hygiene run if useful.
- Include at least one run with known weak evidence, gap, or partial
  usefulness if available.

For each selected run, record:

```txt
run_id:
task/objective:
date:
source of evidence:
persisted DB available? yes/no
related commits:
changed files:
commands recorded:
verification strength:
```

evaluation_lanes:

1. Activation usefulness:
   - classify selected context as helped / neutral / noise / missing /
     harmful-stale;
   - give verdict: good / mixed / weak / harmful / insufficient evidence.
2. Memory usefulness:
   - distinguish exists vs selected vs used vs helped;
   - classify memory as helped / neutral / noise / hurt / stale / unknown.
3. Source grounding usefulness:
   - classify whether source claims supported, qualified, prevented overclaim,
     added decorative burden, missed a needed source, or left conflict
     unresolved.
4. Evidence and review burden:
   - classify command evidence as strong / weak / missing / not applicable;
   - assess review burden delta: reduced / unchanged / increased / unclear.
5. Observation/reflection usefulness:
   - classify outputs as useful candidate, useful gap, useful contradiction,
     correctly empty, ledger-only, noise, or missing finding.
6. Candidate quality:
   - classify MemoryCandidate / AntiMemoryCandidate / SourceDecision /
     EvalCandidate proposal reviewability as ready / needs more evidence /
     too vague / duplicate / not useful.
7. Brain ROI:
   - assess context waste, review burden, resume quality, decision grounding,
     memory usefulness, and operator friction;
   - final run verdict: strong positive / positive / mixed / weak / negative /
     insufficient evidence.

required_report_structure:

```md
# KRN Brain Usefulness Report

Status: validation report, not implementation plan.

Date:
Evaluator:
Repo state:
Latest commit:
Local/remote state:
DB available: yes/no

## Executive Verdict

## Scope

## Method

## Findings Summary

## Run Reviews

## Cross-Run Patterns

## What The Brain Already Does Well

## What Is Still Mostly Ledger

## Highest-Value Next Repairs

## What Not To Build Next

## Product Readiness Verdict

## Next Recommended Goal

## Command Evidence

## Appendix: Evidence Pointers
```

report_requirements:

- At least 3 real dogfood runs inspected.
- Each selected run covers activation, memory, source, evidence/review,
  observation/reflection, candidate quality, and ROI.
- Product readiness verdict must be one of:
  - not ready;
  - dogfood-ready;
  - internal-alpha-ready;
  - product-ready.
- Highest-value next repairs are limited to at most 5 bounded candidates.
- Allowed repair categories only:
  - activation scoring repair;
  - memory application guidance repair;
  - candidate quality repair;
  - source claim quality repair;
  - evidence capture ergonomics repair;
  - review burden reporting repair;
  - dogfood eval case;
  - internal-alpha trial.
- Explicitly list what not to build next.
- Use qualitative labels only: strong / good / mixed / weak / harmful /
  unknown / insufficient evidence.

harsh_standard:

```txt
If a brain component cannot be shown to improve a run, reduce review burden,
prevent error, select better context, or create a useful candidate, then its
current value is unproven.
```

Do not confuse:

- exists with works;
- persisted with useful;
- selected with helped;
- green test with product value.

non_goals:

- no package source changes;
- no new architecture;
- no dashboard/API/MCP/worker runtime;
- no new memory subsystem;
- no source crawler;
- no broad benchmark/eval platform;
- no Promptfoo authority layer;
- no generic multi-agent workflow;
- no `krn audit`;
- no anti-slop subsystem;
- no quality scanner;
- no plan-sprawl surface;
- no memory promotion;
- no Memory Core mutation;
- no activation behavior changes.

verification:

```sh
git diff --check
```

If local DB is used, also run and record:

```sh
pnpm db:ready
```

Optional if directly relevant:

```sh
pnpm --filter @krn/db db:check
pnpm db:smoke
```

If package source is touched, stop and restore scope or run:

```sh
pnpm typecheck
pnpm test
git diff --check
```

completion_criteria:

1. `docs/reviews/brain-usefulness/REPORT.md` exists.
2. At least 3 real dogfood runs are inspected.
3. Every selected run has all seven evaluation lanes.
4. Report states brain readiness.
5. Recommendations are limited to at most 5 bounded repair candidates.
6. No package source was modified.
7. No new product surface was created.
8. `git diff --check` passes.
9. `PLAN.md` is updated only if needed to point to the completed report and
   next recommended bounded action.
10. `GOAL.md` is not expanded into a progress ledger.

suggested_commit:

```sh
git add docs/reviews/brain-usefulness/REPORT.md PLAN.md GOAL.md
git commit -m "docs(review): validate KRN brain usefulness"
git push
```
