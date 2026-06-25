# Memory Feedback And Demotion Loop Report

Status: B-03 completion report.

Date: 2026-06-25

## Executive Verdict

B-03 closed the first practical memory application feedback loop. `krn memory
record apply` now keeps positive feedback simple, but stale or hurt feedback
creates a reviewable `AntiMemoryCandidate` follow-up. It does not demote,
invalidate, or promote memory automatically.

## Scope

Changed:

- `packages/cli/src/runMemoryRecordApplyCommand.ts`
- focused CLI tests in `packages/cli/src/runCli.test.ts`

Not changed:

- Memory Core promotion rules;
- MemoryReviewGate;
- activation scoring;
- reflection extraction;
- DB schema;
- dashboard/API/MCP/server;
- worker runtime.

## Implementation Summary

For `outcome: helped` or `neutral`:

- record `MemoryApplication`;
- no feedback event for `helped`;
- no follow-up candidate.

For `outcome: hurt` or `stale`:

- record `MemoryApplication`;
- create a negative `MemoryFeedbackEvent`;
- create a reviewable `AntiMemoryCandidate` when source lineage exists;
- keep final Memory Core state unchanged.

The candidate metadata includes:

- `memoryRecordId`;
- `memoryApplicationId`;
- `memoryFeedbackEventId`;
- `applicationOutcome`;
- `doesNotProve`.

## DB-Backed Dogfood

The dogfood used B-02 activation run:

```txt
164e9158-d03b-4957-a3cd-72bee3ce3dd1
```

### Positive memory application

```txt
memoryRecord: f950b8b4-5392-4084-9f98-93881fbe961a
outcome: helped
memoryApplication: 2cce86ec-72da-4fc0-a9cf-e57767e7edc3
Feedback event: none
Follow-up candidate: none
```

Reason:

```txt
Helped preserve review-gated Memory Core boundary during B-02 research-to-brain ingestion.
```

### Stale memory application

```txt
memoryRecord: 41d1a2ef-3578-4e45-947f-42c6739796de
outcome: stale
memoryApplication: 6ca318e6-828e-42b5-8c8d-a326a0745a8c
memoryFeedbackEvent: 51ceba10-2eae-409b-bbe2-6c183e60bc11
antiMemoryCandidate: 5ca36316-f94a-4e63-be3d-a56126fc84c7
Candidate reviewability: review
```

Reason:

```txt
Stale: this memory still recommends krn audit slice as a governance proof; current roadmap uses evidence capture, DB smoke, dogfood reports, and source-to-decision records instead.
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/cli test -- runCli parseMemoryArgs runMemoryRecordApplyCommand` | passed | Focused CLI tests cover helped/stale memory application and candidate output. | Does not prove full workspace behavior. |
| `pnpm --filter @krn/cli typecheck` | passed | CLI TypeScript boundaries compile after candidate output change. | Does not prove DB runtime state. |
| `KRN_DATABASE_URL=... krn memory record apply ... --outcome helped --persist` | passed | Helped feedback records MemoryApplication without follow-up candidate. | Does not prove all positive feedback use is valuable. |
| `KRN_DATABASE_URL=... krn memory record apply ... --outcome stale --persist` | passed | Stale feedback records MemoryApplication, MemoryFeedbackEvent, and AntiMemoryCandidate. | Does not prove the candidate should be accepted. |

## What This Does Not Prove

- Memory demotion is correct.
- Anti-memory candidate should be promoted.
- Activation already consumes this candidate.
- Memory usefulness is solved at scale.
- Target-repo product readiness.

## Next Recommended Action

Continue to:

```txt
B-04 — Anti-Memory Conflict Integration
```

B-04 should use `antiMemoryCandidate:
5ca36316-f94a-4e63-be3d-a56126fc84c7` as input evidence if it is still
appropriate, but must not auto-promote it. The next slice should make
anti-memory influence activation only through reviewed records or explicit
review-gated setup.
