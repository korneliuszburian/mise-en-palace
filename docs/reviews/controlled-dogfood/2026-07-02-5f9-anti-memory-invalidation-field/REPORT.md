# 5f9 Anti-Memory Invalidation Field

Date: 2026-07-02

Issue: `mise-en-palace-5f9`

Commit: pending

## Goal

Canonicalize anti-memory invalidating source-claim references so runtime domain
objects expose one field:

```txt
invalidatedBySourceClaimIds
```

Legacy singular input remains accepted only at the CLI/schema boundary and
legacy DB singular column readback remains compatible.

## Source To Decision

Source:

- Local audit found both `invalidatedBySourceClaimId` and
  `invalidatedBySourceClaimIds` across anti-memory core/schema/harness/DB paths.
- Local source inspection confirmed singular leaked into runtime domain types,
  review gate merging, activation conflict filtering, CLI output, DB writes, and
  test fixtures.

Mechanism:

- Parallel singular/plural runtime fields make anti-memory invalidation
  ambiguous.
- Review gates and activation filters must know which shape is authoritative.
- Keeping both in domain output lets stale fixtures preserve an obsolete field.

KRN implication:

- Anti-memory should have one runtime vocabulary for invalidating source claims.
- Compatibility belongs at input/read boundaries, not in core domain output.

Decision:

- Use plural `invalidatedBySourceClaimIds` as canonical runtime/domain/output
  shape.
- Accept legacy `invalidatedBySourceClaimId` only in schema/CLI input and legacy
  DB row readback.
- Merge legacy DB singular values into plural mapper output.
- Stop writing new singular DB column values.
- Do not run a DB schema migration in this slice.

Consumer:

- `@krn/core` anti-memory domain types
- schema anti-memory parsers
- anti-memory review gate
- activation conflict filter
- CLI anti-memory add preview/persist output
- DB memory mappers and repository writes

Falsifier:

- Runtime `AntiMemoryRecord` or `AntiMemoryCandidate` exposes
  `invalidatedBySourceClaimId`.
- New anti-memory writes populate the singular DB column.
- Review gate or activation conflict filter still checks singular runtime field.

## Changed

- Removed singular invalidating-source field from core anti-memory domain types.
- Schema parsers still accept legacy singular input, then transform to plural
  output.
- CLI output now prints `invalidatedBySourceClaimIds`.
- CLI persistence validates every canonical plural source claim.
- Review gate and activation conflict filter now consume only plural runtime
  data.
- DB mappers merge legacy singular row values into plural output.
- DB repository no longer writes singular values for new anti-memory records or
  candidates.
- Tests and smokes now expect plural runtime output.

## KRN Plan Readback

Command:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
pnpm --filter @krn/cli krn plan \
  --task "Canonicalize anti-memory invalidation source claim field to plural runtime output while preserving legacy CLI/schema/DB read compatibility, without DB schema migration or activation ranking changes" \
  --persist
```

Persisted IDs:

```txt
executionRun: 049feae2-583b-4eb1-8750-1bf1bd98155f
taskContract: 1736fafc-f0dd-4108-8d3c-d91cb2cef396
contextAssembly: 20ca0799-a53a-4006-b0ac-62196847503c
```

Activation usefulness:

```txt
mixed / weak for owner-file recall
```

The plan selected useful general guardrails, but missed the direct owner files
for this anti-memory cleanup. Actual implementation relied on source inspection
with `rg` and focused tests.

## Verification

Passed:

```sh
pnpm --filter @krn/schema test -- index
pnpm --filter @krn/cli test -- runCli parseMemoryArgs
pnpm --filter @krn/db test -- memoryMappers DrizzleMemoryRepository activationSmoke memoryGovernanceSmoke
pnpm --filter @krn/harness test -- antiMemory activation compiler reflection
pnpm db:ready
pnpm typecheck
pnpm test
pnpm quality:fallow:ci
git diff --check
```

Fallow:

```txt
Audit scope: 17 changed files vs c7af00c4206b
No issues in changed files
```

Persisted evidence:

```txt
evidenceBundle: 5606be37-5611-4859-ac20-75de82578aef
reviewAssessment: 4037c354-32a5-42c9-a359-b643469f3014
feedbackDelta: 13aa59f8-f658-4a0a-bbc6-e43027fb2767
changed files: 22 intended, 0 unrelated, 0 unknown
commands: 9 operator_reported / passed
```

Observation/reflection:

```txt
observationGroup: add38970-c6be-4cb3-8ded-222597993882
observationItems: 5
reflectionRecord: 2d2294fb-f7c1-4507-82b3-08d9849ef690
candidateRowsWritten: no
memoryMutation: none
```

## Proof

This proves:

- canonical anti-memory runtime output no longer exposes singular invalidating
  source-claim field;
- legacy singular schema/CLI input is normalized to plural output;
- legacy DB singular readback is preserved through mapper merge;
- new DB writes no longer populate singular anti-memory field;
- review gate and activation conflict filter use plural runtime field only;
- focused and full test suites pass after the change.

This does not prove:

- a DB migration removed legacy singular columns;
- old persisted rows do not contain singular legacy values;
- MemoryCandidate/AntiMemoryCandidate should be merged;
- activation ranking quality improved;
- worker runtime behavior changed.

## Brain Usefulness

Verdict:

```txt
positive for workflow discipline
mixed for activation
```

KRN helped keep scope bounded and preserved proof/non-proof reporting. Activation
did not find the direct owner files, so source inspection still carried the
implementation.

## Next Candidate

The next high-ROI direction is to encode the user-provided reference
implementation / clone-workflow material as a KRN pattern-brain task, then apply
it to one bounded code-quality slice. This should improve how KRN turns
reference code into reusable implementation standards without expanding into a
generic skill zoo.
