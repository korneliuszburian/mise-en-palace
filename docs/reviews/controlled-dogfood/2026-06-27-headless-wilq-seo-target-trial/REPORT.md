# Headless WILQ SEO Target Trial

Status: headless target trial report, not V02-01 second-operator proof.

Date: 2026-06-27.

## Executive Verdict

KRN can initialize, plan, and persist a target-repo run for
`/home/krn/coding/krn/active/wilq-seo`, then carry operator-reported target
verification evidence through persisted evidence, observe, reflect, and readback.

The trial found real target test-contract drift and repaired the smallest test
surface needed for backend verification to pass. It does not prove a real
second-operator trial, because the same operator executed the flow headlessly
and the target repo had broader dirty context outside the focused test repairs.

Readiness signal:

```txt
useful headless target proof
not V02-01
not widened alpha
not product-ready
```

## Target

```txt
target_repo: /home/krn/coding/krn/active/wilq-seo
target_repo_mode: writable headless local checkout
operator: same Codex/operator session, not second human
DB mode: local Docker/Postgres after recovery
support boundary: none, because this was headless
bounded target task: inspect guidance, run readiness commands, repair stale test-contract expectations only
```

Why selected:

- clean target status at initial selection;
- repo has `AGENTS.md`, `PLAN.md`, `README.md`, `docs`, `scripts`, and `tests`;
- package scripts expose `typecheck` and `test`;
- target rules define `scripts/verify.sh` as final broad gate and `uv run ...`
  for Python/API commands.

## KRN Run

Current persisted run after DB volume recovery:

```txt
projectId: 22d2733e-a643-4bab-b27b-2d0eb4e1ae3f
executionRun: d06ada65-aa47-4bf4-87c5-6607ca0ebebb
evidenceBundle: baff1c0d-cfd0-4f41-836f-75a6250f241b
reviewAssessment: 59d6453e-0980-4347-acba-88aa9800ee75
feedbackDelta: 8f93bcfa-9b01-47b2-a6d0-8807c47e1eef
observationGroup: a3add924-4b77-4c26-acdc-8bd1954ef936
reflectionRecord: dc1241e2-a6d2-4d07-a0a0-b1ae3fc372c9
```

KRN plan selected six context inclusions:

- target source seed: `tests`;
- target trust exclusions;
- target source seed: `AGENTS.md`;
- target source seed: `docs`;
- target source seed: `README.md`;
- target source seed: `scripts`.

Owner-file status:

```txt
Target read model: sourceSeeds=7, ownerFiles=0, trustExclusions=7
Target owner files: unavailable; using root-level source seeds only
```

## What Changed In Target

Focused test-contract repairs made by this trial:

- `tests/test_api_contracts.py`
  - updated Ahrefs candidate expectation from stale English `Overlap:` to
    current Polish `Wspólne sygnały:`;
  - updated Ads target-confirmation action title expectation to current Polish
    target wording.
- `tests/test_jobs_scheduler.py`
  - made configured vendor-read job test explicitly configure Google
    credentials and connector env for GSC, GA4, and Merchant instead of relying
    on the local shell environment.

Target dirty context outside the focused test repairs:

- `apps/dashboard/src/routes/ActionDetailRoute.test.tsx`
- `apps/dashboard/src/routes/ActionObjectPanels.tsx`
- `apps/dashboard/src/routes/AdsDoctorSurface.tsx`
- `apps/dashboard/src/routes/DetailPanels.tsx`
- `apps/dashboard/src/routes/Ga4DiagnosticSurface.tsx`
- `apps/dashboard/src/routes/marketingLabels.ts`
- `scripts/marketer_language_guard.py`
- `wilq/actions/google_ads/business_context.py`
- `wilq/actions/google_ads/keyword_planner.py`
- `wilq/actions/service.py`
- `wilq/briefing/ads_diagnostics.py`
- `wilq/briefing/ga4_diagnostics.py`

Those broader target changes were not committed by this KRN report. They need a
separate target-repo decision before any target commit/push.

