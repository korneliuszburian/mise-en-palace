# V240 Project Resolution Readback Dogfood

Status: complete.

Date: 2026-06-28

## Executive Verdict

Default-path KRN dogfood now exposes how a persisted plan resolved its project:
`explicit_project`, `connected_repo_path`, or `workspace_project_slug`.

This completes the operator-facing half of V239. V239 made default planning use
the connected repo project; V240 makes that resolution visible in `krn plan`
stdout and persisted `krn run show` readback.

## Scope

```txt
mode: DB-backed KRN-on-KRN source repair
default_plan_path: yes, no explicit --project
allowed_writes: CLI runtime/readback source, focused CLI tests, report/plan docs
forbidden_writes: activation scoring, broad source/research layer, DB migration
```

## What Changed

Changed source:

```txt
packages/cli/src/databaseRuntime.ts
packages/cli/src/runPlanCommand.ts
packages/cli/src/runRunShowCommand.ts
packages/cli/src/runCli.test.ts
packages/cli/src/runRunShowCommand.test.ts
```

Behavior:

```txt
createDatabaseRuntime
  -> returns typed projectResolution metadata

runPlanCommand
  -> renders project resolution in plan output
  -> persists projectResolution into ExecutionRun metadata

runRunShowCommand
  -> parses projectResolution from unknown metadata
  -> renders it in text readback
  -> includes it in JSON readback
```

## Source-To-Decision

```yaml
source_id: v239-default-connected-project-resolution
title: V239 default connected-project resolution proof
trust_tier: high
source_class: repo-local evidence
mechanism: Default project resolution can now use repo_installations.local_path_hint, but the operator still needs readback that explains whether the project came from explicit input, connected repo path, or slug fallback.
krn_implication: Project resolution should become an operator-visible proof boundary, not only an internal DB choice.
decision_kind: adopt
decision: Add typed ProjectResolution output to plan stdout and persisted run readback.
does_not_prove: This does not prove owner-file coverage is complete, activation ranking is good, or the resolved project is always the correct product target.
consumer: CLI/readback behavior and future default-path dogfood reviews.
falsifier: A persisted default plan cannot explain why the selected project was chosen.
```

## DB Proof

Default persisted plan command, with no `--project`:

```txt
executionRun: 8f6089c8-11ac-4449-8b8c-3628c54186fd
project: 7d9d103a-1a8e-4492-a4ca-db3a5589bd9b
projectResolution: connected_repo_path
repoPathHint: /home/krn/coding/krn/active/mise-en-palace
context: assembled
inputStatus: candidates_available
```

Readback confirmed persisted metadata:

```txt
krn run show --run-id 8f6089c8-11ac-4449-8b8c-3628c54186fd
project resolution: connected_repo_path
project resolution reason: Resolved from repo_installations.local_path_hint matching the current repo root.
project resolution does not prove: Connected repo path resolution does not prove owner files are complete, current, or sufficient.
evidenceBundle: d9f6af10-962b-47b4-b5ed-7af1b7c3597b
reviewAssessment: 886bd68b-b96f-4b22-bd65-07c04a890982
feedbackDelta: 5d5b1b5b-bc9a-4997-911c-2ca12ad70b12
observationGroup: 2e3129d8-2023-4321-8060-4a507cb3872c
reflectionRecord: c598b639-1dac-4a53-a445-994f407eed93
MemoryRecord created: no
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/cli test -- runCli runRunShowCommand` | passed | Focused plan/readback rendering and JSON tests pass. | Does not prove live DB behavior. |
| `pnpm run typecheck` | passed | New public CLI runtime types typecheck across workspace. | Does not prove operator usefulness. |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | Full workspace tests pass locally. | Does not prove CI or product readiness. |
| `pnpm db:ready` | passed | Local DB is reachable with 14/14 migrations and pgvector. | Does not prove another machine or remote DB state. |
| `krn plan --persist` | passed | Default plan output renders project resolution. | Does not prove selected context is sufficient. |
| `krn run show --run-id 8f6089c8-11ac-4449-8b8c-3628c54186fd` | passed | Persisted run readback renders project resolution. | Does not prove commands ran inside readback. |
| `krn evidence capture --run-id 8f6089c8-11ac-4449-8b8c-3628c54186fd --persist` | passed | Evidence, review assessment, and feedback delta were persisted with intended/unrelated classification. | Does not prove memory/source/candidate quality. |
| `krn observe --run-id 8f6089c8-11ac-4449-8b8c-3628c54186fd --persist` | passed | Observation group and five items were persisted. | Does not prove observations are complete. |
| `krn reflect --scope run:8f6089c8-11ac-4449-8b8c-3628c54186fd --persist` | passed | Reflection selected five observations and wrote one reflection record without Memory Core mutation. | Does not prove reflection extraction quality. |
| `git diff --check` | passed | Diff has no whitespace errors. | Does not prove behavior correctness. |

