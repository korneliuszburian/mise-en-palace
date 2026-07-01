# IMR-30 AMA Source Evidence Reuse Check

Status: complete.

Issue: `mise-en-palace-zwu`.

## Executive Verdict

The persisted AMA paper source evidence is reusable enough for the current KRN
brain loop. No source-search, brain-search, or heartbeat readback repair is
needed now.

Source search selects the new AMA SourceClaim as the top natural-query claim.
The AMA SearchDocument is retrievable by the artifact marker query and visible
as linked document evidence for the natural query. Brain search preserves the
missing-document caveat and linked-document counts. Heartbeat preview turns that
brain-search missing-evidence readback into one ready, mutation-free acquisition
candidate with linked-document-first escalation.

Decision: accept the current linked-evidence behavior. The next product step is
not readback repair; it is an AMA activation-utility lab-test.

## Scope

Inspected:

- current root active state and Beads issue;
- IMR-29 report and persisted IDs;
- DB-backed source-search marker and natural query readback;
- DB-backed brain-search natural query readback;
- heartbeat acquisition preview over the natural brain-search readback.

Changed:

- this report;
- compact root plan/ledger state;
- Beads task graph.

No package source, DB schema, crawler, worker daemon, API/MCP, ranking,
source truth, autonomous acquisition, eval candidate, or Memory Core state
changed.

## Source-To-Decision

- Source: IMR-29 AMA SourceArtifact/SearchDocument/SourceClaim/SourceDecisionEdge
  readback, IMR-30 source/brain/heartbeat reuse readback.
- Mechanism: candidate-only acquisition should reuse newly persisted source
  evidence before opening repairs or higher-cost acquisition.
- KRN implication: if natural source search selects the AMA claim and heartbeat
  can produce a ready linked-evidence candidate, missing natural SearchDocument
  inclusion is not itself a repair trigger.
- Decision: accept current linked-evidence behavior; proceed to activation
  utility lab-test.
- Rejection: no ranking rewrite, readback repair, crawler, worker daemon,
  API/MCP, DB schema, source truth mutation, broad benchmark, or Memory Core
  mutation from this slice.
- Consumer: heartbeat acquisition lane and future AMA activation-utility
  hypothesis.
- Falsifier: a future run cannot reuse the AMA SourceClaim, linked document
  evidence disappears from source/brain/heartbeat readback, or heartbeat opens
  higher-cost acquisition before linked-document/source-search review.

## Reuse Readback

Raw artifacts:

```txt
/tmp/krn-imr-30-ama-reuse-check/source-marker.json
/tmp/krn-imr-30-ama-reuse-check/source-natural.json
/tmp/krn-imr-30-ama-reuse-check/brain-natural.json
/tmp/krn-imr-30-ama-reuse-check/heartbeat-natural.json
/tmp/krn-imr-30-ama-reuse-check/reuse-summary.json
```

Tracked AMA evidence:

```txt
SourceClaim: ea770eea-47c1-47c5-90ab-7bcd1a4bff3f
SearchDocument: 9853097e-f496-4d5f-ba62-29ea8bca8288
```

| Surface | Reuse result | Classification |
|---|---|---|
| source search marker query | `supportingDocuments: 1`, includes AMA SearchDocument | helped |
| source search natural query | AMA SourceClaim selected as rank 0; AMA SearchDocument linked but not included | helped with caveat |
| brain search natural query | preserves `sourceClaimDocumentLinks: 8`, `linkedSearchDocuments: 8`, and missing-document caveat | helped |
| heartbeat acquisition preview | one ready `knowledge_acquisition_candidate`, mutation none, linked-document-first escalation | helped |

Natural AMA query:

```txt
Towards Autonomous Memory Agents cost-aware knowledge-extraction cascade semantic-aware Thompson sampling
```

Source-search natural result:

```txt
answerUsefulness: partly_useful_missing_document
supportingClaims: 8
supportingDocuments: 0
sourceClaimDocumentLinks: 8
linkedSearchDocuments: 8
includesAmaClaim: true
amaClaimRank: 0
includesAmaDoc: false
amaDocLinked: true
```

Heartbeat result:

```txt
candidateCount: 1
candidateKind: knowledge_acquisition
reviewability: ready
mutation: none
linkedDocumentEvidence:
  sourceClaimDocumentLinks: 8
  linkedSearchDocuments: 8
forbiddenWrites:
  memory_records
  anti_memory_records
  source_claims
  source_decisions
  source_claim_edges
  eval_candidates
  worker_jobs
```

## Decision

Accept current linked-evidence behavior.

Rationale:

- the AMA SourceClaim is directly selected by natural source search;
- the AMA SearchDocument is retrievable by marker query;
- the natural query exposes linked document evidence even without document
  inclusion;
- heartbeat routes the unresolved document gap into candidate-only acquisition
  with linked-document review first;
- repairing ranking/readback now would be premature without a failing user-facing
  loop.

Next step:

```txt
mise-en-palace-1dh: Run AMA activation-utility lab-test.
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `rtk bd show mise-en-palace-zwu` | passed | Active issue and acceptance were inspected. | Does not prove reuse. |
| `rtk pnpm db:ready` | passed | Current-shell Postgres is reachable, migrations are applied, and pgvector is available. | Does not prove remote DB or product readiness. |
| marker `krn source search --json` | passed | The AMA SearchDocument is retrievable by artifact marker query. | Does not prove natural query document inclusion. |
| natural `krn source search --json` | passed | The AMA SourceClaim is selected as rank 0 and linked document evidence is visible. | Does not include the AMA SearchDocument as a supporting document. |
| natural `krn brain search --json` | passed | Brain search preserves source-search linked-document counts and missing evidence. | Does not expose individual SourceClaim/SearchDocument IDs in the summary. |
| `krn heartbeat preview --candidate-kind knowledge_acquisition --acquisition-readback-file ... --json` | passed | Heartbeat creates a ready mutation-free acquisition candidate from the natural brain-search readback. | Does not prove source truth, autonomous acquisition, Memory Core usefulness, or product readiness. |
| local JSON summarizer | rerun passed | The raw JSON evidence was summarized with correct nested heartbeat shape. | Does not prove runtime behavior beyond the raw command output. |

## Proof Boundary

Proves:

- AMA source evidence is reused by source-search natural query;
- AMA source evidence is available as linked evidence to brain search and
  heartbeat acquisition preview;
- heartbeat preserves candidate-only mutation boundaries;
- no readback/ranking repair is justified by this slice.

Does not prove:

- paper correctness;
- benchmark transfer;
- source truth;
- ranking quality;
- product readiness;
- autonomous acquisition safety;
- Memory Core usefulness;
- activation utility improvement.
