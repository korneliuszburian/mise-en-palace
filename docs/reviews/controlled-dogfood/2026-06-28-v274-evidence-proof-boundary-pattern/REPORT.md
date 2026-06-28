# V274 Add Evidence Proof Boundary Retained Pattern

Status: complete.

Date: 2026-06-28

## Executive Verdict

V274 added the third retained pattern to the brain knowledge catalog:

```txt
pattern:evidence-proof-non-proof-boundary
```

The card captures a core KRN rule: evidence that can influence review, memory,
source, skill, policy, or eval decisions must keep command provenance visible
and state both what it proves and what it does not prove.

This grows the searchable brain content without adding a crawler, ranking
engine, DB schema, dashboard, API, MCP, or mutation path.

## Scope

Changed:

- `docs/patterns/retained-patterns/evidence-proof-non-proof-boundary.json`
- `docs/brain-knowledge/catalog.json`
- `packages/harness/src/brainKnowledgeReadModelInvariants.test.ts`
- `packages/cli/src/runKnowledgeCardsCommand.test.ts`

Non-goals preserved:

- no broad research archive;
- no source crawler;
- no UI polish;
- no dashboard/API/MCP;
- no DB schema/migration;
- no memory/source mutation.

## Source-To-Decision

- Source:
  - `.agents/skills/evidence-review-loop/SKILL.md`
  - `packages/core/src/evidenceBundle.ts`
  - `packages/schema/src/evidenceCapture.ts`
- Mechanism:
  - command evidence has typed status/provenance;
  - weak/default evidence must not masquerade as proof;
  - every decision-grade evidence output needs a proof/non-proof boundary.
- KRN implication:
  - evidence review is only useful if future operators can see what evidence
    proves and where certainty stops.
- Decision:
  - retain `evidence-proof-non-proof-boundary` as active searchable pattern
    knowledge.
- Does not prove:
  - command truth, review correctness, memory quality, source truth, ranking
    quality, product readiness, or complete evidence quality.
- Consumer:
  - future evidence capture and review slices;
  - future memory/source/eval candidate review;
  - future brain knowledge UI/search cards.
- Falsifier:
  - a future evidence, review, memory/source candidate, or knowledge card can
    influence a decision while omitting command provenance or a
    does-not-prove boundary and tests still pass.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text proof-boundary --json` | passed | Catalog readback returns the new evidence proof-boundary card with read-only/no-mutation proof boundaries. | Does not prove ranking quality or DB-backed knowledge. |
| `pnpm --filter @krn/harness test -- brainKnowledgeReadModel brainKnowledgeReadModelInvariants` | passed | Brain knowledge invariants accept and guard the updated catalog. | Does not prove every future pattern is useful. |
| `pnpm --filter @krn/cli test -- runKnowledgeCardsCommand` | passed | CLI catalog search guard covers the new proof-boundary query. | Does not prove UI rendering includes the new card. |

## Brain Usefulness

Positive:

- the new pattern is now searchable in CLI/HTML-backed catalog readback;
- source/evidence refs and falsifier are explicit;
- this adds content value to the HTML search surface from V273.

Still unproven:

- whether future evidence slices consistently apply this pattern;
- whether the HTML preview displays all catalog cards after catalog growth;
- whether ranking or DB-backed search is needed.

## Next Recommended Action

Proceed to:

```txt
V275-00 Brain Knowledge HTML Catalog Breadth Guard
```

The next smallest guard should ensure the HTML preview renders all current
catalog cards, including the new proof-boundary card, and preserves
source/evidence/falsifier/does-not-prove fields.
