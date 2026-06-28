# V304 Pattern-Gated Source Slice Trial

Status: controlled source-slice report.

Date: 2026-06-28

## Executive Verdict

V304 used the new Pattern Application Gate on a real bounded TypeScript source
slice. The slice added `--limit` to `krn knowledge cards`, keeping retained
pattern readback small enough for pre-coding use while preserving total result
count and proof boundaries.

This is a useful Pattern Brain step: retained patterns were queried before
coding, selected or rejected explicitly, and then classified after verification.
It does not prove semantic ranking, product readiness, DB-backed search, UI, API,
MCP, or automatic pattern enforcement.

## Selected Patterns

| Pattern | Expected use | Outcome | Evidence |
|---|---|---|---|
| `pattern:brain-knowledge-read-only-ui-boundary` | Keep the repair in read-only `knowledge cards` CLI output; do not add UI/API/MCP/search service. | helped | `packages/cli/src/runKnowledgeCardsCommand.ts`; `packages/cli/src/runKnowledgeCardsCommand.test.ts` |
| `pattern:ts-boundary-unknown-first-result-state` | Parse `--limit` as a positive integer at the CLI boundary and avoid passing `undefined` through exact optional properties. | helped | `packages/cli/src/parseKnowledgeArgs.ts`; `packages/cli/src/runCli.ts`; typecheck |
| `pattern:source-to-decision-retention-gate` | Keep the source slice bounded with consumer/falsifier and no broad pattern-brain expansion. | helped | this report; root `PLAN.md` |
| `pattern:evidence-proof-non-proof-boundary` | Make limited output state `totalCards`, `returnedCards`, and `limit` so truncation cannot masquerade as complete recall. | helped | JSON/text CLI readback; tests |

Rejected or deferred:

| Pattern | Reason |
|---|---|
| `pattern:target-repo-write-authority-boundary` | No target repository write. |
| `pattern:untrusted-context-warning-boundary` | No Codex brief or external context rendering changed. |
| `pattern:codex-skill-progressive-disclosure-routing` | No skill update required for this small CLI operator UX repair. |

## Change

Changed:

```txt
packages/cli/src/parseArgs.ts
packages/cli/src/parseKnowledgeArgs.ts
packages/cli/src/parseKnowledgeArgs.test.ts
packages/cli/src/runCli.ts
packages/cli/src/runKnowledgeCardsCommand.ts
packages/cli/src/runKnowledgeCardsCommand.test.ts
```

Behavior added:

```sh
krn knowledge cards \
  --catalog-file docs/brain-knowledge/catalog.json \
  --usefulness-outcome helped \
  --limit 3 \
  --json
```

The output now includes:

```txt
totalCards
returnedCards
limit
```

so a bounded pre-coding pattern query remains honest about how many cards were
filtered before limiting.

## Boundary Classification

Boundary:

```txt
CLI input boundary.
```

TypeScript decision:

- `--limit` is parsed from string input as a positive safe integer.
- invalid limits like `0`, negative numbers, decimals, or words fail parsing.
- runtime call uses an optional-property spread so `limit: undefined` is not
  passed under `exactOptionalPropertyTypes`.

## What This Proves

- `krn knowledge cards` can return bounded readback for pre-coding pattern
  selection.
- limited output does not hide total filtered result count.
- the CLI remains read-only and mutation-free.
- TypeScript exact optional property discipline caught and shaped the
  implementation.
- Pattern Application Gate changed implementation decisions in this slice.

## What This Does Not Prove

- semantic ranking quality;
- DB-backed knowledge search;
- browser UI/product UX;
- pattern completeness;
- automatic pattern selection;
- Memory Core mutation safety beyond the existing read-only command contract;
- product readiness.

## Pattern Application

```txt
pattern_application:
  - pattern_id: pattern:brain-knowledge-read-only-ui-boundary
    outcome: helped
    evidence: read-only CLI limit instead of UI/API/MCP
    does_not_prove: product UI/search readiness

  - pattern_id: pattern:ts-boundary-unknown-first-result-state
    outcome: helped
    evidence: positive integer parser, exact optional property fix, typecheck
    does_not_prove: complete TypeScript quality

  - pattern_id: pattern:source-to-decision-retention-gate
    outcome: helped
    evidence: bounded consumer/falsifier, no broad source intake
    does_not_prove: full research condensation

  - pattern_id: pattern:evidence-proof-non-proof-boundary
    outcome: helped
    evidence: totalCards/returnedCards/limit plus proof boundaries
    does_not_prove: ranking quality or recall completeness
```

## Finding

The first Pattern Application Gate query was too narrow:

```txt
knowledge cards pattern gate source slice operator UX TypeScript
```

It returned zero cards. Narrower follow-up queries like `knowledge`,
`TypeScript`, and `source-to-decision` returned useful cards.

Implication:

```txt
bounded output is now better, but zero-result pattern query feedback is still
weak. Operators need explicit no-match guidance before coding so they know
whether to broaden terms, remove filters, or record an explicit rejection.
```

## Next Recommended Action

Open V305:

```txt
Knowledge Cards No-Match Guidance
```

Goal:

```txt
When `krn knowledge cards` returns zero cards, render clear no-match guidance
that preserves read-only/proof boundaries and suggests bounded next steps
without adding semantic ranking or UI/API/MCP.
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `git fetch --prune && git status --short --branch && git log --oneline -n 8` | passed | local state was clean and current before V304 | future CI |
| `krn knowledge cards --usefulness-outcome helped --text "knowledge cards pattern gate source slice operator UX TypeScript" --json` | passed, 0 cards | overly narrow query can miss relevant retained patterns | ranking quality |
| `krn knowledge cards --usefulness-outcome helped --text knowledge --json` | passed, useful cards returned | broader query can surface relevant retained patterns | semantic completeness |
| `krn knowledge cards --usefulness-outcome helped --text TypeScript --json` | passed, 3 cards | TypeScript-related helped patterns are available | full TypeScript quality |
| `krn knowledge cards --usefulness-outcome helped --text source-to-decision --json` | passed, 3 cards | source-to-decision related helped patterns are available | research completeness |
| `pnpm --filter @krn/cli test -- parseKnowledgeArgs runKnowledgeCardsCommand` | passed, 213 tests | CLI parser/runtime tests cover `--limit` | product readiness |
| `krn knowledge cards --usefulness-outcome helped --limit 3 --json` | passed, `totalCards: 11`, `returnedCards: 3` | runtime limit preserves total count | ranking quality |
| `pnpm -r --workspace-concurrency=1 --if-present typecheck` | passed | TypeScript packages compile | runtime DB truth |
| `pnpm test` | passed | workspace tests pass locally | remote CI |
| `pnpm --filter @krn/harness test -- activePlanInvariants contextHygieneInvariants patternChainInvariants` | passed | root plan updates keep current-truth/context/pattern invariants | product readiness |
| `git diff --check` | passed | no whitespace errors in the diff | semantic correctness |
