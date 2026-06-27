# V07 Source Usefulness Readback Report

Status: source repair report.

Date: 2026-06-27

## Executive Verdict

V07-01 added the smallest first-class source usefulness readback improvement
without creating a new source subsystem. `FeedbackDelta.sourceDecisions` already
carried source decision candidates, but `summarizeFeedbackCandidateProposals`
ignored them. As a result, run readback could under-report source usefulness
work even when evidence capture had produced a source decision candidate.

This slice makes source decision candidates visible in feedback proposal
summary and run readback:

```txt
source_decision_candidate
sourceDecisionCandidates
source_decision=<count>
```

It does not promote SourceClaims, mutate source truth, or add a new DB table.

## Scope

Changed:

- `packages/core/src/feedbackDelta.ts`
- `packages/core/src/reviewFeedback.test.ts`
- `packages/cli/src/runRunShowCommand.ts`
- `packages/cli/src/runRunShowCommand.test.ts`

Non-goals:

- no new source subsystem;
- no source crawler;
- no automatic source promotion;
- no source truth mutation;
- no DB schema migration;
- no activation scoring change;
- no dashboard, MCP, worker, or target repo write.

## Finding

Existing evidence capture already created source decision candidates:

```txt
FeedbackDelta.sourceDecisions
```

but `summarizeFeedbackCandidateProposals` counted only:

```txt
memoryCandidates
metadata.sourceClaimCandidates
metadata.antiMemoryCandidates
evalCandidates
metadata.observationCandidates
```

So source decision usefulness proposals could exist while proposal summary and
run readback did not count them as source candidates.

## What Changed

`FeedbackCandidateProposalKind` now includes:

```txt
source_decision_candidate
```

`FeedbackCandidateProposalSummary.counts` now includes:

```txt
sourceDecisionCandidates
```

Run readback now exposes source candidate counts as:

```txt
source=<sourceClaim + sourceDecision>
source_claim=<sourceClaim>
source_decision=<sourceDecision>
```

JSON readback keeps `source` as the total and adds:

```txt
sourceClaim
sourceDecision
```

## What This Proves

- Source decision candidates in `FeedbackDelta.sourceDecisions` are visible in
  proposal summary.
- Run readback distinguishes source claim candidates from source decision
  candidates.
- Source usefulness can be reviewed without inventing a new persistence model.

## What This Does Not Prove

- SourceClaims are useful on arbitrary target repos.
- Source decision candidates should be automatically accepted.
- Source usefulness has helped/stale outcome feedback equivalent to memory
  application feedback.
- Product readiness or V02-01 second-operator usability.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/core test -- reviewFeedback` | passed | Feedback proposal summary counts source decision candidates. | Does not prove CLI readback rendering. |
| `pnpm --filter @krn/cli test -- runRunShowCommand` | passed | Run readback text and JSON expose source decision candidate counts. | Does not prove DB-backed live readback. |
| `pnpm typecheck` | passed | TypeScript public shapes remain valid after the new count field. | Does not prove runtime behavior. |

## Brain Usefulness Verdict

Verdict: positive, bounded.

V07-00 identified the exact missing source usefulness path: source support was
present as lineage, but proposal/readback did not make source decision
candidates visible enough. V07-01 fixed the existing readback blind spot without
adding new architecture.

## Candidate Outputs

MemoryCandidate:

- Summary: Feedback proposal summaries should count source decision candidates
  separately from source claim candidates.
- Evidence refs: this report; `packages/core/src/feedbackDelta.ts`;
  `packages/cli/src/runRunShowCommand.ts`.
- Does not prove: source usefulness outcome feedback is complete.
- Reviewability: ready.

RepairCandidate:

- Summary: Add helped/stale outcome feedback for source applications only if
  repeated runs show source decisions need application feedback comparable to
  memory applications.
- Evidence refs: V07-00 and V07-01 reports.
- Does not prove: a new table is needed.
- Reviewability: defer.

## Next Recommended Action

Run full verification and re-gate V07. If green, move to V08 skill-first
workflow expansion gate only if the report shows source/memory usefulness no
longer blocks that transition.
