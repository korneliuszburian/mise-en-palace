# Held-Out Memory Advantage Eval

Bead: `mise-en-palace-te9x`

## Change

Extended the deterministic memory advantage eval from four operating-loop
regression cases to a named held-out corpus:

```txt
corpus: company-pattern-memory-advantage-heldout
cases: 7 total, 3 held-out
distractor classes: obsolete-operating-rule, generic-quality-guidance,
adjacent-kernel-boundary, docs-sentinel-overfit, target-specific-vs-generic
```

The three held-out cases cover source-search command boundary recall,
DB-backed brain-search project selection, and ranking-corpus quality readback.
Each case records why no-memory and simple lexical baselines are insufficient.

## Proof

Verified:

```txt
pnpm --filter @krn/cli test -- memoryAdvantageEval deterministicEval
pnpm eval:memory-advantage
pnpm run typecheck
pnpm quality:fallow:ci
```

The test now requires held-out cases to have no-memory misses, simple lexical
distractor selection, KRN memory hits, and KRN plan/brief hits with expected
memory/source ids.

Second-opinion Claude:

```txt
initial verdict: approve_with_fixes / LOW
accepted fixes: aggregate context-size cost metrics, proof wording, queued-work PLAN line, self-referential case non-proof note
compact rereview: approve / LOW, no findings
```

## Non-Proof

This does not prove arbitrary superiority over vanilla Codex, production
retrieval quality, source truth, live Postgres runtime behavior, LLM output
quality, or product readiness. The held-out ranking-corpus-quality case is
self-referential to KRN's own eval behavior; it is retained as dogfood evidence,
not as external company-pattern generalization.
