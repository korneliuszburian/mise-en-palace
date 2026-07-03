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

## Second Opinion Triage

`second-opinion-claude` reviewed the extraction against base
`0658e083c1707a5d80c6803ab403d3e51d8d95fa` and returned
`approve_with_fixes` / `MEDIUM`.

Accepted fixes:

- removed the unintentional `subjectId` string guard in `sourceClaimIdFor`;
- removed the unreachable `unavailable` decision-support state;
- restored the readonly return contract on `sourceClaimIdsForCandidates`.

Evidence-gap triage:

- `metadataString` in `sourceSearchReadback.ts` remains used by source-claim and
  document-link readback after extraction;
- `runSourceSearchCommand.test.ts` already covers SourceDecisionEdge boost
  behavior through decision-linked ordering, reason text, and positive graph
  score assertions.

Additional verification after fixes:

```sh
pnpm --filter @krn/cli test -- runSourceSearchCommand
pnpm -C packages/cli typecheck
pnpm --filter @krn/harness test -- contextHygieneInvariants
pnpm quality:fallow:ci
git diff --check
```

## Non-Proof

This does not prove source truth, ranking quality, or product search quality.
It only narrows the source-search runtime module boundary without changing
observed source-search behavior.
