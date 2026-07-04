# Brain Source Grounding Spot Check

Date: 2026-07-04
Beads: `mise-en-palace-g1cg`

## Scope

Spot-check current `krn brain search` responses for whether useful
selectedKnowledge is backed by resolvable source evidence. This is not a broad
hallucination benchmark and does not change ranking.

## Environment

```sh
rtk docker compose up -d krn-postgres
rtk pnpm db:ready
```

Readiness result: Postgres reachable, migrations `16/16`, pgvector available,
brain store ready.

## Samples

Artifacts: `.local-lab/g1cg/*.json`.

| Query | Selected knowledge | Source answer usefulness | SourceClaims | SearchDocuments | SourceDecision support | Missing evidence |
| --- | ---: | --- | ---: | ---: | ---: | --- |
| `workers are not codex exec candidate maintenance contracts plnv` | 1 target-specific ready packet: `pattern:krn-brain-layer-model-boundary` | `not_useful` | 0 | 0 | 0 | governed SourceClaim; included SearchDocument |
| `naming standard no vanity rename helper extraction rule` | 1 target-specific ready packet: `pattern:krn-brain-layer-model-boundary` | `not_useful` | 0 | 0 | 0 | governed SourceClaim; included SearchDocument |
| `source-to-decision retention gate consumer falsifier` | 1 target-specific ready packet: `pattern:source-to-decision-retention-gate` | `partly_useful_missing_claim` | 0 | 1 | 0 | governed SourceClaim |
| `typescript unknown first result state JSON parse boundary` | 1 target-specific ready packet: `pattern:ts-boundary-unknown-first-result-state` | `not_useful` | 0 | 0 | 0 | governed SourceClaim; included SearchDocument |

## Findings

1. Brain knowledge recall is useful for these samples: all four queries return
   one target-specific, ready selectedKnowledge packet with `nextAction: use`.
2. Source grounding is not yet strong enough for factual claims. Across the four
   samples there are zero supporting SourceClaims and zero SourceDecision support
   rows.
3. SearchDocument support exists for only one sample:
   `source-to-decision-retention-gate`. That is useful but still weaker than a
   governed SourceClaim + SourceDecisionEdge readback.
4. The current readback is honest: source-search marks weak source support as
   `not_useful` or `partly_useful_missing_claim` and emits missing-evidence
   reasons instead of pretending the selectedKnowledge is source truth.

## Decision

Do not rewrite ranking next. The immediate gap is source grounding for retained
brain patterns that already influence planning. The next bounded work should
turn a small set of retained patterns into governed SourceClaim/SearchDocument
evidence with visible SourceDecision support, then re-run this same spot-check.

## Proof Boundary

Proves:

- four current DB-backed `krn brain search --json` readbacks were sampled;
- selectedKnowledge can now recall the brain-layer model and existing retained
  patterns;
- source grounding is currently weak for these samples and is surfaced as
  missing evidence.

Does not prove:

- broad source truth;
- graph retrieval quality;
- ranking quality across corpora;
- LLM/Codex adherence;
- product readiness;
- worker runtime or Memory Core write enforcement.
