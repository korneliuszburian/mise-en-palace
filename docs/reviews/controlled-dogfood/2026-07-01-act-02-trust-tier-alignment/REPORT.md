# ACT-02: Activation And Source Trust Tier Alignment

Date: 2026-07-01

Beads issue: `mise-en-palace-8hb`

## Summary

This slice aligned activation trust filtering with the canonical source trust
tier domain.

Before this slice, activation policy and harness filtering treated trust as a
narrow `low | medium | high` scale while source claims and DB/readback surfaces
also used richer tiers such as `official`, `project-decision`, `source-code`,
`paper`, `practitioner`, `secondary`, and `hypothesis`.

The fix exports one canonical source trust tier list from `@krn/core`, derives
the `SourceTrustTier` type from it, reuses it in schema parsing, and routes
activation filtering/ranking through `rankSourceTrustTier`.

## Source To Decision

```yaml
source_id: act-02-local-audit-and-repo-evidence
title: Activation trust tier drift between source, schema, and harness
trust_tier: high
source_class: repo-local evidence + user-provided audit
mechanism: >
  Source trust ranking already lived in the source domain, but activation and
  schema duplicated narrower or divergent trust-tier vocabularies. Divergent
  trust vocabularies can make activation exclude/include source-backed context
  differently from source-domain semantics.
krn_implication: >
  Trust filtering is a KRN activation boundary. It must use one explicit source
  trust authority, not parallel local rank tables.
decision_kind: adopt
decision: >
  Export `sourceTrustTiers` from `@krn/core`, derive `SourceTrustTier` from it,
  use it in schema enum parsing, widen activation policy minimumTrustTier to
  `SourceTrustTier`, remove harness-local `trustRank`, and keep activation
  scoring semantics as coarse low/medium/high bands through a local score
  helper backed by `rankSourceTrustTier`.
does_not_prove: >
  This does not prove activation ranking quality, retrieval quality, product
  readiness, live DB source truth, or that trust tiers are the right taxonomy
  long-term.
consumer: >
  source claim/artifact schema parsing, activation trust filtering, activation
  ranking, context assembly, persisted activation readbacks.
falsifier: >
  A canonical source tier such as `paper` fails the high activation threshold,
  `secondary` fails the medium threshold, schema rejects a core trust tier, or a
  new trust tier can be added without tests failing in schema and activation.
```

Retained pattern readbacks used:

- `source-to-decision-retention-gate`
- `ts-boundary-unknown-first-result-state`

## Changed

- `packages/core/src/source.ts`
  - exported `sourceTrustTiers`;
  - derived `SourceTrustTier` from the tuple;
  - kept `rankSourceTrustTier` as the ranking authority.
- `packages/core/src/activation.ts`
  - changed `ActivationPolicy.minimumTrustTier` to `SourceTrustTier`.
- `packages/schema/src/sourceClaim.ts`
  - derived `SourceTrustTierSchema` from the core tuple.
- `packages/harness/src/activation/trustFilter.ts`
  - filtered with `rankSourceTrustTier` instead of a harness-local rank table.
- `packages/harness/src/activation/rankCandidates.ts`
  - selected stronger trust with `rankSourceTrustTier`;
  - preserved the existing coarse activation scoring bands.
- Tests:
  - core source trust tuple coverage;
  - schema accepts all canonical source trust tiers;
  - activation high/medium thresholds behave deterministically for rich tiers.

## Verification

```txt
pnpm --filter @krn/core test -- source
pnpm --filter @krn/schema test -- index.test.ts
pnpm --filter @krn/harness test -- activation/index.test.ts compiler/index.test.ts
pnpm run typecheck
TMPDIR=/home/krn/.cache/krn-tmp pnpm test
pnpm quality:fallow:ci
pnpm quality:fallow
pnpm db:ready
pnpm --filter @krn/db db:check
pnpm db:smoke:activation
git diff --check
```

All commands passed in the current shell.

Fallow note: the changed-file CI gate passed. Full Fallow still reports existing
duplication groups in DB schema and one inherited activation helper duplication
between `contextRoi.ts` and `rankCandidates.ts`; this slice did not broaden into
that cleanup.

## Proof

Proves:

- source, schema, and activation now share the same trust-tier vocabulary;
- rich source tiers have deterministic activation threshold behavior;
- low/medium/high policy behavior is preserved through core rank thresholds;
- no DB schema migration was needed.

Does not prove:

- activation scoring quality;
- source truth quality;
- graph/vector retrieval quality;
- end-to-end product-loop completeness;
- product readiness.

## Brain Usefulness

Verdict: positive.

The retained `source-to-decision` and TypeScript boundary patterns helped keep
the slice bounded: one canonical domain tuple, one schema consumer, one
activation consumer, explicit falsifier. Fallow was useful as a review layer but
did not identify a changed-file blocker.

## Next Recommended Action

Add one governed integration proof for the real product loop:

```txt
EvidenceBundle
-> observation/reflection input
-> candidate
-> review/promote-or-reject decision
-> memory/activation reuse or explicit abstention
```

The audit's highest-value remaining gap is still the absence of one small
end-to-end test for the KRN brain loop. That should take priority over deleting
preview files or broad cleanup.
