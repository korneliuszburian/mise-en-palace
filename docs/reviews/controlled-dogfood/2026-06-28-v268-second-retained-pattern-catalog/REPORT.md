# V268 Add Second Retained Pattern To Brain Knowledge Catalog

Status: complete.

Date: 2026-06-28

## Executive Verdict

V268 proved that the brain knowledge catalog is not a one-pattern demo. It added
a second retained pattern, `source-to-decision-retention-gate`, to the structured
retained-pattern catalog and verified it can be found through `krn knowledge
cards --catalog-file`.

This strengthens the pattern brain path without broad research ingestion,
directory crawling, ranking, DB schema, UI, API, or MCP.

## Scope

Changed:

- `docs/patterns/retained-patterns/source-to-decision-retention-gate.json`
- `docs/brain-knowledge/catalog.json`
- `packages/cli/src/runKnowledgeCardsCommand.test.ts`
- `packages/harness/src/brainKnowledgeReadModelInvariants.test.ts`
- root active plan files

Non-goals preserved:

- no paid/proprietary course copying;
- no broad research archive;
- no directory crawling;
- no ranking engine;
- no DB schema;
- no web UI/API/MCP.

## Source-To-Decision

Source:

- `docs/KRN_KERNEL.md#decision-rule`
- `docs/patterns/KRN_PATTERN_SELECTION.md`
- `.agents/skills/source-to-decision/SKILL.md`

Mechanism:

KRN avoids source hoarding by requiring mechanism, implication, decision or
rejection, consumer, falsifier, and does-not-prove before retaining a source or
pattern.

KRN implication:

The brain knowledge catalog should contain only reviewable retained patterns,
not decorative notes or raw research references.

Decision:

Adopt `source-to-decision-retention-gate` as a retained pattern and include it
in `docs/brain-knowledge/catalog.json`.

Consumer:

- future pattern intake;
- future research condensation;
- future brain knowledge catalog reviews.

Falsifier:

A retained source, pattern, or catalog card can omit mechanism, consumer,
falsifier, or does-not-prove while still passing the relevant pattern/readback
guard.

Does not prove:

- source truth;
- research completeness;
- ranking quality;
- product readiness.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/harness test -- brainKnowledgeReadModelInvariants` | passed | Catalog points at retained pattern sources. | Does not prove all future patterns are useful. |
| `pnpm --filter @krn/cli test -- runKnowledgeCardsCommand` | passed after updating expectation for two catalog entries | CLI catalog search covers the second retained pattern. | Does not prove ranking quality. |
| `pnpm -r --workspace-concurrency=1 typecheck` | passed | Workspace TypeScript compiles. | Does not prove runtime usefulness. |
| `pnpm --filter @krn/cli krn knowledge cards --catalog-file ../../docs/brain-knowledge/catalog.json --text source-to-decision` | passed | Operator can find the second pattern through catalog preview. | Does not prove DB-backed search or UI. |
| `pnpm test` | passed | Full workspace tests pass locally. | Does not prove CI until pushed. |
| `git diff --check` | passed | Diff has no whitespace errors. | Does not prove behavior. |

## Outcome

The catalog now contains:

- `source-to-decision-retention-gate`
- `ts-boundary-unknown-first-result-state`

The search/readback path can find each by text filter.

## Next Recommended Action

Proceed to:

```txt
V269-00 Brain Knowledge Catalog Search Guard
```

The next slice should add a focused guard/golden behavior proving catalog
readback returns distinct cards for distinct query terms and preserves
proof/non-proof boundaries.
