# V234 TypeScript Best-Pattern Application Trial

Status: complete.

## Objective

Apply one retained high-quality TypeScript pattern to a narrow real KRN source
boundary.

## Run

- executionRun: `4b01b223-d6aa-4754-9784-6c28b41562e6`
- taskContract: `2dee1d4c-8ed3-47f9-ae6d-153fba8f7c97`
- contextAssembly: `0123b4c0-969e-416a-b37a-f8ce16e39d78`
- DB available: yes
- KRN plan: persisted
- activation: abstained, 0 inclusions

## Source-To-Decision

- Source: `docs/KRN_SOURCES.md#typeScript-practitioner-sources`.
- Retained source IDs:
  - `total-typescript-designing-types`
  - `total-typescript-unions-narrowing`
- Mechanism: domain types should communicate business logic and finite valid
  states instead of hiding repeated domain facts in weak shapes.
- KRN implication: `CandidateReviewabilityInput.sourceLineage` should accept
  typed `SourceLineageRef[]`, not `unknown[]`, because source lineage is a
  reviewability domain fact.
- Decision: replace `readonly unknown[]` with `readonly SourceLineageRef[]` in
  the core reviewability input and add a source-lineage reviewability test.
- Does not prove: broad TypeScript quality, source selector quality, or that all
  metadata fields should become typed fields.

## Change

- `packages/core/src/candidateReviewability.ts`
- `packages/core/src/candidateReviewability.test.ts`

## Verification

- `pnpm --filter @krn/core test -- candidateReviewability`: passed.
- `pnpm run typecheck`: passed.
- `TMPDIR=/home/krn/.cache/krn-tmp pnpm test`: passed.
- `git diff --check`: passed.

## Readback Result

Text and JSON readback confirmed two source usefulness outcomes:

```txt
- outcome=helped sourceClaim=total-typescript-designing-types
- outcome=helped sourceClaim=total-typescript-unions-narrowing
```

Persisted IDs:

- evidenceBundle: `bd86dbf6-a8a5-4440-9691-c7bd0d268e51`
- reviewAssessment: `316820e9-89f8-4292-bced-d6d4a7481906`
- feedbackDelta: `6497ec95-f6aa-49a7-8a6c-d8a24601345d`

## Finding

This run found a remaining evidence path normalization gap. Because evidence
capture ran through `pnpm --filter @krn/cli`, sibling package files read back as:

```txt
core/src/candidateReviewability.ts
core/src/candidateReviewability.test.ts
```

The intended repo-root-relative form is:

```txt
packages/core/src/candidateReviewability.ts
packages/core/src/candidateReviewability.test.ts
```

This does not invalidate the V234 TypeScript repair, but it means V230/V231 did
not fully solve package-cwd path normalization for sibling package paths.

## Does Not Prove

This trial does not prove product readiness, broad source quality, activation
quality, candidate promotion quality, or that KRN should run broad TypeScript
cleanup.
