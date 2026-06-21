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
- Slice 04 repository writes for decision edges and rejections emit outbox
  events (`source.decision_edge.created`, `source.rejection.created`) because
  these are durable audit/work signals.
- Slice 05 source graph smoke is the live proof for M22 source persistence until
  CLI source commands add user-facing write paths.
- Slice 06 keeps `--type` as a CLI source-type hint. If the value is not a
  physical `source_artifact_kind`, the artifact persists as `operator_input`
  and the type hint is retained in metadata as `sourceType`.
- Slice 07 verifies SourceClaim existence before creating a source decision
  edge, but it does not infer that the source proves the whole target.
- Slice 08 writes rejected/decorative material only as SourceRejection and does
  not create a SourceClaim, because rejected sources must not become trusted KRN
  context by accident.
- Slice 09 keeps evidence-derived source decisions as FeedbackDelta candidates,
  not SourceClaims, because evidence capture observes changed files but does
  not have the mechanism/does-not-prove/consumer proof needed to trust a claim.
- Slice 10 keeps `krn doctor` read-only. Source graph readiness is derived from
  schema presence, SourceRepository read-path reachability, smoke command
  availability, forbidden-infra absence, and durable runtime proof markers
  rather than hidden doctor state.

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

Slice 04 skill record:

- `brain-store-schema`: used for repository adapter, mapper, and outbox-event
  behavior.
- `typescript-type-safety`: used for new repository input/read-model boundaries.
- `superpowers:test-driven-development`: used for RED/GREEN mapper tests.

Slice 05 skill record:

- `brain-store-schema`: used for source graph smoke cleanup, linkage, and
  outbox-marker proof.
- `superpowers:test-driven-development`: used for RED/GREEN CLI target test.

Slice 06 skill record:

- `typescript-type-safety`: used for CLI argument parsing, Zod input
  validation, and runtime/repository boundaries.
- `brain-store-schema`: used to keep CLI persistence on SourceRepository rather
  than direct SQL.
- `source-to-decision`: used to preserve mechanism/does-not-prove semantics in
  the user-facing claim command.
- `superpowers:test-driven-development`: used for RED/GREEN source claim CLI
  tests.
- `superpowers:systematic-debugging`: used for the typecheck export-name
  conflict.

Slice 07 skill record:

- `typescript-type-safety`: used for CLI argument parsing and Zod edge input
  validation.
- `brain-store-schema`: used to keep source decision edge creation on
  SourceRepository and preserve source-claim FK behavior.
- `source-to-decision`: used to keep link semantics explicit: support type,
  confidence, notes, and no automatic proof inference.
- `superpowers:test-driven-development`: used for RED/GREEN source decision
  link CLI tests.

Slice 08 skill record:

- `typescript-type-safety`: used for CLI argument parsing and Zod rejection
  input validation.
- `brain-store-schema`: used to keep source rejection creation on
  SourceRepository rather than direct SQL.
- `source-to-decision`: used to preserve the difference between source claims
  and rejected/decorative source material.
- `superpowers:test-driven-development`: used for RED/GREEN source claim
  rejection CLI tests.

Slice 09 skill record:

- `typescript-type-safety`: used for `SourceDecision` candidate construction
  and persisted feedback-delta boundaries.
- `source-to-decision`: used to keep evidence-derived candidates as explicit
  decisions with rationale/falsifier/consumer instead of automatic claims.
- `evidence-review-loop`: used because the slice changes evidence capture and
  feedback candidate behavior.
- `superpowers:test-driven-development`: used for RED/GREEN evidence capture
  tests.

Slice 10 skill record:

- `brain-store-schema`: used for the read-only source graph schema/proof helper
  and DB table checks.
- `typescript-type-safety`: used for exported readiness report types and doctor
  readiness derivation.
- `source-to-decision`: used to keep source graph readiness tied to claim,
  decision edge, and rejection proof rather than decorative source presence.
- `superpowers:test-driven-development`: used for RED/GREEN doctor readiness
  tests.
