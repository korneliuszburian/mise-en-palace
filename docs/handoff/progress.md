# Progress

Current phase: Memory ideal-state execution track after QG-03, paused for the remaining QG quality correction gate.

Completed:

- M27 target repo readiness, DB smokes, evidence capture, anti-rot audit, and
  memory ideal-state goal handoff.
- MM-00 through MM-65, MM-16R, QG-00, QG-01, QG-02, and QG-03 in
  `docs/plans/memory-ideal-state/PLAN.md`.
- QG-00 repo-wide current-state inventory at
  `docs/plans/memory-ideal-state/QG-00-REPO-INVENTORY.md`.
- MM-16/17 external review repair layer in
  `docs/plans/memory-ideal-state/PLAN.md`, committed as
  `88cbbba docs(memory): add harsh review repair layer`.
- M22 source graph persistence, CLI write/read surfaces, smoke, doctor
  readiness, dogfood, and anti-rot.
- M23 memory governance schema/repository/CLI promotion surfaces, anti-memory,
  smoke, doctor readiness, dogfood, and anti-rot.
- M24 retrieval/search substrate schema/repository/smoke, doctor readiness,
  dogfood, and anti-rot.
- M25 activation engine, noisy fixture, persisted activation in `krn plan`,
  activation smoke, doctor readiness, dogfood, and anti-rot.
- M26 Codex adapter contracts, execution brief renderer, read-only
  `krn codex brief`, hook expectation projection, Codex adapter smoke, worker
  job schema/repository/smoke, doctor readiness, dogfood, and anti-rot.

Current runtime truth:

- PostgreSQL with pgvector is the canonical local brain-store proof path.
- DB writes require explicit `--persist` or explicit smoke commands.
- `krn doctor` is read-only.
- Manual `krn observe --run <id> [--project <id>] [--persist]` exists,
  MM-17B dogfood proof is recorded at
  `docs/runs/2026-06-22-observation-dogfood.md`, and MM-17D removed hardcoded
  observe project scope.
- Observation prefix selector exists as pure harness logic and MM-16R hardened
  relevance/project scoping. MM-30A added explicit anti-memory exclusions for
  prefix items; later activation/context integration is still pending.
- Typed observation source-range lineage is enforced at the repository boundary
  for truth-bearing observations.
- Observation schema datetime validation and schema/core policy parity tests are
  in place.
- Observer input redacts secret-shaped values before truncation.
- Pure reflection contracts exist in `packages/core/src/reflection`.
- Reflection candidate-only guard rejects final-truth targets and promotion
  metadata.
- Reflection IO schemas and `reflection_records` DB table exist; DB readiness
  now applies 11/11 migrations.
- Reflection repository and pure input selector exist; selector keeps
  contradiction/gap observations visible and enforces project isolation.
- Reflection candidate-generation plan counts proposal arrays and blocks on
  candidate-only guard violations without writing candidate or memory rows.
- Reflection contradiction/gap report builder exists in pure core and reports
  contested/conflict observations, missing source ranges, stale observations,
  duplicates, and unsupported decisions.
- Manual `krn reflect --scope run:<id>|project:<id>|topic:<name>` exists;
  preview is default, `--persist` writes only a ReflectionRecord, and command
  output explicitly reports no candidate rows, no MemoryRecord, and no Memory
  Core mutation.
- Reflect runtime memory access is physically narrowed to read-only
  anti-memory listing, and tests scan the reflect command for direct Memory Core
  promotion calls.
- MM-24A live proof is recorded at
  `docs/runs/2026-06-22-reflection-mutation-proof.md`: reflect persist changed
  `reflection_records` 2->3 while `memory_records` stayed 1 and
  `memory_candidates` stayed 1.
- MM-25 dogfood is recorded at
  `docs/runs/2026-06-22-reflection-dogfood.md`: reflect selected 5
  observations and 1 anti-memory record, persisted a ReflectionRecord, and
  produced zero findings/candidate proposals.
- MM-26 MemoryRepository invariant guard enforces source lineage, owner,
  application guidance, confidence bounds, and temporal invalidation/validity
  requirements for memory records and candidates.
- MM-26A blocks public `krn memory candidate promote --persist` before DB
  runtime and reports that MemoryReviewGate is required; no MemoryRecord is
  created through the CLI promote path until MM-27.
- MM-27 adds MemoryReviewGate in harness and reopens public
  `krn memory candidate promote --persist` only with
  `--evidence-reviewed-ref`; the gate checks reviewer, candidate invariants,
  raw evidence review reference, and linked SourceClaim availability before
  calling low-level repository promotion.
- MM-28 adds `invalidateMemoryRecord`; live memory-governance smoke proves
  invalidated memory is excluded from active memory while its
  MemoryRecordVersion remains auditable.
- MM-29 makes memory application feedback affect activation ranking through
  `feedbackScore` and `feedbackPenalty`; negative feedback is no longer a
  passive counter.
