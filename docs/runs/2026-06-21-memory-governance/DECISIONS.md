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
- Slice 00 found that current tables did not yet satisfy the M23 governed
  promotion contract: candidate review/promote/reject, `currentVersionId`,
  created-from-candidate provenance, application outcome, feedback event type,
  and anti-memory source/run linkage still needed tightening.
- `FeedbackDelta.memoryCandidates` remains a proposal surface. It must not
  create MemoryRecords automatically.
- Markdown run docs remain audit/handoff material, not runtime Memory Core.
- No dashboard, API, MCP server, memory crawler, vector embedding pipeline,
  broad memory worker, runtime markdown memory, `.krn` truth, or separate
  memory/vector/graph/search store is part of M23.00.
- Slice 01 keeps the existing `memory_candidates.status` DB default as
  `candidate` while adding `proposed` to the enum. This avoids using a newly
  added Postgres enum value as a default in the same migration. Later CLI/repo
  paths can still write `proposed` explicitly.
- Slice 01 preserves older memory status values for compatibility while adding
  M23 vocabulary. M23 command/repository behavior should use the stricter M23
  semantics instead of relying on old defaults.
- Slice 01 keeps `memory_records.currentVersionId` as a query/update field with
  an index but no circular FK. Repository promotion paths should maintain this
  pointer when Slice 03 implements candidate promotion.
- Slice 02 keeps memory governance input validation in `packages/schema`
  rather than the CLI. CLI commands should parse unknown input through these
  Zod schemas before calling repository methods.
- Slice 02 defaults candidate IO status to `proposed` even though the DB
  default remains `candidate`. This keeps the operator-facing contract aligned
  with M23 while preserving the migration-safe DB default.
- Slice 02 treats an explicit user preference as `kind: "preference"` plus
  `isUserPreference: true`. Only that path may omit source grounding and
  invalidation rule.
- Slice 03 extends `@krn/core` read models rather than returning DB rows from
  the repository. M23 memory candidate, record, application, and anti-memory
  readbacks now carry run/source/review/invalidation fields at the domain
  boundary.
- Slice 03 keeps promotion explicit. `promoteMemoryCandidate` accepts only an
  accepted decision, rejects already reviewed candidates, creates the memory
  record and initial version in one transaction, and marks the candidate as
  reviewed.
- Slice 03 uses optional `recordKey` for promotion. If absent, the repository
  derives `memory:<candidateId>` so CLI can promote the target examples without
  inventing a key argument in M23.06.
- Slice 03 records application feedback in `memory_applications` and updates
  positive or negative counters on the memory record. It does not auto-create
  demotion candidates; later CLI/feedback slices can decide that behavior.
- Slice 04 makes memory governance runtime proof a DB smoke command, not a
  markdown assertion. The smoke uses existing harness/project/source/memory
  repositories and requires `KRN_DATABASE_URL`.
- Slice 04 cleanup uses a smoke marker in metadata/outbox payloads and proves
  cleanup with a remaining marker count of zero.
- Slice 05 keeps `krn memory candidate add` preview mode no-store. Without
  `--persist`, the command validates and reports the candidate but performs no
  DB writes.
- Slice 05 maps the operator-facing example kind `architecture-boundary` to the
  stored memory kind `constraint` and preserves the original value as
  `inputKind` metadata/report output.
- Slice 05 accepts confidence aliases `low`, `medium`, and `high`, then maps
  them to numeric confidence values before schema parsing.
- Slice 05 persist mode verifies referenced source-claim existence before
  writing a MemoryCandidate when `--source-claim-id` is provided.
- Slice 06 keeps candidate review explicit. `krn memory candidate promote`
  requires `--reviewer` and `--decision accepted`; `reject` requires
  `--reviewer` and `--reason`.
- Slice 06 preview mode remains no-store. Without `--persist`, promote/reject
  validate and report review intent but create no MemoryRecord and record no
  memory application.
- Slice 06 persist promote reads the candidate first so the CLI can print
  source-claim `doesNotProve` limits before creating the MemoryRecord.
