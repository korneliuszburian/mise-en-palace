# Decisions

- Treat `GOAL.md` as the M22 execution contract.
- Use `docs/runs/2026-06-21-source-graph-persistence/` as the compact M22 run
  ledger. It is audit/handoff material only, not runtime Memory Core.
- M22 starts from the completed M21 persisted harness spine. The Source Graph
  must link to existing harness artifacts instead of creating a separate source
  product.
- Keep source persistence inside the existing Postgres/Drizzle boundary unless
  Slice 01 proves a missing durable surface that requires an ADR.
- Decorative sources are rejected. A persisted SourceClaim must carry
  mechanism, does-not-prove, trust tier, support type, source lineage, and
  consumer.
- M22 must not add crawler, research swarm, dashboard, API, MCP server, runtime
  markdown memory, `.krn` runtime truth, separate graph/vector/search store, or
  automatic memory mutation.

Slice 00 skill record:

- `source-to-decision`: used because M22 turns sources into decisions/rejections
  and explicitly forbids decorative links.
- `brain-store-schema`: used because upcoming slices inspect and change
  source graph persistence.
- `evidence-review-loop`: used for command evidence and residual-risk
  recording.
- `handoff-compact`: used for continuation state and next action.
- `target-infra-adr`: not used in Slice 00; no new durable infrastructure was
  added.
- `activation-engine`: not used in Slice 00; no activation behavior changed.
