# V296 Evidence Proof/Non-Proof Boundary Usefulness Feedback

Status: complete.

## Executive Verdict

V296 adds explicit `helped` usefulness feedback for:

```txt
pattern:evidence-proof-non-proof-boundary
```

The pattern materially helped recent dogfood and usefulness-feedback slices by
forcing every readback and report to state what commands, filters, and feedback
prove and what they do not prove. This prevented the pattern brain from treating
`helped` filters, no-feedback counts, and retained-pattern feedback as product
readiness or semantic-ranking proof.

## Scope

Changed:

- added `docs/brain-knowledge/usefulness-feedback/v296-evidence-proof-boundary.json`;
- added that file to `docs/brain-knowledge/catalog.json`;
- updated CLI expectations for the new helped/no-feedback counts;
- updated active plan state toward the next no-feedback pattern.

No package source behavior was changed.

## Feedback Added

```txt
cardId: pattern:evidence-proof-non-proof-boundary
outcome: helped
```

Summary:

```txt
Forced recent usefulness feedback and dogfood reports to state command/readback
proof limits, preventing helped/none filters and retained-pattern feedback from
being treated as product readiness or semantic-ranking proof.
```

Proof boundary:

```txt
This feedback does not prove command truth, semantic ranking quality, memory
quality, source truth, or product readiness.
```

## Readback Proof

`command provenance` query now returns the evidence proof/non-proof card with
`usefulnessFeedback.outcome = helped`.

`--usefulness-outcome helped` now returns 6 cards.

`--usefulness-outcome none` now returns 5 cards.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `pnpm --silent --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text "command provenance" --json \| jq ...` | passed | Evidence proof/non-proof card has attached `helped` feedback. | Does not prove command truth or product readiness. |
| `pnpm --silent --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --usefulness-outcome helped --json \| jq '.cards \| length'` | passed, 6 | Helped pattern set now includes evidence proof/non-proof. | Does not prove all helped patterns are equally useful. |
| `pnpm --silent --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --usefulness-outcome none --json \| jq '.cards \| length'` | passed, 5 | No-feedback backlog decreased from 6 to 5. | Does not prove remaining cards are less valuable. |
| `pnpm --filter @krn/cli test -- runKnowledgeCardsCommand` | passed | CLI readback tests match the new feedback state. | Does not prove product UI readiness. |

## What This Proves

- Evidence proof/non-proof boundary is useful in the pattern brain loop.
- KRN usefulness feedback can prevent false confidence while still recording
  progress.
- No-feedback backlog is shrinking through explicit evidence, not vibes.

## What This Does Not Prove

- Product readiness.
- Semantic ranking quality.
- Memory/source truth.
- That every command output is correct.
- UI/API/MCP/dashboard readiness.

## Source-To-Decision

- Source: V291..V296 dogfood reports and readback proof boundaries.
- Mechanism: proof/non-proof sections force Codex/KRN to separate readback
  success from product value.
- KRN implication: every retained pattern and feedback loop needs proof limits
  before it can influence future work.
- Decision: open V297 TypeScript Boundary Pattern Usefulness Feedback.
- Does not prove: evidence boundaries alone improve TypeScript quality.
- Consumer: V297 usefulness feedback for
  `pattern:ts-boundary-unknown-first-result-state`.
- Falsifier: the TypeScript boundary pattern cannot be tied to a recent slice
  where it improved boundary typing, unknown narrowing, or finite result state.

## Next Recommended Action

Open V297: TypeScript Boundary Pattern Usefulness Feedback.

This is the next highest-ROI no-feedback pattern because it connects KRN's
pattern brain to concrete TypeScript quality and the public best-pattern
material we want to keep condensing.
