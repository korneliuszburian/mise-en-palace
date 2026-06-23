# Blockers

Hard blockers:

- QG-00 through QG-06 must run before MM-66/MM-67 feature work continues.
- Current test topology is not documented as a conscious repo decision.
- Current quality gates do not yet prove absence of zombie exports, dead code,
  stale public docs, broad barrel overexposure, test-helper runtime leaks, or
  placeholder adapters.
- MM-65 Promptfoo snapshot export must not be treated as final eval
  integration until QG-05 adopts or rejects official Promptfoo through
  source-to-decision.

Closed in MM-65:

- Pure harness Promptfoo-compatible snapshot export exists at
  `packages/harness/src/goldenPromptfooExport.ts`.
- Export emits deterministic snapshot-only tests with behavior proof status
  metadata.
- Export declares `promptfooDependency: "not_required"` and
  `doesNotExecuteModel: true`.
- No Promptfoo dependency, CLI command, DB schema/migration, repository, model
  execution, broad benchmark suite, dashboard/API/MCP/server/plugin, or source
  crawler surface was added.

Closed in MM-64:

- Pure harness GoldenTask runner emits pass/fail reports from validated task
  contracts plus explicit behavior proofs.
- Missing behavior proof fails, so fixture shape alone cannot pass.
- Contract-invalid GoldenTask fixtures fail even when a proof is supplied.
- No DB schema/migration, repository, CLI, Promptfoo export, broad
  benchmark suite, dashboard/API/MCP/server/plugin, or source crawler surface
  was added.

Closed in MM-60:

- File-backed GoldenTask fixtures were chosen as the initial strategy.
- `tests/fixtures/golden-tasks/memory-behavior.json` exists as a seed/test
  fixture, not runtime memory or Memory Core.
- `parseGoldenTaskFixtures` validates unknown fixture JSON at the schema
  boundary.
- Fixture loading is deterministic: tasks, cases, and protected failure modes
  are sorted by id.
- Shape-only fixtures without behavior expectations, source/evidence refs, and
  protected failure modes are rejected.
- DB-backed GoldenTask storage is deferred until a runner/promotion lifecycle
  proves it is needed.

Closed in MM-59:

- `GoldenTask`, `GoldenCase`, `ExpectedBehavior`, and
  `ProtectedFailureMode` exist as pure core contracts.
- `validateGoldenTaskContract` accepts behavior-focused golden cases and
  rejects artifact-theater cases that lack expected behavior evidence,
  protected failure modes, or source refs.
- GoldenTask metadata rejects private reasoning keys such as `chainOfThought`.
- No storage/fixture strategy, DB schema/migration, repository, runner, CLI,
  Promptfoo export, broad benchmark suite, dashboard/API/MCP/server/plugin, or
  source crawler surface was added.

Closed in MM-58:

- Feedback capture was dogfooded on persisted ExecutionRun
  `5db6c5aa-3fcf-48bd-b013-f732c7558e33`.
- Evidence capture persisted EvidenceBundle
  `4d2e3247-4469-45bc-99a3-0a4b4095110d`, generated one proposal-only memory
  candidate inside FeedbackDelta JSON, and did not create MemoryCandidate or
  MemoryRecord rows.
- `krn review assess --persist` now uses a narrow review-assess DB runtime
  instead of the broad workspace/project planning runtime.
- Manual review assess persisted ReviewAssessment
  `c6b0130d-c6d0-4db2-95b5-4076201eee4e` and FeedbackDelta
  `de8b97e3-1593-4f4c-891a-60c7a3df444c`.
- Review burden and diff risk were recorded as `medium`.
- FeedbackDelta metadata carries `memoryRecordMutation: "none"`.
- MemoryCandidate and MemoryRecord counts did not change.
- The raw research files under `docs/materials/` remain untracked dirty
  context and were not committed.

Closed in MM-57:

- `krn review assess` exists as a manual CLI command.
- The command validates external CLI input for review status, outcome, risk,
  and finding severity.
- `--persist` writes ReviewAssessment and FeedbackDelta through the existing
  harness repository.