- MM-29A surfaces active memory with repeated negative feedback as a blocking
  audit health finding, without automatic invalidation.
- MM-30 makes anti-memory block explicit memory-record activation candidates
  by subject id, memory key, anti-memory key, or `appliesTo`.
- MM-30A makes anti-memory block linked search-document candidates and
  observation prefix items through explicit IDs/keys.
- MM-31 records explicit activation abstention metadata when candidate context
  is absent, weak, unsafe, stale, over budget, or fully excluded.
- MM-32 broadens memory health audit findings for stale high-confidence
  memory, active memory without lineage/source-claim support, missing
  application feedback, missing application guidance, temporal records without
  invalidation strategy, and repeated negative feedback.
- MM-32B makes `krn audit slice` consume explicit intended files and
  verification command states, persisted AuditBundle evidence, and DB-backed
  semantic snapshots for MemoryCandidate, MemoryRecord, SourceClaim,
  SourceDecision, EvalCandidate, ObservationGroup, and ActivationDecision.
  Audit output now includes semantic snapshot counts and supports
  `--fail-on warning` for CI-style gates.
- MM-33 dogfoods MemoryReviewGate promotion for one reviewed KRN lesson.
  Evidence is recorded at `docs/runs/2026-06-23-memory-dogfood.md`.
  The promoted MemoryRecord is
  `41d1a2ef-3578-4e45-947f-42c6739796de`; the reviewed SourceClaim is
  `f0b5c9ee-01aa-41df-9268-7df3f7437068`; a later matching plan selected the
  memory into context and MemoryApplication
  `55a8e695-8665-45da-a19e-b8be578708ea` recorded outcome `helped`.
- MM-34 hardens SourceClaim / SourceDecisionEdge governance. SourceClaim IO
  now requires a `falsifier`; repository writes reject decorative support types
  for SourceClaim and SourceDecisionEdge; `adopt`/`reject` SourceDecision writes
  require a linked SourceClaim; source/activation/codex smokes were kept green
  by converting legacy negative examples to decision-grade rejection/risk
  source records.
- MM-35 hardens source rejection support boundaries. Rejected/deprecated
  SourceClaims cannot support new SourceDecisionEdge writes through public CLI
  or repository adapter paths.
- MM-36 adds source trust/temporal behavior. Trust tiers now have
  deterministic ranks; valid stronger consensus blocks weaker newer claims
  unless an explicit override reason is supplied; stale consensus can be
  challenged by the same policy helper.
- MM-37 broadens source graph health audit. Semantic source snapshots now flag
  decorative support types, stale accepted claims, accepted claims with no
  SourceDecision, and SourceDecisions attached to rejected/deprecated claims.
- MM-38 dogfoods source-to-decision on the MM-37 source graph health audit
  implementation decision. The dogfood run has one SourceClaim and one
  SourceDecisionEdge linked to the same harness run.
- MM-39 adds pure ActivationQuery modeling for task/project scope, focus,
  memory/source/observation needs, budget, risk, and query terms.
- MM-40 adds hybrid candidate merge for linked source/search and memory/search
  activation candidates, preserving score signals and merged metadata while
  avoiding duplicate context candidates.
- MM-41 adds a pure activation filter pass for anti-memory conflict detection,
  trust filtering, and temporal/invalidation filtering after candidate merge.
- MM-42 hardens ContextROI selection with canonical dedup, requested
  memory/source/search diversity, and explicit duplicate/over_budget/
  low_context_roi exclusions.
- MM-43 adds raw evidence recall triggers for exact-proof and low-trust
  inclusions and persists them into activation trace metadata.
- MM-44 integrates the hardened observation prefix selector into context
  assembly metadata as a small source-ranged activation artifact.
- MM-44A adds an assembly-side observation prefix gate: if a selected prefix
  item lacks source ranges, `assembleContext` rejects prefix metadata, records
  `observationPrefixGate`, and leaves a prefix-only context abstained.
- MM-45 dogfoods activation before/after observation prefix on one KRN memory
  implementation task. Proof is recorded at
  `docs/runs/2026-06-23-activation-observation-prefix-dogfood.md`: before
  prefix context abstained with `no_candidates`; after prefix context assembled
  with one source-ranged observation prefix item; DB counts for Memory Core,
  observation, and context tables stayed unchanged.
- MM-46 hardens CapabilityRequirement/CapabilityPlan domain fields. Requirements
  now carry explicit priority and binding kinds, while TaskContract remains free
  of `requiredSkills`.
- MM-47 adds CapabilityCompiler v1 task-text routing. Memory/source/audit tasks
  now receive focused schema/db/source/evidence/review requirements, and Codex
  adapter skill hints include brain-store/source/evidence skills.
