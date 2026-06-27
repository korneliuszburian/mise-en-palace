# V43 Target Stability Window Gate

Status: complete.

Date: 2026-06-27.

Mode: observation-only stability gate.

## Executive Verdict

Live target trials should pause until a stable clean window, explicit dirty-state
permission, or real second-operator inputs exist.

Current target availability:

```txt
krn-elektroinstal-ogar:
  dirty: yes
  target_patch_lifecycle: handed_off_unresolved
  target repair allowed: no

wilq-seo:
  dirty: yes
  target_status_freshness: changed_since_selection
  target repair allowed: no
```

KRN should not chase actively changing target repos. The next useful move is
KRN internal hardening: make target evidence itself carry the lifecycle and
freshness fields now required by the target workflow.

## Inputs Inspected

Current KRN state:

```txt
branch: main...origin/main
worktree: clean
latest commit: 6f19996 docs(target): stop WILQ baseline on fresh dirty state
latest CI: 28290454541 passed
```

Current target state:

```txt
wilq-seo:
  M apps/dashboard/src/routes/AdsDoctorSurface.tsx
  M apps/dashboard/src/routes/App.test.tsx
  M packages/shared-schemas/src/index.ts
  M tests/test_api_contracts.py
  M wilq/briefing/ads_diagnostics.py
  M wilq/schemas.py
  ?? .ab/

krn-elektroinstal-ogar:
  M bedrock/web/app/themes/elektroinstal/src/css/blocks/faq-accordion.js
  M bedrock/web/app/themes/elektroinstal/template-parts/flex/faq-help.php
```

Source inspection:

```txt
packages/core/src/evidenceBundle.ts
packages/cli/src/parseEvidenceArgs.ts
packages/cli/src/runEvidenceCaptureCommand.ts
packages/cli/src/runRunShowCommand.ts
```

Finding:

```txt
Target workflow docs now require:
  target_status_freshness
  target_patch_lifecycle
  handoff_artifact

Target evidence domain/CLI/readback currently carries:
  targetRepo
  mode
  dirtyBefore
  dirtyAfter
  ownedChanges
  allowedWrites
  forbiddenWrites
  changedFiles
  commands
  doesNotProve
```

That means the new workflow rule is not yet first-class target evidence.

## Decision

Promote:

```txt
V44 — Target Evidence Lifecycle And Freshness Fields
```

Goal:

Add typed target evidence fields for:

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

Expected surfaces:

- core target evidence normalization/readback;
- CLI evidence capture parse flags;
- evidence capture output;
- run show text/JSON readback;
- focused tests;
- no DB migration if existing metadata can carry fields.

## Non-Goals

- no target repo writes;
- no target repair;
- no target commit/revert/reset/clean;
- no product-ready or widened-alpha claim;
- no fake V02-01;
- no broad target crawler;
- no new dashboard/API/MCP/worker.

## What V43 Proves

V43 proves:

- current target repos are not safe for another repair trial;
- target stability must be coordinated externally or checked per task;
- KRN has a concrete internal hardening gap: workflow-required lifecycle and
  freshness fields are not yet typed target evidence.

V43 does not prove:

- KRN product readiness;
- V02-01 second-operator usability;
- WILQ or elektroinstal code quality;
- that target trials should stop permanently.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk git fetch --prune` | passed | KRN remote refs refreshed | target readiness |
| `rtk git status --short --branch` in KRN | clean | KRN worktree clean before V43 | product readiness |
| `rtk gh run list --branch main --limit 5` | latest CI ok | latest KRN commit passed CI | target runtime correctness |
| `rtk git status --short --branch` in `wilq-seo` | dirty + `.ab/` untracked | WILQ unavailable for clean target trial | owner intent |
| `rtk git status --short --branch` in `krn-elektroinstal-ogar` | dirty with FAQ patch | same-target repair remains blocked | target owner acceptance |
| `rtk rg ... target_status_freshness ...` | fields only in docs/reports, not core/CLI target evidence | lifecycle/freshness source gap exists | exact implementation size |

## Final Decision

V43 is complete as a target stability gate.

Next active stream:

```txt
V44 — Target Evidence Lifecycle And Freshness Fields
```

