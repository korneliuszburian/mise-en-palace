# V33 Reused Project Owner-File Refresh Repair

Status: complete.

Date: 2026-06-27.

## Executive Verdict

V33 repaired the reused-project owner-file refresh gap exposed by V32.

Before the repair, `krn init --connect --persist --owner-file ...` could print
newly supplied owner files while `krn plan --project --persist` still planned
from older/stale owner-file metadata. After the repair:

```txt
reused project init/connect creates a fresh ProjectKernel snapshot when current
source/owner metadata differs;
plan treats latest ProjectKernel ownerFiles as the current owner-file snapshot;
repoInstallation ownerFiles are only fallback when latest ProjectKernel has no
ownerFiles.
```

DB-backed replay on the V32 target project now reports:

```txt
Target read model: sourceSeeds=3, ownerFiles=2, trustExclusions=7
Target owner files:
  bedrock/web/app/themes/elektroinstal/src/css/blocks/faq-accordion.js
  bedrock/web/app/themes/elektroinstal/template-parts/flex/faq-help.php
Context included:
  the two FAQ owner files
  target trust exclusions
```

This is the right repair shape: refresh/read-model semantics, not activation
scoring rewrite and not a target source crawler.

## Source Change

Changed files:

```txt
packages/cli/src/runInitCommand.ts
packages/cli/src/runPlanCommand.ts
packages/db/src/initConnectSmoke.ts
packages/cli/src/runDbSmokeCommand.ts
```

Implementation:

- `runInitCommand.ts` now builds deterministic ProjectKernel metadata for the
  current target detection.
- Reused `init --connect` creates a new ProjectKernel version only when current
  metadata differs from the latest kernel metadata.
- `runPlanCommand.ts` now treats latest ProjectKernel owner files as the active
  snapshot; repo installation owner files are fallback only.
- `db:smoke:init-connect` now proves refreshed ProjectKernel version 2 and
  refreshed owner file paths.

No DB migration was needed.

## V32 Finding Replayed

V32 target project:

```txt
project_id: e83b4509-6889-426c-90e2-bc4e6394ba26
target_repo: /home/krn/coding/krn/active/krn-elektroinstal-ogar
```

V33 init/connect replay:

```txt
Project ID: e83b4509-6889-426c-90e2-bc4e6394ba26 (reused)
Repo installation ID: f08bfff8-cba2-426b-9c0e-18c90774afff (reused)
ProjectKernel ID: 3e31e3cd-fdd0-42b0-b1b7-33c609bd147d (created)
```

V33 plan replay:

```txt
executionRun: cea1450b-07c2-4d4c-b190-331a242b47e8
Target read model: sourceSeeds=3, ownerFiles=2, trustExclusions=7
Context included: 3
Context excluded: 0
```

The two owner-file inclusions were:

```txt
bedrock/web/app/themes/elektroinstal/src/css/blocks/faq-accordion.js
bedrock/web/app/themes/elektroinstal/template-parts/flex/faq-help.php
```

Old V32 stale owner files no longer occupied the owner-file read model for this
task.

## KRN Source Run

KRN persisted source-repair run:

```txt
executionRun: d0092ebd-7c4d-4ed5-a910-98757bb5530a
taskContract: f0d1a4ed-9ebd-4403-b034-3703327d1f6f
contextAssembly: ca0e6088-350b-4adb-beed-8441bd9fdd35
```

Evidence:

```txt
evidenceBundle: beeb7a90-fcc3-41ea-ba99-b7b4264d1409
reviewAssessment: c53eb6f2-5102-4c23-8cb8-f46297295f48
feedbackDelta: d8876b6e-161a-4222-98c0-f8c743238f96
```

Observation/reflection:

```txt
observationGroup: 53af9a8e-421f-4d2a-b87a-fda119ca552a
reflectionRecord: dd1e31c6-efe6-4f5a-ac88-c7cef0269d39
Memory mutation: none
MemoryRecord created: no
Candidate rows written: no
```

KRN plan for the source repair abstained with 0 context inclusions. That is a
remaining activation caveat, but not a blocker for this repair because source
inspection found the owner path directly.

## Verification

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk pnpm --filter @krn/cli test -- runCli runPlanCommand` | passed | CLI plan/init behavior and related run tests still pass | product readiness |
| `rtk pnpm --filter @krn/db test -- initConnectSmoke DrizzleProjectRepository` | passed | DB repository/smoke tests cover touched DB path | full live replay |
| `rtk proxy pnpm typecheck` | passed | workspace TypeScript compiles through real pnpm script | runtime correctness |
| `rtk pnpm test` | passed | full workspace test suite passes | product readiness or target runtime correctness |
| `rtk env KRN_DATABASE_URL=... pnpm db:ready` | passed | local DB ready with migrations and pgvector | CI DB state |
| `rtk env KRN_DATABASE_URL=... pnpm db:smoke:init-connect` | passed | refreshed ProjectKernel snapshot is smoke-proven | arbitrary target quality |
| `rtk git diff --check` | passed | no whitespace diff errors | semantic correctness |

Note: direct `rtk pnpm typecheck` uses RTK pnpm/tsc shortcut behavior and
returned code 1 while printing `TypeScript: No errors found`; `rtk proxy pnpm
typecheck` was used as the authoritative typecheck command.

## Dogfood Brain Usefulness

| Area | Verdict | Evidence | Notes |
|---|---|---|---|
| Source finding | good | V32 report pointed to exact stale owner-file refresh symptom | report drove the repair |
| Activation | weak | V33 KRN source plan abstained | source inspection carried implementation |
| Evidence | good | intended files 4, unrelated 0, unknown 0 | command proof persisted |
| DB replay | good | V32 target project replay now ownerFiles=2 | current-shell proof |
| Review burden | lower | stale owner files removed from target read model when latest kernel has ownerFiles | future target repairs should need less manual owner-file correction |
| Product readiness | unchanged | repair strengthens controlled alpha | still not V02-01/product-ready |

Brain ROI: positive for evidence-driven repair; weak for source activation.

## Product Boundary

V33 does not prove:

- product readiness;
- widened internal alpha;
- V02-01 second-operator usability;
- full target runtime correctness;
- that activation scoring is perfect;
- that source crawlers are unnecessary forever.

It proves the V32 reused-project owner-file refresh gap has a focused source
repair and current-shell replay.

## Next Recommended Action

Promote V34:

```txt
V34 — Target Repair Re-Gate After Owner-File Refresh
```

Goal: decide the next product move after V32/V33. The re-gate must account for
the current dirty target patch from V32, the repaired owner-file refresh, and the
fact that V02-01/product-ready/widened alpha remain unproved.

Likely choices:

- another controlled target repair on a clean/safe target;
- target patch handoff/rollback boundary;
- real operator intake if inputs exist;
- no new implementation if readiness evidence says to pause.
