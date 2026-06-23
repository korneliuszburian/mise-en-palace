# Wrong / Suspect Abstractions

Status: read-only audit decisions.

This file records current keep, narrow, rename, or delete decisions for the
architecture reset audit. It does not authorize implementation repair.

## Initial Decisions

### `krn audit`

files involved:

- `packages/cli/src/runAuditCommand.ts`
- `packages/cli/src/runAuditCommand.test.ts`
- `packages/harness/src/audit/auditChecks.ts`
- `packages/harness/src/audit/auditChecks.test.ts`
- `docs/plans/memory-ideal-state/QG-04H-SMELL-SCAN-AUTOMATION-REQUIREMENTS.md`

why it exists:

To expose repo/slice findings for architecture drift, boundaries, type safety,
memory semantics, source grounding, eval theater, verification evidence, and
handoff state.

whether it should exist:

Default answer: not as a KRN product layer.

It may survive only as a narrow internal developer guard for deterministic
repo/slice checks. If it keeps absorbing general engineering discipline under a
KRN-branded "quality" surface, it should be deleted or renamed out of the
product vocabulary.

classification:

At most: internal developer guard / CLI sanity check.

Not product. Not Memory Brain. Not a quality engine. Not architecture review.

current evidence:

- The command builds file snapshots and optional DB semantic snapshots.
- The harness checks are deterministic category functions.
- Current repo snapshot collection excludes tests and fixtures.
- QG-04H requires QG-06 to include tests and fixtures for smell scans.

current decision:

Deproductize or delete.

Keep only the parts that catch concrete mechanical invariants:

- forbidden runtime surfaces;
- package-boundary violations;
- known TypeScript boundary shortcuts;
- missing slice evidence inputs when explicitly supplied.

Do not keep "anti-slop" as a product concept. Quality must come from normal
engineering discipline: architecture, package boundaries, naming, type safety,
behavior tests, and review.

immediate risk if kept:

Agents may treat a passing `krn audit` result as proof of architecture quality
even though current checks do not inspect all required quality surfaces.

The larger risk is worse: new worries become new KRN-branded layers. If "too
many comments" becomes `krn comments`, or "frontend facts are noisy" becomes
`krn memory-strip-frontend-audit`, the architecture has started manufacturing
meta-tools instead of improving software.

migration/removal path:

- First, remove product/backlog language that treats QG-06 as the next feature
  direction.
- Rename the surviving command if needed to make its authority obvious, for
  example `krn guard` or `krn check`, or keep `krn audit` only if docs state it
  is a mechanical guard.
- Delete checks that cannot falsify a concrete invariant.
- Keep human review as required evidence for broad architecture decisions.

### QG-04H / QG-06 Smell-Scan Automation

files involved:

- `docs/plans/memory-ideal-state/QG-04H-SMELL-SCAN-AUTOMATION-REQUIREMENTS.md`
- `packages/harness/src/audit/auditChecks.ts`
- `packages/cli/src/runAuditCommand.ts`

why it exists:

Manual smell scans caught real quality risks, and the plan wants those risks to
be visible during slices.

whether it should exist:

The abstraction is wrong as currently framed.

Specific deterministic checks can exist, but QG-06 as "quality gate
automation" is the wrong next move if it turns general engineering discipline
into a KRN subsystem.

classification:

Infrastructure / audit policy, not product feature.

current decision:

Reject as product direction. Reduce to a short mechanical guard backlog only
after the audit decides which existing checks deserve to survive.

immediate risk if kept:

QG-06 can become "anti-slop subsystem" theater: lots of categories, allowlists,
and JSON findings while core product behavior remains unproved.

migration/removal path:

- Delete the framing that says quality is solved by expanding `krn audit`.
- Preserve only deterministic checks that catch known recurring defects.
- Prefer direct code/docs repair over new audit categories.
- Do not implement new smell-scan categories until the current architecture
  audit is complete and the user approves repair work.

### AuditBundle

files involved:

- `packages/core/src/auditBundle.ts`
- `packages/schema/src/auditBundle.ts`
- `packages/db/src/repositories/DrizzleAuditBundleRepository.ts`

why it exists:

To persist changed files, intended files, verification commands, risks,
rollback path, findings, candidate updates, and final verdict for a slice.

whether it should exist:

Yes, as evidence packaging only.

classification:

Infrastructure / evidence record.

current decision:

Keep if it stays a compact evidence container. Rename/reduce if docs imply it
performs review by itself.

immediate risk if kept:

It can make weak proof look governed if verification commands are listed but not
actually run, or if findings are copied without independent evidence.

migration/removal path:

- Require command status provenance.
- Keep self-critique summary short and non-private.
- Ensure AuditBundle ingestion does not replace command output review.

## Evaluated Abstractions

### GoldenTask / Promptfoo

files involved:

- `packages/core/src/goldenTask.ts`
- `packages/schema/src/goldenTask.ts`
- `packages/harness/src/goldenRunner.ts`
- `packages/harness/src/goldenPromptfooExport.ts`
- `packages/harness/src/goldenPromptfooResult.ts`
- `tests/fixtures/promptfoo/krn-golden-smoke.yaml`
- `tests/fixtures/promptfoo/krn-golden-smoke-provider.mjs`

why it exists:

To encode protected behavior cases and optionally run/export them through a
known eval runner.

whether it should exist:

Yes, but only as a bounded eval lane owned by KRN contracts.

Promptfoo must remain a runner/adapter. It is not Memory Core, not the source of
truth for golden behavior, and not a broad benchmark product.

classification:

Eval infrastructure.

current evidence:

- GoldenTask contracts require cases, expected behavior, protected failure
  modes, source refs, and evidence refs.
- The golden runner fails missing or failed proof rows.
- Promptfoo snapshot export explicitly says snapshot-only and no model
  execution.
- The official smoke provider returns `status=passed` from fixture vars, so it
  proves runner integration, not KRN behavior.

current decision:

Keep, but relabel documentation sharply:

- `GoldenTask` is canonical KRN behavior contract.
- Promptfoo is a bounded external runner/result adapter.
- Current smoke proves integration only.

immediate risk if kept:

Agents may cite a passing Promptfoo smoke as proof that memory/activation
behavior works.

migration/removal path:

- Fix README/QG docs to say QG-05 is adopted and bounded.
- Add real behavior-proof mapping before treating Promptfoo as regression gate.
- Keep smoke fixture language explicit: integration smoke, not quality proof.

### Observation

files involved:

- `packages/core/src/observations/*`
- `packages/schema/src/observation.ts`
- `packages/db/src/schema/observations.ts`
- `packages/db/src/repositories/DrizzleObservationRepository.ts`
- `packages/harness/src/observations/*`
- `packages/cli/src/runObserveCommand.ts`

why it exists:

To turn run/evidence/review/feedback history into dated, source-ranged staging
records.

whether it should exist:

Yes. This is a valid KRN mechanism when kept as staging.

classification:

Memory/source staging infrastructure.

current evidence:

- Observation source-range policy exists in core/schema.
- Repository writes enforce required source ranges and typed evidence linkage
  for truth-bearing observations.
- `krn observe --run` writes observation groups/items only and prints that it
  creates no MemoryRecord.

current decision:

Keep. Do not rename to Memory Brain. Do not make observations final truth.

immediate risk if kept:

Docs or UI can overread observation rows as accepted memory. They are not.

migration/removal path:

- Keep command output and docs explicit: observation is staging.
- Preserve source-range and temporal-scope invariants.
- Do not allow direct observation-to-MemoryRecord mutation.

### Reflection

files involved:

- `packages/core/src/reflection/index.ts`
- `packages/schema/src/reflection.ts`
- `packages/db/src/schema/reflections.ts`
- `packages/db/src/repositories/DrizzleReflectionRepository.ts`
- `packages/harness/src/reflection/reflectionInputSelector.ts`
- `packages/cli/src/runReflectCommand.ts`

