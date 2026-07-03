# Source Search Boundary Split

Date: 2026-07-03.

Beads: `mise-en-palace-75za`.

## Change

`runSourceSearchCommand.ts` no longer owns source-search answer-package
readback, relation support shaping, SourceDecisionEdge support boosts,
SourceClaim document-link readback, candidate reviewability formatting, or
text/JSON rendering.

Those boundaries moved to `sourceSearchReadback.ts`. The runner now owns command
validation, DB runtime creation, activation candidate retrieval, authority
filtering, ContextROI, repository calls, and dispatch to text/JSON rendering.

Size change before staging:

```txt
runSourceSearchCommand.ts: 48.5 KB -> 6.7 KB
sourceSearchReadback.ts: 42.3 KB
```

## Source-To-Decision

source: current `wc -c` and command implementation.

mechanism: source-search was the largest remaining CLI command and mixed
orchestration with source authority readback, graph support, and formatter
logic.

KRN implication: readback boundaries should be reviewable independently from DB
runtime orchestration so future ranking/authority changes do not hide inside a
large CLI command.

decision: extract source-search readback/format/ranking helpers into a local
module; preserve existing public exports from the command module for tests.

consumer: `runSourceSearchCommand.ts`, source-search CLI tests, brain-search
delegation.

falsifier: JSON/text output changes, source authority exclusions disappear,
SourceDecisionEdge ranking support regresses, or strict CLI test typecheck
fails.

## Verification

```txt
pnpm -C packages/cli typecheck
pnpm --filter @krn/cli test -- runSourceSearchCommand
pnpm --filter @krn/cli typecheck:tests:clean
pnpm -w typecheck
pnpm quality:fallow:ci
```

All passed locally.

## Proof Boundary

Proves: the source-search runner is now orchestration-focused and the existing
source-search contract still passes the current CLI test suite.

Does not prove: source truth, ranking quality, new product behavior, DB runtime
smoke, or that the extracted readback module is the final package boundary.
