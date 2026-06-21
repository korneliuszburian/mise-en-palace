Poniżej masz finalny prompt w wersji, którą wkleiłbym do Codexa jako nadrzędny kierunek. Ucinam aktywną warstwę researchera. Zostawiam tylko świadome miejsce na przyszły, bounded, read-only research lane, ale nie jako część obecnego implementation runu.

Przyjąłem jako rdzeń: KRN to Codex Operating Layer / AI Engineering Control Plane; stare repo jest archiwum/quarry, nie baza implementacyjna; runtime memory nie jest markdowniem; evale mają chronić realne kontrakty, a nie robić teatr; dashboard, benchmark lane, researcher swarm, MCP server i plugin packaging są odłożone, bo nie mogą wyprzedzać harnessu.

---

# FINALNY PROMPT DO CODEXA

Wklej całość:

```md
# KRN Final Harness-First Bootstrap

Repository root:

`/home/krn/coding/krn/active/mise-en-palace`

You are working on KRN.

KRN is a Codex Operating Layer / AI Engineering Control Plane.

Codex executes.
KRN supplies the harness: bounded context, source grounding, service/store-backed memory contracts, policy gates, execution constraints, evidence capture, review assessment, and feedback into memory/source/eval candidates.

The product promise remains:

`krn init` turns a repo into an agent-ready, source-grounded, memory-aware, eval-driven, reviewable Codex CLI working environment.

But the architecture must not be defined by `krn init`, CLI commands, dashboards, context packets, or researcher swarms.

The architecture is harness-first.

## 0. Highest-Level Decision

Do not build a researcher layer in this run.

Do not build a deep research swarm, source crawler, browser workflow, autonomous researcher, scout/verifier subagents, or research-worker package.

Future research can exist later as a bounded lab lane, but only after the harness contract exists and only with:

- hypothesis;
- source classes allowed;
- read-only/proposal-only execution;
- fixed budget;
- primary-source preference;
- consumer artifact;
- falsifier;
- merge target;
- keep / kill / revisit outcome.

For now, the research layer is explicitly out of scope.

This run builds the final-pattern KRN harness spine.

Thin implementation is allowed.
Temporary architecture is not allowed.

Do not implement crippled MVP abstractions that will later need renaming or conceptual replacement.

Slices are transaction boundaries.
Slices are not product stages.
Every slice must implement part of the final model.

## 1. Core Architecture

KRN Harness compiles operator intent into a bounded, source-linked, policy-checked Codex execution run and folds verified evidence back into memory/source/eval feedback.

Canonical flow:

OperatorIntent
  -> TaskContract
  -> HarnessPlan / ExecPlan
  -> ContextAssembly
  -> CodexExecutionRun
  -> EvidenceContract
  -> EvidenceBundle
  -> ReviewAssessment
  -> FeedbackDelta
  -> MemoryCandidate / SourceDecision / EvalCandidate

Central abstractions:

- OperatorIntent: what the human is trying to accomplish.
- TaskContract: objective, constraints, non-goals, stopping condition, verification surface.
- HarnessPlan: restartable execution plan with milestones, checkpoints, decision log, progress pointers.
- ContextAssembly: selected context, excluded context, source claims, memory claims, policy gates, evidence contract.
- CodexExecutionRun: one bounded attempt to execute through Codex-native surfaces.
- EvidenceContract: what must be observed for the work to count.
- EvidenceBundle: actual diffs, tests, typecheck, logs, review notes, tool traces.
- ReviewAssessment: diff risk, review burden, rollback path, confidence.
- FeedbackDelta: candidates for memory/source/eval/policy updates.
- MemoryCandidate: proposed memory change, not automatic runtime memory mutation.
- SourceDecision: source-to-decision mapping.
- EvalCandidate: future regression/golden-task candidate, not broad eval suite.

## 2. Hard Corrections From Earlier Drift

Do not make `ContextPacket` the product center.

If an execution brief or context packet exists, it is a rendered artifact of `ContextAssembly`, not the core abstraction.

Do not add `requiredSkills` as a core domain field.

Skills are Codex-native progressive-disclosure capabilities and reusable engineering disciplines. Skill selection may be adapter/compiler metadata, but it is not part of the persistent core domain model.

Do not let CLI commands define architecture.

CLI is an adapter over the harness domain.

Correct layering:

core domain
  -> harness compiler / planner
  -> source graph contracts
  -> memory core contracts
  -> policy/evidence/review contracts
  -> Codex adapter
  -> CLI adapter
  -> future optional MCP/dashboard/research adapters

Incorrect layering:

init command
  -> doctor command
  -> context command
  -> review command
  -> dashboard

## 3. Required Reading Before Edits

Read only what is needed.

Start with:

1. `AGENTS.md`
2. `GOAL.md`
3. `PLAN.md` if it exists
4. `docs/STATE_OF_THE_ART.md` if it exists
5. `docs/KRN_KERNEL.md` if it exists
6. `docs/KRN_ONBOARDING.md` if it exists
7. `docs/KRN_FAILURE_REPORT.md` if it exists
8. `docs/standards/typescript-boundaries.md` if it exists
9. `docs/standards/git-commits.md` if it exists
10. current package manifests
11. current tsconfig files
12. current `packages/core` and `packages/cli` layout

Do not read:

- all historical goals;
- all historical memory notes;
- all benchmark artifacts;
- all eval reports;
- raw onboarding material unless verifying quarantine;
- old repo topology as implementation guidance.

The old repo / old materials are archive and research quarry only.

Use them only for:

- product thesis;
- failure report;
- anti-patterns;
- source links;
- selected mechanism ideas.

Do not continue old goal chains.
Do not copy old topology.

## 4. Non-Goals For This Run

Do not create:

- dashboard;
- `apps/`;
- broad benchmark lane;
- broad eval suite;
- `.krn` runtime memory;
- MemoryStore implementation;
- SourceStore implementation;
- MCP server;
- plugin package;
- plugin marketplace packaging;
- cloud sync;
- public API server;
- multi-project registry;
- broad subagent system;
- researcher swarm;
- source crawler;
- custom prompt library;
- old repo topology import;
- runtime memory in markdown;
- huge AGENTS.md;
- giant GOAL.md;
- generic “agent zoo”;
- TypeScript/Frontend/WordPress/etc. specialist agents as default architecture.

Future extension points may be represented as contracts or decision notes only when they directly protect the harness shape.

## 5. Engineering Standards

### 5.1 TypeScript

Use strict TypeScript.

Rules:

- no `any`;
- no type weakening to make tests pass;
- external/untrusted data stays `unknown` until validated;
- no global `ts-reset` in `packages/core`;
- no weakening tsconfig;
- no hidden runtime assumptions in type names;
- no giant clever type puzzles;
- prefer boring explicit domain types;
- public exports must be reviewed;
- package boundaries must be clear.

`packages/core` must stay library-safe:

- no process-global mutation;
- no filesystem side effects;
- no shell execution;
- no environment reads;
- no Codex invocation;
- no network;
- no CLI formatting dependency.

CLI and adapters may perform side effects.
Core may define contracts and pure functions.

### 5.2 Dependencies

Do not add dependencies by default.

Before adding any dependency, record a decision in the run decision log.

Allowed candidates only if justified:

- Vitest: allowed for minimal contract tests if no test runner exists.
- tsx: allowed for dev/CLI execution if it avoids build complexity.
- zod / effect Schema: defer unless runtime validation is essential now.
- tsup: defer unless build/publish requires it.
- ts-reset: not allowed in `packages/core`.

Do not add a dependency because another good repo uses it.
Adopt mechanisms, not cargo-cult packages.

### 5.3 Tests

Tests must protect real contracts and old failure modes.

Useful tests:

- harness domain contract fixtures;
- public export checks;
- `ContextAssembly` cannot regress into `requiredSkills`;
- `SourceClaim` requires mechanism and does-not-prove semantics;
- `MemoryRecord` requires source lineage and application guidance;
- `ToolBoundary` distinguishes read/propose/write/destructive;
- `EvalCandidate` remains candidate-only;
- init dry-run writes nothing;
- doctor detects forbidden surfaces;
- evidence capture does not mutate memory.

Do not build broad benchmark/eval tooling.

### 5.4 Commits

Use Semantic/Conventional Commits only.

Allowed examples:

- `docs(run): add harness-first bootstrap plan`
- `docs(kernel): define harness vocabulary`
- `feat(core): add harness domain contracts`
- `feat(core): add source and memory contracts`
- `feat(core): add policy evidence and eval contracts`
- `test(core): guard harness contract model`
- `feat(cli): add harness plan adapter`
- `feat(cli): add harness readiness doctor`
- `feat(cli): add evidence capture adapter`
- `docs(run): record harness dogfood pass`
- `docs(run): add final harness bootstrap handoff`

Avoid:

- update
- wip
- changes
- misc
- stuff
- final
- cleanup without scope

Commit only verified slices.

### 5.5 Repair Loop

For each implementation slice:

implement
  -> verify
  -> inspect failure
  -> repair attempt 1
  -> verify
  -> repair attempt 2 if needed
  -> if still failing, mark blocked and move to an independent slice or final handoff

Never silently weaken contracts to pass.

### 5.6 Anti-Rot Loop

After every 3 implementation slices, run:

- `git status --short --branch`
- `pnpm typecheck`
- `pnpm test` if available

Check:

- no forbidden surfaces appeared;
- no unapproved dependency appeared;
- no `any`;
- no weakened tsconfig;
- no runtime markdown memory;
- no broad eval suite;
- no dashboard/app;
- AGENTS.md stayed thin;
- GOAL.md did not become product brain;
- run docs are updated;
- next action is concrete.

## 6. Restart / Context Loss Protocol

If context is lost, compacted, or uncertain, do not guess.

Recover by reading only:

1. `AGENTS.md`
2. `GOAL.md`
3. `PLAN.md`
4. latest run `PROGRESS.md`
5. latest run `HANDOFF.md`
6. latest run `DECISIONS.md`
7. latest run `BLOCKERS.md`
8. `git log --oneline -8`
9. files directly touched by the next unchecked slice

Do not recover by rereading all docs.

Do not solve context rot by adding more context.

Solve it by:

- small kernel contract;
- source graph;
- Memory Core retrieval contracts;
- bounded ContextAssembly;
- compact run ledger;
- explicit next action.

## 7. Run Files

Create or update:

docs/runs/2026-06-21-harness-bootstrap/
  PROGRESS.md
  HANDOFF.md
  DECISIONS.md
  BLOCKERS.md
  VERIFICATION.md

Keep them compact.

Do not create a sprawling report.

`PROGRESS.md` format:

# Progress — 2026-06-21 Harness Bootstrap

## Current Slice
- ID:
- Status: pending | in_progress | complete | blocked | skipped
- Started:
- Completed:
- Commit:

## Completed Slices
| Slice | Status | Commit | Verification | Notes |
|---|---|---|---|---|

## Blocked Slices
| Slice | Reason | Next Safe Action |
|---|---|---|

## Skipped Slices
| Slice | Reason |
|---|---|

## Next Action
One concrete next action only.

`HANDOFF.md` format:

# Handoff — 2026-06-21 Harness Bootstrap

## Last Verified State

## Commits Created

## Verification Passed

## Current Boundaries

## Blockers

## Not Built

## Next Safest Action

## Files To Read After Context Loss
1. AGENTS.md
2. GOAL.md
3. PLAN.md
4. docs/runs/2026-06-21-harness-bootstrap/PROGRESS.md
5. docs/runs/2026-06-21-harness-bootstrap/HANDOFF.md
6. docs/runs/2026-06-21-harness-bootstrap/DECISIONS.md
7. docs/runs/2026-06-21-harness-bootstrap/BLOCKERS.md
8. git log --oneline -8

`DECISIONS.md` format:

# Decisions — 2026-06-21 Harness Bootstrap

| ID | Decision | Alternatives | Why | Revisit When |
|---|---|---|---|---|

`BLOCKERS.md` format:

# Blockers — 2026-06-21 Harness Bootstrap

| Slice | Blocker | Evidence | Next Safe Action |
|---|---|---|---|

`VERIFICATION.md` format:

# Verification — 2026-06-21 Harness Bootstrap

| Slice | Commands | Result | Notes |
|---|---|---|---|

## 8. Target Domain Layout

Prefer this layout unless current repo conventions strongly suggest a smaller equivalent:

packages/core/src/
  kernel/
    ProjectKernel.ts
    ArchitectureBoundary.ts
    Decision.ts
    index.ts

  harness/
    OperatorIntent.ts
    TaskContract.ts
    HarnessPlan.ts
    ContextAssembly.ts
    ExecutionRun.ts
    EvidenceContract.ts
    EvidenceBundle.ts
    ReviewAssessment.ts
    FeedbackDelta.ts
    index.ts

  source/
    SourceArtifact.ts
    SourceClaim.ts
    SourceDecisionEdge.ts
    SourceUse.ts
    SourceLineage.ts
    index.ts

  memory/
    MemoryRecord.ts
    MemoryCandidate.ts
    MemoryRetrieval.ts
    InvalidationPolicy.ts
    ApplicationFeedback.ts
    index.ts

  policy/
    PolicyGate.ts
    ToolBoundary.ts
    ExecutionConstraint.ts
    index.ts

  skills/
    SkillManifest.ts
    SkillSelection.ts
    index.ts

  eval/
    EvalCandidate.ts
    index.ts

  codex/
    CodexSurface.ts
    CodexAdapterContract.ts
    index.ts

  index.ts

Notes:

- `SkillSelection` is adapter/compiler metadata, not a core `TaskContract` field.
- `ContextAssembly` may include skill-related adapter hints only if explicitly separated from persistent core contract.
- No runtime stores in this run.
- Store interfaces are allowed only if they clarify future boundaries and do not pretend implementation exists.
- No dashboard-oriented types unless they are pure projections over existing typed objects and needed now. Prefer not to add them.

## 9. Required Domain Semantics

### 9.1 ProjectKernel

Must represent:

- project identity;
- architecture boundaries;
- source policy;
- memory policy;
- evidence policy;
- review policy;
- allowed adapter surfaces;
- forbidden surfaces;
- current kernel version.

It must not absorb the whole product brain.

### 9.2 OperatorIntent

Must represent:

- raw operator request;
- normalized task title;
- operator constraints;
- urgency / mode if known;
- repo/project scope;
- ambiguity notes.

### 9.3 TaskContract

Must include:

- objective;
- non-goals;
- constraints;
- assumptions;
- stopping condition;
- verification surface;
- rollback expectation;
- risk notes.

It must not include `requiredSkills` as a core field.

### 9.4 HarnessPlan

Must include:

- task contract reference;
- milestones;
- execution slices;
- checkpoints;
- decision log references;
- progress references;
- blocked conditions;
- recovery protocol;
- current next action.

It is the durable operational contract.
It must not become the entire product brain.

### 9.5 ContextAssembly

Must include:

- task contract reference;
- included context;
- excluded context;
- source claim refs;
- memory claim refs;
- policy gates;
- evidence contract;
- token/context budget notes;
- next action.

It must explicitly model exclusions.

It must not become a dump of all docs.
It must not have `requiredSkills` as a central field.

### 9.6 SourceArtifact / SourceClaim

Source is not “a link”.
Source is evidence for a mechanism, decision, risk, rejection, eval design, or implementation boundary.

`SourceClaim` must include:

- claim;
- mechanism;
- doesNotProve;
- support type;
- trust tier;
- source lineage;
- consumer;
- falsifier or revisit condition when applicable.

Sources that only sound impressive must not be retained as product truth.

### 9.7 MemoryRecord / MemoryCandidate

Runtime memory is not markdown.

`MemoryRecord` must include:

- ID;
- type;
- owner;
- confidence;
- source lineage;
- valid time;
- TTL or invalidation policy;
- last used time if known;
- application guidance;
- feedback status.

`MemoryCandidate` must represent a proposed update from evidence.
It must not automatically mutate runtime memory.

Files may be:

- export;
- audit trail;
- source bank;
- seed;
- human-readable backup.

Files are not Memory Core.

### 9.8 PolicyGate / ToolBoundary

Tool boundaries must distinguish:

- read;
- propose;
- write;
- destructive.

Policy gates must support:

- pre-edit checks;
- approval gates;
- sandbox/permission boundaries;
- risky path warnings;
- generated file warnings;
- “do not write” modes;
- rollback path expectations.

Hooks may later enforce or annotate some of this, but hooks are not the semantic architecture.

### 9.9 EvidenceContract / EvidenceBundle

EvidenceContract defines what must be observed.

EvidenceBundle records what was actually observed:

- changed files;
- diff summary;
- typecheck result;
- test result;
- lint/build result if available;
- review notes;
- tool trace references;
- source claim usage;
- memory claim usage;
- unmet evidence.

Do not claim success without evidence.

### 9.10 ReviewAssessment

Must include:

- diff risk;
- review burden;
- confidence;
- rollback path;
- reviewer notes;
- unresolved concerns;
- “what this does not prove”.

Review burden and diff risk are primary product metrics.

### 9.11 FeedbackDelta

Must include proposed updates to:

- memory candidates;
- source decisions;
- eval candidates;
- policy refinements;
- skill lifecycle notes;
- documentation corrections.

Do not automatically apply memory changes.
Do not generate eval suites from every thought.

### 9.12 EvalCandidate

EvalCandidate is not an eval suite.

It must represent:

- protected contract;
- known failure or golden task;
- fixture idea;
- expected failure mode;
- verification strategy;
- owner/revisit state.

Add eval tooling only after real trace evidence justifies it.

### 9.13 SkillManifest / SkillSelection

Skills are reusable engineering disciplines.

A skill must have:

- purpose;
- trigger;
- inputs;
- outputs;
- forbidden behavior;
- verification;
- lifecycle state;
- owner;
- removal condition.

Skills should not be narrowly KRN-oriented unless the workflow is truly KRN-specific.

Do not create a skill zoo.
Do not use skills as a substitute for harness design.

`SkillSelection` may exist as adapter/compiler output, but it must not become a persistent core field like `requiredSkills`.

### 9.14 CodexAdapterContract

Codex-native surfaces are adapter targets:

- AGENTS.md: thin repo policy and pointers.
- Skills: progressive-disclosure reusable engineering workflows.
- Subagents: future read-heavy/proposal-only bounded probes, not default execution brain.
- Hooks: future deterministic policy/trace/guardrail surfaces, not semantic architecture.
- MCP: future typed tool/context boundary, not memory.
- Goals / PLAN.md: durable objective and restartable execution plan.
- Permissions/rules: command/tool policy, not product architecture.

Do not implement a Codex MCP server in this run.
Do not create broad subagents in this run.
Do not create custom prompt library.

## 10. CLI Adapter Direction

CLI is an adapter.

Allowed thin CLI operations for this run:

- `krn plan --task "..."`
- `krn doctor`
- `krn evidence capture`
- `krn init --dry-run`

Meaning:

### `krn plan --task "..."`

Creates a HarnessPlan / ContextAssembly-like output for one task.

Must include:

- TaskContract;
- ContextAssembly;
- included/excluded context;
- source/memory notes;
- evidence contract;
- policy gates;
- stopping condition;
- next action.

Must not:

- read raw onboarding material;
- dump all docs;
- write memory;
- create `.krn`;
- claim final product quality.

### `krn doctor`

Read-only harness readiness audit.

Checks:

- kernel docs exist;
- AGENTS.md exists and is compact;
- Semantic/Conventional commit standard exists;
- strict TypeScript typecheck exists;
- test command status is known;
- no dashboard/apps;
- no broad benchmark lane;
- no `.krn` runtime memory;
- no MCP server;
- no plugin package;
- no broad subagent system;
- no researcher package;
- skills directory status is known;
- ts-type-critic or equivalent review surface status is known if present.

Must not write files.

### `krn evidence capture`

Captures post-run evidence.

Outputs:

- changed files;
- diff summary;
- verification commands;
- typecheck/test status if known;
- diff risk;
- review burden;
- rollback path;
- feedback candidates.

Must not mutate memory automatically.
Must not create dashboard.

### `krn init --dry-run`

Bootstrap proposal only.

Must:

- detect repo root;
- detect git;
- detect package manager;
- detect TypeScript;
- detect existing AGENTS.md;
- detect existing `.agents/skills`;
- detect existing `.codex/agents`;
- detect available scripts;
- propose thin KRN overlay;
- explicitly say “No files written”.

Must not write by default.
Must refuse non-dry-run unless write mode is intentionally implemented later.

## 11. Execution Slices

### Slice 00 — Preflight and Run Ledger

Goal:
Make this run restartable before implementation.

Tasks:

- Run:
  - `git status --short --branch`
  - `git log --oneline -8`
  - `pnpm typecheck`
- Create/update run files.
- Record current repo state.
- Record that this is harness-first and no researcher layer will be built.
- Confirm forbidden surfaces are absent.

Verification:

- `pnpm typecheck`
- run docs exist
- dirty state either absent or documented

Commit:

`docs(run): add harness-first bootstrap ledger`

Stop condition:
If repo is dirty before starting, document before editing.

---

### Slice 01 — Harness Vocabulary

Goal:
Encode final architecture vocabulary before adding code.

Tasks:

- Update or create compact glossary/architecture doc.
- Define:
  - Harness
  - OperatorIntent
  - TaskContract
  - HarnessPlan
  - ContextAssembly
  - ContextInclusion
  - ContextExclusion
  - SourceArtifact
  - SourceClaim
  - MemoryRecord
  - MemoryCandidate
  - EvidenceContract
  - EvidenceBundle
  - ReviewAssessment
  - FeedbackDelta
  - EvalCandidate
  - PolicyGate
  - ToolBoundary
  - CodexAdapter
- Mark rejected/avoid:
  - `ContextPacket` as product center
  - `requiredSkills` as core domain field
  - CLI as architecture
  - dashboard proof
  - runtime markdown memory
  - researcher as default layer

Verification:

- docs compact
- no huge AGENTS.md
- `pnpm typecheck`

Commit:

`docs(kernel): define harness vocabulary`

---

### Slice 02 — Domain Layout Decision

Goal:
Decide final file/module layout before adding types.

Tasks:

- Inspect `packages/core`.
- Inspect `packages/cli`.
- Record final layout in `DECISIONS.md`.
- Adapt the target layout to current repo conventions only when necessary.

Verification:

- no behavior added
- `pnpm typecheck`

Commit:

`docs(run): record harness domain layout`

---

### Slice 03 — Kernel and Harness Contracts

Goal:
Add pure core contracts for final harness flow.

Tasks:

Add types for:

- ProjectKernel
- ArchitectureBoundary
- Decision
- OperatorIntent
- TaskContract
- HarnessPlan
- ContextAssembly
- ContextInclusion
- ContextExclusion
- ExecutionRun

Rules:

- no `any`;
- no side effects;
- no storage implementation;
- no CLI dependency;
- no `requiredSkills` in core TaskContract or ContextAssembly;
- no dashboard/MCP/research implementation claims.

Verification:

- `pnpm typecheck`
- inspect public exports

Commit:

`feat(core): add kernel and harness contracts`

---

### Slice 04 — Source and Memory Contracts

Goal:
Model source and memory as final first-class systems without implementing stores.

Tasks:

Add types for:

- SourceArtifact
- SourceClaim
- SourceUse
- SourceLineage
- SourceDecisionEdge
- MemoryRecord
- MemoryCandidate
- MemoryRetrieval
- InvalidationPolicy
- ApplicationFeedback

MemoryRecord must include:

- source lineage;
- owner;
- confidence;
- validity/TTL/invalidation;
- application guidance;
- feedback status.

SourceClaim must include:

- mechanism;
- doesNotProve;
- trust tier;
- support type;
- consumer;
- lineage.

Verification:

- `pnpm typecheck`
- no runtime markdown memory
- no MemoryStore implementation

Commit:

`feat(core): add source and memory contracts`

---

### Slice 05 — Policy, Evidence, Review, Eval Contracts

Goal:
Complete the harness feedback loop contracts.

Tasks:

Add types for:

- PolicyGate
- ToolBoundary
- ExecutionConstraint
- EvidenceContract
- EvidenceBundle
- ReviewAssessment
- DiffRisk
- ReviewBurden
- FeedbackDelta
- EvalCandidate

Rules:

- ToolBoundary must distinguish read/propose/write/destructive.
- EvalCandidate must be candidate-only.
- FeedbackDelta must propose, not auto-apply.

Verification:

- `pnpm typecheck`

Commit:

`feat(core): add policy evidence review and eval contracts`

---

### Slice 06 — Codex Adapter Contracts

Goal:
Map Codex-native surfaces without implementing a broad automation layer.

Tasks:

Add contracts for:

- CodexSurface
- CodexAdapterContract
- CodexGoalReference
- CodexPlanReference
- CodexSkillReference
- CodexHookReference
- CodexSubagentReference
- CodexMcpReference

Rules:

- references only;
- no MCP server;
- no subagent zoo;
- no researcher;
- no custom prompt library;
- no hook files unless existing repo convention requires them and decision is recorded.

Verification:

- `pnpm typecheck`

Commit:

`feat(core): add Codex adapter contracts`

---

### Slice 07 — Public API Review

Goal:
Prevent early exported type rot.

Tasks:

- Inspect all public exports.
- Remove accidental exports.
- Ensure names reflect final harness model.
- Ensure no `requiredSkills` core field exists.
- Ensure no dashboard/MCP/research implementation leakage.
- Ensure no storage claims.

Verification:

- `pnpm typecheck`
- update `VERIFICATION.md`

Commit only if code changes:

`refactor(core): tighten harness public exports`

---

### Slice 08 — Test Strategy and Dependency Gate

Goal:
Add only minimal test capability needed to protect contracts.

Tasks:

- Inspect existing test setup.
- If test runner exists, use it.
- If absent, decide whether Vitest is justified.
- Record decision.
- Do not add zod/effect/tsup/ts-reset here.

Verification:

- `pnpm typecheck`
- `pnpm test` if available

Commit:

`test(core): add minimal contract test setup`

or:

`docs(run): defer test runner adoption`

---

### Slice 09 — Harness Contract Fixtures

Goal:
Protect final model from regressing into shallow featurelets.

Tests/fixtures should cover:

- TaskContract requires objective and stopping condition.
- HarnessPlan has checkpoints/progress/decision references.
- ContextAssembly has inclusions and exclusions.
- ContextAssembly does not require `requiredSkills`.
- SourceClaim requires mechanism and doesNotProve.
- MemoryRecord requires source lineage and application guidance.
- ToolBoundary has read/propose/write/destructive.
- EvalCandidate is candidate-only.
- FeedbackDelta proposes, not auto-applies.

Verification:

- `pnpm typecheck`
- `pnpm test` if available

Commit:

`test(core): guard harness contract model`

---

### Slice 10 — Minimal Harness Compiler

Goal:
Create a thin pure function path through final abstractions.

Implement pure core function(s), naming according to repo style, equivalent to:

OperatorIntent
  -> TaskContract
  -> HarnessPlan
  -> ContextAssembly
  -> EvidenceContract

Rules:

- deterministic;
- no filesystem;
- no shell;
- no network;
- no Codex execution;
- no memory mutation;
- no raw onboarding reads;
- no source crawler.

Output can be conservative.

It must include:

- objective;
- constraints;
- non-goals;
- context inclusions;
- context exclusions;
- evidence contract;
- policy gates;
- stopping condition;
- next action.

Verification:

- `pnpm typecheck`
- tests if available

Commit:

`feat(core): add minimal harness compiler`

---

### Slice 11 — CLI Adapter Shape Decision

Goal:
Prevent CLI from becoming architecture.

Tasks:

- Inspect CLI structure.
- Decide exact command names.
- Prefer:
  - `krn plan --task "..."`
  - `krn doctor`
  - `krn evidence capture`
  - `krn init --dry-run`
- Record that CLI is adapter over core harness.

Verification:

- decision recorded
- `pnpm typecheck`

Commit:

`docs(run): decide harness CLI adapter shape`

---

### Slice 12 — `krn plan` Adapter

Goal:
Expose one thin vertical path through the harness.

Tasks:

Implement:

`krn plan --task "..."`

It should:

- call or mirror the core harness compiler;
- output TaskContract;
- output ContextAssembly;
- output EvidenceContract;
- include non-goals;
- include exclusions;
- include next action;
- stay small.

It must not:

- create `.krn`;
- write memory;
- read raw onboarding;
- call Codex;
- spawn subagents;
- run researcher.

Verification:

- run sample:
  - `krn plan --task "improve harness readiness doctor"`
- output uses harness vocabulary
- `pnpm typecheck`

Commit:

`feat(cli): add harness plan adapter`

---

### Slice 13 — `krn doctor` Harness Readiness Audit

Goal:
Add read-only harness readiness checks.

Tasks:

Implement or adjust:

`krn doctor`

Checks:

- repo detected;
- package manager detected;
- typecheck script exists;
- test script status known;
- AGENTS.md exists;
- AGENTS.md compactness warning;
- kernel docs exist;
- semantic commit standard exists;
- no dashboard/apps;
- no broad benchmark lane;
- no `.krn` runtime memory;
- no MCP server;
- no plugin package;
- no broad subagent system;
- no researcher package;
- no runtime memory in markdown.

Output:

- pass/warn/fail;
- remediation;
- no writes.

Verification:

- run doctor
- git status unchanged
- `pnpm typecheck`

Commit:

`feat(cli): add harness readiness doctor`

---

### Slice 14 — `krn evidence capture` Adapter

Goal:
Capture post-run evidence aligned to final harness model.

Tasks:

Implement:

`krn evidence capture`

or equivalent chosen CLI shape.

It should output:

- changed files;
- diff summary if easy;
- verification commands/status if available;
- diff risk;
- review burden;
- rollback path;
- feedback candidates:
  - memory candidates;
  - source decisions;
  - eval candidates;
  - policy candidates.

It must not:

- mutate memory;
- create dashboard;
- create eval suite;
- write `.krn` runtime memory.

Verification:

- run on clean tree
- `pnpm typecheck`
- git status unchanged unless expected docs/code changes from implementation

Commit:

`feat(cli): add evidence capture adapter`

---

### Slice 15 — `krn init --dry-run` Bootstrap Proposal

Goal:
Keep product promise visible without letting `init` define architecture.

Tasks:

Implement proposal-only:

`krn init --dry-run`

It should detect:

- repo root;
- git status;
- package manager;
- TypeScript presence;
- AGENTS.md;
- `.agents/skills`;
- `.codex/agents`;
- scripts.

It should propose:

- thin AGENTS.md strategy;
- local KRN config strategy;
- context/source pointers;
- policy boundaries;
- skills wiring;
- run ledger/audit strategy.

It must say:

“No files written.”

It must refuse non-dry-run unless explicitly implemented later.

Verification:

- run `krn init --dry-run`
- confirm git status unchanged after command
- `pnpm typecheck`

Commit:

`feat(cli): add proposal-only init dry run`

---

### Slice 16 — Known-Bad Fixtures

Goal:
Prevent old repo failure modes.

Add focused tests/fixtures for:

- dashboard-first surface detected;
- `.krn` runtime memory detected;
- broad benchmark lane detected;
- missing AGENTS.md detected;
- huge AGENTS.md warning;
- missing typecheck warning/fail;
- ContextAssembly does not become context dump;
- evidence capture does not mutate memory;
- `init --dry-run` writes nothing.

Do not create broad eval suite.

Verification:

- `pnpm typecheck`
- `pnpm test` if available

Commit:

`test(cli): add known-bad harness fixtures`

---

### Slice 17 — Harness Dogfood Pass

Goal:
Use KRN to prepare a real KRN task.

Steps:

- Run:
  - `krn plan --task "improve harness readiness doctor"`
- Inspect:
  - Is it small?
  - Does it include exclusions?
  - Does it include non-goals?
  - Does it include evidence contract?
  - Does it avoid raw materials?
  - Does it avoid skill pseudo-selection?
- Run:
  - `krn doctor`
  - `krn evidence capture`
- Record:
  - what helped;
  - what was missing;
  - review burden;
  - diff risk;
  - next harness gap.

Verification:

- dogfood notes recorded;
- no fake success;
- `pnpm typecheck`.

Commit:

`docs(run): record first harness dogfood pass`

or, if code improvement was made:

`feat(cli): improve harness readiness doctor`

---

### Slice 18 — Anti-Rot Audit

Goal:
Ensure implementation did not recreate previous repo failures.

Run:

- `git status --short --branch`
- `git log --oneline -12`
- `pnpm typecheck`
- `pnpm test` if available

Verify:

- no dashboard;
- no apps;
- no broad benchmark lane;
- no broad eval suite;
- no `.krn` runtime memory;
- no MCP server;
- no plugin package;
- no broad subagent system;
- no researcher layer;
- no unapproved dependency;
- no `requiredSkills` core field;
- no huge AGENTS.md;
- no GOAL.md as product brain;
- no runtime memory in markdown;
- public exports reviewed;
- handoff first-screen readable.

Commit:

`docs(run): record harness anti-rot audit`

---

### Slice 19 — Final Handoff

Goal:
End with a compact, reliable handoff.

Tasks:

Update:

- PROGRESS.md
- HANDOFF.md
- DECISIONS.md
- BLOCKERS.md
- VERIFICATION.md

Record:

- completed slices;
- commits;
- verification;
- blockers;
- skipped items;
- intentionally not built;
- next safest action.

Final output must include:

Completed:
- ...

Commits:
- ...

Verification:
- ...

Quality gates:
- ...

Skipped/Blocked:
- ...

Not built:
- dashboard
- apps
- broad benchmark lane
- broad eval suite
- runtime markdown memory
- `.krn` runtime memory
- MCP server
- plugin package
- broad subagent system
- researcher layer
- MemoryStore implementation
- SourceStore implementation
- API
- multi-project registry

Next safest action:
- one concrete next action

Commit:

`docs(run): add final harness bootstrap handoff`

Always do this before ending the run.

## 12. Priority If Time Or Context Is Limited

If time is limited, prioritize:

1. Slice 00 — preflight and ledger
2. Slice 01 — vocabulary
3. Slice 03 — kernel/harness contracts
4. Slice 04 — source/memory contracts
5. Slice 05 — policy/evidence/review/eval contracts
6. Slice 07 — public API review
7. Slice 09 — contract fixtures
8. Slice 10 — minimal harness compiler
9. Slice 12 — `krn plan`
10. Slice 13 — `krn doctor`
11. Slice 14 — `krn evidence capture`
12. Slice 18 — anti-rot audit
13. Slice 19 — final handoff

A smaller verified final-pattern spine is better than a larger unreviewable implementation.

Do not optimize for number of files or features.

Optimize for:

- correct architecture;
- source/memory/evidence boundaries;
- type safety;
- reviewability;
- restartability;
- no old-failure regression.

## 13. Stop Conditions

Stop and record blocker if the next action requires:

- building researcher layer;
- broad external research;
- old repo topology import;
- dashboard-first implementation;
- runtime memory in markdown;
- MemoryStore implementation decision;
- SourceStore implementation decision;
- MCP server;
- plugin packaging;
- broad subagent system;
- dependency adoption without decision;
- weakening TypeScript;
- hiding failures;
- making GOAL.md the entire product brain;
- copying context dumps into always-loaded files.

## 14. Final Standard

KRN is real only when a normal Codex user can use it on a real repo and see:

- less context waste;
- fewer repeated mistakes;
- better post-compaction continuity;
- lower review burden;
- lower diff risk;
- clearer source-backed decisions;
- memory that helps without poisoning future work;
- evals that catch regressions instead of proving schemas.

This run does not need to prove all of that.

This run must create the correct final-pattern harness spine that can eventually prove it.
```

