This file is a merged representation of the entire codebase, combined into a single document by Repomix.

# File Summary

## Purpose
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
docs/
  architecture/
    observability-read-models.md
  runbooks/
    pattern-intake.md
  KRN_KERNEL.md
packages/
  cli/
    src/
      runKnowledgeCardsCommand.test.ts
      runKnowledgeCardsCommand.ts
  harness/
    src/
      brainKnowledgeReadModel.test.ts
      brainKnowledgeReadModel.ts
      brainKnowledgeReadModelInvariants.test.ts
AGENTS.md
GOAL.md
PLAN.md
PLANS.md
README.md
```

# Files

## File: docs/KRN_KERNEL.md
````markdown
# KRN Kernel Contract

## Product Thesis

KRN is a Codex Operating Layer / AI Engineering Control Plane.

Codex executes. KRN supplies:

- bounded context;
- service/store-backed memory;
- source grounding;
- policy;
- skills;
- eval expectations;
- traces;
- review gates;
- feedback.

## Kernel Law

Do not build more context. Build the machinery that selects, applies, verifies,
and forgets context.

## Current Product Boundary

This repo is a controlled-internal-alpha KRN harness workspace for technical
operators. It is not product-ready and not widened internal alpha.

The current durable boundary is:

- compact root `GOAL.md` and `PLAN.md` for active execution truth;
- `PLANS.md` for detailed continuous execution history and next-task synthesis;
- source-to-decision and pattern-intake gates for retained patterns;
- repo-local skills for repeated execution workflows;
- typed harness spine from operator intent through feedback/candidate outputs;
- store-backed memory/source/evidence/review behavior with markdown as docs,
  exports, seeds, or audit trails only;
- deterministic guards and smoke paths before broad product surfaces.

## What KRN Is Not

- prompt pack;
- dashboard-first app;
- benchmark lab;
- alternative executor for Codex;
- IDE agent;
- generic multi-agent framework;
- stack-specific agent zoo;
- markdown memory folder;
- archive of intentions.

## Runtime Truth

- Project memory must be store/service-backed.
- Markdown may be source, export, audit, seed, or backup.
- Raw onboarding material is quarantined in `docs/materials/`.
- Active context must be small, selected, and task-specific.

## Canonical Harness Spine

The accepted typed-model spine is:

```text
OperatorIntent -> TaskContract -> HarnessPlan -> ContextAssembly
  -> ExecutionContract -> CodexAdapterPlan -> ExecutionRun
  -> EvidenceBundle -> ReviewAssessment -> FeedbackDelta
  -> MemoryCandidate / SourceDecision / EvalCandidate
```

`ContextPacket` is a rendered artifact from `ContextAssembly`, not the central
domain model. Skill needs are `CapabilityRequirement` in core and
`CodexSkillBinding` in the Codex adapter layer.

## Decision Rule

Every retained source or pattern must pass the full chain:

```text
source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier
```

If a next step requires broad historical reread, copying old topology, or
building dashboard/evals before typed primitives and dogfood traces, stop and
re-scope.
````

## File: AGENTS.md
````markdown
# KRN Agent Instructions

KRN is a Codex Operating Layer / AI Engineering Control Plane.

Codex executes. KRN supplies bounded context, service/store-backed memory,
source grounding, policy, skills, eval expectations, traces, review gates, and
feedback.

Before editing:

1. Read `docs/KRN_KERNEL.md`.
2. Read only the docs needed for the current task.
3. Do not copy old repo topology.
4. Do not build dashboard, benchmark lane, broad multi-agent system, or
   file-backed runtime memory.
5. Do not treat `docs/materials/` as required reading; it is raw source/audit
   quarantine.
6. If a decision depends on a source, map it through source -> mechanism -> KRN
   implication -> decision/rejection.

For TypeScript changes:

- preserve strict type boundaries;
- keep external data as `unknown` until validated;
- avoid `any` unless isolated and justified;
- run typecheck before claiming completion.

For git history:

- use Semantic/Conventional Commits only; see
  `docs/standards/git-commits.md`.

For complex KRN implementation work, keep root `PLAN.md` current as the living
ExecPlan.

If the next step requires broad historical rereads, stop and re-scope.
````

## File: README.md
````markdown
# KRN Kernel

KRN is a Codex Operating Layer / AI Engineering Control Plane.

Codex executes. KRN supplies bounded context, service/store-backed memory,
source grounding, policy, skills, eval expectations, traces, review gates, and
feedback.

This repository is a kernel workspace and KRN harness implementation, not a
dashboard-first application.

## Start Here

1. Read `AGENTS.md`.
2. Read `docs/KRN_KERNEL.md`.
3. Use `GOAL.md` as the compact activation contract.
4. Use `PLAN.md` as the canonical living execution map.
5. Treat `docs/materials/` as raw source/audit quarantine, not default context.

`docs/plans/memory-ideal-state/PLAN.md`, QG docs, handoff docs, and review docs
are historical ledgers unless the root `PLAN.md` explicitly names them as
evidence for a slice.

## Current Truth

Root `PLAN.md` is the active compact product plan. Root `GOAL.md` is the compact
execution contract. Root `PLANS.md` carries detailed continuous execution
history, outcomes, and next-task synthesis.

Current status:

- controlled-internal-alpha for technical operators: yes / stronger;
- product-ready: no;
- widened internal alpha: no;
- real second-operator proof: blocked/deferred.

The current work loop is continuous and evidence-driven:

```text
controlled scenario
  -> evidence
  -> finding
  -> condensation decision
  -> rule / skill / guard / eval / memory candidate / source decision / repair
  -> append next task to PLANS.md
  -> continue
```

The legacy audit/anti-slop direction remains closed. Do not rebuild it as a
guardrail layer; keep useful Memory/Source/Evidence invariants in their native
mechanisms.

## Built

- Strict pnpm TypeScript workspace with
  `core/schema/db/harness/codex-adapter/cli/workers` packages.
- PostgreSQL/pgvector-oriented brain-store schema, migrations, repositories,
  readiness checks, and DB smoke commands.
- CLI surfaces for planning, doctor/readiness, evidence capture, Codex brief
  rendering, init/connect, manual observation, reflection, source, memory, and
  review workflows.
- Legacy AuditBundle domain/IO/repository contracts are removed. Empty legacy
  `audit_bundles` / `audit_findings` tables were dropped by migration `0012`
  after row-count and provenance review.
- Observation core contracts, IO schemas, DB schema, repository adapter,
  evidence/source-range linkage, deterministic observer input builder, manual
  `krn observe --run <id> [--persist]`, and observation prefix selection.
- Reflection contracts, records, input selection, gap/contradiction reporting,
  and manual `krn reflect`.
- MemoryCandidate, MemoryReviewGate, AntiMemory, source graph, activation,
  evidence/review feedback, GoldenTask, and Promptfoo adapter primitives.

## Built But Not Proven End-To-End

- The full loop
  `evidence -> observation -> reflection -> candidates -> review -> memory -> activation -> golden proof`
  is not complete as one governed product path.
- Reflection currently records/report candidates but must not be described as
  autonomous memory mutation or dreaming runtime.
- Worker jobs are persisted contracts/skeletons; production background
  execution is not built.
- Promptfoo is adopted only as a bounded eval runner/result adapter. The local
  Promptfoo smoke proves runner integration and result mapping only; it does
  not prove KRN memory behavior.
- DB package code exists, but live DB runtime truth depends on running DB
  commands in the current shell with `KRN_DATABASE_URL` configured.

## Not Built

- Dashboard.
- API server.
- KRN MCP server.
- Plugin package.
- Source crawler or research layer.
- Broad benchmark lane.
- Broad subagent system or runtime agent zoo.
- Runtime memory in markdown or `.krn`.
- Separate vector DB, graph DB, Redis, or Kafka.
- Productized anti-slop subsystem, quality engine, or autonomous audit layer.

## Verification

Common local checks:

```sh
pnpm typecheck
pnpm test
pnpm exec promptfoo --version
pnpm eval:promptfoo:smoke
git diff --check
```

DB runtime checks, only when local DB env is configured:

```sh
pnpm db:ready
pnpm --filter @krn/db db:check
pnpm db:smoke
```

Do not claim DB runtime truth unless DB commands were run in the current
environment.
````

## File: docs/architecture/observability-read-models.md
````markdown
# Observability Read Models

Status: D-03 proposal.

Purpose: define the first typed read models KRN needs before dashboard/API work.
These models are derived views over existing typed state. They are not new
source-of-truth tables in this slice.

## Rules

- Read models are read-only projections.
- Source of truth remains persisted run/evidence/context/memory state.
- Each model must name the operator action it supports.
- Each model must carry a falsifier so it cannot become decorative telemetry.
- No dashboard, API, MCP, worker runtime, or metrics warehouse is authorized by
  this document.

## ReviewBurdenReadModel

Owner: evidence/review loop.

Purpose: show whether a run became easier or harder to review.

Data sources:

- `ExecutionRun`;
- `EvidenceBundle.diffRisk`;
- `EvidenceBundle.reviewBurden`;
- `EvidenceBundle.commands`;
- `EvidenceBundle.metadata.changedFileClassification`;
- `ReviewAssessment.status`;
- `ReviewAssessment.findings`;
- `FeedbackDelta` candidate counts.

Fields:

```ts
type ReviewBurdenReadModel = {
  runId: string;
  evidenceBundleId?: string;
  diffRisk: "low" | "medium" | "high" | "unknown";
  commandProof: "strong" | "weak_default" | "mixed" | "missing";
  dirtyContext: "none" | "unrelated" | "unknown" | "missing_intent";
  candidateReviewLoad: "none" | "low" | "medium" | "high";
  reviewStatus: "pending" | "accepted" | "changes_requested" | "rejected" | "unknown";
  nextAction: string;
  doesNotProve: string;
};
```

Operator action:

- accept review;
- request changes;
- capture missing command evidence;
- split unrelated dirty context;
- reject vague candidates.

Falsifier:

```txt
If the model cannot tell whether command proof is operator-reported,
captured-output, default-template, or missing, it is not useful.
```

## ContextROIReadModel

Owner: activation/readback.

Purpose: show whether selected context reduced rereads or introduced noise.

Data sources:

- `ContextAssembly.inclusions`;
- `ContextAssembly.exclusions`;
- raw recall/search document inclusions;
- dogfood usefulness reports;
- `MemoryApplication` outcomes when available;
- source decision edges when available.

Fields:

```ts
type ContextROIReadModel = {
  runId: string;
  contextAssemblyId?: string;
  inclusionCount: number;
  exclusionCount: number;
  helpedCount: number;
  neutralCount: number;
  noiseCount: number;
  missingOwnerFiles: string[];
  rawRecallUsed: boolean;
  nextAction: string;
  doesNotProve: string;
};
```

Operator action:

- keep activation as-is;
- add owner-file recall case;
- demote noisy memory/source;
- add source claim or anti-memory;
- open bounded activation repair.

Falsifier:

```txt
If selected context cannot be classified as used/helped/noise/missing from run
evidence or dogfood report evidence, the model must report unknown instead of
claiming ROI.
```

## MemoryUsefulnessReadModel

Owner: memory governance.

Purpose: show whether memory selected in one run helped, hurt, or stayed unused.

Data sources:

- `MemoryRecord`;
- `MemoryCandidate`;
- `MemoryApplication`;
- `MemoryFeedbackEvent`;
- `AntiMemoryRecord`;
- `ContextAssembly.inclusions/exclusions`;
- source lineage and invalidation metadata.

Fields:

```ts
type MemoryUsefulnessReadModel = {
  memoryId: string;
  runId?: string;
  status: "active" | "stale" | "invalidated" | "superseded" | "unknown";
  selected: boolean;
  appliedOutcome: "helped" | "hurt" | "neutral" | "stale" | "unknown";
  positiveFeedbackCount: number;
  negativeFeedbackCount: number;
  antiMemoryConflict: boolean;
  recommendedAction:
    | "keep"
    | "strengthen"
    | "demote"
    | "invalidate"
    | "convert_to_anti_memory"
    | "no_action"
    | "unknown";
  doesNotProve: string;
};
```

Operator action:

- keep memory;
- strengthen memory with evidence;
- demote stale or noisy memory;
- invalidate memory;
- create/review anti-memory candidate.

Falsifier:

```txt
If memory was selected but no application feedback exists, usefulness is
unknown. Selected does not mean helped.
```

## BrainKnowledgeReadModel

Owner: source-to-decision / pattern brain / evidence-review loop.

Purpose: define the minimum read-only card shape needed before UI/search over
KRN knowledge. This model is for retrieval and operator review. It is not a
write path to Memory Core, SourceDecision, or candidates.

Data sources:

- `SourceClaim`;
- `SourceDecision`;
- pattern catalog entries;
- `MemoryRecord`;
- `MemoryCandidate`;
- `AntiMemoryCandidate`;
- `EvalCandidate`;
- evidence bundles and run reports;
- ADRs, standards, skills, and source-to-decision records.

Fields:

```ts
type BrainKnowledgeKind =
  | "source_claim"
  | "source_decision"
  | "pattern"
  | "memory"
  | "memory_candidate"
  | "anti_memory_candidate"
  | "eval_candidate"
  | "adr"
  | "standard"
  | "skill"
  | "run_evidence";

type BrainKnowledgeStatus =
  | "active"
  | "candidate"
  | "accepted"
  | "rejected"
  | "deferred"
  | "stale"
  | "superseded"
  | "unknown";

type BrainKnowledgeConfidence = "high" | "medium" | "low" | "unknown";

type BrainKnowledgeReviewability =
  | "ready"
  | "needs_more_evidence"
  | "too_vague"
  | "duplicate"
  | "not_useful"
  | "unknown";

type BrainKnowledgeReadModel = {
  id: string;
  kind: BrainKnowledgeKind;
  status: BrainKnowledgeStatus;
  title: string;
  summary: string;
  confidence: BrainKnowledgeConfidence;
  reviewability: BrainKnowledgeReviewability;
  sourceRefs: string[];
  evidenceRefs: string[];
  consumers: string[];
  falsifier: string;
  doesNotProve: string;
  temporal:
    | {
        kind: "current";
        observedAt?: string;
      }
    | {
        kind: "historical";
        validFrom?: string;
        validUntil?: string;
        observedAt?: string;
      }
    | {
        kind: "unknown";
      };
  dissent:
    | {
        kind: "none";
      }
    | {
        kind: "conflict";
        refs: string[];
        summary: string;
      }
    | {
        kind: "unknown";
      };
  nextAction:
    | "use"
    | "review"
    | "promote"
    | "demote"
    | "invalidate"
    | "add_evidence"
    | "reject"
    | "defer"
    | "unknown";
};
```

Operator action:

- use a retained pattern during a repair;
- review a candidate;
- add missing evidence;
- reject stale/decorative knowledge;
- open a bounded enforcement gate;
- decide whether a UI/search card is actionable.

Falsifier:

```txt
If a knowledge card cannot show evidence refs, source refs, consumer,
falsifier, reviewability, and does-not-prove boundary, it is not ready for UI
or search surfacing.
```

UI/search readiness rule:

```txt
Search may rank and display only read-only BrainKnowledgeReadModel cards. It
must not mutate Memory Core, SourceDecision, candidate status, or evidence.
```

## Deferred Models

Deferred until more product evidence exists:

- dashboard aggregate metrics;
- team/user metrics;
- cross-repo metrics;
- model/provider performance metrics;
- worker throughput;
- source crawler coverage.

## Next Build Candidate

The next implementation slice may add pure read-model helpers over existing
aggregates only if D-03 is accepted. It should not add persistence or dashboard
surface first.
````

## File: docs/runbooks/pattern-intake.md
````markdown
# Pattern Intake Runbook

Status: operator runbook.

Use this runbook when a course, paper, official doc, practitioner article,
competitor doc, local report, target-repo finding, or user-provided research
might improve KRN.

## Core Rule

Do not store sources because they look smart.

Every retained source must pass:

```txt
source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier
```

If any step is missing, reject or defer the source. Do not create a research
archive, crawler, broad reading backlog, or active-context pile.

## Allowed Sources

```txt
official docs
papers
high-quality public course page
user-provided course notes or summaries
practitioner writing
competitor docs
repo-local evidence
target-repo evidence
user-provided research
```

## Legal And Content Boundary

Do not copy paid or proprietary course material into KRN.

Allowed:

- public URLs;
- short mechanism summaries;
- user-provided notes when the user explicitly supplies them;
- links plus KRN decisions;
- repo-local evidence and target-run reports.

Forbidden:

- transcripts of paid course lessons;
- source dumps;
- scraped course modules;
- copyrighted long excerpts;
- retaining a source with no consumer.

## Trust Tiers

```txt
high:
  official docs, repo-local evidence, CI evidence, DB readback, target-run
  reports with command proof.

