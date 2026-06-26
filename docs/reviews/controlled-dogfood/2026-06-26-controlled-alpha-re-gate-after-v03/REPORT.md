# Controlled Alpha Re-Gate After V03

Status: V03-06 completion report.

Date: 2026-06-26.

## Executive Verdict

Readiness classification:

```txt
controlled-internal-alpha for technical operators
```

V03 strengthens the same narrow readiness class rather than widening it. KRN is
still appropriate for technical source-workspace operators who can run pnpm,
Docker/Postgres, local DB smokes, and bounded target-repo trials. It is not
product-ready, not npm/global-ready, and not proven as a real second-operator
trial.

The major V03 improvement is that the biggest V02 caveat is now repaired:
current-shell local DB bootstrap and target-like DB-backed replay are proven and
operator-visible.

## Read

- `GOAL.md`
- `PLAN.md`
- `docs/KRN_KERNEL.md`
- `docs/reviews/controlled-dogfood/2026-06-26-local-db-bootstrap-doctor-recovery/REPORT.md`
- `docs/reviews/controlled-dogfood/2026-06-26-target-fixture-battle-harness/REPORT.md`
- `docs/reviews/controlled-dogfood/2026-06-26-target-owner-file-recall-below-roots/REPORT.md`
- `docs/reviews/controlled-dogfood/2026-06-26-target-evidence-readback-loop/REPORT.md`
- `docs/reviews/controlled-dogfood/2026-06-26-target-memory-usefulness-loop/REPORT.md`
- `docs/reviews/controlled-dogfood/2026-06-26-first-run-operator-friction-repair/REPORT.md`
- `docs/reviews/controlled-dogfood/2026-06-26-controlled-alpha-re-gate-after-brain-battle/REPORT.md`
- `docs/runbooks/local-brain-store.md`
- `docs/runbooks/second-operator-alpha-trial.md`

## Gate Inputs

| Gate | Verdict | Evidence |
|---|---|---|
| V02 re-gate baseline | pass with limits | V02-08 classified KRN as controlled-internal-alpha for technical operators, with local DB unavailable and V02-01 still blocked. |
| V03-00 local DB bootstrap | pass | `pnpm db:ready` failure was turned into explicit recovery guidance; Docker Postgres recovery then proved 14/14 migrations, pgvector, and DB smoke in the current shell. |
| V03-01 target fixture harness | pass | Target fixture now carries source seeds and trust exclusions; target harness smoke readbacks them. |
| V03-02 owner-file recall | pass with boundary | Target read model supports explicit owner files below roots and reports when exact owner-file signal is unavailable. No crawler or fake inference was added. |
| V03-03 target evidence/readback | pass | Target harness smoke writes/readbacks evidence, review, and feedback while preserving `default_template/not_run` command proof boundaries. |
| V03-04 memory usefulness | pass with limits | Target harness smoke seeds a MemoryRecord, verifies inclusion, records `MemoryApplication outcome=helped`, readbacks positive feedback, and reports no automatic MemoryRecord mutation. |
| V03-05 operator friction | pass | `krn doctor` and runbooks now name the concrete target-harness surfaces guarded before V02-01. |
| Latest remote CI through V03-05 | pass | GitHub Actions runs `28247396470`, `28248078429`, `28248562125`, `28248885391`, `28249248623`, and `28249761851` passed for V03-00 through V03-05. |
| Product readiness | fail / not claimed | No real V02-01 second-operator transcript, no external target trial, no distribution claim, no product-quality proof for arbitrary repos. |

## Readiness Classification

```txt
dogfood-only: no
controlled-internal-alpha for technical operators: yes
widened-internal-alpha-deferred: yes
product-ready: no
```

The exact classification remains:

```txt
controlled-internal-alpha for technical operators
```

Why it is stronger than V02:

- local DB recovery is now operator-visible and current-shell proven;
- target fixture planning has source seeds, owner files, and trust exclusions;
- target-like plan/evidence/review/feedback readback is proven through the DB
  smoke;
- target-like memory usefulness can be measured without automatic memory
  promotion;
- first-run runbooks now point to the exact smokes a technical operator should
  run before V02-01.

Why it is not widened internal alpha:

- V02-01 still lacks a real second operator, target repo, support boundary, and
  transcript;
- target harness proof is local fixture proof, not external repo proof;
- KRN still runs from the source workspace, not a packaged npm/global install;
- target execution quality on arbitrary repositories has not been proven;
- memory usefulness is measured in a controlled fixture, not at product scale.

## Product State After V03

