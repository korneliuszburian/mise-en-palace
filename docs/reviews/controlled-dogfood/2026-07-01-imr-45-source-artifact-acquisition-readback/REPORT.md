# IMR-45 Source Artifact Acquisition Readback

Status: complete bounded source/brain readback closure.

Issue: `mise-en-palace-mnj`.

## Executive Verdict

The IMR-44 `source_artifact_preview` acquisition candidate is resolved.

Initial persistence failed because the CLI database runtime did not expose the
already-existing `createSourceChunk` repository method. The fix was one bounded
adapter delegation. After that, `krn source artifact preview --persist --json`
persisted a SourceArtifact, one SourceChunk, and a SearchDocument; source-search
readback for the generated marker returned `answerUsefulness: useful` and
`missingEvidence: []`; heartbeat preview no longer emitted the acquisition
candidate.

## Source To Decision

- Source: IMR-44 heartbeat candidate for `source_artifact_preview` requested
  persisted source/search readback for `PLAN.md`.
- Mechanism: `runSourceArtifactPreviewCommand` requires
  `databaseRuntime.sourceRepository.createSourceChunk` before it can persist the
  artifact-to-chunk-to-SearchDocument loop.
- KRN implication: ingest v0 cannot prove a reusable persisted readback loop if
  the CLI runtime adapter hides SourceChunk persistence.
- Decision: expose `createSourceChunk` through the CLI `DatabaseRuntime`
  adapter and rerun the bounded persisted source/brain readback.
- Rejection: no crawler, broad ingestion, ranking rewrite, DB schema, worker
  daemon, API/MCP, source truth mutation, eval promotion, or Memory Core
  mutation.
- Consumer: `krn source artifact preview --persist --json`,
  `krn source search --json`, `krn brain search --json`, and heartbeat
  acquisition readback.
- Falsifier: persisted preview still fails, source-search cannot find the
  generated SearchDocument marker, or heartbeat still emits the same missing
  readback candidate from persisted JSON.

## Changed

- `packages/cli/src/databaseRuntime.ts` now delegates
  `sourceRepository.createSourceChunk`.
- `packages/cli/src/databaseRuntime.test.ts` guards that the CLI runtime exposes
  SourceChunk persistence.

## Readback Result

| Step | Result | Evidence |
|---|---|---|
| Persist preview without DB URL | rejected | CLI required `KRN_DATABASE_URL`. |
| Persist preview before adapter fix | failed | `SourceChunk persistence is unavailable in this database runtime`. |
| Persist preview after adapter fix | resolved | JSON readback had SourceArtifact, SourceChunk, SearchDocument, `lexicalReadback: hit`, and ingest-loop `ready` statuses. |
| Heartbeat over persisted JSON | resolved | `knowledgeAcquisition: 0`, no candidate emitted. |
| Source search by generated marker | resolved | `answerUsefulness: useful`, `supportingDocuments: 1`, `missingEvidence: []`. |
| Brain search by generated marker | useful | Store-only brain search selected source-backed ingest/source-artifact knowledge and sourceSearch evidence. |

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk pnpm db:ready` | passed | Current shell DB is reachable, migrations are applied, pgvector available. | Does not prove source truth or product readiness. |
| `rtk env KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --silent --filter @krn/cli krn source artifact preview --file PLAN.md --chunk-lines 20 --limit-chunks 1 --persist --json` | passed after adapter fix | The bounded artifact/chunk/SearchDocument persistence path works in current shell. | Does not prove crawler readiness, embeddings, graph retrieval, source truth, or Memory Core mutation. |
| `rtk env KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --silent --filter @krn/cli krn heartbeat preview --candidate-kind knowledge_acquisition --acquisition-readback-file /tmp/krn-imr45-source-artifact-persisted.json --max-candidates 1 --json` | passed | Persisted source artifact preview JSON no longer produces a missing-evidence acquisition candidate. | Does not prove autonomous heartbeat/dreaming runtime. |
| `rtk env KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --silent --filter @krn/cli krn source search --query "krn-source-artifact-preview 8f1977f71ae27d1c" --limit 10 --max-inclusions 5 --json` | passed | Source search can read back the generated SearchDocument marker with `missingEvidence: []`. | Does not prove ranking quality beyond this marker query. |
| `rtk env KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --silent --filter @krn/cli krn brain search --query "krn-source-artifact-preview 8f1977f71ae27d1c" --store-only --limit 10 --max-inclusions 5 --json` | passed | Brain search composes source-backed selected knowledge and sourceSearch evidence for the persisted marker query. | Does not prove broad product usefulness. |
| `rtk pnpm --filter @krn/cli test -- databaseRuntime runSourceArtifactPreviewCommand` | passed | Adapter regression and source artifact preview behavior are covered. | Does not prove full workspace behavior. |
| `rtk pnpm --filter @krn/cli run typecheck` | passed | CLI package type boundaries compile after exposing `createSourceChunk`. | Does not prove runtime usefulness. |
| `rtk pnpm quality:fallow:ci` | passed | Changed files have no Fallow complexity, duplication, dead-code, or dependency findings. | Does not prove whole-repo quality. |
| `rtk proxy pnpm typecheck` | passed | Full workspace TypeScript typecheck passes. | Does not prove product readiness. |
| `rtk env TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | initially failed, then passed | First run caught `PLAN.md` context budget at 171 lines; after condensing to 169 lines, full workspace tests passed. | Does not prove source truth or broad product readiness. |
| `rtk git diff --check` | passed | Diff has no whitespace errors. | Does not prove behavior. |

## Brain Usefulness

| Area | Verdict | Evidence |
|---|---|---|
| Ingest v0/v1 | helped | The candidate forced the missing runtime adapter to surface and got a persisted readback loop working. |
| Heartbeat/dreaming | helped | The candidate disappeared after persisted readback became ready. |
| Source/brain search | helped | Source search found one SearchDocument and no missing evidence for the generated marker. |
| Review burden | reduced | The outcome is now inspectable as JSON/readback instead of ambiguous candidate pressure. |

## Next Action

Run the same source artifact persisted readback against one non-`mise-en-palace`
internal repo/file in read-only target mode, with all writes limited to the KRN
brain store and report artifacts. This tests whether the shared brain kernel can
ingest/read back evidence from a second real repo without modifying that repo.
