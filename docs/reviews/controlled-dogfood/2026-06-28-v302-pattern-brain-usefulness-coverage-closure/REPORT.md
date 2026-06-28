# V302 Pattern Brain Usefulness Coverage Closure Gate

Status: controlled closure gate.

Date: 2026-06-28

## Executive Verdict

The current retained Pattern Brain has complete usefulness-feedback coverage:

```txt
retained patterns with helped feedback: 11
retained patterns without feedback: 0
```

This is a real milestone. KRN now has a searchable, read-only retained-pattern
surface where every current pattern has at least one bounded usefulness outcome.

This does not mean KRN has a full autonomous pattern brain. The next product
gap is application: every non-trivial slice should select relevant helped
patterns before implementation and report which were used, missing, stale, or
noise.

## Current Capability

KRN can now:

- retain patterns with source, mechanism, KRN implication, consumer, falsifier,
  and proof limits;
- render retained patterns through `krn knowledge cards`;
- filter by `--usefulness-outcome helped`;
- detect no-feedback backlog with `--usefulness-outcome none`;
- generate a read-only static HTML preview;
- keep pattern knowledge read-only with `Mutation: none`;
- preserve proof/non-proof boundaries for pattern search results.

## Current Limits

KRN still cannot honestly claim:

- automatic best-pattern enforcement on every slice;
- semantic ranking quality;
- full research condensation from papers/courses;
- web product readiness;
- DB-backed knowledge search product;
- prompt-injection resistance;
- product-ready Memory Brain.

## Readback Proof

Commands:

```sh
pnpm --silent --filter @krn/cli krn knowledge cards \
  --catalog-file docs/brain-knowledge/catalog.json \
  --usefulness-outcome helped --json

pnpm --silent --filter @krn/cli krn knowledge cards \
  --catalog-file docs/brain-knowledge/catalog.json \
  --usefulness-outcome none --json

pnpm --silent --filter @krn/cli krn knowledge cards \
  --catalog-file docs/brain-knowledge/catalog.json \
  --text "TypeScript" --json
```

Results:

```txt
helped: 11
none: 0
TypeScript query: 3 cards
```

TypeScript query returned:

```txt
pattern:codex-skill-progressive-disclosure-routing
pattern:source-to-decision-retention-gate
pattern:ts-boundary-unknown-first-result-state
```

The result proof boundaries still state that search does not prove DB truth,
ranking quality, retained-pattern completeness, mutation, or product readiness.

## Pattern Coverage

Current helped patterns:

```txt
pattern:active-context-compact-current-truth
pattern:brain-knowledge-read-only-ui-boundary
pattern:codex-execplan-living-validation-loop
pattern:codex-goal-continuation-evidence-contract
pattern:codex-prompt-task-contract-proof-boundary
pattern:codex-skill-progressive-disclosure-routing
pattern:evidence-proof-non-proof-boundary
pattern:source-to-decision-retention-gate
pattern:target-repo-write-authority-boundary
pattern:untrusted-context-warning-boundary
pattern:ts-boundary-unknown-first-result-state
```

## Product Decision

Do not add more retained patterns by default.

Do not jump to MCP, API, dashboard, crawler, or semantic ranking.

The next highest-value surface is a pattern application gate:

```txt
before each non-trivial slice:
  query relevant helped patterns
  select 1-5 expected-use patterns
  state how each pattern should affect the implementation

after the slice:
  classify selected patterns as helped / neutral / noise / missing / stale
  add or update usefulness evidence only when supported
```

This converts Pattern Brain from searchable knowledge into execution pressure.

## Source-To-Decision

Source:

- V288..V301 usefulness feedback loop;
- `krn knowledge cards` readback;
- static read-only brain knowledge preview;
- root continuation and pattern gate rules.

Mechanism:

- pattern cards help only when selected and applied before implementation;
- usefulness feedback closes review gaps but does not enforce pattern use;
- an application gate keeps future work grounded without expanding product
  surfaces.

KRN implication:

- every non-trivial future slice should run a bounded pattern selection step
  before coding and report pattern application after verification.

Decision:

- open V303 Pattern Application Gate For Active Slices.

Consumer:

- future KRN implementation slices;
- future research/course/paper condensation;
- future skills and Codex adapter brief work.

Falsifier:

- future slices keep passing without selecting/applying relevant helped
  patterns, or selected patterns add review burden without changing decisions.

## Next Recommended Action

Open V303:

```txt
Pattern Application Gate For Active Slices
```

Expected scope:

- add a compact plan/report convention or small readback helper if needed;
- no new broad product surface;
- no semantic ranking;
- no API/MCP/dashboard;
- no source crawler;
- no Memory Core mutation.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `git status --short --branch` | passed | worktree clean before V302 | future CI status |
| `krn knowledge cards --usefulness-outcome helped --json` | passed, 11 | all current retained patterns have helped feedback | pattern completeness forever |
| `krn knowledge cards --usefulness-outcome none --json` | passed, 0 | no current retained pattern lacks feedback | future cards will have feedback |
| `krn knowledge cards --text "TypeScript" --json` | passed, 3 | read-only search can surface relevant patterns with proof boundaries | ranking quality |

