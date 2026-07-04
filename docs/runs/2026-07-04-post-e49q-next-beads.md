# Post-E49Q Next Beads Synthesis

Baseline:

- `mise-en-palace-23qu` closed runtime contradiction memory/source eval proof.
- `mise-en-palace-e49q` closed source graph relation-shape eval coverage.
- KRN CI is green for both pushed commits.
- Beads ready/open/in-progress was empty after `e49q`.

## Stop/Continue Falsification

Stopping is not acceptable. `PLAN.md` still says product-ready is `no` and names
three remaining product gaps:

1. pattern/research brain quality beyond helped-feedback planning bias;
2. source/graph relation ranking quality across broader corpora;
3. product UI/API/MCP only after usefulness/security gates.

The next queue should therefore seed usefulness/eval/product-gate work, not
dashboard/API/MCP, worker daemon, broad benchmark platform, or historical-doc
cleanup.

## Proposed Beads

### P1: eval: add execution-contract memory advantage proof

Gap: pattern/research brain quality.

Acceptance:

- Add one deterministic memory-advantage case where selected KRN memory/source
  changes an execution-contract-like decision, not only selectedKnowledge text.
- Output reports baseline decision, KRN decision, selected ids, selected-context
  size, and proof/non-proof.
- Baseline must choose a plausible but wrong implementation contract without
  KRN memory/source.
- KRN decision must be mechanically derived from selected memory/source ids.

Non-goals:

- no live LLM call;
- no broad benchmark;
- no dashboard/API/MCP;
- no new memory runtime.

Verification:

```sh
pnpm --filter @krn/cli test -- memoryAdvantageEval
pnpm eval:memory-advantage
pnpm typecheck
pnpm quality:fallow:ci
```

Dependencies: none. Priority: P1.

### P1: eval: add source-graph held-out relation corpus split

Gap: source/graph relation ranking quality across broader corpora.

Acceptance:

- Add a second small source-graph ranking fixture or fixture section with
  held-out relation-shape queries separate from the current compact corpus.
- Cover at least two relation kinds and one direction-sensitive relation case.
- Report corpus name, held-out query count, relation kinds, hit-rate/NDCG, and
  flat comparison.
- Keep wording to "held-out relation corpus split", not broad ranking closure.

Non-goals:

- no graph database redesign;
- no crawler/API/MCP;
- no claim of source truth or production ranking quality.

Verification:

```sh
pnpm --filter @krn/cli test -- sourceGraphRankingEval deterministicEval
pnpm eval:source-graph-ranking
pnpm typecheck
pnpm quality:fallow:ci
```

Dependencies: none. Priority: P1.

### P2: behavior: add Codex-output evidence shape gate

Gap: product usefulness/security gates before product UI/API/MCP.

Acceptance:

- Add a deterministic behavior fixture that validates expected Codex-output
  evidence shape after a rendered brief, without calling an LLM.
- The gate should assert required evidence fields and explicit non-proof when a
  run claims it followed KRN context.
- Failure case rejects output that cites KRN context without evidence refs.

Non-goals:

- no live Codex invocation;
- no promptfoo/LLM judge;
- no dashboard/API/MCP;
- no broad benchmark.

Verification:

```sh
pnpm eval:krn:smoke
pnpm --filter @krn/harness test -- krnBehaviorGate
pnpm typecheck
pnpm quality:fallow:ci
```

Dependencies: none. Priority: P2.

### P2: source-search: expose relation direction coverage in eval readback

Gap: source/graph relation ranking quality.

Acceptance:

- Extend source-graph ranking eval readback with expected and observed relation
  directions for at least one incoming and one outgoing relation case.
- Add a regression test where relation kind is present but direction coverage is
  incomplete and status fails.
- Keep proof boundary explicit: relation direction readback, not source truth.

Non-goals:

- no DB schema change;
- no graph algorithm rewrite;
- no broad corpus quality claim.

Verification:

```sh
pnpm --filter @krn/cli test -- sourceGraphRankingEval
pnpm eval:source-graph-ranking
pnpm typecheck
pnpm quality:fallow:ci
```

Dependencies: `eval: add source-graph held-out relation corpus split` may make
this easier but does not block it. Priority: P2.

## Next Move

Create the P1 Beads first. Start with the execution-contract memory advantage
proof unless source-graph corpus work becomes the only ready task after Beads
dependency resolution.