- Slice 06 does not add a `--record-key` argument. Repository promotion keeps
  deriving `memory:<candidateId>` when no key is provided.
- Slice 07 adds a typed `MemoryFeedbackEvent` core/read model and
  `createMemoryFeedbackEvent` repository method because the table already
  exists and M23.07 requires `hurt`/`stale` outcomes to create a feedback event
  or demotion candidate.
- Slice 07 chooses feedback event over demotion candidate for `hurt`/`stale`.
  The CLI records the application first, then links the feedback event with
  `evidenceRef: memory-application:<id>`.
- Slice 07 keeps `--expected-use` optional because the GOAL target command does
  not include it. The CLI derives a bounded default while still requiring
  explicit `--run-id`, `--memory-id`, `--outcome`, and `--notes`.
- Slice 08 keeps anti-memory separate from positive MemoryRecord creation.
  `krn memory anti add` only writes AntiMemoryRecord and explicitly reports
  that no MemoryRecord was created.
- Slice 08 defaults anti-memory owner to `operator` and confidence to `90`
  because the GOAL target command does not include those schema-required
  fields. Operators may override with `--owner` and `--confidence`.
- Slice 08 validates the invalidating SourceClaim before persist when
  `--invalidated-by-source-claim-id` is provided and also stores that ID in
  source lineage.
- Slice 09 keeps `krn evidence capture` proposal-only for memory. Changed-file
  evidence can create an incomplete FeedbackDelta memory candidate proposal,
  but evidence capture does not call MemoryRepository, does not create a
  `memory_candidates` row, does not promote, and does not create a
  MemoryRecord.
- Slice 09 marks evidence-derived memory proposals incomplete when
  `applicationGuidance`, `sourceLineage`, or `invalidationRule` are not
  available. This preserves the M23 source-grounding contract instead of
  inventing source lineage from git status.
- Slice 10 keeps `krn doctor` read-only. It can inspect memory governance
  schema tables, MemoryRepository read paths, package scripts, and forbidden
  runtime surfaces, but it must not run smoke commands or create memory proof
  records itself.
- Slice 10 reports memory governance runtime proof as `unverified` until there
  are durable MemoryCandidate, MemoryRecord, MemoryApplication, and AntiMemory
  records in the DB. The memory governance smoke remains self-cleaning and does
  not leave marker rows behind as runtime proof.
- Slice 11 uses live DB dogfood records, not smoke marker rows, as the runtime
  memory governance proof that doctor can read. Smoke remains a cleanup-tested
  verification command; dogfood records are the durable proof.
- Slice 11 does not invent a source claim for markdown runtime memory. Because
  the live source graph did not yet contain that claim, the anti-memory record
  cites `docs/KRN_KERNEL.md#runtime-truth` as source lineage and leaves source
  claim creation to a future explicit source-graph step.
- Slice 12 treats M23 as complete when the actual runtime/CLI behavior is
  proven, not when docs merely describe it. The final anti-rot uses live DB
  readiness and all smoke commands with cleanup proof.

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

Slice 01 skill record:

- `brain-store-schema`: used for Drizzle schema, generated SQL, migration
  inspection, enum/default risk, indexes, and FK decisions.
- `typescript-type-safety`: used for core memory status and activation
  candidate status boundary updates.
- `superpowers:test-driven-development`: used for RED/GREEN memory schema
  tests.
- `superpowers:systematic-debugging`: used after live `db:ready` exposed the
  Postgres enum/default migration issue.

Slice 02 skill record:

- `typescript-type-safety`: used for schema package parse-boundary changes and
  exported input types.
- `superpowers:test-driven-development`: used for RED/GREEN memory governance
  IO parser tests.

Slice 03 skill record:

- `brain-store-schema`: used for repository adapter lifecycle, transactional
  promotion, application feedback persistence, and mapper/read-model impact.
- `typescript-type-safety`: used for public core/harness type expansion and
  unknown JSON narrowing in mappers.
