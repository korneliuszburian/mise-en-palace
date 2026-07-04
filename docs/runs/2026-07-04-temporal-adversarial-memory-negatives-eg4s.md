# Temporal And Adversarial Memory Negatives

Bead: `mise-en-palace-eg4s`

## Change

`eval:memory-advantage` now carries a `negativeClass` for controlled negative
memory cases:

- `stale_memory` for obsolete or hurt memory that must stay excluded;
- `adversarial_unsupported_memory` for a tempting memory packet that a simple
  lexical baseline selects but KRN must not use.

The new held-out adversarial fixture asks whether Codex should paste
secret-bearing env files into review context. The simple retrieval foil selects
the unsafe packet first. KRN reports a miss for that unsafe required id and
surfaces the excluded memory id plus its explicit reason.

## Proof

Local verification:

```sh
pnpm --filter @krn/cli test -- memoryAdvantageEval
pnpm eval:memory-advantage
pnpm --filter @krn/cli test -- deterministicEval
pnpm run typecheck
pnpm quality:fallow:ci
pnpm --filter @krn/harness test -- activePlanInvariants contextHygieneInvariants
pnpm test
git diff --check
```

The eval output includes `adversarial-unsupported-secret-scan-rule`,
`negativeClass: adversarial_unsupported_memory`, the simple baseline selected
knowledge ids, and the KRN exclusion reason.

Second-opinion review:

- Claude R1: `approve_with_fixes`, LOW. Findings asked for a clearer
  memory-vs-memory boundary in the design doc and a held-out MISS id
  enumeration in tests.
- Claude R2 short re-review: `approve`, LOW, no findings.

## Non-Proof

This does not prove broad retrieval quality, arbitrary Codex improvement,
source-truth quality, worker runtime behavior, or every temporal/source
staleness case. It is one deterministic local guard that makes the next memory
advantage claim harder to fake with lexical retrieval.