medium:
  respected practitioner writing, public course pages, papers with plausible
  mechanism but no local falsifier yet.

low:
  social posts, unverified claims, stale docs, anecdotal competitor behavior,
  unreviewed notes.
```

Trust tier does not decide adoption by itself. A high-trust source can still be
irrelevant, and a medium-trust source can still create a useful lab-test.

## Intake Workflow

1. Identify the exact source.
2. Classify trust tier.
3. Query the retained pattern catalog when a retained pattern may already cover
   the mechanism:

   ```sh
   pnpm --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text <pattern-or-mechanism>
   ```

   Use catalog output as read-only context. Do not treat it as ranking, product
   search, DB truth, memory promotion, or source authority by itself.
4. Extract the mechanism, not the vibe.
5. State the KRN implication.
6. Decide one of:
   - adopt;
   - reject;
   - lab-test;
   - defer.
7. Pick exactly one primary consumer.
8. Add a falsifier.
9. State what the source does not prove.
10. Decide whether a candidate should be emitted.
11. Keep the retained note as small as possible.
12. After execution, record source usefulness feedback or explain why it was not
    measured.

## Consumer Routing

Choose one primary consumer:

```txt
standard:
  durable coding, review, security, TypeScript, or quality rule.

skill:
  repeated execution workflow for Codex.

ADR:
  architecture, infra, storage, runtime, or package topology decision.

eval/golden candidate:
  behavior can be falsified by a test, fixture, or CI step.

memory/source candidate:
  useful future recall, still review-gated and never automatically promoted.

CLI/readback/CI behavior:
  operator-facing output, command behavior, or enforcement surface.

bounded repair:
  one small source change with verification.

rejection:
  decorative, unsupported, stale, illegal to retain, or mismatched to KRN.
```

If there is no consumer, reject or defer.

## Surface Consumer Matrix

Use this matrix before adopting a source for a non-trivial KRN slice. Pick one
primary surface first, then one primary consumer. If the source does not fit a
surface and consumer, reject or defer it.

| Surface | Preferred source classes | Preferred consumers | Proof / falsifier | Reject when |
|---|---|---|---|---|
| Infra / storage / migrations / queues | official docs, repo evidence, CI/DB evidence, target-run reports, papers as hypotheses | ADR, bounded repair, CI/readback behavior, eval/golden candidate | DB readiness, migration check, repository test, rollback path, or ADR falsifier proves the mechanism matters locally | it only names a tool, changes topology broadly, or lacks rollback/failure evidence |
| Harness / activation / memory / review gates | repo evidence, dogfood reports, target evidence, papers as hypotheses, official docs for runtime mechanics | skill, eval/golden candidate, memory/source candidate, bounded repair | future run shows lower context waste, better recall, clearer reviewability, or a failing golden catches drift | it optimizes scoring without run evidence or treats persisted data as useful by default |
| CI / release / eval / Promptfoo | official docs, CI evidence, repo evidence, controlled scenario reports | CI/readback behavior, eval/golden candidate, ADR when topology changes | CI catches a real regression or smoke result has a stated proof/non-proof boundary | it creates benchmark theater, broad lanes, or checks that do not protect a named behavior |
| Codex surfaces / skills / hooks / MCP / subagents | official Codex docs, repo-local skill evidence, operator reports, controlled target reports | skill, ADR, CLI/readback behavior, bounded repair | repeated workflow becomes executable with less context, or a hook/MCP/subagent decision has a clear trust boundary | it expands AGENTS.md, creates agent zoo, or treats guardrails as full enforcement |
| Target-repo workflow | target evidence, owner/operator input, repo evidence, CI evidence | skill, CLI/readback behavior, memory/source candidate, bounded repair | target trial preserves owner scope, dirty-state rules, patch lifecycle, and command proof | it writes to living repos without explicit scope or calls self/headless work second-operator proof |
| TypeScript boundaries | repo evidence, TypeScript standards, public course pages, practitioner writing, compiler/test evidence | standard, bounded repair, eval/golden candidate, memory/source candidate | typecheck/tests prove unknown-first parsing, narrow unions, exported public types, or invalid-state prevention | it causes broad type rewrites, weakens types to pass, or adopts style without lifecycle evidence |
| Security / permissions / trust boundaries | official docs, repo evidence, target evidence, CI evidence, papers as risk hypotheses | ADR, standard, skill, CI/readback behavior | permission boundary, sandbox rule, secret handling, or external IO path has explicit proof and rollback | it relies on convention, hidden behavior, or a claim that cannot be tested locally |
| Operator UX / CLI / readback | operator reports, dogfood reports, target-run reports, CLI evidence, official docs for mechanics | CLI/readback behavior, skill, bounded repair, memory/source candidate | output reduces review burden, separates proof from non-proof, and survives a focused CLI test | it adds wording without changing a decision, hides weak evidence, or requires broad rereads |

Matrix rules:

- One retained source gets one primary surface and one primary consumer.
- Cross-surface implications are notes, not extra consumers, unless a later slice
  promotes them.
- A course or paper normally starts as `lab_test` unless repo/target evidence
  already falsifies or confirms the mechanism.
- A source that only says "use best practices" is decorative.
- A source that cannot name a local proof, falsifier, or rejection condition is
  not ready.

## Pattern Application Gate

Use this gate for every non-trivial KRN slice that touches infra, harness,
CI/eval, Codex surfaces, TypeScript boundaries, target workflows, security,
operator UX, or research/paper/course-driven work.

Before coding:

```sh
pnpm --filter @krn/cli krn knowledge cards \
  --catalog-file docs/brain-knowledge/catalog.json \
  --usefulness-outcome helped \
  --text "<slice topic>"
```

Then record:

```txt
selected_patterns:
  - pattern_id:
    expected_use:
    consumer:
    falsifier:

rejected_or_deferred_patterns:
  - pattern_id:
    reason:
```

After verification, classify selected or missing patterns:

```txt
pattern_application:
  - pattern_id:
    outcome: helped | neutral | noise | missing | stale | unknown
    evidence:
    does_not_prove:
```

Rules:

- do not apply retained patterns by vibe;
- do not select more than five patterns without a written reason;
- if no helped pattern is relevant, say why before coding;
- if a missing pattern would have changed the implementation, record it as a
  candidate instead of silently adding a broad source intake task;
- usefulness feedback is added only when the run evidence supports it.

## Output Template

```yaml
source_id:
title:
url_or_ref:
trust_tier: high | medium | low
source_class:
mechanism:
krn_implication:
decision_kind: adopt | reject | lab_test | defer
decision:
consumer:
falsifier:
does_not_prove:
candidate_output:
  type: MemoryCandidate | SourceDecision | EvalCandidate | SkillCandidate | none
  reviewability: ready | needs_more_evidence | too_vague | duplicate | not_useful | unknown
source_usefulness_feedback:
  status: measured_with_evidence_capture | not_measured
  outcome: selected | used | helped | neutral | noise | stale | unknown
  reason:
  evidence_refs:
  does_not_prove:
next_action:
```

## Usefulness Feedback Closure

If a retained source shaped a code, infra, harness, CI, eval, TypeScript,
operator UX, or Codex-surface decision, close the feedback loop after the run.

Preferred evidence capture shape:

```sh
krn evidence capture \
  --source-usefulness "claim:<source-id>=helped|reason|evidence-ref[,ref]|doesNotProve"
```

Use `decision:<id>` when the source outcome belongs to a SourceDecision.

If usefulness is not measured, the report or plan outcome must say why. Allowed
reasons:

```txt
no persisted run
source was rejected
source was background context only
no implementation/review decision used it
legal/content boundary
```

This closure is what keeps courses, papers, docs, and practitioner writing from
becoming decorative authority.

## Rejection Reasons

Use explicit rejection instead of quiet accumulation:

```txt
decorative:
  no mechanism or KRN implication.

no_consumer:
  interesting, but no standard/skill/ADR/eval/memory/CLI/repair target.

no_falsifier:
  cannot be checked locally or in a future controlled scenario.

copyright_or_access:
  source cannot be legally retained or summarized beyond a public mechanism.

stale_or_conflicting:
  contradicted by newer official docs, repo evidence, or target evidence.

too_broad:
  would require a research project instead of one bounded KRN decision.
```

## Examples

### Official Codex Docs To Skill

```yaml
source_id: codex-skills-progressive-disclosure
title: Codex Skills
url_or_ref: docs/KRN_SOURCES.md#skills
trust_tier: high
source_class: official docs
mechanism: Skills expose reusable workflows through progressive disclosure.
krn_implication: Repeated KRN workflows belong in repo-local skills, not giant AGENTS.md.
decision_kind: adopt
decision: Keep skills as the repeated workflow surface.
consumer: skill
falsifier: A repeated workflow cannot be executed from the skill without broad rereads.
does_not_prove: Many skills are useful by default.
candidate_output:
  type: none
  reviewability: ready
next_action: update the relevant skill only when a repeated workflow exists.
```

### TypeScript Course Page To Standard

```yaml
source_id: total-typescript-unions-narrowing
title: Unions, Literals, And Narrowing
url_or_ref: docs/KRN_SOURCES.md#unions-literals-and-narrowing
trust_tier: medium
source_class: high-quality public course page
mechanism: Literal unions constrain finite states and make invalid transitions visible.
krn_implication: KRN status, provenance, lifecycle, and candidate states should use narrow unions when fields differ by state.
decision_kind: adopt
decision: Keep discriminated-union guidance in the TypeScript standards.
consumer: standard
falsifier: A future lifecycle model uses optional object soup and permits invalid state combinations.
does_not_prove: Every object needs a discriminant or a broad type rewrite is valuable.
candidate_output:
  type: EvalCandidate
  reviewability: needs_more_evidence
next_action: create a bounded type-boundary check only when source evidence finds drift.
```

### Target Evidence To Bounded Repair

```yaml
source_id: target-dirty-context-evidence
title: Target dirty state observed before repair
url_or_ref: docs/runbooks/target-repo-testing.md
trust_tier: high
source_class: target-repo evidence
mechanism: Dirty target files can belong to another operator and must not be normalized by KRN.
krn_implication: Target repair must downgrade to observation-only unless current writable scope is explicit.
decision_kind: adopt
decision: Keep target dirty-state and patch lifecycle rules in target repo testing.
consumer: CLI/readback/CI behavior
falsifier: A future target trial edits or commits pre-existing dirty files without owner scope.
does_not_prove: Target repair is never allowed.
candidate_output:
  type: MemoryCandidate
  reviewability: ready
