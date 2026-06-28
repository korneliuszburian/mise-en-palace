# V239 Default Connected Project Resolution Repair

Status: complete.

Date: 2026-06-28

## Executive Verdict

Default `krn plan --persist` now resolves the current connected repo project
from the caller's repo root when a matching `repo_installations.local_path_hint`
exists. This removes the V238 operator footgun where KRN self-dogfood silently
used the older empty default project unless the operator supplied a project UUID.

This was an operator UX and read-model routing repair, not an activation scoring
repair. The live DB proof shows the default plan now uses the connected project,
renders the project kernel, repo installation, target read model, owner files,
and activation diagnostics with `inputStatus: candidates_available`.

## Scope

```txt
mode: DB-backed KRN-on-KRN source repair
target_dirty_before: source edits in current slice only
target_patch_lifecycle: local source repair, committed after verification
allowed_writes: CLI runtime/project-resolution source, focused CLI test, plan/report docs
forbidden_writes: activation scoring, source crawler, memory seeding, broad DB migration
```

## What Changed

Changed source:

```txt
packages/cli/src/databaseRuntime.ts
packages/cli/src/runPlanCommand.ts
packages/cli/src/runCli.ts
packages/cli/src/runCli.test.ts
```

Behavior:

```txt
runCli
  -> passes cwd to runPlanCommand

runPlanCommand
  -> derives repoPathHint from findRepoRoot(cwd)
  -> sends repoPathHint to createDatabaseRuntime for default persisted plans

createDatabaseRuntime
  -> explicit --project still wins
  -> otherwise tries repo_installations.local_path_hint via getProjectByRepoPath
  -> if matched, loads project kernel and repo installations
  -> otherwise falls back to previous workspace/project slug behavior
```

No DB schema or migration was required.

## Source-To-Decision

```yaml
source_id: v238-default-project-counterproof
title: V238 current-state activation seed showed explicit project worked while default project stayed empty
trust_tier: high
source_class: repo-local evidence
mechanism: krn init --connect persists a repo installation with localPathHint; explicit --project activates that read model, while default slug resolution can select an unrelated empty project.
krn_implication: Default persisted planning should route through the connected repo identity before falling back to slug-created project identity.
decision_kind: adopt
decision: Pass a repo root hint from CLI plan runtime into database project resolution and load connected project metadata when localPathHint matches.
does_not_prove: This does not prove owner-file coverage is complete, activation ranking is good, memory/source stores are useful, or product readiness.
consumer: CLI/database runtime project resolution and future KRN self-dogfood planning.
falsifier: A default current-repo `krn plan --persist` still selects the old empty project or omits connected project read-model metadata after `krn init --connect`.
```

## DB Proof

Default persisted plan command, with no `--project`:

```txt
executionRun: 3d04ae3e-4a5a-4e5a-9645-a24c9ba339f4
project: 7d9d103a-1a8e-4492-a4ca-db3a5589bd9b
projectKernel: 6057c6fd-e10b-418b-beda-e5b46c610034
repoInstallation: 7a2f9ba6-8df8-48a8-bfb0-a54653ea91a3
context: assembled
inclusions: 6
exclusions: 1
inputStatus: candidates_available
counts: memory=0 sourceClaims=0 search=0 ownerFile=7 antiMemory=0 merged=7
targetReadModel: provided sourceSeeds=7 ownerFiles=3 trustExclusions=7
```

Run readback confirmed the same persisted diagnostics:

```txt
run: 3d04ae3e-4a5a-4e5a-9645-a24c9ba339f4
mutation: none
evidenceBundle: b05fc2f2-113f-4a84-ac1f-605f86ccd26d
reviewAssessment: 36a8cb8d-38d7-4a77-9d28-77d4d0e87671
feedbackDelta: 23a40fa5-d837-4807-944b-91faccb811c5
observationGroup: 248c7134-1df0-46f4-b641-1d7b7da638da
reflectionRecord: 9be213be-f09f-4d1b-b38c-374668e71b8e
MemoryRecord created: no
```

## Tests

Added a focused CLI test:

```txt
passes the current repo root hint for default persisted planning
```

The test starts from a nested package cwd and verifies:

