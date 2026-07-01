# RFD-01 Review Feedback Domain Ownership

Date: 2026-07-01

## Verdict

Positive.

The audit finding was directionally right but stale in one detail:
`packages/core/src/reviewFeedback.ts` no longer existed. The live duplicate was
vocabulary. `reviewSignal.ts` held shared review outcome/readback helpers, while
real review signals also exist as Memory/Source blocking-signal domains.

This slice removes that false parallel concept by making
`reviewOutcome.ts` the shared owner for review status, outcome, risk, burden,
metadata readers, and normalized outcome summaries.

No DB schema, persistence shape, review gate behavior, memory promotion behavior,
dashboard, API, MCP, worker daemon, or broad refactor was added.

## KRN Plan

Persisted plan run:

```txt
executionRun: e6fd67a4-1b94-419b-b56e-af2f81551173
operatorIntent: d5543a1e-eae7-428b-9a72-a1bd6adac6b5
taskContract: 12edd6a2-ffc2-41d7-afd1-1a2e5936ec02
harnessPlan: 109301b0-6c37-4e7d-b665-725cf307d2de
contextAssembly: f5be8359-32cf-4913-9f8b-53b88b86bf3a
```

Activation usefulness: weak/mixed. The plan selected broad product guardrails
and unrelated owner files. Direct source inspection found the actual owners:

```txt
packages/core/src/reviewOutcome.ts
packages/core/src/reviewAssessment.ts
packages/core/src/feedbackDelta.ts
packages/core/src/reviewOutcome.test.ts
packages/core/src/reviewDomain.test.ts
packages/cli/src/runReviewAssessCommand.ts
```

Retained pattern readback selected no matching pattern for review-domain
ownership. `ts-boundary-unknown-first-result-state` was considered but not
directly applied because this slice renamed internal domain vocabulary and did
not add a new external input boundary.

## Source-To-Decision

Source: live repo source and the RFD-01 Beads issue.

Mechanism: `ReviewAssessment` records the review verdict for an
`EvidenceBundle`; `FeedbackDelta` records candidate/proposal deltas derived
from that review; both normalize into a shared readback shape. Memory/Source
review signals are different: they are domain safety signals that can block or
warn. Naming the shared readback module `reviewSignal` created ambiguous domain
ownership.

KRN implication: shared review normalization should not be named like the
Memory/Source signal domains. Keep ReviewAssessment and FeedbackDelta as
separate spine objects, but give their shared normalization/readback vocabulary
one accurate owner.

Decision: adopt `reviewOutcome.ts` and `NormalizedReviewOutcomeSummary`.

Rejected: merging `ReviewAssessment` and `FeedbackDelta`; they have separate
DB-backed lifecycle roles and current tests/smokes depend on that split.

Consumer: core exports, review-assess CLI imports through `@krn/core`, harness
observer input, DB mappers/smokes, and future review-domain cleanup.

Falsifier: typecheck/test failures, callers needing actual blocking
Memory/Source review-signal semantics from `reviewOutcome`, or DB readback
showing ReviewAssessment/FeedbackDelta semantics drifted.

## Changed

- Renamed `packages/core/src/reviewSignal.ts` to
  `packages/core/src/reviewOutcome.ts`.
- Renamed `NormalizedReviewSignal` to `NormalizedReviewOutcomeSummary`.
- Updated `ReviewAssessment` and `FeedbackDelta` normalization return types.
- Updated core exports to expose `reviewOutcome`.
- Renamed focused tests:
  - `reviewSignal.test.ts` -> `reviewOutcome.test.ts`
  - `reviewFeedback.test.ts` -> `reviewDomain.test.ts`

## Verification

Passed:

```txt
pnpm db:ready
pnpm --filter @krn/core test -- reviewOutcome reviewDomain
pnpm --filter @krn/cli test -- runReviewAssessCommand parseReviewArgs
pnpm run typecheck
TMPDIR=/home/krn/.cache/krn-tmp pnpm test
pnpm quality:fallow:ci
pnpm quality:fallow
git diff --check
krn evidence capture --persist --run-id e6fd67a4-1b94-419b-b56e-af2f81551173
krn observe --run-id e6fd67a4-1b94-419b-b56e-af2f81551173 --persist
krn reflect --scope run:e6fd67a4-1b94-419b-b56e-af2f81551173 --persist
```

Fallow changed-files gate passed with no findings. Broad Fallow completed and
reported existing baseline duplication groups in DB schema/harness files; they
were not changed-file findings and are out of this slice's scope.

The first persisted evidence capture for this run used `--command` rows and
therefore produced weak `default_template/not_run` command proof. It was
superseded by the corrected `--verification` capture:

```txt
evidenceBundle: bc1724f6-f9b0-4c4e-aaf7-c57d1244fe64
reviewAssessment: 9f815bb1-bf36-4ada-b050-f5f43519d1cc
feedbackDelta: 5692f2d5-aaa3-40be-8aa1-067888eae517
observationGroup: 316e726d-be49-4cb3-9b66-d9e6c7a63fee
observationItems: 9
reflectionRecord: 76b5921a-a138-4f5c-a871-ccba1d6eb7ac
```

Corrected evidence capture classified all changed files as intended:

```txt
intended: 13
unrelated: 0
unknown: 0
command proof: 7 operator_reported / passed
memory mutation: none
```

## What Improved

- Removed one misleading review-domain concept from active source.
- Kept shared normalization/readback behavior in one owner module.
- Made the domain split clearer:
  - `ReviewAssessment`: review verdict for evidence;
  - `FeedbackDelta`: candidate/proposal delta from review;
  - `reviewOutcome`: shared normalized outcome/readback vocabulary;
  - Memory/Source review signals: actual domain safety signals.
- Preserved existing ReviewAssessment, FeedbackDelta, candidate summary, and CLI
  behavior.

## What This Does Not Prove

- broad review-domain simplification is complete;
- DB schema is ideal;
- ReviewAssessment/FeedbackDelta should never be further consolidated;
- external consumers are unaffected by the public export rename;
- review quality, candidate quality, or product readiness.

## Candidate Outputs

MemoryCandidate:

```txt
Candidate: Shared review normalization should use outcome/readback vocabulary,
not signal vocabulary.
Decision: review
Reviewability: ready
Evidence refs:
- packages/core/src/reviewOutcome.ts
- packages/core/src/reviewAssessment.ts
- packages/core/src/feedbackDelta.ts
- this report
doesNotProve: does not prove all review-domain duplication is gone
```

AntiMemoryCandidate:

```txt
Candidate: Do not merge ReviewAssessment and FeedbackDelta solely because both
normalize review outcome metadata.
Decision: review
Reviewability: ready
Evidence refs:
- packages/core/src/reviewAssessment.ts
- packages/core/src/feedbackDelta.ts
- packages/db/src/repositories/DrizzleHarnessRunRepository.ts
doesNotProve: does not prove the current persistence model is final
```

## Next Recommended Action

Continue the audit/product cleanup lane through the next Beads-ready issue after
RFD-01 is committed, pushed, and CI-checked. Prefer a bounded source repair that
removes executable confusion or proves an end-to-end brain-loop behavior, not a
guard-only task.