next_action: record owner/stability inputs before target writes.
```

## What To Store

Store only the decision record, not the source body.

Preferred storage:

- `docs/KRN_SOURCES.md` for durable source maps;
- ADR for architecture decisions;
- standards doc for durable coding/review rules;
- skill for repeated workflow;
- report for one controlled scenario;
- eval/golden candidate when behavior is falsifiable;
- memory/source candidate only through review-gated paths.

## Verification

A pattern intake is useful only if it does at least one of:

- changes a decision;
- rejects a path;
- defines a risk;
- creates a testable hypothesis;
- constrains implementation;
- creates a bounded next task.

If it does none of those, delete the intake note or mark it rejected.
````

## File: packages/harness/src/brainKnowledgeReadModel.test.ts
````typescript
import { readFileSync } from "node:fs";

import {
  describe,
  expect,
  it
} from "vitest";

import {
  brainKnowledgeCardFromRetainedPatternDecision,
  cardsWithBrainKnowledgeUsefulnessFeedback,
  parseBrainKnowledgeReadModel,
  parseRetainedPatternDecision,
  parseBrainKnowledgeUsefulnessFeedbackList,
  searchBrainKnowledgeCards
} from "./brainKnowledgeReadModel.js";

const readRootFile = (path: string): string =>
  readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8");

const readJsonRootFile = (path: string): unknown =>
  JSON.parse(readRootFile(path));

const cardFixture = (): unknown =>
  readJsonRootFile("tests/fixtures/brain-knowledge/cards/ts-boundary-unknown-first-result-state.json");

const patternDecisionFixture = (): unknown =>
  readJsonRootFile("docs/patterns/retained-patterns/ts-boundary-unknown-first-result-state.json");

describe("Brain knowledge read model", () => {
  it("parses a concrete knowledge card fixture from unknown JSON", () => {
    const card = parseBrainKnowledgeReadModel(cardFixture());

    expect(card).toMatchObject({
      id: "pattern:ts-boundary-unknown-first-result-state",
      kind: "pattern",
      status: "active",
      reviewability: "ready",
      confidence: "high",
      nextAction: "use"
    });
  });

  it("rejects cards missing required evidence boundaries", () => {
    const card = parseBrainKnowledgeReadModel({
      id: "pattern:missing-evidence",
      kind: "pattern",
      status: "active",
      title: "Missing evidence",
      summary: "This should not parse.",
      confidence: "low",
      reviewability: "unknown",
      sourceRefs: [],
      evidenceRefs: [],
      consumers: ["test"],
      falsifier: "missing",
      doesNotProve: "missing",
      temporal: {
        kind: "unknown"
      },
      dissent: {
        kind: "unknown"
      },
      nextAction: "unknown"
    });

    expect(card).toBeUndefined();
  });

  it("filters cards by kind, status, reviewability, and text", () => {
    const card = parseBrainKnowledgeReadModel(cardFixture());

    if (card === undefined) {
      throw new Error("Expected card fixture to parse.");
    }

    expect(searchBrainKnowledgeCards([card], {
      kind: "pattern",
      status: "active",
      reviewability: "ready",
      text: "unknown-first"
    })).toEqual([card]);

    expect(searchBrainKnowledgeCards([card], {
      kind: "memory",
      text: "unknown-first"
    })).toEqual([]);

    expect(searchBrainKnowledgeCards([card], {
      text: "nonexistent"
    })).toEqual([]);
  });

  it("filters cards by latest usefulness outcome", () => {
    const card = parseBrainKnowledgeReadModel(cardFixture());
    const feedback = parseBrainKnowledgeUsefulnessFeedbackList({
      feedback: [
        {
          cardId: "pattern:ts-boundary-unknown-first-result-state",
          outcome: "helped",
          summary: "The retained pattern guided an unknown-first boundary repair.",
          evidenceRefs: ["docs/reviews/newer.md"],
          doesNotProve: "This feedback does not prove product readiness.",
          observedAt: "2026-06-28"
        }
      ]
    });

    if (card === undefined || feedback === undefined) {
      throw new Error("Expected card and usefulness feedback fixtures to parse.");
    }

    const cards = cardsWithBrainKnowledgeUsefulnessFeedback([card], feedback);

    expect(searchBrainKnowledgeCards(cards, {
      usefulnessOutcome: "helped"
    })).toEqual(cards);
    expect(searchBrainKnowledgeCards(cards, {
      usefulnessOutcome: "noise"
    })).toEqual([]);
    expect(searchBrainKnowledgeCards(cards, {
      usefulnessOutcome: "none"
    })).toEqual([]);
  });

  it("filters cards with no usefulness feedback", () => {
    const card = parseBrainKnowledgeReadModel(cardFixture());

    if (card === undefined) {
      throw new Error("Expected card fixture to parse.");
    }

    expect(searchBrainKnowledgeCards([card], {
      usefulnessOutcome: "none"
    })).toEqual([card]);
    expect(searchBrainKnowledgeCards([card], {
      usefulnessOutcome: "helped"
    })).toEqual([]);
    expect(searchBrainKnowledgeCards([card], {
      usefulnessOutcome: "none",
      text: "unknown-first"
    })).toEqual([card]);
    expect(searchBrainKnowledgeCards([card], {
      usefulnessOutcome: "none",
      text: "missing text"
    })).toEqual([]);
  });

  it("produces the TypeScript boundary knowledge card from the retained pattern decision", () => {
    const patternDecision = parseRetainedPatternDecision(patternDecisionFixture());
    const expectedCard = parseBrainKnowledgeReadModel(cardFixture());

    if (patternDecision === undefined) {
      throw new Error("Expected retained pattern decision fixture to parse.");
    }

    if (expectedCard === undefined) {
      throw new Error("Expected brain knowledge card fixture to parse.");
    }

    expect(brainKnowledgeCardFromRetainedPatternDecision(patternDecision)).toEqual(expectedCard);
  });

  it("parses and applies latest usefulness feedback from unknown JSON", () => {
    const card = parseBrainKnowledgeReadModel(cardFixture());
    const feedback = parseBrainKnowledgeUsefulnessFeedbackList({
      feedback: [
        {
          cardId: "pattern:ts-boundary-unknown-first-result-state",
          outcome: "neutral",
          summary: "Older feedback should not win.",
          evidenceRefs: ["docs/reviews/older.md"],
          doesNotProve: "Older feedback does not prove current usefulness.",
          observedAt: "2026-06-27"
        },
        {
          cardId: "pattern:ts-boundary-unknown-first-result-state",
          outcome: "helped",
          summary: "The retained pattern guided an unknown-first boundary repair.",
          evidenceRefs: ["docs/reviews/newer.md"],
          doesNotProve: "This feedback does not prove product readiness.",
          observedAt: "2026-06-28"
        }
      ]
    });

    if (card === undefined || feedback === undefined) {
      throw new Error("Expected card and usefulness feedback fixtures to parse.");
    }

    expect(cardsWithBrainKnowledgeUsefulnessFeedback([card], feedback)).toMatchObject([
      {
        id: "pattern:ts-boundary-unknown-first-result-state",
        usefulnessFeedback: {
          outcome: "helped",
          summary: "The retained pattern guided an unknown-first boundary repair.",
          evidenceRefs: ["docs/reviews/newer.md"]
        }
      }
    ]);
  });

  it("rejects usefulness feedback missing proof boundaries", () => {
    expect(parseBrainKnowledgeUsefulnessFeedbackList({
      feedback: [
        {
          cardId: "pattern:missing-boundary",
          outcome: "helped",
          summary: "Missing doesNotProve should fail.",
          evidenceRefs: ["docs/reviews/report.md"]
        }
      ]
    })).toBeUndefined();
  });
});
````

## File: packages/harness/src/brainKnowledgeReadModel.ts
````typescript
export type BrainKnowledgeKind =
  | "source_claim"
  | "source_decision"
  | "pattern"
  | "memory"
  | "memory_candidate"
  | "anti_memory_candidate"
  | "eval_candidate"
  | "adr"
  | "standard"
  | "skill"
  | "run_evidence";

export type BrainKnowledgeStatus =
  | "active"
  | "candidate"
  | "accepted"
  | "rejected"
  | "deferred"
  | "stale"
  | "superseded"
  | "unknown";

export type BrainKnowledgeConfidence = "high" | "medium" | "low" | "unknown";

export type BrainKnowledgeReviewability =
  | "ready"
  | "needs_more_evidence"
  | "too_vague"
  | "duplicate"
  | "not_useful"
  | "unknown";

export type BrainKnowledgeTemporal =
  | {
      kind: "current";
      observedAt?: string;
    }
  | {
      kind: "historical";
      validFrom?: string;
      validUntil?: string;
      observedAt?: string;
    }
  | {
      kind: "unknown";
    };

export type BrainKnowledgeDissent =
  | {
      kind: "none";
    }
  | {
      kind: "conflict";
      refs: string[];
      summary: string;
    }
  | {
      kind: "unknown";
    };

export type BrainKnowledgeNextAction =
  | "use"
  | "review"
  | "promote"
  | "demote"
  | "invalidate"
  | "add_evidence"
  | "reject"
  | "defer"
  | "unknown";

export type BrainKnowledgeUsefulnessOutcome =
  | "helped"
  | "neutral"
  | "noise"
  | "stale"
  | "unknown";

export type BrainKnowledgeUsefulnessOutcomeFilter =
  | BrainKnowledgeUsefulnessOutcome
  | "none";

export type BrainKnowledgeUsefulnessFeedback = {
  cardId: string;
  outcome: BrainKnowledgeUsefulnessOutcome;
  summary: string;
  evidenceRefs: string[];
  doesNotProve: string;
  observedAt?: string;
};

export type BrainKnowledgeReadModel = {
  id: string;
  kind: BrainKnowledgeKind;
  status: BrainKnowledgeStatus;
  title: string;
  summary: string;
  confidence: BrainKnowledgeConfidence;
  reviewability: BrainKnowledgeReviewability;
  sourceRefs: string[];
  evidenceRefs: string[];
  consumers: string[];
  falsifier: string;
  doesNotProve: string;
  temporal: BrainKnowledgeTemporal;
  dissent: BrainKnowledgeDissent;
  nextAction: BrainKnowledgeNextAction;
  usefulnessFeedback?: BrainKnowledgeUsefulnessFeedback;
};

export type BrainKnowledgeSearchFilter = {
  kind?: BrainKnowledgeKind;
  status?: BrainKnowledgeStatus;
  reviewability?: BrainKnowledgeReviewability;
  usefulnessOutcome?: BrainKnowledgeUsefulnessOutcomeFilter;
  text?: string;
};

export type RetainedPatternAdoptionStatus =
  | "adopt_now"
  | "lab"
  | "later"
  | "reject";

export type RetainedPatternDecision = {
  patternId: string;
  name: string;
  adoptionStatus: RetainedPatternAdoptionStatus;
  confidence: BrainKnowledgeConfidence;
  reviewability: BrainKnowledgeReviewability;
  decision: string;
  sourceRefs: string[];
  evidenceRefs: string[];
  consumers: string[];
  falsifier: string;
  doesNotProve: string;
  observedAt?: string;
  nextAction: BrainKnowledgeNextAction;
};

const knowledgeKinds = new Set<BrainKnowledgeKind>([
  "source_claim",
  "source_decision",
  "pattern",
  "memory",
  "memory_candidate",
  "anti_memory_candidate",
  "eval_candidate",
  "adr",
  "standard",
  "skill",
  "run_evidence"
]);

const knowledgeStatuses = new Set<BrainKnowledgeStatus>([
  "active",
  "candidate",
  "accepted",
  "rejected",
  "deferred",
  "stale",
  "superseded",
  "unknown"
]);

const knowledgeConfidences = new Set<BrainKnowledgeConfidence>([
  "high",
  "medium",
  "low",
  "unknown"
]);

const knowledgeReviewabilities = new Set<BrainKnowledgeReviewability>([
  "ready",
  "needs_more_evidence",
  "too_vague",
  "duplicate",
  "not_useful",
  "unknown"
]);

const knowledgeNextActions = new Set<BrainKnowledgeNextAction>([
  "use",
  "review",
  "promote",
  "demote",
  "invalidate",
  "add_evidence",
  "reject",
  "defer",
  "unknown"
]);

const knowledgeUsefulnessOutcomes = new Set<BrainKnowledgeUsefulnessOutcome>([
  "helped",
  "neutral",
  "noise",
  "stale",
  "unknown"
]);

const patternAdoptionStatuses = new Set<RetainedPatternAdoptionStatus>([
  "adopt_now",
  "lab",
  "later",
  "reject"
]);

export function parseBrainKnowledgeReadModel(value: unknown): BrainKnowledgeReadModel | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const kind = parseSetValue(value["kind"], knowledgeKinds);
  const status = parseSetValue(value["status"], knowledgeStatuses);
  const confidence = parseSetValue(value["confidence"], knowledgeConfidences);
  const reviewability = parseSetValue(value["reviewability"], knowledgeReviewabilities);
  const temporal = parseTemporal(value["temporal"]);
  const dissent = parseDissent(value["dissent"]);
  const nextAction = parseSetValue(value["nextAction"], knowledgeNextActions);

  const id = parseNonEmptyString(value["id"]);
  const title = parseNonEmptyString(value["title"]);
  const summary = parseNonEmptyString(value["summary"]);
  const sourceRefs = parseNonEmptyStringArray(value["sourceRefs"]);
  const evidenceRefs = parseNonEmptyStringArray(value["evidenceRefs"]);
  const consumers = parseNonEmptyStringArray(value["consumers"]);
  const falsifier = parseNonEmptyString(value["falsifier"]);
  const doesNotProve = parseNonEmptyString(value["doesNotProve"]);
  const usefulnessFeedback = value["usefulnessFeedback"] === undefined
    ? undefined
    : parseBrainKnowledgeUsefulnessFeedback(value["usefulnessFeedback"]);

  if (
    id === undefined ||
    kind === undefined ||
    status === undefined ||
    title === undefined ||
    summary === undefined ||
    confidence === undefined ||
    reviewability === undefined ||
    sourceRefs === undefined ||
    evidenceRefs === undefined ||
    consumers === undefined ||
    falsifier === undefined ||
    doesNotProve === undefined ||
    temporal === undefined ||
    dissent === undefined ||
    nextAction === undefined ||
    (value["usefulnessFeedback"] !== undefined && usefulnessFeedback === undefined)
  ) {
    return undefined;
  }

  return {
    id,
    kind,
    status,
    title,
    summary,
    confidence,
    reviewability,
    sourceRefs,
    evidenceRefs,
    consumers,
    falsifier,
    doesNotProve,
    temporal,
    dissent,
    nextAction,
    ...(usefulnessFeedback === undefined ? {} : { usefulnessFeedback })
  };
}

export function parseBrainKnowledgeUsefulnessFeedback(value: unknown): BrainKnowledgeUsefulnessFeedback | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const cardId = parseNonEmptyString(value["cardId"]);
  const outcome = parseSetValue(value["outcome"], knowledgeUsefulnessOutcomes);
  const summary = parseNonEmptyString(value["summary"]);
  const evidenceRefs = parseNonEmptyStringArray(value["evidenceRefs"]);
  const doesNotProve = parseNonEmptyString(value["doesNotProve"]);

  if (
    cardId === undefined ||
    outcome === undefined ||
    summary === undefined ||
    evidenceRefs === undefined ||
    doesNotProve === undefined ||
    !optionalStringFields(value, ["observedAt"])
  ) {
    return undefined;
  }

  return {
    cardId,
    outcome,
    summary,
    evidenceRefs,
    doesNotProve,
    ...pickOptionalString(value, "observedAt")
  };
}

export function parseBrainKnowledgeUsefulnessFeedbackList(value: unknown): BrainKnowledgeUsefulnessFeedback[] | undefined {
  if (!isRecord(value) || !Array.isArray(value["feedback"])) {
    return undefined;
  }

  const feedback = value["feedback"].map(parseBrainKnowledgeUsefulnessFeedback);

  return feedback.every((item) => item !== undefined)
    ? feedback
    : undefined;
}

export function parseRetainedPatternDecision(value: unknown): RetainedPatternDecision | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const patternId = parseNonEmptyString(value["patternId"]);
  const name = parseNonEmptyString(value["name"]);
  const adoptionStatus = parseSetValue(value["adoptionStatus"], patternAdoptionStatuses);
  const confidence = parseSetValue(value["confidence"], knowledgeConfidences);
  const reviewability = parseSetValue(value["reviewability"], knowledgeReviewabilities);
  const decision = parseNonEmptyString(value["decision"]);
  const sourceRefs = parseNonEmptyStringArray(value["sourceRefs"]);
  const evidenceRefs = parseNonEmptyStringArray(value["evidenceRefs"]);
  const consumers = parseNonEmptyStringArray(value["consumers"]);
  const falsifier = parseNonEmptyString(value["falsifier"]);
  const doesNotProve = parseNonEmptyString(value["doesNotProve"]);
  const nextAction = parseSetValue(value["nextAction"], knowledgeNextActions);

  if (
    patternId === undefined ||
    name === undefined ||
    adoptionStatus === undefined ||
    confidence === undefined ||
    reviewability === undefined ||
    decision === undefined ||
    sourceRefs === undefined ||
    evidenceRefs === undefined ||
    consumers === undefined ||
    falsifier === undefined ||
    doesNotProve === undefined ||
    nextAction === undefined ||
    !optionalStringFields(value, ["observedAt"])
  ) {
    return undefined;
  }

  return {
    patternId,
    name,
    adoptionStatus,
    confidence,
    reviewability,
    decision,
    sourceRefs,
    evidenceRefs,
    consumers,
    falsifier,
    doesNotProve,
    ...pickOptionalString(value, "observedAt"),
    nextAction
  };
}

export function brainKnowledgeCardFromRetainedPatternDecision(
  pattern: RetainedPatternDecision
): BrainKnowledgeReadModel {
  return {
    id: `pattern:${pattern.patternId}`,
    kind: "pattern",
    status: statusFromPatternAdoption(pattern.adoptionStatus),
    title: pattern.name,
    summary: pattern.decision,
    confidence: pattern.confidence,
    reviewability: pattern.reviewability,
    sourceRefs: pattern.sourceRefs,
    evidenceRefs: pattern.evidenceRefs,
    consumers: pattern.consumers,
    falsifier: pattern.falsifier,
    doesNotProve: pattern.doesNotProve,
    temporal: {
      kind: "current",
      ...(pattern.observedAt === undefined ? {} : { observedAt: pattern.observedAt })
    },
    dissent: {
      kind: "none"
    },
    nextAction: pattern.nextAction
  };
}

export function cardsWithBrainKnowledgeUsefulnessFeedback(
  cards: BrainKnowledgeReadModel[],
  feedback: readonly BrainKnowledgeUsefulnessFeedback[]
): BrainKnowledgeReadModel[] {
  const latestByCardId = new Map<string, BrainKnowledgeUsefulnessFeedback>();

  for (const item of feedback) {
    const previous = latestByCardId.get(item.cardId);

    if (previous === undefined || isNewerFeedback(item, previous)) {
      latestByCardId.set(item.cardId, item);
    }
  }

  return cards.map((card) => {
    const usefulnessFeedback = latestByCardId.get(card.id);

    return usefulnessFeedback === undefined
      ? card
      : {
        ...card,
        usefulnessFeedback
      };
  });
}

export function searchBrainKnowledgeCards(
  cards: BrainKnowledgeReadModel[],
  filter: BrainKnowledgeSearchFilter
): BrainKnowledgeReadModel[] {
  const normalizedText = filter.text?.trim().toLowerCase();

  return cards.filter((card) => {
    if (filter.kind !== undefined && card.kind !== filter.kind) {
      return false;
    }

    if (filter.status !== undefined && card.status !== filter.status) {
      return false;
    }

    if (filter.reviewability !== undefined && card.reviewability !== filter.reviewability) {
      return false;
    }

    if (filter.usefulnessOutcome !== undefined) {
      if (filter.usefulnessOutcome === "none") {
        if (card.usefulnessFeedback !== undefined) {
          return false;
        }
      } else if (card.usefulnessFeedback?.outcome !== filter.usefulnessOutcome) {
        return false;
      }
    }

    if (normalizedText !== undefined && normalizedText.length > 0) {
      const searchable = [
        card.id,
        card.title,
        card.summary,
        card.falsifier,
        card.doesNotProve,
        card.usefulnessFeedback?.outcome ?? "",
        card.usefulnessFeedback?.summary ?? "",
        card.usefulnessFeedback?.doesNotProve ?? "",
        ...card.sourceRefs,
        ...card.evidenceRefs,
        ...card.consumers,
        ...(card.usefulnessFeedback?.evidenceRefs ?? [])
      ].join("\n").toLowerCase();

      return searchable.includes(normalizedText);
    }

    return true;
  });
}

function isNewerFeedback(
  candidate: BrainKnowledgeUsefulnessFeedback,
  previous: BrainKnowledgeUsefulnessFeedback
): boolean {
  if (candidate.observedAt === undefined) {
    return previous.observedAt === undefined;
  }

  return previous.observedAt === undefined || candidate.observedAt >= previous.observedAt;
}

function statusFromPatternAdoption(status: RetainedPatternAdoptionStatus): BrainKnowledgeStatus {
  switch (status) {
    case "adopt_now":
      return "active";
    case "lab":
    case "later":
      return "deferred";
    case "reject":
      return "rejected";
  }
}

function parseSetValue<T extends string>(value: unknown, allowed: ReadonlySet<T>): T | undefined {
  return typeof value === "string" && allowed.has(value as T) ? value as T : undefined;
}

function parseTemporal(value: unknown): BrainKnowledgeTemporal | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  if (value["kind"] === "current") {
    return optionalStringFields(value, ["observedAt"]) ? {
      kind: "current",
      ...pickOptionalString(value, "observedAt")
    } : undefined;
  }

  if (value["kind"] === "historical") {
    return optionalStringFields(value, ["validFrom", "validUntil", "observedAt"]) ? {
      kind: "historical",
      ...pickOptionalString(value, "validFrom"),
      ...pickOptionalString(value, "validUntil"),
      ...pickOptionalString(value, "observedAt")
    } : undefined;
  }

  return value["kind"] === "unknown" ? { kind: "unknown" } : undefined;
}

function parseDissent(value: unknown): BrainKnowledgeDissent | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  if (value["kind"] === "none") {
    return { kind: "none" };
  }

  if (value["kind"] === "conflict") {
    const refs = parseNonEmptyStringArray(value["refs"]);
    const summary = parseNonEmptyString(value["summary"]);

    return refs !== undefined && summary !== undefined ? {
      kind: "conflict",
      refs,
      summary
    } : undefined;
  }

  return value["kind"] === "unknown" ? { kind: "unknown" } : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseNonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function parseNonEmptyStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value) || value.length === 0) {
    return undefined;
  }

  return value.every((item) => parseNonEmptyString(item) !== undefined)
    ? value
    : undefined;
}

function optionalStringFields(record: Record<string, unknown>, fields: string[]): boolean {
  return fields.every((field) => record[field] === undefined || typeof record[field] === "string");
}

function pickOptionalString(record: Record<string, unknown>, field: string): Record<string, string> {
  const value = record[field];

  return typeof value === "string" ? { [field]: value } : {};
}
````

## File: packages/harness/src/brainKnowledgeReadModelInvariants.test.ts
````typescript
import { readFileSync } from "node:fs";

import {
  describe,
  expect,
  it
} from "vitest";

const readRootFile = (path: string): string =>
  readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8");

const readJsonRootFile = (path: string): unknown =>
  JSON.parse(readRootFile(path));

const sectionBody = (body: string, heading: string): string => {
  const start = body.indexOf(heading);

  if (start === -1) {
    throw new Error(`Could not find section ${heading}`);
  }

  const nextHeading = body.indexOf("\n## ", start + heading.length);

  return body.slice(start, nextHeading === -1 ? undefined : nextHeading);
};

describe("Brain knowledge read model invariants", () => {
  it("keeps the brain knowledge read model action-oriented and reviewable", () => {
    const readModels = readRootFile("docs/architecture/observability-read-models.md");
    const knowledgeModel = sectionBody(readModels, "## BrainKnowledgeReadModel");

    expect(knowledgeModel).toContain("read-only");
    expect(knowledgeModel).toContain("type BrainKnowledgeReadModel = {");
    expect(knowledgeModel).toContain("kind: BrainKnowledgeKind;");
    expect(knowledgeModel).toContain("status: BrainKnowledgeStatus;");
    expect(knowledgeModel).toContain("confidence: BrainKnowledgeConfidence;");
    expect(knowledgeModel).toContain("reviewability: BrainKnowledgeReviewability;");
    expect(knowledgeModel).toContain("sourceRefs: string[];");
    expect(knowledgeModel).toContain("evidenceRefs: string[];");
    expect(knowledgeModel).toContain("consumers: string[];");
    expect(knowledgeModel).toContain("falsifier: string;");
    expect(knowledgeModel).toContain("doesNotProve: string;");
    expect(knowledgeModel).toContain("temporal:");
    expect(knowledgeModel).toContain("dissent:");
    expect(knowledgeModel).toContain("nextAction:");
  });

  it("keeps UI and search behind the read-only knowledge card contract", () => {
    const readModels = readRootFile("docs/architecture/observability-read-models.md");
    const dashboardGate = readRootFile("docs/decisions/ADR-0025-dashboard-readiness-gate.md");
    const webSearchGate = readRootFile(
      "docs/decisions/ADR-0028-brain-knowledge-web-search-readiness-gate.md"
    );
    const knowledgeModel = sectionBody(readModels, "## BrainKnowledgeReadModel");

    expect(knowledgeModel).toContain(
      "If a knowledge card cannot show evidence refs, source refs, consumer,"
    );
    expect(knowledgeModel).toContain("it is not ready for UI");
    expect(knowledgeModel).toContain(
      "Search may rank and display only read-only BrainKnowledgeReadModel cards."
    );
    expect(knowledgeModel).toContain("must not mutate Memory Core");
    expect(knowledgeModel).toContain("SourceDecision");
    expect(knowledgeModel).toContain("candidate status");
    expect(knowledgeModel).toContain("evidence");
    expect(dashboardGate).toContain("Do not build a dashboard");
    expect(dashboardGate).toContain("read-only boundary over typed read models");
    expect(webSearchGate).toContain("static/read-only web search path");
    expect(webSearchGate).toContain("BrainKnowledgeReadModel");
    expect(webSearchGate).toContain("Mutation: none");
    expect(webSearchGate).toContain("must not mutate Memory Core");
    expect(webSearchGate).toContain("Add dashboard package now");
    expect(webSearchGate).toContain("Add API solely to serve knowledge cards");
    expect(webSearchGate).toContain("Add MCP server before static preview usefulness is proven");
    expect(webSearchGate).toContain("V282 Brain Knowledge Static Web Preview Artifact");
  });

  it("keeps the retained TypeScript pattern available as a concrete knowledge card", () => {
    const pattern = readJsonRootFile(
      "docs/patterns/retained-patterns/ts-boundary-unknown-first-result-state.json"
    );
    const card = readJsonRootFile(
      "tests/fixtures/brain-knowledge/cards/ts-boundary-unknown-first-result-state.json"
    );

    expect(pattern).toMatchObject({
      patternId: "ts-boundary-unknown-first-result-state",
      adoptionStatus: "adopt_now",
      confidence: "high",
      reviewability: "ready",
      nextAction: "use"
    });

    expect(card).toMatchObject({
      id: "pattern:ts-boundary-unknown-first-result-state",
      kind: "pattern",
      status: "active",
      confidence: "high",
      reviewability: "ready",
      temporal: {
        kind: "current"
      },
      dissent: {
        kind: "none"
      },
      nextAction: "use"
    });

    if (!isRecord(card)) {
      throw new Error("Brain knowledge card fixture must be an object.");
    }

    expectNonEmptyString(card, "title");
    expectNonEmptyString(card, "summary");
    expectNonEmptyString(card, "falsifier");
    expectNonEmptyString(card, "doesNotProve");
    expectNonEmptyStringArray(card, "sourceRefs");
    expectNonEmptyStringArray(card, "evidenceRefs");
    expectNonEmptyStringArray(card, "consumers");
  });

  it("keeps the explicit brain knowledge catalog pointed at retained pattern sources", () => {
    const catalog = readJsonRootFile("docs/brain-knowledge/catalog.json");

    if (!isRecord(catalog)) {
      throw new Error("Brain knowledge catalog must be an object.");
    }

    const patternFiles = catalog["patternFiles"];
    const usefulnessFeedbackFiles = catalog["usefulnessFeedbackFiles"];

    expect(Array.isArray(patternFiles)).toBe(true);
    expect(Array.isArray(usefulnessFeedbackFiles)).toBe(true);
    expect(patternFiles).toContain(
      "../patterns/retained-patterns/active-context-compact-current-truth.json"
    );
    expect(patternFiles).toContain(
      "../patterns/retained-patterns/brain-knowledge-read-only-ui-boundary.json"
    );
    expect(patternFiles).toContain(
      "../patterns/retained-patterns/codex-execplan-living-validation-loop.json"
    );
    expect(patternFiles).toContain(
      "../patterns/retained-patterns/codex-goal-continuation-evidence-contract.json"
    );
    expect(patternFiles).toContain(
      "../patterns/retained-patterns/codex-prompt-task-contract-proof-boundary.json"
    );
    expect(patternFiles).toContain(
      "../patterns/retained-patterns/codex-skill-progressive-disclosure-routing.json"
    );
    expect(patternFiles).toContain("../patterns/retained-patterns/evidence-proof-non-proof-boundary.json");
    expect(patternFiles).toContain("../patterns/retained-patterns/source-to-decision-retention-gate.json");
    expect(patternFiles).toContain(
      "../patterns/retained-patterns/target-repo-write-authority-boundary.json"
    );
    expect(patternFiles).toContain(
      "../patterns/retained-patterns/untrusted-context-warning-boundary.json"
    );
    expect(patternFiles).toContain(
      "../patterns/retained-patterns/ts-boundary-unknown-first-result-state.json"
    );
    expect(usefulnessFeedbackFiles).toContain(
      "usefulness-feedback/v288-external-codex-workflow-patterns.json"
    );
  });

  it("keeps the local static web preview artifact command repeatable and read-only", () => {
    const packageJson = readJsonRootFile("package.json");

    if (!isRecord(packageJson)) {
      throw new Error("Root package.json must be an object.");
    }

    const scripts = packageJson["scripts"];

    if (!isRecord(scripts)) {
      throw new Error("Root package.json scripts must be an object.");
    }

    const previewScript = scripts["brain:knowledge:preview"];

    expect(typeof previewScript).toBe("string");

    if (typeof previewScript !== "string") {
      return;
    }

    expect(previewScript).toContain("knowledge cards");
    expect(previewScript).toContain("--catalog-file docs/brain-knowledge/catalog.json");
    expect(previewScript).toContain("--html");
    expect(previewScript).toContain(".local-lab/brain-knowledge-preview.html");
    expect(previewScript).not.toContain(" db ");
    expect(previewScript).not.toContain("dashboard");
    expect(previewScript).not.toContain("mcp");
    expect(previewScript).not.toContain("--persist");
  });
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function expectNonEmptyString(record: Record<string, unknown>, key: string): void {
  const value = record[key];

  expect(typeof value).toBe("string");
  expect((value as string).length).toBeGreaterThan(0);
}

function expectNonEmptyStringArray(record: Record<string, unknown>, key: string): void {
  const value = record[key];

  expect(Array.isArray(value)).toBe(true);

  if (!Array.isArray(value)) {
    return;
  }

  expect(value.length).toBeGreaterThan(0);

  for (const item of value) {
    expect(typeof item).toBe("string");
    expect((item as string).length).toBeGreaterThan(0);
  }
}
````

## File: packages/cli/src/runKnowledgeCardsCommand.ts
````typescript
import path from "node:path";

import type {
  BrainKnowledgeReadModel,
  BrainKnowledgeSearchFilter,
  BrainKnowledgeUsefulnessFeedback
} from "@krn/harness";
import {
  brainKnowledgeCardFromRetainedPatternDecision,
  cardsWithBrainKnowledgeUsefulnessFeedback,
  parseBrainKnowledgeReadModel,
  parseBrainKnowledgeUsefulnessFeedbackList,
  parseRetainedPatternDecision,
  searchBrainKnowledgeCards
} from "@krn/harness";
import {
  findRepoRoot,
  pathExists,
  readJsonObject
} from "./cliFileBoundary.js";

export type KnowledgeCardsOutputFormat = "text" | "json" | "html";

export interface KnowledgeCardsCommandRuntime {
  cwd?: string;
  cardFiles: readonly string[];
  patternFiles: readonly string[];
  catalogFiles: readonly string[];
  filter: BrainKnowledgeSearchFilter;
  format: KnowledgeCardsOutputFormat;
  limit?: number;
}

export interface KnowledgeCardsCommandResult {
  stdout: string;
}

export interface KnowledgeCardsPreviewResource {
  kind: "krn.brainKnowledge.cards.preview.v1";
  access: "read_only";
  mutation: "none";
  source: "explicit_files";
  filter: BrainKnowledgeSearchFilter;
  cardFiles: string[];
  patternFiles: string[];
  usefulnessFeedbackFiles: string[];
  catalogFiles: string[];
  totalCards: number;
  returnedCards: number;
  limit?: number;
  noMatchGuidance?: string[];
  cards: BrainKnowledgeReadModel[];
  proof: {
    proves: string[];
    doesNotProve: string[];
  };
}

const proof = {
  proves: [
    "supplied files parse as BrainKnowledgeReadModel or retained pattern decisions",
    "supplied usefulness feedback files parse with proof boundaries",
    "local readback filters were applied deterministically"
  ],
  doesNotProve: [
    "knowledge cards were produced from live DB state",
    "search ranking quality is good",
    "retained patterns are complete",
    "Memory Core, SourceDecision, candidates, or evidence were mutated",
    "KRN is product-ready"
  ]
} as const;

export const runKnowledgeCardsCommand = async (
  runtime: KnowledgeCardsCommandRuntime
): Promise<KnowledgeCardsCommandResult> => {
  const cwd = runtime.cwd ?? process.cwd();
  const loadedCards: BrainKnowledgeReadModel[] = [];
  const loadedFeedback: BrainKnowledgeUsefulnessFeedback[] = [];
  const resolvedFiles: string[] = [];
  const resolvedPatternFiles: string[] = [];
  const resolvedUsefulnessFeedbackFiles: string[] = [];
  const resolvedCatalogFiles: string[] = [];

  for (const cardFile of runtime.cardFiles) {
    await loadCardFile(cardFile, await resolveInputFile(cwd, cardFile), loadedCards);
    resolvedFiles.push(cardFile);
  }

  for (const patternFile of runtime.patternFiles) {
    await loadPatternFile(patternFile, await resolveInputFile(cwd, patternFile), loadedCards);
    resolvedPatternFiles.push(patternFile);
  }

  for (const catalogFile of runtime.catalogFiles) {
    const resolvedCatalogFile = await resolveInputFile(cwd, catalogFile);
    const catalog = parseKnowledgeCatalog(await readJsonObject(resolvedCatalogFile));

    if (catalog === undefined) {
      throw new Error(`Invalid brain knowledge catalog file: ${catalogFile}`);
    }

    const catalogDirectory = path.dirname(resolvedCatalogFile);

    for (const cardFile of catalog.cardFiles) {
      const resolvedCardFile = path.resolve(catalogDirectory, cardFile);
      await loadCardFile(`${catalogFile}:${cardFile}`, resolvedCardFile, loadedCards);
      resolvedFiles.push(`${catalogFile}:${cardFile}`);
    }

    for (const patternFile of catalog.patternFiles) {
      const resolvedPatternFile = path.resolve(catalogDirectory, patternFile);
      await loadPatternFile(`${catalogFile}:${patternFile}`, resolvedPatternFile, loadedCards);
      resolvedPatternFiles.push(`${catalogFile}:${patternFile}`);
    }

    for (const usefulnessFeedbackFile of catalog.usefulnessFeedbackFiles) {
      const resolvedUsefulnessFeedbackFile = path.resolve(catalogDirectory, usefulnessFeedbackFile);
      await loadUsefulnessFeedbackFile(
        `${catalogFile}:${usefulnessFeedbackFile}`,
        resolvedUsefulnessFeedbackFile,
        loadedFeedback
      );
      resolvedUsefulnessFeedbackFiles.push(`${catalogFile}:${usefulnessFeedbackFile}`);
    }

    resolvedCatalogFiles.push(catalogFile);
  }

  const cardsWithFeedback = cardsWithBrainKnowledgeUsefulnessFeedback(loadedCards, loadedFeedback);
  const matchingCards = searchBrainKnowledgeCards(cardsWithFeedback, runtime.filter);
  const cards = runtime.limit === undefined
    ? matchingCards
    : matchingCards.slice(0, runtime.limit);
  const noMatchGuidance = matchingCards.length === 0
    ? buildNoMatchGuidance(runtime.filter)
    : undefined;

  const resource: KnowledgeCardsPreviewResource = {
    kind: "krn.brainKnowledge.cards.preview.v1",
    access: "read_only",
    mutation: "none",
    source: "explicit_files",
    filter: runtime.filter,
    cardFiles: resolvedFiles,
    patternFiles: resolvedPatternFiles,
    usefulnessFeedbackFiles: resolvedUsefulnessFeedbackFiles,
    catalogFiles: resolvedCatalogFiles,
    totalCards: matchingCards.length,
    returnedCards: cards.length,
    ...(runtime.limit === undefined ? {} : { limit: runtime.limit }),
    ...(noMatchGuidance === undefined ? {} : { noMatchGuidance }),
    cards,
    proof: {
      proves: [...proof.proves],
      doesNotProve: [...proof.doesNotProve]
    }
  };

  return {
    stdout: formatKnowledgeCardsOutput(resource, runtime.format)
  };
};

const formatKnowledgeCardsOutput = (
  resource: KnowledgeCardsPreviewResource,
  format: KnowledgeCardsOutputFormat
): string => {
  if (format === "json") {
    return `${JSON.stringify(resource, null, 2)}\n`;
  }

  if (format === "html") {
    return formatKnowledgeCardsHtmlPreview(resource);
  }

  return formatKnowledgeCardsTextPreview(resource);
};

const formatKnowledgeCardsTextPreview = (resource: KnowledgeCardsPreviewResource): string =>
  [
    "KRN Brain Knowledge Cards Preview",
    "Access: read-only",
    "Mutation: none",
    "Source: explicit files",
    `Catalog files: ${formatList(resource.catalogFiles)}`,
    `Card files: ${formatList(resource.cardFiles)}`,
    `Pattern files: ${formatList(resource.patternFiles)}`,
    `Usefulness feedback files: ${formatList(resource.usefulnessFeedbackFiles)}`,
    `Results: ${resource.cards.length}`,
    `Total filtered results: ${resource.totalCards}`,
    ...(resource.limit === undefined ? [] : [
      `Limit: ${resource.limit}`
    ]),
    ...formatNoMatchGuidanceText(resource),
    "",
    ...resource.cards.flatMap(formatCard),
    "Proof:",
    ...resource.proof.proves.map((item) => `- proves: ${item}`),
    ...resource.proof.doesNotProve.map((item) => `- does not prove: ${item}`)
  ].join("\n") + "\n";

const formatKnowledgeCardsHtmlPreview = (resource: KnowledgeCardsPreviewResource): string => {
  const data = JSON.stringify(resource).replace(/</gu, "\\u003c");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>KRN Brain Knowledge Cards</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f7f9;
      --panel: #ffffff;
      --text: #171a1f;
      --muted: #616b7a;
      --line: #dfe3ea;
      --accent: #0f766e;
      --warn: #9a3412;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.5;
    }
    main {
      width: min(1120px, calc(100% - 32px));
      margin: 32px auto;
    }
    header {
      display: grid;
      gap: 8px;
      margin-bottom: 20px;
    }
    h1 {
      margin: 0;
      font-size: 28px;
      letter-spacing: 0;
    }
    .meta, .proof, .refs {
      color: var(--muted);
      font-size: 14px;
    }
    .toolbar {
      display: grid;
      grid-template-columns: minmax(220px, 1fr) repeat(4, minmax(120px, auto)) auto;
      gap: 12px;
      align-items: center;
      margin: 18px 0;
    }
    input[type="search"], select {
      width: 100%;
      min-height: 42px;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 10px 12px;
      font: inherit;
      background: #fff;
      color: var(--text);
    }
    .count {
      color: var(--muted);
      font-size: 14px;
      white-space: nowrap;
    }
    .cards {
      display: grid;
      gap: 12px;
    }
    article {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 18px;
    }
    h2 {
      margin: 0 0 8px;
      font-size: 19px;
      letter-spacing: 0;
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: 10px 0;
    }
    .chip {
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 3px 8px;
      font-size: 12px;
      color: var(--muted);
      background: #fbfcfd;
    }
    .chip.strong {
      color: #fff;
      border-color: var(--accent);
      background: var(--accent);
    }
    dl {
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: 7px 14px;
      margin: 14px 0 0;
    }
    dt {
      color: var(--muted);
      font-weight: 600;
    }
    dd { margin: 0; }
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 0.92em;
    }
    .proof-panel {
      margin-top: 20px;
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 16px;
    }
    .proof-panel h2 {
      font-size: 17px;
    }
    .proof-panel li + li {
      margin-top: 4px;
    }
    .empty {
      display: none;
      padding: 18px;
      color: var(--warn);
      background: #fff7ed;
      border: 1px solid #fed7aa;
      border-radius: 8px;
    }
    @media (max-width: 720px) {
      main { width: min(100% - 20px, 1120px); margin: 18px auto; }
      .toolbar { grid-template-columns: 1fr; }
      dl { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>KRN Brain Knowledge Cards</h1>
      <div class="meta">Access: read-only | Mutation: none | Source: explicit files</div>
      <div class="meta">Catalog files: ${escapeHtml(formatList(resource.catalogFiles))}</div>
      <div class="meta">Usefulness feedback files: ${escapeHtml(formatList(resource.usefulnessFeedbackFiles))}</div>
    </header>
    <section class="toolbar" aria-label="Knowledge search">
      <input id="search" type="search" placeholder="Search cards" autocomplete="off">
      ${formatSelect("kindFilter", "Kind", uniqueValues(resource.cards.map((card) => card.kind)))}
      ${formatSelect("statusFilter", "Status", uniqueValues(resource.cards.map((card) => card.status)))}
      ${formatSelect("reviewabilityFilter", "Reviewability", uniqueValues(resource.cards.map((card) => card.reviewability)))}
      ${formatSelect("usefulnessOutcomeFilter", "Usefulness", uniqueValues(resource.cards.map((card) => card.usefulnessFeedback?.outcome ?? "none")))}
      ${formatSelect("nextActionFilter", "Next action", uniqueValues(resource.cards.map((card) => card.nextAction)))}
      <div id="count" class="count">Results: ${resource.cards.length}</div>
    </section>
    <section id="empty" class="empty">${formatNoMatchGuidanceHtml(resource)}</section>
    <section id="cards" class="cards">
      ${resource.cards.map(formatCardHtml).join("\n")}
    </section>
    <section class="proof-panel">
      <h2>Proof Boundaries</h2>
      <ul>
        ${resource.proof.proves.map((item) => `<li><strong>proves:</strong> ${escapeHtml(item)}</li>`).join("\n        ")}
        ${resource.proof.doesNotProve.map((item) => `<li><strong>does not prove:</strong> ${escapeHtml(item)}</li>`).join("\n        ")}
      </ul>
    </section>
  </main>
  <script id="krn-data" type="application/json">${data}</script>
  <script>
    const cards = Array.from(document.querySelectorAll("[data-card]"));
    const search = document.getElementById("search");
    const kindFilter = document.getElementById("kindFilter");
    const statusFilter = document.getElementById("statusFilter");
    const reviewabilityFilter = document.getElementById("reviewabilityFilter");
    const usefulnessOutcomeFilter = document.getElementById("usefulnessOutcomeFilter");
    const nextActionFilter = document.getElementById("nextActionFilter");
    const count = document.getElementById("count");
    const empty = document.getElementById("empty");
    const matchesFilter = (card, key, value) => value === "" || card.dataset[key] === value;
    const render = () => {
      const query = search.value.trim().toLowerCase();
      let visible = 0;
      for (const card of cards) {
        const textMatch = query.length === 0 || card.dataset.search.includes(query);
        const match = textMatch
          && matchesFilter(card, "kind", kindFilter.value)
          && matchesFilter(card, "status", statusFilter.value)
          && matchesFilter(card, "reviewability", reviewabilityFilter.value)
          && matchesFilter(card, "usefulnessOutcome", usefulnessOutcomeFilter.value)
          && matchesFilter(card, "nextAction", nextActionFilter.value);
        card.hidden = !match;
        if (match) visible += 1;
      }
      count.textContent = "Results: " + visible;
      empty.style.display = visible === 0 ? "block" : "none";
    };
    search.addEventListener("input", render);
    kindFilter.addEventListener("change", render);
    statusFilter.addEventListener("change", render);
    reviewabilityFilter.addEventListener("change", render);
    usefulnessOutcomeFilter.addEventListener("change", render);
    nextActionFilter.addEventListener("change", render);
    render();
  </script>
</body>
</html>
`;
};