- MM-48 adds pure core SkillBinding, RulePackBinding, PolicyGateBinding, and
  ToolBoundaryBinding contracts with conservative invalid-binding validation.
- MM-49 adds pure core capability binding candidate/review contracts. Proposed
  binding candidates are not promotable until an approved review with evidence
  exists.
- MM-50 routes TypeScript boundary and review-risk task text to focused
  capability requirements with unknown-first/no-type-weakening and diff-risk/
  review-risk evidence.
- MM-51 dogfoods capability routing on a persisted KRN memory implementation
  task and fixes read-only Codex brief readback so it preserves task-text
  routing from the persisted TaskContract.
- MM-52 adds pure core EvidenceBundle completeness assessment for required
  execution evidence.
- MM-53 adds pure core ReviewAssessment/FeedbackDelta normalization for
  outcome, review burden, diff risk, and correction labels.
- MM-54 adds pure core EvidenceBundle review-risk scoring v1 for docs-only,
  narrow core, and broad DB/runtime diffs with command evidence.
- MM-55 adds pure core EvidenceBundle rollback-path enforcement for non-doc
  changes.
- MM-56 adds pure core FeedbackDelta candidate-proposal summary over already
  structured proposal fields, with no text mining or Memory Core mutation.
- MM-56A adds the KRN code vocabulary and TypeScript elegance standard,
  including the authority ladder for helper verbs and the rule that names must
  not imply extraction, persistence, promotion, or final truth unless the code
  really has that authority.
- MM-57 adds `krn review assess`, a manual CLI path that validates review
  status/outcome/risk/finding inputs and persists ReviewAssessment plus
  FeedbackDelta with `memoryRecordMutation: "none"` and no Memory Core row
  creation.
- MM-58 dogfoods feedback capture on persisted ExecutionRun
  `5db6c5aa-3fcf-48bd-b013-f732c7558e33`: evidence capture persisted
  EvidenceBundle `4d2e3247-4469-45bc-99a3-0a4b4095110d` plus ReviewAssessment
  `99ad79d8-f4b1-4018-9721-79676238e882` and FeedbackDelta
  `0ba61fdd-179d-455d-bac5-af57515b6f87`; manual `krn review assess
  --persist` persisted ReviewAssessment
  `c6b0130d-c6d0-4db2-95b5-4076201eee4e` and FeedbackDelta
  `de8b97e3-1593-4f4c-891a-60c7a3df444c`; counts ended at
  `evidence_bundles=9`, `review_assessments=10`, `feedback_deltas=10`,
  `memory_candidates=2`, and `memory_records=4`.
- MM-59 adds `GoldenTask`, `GoldenCase`, `ExpectedBehavior`, and
  `ProtectedFailureMode` as pure core contracts. `validateGoldenTaskContract`
  rejects shape-only cases without behavior expectations, source/evidence refs,
  or protected failure modes, and rejects private reasoning metadata.
- MM-60 chooses file-backed GoldenTask fixtures as the initial strategy.
  `parseGoldenTaskFixtures` validates unknown JSON through schema-owned Zod
  parsing and sorts tasks, cases, and protected failure modes by id so fixture
  loading is deterministic.
- MM-61 adds memory behavior golden cases and fixture-backed harness tests for
  source-linked memory selection, stale memory exclusion/abstention, weak
  memory abstention, temporal validity, and application guidance preservation.
- MM-61-lite adds early golden smoke cases for stale memory abstention,
  explicit anti-memory blocking of a tempting stale pattern, and source
  grounding audit rejection of unsupported SourceDecision records.
- MM-62 adds fixture-backed context/source/audit/TS boundary golden cases for
  ContextROI broad-dump rejection, source `doesNotProve`, forbidden surface
  audit, and unchecked runtime parsing/type-boundary audit.
- MM-63 adds fixture-backed observation/reflection/anti-memory golden cases
  for observation staging, reflection candidate-only output, anti-memory
  prefix blocking, and visible missing-evidence gap reports.
- MM-64 adds a pure harness GoldenTask runner that emits pass/fail reports from
  validated task contracts plus explicit behavior proofs.
- MM-65 adds a pure harness Promptfoo-compatible snapshot export for
  GoldenTask cases without adding Promptfoo as a dependency or executing a
  model.
- QG-01 accepted colocated package tests with runtime-leak enforcement.
- QG-02 added the TypeScript excellence standard and suppression/double
  assertion audit checks.
- QG-03 removed clear zombie exports and recorded the accepted fixture finding.
- QG-04 through QG-06 are queued before MM-66: bloat/smell audit, official
  Promptfoo decision, and quality gate automation in `krn audit`.
- Codex adapter renders briefs and expectations; it does not invoke Codex.
- Worker jobs are a persistence skeleton; jobs are not executed by a daemon.
- Markdown is docs/export/audit/handoff material, not runtime Memory Core.

Next action:

- Continue with QG-00 repo-wide current-state inventory refresh.
