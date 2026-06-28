# V235 Sibling Package Path Normalization

Status: complete.

## Objective

Repair evidence changed-file normalization so package-filtered CLI execution
stores full repo-root-relative paths for sibling package files.

## Run

- executionRun: `bc0312c6-94e4-4214-88b6-c6b34caea2dc`
- taskContract: `9ac1f205-9bc0-4450-802e-5078b3a59164`
- contextAssembly: `1115a686-54de-4510-a966-be7a5eb7a1f8`
- DB available: yes
- KRN plan: persisted
- activation: abstained, 0 inclusions

## Source-To-Decision

- Source: V234 DB readback finding.
- Mechanism: `git status --short` paths are relative to the command cwd. When
  the CLI runs from `packages/cli`, sibling files can appear as
  `../core/src/...`; stripping `../` turns them into `core/src/...` instead of
  the true repo-root path.
- KRN implication: evidence capture must normalize Git status paths by resolving
  them against the status cwd and then relativizing to the repo root.
- Decision: parse changed files with `{ repoRoot, statusCwd }`.
- Does not prove: target-repo path semantics, product readiness, or every path
  source outside Git status.

## Change

- `packages/cli/src/runEvidenceCaptureCommand.ts`
- `packages/cli/src/runCli.test.ts`
- `packages/cli/src/evidenceCaptureGoldenBehavior.test.ts`

## Verification

- `pnpm --filter @krn/cli test -- runCli evidenceCaptureGoldenBehavior runEvidenceCaptureCommand parseEvidenceArgs`: passed.
- `pnpm run typecheck`: passed.
- `TMPDIR=/home/krn/.cache/krn-tmp pnpm test`: passed.
- `git diff --check`: passed.

## Readback Result

Primary evidence bundle:

- evidenceBundle: `18114765-9b97-48e5-90d6-2730d7021f93`
- reviewAssessment: `f3f5efff-5e43-43f9-a685-e51a5d72d0ea`
- feedbackDelta: `f0522c96-65bd-4453-b97a-318110c19fbf`

JSON readback contained repo-root-relative current package and docs paths:

```json
[
  "packages/cli/src/evidenceCaptureGoldenBehavior.test.ts",
  "packages/cli/src/runCli.test.ts",
  "packages/cli/src/runEvidenceCaptureCommand.ts",
  "docs/reviews/controlled-dogfood/2026-06-28-v235-sibling-package-path-normalization"
]
```

Temporary sibling package proof bundle:

- evidenceBundle: `1f5d17aa-35f9-4e60-b4dc-6edf6b542279`
- reviewAssessment: `cb4cf16e-9422-45b4-8f97-71276c491d0d`
- feedbackDelta: `0c991129-768d-417e-a456-3c2049ff2f4f`

The temporary file `packages/core/src/v235-path-proof.tmp` was created only to
prove sibling package readback, captured, read back from DB, and removed before
commit.

JSON readback contained:

```json
{
  "all": [
    "packages/core/src/v235-path-proof.tmp"
  ],
  "classification": {
    "intended": [
      "packages/core/src/v235-path-proof.tmp"
    ]
  }
}
```

This proves the parser no longer stores the shortened `core/src/...` form for
sibling package files.

## Does Not Prove

This proof does not prove activation quality, target-repo path semantics,
product readiness, or general file path correctness outside KRN changed-file
evidence.
