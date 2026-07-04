# Codex Output Comparator

Date: 2026-07-04
Bead: `mise-en-palace-jeqw`

## Scope

Added a deterministic Codex-vs-KRN output comparator. The comparator consumes
existing memory-advantage execution-contract cases and reports the baseline
contract, KRN-grounded contract, expected evidence shape, missing-evidence
failure, selected context-size proxy, exclusions, and proof/non-proof.

It does not call live Codex, a judge model, Promptfoo, a dashboard, or a broad
benchmark.

## Behavior

`pnpm eval:codex-output-comparator` reports:

- `caseCount: 2`;
- `baselineMissingEvidenceCount: 2`;
- `krnValidEvidenceShapeCount: 2`;
- `contractChangedCount: 2`.

The interdependent case changes from
`contract:summary-only-krn-context-claim` to
`contract:evidence-shaped-krn-context-claim` and validates the KRN output shape
through the shared Codex-output evidence validator.

## Verification

```sh
pnpm --filter @krn/cli test -- codexOutputComparatorEval
pnpm eval:codex-output-comparator
pnpm run typecheck
pnpm quality:fallow:ci
pnpm eval:krn:smoke
git diff --check
```

Second opinion:

- R1: `approve_with_fixes`, LOW. Accepted rename from
  `broadDumpExclusions` to neutral `exclusions` and added assertions for
  exclusion ids plus selected-context size method.
- R2: `approve`, LOW. No findings or evidence gaps.

## Non-Proof

This does not prove live Codex execution, prompt adherence, LLM output quality,
source truth, arbitrary task superiority, production retrieval quality, or
product readiness.
