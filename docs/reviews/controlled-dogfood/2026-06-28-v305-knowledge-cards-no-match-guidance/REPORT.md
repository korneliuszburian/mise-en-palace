# V305 Knowledge Cards No-Match Guidance

Status: controlled source-slice report.

Date: 2026-06-28

## Executive Verdict

V305 closed the immediate zero-result operator UX gap from V304. When
`krn knowledge cards` returns zero cards, the output now provides bounded
no-match guidance instead of leaving operators to guess whether no retained
pattern exists or the query was too narrow.

This improves Pattern Application Gate usability without adding semantic
ranking, UI, API, MCP, DB-backed search, source crawler, or mutation authority.

## Selected Patterns

| Pattern | Expected use | Outcome | Evidence |
|---|---|---|---|
| `pattern:brain-knowledge-read-only-ui-boundary` | Keep guidance inside read-only CLI/HTML/JSON preview output. | helped | `packages/cli/src/runKnowledgeCardsCommand.ts`; runtime output |
| `pattern:evidence-proof-non-proof-boundary` | State that zero results do not prove no relevant pattern exists or ranking quality. | helped | `noMatchGuidance`; command proof boundaries |
| `pattern:source-to-decision-retention-gate` | Keep the repair bounded and route the next finding to a concrete follow-up. | helped | this report; `PLAN.md`; `PLANS.md` |
| `pattern:ts-boundary-unknown-first-result-state` | Preserve typed read-only resource shape and avoid unsafe JSON/test parsing. | neutral | parse helper stayed unknown-first; no new CLI input boundary |

Rejected or deferred:

| Pattern | Reason |
|---|---|
| `pattern:target-repo-write-authority-boundary` | No target repository write. |
| `pattern:untrusted-context-warning-boundary` | No Codex brief or external context rendering changed. |
| `pattern:codex-skill-progressive-disclosure-routing` | No skill update required for this CLI output repair. |

## Change

Changed:

```txt
packages/cli/src/runKnowledgeCardsCommand.ts
packages/cli/src/runKnowledgeCardsCommand.test.ts
```

Behavior added:

```txt
noMatchGuidance:
  - No cards matched the current filters.
  - Try a shorter --text query or split the query into one mechanism term.
  - If this is a Pattern Application Gate pre-coding query, run one broader query before concluding no retained pattern applies.
  - Remove one structured filter such as --kind, --status, --reviewability, or --usefulness-outcome and retry.
  - If no retained pattern applies after retry, record an explicit rejected_or_deferred_patterns reason before coding.
  - Zero results do not prove that no relevant pattern exists or that search ranking is good.
```

The guidance is emitted in JSON, text, and static HTML preview output.

## What This Proves

- Zero-result `knowledge cards` readback now gives bounded next steps.
- The guidance preserves read-only and mutation-free behavior.
- The guidance preserves proof/non-proof boundaries.
- Tests cover JSON, text, and HTML no-match output.

## What This Does Not Prove

- semantic ranking quality;
- tokenized or multi-term search quality;
- DB-backed knowledge search;
- UI/API/MCP readiness;
- pattern completeness;
- automatic pattern selection;
- product readiness.

## Finding

V305 confirms the deeper reason the V304 pre-coding query missed relevant
patterns:

```txt
searchBrainKnowledgeCards currently treats --text as one normalized substring.
```

A natural operator query like:

```txt
knowledge cards pattern gate source slice operator UX TypeScript
```

can miss cards that contain many individual terms but not the whole exact
phrase. The no-match guidance now makes this failure reviewable, but the next
repair should make text search less brittle without pretending to be semantic
ranking.

## Next Recommended Action

Open V306:

```txt
Knowledge Cards Tokenized Text Search
```

Goal:

```txt
Change `knowledge cards --text` from whole-query substring matching to
deterministic tokenized matching, preserving read-only output, proof boundaries,
and no semantic ranking claims.
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `git fetch --prune && git status --short --branch && git log --oneline -n 8` | passed | local state was clean and current before V305 | future CI |
| `krn knowledge cards --usefulness-outcome helped --text "knowledge cards pattern gate source slice operator UX TypeScript" --json` | passed, 0 cards before repair context | reproduces brittle over-filtered query | absence of relevant patterns |
| `krn knowledge cards --usefulness-outcome helped --text knowledge --limit 5 --json` | passed, cards returned | broader query can surface relevant cards | semantic completeness |
| `pnpm --filter @krn/cli test -- runKnowledgeCardsCommand` | passed, 216 tests | CLI runtime tests cover no-match guidance | product readiness |
| `krn knowledge cards --usefulness-outcome helped --text "knowledge cards pattern gate source slice operator UX TypeScript"` | passed with no-match guidance | text output gives bounded next steps | search ranking quality |
| `krn knowledge cards --usefulness-outcome helped --text "knowledge cards pattern gate source slice operator UX TypeScript" --json` | passed with `noMatchGuidance` | JSON readback exposes guidance for tooling | DB-backed search |
| `pnpm -r --workspace-concurrency=1 --if-present typecheck` | passed | TypeScript packages compile | runtime DB truth |
| `pnpm test` | passed | workspace tests pass locally | remote CI |
| `git diff --check` | passed | no whitespace errors in the diff | semantic correctness |