why it exists:

To synthesize observations/source claims/anti-memory into findings, gaps,
contradictions, and candidate proposals.

whether it should exist:

Yes, but only as an explicitly invoked candidate/reporting layer.

classification:

Candidate generation / offline review staging.

current evidence:

- Reflection output contract blocks final-truth target types and mutation-shaped
  metadata.
- `krn reflect` currently persists only `ReflectionRecord`; candidate rows and
  MemoryRecord creation are explicitly not performed.
- Gap and contradiction reports are deterministic over loaded observations.

current decision:

Keep. Do not describe as autonomous dreaming, self-healing memory, or hidden
research.

immediate risk if kept:

The word "reflection" can sound like an LLM/agent loop. Current code is
deterministic report generation and record persistence.

migration/removal path:

- Keep manual/explicit invocation.
- Candidate row creation must be a later, reviewed path.
- Fix `SourceClaim` project scoping so reflection does not depend on
  `metadata.projectId`.

### MemoryCandidate

files involved:

- `packages/core/src/memory.ts`
- `packages/schema/src/memoryCandidate.ts`
- `packages/db/src/schema/memory.ts`
- `packages/db/src/repositories/DrizzleMemoryRepository.ts`
- `packages/cli/src/runMemoryCandidateAddCommand.ts`

why it exists:

To hold reviewable proposed memory before it can become Memory Core.

whether it should exist:

Yes.

classification:

Governance boundary.

current evidence:

- Candidate has source lineage, confidence, owner, application guidance,
  invalidation/validity fields, and status.
- Candidate add validates source lineage and source claim existence when
  provided.

current decision:

Keep, but make sure all candidate creation paths remain explicit proposals.

immediate risk if kept:

If candidate rows are treated as active memory, the governance boundary fails.

migration/removal path:

- Preserve candidate vs record language.
- Ensure Codex briefs only use active MemoryRecord unless explicitly selecting
  candidate review context.

### MemoryReviewGate

files involved:

- `packages/harness/src/memory/memoryReviewGate.ts`
- `packages/cli/src/runMemoryCandidateReviewCommand.ts`
- `packages/harness/src/repositories/memoryRepository.ts`
- `packages/db/src/repositories/DrizzleMemoryRepository.ts`

why it exists:

To make candidate-to-MemoryRecord promotion require explicit review and evidence
review reference.

whether it should exist:

Yes. It is one of the correct KRN abstractions.

classification:

Governance gate.

current evidence:

- CLI persisted promotion requires `--evidence-reviewed-ref`.
- Gate checks candidate status, lineage, guidance, confidence, temporal
  invalidation rule, and source-claim existence.
- Low-level repository still exposes direct `createMemoryRecord` and
  `promoteMemoryCandidate`.

current decision:

Keep and strengthen. The gate should become the only public architecture path
for Memory Core promotion.

immediate risk if kept as-is:

The safe CLI path exists, but repository exports still advertise lower-level
write authority.

migration/removal path:

- Move low-level write methods behind internal adapter interfaces or document
  them as internal-only with package boundaries enforcing that in code.
- Public repository/CLI/admin flow should use gate-owned verbs.

### AntiMemory

files involved:

- `packages/core/src/memory.ts`
- `packages/db/src/schema/memory.ts`
- `packages/db/src/repositories/DrizzleMemoryRepository.ts`
- `packages/harness/src/activation/*`
- `packages/harness/src/observations/observationPrefix.ts`
- `packages/cli/src/runMemoryAntiAddCommand.ts`

why it exists:

To stop stale/wrong/harmful patterns from being reactivated.

whether it should exist:

Yes, as explicit blocking memory.

classification:

Activation safety / negative memory.

current evidence:

- AntiMemoryRecord exists as first-class core/domain/persistence object.
- Activation and observation prefix can exclude items via anti-memory.
- Exact matching is currently key/subject/id-oriented.

