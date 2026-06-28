# V291 Brain Knowledge Usefulness Outcome Filter Dogfood

Status: complete.

## Executive Verdict

The usefulness outcome filter helped answer the bounded operator question:
which retained Codex workflow patterns helped most recently?

`--usefulness-outcome helped` reduced rereads by returning exactly the three
patterns with latest feedback from V288 instead of requiring manual scanning
across all 11 retained pattern cards and prior reports. The result is useful as
a read-only operator selection aid.

The dogfood also exposed the next gap: 8 retained pattern cards currently have
no usefulness feedback. The static preview can label them as `Usefulness: none`,
but the CLI filter only accepts concrete feedback outcomes. KRN should next make
missing usefulness feedback explicitly discoverable before adding more pattern
cards, UI/API/MCP, or dashboard surfaces.

## Scope

Question:

```txt
Which retained Codex workflow patterns helped most recently?
```

Inputs:

- `docs/brain-knowledge/catalog.json`;
- `docs/brain-knowledge/usefulness-feedback/v288-external-codex-workflow-patterns.json`;
- `.local-lab/brain-knowledge-preview.html`;
- root `GOAL.md`, `PLAN.md`, and `PLANS.md`.

No package source was modified.

## Readback Results

| Query | Result | Operator value |
|---|---:|---|
| all cards | 11 cards | Establishes catalog size for comparison. |
| `--usefulness-outcome helped` | 3 cards | Directly isolates recently useful retained patterns. |
| `--usefulness-outcome noise` | 0 cards | No known noise feedback in current catalog. |
| `--usefulness-outcome neutral` | 0 cards | No known neutral feedback in current catalog. |
| `--usefulness-outcome stale` | 0 cards | No known stale feedback in current catalog. |
| `--usefulness-outcome unknown` | 0 cards | No known unknown feedback in current catalog. |

Helped cards:

```txt
pattern:codex-execplan-living-validation-loop
pattern:codex-goal-continuation-evidence-contract
pattern:codex-prompt-task-contract-proof-boundary
```

The static preview also contains `data-usefulness-outcome="none"` cards and a
`Usefulness: none` option. This helps browser-side review, but the CLI does not
yet expose an equivalent missing-feedback readback.

## Usefulness Assessment

| Area | Verdict | Evidence | Next implication |
|---|---|---|---|
| Operator selection | helped | `helped` filter returned the 3 V288-proven cards. | Keep using outcome filtering before adding new cards. |
| Review burden | reduced | Avoided scanning 11 cards plus report history for the same answer. | Add missing-feedback discovery so unproven cards are visible. |
| Pattern brain quality | partial | Feedback exists for 3/11 cards. | Do not call the catalog fully useful until no-feedback coverage is tracked. |
| UI/search readiness | mixed | Static preview labels `none`; CLI cannot query no-feedback cards directly. | Open a bounded read-only missing-feedback filter/reporting slice. |

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `git fetch --prune && git status --short --branch && git log --oneline -n 8` | passed | Local branch was clean and aligned with `origin/main` before the slice. | Does not prove remote CI for this new report. |
| `pnpm --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --usefulness-outcome helped --json` | passed | CLI returns the 3 latest `helped` feedback cards. | Does not prove ranking, semantic search, DB truth, or product readiness. |
| `pnpm --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --usefulness-outcome noise --json` | passed | CLI can filter another outcome and returns zero current cards. | Does not prove there are no noisy patterns in reality, only no recorded noise feedback. |
| `pnpm --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --usefulness-outcome neutral --json` | passed | CLI can filter neutral feedback and returns zero current cards. | Does not prove unfeedbacked cards are useful or neutral. |
| `pnpm --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --usefulness-outcome stale --json` | passed | CLI can filter stale feedback and returns zero current cards. | Does not prove no retained pattern is stale. |
| `pnpm --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --usefulness-outcome unknown --json` | passed | CLI can filter unknown feedback and returns zero current cards. | Does not prove unknown usefulness is impossible; missing feedback is a separate state. |
| `rg -n "Usefulness: none\|data-usefulness-outcome=\"none\"\|usefulnessOutcomeFilter" .local-lab/brain-knowledge-preview.html` | passed | Static preview can label and filter cards with no usefulness feedback. | Does not prove CLI parity or browser UX polish. |

Note: piping unsilenced `pnpm ... --json` output directly to `jq` fails because
`pnpm` emits its own command banner before JSON. `pnpm --silent ... --json`
produces clean JSON for readback scripts.

## What This Proves

- The usefulness outcome filter reduces rereads for recently helpful retained
  patterns.
- The three external Codex workflow patterns from V288 are now discoverable as
  recently useful without opening their reports.
- The current pattern brain can retain and retrieve usefulness feedback through
  a read-only operator surface.

## What This Does Not Prove

- Product readiness.
- Semantic ranking quality.
- That all retained cards are useful.
- That cards without feedback are bad.
- That browser UI/API/MCP/dashboard work should start now.
- That this knowledge came from live DB state.

## Pattern-Brain Gap

Current state:

```txt
retained pattern cards: 11
cards with latest helped feedback: 3
cards with no usefulness feedback: 8
```

The next useful step is not more source intake. It is missing-feedback
readback, so KRN can ask: which retained patterns have not yet proven usefulness
in a real slice?

## Source-To-Decision

- Source: V290 usefulness outcome filter and V291 readback dogfood.
- Mechanism: usefulness filtering helps only when it also exposes what is not
  yet measured.
- KRN implication: a pattern brain must track no-feedback coverage, not only
  successful `helped` cases.
- Decision: open V292 Brain Knowledge Missing Usefulness Feedback Readback.
- Does not prove: missing feedback means a card is useless, stale, or invalid.
- Consumer: V292 missing-feedback readback/filter slice.
- Falsifier: operators can already discover no-feedback retained patterns from
  CLI in a compact way without scanning all cards or relying on browser-only
  static preview state.

## Next Recommended Action

Open V292: Brain Knowledge Missing Usefulness Feedback Readback.

Add the smallest read-only CLI/harness path to discover retained pattern cards
without usefulness feedback. Do not add new source intake, API, MCP, dashboard,
semantic ranking, or Memory Core mutation.
