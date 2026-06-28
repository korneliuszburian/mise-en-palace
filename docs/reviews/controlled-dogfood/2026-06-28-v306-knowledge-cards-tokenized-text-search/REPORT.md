# V306 Knowledge Cards Tokenized Text Search

Status: complete source slice.

## Executive Verdict

`krn knowledge cards --text` is now less brittle for pre-coding Pattern
Application Gate queries. Exact substring matching remains for compatibility;
when that misses, the read model falls back to deterministic token matching over
semantic card fields. This improves local readback without adding ranking,
embeddings, API, MCP, dashboard, DB writes, or Memory Core mutation.

## Change

- Added tokenized fallback matching in
  `packages/harness/src/brainKnowledgeReadModel.ts`.
- Kept exact full-text substring search over the old full searchable payload.
- Scoped tokenized fallback to card semantic fields to avoid noisy matches from
  evidence/source refs that merely mention other patterns.
- Added harness and CLI tests for natural multi-token search.

## Pattern Usefulness

Selected pattern:

```txt
pattern:brain-knowledge-read-only-ui-boundary
outcome: helped
reason: kept the implementation read-only and prevented search UX improvement
from becoming ranking, persistence, API, or product-readiness work.
```

Rejected/deferred patterns:

```txt
semantic ranking / embeddings:
  deferred because V306 only needs deterministic local filtering.

source-to-decision new external source:
  rejected because local repo evidence from V305 is sufficient for this bounded
  source repair.
```

## Verification

Commands run:

```sh
rtk env TMPDIR=/home/krn/.cache/krn-tmp pnpm --filter @krn/harness test -- brainKnowledgeReadModel
rtk env TMPDIR=/home/krn/.cache/krn-tmp pnpm --filter @krn/cli test -- runKnowledgeCardsCommand
rtk pnpm --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text "unknown first result state" --json
```

Results:

```txt
harness targeted tests: passed
CLI targeted tests: passed
CLI readback: returned exactly pattern:ts-boundary-unknown-first-result-state
```

## Proof Boundary

What this proves:

- local knowledge-card text filtering can find a relevant retained pattern when
  a natural query uses spaces instead of hyphenated terms;
- the command remains read-only;
- output still includes proof/non-proof boundaries.

What this does not prove:

- semantic ranking quality;
- complete retained-pattern coverage;
- live DB search;
- Memory Core mutation safety beyond this read-only path;
- product readiness.

## Next Action

Run V307 as a bounded usefulness feedback closure: measure whether tokenized
pattern-card search helps the next pre-coding pattern gate, then either keep the
behavior as sufficient or open a narrowly scoped follow-up.
