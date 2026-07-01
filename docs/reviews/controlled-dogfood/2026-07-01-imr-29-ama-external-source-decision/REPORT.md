# IMR-29 AMA External Source-Decision Readback

Status: complete.

Issue: `mise-en-palace-urp`.

## Executive Verdict

The bounded external source-decision/readback succeeded through existing KRN
source paths.

KRN persisted a local AMA paper source artifact, SearchDocument, SourceClaim,
and SourceDecisionEdge without adding crawler, worker runtime, API/MCP, DB
schema, ranking rewrite, source truth mutation, or Memory Core mutation.

Natural AMA queries now select the new paper SourceClaim as direct source
evidence. They still do not include the linked SearchDocument as an included
document for the natural query, so the next slice should measure reuse through
source/brain/heartbeat readback before changing ranking.

## Scope

Inspected:

- current root active state and Beads issue;
- `docs/runbooks/pattern-intake.md`;
- `krn source artifact preview` and `krn source decision link` help;
- arXiv metadata for `2602.22406`;
- live current-shell DB-backed source artifact, source-search, and brain-search
  readback.

Changed:

- bounded AMA `SOURCE.md`;
- this report;
- compact root plan/ledger state;
- Beads task graph.

No package source, DB schema, crawler, worker daemon, API/MCP, ranking,
source truth, eval candidate, autonomous acquisition, or Memory Core state
changed.

## Source-To-Decision

- Source: arXiv `2602.22406`, `Towards Autonomous Memory Agents`.
- Trust tier: paper.
- Source class: papers.
- Mechanism: U-Mem proposes active memory acquisition through a cost-aware
  escalation cascade and semantic-aware Thompson sampling for memory
  exploration/exploitation.
- KRN implication: KRN should lab-test missing-evidence acquisition as
  candidate-only work and future activation-utility hypotheses, while preserving
  review gates and mutation boundaries.
- Decision kind: lab_test.
- Decision: persist one bounded local source artifact and source claim through
  existing KRN source paths; do not adopt autonomous acquisition or ranking
  changes from the paper alone.
- Consumer: pattern/research brain, heartbeat acquisition lane, and future
  activation utility/eval hypotheses.
- Falsifier: future KRN acquisition runs cannot produce or reuse reviewable
  source evidence through existing source artifact/search paths, or they bypass
  review gates and mutate durable memory.
- Does not prove: paper correctness, benchmark transfer to KRN, source truth,
  source-search ranking quality, autonomous acquisition safety, Memory Core
  mutation safety, or product readiness.

## Persisted Evidence

Created source artifact:

```txt
docs/reviews/controlled-dogfood/2026-07-01-imr-29-ama-external-source-decision/SOURCE.md
```

Persistence readback:

```txt
sourceArtifact: 5794d866-bfee-46a3-8a10-ebeeb5bc1385
sourceChunks:
  834aba05-9b1c-4e55-bdcf-61e110ec4229
  f0cc6806-dbd2-4d7f-9ebc-ab16bb7f8c27
searchDocument: 9853097e-f496-4d5f-ba62-29ea8bca8288
sourceClaim: ea770eea-47c1-47c5-90ab-7bcd1a4bff3f
sourceDecisionEdge: ec13908d-2da5-445d-a638-192765a9ac09
lexicalReadbackQuery: krn-source-artifact-preview 328e164c8002a596
```

Persisted SourceClaim:

```txt
Autonomous Memory Agents propose active memory acquisition via a cost-aware
knowledge-extraction cascade and semantic-aware Thompson sampling rather than
passive-only memory growth.
```

SourceDecisionEdge target:

```txt
architecture_decision/IMR-29-AMA-external-source-decision-readback
```

## Readback Result

Marker query:

```txt
krn-source-artifact-preview 328e164c8002a596
```

Result:

```txt
source-search usefulness: useful
supportingClaims: 7
supportingDocuments: 1
includesAmaDoc: true
missingEvidence: none
```

Natural AMA query:

```txt
Towards Autonomous Memory Agents cost-aware knowledge-extraction cascade semantic-aware Thompson sampling
```

Result:

```txt
source-search usefulness: partly_useful_missing_document
supportingClaims: 8
supportingDocuments: 0
includesAmaClaim: true
includesAmaDoc: false
topClaim: ea770eea-47c1-47c5-90ab-7bcd1a4bff3f
missingEvidence: included SearchDocument evidence for this combined query
```

Brain-search summary for the natural AMA query preserved source-search caveats:

```txt
answerUsefulness: partly_useful_missing_document
supportingClaims: 8
supportingDocuments: 0
sourceClaimDocumentLinks: 8
linkedSearchDocuments: 8
```

## Decision

Existing source artifact/source-search paths can carry the AMA paper mechanism.

The direct AMA SourceClaim is now store-backed and selected by natural
source-search queries. The linked SearchDocument is store-backed and retrievable
by marker query, but not included by natural AMA document retrieval.

Next step:

```txt
mise-en-palace-zwu: Run AMA source evidence reuse check.
```

That next slice should decide whether the natural-query missing-document
behavior is acceptable linked-evidence behavior or a bounded readback repair.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `rtk bd show mise-en-palace-urp` | passed | Active issue and acceptance were inspected. | Does not prove implementation. |
| `rtk curl -L https://arxiv.org/abs/2602.22406` | passed | arXiv metadata was reachable in the current shell. | Does not prove paper claims or benchmark transfer. |
| `rtk pnpm db:ready` | passed | Current-shell Postgres is reachable, migrations are applied, and pgvector is available. | Does not prove remote DB or product readiness. |
| `krn source artifact preview --persist` | passed | Existing source artifact path persisted and read back SourceArtifact, SourceChunk, SearchDocument, and SourceClaim rows. | Does not prove source truth, embeddings, graph retrieval, crawler readiness, or Memory Core mutation. |
| `krn source decision link --persist` | passed | Existing source decision edge path linked the AMA SourceClaim to the IMR-29 architecture decision target. | Does not prove decision correctness or graph retrieval quality. |
| marker `krn source search --json` | passed | The persisted SearchDocument is retrievable by artifact marker query. | Does not prove natural query recall. |
| natural AMA `krn source search --json` | passed | The new AMA SourceClaim is selected by natural AMA query. | Does not include the SearchDocument as supporting document and does not prove ranking quality. |
| natural AMA `krn brain search --json` | passed | Brain search surfaces the source-search caveat and linked-document counts. | Does not prove source truth, semantic ranking, product readiness, or Memory Core mutation. |

## Proof Boundary

Proves:

- bounded external source-decision/readback can use current KRN source paths;
- AMA paper mechanism can be represented as a reviewable store-backed
  SourceClaim;
- KRN preserved mutation boundaries while ingesting source evidence;
- natural source search now selects the AMA SourceClaim.

Does not prove:

- paper correctness;
- benchmark transfer;
- product readiness;
- autonomous acquisition safety;
- retrieval ranking quality;
- natural SearchDocument inclusion;
- Memory Core usefulness.
