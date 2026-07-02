# Product Loop E2E Proof Boundary

## Verdict

The audit finding was partially stale and partially live.

Stale part: KRN already had `brainLoopIntegration.test.ts`, which proves the
in-memory evidence -> reflection candidate -> MemoryReviewGate -> memory record
-> activation reuse path and blocks weak `default_template` evidence before it
can become activated memory. KRN also already had `pnpm db:smoke:brain-loop` for
live DB-backed evidence/review/feedback/memory/activation readback.

Live part: MemoryReviewGate loaded linked SourceClaims but did not require those
claims to be accepted lifecycle authority. That allowed a proposed SourceClaim
to act as reviewed memory lineage during promotion. The DB brain-loop smoke was
also trying to prove the path with source authority that was not modeled as a
real source decision transition.

## Source To Decision

```yaml
source_id: repo-local-audit-un8v
title: Product loop proof must prove reviewed authority, not just well-formed lineage
trust_tier: high
source_class: repo-local evidence
mechanism: Existing product-loop tests covered weak evidence and activation reuse, but MemoryReviewGate accepted linked SourceClaims regardless of lifecycle status, and SourceDecision adoption did not advance SourceClaim lifecycle status.
krn_implication: A sacred product-loop proof must require accepted source authority before memory promotion and must prove proposed -> adopted -> accepted source lifecycle before review-gated memory promotion.
decision_kind: adopt
decision: Require accepted SourceClaims in shared review-gate source lookup, make SourceDecision adopt/reject update SourceClaim lifecycle status, and print source decision/status in the DB smoke readback.
does_not_prove: This does not prove product readiness, activation ranking quality, worker runtime safety, or external repo usefulness at scale.
consumer: packages/harness/src/memory/reviewGateSupport.ts; packages/db/src/repositories/DrizzleSourceRepository.ts; packages/db/src/brainLoopSmoke.ts
falsifier: MemoryReviewGate promotes MemoryCandidate or AntiMemoryCandidate through a proposed/rejected/deprecated SourceClaim, SourceDecision adopt does not accept the claim, or db:smoke:brain-loop does not show accepted source authority.
```

## Implementation

- `reviewedSourceClaims` now rejects any linked SourceClaim whose `status` is
  not `accepted`.
- Memory and anti-memory review gate tests cover non-accepted source authority.
- `SourceDecision` now advances SourceClaim lifecycle status:
  - `adopt` -> `accepted`;
  - `reject` -> `rejected`;
  - `defer` / `lab_test` leave the claim proposed.
- DB brain-loop smoke now creates a proposed SourceClaim, adopts it through
  SourceDecision, reads back the accepted SourceClaim, and only then promotes
  memory through MemoryReviewGate.
- DB brain-loop smoke readback returns and prints source decision and source
  claim status.

## Product Loop Proof

The current deterministic proof is intentionally split by authority layer:

- Harness proof: `brainLoopIntegration.test.ts`
  - proves in-memory evidence/review/feedback/reflection-candidate path;
  - proves weak evidence is blocked before candidate persistence/activation;
  - proves reviewed memory influences next activation.
- DB proof: `pnpm db:smoke:brain-loop`
  - proves live Postgres persistence and readback across evidence, review,
    feedback, MemoryReviewGate, MemoryRecord/version, activation trace, context
    assembly, memory application, and cleanup;
  - now proves the linked SourceClaim starts proposed, is adopted by
    SourceDecision, and is accepted before MemoryReviewGate promotion.

This keeps the proof deterministic without adding an LLM execution dependency,
worker daemon, dashboard, API, MCP, crawler, or broad benchmark lane.

## Verification

```txt
rtk pnpm --filter @krn/harness test -- memoryReviewGate antiMemoryReviewGate brainLoopIntegration
rtk pnpm --filter @krn/db test -- DrizzleSourceRepository brainLoopSmoke
rtk pnpm --filter @krn/cli test -- runCli runDbSmokeCommand
rtk pnpm -C packages/db typecheck
rtk pnpm db:smoke:brain-loop
rtk proxy pnpm typecheck
rtk pnpm test
rtk pnpm quality:fallow:ci
rtk pnpm eval:brain-battle:smoke
rtk pnpm db:smoke
rtk pnpm db:smoke:source-graph
rtk pnpm db:smoke:retrieval-substrate
rtk pnpm db:smoke:memory-governance
rtk git diff --check
```

Result:

- Focused harness tests: 34 files passed, 191 tests passed.
- Focused DB tests: 27 files passed, 86 tests passed.
- Focused CLI tests: 41 files passed, 322 tests passed.
- DB package typecheck: passed.
- DB brain-loop smoke: passed; output includes `Source decision: ...` and
  `Source claim status: accepted`.
- Full workspace typecheck: passed.
- Full workspace tests: 129 files passed, 748 tests passed.
- Fallow changed-files audit: passed, no issues in changed files.
- Brain-battle smoke: passed.
- DB persistence smoke: passed.
- DB source-graph, retrieval-substrate, and memory-governance smokes: passed.
- Diff whitespace check: passed.

## Proof Boundary

Proves:

- MemoryReviewGate and AntiMemoryReviewGate do not promote through
  non-accepted SourceClaims.
- SourceDecision `adopt` / `reject` advances SourceClaim lifecycle status.
- Existing weak-evidence abstention proof remains green.
- Existing DB-backed brain-loop proof remains green and now exposes accepted
  SourceClaim authority.

Does not prove:

- Product readiness.
- Activation ranking quality.
- Autonomous reflection quality.
- Worker runtime execution.
- Graph retrieval quality.
- Multi-repo usefulness at scale.
