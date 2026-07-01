# IMR-43 Source Artifact Preview JSON

Status: complete bounded ingest/reuse source repair.

Issue: `mise-en-palace-87q`.

## Executive Verdict

The Q5 source-backed ingest pattern gate was useful. It pointed to the existing
bounded local ingest/readback path rather than a crawler, ranking rewrite,
schema change, worker, API, MCP, or Memory Core mutation.

Decision: add `--json` to `krn source artifact preview` so future brain,
heartbeat, evidence, and benchmark slices can consume artifact/chunk/candidate
and ingest-loop readback without scraping text output.

## Source To Decision

- Source: IMR-42 Q5 selectedKnowledge packets for ingest v0/source artifact
  reuse.
- Mechanism: the ingest preview already computes the useful artifact, chunk,
  SearchDocument, SourceClaim, SourceClaimEdge, and readback facts, but only
  text output was operator-friendly.
- KRN implication: structured JSON lets the shared brain reuse the ingest
  readback in later pattern gates and benchmark slices.
- Decision: implement `krn source artifact preview --json`.
- Rejection: no crawler, broad ingestion, DB schema, ranking, API/MCP, worker
  daemon, source truth mutation, eval promotion, or Memory Core mutation.
- Consumer: ingest v0/v1 reuse, source/brain readback reports, heartbeat
  acquisition, and future brain benchmark harnesses.
- Falsifier: JSON output diverges from text proof boundaries, omits readback
  statuses, or pushes operators toward mutation before review.

## Changed

- `parseSourceArgs` accepts `--json` for `source artifact preview`.
- `runSourceArtifactPreviewCommand` renders structured
  `krn.sourceArtifactPreview.v1` output.
- Persistence readback is available as structured data when `--persist` is used.
- Text output behavior is preserved.
- Tests cover local JSON preview and persisted JSON readback through fake
  repositories.

## Brain Usefulness

| Area | Verdict | Evidence |
|---|---|---|
| Source-backed pattern gate | useful | Q5 selected ingest/source-artifact packets led to a bounded source improvement. |
| Context noise | harmless | One tail packet was noise, but the first five selected packets were directly useful. |
| Review burden | reduced | JSON avoids text scraping for later brain/heartbeat/evidence consumers. |
| Mutation safety | preserved | Live dogfood used non-persisted JSON; tests cover persisted shape without live source truth mutation. |

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk pnpm db:ready` | passed | Current shell has reachable Postgres, 14/14 migrations, and pgvector. | Does not prove source truth, ranking quality, or product readiness. |
| `rtk pnpm --filter @krn/cli test -- parseSourceArgs runSourceArtifactPreviewCommand` | passed | Parser and source artifact preview behavior are covered. | Does not prove full repo behavior. |
| `rtk pnpm --filter @krn/cli run typecheck` | passed | CLI package type boundaries compile. | Does not prove runtime usefulness. |
| `rtk pnpm quality:fallow:ci` | passed | Changed files have no Fallow complexity, duplication, dead-code, or dependency findings. | Does not prove architecture is complete. |
| `rtk pnpm --silent --filter @krn/cli krn source artifact preview --file PLAN.md --chunk-lines 20 --limit-chunks 1 --json` | passed | JSON output is parseable and exposes local preview mutation boundaries. | Does not prove DB persistence or source truth. |

## Next Action

Use the new JSON output in the next ingest/brain readback slice instead of
adding another output format. If consumers still need text scraping after this,
open a focused consumer repair with the failing readback.