- FeedbackDelta metadata carries `memoryRecordMutation: "none"`.
- The command output reports no Memory Core mutation and no MemoryRecord
  creation.
- No schema, DB migration, repository change, candidate row creation,
  MemoryCandidate creation, MemoryRecord creation, SourceDecision truth write,
  memory promotion, dashboard/API/MCP/server/plugin, or source crawler surface
  was added.

Closed in MM-56A:

- `docs/standards/code-vocabulary.md` exists as the KRN code vocabulary and
  TypeScript elegance standard.
- Helper verbs now have an explicit authority ladder.
- Proposal/candidate/review/final-truth terms are separated.
- `extractFeedbackCandidates` is documented as an anti-pattern for helpers that
  only summarize already structured candidate/proposal arrays.
- Package authority boundaries are tied to naming rules.
- No TypeScript source, schema, DB, repository, CLI, review assess command,
  candidate creation, Memory Core mutation, dashboard/API/MCP/server/plugin, or
  source crawler surface was added.

Closed in MM-56:

- `summarizeFeedbackCandidateProposals` exists as a pure core helper.
- Structured MemoryCandidate and EvalCandidate arrays are summarized without
  creating final records.
- Structured metadata proposal arrays for source-claim, anti-memory, and
  observation proposals are summarized when present.
- The summary reports `memoryRecordMutation: "none"`.
- No LLM extraction, freeform text mining, DB write, MemoryRecord creation,
  SourceDecision truth write, or candidate promotion was added.
- MM-56A was queued to define KRN code vocabulary and TypeScript elegance
  standards so helper names match actual authority.

Closed in MM-55:

- `assessEvidenceBundleRollbackPath` exists as a pure core helper.
- Docs-only evidence bundles do not receive rollback-specific findings when the
  rollback path is blank.
- Non-doc core/DB/runtime changes without rollback paths receive a finding.
- Non-doc changes with vague rollback prose receive a finding that asks for a
  concrete revert or recovery command.
- No schema, DB, repository, CLI integration, review assess command, candidate
  extraction, or Memory Core mutation surface was added.

Closed in MM-54:

- `scoreEvidenceBundleReviewRisk` exists as a pure core helper.
- Docs-only tested diffs score low risk and low review burden.
- Narrow tested core-domain diffs score medium risk and medium review burden.
- Broad DB/runtime diffs with failed required commands score high risk and high
  review burden.
- Scoring emits explicit reasons for reviewer audit.
- No schema, DB, repository, CLI integration, review assess command, rollback
  enforcement, candidate extraction, or Memory Core mutation surface was added.

Closed in MM-53:

- `normalizeReviewAssessment` exists as a pure core helper.
- `normalizeFeedbackDelta` exists as a pure core helper.
- ReviewAssessment and FeedbackDelta can produce stable outcome, review burden,
  diff risk, and correction labels from metadata.
- Missing metadata falls back to conservative status/finding/default labels.
- No schema, DB, repository, CLI, review assess command, candidate extraction,
  or Memory Core mutation surface was added.

Closed in MM-52:

- `assessEvidenceBundleCompleteness` exists as a pure core helper.
- Missing executionRunId, changedFiles, typecheck/test evidence, diffSummary,
  sourceRefs, reviewBurden, and rollbackPath are flagged.
- Failed required command evidence is flagged.
- No schema, DB, repository, CLI, or Memory Core mutation surface was added.

Closed in MM-51:

- Capability routing was dogfooded on persisted ExecutionRun
  `1c6dd716-3903-4d9f-b765-57c20019beff`.
- Read-only Codex brief readback now passes the persisted TaskContract to
  `createCapabilityPlan`, preserving task-text capability routing.
- Selected hints are small and auditable: source-to-decision,
  typescript-type-safety, test-driven-development, evidence-review-loop, and
  brain-store-schema.
- Codex invocation and Memory Core mutation remained absent.

Closed in MM-50:

- TypeScript boundary task text strengthens the `type_safety` capability
  requirement with unknown-first boundary and no-type-weakening evidence.
