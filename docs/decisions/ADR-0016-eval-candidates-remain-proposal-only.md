# ADR-0016: Eval Candidates Remain Proposal-Only

Status: Accepted

Date: 2026-06-24

## Context

C5-00 staged the P7 self-hosting follow-up candidates and found an asymmetry:
memory candidates, anti-memory candidates, and source claims have governed
operator persistence paths, while standalone `EvalCandidate` rows do not.

The current repo has:

- a core `EvalCandidate` type;
- `FeedbackDelta.evalCandidates`;
- `feedback_deltas.eval_candidates` JSONB persistence;
- `ReflectionOutput.evalCandidates`;
- `reflection_records.output.evalCandidates` JSONB persistence and readback;
- reflection candidate writing that returns `EvalCandidate` values without
  creating a standalone durable table;
- no `eval_candidates` table;
- no `krn eval candidate add/promote/reject` CLI;
- no eval candidate review gate;
- no worker runtime or Promptfoo authority path that consumes standalone eval
  candidate rows.

The missing standalone path is therefore a real gap in symmetry, but not yet a
proven product requirement.

## Source Decisions

source_id: `docs/KRN_KERNEL.md`
trust_tier: high
mechanism: the canonical spine ends in reviewable feedback outputs:
`FeedbackDelta -> MemoryCandidate / SourceDecision / EvalCandidate`.
krn_implication: `EvalCandidate` belongs to feedback/review output, but the
kernel does not require a standalone table before a consumer exists.
decision: adopt.
does_not_prove: a governed operator CLI or durable `eval_candidates` table is
needed now.
consumer: this ADR and the active hardening plan.
falsifier: an eval candidate needs independent review, promotion, scheduling,
or activation and cannot be addressed through `FeedbackDelta` or
`ReflectionRecord` proposal storage.

source_id: `packages/db/src/schema/harness.ts`
trust_tier: high
mechanism: `feedback_deltas` already persists `eval_candidates` as JSONB with
the review assessment lineage.
krn_implication: run-scoped eval proposals can be preserved without a new table.
decision: adopt as current storage.
does_not_prove: proposal arrays are sufficient for cross-run lifecycle,
reviewed promotion, or worker execution.
consumer: DB/repository boundary.
falsifier: operators must query, review, dedupe, promote, or reject eval
candidates independently of their parent feedback delta.

source_id: `packages/db/src/schema/reflections.ts`
trust_tier: high
mechanism: `reflection_records.output` persists reflection candidate arrays,
including eval candidates.
krn_implication: reflection can preserve eval proposals as candidate-only
output without writing final eval truth.
decision: adopt as current reflection storage.
does_not_prove: reflection-generated eval proposals have a governed standalone
review path.
consumer: reflection candidate writer and run ledger docs.
falsifier: reflection output needs durable eval candidate identity beyond the
reflection record and feedback lineage.

source_id: `docs/decisions/ADR-0013-observation-is-staging-not-memory.md`
trust_tier: high
mechanism: reflection may create or propose reviewable candidates only when the
relevant writer exists and the review gate remains explicit.
krn_implication: adding an eval candidate table without a consumer/review gate
would be speculative authority.
decision: adopt.
does_not_prove: eval candidates should never get standalone storage.
consumer: candidate staging boundary.
falsifier: a focused eval review gate or GoldenTask/Promptfoo adapter needs
explicit candidate lifecycle state.

source_id: `docs/decisions/ADR-0015-worker-runtime-boundary.md`
trust_tier: medium for future runtime shape, high for current no-runtime truth
mechanism: worker runtime is deferred, but the future write-authority table
mentions `eval_candidates`.
krn_implication: the worker contract currently contains a future-looking eval
candidate surface that must not be treated as current storage truth.
decision: qualify and schedule cleanup.
does_not_prove: a real `eval_candidates` table, worker executor, or eval
promotion runtime exists.
consumer: C5-02 follow-up.
falsifier: `packages/db` gains an `eval_candidates` table and a governed eval
candidate review/promotion path.

