# Evaluation Proof Boundary Manifest

## Verdict

The audit finding was live. KRN had serious verification gates, but their proof
boundaries were scattered across `package.json`, CI, README, Promptfoo boundary
docs, reports, and invariant tests. That made it too easy to overstate what a
green command proves.

## Source To Decision

```yaml
source_id: repo-local-audit-0dgi
title: Evaluation gates need one proof/non-proof ontology
trust_tier: high
source_class: repo-local evidence
mechanism: typecheck, tests, Fallow, brain-battle, Promptfoo, DB readiness, DB smoke, alpha:verify, and diff checks prove different classes of evidence, while CI and README did not share one typed proof boundary.
krn_implication: KRN needs a compact machine-checkable manifest that names each gate, command, owner, required scope, proves, and doesNotProve before promoting alpha:verify full or making product-readiness claims.
decision_kind: adopt
decision: Add a typed eval proof-boundary manifest in the harness, export it, render a compact readback, and test it against package scripts and CI.
does_not_prove: This does not prove KRN is product-ready, does not add broad benchmarks, does not make Promptfoo a behavior authority, and does not promote alpha:verify full yet.
consumer: packages/harness/src/evalProofBoundaryManifest.ts; README.md
falsifier: A verification command appears in package.json or CI without a manifest proof/non-proof boundary, or a gate is documented as proving product readiness.
```

## Implementation

- Added `evalProofBoundaryManifest` with typed entries for:
  - workspace typecheck;
  - workspace tests;
  - Fallow changed-files audit;
  - brain-battle smoke;
  - Promptfoo smoke;
  - DB readiness;
  - Drizzle check;
  - baseline DB persistence smoke;
  - DB-backed brain-loop smoke;
  - current `alpha:verify`;
  - `git diff --check`.
- Added `renderEvalProofBoundaryReadback()` for compact operator readback.
- Added tests that require each entry to have `proves` and `doesNotProve`,
  forbid product-readiness proof claims, align script names with `package.json`,
  and align CI-scoped gates with `.github/workflows/ci.yml`.
- Exported the manifest from `@krn/harness`.
- Added a README pointer to the manifest as the canonical verification boundary.

## Verification

```txt
rtk pnpm --filter @krn/harness test -- evalProofBoundaryManifest
rtk pnpm -C packages/harness typecheck
rtk pnpm --filter @krn/harness test -- activePlanInvariants contextHygieneInvariants evalProofBoundaryManifest
rtk proxy pnpm typecheck
rtk pnpm test
rtk pnpm quality:fallow:ci
rtk pnpm eval:brain-battle:smoke
rtk pnpm eval:promptfoo:smoke
rtk git diff --check
```

Result:

- Focused harness tests: 35 files passed, 196 tests passed.
- Harness package typecheck: passed.
- Active plan/context hygiene focused tests: 35 files passed, 196 tests passed.
- Full workspace typecheck: passed.
- Full workspace tests: 130 files passed, 753 tests passed.
- Fallow changed-files audit: passed, no issues in changed files.
- Brain-battle smoke: passed.
- Promptfoo smoke: passed, 2/2 integration cases passed.
- Diff whitespace check: passed.

## Proof Boundary

Proves:

- KRN now has one typed proof-boundary manifest for current verification gates.
- CI-scoped manifest entries are checked against the CI workflow.
- Script-backed manifest entries are checked against `package.json`.
- Promptfoo and current `alpha:verify` are explicitly scoped as
  non-authoritative for product readiness.

Does not prove:

- Full `alpha:verify:full` exists.
- Every DB smoke target is aggregated into CI.
- Product readiness.
- LLM behavior quality.
- Repository-wide dead-code absence.
