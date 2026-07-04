# Execution-Contract Memory Advantage R529

Bead: `mise-en-palace-r529`

## Change

`eval:memory-advantage` now reports one execution-contract decision readback in
the held-out JSON metadata boundary case.

The case compares:

- baseline contract: `contract:cast-json-record`;
- KRN contract: `contract:unknown-first-parser`;
- derivation order: `source_claims_first`;
- selected memory/source ids and approximate selected-context size.

The contract decision is deterministic. It is derived from selected ids, not
from an LLM judgment.

## Proof

Proves:

- a no-memory baseline misses the needed company-pattern evidence;
- a simple lexical baseline selects the tempting unsafe JSON-cast memory first;
- KRN selected memory/source changes the reported execution contract to the
  source-backed unknown-first parser contract;
- the output carries baseline contract, KRN contract, selected ids,
  selected-context size, and proof/non-proof text.

Does not prove:

- live Codex execution;
- that Codex implemented the reported contract;
- arbitrary code quality;
- production retrieval quality;
- product readiness.

## Verification

```sh
pnpm --filter @krn/cli test -- memoryAdvantageEval
pnpm eval:memory-advantage
```
