# IMR-44 Source Artifact JSON Consumer

Status: complete bounded ingest/readback source repair.

Issue: `mise-en-palace-ou2`.

## Executive Verdict

`krn.sourceArtifactPreview.v1` is now consumed by a downstream brain loop.

Decision: teach `krn heartbeat preview --acquisition-readback-file` to classify
source artifact preview JSON as candidate-only knowledge acquisition input.
This keeps the ingest loop moving without adding a crawler, DB schema, ranking
rewrite, worker daemon, API/MCP, source truth mutation, eval promotion, or Memory
Core mutation.

## Source To Decision

- Source: IMR-43 added structured source artifact preview JSON and the active
  follow-up issue required one bounded downstream consumer.
- Mechanism: source artifact preview already reports artifact, chunk, candidate
  bridge, persistence, proof, and ingest-loop readback state.
- KRN implication: heartbeat/dreaming can classify missing source/search
  readback from JSON instead of scraping text or opening broad ingestion work.
- Decision: add `source_artifact_preview` acquisition source support to heartbeat
  acquisition readback.
- Rejection: no crawler, broad ingestion, ranking rewrite, DB schema, worker
  daemon, API/MCP, source truth mutation, eval promotion, or Memory Core
  mutation.
- Consumer: `krn heartbeat preview --candidate-kind knowledge_acquisition`.
- Falsifier: a source artifact preview JSON file without artifact/chunk/
  candidate/readback state should not produce a reviewable acquisition request.

## Changed

- `KnowledgeAcquisitionSource` now includes `source_artifact_preview`.
- Heartbeat acquisition readback recognizes `krn.sourceArtifactPreview.v1`.
- Local previews without persisted source/search readback produce a review-ready
  acquisition candidate.
- Previews with ready ingest readback do not produce duplicate acquisition work.
- Tests cover CLI routing and worker candidate preservation.

## Brain Usefulness

| Area | Verdict | Evidence |
|---|---|---|
| Ingest v0/v1 | useful | Source artifact JSON now feeds heartbeat acquisition readback. |
| Heartbeat/dreaming | useful | Missing source/search readback becomes candidate-only work with mutation none. |
| Review burden | reduced | Operator sees access, chunk count, candidate statuses, missing evidence, and proof boundary in one heartbeat output. |
| Code quality | improved | Fallow initially flagged parser complexity; the parser was split into small helpers and the changed-files audit passed. |
| Product risk | contained | No new crawler, schema, ranking, worker, API/MCP, source truth, eval, or Memory Core authority. |

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk pnpm --filter @krn/cli test -- runHeartbeatPreviewCommand` | passed | CLI heartbeat acquisition readback routes source artifact preview JSON. | Does not prove full repo behavior or source truth. |
| `rtk pnpm --filter @krn/workers test -- knowledgeAcquisitionHeartbeatPreview` | passed | Worker candidate builder preserves `source_artifact_preview`. | Does not prove runtime scheduling or autonomous dreaming. |
| `rtk pnpm --filter @krn/cli run typecheck` | passed | CLI TypeScript package compiles with the new parser path. | Does not prove product usefulness. |
| `rtk pnpm quality:fallow:ci` | passed | Changed files have no Fallow complexity, duplication, dead-code, or dependency findings after simplification. | Does not prove whole-repo code quality. |
| `rtk proxy pnpm typecheck` | passed | Full workspace TypeScript typecheck passes. | Does not prove runtime usefulness. |
| `rtk env TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | Full workspace test suite passes. | Does not prove product readiness or source truth. |
| `rtk git diff --check` | passed | Diff has no whitespace errors. | Does not prove behavior. |
| `rtk pnpm --silent --filter @krn/cli krn source artifact preview --file PLAN.md --chunk-lines 20 --limit-chunks 1 --json` | passed | Real source artifact preview JSON can be produced. | Does not prove DB persistence or source truth. |
| `rtk env KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --silent --filter @krn/cli krn heartbeat preview --candidate-kind knowledge_acquisition --acquisition-readback-file /tmp/krn-imr44-source-artifact-preview.json --max-candidates 1` | passed | Real preview JSON feeds heartbeat and emits one review-ready `source_artifact_preview` acquisition candidate. | Does not prove Memory Core mutation, crawler readiness, ranking quality, or product readiness. |

## Next Action

Run one bounded follow-up that resolves or rejects the emitted source artifact
acquisition candidate through source/brain search readback. Do not open broader
ingestion or runtime work until that candidate is reviewed.