const buildNoMatchGuidance = (filter: BrainKnowledgeSearchFilter): string[] => [
  "No cards matched the current filters.",
  ...(filter.text === undefined ? [] : [
    "Try a shorter --text query or split the query into one mechanism term.",
    "If this is a Pattern Application Gate pre-coding query, run one broader query before concluding no retained pattern applies."
  ]),
  ...(hasStructuredFilter(filter) ? [
    "Remove one structured filter such as --kind, --status, --reviewability, or --usefulness-outcome and retry."
  ] : []),
  "If no retained pattern applies after retry, record an explicit rejected_or_deferred_patterns reason before coding.",
  "Zero results do not prove that no relevant pattern exists or that search ranking is good."
];

const hasStructuredFilter = (filter: BrainKnowledgeSearchFilter): boolean =>
  filter.kind !== undefined ||
  filter.status !== undefined ||
  filter.reviewability !== undefined ||
  filter.usefulnessOutcome !== undefined;

const formatNoMatchGuidanceText = (resource: KnowledgeCardsPreviewResource): string[] =>
  resource.noMatchGuidance === undefined ? [] : [
    "",
    "No-match guidance:",
    ...resource.noMatchGuidance.map((item) => `- ${item}`)
  ];

const formatNoMatchGuidanceHtml = (resource: KnowledgeCardsPreviewResource): string =>
  resource.noMatchGuidance === undefined
    ? "No cards match the current search."
    : `<strong>No cards match the current filters.</strong><ul>${resource.noMatchGuidance.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;

const formatCard = (card: BrainKnowledgeReadModel): string[] => [
  `- ${card.id}`,
  `  title: ${card.title}`,
  `  kind: ${card.kind}`,
  `  status: ${card.status}`,
  `  confidence: ${card.confidence}`,
  `  reviewability: ${card.reviewability}`,
  `  nextAction: ${card.nextAction}`,
  `  summary: ${card.summary}`,
  `  sourceRefs: ${card.sourceRefs.join(", ")}`,
  `  evidenceRefs: ${card.evidenceRefs.join(", ")}`,
  `  consumers: ${card.consumers.join(", ")}`,
  ...(card.usefulnessFeedback === undefined ? [
    "  usefulnessOutcome: none"
  ] : [
    `  usefulnessOutcome: ${card.usefulnessFeedback.outcome}`,
    `  usefulnessSummary: ${card.usefulnessFeedback.summary}`,
    `  usefulnessEvidenceRefs: ${card.usefulnessFeedback.evidenceRefs.join(", ")}`,
    `  usefulnessDoesNotProve: ${card.usefulnessFeedback.doesNotProve}`
  ]),
  `  falsifier: ${card.falsifier}`,
  `  doesNotProve: ${card.doesNotProve}`,
  ""
];

const formatCardHtml = (card: BrainKnowledgeReadModel): string => {
  const searchText = [
    card.id,
    card.kind,
    card.status,
    card.title,
    card.summary,
    card.confidence,
    card.reviewability,
    card.nextAction,
    ...card.sourceRefs,
    ...card.evidenceRefs,
    ...card.consumers,
    card.falsifier,
    card.doesNotProve,
    card.usefulnessFeedback?.outcome ?? "",
    card.usefulnessFeedback?.summary ?? "",
    card.usefulnessFeedback?.doesNotProve ?? "",
    ...(card.usefulnessFeedback?.evidenceRefs ?? [])
  ].join(" ").toLowerCase();

  return `<article data-card data-card-id="${escapeHtml(card.id)}" data-kind="${escapeHtml(card.kind)}" data-status="${escapeHtml(card.status)}" data-reviewability="${escapeHtml(card.reviewability)}" data-usefulness-outcome="${escapeHtml(card.usefulnessFeedback?.outcome ?? "none")}" data-next-action="${escapeHtml(card.nextAction)}" data-search="${escapeHtml(searchText)}">
  <h2>${escapeHtml(card.title)}</h2>
  <div class="refs"><code>${escapeHtml(card.id)}</code></div>
  <div class="chips">
    <span class="chip strong">${escapeHtml(card.kind)}</span>
    <span class="chip">${escapeHtml(card.status)}</span>
    <span class="chip">confidence: ${escapeHtml(card.confidence)}</span>
    <span class="chip">reviewability: ${escapeHtml(card.reviewability)}</span>
    <span class="chip">next: ${escapeHtml(card.nextAction)}</span>
  </div>
  <p>${escapeHtml(card.summary)}</p>
  <dl>
    <dt>Source refs</dt><dd>${formatHtmlList(card.sourceRefs)}</dd>
    <dt>Evidence refs</dt><dd>${formatHtmlList(card.evidenceRefs)}</dd>
    <dt>Consumers</dt><dd>${formatHtmlList(card.consumers)}</dd>
    ${card.usefulnessFeedback === undefined ? "" : `<dt>Usefulness</dt><dd><strong>${escapeHtml(card.usefulnessFeedback.outcome)}</strong><br>${escapeHtml(card.usefulnessFeedback.summary)}<br>${formatHtmlList(card.usefulnessFeedback.evidenceRefs)}<br><span class="refs">does not prove: ${escapeHtml(card.usefulnessFeedback.doesNotProve)}</span></dd>`}
    <dt>Falsifier</dt><dd>${escapeHtml(card.falsifier)}</dd>
    <dt>Does not prove</dt><dd>${escapeHtml(card.doesNotProve)}</dd>
  </dl>
