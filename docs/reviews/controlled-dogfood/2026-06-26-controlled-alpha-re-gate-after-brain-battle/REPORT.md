# Controlled Alpha Re-Gate After Brain Battle Guards

Status: V02-08 completion report.

Date: 2026-06-26

## Executive Verdict

Readiness classification:

```txt
controlled-internal-alpha for technical operators
```

KRN remains controlled-internal-alpha ready for technical operators and bounded
target trials. V02-03 through V02-07 strengthened the guardrails around run
readback, source retention, memory feedback, anti-memory, Codex briefs,
ContextROI, operator readback guidance, and the second-operator trial packet.

This is not product-ready. It is not widened internal alpha. V02-01 still
requires a real second operator, explicit KRN source, target repo, DB mode,
support boundary, and operator transcript.

## Read

- `GOAL.md`
- `PLAN.md`
- `docs/KRN_KERNEL.md`
- `docs/architecture/brain-battle-eval-matrix.md`
- `docs/releases/v0.1.0-alpha.0.md`
- `docs/runbooks/internal-alpha-install.md`
- `docs/runbooks/second-operator-alpha-trial.md`
- `docs/reviews/controlled-dogfood/2026-06-25-internal-alpha-release-gate/REPORT.md`
- `docs/reviews/controlled-dogfood/2026-06-25-internal-alpha-re-gate-after-v01/REPORT.md`
- `docs/reviews/controlled-dogfood/2026-06-25-internal-alpha-runbook-friction/REPORT.md`
- `docs/reviews/controlled-dogfood/2026-06-25-second-operator-trial-packet/REPORT.md`
- `docs/reviews/controlled-dogfood/2026-06-26-run-readback-source-rejection-guards/REPORT.md`
- `docs/reviews/controlled-dogfood/2026-06-26-memory-anti-memory-guards/REPORT.md`
- `docs/reviews/controlled-dogfood/2026-06-26-codex-brief-context-roi-guards/REPORT.md`
- `docs/reviews/controlled-dogfood/2026-06-26-operator-readback-doctor-friction/REPORT.md`
- `docs/reviews/controlled-dogfood/2026-06-26-target-battle-trial-packet-refresh/REPORT.md`

## Gate Inputs

| Gate | Verdict | Evidence |
|---|---|---|
| V01 controlled internal-alpha gate | pass with limits | `2026-06-25-internal-alpha-re-gate-after-v01/REPORT.md` classified KRN as controlled-internal-alpha ready for technical operators and bounded target repos. |
| V02-03 readback/source guards | pass | `eval:brain-battle:smoke` covers run readback proof boundaries and decorative source rejection. |
| V02-04 memory/anti-memory guards | pass | Helped feedback remains non-mutating; stale/hurt feedback creates reviewable candidate semantics only. |
| V02-05 Codex brief / ContextROI guards | pass | Brain-battle smoke includes Codex brief contract and bounded ContextROI behavior. |
| V02-06 operator readback guidance | pass | `krn run show` and help explain DB prerequisites and does-not-prove boundaries. |
| V02-07 second-operator packet | pass as preparation | Runbook now gives four bounded scenarios with context roots, trust exclusions, writes, verification, review burden, and does-not-prove fields. |
| Latest remote CI | pass | GitHub Actions run `28245585125` passed DB ready/smoke, typecheck, tests, Promptfoo smoke, and diff check for commit `6515857`. |
| Local V02-08 verification | pass except local DB | `alpha:verify`, `eval:brain-battle:smoke`, `eval:promptfoo:smoke`, and `git diff --check` passed. Local `pnpm db:ready` failed with `CONNECT_TIMEOUT localhost:54329`. |
| Product readiness | fail / not claimed | No real V02-01 second-operator transcript, no widened target-repo evidence, no product packaging, and no product-ready Memory Brain quality proof. |

## Readiness Classification

```txt
dogfood-only: no
controlled-internal-alpha for technical operators: yes
widened-internal-alpha-deferred: no
not-ready: no
product-ready: no
```

The exact classification is `controlled-internal-alpha for technical operators`.

Why:

- V01 already cleared this narrow readiness gate after target read-model repair.
- V02 adds deterministic guard coverage and operator-facing packet clarity.
- The current source workspace and runbook path remain usable for technical
  operators who can run pnpm, Docker/Postgres, and bounded target trials.

Why not widened internal alpha:

- V02-01 still lacks a real second-operator transcript.
- Local DB was not reachable in this shell for V02-08, even though remote CI DB
  proof is green.
- The alpha still depends on source-workspace usage, not npm/global packaging.
- Target trials remain bounded and technical, not arbitrary-repo product use.

## Blockers

