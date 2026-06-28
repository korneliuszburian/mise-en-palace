# V297 TypeScript Boundary Pattern Usefulness Feedback

Status: complete.

## Executive Verdict

V297 adds explicit `helped` usefulness feedback for:

```txt
pattern:ts-boundary-unknown-first-result-state
```

The pattern materially helped V292 model missing usefulness feedback as a
readback-only filter state rather than a persisted feedback outcome. It also
forced the implementation to compose `none` with text search and guard the
behavior with focused tests.

This is a concrete TypeScript quality improvement: external/readback state is
represented as explicit finite union states instead of loose strings or
ambiguous booleans.

## Scope

Changed:

- added `docs/brain-knowledge/usefulness-feedback/v297-typescript-boundary-pattern.json`;
- added that file to `docs/brain-knowledge/catalog.json`;
- updated CLI expectations for helped/no-feedback counts and the combined
  `none + text` filter test;
- updated active plan state toward the next no-feedback pattern.

No package source behavior was changed in this slice.

## Feedback Added

```txt
cardId: pattern:ts-boundary-unknown-first-result-state
outcome: helped
```

Summary:

```txt
Guided V292 to model missing usefulness feedback as a readback-only union state,
keep persisted feedback outcomes separate, and compose the filter with text
search through focused tests.
```

Proof boundary:

```txt
This feedback does not prove complete TypeScript quality, automatic skill
selection, real target transfer, or product readiness.
```

## Readback Proof

`explicit result state` query now returns the TypeScript boundary card with
`usefulnessFeedback.outcome = helped`.

`--usefulness-outcome helped` now returns 7 cards.

`--usefulness-outcome none` now returns 4 cards.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `pnpm --silent --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text "explicit result state" --json \| jq ...` | passed | TypeScript boundary card has attached `helped` feedback. | Does not prove complete TypeScript quality. |
| `pnpm --silent --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --usefulness-outcome helped --json \| jq '.cards \| length'` | passed, 7 | Helped pattern set now includes TypeScript boundary. | Does not prove all helped patterns are equally useful. |
| `pnpm --silent --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --usefulness-outcome none --json \| jq '.cards \| length'` | passed, 4 | No-feedback backlog decreased from 5 to 4. | Does not prove remaining cards are less valuable. |
| `pnpm --filter @krn/cli test -- runKnowledgeCardsCommand` | passed | CLI readback tests match the new feedback state. | Does not prove target-repo transfer. |

## What This Proves

- The TypeScript boundary pattern is useful for KRN source/readback work.
- Missing feedback should be represented as a readback/filter state, not a fake
  persisted outcome.
- Focused tests should guard filter composition, not just happy-path filtering.

## What This Does Not Prove

- Complete TypeScript quality.
- Product readiness.
- Automatic skill selection.
- Real target transfer.
- That every TypeScript pattern from external courses has been condensed.

## Source-To-Decision

- Source: V292 missing-feedback readback and TypeScript boundary implementation.
- Mechanism: explicit finite states and boundary narrowing prevent ambiguous
  input/output states from leaking into operator readback.
- KRN implication: TypeScript best-pattern intake should keep producing
  falsifiable, finite-state boundary rules before broad code-quality automation.
- Decision: open V298 Active Context Compact Current Truth Usefulness Feedback.
- Does not prove: context hygiene by itself improves TypeScript quality.
- Consumer: V298 usefulness feedback for
  `pattern:active-context-compact-current-truth`.
- Falsifier: active context compactness cannot be tied to a recent continuation
  where it prevented stale objective rollback or context waste.

## Next Recommended Action

Open V298: Active Context Compact Current Truth Usefulness Feedback.

This is the next highest-ROI no-feedback pattern because the current goal
depends on surviving compaction/resume without stale objectives or plan sprawl.
