 ---
  KRN mise-en-palace — Health Audit

  Executive verdict

  The repo is genuinely well-typed and unusually honest in its own docs, but it is ~40–50% speculative 
  scaffolding for features that do not exist. The strictness is real (tsconfig.base.json is maximally
  strict; any is essentially zero in source). The problem is not type safety — it is speculative 
  generality on an industrial scale: half the DB tables have no read path, the @krn/workers package has
  no runtime, the @krn/schema package is 90% redundant, an entire policy.ts module and an
  evidence-review surface in @krn/core have zero consumers, and the flagship "brain-battle smoke" eval
  is 43 doc-prose sentinels plus exactly one real behavior test. The continuous-execution ledger
  (PLANS.md, 2,529 lines, 57 micro-"Outcome" sections) and 594-file / 136k-LOC docs/ tree document
  every micro-slice in lavish detail while the current "active task" is adding one test file at a time
  to a typecheck whitelist. This is a system that has optimized for recording progress over shipping
  capability.

  ---
  1) High-level architecture and intent

  Stated intent: KRN is a "Codex Operating Layer" — Codex (or an LLM) executes; KRN supplies bounded
  context, store-backed memory, source grounding, policy, eval expectations, review gates, and
  feedback. Seven packages:

  ┌────────────────────┬────────────┬──────────────────────────────────┬──────────────────────────┐
  │      Package       │    LOC     │       Real responsibility        │         Verdict          │
  │                    │ (src/test) │                                  │                          │
  ├────────────────────┼────────────┼──────────────────────────────────┼──────────────────────────┤
  │                    │ 4.2k /     │ Domain contracts: plans,         │ Real, but ~40% dead      │
  │ @krn/core          │ 2.1k       │ activation, memory, source,      │ surface                  │
  │                    │            │ evidence, golden tasks, IDs      │                          │
  ├────────────────────┼────────────┼──────────────────────────────────┼──────────────────────────┤
  │                    │ 1.6k /     │                                  │ Redundant — IDs live in  │
  │ @krn/schema        │ 1.3k       │ "Shared types/contracts/IDs"     │ core; only ~16 of ~160   │
  │                    │            │                                  │ exports used             │
  ├────────────────────┼────────────┼──────────────────────────────────┼──────────────────────────┤
  │                    │ 13.4k /    │ Postgres/pgvector brain-store:   │                          │
  │ @krn/db            │ 2.4k       │ schema, migrations, repos,       │ ~40–50% speculative      │
  │                    │            │ readiness                        │                          │
  ├────────────────────┼────────────┼──────────────────────────────────┼──────────────────────────┤
  │                    │ 9.1k /     │ Fixtures, smoke tests,           │ One real falsifier; rest │
  │ @krn/harness       │ 10.2k      │ "brain-battle" eval,             │  is doc-lint + zombies   │
  │                    │            │ proof-boundary manifest          │                          │
  ├────────────────────┼────────────┼──────────────────────────────────┼──────────────────────────┤
  │                    │ 2.1k /     │                                  │ No runtime exists — only │
  │ @krn/workers       │ 1.9k       │ "Background jobs"                │  preview/readback        │
  │                    │            │                                  │ builders                 │
  ├────────────────────┼────────────┼──────────────────────────────────┼──────────────────────────┤
  │ @krn/codex-adapter │ 0.9k /     │ Renders the Codex ExecutionBrief │ Real, vendor-neutral,    │
  │                    │ 0.9k       │                                  │ mildly bloated           │
  ├────────────────────┼────────────┼──────────────────────────────────┼──────────────────────────┤
  │ @krn/cli           │ 27.6k /    │ All user-facing commands + smoke │ Far too large — inlines  │
  │                    │ 17.4k      │  + doctor                        │ ~7k LOC of domain logic  │
  └────────────────────┴────────────┴──────────────────────────────────┴──────────────────────────┘

  How they fit (intended vs actual):
  - Intended: core/schema define contracts → db persists → workers execute background jobs → harness
  evaluates → codex-adapter renders briefs → cli is a thin shell.
  - Actual: cli is a 27.6k-LOC monolith that reimplements brain-search ranking, run-read-model
  projection, source-artifact extraction, doctor readiness policy, and project-resolution policy
  instead of calling the kernel. workers has no executor, so "background execution" is contract types
  only. db has 45 tables but only ~16 have a real writer+reader outside the package. The kernel
  packages (core/schema/workers) are partially decorative — cli and db carry most of the real logic.

  Notable honesty (credit, with evidence): README "Built But Not Proven End-To-End" and "Not Built"
  sections are candid; packages/harness/src/evalProofBoundaryManifest.ts canonicalizes what each gate
  does not prove; workers/jobTypes.ts:86-87 explicitly labels idempotency/memory-core-gate as
  "not_enforced." This self-awareness is a genuine strength — the repo knows much of itself is
  aspirational. The failure is that it keeps building the aspirational surface anyway instead of
  deleting it.

  ---
  2) Issue catalog (by category)

  A. SNIFFY (smells / over-abstraction)

  - packages/harness/src/evalProofBoundaryManifest.ts renderEvalProofBoundaryReadback —
  document-as-code renderer whose only consumer is its own test. The manifest array + its
  package.json/CI-alignment tests have real teeth; the renderer is decorative. Risk: Low. Fix: delete 
  the renderer + its test block.
  - packages/codex-adapter/src/renderExecutionBrief.ts (463 LOC) — computes reserved MCP/subagent
  headings then strips the empty ones ("omits empty MCP/subagent reserved headings"). Building
  structure only to remove it is a sign the section model is over-specified. Risk: Low. Fix: only emit 
  sections that have content.
  - .agents/skills/ — 11-skill zoo (activation-engine, brain-store-schema, codex-adapter-plan,
  evidence-review-loop, handoff-compact, source-to-decision, target-infra-adr, typescript-type-safety,
  target-repo-testing, beads). Referenced in docs (e.g. source-to-decision 234 doc refs) but none are 
  runtime-load-bearing — they are agent prompt scaffolding. A parallel "knowledge" layer outside the
  typed kernel. Risk: Low–Med. Fix: treat as docs, not architecture; don't let skill vocabulary leak 
  into code contracts.
  - Vocabulary overload: "Contract" and "Gate" (packages/core/src/): TaskContract (real, 28 consumers),
  validateGoldenTaskContract (a validator, misnamed), EvidenceContract; "Gate" spans a live
  ContextObservationPrefixGate and a fully-dead PolicyGate axis. Risk: Low. Fix: rename
  validateGoldenTaskContract → validateGoldenTask; reserve "Gate" for enforced gates.
  - Single-interface files in core/src/observations/ (ObservationScope.ts, ObservationTemporalScope.ts,
  ObservationGroup.ts, ~14 LOC each). Risk: Low. Fix: collapse into observations/types.ts.

  B. ZOMBIE (dead / unused / unreachable)

  - packages/core/src/policy.ts — entire module is a phantom. Exports PolicyGate, PolicyGateResult,
  PolicyGateKind, ToolBoundary. 0 external importers. The only use is capabilityPlan.ts:208 pushing the
  literal string "weak-context-abstention" into policyGateIds: string[], which nothing ever reads. Any
  doc invoking "policy gates" as a control describes code that does not run. Risk: High. Fix: delete 
  policy.ts; remove policyGateIds.
  - @krn/schema is ~90% zombie. ~160 exported symbols; only ~18 consumed externally (16 are parse*Input
  parsers used by cli+db only). harness and workers import zero. Modules retrieval.ts (whole file),
  reflection.ts, observation.ts are effectively dead; 9 of 10 modules hand-restate fields/enums that
  already exist in core and are kept in sync manually. Risk: High. Fix: fold the 16 parsers into core; 
  delete the package.
  - @krn/db — ~15 pure-zombie tables + ~13 write-only tables (out of 45). Pure zombies (no insert
  anywhere): memory_edges, memory_record_versions, memory_feedback_events, memory_activation_traces, 6
  observation_* tables, source_chunks, source_decision_edges, source_rejections, context_items,
  context_exclusions. Migration 0014 (the latest) adds 20 CHECK constraints to 
  memory_edges/memory_record_versions/anti_memory_* — tables with zero repository code. The most recent
  migration polishes constraints on ghosts. Risk: High. Fix: revert 0014; drop zombie tables until a
  consumer exists.
  - packages/db/src/repositories/DrizzleObservationRepository.ts (966 LOC) + 6 observation tables —
  only outside reference is cli/src/databaseRuntime.ts (DI instantiation). No cli/core/harness/workers
  code creates observations. An island. Risk: High. Fix: delete the observation subsystem until the 
  feature ships.
  - packages/harness/src/recipes/ (drift.ts + test, ~335 LOC) — 0 external references; only its own
  test. Risk: Low. Fix: delete.
  - packages/harness/src/eval/ subpath export + goldenPromptfooExport.ts/goldenPromptfooResult.ts —
  grep "@krn/harness/eval" = 0 importers. Dead public export surface. Risk: Med. Fix: remove the ./eval
  export + files.
  - packages/harness/src/audit/ — empty directory (0 bytes). Risk: Low. Fix: rmdir.
  - packages/harness/src/reflection/reflectionCandidateWriter.ts — write-back half unwired; CLI
  runReflectCommand uses the input selector but not the writer. Risk: Low–Med. Fix: delete until wired.
  - Dead validators in @krn/core:
  assessEvidenceBundleCompleteness/assessEvidenceBundleRollbackPath/scoreEvidenceBundleReviewRisk
  (evidenceBundle.ts:651/692/710), normalizeReviewAssessment (reviewAssessment.ts:51),
  validateCapabilityBindings/assessCapabilityBindingCandidatePromotion (capabilityPlan.ts:111/139),
  assessSourceDecisionReviewSignals (source.ts:613). All 0 production callers. Risk: Med–High. Fix: 
  delete, or wire assessSourceDecisionReviewSignals (see LOGIC FLAWS).
  - packages/core/src/ids.ts — 6 branded IDs forward-declared for an unbuilt retrieval layer:
  SearchDocumentId, EmbeddingModelId, EmbeddingId, RetrievalRunId, RetrievalCandidateId,
  ActivationDecisionId (no matching interfaces exist). Risk: Low. Fix: delete until the layer exists.
  - .local-lab/ versioned dirs v321…v329 + alpha-candidate, alpha-tag-clone, etc. — accumulated lab
  state under git (per .gitignore?). Risk: Low. Fix: confirm gitignored; prune stale lab dirs.

  C. LOGIC FLAWS

  - Asymmetric source-trust enforcement. "MemoryReviewGate requires accepted SourceClaims" is
  code-enforced (packages/harness/src/memory/reviewGateSupport.ts:132-140, throws on non-accepted). But
  the analogous "SourceDecision must not rely on rejected/deprecated SourceClaim" (source.ts:653-658)
  has no enforcer, even though assessSourceDecisionReviewSignals exists for exactly this — uncalled.
  Two halves of the same trust model; one enforced, one not. Risk: High. Fix: wire
  assessSourceDecisionReviewSignals into the SourceDecision path, or delete it and stop claiming the
  invariant.
  - @krn/workers write-authority contracts describe a runtime that does not exist. jobTypes.ts:190-216
  declares allowedWritesByMemoryCoreGate/requiredWritesByMemoryCoreGate as satisfies Record<...> const
  tables — a type-level authorization model for a job executor. There is no executor (no setInterval,
  no claimJob/processJob, no while). jobTypes.ts:86-87 admits idempotency: 
  "key_pattern_only_not_enforced" and memoryCoreGate: "declaration_only_not_runtime_enforced". So
  "Memory Core write authority" (a PLAN.md headline checkpoint) is a typed assertion with zero runtime
  effect. Risk: High. Fix: either build a minimal executor that consults these tables, or delete them
  and re-label the package @krn/worker-contracts.
  - DB readiness checks assert almost nothing. memoryGovernanceReadiness.ts:70-80 etc. set
  "reachable=true" because getMemoryRecordById(ZERO_UUID) didn't throw (a missing-row lookup returning
  undefined only proves the connection opens). The smokes return giant report objects whose only
  failure signal is a thrown error on exact-id mismatch; most paths log-and-continue. Risk: Med. Fix: 
  round-trip insert+read+constraint-violation per live table; fail on count=0 for supposedly-populated 
  tables.
  - CI does not cover most DB smoke variants. .github/workflows/ci.yml runs only the base db:smoke. The
  12 other variants (brain-loop, heartbeat-worker-authority, codex-adapter, worker-jobs, source-graph,
  memory-governance, …) are not in CI — they're manual-only. The most behaviorally meaningful smokes
  are un-gated. Risk: Med. Fix: run at least brain-loop + worker-jobs + source-graph in CI, or delete 
  the unused variants.
  - ActivationPolicy has inert fields. requireSourceDoesNotProve, allowStale (activation.ts:72-73), and
  reservedTokens have 0 references outside declaration (minimumTrustTier, budget.maxItems/maxTokens
  are consulted). Declared policy that silently does nothing. Risk: Med. Fix: delete inert fields or 
  wire them.
  - GoldenTask is not wired to the plan pipeline. Carries only projectId? (no
  taskContractId/harnessPlanId); consumed by harness/goldenRunner.ts as standalone fixtures. Any claim
  that golden tasks constrain the live pipeline is unimplemented. Risk: Med. Fix: clarify scope in 
  docs; either wire or relabel as offline-eval fixtures.
  - CLI typecheck gate is an illusion. tsconfig.tests.clean.json is a hand-maintained whitelist of
  44/55 test files; the 11 excluded are the largest command runners (runBrainSearchCommand,
  runHeartbeatPreviewCommand, runRunShowCommand, runSourceArtifactPreviewCommand, plan, init, observe,
  reflect, …). pnpm typecheck runs tsc -p tsconfig.json (src only); test typecheck is opt-in and
  partial. The recent "typecheck widening" commits fix interface/fixture drift batch-by-batch rather
  than at the root. Risk: High (process). Fix: shared mock factories in __tests__/helpers; include all
  55 files at once.

  D. TYPESCRIPT FLAWS

  - as-cast density is the real type-safety debt (since any is ~0): cli 100, db 32, harness 16, workers
  13, core 9. Worst: cli/src/parseMemoryArgs.ts (14), cli/src/runRunShowCommand.ts (10),
  db/src/repositories/mappers.ts (22 enum re-casts). Risk: Med.
  - Unsafe JSON readback pattern in CLI — runRunShowCommand.ts:336/378/403/542 casts value as 
  Record<string, unknown> then narrows with record[key] as SomeType (:353/409/672/673) with no runtime 
  validation, when @krn/schema's parse*Input validators exist for other types. Risk: Med. Fix: route 
  untrusted JSON through the schema parsers.
  - BrandedKrnId is decorative. core/src/ids.ts:1-5 — the brand marker is optional (?) on a string
  intersection, so any plain string is assignable to every branded ID. ids.typecheck.ts:31
  (BrandedKrnIdCompatibilityProof) codifies this. 21 branded types, 0 parse/mint functions. Real effect
  is only compile-time cross-ID separation — modest but real. Production casts that brand unvalidated
  strings: feedbackDelta.ts:130-131, db/DrizzleObservationRepository.ts:318. Risk: Med. Fix: either 
  make the brand load-bearing (drop ?, add parseXxxId at every I/O boundary) or stop adding new brands
  and document it as nominal-only.
  - DB mapper enum re-casts defeat the schema. db/src/repositories/mappers.ts:227-337 hand-maintains
  string-union sets (sourceTrustTiers, evidenceCommandStatuses) and casts through them; adding a pg
  enum value silently widens to string instead of failing typecheck. Risk: Med. Fix: derive literal 
  unions from drizzle $inferSelect['status'].
  - Stringly-typed option dispatch — cli/src/parseMemoryArgs.ts:311-389 casts key as 
  MemoryCandidateAddStringKey for dynamic memoryCommand[key] = value assignment, defeating the type
  system; a Record<StringKey, setter> table would be safe. Risk: Low–Med.
  - typescriptBoundaryInvariants (test 3) uses line-anchored regex to ban as any/: any and require : 
  unknown = JSON.parse — false-positives on multi-line statements and on as any inside comments. Right
  intent, brittle impl. Risk: Low. Fix: use ESLint (no-explicit-any, no-unsafe-assignment) instead of 
  regex.

  E. DUPLICATES / PARALLEL ABSTRACTIONS

  - Three target-fit ranking implementations in the CLI. runBrainSearchCommand.ts:301
  (targetFitForPacket + hardcoded token sets), runHeartbeatPreviewCommand.ts:292/299/317/338
  (genericOnlyTargetFit*), and retainedPatternSelection.ts. runHeartbeatPreviewCommand calls
  @krn/workers.buildBrainHeartbeatPreview; runBrainSearchCommand does not — two siblings, one
  delegates, one reimplements. Ranking belongs in core or workers. Risk: High. Fix: one canonical
  target-fit classifier; both commands call it.
  - CLI per-command *Runtime interfaces redeclare createId(prefix): string ~24× (~120 LOC); no shared
  BaseCommandRuntime. databaseRuntime.ts:51 is the de-facto shape. Risk: Med. Fix: extract one 
  interface.
  - persistenceLabel(persist) reimplemented 4× + the same two persistence strings inlined across 14+
  sites; --persist hand-rolled in 7 parsers despite parseArgHelpers.ts:293 parsePersistedMetadataToken;
  JSON-vs-text format switch duplicated in 5 runners. Risk: Med. ~200+ LOC removable mechanically.
  - Three "low/medium/high" confidence representations (parseMemoryConfidence.ts numeric 0-100;
  codexBriefSupport.ts:99 re-checks strings; parseReviewArgs.ts:21 plain strings). No shared
  LowMediumHigh. Risk: Low.
  - DB mapper sprawl: mappers.ts (885 LOC, 27 fns) + memoryMappers.ts (368 LOC, 6 fns) +
  workerJobMappers.ts + common.ts — all redoing what drizzle $inferSelect + a camelCase column
  convention already provide. Risk: Med. Fix: adopt camelCase column naming; delete ~80% of mappers.
  - Observation-prefix model forked between harness/src/observations/observationPrefix.ts
  (ObservationPrefixItem/*Exclusion/*ExclusionReason) and core/src/contextAssembly.ts
  (ContextObservationPrefix*, same exclusion-reason union). Two sources of truth. Risk: Med. Fix: 
  harness imports core types.
  - Six uncoordinated eval mechanisms (fallow, promptfoo, brain-battle matrix, 10 *Invariants suites,
  goldenKrnBehaviorGate, evalProofBoundaryManifest) sharing no common fixtures and one behavior
  authority. promptfoo and the golden gate share case-ID strings but are wired so promptfoo's pass can
  never satisfy the gate. Risk: Med. Fix: consolidate; see §5.

  F. ANTI-KARPATHY (AI-slop / over-fancy)

  - @krn/workers (2,068 LOC) is an entire package for a runtime that does not exist. Every file is
  *HeartbeatPreview.ts / *Preview.ts — readback builders plus a typed write-authority model
  (allowedWritesByMemoryCoreGate/requiredWritesByMemoryCoreGate) for an executor nobody built. This is 
  the single clearest "200 lines that could be 0" in the repo. A minimal job-contract type + one
  preview function would replace it. Estimated removable: ~1,500 LOC.
  - @krn/schema (1,586 LOC) duplicates @krn/core to host 16 parsers. Could be ~200 LOC inside core.
  Estimated removable: ~1,200 LOC.
  - DB ~15 zombie tables + observation island (~1,900 LOC repo/schema) + latest migration polishing 
  ghosts. Building schema ahead of every consumer. Estimated removable: ~2,000 LOC + migration churn.
  - CLI runSourceArtifactPreviewCommand.ts (2,225 LOC) + sourceArtifactPreviewExtraction.ts (370 LOC)
  is a markdown→entity/claim/relation extractor with no kernel home — there is no @krn/source, so it
  landed in the CLI. Not slop per se (it does real work), but it's domain logic misplaced and
  unreusable. Fix: new @krn/source package or move to core.
  - The "brain-battle" brand. There is no battle and no matrix product —
  docs/architecture/brain-battle-eval-matrix.md is a 60-row governance table; the smoke that bears its
  name is mostly doc-sentinels. The vocabulary oversells the mechanism. Fix: rename to match what it 
  is.

  G. AI-SPECIFIC TRAPS

  - Lack of determinism masked as eval. 43 of 46 "brain-battle" it blocks assert that sentences 
  continue to exist verbatim in markdown — they fire on rewording, not on regressions. Several are
  tautological (a test reads itself; another asserts sibling test names appear in package.json). The
  "smoke passes" signal is mostly "docs unchanged." Risk: High. Fix: split behavior tests from 
  doc-lint; rename.
  - promptfoo smoke is theater shipped in alpha:verify:full and CI.
  tests/fixtures/promptfoo/krn-golden-smoke-provider.mjs returns a hardcoded string including
  doesNotExecuteKrnBehavior=true; the yaml asserts the echo contains its own case id. Proves "promptfoo
  binary runs" — installable via --version. Costs a real dependency (promptfoo ^0.121.17) + CI time
  for zero behavior signal. Risk: Med. Fix: delete, or replace the stub with one real golden case via a
  custom provider that calls the harness gate.
  - fallow is configured nearly blind to the existing slop. .fallowrc.json audit.gate: "new-only" flags
  only new dead code in changed files — the entire zombie surface (policy.ts, @krn/schema, db zombie
  tables) is invisible to the CI gate. Worse, the usedClassMembers allowlist marks zombie-table writers
  (createSourceChunk, createSourceRejection, createSourceDecisionEdge) as "used," actively suppressing
  the truth that those tables have no read path. Risk: Med. Fix: run a one-time full fallow audit (not
  new-only) to surface the backlog; trim the allowlist to methods with real readers.
  - Memory/state explosion (doc form). PLANS.md (2,529 lines, 57 "Outcome IMR-XX" sections) + 594 md
  files / 136k LOC in docs/ (112 runs, 391 reviews, 17 plans, 5 handoffs) — the ledger has grown faster
  than capability. The "compact checkpoints" in PLAN.md are ~90 lines of jargon ("heartbeat
  acquisition linked evidence", "AMA activation utility routing"). The recording medium has become the
  product. Risk: Med. Fix: archive completed IMR outcomes to docs/archive; cap root PLAN.md/PLANS.md.
  - Over-trusting AI output — not present in code, but structurally invited. The golden gate is the
  only deterministic behavior check and it runs in-process deterministic domain code, not LLM output —
  that's correct. But nothing validates actual LLM/Codex output against kernel expectations (no real
  promptfoo case, no Codex-output contract test). The one place AI output enters (codex-adapter renders
  a brief to Codex; nothing asserts Codex followed it — renderExecutionBrief.ts:184 admits this).
  Risk: Med. Fix: if Codex adherence matters, add an evidence-shape check on returned runs.
  - Prompt bloat — mild. renderExecutionBrief.ts (463 LOC) assembles many sections;
  renderHookExpectations.ts/renderSkillHints.ts add more. Not egregious, but the "compute then strip
  empty reserved headings" pattern signals over-specification. Risk: Low.

  ---
  3) Anti-Karpathy / simplicity score

  Score: ~5/10 necessary. Roughly half the code and a larger fraction of the docs is decorative or
  speculative. The kernel that runs and matters is small: the strict type layer, the core
  plan/activation/memory/source contracts (minus dead validators), the DB repos for the ~16 live
  tables, the single goldenKrnBehaviorGate, and the brief renderer. That core is maybe 25–30k LOC of
  the ~62k src LOC. The rest is scaffolding for a worker daemon, vector search, a consensus runtime, an
  observation subsystem, a "brain-battle" eval, and a parallel schema package — none of which execute.

  Top 5 simplification candidates (highest LOC-saved per unit risk):

  1. Delete @krn/schema; move 16 parsers into core. ~1,200 LOC, eliminates 9 duplicate type pairs and
  the core↔schema drift. Zero behavior loss.
  2. Re-scope @krn/workers to @krn/worker-contracts (or delete the write-authority tables): drop the 5
  preview builders' typed authority model until an executor exists. ~1,000+ LOC removable.
  3. Drop the ~15 zombie DB tables + observation island; revert migration 0014. ~2,000 LOC + stops
  polishing ghosts. (Pair with: either implement searchVector or drop the pgvector
  index/column/embedding tables — currently the headline "pgvector brain-store" has no vector query,
  only searchLexical.)
  4. Collapse the CLI's three target-fit implementations, three dispatch systems, and ~200 LOC of 
  duplicated runtime/persistence/format helpers into one of each; move runRunShowCommand's projection
  and runSourceArtifactPreviewCommand's extractor out of the CLI. ~7,000 LOC of CLI is domain logic
  that belongs in kernel packages.
  5. Delete the 5 doc-prose "Invariants" suites (or move them to docs:lint) and the promptfoo stub;
  keep goldenKrnBehaviorGate + the 2 real typescriptBoundaryInvariants checks + sourceMapInvariants.
  ~1,250 LOC + 1 dependency removed, zero loss of real signal.

  Estimated total removable without losing any executed behavior: ~6,000–8,000 LOC of source + ~1 npm 
  dependency + significant migration/doc churn.

  ---
  4) AI-slop and brittleness assessment

  Robust and grounded (concrete evidence):
  - tsconfig.base.json is maximally strict (strict, exactOptionalPropertyTypes,
  noUncheckedIndexedAccess, noUnusedLocals/Parameters, verbatimModuleSyntax, skipLibCheck:false). This
  is the real backbone.
  - any is essentially zero in source (2 hits in harness, 0 elsewhere). Discipline is genuine.
  - The two flagship invariants are code-enforced, not just documented: MemoryReviewGate-accepted-claim
  (reviewGateSupport.ts:132-140) and blocking-signal-excludes-memory (activationFilters.ts:60-78). The
  latter is even stronger than docs/architecture/security-trust-boundaries.md:44 documents.
  - goldenKrnBehaviorGate is a real falsifier — 12 deterministic cases executing real @krn/core domain
  code; a regression in temporal filtering / context ROI / source-claim rejection flips it red.
  - codex-adapter is vendor-neutral — no model names, no openai/anthropic/maxTokens; it's a pure brief
  renderer. (This corrects the audit brief's vendor-lock-in hypothesis — that risk is not present.)
  - The plan pipeline (OperatorIntent → TaskContract → HarnessPlan → CapabilityPlan → ExecutionRun) is
  a real layered pipeline, verified in compileHarnessPlan.ts — not a duplicate abstraction.
  - Self-honest proof-boundary manifest and "doesNotProve" strings throughout.

  Where it risks / is AI-slop:
  - Too many parallel "brain/worker/eval" concepts that don't execute. @krn/workers (no runtime),
  pgvector (no vector query), observation subsystem (no consumer), @krn/schema (90% redundant),
  policy.ts (phantom) — five subsystems that exist mostly to make the system feel like an AGI control
  plane.
  - Eval theater. The "brain-battle smoke" name implies behavior verification; 43/46 of its checks are
  doc-prose sentinels, and the promptfoo lane is a self-echoing stub. The repo's own matrix labels such
  things "eval theater" — then ships one in alpha:verify:full and CI. 
  - Recording > shipping. 57 IMR micro-outcomes, 594 doc files, and a current task of "add one test
  file to a typecheck whitelist" indicate the loop has optimized for ledger entries over capability
  closure.
  - Deleting 30–50% would improve clarity without reducing capability — specifically: @krn/schema
  (whole), policy.ts (whole), @krn/workers write-authority model, ~15 zombie DB tables + observation
  island, 5 doc-sentinel suites + promptfoo stub, and ~200 LOC of CLI duplication. None of this
  executes; all of it costs typecheck/migration/CI/doc maintenance.

  ---
  5) Concrete recommendations (highest-leverage first)

  1. Delete @krn/schema; move its 16 parse*Input parsers next to their core types. Eliminates the
  largest source of type drift and a whole package boundary. (~1,200 LOC.)
  2. Re-scope or gut @krn/workers. Either build a minimal executor that consults
  allowedWritesByMemoryCoreGate/requiredWritesByMemoryCoreGate, or delete those tables and rename the
  package to reflect that it is contract + preview only. Stop claiming "Memory Core write authority"
  until something enforces it.
  3. Drop zombie DB tables + the observation island; revert migration 0014. Implement
  searchVector/searchHybrid or remove the pgvector index + embeddings/embedding_models tables
  (currently write-only, never queried). Re-baseline db:smoke:* to live tables only.
  4. Unify target-fit ranking into one canonical classifier in core/workers; make both
  runBrainSearchCommand and runHeartbeatPreviewCommand call it. Eliminates 3 fragmented copies and the
  delegate/reimplement inconsistency.
  5. Split the "brain-battle smoke" honestly. Keep goldenKrnBehaviorGate + the 2 real
  typescriptBoundaryInvariants checks + sourceMapInvariants under a real behavior:smoke; move the 5
  doc-prose suites to docs:lint; delete patternChainInvariants (one regex, fully duplicated by
  activePlanInvariants).
  6. Delete the promptfoo stub (or replace it with one real golden case via a custom provider). Remove
  the promptfoo dependency from alpha:verify:full/CI until it asserts behavior.
  7. Fix the typecheck gate at the root. Replace the tsconfig.tests.clean.json whitelist +
  batch-widening with shared mock factories in cli/__tests__/helpers; include all 55 test files in one
  strict gate.
  8. Run a one-time full (not new-only) fallow audit, trim the usedClassMembers allowlist of
  zombie-table writers (createSourceChunk, createSourceRejection, createSourceDecisionEdge), and act on
  the backlog: delete policy.ts, dead assess*/normalize* validators, @krn/harness/eval + recipes/ +
  audit/ + reflectionCandidateWriter.
  9. Close the asymmetric trust gap: wire assessSourceDecisionReviewSignals into the SourceDecision
  path (mirroring the enforced SourceClaim-accepted check), or delete it and remove the claim from
  docs.
  10. Cap the ledgers. Archive completed IMR-XX outcomes to docs/archive; enforce the PLAN.md/PLANS.md
  "keep compact" rule that already exists in GOAL.md but is violated in practice (2,529-line PLANS.md).

  - codex-adapter is vendor-neutral — no model names, no openai/anthropic/maxTokens; it's a pure brief renderer. (This corrects the audit brief's vendor-lock-in hypothesis — that risk is not present.)
  - The plan pipeline (OperatorIntent → TaskContract → HarnessPlan → CapabilityPlan → ExecutionRun) is a real layered pipeline, verified in compileHarnessPlan.ts — not a duplicate abstraction.
  - Self-honest proof-boundary manifest and "doesNotProve" strings throughout.

  Where it risks / is AI-slop:
  - Too many parallel "brain/worker/eval" concepts that don't execute. @krn/workers (no runtime), pgvector (no vector query), observation subsystem (no consumer), @krn/schema (90% redundant), policy.ts (phantom) — five subsystems that exist mostly to make
  the system feel like an AGI control plane.
  - Eval theater. The "brain-battle smoke" name implies behavior verification; 43/46 of its checks are doc-prose sentinels, and the promptfoo lane is a self-echoing stub. The repo's own matrix labels such things "eval theater" — then ships one in
  alpha:verify:full and CI.
  - Recording > shipping. 57 IMR micro-outcomes, 594 doc files, and a current task of "add one test file to a typecheck whitelist" indicate the loop has optimized for ledger entries over capability closure.
  - Deleting 30–50% would improve clarity without reducing capability — specifically: @krn/schema (whole), policy.ts (whole), @krn/workers write-authority model, ~15 zombie DB tables + observation island, 5 doc-sentinel suites + promptfoo stub, and ~200 LOC
  of CLI duplication. None of this executes; all of it costs typecheck/migration/CI/doc maintenance.

  ---
  5) Concrete recommendations (highest-leverage first)

  1. Delete @krn/schema; move its 16 parse*Input parsers next to their core types. Eliminates the largest source of type drift and a whole package boundary. (~1,200 LOC.)
  2. Re-scope or gut @krn/workers. Either build a minimal executor that consults allowedWritesByMemoryCoreGate/requiredWritesByMemoryCoreGate, or delete those tables and rename the package to reflect that it is contract + preview only. Stop claiming "Memory
  Core write authority" until something enforces it.
  3. Drop zombie DB tables + the observation island; revert migration 0014. Implement searchVector/searchHybrid or remove the pgvector index + embeddings/embedding_models tables (currently write-only, never queried). Re-baseline db:smoke:* to live tables
  only.
  4. Unify target-fit ranking into one canonical classifier in core/workers; make both runBrainSearchCommand and runHeartbeatPreviewCommand call it. Eliminates 3 fragmented copies and the delegate/reimplement inconsistency.
  5. Split the "brain-battle smoke" honestly. Keep goldenKrnBehaviorGate + the 2 real typescriptBoundaryInvariants checks + sourceMapInvariants under a real behavior:smoke; move the 5 doc-prose suites to docs:lint; delete patternChainInvariants (one regex,
  fully duplicated by activePlanInvariants).
  6. Delete the promptfoo stub (or replace it with one real golden case via a custom provider). Remove the promptfoo dependency from alpha:verify:full/CI until it asserts behavior.
  7. Fix the typecheck gate at the root. Replace the tsconfig.tests.clean.json whitelist + batch-widening with shared mock factories in cli/__tests__/helpers; include all 55 test files in one strict gate.
  8. Run a one-time full (not new-only) fallow audit, trim the usedClassMembers allowlist of zombie-table writers (createSourceChunk, createSourceRejection, createSourceDecisionEdge), and act on the backlog: delete policy.ts, dead assess*/normalize*
  validators, @krn/harness/eval + recipes/ + audit/ + reflectionCandidateWriter.
  9. Close the asymmetric trust gap: wire assessSourceDecisionReviewSignals into the SourceDecision path (mirroring the enforced SourceClaim-accepted check), or delete it and remove the claim from docs.
  10. Cap the ledgers. Archive completed IMR-XX outcomes to docs/archive; enforce the PLAN.md/PLANS.md "keep compact" rule that already exists in GOAL.md but is violated in practice (2,529-line PLANS.md).

  Bottom line: The bones are good — strict types, zero any, one real golden gate, vendor-neutral brief rendering, code-enforced trust invariants. The disease is speculative generality: five non-executing subsystems, half a DB with no readers, an eval suite
  that mostly guards its own prose, and a documentation apparatus larger than the code it describes. Cutting ~30–40% of source and forcing every remaining abstraction to trace to an executing consumer would convert this from an impressive-looking alpha into
  a smaller, honest, and more credible one.