# V292 Brain Knowledge Missing Usefulness Feedback Readback

Status: complete.

## Executive Verdict

V292 makes missing usefulness feedback discoverable through the same read-only
brain knowledge CLI surface as normal usefulness outcomes.

Operators can now run:

```sh
pnpm --filter @krn/cli krn knowledge cards \
  --catalog-file docs/brain-knowledge/catalog.json \
  --usefulness-outcome none
```

and get the retained pattern cards that have not yet proven usefulness in a real
slice. This closes the V291 gap where static preview could label
`Usefulness: none`, but CLI users still had to scan all cards or rely on
browser-only state.

## Scope

Changed:

- `BrainKnowledgeSearchFilter` now accepts `usefulnessOutcome: "none"`;
- `searchBrainKnowledgeCards` treats `"none"` as missing feedback, not as a
  persisted feedback outcome;
- `parseKnowledgeArgs` accepts `--usefulness-outcome none`;
- text output renders `usefulnessOutcome: none` for cards without feedback;
- focused harness and CLI tests guard the behavior.

Not changed:

- usefulness feedback record schema;
- Memory Core;
- DB schema;
- API/MCP/dashboard;
- semantic ranking;
- source intake;
- promotion behavior.

## TypeScript Boundary

Boundary classification: CLI external input and harness read-model filtering.

Pattern applied:

```txt
pattern:ts-boundary-unknown-first-result-state
```

Decision:

```txt
BrainKnowledgeUsefulnessOutcome remains the persisted feedback outcome union.
BrainKnowledgeUsefulnessOutcomeFilter extends it with "none" only for readback.
```

This avoids pretending that missing feedback is an actual feedback record.

## Readback Proof

Command:

```sh
pnpm --silent --filter @krn/cli krn knowledge cards \
  --catalog-file docs/brain-knowledge/catalog.json \
  --usefulness-outcome none \
  --json
```

Result:

```txt
8 cards:
- pattern:active-context-compact-current-truth
- pattern:brain-knowledge-read-only-ui-boundary
- pattern:codex-skill-progressive-disclosure-routing
- pattern:evidence-proof-non-proof-boundary
- pattern:source-to-decision-retention-gate
- pattern:target-repo-write-authority-boundary
- pattern:untrusted-context-warning-boundary
- pattern:ts-boundary-unknown-first-result-state
```

Text readback for `--usefulness-outcome none --text "unknown-first"` includes:

```txt
usefulnessOutcome: none
```

Combined filter readback:

```txt
--usefulness-outcome none --text unknown-first
```

returns only:

```txt
pattern:ts-boundary-unknown-first-result-state
```

This matters because the first implementation attempt exposed a real edge case:
`none` must combine with other filters, not short-circuit text search.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `pnpm --filter @krn/harness test -- brainKnowledgeReadModel` | passed | Harness filters missing feedback with `usefulnessOutcome: "none"`. | Does not prove missing-feedback cards are bad or stale. |
| `pnpm --filter @krn/cli test -- parseKnowledgeArgs runKnowledgeCardsCommand` | passed | CLI parses and renders missing-feedback readback. | Does not prove UX is product-ready. |
| `pnpm --silent --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --usefulness-outcome none --json \| jq '.cards \| length'` | passed, 8 | Current catalog has 8 retained patterns without feedback. | Does not prove the remaining 8 are useless. |
| `pnpm --silent --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --usefulness-outcome none --text "unknown-first"` | passed | Text output exposes `usefulnessOutcome: none` for missing feedback. | Does not prove semantic ranking or DB truth. |
| `pnpm --silent --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --usefulness-outcome none --text unknown-first --json \| jq '.cards[] \| .id'` | passed, 1 | Missing-feedback filtering composes with text filtering. | Does not prove ranking quality or that this card should be prioritized. |

## What This Proves

- Missing usefulness feedback is now a first-class readback query.
- The pattern brain can identify unmeasured retained patterns.
- `none` is a filter state, not a stored usefulness feedback outcome.
- Operators can prioritize usefulness dogfood without scanning all cards.

## What This Does Not Prove

- Product readiness.
- Semantic search or ranking quality.
- That no-feedback cards are invalid.
- That every card needs immediate feedback.
- That this knowledge came from live DB state.
- That UI/API/MCP/dashboard work should start now.

## Source-To-Decision

- Source: V291 dogfood finding and V292 implementation readback.
- Mechanism: a pattern catalog becomes actionable when it exposes both proven
  useful cards and cards with missing usefulness evidence.
- KRN implication: usefulness coverage should drive the next dogfood, not more
  source intake by default.
- Decision: open V293 Brain Knowledge Missing Feedback Triage Dogfood.
- Does not prove: missing feedback means the pattern should be demoted.
- Consumer: V293 triage and usefulness-feedback selection.
- Falsifier: operators cannot select the next highest-value no-feedback card
  from the `none` readback without reading all 8 full cards.

## Next Recommended Action

Open V293: Brain Knowledge Missing Feedback Triage Dogfood.

Use `--usefulness-outcome none` to choose the highest-ROI no-feedback pattern
for the next usefulness proof. Do not add more retained patterns, UI/API/MCP,
dashboard, or semantic ranking until at least one no-feedback card has been
triaged through real operator use.