- Review-risk/diff-risk task text strengthens `evidence_capture` and
  `review_capture` with changed-file, diff-risk, and review-risk evidence.
- Routing remains CapabilityPlan-only; no storage, CLI, execution authority, or
  automatic skill/rule growth was added.

Closed in MM-49:

- CapabilityBindingCandidate and CapabilityBindingReview exist as pure core
  contracts.
- Proposed or unreviewed binding candidates are rejected by
  `assessCapabilityBindingCandidatePromotion`.
- Approved review requires reviewer, approved decision, and evidence reference.
- No storage, CLI, execution authority, or automatic skill/rule growth was
  added.

Closed in MM-48:

- Pure core binding contracts exist for SkillBinding, RulePackBinding,
  PolicyGateBinding, and ToolBoundaryBinding.
- Invalid bindings with blank names, blank reasons, or missing evidence are
  rejected by `validateCapabilityBindings`.
- Bindings remain plan artifacts only; no lifecycle storage, CLI, execution
  authority, or automatic skill/rule growth was added.

Closed in MM-47:

- CapabilityCompiler v1 derives additional schema/db requirements from memory,
  source, audit, schema, repository, migration, and Postgres task text.
- Memory/source/audit task fixtures now route to focused
  schema/db/source/evidence/review requirements.
- Codex adapter skill hints for those requirements include
  `brain-store-schema`, `source-to-decision`, and `evidence-review-loop`.
- TaskContract remains free of `requiredSkills`.

Closed in MM-46:

- CapabilityRequirement now carries explicit priority.
- CapabilityRequirement now carries binding kinds for later skill/rule/policy/
  tool binding work.
- CapabilityPlan remains the owner of capability binding needs.
- TaskContract remains free of `requiredSkills`.

Closed in MM-45:

- Activation dogfood compared one KRN memory implementation task before and
  after observation prefix.
- Without observation prefix, context abstained with `no_candidates`.
- With one source-ranged observation prefix item, context assembled as a
  metadata-only activation artifact.
- DB before/after counts proved no Memory Core, observation, or context table
  mutation during the comparison.

Closed in MM-44A:

- Context assembly rejects observation prefix metadata when any selected prefix
  item lacks source ranges.
- Rejected prefix metadata records `observationPrefixGate` with
  `missing_source_ranges` and rejected observation ids.
- A prefix-only context remains abstained when the prefix fails the source-range
  gate.
- Valid source-ranged prefix metadata from MM-44 remains attachable.

Closed in MM-44:

- Context assembly accepts a selected `ObservationPrefix` and persists it as
  rendered metadata.
- Observation prefix items carry `sourceRangeCount` so selected prefix items are
  auditable as source-ranged.
- A context with useful observation prefix items can assemble even with no
  memory/source/search inclusions; the prefix remains metadata, not a new
  MemoryRecord or `ContextSubjectType`.
- Activation smoke persists and reports `Observation prefix items: 1`.

Closed in MM-43:

- Raw evidence recall trigger helper marks exact-proof and low-trust included
  activation candidates.
- Activation inclusion decisions carry raw recall requirement metadata when a
  trigger exists.
- Retrieval run metadata summarizes raw evidence recall triggers.
- Activation smoke persists and reports `Raw evidence recall triggers: 1`.

Closed in MM-42:

- ContextROI deduplicates by canonical source or memory subject before final
  budget selection.
- ContextROI can preserve requested memory/source/search diversity before
  filling remaining budget by raw score.
- Duplicate, low-ROI, and over-budget candidates stay visible as explicit
  exclusions for context assembly and audit.
- Activation smoke now uses the diversity-aware ContextROI policy.

Closed in MM-41:

- `applyActivationFilters` composes anti-memory conflict detection, trust
  filtering, and temporal/invalidation filtering as one pure post-merge pass.
- Activation smoke now calls the unified filter pass.
- Merged source/search candidates blocked by anti-memory keep linked search
  metadata while being excluded.
- Expired memory is stale and low-confidence memory is low_trust through the
  same pass.

Closed in MM-40:

- Hybrid candidate merge deduplicates linked source/search candidates by
  canonical SourceClaim id.
