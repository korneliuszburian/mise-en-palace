# EVD-01 Evidence Metadata Boundary Report

Status: source repair dogfood.

Date: 2026-07-01

## Executive Verdict

The audit finding was valid in a bounded way: `@krn/schema` already had command
evidence parsing, but DB evidence persistence still accepted `metadata` as an
unvalidated `Record<string, unknown>`. EVD-01 added focused validation and
normalization for the evidence metadata keys used by CLI readback and persisted
evidence review: `command`, `runId`, `intendedFiles`, `changedFileClassification`,
and `dirtyContext`.

## Source-To-Decision

```txt
source: packages/schema/src/evidenceCapture.ts and packages/db/src/repositories/DrizzleHarnessRunRepository.ts
mechanism: evidence capture schema normalized commands, while createEvidenceBundle
  persisted metadata directly.
KRN implication: evidence readback metadata must be validated at the DB boundary,
  not trusted as a raw metadata bag.
decision: add EvidenceCaptureMetadataSchema for known evidence readback fields
  and call parseEvidenceCaptureInput before evidence bundle insert.
consumer: persisted evidence bundles, run show/readback, evidence review.
falsifier: malformed changedFileClassification or dirtyContext metadata can be
  inserted through createEvidenceBundle without rejection.
```

## What Changed

| Area | Change |
| --- | --- |
| Schema | Added `EvidenceCaptureMetadataSchema` with validation/normalization for known evidence metadata fields. |
| DB repository | `createEvidenceBundle` now validates and normalizes evidence capture input before insert. |
| Package boundary | `@krn/db` now depends on `@krn/schema`, matching the accepted import direction. |
| Tests | Added schema and DB repository tests for malformed metadata rejection and normalized metadata persistence input. |

## Verification

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `pnpm --filter @krn/schema test -- index` | passed | Schema tests cover malformed evidence metadata rejection. | Does not prove DB persistence uses the schema. |
| `pnpm --filter @krn/db test -- DrizzleHarnessRunRepository` | passed | DB repository boundary helper rejects malformed evidence metadata. | Does not prove every future metadata key is strongly typed. |
| `pnpm --filter @krn/schema exec tsc -p tsconfig.json` | passed | Schema package types compile. | Does not prove runtime DB behavior. |
| `pnpm --filter @krn/db exec tsc -p tsconfig.json` | passed | DB package types compile with the schema dependency. | Does not prove broad workspace health. |
| `pnpm --reporter append-only -r --workspace-concurrency=1 --if-present typecheck` | passed | All workspace package typecheck scripts pass. | Does not prove runtime behavior. |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | Full workspace tests pass. | Does not prove product readiness. |
| `pnpm quality:fallow:ci` | passed | Fallow changed-file audit found no issues. | Does not prove broad repo health. |
| `pnpm db:ready` | passed | Local Postgres is reachable, migrations are applied, and pgvector is available. | Does not prove all evidence metadata semantics. |
| `pnpm db:smoke:harness-evidence` | passed | Existing DB-backed harness evidence smoke still persists/readbacks evidence, review, feedback, and run events. | Does not prove every CLI evidence path emits ideal metadata. |
| `git diff --check` | passed | Diff has no whitespace errors. | Does not prove behavior. |

## Proof Boundary

This slice proves malformed shapes for known evidence readback metadata no
longer pass through the `createEvidenceBundle` persistence boundary silently.

This slice does not prove:

- all future metadata keys are typed;
- evidence bundle metadata should stop being extensible;
- DB schema migration is needed;
- CLI evidence UX is complete;
- broad product readiness.

## Dogfood Brain Usefulness

| Lane | Verdict | Evidence |
| --- | --- | --- |
| Selected context | useful | Existing schema evidence parser and DB repository owner files were enough. |
| Pattern use | helped | Unknown-first / schema-boundary pattern kept the repair at the persistence boundary. |
| Evidence strength | strong for slice | Full tests, typecheck, Fallow, DB readiness, and harness-evidence smoke passed. |
| Review burden | lower | Known evidence readback metadata now fails fast when malformed. |
| Brain ROI | positive | The audit finding became a bounded DB/schema repair without a generic validation framework. |

## Next Recommended Action

Continue with the next code-quality simplification from the audit: collapse the
duplicated evidence command normalization paths between core and schema, if
source inspection confirms behavior can stay identical.