- `superpowers:test-driven-development`: used for RED/GREEN repository and
  mapper tests.

Slice 04 skill record:

- `brain-store-schema`: used for DB smoke lifecycle, linkage checks, cleanup
  scope, and repository-backed persistence proof.
- `typescript-type-safety`: used for the new smoke report and CLI target union.
- `superpowers:test-driven-development`: used for RED/GREEN DB export and CLI
  routing tests.

Slice 05 skill record:

- `brain-store-schema`: used for CLI-to-repository persistence boundaries and
  source-claim linkage checks.
- `typescript-type-safety`: used for strict CLI command parsing, source
  lineage normalization, and DatabaseRuntime expansion.
- `superpowers:test-driven-development`: used for RED/GREEN CLI preview and
  persist tests.
- `superpowers:verification-before-completion`: used before committing and
  pushing Slice 05.

Slice 06 skill record:

- `brain-store-schema`: used for repository-backed candidate review and
  source-claim limit readback.
- `typescript-type-safety`: used for CLI review command unions,
  DatabaseRuntime repository picks, and schema-parsed review input.
- `superpowers:test-driven-development`: used for RED/GREEN CLI promote and
  reject tests.
- `superpowers:verification-before-completion`: used before committing and
  pushing Slice 06.

Slice 07 skill record:

- `brain-store-schema`: used for MemoryFeedbackEvent repository insert and
  mapper/read-model impact.
- `typescript-type-safety`: used for core feedback-event type, repository port
  expansion, CLI command union, and schema-parsed application/feedback input.
- `superpowers:test-driven-development`: used for RED/GREEN CLI apply and
  repository method tests.
- `superpowers:verification-before-completion`: used before committing and
  pushing Slice 07.

Slice 08 skill record:

- `brain-store-schema`: used for AntiMemoryRecord CLI-to-repository persistence
  and source-claim linkage checks.
- `typescript-type-safety`: used for anti-memory CLI command unions,
  DatabaseRuntime repository picks, schema-parsed anti-memory input, and exact
  optional source lineage normalization.
- `superpowers:test-driven-development`: used for RED/GREEN CLI anti-memory
  tests.
- `superpowers:verification-before-completion`: used before committing and
  pushing Slice 08.

Slice 09 skill record:

- `evidence-review-loop`: used for evidence capture, FeedbackDelta proposal
  behavior, and no automatic memory mutation.
- `brain-store-schema`: used for the Postgres-backed FeedbackDelta persistence
  boundary and to keep MemoryRepository untouched.
- `typescript-type-safety`: used for the internal memory proposal type and
  strict `MemoryCandidate` materialization at the feedback delta boundary.
- `superpowers:test-driven-development`: used for RED/GREEN CLI evidence
  capture tests.
- `superpowers:verification-before-completion`: used before committing and
  pushing Slice 09.

Slice 10 skill record:

- `brain-store-schema`: used for memory governance readiness table checks and
  MemoryRepository read-path verification.
- `typescript-type-safety`: used for the new readiness report type, doctor
  check composition, and no-`any` CLI derivation.
- `superpowers:test-driven-development`: used for RED/GREEN doctor readiness
  tests.
- `superpowers:verification-before-completion`: used before committing and
  pushing Slice 10.

Slice 11 skill record:

- `source-to-decision`: used to map M22 SourceClaim
  `212815bc-477c-4985-8992-31825f5c5897` into a reviewed MemoryRecord with
  explicit `doesNotProve`.
- `evidence-review-loop`: used to record dogfood evidence, review, feedback,
  proof, and not-proven boundaries without automatic memory mutation.
- `brain-store-schema`: used to keep all dogfood runtime proof in Postgres
  MemoryRepository/HarnessRepository state.

Slice 12 skill record:

- `evidence-review-loop`: used to record anti-rot command evidence, remaining
  risk, and handoff state.
- `brain-store-schema`: used to verify DB readiness, smoke cleanup, and
  store-backed Memory Core proof.