- Merge preserves lexical/vector/graph/temporal/context ROI/feedback score
  channels, merged candidate ids, merged kinds, and search document ids.
- Activation retrieval returns merged candidates before downstream filters.
- Activation smoke readback now treats merged search document ids as
  search-backed candidates.

Closed in MM-39:

- ActivationQuery now carries task/project scope, focus, memory/source/
  observation needs, budget, risk, text, and query terms.
- `buildActivationQuery` exists as a pure harness builder over TaskContract.
- Memory/source query builders preserve focused defaults through the unified
  query builder.

Closed in MM-38:

- Source-to-decision dogfood run persisted a SourceClaim with mechanism,
  doesNotProve, falsifier, trust, support type, consumer, and run linkage.
- Source-to-decision dogfood run persisted a SourceDecisionEdge to the same
  harness run.
- DB proof shows one run source claim and one run source decision edge for the
  MM-38 dogfood execution run.

Closed in MM-37:

- Source graph health audit flags decorative SourceClaim support types.
- Source graph health audit flags stale accepted SourceClaims using
  `revisitWhen`.
- Source graph health audit flags accepted SourceClaims without SourceDecision
  links.
- Source graph health audit flags SourceDecisions referencing
  rejected/deprecated SourceClaims.

Closed in MM-36:

- Source trust tiers have deterministic ranks for source governance policy.
- A newer weak SourceClaim cannot override stronger current consensus without
  an explicit override reason.
- Stale consensus marked by `revisitWhen` can be challenged without being
  treated as current stronger consensus.

Closed in MM-35:

- Public `krn source decision link --persist` rejects rejected/deprecated
  SourceClaims before edge creation.
- `DrizzleSourceRepository.createSourceDecisionEdge` rejects rejected/deprecated
  SourceClaims at the repository boundary.
- Rejected sources remain explicit `source_rejections` records and cannot later
  become decision support without a new accepted SourceClaim.

Closed in MM-34:

- SourceClaim IO now requires `falsifier`.
- SourceClaim repository writes require claim, mechanism, krnImplication,
  doesNotProve, trustTier, non-decorative supportType, consumer, and falsifier.
- SourceDecisionEdge repository writes reject decorative support types and blank
  target/notes.
- SourceDecision `adopt` and `reject` writes require a linked SourceClaim.
- Source graph, activation, and codex-adapter DB smokes remain green after
  legacy negative fixtures were converted to decision-grade rejection/risk
  source records.

Closed in MM-33:

- One reviewed KRN lesson was promoted through MemoryReviewGate.
- Promoted MemoryRecord `41d1a2ef-3578-4e45-947f-42c6739796de` has source
  lineage, linked SourceClaim, application guidance, confidence, owner,
  invalidation rule, review-gate metadata, and MemoryRecordVersion evidence.
- A later matching plan selected the promoted memory into context.
- MemoryApplication `55a8e695-8665-45da-a19e-b8be578708ea` records outcome
  `helped`.

Closed in MM-32B:

- Audit CLI consumes explicit intended files and verification command states.
- Audit CLI can load persisted AuditBundle evidence by `--audit-bundle-id`.
- Audit CLI can read DB-backed semantic snapshots for memory/source/eval/
  observation/activation state when project/retrieval IDs are supplied.
- Audit reports expose semantic snapshot counts instead of implying file scans
  are semantic memory governance proof.
- `--fail-on warning` exists for CI-style slice gates.

Closed in MM-32:

- Memory health audit flags stale high-confidence memory.
- Memory health audit flags active memory without lineage/source-claim support.
- Memory health audit flags active memory with no application feedback.
- Memory health audit flags missing application guidance and temporal memory
  without invalidation strategy.
- The audit remains snapshot-level; DB-backed audit ingestion is intentionally
  MM-32B.

Closed in MM-31:

- Context assembly now records `activationAbstention` metadata when it abstains.
- Weak low-trust memory support produces `reason: weak_context` instead of only
  a bare `status: abstained`.
- Abstention metadata remains a review/audit signal and does not mutate Memory
  Core or pad context with weak candidates.