```txt
repoPathHint == repo root
Project ID: project-connected
ProjectKernel: project-kernel-connected
Repo installations: repo-installation-connected
Target owner files: packages/cli/src/runPlanCommand.ts
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/cli test -- runCli` | passed | Focused CLI behavior and regression tests pass. | Does not prove live DB project lookup. |
| `pnpm run typecheck` | passed | Public TypeScript boundary changes typecheck across the workspace. | Does not prove runtime project selection is useful. |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | Full workspace tests pass in local shell. | Does not prove CI or product readiness. |
| `pnpm db:ready` | passed | Local Postgres is reachable with 14/14 migrations and pgvector. | Does not prove remote or another machine DB state. |
| `krn plan --persist` | passed | Default persisted planning selected the connected current repo project. | Does not prove owner-file coverage is complete or activation ranking is good. |
| `krn run show --run-id 3d04ae3e-4a5a-4e5a-9645-a24c9ba339f4` | passed | Persisted run readback includes activation diagnostics. | Does not prove command execution for this slice. |
| `krn evidence capture --run-id 3d04ae3e-4a5a-4e5a-9645-a24c9ba339f4 --persist` | passed | Evidence, review assessment, and feedback delta were persisted for this slice. | Does not prove memory/source/candidate quality. |
| `krn observe --run-id 3d04ae3e-4a5a-4e5a-9645-a24c9ba339f4 --persist` | passed | Observation group and five observation items were persisted. | Does not prove observations are complete. |
| `krn reflect --scope run:3d04ae3e-4a5a-4e5a-9645-a24c9ba339f4 --persist` | passed | Reflection selected five observations and created a reflection record without Memory Core mutation. | Does not prove reflection extraction quality. |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm --filter @krn/harness test -- activePlanInvariants patternChainInvariants` | passed | Active plan and pattern-chain invariants still hold after plan updates. | Does not prove product readiness. |
| `git diff --check` | passed | Diff has no whitespace errors. | Does not prove behavior correctness. |

## Dogfood Brain Usefulness Section

### Selected / Used / Helped / Missing / Stale Context

| Item | Type | Used? | Helped? | Notes |
|---|---|---:|---:|---|
| V238 default project counter-proof | repo-local evidence | yes | yes | Directly shaped the repair and falsifier. |
| `packages/cli/src/runPlanCommand.ts` | owner file | yes | yes | Owning surface for repoPathHint propagation. |
| `packages/cli/src/databaseRuntime.ts` | owner file | yes | yes | Owning surface for DB project resolution. |
| `packages/cli/src/runCli.ts` | owner file | yes | yes | Needed to pass `cwd` into planning. |
| activation scoring code | possible adjacent context | no | no | Correctly not touched; problem was read-model routing. |

Missing context:

```txt
none blocking. The DB repository already exposed getProjectByRepoPath, so no new persistence owner had to be discovered.
```

Stale context:

```txt
none observed.
```

### Memory Usefulness

No MemoryRecord was required for the repair. This does not prove memory is
irrelevant; it proves this slice was driven by current DB/readback evidence and
source inspection.

### Source Usefulness

Repo-local V238 evidence was useful and sufficient. No external source was
needed because the mechanism was local: reuse existing `localPathHint`
project identity.

### Evidence Strength

Evidence strength: strong for local behavior.

The strongest proof is the current-shell default persisted plan readback showing
the connected project and non-empty owner-file read model without `--project`.

### Review Burden Delta

Before:

```txt
Operators had to remember and paste a project UUID to avoid empty activation store.
Reviewers had to interpret whether abstention was scoring failure or wrong project selection.
```

After:

```txt
Default self-dogfood planning from repo cwd selects the connected repo project.
Activation diagnostics show non-empty target read-model inputs.
```

Delta: reduced.

### Observation / Reflection Usefulness

Observation and reflection were captured after implementation verification.
Reflection selected five observations, wrote one reflection record, produced no
findings/candidates, and did not mutate Memory Core.

Verdict: correctly bounded ledger for this slice, not evidence that reflection
quality improved.

### Candidate Reviewability

Potential candidate:

```txt
MemoryCandidate:
  Default persisted planning should resolve connected repo identity from cwd before slug fallback.
reviewability: ready
decision: review
doesNotProve: One current-repo proof does not prove every target repo path layout resolves correctly.
```

### Brain ROI

Brain ROI: positive.

KRN helped by preserving the V238 evidence trail, forcing the repair away from
activation scoring, and providing a live DB falsifier. It still did not prove
general activation ranking quality or product readiness.

## What This Proves

- Default `krn plan --persist` from the current repo can resolve the connected
  project through existing repo installation metadata.
- The old empty-project default path is no longer silent for the current repo
  after V238 connect.
- The fix did not require activation scoring changes or DB migrations.

## What This Does Not Prove

- Owner-file coverage is complete.
- Activation ranking is good.
- Memory/source claim stores are useful for this task.
- Product readiness or widened internal-alpha readiness.
- All external target repos have safe default project resolution.

## Next Recommended Action

Run one default-path KRN-on-KRN dogfood slice without explicit `--project`.

The next slice should test whether this repair improves normal operator flow
when source work depends on owner-file recall and source-to-decision discipline.
If default-path dogfood remains clean, then future repairs can stop requiring
manual project UUIDs in normal self-dogfood prompts.
