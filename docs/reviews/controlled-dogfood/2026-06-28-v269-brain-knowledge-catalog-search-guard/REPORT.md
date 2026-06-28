# V269 Brain Knowledge Catalog Search Guard

Status: complete.

Date: 2026-06-28

## Executive Verdict

V269 added the focused guard the catalog needed: two distinct query terms return
two distinct retained pattern cards, and the JSON readback preserves read-only
access, no mutation, and proof/non-proof boundaries.

This is not ranking, product search, DB-backed knowledge, UI, API, or MCP.

## Scope

Changed:

- `packages/cli/src/runKnowledgeCardsCommand.test.ts`
- root active plan files

Non-goals preserved:

- no ranking engine;
- no web UI/API/MCP;
- no DB schema;
- no directory crawling;
- no broad ingestion.

## Behavior Guarded

The new guard asserts:

```txt
query "unknown-first"
  -> pattern:ts-boundary-unknown-first-result-state

query "source-to-decision"
  -> pattern:source-to-decision-retention-gate
```

It also asserts:

```txt
access: read_only
mutation: none
proof.doesNotProve includes search/product boundaries
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/cli test -- runKnowledgeCardsCommand` | passed | Catalog search/readback guard passes. | Does not prove ranking quality. |
| `pnpm -r --workspace-concurrency=1 typecheck` | passed | Workspace TypeScript compiles. | Does not prove runtime product usefulness. |
| `pnpm --filter @krn/cli krn knowledge cards --catalog-file ../../docs/brain-knowledge/catalog.json --text unknown-first --json` | passed | Manual JSON readback returns the TypeScript boundary card and proof boundaries. | Does not prove DB-backed search. |
| `pnpm --filter @krn/cli krn knowledge cards --catalog-file ../../docs/brain-knowledge/catalog.json --text source-to-decision --json` | passed | Manual JSON readback returns the source-to-decision card and proof boundaries. | Does not prove UI/API/MCP readiness. |
| `pnpm test` | passed | Full workspace tests pass locally. | Does not prove CI until pushed. |
| `git diff --check` | passed | Diff has no whitespace errors. | Does not prove behavior. |

## Outcome

The catalog now has a deterministic readback guard over multiple retained
patterns. The next step should connect this useful readback into repeated Codex
execution workflow, not build product UI yet.

## Next Recommended Action

Proceed to:

```txt
V270-00 Brain Knowledge Skill Readback Hook
```

Add a small skill/runbook rule telling relevant KRN/TypeScript/source-to-decision
work to query `krn knowledge cards --catalog-file ...` before implementation
when pattern context is needed. Do not build automatic skill routing or hidden
semantic hooks.
