# V316 Ingest v0 Local Source Artifact Preview

Status: complete source slice.

Date: 2026-06-28.
DB used: no.
Memory mutation: none.
Crawler/API/MCP/worker/schema changes: none.

## Executive Verdict

V316 implemented the first local Ingest v0 preview path. `krn source artifact
preview --file <path>` reads one explicit local file, computes a stable artifact
hash, renders deterministic line-based chunk previews, and records source line
ranges with proof/non-proof boundaries. This is not crawler ingest, DB
persistence, embedding, graph retrieval, or source truth.

## Owner Files Inspected

| File | Why |
|---|---|
| `packages/cli/src/parseSourceArgs.ts` | Existing `krn source` command parser and best owner for source preview input. |
| `packages/cli/src/runSourceClaimAddCommand.ts` | Existing no-store source artifact/claim preview and hash behavior. |
| `packages/cli/src/runCli.ts` | CLI routing and help behavior. |
| `packages/cli/src/cliFileBoundary.ts` | Existing repo-root fallback pattern for explicit file inputs. |
| `packages/schema/src/sourceClaim.ts` | Existing SourceArtifact input schema discovered by targeted search. |
| `packages/schema/src/retrieval.ts` | Existing SearchDocument schema discovered by targeted search. |

## Pattern Gate

| Pattern | Use | Outcome |
|---|---|---|
| `pattern:active-context-compact-current-truth` | Kept V316 anchored to root `GOAL.md`, `PLAN.md`, and `PLANS.md`. | helped |
| `pattern:evidence-proof-non-proof-boundary` | Forced preview output to state what local file readback proves and does not prove. | helped |
| `pattern:ts-boundary-unknown-first-result-state` | Kept CLI/file input validation at the parser/runner boundary. | helped |

Initial broad catalog query returned no matches; narrower `proof`, `current
truth`, and `unknown` queries returned the applied patterns. This does not prove
search ranking quality.

## Source-To-Decision

- Source: V315 report, compact root state, existing `krn source claim add`
  no-store preview, and `knowledge cards` file resolution pattern.
- Mechanism: local explicit files can be previewed deterministically with
  content hash and source ranges before any crawler, DB schema, embedding, or
  graph work.
- KRN implication: Ingest v0 can start as a read-only CLI boundary that produces
  reviewable source artifact/chunk evidence.
- Decision: adopt `krn source artifact preview` as the smallest local source
  artifact preview path.
- Rejection: do not build source crawler, DB schema migration, embedding
  runtime, graph runtime, API/MCP, dashboard, worker daemon, or Memory Core
  mutation in this slice.
- Consumer: future source grounding, source claim/search document candidate
  bridge, graph brain v0, and product-facing knowledge ingestion.
- Falsifier: the preview cannot support a next bounded candidate/search-document
  bridge without broad runtime/schema work.

## Implemented Behavior

Command:

```sh
krn source artifact preview --file <path> [--chunk-lines <n>] [--limit-chunks <n>]
```

Behavior:

- reads exactly one explicit local file;
- resolves cwd-relative paths first, then repo-root-relative paths;
- computes artifact `sha256` from current file bytes;
- renders line-based chunks with source ranges;
- computes per-chunk `sha256`;
- prints proof and `doesNotProve` boundaries;
- persists nothing.

## Verification

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk pnpm --filter @krn/cli test -- parseSourceArgs runSourceArtifactPreviewCommand` | passed | Parser and preview runner focused tests pass. | Does not prove full workspace behavior. |
| `rtk pnpm run typecheck` | passed | TypeScript strict boundaries compile across workspace. | Does not prove runtime product value. |
| `rtk pnpm --filter @krn/cli krn source artifact preview --file docs/KRN_KERNEL.md --chunk-lines 8 --limit-chunks 2` | passed | CLI can preview a root-relative local source artifact through package script. | Does not prove source truth, persistence, embeddings, graph retrieval, or crawler readiness. |
| `rtk pnpm --filter @krn/harness test -- activePlanInvariants` | passed | Compact root state remains internally consistent after activating V317. | Does not prove V317 implementation. |
| `rtk env TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | Workspace tests pass with TMPDIR outside repo. | Does not prove product readiness or DB runtime truth. |
| `rtk git diff --check` | passed | Diff has no whitespace errors. | Does not prove behavior correctness beyond formatting. |

## Proof Boundaries

What this proves:

- KRN now has a bounded local source artifact preview path.
- Preview output contains content hash, chunk hashes, and source line ranges.
- The path is read-only and does not require DB/schema/runtime expansion.

What this does not prove:

- source truth;
- claim correctness;
- source crawler readiness;
- DB persistence;
- embeddings/ranking;
- graph retrieval;
- product readiness;
- mass corpus ingest.

## Next Action

Move to:

```txt
V317 Ingest v0 Source Candidate Bridge
```

Goal: use the preview output to produce or scope the smallest reviewable
SourceClaim/SearchDocument candidate bridge without source crawler, DB schema,
embeddings, graph runtime, or Memory Core mutation.
