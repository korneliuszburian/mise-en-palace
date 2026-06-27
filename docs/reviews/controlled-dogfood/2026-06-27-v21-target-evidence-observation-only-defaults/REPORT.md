# V21 Target Evidence Observation-Only Defaults And Readback Clarity

Status: completed source repair report.

Date: 2026-06-27
Evaluator: Codex
KRN repo: `/home/krn/coding/krn/active/mise-en-palace`
Mode: KRN source repair, no target repo writes
DB available: yes

## Executive Verdict

V21 repaired the target evidence safety gap found by V20. Observation-only
target evidence now defaults to `allowedWrites: ["none"]` and standard
forbidden write boundaries when the operator omits explicit write flags. The
repair lives in the core target evidence normalizer, so CLI capture, persisted
metadata, and run readback use the same typed behavior. `run show` target
evidence list rendering is also clearer.

This improves controlled-internal-alpha target-trial safety. It does not prove
product readiness, V02-01, activation quality, or target runtime correctness.

## Scope

Touched source:

- `packages/core/src/evidenceBundle.ts`;
- `packages/core/src/evidenceBundle.test.ts`;
- `packages/cli/src/parseEvidenceArgs.ts`;
- `packages/cli/src/parseEvidenceArgs.test.ts`;
- `packages/cli/src/parseArgs.ts`;
- `packages/cli/src/runRunShowCommand.ts`;
- `packages/cli/src/runRunShowCommand.test.ts`;
- `packages/cli/src/runCli.test.ts`;
- `packages/cli/src/evidenceCaptureGoldenBehavior.test.ts`.

No target repository files were edited.

## Source Inspection

Finding:

- `TargetEvidenceInput` already had typed `allowedWrites` and
  `forbiddenWrites`.
- `normalizeTargetEvidence` was the shared boundary used by capture/readback.
- CLI parser already supported `--target-allowed-write` and
  `--target-forbidden-write`.
- The issue was not missing schema or persistence. The issue was that
  `observation_only` mode with omitted flags normalized to empty write
  boundaries.

Decision:

Use core normalization defaults instead of adding an ad hoc renderer warning.

Why:

- one typed boundary;
- persistence/readback inherit behavior;
- explicit operator-provided flags still win;
- no DB schema migration;
- no target policy subsystem.

## Implementation

Changed behavior:

```txt
mode: observation_only
allowedWrites omitted -> ["none"]
forbiddenWrites omitted -> [
  "target source edits",
  "target commits",
  "target resets or cleans",
  "target production/runtime writes"
]
```

Explicit forbidden writes are preserved. Non-observation modes are not given
observation-only defaults.

CLI usage examples now include `--target-allowed-write none` and
`--target-forbidden-write "target source edits"` for target evidence capture.

`krn run show` now indents nested target evidence lists one level deeper, so
`allowedWrites`, `forbiddenWrites`, `commands`, and `doesNotProve` are easier to
scan.

## Verification

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/core test -- evidenceBundle` | passed | Core target evidence normalization is covered, including observation-only defaults. | Does not prove CLI rendering. |
| `pnpm --filter @krn/cli test -- parseEvidenceArgs runCli runRunShowCommand evidenceCaptureGoldenBehavior` | passed | CLI parser, capture output, run show readback, and golden behavior expectations cover the repair. | Does not prove full workspace. |
| `pnpm typecheck` via `bash -lc 'pnpm typecheck; printf "EXIT:%s\n" "$?"'` | passed, `EXIT:0` | TypeScript strict compile passes across workspace. | Does not prove runtime DB behavior. |
| `pnpm test` | passed | Full workspace tests pass. | Does not prove product readiness. |
| `krn evidence capture --target-mode observation-only ...` preview | passed | Real CLI output shows default allowed/forbidden write boundaries without explicit forbidden flags. | Does not persist evidence or execute target commands. |
| `git diff --check` | passed | Source/docs diff has no whitespace errors. | Does not prove semantics. |

## KRN Dogfood Evidence

KRN plan:

```txt
executionRun: ecf288e9-b8e7-400a-b34b-222bbc61769c
context status: abstained
context inclusions: 0
```

The abstention is honest and not a blocker. Source inspection found the owning
files through local code search, not activation.

Evidence capture:

```txt
evidenceBundle: 69620092-fb5a-4f6d-bde8-78481196bbd5
reviewAssessment: 8b726253-1f2b-49a0-a121-118b02104b70
feedbackDelta: a0dba9cf-a501-487c-a98f-1c1a4e2eb86d
changedFiles: 9 intended, 0 unrelated, 0 unknown
```

Observation:

```txt
observationGroup: 87302501-a9a6-4cd7-bb5b-be3779f365d8
observationItems: 5
memory mutation: none
```

Reflection:

```txt
reflectionRecord: 3e9f7cfd-63a4-4fbf-b41c-b179fad507c6
findings: 0
gaps: 0
candidate rows written: no
memory mutation: none
```

Run readback confirmed the persisted evidence bundle, pending review
assessment, feedback delta, and proposal-only memory candidate.

## Dogfood Brain Usefulness

Activation usefulness: weak / abstained.

KRN did not select source context for this owner-file-adjacent CLI source repair.
The slice was still bounded by `PLANS.md`, V20 evidence, local code search, and
the TypeScript/evidence skills.

Evidence usefulness: strong positive.

V20 provided the exact failure mode and V21 captured command proof, intended
files, readback, and non-proof boundaries.

Review burden: lower.

Future target evidence reviewers no longer need to infer that observation-only
means writes are forbidden when flags are omitted. The output says it.

Candidate quality: proposal-only.

Evidence capture created one memory candidate proposal, classified
`too_vague`; it was not promoted and should not be promoted from this run alone.

Brain ROI: positive.

## What This Improves

- Observation-only target evidence now has safe write-boundary defaults.
- Explicit target write flags still work.
- Target evidence examples guide operators toward explicit safety boundaries.
- `run show` target evidence lists are more readable.
- No schema migration or target policy subsystem was added.

## What This Does Not Prove

- Product readiness.
- V02-01 second-operator usability.
- Widened internal alpha.
- General activation quality.
- Target runtime correctness.
- That all target trial ergonomics are solved.

## Next Recommended Action

Promote one bounded repair:

```txt
V22 — Persisted CLI DB URL Default Consistency
```

Why:

V20 showed that `pnpm db:ready` has a default DB URL but `krn init --connect
--persist` fails without explicit `KRN_DATABASE_URL`. That is now the highest
visible operator-friction item in the target-trial loop.

Expected shape:

- inspect persisted CLI commands that require `KRN_DATABASE_URL`;
- decide whether they should share the same default as `pnpm db:ready` or print
  a stronger exact remediation;
- preserve explicit env override;
- add focused CLI tests;
- do not change DB schema.

