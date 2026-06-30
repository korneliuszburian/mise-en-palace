# IMR-07 Missing-Evidence Acquisition Bridge

Status: source/product slice.

Date: 2026-06-30

## Executive Verdict

`krn heartbeat preview` can now read an existing `krn brain search --json` or
`krn source search --json` readback file and turn explicit `missingEvidence`
into a `knowledge_acquisition_candidate`. This closes the first operator-facing
bridge from brain/source search gaps into heartbeat/dreaming candidate work.

The bridge is deliberately read-only and candidate-only. It does not run a
crawler, change ranking, create source claims, create eval candidates, mutate
Memory Core, change DB schema, or start worker runtime automation.

## Scope

Beads issue:

```txt
mise-en-palace-jta: Route missing-evidence readback into acquisition preview.
```

Changed source:

```txt
packages/cli/src/parseArgs.ts
packages/cli/src/parseHeartbeatArgs.ts
packages/cli/src/runHeartbeatPreviewCommand.ts
packages/cli/src/parseHeartbeatArgs.test.ts
packages/cli/src/runHeartbeatPreviewCommand.test.ts
```

New CLI input:

```sh
krn heartbeat preview --acquisition-readback-file <brain-or-source-search-json>
```

## Source-To-Decision

```yaml
source: IMR-06 knowledge acquisition heartbeat preview and existing brain/source search JSON readbacks
mechanism: >
  Source/brain search already exposes explicit missingEvidence; heartbeat can
  convert that gap into reviewable candidate-only acquisition work.
krn_implication: >
  KRN should make missing knowledge actionable without treating it as truth or
  starting autonomous acquisition.
decision: >
  Add the smallest CLI bridge from JSON readback file to KnowledgeAcquisitionRequest.
consumer: packages/cli/src/runHeartbeatPreviewCommand.ts
falsifier: >
  A readback with missingEvidence does not produce a knowledge_acquisition_candidate,
  or output mutates Memory Core/source/eval/worker state.
does_not_prove: >
  Source truth, acquisition quality, ranking quality, crawler readiness,
  autonomous worker execution, or product readiness.
```

## What Changed

- Added `--acquisition-readback-file` to heartbeat preview parsing.
- Read the provided file through the existing repo input-file resolver.
- Parsed JSON as `unknown` and narrowed only the two existing readback shapes:
  `sourceSearch.missingEvidence` from brain search, and
  `answerPackage.missingEvidence` from source search.
- Converted non-empty missing evidence into `KnowledgeAcquisitionRequest`.
- Preserved `mutation: none` and existing heartbeat candidate rendering.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk pnpm --filter @krn/cli test -- parseHeartbeatArgs runHeartbeatPreviewCommand` | passed | Parser and runner cover source-search and brain-search readback conversion, plus invalid JSON rejection. | Live DB content quality, acquisition quality, ranking quality, or product readiness. |
| `rtk pnpm --filter @krn/harness test -- activePlanInvariants patternChainInvariants sourceMapInvariants typescriptBoundaryInvariants` | passed | Active plan, source-map, pattern-chain, and TypeScript boundary invariants still hold. | Product usefulness or acquisition quality. |
| `rtk pnpm -r --workspace-concurrency=1 --if-present typecheck` | passed | Strict TypeScript package boundaries compile after the CLI bridge. | Runtime usefulness or live DB truth. |
| `rtk pnpm quality:fallow:ci` | passed | Changed-files Fallow quality gate found no issues. | Whole-repo semantic perfection or product readiness. |
| `rtk pnpm db:ready` | passed | Current-shell Postgres, migrations, and pgvector are ready. | Production DB state or source truth. |
| `rtk pnpm test` | passed | Full workspace tests pass after the bridge. | Real acquisition usefulness or future ranking quality. |
| `rtk git diff --check` | passed | Diff has no whitespace errors. | Behavior correctness by itself. |

## Brain Usefulness

Verdict: positive.

IMR-06 created the candidate-only acquisition primitive. IMR-07 connects it to
the actual operator readback surface: brain/source search can now say "missing
evidence", and heartbeat can turn that into reviewable follow-up work without
inventing truth or widening runtime authority.

This is closer to the desired brain shape: docs/JSON are transport and evidence
surfaces, while the brain loop is source/search/readback -> candidate ->
review/evidence -> future promotion or rejection.

## What This Does Not Prove

- Missing evidence is correct.
- The right source will be acquired.
- Graph/activation ranking is high quality.
- Worker heartbeat can run autonomously.
- Memory Core should mutate.
- The product is ready.

## Next Action

Run the bridge in a DB-backed dogfood command and capture whether a real
brain/source search gap produces useful acquisition follow-up, then decide
whether the next repair belongs in source-search missing-evidence quality,
heartbeat candidate review, or graph/ingest evidence coverage.
