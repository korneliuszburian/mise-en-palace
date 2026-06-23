# Controlled Goal Prompt — Execute KRN Memory Brain PLAN.md

You are working in the KRN repository.

Goal:
Execute the checked-in plan at:

    docs/plans/memory-ideal-state/PLAN.md

This is a controlled ExecPlan-style run. Read the entire PLAN.md first. Then continue from the first unchecked Progress item. Do not ask the user for next steps unless the plan is blocked by missing credentials, missing repo state, destructive approval, or an explicit ambiguity that cannot be resolved from repo evidence.

Current known status:
- M27 is complete.
- MM-00 through MM-65, MM-16R, QG-00, QG-01, QG-02, QG-03, QG-04, QG-04A,
  QG-04B, QG-04C, QG-04D, QG-04E, QG-04F, and QG-04G are complete.
- QG-00 repo-wide current-state inventory is recorded at
  `docs/plans/memory-ideal-state/QG-00-REPO-INVENTORY.md`.
- MM-00 commit: 80f9ef9 docs(memory): add observational memory ideal-state ADR and ledger.
- The observational memory staging substrate is implemented through MM-16:
  core contracts, IO schemas, DB schema, repository adapter, evidence/source
  range linkage, deterministic observer input builder, manual observe-run CLI,
  source-range policy matrix, and pure observation prefix selector.
- Observational memory is not proven end-to-end yet: activation integration and
  golden behavior proof are next.
- Observation is still staging, not Memory Core.
- Reflection runtime exists as manual preview/persist CLI and writes
  ReflectionRecord only; candidate row creation, memory invalidation/demotion,
  broad anti-memory enforcement, and golden memory behavior proof are not built
  yet.
- Public `krn memory candidate promote --persist` now requires
  MemoryReviewGate via `--evidence-reviewed-ref`; low-level repository
  promotion remains internal DB/smoke infrastructure.
- Memory invalidation exists at repository/runtime smoke level:
  `invalidateMemoryRecord` marks records invalidated, active-memory listing
  excludes them, and existing versions remain auditable.
- Memory feedback now affects activation ranking: negative application feedback
  penalizes memory candidates instead of remaining a passive counter.
- Active memory with repeated negative feedback now surfaces a blocking audit
  finding instead of silently remaining trusted.
- Anti-memory enforcement now blocks explicit memory-record candidates by
  memory key/appliesTo as well as source claims.
- Anti-memory expansion now blocks linked search documents and observation
  prefix items through explicit IDs/keys.
- Memory activation now records explicit abstention metadata when all available
  memory/source/search context is weak, unsafe, stale, over budget, or absent.
- Memory health audit now flags stale high-confidence memory, active memory
  without lineage, no application feedback, missing application guidance,
  temporal records without invalidation strategy, and high negative feedback.
- Audit CLI now consumes explicit slice intended files/verification commands,
  AuditBundle evidence, and DB-backed semantic snapshots for memory/source/eval/
  observation/activation state; `--fail-on warning` is available for CI-style
  slice gates.
- MM-33 promoted one reviewed KRN lesson through MemoryReviewGate into
  MemoryRecord `41d1a2ef-3578-4e45-947f-42c6739796de`, then a later matching
  plan included that memory in context and recorded a helped MemoryApplication.
- MM-34 hardened SourceClaim / SourceDecisionEdge write boundaries: SourceClaim
  IO now requires `falsifier`, decorative support types are rejected for source
  claims and decision edges, and `adopt`/`reject` SourceDecision writes require
  a linked SourceClaim.
- MM-35 hardened the source rejection support boundary: rejected/deprecated
  SourceClaims cannot support new SourceDecisionEdge writes through public CLI
  or repository adapter paths.
- MM-36 added deterministic source trust ranking and temporal override
  assessment: newer weak SourceClaims cannot override stronger current
  consensus without explicit reason, while stale consensus can be challenged
  through the same policy helper.
- MM-37 broadened source graph health audit: semantic source snapshots now
  catch decorative support types, stale accepted claims, accepted claims with
  no SourceDecision, and decisions still referencing rejected/deprecated
  claims.
- MM-38 dogfooded source-to-decision on the MM-37 implementation decision:
  SourceClaim `d5ea7024-7d7a-4291-a050-4de1fbebf605` and SourceDecisionEdge
  `a343ebef-2951-4ba6-b0d7-8eb3af586509` are linked to ExecutionRun
  `bba64c9a-eb96-47b7-819a-93937e6d8c5d`.