## Dogfood Brain Usefulness Section

### Selected / Used / Helped / Missing / Stale Context

| Item | Type | Used? | Helped? | Notes |
|---|---|---:|---:|---|
| `packages/cli/src/runPlanCommand.ts` | owner file | yes | yes | Correct owner for plan stdout and metadata persistence. |
| `packages/cli/src/runRunShowCommand.ts` | owner file | yes | yes | Correct owner for persisted readback. |
| `packages/harness/src/activation/activationEngine.ts` | owner file | no | neutral | Selected by current read model but not needed for this repair. |
| `README.md` / `AGENTS.md` source seeds | source seed | no | neutral | Useful as default context, not material for this slice. |

Missing context:

```txt
none blocking. Default connected read-model surfaced the two owner files needed for the repair.
```

Stale context:

```txt
none observed.
```

### Memory Usefulness

No MemoryRecord was selected or required. This was a readback/UX repair driven
by recent DB-backed reports.

### Source Usefulness

Repo-local V239 evidence was useful. No external source was required because
the mechanism was local and already proven.

### Evidence Strength

Strong for local CLI/readback behavior: focused tests, typecheck, full tests,
DB readiness, default persisted plan, and run readback all passed.

### Review Burden Delta

Before:

```txt
Operator could see the selected project ID, but not why it was selected.
```

After:

```txt
Operator can see whether the project was selected by explicit project input,
connected repo path, or slug fallback, with does-not-prove text.
```

Delta: reduced.

### Observation / Reflection Usefulness

Observation and reflection were captured after implementation verification.
Reflection selected five observations, wrote one reflection record, produced no
findings/candidates, and did not mutate Memory Core.

Verdict: useful ledger closure, not evidence of improved reflection extraction.

### Candidate Reviewability

Potential candidate:

```txt
MemoryCandidate:
  Persisted plan readback should expose project resolution source and proof boundaries.
reviewability: ready
decision: review
doesNotProve: One default-path dogfood does not prove all project resolution modes are correct.
```

### Brain ROI

Brain ROI: positive.

Default-path activation selected useful owner files and the source-to-decision
gate prevented this from becoming an activation scoring change or research
backlog.

## What This Proves

- Default-path KRN plan can guide a small source repair without explicit
  `--project`.
- Plan output and run readback now expose project resolution source.
- The repair preserved strict TypeScript boundaries and required no DB schema.

## What This Does Not Prove

- Product readiness.
- Owner-file coverage completeness.
- Activation ranking quality beyond this owner-file case.
- Memory/source store usefulness.
- That external best-pattern intake is already productized.

## Next Recommended Action

Run a bounded external best-pattern intake trial.

Use public/allowed sources only, map them through source-to-decision, and either
adopt, reject, or lab-test exactly one pattern with a concrete consumer and
falsifier. Do not create a broad Research Foundry or source archive.
