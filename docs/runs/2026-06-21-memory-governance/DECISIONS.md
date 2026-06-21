# Decisions

- Treat `GOAL.md` as the M23 execution contract.
- Use `docs/runs/2026-06-21-memory-governance/` as the compact M23 run ledger.
  It is audit/handoff material only, not runtime Memory Core.
- M23 starts from the completed M22 source graph persistence state. Memory
  governance must link to existing harness/evidence/source artifacts instead
  of creating a separate memory product.
- Keep memory governance inside the existing Postgres/Drizzle boundary unless
  a later slice proves a missing durable surface that requires an ADR.
- Existing memory tables are the base for M23. `memory_records`,
  `memory_record_versions`, `memory_candidates`, `memory_applications`,
  `memory_feedback_events`, `anti_memory_records`, and
  `memory_activation_traces` already exist.
- Current tables do not yet satisfy the M23 governed promotion contract:
  candidate review/promote/reject, `currentVersionId`, created-from-candidate
  provenance, application outcome, feedback event type, and anti-memory
  source/run linkage still need tightening.
- `FeedbackDelta.memoryCandidates` remains a proposal surface. It must not
  create MemoryRecords automatically.
- Markdown run docs remain audit/handoff material, not runtime Memory Core.
- No dashboard, API, MCP server, memory crawler, vector embedding pipeline,
  broad memory worker, runtime markdown memory, `.krn` truth, or separate
  memory/vector/graph/search store is part of M23.00.

Slice 00 skill record:

- `brain-store-schema`: used to inventory memory tables, migrations,
  repository ports, and missing durable fields.
- `typescript-type-safety`: used to inspect core/schema/repository boundaries.
- `evidence-review-loop`: used to inspect FeedbackDelta memory candidate
  behavior and evidence capture boundaries.
- `superpowers:test-driven-development`: used as a gate for upcoming M23
  implementation slices.
- `target-infra-adr`: not used in Slice 00; inventory keeps M23 inside
  Postgres/Drizzle.
- `activation-engine`: not used in Slice 00; no activation behavior changed.