---

# FAQ / rozstrzygnięcia architektoniczne

## 1. Czy ten prompt nadal robi „etapowanie”?

Nie w sensie, którego nie chcesz.

To nie jest plan typu: najpierw biedny context packet, potem biedne CLI, potem kiedyś prawdziwy harness. To jest cienka implementacja finalnego modelu od początku.

Różnica jest taka:

```txt
ZŁE:
context packet -> doctor -> review capture -> kiedyś harness

DOBRE:
final harness model
  -> core domain contracts
  -> pure compiler
  -> thin adapters
  -> dogfood/evidence
```

Slice jest tylko granicą review/commita. Nie jest tymczasową architekturą.

## 2. Dlaczego wyrzucam aktywną warstwę researchera?

Bo z przesłanych materiałów wynika, że research był wartościowy tylko wtedy, gdy zamieniał się w decyzję, kontrakt, odrzucenie, eval, implementation boundary albo review trigger. Gdy stawał się notatką, źródłolistą albo link-hoardingiem, odtwarzał stary problem: więcej kontekstu, więcej artefaktów, mniej produktu.

Dlatego researcher nie jest częścią tego runu.

W przyszłości może istnieć jako bounded lab lane:

```txt
hypothesis
  -> fixed budget
  -> read-only probes
  -> primary-source preference
  -> synthesis
  -> consumer artifact
  -> falsifier
  -> keep / kill / revisit
```

