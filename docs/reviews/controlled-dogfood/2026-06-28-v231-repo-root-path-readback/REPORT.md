# V231 Repo-Root Path Normalization Readback

Status: complete.

## Objective

Prove that V230 evidence changed-file path normalization persists and reads
back repo-root-relative paths when `krn evidence capture` runs through
`pnpm --filter @krn/cli`.

## Run

- executionRun: `0ece63ad-854d-4ff5-87bb-b474bc37eb2d`
- taskContract: `d107b978-b0ab-41c1-9c97-67dd6d4ec955`
- contextAssembly: `4569ba0c-55f7-482e-a0ee-7bf2e086de0b`
- DB available: yes
- KRN plan: persisted
- activation: abstained, 0 inclusions

## Evidence To Capture

The report file is intentionally dirty before evidence capture:

```txt
docs/reviews/controlled-dogfood/2026-06-28-v231-repo-root-path-readback/REPORT.md
```

Because the capture command is invoked through `pnpm --filter @krn/cli`, the
pre-V230 failure mode would expose this as a package-cwd path such as:

```txt
../../docs/reviews/controlled-dogfood/2026-06-28-v231-repo-root-path-readback/REPORT.md
```

The expected post-V230 behavior is repo-root-relative readback:

```txt
docs/reviews/controlled-dogfood/2026-06-28-v231-repo-root-path-readback/REPORT.md
```

## Verification To Record

- `pnpm db:ready`: passed.
- `krn plan --persist`: passed.
- V230 local verification and CI: passed before this readback proof.

## Readback Result

Evidence capture stdout rendered:

```txt
Changed files:
intended:
- ?? docs/reviews/controlled-dogfood/2026-06-28-v231-repo-root-path-readback
unrelated:
- none
unknown:
- none
```

Text readback rendered:

```txt
changed file classification:
- intended=1
- unrelated=0
- unknown=0
```

JSON readback returned:

```json
{
  "changedFiles": {
    "all": [
      "docs/reviews/controlled-dogfood/2026-06-28-v231-repo-root-path-readback"
    ],
    "classification": {
      "source": "metadata",
      "intended": [
        "docs/reviews/controlled-dogfood/2026-06-28-v231-repo-root-path-readback"
      ],
      "unrelated": [],
      "unknown": []
    }
  }
}
```

No `../../docs/...` path was present in persisted readback.

## Persisted IDs

- evidenceBundle: `89e0f34e-6e24-4bc9-a925-8be95987bff6`
- reviewAssessment: `0b2ae41f-f496-4cbb-9441-bb9587d0d692`
- feedbackDelta: `cd283d33-83dd-43f7-9331-e6a6ca5eeb62`

## Verdict

V231 proves that the V230 path normalization reaches DB-backed evidence capture
and `krn run show` readback for KRN changed-file metadata.

## Does Not Prove

This proof does not prove product readiness, source selector quality, activation
quality, target-repo path semantics, or general path policy correctness outside
KRN Git status evidence.
