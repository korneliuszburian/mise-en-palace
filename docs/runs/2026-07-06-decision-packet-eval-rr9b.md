# Decision Packet Eval (`rr9b`)

## Outcome

Added `eval:decision-packet`, a deterministic pre-code packet-quality benchmark.

The eval reuses the existing notes-baseline real-task corpus and measures a
different surface: whether KRN can assemble a governed decision packet before
code is written.

Each packet reports:

- governing decision ids;
- SourceClaim refs;
- SourceDecisionEdge refs;
- memory refs;
- stale-decision exclusion ids;
- rejected-path ids;
- falsifiers;
- does-not-prove boundaries;
- noise decisions;
- severe stale-authority inclusions.

## Result

```txt
status: pass
caseCount: 17
usefulCount: 17
noisyCount: 0
missCount: 0
staleAuthorityCount: 0
usefulRate: 1
averageNoiseDecisions: 2
severeStaleAuthorityInclusions: 0
```

Thresholds:

```txt
minimumUsefulRate: 0.8
maximumSevereStaleAuthorityInclusions: 0
maximumAverageNoiseDecisions: 2
```

## Proof

Proves:

- deterministic pre-code task packets include governing decisions, SourceClaim
  refs, SourceDecisionEdge refs, memory refs, falsifiers, and does-not-prove
  boundaries;
- packet scoring reports stale-decision exclusions and rejected-path visibility
  before coding starts;
- packet quality is gated by a predeclared useful-rate threshold and zero severe
  stale-authority inclusions;
- `eval:behavior:smoke` now includes this gate.

Does not prove:

- live Codex execution or obedience;
- source truth;
- operator willingness to pay;
- broad arbitrary-repo packet quality;
- production semantic retrieval quality;
- memory refs correspond to existing MemoryRecord rows;
- acceptable packet review burden for every task.

## Verification

```sh
pnpm --filter @krn/cli test -- decisionPacketEval deterministicEval
pnpm eval:decision-packet
pnpm eval:determinism
pnpm -C packages/cli typecheck
pnpm docs:lint
pnpm --filter @krn/cli typecheck:tests:clean
pnpm eval:behavior:smoke
git diff --check
```

## Second Opinion

`second-opinion-claude` returned `approve_with_fixes`, MEDIUM. Accepted fixes:

- severe stale-authority detection now reads the raw ranked top-k before
  current-only governing decisions are assembled, making the gate falsifiable;
- stale/rejected decision rank-down is stronger in the shared decision scoring
  helper;
- a negative test widens top-k and asserts `qualityLabel: stale_authority`;
- memory refs are explicitly non-proofed as structural refs, not verified
  MemoryRecord rows.

A focused re-review returned `approve_with_fixes`, LOW. Accepted fix:

- the passing test now locks the memory-ref non-proof line, and the stale
  authority negative test verifies the fixture has 34 decisions and
  `markdown-runtime-memory` is stale.
