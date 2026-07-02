# Source Decision Edge Authority

Date: 2026-07-02

## Scope

Beads: `mise-en-palace-b89r`

Goal: prevent proposed SourceClaims from becoming decision-grade
`SourceDecisionEdge` or `SourceClaimEdge` support before adoption.

## Source To Decision

```yaml
source_id: repo-local-audit-source-decision-edge-gap
title: SourceDecisionEdge guard allowed proposed SourceClaims
url: repo-local
trust_tier: high
source_class: repo-local evidence
mechanism: DrizzleSourceRepository rejected rejected/deprecated claims for
  decision support but allowed proposed claims through the same guard used by
  SourceDecisionEdge and SourceClaimEdge creation.
krn_implication: Proposed SourceClaims could look decision-supporting before a
  SourceDecision adopted them.
decision_kind: adopt
decision: Require accepted SourceClaims for decision-grade source support.
does_not_prove: This does not prove accepted claims are true, ranking quality,
  graph retrieval quality, or product readiness.
consumer: DrizzleSourceRepository, source graph smoke, krn source decision link
falsifier: A proposed/rejected/deprecated SourceClaim can still create or
  appear as SourceDecisionEdge/SourceClaimEdge support.
```

## Changed

- `assertSourceDecisionSourceClaimCanSupport` now accepts only
  `status: "accepted"`.
- `krn source decision link --persist` now rejects any non-accepted SourceClaim
  before calling `createSourceDecisionEdge`.
- Source graph smoke now adopts both endpoint claims before creating relation or
  decision-support edges.
- Focused CLI/DB tests cover proposed, rejected, deprecated, and accepted
  statuses.

## Proof

Commands run:

```sh
rtk pnpm --filter @krn/db test -- DrizzleSourceRepository sourceGraphSmoke
rtk pnpm --filter @krn/cli test -- source
rtk proxy pnpm --filter @krn/db typecheck
rtk proxy pnpm --filter @krn/cli typecheck
rtk pnpm --filter @krn/harness test -- activePlanInvariants contextHygieneInvariants
rtk pnpm quality:fallow:ci
rtk proxy pnpm typecheck
rtk pnpm test
rtk git diff --check
```

All passed locally.

CI:

```txt
KRN CI 28621751037: passed
```

## Non-Proof

- `KRN_DATABASE_URL` was not set locally, so DB smoke commands were not run
  before commit.
- This does not change source taxonomy, activation ranking, or graph retrieval.
- This does not prove accepted SourceClaims have correct external truth; it only
  prevents non-accepted claims from becoming decision-support edges.

## Rollback Risk

Medium-low. Fixtures or workflows that used proposed SourceClaims as graph or
decision support must now adopt those claims explicitly first. That is the
intended authority boundary.
