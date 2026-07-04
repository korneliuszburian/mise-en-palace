# Brain Layer Model Retention

Date: 2026-07-04
Beads: `mise-en-palace-n9gz`

## Change

Added retained pattern `krn-brain-layer-model-boundary` and helped usefulness
feedback to the brain knowledge catalog.

The pattern retains the current KRN mental model as governed evidence:

- Codex executes.
- KRN is the governed RAG, memory, source, review, and feedback layer around
  Codex.
- Workers are not Codex exec; they remain candidate maintenance contracts until
  the human-deferred `plnv` executor decision.
- Naming work is not a vanity sweep; the helper extraction rule requires real
  duplication, a reviewed domain concept, boundary ownership, or reduced unsafe
  casts/parser drift.

## Evidence

Baseline before the retained pattern:

```sh
rtk pnpm --filter @krn/cli krn brain knowledge \
  --catalog-file docs/brain-knowledge/catalog.json \
  --text "workers are not codex exec candidate maintenance contracts plnv" \
  --json
```

Result: `totalCards: 0`, `returnedCards: 0`.

After retaining the pattern:

```sh
rtk pnpm --filter @krn/cli krn brain knowledge \
  --catalog-file docs/brain-knowledge/catalog.json \
  --text "workers are not codex exec candidate maintenance contracts plnv" \
  --json
```

Result: `totalCards: 1`, `returnedCards: 1`,
`id: "pattern:krn-brain-layer-model-boundary"`.

```sh
rtk pnpm --filter @krn/cli krn brain knowledge \
  --catalog-file docs/brain-knowledge/catalog.json \
  --text "naming standard no vanity rename helper extraction rule" \
  --json
```

Result: `totalCards: 1`, `returnedCards: 1`,
`id: "pattern:krn-brain-layer-model-boundary"`.

```sh
rtk pnpm --filter @krn/cli krn brain knowledge \
  --catalog-file docs/brain-knowledge/catalog.json \
  --text "governed RAG memory source review feedback Codex executes" \
  --json
```

Result: `totalCards: 1`, `returnedCards: 1`,
`id: "pattern:krn-brain-layer-model-boundary"`.

## Proof Boundary

Proves:

- the brain layer model parses as a retained pattern decision;
- the pattern has `helped` usefulness feedback tied to this retention proof;
- catalog readback can retrieve it for the two under-inclusion queries from
  `qzai`;
- the result is read-only and does not mutate Memory Core, SourceDecision, or DB
  state.

Does not prove:

- DB-backed source-search or full brain-search retrieval;
- ranking quality across broader corpora;
- source truth;
- worker runtime, scheduling, leases, retries, or Memory Core write
  enforcement;
- product readiness.

## Follow-Up

`g1cg` remains the next grounding check: sample current brain/source responses
and verify whether factual claims resolve to SourceClaim, SearchDocument, or
SourceClaimEdge evidence instead of raw metadata or prose.

After `g1cg`, `mise-en-palace-fhku` was opened to turn the weak source
grounding into governed SourceClaim/SearchDocument evidence plus visible
SourceDecision support for the retained brain patterns that influence planning.
