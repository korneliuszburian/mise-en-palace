# V289 Brain Knowledge Pattern Usefulness Feedback Readback

Status: complete.

## Executive Verdict

V289 makes retained pattern usefulness feedback visible through the existing
read-only brain knowledge catalog surface. Pattern cards can now show the latest
usefulness outcome, summary, evidence refs, and does-not-prove boundary without
DB schema changes, API, MCP, dashboard, or Memory Core mutation.

This closes the immediate V288 gap: usefulness feedback no longer lives only in
narrative reports.

## Scope

Added:

- `BrainKnowledgeUsefulnessFeedback` parser and latest-feedback applicator in
  `packages/harness/src/brainKnowledgeReadModel.ts`;
- catalog-side feedback artifact:
  `docs/brain-knowledge/usefulness-feedback/v288-external-codex-workflow-patterns.json`;
- catalog pointer:
  `docs/brain-knowledge/catalog.json#usefulnessFeedbackFiles`;
- CLI readback/rendering for usefulness feedback in text, JSON, and HTML;
- focused harness and CLI tests.

No DB schema, Memory Core mutation, API, MCP, dashboard, crawler, or new source
intake was added.

## TypeScript Boundary

Boundary classification: external docs/catalog JSON.

Pattern applied:

```txt
pattern:ts-boundary-unknown-first-result-state
```

Implementation:

- usefulness feedback JSON enters as `unknown`;
- parser validates `cardId`, `outcome`, `summary`, non-empty `evidenceRefs`,
  `doesNotProve`, and optional `observedAt`;
- invalid feedback missing proof boundaries is rejected;
- CLI receives typed feedback and attaches latest feedback by `cardId`.

## Readback Proof

Command:

```sh
pnpm --filter @krn/cli krn knowledge cards \
  --catalog-file docs/brain-knowledge/catalog.json \
  --text "goal continuation"
```

Output included:

```txt
Usefulness feedback files: docs/brain-knowledge/catalog.json:usefulness-feedback/v288-external-codex-workflow-patterns.json
usefulnessOutcome: helped
usefulnessSummary: Prevented stale pasted V05 objective from rolling the active stream backward from V288.
usefulnessEvidenceRefs: docs/reviews/controlled-dogfood/2026-06-28-v288-brain-knowledge-external-pattern-usefulness-dogfood/REPORT.md, GOAL.md#current-objective, PLAN.md#current-product-state, PLANS.md#current-state
usefulnessDoesNotProve: This feedback does not prove automatic resume correctness or product readiness.
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `pnpm --filter @krn/harness test -- brainKnowledgeReadModelInvariants brainKnowledgeReadModel` | passed | Harness parser and invariants accept usefulness feedback with proof boundaries. | Does not prove all future feedback is useful. |
| `pnpm --filter @krn/cli test -- runKnowledgeCardsCommand` | passed | CLI catalog readback renders usefulness feedback. | Does not prove semantic ranking or DB truth. |
| `pnpm --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text "goal continuation"` | passed | Operator can inspect latest usefulness feedback for a retained pattern card. | Does not prove automatic application, product readiness, or complete feedback history. |

## What This Proves

- Pattern usefulness feedback can be retained as explicit read-only catalog data.
- CLI/static preview resources can expose feedback alongside pattern cards.
- Feedback records keep evidence refs and does-not-prove boundaries.
- The implementation preserves unknown-first parsing for docs/catalog JSON.

## What This Does Not Prove

- Product readiness.
- Semantic search.
- Ranking quality.
- That feedback should be promoted to Memory Core.
- That all retained patterns have feedback.
- That a single latest feedback item is enough for long-term product analytics.

## Next Recommended Action

Open V290: Brain Knowledge Usefulness Outcome Filter.

The next narrow gap is filtering. Operators can now see usefulness feedback, but
cannot directly filter for cards whose latest feedback is `helped`, `neutral`,
`noise`, `stale`, or `unknown`. Add the smallest read-only filter in CLI/static
preview. Do not add DB, API, MCP, dashboard, or more external sources.
