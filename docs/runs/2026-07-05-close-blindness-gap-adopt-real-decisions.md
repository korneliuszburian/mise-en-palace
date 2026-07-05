# Close Brain Blindness Gap: Adopt Real Governing Decisions

Status: operator-driven teach run. Date: 2026-07-05. Related Bead:
`mise-en-palace-w7em`. Follows: `2026-07-05-live-dogfood-recall-teach-loop.md`.

The dogfood found that ~11/23 persistent real source claims had no
SourceDecisionEdge and were therefore invisible to source-search. This run
closes the gap for the real KRN governing decisions (not dogfood leftovery)
via the brain's own product commands.

## Classification Of The 11 Un-edged Real Claims

Adopted as governing decisions (had a real architectural standard, not a trial
result or target-repo content):

- `931e7faa-...` Graph brain v0 should represent temporal source relations as
  reviewable SourceClaimEdge candidates. (ADR-0021)
- `e4bfcdea-...` KRN should prove a second bounded local artifact flow before
  crawler/embeddings/schema/UI/API/MCP/worker/benchmark/Memory mutation.
- `125366b1-...` Retained KRN knowledge must preserve source, mechanism, KRN
  implication, decision or rejection, consumer, falsifier, does-not-prove.
- `7769dfc9-...` Temporal relations are edges between source claims; a temporal
  edge never makes the newer claim globally true by itself.

Deliberately NOT adopted (multi-repo/dogfood/trial leftovery, not governing
standards): `bc4731b9` EKOLOGUS target-repo content; `04b097d5` V338 proved-*;
`55e3d7ea` V339 proved-*; `5b1e25a1` V342 showed-*; `f654ae9a` V371 local
ingest; `3afb4c95` generic "local artifact preview can carry..." capability
claim; `578d247c` duplicate of the adopted temporal claim.

## Teach Step

For each adopted claim, ran `krn source decision adopt --persist` then
`krn source decision link --persist --target-type architecture_decision
--support-type implementation-boundary --confidence high`. Metadata tagged
`source=dogfood-blindness-gap-slice4` on the resulting SourceDecision.

Persisted: 4 SourceDecisions + 4 SourceDecisionEdges.

## Verification: Effective Knowledge Before / After

```txt
distinct claims with a SourceDecisionEdge:
  before slice 3 (2026-07-05 dogfood): 12 / 23 real claims
  after slice 3 (dashboard decision):  13 / 23
  after slice 4 (this run):            17 / 23
```

Recall after teaching:

- `krn source search "how should temporal source relations be represented in
  the graph brain"` -> rank 1 and 2 are now the two ADR-0021 temporal claims
  (previously absent entirely).
- `krn source search "what must a retained KRN knowledge row preserve"` ->
  rank 1 is the retained-knowledge gate (previously absent).

## Findings

- Effective recallable knowledge rose from 12 to 17 claims (+5 over slice 3 +
  4). The temporal-relations and retained-knowledge governing decisions are now
  reachable on natural-language queries.
- 6 real claims remain un-edged by design: dogfood/multi-repo/trial leftovery
  and one duplicate. These are not governing standards and should not be
  promoted to adopted decisions just to inflate the count.
- The diagnostic tool (`krn source decision gaps`) still under-reports this
  kind of shortfall because it only counts accepted-but-unlinked claims, not
  un-adopted real claims. That is slice 5 (`mise-en-palace-9tzh`).

## Proof Boundary

Proves:

- the brain's effective recallable knowledge can be expanded via the product
  teach loop, and natural-language recall now surfaces the temporal and
  retained-knowledge governing decisions that were previously invisible.

Does not prove:

- the 6 remaining un-edged claims should be adopted;
- recall wording or ranking is optimal (rank-quality is slice 6 /
  `mise-en-palace-1nk1`);
- live Codex adherence, broad ranking quality, or corpus completeness.