</article>`;
};

const formatSelect = (
  id: string,
  label: string,
  options: readonly string[]
): string =>
  `<select id="${escapeHtml(id)}" aria-label="${escapeHtml(label)}">
        <option value="">${escapeHtml(label)}: all</option>
        ${options.map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(label)}: ${escapeHtml(option)}</option>`).join("\n        ")}
      </select>`;

const uniqueValues = (values: readonly string[]): string[] =>
  [...new Set(values)].sort((left, right) => left.localeCompare(right));

const formatHtmlList = (items: readonly string[]): string =>
  items.length === 0
    ? "none"
    : items.map((item) => `<code>${escapeHtml(item)}</code>`).join("<br>");

const formatList = (items: readonly string[]): string =>
  items.length === 0 ? "none" : items.join(", ");

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");

const resolveInputFile = async (cwd: string, filePath: string): Promise<string> => {
  const cwdPath = path.resolve(cwd, filePath);

  if (await pathExists(cwdPath)) {
    return cwdPath;
  }

  const repoRoot = await findRepoRoot(cwd);
  const repoRootPath = path.resolve(repoRoot, filePath);

  return repoRootPath;
};

type KnowledgeCatalogInput = {
  cardFiles: string[];
  patternFiles: string[];
  usefulnessFeedbackFiles: string[];
};

const parseKnowledgeCatalog = (value: unknown): KnowledgeCatalogInput | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const cardFiles = parseStringArray(value["cardFiles"]);
  const patternFiles = parseStringArray(value["patternFiles"]);
  const usefulnessFeedbackFiles = parseStringArray(value["usefulnessFeedbackFiles"] ?? []);

  if (
    cardFiles === undefined ||
    patternFiles === undefined ||
    usefulnessFeedbackFiles === undefined ||
    (cardFiles.length === 0 && patternFiles.length === 0 && usefulnessFeedbackFiles.length === 0)
  ) {
    return undefined;
  }

  return {
    cardFiles,
    patternFiles,
    usefulnessFeedbackFiles
  };
};

const loadCardFile = async (
  label: string,
  resolvedFile: string,
  cards: BrainKnowledgeReadModel[]
): Promise<void> => {
  const parsed = await readJsonObject(resolvedFile);
  const card = parseBrainKnowledgeReadModel(parsed);

  if (card === undefined) {
    throw new Error(`Invalid BrainKnowledgeReadModel card file: ${label}`);
  }

  cards.push(card);
};

