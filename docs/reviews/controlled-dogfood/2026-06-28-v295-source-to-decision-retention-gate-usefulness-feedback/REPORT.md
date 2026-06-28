# V295 Source-To-Decision Retention Gate Usefulness Feedback

Status: complete.

## Executive Verdict

V295 adds explicit `helped` usefulness feedback for:

```txt
pattern:source-to-decision-retention-gate
```

The evidence is V257 and V265: the gate turned repeated TypeScript boundary
repair evidence into retained pattern knowledge with a mechanism, KRN
implication, consumer, falsifier, does-not-prove boundary, and later a typed
BrainKnowledge card producer.

This is the research/pattern condensation loop in small form. It does not prove
automatic research ingestion or a full "paper/course brain", but it proves the
gate is useful when a pattern has already shown repeat value in real repairs.

## Scope

Changed:

- added `docs/brain-knowledge/usefulness-feedback/v295-source-to-decision-retention-gate.json`;
- added that file to `docs/brain-knowledge/catalog.json`;
- updated CLI expectations for the new helped/no-feedback counts;
- updated active plan state toward the next no-feedback pattern.

No package source behavior was changed.

## Feedback Added

```txt
cardId: pattern:source-to-decision-retention-gate
outcome: helped
```

Summary:

```txt
Turned repeated TypeScript boundary repair evidence into a retained pattern
with mechanism, KRN implication, consumer, falsifier, does-not-prove boundary,
and follow-up enforcement path.
```

Proof boundary:

```txt
This feedback does not prove automatic research condensation, source truth,
research completeness, or that every retained source/pattern will be useful.
```

## Readback Proof

`source-to-decision` query now returns the source-to-decision card with
`usefulnessFeedback.outcome = helped`.

`--usefulness-outcome helped` now returns 5 cards.

`--usefulness-outcome none` now returns 6 cards.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `pnpm --silent --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text source-to-decision --json \| jq ...` | passed | Source-to-decision card has attached `helped` feedback. | Does not prove automatic research condensation. |
| `pnpm --silent --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --usefulness-outcome helped --json \| jq '.cards \| length'` | passed, 5 | Helped pattern set now includes source-to-decision. | Does not prove all helped patterns are equally important. |
| `pnpm --silent --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --usefulness-outcome none --json \| jq '.cards \| length'` | passed, 6 | No-feedback backlog decreased from 7 to 6. | Does not prove remaining cards are less valuable. |
| `pnpm --filter @krn/cli test -- runKnowledgeCardsCommand` | passed | CLI readback tests match the new feedback state. | Does not prove product UI readiness. |

## What This Proves

- Source-to-decision retention is useful for KRN's pattern brain.
- Research/course/paper/practitioner sources should be retained through
  mechanism/decision/falsifier, not copied as decorative context.
- Usefulness feedback can close the loop on research condensation patterns.

## What This Does Not Prove

- Full pattern brain.
- Automatic source ingestion.
- Source truth or research completeness.
- Product readiness.
- UI/API/MCP/dashboard readiness.

## Source-To-Decision

- Source: V257 pattern intake trial and V265 card producer.
- Mechanism: source-to-decision prevented repeated repair evidence from staying
  as narrative reports and turned it into a retained, typed, falsifiable pattern.
- KRN implication: research and best-practice intake should continue through
  this gate before becoming brain knowledge.
- Decision: open V296 Evidence Proof/Non-Proof Boundary Usefulness Feedback.
- Does not prove: source-to-decision alone enforces quality without evidence
  proof boundaries.
- Consumer: V296 usefulness feedback for
  `pattern:evidence-proof-non-proof-boundary`.
- Falsifier: evidence proof/non-proof cannot be tied to a recent slice where it
  prevented overclaiming or clarified what a command/report did not prove.

## Next Recommended Action

Open V296: Evidence Proof/Non-Proof Boundary Usefulness Feedback.

This is the next highest-ROI no-feedback pattern because the brain must not
turn retained patterns, command output, or reports into false certainty.
