# Source Search Decision Support Extract

Date: 2026-07-03

## Change

Extracted SourceDecisionEdge decision-support readback and ranking boost logic
from `sourceSearchReadback.ts` into `sourceSearchDecisionSupport.ts`.

Moved responsibilities:

- SourceClaim id extraction for source-search candidates;
- SourceDecisionEdge readback mapping;
- decision-support grouping/readback state;
- decision-support ranking boost.

`sourceSearchReadback.ts` keeps answer package formatting, document links, graph
relation readback, and JSON/text rendering.

## Proof

```sh
pnpm --filter @krn/cli test -- runSourceSearchCommand
pnpm -C packages/cli typecheck
```

## Non-Proof

This does not prove source truth, ranking quality, or product search quality.
It only narrows the source-search runtime module boundary without changing
observed source-search behavior.
