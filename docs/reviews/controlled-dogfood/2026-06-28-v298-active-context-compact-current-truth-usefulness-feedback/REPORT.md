# V298 Active Context Compact Current Truth Usefulness Feedback

Status: controlled dogfood report.

Date: 2026-06-28

## Executive Verdict

`pattern:active-context-compact-current-truth` is useful. The clearest evidence
is repeated continuation pressure from stale pasted objectives while current
root `GOAL.md`, `PLAN.md`, and `PLANS.md` named a newer active stream. The
pattern prevented rollback to stale work and kept the next action bounded to
the current root truth instead of broad historical rereads.

This is a pattern-brain usefulness finding, not product-readiness proof.

## Scope

Pattern reviewed:

```txt
pattern:active-context-compact-current-truth
```

Files changed:

```txt
docs/brain-knowledge/usefulness-feedback/v298-active-context-current-truth.json
docs/brain-knowledge/catalog.json
packages/cli/src/runKnowledgeCardsCommand.test.ts
GOAL.md
PLAN.md
PLANS.md
```

Non-goals:

- no implementation change;
- no source intake;
- no UI/API/MCP/dashboard;
- no Memory Core mutation;
- no product-ready claim.

## Evidence

The V288 dogfood report recorded a stale pasted objective naming `V05` while
current root state named `V288`. The selected goal-continuation/current-truth
pattern kept root `GOAL.md`, `PLAN.md`, and `PLANS.md` authoritative and
treated the pasted objective as historical evidence.

The same class of risk recurred in later continuation context: stale objective
text can survive compaction or attachments while root active state has advanced.
The pattern is therefore not decorative; it directly reduces context waste and
active-stream rollback risk.

## Feedback Added

```txt
cardId: pattern:active-context-compact-current-truth
outcome: helped
summary: Kept continuation on current root GOAL/PLAN/PLANS state when pasted
  objectives still named stale streams, preventing active-stream rollback and
  broad historical rereads.
```

Proof boundary:

```txt
This does not prove every future continuation will choose current truth
automatically, that all historical docs are clean, or product readiness.
```

## Readback Proof

After this slice:

```txt
--usefulness-outcome helped includes pattern:active-context-compact-current-truth
--usefulness-outcome none excludes pattern:active-context-compact-current-truth
```

Confirmed count movement:

```txt
helped: 7 -> 8
none: 4 -> 3
```

## Brain Usefulness

Verdict: positive.

What helped:

- compact root current truth prevented stale objective rollback;
- no-feedback filtering surfaced the next useful pattern instead of scanning all
  retained patterns;
- explicit feedback turns a resume-safety rule into searchable brain knowledge.

What is still weak:

- this is not a semantic ranking proof;
- this does not prove future auto-compaction will always be safe;
- this does not prove web UI/search readiness.

## Source-To-Decision

Source:

- V288 dogfood report;
- current root `GOAL.md`, `PLAN.md`, and `PLANS.md` continuation rules;
- retained pattern card for active-context/current-truth.

Mechanism:

- stale pasted objectives can survive compaction or attachment context;
- compact root current truth gives Codex a deterministic resume authority;
- usefulness feedback makes the rule searchable and measurable.

KRN implication:

- active context/current truth is a retained pattern that should be selected for
  future resume, handoff, and `/goal` continuation work.

Decision:

- mark `pattern:active-context-compact-current-truth` as `helped`.

Consumer:

- future continuation, handoff, compaction, and active-plan edits.

Falsifier:

- a future resume follows stale pasted objective text over root current truth
  while the pattern is available and selected.

## Next Recommended Action

Open V299:

```txt
Brain Knowledge Read-Only UI Boundary Usefulness Feedback
```

Reason:

```txt
The next no-feedback pattern is closest to the user's web/search question.
Before building a web UI, prove whether the read-only preview/search boundary
already helped prevent premature API/MCP/dashboard scope.
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `git status --short --branch` | passed | worktree was clean before edits and branch was on `main...origin/main` | remote CI status |
| `krn knowledge cards --text "current-truth" --json` | passed | card existed and had no usefulness feedback before this slice | future ranking quality |
| `krn knowledge cards --usefulness-outcome helped --json` | passed | `helped` readback includes 8 cards including active-context/current-truth | product readiness or semantic ranking quality |
| `krn knowledge cards --usefulness-outcome none --json` | passed | no-feedback readback decreased to 3 cards | that remaining cards are unimportant |
| `pnpm --filter @krn/cli test -- runKnowledgeCardsCommand` | passed | CLI readback/filter tests cover the new feedback count | full repo behavior |
| `pnpm --filter @krn/harness test -- contextHygieneInvariants activePlanInvariants patternChainInvariants brainKnowledgeReadModelInvariants brainKnowledgeReadModel` | passed | root-plan, pattern-chain, and read-model invariants still pass | product readiness |
| `pnpm -r --workspace-concurrency=1 --if-present typecheck` | passed | TypeScript packages still typecheck | runtime DB behavior |
| `pnpm test` | passed | full local test suite passed | remote CI status |
| `git diff --check` | passed | diff has no whitespace errors | correctness of the decision |
| `rg ... current-truth/V05/root state` | passed | local docs contain evidence of stale objective conflict and current root authority | automatic future resume correctness |