| Blocker | Blocks | Evidence | Next allowed action |
|---|---|---|---|
| No real V02-01 second-operator transcript | widened alpha and stronger operator-usability claim | `GOAL.md`, `PLAN.md`, second-operator runbook, V02-07 report | Run the checked-in trial packet with a real operator. |
| Local DB unavailable in this shell | current-shell DB truth for V02-08 | `pnpm db:ready` failed with `CONNECT_TIMEOUT localhost:54329` | Start local Postgres or rely only on remote CI DB proof until local DB is reachable. |
| Alpha tag predates V01/V02 evidence | using `v0.1.0-alpha.0` as newest state | release notes state the tag predates later V01 target evidence and target read-model repair | Ask operator before moving or creating any alpha tag. |
| No widened target-repo sample set | arbitrary target repo claim | V01/V02 reports are bounded trials and guard expansions | Run more bounded target trials before widening. |
| No product distribution surface | npm/global/product install claim | ADR/release notes keep packages private and source-workspace only | Keep source-workspace alpha until packaging is explicitly authorized. |

## What V02-03 Through V02-07 Improved

- Run readback now has deterministic proof-vs-non-proof guard coverage.
- Decorative source retention is rejected by deterministic source review
  signals.
- Memory feedback output states no Memory Core mutation and guards stale/hurt
  paths as reviewable candidate semantics only.
- Codex brief output and ContextROI have deterministic guard coverage.
- Operator readback friction is lower because missing DB guidance names the next
  command and proof boundary.
- The second-operator packet now starts from one of four bounded trial
  scenarios instead of asking the operator to invent scope.

## What This Does Not Prove

- V02-01 was completed.
- A second human operator can complete the flow unaided.
- KRN is product-ready.
- KRN can handle arbitrary repos or broad target ingestion.
- Local DB is reachable in this shell.
- The alpha tag points to the newest guarded `main`.
- Codex follows rendered briefs.
- Promptfoo proves KRN behavior.
- Memory feedback improves future activation quality at scale.
- Activation/source selection is optimal for every target repo.

## Command Evidence

| Command / proof | Result | What it proves | What it does not prove |
|---|---|---|---|
| `git fetch --prune` | passed | Local remote refs were refreshed before V02-08. | Does not prove readiness. |
| `git status --short --branch` | passed, clean before V02-08 edits | Work started from clean `main...origin/main`. | Does not prove behavior. |
| `gh run view 28245585125 --json status,conclusion,headSha,url,jobs` | passed, success | Latest pushed V02-07 commit `6515857` has green remote CI including DB ready/smoke. | Does not prove local DB in this shell or V02-08 commit CI. |
| `pnpm alpha:verify` | passed | Local source workspace typecheck, full tests, and preview doctor pass. | Does not prove DB-backed runtime because doctor ran without `KRN_DATABASE_URL`. |
| `pnpm eval:brain-battle:smoke` | passed | Current deterministic brain-battle guards pass locally. | Does not prove product readiness or arbitrary target quality. |
| `pnpm eval:promptfoo:smoke` | passed, 2/2 | Promptfoo adapter/config/provider smoke works. | Does not execute KRN behavior. |
| `pnpm db:ready && pnpm db:smoke` | failed at `pnpm db:ready` | Local DB is not reachable in this shell. | Does not prove DB schema is broken; remote CI DB proof passed. |
| `git diff --check` | passed before report edits | Working diff had no whitespace errors before V02-08 report creation. | Does not prove readiness. |

## DB Status

Local DB:

```txt
unverified / unavailable
```

`pnpm db:ready` failed with:

```txt
Postgres/migrations: failed (write CONNECT_TIMEOUT localhost:54329)
Brain store readiness: blocked (migration readiness failed)
```

Remote CI DB:

```txt
verified for commit 6515857
```

GitHub Actions run `28245585125` passed `DB ready`, `Drizzle check`, `DB smoke`,
and `Diff check`.

## Decision

Allowed now:

- continue controlled technical operator trials from source workspace;
- use the refreshed V02-01 second-operator packet;
- run bounded target trials with explicit trust exclusions and review-burden
  fields;
- keep adding deterministic guards when dogfood exposes a real boundary gap.

Not allowed from this gate:

- product-ready claim;
- widened internal alpha claim;
- fake V02-01 proof;
- npm/global distribution;
- dashboard/API/MCP/worker/source-crawler expansion;
- moving or creating alpha tags without explicit operator authorization.

## Candidates Proposed

| Candidate | Reviewability | Evidence | Does not prove |
|---|---|---|---|
| EvalCandidate: controlled alpha re-gates should require latest remote CI plus local `alpha:verify`, brain-battle smoke, Promptfoo smoke, and explicit DB truth classification. | ready | V02-08 command evidence and DB split. | Does not prove future gates will pass. |
| MemoryCandidate: do not upgrade controlled-alpha readiness to widened-alpha without a real second-operator transcript. | ready | V02-01 blocker, V02-07 packet, this re-gate. | Does not prove the second-operator trial will succeed. |

No MemoryRecord, AntiMemoryRecord, SourceClaim, SourceDecision, or final eval
state was mutated.

## Next Recommended Action

Run `V02-01 — Real Second-Operator Controlled Alpha Trial` using
`docs/runbooks/second-operator-alpha-trial.md` when the operator provides:

```txt
operator:
KRN source:
target repo:
DB mode:
support boundary:
operator transcript:
```

If the operator does not provide a second-operator setup, the V02 rescope queue
should stop here rather than inventing another product-forward slice.