Ale nie teraz.

## 3. Czy to znaczy, że KRN nie ma source graph?

Nie.

Brak aktywnego researchera nie oznacza braku source graph.

Source graph jest częścią core harnessu. Różnica:

* researcher = aktywna warstwa pozyskiwania nowych źródeł;
* source graph = typed model tego, jak źródła wspierają decyzje, ryzyka, odrzucenia i evale.

W tym runie budujemy source graph contracts, nie research acquisition layer.

## 4. Czy `ContextPacket` jest całkowicie złe?

Nie jako artefakt.

Złe jest uczynienie z niego centralnej abstrakcji produktu.

Poprawny model:

```txt
ContextAssembly
  -> może wyrenderować ExecutionBrief / ContextPacket
```

Czyli „packet” może istnieć jako output adaptera, ale nie powinien definiować domeny.

## 5. Dlaczego `requiredSkills` nie może być core fieldem?

Bo wtedy KRN zaczyna udawać własny skill scheduler zamiast używać natywnych właściwości Codex skills jako progressive-disclosure capability layer.

Lepsze rozróżnienie:

```txt
Core:
TaskContract
ContextAssembly
PolicyGate
EvidenceContract

Adapter/compiler metadata:
SkillSelection
SkillReference
SkillTriggerHint
```