- MM-39 added a pure ActivationQuery model and builder for task/project scope,
  memory/source/observation needs, budget, risk, text, and query terms.
- MM-40 added hybrid candidate merge so linked search results can enrich
  canonical source/memory candidates while preserving lexical/vector/graph
  signals and avoiding duplicate context candidates.
- MM-41 added a pure activation filter pass for anti-memory conflict detection,
  trust filtering, and temporal/invalidation filtering after candidate merge.
- MM-42 hardened ContextROI selection with canonical dedup, requested
  memory/source/search diversity, and explicit duplicate/over_budget/
  low_context_roi exclusions.
- MM-43 added raw evidence recall triggers for exact-proof and low-trust
  inclusions and persists them into activation trace metadata.
- MM-44 integrated the hardened observation prefix selector into context
  assembly metadata as a small source-ranged activation artifact.
- MM-44A added an assembly-side observation prefix gate: prefix metadata is
  rejected if any selected item lacks source ranges, and a prefix-only context
  remains abstained in that case.
- MM-45 dogfooded activation before/after observation prefix on one KRN memory
  implementation task and proved DB counts did not change for Memory Core,
  observations, or context assemblies during the comparison.
- MM-46 hardened CapabilityRequirement/CapabilityPlan domain fields with
  explicit priority and binding kinds while keeping TaskContract free of
  `requiredSkills`.
- MM-47 added CapabilityCompiler v1 task-text routing so memory/source/audit
  tasks receive focused schema/db/source/evidence/review requirements and Codex
  skill hints.
- MM-48 added pure core binding models for skills, rule packs, policy gates,
  and tool boundaries with invalid-binding validation.
- MM-49 added pure core capability binding candidate/review contracts and a
  promotion assessment gate requiring approved review with evidence.
- MM-50 routed TypeScript boundary and review-risk task text to focused
  capability requirements for unknown-first/no-type-weakening and diff-risk/
  review-risk evidence.
- MM-51 dogfooded capability routing on a persisted KRN memory implementation
  task and fixed read-only Codex brief readback so it preserves task-text
  capability routing from the persisted TaskContract.
- MM-52 added pure core EvidenceBundle completeness assessment for execution
  run linkage, changed files, typecheck/test evidence, diff summaries, source
  references, review burden, rollback path, and failed required commands.
- MM-53 added pure core normalization for ReviewAssessment and FeedbackDelta
  review signals: outcome, review burden, diff risk, and correction labels.
- MM-54 added pure core EvidenceBundle review-risk scoring v1 so docs-only
  tested diffs score low, narrow core diffs score medium, and broad DB/runtime
  diffs with failed required commands score high.
- MM-55 added pure core EvidenceBundle rollback-path enforcement for non-doc
  changes, requiring concrete revert or recovery commands while exempting
  docs-only diffs.
- MM-56 added pure core FeedbackDelta candidate-proposal summary over already
  structured candidate/proposal fields, with explicit `memoryRecordMutation:
  "none"` and no LLM extraction or Memory Core mutation.
- MM-56A added KRN code vocabulary and TypeScript elegance rules so helper
  names match actual authority and avoid over-powered wording.
- MM-57 added `krn review assess`, which writes ReviewAssessment and
  FeedbackDelta records through the existing harness repository and does not
  create MemoryCandidate or MemoryRecord rows.
- MM-58 dogfooded feedback capture on one KRN slice, recorded proposal-only
  candidate generation, review burden/diff risk capture, and no Memory Core
  mutation.
- MM-59 added pure GoldenTask domain contracts for behavior-focused golden
  cases and protected failure modes.
- MM-60 chose file-backed GoldenTask fixtures for the initial strategy and
  added schema-owned deterministic fixture parsing.
- MM-61 added memory behavior golden cases and fixture-backed harness tests for
  source-linked memory, stale/weak abstention, temporal validity, and
  application guidance.
- MM-61-lite added early golden smoke cases for stale memory abstention,
  explicit anti-memory blocking, and unsupported SourceDecision rejection.
- MM-62 added context/source/audit/TS boundary golden cases for broad context
  dump rejection, source `doesNotProve`, forbidden surface audit, and
  unknown-first boundary enforcement.
- MM-63 added observation/reflection/anti-memory golden cases for observation
  staging, reflection candidate-only output, anti-memory prefix blocking, and
  visible gap reports.
- MM-64 added a pure harness GoldenTask runner that emits pass/fail reports
  from validated task contracts plus explicit behavior proofs.
- MM-65 added a pure harness Promptfoo-compatible snapshot export for
  GoldenTask cases, with no Promptfoo dependency and no model execution.
