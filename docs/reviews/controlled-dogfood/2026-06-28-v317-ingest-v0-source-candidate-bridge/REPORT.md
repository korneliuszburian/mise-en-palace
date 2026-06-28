# V317 Ingest v0 Source Candidate Bridge

Status: complete source slice.

Date: 2026-06-28.
DB used: no.
Memory mutation: none.
SourceGraph/SearchDocument persistence: none.
Crawler/API/MCP/worker/schema changes: none.

## Executive Verdict

V317 bridged local source artifact preview into reviewable candidate output.
`krn source artifact preview --file <path>` now renders a `Candidate bridge`
section with a ready `SearchDocument` candidate from artifact/chunk evidence and
an optional `SourceClaim` candidate when the operator supplies explicit
claim/mechanism/implication/proof-boundary fields.

This keeps Ingest v0 candidate-first: the command proposes reviewable source and
search candidates, but does not persist SourceGraph, SearchDocument, embeddings,
graph edges, or Memory Core truth.

## Owner Files Inspected

| File | Why |
|---|---|
| `packages/cli/src/runSourceArtifactPreviewCommand.ts` | Existing local preview owner and smallest bridge surface. |
| `packages/cli/src/parseSourceArgs.ts` | CLI input boundary for optional source-claim candidate fields. |
| `packages/schema/src/sourceClaim.ts` | SourceClaim candidate validation contract. |
| `packages/schema/src/retrieval.ts` | SearchDocument candidate validation contract. |
| `packages/core/src/candidateReviewability.ts` | Shared reviewability labels and reasons. |
| `packages/cli/src/runEvidenceCaptureCommand.ts` | Existing candidate reviewability rendering pattern. |

## Pattern Gate

| Pattern | Use | Outcome |
|---|---|---|
| `pattern:evidence-proof-non-proof-boundary` | Candidate output states what preview evidence proves and does not prove. | helped |
| `pattern:source-to-decision-retention-gate` | SourceClaim candidate requires explicit mechanism, implication, consumer, falsifier, and does-not-prove. | helped |
| `pattern:ts-boundary-unknown-first-result-state` | CLI/file/candidate input is narrowed through parser plus Zod schema parsers. | helped |

## Source-To-Decision

- Source: V316 report, existing local artifact preview, `SourceClaimInputSchema`,
  `SearchDocumentInputSchema`, and shared candidate reviewability helper.
- Mechanism: preview evidence can be converted into candidate-shaped,
  reviewable source/search output without claiming truth or writing DB state.
- KRN implication: Ingest v0 can progress from file/chunk readback to candidate
  review before persistence, embeddings, graph runtime, or crawler work.
- Decision: adopt candidate bridge in `krn source artifact preview`.
- Rejection: do not infer SourceClaim truth from file content; require explicit
  operator claim fields. Do not persist in this slice.
- Consumer: V318 Ingest v0 SearchDocument Persistence Readback.
- Falsifier: candidate bridge cannot feed existing SourceArtifact/SourceChunk/
  SearchDocument persistence without broad schema/runtime work.

## Implemented Behavior

Default preview now emits:

```txt
Candidate bridge:
searchDocumentCandidate:
  reviewability: ready
  No SearchDocument row created
sourceClaimCandidate:
  not generated
  No SourceClaim created
```

With explicit claim fields:

```sh
krn source artifact preview \
  --file docs/KRN_KERNEL.md \
  --claim "..." \
  --mechanism "..." \
  --krn-implication "..." \
  --does-not-prove "..." \
  --support-type implementation-boundary \
  --trust-tier source-code \
  --consumer "ingest v0" \
  --falsifier "..."
```

the command validates and renders a proposed SourceClaim candidate with
reviewability reasons. Incomplete source-claim inputs render as
`needs_more_evidence` with missing fields.

## Verification

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk pnpm --filter @krn/cli test -- parseSourceArgs runSourceArtifactPreviewCommand` | passed | Parser and preview/candidate bridge tests pass. | Does not prove full workspace behavior. |
| `rtk pnpm --filter @krn/cli krn source artifact preview --file docs/KRN_KERNEL.md --chunk-lines 8 --limit-chunks 1 --claim "..." --mechanism "..." --krn-implication "..." --does-not-prove "..." --support-type implementation-boundary --trust-tier source-code --consumer "ingest v0" --falsifier "..."` | passed | CLI renders SearchDocument and SourceClaim candidates from local preview evidence. | Does not prove source truth, DB persistence, embeddings, graph retrieval, or crawler readiness. |
| `rtk pnpm --filter @krn/harness test -- activePlanInvariants contextHygieneInvariants` | passed | Compact root state remains internally consistent after activating V318. | Does not prove V318 implementation. |
| `rtk pnpm run typecheck` | passed | TypeScript strict boundaries compile across workspace. | Does not prove runtime product value. |
| `rtk env TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | Workspace tests pass with TMPDIR outside repo. | Does not prove DB runtime truth or product readiness. |
| `rtk git diff --check` | passed | Diff has no whitespace errors. | Does not prove behavior beyond formatting. |

## Proof Boundaries

What this proves:

- local artifact preview can produce reviewable SearchDocument candidate output;
- explicit operator claim inputs can produce reviewable SourceClaim candidate
  output;
- incomplete claim inputs remain visible as missing-evidence candidate output;
- no source/search rows are created.

What this does not prove:

- source truth;
- claim correctness;
- DB persistence;
- source crawler readiness;
- embeddings/ranking;
- graph retrieval;
- product readiness;
- mass corpus ingest.

## Next Action

Move to:

```txt
V318 Ingest v0 SearchDocument Persistence Readback
```

Goal: persist and read back one explicit local artifact preview through existing
SourceArtifact/SourceChunk/SearchDocument repository paths if current DB
substrate supports it, without schema migration, crawler, embeddings, graph
runtime, API/MCP, dashboard, worker daemon, or Memory Core mutation.
