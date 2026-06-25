# Codex Brief Contract Hardening Report

Status: C-03 completion report.

Date: 2026-06-25

## Executive Verdict

C-03 hardened the Codex-facing execution brief by making task constraints,
acceptance criteria, and review burden first-class rendered fields. The brief
already rendered objective, non-goals, selected context, exclusions, expected
evidence, rollback, tool boundaries, and does-not-prove statements. This slice
closed the main missing contract fields without changing core domain logic or
invoking Codex.

## Scope

Changed:

- `packages/codex-adapter/src/contracts.ts`
- `packages/codex-adapter/src/renderExecutionBrief.ts`
- `packages/codex-adapter/src/renderExecutionBrief.test.ts`

Not changed:

- `packages/core`;
- harness compiler behavior;
- activation scoring;
- memory/source/evidence persistence;
- CLI command semantics;
- dashboard/API/MCP/worker runtime.

## Implementation

`ExecutionBriefTaskContract` now carries:

- `constraints`;
- `acceptance`.

`ExecutionBriefEvidenceContract` now carries:

- `reviewBurden`.

`renderExecutionBriefText` now renders:

```txt
Constraints:
- ...
Acceptance:
- ...
Evidence Contract:
- ...
Diff risk: ...
Review burden: ...
Rollback path: ...
```

This keeps the Codex adapter as a renderer over harness output. It does not make
independent trust decisions.

## DB-Backed Dogfood

KRN plan run:

```txt
bc1dd6e3-1263-4007-a1e4-34defc1932cf
```

Task:

```txt
Harden Codex execution brief so constraints, acceptance, review burden,
rollback, selected context, and evidence expectations are visible without prompt
bloat
```

The rendered brief included:

- `Constraints`;
- `Acceptance`;
- `Context Inclusions`;
- `Explicit Exclusions`;
- `Evidence Contract`;
- `Review burden`;
- `Rollback path`;
- `What This Does Not Prove`.

This is the C-03 behavior proof that the real `krn plan --persist` output uses
the hardened renderer.

Final persisted evidence:

```txt
EvidenceBundle: ba2d47f3-6162-4038-880e-e5bfdc008798
ReviewAssessment: 672fe320-ccac-4e22-9292-f990180c9894
FeedbackDelta: 93b35643-a321-4fa8-b9ca-ee67e9a766db
ObservationGroup: 8c69526d-3e37-479a-9b83-c3b2667f411b
ReflectionRecord: eb7e7dec-cd20-4028-9c1d-308f1c271a73
Memory mutation: none
MemoryRecord created: no
```

One incorrect observe command using `--run-id` failed because the CLI requires
`--run`. The successful persisted observe command used the documented
`--run <id>` shape.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `pnpm --filter @krn/codex-adapter test -- renderExecutionBrief contracts` | passed | Adapter contract/render tests cover constraints, acceptance, and review burden. | Does not prove CLI plan output. |
| `pnpm --filter @krn/codex-adapter typecheck` | passed | Adapter public types compile after contract additions. | Does not prove runtime rendering. |
| `pnpm --filter @krn/cli test -- codexAdapterSmoke runCli` | passed | CLI smoke and runCli tests still pass with adapter changes. | Does not prove all operator tasks. |
| `rg ... @krn/codex-adapter packages/core` | passed | Core does not import the Codex adapter. | Does not prove architectural quality alone. |
| `krn plan --task ... --persist` | passed | Real DB-backed plan output renders the new brief fields. | Does not prove Codex executed the brief. |
| `krn evidence capture --run-id ... --persist` | passed | Persisted changed-file classification, operator-reported command evidence, review assessment, and feedback delta for this slice. | Does not prove memory quality or product readiness. |
| `krn observe --run ... --persist` | passed | Persisted observation group for the C-03 run without Memory Core mutation. | Does not prove observation extraction quality at scale. |
| `krn reflect --scope run:... --persist` | passed | Persisted reflection record for the C-03 run without MemoryRecord creation. | Does not prove reflection candidate quality at scale. |
| `pnpm typecheck` | passed | Full workspace typechecks. | Does not prove runtime correctness. |
| `pnpm test` | passed | Full workspace tests pass. | Does not prove product readiness. |
| `git diff --check` | passed | Diff whitespace is clean. | Does not prove semantic correctness. |

## Dogfood Brain Usefulness Section

### Brain Usefulness Summary

Brain ROI:
- positive

Overall verdict:
- KRN helped keep the slice bounded to adapter rendering and supplied enough
  evidence/review structure to avoid prompt bloat or core-domain drift.

What this run proves:
- Codex briefs now expose constraints, acceptance, review burden, rollback,
  selected context, exclusions, and evidence expectations in one rendered
  artifact.
- The adapter remains non-mutating and outside core.

What this run does not prove:
- Codex will always follow the brief;
- brief length is optimal for all tasks;
- target repo product readiness;
- dashboard/API/MCP need.

DB used in current shell:
- yes

### Activated Context Usefulness

| Item | Type | Why selected | Used? | Helped? | Missing/Stale/Noise? | Evidence | Follow-up |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AGENTS compact guidance claim | source | Prevent brief/AGENTS bloat. | yes | helped | none | plan run `bc1dd6e3-1263-4007-a1e4-34defc1932cf` | keep |
| weak command evidence claim | source | Brief/evidence proof must not overclaim. | yes | helped | none | plan run `bc1dd6e3-1263-4007-a1e4-34defc1932cf` | keep |
| stale audit anti-memory exclusion | anti-memory | Prevents resurrecting audit-slice governance. | yes | helped | none | plan exclusions | keep |
| adapter owner files | raw recall | Needed for implementation. | yes | helped | missing from activation except nearby owner recall noise | source inspection | raw recall if repeated |

### Evidence And Review Burden

| Evidence item | Strength | What it proves | What it does not prove | Review burden impact |
| --- | --- | --- | --- | --- |
| Adapter tests | strong | Renderer includes the missing fields. | CLI runtime output alone. | reduced |
| CLI smoke tests | strong | CLI smoke still handles adapter output. | Every plan path. | reduced |
| DB-backed plan output | strong | Real brief includes new fields. | Codex execution. | reduced |
| Full typecheck/test | strong | Workspace remains healthy. | Product value. | unchanged |

### Candidate Quality

No candidate was promoted. Generic evidence-capture proposals should remain
deferred unless a later run gives them concrete application guidance.

### Brain ROI

| Dimension | Verdict | Evidence |
| --- | --- | --- |
| Context waste | lower | task stayed inside codex-adapter + tests |
| Review burden | lower | brief now names review burden directly |
| Resume quality | better | report records run ID and verification |
| Decision grounding | better | core import boundary checked |
| Memory usefulness | mixed | selected memory was governance, not owner file |
| Operator friction | lower | brief is more complete without extra docs |

## Product Readiness Signal

Verdict:

```txt
Codex brief is stronger for internal-alpha dogfood, not product-complete.
```

Remaining gaps:

- no automated Codex execution;
- no target-repo repeated brief trial;
- brief length/format has not been evaluated by another operator.

## Next Recommended Action

Continue to:

```txt
D-00 — Dogfood-Derived GoldenTask Promotion Lane
```

D-00 should use repeated dogfood findings like owner-file recall misses,
review-burden rendering, and governed memory activation to define promotion
rules for GoldenTasks without turning Promptfoo into product truth.
