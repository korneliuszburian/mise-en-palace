# V238 Current-State Activation Seed And Read-Model Decision

Status: complete.

Date: 2026-06-28

## Executive Verdict

The existing `krn init --connect` path is enough to seed current-repo activation read-model material without new architecture. Using an absolute repo root and explicit owner files created a project, repo installation, project kernel, source seeds, and owner files for the current KRN repo.

With explicit `--project 7d9d103a-1a8e-4492-a4ca-db3a5589bd9b`, `krn plan --persist` no longer reports `empty_activation_store`; it selects current-state owner-file context and trust exclusions.

However, default `krn plan --persist` still resolves to the older empty project `ae9962f9-0b20-4a43-97fe-d715062c4478`, so self-dogfood can still silently use the wrong project unless `--project` is supplied. The next repair should target default connected-project resolution or a clear warning/suggestion, not activation scoring.

## Mode

```txt
mode: observation-only / DB current-state seed
target_dirty_before: no
target_status_freshness: fresh_current_task
target_patch_lifecycle: none
allowed_writes: KRN DB project/repo/kernel metadata through existing init --connect path
forbidden_writes: source files, target files, broad DB manipulation
```

No source files were edited during V238.

## Commands And Evidence

Dry-run with `--repo .` was rejected as a usable proof because `pnpm --filter @krn/cli` runs from `packages/cli`, so `.` resolved to the package directory. This is an important operator ergonomics finding, not a seed success.

Root dry-run used absolute repo path:

```txt
repo: /home/krn/coding/krn/active/mise-en-palace
sourceSeeds: 7
ownerFiles: 3
```

Connect result:

```txt
project: 7d9d103a-1a8e-4492-a4ca-db3a5589bd9b
repoInstallation: 7a2f9ba6-8df8-48a8-bfb0-a54653ea91a3
projectKernel: 6057c6fd-e10b-418b-beda-e5b46c610034
filesWritten: none
```

Owner files supplied:

```txt
packages/harness/src/activation/activationEngine.ts
packages/cli/src/runPlanCommand.ts
packages/cli/src/runRunShowCommand.ts
```

Explicit project plan proof:

```txt
executionRun: 8a7747ff-4093-494e-8fa8-6370739a2961
context: assembled
inclusions: 4
inputStatus: candidates_available
counts: memory=0 sourceClaims=0 search=0 ownerFile=4 antiMemory=0 merged=4
targetReadModel: provided sourceSeeds=7 ownerFiles=3 trustExclusions=7
```

Default project counter-proof:

```txt
executionRun: 7f3e958d-8cd5-4c09-b12f-89eb87fb5944
project: ae9962f9-0b20-4a43-97fe-d715062c4478
context: abstained
inputStatus: empty_activation_store
```

## Source-To-Decision

```yaml
source_id: v238-current-repo-connect
title: V238 current repo init/connect and explicit project plan proof
trust_tier: high
source_class: repo-local evidence
mechanism: Existing init/connect can create project-scoped source seeds and owner files; explicit --project then gives activation non-empty target read-model candidates.
krn_implication: KRN does not need a crawler or scoring rewrite to escape empty activation store, but default project resolution now needs repair or warning.
decision_kind: adopt
decision: Use existing init/connect for current-state read model and open V239 default connected-project resolution repair.
does_not_prove: This does not prove owner-file coverage is complete, memory/source stores are useful, or product readiness.
consumer: V239 default connected-project resolution repair
falsifier: Default krn plan continues to use an empty project when a connected repo project for the current cwd exists.
```

## What This Proves

- Existing `krn init --connect` can seed current-repo read-model metadata.
- Explicit `--project` makes activation choose owner-file candidates.
- Empty activation store was an input/project selection issue, not proven bad scoring.

## What This Does Not Prove

- Default project selection is correct.
- Owner-file coverage is complete.
- Memory/source claim stores are useful.
- Product readiness or second-operator readiness.

## Next Task

```txt
V239 Default Connected Project Resolution Repair
```

Goal: make default `krn plan --persist` from the current repo use the connected repo project when one exists, or print a clear warning/suggestion when it would otherwise use an empty default project.

