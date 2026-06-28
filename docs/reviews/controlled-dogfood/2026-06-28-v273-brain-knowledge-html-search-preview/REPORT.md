# V273 Brain Knowledge Self-Contained HTML Search Preview

Status: complete.

Date: 2026-06-28

## Executive Verdict

V273 added the first local web-style view over KRN brain knowledge:

```sh
krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --html
```

The output is self-contained HTML generated from the same
`BrainKnowledgeReadModel` preview resource as text and JSON output. It includes
client-side search, knowledge cards, source refs, evidence refs, consumers,
falsifier, does-not-prove, read-only access, mutation none, and proof
boundaries.

This is not a dashboard, API, MCP server, DB-backed search, ranking engine, or
product-ready UI.

## Scope

Changed:

- `packages/cli/src/parseKnowledgeArgs.ts`
- `packages/cli/src/parseArgs.ts`
- `packages/cli/src/runKnowledgeCardsCommand.ts`
- `packages/cli/src/parseKnowledgeArgs.test.ts`
- `packages/cli/src/runKnowledgeCardsCommand.test.ts`
- `packages/cli/src/runCli.test.ts`
- `docs/architecture/cli-surfaces.md`

Generated local artifact:

```txt
.local-lab/brain-knowledge-preview.html
```

The artifact is local lab output and is not committed.

## Behavior Added

`krn knowledge cards` now supports:

```txt
--html
```

The HTML preview:

- is self-contained;
- is read-only;
- has no server dependency;
- has no mutation controls;
- filters cards locally in the browser;
- displays source refs, evidence refs, consumers, falsifier, and does-not-prove;
- preserves proof/non-proof boundaries.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/cli test -- parseKnowledgeArgs runKnowledgeCardsCommand runCli` | passed | Parser, renderer, and runCli cover `--html`. | Does not prove visual quality across browsers. |
| `cd packages/cli && pnpm exec tsx src/index.ts knowledge cards --catalog-file docs/brain-knowledge/catalog.json --html > ../../.local-lab/brain-knowledge-preview.html` | passed | A clean local HTML artifact can be generated without pnpm wrapper output. | Does not prove product UI readiness. |
| `head -n 12 .local-lab/brain-knowledge-preview.html` | passed | Artifact starts as HTML document. | Does not prove interactivity. |
| `rg "pattern:...|Proof Boundaries|type=\"search\"|Mutation: none" .local-lab/brain-knowledge-preview.html` | passed | Artifact contains both current cards, search input, mutation boundary, and proof boundary. | Does not prove ranking quality. |

## Source-To-Decision

- Source: V260 BrainKnowledgeReadModel, V261 guard, V264/V267/V269 CLI readback,
  V271 path normalization, V272 UI/search readiness gate.
- Mechanism: the useful UI surface is the smallest presentation of the already
  guarded read-only resource, not a new server architecture.
- KRN implication: KRN can now show brain knowledge in a browser while keeping
  the CLI as the source of the preview and preserving proof boundaries.
- Decision: add `--html` to `krn knowledge cards`; keep web package/API/MCP/DB
  search/ranking deferred.
- Does not prove: product readiness, ranking quality, DB-backed knowledge,
  broad pattern coverage, or multi-user UI readiness.
- Consumer: future local operator brain knowledge review and catalog growth.
- Falsifier: generated HTML hides source/evidence/falsifier/does-not-prove
  boundaries or adds mutation authority.

## Next Recommended Action

Proceed to:

```txt
V274-00 Add Evidence Proof Boundary Retained Pattern
```

The UI now exists, but it only has two retained patterns. The next product value
comes from adding another high-value pattern card, not polishing the shell of
the UI.
