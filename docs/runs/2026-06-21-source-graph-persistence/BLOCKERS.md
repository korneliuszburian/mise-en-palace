# Blockers

Hard blockers:

- None through Slice 11.

Known unproven M22 behavior:

- M22 final anti-rot and handoff update are not recorded yet.

Explicit non-blockers:

- No dashboard UI exists by design.
- No API exists by design.
- No MCP server exists by design.
- No crawler or research layer exists by design.
- No `.krn` runtime truth exists by design.
- No separate vector, graph, search, or queue store exists by design.
- No runtime markdown memory exists by design.

Closed in Slice 01:

- Current source graph schema/repository/type/CLI surface was inventoried in
  `SOURCE_GRAPH_INVENTORY.md`.

Closed in Slice 02:

- Minimal source graph schema now exists for M22 claim status/run linkage,
  typed decision edges, M22 source vocabulary, and first-class rejection
  fields.

Closed in Slice 04:

- Repository methods now exist for source claim lookup/run listing, decision
  edge creation/run listing, and source rejection creation.

Closed in Slice 05:

- `pnpm db:smoke:source-graph` exists and passed live with SourceArtifact,
  SourceClaim, SourceDecisionEdge, SourceRejection, outbox events, readback, and
  cleanup remaining marker count `0`.

Closed in Slice 06:

- `krn source claim add` exists, previews without DB writes, requires
  `KRN_DATABASE_URL` for `--persist`, writes SourceArtifact and SourceClaim
  through SourceRepository, and passed live persistence proof.

Closed in Slice 07:

- `krn source decision link` exists, previews without DB writes, requires
  `KRN_DATABASE_URL` for `--persist`, verifies SourceClaim existence, writes a
  SourceDecisionEdge through SourceRepository, and passed live persistence
  proof.

Closed in Slice 08:

- `krn source claim reject` exists, previews without DB writes, requires
  `KRN_DATABASE_URL` for `--persist`, writes a SourceRejection through
  SourceRepository, does not create a SourceClaim, and passed live persistence
  proof.

Closed in Slice 09:

- `krn evidence capture` prints `sourceDecisionCandidates`, derives
  proposal-only source decision candidates from source/decision-like changed
  files, persists them in `FeedbackDelta.sourceDecisions` when evidence capture
  is persisted, and still does not create SourceClaims or mutate memory.

Closed in Slice 10:

- `krn doctor` reports source graph schema readiness, SourceRepository read
  path reachability, source graph smoke command availability, source graph
  runtime proof markers, forbidden source crawler/research layer absence,
  separate graph DB absence, and derived source graph readiness. No-DB and live
  DB doctor paths passed.

Closed in Slice 11:

- M22 source graph dogfood is recorded in `DOGFOOD.md` with persisted run,
  SourceClaim, SourceDecisionEdge, SourceRejection, EvidenceBundle,
  ReviewAssessment, FeedbackDelta, live doctor, live source graph smoke, what
  was proven, what was not proven, and the next safest action.