Closed in MM-30A:

- Anti-memory now blocks linked search-document candidates when metadata carries
  explicit `sourceClaimId` or `memoryRecordId` matches.
- Anti-memory now blocks observation prefix items when the observation id or
  subject matches anti-memory `key` or `appliesTo`.
- The expansion remains explicit-ID/key based; fuzzy matching is intentionally
  not built.

Closed in MM-30:

- Anti-memory blocks explicit memory-record candidates by subject id, memory
  key, anti-memory key, or `appliesTo`.
- Blocked memory candidates carry anti-memory conflict metadata and conflict
  sets.

Closed in MM-29A:

- Active memory with repeated negative feedback now creates a blocking audit
  health finding.
- The finding requires review action and does not auto-invalidate memory.

Closed in MM-29:

- Negative memory application feedback affects activation ranking.
- Activation candidate metadata exposes feedback counters and penalty.
- Feedback is no longer only a passive DB counter.

Closed in MM-28:

- `invalidateMemoryRecord` exists at repository boundary.
- Live memory-governance smoke proves invalidated memory is excluded from active
  memory.
- Live memory-governance smoke proves the MemoryRecordVersion remains present
  after invalidation.

Closed in MM-27:

- MemoryReviewGate exists in harness.
- Public `krn memory candidate promote --persist` requires
  `--evidence-reviewed-ref` and passes through MemoryReviewGate.
- Missing raw evidence review reference and missing linked SourceClaim block
  promotion before low-level repository promotion.

Closed in MM-26A:

- Public `krn memory candidate promote --persist` no longer enters DB runtime.
- Public promote reports that MemoryReviewGate is required and no MemoryRecord
  is created.
- Low-level repository promotion remains internal DB/smoke infrastructure only.

Closed in M27:

- Target repo fixture exists and has no forbidden KRN runtime surfaces.
- `krn init --dry-run --repo <fixture>` is proven read-only.
- `krn init --connect --repo <fixture> --persist` is proven with Project,
  RepoInstallation, and ProjectKernel create/reuse behavior.
- `pnpm db:smoke:init-connect` is proven with readback, idempotency, and
  cleanup count `0`.
- `krn plan --project <project-id> --task "improve test script readiness" --persist`
  is proven with explicit Project lookup, ProjectKernel loading, repo
  installation metadata, and no fallback to the default project when explicit
  project lookup fails.
- `pnpm db:smoke:target-repo-harness` is proven with project-scoped persisted
  plan, Codex brief rendering, evidence/review/feedback persistence, target
  project linkage, and cleanup count `0`.
- `krn doctor` target repo readiness is proven.
- M27 anti-rot is proven.

Residual later scope:

- Real external repo mutation is not built.
- Fixture overlay apply mode is not built.
- Production worker leasing/claim/retry execution is not built.
- Actual maintenance jobs are not executed.
- Codex is not invoked by KRN.
- MCP server is not built.
- API and dashboard are not built.
- Source crawler/research layer is not built.
- Broad eval/benchmark suite is not built.
- Plugin packaging is not built.
- Observational memory staging is built and dogfooded through MM-17F.
- Reflection staging is built through MM-25.
- Governed promotion via MemoryReviewGate is built through MM-27.
- Explicit anti-memory blocking is built for source claims, memory records,
  linked search documents, and observation prefix items.
- Snapshot-level memory health audit is built for unhealthy Memory Core
  records.
- Golden proof remains planned later work in
  `docs/plans/memory-ideal-state/PLAN.md`.
- Public memory promotion without MemoryReviewGate/evidence review reference is
  intentionally blocked.

Explicit non-blockers:

- No dashboard UI exists by design.
- No API exists by design.
- No MCP server exists by design.
- No source crawler or research layer exists by design.
- No `.krn` runtime truth exists by design.
- No separate vector, graph, search, or queue store exists by design.
- No runtime markdown memory exists by design.
- No broad eval suite exists by design.
- Direct dogfood activation abstained for the empty fixture context. This is
  expected gap-aware behavior, not a blocker.