## Verification

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `pnpm db:ready` in KRN | passed after Docker recovery | Local KRN Postgres was reachable with 14/14 migrations and pgvector. | Does not prove future shell DB state. |
| `pnpm db:smoke` in KRN | failed after fresh volume recovery | Generic DB smoke hit an enum re-create failure even though `db:ready` passed. | Does not prove target init/connect is blocked. |
| `krn init --connect --repo /home/krn/coding/krn/active/wilq-seo --persist` | passed | KRN can persist target project, repo installation, kernel, scripts, and source seeds. | Does not prove target code quality. |
| `krn plan --project 22d2733e-a643-4bab-b27b-2d0eb4e1ae3f --persist` | passed | KRN can assemble project-scoped target context for WILQ SEO. | Does not prove owner-file recall below roots because ownerFiles were unavailable. |
| `scripts/typecheck.sh` in target | passed with caveat | Python mypy passed; target script skipped frontend typecheck because `apps/dashboard/node_modules` was missing. | Does not prove frontend TypeScript currently compiles. |
| `scripts/test.sh` before repairs | failed | Target backend tests exposed stale expectations. | Does not prove product behavior was wrong. |
| Focused failing tests after repair | passed | The identified stale expectations were corrected. | Does not prove the full target suite. |
| `scripts/test.sh` after repair | passed, 214 tests | Target backend tests pass after the focused test-contract repairs. | Frontend tests were skipped because `node_modules` was missing. |
| `git diff --check` in target | passed | Target diff has no whitespace errors. | Does not prove semantic correctness. |
| `krn evidence capture --run-id d06ada65-aa47-4bf4-87c5-6607ca0ebebb --persist` | passed | KRN persisted operator-reported command evidence for the target trial. | KRN evidence capture did not see target changed files because it ran in the KRN repo. |
| `krn observe --run d06ada65-aa47-4bf4-87c5-6607ca0ebebb --persist` | passed | Observation group was persisted without MemoryRecord mutation. | Does not prove reflection quality. |
| `krn reflect --scope run:d06ada65-aa47-4bf4-87c5-6607ca0ebebb --persist` | passed | Reflection record was persisted with no candidate rows and no MemoryRecord mutation. | Does not prove candidate quality. |

## Findings

### Useful

- KRN target init/connect worked on a real active repo.
- KRN plan selected appropriate root-level target context for a headless trial:
  `AGENTS.md`, `docs`, `README.md`, `scripts`, `tests`, and trust exclusions.
- The run exposed real readiness gaps:
  - target frontend verification skipped because `node_modules` was missing;
  - backend tests had stale product-language expectations;
  - scheduler test depended on local credential state.
- Persisted KRN readback preserved command proof with `doesNotProve` boundaries.

### Weak Or Missing

- No second operator participated.
- Target owner-file recall below roots was unavailable because the target read
  model had no `ownerFiles`.
- KRN evidence capture did not classify target repo dirty files.
- Generic KRN `pnpm db:smoke` failed after fresh DB volume recovery even though
  `pnpm db:ready`, target init/connect, plan, evidence, observe, and reflect
  worked.
- Target repo still has broader uncommitted dirty context outside this focused
  test repair.

## Decision

This headless trial is useful product evidence, but it must not be renamed into
V02-01.

Allowed next:

- decide whether to commit/push the target repo test-contract repairs together
  with the broader target copy/guard changes;
- add a KRN repair candidate for target-aware dirty context capture;
- add a KRN repair candidate for generic DB smoke idempotency after fresh volume
  recovery;
- run real V02-01 with a second operator after the target state is clean or
  intentionally scoped.

Not allowed from this proof:

- product-ready claim;
- widened alpha claim;
- second-operator proof claim;
- hiding target dirty context;
- treating skipped frontend verification as passed.

## Candidate Outputs

| Candidate | Reviewability | Evidence | Does not prove |
|---|---|---|---|
| EvalCandidate: target trial evidence should classify target dirty files, not only KRN repo dirty files. | ready | KRN EvidenceBundle reported zero changed files while target repo had 14 modified files. | Does not prove the implementation approach. |
| RepairCandidate: generic `pnpm db:smoke` should be idempotent after fresh Docker volume recovery. | ready | `pnpm db:ready` passed, but `pnpm db:smoke` failed on enum re-create. | Does not prove all DB smokes are affected. |
| TargetRepairCandidate: WILQ SEO backend test contracts should keep Polish marketer wording expectations aligned with source behavior. | ready | Two stale expectations failed before focused test repairs and passed after. | Does not prove frontend verification because node_modules was missing. |

## Next Recommended Action

Do not invent V04.

Choose one of these concrete next actions:

1. Cleanly commit/push the `wilq-seo` target changes after deciding whether the
   broader dirty context belongs to the same target slice.
2. Repair KRN target-aware evidence capture so headless target trials can record
   target changed-file classification.
3. Repair generic KRN `db:smoke` idempotency after fresh Docker volume recovery.
4. Run real V02-01 with a second operator once target inputs and support
   boundary are explicit.
