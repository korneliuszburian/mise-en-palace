# V290 Brain Knowledge Usefulness Outcome Filter

Status: complete.

## Executive Verdict

V290 makes latest pattern usefulness outcomes filterable through the existing
read-only brain knowledge CLI/static preview. Operators can now isolate retained
patterns whose latest feedback is `helped`, `neutral`, `noise`, `stale`, or
`unknown` without DB schema, API, MCP, dashboard, ranking, or Memory Core
mutation.

This moves the pattern brain from "cards can show feedback" to "operators can
find cards by feedback outcome."

## Scope

Changed:

- `BrainKnowledgeSearchFilter` now accepts `usefulnessOutcome`;
- `parseKnowledgeArgs` accepts `--usefulness-outcome`;
- `runKnowledgeCardsCommand` renders a static HTML usefulness filter;
- generated cards include `data-usefulness-outcome`;
- tests cover parser rejection, harness filtering, CLI JSON filtering, and DOM
  smoke filtering.

No new external sources were added.

## TypeScript Boundary

Boundary classification: CLI argument and in-memory readback filter.

Pattern applied:

```txt
pattern:ts-boundary-unknown-first-result-state
```

The CLI narrows `--usefulness-outcome` to the explicit union:

```txt
helped | neutral | noise | stale | unknown
```

Unknown values are rejected before reaching command execution.

## Readback Proof

Command:

```sh
pnpm --filter @krn/cli krn knowledge cards \
  --catalog-file docs/brain-knowledge/catalog.json \
  --usefulness-outcome helped \
  --json
```

Result:

```txt
3 cards:
- pattern:codex-execplan-living-validation-loop
- pattern:codex-goal-continuation-evidence-contract
- pattern:codex-prompt-task-contract-proof-boundary
```

Static preview proof:

```txt
.local-lab/brain-knowledge-preview.html includes:
- usefulnessOutcomeFilter
- Usefulness: helped
- Usefulness: none
- data-usefulness-outcome="helped"
- rendered Usefulness details
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `pnpm --filter @krn/harness test -- brainKnowledgeReadModel` | passed | Harness search filters by latest usefulness outcome. | Does not prove usefulness scoring quality. |
| `pnpm --filter @krn/cli test -- parseKnowledgeArgs runKnowledgeCardsCommand` | passed | CLI args, JSON filter, and HTML smoke cover usefulness outcome filtering. | Does not prove browser polish or product search. |
| `pnpm --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --usefulness-outcome helped --json` | passed | Operator can isolate helped retained patterns through CLI readback. | Does not prove semantic ranking or DB truth. |
| `pnpm brain:knowledge:preview` | passed | Static HTML preview regenerates with usefulness filter. | Does not prove deployed web UI readiness. |
| `rg -n "usefulness\\|Usefulness\\|data-usefulness\\|outcome" .local-lab/brain-knowledge-preview.html` | passed | Static artifact contains usefulness filter and card data. | Does not prove visual UX quality. |

## What This Proves

- Usefulness outcome is a first-class readback filter.
- Feedback can be searched and faceted without API/MCP/dashboard work.
- Existing read-only preview remains mutation-free.

## What This Does Not Prove

- Product readiness.
- Search ranking quality.
- Semantic retrieval.
- Full feedback history.
- That all retained patterns have usefulness feedback.
- That UI/API/MCP should start now.

## Next Recommended Action

Open V291: Brain Knowledge Usefulness Outcome Filter Dogfood.

Use the new `--usefulness-outcome helped` and static preview filter in a
bounded continuation and record whether it reduces rereads or improves operator
selection. Do not add more UI/API/MCP/dashboard work until this filter is
dogfooded.
