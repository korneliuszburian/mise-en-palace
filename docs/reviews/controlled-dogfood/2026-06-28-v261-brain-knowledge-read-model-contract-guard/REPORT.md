# V261 Brain Knowledge Read Model Contract Guard

Status: complete.

Date: 2026-06-28.

## Executive Verdict

V261 added a focused harness invariant for the `BrainKnowledgeReadModel`
contract. Future UI/search work now has a failing guard if the knowledge card
contract drops reviewability, source refs, evidence refs, consumers,
falsifier, does-not-prove, temporal state, dissent state, or read-only UI/search
boundaries.

This keeps future UI/search from becoming decorative dashboard work or a hidden
mutation path.

## Changed

- `packages/harness/src/brainKnowledgeReadModelInvariants.test.ts`
- `docs/reviews/controlled-dogfood/2026-06-28-v261-brain-knowledge-read-model-contract-guard/REPORT.md`
- compact active pointers in `PLAN.md`, `GOAL.md`, and `PLANS.md`

## Guarded Behavior

The invariant fails if:

- `BrainKnowledgeReadModel` disappears;
- required fields disappear:
  `kind`, `status`, `confidence`, `reviewability`, `sourceRefs`,
  `evidenceRefs`, `consumers`, `falsifier`, `doesNotProve`, `temporal`,
  `dissent`, `nextAction`;
- UI/search is no longer gated behind read-only cards;
- the model allows mutation of Memory Core, SourceDecision, candidate status, or
  evidence;
- dashboard readiness loses the read-only typed read-model boundary.

## Source-To-Decision

- Source: V260 read-model contract and ADR-0025 dashboard readiness gate.
- Mechanism: a UI/search-ready knowledge card needs source/evidence refs,
  reviewability, falsifier, and proof/non-proof boundary before rendering.
- KRN implication: future UI/search must be built over protected read models,
  not raw reports or mutable memory shortcuts.
- Decision: add a harness invariant for `BrainKnowledgeReadModel`.
- Does not prove: UI/search implementation, ranking quality, or product
  readiness.
- Consumer: V262 Brain Knowledge Card Fixture.
- Falsifier: a future UI/search slice can remove required fields or introduce a
  mutation path while the invariant still passes.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/harness test -- brainKnowledgeReadModelInvariants` | passed, 32 files / 155 tests | read-model contract invariant passes locally | UI/search implementation |

## What This Proves

- Future UI/search read-model work has a protected contract.
- Read-only boundary is explicit and tested.
- Required evidence/source/reviewability fields cannot disappear silently.

## What This Does Not Prove

- UI/search exists;
- search ranking works;
- product readiness;
- real operator usefulness.

## Next Active Task

V262-00 Brain Knowledge Card Fixture.

Goal:

```txt
Create one reviewable BrainKnowledgeReadModel fixture/card for the retained
TypeScript boundary pattern so future UI/search has a concrete object to render
and test.
```
