# IMR-02 Store-Backed Pattern Brain Readback

Status: complete source slice.

## Verdict

KRN now has a `krn brain search --store-only` mode that intentionally skips the
file-backed brain knowledge catalog and reads only the store-backed source/search
path. This is a small but important shift toward the target brain model: pattern
and research knowledge must be replayable through the brain store, not only
through JSON/Markdown catalogs.

This does not make retained patterns first-class MemoryRecords or a final brain
ontology. It proves the existing Postgres source/search substrate can already
serve a store-backed pattern readback for governed source-to-decision evidence.

## Source To Decision

Source: current IMR-00 direction, `docs/KRN_KERNEL.md`, existing SourceClaim /
SearchDocument schema, and live DB readback for `source-to-decision retention
gate`.

Mechanism: patterns can be represented as governed source/search evidence using
SourceArtifact, SourceClaim, SourceClaimEdge, SearchDocument, and proof
boundaries. The agent needs a way to query that store path without silently
falling back to file catalog context.

KRN implication: `brain search` needs an explicit store-only mode so Codex can
distinguish store-backed brain evidence from file-backed catalog preview.

Decision: add `--store-only` to `krn brain search`; reject combining it with
`--catalog-file`; expose `brainKnowledgeReadback: "store_only"` in JSON.

Consumer: future pattern/research brain work, internal multi-repo operator loop,
and future activation/readback improvements.

Falsifier: a future run claims store-backed pattern evidence while the output
silently used file catalog readback or omitted the proof boundary.

Does not prove: source truth, ranking quality, embeddings, graph retrieval,
complete pattern ontology, Memory Core mutation, or product readiness.

## Changed

- `packages/cli/src/parseArgs.ts`
- `packages/cli/src/parseBrainArgs.ts`
- `packages/cli/src/parseBrainArgs.test.ts`
- `packages/cli/src/runBrainSearchCommand.ts`
- `packages/cli/src/runBrainSearchCommand.test.ts`

No DB schema, Memory Core, crawler, API, MCP, dashboard, or worker runtime
changes.

## Verification

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm db:ready` | passed | local Postgres is reachable with migrations and pgvector | DB on another machine |
| `pnpm --filter @krn/cli test -- runBrainSearchCommand parseBrainArgs` | passed | parser/runner behavior for store-only mode | whole product readiness |
| `pnpm -r --workspace-concurrency=1 --if-present typecheck` | passed | workspace TypeScript compiles | runtime usefulness |
| `git diff --check` | passed | diff whitespace is clean | behavior correctness |
| `KRN_DATABASE_URL=... krn brain search --query "source-to-decision retention gate" --store-only --limit 3 --json` | passed | store-only brain search returns source/search evidence without catalog readback | ranking quality, source truth, Memory Core mutation |

## Live Store Readback

The live store-only command returned:

```txt
brainKnowledgeReadback: store_only
supportingClaims: 2
supportingDocuments: 1
relationSupport: 1
graphAware: true
mutation: none
```

The proof boundary explicitly said the brain knowledge catalog was skipped and
that the output does not prove source truth, ranking quality, semantic search
quality, product readiness, or Memory Core mutation.

## Remaining Gap

Patterns are still not first-class store-backed brain knowledge objects. The
current store-backed path proves replayability through SourceClaim/SearchDocument
evidence. A later slice can decide whether a dedicated ontology or promotion path
is needed, but this slice avoids adding schema before the current substrate is
exhausted.
