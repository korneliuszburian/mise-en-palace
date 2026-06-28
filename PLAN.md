# KRN Active Plan

Status: active compact root plan. Date: 2026-06-27.

Repository: `/home/krn/coding/krn/active/mise-en-palace`.

Root `PLAN.md` is the compact product single source of truth. Detailed
continuous execution lives in `PLANS.md`.

Do not create another parallel roadmap.

## Current Product State

```txt
controlled-internal-alpha for technical operators: yes / stronger
product-ready: no
widened internal alpha: no
V02-01 real second-operator proof: blocked/deferred
active stream: V295 Source-To-Decision Retention Gate Usefulness Feedback
current task: V295-00 Source-To-Decision Retention Gate Usefulness Feedback
```

## Compact Completed Checkpoints

Detailed history stays in `PLANS.md`.

```txt
V02..V47: target/evidence/DB/activation/memory/source/internal-alpha complete.
V48..V99: source-to-decision, CI/eval, pattern matrix, TypeScript/security,
          source-map, skill, brain-battle, and context-hygiene guards complete.
V100..V255: active-surface, handoff, PLANS freshness, pattern-gate,
           TypeScript, source-map, ADR, skill, CI/eval, onboarding, infra,
           worker, security permission-boundary, root-plan headroom, and
           re-gate plus source-usefulness readback/producer and preview
           dogfood plus persisted readback dogfood and repo-root path
           normalization/readback guards plus best-pattern usefulness closure
           and closure dogfood plus TS best-pattern application and sibling
           package path normalization plus activation abstention re-gate,
           abstention diagnostics/readback, current-state activation seed, and
           default connected-project resolution, and project resolution
           readback plus external TypeScript best-pattern intake,
           finite-state exhaustiveness application, Codex ExecPlan source
           decision guard, best-pattern surface re-gate, and source-decision
           owner-file seed repair plus observe-reflect sequencing guard and
           skill owner-file seed repair, activation surface re-gate,
           budget-priority guard, product-readiness re-gate, normalized target
           substrate/repair/replay baseline, and active ledger condensation
           complete.
```

## Active Stream

### V295 Source-To-Decision Retention Gate Usefulness Feedback

Goal:

Add explicit usefulness feedback for the source-to-decision retention gate if
recent evidence shows it materially helped research/pattern condensation.

Current finding:

```txt
V294 marked skill routing as helped and reduced no-feedback cards from 8 to 7.
The next highest-ROI no-feedback pattern is source-to-decision retention,
because it governs research, papers, courses, and best-pattern intake.
```

Current action:

```txt
Execute V295-00: inspect recent source/pattern intake evidence and add
usefulness feedback for `pattern:source-to-decision-retention-gate` only if it
can be tied to a real helped/neutral/noise/stale outcome. Do not add new source
intake, UI/API/MCP, dashboard, semantic ranking, or Memory Core mutation.
```

Primary consumer:

```txt
brain knowledge research-condensation usefulness gate.
```

Falsifier:

```txt
Source-to-decision usefulness cannot be supported by evidence, or feedback is
added without proof boundaries and does-not-prove.
```

## Pattern Gate

For non-trivial infra, harness, CI/eval, Codex-surface, TypeScript,
target-workflow, security, operator-UX, or research/paper/course-driven work,
apply: source -> mechanism -> KRN implication -> decision/rejection -> consumer
-> falsifier.

## External Input Blocker

Status: deferred boundary, not the current internal stream.

V02-01 still requires real second-operator inputs:

```txt
operator:
KRN source:
target repo:
DB mode:
support boundary:
operator transcript:
```

Do not substitute self/headless scenarios for V02-01.

## Hard Non-Goals

Do not build or claim: fake V02-01 proof, product-ready status, widened
internal alpha, dashboard, API server, MCP server, worker daemon, source
crawler, Research Foundry, broad eval platform, generic multi-agent system,
runtime markdown memory, hidden semantic hooks, living target repo writes
without explicit scope, large `AGENTS.md` expansion, or parallel roadmap.

## Verification Policy

Use the narrowest relevant verification for each slice.

If local Vitest or workspace tests fail with a temporary-directory write error,
set `TMPDIR` to a path outside this repository, for example:

```sh
TMPDIR=/home/krn/.cache/krn-tmp pnpm test
```

Do not set `TMPDIR` under the repo checkout: CLI boundary tests rely on
outside-workspace temporary directories.

Docs/plan-only changes: `git diff --check`.
Source changes: `pnpm typecheck`, `pnpm test`, `git diff --check`.
DB/eval-affecting changes: `pnpm db:ready`, `pnpm db:smoke`,
`pnpm eval:promptfoo:smoke`.

After each bounded slice, commit, push, and confirm CI when appropriate. Use a
full `git rev-parse HEAD` SHA for `gh run list --commit`; if that is empty, use
branch readback and match `headSha`. Do not claim missing CI from short-SHA
lookup alone.
