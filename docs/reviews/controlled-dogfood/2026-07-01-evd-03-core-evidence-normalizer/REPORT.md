# EVD-03 Core Evidence Normalizer Report

Status: source repair dogfood.

Date: 2026-07-01

## Executive Verdict

The audit finding was valid after EVD-02 made `@krn/core` the canonical owner
of evidence command normalization. The old core implementation used a context
builder plus four provenance-specific optional builders before falling back to
default-template evidence. EVD-03 keeps the exact public behavior and replaces
that internal waterfall with one deterministic provenance switch.

## Source-To-Decision

```txt
source: packages/core/src/evidenceBundle.ts, packages/core/src/evidenceBundle.test.ts
mechanism: normalizeEvidenceCommand already inferred one provenance, but then
  routed through several optional builder functions.
KRN implication: the canonical command proof/non-proof normalizer should be
  readable in one pass because evidence semantics are core brain hygiene.
decision: collapse internal normalization to one switch over provenance, with
  explicit fallback to weak default_template evidence when required proof fields
  are missing.
consumer: schema evidence parsing, CLI evidence capture, DB evidence mappers,
  run/evidence readbacks.
falsifier: any command kind changes output shape or weak default fallback stops
  protecting missing proof fields.
```

## What Changed

| Area | Change |
| --- | --- |
| Core | Removed the normalization context type and four optional provenance builder functions. |
| Core | `normalizeEvidenceCommand` now branches directly on provenance. |
| Tests | Added direct core coverage for `operator_reported` and `external_log`; existing tests cover `default_template`, `captured_output_file`, and `command_runner`. |

## Verification

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `pnpm --filter @krn/core test -- evidenceBundle` | passed | Core evidence tests preserve all command-kind behavior under the refactor. | Does not prove broad workspace health. |
| `pnpm --filter @krn/core exec tsc -p tsconfig.json` | passed | Core package types compile. | Does not prove downstream consumers. |
| `pnpm run typecheck` | passed | All workspace package typecheck scripts pass. | Does not prove runtime DB behavior. |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | Full workspace tests pass after the core refactor. | Does not prove product readiness. |
| `pnpm quality:fallow:ci` | passed | Changed-file Fallow audit found no issues in this slice. | Does not prove broad repo health. |
| `pnpm quality:fallow` | passed | Broad Fallow report was generated for review evidence. | It still reports existing broad duplication findings outside this slice. |
| `pnpm db:ready` | passed | Local Postgres is reachable, migrations are applied, and pgvector is available. | Does not prove every evidence command path. |
| `pnpm db:smoke:harness-evidence` | passed | Existing DB-backed harness evidence smoke still works with the refactored core normalizer. | Does not prove all DB evidence semantics. |
| `git diff --check` | passed | Diff has no whitespace errors. | Does not prove behavior. |

## Proof Boundary

This slice proves the core evidence command normalizer is simpler and covered by
tests for the five command kinds used by evidence capture/readback.

This slice does not prove:

- evidence command semantics changed;
- evidence metadata is fully typed;
- review/feedback domain ownership is clean;
- product readiness.

## Dogfood Brain Usefulness

| Lane | Verdict | Evidence |
| --- | --- | --- |
| Selected context | helped | The EVD-02 report and core tests isolated the canonical owner and missing coverage. |
| Pattern use | helped | Simplicity-first and surgical-change rules kept this as an internal refactor with behavior tests. |
| Evidence strength | strong for slice | Targeted tests, full tests, typecheck, Fallow, DB readiness, DB smoke, and diff check ran. |
| Review burden | lower | The evidence proof/non-proof normalizer can now be reviewed in one switch. |
| Brain ROI | positive | A high-signal audit item became a small behavior-preserving simplification. |

## Next Recommended Action

Move to the review/feedback lane: inspect `reviewFeedback`, `reviewSignal`,
`reviewAssessment`, and `feedbackDelta` for real overlap and consolidate only
where source inspection proves duplicate ownership.