current decision:

Keep. Prefer exact typed blockers before fuzzy semantic blocking.

immediate risk if kept:

If anti-memory matching stays too stringy, it can both miss real blockers and
block unrelated context.

migration/removal path:

- Use explicit typed links where possible.
- Keep `mayRevisitWhen` and invalidating source claims visible.
- Add behavior proofs before adding fuzzy matching.

### Activation

files involved:

- `packages/core/src/activation.ts`
- `packages/harness/src/activation/*`
- `packages/db/src/schema/retrieval.ts`
- `packages/db/src/repositories/DrizzleRetrievalRepository.ts`

why it exists:

To select bounded context from memory, source, search, anti-memory, trust,
temporal, and ROI signals, and to abstain when context is weak.

whether it should exist:

Yes. This is central to the kernel thesis.

classification:

Core selection mechanism.

current evidence:

- Activation has candidates, inclusions/exclusions, conflict/abstention status,
  and persisted activation decisions.
- Context assembly enforces source-claim safety and emits abstention reasons.
- Raw recall triggers are persisted as activation metadata.

current decision:

Keep and harden.

immediate risk if kept:

Some activation identity and trace fields still live in metadata. Those need
typed fields/read models as the system stabilizes.

migration/removal path:

- Promote repeated behavior-governing metadata into typed fields.
- Keep abstention as first-class product behavior.
- Add stronger golden behavior proofs for noisy context selection.

### SourceGraph

files involved:

- `packages/core/src/source.ts`
- `packages/schema/src/sourceClaim.ts`
- `packages/db/src/schema/sources.ts`
- `packages/db/src/repositories/DrizzleSourceRepository.ts`
- `packages/cli/src/runSourceClaimAddCommand.ts`
- `packages/cli/src/runSourceDecisionLinkCommand.ts`
- `packages/cli/src/runSourceClaimRejectCommand.ts`

why it exists:

To make sources decision-grade: mechanism, implication, does-not-prove,
consumer, trust, support type, rejection, decision links, and falsifiers.

whether it should exist:

Yes.

classification:

Source grounding / decision infrastructure.

current evidence:

- SourceClaim governance rejects decorative claims and requires mechanism,
  implication, does-not-prove, consumer, falsifier, and decision-grade support
  type.
- Rejections and decision edges are persisted.
- Project scoping exists on source artifacts/decisions/rejections, but
  reflection project-scopes source claims through metadata.

current decision:

Keep, but repair project scoping.

immediate risk if kept:

`SourceClaim` can become a global claim soup if project scope is implicit or
metadata-only.

migration/removal path:

- Add first-class project scope or derive it from source artifact reliably in
  repository/read-model methods.
- Keep source decisions non-decorative.

### CLI Commands As Public Operator Surface

files involved:

- `packages/cli/src/parseArgs.ts`
- `packages/cli/src/runCli.ts`
- `packages/cli/src/parseDbArgs.ts`
- `packages/cli/src/parseMemoryArgs.ts`
- `packages/cli/src/parseSourceArgs.ts`
- `packages/cli/src/index.ts`

why it exists:

To expose local operator and development workflows.

whether it should exist:

Yes, but not in the current broad shape.

classification:

Adapter surface.

current evidence:

- CLI includes operator commands, DB smokes, audit checks, source primitives,
  memory primitives, observe/reflect, evidence/review, Codex brief, and init.
- Preview-by-default with explicit `--persist` is a good pattern.
- The command taxonomy does not clearly separate product workflows from internal
  smoke/developer operations.

current decision:

Reduce and reclassify.

immediate risk if kept:

The CLI becomes theater: a list of impressive commands that implies a complete
platform while many paths are smokes, staging, or admin primitives.

migration/removal path:

- Define the public operator workflow explicitly.
- Move DB smokes/dev probes under an internal/dev namespace or scripts.
- Collapse memory/source primitives behind reviewed workflow commands where
  possible.
- Keep command help honest about preview vs persisted writes.
