# IMR-38 Activation Utility Source/Eval Follow-Up Evidence

Status: complete.

Issue: `mise-en-palace-bep`

## Executive Verdict

The accepted IMR-37 activation utility candidate was retained as bounded
source/eval follow-up evidence through existing source artifact, source claim,
and source decision edge paths. This makes the review result queryable and
replayable without creating source truth, promoting an eval candidate, changing
ranking, changing schema, or mutating Memory Core.

## Scope

Input candidate:

```txt
knowledge-acquisition-heartbeat:readback-brain-search-towards-autonomous-memory-agents-cost-aware-knowledge-extraction-cascade:missing_evidence
```

Decision:

```txt
accept_for_manual_followup
```

Artifacts:

```txt
docs/reviews/controlled-dogfood/2026-07-01-imr-38-activation-utility-source-eval-follow-up/SOURCE.md
```

Non-goals:

- no ranking rewrite;
- no semantic model;
- no crawler;
- no worker daemon;
- no API/MCP;
- no DB schema;
- no source truth mutation;
- no eval candidate promotion;
- no Memory Core mutation.

## Source To Decision

Source:
IMR-37 candidate review report, the IMR-38 `SOURCE.md`, and existing source
artifact/source decision link CLI surfaces.

Mechanism:
The accepted heartbeat candidate review is represented as a proposed
SourceClaim, then linked to an `eval_candidate` follow-up target through a
SourceDecisionEdge.

KRN implication:
KRN can carry accepted manual review into source/eval follow-up evidence before
ranking, runtime, source truth, or Memory Core work.

Decision:
Use the existing SourceArtifact/SearchDocument/SourceClaim/SourceDecisionEdge
path for this follow-up. Reject a new eval-candidate CLI, DB schema, runtime
lane, ranking repair, or Memory Core mutation in this slice.

Consumer:
Future activation utility eval/source follow-up and brain/source search
readback.

Falsifier:
This result is invalid if the persisted SourceClaim or SourceDecisionEdge cannot
be read back, if the marker source-search query misses the artifact, or if a
future step treats this follow-up evidence as source truth or eval promotion.

Does not prove:
source truth, eval candidate row existence, eval promotion, ranking quality,
semantic-aware Thompson sampling, autonomous acquisition, product readiness, or
Memory Core mutation safety.

## Persistence Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk pnpm db:ready` | passed | current shell can reach local Postgres; migrations and pgvector are ready | CI DB state, product readiness |
| `krn source artifact preview --persist ...` | passed | SourceArtifact, SourceChunk, SearchDocument, and proposed SourceClaim were written and read back | source truth, embeddings, graph retrieval quality, crawler readiness |
| `krn source decision link --persist ...` | passed | SourceDecisionEdge linked the SourceClaim to an `eval_candidate` follow-up target | eval candidate row existence, decision correctness, source truth |
| `krn source search --query "krn-source-artifact-preview a2d428319fa405c3" --json` | passed | marker query can retrieve this persisted follow-up evidence | natural-query recall, ranking quality |

Persisted IDs:

```txt
sourceArtifact: 240a4700-053b-494d-ab59-d4361098cf31
sourceChunks:
  - 15bee444-7548-498c-9221-9bde1def7b88
  - ba2c40d7-4c79-4969-9450-70192a018da5
searchDocument: ec52d802-bbf4-4b04-8737-28e6707c279d
sourceClaim: 190f1f72-4621-49b4-b93c-538ea2c581ef
sourceDecisionEdge: 73e266bb-e957-4a07-aa62-fe74cb7178a0
eval target: eval_candidate/activation-utility-source-eval-follow-up-imr-38
lexical marker: krn-source-artifact-preview a2d428319fa405c3
```

Marker source-search readback:

```txt
query: krn-source-artifact-preview a2d428319fa405c3
supportingClaims: 4
supportingDocuments: 1
missingEvidence: []
mutation: none
```

## Candidate Review Boundary

The original candidate remains a candidate/follow-up signal. This slice did not
promote it, accept it as source truth, or add a standalone EvalCandidate row.
The current governed route is:

```txt
accepted candidate review
-> SOURCE.md evidence packet
-> SourceArtifact/SearchDocument
-> proposed SourceClaim
-> SourceDecisionEdge to eval_candidate follow-up target
-> future brain/source search replay
```

Standalone eval candidate persistence was not added because no governed CLI path
for creating eval candidate rows exists in the inspected source surface. The
`eval_candidate` target is a follow-up target id, not proof that an EvalCandidate
row exists.

## What Improved

- Accepted activation utility review is now store-backed and replayable.
- The follow-up evidence has a source claim, decision edge, falsifier, and
  does-not-prove boundary.
- The route stayed inside existing source/eval evidence paths.
- Mutation remained `none`.

## What This Does Not Prove

- Product readiness.
- Source truth.
- Eval candidate promotion.
- Activation ranking quality.
- Semantic-aware Thompson sampling.
- Autonomous acquisition.
- Worker daemon readiness.
- Memory Core mutation safety.

## Next Action

Replay the retained activation utility follow-up through `krn brain search` and
classify whether the retained source/eval evidence is selected, used, helped,
missing, or noisy.

Beads issue:

```txt
mise-en-palace-9ei: Replay retained activation utility follow-up evidence through brain search
```