source_id: C5-00 source claim
`479b1ce8-9904-42ab-a8d1-393a2bacf685`
trust_tier: high as live Postgres source claim created from P7 evidence
mechanism: records that the current CLI exposes governed persistence for
memory candidates, anti-memory candidates, and source claims, not standalone
EvalCandidate rows.
krn_implication: the gap should be decided explicitly instead of faked through
another candidate type.
decision: adopt.
does_not_prove: a standalone EvalCandidate table is the right next build.
consumer: this ADR and C5 plan queue.
falsifier: a future self-hosting run needs an eval candidate row for review or
execution and cannot preserve the proposal through feedback/reflection storage.

## Decision

`EvalCandidate` remains proposal-only for now.

The accepted governed staging paths are:

- `FeedbackDelta.evalCandidates`, persisted in
  `feedback_deltas.eval_candidates`;
- `ReflectionRecord.output.evalCandidates`, persisted in
  `reflection_records.output`.

Do not add a standalone `eval_candidates` table, `krn eval candidate add`,
eval candidate review gate, worker promotion runtime, Promptfoo authority
layer, dashboard, or broad eval platform in C5-01.

When an operator discovers an eval candidate outside a concrete feedback delta
or reflection record, record the evidence as source/memory follow-up state
until there is a real eval candidate consumer. C5-00's representation of the
P7 eval-candidate gap as a SourceClaim plus MemoryCandidate is therefore
accepted as honest current-state handling, not a permanent substitute for a
future eval lifecycle.

## Future Standalone Preconditions

Reconsider standalone eval candidate storage only when at least one of these is
true:

- operators need to list, review, dedupe, accept, reject, or promote eval
  candidates independently of a feedback delta or reflection record;
- GoldenTask or Promptfoo adapter work needs stable candidate lifecycle state
  before generating or running behavior proofs;
- worker runtime is accepted and one-shot/manual eval-candidate execution needs
  deterministic input, idempotency, retry, output, and rollback semantics;
- repeated self-hosting runs produce eval proposals that cannot be tracked
  through their parent feedback/reflection records without losing provenance.

If those preconditions hold, the new slice must define:

- schema and migration;
- repository port and DB adapter;
- CLI add/review surface, if operator-facing;
- evidence provenance and `doesNotProve`;
- explicit non-goals against broad eval platform/dashboard work;
- regression proof that no Memory Core or final eval truth is created without
  review.

## Consequences

- C5-01 closes as a decision slice, not an implementation slice.
- The current run feedback remains preserved through SourceClaim,
  MemoryCandidate, FeedbackDelta, and ReflectionRecord lineage.
- C5-02 aligns the speculative worker `promote_eval_candidate` /
  `eval_candidates` wording with this decision so worker contracts do not imply
  a table or runtime that does not exist.
- Existing FeedbackDelta and ReflectionRecord JSON persistence remains the
  correct short-term carrier for eval proposals.

## Rejections

- Add `eval_candidates` table now: rejected as speculative storage without a
  consumer.
- Add `krn eval candidate add` now: rejected because it would create operator
  UX around a lifecycle KRN cannot yet review or execute.
- Promote eval candidates through workers now: rejected because worker runtime
  is deferred and no eval candidate executor exists.
- Use Promptfoo smoke as eval candidate proof: rejected because integration
  smoke is not KRN behavior proof.
- Build an eval platform/dashboard: rejected as outside the kernel hardening
  slice.

## Verification

This ADR is upheld when:

- no standalone `eval_candidates` table is claimed as current truth;
- CLI help does not expose `krn eval candidate add/promote/reject`;
- feedback/reflection eval proposal arrays remain candidate-only;
- docs and worker contracts do not present future eval promotion as current
  runtime truth;
- a future standalone eval candidate slice cites the preconditions above before
  adding storage or UX.

This ADR is violated when:

- eval proposals are represented as final eval truth;
- a standalone eval table or CLI appears without a review/consumer path;
- worker docs or job descriptions imply current eval promotion runtime;
- Promptfoo smoke rows are treated as sufficient KRN behavior proof.
