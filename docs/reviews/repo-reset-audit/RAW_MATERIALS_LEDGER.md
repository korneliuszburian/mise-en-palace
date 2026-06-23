# Raw Materials Ledger

Status: source-to-decision ledger for read-only reset audit.

The two raw research files are quarantine inputs, not implementation truth.
Each retained mechanism below is mapped through source -> mechanism -> KRN
implication -> decision/rejection -> falsifier. Underlying external claims in
the raw materials were not independently researched in this audit.

## Sources

### R1

source_id: `docs/materials/2026-06-22-big-brain.md`

trust_tier: medium for mechanism discovery, low for implementation decisions
until underlying cited sources are independently checked.

### R2

source_id: `docs/materials/2026-06-22-big-brain-part-2.md`

trust_tier: medium for mechanism discovery, low for implementation decisions
until underlying Mastra/arXiv references are independently checked.

## Mechanism Entries

### RM-01: Temporal, Source-Linked Memory Is Not Chunk Retrieval

source_id: R1

mechanism: raw episodes remain citable; claims/facts carry validity,
provenance, confidence, invalidation, and support/contradiction edges.

what_it_actually_proves: the raw research argues that long-lived memory quality
depends on temporal state, provenance, update handling, and selective
forgetting, not only embedding similarity.

what_it_does_not_prove: it does not prove KRN needs a separate graph DB, a
dashboard, a broad benchmark lane, or automatic memory mutation.

krn_implication: KRN memory records and source claims must stay source-linked,
temporal, invalidatable, and able to abstain from stale/conflicted memory.

current_repo_support: supported by `MemoryRecord` validity/lineage/confidence,
`SourceClaim` mechanism/does-not-prove/falsifier/trust fields, memory feedback
counts, source rejections, activation abstention/exclusions, anti-memory, and
retrieval validity fields.

current_repo_contradiction: some source-claim project selection still depends
on metadata, and some linked retrieval identity is metadata-driven. The memory
system is typed, but not all behavior-governing links are first-class yet.

decision: adopt partially. This is core KRN direction, but only through typed
Postgres-backed memory/source/retrieval/activation, not extra graph products or
new research layers.

falsifier: active memory can influence activation without lineage, validity, or
invalidation evidence.

affected_files_packages: `packages/core`, `packages/db`, `packages/harness`,
`packages/cli`, `docs/plans/memory-ideal-state/PLAN.md`.

next_required_action: promote known behavior-governing metadata into typed
fields/read models and strengthen golden activation proofs.

### RM-02: Observations Are Staging, Not Memory Core

source_id: R2

mechanism: run/source/tool/review events produce dated, source-ranged
observations; reflections synthesize candidates and gaps; only reviewed paths
may create Memory Core truth.

what_it_actually_proves: observational logs can reduce repeated broad retrieval
when they preserve temporal/source context and stay separate from final memory.

what_it_does_not_prove: Mastra-style observational memory should be cloned, or
that text observations alone are enough for KRN.

krn_implication: KRN may retain observation/reflection only if it enforces
source ranges, project scope, candidate-only reflection, and Memory Core review
gates.

current_repo_support: supported by observation core contracts, observation IO
schema, DB tables, repository source-range/evidence-link enforcement,
deterministic observer input, `krn observe --run`, reflection contracts,
reflection DB repository, reflection input selector, and `krn reflect`.

current_repo_contradiction: `ReflectionSourceClaimCandidateProposal` is only a
proposal shape; `krn reflect` currently writes no candidate rows. That is
honest, but docs must not imply the full observe -> reflect -> candidate ->
review path is complete.

decision: adopt as staging/candidate infrastructure. Reject any framing that
makes observation/reflection final truth or an autonomous brain.

falsifier: an observation or reflection path can create or promote a
MemoryRecord without review.

affected_files_packages: `packages/core/src/observations`,
`packages/core/src/reflection`, `packages/schema`, `packages/db`,
`packages/harness`, `packages/cli`.

next_required_action: keep no-Memory-Core-mutation proofs, repair source-claim
project scoping, and remove brain-magic language from current-state docs.

### RM-03: Gap / Abstention Behavior Is Product Behavior

source_id: R1, R2

mechanism: memory systems should know when evidence is insufficient, outdated,
conflicted, or only conceptual; the system must surface gaps instead of
inventing confidence.

what_it_actually_proves: the raw materials treat abstention/gap reporting as a
core memory-quality behavior.

what_it_does_not_prove: every uncertainty requires a new subsystem or a broad
multi-agent adjudicator.

krn_implication: ContextAssembly, activation, audit, golden tasks, and CLI
outputs should expose abstention/gap reasons.

current_repo_support: supported by `ActivationAbstention`, context exclusions,
observation prefix exclusions/warnings, reflection gap/contradiction reports,
golden expected outcomes including `abstain`, and Codex adapter rendering of
explicit exclusions / `doesNotProve`.

current_repo_contradiction: some abstention/prefix details are currently stored
as `ContextAssembly.metadata`, not first-class read-model fields.

decision: adopt. Gap/abstain behavior is product behavior, not optional
logging.

falsifier: weak/no evidence produces a confident context inclusion without an
exclusion, warning, or abstain reason.

affected_files_packages: `packages/core`, `packages/harness`,
`packages/codex-adapter`, `packages/cli`, `tests/fixtures/golden-tasks`.

next_required_action: harden typed read models for activation abstention and
add regression proofs for weak/noisy context selection.

### RM-04: Offline Consolidation Is Bounded Maintenance, Not Research Theater

