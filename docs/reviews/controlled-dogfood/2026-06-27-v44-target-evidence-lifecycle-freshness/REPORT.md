# V44 Target Evidence Lifecycle And Freshness Fields

Status: complete.

Date: 2026-06-27.

Mode: KRN internal source hardening.

## Executive Verdict

V44 made target status freshness and patch lifecycle first-class typed target
evidence. Operators no longer need to reconstruct this state from prose reports
when reading evidence capture output or `krn run show` readback.

This is not a target repair and does not claim product readiness. It closes the
V43 source gap by carrying target availability state through the existing
metadata-backed target evidence path without a DB migration.

## Scope

Changed source surfaces:

- `packages/core/src/evidenceBundle.ts`
- `packages/cli/src/parseEvidenceArgs.ts`
- `packages/cli/src/runEvidenceCaptureCommand.ts`
- `packages/cli/src/runRunShowCommand.ts`

Changed tests:

- `packages/core/src/evidenceBundle.test.ts`
- `packages/cli/src/parseEvidenceArgs.test.ts`
- `packages/cli/src/runCli.test.ts`
- `packages/cli/src/runRunShowCommand.test.ts`
- `packages/cli/src/evidenceCaptureGoldenBehavior.test.ts`

No target repos were edited.

No DB migration was added.

## What Changed

Target evidence now carries:

```txt
targetStatusFreshness:
  fresh_current_task
  stale_prior_selection
  changed_since_selection
  unknown

targetPatchLifecycle:
  none
  accepted_by_target_owner
  rejected_by_target_owner
  stronger_verification_requested
  handed_off_unresolved
  unknown

handoffArtifact?: string
targetOwnerDecision?: string
```

CLI evidence capture now accepts:

```txt
--target-status-freshness
--target-patch-lifecycle
--target-handoff-artifact
--target-owner-decision
```

Evidence capture output and `krn run show` text/JSON readback now render the
new fields.

## Boundary Classification

```txt
core:
  public domain target evidence metadata contract

CLI parser:
  external operator input boundary

metadata readback:
  unknown-first defensive read from persisted evidence metadata

DB:
  unchanged; existing EvidenceBundle metadata can carry the fields
```

No `any`, double assertion, or type weakening was introduced.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk git fetch --prune` | passed | remote refs refreshed before V44 | CI result for this uncommitted slice |
| `rtk git status --short --branch` | clean before edits | V44 started from clean KRN worktree | target repo readiness |
| `rtk proxy pnpm --filter @krn/core test -- evidenceBundle` | passed | core target evidence normalization/readback tests pass | full product readiness |
| `rtk proxy pnpm --filter @krn/cli test -- parseEvidenceArgs runRunShowCommand runCli evidenceCaptureGoldenBehavior` | passed | CLI parse/render/readback/golden behavior tests cover the new fields | live DB persistence in this shell |
| `rtk proxy pnpm typecheck` | passed | strict TypeScript contracts compile | runtime target safety |
| `rtk proxy pnpm test` | passed | full workspace tests pass | external target correctness |
| `rtk git diff --check` | passed | diff has no whitespace errors | semantic correctness |

## What This Proves

- Target lifecycle/freshness state is typed in core target evidence.
- CLI evidence capture can parse the new target lifecycle/freshness flags.
- Evidence capture output shows these fields to the operator.
- `krn run show` text and JSON readback expose these fields.
- Existing metadata persistence is sufficient; no schema migration is required.

## What This Does Not Prove

- Target repos are safe for repair.
- V02-01 real second-operator proof is complete.
- Product readiness or widened internal alpha.
- Target owner acceptance of any existing patch.
- Live DB replay in this specific slice.

## Condensation Decision

```txt
finding:
  target lifecycle/freshness state was workflow-required but prose-only

frequency:
  repeated/high-risk from V37-V43

candidate_surface:
  core target evidence + CLI capture/readback

decision:
  accept

rationale:
  target repair safety depends on status freshness and patch lifecycle; these
  fields belong in target evidence, not only reports

evidence:
  V43 report; core/CLI tests from V44

does_not_prove:
  target availability, V02-01, product readiness

falsifier:
  future target trials still require prose reports because evidence readback
  cannot expose lifecycle/freshness state

next_task_id:
  V45-00
```

## Next Recommended Task

```txt
V45-00 — Target Availability Re-Gate With Typed Lifecycle Evidence
```

Run a fresh observation-only target availability gate using the new typed target
evidence fields. Do not repair target repos unless a fresh clean/stable window
or explicit write scope exists.
