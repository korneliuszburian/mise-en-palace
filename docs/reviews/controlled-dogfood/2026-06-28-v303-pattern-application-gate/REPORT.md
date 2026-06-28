# V303 Pattern Application Gate For Active Slices

Status: controlled implementation report.

Date: 2026-06-28

## Executive Verdict

V303 turns Pattern Brain coverage into execution pressure. Future non-trivial
KRN slices now have a documented gate:

```txt
before coding:
  query helped retained patterns
  select or reject relevant expected-use patterns

after verification:
  classify selected or missing patterns
```

This is the smallest useful step after V302. It does not add semantic ranking,
MCP, API, dashboard, crawler, or Memory Core mutation.

## Pattern Application

Selected patterns:

| Pattern | Expected use | Outcome | Evidence |
|---|---|---|---|
| `pattern:source-to-decision-retention-gate` | Keep V303 as mechanism -> decision -> consumer -> falsifier, not a vague rule. | helped | `docs/runbooks/pattern-intake.md`; this report |
| `pattern:evidence-proof-non-proof-boundary` | State what coverage closure and the new gate do not prove. | helped | this report; root `PLAN.md` falsifier |
| `pattern:active-context-compact-current-truth` | Continue from root V303 instead of stale pasted V05. | helped | `GOAL.md`; `PLAN.md`; `PLANS.md` |
| `pattern:brain-knowledge-read-only-ui-boundary` | Reuse read-only `knowledge cards` query instead of adding UI/API/MCP. | helped | `docs/runbooks/pattern-intake.md` command |

Rejected/deferred:

| Pattern | Reason |
|---|---|
| `pattern:target-repo-write-authority-boundary` | Not a target write slice. |
| `pattern:untrusted-context-warning-boundary` | No external context rendering changed. |
| `pattern:ts-boundary-unknown-first-result-state` | No TypeScript domain model changed. |

## Change

Changed:

```txt
GOAL.md
PLAN.md
docs/runbooks/pattern-intake.md
packages/harness/src/activePlanInvariants.test.ts
PLANS.md
```

Added:

```txt
docs/reviews/controlled-dogfood/2026-06-28-v303-pattern-application-gate/REPORT.md
```

## Gate Contract

The new `Pattern Application Gate` in `docs/runbooks/pattern-intake.md`
requires:

```txt
selected_patterns
rejected_or_deferred_patterns
pattern_application
```

It also requires querying helped retained patterns:

```sh
pnpm --filter @krn/cli krn knowledge cards \
  --catalog-file docs/brain-knowledge/catalog.json \
  --usefulness-outcome helped \
  --text "<slice topic>"
```

## What This Proves

- The active runbook now gives operators a concrete pre/post pattern
  application gate.
- Root `GOAL.md` and `PLAN.md` point future non-trivial slices at the gate.
- `activePlanInvariants` protects the gate from disappearing silently.

## What This Does Not Prove

- Future Codex runs will always apply patterns correctly.
- Semantic pattern ranking is good.
- Pattern application improves every future implementation.
- KRN is product-ready.
- Web UI/API/MCP/dashboard work should start.

## Source-To-Decision

Source:

- V302 coverage closure report;
- `krn knowledge cards` helped/none readback;
- `source-to-decision` skill continuous pattern gate;
- `docs/runbooks/pattern-intake.md`.

Mechanism:

- retained patterns are useful only when selected and applied during execution;
- usefulness feedback alone does not force implementation decisions;
- a small runbook/invariant gate is enough to require pattern selection without
  adding a product surface.

KRN implication:

- every future non-trivial KRN slice should begin with helped-pattern selection
  and end with pattern application classification.

Decision:

- add the Pattern Application Gate to `docs/runbooks/pattern-intake.md`;
- guard it through `activePlanInvariants`;
- keep UI/API/MCP/dashboard/source crawler deferred.

Consumer:

- future active slices;
- future source/course/paper condensation;
- future skills and Codex adapter brief work.

Falsifier:

- a future non-trivial source slice proceeds without selected/rejected pattern
  application evidence while invariants still pass.

## Next Recommended Action

Open V304:

```txt
Pattern-Gated Source Slice Trial
```

Reason:

```txt
The next proof should use the new gate on a real bounded source change, not add
more docs. If the gate adds friction or misses relevant patterns, repair the
gate from evidence.
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `git fetch --prune && git status --short --branch && git log --oneline -n 6` | passed | local state was clean and current before V303 | future CI |
| `krn knowledge cards --usefulness-outcome helped --json` | passed, 11 | helped pattern set is available for gate selection | ranking quality |
| `krn knowledge cards --usefulness-outcome none --json` | passed, 0 | no current retained pattern lacks feedback | future cards will have feedback |
| `krn knowledge cards --text "TypeScript" --json` | passed, 3 | topic query can surface helped patterns with proof boundaries | semantic recall quality |
| `pnpm --filter @krn/harness test -- activePlanInvariants patternChainInvariants contextHygieneInvariants brainKnowledgeReadModelInvariants brainKnowledgeReadModel` | passed with `TMPDIR=/home/krn/coding/krn/.tmp-codex` | pattern/runbook invariants pass with the new gate | product readiness |
| `pnpm -r --workspace-concurrency=1 --if-present typecheck` | passed with `TMPDIR=/home/krn/coding/krn/.tmp-codex` | TypeScript packages compile | runtime DB truth or product usefulness |
| `pnpm test` | passed with `TMPDIR=/home/krn/coding/krn/.tmp-codex` | workspace tests pass locally | remote CI or future source-slice usefulness |
| `git diff --check` | passed | no whitespace errors in the diff | semantic correctness |

Note: the default `/tmp` path failed Node writes with `errno -122`, so local
verification used a writable temp directory outside the repo. That proves the
test suite passes with a valid temp directory; it does not prove the host `/tmp`
quota/state is healthy.
