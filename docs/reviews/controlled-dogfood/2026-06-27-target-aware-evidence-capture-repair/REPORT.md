# Target-Aware Evidence Capture Repair

Status: complete source repair.

Date: 2026-06-27.

Task: V05-02.

## Executive Verdict

KRN evidence capture now has an explicit target evidence lane. Operators can
record target repo identity, trial mode, dirty state before/after, owned-vs-
external target changes, allowed/forbidden target writes, target changed files,
target commands, and target-specific `doesNotProve` boundaries without hiding
those facts inside report prose.

The repair is metadata-backed and readback-visible. It does not add a DB
migration, does not run target git commands automatically, and does not mutate
Memory Core.

## What Changed

| Area | Change | Files |
|---|---|---|
| Core evidence domain | Added target evidence types, normalization, defaults, and metadata readback helper. | `packages/core/src/evidenceBundle.ts`, `packages/core/src/evidenceBundle.test.ts` |
| CLI parse boundary | Added explicit target evidence flags and validation. | `packages/cli/src/parseEvidenceArgs.ts`, `packages/cli/src/parseArgs.ts`, tests |
| Evidence capture output/persistence | Renders target evidence, includes target review burden, and stores normalized target evidence under `metadata.targetEvidence`. | `packages/cli/src/runEvidenceCaptureCommand.ts`, `packages/cli/src/runCli.test.ts` |
| Run readback | Text and JSON readback expose target evidence if present. | `packages/cli/src/runRunShowCommand.ts`, `packages/cli/src/runRunShowCommand.test.ts` |

## New CLI Shape

Example:

```sh
krn evidence capture \
  --target-repo ../wilq-seo \
  --target-mode observation-only \
  --target-dirty-before dirty \
  --target-dirty-after dirty \
  --target-owned-changes external \
  --target-changed-file "M apps/dashboard/src/App.tsx" \
  --target-command "wilq-seo scripts/test.sh" \
  --verification "wilq-seo scripts/test.sh=passed"
```

Target evidence flags are explicit operator input. Evidence capture still does
not run shell commands.

## Behavior

The new target evidence output includes:

```txt
Target evidence:
- repo: ../wilq-seo
- mode: observation_only
- dirtyBefore: dirty
- dirtyAfter: dirty
- ownedChanges: external
- changedFiles:
  - M apps/dashboard/src/App.tsx | ownership=external
- commands:
  - wilq-seo scripts/test.sh
- doesNotProve:
  - Target evidence does not prove KRN source correctness.
  - Target evidence does not prove full target verification unless every target gate is represented by command evidence.
  - Target evidence does not prove product readiness or V02-01 second-operator usability.
```

Review burden is extended when target evidence is present:

```txt
Review target repo mode, dirty state, ownership, allowed/forbidden writes,
target command proof, and target does-not-prove boundaries separately.
```

## Dogfood Finding

During the first preview capture, `packages/cli/src/parseArgs.ts` was omitted
from `--intended-file`, and evidence capture correctly classified it as
unrelated. After adding that file to the intended list, the same command
reported `unrelated: none`.

This is useful because it proves the existing dirty-context lane still works
while target evidence is present.

## Verification

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `rtk proxy pnpm --filter @krn/core test -- evidenceBundle` | passed | Core target evidence normalization/readback tests pass. | Does not prove CLI rendering. |
| `rtk proxy pnpm --filter @krn/cli test -- parseEvidenceArgs runCli runRunShowCommand evidenceCaptureGoldenBehavior` | passed | CLI parse/capture/readback/golden behavior tests pass for target evidence and existing dirty-context behavior. | Does not prove DB runtime in current shell. |
| `rtk proxy pnpm typecheck` | passed | Workspace TypeScript remains strict. | Does not prove product readiness. |
| `rtk proxy pnpm test` | passed | Full workspace tests pass. | Does not prove V02-01 usability or target correctness. |
| `rtk proxy git diff --check` | passed | Current diff has no whitespace errors. | Does not prove semantic completeness beyond checked behavior. |
| `rtk proxy pnpm --filter @krn/cli krn evidence capture ...target flags...` | passed | Real CLI preview renders target evidence and proof boundaries. | Does not persist DB evidence because `--persist` was not used. |

## What This Proves

- KRN evidence capture can explicitly carry target evidence separately from KRN
  repo changed-file classification.
- Target evidence can be persisted through existing `EvidenceBundle.metadata`
  without a DB migration.
- `krn run show` can expose target evidence in text and JSON readback.
- Existing command provenance and dirty-context classification still work.

## What This Does Not Prove

- Product readiness.
- V02-01 second-operator usability.
- Target repo correctness.
- Automatic target status capture.
- DB-backed persisted replay of target evidence in a live run.
- That target writes are safe.

## Condensation Decision

```txt
finding:
  Target evidence can be represented by explicit operator-supplied metadata and
  read back without a DB migration.

frequency:
  repeated/high-risk target proof gap from V04 reports, now repaired at the
  representation/readback layer.

candidate_surface:
  deterministic guard + replay scenario.

decision:
  accept V05-03.

rationale:
  A source repair without replay can regress or become fixture-only. V05-03
  should prove persisted/readback behavior and map it back to the target trial
  gap.

evidence:
  V05-01 report, V05-02 source diff, targeted tests, full test suite, CLI preview
  capture.

does_not_prove:
  product readiness, target correctness, V02-01, or automatic target git
  execution.

falsifier:
  V05-03 fails to preserve target evidence through persisted capture/readback.

next_task_id:
  V05-03.
```
