# V266 Brain Knowledge Pattern-File CLI Preview

Status: complete.

Date: 2026-06-28

## Executive Verdict

V266 connected the retained-pattern producer to the operator readback surface.
`krn knowledge cards` can now read explicit `--pattern-file` inputs, validate
them as retained pattern decisions, produce `BrainKnowledgeReadModel` cards, and
render/filter them through the same read-only preview used for direct card
files.

This is still not product search, UI, API, MCP, DB-backed card storage, or broad
knowledge ingestion.

## Scope

Changed:

- `packages/cli/src/parseArgs.ts`
- `packages/cli/src/parseKnowledgeArgs.ts`
- `packages/cli/src/runCli.ts`
- `packages/cli/src/runKnowledgeCardsCommand.ts`
- CLI tests
- `docs/architecture/cli-surfaces.md`
- root active plan files

Non-goals preserved:

- no directory crawling;
- no markdown parsing;
- no ranking engine;
- no DB schema;
- no web UI/API/MCP;
- no Memory Core mutation.

## Implementation

New preview input:

```sh
krn knowledge cards \
  --pattern-file docs/patterns/retained-patterns/ts-boundary-unknown-first-result-state.json \
  --text unknown-first
```

Behavior:

- `--card-file` still reads explicit `BrainKnowledgeReadModel` cards.
- `--pattern-file` reads explicit retained-pattern decision JSON.
- pattern JSON is parsed through `parseRetainedPatternDecision`.
- typed pattern decisions become cards through
  `brainKnowledgeCardFromRetainedPatternDecision`.
- the resulting cards share the same local filter/output path.

## TypeScript Boundary

Boundary classification:

- CLI args: external input parsed by `parseKnowledgeArgs`;
- retained pattern JSON: external input read as JSON object and validated by
  `parseRetainedPatternDecision`;
- producer accepts typed retained pattern decisions;
- output stays read-only.

Pattern:

- `ts-boundary-unknown-first-result-state` applies to retained-pattern file
  parsing: the JSON file is not trusted directly.

Type-safety exceptions:

- none.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/cli test -- parseKnowledgeArgs runKnowledgeCardsCommand runCli` | passed | Parser/renderer/dispatcher support `--pattern-file`. | Does not prove product search. |
| `pnpm -r --workspace-concurrency=1 typecheck` | passed | Workspace TypeScript compiles. | Does not prove runtime usefulness. |
| `pnpm --filter @krn/cli krn knowledge cards --pattern-file ../../docs/patterns/retained-patterns/ts-boundary-unknown-first-result-state.json --text unknown-first` | passed | CLI can render a card produced from an explicit retained-pattern file. | Does not prove DB-backed card production or ranking. |
| `pnpm test` | passed | Full workspace tests pass locally. | Does not prove CI until pushed. |
| `git diff --check` | passed | Diff has no whitespace errors. | Does not prove behavior. |

## Brain Usefulness

Useful context:

- V264 CLI preview and V265 producer were directly reused.
- Active `PLANS.md` kept the next slice narrow.

Weak context:

- no DB-backed activation was used for this slice.

Brain ROI:

Positive for pattern-brain readback. This now demonstrates a usable local loop:

```txt
retained pattern JSON -> typed producer -> CLI card readback
```

## Outcome

The current brain knowledge readback can now operate on source pattern
decisions directly, without hand-authored card files.

Remaining gap:

```txt
operators still need to list each card/pattern file manually
```

## Next Recommended Action

Proceed to:

```txt
V267-00 Brain Knowledge Explicit Catalog Preview
```

Add or reject an explicit catalog file that lists card/pattern files for the CLI
preview. Do not crawl directories or build ranking/UI/API/MCP.
