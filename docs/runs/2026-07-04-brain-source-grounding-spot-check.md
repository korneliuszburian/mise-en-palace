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

Inline excerpts from the sampled JSON:

```json
[
  {
    "query": "workers are not codex exec candidate maintenance contracts plnv",
    "selectedKnowledge": [
      {
        "id": "pattern:krn-brain-layer-model-boundary",
        "targetFit": "target_specific",
        "reviewability": "ready",
        "nextAction": "use"
      }
    ],
    "sourceSearch": {
      "answerUsefulness": "not_useful",
      "supportingClaims": 0,
      "supportingDocuments": 0,
      "sourceDecisionSupport": 0
    }
  },
  {
    "query": "naming standard no vanity rename helper extraction rule",
    "selectedKnowledge": [
      {
        "id": "pattern:krn-brain-layer-model-boundary",
        "targetFit": "target_specific",
        "reviewability": "ready",
        "nextAction": "use"
      }
    ],
    "sourceSearch": {
      "answerUsefulness": "not_useful",
      "supportingClaims": 0,
      "supportingDocuments": 0,
      "sourceDecisionSupport": 0
    }
  },
  {
    "query": "source-to-decision retention gate consumer falsifier",
    "selectedKnowledge": [
      {
        "id": "pattern:source-to-decision-retention-gate",
        "targetFit": "target_specific",
        "reviewability": "ready",
        "nextAction": "use"
      }
    ],
    "sourceSearch": {
      "answerUsefulness": "partly_useful_missing_claim",
      "supportingClaims": 0,
      "supportingDocuments": 1,
      "sourceDecisionSupport": 0
    }
  },
  {
    "query": "typescript unknown first result state JSON parse boundary",
    "selectedKnowledge": [
      {
        "id": "pattern:ts-boundary-unknown-first-result-state",
        "targetFit": "target_specific",
        "reviewability": "ready",
        "nextAction": "use"
      }
    ],
    "sourceSearch": {
      "answerUsefulness": "not_useful",
      "supportingClaims": 0,
      "supportingDocuments": 0,
      "sourceDecisionSupport": 0
    }
  }
]
```

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

## Second Opinion

`second-opinion-claude` reviewed the `n9gz/g1cg` pair against diff base
`2aeb0caf63a8a00a45137e28022935690bd958e7` and returned
`approve_with_fixes` / `MEDIUM`.

Accepted fixes:

- CI for head commit `1b22bb0` is now verified green:
  https://github.com/korneliuszburian/mise-en-palace/actions/runs/28690097938
- Inline excerpts above make the spot-check table reviewable without relying on
  `.local-lab` artifacts.
- `PLAN.md` now points at `fhku/td3u`, not completed `g1cg`.
- `krn-brain-layer-model-boundary` evidence refs use resolvable docs/plan paths.
- the `n9gz` report now names `fhku` as the source-grounding successor.
