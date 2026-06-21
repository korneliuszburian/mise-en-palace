# Progress

Current phase: M22 source graph persistence complete.

Completed in M22:

- Run ledger created under
  `docs/runs/2026-06-21-source-graph-persistence/`.
- Existing source graph schema/repository/type/CLI surface inventoried.
- Source graph schema and migration tightened for M22 claim status/run links,
  typed source decision edges, M22 support/trust vocabulary, and first-class
  rejection fields.
- Zod IO parsers added for source artifacts, claims, decision edges, and
  rejections.
- SourceRepository methods added for source claim lookup/run listing, source
  decision edge creation/run listing, and source rejection creation.
- `pnpm db:smoke:source-graph` proves live source artifact, SourceClaim,
  SourceDecisionEdge, SourceRejection, outbox events, readback, and cleanup.
- `krn source claim add` persists SourceArtifact and SourceClaim behind
  explicit `--persist`.
- `krn source decision link` persists typed SourceDecisionEdge behind explicit
  `--persist`.
- `krn source claim reject` persists SourceRejection behind explicit
  `--persist` without creating a SourceClaim.
- `krn evidence capture` surfaces proposal-only `sourceDecisionCandidates` and
  persists them into `FeedbackDelta.sourceDecisions` when evidence capture is
  persisted.
- `krn doctor` reports source graph readiness read-only.
- Source graph dogfood is recorded in
  `docs/runs/2026-06-21-source-graph-persistence/DOGFOOD.md`.
- Final anti-rot audit is recorded in
  `docs/runs/2026-06-21-source-graph-persistence/ANTI_ROT.md`.

Current runtime truth:

- DB writes still require explicit `--persist` or explicit smoke commands.
- `krn source claim add`, `krn source decision link`, and
  `krn source claim reject` are the current source graph write surface.
- `krn evidence capture` proposes source decision candidates but does not
  create SourceClaims and does not mutate memory.
- `krn doctor` is read-only and reports source graph readiness from schema,
  repository reachability, smoke command availability, forbidden-infra absence,
  and durable runtime proof markers.
- With `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn`, source graph
  doctor readiness and source graph smoke are proven.

Next action:

- M23: MemoryCandidate to reviewed MemoryRecord promotion.
