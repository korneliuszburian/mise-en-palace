# V242 Finite-State Exhaustiveness Application Trial

Status: complete.

Date: 2026-06-28

## Executive Verdict

V242 applied the V241 finite-state exhaustiveness standard to one concrete
operator-facing TypeScript boundary. `ProjectResolutionKind` now has an
exhaustive CLI readback helper, and both `krn plan` and `krn run show` render
the raw kind with a human label.

This is a bounded source repair, not broad TypeScript cleanup.

## Source-To-Decision

```yaml
source_id: typescript-narrowing-and-exhaustiveness
title: TypeScript Handbook - Narrowing
trust_tier: high
source_class: official docs
mechanism: Control-flow narrowing plus never exhaustiveness makes finite union states explicit where behavior changes.
krn_implication: ProjectResolutionKind is an operator-facing finite union; adding a new resolution kind should force a readback label and product wording decision.
decision_kind: adopt
decision: Add exhaustive ProjectResolutionKind label helper and use it in plan/readback output.
consumer: CLI readback behavior and focused tests.
falsifier: A new ProjectResolutionKind can be added without compile-time failure or readback label update.
does_not_prove: This does not prove every union needs exhaustive rendering, broad TypeScript cleanup is valuable, or activation/readback quality is generally solved.
```

## Selected Boundary

```txt
union: ProjectResolutionKind
owner type: packages/cli/src/databaseRuntime.ts
new readback helper: packages/cli/src/projectResolutionReadback.ts
render consumers:
  - packages/cli/src/runPlanCommand.ts
  - packages/cli/src/runRunShowCommand.ts
tests:
  - packages/cli/src/projectResolutionReadback.test.ts
  - packages/cli/src/runCli.test.ts
  - packages/cli/src/runRunShowCommand.test.ts
```

Before V242, plan/readback output printed the raw literal only:

```txt
connected_repo_path
```

After V242, operator-facing output keeps the raw value and adds the label:

```txt
connected_repo_path (connected repo path)
```

## KRN Plan Proof

V242 used DB-backed default-path KRN planning.

```txt
executionRun: a23d324b-37ae-410b-bf9c-791542ce715b
projectResolution: connected_repo_path
taskContract: 277f4dda-b775-4167-b510-7f6c41fab298
```

The implementation readback proof used a later persisted run after the source
change:

```txt
executionRun: 86e81d2d-f628-40fe-afad-7ea1d4630502
taskContract: 08085f33-3060-4bc0-8767-4025958a202b
projectResolution output: connected_repo_path (connected repo path)
run show output: project resolution: connected_repo_path (connected repo path)
evidenceBundle: 848d6dc3-1bb2-423a-b4cd-8c2568c4c2ce
reviewAssessment: 4f9238b9-cbe4-425a-9802-fd835cf9e71f
feedbackDelta: f76734db-2e2b-49ea-9f0f-20caa9472877
observationGroup: c7b7fa81-379c-411e-bd00-d5244c0ae91a
reflectionRecord: 2f32df60-fb0d-4b04-957a-7472313965d2
MemoryRecord created: no
```

## Activation Usefulness

| Item | Used? | Helped? | Notes |
|---|---:|---:|---|
| `packages/cli/src/runPlanCommand.ts` | yes | yes | Correct owner for `krn plan` output. |
| `packages/cli/src/runRunShowCommand.ts` | yes | yes | Correct owner for persisted readback output. |
| `packages/harness/src/activation/activationEngine.ts` | no | neutral | Related to context selection, but not needed for this bounded readback slice. |
| trust exclusions / README source seed | no | neutral | Useful guardrails, not source owners. |

Missing context:

```txt
packages/cli/src/databaseRuntime.ts was discovered through source inspection as
the owner of ProjectResolutionKind, not selected directly as an owner file.
```

This is not enough evidence for activation scoring work. It is a useful owner
file recall observation for future aggregation.

## Change Summary

| Area | Change | Why final-pattern | What was not changed |
|---|---|---|---|
| CLI readback helper | Added `projectResolutionKindLabel` with `assertNever`. | A new union member must force a local readback wording decision. | No parser, DB schema, or activation behavior changed. |
| `krn plan` output | Formats project resolution with raw kind plus label. | Keeps machine value and human meaning visible. | No planning semantics changed. |
| `krn run show` output | Formats persisted project resolution with raw kind plus label. | Same readback contract as plan output. | No persistence/read model fields changed. |
| Tests | Added helper tests and updated plan/readback expectations. | Protects current labels and output shape. | No broad snapshots or quality scanner added. |

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/cli test -- runCli runRunShowCommand projectResolutionReadback` | passed | Focused CLI output and helper tests pass. | Does not prove all finite unions are exhaustive. |
| `pnpm run typecheck` | passed | TypeScript accepts the exhaustive helper and no type weakening was needed. | Does not prove product readiness. |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | Full workspace tests pass locally. | Does not prove CI or every runtime path. |
| `pnpm db:ready` | passed | Current-shell Postgres is reachable, 14/14 migrations are applied, and pgvector is available. | Does not prove remote CI DB state. |
| `krn plan --persist` | passed | Persisted plan output renders `connected_repo_path (connected repo path)`. | Does not prove activation selected every needed owner file. |
| `krn run show --run-id 86e81d2d-f628-40fe-afad-7ea1d4630502` | passed | Persisted readback renders `connected_repo_path (connected repo path)`. | Does not prove commands were executed by readback. |
| `git diff --check` | passed | Diff has no whitespace errors. | Does not prove behavior correctness. |

## Type Safety Boundary

Boundary classification:

```txt
boundary: CLI/operator readback
input type: internal ProjectResolutionKind union from database runtime
validation/narrowing: exhaustive switch in projectResolutionReadback.ts
public type change: none
type-safety exceptions: none
```

No `any`, double assertion, unchecked parse, or type weakening was introduced.

## What This Proves

- One V241 best-pattern source produced a concrete source repair.
- `ProjectResolutionKind` now has an exhaustive readback label boundary.
- Plan output and run readback output both expose raw kind plus human label.
- The change works against current-shell DB-backed KRN output.

## What This Does Not Prove

- Every finite union in KRN needs a helper.
- Broad TypeScript cleanup is useful.
- Activation owner-file recall is solved.
- Product readiness.

## Condensation Decision

```txt
finding: finite-state exhaustiveness improved one operator-facing readback boundary.
frequency: first bounded code application after V241 source intake.
candidate_surface: source decision / bounded repair.
decision: accept.
rationale: ProjectResolutionKind changes operator meaning; new members should require readback wording.
evidence: projectResolutionReadback tests, plan output, run show output, typecheck, full tests.
does_not_prove: general TypeScript health or broad cleanup value.
falsifier: a new ProjectResolutionKind compiles without updating readback labeling.
next_task_id: V243-00.
```

## Next Recommended Action

Run a bounded official Codex source-to-decision trial for the existing
ExecPlan/Goal/prompting references that shape KRN's continuous loop. The goal is
to prevent those sources from becoming decorative links and to route them into a
small consumer, falsifier, or explicit rejection.