- QG-04 recorded the repo-wide smell/bloat audit and converted findings into
  repair slices QG-04A through QG-04H.
- QG-04A consolidated CLI filesystem and JSON boundary helpers.
- QG-04B modularized command-family parsing so `parseArgs.ts` no longer owns
  every command grammar directly.
- QG-04C modularized `krn doctor` so `runDoctorCommand.ts` is now
  orchestration/rendering only.
- QG-04D consolidated MemoryCandidate and AntiMemory CLI confidence parsing.
- QG-04E consolidated schema metadata/text/list primitives and private
  reasoning metadata guards.
- QG-04F consolidated review status/outcome/risk vocabulary across core and
  CLI review-assess parsing.
- QG-04G split memory-domain DB row mapping out of the mixed repository
  mapper file while preserving the legacy mapper import surface.
- QG-04H, then QG-05 through QG-06, remain queued as the blocking quality
  correction gate: smell scan automation requirements, official Promptfoo
  integration decision, and audit automation.
- The plan intentionally removes Research Foundry, Pattern Vault, meta-researcher runtime, and autoresearch product behavior.
- Cookbook patterns are process/eval mechanics only, not product architecture.
- Golden memory behavior tests are allowed inside normal eval lane.
- No broad research/pattern subsystem may be created.

Operating rules:
1. Read docs/plans/memory-ideal-state/PLAN.md from top to bottom.
2. Identify the first unchecked slice in the Progress section.
3. Before editing, inspect:
       git status --short
       git log --oneline -5
       pnpm typecheck
       pnpm test
4. State the slice ID, objective, intended touched files, and non-goals in the plan or slice notes before making changes.
5. Implement only that slice. Keep the change thin and vertical.
6. Do not create forbidden surfaces:
       Research Foundry package
       Pattern Vault package
       research CLI
       pattern inspect/promote CLI
       runtime markdown memory
       .krn runtime truth
       dashboard UI before read models
       MCP/API server before boundary slice
       separate vector/graph DB
       Redis/Kafka
       broad worker daemon
       broad eval suite
       source crawler
       hidden chain-of-thought storage
7. Preserve package boundaries:
       packages/core is pure
       packages/schema owns Zod IO schemas
       packages/db owns Drizzle/migrations/repositories
       packages/harness owns activation/compiler
       packages/codex-adapter owns Codex-specific rendering
       packages/cli owns terminal/filesystem/shell adapter behavior
8. Do not weaken TypeScript safety to pass tests.
9. Treat external input as unknown until parsed by schemas.
10. Observation is not MemoryRecord.
11. Reflection creates candidates only; it cannot mutate Memory Core.
12. Memory requires lineage, confidence, owner, application guidance, and invalidation/validity strategy when temporal.
13. Anti-memory is first-class.
14. Evals must protect real behavior, not artifact theater.
15. Do not store private chain-of-thought. Audit/self-review summaries must be concise, reviewable findings only.

Verification for every slice:
- pnpm typecheck
- pnpm test
- git diff --check
- forbidden surface/dependency scan
- staged scope check

If DB/migrations are touched:
- pnpm db:ready
- existing DB smokes relevant to the slice

After implementation:
1. Update PLAN.md:
       Progress
       Surprises & Discoveries if relevant
       Decision Log if any decision changed
       Outcomes & Retrospective at gate boundaries
2. Produce/update AuditBundle or compact handoff once that layer exists.
3. Record verification output concisely.
4. Commit only when verification and scope checks pass.
5. Use a commit message matching the slice, for example:
       docs(memory): replace roadmap with controlled memory brain plan
       feat(core): add audit bundle domain contract
       feat(core): add observation domain contracts
6. After commit, continue to the next unchecked slice only if the plan and repository state make it safe. If blocked, stop with a compact handoff containing:
       last good commit
       changed files
       verification results
       blocker
       rollback path
       next safest action

First expected slice for a fresh run at this state:
QG-00 — repo-wide current-state inventory refresh.

If PLAN.md is not present yet:
- create docs/plans/memory-ideal-state/PLAN.md using the provided controlled Memory Brain plan content;
- update GOAL.md/MM-ROADMAP.md/DECISIONS.md/REJECTIONS.md/FALSIFIERS.md to align with it;
- keep this as docs-only;
- verify staged-docs-only;
- commit:
      docs(memory): add controlled memory brain execution plan

Do not implement observational memory runtime until the plan’s audit/foundation slices have been completed or the plan explicitly reaches those slices.
