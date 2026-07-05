# Live Dogfood: Brain Recall And Teach Loop On Real Repo Decisions

Status: operator-driven dogfood run. Date: 2026-07-05. Related Bead:
`mise-en-palace-<slice3>` (live dogfood). Prior slices: `mise-en-palace-b8xl`
(recall works), `mise-en-palace-17hp` (distractor-competition advantage).

This is not a benchmark and not a live Codex run. The agent is the operator
driving `krn source search` / `krn source decision *` against the persistent
real-claim corpus in the local Postgres brain store.

## Setup

- `pnpm db:ready`: Postgres reachable, 16/16 migrations, pgvector available,
  brain store ready.
- Persistent (non-smoke) real source claims in the store: 23, tied to
  `docs/KRN_KERNEL.md`, `docs/decisions/ADR-0021-*`, and `docs/reviews/*`.

## Recall Pass: Five Real Task Framings

`krn source search --query "..." --json`, top included candidates shown.

| Real task framing | Recalled governing decision? |
| --- | --- |
| "should we expose KRN via an MCP server or API next" | yes - "external JSON/env/file/CLI/MCP inputs should enter as unknown" and "KRN should behave as a governed RAG memory source review and feedback layer around Codex execution" |
| "should we build a dashboard for the brain" | **missed** - "bounded local ingest loop before crawler/dashboard/API" claim absent even though it exists in the store |
| "how should temporal source relations be represented in the graph brain" | **missed** - ADR-0021 temporal-relation claims absent |
| "what makes a retained KRN knowledge pattern valid" | yes - "a source-to-decision retention gate requires mechanism, KRN implication, consumer, falsifier..." |
| "should Codex mutate Memory Core directly from a reflection loop" | yes - "KRN should behave as a governed RAG memory source review and feedback layer around Codex execution" |

Honest result: 3/5 recalled the relevant governing decision; 2/5 missed a
decision that is present in the store.

## Diagnosis: Why The Misses

`krn source decision gaps` (read-only) for the scanned project reported 4
accepted claims, all linked, 0 missing edges. Store-wide check:

```txt
real (non-smoke) source_claims:        23
distinct claims with a SourceDecisionEdge: 12
claims WITHOUT any SourceDecisionEdge:    11
```

The two missed claims were confirmed to have no SourceDecision and no
SourceDecisionEdge:

- `KRN should prove one bounded local ingest loop before building a crawler,
  dashboard, API, ...` - `has_decision = false`, `has_edge = false`.
- ADR-0021 temporal-relation claims - `has_edge = false`.

This is the slice-2 finding (`mise-en-palace-17hp`) confirmed on persistent
real content: source-search does not surface SourceClaims that lack a
SourceDecisionEdge. Raw claims that were never adopted as decisions are
invisible to recall, so the brain's effective knowledge (12 claimable decisions)
is much smaller than the raw claim count (23). The brain is blind to roughly
half of its seeded real knowledge.

## Teach Loop: Make A Missed Decision Recallable

Used only the brain's own product commands (no DB-hacking) on the missed
bounded-loop decision (source claim `3363383c-02d0-4e5a-9674-132c1bc41b51`).

1. `krn source decision adopt --source-claim-id <id> --decision "Prove one
   bounded local ingest loop first; do not build a crawler, dashboard, API, or
   MCP surface until that loop is proven." --rationale "..." --falsifier "..."
   --consumer "product surface prioritization" --metadata "source=dogfood-real-recall" --persist`
   - persisted `sourceDecision: 5c5a3392-...`; claim readback now `accepted`.
2. `krn source decision link --source-claim-id <id> --target-type
   architecture_decision --target-id "dogfood-bounded-loop-before-surfaces"
   --support-type implementation-boundary --confidence high --notes "..." --persist`
   - persisted `sourceDecisionEdge: efba2285-...`.

## Verification: Recall After Teaching

`krn source search --query "should we build a dashboard for the brain" --json`
after the teach step. Top included candidates:

1. TypeScript external JSON/env/file/CLI/MCP inputs should enter as unknown...
2. KRN should behave as a governed RAG memory source review and feedback layer...
3. **KRN should prove one bounded local ingest loop before building a crawler, dashboard, API...**

The bounded-loop governing decision now surfaces (rank 3) where before it was
absent. It is not rank 1 - the MCP/unknown-first claims still rank higher on
lexical + decision-edge strength - but it is now recallable at all, which is
the point of the teach step.

## Findings

- The brain's recall+teach loop works end-to-end on real repo governing
  decisions using only product commands: a missed decision was diagnosed
  (`source decision gaps` + claim-level edge check), taught
  (`decision adopt` + `decision link`), and re-recalled.
- Dogfooding exposed a real recall gap: ~11/23 persistent real claims have no
  SourceDecisionEdge and are therefore invisible to source-search. The effective
  knowledge graph is sparse relative to the raw claim count.
- Recall ranking is not perfect: even after teaching, the bounded-loop decision
  reached rank 3, not rank 1, for the "dashboard" query. Lexical + edge-strength
  tuning is a separate lever.

## Next

- Scale the teach loop: adopt + link the remaining un-edged real governing
  decisions (temporal relations, ingest boundaries, etc.) so the brain's
  effective knowledge matches its raw claim corpus.
- Consider a `source decision adopt --link` convenience or a batch path so
  completing the knowledge graph is not one-claim-at-a-time.
- Recall-quality hardening (rank 1, not rank 3) is a follow-up lever; this run
  only proves the decision becomes recallable.

## Proof Boundary

Proves:

- the brain's recall and teach loop works end-to-end on real repo governing
  decisions via the live DB and product CLI commands;
- dogfooding can expose a real recall gap (un-edged claims are invisible) and
  close it with the brain's own commands.

Does not prove:

- live Codex would follow the recalled decision;
- broad semantic ranking quality;
- that the persistent corpus is complete or that recall is now perfect;
- product readiness.