Skill może być zasugerowany w renderowanym handoffie, ale nie jako obowiązkowe pole rdzenia.

## 6. Czy skille są w ogóle ważne?

Tak, ale jako reusable engineering disciplines, nie jako KRN-specific featurelets.

Każdy skill powinien mieć:

* purpose;
* trigger;
* inputs;
* outputs;
* forbidden behavior;
* verification;
* lifecycle state;
* owner;
* removal condition.

To jest zgodne z zasadą z materiałów: skills muszą być małe, owned i mieć realne użycie; bez evali lub realnego zastosowania zostają draftem.

## 7. Czy prompt powinien tworzyć skille teraz?

Nie jako główny outcome.

Jeśli repo już ma skills, prompt ma ich nie rozwalać. Może sprawdzić ich status. Ale obecny run nie powinien tworzyć skill zoo.

Najpierw harness.

Później można mieć generic engineering skills typu:

* investigate-codepath;
* reconcile-sources;
* design-contract;
* diff-risk-review;
* issue-to-prd;
* prd-to-issues;
* repair-loop;
* type-boundary-review.

Ale to nie jest centrum tego promptu.

## 8. Czy `krn init` znika?

Nie.

`krn init` zostaje product promise i bootstrap entrypointem, ale nie jest architekturą.

Poprawnie:

```txt
harness domain
  -> init adapter
```

Nie:

```txt
init command
  -> cała architektura
```

`krn init --dry-run` powinien na tym etapie wykazać, że KRN rozumie repo i potrafi zaproponować agent-ready overlay bez pisania plików.

## 9. Czy `.krn/` jest zakazane na zawsze?

Nie.

Zakazane jest `.krn/` jako runtime memory truth.

Później `.krn/` może być:

* manifestem;
* cachem renderowanych packetów;
* run ledgerem;
* audit exportem;
* pointerami;
* lokalnym stanem adaptera.

Ale nie może być Memory Core.

Materiały mocno podkreślają, że markdown/files mogą być exportem, audytem, seedem lub backupem, ale runtime memory ma być store/service-backed z lineage, ownerem, confidence, TTL, invalidation i feedbackiem.

## 10. Czy MemoryStore powinien powstać teraz?

Nie pełna implementacja.

Ale Memory Core contracts powinny powstać od początku.

To jest ważne rozróżnienie:

```txt
TAK teraz:
MemoryRecord
MemoryCandidate
MemoryRetrieval
InvalidationPolicy
ApplicationFeedback
SourceLineage

NIE teraz:
SQLite/Postgres/vector store
sync API
multi-client memory service
memory mutation automation
```

