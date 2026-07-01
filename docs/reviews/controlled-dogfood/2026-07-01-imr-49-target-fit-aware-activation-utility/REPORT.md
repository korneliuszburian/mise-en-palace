# IMR-49 Target-Fit-Aware Activation Utility

Status: complete.

## Objective

Make `krn brain search` distinguish target-specific selectedKnowledge from
generic-only selectedKnowledge in the operator readback, without changing
ranking, selection, DB schema, Memory Core, source truth, or activation scoring.

## Source To Decision

- Source: IMR-48 selectedKnowledge target-fit readback and live `EKOLOGUS Brain quality gate` readback.
- Mechanism: packet-level `targetFit` showed generic guardrails, while the
  activation utility still reported `selected_knowledge_sufficient`.
- KRN implication: selectedKnowledge sufficiency must not silently imply
  target-specific context when every selected packet is generic.
- Decision: add a deterministic target-fit summary and let the top-level
  recommendation caveat generic-only or adjacent/unknown selectedKnowledge.
- Rejection: no ranking rewrite, crawler, schema, worker daemon, API/MCP,
  target writes, source truth mutation, eval promotion, or Memory Core mutation.
- Consumer: `krn brain search` JSON/text output and future multi-repo pattern
  gates.
- Falsifier: a generic-only selectedKnowledge run still recommends treating the
  packet set as sufficient without telling the operator to use target/source
  evidence first.

## Changed

- Added `knowledgeCards.targetFitSummary` to `krn.brainSearch.preview.v1`.
- Added summary verdicts:
  - `target_specific_selected_knowledge`
  - `generic_only_selected_knowledge`
  - `adjacent_or_unknown_selected_knowledge`
  - `no_selected_knowledge`
- Updated `recommendedNextAction` to caveat generic-only and adjacent/unknown
  selectedKnowledge before the older store/catalog recommendations.
- Excluded `doesNotProve` text from positive target-fit token matching, because
  a negative proof boundary should not create a target-specific hit.
- Split recommendation branching into smaller deterministic helpers after
  Fallow flagged the combined function complexity.
- Added a regression test for a q2-shaped generic-only selectedKnowledge run.

## Live Readback

Query:

```txt
EKOLOGUS Brain quality gate
```

Result:

```txt
targetFitSummary.verdict: generic_only_selected_knowledge
targetSpecific: 0
genericGuardrail: 4
recommendedNextAction: Treat selectedKnowledge as generic guardrails; use target/source evidence first before considering selected knowledge sufficient.
activationUtility.verdict: selected_knowledge_sufficient
```

Control query:

```txt
source artifact persisted readback SourceArtifact SourceChunk SearchDocument
```

Result:

```txt
targetFitSummary.verdict: target_specific_selected_knowledge
targetSpecific: 5
genericGuardrail: 0
```

## Verification

```txt
pnpm --filter @krn/cli test -- runBrainSearchCommand: passed
pnpm run typecheck: passed
pnpm quality:fallow:ci: passed
TMPDIR=/home/krn/.cache/krn-tmp pnpm test: passed
pnpm db:ready: passed
live q2 brain search readback: passed
live q1 brain search readback: passed
git diff --check: passed
```

## What This Proves

- Generic-only selectedKnowledge no longer silently reads as target-specific
  sufficiency in the top-level operator recommendation.
- The readback tells the operator to use target/source evidence first.
- Target-specific selectedKnowledge still receives a target-specific summary.
- The change is output/readback-only and does not mutate KRN state.

## What This Does Not Prove

- Activation scoring quality.
- Semantic ranking quality.
- Source truth.
- Product readiness.
- Graph, ingest, heartbeat, consensus, or Memory Core behavior.

## Next

Use the target-fit summary in the next compact Brain-QA/usefulness closure
before considering any activation scoring or ranking repair.
