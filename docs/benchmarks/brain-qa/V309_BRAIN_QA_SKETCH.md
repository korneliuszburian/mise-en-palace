# V309 Mini Brain-QA Benchmark Sketch

Status: sketch, not executable benchmark.
Date: 2026-06-28.

This document defines the first 30 KRN brain-QA questions. It does not build a
runtime, scoring system, Promptfoo lane, source crawler, graph runtime,
dashboard, API/MCP surface, DB schema, embedding pipeline, or Memory Core
mutation path.

## Purpose

Convert retained source decisions and existing product behavior into local
falsifiers before widening KRN into ingest, graph, heartbeat, consensus, UI,
API, MCP, or broad eval work.

## Selected Patterns

| Pattern/source | Expected use | Outcome |
|---|---|---|
| `pattern:source-to-decision-retention-gate` | Ensure each question maps to a source decision, product behavior, consumer, and falsifier. | helped |
| `pattern:evidence-proof-non-proof-boundary` | Require every benchmark lane to state what evidence proves and does not prove. | helped |
| `pattern:active-context-compact-current-truth` | Keep this benchmark as a compact sketch, not a new roadmap. | helped |
| `pattern:brain-knowledge-read-only-ui-boundary` | Keep future UI/search/API/MCP out until read-only usefulness is proven. | helped |
| `pattern:codex-prompt-task-contract-proof-boundary` | Keep next executable case bounded by non-goals, verification, rollback, and non-proof. | helped |

Broad query note:

```txt
Query: brain qa source decision retrieval memory anti memory evidence graph
Result: 0 cards.
```

This does not prove no relevant pattern exists. It proves only that the current
deterministic text search can miss broad semantic queries; shorter mechanism
queries were needed.

## Execution Modes

| Mode | Meaning |
|---|---|
| `docs_readback` | Use committed docs/source/report evidence only. |
| `cli_preview` | Use an existing read-only CLI command. |
| `db_replay` | Use live DB-backed persisted plan/evidence/observe/reflect/readback. |
| `golden_fixture` | Add or run a deterministic fixture/golden case. |
| `future_graph` | Needs graph/ingest v0 before execution. |

## Questions

