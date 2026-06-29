# V323 Graph Brain v0 Bounded Source Entity/Claim Edge Preview

Status: complete.
Date: 2026-06-29

## Executive Verdict

V323 proves the first bounded graph-brain write/readback preview over local
source state. `krn source artifact preview` can now render a reviewable
`SourceClaimEdge` candidate with source ranges and, when explicit governed
fields are supplied, persist and read back a `SourceClaimEdge` row without a
schema change, crawler, graph runtime, UI, API/MCP, worker daemon, consensus
runtime, or Memory Core mutation.

This is not graph retrieval quality. It is the smallest durable graph substrate
proof: local source artifact -> SourceClaim candidate -> SourceClaimEdge
candidate -> optional Postgres readback.

## Source To Decision

Source: `docs/decisions/ADR-0021-temporal-claim-graph.md` and existing
`SourceRepository.createSourceClaimEdge` / `listSourceClaimEdgesForClaim`.

Mechanism: KRN already has governed `source_claim_edges` with edge kind,
consumer, `doesNotProve`, source-decision/evidence refs, and source-range
metadata. A graph-brain preview should reuse this substrate before adding
crawler, graph DB, ranking, or runtime extraction.

KRN implication: local source artifact preview can be the first operator-facing
graph fact intake surface if it produces reviewable edge candidates and only
persists governed rows when the operator supplies complete fields.

Decision: add explicit `--graph-edge-*` inputs to `krn source artifact preview`
and render `sourceClaimEdgeCandidate` with reviewability, evidence refs,
source ranges, edge kind, target claim id, and proof/non-proof boundaries.

Consumer: future graph readback/query surface, graph-aware retrieval,
contradiction/duplicate detection, temporal slices, and consensus candidate
evaluation.

Falsifier: source artifact preview creates graph truth without complete
governed inputs, omits source ranges, mutates Memory Core, or requires schema
expansion before proving bounded readback usefulness.

Does not prove: source truth, claim correctness, graph retrieval quality,
automatic extraction, entity resolution, duplicate/contradiction detection,
temporal reasoning, product readiness, or UI/search readiness.

## Changed

- `packages/cli/src/parseSourceArgs.ts`
  - added explicit `--graph-edge-*` CLI parsing and edge-kind validation.
- `packages/cli/src/runSourceArtifactPreviewCommand.ts`
  - renders `sourceClaimEdgeCandidate`;
  - persists `SourceClaimEdge` only when complete source claim and graph edge
    fields are supplied;
  - reads back the persisted edge through `listSourceClaimEdgesForClaim`;
  - keeps Memory mutation, crawler, embeddings, and graph runtime as `none`.
- `packages/cli/src/databaseRuntime.ts`
  - exposes the existing source edge repository methods to this CLI surface.
- CLI tests
  - cover parsing, invalid edge kind, non-persisted candidate rendering,
    persisted edge readback, and proof output.

No schema or migration was added.

## Live DB Proof

`pnpm db:ready`:

```txt
DB mode: ready
Postgres: reachable
Migrations expected: 14
Migrations applied: 14
pgvector: available
Brain store readiness: ready
```

Persisted KRN plan:

```txt
executionRun: 78fa4bb3-6933-4655-8f44-37529580dd63
taskContract: bdc4a177-e4fa-44f3-b5d7-146f4c62d990
contextAssembly: 1876eed0-be4d-4701-a1b1-fdb219e4e110
```

Evidence/observe/reflect:

```txt
evidenceBundle: 6b10c861-d050-49a3-8ad6-d9bf0312979b
reviewAssessment: ad27acf7-19f4-4b99-b66a-7ccc961996b8
feedbackDelta: 75491c8e-c9b0-4251-a6be-edd5fa43304f
observationGroup: 20712f16-7660-4ff8-808e-0a060bcdbf13
observationItems: 5
reflectionRecord: 4b800784-931a-4acf-ba7c-b403fc4bf122
reflectionFindings: 0
candidateRowsWritten: no
MemoryRecord created: no
```

Live source artifact preview over `docs/decisions/ADR-0021-temporal-claim-graph.md`:

```txt
sourceArtifact: 186e23c7-2a60-4c56-9dc5-1c724d71bcd3
sourceChunks: bf3dad8f-7d68-4bd5-a1ec-cd1efb0beabf
searchDocument: 9845a4dc-9853-40b2-84ae-6976db1174cc
sourceClaim: 578d247c-caa7-4cf2-8b27-0a211a00c778
sourceClaimEdge: 415321b3-4a26-4634-bfbe-38b756777d6a
sourceClaimEdgeKind: narrows
sourceClaimEdgeReadback: hit
target source claim: e3a72d7f-0fbf-4263-a2f8-cf8c93cc9c27
```

The preview output included:

```txt
sourceClaimEdgeCandidate:
  status: candidate
  reviewability: ready
  evidenceRefs:
    docs/decisions/ADR-0021-temporal-claim-graph.md
    sha256:e04a66dd2a18ea8935ba56f31abf76053d189ae15e2dc932c303545de4c9f29d
    docs/decisions/ADR-0021-temporal-claim-graph.md:lines 1-20
    sha256:b133a8edb46bf6731911027671e0fb5e58554589b94a12bae43a40d3bdb1df43
  doesNotProve:
    This edge does not prove temporal truth or graph retrieval quality.
```

Independent SQL readback:

```txt
id: 415321b3-4a26-4634-bfbe-38b756777d6a
from_source_claim_id: 578d247c-caa7-4cf2-8b27-0a211a00c778
to_source_claim_id: e3a72d7f-0fbf-4263-a2f8-cf8c93cc9c27
kind: narrows
consumer: V323 graph brain v0
doesNotProve: This edge does not prove temporal truth or graph retrieval quality.
```

## Verification

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `pnpm --filter @krn/cli test -- parseSourceArgs runSourceArtifactPreviewCommand` | passed | CLI parsing/render/persist tests pass | full product graph quality |
| `pnpm typecheck` | passed | strict TS package compile | runtime source truth |
| `pnpm test` | passed | workspace unit tests pass | product readiness |
| `pnpm db:ready` | passed | local Postgres/pgvector/migrations are ready | CI/remote DB state |
| `krn plan --persist` | passed | current-shell persisted run exists | selected context sufficiency |
| `krn source artifact preview --persist --graph-edge-*` | passed | SourceClaimEdge candidate and row readback work | graph retrieval/ranking |
| `krn evidence capture --persist` | passed | intended-file classification and command/source-usefulness provenance were persisted | source truth or product readiness |
| `krn observe --persist` then `krn reflect --persist` | passed | same-run observe-before-reflect sequence completed without Memory Core mutation | reflection quality |
| `git diff --check` | passed | whitespace diff is clean | behavioral completeness |

## Dogfood Usefulness

Activation selected useful persisted source claims:

```txt
source_claim:b055fffe-de70-49e4-86b0-a806a2f12e86
source_claim:e3a72d7f-0fbf-4263-a2f8-cf8c93cc9c27
source_claim:3afb4c95-eaad-4df1-aa72-e8c739f385dd
```

Those helped frame the implementation as reuse of persisted local source state,
not a new graph runtime. Activation did not directly identify
`runSourceArtifactPreviewCommand.ts`, so owner-file recall is still mixed.

Brain ROI: positive. KRN constrained the slice to bounded graph preview,
preserved proof/non-proof boundaries, and avoided schema/runtime expansion.

## Candidate Outputs

MemoryCandidate:

```txt
claim: Source artifact preview should model graph-brain v0 as reviewable
SourceClaimEdge candidates before graph runtime or extraction work.
evidence: this report; SourceClaimEdge 415321b3-4a26-4634-bfbe-38b756777d6a
doesNotProve: this does not prove graph retrieval quality.
reviewability: ready
decision: review
```

EvalCandidate:

```txt
claim: `krn source artifact preview --graph-edge-* --persist` should render a
ready SourceClaimEdge candidate and read back the persisted edge.
evidence: CLI tests and live DB readback.
doesNotProve: broad graph-brain quality.
reviewability: ready
decision: review
```

## Next Recommended Action

V324 should add the smallest graph edge readback/query surface so operators can
inspect persisted SourceClaimEdges by claim id. Do not jump to graph ranking,
entity extraction, crawler, UI, API/MCP, worker daemon, or consensus runtime.