| Area | State | Evidence | Limit |
|---|---|---|---|
| Local DB bootstrap | materially improved | V03-00 recovery and DB smoke proof. | Other machines still need real operator proof. |
| Target fixture planning | guarded | V03-01 source seeds/trust exclusions. | Fixture only. |
| Target owner files | guarded when explicit | V03-02 ownerFiles read-model path. | No crawler or implicit inference. |
| Evidence/readback | guarded | V03-03 target evidence/review/feedback readback. | Fixture commands are not run. |
| Memory usefulness | measurable | V03-04 helped feedback readback. | Seeded smoke memory, not product-quality selection proof. |
| Operator readiness | clearer | V03-05 doctor/runbook wording. | Does not replace second-operator trial. |

## Blockers

| Blocker | Blocks | Evidence | Next allowed action |
|---|---|---|---|
| No real V02-01 second-operator transcript | widened alpha and operator-usability claim | `GOAL.md`, `PLAN.md`, second-operator runbook, all V03 reports | Run V02-01 with a real operator and explicit support boundary. |
| No external target repo trial after V03 | arbitrary repo/product claim | V03 target harness reports classify proof as local fixture only | Use the refreshed trial packet on one bounded external repo. |
| No package/distribution surface | npm/global install claim | V03 kept source-workspace operation only | Keep source-workspace alpha unless packaging is explicitly authorized. |
| No product-scale memory/activation proof | product-ready brain claim | V03 memory usefulness is smoke-scoped and controlled | Collect more real target runs before changing readiness class. |

## Decision

Allowed now:

- run V02-01 with a real second operator using current `main`;
- run bounded target trials from the source workspace;
- require these preflight commands before a target trial:

```sh
pnpm db:ready
pnpm db:smoke:init-connect
pnpm db:smoke:target-repo-harness
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm krn doctor
```

- continue small source repairs only if a real trial exposes a concrete gap.

Not allowed from this gate:

- product-ready claim;
- widened internal alpha claim;
- fake V02-01 proof;
- npm/global distribution claim;
- alpha tag movement without explicit operator authorization;
- dashboard/API/MCP/worker/source-crawler expansion;
- treating target fixture proof as external target proof.

## Next Recommended Action

Run the real second-operator controlled alpha trial:

```txt
V02-01 — Real Second-Operator Controlled Alpha Trial
```

Required input remains:

```txt
operator:
KRN source: current main
target repo:
DB mode: local Docker/Postgres or preview only
support boundary:
operator transcript:
```

If those inputs are not available, stop product-forward autopilot here rather
than inventing another local substitute.

## Command Evidence

| Command / proof | Result | What it proves | What it does not prove |
|---|---|---|---|
| `git status --short --branch` | clean before V03-06 edits | V03-06 started after V03-05 was committed, pushed, and clean. | Does not prove readiness. |
| `gh run list --branch main --limit 8` | passed | V03-00 through V03-05 commits have successful KRN CI runs. | Does not prove this V03-06 docs commit CI before push. |
| `pnpm typecheck` through `rtk proxy` | passed | Workspace TypeScript still compiles after V03-06 docs/plan updates. | Does not prove product readiness. |
| `pnpm test` | passed | Workspace tests still pass after V03-06 docs/plan updates. | Does not prove V02-01. |
| `pnpm eval:brain-battle:smoke` | passed | Deterministic brain-battle smoke still passes. | Does not prove arbitrary target quality. |
| `pnpm eval:promptfoo:smoke` | passed, 2/2 | Promptfoo adapter smoke still passes; shutdown logged the known telemetry timeout after writing output. | Does not execute full KRN behavior. |
| `git diff --check` | passed | Diff has no whitespace errors. | Does not prove semantic correctness. |

## What This Does Not Prove

- V02-01 was completed.
- A second human operator can complete the flow unaided.
- KRN is product-ready.
- KRN can handle arbitrary repositories.
- Target fixture commands executed.
- Memory selection quality is product-scale.
- Promptfoo proves KRN behavior.
- A packaged distribution is ready.

## Candidates Proposed

| Candidate | Reviewability | Evidence | Does not prove |
|---|---|---|---|
| TrialCandidate: V02-01 should be attempted on current `main` with DB smokes, target harness smoke, and doctor output recorded before target work. | ready | V03-00 through V03-05 evidence and runbook updates. | Does not prove the real operator can complete the trial. |
| MemoryCandidate: Target fixture proof must not be upgraded to external target proof without a real repo transcript. | ready | V03 reports repeatedly classify target harness evidence as local fixture proof. | Does not prove future target fixtures are insufficient. |

No MemoryRecord, AntiMemoryRecord, SourceClaim, SourceDecision, or final eval
state was mutated by this re-gate.
