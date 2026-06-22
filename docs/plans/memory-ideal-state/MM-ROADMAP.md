# Memory Ideal-State Roadmap

MM-00 is complete when the ADR, source-to-decision ledger, decisions,
rejections, falsifiers, and this roadmap exist. It does not implement runtime
observational memory.

## Slice Roadmap

| Slice | Category | Scope | Output | Hard no |
|---|---|---|---|---|
| MM-00 | ADR / ledger | Memory ideal-state ADR and source-to-decision ledger. | ADR-0011, SOURCE_LEDGER, DECISIONS, REJECTIONS, FALSIFIERS, roadmap. | No schema/runtime. |
| MM-01 | Domain contracts | Observation domain contracts. | `ObservationGroup`, `ObservationItem`, `ObservationSourceRange`, `ObservationPrefix` contracts. | No DB migration yet unless explicitly approved by the slice. |
| MM-02 | Schema contracts | Observation Zod schemas and fixtures. | Validators for external/LLM/CLI observation payloads. | No unchecked JSON into domain. |
| MM-03 | Schema | Observation DB schema. | Drizzle tables and migration for observation groups/items/source ranges/edges. | No separate vector/graph DB. |
| MM-04 | Repository | Observation repositories. | Read/write repositories, mappers, smoke tests. | No runtime markdown memory. |
| MM-05 | Evidence linkage | Source range / evidence linkage. | Observation source ranges over run events, source chunks, diffs, tool traces, review, feedback. | No factual observation without source range. |
| MM-06 | Observer input | Observer input builder. | Deterministic input from run/source/tool/review history. | No source crawler. |
| MM-07 | Observer fixtures | Observer prompt/contract fixtures. | Fixture-only observer output contract and validation. | No worker runtime. |
| MM-08 | Observer CLI | `observe-run` CLI, manual only. | Manual command to create reviewed observation drafts from a run. | No daemon/hidden agent. |
| MM-09 | Reflection contracts | Reflection domain contracts. | `ReflectionRecord` contract and candidate output envelope. | No Memory Core mutation. |
| MM-10 | Reflection schema | Reflection DB schema. | Tables/migration for reflection records and links. | No auto-promotion. |
| MM-11 | Reflector fixtures | Reflector input/output fixtures. | Validated reflector outputs over observations. | No unchecked candidate JSON. |
| MM-12 | Candidate gates | Memory candidate generation. | Reviewable `MemoryCandidate` proposals with lineage. | No direct MemoryRecord writes. |
| MM-13 | Anti-memory | Anti-memory candidate generation. | `AntiMemoryCandidate` path before reviewed AntiMemoryRecord. | No prose-only anti-memory. |
| MM-14 | Source graph | Source claim generation. | SourceClaim proposals from reflections. | No source claim without does-not-prove/falsifier. |
| MM-15 | Activation | Activation prefix selector. | Bounded observation prefix selection with trust/TTL/conflict controls. | No context dump. |
| MM-16 | Activation integration | Context assembly integration. | Observation prefix participates in ContextAssembly and activation traces. | No prefix overriding anti-memory/source trust. |
| MM-17 | Raw recall | Raw recall from observation source ranges. | Exact evidence recall path for observations/reflections/candidates. | No summary-only exact claims. |
| MM-18 | Gaps / contradictions | Contradiction and gap detection. | Gap/abstention observations and contradiction candidates. | No transient-only gaps. |
| MM-19 | Feedback | Feedback events for observation usefulness. | Review signals for prefix usefulness, staleness, and corrections. | No unmeasured prefix value. |
| MM-20 | Workers | Worker job skeleton integration. | Bounded observe/reflect job types after manual contracts prove stable. | No autonomous hidden agents. |
| MM-21 | Dogfood | KRN run observations. | Dogfood observations from real KRN runs. | No synthetic-only proof. |
| MM-22 | Eval / golden tasks | Golden tasks for memory behavior. | Tests for stale memory, contradiction, source range, anti-memory, abstention, prefix budget. | No benchmark theater. |
| MM-23 | Hardening | Security/privacy/no-CoT hardening. | Redaction, no-chain-of-thought checks, retention/TTL/invalidation proof. | No private reasoning storage. |
| MM-24 | Handoff | Final handoff and promotion criteria. | Promotion criteria for observational memory as product segment. | No done-claim without dogfood/eval proof. |

## Category Coverage

- ADR/ledger slices: MM-00.
- Schema slices: MM-02, MM-03, MM-10.
- Repository slices: MM-04.
- Activation integration: MM-15, MM-16, MM-17.
- Observer worker path: MM-06, MM-07, MM-08, MM-20.
- Reflector worker path: MM-09, MM-10, MM-11, MM-20.
- Candidate promotion gates: MM-12, MM-14, MM-16.
- Anti-memory integration: MM-13, MM-16, MM-22.
- Eval/golden-task slices: MM-18, MM-19, MM-22, MM-23.
- Dogfood slices: MM-21, MM-24.

## Entry Rule For Later Slices

Every later slice must name:

- MM-00 decision implemented;
- ledger source row used;
- falsifier guarded;
- runtime surfaces intentionally untouched;
- verification command that proves the slice stayed inside scope.