source_id: R1, R2

mechanism: offline consolidation can deduplicate, detect contradictions,
refresh stale state, and improve memory policy outside the runtime answer path.

what_it_actually_proves: consolidation/dreaming is useful only as bounded,
auditable maintenance over already captured evidence.

what_it_does_not_prove: KRN should build Research Foundry, Pattern Vault,
autonomous meta-research, broad worker daemon, or hidden reasoning storage.

krn_implication: reflection/worker/eval surfaces must stay explicit,
candidate-only where appropriate, and reviewable.

current_repo_support: supported narrowly by manual `krn reflect`, reflection
records, worker job contracts with `requiresBackgroundLoop: false`, and
candidate-only reflection contract checks.

current_repo_contradiction: worker job types include compact/detect/expire
maintenance concepts, but there is no worker execution loop. That is acceptable
only if documented as skeleton.

decision: lab-test / narrow adopt.

falsifier: offline consolidation writes final truth, hides contradictions,
creates MemoryRecord, or runs as an unbounded autonomous loop.

affected_files_packages: `packages/core/src/reflection`, `packages/harness`,
`packages/workers`, `packages/db`, `packages/cli`.

next_required_action: keep worker docs honest as contract-only, and require a
future ADR/slice before any background loop exists.

### RM-05: Anti-Memory Is Equal In Importance To Memory

source_id: R2

mechanism: known-wrong, stale, harmful, or overgeneralized patterns need a
first-class blocking path so activation does not keep resurrecting them.

what_it_actually_proves: anti-memory is not a comment; it must participate in
selection and candidate review.

what_it_does_not_prove: fuzzy semantic anti-memory or automated poisoning
defense must be built before bounded exact blocking works.

krn_implication: anti-memory should block source claims, memory records, linked
search documents, and observation prefix items through explicit IDs/keys before
fuzzier matching.

current_repo_support: supported by `AntiMemoryRecord`, DB persistence, CLI add
path, activation exclusion logic, search/memory/source metadata bridges, and
observation prefix exclusion by exact key/subject/apply-to match.

current_repo_contradiction: exact matching is still string/id oriented, and
some search-document links are carried in metadata. Fuzzy anti-memory is not
proved and should not be claimed.

decision: adopt exact anti-memory blocking; defer fuzzy/semantic anti-memory
until behavior proofs exist.

falsifier: activation can include a context item explicitly blocked by
anti-memory.

affected_files_packages: `packages/core`, `packages/harness`,
`packages/db`, `packages/cli`.

next_required_action: move repeated anti-memory link metadata into typed links
where justified and add golden proofs for blocked activation.

### RM-06: Eval Runners Are Adapters, Not Truth

source_id: R1, R2

mechanism: behavior proof needs explicit cases, failure modes, evidence, and
regression signals. External eval runners can execute or format checks but
should not own product truth.

what_it_actually_proves: eval infrastructure is useful when it protects real
behavior with falsifiable cases.

what_it_does_not_prove: adopting Promptfoo, JSONL result mapping, or a local
passing smoke proves memory quality.

krn_implication: KRN should keep `GoldenTask` and behavior proof contracts
canonical; Promptfoo can be a bounded runner/result adapter.

current_repo_support: `GoldenTask` requires evidence/source refs and protected
failure modes; golden runner fails missing proofs; Promptfoo result adapter
validates unknown JSONL rows.

current_repo_contradiction: local Promptfoo smoke provider emits
`status=passed` deterministically from vars, so it is integration proof only.

decision: adopt bounded eval runner, reject eval/benchmark theater.

falsifier: docs or gates treat `pnpm eval:promptfoo:smoke` as proof that KRN
memory behavior works.

affected_files_packages: `packages/core/src/goldenTask.ts`,
`packages/harness/src/goldenRunner.ts`,
`packages/harness/src/goldenPromptfooExport.ts`,
`packages/harness/src/goldenPromptfooResult.ts`, `tests/fixtures/promptfoo`,
`README.md`, QG-05 docs.

next_required_action: rename/document current smoke as integration smoke and
add real behavior proof mapping before it becomes a regression gate.

### RM-07: Quality Discipline Must Not Become A Product Layer

source_id: operator correction plus reset goal, not raw research alone

mechanism: anti-slop standards belong in architecture, TypeScript, naming,
tests, review, and direct repair. Mechanical checks can help but should not
become a KRN subsystem for every quality concern.

what_it_actually_proves: the current QG-06 framing is an architectural risk
because it turns ordinary software quality into KRN-branded audit automation.

what_it_does_not_prove: all mechanical checks are useless.

krn_implication: keep only bounded guards that falsify known invariants; reject
`krn audit` as product direction or anti-slop engine.

current_repo_support: `docs/standards/*` already define general engineering
rules; `GOAL_REPO_RESET_AUDIT.md` explicitly rejects anti-slop subsystem
thinking.

current_repo_contradiction: README/root PLAN/memory PLAN/QG-04H currently frame
QG-06 as blocking `krn audit` quality gate automation.

decision: reject productized anti-slop. Keep only narrow mechanical guards
after audit/user approval.

falsifier: future docs make QG-06 or `krn audit` the main answer to software
quality.

affected_files_packages: `README.md`, `GOAL.md`, `PLAN.md`,
`docs/plans/memory-ideal-state/*`, `packages/cli/src/runAuditCommand.ts`,
`packages/harness/src/audit/auditChecks.ts`.

next_required_action: deproductize or delete QG-06 language before any feature
slice proceeds.