| ID | Lane | Question | Source/pattern | Expected evidence | Future mode | Does not prove |
|---|---|---|---|---|---|---|
| BQ-001 | Context/memory | When a task asks for a source repair, can KRN select a bounded working set instead of broad docs/history? | MemGPT; active context | ContextAssembly inclusions/exclusions and token budget. | db_replay | Does not prove optimal ranking. |
| BQ-002 | Context/memory | Does KRN exclude stale historical ledgers when root `GOAL/PLAN/PLANS` are current truth? | MemGPT; active context | Context exclusions or no historical-ledger reads. | golden_fixture | Does not prove all stale context is known. |
| BQ-003 | Context/memory | Can KRN surface a useful retained pattern before coding without loading all pattern history? | MemGPT; source-to-decision | `krn brain knowledge` readback and selected pattern classification. | cli_preview | Does not prove semantic search quality. |
| BQ-004 | Context/memory | Does selected memory/source context record `expectedUse` and later helped/neutral/noise outcome? | MemGPT | Dogfood report with selected/used/helped classification. | db_replay | Does not prove memory helped product work. |
| BQ-005 | Context/memory | If no relevant context is found, does KRN abstain or warn instead of padding the prompt? | MemGPT; Self-RAG | Activation abstention or no-match guidance. | golden_fixture | Does not prove abstention threshold quality. |
| BQ-006 | Feedback/candidates | Does feedback become a reviewable candidate rather than final Memory Core truth? | Reflexion | FeedbackDelta to MemoryCandidate/SourceDecision/EvalCandidate path. | db_replay | Does not prove candidate quality. |
| BQ-007 | Feedback/candidates | Can a helped memory application influence a later task without automatic promotion? | Reflexion | MemoryApplication outcome plus no automatic MemoryRecord mutation. | db_replay | Does not prove general memory usefulness. |
| BQ-008 | Feedback/candidates | Do stale or hurt outcomes create reviewable anti-memory candidates instead of silent demotion? | Reflexion | AntiMemoryCandidate output with reviewability. | golden_fixture | Does not prove anti-memory coverage is complete. |
| BQ-009 | Feedback/candidates | Does candidate output expose reviewability and reasons before human review? | Reflexion; evidence proof | Candidate readback labels: ready/needs_more_evidence/too_vague/etc. | cli_preview | Does not prove promotion readiness. |
| BQ-010 | Source grounding | Does a retained source claim require mechanism, KRN implication, consumer, falsifier, and does-not-prove? | source-to-decision | SourceClaim/SourceDecision review signals or source-map invariant. | golden_fixture | Does not prove source truth. |
| BQ-011 | Source grounding | Can KRN reject a decorative source that lacks a consumer or falsifier? | source-to-decision | Decorative source rejection case. | golden_fixture | Does not prove all decorative sources are caught. |
| BQ-012 | Source grounding | Does a source decision state what it does not prove before shaping implementation? | evidence proof | SourceDecision or `docs/KRN_SOURCES.md` entry. | docs_readback | Does not prove implementation followed it. |
| BQ-013 | Source grounding | Can KRN distinguish official docs, paper, practitioner/course, repo evidence, and target evidence classes? | source-to-decision | Source class readback/invariant. | golden_fixture | Does not prove trust-tier judgment is perfect. |
| BQ-014 | Adaptive retrieval | Can KRN decide not to retrieve more context when evidence is already sufficient? | Self-RAG | Plan/context assembly with explicit abstention from additional retrieval. | db_replay | Does not prove optimal recall. |
| BQ-015 | Adaptive retrieval | Can KRN expand retrieval after a no-match broad query by trying shorter mechanism terms? | Self-RAG | Knowledge-card no-match then shorter-query hit. | cli_preview | Does not prove semantic retrieval quality. |
| BQ-016 | Adaptive retrieval | Does KRN mark evidence insufficient instead of pretending a weak source proves product readiness? | Self-RAG; evidence proof | EvidenceBundle/ReviewAssessment with insufficient/weak proof boundary. | db_replay | Does not prove reviewer correctness. |
| BQ-017 | Adaptive retrieval | Can KRN critique retrieved context as noise, stale, neutral, or helped after the task? | Self-RAG | Dogfood usefulness section. | docs_readback | Does not prove future retrieval improves. |
| BQ-018 | Adaptive retrieval | Can KRN avoid activation scoring rewrites when missing owner files are actually missing read-model evidence? | Self-RAG | Activation report distinguishing scoring vs read-model gap. | db_replay | Does not prove scoring is correct. |
| BQ-019 | Temporal/anti-memory | Does KRN block an invalidated/stale memory before it enters active context? | MemGPT; anti-memory behavior | Golden stale-memory or anti-memory activation case. | golden_fixture | Does not prove all stale claims are detected. |
| BQ-020 | Temporal/anti-memory | Does a source claim past `revisitWhen` create refresh/deprecation pressure? | source-to-decision | SourceClaim review signal for temporal validity. | golden_fixture | Does not prove source is false. |
| BQ-021 | Temporal/anti-memory | Can KRN answer "what was true then vs now" using validity windows or temporal metadata? | MemGPT; GraphRAG | Source/memory temporal readback. | future_graph | Does not prove full timeline reasoning. |
| BQ-022 | Temporal/anti-memory | Does anti-memory preserve why a previous inference should not be reused? | Reflexion | AntiMemoryRecord reason and invalidated source refs. | golden_fixture | Does not prove anti-memory is complete. |
| BQ-023 | Evidence/review | Does command evidence distinguish operator-reported, captured output, runner, default template, missing, and not-run states? | evidence proof | EvidenceBundle command provenance readback. | db_replay | Does not prove commands actually ran unless provenance supports it. |
| BQ-024 | Evidence/review | Does evidence capture classify intended/unrelated/unknown changed files? | evidence proof | Evidence dirty-context readback. | cli_preview | Does not prove review judgment is correct. |
| BQ-025 | Evidence/review | Does every proof in a report state what it does not prove? | evidence proof | Report command evidence table/non-proof section. | docs_readback | Does not prove product value. |
| BQ-026 | Graph/global QA | Can KRN summarize which retained decisions shape "what not to build next" across the corpus? | GraphRAG | SourceDecision/Pattern card aggregation. | future_graph | Does not prove community-summary quality. |
| BQ-027 | Graph/global QA | Can KRN find repeated evidence that UI/API/MCP is deferred until read-only usefulness/security gates pass? | GraphRAG | Cross-doc/source graph over ADRs, reports, patterns. | future_graph | Does not prove UI/API/MCP is never needed. |
| BQ-028 | Graph/global QA | Can KRN identify the main unresolved product gaps from compact root state and reports without reading historical ledgers? | GraphRAG; active context | Root-state + selected report/source evidence. | docs_readback | Does not prove arbitrary corpus QA. |
| BQ-029 | Multi-hop | Can KRN connect a paper source decision to a retained pattern and then to a next executable task? | HippoRAG; source-to-decision | Source -> pattern -> task chain. | future_graph | Does not prove graph ranking quality. |
| BQ-030 | Multi-hop | Can KRN trace "feedback helped" from dogfood report to candidate reviewability to later activation/memory behavior? | HippoRAG; Reflexion | Report -> candidate -> memory/source/eval chain. | future_graph | Does not prove causal improvement. |

## Minimum Future Executable Slice

The next executable slice should choose one case that does not require graph or
ingest runtime. Recommended first case:

```txt
BQ-015: no-match broad query -> shorter mechanism query -> retained pattern hit.
```

Why:

- it uses existing `krn brain knowledge`;
- it tests adaptive retrieval behavior without building a new platform;
- it has a clear failure mode;
- it connects Self-RAG lab-test logic to current KRN read-only behavior.

## Proof Boundaries

This sketch proves:

- V308 decisions can become local falsifiable questions.
- The first benchmark can stay small and docs/readback-driven.
- Future graph/ingest work has clearer target behavior.

This sketch does not prove:

- product readiness;
- SOTA quality;
- retrieval ranking quality;
- graph retrieval quality;
- citation accuracy;
- that any benchmark question is already executable;
- that UI/API/MCP/dashboard should be built now.
