# V263 Brain Knowledge Card Readback Helper

Status: complete.

Date: 2026-06-28.

## Executive Verdict

V263 added the first pure readback/search helper for brain knowledge cards:

```txt
packages/harness/src/brainKnowledgeReadModel.ts
```

The helper parses `BrainKnowledgeReadModel` cards from `unknown` JSON and can
filter cards by:

- kind;
- status;
- reviewability;
- text.

This is still not UI/API/MCP. It is the smallest in-code readback primitive
needed before a CLI or web search surface.

## Changed

- `packages/harness/src/brainKnowledgeReadModel.ts`
- `packages/harness/src/brainKnowledgeReadModel.test.ts`
- `docs/reviews/controlled-dogfood/2026-06-28-v263-brain-knowledge-card-readback-helper/REPORT.md`
- compact active pointers in `PLAN.md`, `GOAL.md`, and `PLANS.md`

## Behavior

The helper:

- validates card shape from `unknown`;
- rejects missing evidence/source boundary fields;
- preserves typed finite vocabularies;
- searches over ID, title, summary, falsifier, does-not-prove, source refs,
  evidence refs, and consumers.

## Source-To-Decision

- Source: V260 read-model contract, V261 guard, and V262 concrete card fixture.
- Mechanism: search/UI needs a pure typed readback helper before any rendering
  or API surface.
- KRN implication: brain knowledge search should start as typed readback over
  cards, not raw report grep or dashboard-first work.
- Decision: add pure harness helper and tests.
- Does not prove: UI exists, search ranking is good, API/MCP readiness, or
  product readiness.
- Consumer: V264 Brain Knowledge CLI Readback Preview.
- Falsifier: future card search requires ad hoc JSON/report parsing because the
  helper cannot load or filter the fixture.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/harness test -- brainKnowledgeReadModel` | passed, 33 files / 159 tests | helper parses/rejects/searches current fixture locally | UI/search product readiness |
| `pnpm --dir packages/harness exec tsc -p tsconfig.json` | passed | harness TypeScript compiles | runtime product readiness |
| `pnpm -r --workspace-concurrency=1 typecheck` | passed | workspace packages typecheck | UI/search readiness |

## What This Proves

- One concrete brain knowledge card can be parsed from unknown JSON.
- Missing required evidence boundaries are rejected.
- Basic typed filtering/search exists in pure code.

## What This Does Not Prove

- CLI surface;
- web UI;
- ranking quality;
- DB-backed card production;
- product readiness.

## Next Active Task

V264-00 Brain Knowledge CLI Readback Preview.

Goal:

```txt
Expose the card fixture through the smallest existing CLI/readback-adjacent
surface or explicitly reject CLI exposure if current CLI ownership would create
a product-surface leak. No web UI/API/MCP.
```
