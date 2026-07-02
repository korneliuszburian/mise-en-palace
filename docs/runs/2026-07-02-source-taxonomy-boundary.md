# Source Taxonomy Boundary

## Verdict

The audit finding was live.

`SourceTrustTier` still carries both ordinal authority (`high`, `medium`,
`low`) and source class (`official`, `source-code`, `paper`, etc.).
`SourceSupportType` still carries both relation-like values (`supports`,
`contradicts`, `qualifies`, `does_not_support`) and source-to-decision use
values (`mechanism`, `decision`, `risk`, etc.).

This slice does not rename DB columns or migrate enum storage. It adds an
explicit compatibility projection so activation/source consumers can distinguish
trust level, source kind, support relation, and source use before a DB migration.

## Source To Decision

```yaml
source_id: repo-local-audit-ljxl
title: Source taxonomy mixes authority, source kind, relation, and use
trust_tier: high
source_class: repo-local evidence
mechanism: Existing source fields store mixed concepts: trustTier can mean either ordinal trust or source class, and supportType can mean either claim relation or source-to-decision use.
krn_implication: Activation and source review need a stable taxonomy boundary before more graph work; otherwise future ranking, review, and DB migrations will keep guessing semantics from legacy strings.
decision_kind: adopt
decision: Keep legacy trustTier/supportType storage for compatibility, but add core taxonomy projections and carry them into activation candidates and context assembly readback.
does_not_prove: This does not prove DB source schema is normalized, historical rows are migrated, graph ranking quality improved, or source truth is correct.
consumer: packages/core/src/source.ts; packages/harness/src/activation/rankCandidates.ts; packages/harness/src/activation/assembleContext.ts
falsifier: A source activation consumer must infer trust level, source kind, relation, or use directly from trustTier/supportType instead of the explicit taxonomy projection.
```

## Implementation

- Added core taxonomy value sets and projections:
  - `SourceTrustLevel` for `high | medium | low`;
  - `SourceKind` for source class, with `unspecified` for legacy ordinal-only
    tiers;
  - `SourceSupportRelation` for explicit relation semantics;
  - `SourceUse` for source-to-decision use semantics.
- Added `classifySourceTrustTier`, `classifySourceSupportType`, and
  `classifySourceClaimTaxonomy`.
- Kept `rankSourceTrustTier` and legacy `SourceTrustTier` values unchanged for
  compatibility.
- Derived decision-grade support from the explicit support taxonomy instead of
  a separate hand-written list.
- Carried taxonomy projections from `SourceClaim` into activation candidates and
  then into `ContextInclusion` / `ContextExclusion`.

## Compatibility Path

Current storage remains:

```txt
source_claims.trust_tier
source_claims.support_type
source_decision_edges.support_type
```

The next DB migration can add first-class columns only after consumers have used
the projection long enough to prove field semantics:

```txt
trust_level
source_kind
support_relation
source_use
```

Until then, DB rows remain readable and existing CLI/source commands keep their
current input contract.

## Verification

```txt
rtk pnpm --filter @krn/core test -- source
rtk pnpm --filter @krn/harness test -- activation/index.test.ts
rtk pnpm -C packages/core typecheck
rtk pnpm -C packages/harness typecheck
```

Result:

- focused core source tests: passed, 14 files / 75 tests;
- focused harness activation tests: passed, 36 files / 201 tests;
- core package typecheck: passed;
- harness package typecheck: passed.

## Proof Boundary

Proves:

- Core source taxonomy now has explicit trust-level, source-kind, support-
  relation, and source-use projections.
- Activation candidates and context assembly can carry source taxonomy without
  parsing legacy `trustTier` / `supportType` strings.
- Decision-grade support is derived from the taxonomy projection.

Does not prove:

- DB schema is normalized.
- Historical source rows are migrated.
- Source graph ranking quality improved.
- Source claims are true.
- All CLI/source readbacks display the new taxonomy fields.
- KRN is product-ready.
