# Ranking Corpus Quality Readback

Bead: `mise-en-palace-cyhk`

## Change

Broadened the deterministic brain and source graph ranking fixtures so the eval
surface reports corpus identity, corpus size, distractor classes, expected-id
counts, and baseline failure rationale instead of only compact hit-rate output.

The brain ranking fixture now includes an adjacent plan-brief memory advantage
case, plus per-case distractor classes for adjacent governance, target-specific
versus generic evidence, catalog/source confusion, and obsolete negative memory.

The source graph ranking fixture now exposes a named source graph quality corpus
and corpus-level distractor classes for adjacent governance sources, stale
relation edges, lexical/vector ambiguity, and target-specific versus generic
evidence. Each query also carries a baseline failure rationale so a passing
hit-rate cannot hide why the case exists.

## Proof

Verified:

```txt
pnpm --filter @krn/cli test -- brainRankingEval sourceGraphRankingEval
pnpm eval:brain-ranking
pnpm eval:source-graph-ranking
pnpm run typecheck
pnpm quality:fallow:ci
git diff --check
```

The evals now fail if expected proxy-labeled memory/source ids fall out of top-k
selection, and the JSON readbacks expose why the corpus is harder than a
doc-sentinel check.

Second-opinion Claude:

```txt
initial verdict: approve_with_fixes / MEDIUM
accepted fixes: source graph baseline rationale, PLAN.md premature closeout wording, distractorClassCount consistency check
full rereview: timeout artifact, not used as approval
compact rereview: approve / LOW, no findings
```

## Non-Proof

This still does not prove production semantic ranking quality, source truth,
live pgvector retrieval quality, LLM output quality, crawler readiness, external
target usefulness, or product readiness.
