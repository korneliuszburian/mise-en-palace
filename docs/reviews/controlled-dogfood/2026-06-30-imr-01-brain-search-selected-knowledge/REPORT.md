# IMR-01 Brain Search Selected Knowledge Packet

Status: complete source slice.

## Verdict

`krn brain search` now returns a compact `selectedKnowledge` packet for matched
brain knowledge, not only a card id. This makes the readback more useful for an
agent before coding because the response includes title, summary, consumers,
falsifier, does-not-prove, and next action.

This is not the final brain algorithm. It is a product-facing readback
improvement over the existing brain-search preview.

## Source To Decision

Source: active KRN product direction in `GOAL.md`, `PLAN.md`, and the current
IMR-00 task.

Mechanism: an agent using the KRN brain needs an immediately usable pattern
packet, not just an opaque retained-pattern id.

KRN implication: `brain search` should expose enough selected brain knowledge
for pre-coding pattern application while preserving proof/non-proof boundaries.

Decision: add `selectedKnowledge` to the brain-search preview and render the
text section as "Brain knowledge".

Consumer: Codex/operator pre-coding brain search, pattern application gate, and
future multi-repo internal operator loop.

Falsifier: a future run still needs a second manual `knowledge cards` lookup to
understand why a selected pattern matters or what would falsify its use.

Does not prove: semantic ranking quality, source truth, graph reasoning,
completeness of retained patterns, product readiness, or Memory Core mutation.

## Changed

- `packages/cli/src/runBrainSearchCommand.ts`
- `packages/cli/src/runBrainSearchCommand.test.ts`

No DB schema, Memory Core, source graph, crawler, worker runtime, API, MCP, or
dashboard changes.

## Verification

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/cli test -- runBrainSearchCommand parseBrainArgs` | passed | focused brain-search parser/runner behavior | product readiness |
| `pnpm -r --workspace-concurrency=1 --if-present typecheck` | passed | workspace TypeScript strictness | runtime behavior |
| `pnpm test` | passed | full repo tests pass after the output change | semantic ranking quality |
| `pnpm quality:fallow:ci` | passed | no Fallow issues in changed files | whole-repo perfection |
| `git diff --check` | passed | diff whitespace is clean | behavior correctness |
| `KRN_DATABASE_URL=... krn brain search --query "source-to-decision" --limit 1 --json` | passed | live readback includes `selectedKnowledge` and proof boundaries | source truth, completeness, Memory Core mutation |

## Brain Usefulness

Helped:

- `source-to-decision-retention-gate` and related retained-pattern mechanics
  shaped the output: selected knowledge must carry consumer, falsifier, and
  does-not-prove boundaries.
- Fallow stayed clean on the changed files.

Missing / follow-up:

- The JSON compatibility field is still named `knowledgeCards`. Full product
  language migration is tracked separately in Beads as
  `mise-en-palace-1s6`.

## Next

Continue IMR work by either:

1. migrating user-facing "knowledge cards" vocabulary toward brain knowledge /
   knowledge substrate language; or
2. improving the algorithmic brain layer next: activation/ranking, graph
   relation traversal, heartbeat candidate selection, or consensus evaluation.