Czyli pamięć jest finalnym elementem architektury od początku, ale storage adapter jest później.

## 11. Czy to nie jest overengineering?

Nie, jeśli pilnujemy granicy: finalne kontrakty teraz, ciężkie implementacje później.

Overengineeringiem byłoby:

* dashboard;
* multi-agent swarm;
* MCP server;
* plugin marketplace;
* MemoryStore;
* SourceStore;
* broad eval suite;
* cloud sync;
* API;
* researcher layer.

Nie jest overengineeringiem nazwanie domeny poprawnie od pierwszego dnia.

## 12. Co jest najważniejszym obiektem w KRN?

Harness.

Nie dashboard.
Nie context packet.
Nie skill.
Nie CLI.
Nie memory file.
Nie researcher.

Harness to „mózg operacyjny”:

```txt
intent -> contract -> plan -> context assembly -> execution -> evidence -> review -> feedback
```

## 13. Co właściwie oznacza „jeden mózg”?

Nie jeden gigantyczny prompt.

„Jeden mózg” oznacza jeden spójny control plane:

* wspólny TaskContract;
* wspólny ContextAssembly;
* wspólny SourceGraph;
* wspólny MemoryCore contract;
* wspólny Evidence/Review/Feedback loop;
* adaptery do Codexa, CLI, hooks, MCP, dashboardu.

