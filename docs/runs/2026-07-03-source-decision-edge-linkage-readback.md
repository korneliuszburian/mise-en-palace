# SourceDecisionEdge Linkage Readback

Date: 2026-07-03
Bead: `mise-en-palace-c79a`

## Objective

Prove one persisted `SourceDecisionEdge` from an accepted `SourceClaim` to a
concrete KRN target through an operator-facing command/readback path.

## What Changed

Added `krn source decision adopt` so an operator can adopt a proposed
`SourceClaim` through a persisted `SourceDecision` before linking the claim to a
target with `krn source decision link`.

The adoption command is fail-closed: after persisting the decision it requires
`getSourceClaimById` to read back the linked claim as `accepted`. Missing or
non-accepted readback is an error, not a successful proof message.

## Dogfood IDs

```txt
sourceClaimId: 7e61831e-c8b0-47af-b0a1-2b24711ce466
sourceDecisionId: 30d5f834-b3bf-4c2a-96f7-6b75d512356b
sourceDecisionEdgeId: 82b3fd3c-e1b4-4dcd-95e4-125c0b35389b
target: harness_run/e98c2ec2-941a-4e68-8243-e491f952827f
supportType: implementation-boundary
confidence: high
```

## Evidence

Local dogfood artifacts:

```txt
.local-lab/c79a/source-claim-add.txt
.local-lab/c79a/source-decision-adopt.txt
.local-lab/c79a/source-decision-link.txt
.local-lab/c79a/db-readback.txt
.local-lab/c79a/evidence-capture.txt
```

Persisted evidence IDs:

```txt
evidenceBundle: 5682f82b-8c29-472c-a0e8-3f6a45afe551
reviewAssessment: 0405bbfd-2669-4645-81d8-41f8533b9088
feedbackDelta: bfb67830-e063-47dd-b718-e602e939d7ec
```

Key readback:

```txt
sourceDecisionEdge: 82b3fd3c-e1b4-4dcd-95e4-125c0b35389b
sourceDecisionEdgeReadback: hit
sourceClaimId: 7e61831e-c8b0-47af-b0a1-2b24711ce466
target: harness_run/e98c2ec2-941a-4e68-8243-e491f952827f
```

Direct DB readback also found the persisted `SourceDecision`, persisted
`SourceDecisionEdge`, and accepted `SourceClaim` status for the same IDs.

Verification:

```txt
pnpm --filter @krn/cli test -- source: passed (348 tests)
pnpm --filter @krn/core test -- source: passed
pnpm -w typecheck: passed
```

Second-opinion Claude:

```txt
initial verdict: approve_with_fixes / MEDIUM
final verdict after fixes: approve_with_fixes / LOW
initial artifact: .local-lab/second-opinion/c79a/claude.json
final artifact: .local-lab/second-opinion/c79a/final-claude.json
```

Triage:

- F1 partial-write risk: rejected with code evidence. `DrizzleSourceRepository.createSourceDecision`
  wraps SourceDecision insert, SourceClaim lifecycle update, and outbox insert in
  one `db.transaction`.
- F2 missing non-accepted readback branch: fixed with a `proposed` readback
  regression test.
- F3 missing required-field usage path: fixed with required-field parser
  validation and usage test.
- F4 dogfood-only adopt-to-link regression: fixed with a focused sequential
  adopt -> link test.
- Final LOW output asymmetry finding: fixed by printing `rationale` and
  `falsifier` in persisted adoption output, with a test assertion.
- Final transaction evidence gap: countered with repository code evidence.
  `DrizzleSourceRepository.createSourceDecision` wraps source claim read,
  SourceDecision insert, SourceClaim status update, and outbox insert in
  one `db.transaction`.

## Proof

This proves one operator-facing path can:

- persist a `SourceDecision` that adopts a proposed `SourceClaim`;
- require accepted claim readback after adoption;
- persist a `SourceDecisionEdge` from that accepted claim to a concrete
  `harness_run`;
- read back the persisted decision edge by ID through the link command.

## Non-Proof

This does not prove source truth, graph ranking quality, source-search ranking
quality, crawler readiness, worker runtime behavior, or product readiness.

`krn source search` did not surface this dogfood claim because the command uses
the resolved runtime project and does not currently expose a `--project` selector.
That is a source-search/operator-readback ergonomics gap, not a failure of the
persisted decision-edge readback path proven here.

## Rollback Risk

Low to medium. The new command adds an operator-facing adoption path and shares
the existing source parser/runtime shape. Runtime behavior is stricter than a
preview-only path because persisted adoption now fails if accepted claim readback
is missing.
