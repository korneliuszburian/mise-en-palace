# V308 Research Source Decisions Initial Pack

Status: complete docs/source-decision slice.

Date: 2026-06-28.
DB used: no.

## Executive Verdict

V308 retained the first bounded paper/source decision pack for KRN brain growth:
MemGPT, Reflexion, Self-RAG, GraphRAG, and HippoRAG. The slice did not create a
research archive, crawler, dashboard, API/MCP surface, embedding/ranking path,
DB schema, graph runtime, or Memory Core mutation. The retained decisions now
feed one immediate consumer: V309 Mini Brain-QA Benchmark Sketch.

## Scope

Selected pattern:

```txt
pattern:source-to-decision-retention-gate
```

Usefulness: helped.

Why: it forced each source through mechanism, KRN implication,
decision/rejection, consumer, falsifier, and does-not-prove before retention.

## Retained Sources

| Source | Decision | Consumer | Why retained |
|---|---|---|---|
| MemGPT | adopt | activation/context assembly, memory-usefulness benchmark | supports bounded working-set memory over larger-context/file-memory shortcuts |
| Reflexion | adopt | evidence/review loop, MemoryCandidate review, heartbeat candidates | supports feedback-to-candidate improvement without automatic truth mutation |
| Self-RAG | lab_test | V309 mini brain-QA, activation relevance tests | creates falsifiable adaptive retrieval/critique/abstention questions |
| GraphRAG | lab_test | graph brain v0, global-question cases | creates falsifiable global corpus QA questions before graph platform work |
| HippoRAG | lab_test | graph retrieval tests, multi-hop brain-QA | creates falsifiable multi-hop graph retrieval questions after graph/ingest v0 |

## Deferred Or Rejected

- Generative Agents: deferred. Observation/reflection staging already has
  current local doctrine and Mastra/ADR coverage; revisit when agent-simulation
  or behavior-loop work needs a direct consumer.
- Broad source crawler: rejected for this slice. V308 is source-decision intake,
  not corpus ingestion.
- Paid/proprietary course ingestion: rejected. KRN can use public pages,
  supplied notes, mechanisms, and links, not copied paid material.
- Immediate graph/ingest implementation: deferred. GraphRAG/HippoRAG are local
  lab-test hypotheses until V309 creates benchmark questions.

## Proof Boundaries

What this proves:

- KRN can retain a small source pack without source hoarding.
- Each retained source has a consumer and falsifier.
- The next step is benchmark sketching, not another research pack.

What this does not prove:

- product readiness;
- SOTA quality;
- adaptive retrieval quality;
- graph retrieval quality;
- that any paper should be copied directly;
- that KRN needs API/MCP/dashboard/crawler/graph runtime now.

## Source Usefulness Feedback

`pattern:source-to-decision-retention-gate`: helped.

Evidence:

- `docs/KRN_SOURCES.md` now contains five retained paper decisions.
- Each retained section names trust tier, source class, decision kind,
  mechanism, KRN implication, decision, consumer, falsifier, and
  does-not-prove.

Does not prove:

- future source decisions will stay useful without V309/V310 local falsifiers.

## Next Action

V309 should sketch the first 30-question KRN brain-QA benchmark. The benchmark
must map questions to retained source decisions and product behavior, without
building a broad eval platform.
