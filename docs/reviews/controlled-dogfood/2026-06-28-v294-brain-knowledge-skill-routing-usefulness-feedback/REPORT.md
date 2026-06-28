# V294 Brain Knowledge Skill Routing Usefulness Feedback

Status: complete.

## Executive Verdict

V294 adds explicit usefulness feedback for:

```txt
pattern:codex-skill-progressive-disclosure-routing
```

The outcome is `helped`. The evidence is bounded: V292 used the repo-local
`typescript-type-safety` skill for a real TypeScript boundary change, which kept
the implementation tied to a narrow CLI/harness boundary and prevented a broad
TypeScript docs/root-prompt expansion.

This does not prove automatic skill selection. It proves that when the relevant
skill is loaded, it can materially improve Codex execution discipline for a
real KRN source slice.

## Scope

Changed:

- added `docs/brain-knowledge/usefulness-feedback/v294-skill-routing-pattern.json`;
- added that file to `docs/brain-knowledge/catalog.json`;
- updated active plan state toward the next no-feedback pattern.

No package source was modified.

## Feedback Added

```txt
cardId: pattern:codex-skill-progressive-disclosure-routing
outcome: helped
```

Summary:

```txt
Routed V292 TypeScript boundary work through the repo-local
typescript-type-safety skill instead of expanding root prompts or rereading
broad TypeScript docs.
```

Proof boundary:

```txt
This feedback does not prove automatic skill selection, that every skill is
useful, or that Codex will always load the right skill without
operator/context guidance.
```

## Readback Proof

`progressive-disclosure` query now returns the skill-routing card with
`usefulnessFeedback.outcome = helped`.

`--usefulness-outcome helped` now returns 4 cards:

```txt
pattern:codex-execplan-living-validation-loop
pattern:codex-goal-continuation-evidence-contract
pattern:codex-prompt-task-contract-proof-boundary
pattern:codex-skill-progressive-disclosure-routing
```

`--usefulness-outcome none` now returns 7 cards.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `pnpm --silent --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text "progressive-disclosure" --json \| jq '.cards[] \| {id, outcome: .usefulnessFeedback.outcome, summary: .usefulnessFeedback.summary}'` | passed | Skill-routing card has attached `helped` feedback. | Does not prove automatic skill selection. |
| `pnpm --silent --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --usefulness-outcome helped --json \| jq '.cards[] \| .id'` | passed, 4 | Helped pattern set now includes skill routing. | Does not prove all helped cards are equally important. |
| `pnpm --silent --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --usefulness-outcome none --json \| jq '.cards \| length'` | passed, 7 | No-feedback backlog decreased from 8 to 7. | Does not prove remaining cards are less valuable. |

## What This Proves

- Skill-routing is no longer an unmeasured retained pattern.
- Repo-local skills can be represented as useful brain knowledge with explicit
  evidence refs and does-not-prove boundary.
- The usefulness feedback loop can reduce the no-feedback backlog.

## What This Does Not Prove

- Automatic skill selection.
- Product readiness.
- That every task should load every related skill.
- That skills replace source-to-decision or verification.
- That UI/API/MCP/dashboard work should start now.

## Source-To-Decision

- Source: V292 TypeScript boundary repair and V294 usefulness readback.
- Mechanism: a repo-local skill helps when it narrows the execution contract
  and avoids broad prompt/doc expansion for repeated work.
- KRN implication: skills are the right current bridge between retained brain
  knowledge and Codex execution, but usefulness must be measured per pattern.
- Decision: open V295 Source-To-Decision Retention Gate Usefulness Feedback.
- Does not prove: automatic research condensation or full pattern brain.
- Consumer: V295 research/pattern condensation usefulness proof.
- Falsifier: source-to-decision retention cannot be tied to a recent slice where
  it prevented source hoarding, vague pattern intake, or ungrounded decisions.

## Next Recommended Action

Open V295: Source-To-Decision Retention Gate Usefulness Feedback.

This is the next highest-ROI no-feedback pattern because it governs the research
and best-pattern condensation layer: source -> mechanism -> KRN implication ->
decision/rejection -> consumer -> falsifier.
