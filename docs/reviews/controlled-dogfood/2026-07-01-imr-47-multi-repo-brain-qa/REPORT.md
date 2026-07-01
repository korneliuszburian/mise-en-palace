# IMR-47 Multi-Repo Brain-QA Batch

Status: complete compact multi-repo readback batch.

Issue: `mise-en-palace-5vc`.

## Executive Verdict

The shared KRN brain can answer a compact two-question batch across the KRN repo
and a second internal repo without new crawler, ranking, schema, worker,
API/MCP, target writes, source truth mutation, eval promotion, or Memory Core
mutation.

Verdict: useful but mixed.

The KRN ingest/readback question selected strong governed source-backed
knowledge, but source search still marked included SearchDocument evidence
missing while linked SearchDocuments were visible. The `krn-ekologus` question
returned useful source evidence, one supporting SearchDocument, and no missing
evidence, but selectedKnowledge contained mostly KRN guardrail/pattern packets
instead of target-specific repo knowledge. This is a multi-repo precision/context
waste signal, not a broad ranking mandate.

## Scope

```txt
mode: readback-only
questions: 2
repos covered: mise-en-palace, krn-ekologus
db: current-shell Postgres
target writes: none
mutation: none
```

Questions:

| ID | Question | Expected evidence class |
|---|---|---|
| Q1 | `source artifact persisted readback SourceArtifact SourceChunk SearchDocument` | KRN ingest/source artifact pattern evidence |
| Q2 | `EKOLOGUS Brain quality gate` | second-repo source artifact/SearchDocument evidence |

## Source To Decision

- Source: IMR-46 proved a second internal repo README can be persisted/read back
  through the existing source artifact path.
- Mechanism: a compact batch of source/brain search JSON readbacks can classify
  whether the shared store returns useful evidence across more than one repo.
- KRN implication: before crawler, ranking, API/MCP, worker, schema, or UI work,
  KRN needs a small repeatable multi-repo QA readback that exposes recall,
  precision, context waste, and source-backed selected knowledge.
- Decision: accept this batch as the next shared-brain usefulness proof.
- Rejection: do not infer product readiness, ranking quality, semantic
  retrieval quality, or source truth from two questions.
- Consumer: next multi-repo source-backed selected-knowledge repair or benchmark
  expansion.
- Falsifier: source/brain search cannot return evidence for either repo, or the
  batch requires target repo writes/new product surfaces.

## Results

| Q | Source search | Brain search | Recall | Precision / context waste | Verdict |
|---|---|---|---|---|---|
| Q1 | `partly_useful_missing_document`; 5 supporting claims, 0 included docs, 5 linked docs, missing included SearchDocument evidence. | 5 selectedKnowledge packets, all ready, activation utility says selected knowledge sufficient. | good for governed pattern recall | mixed: useful claim packets, but document inclusion still missing | useful with evidence caveat |
| Q2 | `useful`; 4 supporting claims, 1 supporting document, 4 linked docs, no missing evidence. | 4 selectedKnowledge packets, source search useful, activation utility says selected knowledge sufficient. | good for source/readback | mixed: selectedKnowledge is mostly generic KRN graph/pattern/ingest guidance, not target-specific repo knowledge | useful source recall, selectedKnowledge needs precision watch |

## Classification

| Area | Classification | Evidence | Next implication |
|---|---|---|---|
| Multi-repo source recall | helped | Q2 returned one supporting SearchDocument and no missing evidence. | Keep bounded source artifact path. |
| KRN pattern recall | helped | Q1 selected five ready source-backed packets about bounded ingest/source artifact readback. | Keep source-backed selectedKnowledge behavior. |
| Document inclusion | mixed | Q1 exposed 5 linked docs but 0 included docs and missing included SearchDocument evidence. | Watch before repair; this may be query-shape specific. |
| Target-repo selectedKnowledge precision | mixed / noisy | Q2 selected general KRN graph/pattern/ingest packets for an `EKOLOGUS` query. | Next repair should classify target-specific vs generic selectedKnowledge before ranking rewrite. |
| Context waste | low to medium | Batch stayed to 4-5 selected packets, but Q2 includes generic KRN packets. | Measure on the next batch before changing scoring. |
| Mutation safety | good | Commands were readback-only; no Memory Core/source truth/eval promotion. | Keep candidate-only/readback-first policy. |

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk pnpm db:ready` | passed | Current-shell KRN DB is reachable, migrations applied, pgvector available. | Does not prove source truth or product readiness. |
| `rtk env KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --silent --filter @krn/cli krn source search --query "source artifact persisted readback SourceArtifact SourceChunk SearchDocument" --limit 10 --max-inclusions 5 --json` | passed | Q1 source search can return governed claim/link evidence. | Does not prove included document evidence is complete. |
| `rtk env KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --silent --filter @krn/cli krn brain search --query "source artifact persisted readback SourceArtifact SourceChunk SearchDocument" --store-only --limit 10 --max-inclusions 5 --json` | passed | Q1 brain search selects ready source-backed knowledge. | Does not prove ranking quality. |
| `rtk env KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --silent --filter @krn/cli krn source search --query "EKOLOGUS Brain quality gate" --limit 10 --max-inclusions 5 --json` | passed | Q2 source search finds second-repo evidence with one supporting SearchDocument and no missing evidence. | Does not prove broad multi-repo recall. |
| `rtk env KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --silent --filter @krn/cli krn brain search --query "EKOLOGUS Brain quality gate" --store-only --limit 10 --max-inclusions 5 --json` | passed | Q2 brain search composes selectedKnowledge and useful source search evidence. | Does not prove selectedKnowledge precision is target-aware. |

## Next Action

Open one bounded repair/measurement slice:

```txt
Classify target-specific vs generic selectedKnowledge in multi-repo brain search output.
```

Do not rewrite ranking yet. First expose whether each selected packet is
target-specific, generic guardrail, adjacent pattern, or noise so future
multi-repo Brain-QA can measure precision without manual JSON inspection.