Specjalizacje są narzędziowe, nie ontologiczne.

Czyli nie:

```txt
frontend agent
backend agent
wordpress agent
typescript agent
```

Tylko:

```txt
one harness
  -> optional capability references
  -> optional bounded specialists
```

## 14. Czy w tym promptcie jest miejsce na Matta Pococka / Sandcastle?

Tak, ale jako inspiracja mechanizmami, nie jako kopiowanie architektury.

Adoptujemy podejście:

* small composable skills;
* progressive disclosure;
* precyzyjne słownictwo;
* type-first discipline;
* sandbox/isolation jako przyszły execution concern.

Nie kopiujemy:

* Sandcastle product scope;
* jego zależności;
* jego domeny;
* jego struktur plików;
* jego agent orchestration jako start.

## 15. Czy prompt powinien wymusić konkretne biblioteki?

Nie.

Największe ryzyko na tym etapie to dependency cargo cult.

Prompt dopuszcza:

* Vitest, jeśli potrzebne do małych contract tests;
* tsx, jeśli potrzebne do dev/CLI;
* zod/effect później, jeśli validation boundary tego wymaga;
* tsup później, jeśli build/publish tego wymaga.

Ale każda zależność musi mieć decision record.

## 16. Dlaczego nie dodawać `ts-reset`?

Bo `packages/core` ma być library-safe.

Globalne zmiany typów są dobre czasem w application code, ale ryzykowne w bibliotekach, które mają być używane przez inne pakiety.

Prompt zostawia prostą zasadę: no global `ts-reset` in core.

## 17. Czy prompt powinien zakazać `any` absolutnie?

Tak na tym etapie.

Dopuszczanie `any` od początku tworzy kanał ucieczki z architektury. Jeśli parser/CLI dostaje nieznane dane, mają być `unknown` i walidowane/zwężane.

## 18. Czy potrzebujemy branded IDs?

Możliwe, ale prompt nie wymusza tego twardo.

Dobra implementacja może użyć:

```ts
type Brand<T, B extends string> = T & { readonly __brand: B };
type ProjectId = Brand<string, "ProjectId">;
```

Ale jeśli to ma stworzyć typowy boilerplate rot, lepiej zacząć od jawnych string aliasów i unionów. Ważniejsze jest rozdzielenie pojęć niż fancy typy.

## 19. Czy core powinien rzucać wyjątki?

Raczej nie w ścieżkach kompilacji harnessu.

Lepszy standard:

* core pure functions zwracają typed result albo typed diagnostics;
* CLI mapuje diagnostics na exit code i tekst;
* adaptery obsługują IO/throw.

Prompt tego nie wymusza jako osobny typ, ale implementacja powinna unikać ukrytych runtime assumptions.

## 20. Czy `krn plan` jest lepsze niż `krn context build`?

Tak.

`krn context build` brzmi, jakby problemem było tylko złożenie kontekstu.

A problem jest większy:

```txt
contract
  -> plan
  -> context
  -> policy
  -> evidence
  -> review
  -> feedback
```

Dlatego `krn plan --task` jest lepszym pierwszym adapterem.

## 21. Czy `krn doctor` jest nadal potrzebny?

Tak, ale jako harness readiness audit, nie generic project trivia.

Doctor ma wykrywać, czy repo jest gotowe do pracy z KRN/Codex bez wchodzenia w stare pułapki:

* huge AGENTS;
* brak typecheck;
* runtime markdown memory;
* dashboard-first;
* benchmark lane;
* researcher package;
* broad subagent system.

## 22. Czy `krn evidence capture` to nie jest znowu featurelet?

Jest adapterem do finalnego modelu EvidenceBundle / ReviewAssessment / FeedbackDelta.

Jeśli jest napisany jako „mała komenda”, to featurelet.

Jeśli jest napisany jako adapter nad finalnym evidence model, to jest część harnessu.

## 23. Czy prompt powinien robić evale?

Nie broad eval suite.

Tak:

* EvalCandidate contract;
* known-bad fixtures;
* contract tests;
* trace-derived eval candidates.

Materiały mówią jasno: evale są po to, by łapać realne regresje i znane failure modes, nie po to, by zielone fixture’y udawały jakość produktu.

## 24. Czy contract tests są eval theater?

Nie, jeśli chronią realny kontrakt.

Contract test typu „ContextAssembly nie ma requiredSkills” chroni decyzję architektoniczną.

Contract test typu „MemoryRecord wymaga application guidance” chroni przed pseudo-memory.

Eval theater zaczyna się wtedy, gdy testujesz kolejne artefakty bez związku z realną jakością pracy i review burden.

## 25. Czy AGENTS.md ma być duży?

Nie.

AGENTS.md ma być cienki.

Powinien mieć:

* repo policy;
* pointery;
* kiedy używać KRN;
* czego nie robić;
* minimalny recovery protocol.

Nie ma być mózgiem produktu.

## 26. Czy GOAL.md ma być duży?

Nie.

GOAL.md ma mieć:

* current objective;
* constraints;
* success evidence;
* stop conditions;
* next action.

Nie ma absorbować product thesis, źródeł, pamięci, ledgerów, przyszłej architektury i runtime instructions. Materiały wskazują, że poprzednio goals stały się za ciężkie i zaczęły pełnić rolę całego product brainu.

## 27. Czy PLAN.md jest potrzebny?

Tak, jeśli run jest długi.

PLAN.md jest restartowalną kolejką wykonania. GOAL.md zostaje krótki, a PLAN.md niesie slices, verification, blockers i recovery.

