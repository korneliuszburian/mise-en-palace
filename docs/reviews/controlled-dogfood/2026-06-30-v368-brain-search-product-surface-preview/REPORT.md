# V368 Brain Search Product Surface Preview

Status: complete.

## Executive Verdict

V368 added a thin product-facing `krn brain search` preview that composes
existing knowledge-card and source-search readbacks. This improves operator
readability without adding a dashboard, API server, MCP server, crawler, DB
schema, ranking rewrite, or autonomous runtime.

## What Changed

- Added `krn brain search --query ...`.
- Added repeatable `--catalog-file`, optional `--limit`,
  `--max-inclusions`, and `--json`.
- Added a read-only preview resource:
  `krn.brainSearch.preview.v1`.
- Preserved `mutation: none`, proof, and `doesNotProve` boundaries.
- Reused existing `krn knowledge cards` and `krn source search` behavior.
- Normalized the parser/dispatch code after Fallow flagged initial complexity
  and duplication.

## Source-To-Decision

```txt
source: existing KRN source-search and knowledge-card surfaces
mechanism: compose their readbacks into one read-only operator search preview
KRN implication: product-facing brain search should reuse proven readbacks
decision: add a thin CLI adapter, not a new search engine
consumer: technical operator using KRN internal alpha
falsifier: V368 creates a new ranking layer, server, schema, crawler, or
  mutating Memory Core path
```

## Live Readback

Command:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
  pnpm --filter @krn/cli krn brain search \
  --query "source-to-decision" \
  --limit 3 \
  --max-inclusions 3 \
  --json
```

Observed result:

```txt
kind: krn.brainSearch.preview.v1
access: read_only
mutation: none
knowledge cards: 3 returned
source search: useful
supporting claims: 2
supporting documents: 1
relation support: 1
included candidates: 3
```

Matched knowledge cards:

```txt
pattern:codex-skill-progressive-disclosure-routing
pattern:evidence-proof-non-proof-boundary
pattern:source-to-decision-retention-gate
```

## Command Evidence

| Command | Result | Proves | Does Not Prove |
|---|---:|---|---|
| `pnpm --filter @krn/cli test -- parseBrainArgs runBrainSearchCommand` | passed | focused parser/runner behavior works | product readiness or ranking quality |
| `pnpm --filter @krn/cli run typecheck` | passed | touched CLI types compile | runtime DB usefulness |
| `pnpm quality:fallow:ci` | passed | changed JS/TS files have no Fallow findings | semantic correctness |
| `pnpm db:ready` | passed | current-shell DB is reachable and migrated | CI DB state |
| live `krn brain search --json` | passed | preview composes existing readbacks | source truth, semantic search quality, Memory Core mutation |
| `pnpm run typecheck` | passed | workspace types compile | product readiness |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | workspace tests pass | external operator usefulness |
| `git diff --check` | passed | no whitespace errors | behavioral correctness |

## What This Improves

- Operators now have one small command for product-facing brain readback.
- Existing pattern cards and source-search answer packages are easier to inspect
  together.
- The surface is explicitly read-only and no-mutation.
- Fallow was used as a real simplification pressure, not a ceremonial check.

## What This Does Not Prove

- It does not prove search ranking quality.
- It does not prove source truth.
- It does not prove graph retrieval quality.
- It does not prove product readiness.
- It does not mutate or promote Memory Core.
- It does not replace the need for a full product loop.

## Next Recommended Action

V369 should stop expanding readback surfaces and close a bounded end-to-end
product loop:

```txt
brain search -> plan/brief -> execution -> evidence -> review ->
candidates -> promotion/rejection or explicit abstention -> next-run readback
```

No dashboard, API, MCP server, crawler, ranking rewrite, schema, worker daemon,
or broad benchmark should be added for V369.