const loadPatternFile = async (
  label: string,
  resolvedFile: string,
  cards: BrainKnowledgeReadModel[]
): Promise<void> => {
  const parsed = await readJsonObject(resolvedFile);
  const pattern = parseRetainedPatternDecision(parsed);

  if (pattern === undefined) {
    throw new Error(`Invalid retained pattern decision file: ${label}`);
  }

  cards.push(brainKnowledgeCardFromRetainedPatternDecision(pattern));
};

const loadUsefulnessFeedbackFile = async (
  label: string,
  resolvedFile: string,
  feedback: BrainKnowledgeUsefulnessFeedback[]
): Promise<void> => {
  const parsed = await readJsonObject(resolvedFile);
  const parsedFeedback = parseBrainKnowledgeUsefulnessFeedbackList(parsed);

  if (parsedFeedback === undefined) {
    throw new Error(`Invalid brain knowledge usefulness feedback file: ${label}`);
  }

  feedback.push(...parsedFeedback);
};

const parseStringArray = (value: unknown): string[] | undefined =>
  Array.isArray(value) && value.every((item) => typeof item === "string" && item.trim().length > 0)
    ? value
    : undefined;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
````

## File: packages/cli/src/runKnowledgeCardsCommand.test.ts
````typescript
import {
  mkdtemp,
  writeFile
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

import { describe, expect, it } from "vitest";

import {
  runKnowledgeCardsCommand
} from "./runKnowledgeCardsCommand.js";

const repoRoot = fileURLToPath(new URL("../../..", import.meta.url));
const cliPackageRoot = fileURLToPath(new URL("..", import.meta.url));
const cardFile = "tests/fixtures/brain-knowledge/cards/ts-boundary-unknown-first-result-state.json";
const patternFile = "docs/patterns/retained-patterns/ts-boundary-unknown-first-result-state.json";
const catalogFile = "docs/brain-knowledge/catalog.json";

describe("runKnowledgeCardsCommand", () => {
  it("renders a read-only knowledge card preview", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [cardFile],
      patternFiles: [],
      catalogFiles: [],
      filter: {
        kind: "pattern",
        status: "active",
        reviewability: "ready",
        text: "unknown-first"
      },
      format: "text"
    });

    expect(result.stdout).toContain("KRN Brain Knowledge Cards Preview");
    expect(result.stdout).toContain("Access: read-only");
    expect(result.stdout).toContain("Mutation: none");
    expect(result.stdout).toContain("Source: explicit files");
    expect(result.stdout).toContain("Results: 1");
    expect(result.stdout).toContain("pattern:ts-boundary-unknown-first-result-state");
    expect(result.stdout).toContain("reviewability: ready");
    expect(result.stdout).toContain("sourceRefs:");
    expect(result.stdout).toContain("evidenceRefs:");
    expect(result.stdout).toContain("falsifier:");
    expect(result.stdout).toContain("doesNotProve:");
    expect(result.stdout).toContain("does not prove: KRN is product-ready");
  });

  it("renders json preview without mutation authority", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [cardFile],
      patternFiles: [],
      catalogFiles: [],
      filter: {
        text: "unknown-first"
      },
      format: "json"
    });
    const parsed: unknown = JSON.parse(result.stdout);

    if (!isRecord(parsed)) {
      throw new Error("knowledge cards JSON output must be an object");
    }

    expect(parsed).toMatchObject({
      kind: "krn.brainKnowledge.cards.preview.v1",
      access: "read_only",
      mutation: "none",
      source: "explicit_files"
    });

    const cards = parsed["cards"];
    const proof = parsed["proof"];

    expect(Array.isArray(cards)).toBe(true);
    expect(cards).toHaveLength(1);
    expect(isRecord(cards[0]) ? cards[0]["id"] : undefined).toBe(
      "pattern:ts-boundary-unknown-first-result-state"
    );
    expect(isRecord(proof) && Array.isArray(proof["doesNotProve"])
      ? proof["doesNotProve"]
      : []).toContain("KRN is product-ready");
  });

  it("rejects invalid card files", async () => {
    await expect(runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: ["package.json"],
      patternFiles: [],
      catalogFiles: [],
      filter: {},
      format: "text"
    })).rejects.toThrow("Invalid BrainKnowledgeReadModel card file: package.json");
  });

  it("renders knowledge cards produced from retained pattern files", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [patternFile],
      catalogFiles: [],
      filter: {
        text: "unknown-first"
      },
      format: "text"
    });

    expect(result.stdout).toContain("Pattern files: docs/patterns/retained-patterns/ts-boundary-unknown-first-result-state.json");
    expect(result.stdout).toContain("pattern:ts-boundary-unknown-first-result-state");
    expect(result.stdout).toContain("reviewability: ready");
    expect(result.stdout).toContain("does not prove: knowledge cards were produced from live DB state");
  });

  it("rejects invalid retained pattern files", async () => {
    await expect(runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: ["package.json"],
      catalogFiles: [],
      filter: {},
      format: "text"
    })).rejects.toThrow("Invalid retained pattern decision file: package.json");
  });

  it("renders knowledge cards from explicit catalog files", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "unknown-first"
      },
      format: "text"
    });

    expect(result.stdout).toContain("Catalog files: docs/brain-knowledge/catalog.json");
    expect(result.stdout).toContain(
      "docs/brain-knowledge/catalog.json:../patterns/retained-patterns/source-to-decision-retention-gate.json"
    );
    expect(result.stdout).toContain(
      "docs/brain-knowledge/catalog.json:../patterns/retained-patterns/ts-boundary-unknown-first-result-state.json"
    );
    expect(result.stdout).toContain("pattern:ts-boundary-unknown-first-result-state");
  });

  it("renders self-contained html preview with proof boundaries", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "unknown-first"
      },
      format: "html"
    });

    expect(result.stdout).toContain("<!doctype html>");
    expect(result.stdout).toContain("<title>KRN Brain Knowledge Cards</title>");
    expect(result.stdout).toContain("type=\"search\"");
    expect(result.stdout).toContain("id=\"kindFilter\"");
    expect(result.stdout).toContain("id=\"statusFilter\"");
    expect(result.stdout).toContain("id=\"reviewabilityFilter\"");
    expect(result.stdout).toContain("id=\"usefulnessOutcomeFilter\"");
    expect(result.stdout).toContain("id=\"nextActionFilter\"");
    expect(result.stdout).toContain("Kind: pattern");
    expect(result.stdout).toContain("Status: active");
    expect(result.stdout).toContain("Reviewability: ready");
    expect(result.stdout).toContain("Next action: use");
    expect(result.stdout).toContain("Access: read-only");
    expect(result.stdout).toContain("Mutation: none");
    expect(result.stdout).toContain("pattern:ts-boundary-unknown-first-result-state");
    expect(result.stdout).toContain("data-kind=\"pattern\"");
    expect(result.stdout).toContain("data-status=\"active\"");
    expect(result.stdout).toContain("data-reviewability=\"ready\"");
    expect(result.stdout).toContain("data-usefulness-outcome=");
    expect(result.stdout).toContain("data-next-action=\"use\"");
    expect(result.stdout).toContain("Source refs");
    expect(result.stdout).toContain("Evidence refs");
    expect(result.stdout).toContain("Falsifier");
    expect(result.stdout).toContain("Does not prove");
    expect(result.stdout).toContain("Proof Boundaries");
    expect(result.stdout).toContain("does not prove:");
    expect(result.stdout).toContain("matchesFilter(card, \"kind\", kindFilter.value)");
    expect(result.stdout).toContain("matchesFilter(card, \"usefulnessOutcome\", usefulnessOutcomeFilter.value)");
    expect(result.stdout).toContain("search.addEventListener");
    expect(result.stdout).toContain("kindFilter.addEventListener");
  });

  it("renders every catalog card in html with proof-boundary fields", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {},
      format: "html"
    });

    expect(result.stdout).toContain("pattern:evidence-proof-non-proof-boundary");
    expect(result.stdout).toContain("pattern:active-context-compact-current-truth");
    expect(result.stdout).toContain("pattern:brain-knowledge-read-only-ui-boundary");
    expect(result.stdout).toContain("pattern:codex-execplan-living-validation-loop");
    expect(result.stdout).toContain("pattern:codex-goal-continuation-evidence-contract");
    expect(result.stdout).toContain("pattern:codex-prompt-task-contract-proof-boundary");
    expect(result.stdout).toContain("pattern:codex-skill-progressive-disclosure-routing");
    expect(result.stdout).toContain("pattern:source-to-decision-retention-gate");
    expect(result.stdout).toContain("pattern:target-repo-write-authority-boundary");
    expect(result.stdout).toContain("pattern:untrusted-context-warning-boundary");
    expect(result.stdout).toContain("pattern:ts-boundary-unknown-first-result-state");
    expect(result.stdout).toContain("Active context stays compact and current-truth routed");
    expect(result.stdout).toContain("Brain knowledge UI/search remains read-only until usefulness proof");
    expect(result.stdout).toContain("Codex ExecPlan living validation loop");
    expect(result.stdout).toContain("Codex goal continuation evidence contract");
    expect(result.stdout).toContain("Codex prompt task contract proof boundary");
    expect(result.stdout).toContain("Codex skill progressive-disclosure routing");
    expect(result.stdout).toContain("Evidence proof and non-proof boundary");
    expect(result.stdout).toContain("Source-to-decision retention gate");
    expect(result.stdout).toContain("Target repo writes require explicit authority and rollback");
    expect(result.stdout).toContain("Untrusted selected context is labeled before Codex use");
    expect(result.stdout).toContain("Unknown-first external boundary with explicit result state");
    expect(result.stdout).toContain("Source refs");
    expect(result.stdout).toContain("Evidence refs");
    expect(result.stdout).toContain("Falsifier");
    expect(result.stdout).toContain("Does not prove");
    expect(result.stdout).toContain("Proof Boundaries");
    expect(result.stdout).toContain("Mutation: none");
    expect(result.stdout).toContain("does not prove:");
    expect(result.stdout).toContain("This card does not prove command truth");
  });

  it("executes static html text and field filters in a DOM-capable smoke", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "krn-knowledge-preview-"));
    const patternCardPath = path.join(directory, "pattern-card.json");
    const memoryCardPath = path.join(directory, "memory-card.json");

    await writeFile(patternCardPath, JSON.stringify(knowledgeCard({
      id: "pattern:skill-routing",
      kind: "pattern",
      status: "active",
      title: "Skill routing",
      summary: "Use progressive-disclosure skills for repeated workflows.",
      reviewability: "ready",
      usefulnessOutcome: "helped",
      nextAction: "use"
    })));
    await writeFile(memoryCardPath, JSON.stringify(knowledgeCard({
      id: "memory:stale-dashboard",
      kind: "memory",
      status: "stale",
      title: "Stale dashboard plan",
      summary: "Do not treat old dashboard plans as active product truth.",
      reviewability: "needs_more_evidence",
      nextAction: "defer"
    })));

    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [patternCardPath, memoryCardPath],
      patternFiles: [],
      catalogFiles: [],
      filter: {},
      format: "html"
    });
    const smoke = executeKnowledgePreviewHtml(result.stdout);

    expect(smoke.count()).toBe("Results: 2");

    smoke.setSearch("skill");
    expect(smoke.visibleIds()).toEqual(["pattern:skill-routing"]);
    expect(smoke.count()).toBe("Results: 1");

    smoke.setSearch("");
    smoke.setFilter("usefulnessOutcomeFilter", "helped");
    expect(smoke.visibleIds()).toEqual(["pattern:skill-routing"]);
    expect(smoke.count()).toBe("Results: 1");

    smoke.setFilter("usefulnessOutcomeFilter", "");
    smoke.setFilter("kindFilter", "memory");
    expect(smoke.visibleIds()).toEqual(["memory:stale-dashboard"]);
    expect(smoke.count()).toBe("Results: 1");

    smoke.setFilter("reviewabilityFilter", "ready");
    expect(smoke.visibleIds()).toEqual([]);
    expect(smoke.count()).toBe("Results: 0");
    expect(smoke.emptyDisplay()).toBe("block");
  });

  it("resolves root-relative catalog files from a package cwd", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: cliPackageRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "unknown-first"
      },
      format: "text"
    });

    expect(result.stdout).toContain("Catalog files: docs/brain-knowledge/catalog.json");
    expect(result.stdout).toContain("pattern:ts-boundary-unknown-first-result-state");
  });

  it("searches the second retained pattern through the catalog", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "retention gate"
      },
      format: "text"
    });

    expect(result.stdout).toContain("Results: 1");
    expect(result.stdout).toContain("pattern:source-to-decision-retention-gate");
    expect(result.stdout).toContain("Source-to-decision retention gate");
  });

  it("searches the evidence proof boundary pattern through the catalog", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "command provenance"
      },
      format: "json"
    });
    const preview = parsePreviewResource(result.stdout);

    expect(cardIds(preview)).toEqual(["pattern:evidence-proof-non-proof-boundary"]);
    expect(preview.proof.doesNotProve).toContain("search ranking quality is good");
    expect(preview.mutation).toBe("none");
  });

  it("searches the Codex skill routing pattern through the catalog", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "progressive-disclosure"
      },
      format: "json"
    });
    const preview = parsePreviewResource(result.stdout);

    expect(cardIds(preview)).toEqual(["pattern:codex-skill-progressive-disclosure-routing"]);
    expect(preview.proof.doesNotProve).toContain("KRN is product-ready");
    expect(preview.mutation).toBe("none");
  });

  it("searches external Codex workflow patterns through the catalog", async () => {
    const goalsResult = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "goal continuation"
      },
      format: "json"
    });
    const execPlanResult = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "living validation loop"
      },
      format: "json"
    });
    const taskContractResult = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "task contract proof boundary"
      },
      format: "json"
    });

    const goalsPreview = parsePreviewResource(goalsResult.stdout);
    const execPlanPreview = parsePreviewResource(execPlanResult.stdout);
    const taskContractPreview = parsePreviewResource(taskContractResult.stdout);

    expect(cardIds(goalsPreview)).toEqual([
      "pattern:codex-goal-continuation-evidence-contract"
    ]);
    expect(cardIds(execPlanPreview)).toEqual([
      "pattern:codex-execplan-living-validation-loop"
    ]);
    expect(cardIds(taskContractPreview)).toEqual([
      "pattern:codex-prompt-task-contract-proof-boundary"
    ]);
    expect(goalsPreview.proof.doesNotProve).toContain("KRN is product-ready");
    expect(execPlanPreview.proof.doesNotProve).toContain("search ranking quality is good");
    expect(taskContractPreview.proof.doesNotProve).toContain("KRN is product-ready");
  });

  it("renders retained pattern usefulness feedback through catalog readback", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "goal continuation"
      },
      format: "text"
    });

    expect(result.stdout).toContain(
      "Usefulness feedback files: docs/brain-knowledge/catalog.json:usefulness-feedback/v288-external-codex-workflow-patterns.json"
    );
    expect(result.stdout).toContain("pattern:codex-goal-continuation-evidence-contract");
    expect(result.stdout).toContain("usefulnessOutcome: helped");
    expect(result.stdout).toContain(
      "usefulnessSummary: Prevented stale pasted V05 objective from rolling the active stream backward from V288."
    );
    expect(result.stdout).toContain(
      "usefulnessDoesNotProve: This feedback does not prove automatic resume correctness or product readiness."
    );
  });

  it("filters retained pattern cards by usefulness outcome", async () => {
    const helpedResult = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        usefulnessOutcome: "helped"
      },
      format: "json"
    });
    const noiseResult = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        usefulnessOutcome: "noise"
      },
      format: "json"
    });

    const helpedPreview = parsePreviewResource(helpedResult.stdout);
    const noisePreview = parsePreviewResource(noiseResult.stdout);

    expect(cardIds(helpedPreview).sort()).toEqual([
      "pattern:active-context-compact-current-truth",
      "pattern:brain-knowledge-read-only-ui-boundary",
      "pattern:codex-execplan-living-validation-loop",
      "pattern:codex-goal-continuation-evidence-contract",
      "pattern:codex-prompt-task-contract-proof-boundary",
      "pattern:codex-skill-progressive-disclosure-routing",
      "pattern:evidence-proof-non-proof-boundary",
      "pattern:source-to-decision-retention-gate",
      "pattern:target-repo-write-authority-boundary",
      "pattern:ts-boundary-unknown-first-result-state",
      "pattern:untrusted-context-warning-boundary"
    ].sort());
    expect(cardIds(noisePreview)).toEqual([]);
  });

  it("limits filtered catalog readback without hiding total result count", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        usefulnessOutcome: "helped"
      },
      format: "json",
      limit: 2
    });
    const preview = parsePreviewResource(result.stdout);

    expect(preview.totalCards).toBe(11);
    expect(preview.returnedCards).toBe(2);
    expect(preview.limit).toBe(2);
    expect(preview.cards).toHaveLength(2);
    expect(preview.proof.doesNotProve).toContain("search ranking quality is good");
    expect(preview.mutation).toBe("none");
  });

  it("renders text preview limit with total filtered result boundary", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        usefulnessOutcome: "helped"
      },
      format: "text",
      limit: 1
    });

    expect(result.stdout).toContain("Results: 1");
    expect(result.stdout).toContain("Total filtered results: 11");
    expect(result.stdout).toContain("Limit: 1");
    expect(result.stdout).toContain("does not prove: search ranking quality is good");
  });

  it("filters retained pattern cards with no usefulness feedback", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        usefulnessOutcome: "none"
      },
      format: "json"
    });
    const preview = parsePreviewResource(result.stdout);

    expect(cardIds(preview)).toEqual([]);
  });

  it("combines missing usefulness feedback and text filters", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        usefulnessOutcome: "none",
        text: "untrusted"
      },
      format: "json"
    });
    const preview = parsePreviewResource(result.stdout);

    expect(cardIds(preview)).toEqual([]);
  });

  it("renders no-match guidance for over-filtered pattern queries", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        usefulnessOutcome: "helped",
        text: "knowledge cards pattern gate source slice operator UX TypeScript"
      },
      format: "json"
    });
    const preview = parsePreviewResource(result.stdout);

    expect(preview.totalCards).toBe(0);
    expect(preview.returnedCards).toBe(0);
    expect(cardIds(preview)).toEqual([]);
    expect(preview.noMatchGuidance).toContain("No cards matched the current filters.");
    expect(preview.noMatchGuidance).toContain(
      "Try a shorter --text query or split the query into one mechanism term."
    );
    expect(preview.noMatchGuidance).toContain(
      "Remove one structured filter such as --kind, --status, --reviewability, or --usefulness-outcome and retry."
    );
    expect(preview.noMatchGuidance).toContain(
      "If no retained pattern applies after retry, record an explicit rejected_or_deferred_patterns reason before coding."
    );
    expect(preview.noMatchGuidance).toContain(
      "Zero results do not prove that no relevant pattern exists or that search ranking is good."
    );
    expect(preview.proof.doesNotProve).toContain("search ranking quality is good");
    expect(preview.mutation).toBe("none");
  });

  it("renders text no-match guidance with proof boundaries", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        usefulnessOutcome: "helped",
        text: "knowledge cards pattern gate source slice operator UX TypeScript"
      },
      format: "text"
    });

    expect(result.stdout).toContain("Results: 0");
    expect(result.stdout).toContain("Total filtered results: 0");
    expect(result.stdout).toContain("No-match guidance:");
    expect(result.stdout).toContain("Try a shorter --text query");
    expect(result.stdout).toContain("record an explicit rejected_or_deferred_patterns reason");
    expect(result.stdout).toContain("does not prove: search ranking quality is good");
  });

  it("includes no-match guidance in the static html preview", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        usefulnessOutcome: "helped",
        text: "knowledge cards pattern gate source slice operator UX TypeScript"
      },
      format: "html"
    });

    expect(result.stdout).toContain("<!doctype html>");
    expect(result.stdout).toContain("No cards match the current filters.");
    expect(result.stdout).toContain("Try a shorter --text query");
    expect(result.stdout).toContain("Zero results do not prove");
    expect(result.stdout).toContain("Mutation: none");
  });

  it("guards deterministic catalog search results and proof boundaries", async () => {
    const typeScriptResult = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "explicit result state"
      },
      format: "json"
    });
    const sourceDecisionResult = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "retention gate"
      },
      format: "json"
    });

    const typeScriptPreview = parsePreviewResource(typeScriptResult.stdout);
    const sourceDecisionPreview = parsePreviewResource(sourceDecisionResult.stdout);

    expect(cardIds(typeScriptPreview)).toEqual(["pattern:ts-boundary-unknown-first-result-state"]);
    expect(cardIds(sourceDecisionPreview)).toEqual(["pattern:source-to-decision-retention-gate"]);
    expect(typeScriptPreview.proof.doesNotProve).toContain("search ranking quality is good");
    expect(sourceDecisionPreview.proof.doesNotProve).toContain("KRN is product-ready");
    expect(typeScriptPreview.access).toBe("read_only");
    expect(typeScriptPreview.mutation).toBe("none");
    expect(sourceDecisionPreview.access).toBe("read_only");
    expect(sourceDecisionPreview.mutation).toBe("none");
  });

  it("returns every catalog card without a text filter", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {},
      format: "json"
    });
    const preview = parsePreviewResource(result.stdout);

    expect(cardIds(preview).sort()).toEqual([
      "pattern:active-context-compact-current-truth",
      "pattern:brain-knowledge-read-only-ui-boundary",
      "pattern:codex-execplan-living-validation-loop",
      "pattern:codex-goal-continuation-evidence-contract",
      "pattern:codex-prompt-task-contract-proof-boundary",
      "pattern:codex-skill-progressive-disclosure-routing",
      "pattern:evidence-proof-non-proof-boundary",
      "pattern:source-to-decision-retention-gate",
      "pattern:target-repo-write-authority-boundary",
      "pattern:untrusted-context-warning-boundary",
      "pattern:ts-boundary-unknown-first-result-state"
    ].sort());
  });

  it("rejects invalid catalog files", async () => {
    await expect(runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: ["package.json"],
      filter: {},
      format: "text"
    })).rejects.toThrow("Invalid brain knowledge catalog file: package.json");
  });
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type PreviewResourceForTest = {
  access: "read_only";
  mutation: "none";
  totalCards?: number;
  returnedCards?: number;
  limit?: number;
  noMatchGuidance?: string[];
  cards: {
    id: string;
  }[];
  proof: {
    doesNotProve: string[];
  };
};

