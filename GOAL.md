# Controlled Goal Prompt — Execute KRN Memory Brain PLAN.md

You are working in the KRN repository.

Goal:
Execute the checked-in plan at:

    docs/plans/memory-ideal-state/PLAN.md

This is a controlled ExecPlan-style run. Read the entire PLAN.md first. Then continue from the first unchecked Progress item. Do not ask the user for next steps unless the plan is blocked by missing credentials, missing repo state, destructive approval, or an explicit ambiguity that cannot be resolved from repo evidence.

Current known status:
- M27 is complete.
- MM-00 through MM-44A and MM-16R are complete.
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
MM-44A — Observation prefix integration gate.

If PLAN.md is not present yet:
- create docs/plans/memory-ideal-state/PLAN.md using the provided controlled Memory Brain plan content;
- update GOAL.md/MM-ROADMAP.md/DECISIONS.md/REJECTIONS.md/FALSIFIERS.md to align with it;
- keep this as docs-only;
- verify staged-docs-only;
- commit:
      docs(memory): add controlled memory brain execution plan

Do not implement observational memory runtime until the plan’s audit/foundation slices have been completed or the plan explicitly reaches those slices.
