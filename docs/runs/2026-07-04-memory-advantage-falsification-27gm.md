# Memory Advantage Falsification

Bead: `mise-en-palace-27gm`

## Change

`pnpm eval:memory-advantage` now reports explicit advantage deltas instead of
treating every passing KRN hit as broad advantage.

Added four held-out falsification cases:

| `falsificationClass` | case id |
| --- | --- |
| `short_context_no_advantage` | `neutral-short-context-second-opinion` |
| `single_turn_no_memory_needed` | `neutral-single-turn-typecheck` |
| `retrieval_not_needed` | `neutral-retrieval-not-needed-docs` |
| `breaks_interdependent_advantage` | `neutral-breaks-codex-output-evidence-advantage` |

Current readback:

- total cases: 17
- held-out cases: 13
- advantage wins: 11
- neutral/no-advantage cases: 4
- broken-prior-advantage cases: 1

The broken-prior-advantage case is one of the four neutral/no-advantage cases,
not an additional disjoint bucket. The remaining two cases are expected-miss
negative-memory/source cases.

The neutral interdependent-style case intentionally shows the baseline and KRN
selecting the same evidence-shaped contract when the prompt already contains
the decisive evidence-shape terms.

## Proof

- Falsification cases are visible in eval JSON through `falsificationClass`.
- Each case reports `advantageDelta.result`.
- Neutral cases require `baseline_simple_retrieval.result=top_match_selected`
  and `simpleRetrievalAlreadySufficient=true`.
- `eval:codex-output-comparator` consumes only execution-contract cases whose
  `advantageDelta` is `win`, so neutral boundary cases do not masquerade as
  changed Codex-vs-KRN contracts.

## Non-Proof

- Does not prove arbitrary task superiority over vanilla Codex.
- Does not prove production retrieval quality.
- Does not prove live Codex execution or output quality.
- Does not prove every KRN hit is an advantage over a simple lexical baseline.

## Second Opinion

`second-opinion-claude` first timed out on the full context pack. The compact
review returned `approve_with_fixes` and found that the run report listed
`falsificationClass` values without the actual case ids. After adding the
mapping, the re-review found that the count buckets needed overlap
clarification. This report now states that the broken-prior-advantage case is
also one of the neutral/no-advantage cases.

## Verification

```sh
pnpm --filter @krn/cli test -- memoryAdvantageEval codexOutputComparatorEval
pnpm eval:memory-advantage
pnpm docs:lint
git diff --check
```