## 28. Co jeśli Codex traci kontekst w połowie?

Nie zgaduje.

Czyta tylko:

* AGENTS.md;
* GOAL.md;
* PLAN.md;
* PROGRESS.md;
* HANDOFF.md;
* DECISIONS.md;
* BLOCKERS.md;
* `git log --oneline -8`;
* pliki z następnego slice.

Nie czyta całego repo mentalnie od nowa.

## 29. Czy prompt ma wystarczające bezpieczniki przed starym repo?

Tak, bo mówi:

* old repo = archive/quarry;
* do not copy topology;
* no broad goals;
* no dashboard;
* no benchmark lane;
* no markdown memory;
* no context dumps;
* no researcher layer;
* no eval suite;
* no agent zoo.

To odpowiada wprost porażkom opisanym w failure report.

## 30. Czy multi-client dashboard znika z wizji?

Nie.

Jest później.

Dashboard ma sens dopiero nad typed objects:

* ProjectKernel;
* HarnessRun;
* EvidenceBundle;
* ReviewAssessment;
* MemoryCandidate;
* SourceDecision;
* EvalCandidate;
* PolicyGate.

Dashboard bez tych obiektów to vanity UI.

## 31. Czy API / cloud sync znika?

Nie.

Jest później jako adapter.

Core contracts powinny nie blokować multi-client przyszłości, ale prompt nie powinien teraz tworzyć API.

## 32. Czy MCP znika?

Nie.

MCP jest późniejszym typed tool boundary.

Prompt pozwala modelować Codex/MCP reference contracts, ale zakazuje budowy KRN MCP servera teraz.

## 33. Czy hooks są potrzebne teraz?

Nie jako pliki hooków.

Tak jako przyszły policy/trace surface w kontraktach.

Hooks mogą później robić:

* SessionStart context injection;
* PreToolUse policy checks;
* PostToolUse evidence capture;
* PreCompact compact pointer discipline;
* Stop handoff.

Ale to adapter. Semantyka jest w harnessie.

## 34. Czy subagenty są zakazane?

Broad subagent system jest zakazany.

Później subagenty mogą być:

* read-heavy;
* proposal-only;
* bounded;
* output-contract driven.

Ale nie jako „20 mózgów”. Raczej jako probes narzędziowe wywoływane przez jeden harness.

## 35. Czy prompt powinien tworzyć `SourceStore`?

Nie.

`SourceStore` implementacja później.

Teraz:

* SourceArtifact;
* SourceClaim;
* SourceLineage;
* SourceDecisionEdge;
* SourceUse.

## 36. Czy prompt powinien tworzyć `MemoryStore`?

Nie.

Kontrakty tak, store nie.

## 37. Czy prompt powinien stworzyć runtime validators?

Nie domyślnie.

Jeśli obecny kod ma validation pattern, można go użyć. Jeśli nie, lepiej najpierw kontrakty i testy. Zod/effect to decyzja później.

## 38. Co jest minimalnym sukcesem tego promptu?

Minimalny dobry sukces:

```txt
harness vocabulary
  -> core contracts
  -> source/memory contracts
  -> policy/evidence/review/eval contracts
  -> public API review
  -> contract tests/fixtures
  -> pure harness compiler
  -> thin krn plan adapter
  -> doctor/evidence capture if time
  -> handoff
```

## 39. Co jest maksymalnym sukcesem bez przekroczenia scope’u?

Maksymalnie:

```txt
final harness domain
  -> contract tests
  -> pure compiler
  -> krn plan
  -> krn doctor
  -> krn evidence capture
  -> krn init --dry-run
  -> dogfood
  -> anti-rot audit
  -> handoff
```

Bez:

* dashboard;
* MemoryStore;
* SourceStore;
* researcher;
* MCP;
* plugin;
* API;
* cloud.

## 40. Czy prompt odpowiada na „nie chcemy MVP”?

Tak.

Ma zakaz:

```txt
Temporary architecture is not allowed.
Thin implementation is allowed.
Crippled MVP abstractions are not allowed.
```

To jest sedno.

## 41. Co nadal może wymagać decyzji operatora?

Nie widzę blokującej decyzji do startu, ale są decyzje, które prompt ma rozstrzygać lokalnie przez `DECISIONS.md`:

* czy test runner już istnieje;
* czy Vitest dodać teraz;
* dokładne nazwy CLI;
* dokładny layout zgodny z repo;
* czy `krn evidence capture` czy `krn review` jako nazwa;
* czy core ma użyć branded IDs czy prostych aliasów;
* czy runtime validators odkładamy całkiem;
* jak dużo adapterów zrobić w pierwszym runie.

To nie blokuje startu, bo prompt daje domyślne decyzje i stop conditions.

## 42. Czy dodać „second opinion” prompt?

Na tym etapie nie jako obowiązkowy krok w runie.

Jeżeli chcesz jeszcze reviewer check przed wdrożeniem, można odpalić osobno. Ale finalny prompt powyżej już uwzględnia najważniejszą korektę: harness-first, no researcher, no `requiredSkills`, no context packet center, CLI as adapter.

## 43. Co najłatwiej Codex może zepsuć mimo promptu?

Największe ryzyka:

1. Doda za dużo plików docs.
2. Zacznie pisać CLI feature roadmap zamiast core harness.
3. Doda `requiredSkills` gdzieś „dla wygody”.
4. Zrobi `.krn/` jako runtime state.
5. Doda Vitest/zod/effect/tsup bez decision.
6. Zrobi doctor jako generic linter, nie harness readiness.
7. Napisze GOAL.md jako wielki mózg.
8. Zacznie implementować research/source crawler.
9. Stworzy eval suite zamiast eval candidates.
10. Pominie handoff.

Prompt ma dla tego bezpieczniki, ale po runie i tak trzeba sprawdzić diff pod te ryzyka.

## 44. Jaki jest najważniejszy review checklist po powrocie?

Po powrocie sprawdź:

```txt
git log --oneline -12
git status --short --branch
pnpm typecheck
pnpm test
```

Potem grep/check:

```txt
requiredSkills
ContextPacket
researcher
crawler
dashboard
apps/
benchmark
.krn
MCP server
plugin
any
ts-reset
```

I ręcznie:

* czy core domain naprawdę ma harness flow;
* czy CLI jest adapterem;
* czy memory jest kontraktem, nie markdowniem;
* czy source claims mają mechanism / doesNotProve;
* czy evale są candidate-only;
* czy HANDOFF jest czytelny na pierwszym ekranie.

## 45. Czy ten prompt jest „końcowy”?

Jako prompt do startu harness-first: tak.

Nie jest końcową specyfikacją całego produktu, bo KRN docelowo będzie mieć MemoryStore, SourceStore, dashboard, multi-client, possible MCP, future research lane i maybe sandbox execution. Ale to jest końcowy prompt dla obecnego resetu: zakodować finalny model od początku bez researcher layer i bez powtarzania starych pułapek.
