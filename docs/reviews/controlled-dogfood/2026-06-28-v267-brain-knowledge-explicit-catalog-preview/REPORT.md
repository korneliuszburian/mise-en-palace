# V267 Brain Knowledge Explicit Catalog Preview

Status: complete.

Date: 2026-06-28

## Executive Verdict

V267 added an explicit brain knowledge catalog preview. `krn knowledge cards`
can now read `--catalog-file`, where the catalog lists exact card and retained
pattern files. Catalog entries are resolved relative to the catalog file. This
enables multi-card readback without directory crawling, ranking, DB persistence,
UI, API, or MCP.

## Scope

Changed:

- `docs/brain-knowledge/catalog.json`
- `packages/cli/src/parseArgs.ts`
- `packages/cli/src/parseKnowledgeArgs.ts`
- `packages/cli/src/runCli.ts`
- `packages/cli/src/runKnowledgeCardsCommand.ts`
- CLI tests
- `docs/architecture/cli-surfaces.md`
- root active plan files

Non-goals preserved:

- no directory crawling;
- no ranking engine;
- no DB schema;
- no web UI/API/MCP;
- no source crawler;
- no Memory Core mutation.

## KRN Plan Output

Command:

```sh
pnpm --filter @krn/cli krn plan --task "Add explicit catalog-file preview for brain knowledge cards without directory crawling ranking DB UI API or MCP"
```

Result:

- persistence: disabled;
- context included: 0;
- context excluded: 0;
- context status: abstained.

Interpretation:

No-store activation did not help. The active stream plus V264/V265/V266
evidence carried the implementation.

## Implementation

Added:

```txt
docs/brain-knowledge/catalog.json
```

Current catalog:

```json
{
  "cardFiles": [],
  "patternFiles": [
    "../patterns/retained-patterns/ts-boundary-unknown-first-result-state.json"
  ]
}
```

New preview:

```sh
krn knowledge cards \
  --catalog-file docs/brain-knowledge/catalog.json \
  --text unknown-first
```

Boundary:

- catalog JSON is unknown until validated;
- catalog entries are exact file paths, not directories;
- entries are resolved relative to the catalog file;
- catalog may list card files and retained-pattern files;
- output remains read-only.

## TypeScript Boundary

Boundary classification:

- CLI args: external input;
- catalog JSON: external input validated by local parser;
- catalog entry files: still validated by existing card/pattern parsers.

Pattern:

- `ts-boundary-unknown-first-result-state` applies to catalog parsing and
  retained-pattern file parsing.

Type-safety exceptions:

- none.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/cli test -- parseKnowledgeArgs runKnowledgeCardsCommand runCli` | passed | CLI supports explicit catalog files. | Does not prove product search. |
| `pnpm -r --workspace-concurrency=1 typecheck` | passed | Workspace TypeScript compiles. | Does not prove runtime usefulness. |
| `pnpm --filter @krn/cli krn knowledge cards --catalog-file ../../docs/brain-knowledge/catalog.json --text unknown-first` | passed | CLI renders a card from an explicit catalog. | Does not prove ranking or DB-backed card production. |
| `pnpm test` | passed | Full workspace tests pass locally. | Does not prove CI until pushed. |
| `git diff --check` | passed | Diff has no whitespace errors. | Does not prove behavior. |

## Brain Usefulness

Brain ROI:

Positive for local pattern-brain readback. The loop is now:

```txt
explicit catalog -> retained pattern file -> typed producer -> knowledge card -> CLI search/readback
```

Activation remains weak in no-store mode.

## Outcome

The pattern brain now has a small non-UI searchable preview over a catalog. It
still contains only one retained pattern, so it proves the path, not breadth.

## Next Recommended Action

Proceed to:

```txt
V268-00 Add Second Retained Pattern To Brain Knowledge Catalog
```

The next proof should add another retained pattern/card through the same path to
show the catalog is not a one-pattern demo.
