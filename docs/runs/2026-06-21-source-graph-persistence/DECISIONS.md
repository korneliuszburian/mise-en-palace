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
- Existing source tables are the base for M22. `source_artifacts`,
  `source_claims`, claim-to-claim edges, `source_decisions`, and
  `source_rejections` already exist.
- Current `source_decisions` is not the M22 typed `SourceDecisionEdge` target
  model. M22 still needs a typed edge from source claim to harness artifact
  target.
- M22 support/trust/rejection vocabularies should be explicit rather than
  overloading the older `supports/background/high/medium/low` vocabulary.
- Slice 02 keeps existing `source_decisions` as legacy decision/adoption
  records and introduces `source_decision_edges` for the M22 source-claim to
  harness-artifact target edge.
- Core naming was corrected accordingly: the old decision/adoption read model is
  `SourceDecision`; `SourceDecisionEdge` now means the typed M22 edge.
- New trust tiers are accepted by activation/retrieval read models with a
  conservative ranking, preserving old `high/medium/low` values while allowing
  M22 values to flow without downcasting.
- Slice 03 keeps DB compatibility with old source vocabulary, but new IO schemas
  accept only M22 trust/support values for source claims and decision edges.

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

Slice 01 skill record:

- `source-to-decision`: used to map local source graph evidence into the schema
  decision for Slice 02.
- `brain-store-schema`: used to inventory source persistence tables,
  migrations, repository ports, and missing durable fields.
- `target-infra-adr`: not used; inventory keeps M22 inside Postgres/Drizzle.
- `activation-engine`: not used; no activation behavior changed.

Slice 02 skill record:

- `brain-store-schema`: used for Drizzle schema, migration, indexes, FK, and
  SQL inspection.
- `typescript-type-safety`: used for core/source/domain boundary updates after
  enum expansion.
- `superpowers:test-driven-development`: used for RED/GREEN schema test before
  production schema edits.
- `superpowers:systematic-debugging`: used after typecheck exposed stale
  assumptions in domain/repository/context trust tiers.
- `target-infra-adr`: not used; Slice 02 adds no new infrastructure beyond the
  existing Postgres/Drizzle boundary.
- `activation-engine`: not used as an activation redesign; only trust-tier type
  compatibility was preserved.

Slice 03 skill record:

- `typescript-type-safety`: used for Zod parse boundaries over unknown
  CLI/API-style input.
- `superpowers:test-driven-development`: used for RED/GREEN parser tests.
- `brain-store-schema`: not used for new persistence in Slice 03; no DB schema
  changed.