function parsePreviewResource(value: string): PreviewResourceForTest {
  const parsed: unknown = JSON.parse(value);

  if (!isRecord(parsed)) {
    throw new Error("knowledge cards JSON output must be an object");
  }

  const access = parsed["access"];
  const mutation = parsed["mutation"];
  const totalCards = parsed["totalCards"];
  const returnedCards = parsed["returnedCards"];
  const limit = parsed["limit"];
  const noMatchGuidance = parsed["noMatchGuidance"];
  const cards = parsed["cards"];
  const proof = parsed["proof"];

  if (access !== "read_only" || mutation !== "none" || !Array.isArray(cards) || !isRecord(proof)) {
    throw new Error("knowledge cards JSON output does not match preview resource shape");
  }

  if (
    totalCards !== undefined &&
    (typeof totalCards !== "number" || !Number.isSafeInteger(totalCards))
  ) {
    throw new Error("knowledge cards JSON output totalCards must be an integer when present");
  }

  if (
    returnedCards !== undefined &&
    (typeof returnedCards !== "number" || !Number.isSafeInteger(returnedCards))
  ) {
    throw new Error("knowledge cards JSON output returnedCards must be an integer when present");
  }

  if (limit !== undefined && (typeof limit !== "number" || !Number.isSafeInteger(limit))) {
    throw new Error("knowledge cards JSON output limit must be an integer when present");
  }

  if (
    noMatchGuidance !== undefined &&
    (!Array.isArray(noMatchGuidance) || !noMatchGuidance.every((item) => typeof item === "string"))
  ) {
    throw new Error("knowledge cards JSON output noMatchGuidance must be string array when present");
  }

  const doesNotProve = proof["doesNotProve"];

  if (!Array.isArray(doesNotProve) || !doesNotProve.every((item) => typeof item === "string")) {
    throw new Error("knowledge cards JSON output must include doesNotProve proof boundaries");
  }

  return {
    access,
    mutation,
    ...(totalCards === undefined ? {} : { totalCards }),
    ...(returnedCards === undefined ? {} : { returnedCards }),
    ...(limit === undefined ? {} : { limit }),
    ...(noMatchGuidance === undefined ? {} : { noMatchGuidance }),
    cards: cards.map((card) => {
      if (!isRecord(card) || typeof card["id"] !== "string") {
        throw new Error("knowledge cards JSON output cards must include ids");
      }

      return {
        id: card["id"]
      };
    }),
    proof: {
      doesNotProve
    }
  };
}

function cardIds(resource: PreviewResourceForTest): string[] {
  return resource.cards.map((card) => card.id);
}

type KnowledgeCardInputForTest = {
  id: string;
  kind: string;
  status: string;
  title: string;
  summary: string;
  reviewability: string;
  usefulnessOutcome?: string;
  nextAction: string;
};

function knowledgeCard(input: KnowledgeCardInputForTest): Record<string, unknown> {
  return {
    ...input,
    confidence: "high",
    sourceRefs: ["test:source"],
    evidenceRefs: ["test:evidence"],
    consumers: ["test consumer"],
    falsifier: "A filter smoke cannot find this card by its stable fields.",
    doesNotProve: "This card does not prove product readiness.",
    temporal: {
      kind: "current",
      observedAt: "2026-06-28"
    },
    dissent: {
      kind: "none"
    },
    ...(input.usefulnessOutcome === undefined ? {} : {
      usefulnessFeedback: {
        cardId: input.id,
        outcome: input.usefulnessOutcome,
        summary: `Usefulness outcome for ${input.id}.`,
        evidenceRefs: ["test:usefulness"],
        doesNotProve: "This usefulness feedback does not prove product readiness.",
        observedAt: "2026-06-28"
      }
    })
  };
}

type FakeControl = {
  value: string;
  textContent: string;
  style: {
    display: string;
  };
  addEventListener: (event: string, listener: () => void) => void;
  dispatch: (event: string) => void;
};

type FakeCard = {
  hidden: boolean;
  dataset: {
    id: string;
    search: string;
    kind: string;
    status: string;
    reviewability: string;
    usefulnessOutcome: string;
    nextAction: string;
  };
};

type KnowledgePreviewSmoke = {
  count: () => string;
  emptyDisplay: () => string;
  setFilter: (id: string, value: string) => void;
  setSearch: (value: string) => void;
  visibleIds: () => string[];
};

function executeKnowledgePreviewHtml(html: string): KnowledgePreviewSmoke {
  const scriptStart = html.indexOf("<script>\n    const cards");
  const scriptEnd = html.indexOf("\n  </script>", scriptStart);

  if (scriptStart === -1 || scriptEnd === -1) {
    throw new Error("Expected knowledge preview HTML to include executable filter script.");
  }

  const script = html.slice(scriptStart + "<script>\n".length, scriptEnd);
  const cards: FakeCard[] = [...html.matchAll(/<article data-card ([^>]+)>/gu)].map((match) => {
    const attributes = match[1] ?? "";

    return {
      hidden: false,
      dataset: {
        id: attr(attributes, "data-card-id"),
        search: attr(attributes, "data-search"),
        kind: attr(attributes, "data-kind"),
        status: attr(attributes, "data-status"),
        reviewability: attr(attributes, "data-reviewability"),
        usefulnessOutcome: attr(attributes, "data-usefulness-outcome"),
        nextAction: attr(attributes, "data-next-action")
      }
    };
  });

  const controls: Record<string, FakeControl> = {
    search: fakeControl(),
    kindFilter: fakeControl(),
    statusFilter: fakeControl(),
    reviewabilityFilter: fakeControl(),
    usefulnessOutcomeFilter: fakeControl(),
    nextActionFilter: fakeControl(),
    count: fakeControl(),
    empty: fakeControl()
  };

  runInNewContext(script, {
    document: {
      querySelectorAll: (selector: string): FakeCard[] => selector === "[data-card]" ? cards : [],
      getElementById: (id: string): FakeControl => controls[id] ?? fakeControl()
    }
  });

  return {
    count: () => controls.count.textContent,
    emptyDisplay: () => controls.empty.style.display,
    setFilter: (id, value) => {
      controls[id]!.value = value;
      controls[id]!.dispatch("change");
    },
    setSearch: (value) => {
      controls.search.value = value;
      controls.search.dispatch("input");
    },
    visibleIds: () => cards.filter((card) => !card.hidden).map((card) => card.dataset.id)
  };
}

function fakeControl(): FakeControl {
  const listeners = new Map<string, () => void>();

  return {
    value: "",
    textContent: "",
    style: {
      display: ""
    },
    addEventListener: (event, listener) => {
      listeners.set(event, listener);
    },
    dispatch: (event) => {
      listeners.get(event)?.();
    }
  };
}

function attr(attributes: string, name: string): string {
  const match = new RegExp(`${name}="([^"]*)"`, "u").exec(attributes);

  return match?.[1] ?? "";
}
````

## File: GOAL.md
````markdown
# Goal: Execute KRN Continuous Brain Growth

KRN is a Codex Operating Layer / AI Engineering Control Plane.

Codex executes. KRN supplies bounded context, store-backed memory, source
grounding, policy, skills, eval expectations, traces, review gates, and
feedback.

## Current Objective

Use root `PLAN.md` as the compact product single source of truth and root
`PLANS.md` as the compact continuous execution ledger.

Detailed completed history, evidence, outcomes, and next-task synthesis live in
`PLANS.md` and archived report/ledger paths.

Active stream:

```txt
V306 Knowledge Cards Tokenized Text Search
```

Current state:

```txt
controlled-internal-alpha for technical operators: yes / stronger.
product-ready: no.
widened internal alpha: no.
V02-01 real second-operator proof: blocked/deferred.
current task: V306-00 Knowledge Cards Tokenized Text Search.
```

Current task:

```txt
Improve `krn knowledge cards --text` so pattern-card search uses deterministic
tokenized matching instead of brittle whole-query substring matching.
```

## Remaining Work

The product is not a full living brain yet. The only current high-level blocks
to preserve are:

1. Pattern Brain execution/readback hardening: finish V306 and keep pattern
   search useful for pre-coding gates.
2. Research/paper/course source decisions: ingest public high-quality sources
   through source-to-decision, not source hoarding.
3. Mini brain-QA benchmark: start with 30 KRN questions, later expand corpus
   QA and compare memory/source/hybrid/anti-memory/graph paths.
4. Ingest v0: artifact -> hash -> chunk -> source range -> claim -> embedding
   or search document with temporal and permission metadata.
5. Graph brain v0: entities, events, claims, relations, duplicates,
   contradictions, supersession, and temporal slices.
6. Heartbeat/dreaming v0: candidate generator only; no final Memory Core
   mutation without review.
7. Consensus v0: eval/candidate layer with preserved dissent, not autonomous
   truth runtime.
8. Product surfaces: web UI/search/API/MCP only after usefulness, security, and
   read-model gates.

## Operating Rules

- Keep `GOAL.md`, `PLAN.md`, and `PLANS.md` compact.
- Archive historical detail instead of appending walls of completed work.
- Do not create another parallel roadmap.
- Do not reopen archived plans as active context.
- Do not build dashboard, API, MCP server, worker runtime, source crawler,
  broad eval platform, `krn audit`, anti-slop scanner, generic multi-agent
  system, runtime markdown memory, or hidden semantic hooks unless `PLANS.md`
  explicitly authorizes a bounded evidence-backed task.
- Do not write to living target repos unless the active task explicitly allows
  target writes, allowed files, rollback, and verification.
- After each bounded slice, verify, commit, push, check CI when relevant, update
  compact root state, and continue with the next highest-ROI task.
- Do not mark this continuous goal complete after one slice, one report, one
  repair, one skill, or one scenario.
- For every non-trivial infra, harness, CI, eval, Codex-surface, TypeScript,
  target-workflow, security, operator-UX, or research/paper/course-driven slice,
  apply the pattern gate:

  ```txt
  source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier
  ```

## External Boundary

V02-01 can resume only after real second-operator inputs exist:

```txt
operator:
KRN source:
target repo:
DB mode:
support boundary:
operator transcript:
```

Self/headless scenarios are engineering proof and knowledge-distillation
material. They are not second-operator proof or product-ready proof.

## Continuation After Compact

After auto-compact, resume, context loss, or a new `/goal` continuation:

1. Read `GOAL.md`, root `PLAN.md`, and root `PLANS.md`.
2. Run current-state preflight:

   ```sh
   git fetch --prune
   git status --short --branch
   git log --oneline -n 8
   ```

3. Return to the first incomplete active task. Do not restart from conversation
   memory.
4. If a pasted objective, attachment, old prompt, or conversation summary names
   a stale active stream that conflicts with current `GOAL.md`, `PLAN.md`, and
   `PLANS.md`, read it as historical evidence and keep the root active state as
   authoritative. Do not roll the active stream backward.
5. If a previous slice was committed but not pushed or CI-checked, finish that
   before starting unrelated work.
6. If the current slice is complete, synthesize next tasks from evidence, update
   compact active state, and continue.
7. Research or pattern input must still use:

   ```txt
   source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier
   ```
````

## File: PLAN.md
````markdown
# KRN Active Plan

Status: active compact root plan. Date: 2026-06-27.

Repository: `/home/krn/coding/krn/active/mise-en-palace`.

Root `PLAN.md` is the compact product single source of truth. Detailed
continuous execution lives in `PLANS.md`.

Do not create another parallel roadmap.

## Current Product State

```txt
controlled-internal-alpha for technical operators: yes / stronger
product-ready: no
widened internal alpha: no
V02-01 real second-operator proof: blocked/deferred
active stream: V306 Knowledge Cards Tokenized Text Search
current task: V306-00 Knowledge Cards Tokenized Text Search
```

## Compact Completed Checkpoints

Detailed history stays in `PLANS.md`.

```txt
repo/current-truth hygiene: complete enough for continuation
evidence/review loop: DB-backed and useful for dogfood
candidate reviewability: core primitive
pattern gate/readback: active hardening stream
product-ready brain: not complete
```

Remaining product gaps:

```txt
1. pattern search/readback hardening
2. research/paper/course source decisions
3. mini brain-QA benchmark
4. ingest v0
5. graph brain v0
6. heartbeat/dreaming v0 as candidate generator
7. consensus v0 as eval/candidate layer
8. product UI/search/API/MCP after usefulness/security gates
```

## Active Stream

### V306 Knowledge Cards Tokenized Text Search

Goal:

Make `krn knowledge cards --text` less brittle for Pattern Application Gate
operators by using deterministic tokenized matching instead of whole-query
substring matching.

Current finding:

```txt
V305 added no-match guidance for zero-result knowledge-card queries. The deeper
issue is that `--text` currently treats a multi-word query as one normalized
substring, so natural pattern-gate queries can miss cards containing many
individual terms.
```

Current action:

```txt
Execute V306-00: change text matching to deterministic tokenized matching with
tests and proof boundaries. Preserve read-only output, `totalCards`, no-match
guidance, and explicit "does not prove search ranking quality" caveats. Do not
add semantic ranking, embeddings, API/MCP/dashboard, source crawler, target
writes, or Memory Core mutation.
```

Primary consumer:

```txt
pattern application gate operator UX and knowledge-card readback.
```

Falsifier:

```txt
Multi-term pattern-gate queries still miss relevant cards that contain the
individual mechanism terms, or the command starts implying semantic ranking
quality instead of deterministic local filtering.
```

## Pattern Gate

For non-trivial infra, harness, CI/eval, Codex-surface, TypeScript,
target-workflow, security, operator-UX, or research/paper/course-driven work,
apply: source -> mechanism -> KRN implication -> decision/rejection -> consumer
-> falsifier.

Pattern application gate:

```txt
before coding:
  query helped retained patterns;
  select 1-5 expected-use patterns or explicitly reject/defer them.

after verification:
  classify selected patterns as helped / neutral / noise / missing / stale;
  record proof and does-not-prove boundaries.
```

## External Input Blocker

Status: deferred boundary, not the current internal stream.

V02-01 still requires real second-operator inputs:

```txt
operator:
KRN source:
target repo:
DB mode:
support boundary:
operator transcript:
```

Do not substitute self/headless scenarios for V02-01.

## Hard Non-Goals

Do not build or claim: fake V02-01 proof, product-ready status, widened
internal alpha, dashboard, API server, MCP server, worker daemon, source
crawler, Research Foundry, broad eval platform, generic multi-agent system,
runtime markdown memory, hidden semantic hooks, living target repo writes
without explicit scope, large `AGENTS.md` expansion, or parallel roadmap.

## Verification Policy

Use the narrowest relevant verification for each slice.

If local Vitest or workspace tests fail with a temporary-directory write error,
set `TMPDIR` to a path outside this repository, for example:

```sh
TMPDIR=/home/krn/.cache/krn-tmp pnpm test
```

Do not set `TMPDIR` under the repo checkout: CLI boundary tests rely on
outside-workspace temporary directories.

Docs/plan-only changes: `git diff --check`.
Source changes: `pnpm typecheck`, `pnpm test`, `git diff --check`.
DB/eval-affecting changes: `pnpm db:ready`, `pnpm db:smoke`,
`pnpm eval:promptfoo:smoke`.

After each bounded slice, commit, push, and confirm CI when appropriate. Use a
full `git rev-parse HEAD` SHA for `gh run list --commit`; if that is empty, use
branch readback and match `headSha`. Do not claim missing CI from short-SHA
lookup alone.
````

## File: PLANS.md
````markdown
# KRN Continuous Brain Growth Active Ledger

Status: compact active ledger. Date: 2026-06-28.

Root `PLAN.md` is the compact product single source of truth. Root `GOAL.md`
states the active objective. This file carries only current execution state,
remaining product gaps, and the next bounded task.

Archived detailed ledger:

```txt
docs/plans/historical-ledgers/2026-06-28-root-plans-before-v306-context-condensation.md
```

stale attachment objective guard: attachments are evidence, not authority to
roll the active stream backward.

## Current State

```txt
controlled-internal-alpha for technical operators: yes / stronger
product-ready: no
widened internal alpha: no
V02-01 real second-operator proof: blocked/deferred
active stream: V306 Knowledge Cards Tokenized Text Search
current task: V306-00 Knowledge Cards Tokenized Text Search
latest pushed commit checked before condensation: 173fdd1 feat(knowledge): guide no-match card queries
latest CI checked before condensation: KRN CI success for 173fdd1e82c708ef2d8b576248dbdccd1dc45c5bc
```

Known current gap:

```txt
V306-00 Knowledge Cards Tokenized Text Search is the current gap. V305 added
zero-result guidance; the next gap is brittle whole-query substring matching
for natural multi-term pattern-gate queries.
```

## 2. Product Thesis

KRN is a Codex Operating Layer / AI Engineering Control Plane.

Codex executes. KRN supplies bounded context, store-backed memory, source
grounding, policy, skills, eval expectations, traces, review gates, and
feedback.

Current loop:

```txt
controlled scenario -> evidence -> finding -> condensation decision
  -> rule / skill / guard / eval / memory candidate / source decision / repair
  -> append next bounded task here -> continue
```

## Current Brain Readiness

```txt
repo/current-truth hygiene: strong
evidence/review loop: strong
DB-backed replay: proven
candidate reviewability: core primitive
activation: useful for guardrails, still weak for owner-file recall in some runs
reflection/candidate usefulness: partially proven, not product-grade
pattern brain: partial; gate/skills/standards exist, continuous intake/enforce/eval loop still incomplete
UI/search over brain knowledge: CLI read-only preview exists; web/API/MCP not started
```

Important distinction:

```txt
pattern gate exists != full pattern brain exists
source decision exists != continuous research condensation exists
skill exists != all Codex work is skill-routed
green test != product value
```

## Remaining Product Gaps

These are the only current high-level blocks that matter for the brain roadmap:

1. Pattern Brain execution/readback hardening: finish V306 and keep pattern-card
   search useful for pre-coding pattern gates.
2. Research/paper/course source decisions: ingest selected public sources such
   as MemGPT, Generative Agents, Reflexion, Self-RAG, GraphRAG, HippoRAG, CoALA,
   Voyager, OpenAI docs, and high-quality TypeScript material through
   source-to-decision, not source hoarding.
3. Mini brain-QA benchmark: 30 initial KRN questions, later 100-300 corpus
   questions, comparing no-memory, lexical, memory, source, hybrid, anti-memory,
   and graph-stub paths.
4. Ingest v0: source artifact -> content hash -> chunk -> source range -> claim
   -> embedding/search document with permission and temporal metadata.
5. Graph brain v0: entities, events, claims, relations, duplicates,
   contradictions, supersession, and temporal slices.
6. Heartbeat/dreaming v0: candidate generator only; no final Memory Core
   mutation without review.
7. Consensus v0: eval/candidate layer with preserved dissent, not autonomous
   truth runtime.
8. Product surfaces: web UI/search/API/MCP only after usefulness gates,
   permission/security boundaries, and read-model proof.

## Active Task Queue

### V306-00 — Knowledge Cards Tokenized Text Search

Status: active.

Goal:

```txt
Make `krn knowledge cards --text` deterministic and less brittle by matching
query tokens instead of requiring the whole normalized query as one substring.
```

Product rationale:

```txt
Pattern Application Gate operators should be able to ask natural multi-term
questions and still find relevant retained patterns before coding.
```

Architectural rationale:

```txt
This improves read-only pattern-brain recall without adding semantic ranking,
embeddings, API, MCP, dashboard, source crawler, or Memory Core mutation.
```

Evidence source:

```txt
V305 proved no-match guidance, but also exposed that whole-query substring
matching can miss cards containing the individual mechanism terms.
```

Files likely touched:

```txt
packages/harness/src/brainKnowledgeReadModel.ts
packages/harness/src/brainKnowledgeReadModel.test.ts
packages/cli/src/runKnowledgeCardsCommand.ts
packages/cli/src/runKnowledgeCardsCommand.test.ts
docs/reviews/controlled-dogfood/2026-06-28-v306-knowledge-cards-tokenized-text-search/REPORT.md
```

Forbidden writes:

```txt
dashboard, API, MCP, source crawler, DB schema, Memory Core mutation, semantic
ranking, embeddings, broad eval platform, unrelated cleanup.
```

Definition of Done:

- multi-token text search matches cards containing meaningful query tokens;
- no-match guidance from V305 remains visible for zero results;
- `totalCards`, `returnedCards`, and `limit` remain honest;
- output states deterministic filtering does not prove semantic ranking quality;
- focused tests, `pnpm typecheck`, `pnpm test`, and `git diff --check` pass;
- dogfood report records pattern usefulness and proof/non-proof boundaries;
- commit is pushed and CI is checked if triggered.

## 9. Task Contract Schema

Every new task appended to `Active Task Queue` or `Generated Task Backlog` must use this schema.
If a task cannot satisfy the schema, it is not ready for execution.

ID:
Name:
Status:
Goal:
Product rationale:
Architectural rationale:
Evidence source:
Official/external sources:
Inputs required:
Files likely touched:
Allowed writes:
Forbidden writes:
Output requirements:
Definition of Done:
Verification commands:
Acceptance criteria:
Risk:
Rollback:
Condensation expectation:
Next-task synthesis rule:

## Pattern Gate

For every non-trivial infra, harness, CI/eval, Codex-surface, TypeScript,
target-workflow, security, operator-UX, or research/paper/course-driven slice:

```txt
source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier
```

Use `docs/runbooks/pattern-intake.md`. The pattern gate must query helped
retained patterns, select 1-5 expected-use patterns or explicitly reject/defer
them, and then classify selected patterns as helped / neutral / noise / missing
/ stale / unknown.

Surface Consumer Matrix remains the rule for deciding whether a pattern belongs
in a skill, guard, source decision, eval, memory candidate, or active task.

## 13. Generated Task Backlog

Template:

### <ID> — <Name>

Status:
Goal:
Product rationale:
Architectural rationale:
Evidence source:
Official/external sources:
Inputs required:
Files likely touched:
Allowed writes:
Forbidden writes:
Output requirements:
Definition of Done:
Verification commands:
Acceptance criteria:
Risk:
Rollback:
Condensation expectation:
Next-task synthesis rule:
Pattern surface:
Primary consumer:
Does not prove:
Falsifier:

Current candidate after V306:

### V307 — Pattern Search Usefulness Feedback Closure

Status: candidate, not active.
Goal: record whether tokenized pattern-card search actually helps the next
pre-coding pattern gate.
Product rationale: prevent search improvements from becoming unmeasured UI
comfort.
Architectural rationale: close pattern usefulness feedback before widening
search surfaces.
Evidence source: V306 report.
Official/external sources: none unless V306 needs source-to-decision.
Inputs required: V306 outcome.
Files likely touched: `PLANS.md`, V306/V307 report paths, possibly tests.
Allowed writes: docs/tests only if V306 evidence justifies them.
Forbidden writes: scoring rewrite, embeddings, API/MCP/dashboard.
Output requirements: one bounded follow-up task or explicit rejection.
Definition of Done: V306 usefulness is classified.
Verification commands: `git diff --check`; source checks if touched.
Acceptance criteria: no new broad roadmap.
Risk: inventing work from vibes.
Rollback: remove candidate if V306 falsifies need.
Condensation expectation: keep under this backlog section.
Next-task synthesis rule: only activate if V306 evidence supports it.
Pattern surface: Pattern Application Gate.
Primary consumer: Codex pre-coding operator.
Does not prove: product-ready search.
Falsifier: V306 already records enough usefulness feedback.

## 15. Progress

- [x] V303 Active Slice Application Gate: complete.
- [x] V304 Knowledge Cards Readback Limit: complete.
- [x] V305 Knowledge Cards No-Match Guidance: complete.
- [ ] V306 Knowledge Cards Tokenized Text Search: active.

Detailed old progress is archived in:

```txt
docs/plans/historical-ledgers/2026-06-28-root-plans-before-v306-context-condensation.md
```

## Recent Evidence Pointers

- V303 report:
  `docs/reviews/controlled-dogfood/2026-06-28-v303-active-slice-application-gate/REPORT.md`
- V304 report:
  `docs/reviews/controlled-dogfood/2026-06-28-v304-pattern-gated-source-slice-trial/REPORT.md`
- V305 report:
  `docs/reviews/controlled-dogfood/2026-06-28-v305-knowledge-cards-no-match-guidance/REPORT.md`
- Latest checked commit before this condensation:
  `173fdd1 feat(knowledge): guide no-match card queries`

## Outcome V306 Context Condensation

Status: current slice-in-progress.

Source-to-decision:

- Source: user request to stop filling context with redundant plan history.
- Mechanism: active root files are repeatedly reloaded after compaction; long
  historical ledgers consume context and reduce continuation reliability.
- KRN implication: active truth should keep only current state, next task,
  remaining product gaps, and evidence pointers.
- Decision: archive the detailed `PLANS.md` ledger and replace the active file
  with a compact current-state ledger.
- Does not prove: that historical evidence is obsolete or that V306 source work
  is complete.
- Consumer: future Codex continuation after compact.
- Falsifier: a new continuation cannot identify active stream/task, latest
  verified state, remaining product gaps, or next action from root files.

## 21. Final Response Format For Codex Runs

Every continuation or completed slice must end with:

DB used:
Commands run:
Reports/artifacts:
Commits/CI:
What this proves:
What this does not prove:
Condensation decisions:
Tasks appended to PLANS.md:
Next active task:
Blocked/budget-limited:

## 22. Compact GOAL.md Contract To Pair With This Plan

Active stream: <current active stream from PLAN.md>.

For every non-trivial infra, harness, CI, eval, Codex-surface, TypeScript,
target-workflow, security, operator-UX, or research/paper/course-driven slice,
use:

```txt
source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier
```

If attachments, old prompts, or summaries conflict with root active state, read them as historical evidence.
do not roll the active stream backward.

## 23. Plan Revision Note

At creation time this file replaced a long append-only active ledger with a
compact current-state ledger. Historical details remain available through the
archive path and linked reports, but active execution resumes from the root
state above.
````
