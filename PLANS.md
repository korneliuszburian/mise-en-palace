# KRN Continuous Brain Growth ExecPlan

This `PLANS.md` is the generic long-run execution plan for KRN product work. It is intentionally the detailed plan. Root `GOAL.md` should stay compact and point here. Root `PLAN.md` remains the product single source of truth and should summarize only the current state, active stream, accepted gates, and the next recommended objective.

This plan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, `Evidence Ledger`, `Condensation Queue`, `Active Task Queue`, `Generated Task Backlog`, and `Outcomes & Retrospective` must be updated continuously as work proceeds. When evidence produces new work, append that work to this file before executing it. Do not hide new product tasks in chat history, reports, or memory.

The plan follows the OpenAI Codex ExecPlan and Goal patterns:

- It must be self-contained enough that a fresh Codex continuation can resume from the working tree plus this file.
- It must name observable outcomes, commands, evidence, and proof/non-proof boundaries.
- It must be revised when discoveries, decisions, or blockers appear.
- A Goal is complete only when evidence proves the objective, not when the model feels finished.
- Budget or elapsed time limits create a handoff, not success.

Reference process sources:

- `https://developers.openai.com/cookbook/articles/codex_exec_plans`
- `https://developers.openai.com/cookbook/examples/codex/using_goals_in_codex`

## 1. Current Repository Baseline To Verify At Every Run

Do not assume this baseline. Verify it at the start of every `/goal`, after resume, and after auto-compaction.

Expected current baseline from remote evidence on 2026-06-27:

```txt
repository: korneliuszburian/mise-en-palace
branch: main
root PLAN.md status: compact product SSOT
V02-03..V02-08: complete
V03-00..V03-06: complete
V04-00..V04-07: complete
V05 target-aware evidence capture repair: complete
V06 activation / owner-file / context ROI utility: complete
V07 memory / anti-memory / source usefulness loop: complete
V08 skill-first workflow expansion: complete
V09 deterministic hooks candidate decision: complete
V10 MCP / subagent candidate gate: complete
V11 product readiness re-gate: complete
V12 widened alpha trial launch packet: complete
V13 research-to-brain decision lane gate: complete
V14 TypeScript boundary drift gate: complete
V15 Promptfoo / Golden Behavior Role Gate: complete
V16 Activation Relevance Evidence Gate: complete
V17 Target Owner-File Read-Model Contract Gate: complete
V18 Target Owner-File Contract Re-Gate / Trial Application: complete
V19 Product Readiness Re-Gate After Owner-File Contract: complete
V20 Real Target Observation-Only Owner-File Trial: complete
V21 Target Evidence Observation-Only Defaults And Readback Clarity: complete
V22 Persisted CLI DB URL Default Consistency: complete
V23 Real Target Observation Re-Run After Evidence/DB Ergonomics Repairs: complete
V24 Target Owner-File Recall Deduplication And Budget Priority: complete
V25 Real Target Observation Re-Run After Owner-File Priority Repair: complete
V26 CLI Run Reference And Empty Target Changed Files Ergonomics: complete
V27 Controlled Internal Alpha Re-Gate After Target Loop Repairs: complete
V28 Research-To-Brain TypeScript/Codex Decision Trial: complete
V29 TypeScript Boundary Research Application Gate: complete
V30 Codex Surface Context-Budget Application Gate: complete
V31 Product Readiness Re-Gate After Research And Surface Hygiene: complete
V32 Controlled Target Repair Trial: complete
V33 Reused Project Owner-File Refresh Repair: complete
V34 Target Repair Re-Gate After Owner-File Refresh: complete
V35 Target Patch Handoff Packet: complete
V36 Target Patch Handoff Re-Gate: complete
V37 Target Patch Lifecycle Rule Condensation: complete
V38 Clean Target Selection Gate: complete
V39 WILQ Clean Target Observation-Only Baseline: complete
V40 Target Selection Freshness Rule Condensation: complete
V41 Target Trial Availability Re-Gate: complete
V42 WILQ Fresh Observation-Only Baseline Retry: complete
V43 Target Stability Window Gate: complete
controlled-internal-alpha for technical operators: yes / stronger
product-ready: no
widened internal alpha: no
V02-01 real second-operator proof: blocked/deferred
V44 Target Evidence Lifecycle And Freshness Fields: complete
V45 Target Availability Re-Gate With Typed Lifecycle Evidence: complete
V46 Target Owner Coordination Packet: complete
V47 Internal Hardening Re-Gate After Target Coordination: complete
active stream: V48 Continuous Pattern Source-To-Decision Gate
current task: V48-00 Continuous Pattern Source-To-Decision Gate
```

Evidence already recorded in repo:

- `PLAN.md` current product state and active stream.
- `GOAL.md` current active stream and continuation rules.
- `docs/plans/v04-internal-brain-utility/PLANS.md` V04 long-run execution record.
- `docs/reviews/controlled-dogfood/2026-06-27-v04-internal-brain-usefulness/REPORT.md` final V04 re-gate.
- `.agents/skills/target-repo-testing/SKILL.md` first durable target-repo workflow skill.
- `.github/workflows/ci.yml` remote CI verification path.

Known current gap:

```txt
V47 selected continuous pattern source-to-decision as the next internal
hardening task. TypeScript/Matt Pocock is only one example; the current gap is
making best-practice condensation permanent across infra, harness, CI, skills,
target workflow, TypeScript, Codex surfaces, evals, and research/papers.
```

## 2. Product Thesis And Strategic Direction

KRN is a Codex Operating Layer / AI Engineering Control Plane.

Codex executes. KRN supplies bounded context, store-backed memory, source grounding, policy, skills, eval expectations, traces, review gates, and feedback.

The current product objective is not to make another document. The objective is to build a superior operational brain through a continuous loop:

```txt
controlled scenario
  -> evidence
  -> finding
  -> condensation decision
  -> rule / skill / deterministic guard / eval / memory candidate / source decision / bounded repair
  -> next scenario
```

KRN should become increasingly useful for our own work first. V02-01 remains external second-operator usability proof. It is important, but it is not the current bottleneck for improving the brain.

Self/headless scenarios are allowed and encouraged as engineering proof and knowledge distillation. They must not be renamed into product proof or second-operator proof.

## 3. Non-Negotiable Architecture

Follow the architecture already adopted by the project.

```txt
Canonical brain store: PostgreSQL + pgvector
Schema/migrations: Drizzle
IO validation: Zod / unknown-first boundaries
Search/retrieval: Postgres full text + pgvector + relational edges
Async first layer: Postgres outbox/job tables
Runtime memory: typed store-backed memory, never markdown
Codex surfaces: AGENTS.md, skills, hooks, MCP, Goals, ExecPlans as adapters
CLI: adapter, not architecture
Dashboard/API/MCP: later, over typed state and read models, not product proof
```

Canonical spine:

```txt
OperatorIntent
  -> TaskContract
  -> HarnessPlan
  -> ContextAssembly
  -> CapabilityPlan / CodexAdapterPlan
  -> ExecutionRun
  -> EvidenceBundle
  -> ReviewAssessment
  -> FeedbackDelta
  -> MemoryCandidate / SourceDecision / EvalCandidate
  -> reviewed promotion, rejection, or deferral
```

## 4. Hard Non-Goals

Do not build or claim any of the following unless a specific task below explicitly authorizes it and evidence justifies the surface:

- fake V02-01 second-operator proof;
- product-ready status;
- widened internal alpha;
- dashboard;
- API server;
- MCP server;
- worker daemon or background loop;
- source crawler;
- broad eval platform;
- generic multi-agent system;
- stack-specific agent zoo;
- runtime markdown memory;
- `.krn` runtime truth;
- broad activation scoring rewrite without repeated evidence;
- broad reflection extraction rewrite without repeated evidence;
- living target repo writes without explicit scope, allowed files, rollback, and verification;
- hidden semantic hooks;
- `git add .` or broad commits without reviewing the diff.

## 5. Codex Surface Selection Policy

Use the smallest native Codex surface that solves the repeated problem.

### 5.1 AGENTS.md

Use `AGENTS.md` only for durable rules Codex must always see in this repo. Keep it small. Add to it only when a repeated failure is truly global and cannot be better expressed as a skill, test, runbook, or plan rule.

AGENTS candidates:

- repeated wrong command;
- repeated wrong file-routing assumption;
- repeated repo convention violation;
- repeated safety boundary mistake.

Reject AGENTS updates when the content is workflow detail, scenario state, product backlog, research notes, or long-run ledger material.

### 5.2 Skills

Skills are the first preferred durable workflow surface. Use them for reusable engineering workflows with triggers, inputs, outputs, forbidden behavior, verification, and removal condition.

Accepted / candidate skills:

- `target-repo-testing`: accepted.
- `evidence-review-loop`: accepted/reused.
- `source-to-decision`: candidate if repeated research/source ingestion appears.
- `controlled-scenario`: candidate if scenario execution remains repetitive.
- `typescript-boundary-repair`: candidate if TS boundary failures repeat.
- `target-aware-evidence-capture`: candidate if V05 proves a reusable workflow beyond code changes.

Do not create a skill zoo. At most two new or materially changed skills per long goal unless the plan explicitly expands the limit with evidence.

### 5.3 Hooks

Hooks are deterministic lifecycle guardrails, not hidden semantic reasoning. Keep hook work as candidate-only until repeated scenarios prove a small mechanical boundary that skills/tests cannot reliably protect.

Hook candidates:

- block target writes in observation-only mode;
- warn before broad `git add .`;
- warn before touching forbidden target dirs;
- pre-compact handoff sanity check;
- secret-shaped evidence redaction guard.

Implement no hook until a scenario proves repeated failure and the hook can be tiny, inspectable, and trusted.

### 5.4 MCP

MCP is for live external tools/context or typed read models unavailable through CLI/files/DB. Do not build KRN MCP because it sounds impressive.

MCP candidates:

- live GitHub issue/PR metadata that KRN must read or update;
- typed KRN run/readback resources exposed to Codex without shell parsing;
- external docs or observability sources that cannot be represented as source claims or files.

MCP is rejected for the current V05 target-aware evidence capture unless the implementation proves CLI/files/DB are insufficient.

### 5.5 Subagents

Subagents are bounded organs, not another brain. They are appropriate for read-heavy exploration, tests, triage, and summarization after roles and output contracts stabilize.

Candidate subagents:

- repo explorer;
- test failure analyst;
- source-to-decision researcher;
- evidence reviewer;
- TypeScript boundary critic.

No subagent gets write authority by default.

## 6. Knowledge Condensation Gate

Every scenario, report, source, failure, and repair must end with a condensation decision.

Use this decision tree:

```txt
finding seen once and low-risk
  -> report only

finding repeated twice or high-risk
  -> candidate for AGENTS / skill / deterministic guard / eval / memory / source decision / hook / bounded repair

finding repeated three times or blocks product flow
  -> implement durable surface or write explicit rejection with falsifier

finding decorative or unsupported
  -> reject and remove from active context
```

Each condensation decision must include:

```txt
finding:
frequency: first / repeated / high-risk / blocking
candidate_surface: AGENTS / skill / guard / eval / memory / source / hook / MCP / subagent / repair / none
decision: accept / reject / defer
rationale:
evidence:
does_not_prove:
falsifier:
next_task_id:
```

## 7. Source-To-Decision Rule

Do not keep sources as decoration. Every source used for product direction must map through:

```txt
source
  -> mechanism
  -> KRN implication
  -> decision / rejection / hypothesis
  -> consumer
  -> falsifier
  -> does_not_prove
```

Official OpenAI/Codex docs are primary for Codex surface behavior. Practitioner sources are hypothesis unless verified by local code, official docs, or controlled scenario evidence. Papers inform principles, not architecture cloning. Competitor docs are comparators, not product authority.

## 8. Controlled Scenario Contract

Every controlled scenario must contain:

```txt
scenario_id:
title:
mode: observation-only / repair-trial / source-repair / db-backed-replay / target-fixture / research-condensation / guard-regression
product_question:
brain_function: context_selection / memory_application / source_grounding / policy_control / evidence_capture / review_intelligence / feedback_distillation / pattern_selection / handoff_compression
allowed_writes:
forbidden_writes:
inputs:
commands:
expected_krn_behavior:
verification:
what_this_proves:
what_this_does_not_prove:
risks:
rollback:
condensation_decision:
next_task_candidates:
```

Scenario modes:

- `observation-only`: inspect target/source state and write only KRN evidence/report files.
- `repair-trial`: repair KRN source code or KRN docs in a bounded scope.
- `source-repair`: source-to-decision or architecture/doc repair backed by sources.
- `db-backed-replay`: DB readiness/smoke/replay/persistence proof.
- `target-fixture`: fixture/sandbox target proof; not product proof.
- `research-condensation`: source research that must produce decisions/rejections.
- `guard-regression`: deterministic test/golden/eval guard from real evidence.

## 9. Task Contract Schema

Every new task appended to `Active Task Queue` or `Generated Task Backlog` must use this schema.

```txt
ID:
Name:
Status: proposed / active / complete / blocked / rejected / deferred
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
```

If a task cannot satisfy the schema, it is not ready for execution.

## 10. Continuous Task Generation Protocol

After every completed task, Codex must generate the next task candidates before stopping.

Algorithm:

```txt
1. Read current Progress, Evidence Ledger, Condensation Queue, and Active Task Queue.
2. Identify findings from the completed task.
3. For every finding, apply Knowledge Condensation Gate.
4. If a durable surface was accepted, add follow-up guard/replay task.
5. If a repair changed behavior, add a scenario proving future behavior.
6. If a scenario exposed a gap, add the smallest bounded repair.
7. If no gap remains in the current stream, select the next stream from Product Stream Priorities.
8. Append the selected task(s) to this PLANS.md with full Task Contract Schema.
9. Compact GOAL.md only if the active objective changes.
10. Continue unless blocked, budget-limited, unsafe, or explicitly stopped by the operator.
```

Do not ask the operator for next steps when the next step is inferable from this plan and evidence. Ask only when a step requires external inputs, target write approval, credentials, real second-operator data, or a safety decision.

## 11. Product Stream Priorities

When choosing the next task, prefer the highest stream with unmet evidence.

### Stream V05 — Target-Aware Evidence Capture Repair

Why now:

- V04 re-gate named target-aware evidence capture as the best next goal.
- Current KRN evidence capture is stronger for KRN repo changes than for dirty target repo state.
- Target trials need clean proof/non-proof separation before wider alpha or second-operator runs.

Expected end state:

```txt
KRN can capture or report target-repo evidence explicitly:
  target path
  target mode
  target dirty state before/after
  owned vs external changes
  allowed/forbidden writes
  target commands
  proof/non-proof boundaries
  links to KRN execution/evidence bundle when persisted
```

### Stream V06 — Activation / Owner-File / Context ROI Utility

Why next:

- Target root recall exists, but exact owner-file recall below named roots remains limited.
- Superior brain requires selecting useful files, not only governance context.
- Context ROI must reduce manual source search and review burden.

Expected end state:

```txt
KRN target planning surfaces more exact owner-file candidates or clearly abstains with typed reasons.
Context inclusions/exclusions are measurable and replayable.
```

### Stream V07 — Memory / Anti-Memory / Source Usefulness Loop

Why next:

- Memory feedback exists, but target usefulness and repeated helpful application need stronger proof.
- Anti-memory must prevent stale/rejected context from returning.
- Source claims must remain mechanism-bearing, not decorative.

Expected end state:

```txt
A target or KRN run produces memory/source candidates, review decision, later activation, and helped/stale feedback with deterministic guard coverage.
```

### Stream V08 — Skill-First Workflow Expansion

Why later:

- Skills are the right next surface for repeated workflows, but only after evidence proves repetition.
- Do not create a skill zoo.

Expected end state:

```txt
Small set of high-signal repo skills covers target testing, evidence review, source-to-decision, and selected TypeScript boundary repair.
Each skill has a guard or scenario proving it reduces ambiguity.
```

### Stream V09 — Deterministic Hooks Candidate Decision

Why later:

- Hooks can help mechanical safety boundaries, but project-local hooks need trust review and cannot become semantic brain.
- Implement only after repeated target-write or unsafe command failures.

Expected end state:

```txt
Either a tiny trusted hook exists for a repeated deterministic violation, or hook implementation is rejected/deferred with evidence.
```

### Stream V10 — MCP / Subagent Candidate Gate

Why later:

- MCP and subagents should answer proven bottlenecks, not product ambition.
- Candidate status does not authorize implementation.

Expected end state:

```txt
A source-backed decision identifies whether CLI/files/DB are insufficient and whether MCP/subagent work is justified.
```

### Stream V11 — Product Readiness Re-Gate

Why later:

- Re-gate only after V05-V08 evidence improves real target workflows.
- V02-01 remains separate external usability proof.

Expected end state:

```txt
KRN remains controlled-internal-alpha, upgrades to widened internal alpha, or explicitly stays limited with blockers.
No product-ready claim without multiple target repos and second-operator proof.
```

### Stream V12 — Widened Alpha Trial Launch Packet

Why later:

- V11 found that V05-V10 strengthen controlled-internal-alpha but do not prove
  widened internal alpha or product readiness.
- The next missing product evidence is a real operator or widened-alpha trial,
  not another local substitute.

Expected end state:

```txt
An operator-ready launch packet exists with setup, DB mode, target repo mode,
support boundary, transcript schema, evidence checklist, failure taxonomy, and
verdict labels.
If required operator inputs are absent, the packet states exact missing fields
and forbids calling self/headless work second-operator proof.
```

### Stream V13 — Research-To-Brain Decision Lane Gate

Why later:

- V11/V12 leave product readiness blocked on real operator evidence, but the
  internal engineering loop can still improve how KRN imports external
  knowledge.
- The user wants papers, official docs, practitioner standards, and senior
  TypeScript guidance to shape KRN without becoming source hoarding or another
  architecture product.

Expected end state:

```txt
KRN has a current decision on whether `source-to-decision` and existing docs are
enough, or one bounded repair is needed so research inputs become decisions,
falsifiers, candidates, or code standards instead of passive notes.
```

### Stream V14 — TypeScript Boundary Drift Gate

Why later:

- V13 confirms practitioner and course guidance should land in standards,
  tests, skills, or source decisions, not passive links.
- The next practical consumer is TypeScript boundary enforcement: unknown-first
  inputs, explicit public types, discriminated unions, no unchecked `any`, and
  no unsafe parsing/casts.

Expected end state:

```txt
Current TypeScript boundary drift is either rejected as already covered, or a
small source/test repair is accepted with exact files and verification.
```

### Stream V15 — Promptfoo / Golden Behavior Role Gate

Why later:

- CI runs Promptfoo smoke, but recent product proof mostly comes from golden
  behavior tests, DB smokes, reports, and readback.
- KRN must avoid turning Promptfoo into a broad eval platform or false product
  authority.

Expected end state:

```txt
Promptfoo is explicitly classified as smoke adapter, bounded behavior gate, or
deferred candidate, with no broad eval platform.
```

### Stream V16 — Activation Relevance Evidence Gate

Why later:

- V11 listed activation quality as partial.
- V06 improved owner-file recall state but did not prove discovery/ranking
  quality.
- V15 clarified eval roles, so activation evidence should be evaluated through
  existing reports/tests rather than a broad benchmark lane.

Expected end state:

```txt
Activation relevance is either accepted as measurement-only for now, or one
bounded repair is accepted with exact evidence and non-goals.
```

### Stream V17 — Target Owner-File Read-Model Contract Gate

Why later:

- V16 rejects activation scoring repair and identifies target read-model
  completeness as the next activation blocker.
- Exact owner-file recall works when `ownerFiles` are present, but product
  readiness needs a clear contract for how those owner files enter the target
  read model.

Expected end state:

```txt
KRN either documents and verifies the existing owner-file read-model contract,
or accepts one small repair so target owner files are not hidden operator lore.
```

### Stream V18 — Target Owner-File Contract Re-Gate / Trial Application

Why now:

- V17 made exact target owner files an explicit `krn init --owner-file`
  contract instead of fixture-only metadata or operator lore.
- The next product question is whether this contract makes bounded target
  trials clearer, or whether the remaining bottleneck is operator friction,
  owner-file quality, or activation selection after owner files are available.

Expected end state:

```txt
KRN uses or re-gates the explicit owner-file contract in one bounded target
trial path, without creating a source crawler or pretending headless proof is
V02-01.
```

### Stream V19 — Product Readiness Re-Gate After Owner-File Contract

Why now:

- V17 made owner files explicit operator inputs.
- V18 proved the contract works in a DB-backed target fixture, fixed dry-run
  next-command friction, and showed exact owner-file selection when the task
  names the owner file.
- The remaining question is readiness, not another architecture feature.

Expected end state:

```txt
KRN re-gates readiness after V17/V18 and decides whether further local
substitutes are useful or whether the next proof must be real
operator / real target evidence.
```

### Stream V20 — Real Target Observation-Only Owner-File Trial

Why now:

- V19 keeps KRN at controlled-internal-alpha, stronger, and rejects widened-alpha
  or product-ready claims.
- The next missing proof is real target behavior after the owner-file contract,
  not another checked-in fixture.
- Real second-operator proof is still blocked/deferred until operator inputs
  exist, but a real target observation-only trial can test target selection,
  owner-file quality, activation, and evidence boundaries without target writes.

Expected end state:

```txt
KRN runs or blocks on one safe real target checkout in observation-only mode,
with explicit owner files if known, and records whether the next blocker is
target selection, owner-file quality, activation selection, operator friction,
or a bounded KRN repair.
```

## 12. Active Task Queue

### V05-00 — Baseline Audit And Goal/Plan Reconciliation

Status: complete on 2026-06-27

Goal: Replace the completed V04 goal with a compact continuous goal that points to this `PLANS.md`, preserves root `PLAN.md` as product SSOT, and sets V05 target-aware evidence capture as the active stream.

Product rationale: Codex should not resume a completed V04 queue or stop after one task. The operator wants continuous growth through evidence-backed tasks.

Architectural rationale: `GOAL.md` should be a compact contract; this `PLANS.md` should hold the detailed long-run plan.

Evidence source: current `PLAN.md`, current `GOAL.md`, V04 re-gate report.

Official/external sources: Codex ExecPlans and Goals guides.

Inputs required: current repo state, latest main, current `PLAN.md`/`GOAL.md`.

Files likely touched:

- `PLAN.md`
- `GOAL.md`
- `PLANS.md` or `docs/plans/v05-continuous-brain-growth/PLANS.md`

Allowed writes: KRN repo plan/goal docs only.

Forbidden writes: target repos, product code before active stream is set.

Output requirements:

- `PLAN.md` compactly states V05 active and V04 complete.
- `GOAL.md` compactly points to this plan and describes continuous task appending.
- This `PLANS.md` is checked in as the active long-run plan.

Definition of Done:

- No parallel roadmap ambiguity.
- V02-01 remains blocked/deferred.
- Codex can resume from `GOAL.md` + `PLAN.md` + this file.

Verification commands:

```sh
git diff --check
git status --short --branch
rg -n "V05|target-aware|continuous|PLANS.md|V02-01" PLAN.md GOAL.md PLANS.md docs/plans 2>/dev/null || true
```

Acceptance criteria:

- Goal does not mark complete after V05-00.
- If V05-00 completes, Codex proceeds to V05-01.

Risk: plan sprawl. Mitigation: root plan compact, details here.

Rollback: revert focused plan/goal commit.

Condensation expectation: none; this is activation of the long-run control plane.

Next-task synthesis rule: proceed to V05-01.

### V05-01 — Target Evidence Capture Current-State Investigation

Status: complete on 2026-06-27

Goal: Inspect current evidence capture, run readback, target repo testing skill, and V04 target reports to define the smallest target-aware evidence repair.

Product rationale: KRN needs to distinguish KRN repo evidence from target repo evidence before target trials become trustworthy.

Architectural rationale: EvidenceBundle/RunReadback should represent proof/non-proof boundaries rather than relying on report prose.

Evidence source: V04-SC-003, V04 re-gate, `target-repo-testing` skill.

Official/external sources: Codex Goals evidence-based completion; agent improvement loop trace -> feedback -> harness change.

Inputs required:

- current `packages/cli` evidence capture/readback code;
- current `packages/core`/`packages/harness` evidence types;
- existing tests for run readback/evidence;
- target-repo-testing docs/skill.

Files likely touched: investigation report only unless code path is obvious.

Allowed writes:

- `docs/reviews/controlled-dogfood/<date>-target-aware-evidence-current-state/REPORT.md`
- optional `PLAN.md`/`GOAL.md` progress updates.

Forbidden writes: behavior changes before the gap is stated.

Output requirements:

- current-state report naming exact code paths;
- desired target evidence fields;
- smallest implementation slice;
- does-not-prove boundary.

Definition of Done:

- The next source repair is clear enough for Codex to implement without broad search.

Verification commands:

```sh
pnpm typecheck
git diff --check
```

Acceptance criteria:

- Report states whether existing model can represent target evidence already.
- Report names the minimal file set for V05-02.

Risk: report-only slop. Mitigation: V05-02 must follow unless investigation proves no code gap.

Rollback: delete report if wrong before commit; otherwise add correction report.

Condensation expectation: likely bounded repair.

Next-task synthesis rule: if code gap confirmed, execute V05-02; if rejected, append the next highest ROI stream from Section 11.

### V05-02 — Implement Minimal Target-Aware Evidence Capture

Status: complete on 2026-06-27

Goal: Add the smallest typed support for target-repo evidence capture/readback.

Product rationale: Operators need to see target dirty state, target commands, and proof/non-proof boundaries without rereading long reports.

Architectural rationale: Evidence capture is part of KRN's review intelligence; target evidence should be typed or structured enough to survive readback.

Evidence source: V05-01 report.

Official/external sources: Codex Goals evidence-based completion; KRN state-of-the-art review burden/diff risk metrics.

Inputs required:

- V05-01 code path map;
- existing evidence bundle types/schemas;
- CLI command parsing conventions;
- readback rendering conventions.

Files likely touched:

- `packages/core/src/evidenceBundle.ts` or equivalent if domain needs a field;
- `packages/schema` evidence input schemas if present;
- `packages/cli/src/runEvidenceCaptureCommand.ts` or equivalent;
- `packages/cli/src/runRunShowCommand.ts` or equivalent;
- tests for CLI/readback.

Allowed writes: KRN source and tests only.

Forbidden writes:

- target repo writes;
- broad EvidenceBundle redesign;
- DB migration unless evidence proves it is required;
- automatic memory/source mutation.

Output requirements:

- target evidence fields in capture and readback or an explicit abstain message;
- test proving target dirty state can be represented;
- proof/non-proof labels.

Definition of Done:

- A target evidence fixture/report can show target dirty state and commands without claiming KRN repo diff.

Verification commands:

```sh
pnpm typecheck
pnpm test
pnpm --filter @krn/cli test -- evidence runRunShowCommand runCli || true
git diff --check
```

Acceptance criteria:

- Existing evidence behavior remains compatible.
- New target evidence is visible in human output and JSON/readback where applicable.
- Output states what target evidence does not prove.

Risk: accidental schema churn. Mitigation: prefer metadata/readback shape unless typed domain change is clearly needed.

Rollback: focused revert of source/test changes.

Condensation expectation: deterministic guard + target-repo-testing skill update if interface changes.

Next-task synthesis rule: execute V05-03 guard/replay.

### V05-03 — Target Evidence Guard And Replay Scenario

Status: complete on 2026-06-27

Goal: Add a deterministic guard and one controlled replay scenario proving target-aware evidence capture catches target dirty state/proof boundaries.

Product rationale: A repair without a replay can regress silently.

Architectural rationale: KRN evals/guards should come from real scenario evidence, not theoretical completeness.

Evidence source: V05-02 implementation.

Official/external sources: Promptfoo migration guide for portable CI evals; agent improvement loop for trace/eval/harness update.

Inputs required:

- V05-02 behavior;
- target fixture or safe local fixture;
- target-repo-testing skill.

Files likely touched:

- CLI tests;
- fixture docs/report;
- `docs/reviews/controlled-dogfood/<date>-target-aware-evidence-replay/REPORT.md`;
- optional `eval:brain-battle:smoke` if the guard belongs there.

Allowed writes: KRN repo tests/reports.

Forbidden writes: living target repo modifications unless explicitly scoped.

Output requirements:

- guard test fails if target evidence disappears;
- scenario report with proof/non-proof and condensation decision.

Definition of Done:

- A clean CI run proves target evidence guard works.

Verification commands:

```sh
pnpm typecheck
pnpm test
pnpm eval:brain-battle:smoke
git diff --check
```

Acceptance criteria:

- Test covers dirty target before/after or equivalent fixture state.
- Scenario report says this does not prove second-operator usability.

Risk: fixture theater. Mitigation: report must map to V04 target evidence finding.

Rollback: revert guard and report.

Condensation expectation: update skill/runbook only if operator invocation changed.

Next-task synthesis rule: proceed to V05-04 re-gate or append follow-up repair if guard exposes a new gap.

### V05-04 — Target-Aware Evidence Re-Gate

Status: complete on 2026-06-27

Goal: Decide whether V05 materially improved target trials and what stream should run next.

Product rationale: KRN should not keep adding features without judging whether review burden and target evidence clarity improved.

Architectural rationale: Each product stream ends with evidence-based gate and next stream selection.

Evidence source: V05-01 through V05-03.

Official/external sources: Codex Goals evidence-based completion.

Inputs required:

- reports/tests/commits from V05;
- CI result.

Files likely touched:

- `docs/reviews/controlled-dogfood/<date>-v05-target-aware-evidence-re-gate/REPORT.md`
- `PLAN.md`
- `GOAL.md`
- this `PLANS.md`

Allowed writes: KRN docs/plan updates.

Forbidden writes: new feature work inside gate unless it is a small fix required by failed verification.

Output requirements:

- verdict: improved / mixed / failed;
- product-readiness status unchanged unless evidence truly supports upgrade;
- next stream chosen from Section 11;
- generated task candidates appended.

Definition of Done:

- V05 has a clear outcome and next active task.

Verification commands:

```sh
pnpm typecheck
pnpm test
pnpm eval:brain-battle:smoke
pnpm eval:promptfoo:smoke
git diff --check
git status --short --branch
```

Acceptance criteria:

- Goal is not marked complete unless the operator explicitly stops or product-ready gate is met.
- If V05 completes, Codex appends V06 tasks and continues.

Risk: premature stopping. Mitigation: Continuous Task Generation Protocol.

Rollback: correction report if verdict overclaims.

Condensation expectation: update root PLAN compactly and append V06 active tasks.

Next-task synthesis rule: if target evidence is improved, move to V06 activation/context ROI; otherwise append V05-R01 repair.

### V06-00 — Activation / Owner-File Recall Below Target Roots

Status: complete on 2026-06-27

Goal: Improve or re-gate target owner-file recall below named source roots after target-aware evidence capture is stable.

Product rationale: Superior KRN must reduce manual target file discovery, not merely show high-level source roots.

Architectural rationale: Activation is admission control; owner-file recall should be typed/read-model based before any scoring rewrite.

Evidence source: V03/V04 owner-file recall limits and V05 target evidence.

Official/external sources: KRN context supply chain doctrine; Codex Goals evidence-based completion.

Inputs required: V05 re-gate, current activation/read-model code, target fixture.

Files likely touched: activation/read-model code, tests, reports.

Allowed writes: KRN source/tests/reports only.

Forbidden writes: broad activation scoring rewrite without repeated miss evidence.

Output requirements: exact owner-file candidate or typed abstain reason.

Definition of Done: target planning exposes file-level candidates or explicit missing-read-model reason.

Verification commands: `pnpm typecheck`, `pnpm test`, relevant DB/activation smoke, `git diff --check`.

Acceptance criteria: improvement measured by a controlled scenario.

Risk: overfitting to fixture. Mitigation: proof/non-proof section.

Rollback: focused revert.

Condensation expectation: guard if behavior is accepted.

Next-task synthesis rule: if successful, append memory/source usefulness task.

Completion evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v06-owner-file-recall/REPORT.md`;
- typed `owner_files_available | missing_owner_file_read_model` assessment;
- CLI plan output and execution/retrieval metadata now expose owner-file recall status and proof boundary.

### V07-00 — Target Memory/Source Usefulness Loop

Status: complete on 2026-06-27

Goal: prove a bounded memory/source usefulness loop after target evidence and
owner-file recall state are explicit enough to evaluate.

Product rationale: KRN must show that memory/source signals from controlled runs
are later selected, used, and marked helped/stale, not merely stored.

Architectural rationale: memory/source usefulness should be evidence-backed
before adding MCP, subagents, broader evals, or scoring changes.

Evidence source: V05 target evidence, V06 owner-file recall assessment, recent
controlled dogfood reports.

Official/external sources: KRN context supply chain doctrine; Codex Goals
evidence-based completion.

Inputs required: recent memory/source candidates, review gate behavior,
activation records, controlled reports.

Files likely touched: memory/source usefulness tests or reports; possibly small
readback/rendering code if inspection proves a gap.

Allowed writes: KRN source/tests/reports only.

Forbidden writes: automatic memory promotion, broad scoring rewrite, dashboard,
MCP server, worker daemon, target repo writes.

Output requirements: selected/used/helped/stale memory/source evidence or typed
reason why the loop cannot yet be proven.

Definition of Done: a controlled scenario proves a memory/source item can move
through review/usefulness assessment or records the exact missing path.

Verification commands: `pnpm typecheck`, `pnpm test`, relevant DB/activation
smoke, `git diff --check`.

Acceptance criteria: improvement measured by controlled scenario.

Risk: producing another ledger without reuse proof.

Rollback: focused revert.

Condensation expectation: promote only evidence-backed memory/source rules.

Next-task synthesis rule: if useful, append skill/research condensation task; if
not, append bounded memory/source readback repair.

Completion evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v07-memory-source-usefulness/REPORT.md`;
- current-shell `pnpm db:smoke:target-repo-harness` passed with memory included,
  `MemoryApplication outcome=helped`, positive feedback readback, no automatic
  MemoryRecord mutation, and cleanup count zero.

### V07-01 — Source Usefulness Application / Readback Path

Status: complete on 2026-06-27

Goal: inspect and add or re-gate the smallest first-class source usefulness
application/readback path.

Product rationale: source grounding is useful as lineage today, but operators
need selected/used/helped/stale source usefulness evidence, not just existence
of SourceClaims.

Architectural rationale: source usefulness should map through existing
SourceDecisionEdge or feedback metadata before adding a new source subsystem.

Evidence source: V07-00 current-shell smoke proved memory usefulness and named
source usefulness as lineage-only.

Official/external sources: KRN source-to-decision rule; Codex Goals
evidence-based completion.

Inputs required: source claim/decision models, feedback delta model, run
readback, target harness smoke.

Files likely touched: source/review/readback code, tests, report; no schema
unless source inspection proves existing metadata cannot represent the loop.

Allowed writes: KRN source/tests/reports only.

Forbidden writes: new source crawler, automatic source promotion, broad scoring
rewrite, dashboard, MCP server, target repo writes.

Output requirements: selected/used/helped/stale source usefulness evidence or
typed reason why existing model cannot represent it.

Definition of Done: controlled scenario proves source usefulness readback or
records exact missing model boundary.

Verification commands: `pnpm typecheck`, `pnpm test`, relevant source/readback
tests, `pnpm db:smoke:target-repo-harness` if touched, `git diff --check`.

Acceptance criteria: no source truth mutation as a side effect of usefulness
feedback.

Risk: inventing source subsystem before inspecting existing decision/readback
models.

Rollback: focused revert.

Condensation expectation: if source usefulness path is added, guard it and
append research/skill condensation task.

Next-task synthesis rule: if complete, decide whether V08 skill-first workflow
expansion is now justified.

Completion evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v07-source-usefulness-readback/REPORT.md`;
- `FeedbackDelta.sourceDecisions` now contributes `source_decision_candidate`
  proposal summary/readback counts.

### V07-02 — Memory/Source Usefulness Re-Gate

Status: complete on 2026-06-27

Goal: decide whether V07 is sufficient to move to V08 skill-first workflow
expansion, or whether another bounded memory/source repair is required.

Product rationale: do not expand skills/research surfaces until memory/source
usefulness is no longer the active blocker.

Architectural rationale: re-gates prevent continuous task generation from
becoming feature drift.

Evidence source: V07-00 and V07-01 reports, full verification, CI.

Official/external sources: KRN compact plan doctrine; Codex Goals
evidence-based completion.

Inputs required: V07 reports, command results, current `PLAN.md`/`GOAL.md`.

Files likely touched: reports and plans only unless verification exposes a bug.

Allowed writes: KRN reports/plans only.

Forbidden writes: new product surfaces, source/memory scoring changes, target
repo writes.

Output requirements: explicit move/defer decision for V08.

Definition of Done: V07 verdict and next active stream recorded.

Verification commands: `pnpm typecheck`, `pnpm test`,
`pnpm eval:brain-battle:smoke`, `pnpm eval:promptfoo:smoke`,
`pnpm db:smoke:target-repo-harness`, `git diff --check`.

Acceptance criteria: no product-ready or V02-01 overclaim.

Risk: premature expansion.

Rollback: correction report.

Condensation expectation: accept/reject V08 skill-first expansion.

Next-task synthesis rule: if accepted, promote V08-00; otherwise append the
smallest remaining V07 repair.

Completion evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v07-memory-source-re-gate/REPORT.md`;
- V08 accepted as next stream.

### V08-00 — Skill-First Workflow Expansion Gate

Status: complete on 2026-06-27

Goal: inspect existing project skills and recent repeated workflows, then decide
whether to add/refine one bounded skill or reject expansion for now.

Product rationale: repeated KRN/Codex workflows should become progressive
disclosure skills when that reduces context waste and keeps `AGENTS.md` compact.

Architectural rationale: skills are the next lowest-risk Codex surface before
hooks, MCP, or subagents because they are explicit and loaded on demand.

Evidence source: V07 re-gate, existing `.agents/skills`, repeated
target/evidence/source workflows.

Official/external sources: Codex skills progressive disclosure guidance; KRN
knowledge condensation gate.

Inputs required: current `.agents/skills`, recent controlled reports,
AGENTS/GOAL/PLAN conventions.

Files likely touched: `.agents/skills/**` or report only.

Allowed writes: one bounded skill update/addition plus tests/docs if accepted;
otherwise report/plans only.

Forbidden writes: hooks, MCP server, subagent framework, broad plugin, dashboard,
runtime markdown memory, AGENTS bloat.

Output requirements: accepted/rejected skill candidate with source ->
mechanism -> KRN implication -> decision -> falsifier.

Definition of Done: one skill is added/refined with clear trigger and bounded
instructions, or expansion is rejected with evidence.

Verification commands: skill file inspection, `pnpm typecheck`, `pnpm test` if
source touched, `git diff --check`.

Acceptance criteria: skill reduces repeated context load without becoming a
parallel product brain.

Risk: skill sprawl.

Rollback: remove/refine skill and correction report.

Condensation expectation: if accepted, next task may screen hooks/MCP/subagents
only if repeated workflow still needs them.

Completion evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v08-skill-first-workflow-gate/REPORT.md`;
- `.agents/skills/handoff-compact/SKILL.md` refined with active stream/task and
  commit/push/CI fields.

### V09-00 — Deterministic Hooks Candidate Decision

Status: complete on 2026-06-27

Goal: screen whether repeated deterministic violations after V05-V08 justify a
tiny trusted hook, or reject/defer hooks with evidence.

Product rationale: hooks can protect mechanical boundaries, but semantic hidden
hooks would add trust risk and product theater.

Architectural rationale: KRN should use hooks only for deterministic lifecycle
guardrails after skills, tests, and runbooks are insufficient.

Evidence source: V04 compression screening, V08 handoff skill refinement,
target-write boundary history.

Official/external sources: Codex hooks guidance already mapped in V04
compression screening.

Inputs required: current hook candidates, V04/V08 reports, current project
configuration.

Files likely touched: report and plans only unless one tiny hook is accepted.

Allowed writes: V09 report/plans; a hook only if the report first proves a
repeated deterministic violation and defines trust/rollback.

Forbidden writes: semantic hooks, hidden quality scanners, MCP, subagent
framework, dashboard, broad policy engine.

Output requirements: accept/reject/defer decision for each hook candidate with
evidence and falsifier.

Definition of Done: hooks are either rejected/deferred with evidence or one tiny
mechanical hook is implemented with verification.

Verification commands: `git diff --check`; if source/config changes, run
relevant focused tests plus `pnpm typecheck` and `pnpm test`.

Acceptance criteria: no hook exists just because it sounds useful; every
accepted hook has deterministic inputs and rollback.

Risk: hidden enforcement surface that Codex can route around or operators do
not trust.

Rollback: remove hook/config and keep rejection report.

Condensation expectation: if hooks are rejected/deferred, move to V10 MCP /
subagent candidate gate.

Next-task synthesis rule: if no hook is justified, promote V10 candidate
screening; if a hook is implemented, add guard/replay before moving on.

Completion evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v09-hooks-candidate-decision/REPORT.md`;
- hooks rejected/deferred as runtime implementation; existing projection-first
  boundary preserved.

### V10-00 — MCP / Subagent Candidate Gate

Status: complete on 2026-06-27

Goal: decide whether any current product bottleneck requires MCP or subagents,
or reject/defer those surfaces with source-backed evidence.

Product rationale: MCP and subagents should answer proven bottlenecks, not
product ambition or architecture theater.

Architectural rationale: KRN should prefer CLI/files/DB, skills, tests, and
reports until live external context or parallel read-heavy roles are proven
insufficient.

Evidence source: V04 compression screening, V09 hook rejection, current CLI/DB
readback state, existing `.codex/agents`.

Official/external sources: Codex MCP/subagent guidance already mapped in V04
compression screening.

Inputs required: current MCP/subagent candidates, `.codex/agents`, V04/V09
reports, CLI/DB/readback evidence.

Files likely touched: report and plans only unless one bounded surface is
accepted with evidence.

Allowed writes: V10 report/plans; no MCP server or subagent implementation
unless report first proves CLI/files/DB or single-agent workflow is insufficient.

Forbidden writes: MCP server by aspiration, generic subagent framework,
write-heavy subagents, dashboard/API, worker runtime, broad eval platform.

Output requirements: accept/reject/defer decision for MCP and each subagent
candidate with source -> mechanism -> KRN implication -> decision -> falsifier.

Definition of Done: MCP/subagents are either rejected/deferred with evidence or
one tiny candidate is promoted to a future bounded task without implementation.

Verification commands: `git diff --check`; if config/source changes, run
relevant focused tests plus `pnpm typecheck` and `pnpm test`.

Acceptance criteria: no MCP/subagent implementation is added without a concrete
repeated bottleneck and a stable output contract.

Risk: agent zoo or live tool surface before product need.

Rollback: correction report and plan revert.

Condensation expectation: if MCP/subagents are rejected/deferred, move to V11
product readiness re-gate.

Next-task synthesis rule: if no MCP/subagent surface is justified, promote V11;
if a candidate is justified, append a bounded design/proof task, not broad
implementation.

Completion evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v10-mcp-subagent-candidate-gate/REPORT.md`;
- MCP server and new subagent framework rejected/deferred; existing
  `ts-type-critic` remains read-only/proposal-only.

### V11-00 — Product Readiness Re-Gate

Status: complete on 2026-06-27

Goal: decide whether V05-V10 evidence supports controlled-internal-alpha,
widened internal alpha, product-ready, or blocked/deferred status.

Product rationale: after several bounded surface gates, KRN needs a product
readiness verdict instead of another architecture surface.

Architectural rationale: readiness must come from evidence across target-aware
evidence, activation, memory/source usefulness, skills, hooks, MCP, and
subagent gates.

Evidence source: V05 through V10 reports, CI runs, DB smoke evidence, current
PLAN/GOAL/PLANS state.

Official/external sources: Codex Goals/ExecPlan completion doctrine already
captured in this plan.

Inputs required: V05-V10 reports, current CI status, current product state.

Files likely touched: report and plans only.

Allowed writes: V11 report/plans.

Forbidden writes: product feature work, dashboard/API/MCP/subagent/hooks,
product-ready claim without evidence, fake V02-01 proof.

Output requirements: readiness verdict with evidence table, remaining blockers,
next recommended bounded stream or stop condition.

Definition of Done: repo has a current readiness verdict and next active task,
or the continuous goal is explicitly stopped by operator/product-ready evidence.

Verification commands: `git diff --check`; optionally `gh run list --branch main
--limit 5` for latest remote CI status.

Acceptance criteria: no overclaim; product-ready requires stronger evidence than
current controlled self/headless runs.

Risk: self-congratulation or endless plan generation.

Rollback: correction report and plan revert.

Condensation expectation: choose next stream only from observed blockers.

Next-task synthesis rule: if not product-ready, append the highest-ROI bounded
blocker stream; if blocked only by V02-01, record exact missing inputs.

Next-task synthesis rule: append hook/MCP/subagent screening only from repeated
evidence, not aspiration.

Completion evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v11-product-readiness-re-gate/REPORT.md`;
- V11 kept product readiness conservative:
  controlled-internal-alpha for technical operators is stronger, widened
  internal alpha is not ready, product-ready is no, and V02-01 remains
  blocked/deferred.

### V12-00 — Real Operator / Widened Alpha Trial Launch Packet

Status: complete on 2026-06-27

Goal: prepare the smallest operator-ready packet that can launch V02-01 or a
widened internal-alpha trial without relying on author chat context.

Product rationale: V11 found that the current blocker is missing operator-trial
evidence, not another KRN architecture surface.

Architectural rationale: launch evidence must preserve source/evidence/review
discipline and prevent self/headless work from being renamed into
second-operator proof.

Evidence source: V11 readiness report; V02-01 missing input contract in
`GOAL.md` and `PLAN.md`; existing controlled dogfood reports.

Official/external sources: use existing Codex Goal/ExecPlan doctrine only if
needed; do not browse unless the launch packet needs current official Codex
operator guidance.

Inputs required: current V11 report, current product state, existing V02-01
missing fields, existing target-repo testing skill.

Files likely touched:

- `docs/runbooks/` or `docs/reviews/controlled-dogfood/`;
- `GOAL.md`;
- `PLAN.md`;
- `PLANS.md`.

Allowed writes: launch packet/report/plans only.

Forbidden writes: product source, target repo writes, dashboard/API/MCP/hooks,
subagent framework, fake transcript, fake second-operator proof.

Output requirements: operator launch packet with setup, DB mode, target repo
mode, support boundary, transcript schema, evidence checklist, failure
taxonomy, verdict labels, and exact missing-input stop condition.

Definition of Done: a future operator or Codex continuation can run or block
V02-01/widened-alpha trial from the packet without reconstructing context from
chat.

Verification commands: `git diff --check`; optionally `rg` for required packet
sections.

Acceptance criteria: no fake proof; no self/headless substitute; missing
operator fields are explicit.

Risk: turning the launch packet into another large roadmap.

Rollback: correction report and plan revert.

Condensation expectation: if the packet is complete and real operator inputs
are absent, keep V02-01 blocked/deferred with exact missing fields instead of
launching a substitute.

Next-task synthesis rule: if the packet reveals a small blocking operator
setup defect, append a bounded setup/runbook repair; otherwise await real
operator inputs or run a clearly labeled engineering scenario that does not
claim widened-alpha proof.

Completion evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v12-widened-alpha-trial-launch-packet/REPORT.md`;
- `docs/runbooks/second-operator-alpha-trial.md` refreshed with V12 intake,
  trial modes and claim boundaries, transcript schema, support classification,
  failure taxonomy, evidence checklist, and expanded verdict labels.

### V13-00 — Research-To-Brain Decision Lane Gate

Status: complete on 2026-06-27

Goal: decide whether KRN's current research/source-to-decision lane is enough
for official docs, papers, practitioner writing, and TypeScript standards, or
whether one bounded repair is needed.

Product rationale: while real operator evidence is unavailable, the highest-ROI
internal improvement is making knowledge ingestion disciplined enough to affect
code and policy without source hoarding.

Architectural rationale: KRN already requires `source -> mechanism -> KRN
implication -> decision/rejection -> falsifier`; V13 checks whether that rule
is operational through skills/docs/reports and not merely written down.

Evidence source: `docs/KRN_KERNEL.md`, `.agents/skills/source-to-decision`,
recent V08/V10 source-to-decision reports, TypeScript standards docs, and any
existing research/source docs.

Official/external sources: only browse or use official/current sources if a
decision depends on them; map each retained source through mechanism,
implication, decision/rejection, and falsifier.

Inputs required: source-to-decision skill, KRN source map/docs, TypeScript
standards, recent reports that used official Codex docs.

Files likely touched:

- report under `docs/reviews/controlled-dogfood/`;
- possibly `.agents/skills/source-to-decision/SKILL.md` or a runbook if a small
  repair is proven;
- `GOAL.md`;
- `PLAN.md`;
- `PLANS.md`.

Allowed writes: report/plans and at most one bounded skill/runbook refinement if
evidence proves a gap.

Forbidden writes: product feature work, source crawler, research database,
dashboard/API/MCP/subagent framework, broad eval platform, passive research
archive, fake product-ready claim.

Output requirements: current research-to-brain verdict, evidence table, accepted
or rejected repair, and next bounded stream.

Definition of Done: future Codex runs know how to turn sources into decisions
or reject them without rereading chat.

Verification commands: `git diff --check`; if a skill is edited, run a
frontmatter sanity check or available skill validator.

Acceptance criteria: no source hoarding; every retained source has mechanism,
KRN implication, decision/rejection, and falsifier.

Risk: building a research foundry instead of tightening the decision lane.

Rollback: correction report and plan revert.

Condensation expectation: prefer refining existing `source-to-decision` over
creating a new skill or subsystem.

Next-task synthesis rule: if the current lane is sufficient, reject new
research surface and choose the next engineering blocker; if not, append the
smallest repair.

Completion evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v13-research-to-brain-decision-lane/REPORT.md`;
- `.agents/skills/source-to-decision/SKILL.md` refined with research intake
  rules and consumer boundaries.

### V14-00 — TypeScript Boundary Drift Gate

Status: complete on 2026-06-27

Goal: inspect current TypeScript boundary drift and decide whether a small
source/test repair is needed.

Product rationale: KRN's research-to-brain lane should feed real engineering
standards; TypeScript boundary health is the most direct current code-quality
consumer.

Architectural rationale: KRN TypeScript should make wrong authority hard to
express through unknown-first boundaries, explicit public types, typed metadata
promotion when repeated, and no type weakening.

Evidence source: `docs/standards/typescript-excellence.md`,
`docs/standards/typescript-boundaries.md`, `.codex/agents/ts-type-critic.toml`,
current `rg` results for unsafe casts/JSON parse/any, and existing audit tests.

Official/external sources: no browsing required unless a TypeScript or Codex
product claim depends on current external docs.

Inputs required: current repo, TypeScript standards, type-safety audit source,
current search results.

Files likely touched:

- report under `docs/reviews/controlled-dogfood/`;
- maybe one small source/test repair if drift is proven;
- `GOAL.md`;
- `PLAN.md`;
- `PLANS.md`.

Allowed writes: report/plans and one bounded TypeScript boundary repair if
evidence proves drift.

Forbidden writes: broad cleanup, package-wide refactor, public API churn without
need, disabling strictness, `any`/double assertions to pass quickly, dashboard,
MCP, subagents, hooks, research product.

Output requirements: drift verdict, evidence table, accepted/rejected repair,
commands that prove and do not prove boundary health.

Definition of Done: either no current drift requires repair, or one small repair
is implemented, tested, committed, pushed, and CI-checked.

Verification commands: at minimum `git diff --check`; if source changes,
targeted tests plus `pnpm typecheck` and `pnpm test`.

Acceptance criteria: no broad cleanup; every changed line must trace to a
specific boundary drift finding.

Risk: turning TS quality into audit theater or repo-wide cleanup.

Rollback: source revert or correction report.

Condensation expectation: record any unrelated drift as backlog, not adjacent
cleanup.

Next-task synthesis rule: if a repeated drift pattern is found, append a bounded
repair; otherwise move to the next product blocker.

Completion evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v14-typescript-boundary-drift/REPORT.md`;
- `docs/standards/typescript-excellence.md` now describes actual targeted
  boundary verification instead of missing broad audit enforcement.

### V15-00 — Promptfoo / Golden Behavior Role Gate

Status: complete on 2026-06-27

Goal: decide the current role of Promptfoo relative to golden behavior tests,
DB smokes, and source-backed reports.

Product rationale: Promptfoo appears in CI and previous verification, but KRN
must not treat a smoke adapter as product-quality proof.

Architectural rationale: eval surfaces must stay bounded adapters over typed
behavior evidence, not become broad benchmark lanes or quality theater.

Evidence source: Promptfoo config/scripts, CI workflow, golden behavior tests,
recent reports that cite `pnpm eval:promptfoo:smoke`.

Official/external sources: use current official Promptfoo/OpenAI docs only if a
decision depends on current external behavior; otherwise rely on local config
and CI evidence.

Inputs required: current package scripts, CI workflow, Promptfoo config, golden
behavior tests, recent reports.

Files likely touched:

- report under `docs/reviews/controlled-dogfood/`;
- maybe docs/runbook/PLAN updates only;
- no source unless a tiny mismatch is proven.

Allowed writes: report/plans and at most one bounded docs/config repair if
evidence proves mismatch.

Forbidden writes: broad eval platform, dashboard, benchmark lane, model-scoring
suite, product-ready claim from Promptfoo smoke, unrelated golden test rewrite.

Output requirements: role decision, evidence table, proof/non-proof boundaries,
next task.

Definition of Done: Promptfoo's current role is explicit and cannot be confused
with product readiness proof.

Verification commands: `git diff --check`; if config/scripts change, run
`pnpm eval:promptfoo:smoke`.

Acceptance criteria: no eval theater; no broad benchmark lane.

Risk: overvaluing green Promptfoo smoke.

Rollback: correction report and plan revert.

Condensation expectation: prefer role clarification over new eval work unless a
specific failing behavior is found.

Next-task synthesis rule: if Promptfoo remains smoke-only, move to the next
evidence-backed engineering blocker.

Completion evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v15-promptfoo-golden-role-gate/REPORT.md`;
- Promptfoo kept as smoke/result adapter; golden behavior tests kept as behavior
  proof authority.

### V16-00 — Activation Relevance Evidence Gate

Status: complete on 2026-06-27

Goal: inspect activation relevance evidence and decide whether a bounded repair
is justified.

Product rationale: activation remains the most important partial brain-quality
area after evidence, memory/source usefulness, skills, research intake,
TypeScript boundary, and eval-role gates.

Architectural rationale: activation repair must target owner-file read models,
context ROI, or scoring only if evidence shows repeated misses; do not rewrite
retrieval from vague dissatisfaction.

Evidence source: V06 owner-file recall report, V07 memory/source usefulness
reports, V11 readiness report, recent activation-related tests/smokes, and
current activation package source.

Official/external sources: none required unless a new activation/retrieval
pattern is proposed.

Inputs required: activation reports, activation skill, owner-file recall source
and tests, recent plan/readback metadata.

Files likely touched:

- report under `docs/reviews/controlled-dogfood/`;
- maybe a small activation/read-model test or docs repair if evidence proves a
  gap;
- `GOAL.md`;
- `PLAN.md`;
- `PLANS.md`.

Allowed writes: report/plans and at most one bounded activation/read-model
repair if evidence proves it.

Forbidden writes: activation scoring rewrite without repeated evidence, source
crawler, broad retrieval platform, MCP, dashboard, eval platform, target repo
writes.

Output requirements: activation relevance verdict, evidence table, accepted or
rejected repair, next task.

Definition of Done: KRN either has a bounded activation repair queued/done or a
clear reason to continue measuring.

Verification commands: `git diff --check`; if source changes, targeted tests
plus `pnpm typecheck` and `pnpm test`.

Acceptance criteria: no scoring rewrite from one-off misses.

Risk: mistaking missing target read-model data for bad activation scoring.

Rollback: correction report and plan revert.

Condensation expectation: prefer read-model/measurement repair over scoring
change unless repeated evidence proves scoring is the owner.

Next-task synthesis rule: if activation remains partial without enough repair
evidence, choose the next bounded product blocker rather than guessing.

Completion evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v16-activation-relevance-evidence-gate/REPORT.md`;
- activation scoring rewrite rejected; target owner-file read-model contract
  accepted as V17.

### V17-00 — Target Owner-File Read-Model Contract Gate

Status: complete on 2026-06-27

Goal: decide whether the target owner-file read-model contract is explicit
enough for future target trials.

Product rationale: activation cannot be judged fairly until exact owner-file
data has a clear operator/code path into the target read model.

Architectural rationale: missing owner-file data should be handled as typed
read-model incompleteness, not scoring failure or crawler justification.

Evidence source: `runPlanCommand` target read-model construction,
`runInitCommand` source seed metadata, target-repo testing skill, second-operator
packet, V06/V16 reports, owner-file recall tests.

Official/external sources: none required.

Inputs required: current target read-model source, current runbooks/skills,
owner-file tests and reports.

Files likely touched:

- report under `docs/reviews/controlled-dogfood/`;
- maybe target-repo testing skill or second-operator runbook if docs gap exists;
- maybe a focused CLI/harness test if code contract gap exists;
- `GOAL.md`;
- `PLAN.md`;
- `PLANS.md`.

Allowed writes: report/plans and one bounded docs/test/source repair if evidence
proves a gap.

Forbidden writes: source crawler, activation scoring rewrite, target repo
writes, dashboard, MCP, broad eval platform.

Output requirements: read-model contract verdict, evidence table,
accepted/rejected repair, next task.

Definition of Done: future target trials know how owner-file data enters or
fails to enter `TargetActivationReadModel`.

Verification commands: `git diff --check`; if source/test changes, targeted
tests plus `pnpm typecheck` and `pnpm test`.

Acceptance criteria: no hidden owner-file lore; no crawler by default.

Risk: turning a contract gap into broad target discovery.

Rollback: correction report and plan revert.

Condensation expectation: prefer contract/doc/test clarity over discovery
automation.

Next-task synthesis rule: if owner-file contract is already explicit, move to
the next product blocker; if not, repair the smallest owning surface.

Completion evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v17-target-owner-file-read-model-contract/REPORT.md`;
- `krn init --owner-file "path|root|kind|reason"` implemented, documented,
  tested, and replayed against the target fixture with `ownerFiles=2` and
  `owner_files_available`.

### V18-00 — Target Owner-File Contract Re-Gate / Trial Application

Status: complete on 2026-06-27

Goal: apply or re-gate the explicit `--owner-file` contract in a bounded target
trial path and decide whether the next blocker is operator friction,
owner-file quality, or activation selection after owner files are available.

Product rationale: after V17, owner files are no longer hidden metadata, but
future target proof must show whether operators can use the contract and whether
activation improves once exact owner files are available.

Architectural rationale: target owner files remain explicit read-model inputs,
not inferred crawler output; missing owner files remain read-model
incompleteness, not scoring failure.

Evidence source: V17 report, target repo testing runbook, second-operator
packet, current `krn init --owner-file` live replay, V06/V16 activation
reports.

Official/external sources: none required unless this becomes an operator
surface/design decision beyond existing Codex/KRN guidance.

Inputs required: current repo state, V17 report, one bounded target trial path
or an explicit re-gate rejecting another local substitute.

Files likely touched:

- target trial/re-gate report under `docs/reviews/controlled-dogfood/`;
- `PLAN.md`;
- `GOAL.md`;
- `PLANS.md`;
- maybe runbook/skill docs if V18 finds operator friction.

Allowed writes: KRN reports/plans and one bounded KRN docs/source repair only
if evidence proves a gap.

Forbidden writes: living target repo writes unless explicitly scoped; source
crawler; activation scoring rewrite; dashboard/API/MCP/worker runtime.

Output requirements: report states whether `--owner-file` is usable enough for
the next target trial step and separates operator friction, owner-file quality,
activation selection, and product-readiness claims.

Definition of Done: V18 either runs a bounded target application of the
owner-file contract or records why that would be a fake substitute; next blocker
is named with evidence.

Verification commands: `git diff --check`; if source changes, `pnpm typecheck`
and `pnpm test`.

Acceptance criteria: no source crawler by default; no hidden owner-file lore; no
fake second-operator proof.

Risk: another local-only proof could be overstated.

Rollback: focused V18 report/plan revert.

Condensation expectation: decide whether the next durable surface is operator
docs, trial packet, activation repair, or no further local substitute.

Next-task synthesis rule: append the highest-ROI next blocker after V18
evidence.

Completion evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v18-target-owner-file-contract-regate/REPORT.md`;
- owner-file-heavy target task selected `tests/readiness.test.ts` first;
- dry-run `Next command` now preserves `--owner-file` flags.

### V19-00 — Product Readiness Re-Gate After Owner-File Contract

Status: complete on 2026-06-27

Goal: decide whether V17/V18 move KRN from controlled-internal-alpha toward
widened-alpha readiness, or whether the next required proof is a real
second-operator / real target trial instead of another local substitute.

Product rationale: the owner-file contract blocker is now repaired and applied
in a target fixture, so product claims must be re-gated before starting another
local proof.

Architectural rationale: readiness gates prevent source repairs, target
fixtures, and local dogfood runs from being mistaken for product proof.

Evidence source: V11 readiness gate, V12 launch packet, V17 owner-file contract
report, V18 target fixture application report, current CI state.

Official/external sources: none required unless readiness criteria are changed.

Inputs required: current reports and current remote/CI state.

Files likely touched:

- readiness report under `docs/reviews/controlled-dogfood/`;
- `GOAL.md`;
- `PLAN.md`;
- `PLANS.md`.

Allowed writes: KRN reports/plans only, unless readiness evidence exposes one
bounded docs/source repair.

Forbidden writes: target repos, source crawler, activation scoring rewrite,
dashboard/API/MCP/worker runtime, fake V02-01/product-ready claims.

Output requirements: readiness verdict for controlled-internal-alpha,
widened-alpha, product-ready, and V02-01; next task chosen from evidence.

Definition of Done: readiness is re-gated after V17/V18 and the next active
stream is explicit.

Verification commands: `git diff --check`; if source changes, `pnpm typecheck`
and `pnpm test`.

Acceptance criteria: no overclaim; real operator proof remains distinct from
target fixture proof.

Risk: readiness report could become another local substitute instead of a claim
boundary.

Rollback: focused V19 report/plan revert.

Condensation expectation: decide whether to stop local substitutes, request real
operator/target evidence, or open one specific repair.

Next-task synthesis rule: append the highest-ROI next blocker after V19
evidence.

Completion evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v19-product-readiness-after-owner-file-contract/REPORT.md`;
- readiness remains controlled-internal-alpha for technical operators, stronger;
  widened alpha and product-ready remain unproven.

### Stream V21 — Target Evidence Observation-Only Defaults And Readback Clarity

Why now:

- V20 proved real-target observation-only evidence can be persisted and read
  back.
- V20 also showed the operator can under-specify observation-only write
  boundaries: without explicit `--target-forbidden-write`, evidence readback
  says `forbiddenWrites: none`.
- Target safety evidence is more important than activation scoring for the next
  product step.

Expected end state:

```txt
Observation-only target evidence is harder to under-specify and easier to read
back. Either source inspection proves current behavior is sufficient and records
why, or KRN adds a focused CLI/source repair with tests.
```

- no target repos are edited;
- no activation scoring, source crawler, dashboard, API, MCP, or worker runtime
  is added;
- readiness remains controlled-internal-alpha for technical operators, stronger;
  widened alpha and product-ready remain unproven.

### Stream V22 — Persisted CLI DB URL Default Consistency

Why now:

- V20 showed `pnpm db:ready` can use the default local DB URL, but
  `krn init --connect --persist` failed until `KRN_DATABASE_URL` was set
  explicitly.
- V21 repaired target evidence safety, leaving DB persistence ergonomics as the
  next visible operator-friction item.

Expected end state:

```txt
Persisted CLI commands either share a consistent default DB URL behavior or
print exact remediation that makes the required env obvious and copyable.
```

- explicit `KRN_DATABASE_URL` override remains supported;
- no DB schema migration is introduced unless source inspection proves it is
  required;
- readiness remains controlled-internal-alpha for technical operators, stronger;
  widened alpha and product-ready remain unproven.

### Stream V23 — Real Target Observation Re-Run After Evidence/DB Ergonomics Repairs

Why now:

- V20 proved a real target observation-only owner-file trial.
- V21 repaired observation-only target evidence defaults.
- V22 repaired missing DB config recovery guidance.
- The next proof should exercise the repaired ergonomics in the target workflow,
  not add another isolated source repair.

Expected end state:

```txt
One real target observation-only trial confirms that target evidence defaults
and DB recovery guidance work in the end-to-end operator loop.
```

- no target repo writes;
- no fake V02-01 claim;
- no activation scoring rewrite;
- readiness remains controlled-internal-alpha for technical operators, stronger.

### Stream V24 — Target Owner-File Recall Deduplication And Budget Priority

Why now:

- V23 proved target evidence/DB ergonomics in the real target workflow.
- V23 also showed owner-file recall is useful but imprecise: adjacent agent
  guidance consumed context budget while some direct owner files were not
  included.
- This should be treated as a bounded read-model/candidate assembly repair, not
  a broad activation scoring rewrite.

Expected end state:

```txt
Explicit target owner files are prioritized and obvious duplicate/adjacent agent
guidance does not crowd out direct owner files in owner-file-heavy target tasks,
or source inspection proves current behavior is intentionally sufficient.
```

- no source crawler;
- no broad activation scoring rewrite;
- no target repo writes;
- readiness remains controlled-internal-alpha for technical operators, stronger.

### Stream V25 — Real Target Observation Re-Run After Owner-File Priority Repair

Why now:

- V24 repaired target owner-file candidate assembly and DB-backed target plan
  replay now includes all five explicit owner files plus trust exclusions.
- The repair should be exercised in the full real target observation-only loop
  before adding another source repair or changing activation scoring.

Expected end state:

```txt
One real target observation-only rerun proves the repaired owner-file priority
in the end-to-end target workflow, preserves target clean state, and records
evidence/readback without V02-01 or product-ready overclaim.
```

- no target repo writes;
- no source crawler;
- no broad activation scoring rewrite;
- no fake V02-01 or product-ready claim;
- readiness remains controlled-internal-alpha for technical operators, stronger.

### Stream V26 — CLI Run Reference And Empty Target Changed Files Ergonomics

Why now:

- V24/V25 exposed two small operator-friction issues while running real
  dogfood: `evidence capture` accepts `--run-id`, `observe` accepts `--run`,
  and `--target-changed-file none` is rejected even though target evidence
  readback renders `changedFiles: none`.
- These are CLI ergonomics issues, not evidence semantic or target policy
  changes.

Expected end state:

```txt
Operators can use a consistent run reference spelling across evidence/observe,
and can explicitly express zero target changed files if the CLI already renders
that state.
```

- no DB schema change;
- no target policy change;
- no source crawler;
- no activation scoring change;
- no V02-01/product-ready overclaim.

### Stream V27 — Controlled Internal Alpha Re-Gate After Target Loop Repairs

Why now:

- V20 through V26 produced a coherent target loop: real target observation,
  target evidence defaults, DB recovery guidance, owner-file priority, target
  rerun after repair, and CLI ergonomics.
- The next decision should be a product re-gate, not another automatic source
  repair.

Expected end state:

```txt
KRN records whether the current state is still controlled-internal-alpha for
technical operators, whether widened alpha is allowed, whether V02-01 should
resume, and what the next highest-ROI task is.
```

- no product-ready overclaim;
- no fake V02-01 proof;
- no new architecture;
- no target repo writes.

### Stream V28 — Research-To-Brain TypeScript/Codex Decision Trial

Why now:

- V27 concluded the target loop repair batch and kept KRN at
  controlled-internal-alpha for technical operators.
- The user wants KRN to continuously absorb high-quality engineering knowledge,
  including Codex patterns, research, and TypeScript discipline, but only when
  it maps to concrete decisions and falsifiers.

Expected end state:

```txt
One bounded source-to-decision trial maps a small source set into KRN decisions,
rejections, or candidates without building a research subsystem or source
crawler.
```

- no source hoarding;
- no Research Foundry;
- no crawler;
- no dashboard/API/MCP/worker runtime;
- no product-ready overclaim.

### V20-00 — Real Target Observation-Only Owner-File Trial

Status: complete

Goal: use a real target checkout, not a checked-in fixture, in observation-only
mode; provide explicit owner files if known; run KRN init/plan/evidence; and
decide whether the next blocker is target selection, owner-file quality,
activation selection, operator friction, or a bounded KRN repair.

Product rationale: after V17/V18, owner-file contract behavior is proven only
on a fixture; V20 must gather real target evidence without pretending to satisfy
V02-01.

Architectural rationale: target trials must preserve read-only target state,
proof/non-proof boundaries, and explicit owner-file inputs before product
readiness or scoring claims.

Evidence source: V19 readiness gate, V18 target fixture application, V12
second-operator packet, target repo testing runbook.

Official/external sources: none required unless a target tool/source decision
depends on external docs.

Inputs required: one safe real target checkout under the local workspace or an
explicit blocker report saying no safe target exists.

Files likely touched:

- target trial report under `docs/reviews/controlled-dogfood/`;
- `GOAL.md`;
- `PLAN.md`;
- `PLANS.md`;
- maybe target-repo testing runbook/skill if the trial exposes friction.

Allowed writes: KRN reports/plans and bounded KRN docs/source repair only if
evidence proves a gap.

Forbidden writes: target repo edits, target commits, target resets/cleans,
source crawler, activation scoring rewrite, fake V02-01/widened-alpha claim,
dashboard/API/MCP/worker runtime.

Output requirements: target mode, target dirty state, owner files, KRN commands,
target commands, target evidence, selected/used/helped/missing context, proof
boundaries, readiness implication, next task.

Definition of Done: V20 either completes one observation-only real target trial
or records the exact blocker preventing a safe real target trial.

Verification commands: `git diff --check`; if source changes, `pnpm typecheck`
and `pnpm test`; if DB-backed, `pnpm db:ready`.

Acceptance criteria: no target writes; no fixture substitute; no V02-01/product
overclaim.

Risk: accidentally touching a living target repo. Mitigation: observation-only
mode and pre/post target `git status`.

Rollback: focused report/plan revert; no target rollback should be needed
because target writes are forbidden.

Condensation expectation: decide whether next work is real operator intake,
target owner-file quality repair, activation repair, evidence ergonomics, or
blocked target selection.

Next-task synthesis rule: append the highest-ROI next blocker after V20
evidence.

Completed evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v20-real-target-observation-only-owner-file-trial/REPORT.md`.
- Target repo: `/home/krn/coding/krn/active/krn-elektroinstal-ogar`.
- Mode: observation-only.
- Target status before/after: clean.
- DB-backed run: `dd69eb5a-8552-46d1-89fc-4a7617acb59c`.

### V21-00 — Target Evidence Observation-Only Defaults And Readback Clarity

Status: complete

Goal: repair or explicitly reject the target evidence ergonomics gap found by
V20. Observation-only target evidence should not be easy to read back as
`forbiddenWrites: none` when the mode itself forbids target edits, commits,
resets, cleans, and production/runtime writes.

Product rationale: real-target trials are useful only if target safety
boundaries are obvious in persisted evidence and readback.

Architectural rationale: target evidence is review authority. It must say what
was allowed, forbidden, proven, and not proven without requiring hidden operator
memory.

Evidence source: V20 report and run readback for
`dd69eb5a-8552-46d1-89fc-4a7617acb59c`.

Official/external sources: none required unless source inspection needs current
Codex/OpenAI docs for goal/ExecPlan semantics.

Inputs required: current CLI evidence parsing/rendering source and tests.

Files likely touched:

- `packages/cli/src/parseEvidenceArgs.ts`;
- `packages/cli/src/runEvidenceCaptureCommand.ts`;
- `packages/cli/src/runRunShowCommand.ts`;
- related CLI/golden tests;
- V21 report under `docs/reviews/controlled-dogfood/`;
- `GOAL.md`;
- `PLAN.md`;
- `PLANS.md`.

Allowed writes: KRN package source/tests/docs/plans only.

Forbidden writes: target repo edits, activation scoring rewrite, source crawler,
DB schema migration unless source inspection proves it is necessary, dashboard,
API, MCP, worker runtime, fake V02-01/widened-alpha/product-ready claim.

Output requirements:

- source inspection finding;
- selected implementation or explicit rejection;
- tests proving observation-only target evidence defaults/warnings/readback;
- proof that explicit target write flags still work;
- report describing what improved and what remains unproven.

Definition of Done: observation-only target evidence is safer/clearer by source
repair with tests, or the current behavior is explicitly defended with evidence
and a documented reason.

Verification commands: targeted CLI tests, `pnpm typecheck`, `pnpm test`,
`git diff --check`.

Acceptance criteria: no target writes, no hidden policy engine, no target trial
overclaim, no broad refactor.

Risk: silently changing existing target evidence semantics. Mitigation: preserve
explicit `--target-allowed-write` / `--target-forbidden-write` behavior and add
focused regression tests.

Rollback: focused revert of the implementation/report commit.

Condensation expectation: decide whether the next work is DB env ergonomics,
real operator intake, target runbook update, or another real-target trial.

Next-task synthesis rule: append the highest-ROI next blocker after V21
evidence.

Completed evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v21-target-evidence-observation-only-defaults/REPORT.md`.
- Observation-only target evidence defaults now preserve safe write boundaries
  when operator flags are omitted.
- CLI usage examples and run readback clarity were improved.

### V22-00 — Persisted CLI DB URL Default Consistency

Status: complete

Goal: inspect and repair or explicitly reject inconsistent local DB URL
ergonomics for persisted CLI commands.

Product rationale: target trials and dogfood runs depend on persisted CLI flows.
If some commands use a default DB URL while others require a hidden env value,
operator friction and false blockers increase.

Architectural rationale: DB runtime configuration is an adapter boundary. It
must be explicit, typed, and predictable without weakening production override
behavior.

Evidence source: V20 `krn init --connect --persist` failed until
`KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn` was set, while
`pnpm db:ready` succeeded with the default URL.

Official/external sources: none required unless source inspection needs current
OpenAI/Codex guidance for Goals/ExecPlans.

Inputs required: CLI database runtime source, persisted command source, tests,
and package scripts.

Files likely touched:

- `packages/cli/src/databaseRuntime.ts`;
- persisted command runners that check `KRN_DATABASE_URL`;
- CLI tests;
- V22 report under `docs/reviews/controlled-dogfood/`;
- `GOAL.md`;
- `PLAN.md`;
- `PLANS.md`.

Allowed writes: KRN package source/tests/docs/plans only.

Forbidden writes: target repo edits, DB schema migration unless source proves it
is required, product-ready/V02-01 overclaim, dashboard/API/MCP/worker runtime.

Output requirements:

- source inspection finding;
- decision: default URL behavior or exact remediation;
- focused tests for missing env and explicit env override;
- verification commands and proof/non-proof boundaries.

Definition of Done: persisted CLI DB URL behavior is consistent or explicitly
defended with stronger operator-facing remediation.

Verification commands: targeted CLI tests, `pnpm typecheck`, `pnpm test`,
`git diff --check`; if DB behavior changes, `pnpm db:ready`.

Acceptance criteria: no hidden production config, no schema change unless
necessary, explicit env override remains supported.

Risk: masking real DB misconfiguration. Mitigation: keep endpoint printed and
preserve explicit override behavior.

Rollback: focused revert of implementation/report commit.

Condensation expectation: decide whether the next work is another real target
trial, target runbook update, activation context repair, or real operator
intake.

Next-task synthesis rule: append the highest-ROI next blocker after V22
evidence.

Completed evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v22-persisted-cli-db-url-recovery/REPORT.md`.
- Missing DB config errors now include copyable recovery guidance without
  silently defaulting direct persisted commands to local Postgres.

### V23-00 — Real Target Observation Re-Run After Evidence/DB Ergonomics Repairs

Status: complete

Goal: rerun a real target observation-only owner-file trial after V21/V22 and
prove the repaired target evidence defaults and DB recovery guidance in the
target workflow.

Product rationale: source repairs are only useful if they reduce friction in the
next real target trial.

Architectural rationale: target evidence and DB config are operator boundaries.
They need end-to-end proof under the real target workflow.

Evidence source: V20, V21, and V22 reports.

Official/external sources: none required unless target tooling requires external
docs.

Inputs required: one safe real target checkout, preferably the same
`krn-elektroinstal-ogar` checkout if still clean.

Files likely touched:

- V23 report under `docs/reviews/controlled-dogfood/`;
- `GOAL.md`;
- `PLAN.md`;
- `PLANS.md`.

Allowed writes: KRN reports/plans only unless evidence proves a bounded KRN
source repair is required.

Forbidden writes: target repo edits, target commits, target resets/cleans,
activation scoring rewrite, source crawler, product-ready/V02-01 overclaim,
dashboard/API/MCP/worker runtime.

Output requirements:

- target pre/post dirty state;
- owner files;
- KRN init/plan/evidence commands;
- one target evidence capture that omits explicit target forbidden-write flags
  and still persists observation-only defaults;
- DB missing-env behavior if encountered;
- proof/non-proof boundaries;
- next task decision.

Definition of Done: V23 either completes one real target observation-only rerun
with repaired ergonomics or records the exact blocker.

Verification commands: `git diff --check`; if source changes, `pnpm typecheck`
and `pnpm test`; if DB-backed, `pnpm db:ready`.

Acceptance criteria: no target writes; no fixture substitute; no V02-01/product
overclaim.

Risk: rerun becomes redundant. Mitigation: explicitly test the repaired
ergonomics from V21/V22.

Rollback: focused report/plan revert; no target rollback should be needed.

Condensation expectation: decide whether next work is real operator intake,
activation owner-file recall repair, target runbook update, or another bounded
source repair.

Next-task synthesis rule: append the highest-ROI next blocker after V23
evidence.

Completed evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v23-real-target-rerun-after-ergonomics/REPORT.md`.
- Real target evidence defaults persisted correctly without explicit forbidden
  write flags.
- Target repo stayed clean before and after.

### V24-00 — Target Owner-File Recall Deduplication And Budget Priority

Status: complete on 2026-06-27

Goal: inspect and repair or explicitly reject the V23 owner-file recall
precision gap.

Product rationale: real target tasks should not lose direct owner files because
adjacent or duplicate agent guidance consumes the inclusion budget.

Architectural rationale: explicit owner files are operator-provided read-model
truth. They should have stronger priority than broad source seeds for
owner-file-heavy target tasks unless there is a concrete reason not to include
them.

Evidence source: V23 report and plan output for run
`43e08455-6123-465b-990b-5d7abaf842b3`.

Official/external sources: none required unless current Codex/OpenAI docs are
needed for source-to-decision.

Inputs required: activation/read-model source that assembles target source
seeds, owner files, trust exclusions, and context inclusions.

Files likely touched:

- activation/read-model source discovered by search;
- activation/target owner-file tests;
- V24 report under `docs/reviews/controlled-dogfood/`;
- `GOAL.md`;
- `PLAN.md`;
- `PLANS.md`.

Allowed writes: KRN source/tests/docs/plans only.

Forbidden writes: target repo edits, source crawler, broad activation scoring
rewrite, generic ranking engine, dashboard/API/MCP/worker runtime, product-ready
or V02-01 overclaim.

Output requirements:

- source inspection finding;
- decision: repair or explicit rejection;
- focused tests if repaired;
- proof that explicit owner files are not crowded out by duplicate/adjacent
  agent guidance in owner-file-heavy target tasks.

Definition of Done: either bounded source repair with tests or documented
rejection with evidence.

Verification commands: targeted tests, `pnpm typecheck`, `pnpm test`,
`git diff --check`; if DB-backed proof is used, `pnpm db:ready`.

Acceptance criteria: no target writes, no source crawler, no broad scoring
rewrite.

Risk: overfitting to one target repo. Mitigation: keep rule narrow to explicit
owner-file priority/deduplication and test with target fixture/read-model.

Rollback: focused revert.

Condensation expectation: decide whether next work is another real target trial,
real operator intake, or activation/read-model follow-up.

Next-task synthesis rule: append the highest-ROI next blocker after V24
evidence.

Completed evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v24-owner-file-recall-dedup-budget/REPORT.md`.
- Source repair in `packages/harness/src/activation/ownerFileRecall.ts`.
- DB-backed target plan replay for execution run
  `12318455-bfa6-4838-a168-5866f0e5dfbd` included all five explicit owner
  files plus target trust exclusions.

### V25-00 — Real Target Observation Re-Run After Owner-File Priority Repair

Status: complete on 2026-06-27

Goal: rerun the real target observation-only owner-file trial after V24 and
prove the full workflow now includes direct owner files while preserving target
clean state, observation-only target evidence defaults, DB-backed readback, and
no V02-01/product-ready overclaim.

Product rationale: V24 proved source behavior and target plan replay, but KRN
should validate the repair in the next full target loop before broadening alpha
or changing activation scoring.

Architectural rationale: source repairs become product evidence only when the
next scenario uses them and preserves proof/non-proof boundaries.

Evidence source: V24 report and DB-backed target plan replay for
`12318455-bfa6-4838-a168-5866f0e5dfbd`.

Official/external sources: none required unless target tooling requires
external docs.

Inputs required: safe real target checkout, current DB readiness, owner-file
contract metadata from project `e83b4509-6889-426c-90e2-bc4e6394ba26`.

Files likely touched:

- V25 report under `docs/reviews/controlled-dogfood/`;
- `GOAL.md`;
- `PLAN.md`;
- `PLANS.md`;
- only bounded KRN source/tests if the rerun exposes a new implementation gap.

Allowed writes: KRN reports/plans; bounded KRN source repair only if evidence
proves a new gap.

Forbidden writes: target repo edits, target commits, target resets/cleans,
source crawler, broad activation scoring rewrite, dashboard/API/MCP/worker
runtime, product-ready or V02-01 overclaim.

Output requirements:

- target pre/post dirty state;
- DB readiness;
- KRN plan output showing owner-file inclusions;
- target commands, if safe and observation-only;
- evidence capture/readback with observation-only target defaults;
- observe/reflect only after evidence capture completes;
- dogfood usefulness and next-task decision.

Definition of Done: V25 either completes one real target observation-only rerun
after V24 or records the exact blocker.

Verification commands: `git diff --check`; if source changes, `pnpm typecheck`
and `pnpm test`; if DB-backed, `pnpm db:ready`.

Acceptance criteria: no target writes, no fixture substitute, no V02-01/product
overclaim, and owner-file priority appears in the real target plan.

Risk: redundant rerun. Mitigation: explicitly verify the owner-file inclusion
change from V24 and target clean state.

Rollback: focused report/plan revert; no target rollback should be needed.

Condensation expectation: decide whether next work is real operator intake,
activation/read-model follow-up, target runbook update, or another bounded
source repair.

Next-task synthesis rule: append the highest-ROI next blocker after V25
evidence.

Completed evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v25-target-rerun-after-owner-file-priority/REPORT.md`.
- Real target remained clean before/after.
- Plan run `ca9cfa4d-ab52-49cd-b6cc-de8a3e4289cf` included all five owner
  files plus target trust exclusions.
- Target evidence readback preserved observation-only defaults.

### V26-00 — CLI Run Reference And Empty Target Changed Files Ergonomics

Status: complete on 2026-06-27

Goal: repair or explicitly reject small CLI ergonomics gaps from V24/V25:
`krn evidence capture --run-id` vs `krn observe --run`, and invalid
`--target-changed-file none` despite readback rendering no changed files as
`none`.

Product rationale: repeated dogfood should not require remembering command
specific flag aliases for the same execution run concept or guessing how to
state an empty target changed-file list.

Architectural rationale: this is adapter ergonomics over existing typed
evidence semantics. It must not change evidence meaning, target policy, DB
schema, or activation behavior.

Evidence source: V24 report and V25 report.

Official/external sources: none required.

Inputs required: CLI argument parsers and command tests for evidence capture,
observe, and run show if readback text changes.

Files likely touched:

- `packages/cli/src/parseEvidenceArgs.ts`;
- `packages/cli/src/parseObserveArgs.ts` or observe parser source discovered by search;
- related CLI tests;
- V26 report under `docs/reviews/controlled-dogfood/`;
- `GOAL.md`;
- `PLAN.md`;
- `PLANS.md`.

Allowed writes: KRN CLI source/tests/docs/plans only.

Forbidden writes: target repo edits, DB schema migration, target evidence
semantic changes, activation scoring, source crawler, dashboard/API/MCP/worker
runtime, V02-01/product-ready overclaim.

Output requirements:

- source inspection finding;
- decision: repair or explicit rejection;
- if repaired, tests for accepted aliases / explicit zero target changed files;
- proof old documented syntax remains valid;
- dogfood report with proof/non-proof boundaries.

Definition of Done: either bounded CLI repair with tests or documented rejection
with evidence.

Verification commands: targeted CLI tests, `pnpm typecheck`, `pnpm test`,
`git diff --check`.

Acceptance criteria: no evidence semantic drift, no DB schema change, no target
repo writes.

Risk: adding too many aliases. Mitigation: accept only aliases proven by V24/V25
friction and keep help text explicit.

Rollback: focused revert.

Condensation expectation: decide whether next work is real operator intake,
another target trial, or a re-gate after V26.

Next-task synthesis rule: append the highest-ROI next blocker after V26
evidence.

Completed evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v26-cli-run-reference-target-none-ergonomics/REPORT.md`.
- `krn evidence capture --run` and `krn observe --run-id` aliases are covered.
- `--target-changed-file none` is accepted as explicit empty target changed-file
  evidence without changing persisted evidence semantics.

### V27-00 — Controlled Internal Alpha Re-Gate After Target Loop Repairs

Status: complete on 2026-06-27

Goal: review V20 through V26 evidence and decide the next product step.

Product rationale: the target loop has now accumulated enough repairs that the
plan should re-gate readiness instead of endlessly appending local fixes.

Architectural rationale: KRN's continuous loop must periodically condense
completed repairs into product readiness decisions and stop carrying completed
context.

Evidence source: V20, V21, V22, V23, V24, V25, and V26 reports plus remote CI.

Official/external sources: none required.

Inputs required: current reports, current `PLAN.md`/`GOAL.md`/`PLANS.md`,
latest commit/CI state.

Files likely touched:

- V27 report under `docs/reviews/controlled-dogfood/`;
- `GOAL.md`;
- `PLAN.md`;
- `PLANS.md`.

Allowed writes: KRN reports/plans only unless re-gate discovers a tiny blocking
source bug.

Forbidden writes: target repo edits, new architecture, dashboard/API/MCP/worker
runtime, source crawler, product-ready overclaim, fake V02-01 proof.

Output requirements:

- readiness verdict;
- what V20-V26 proved;
- what remains unproved;
- next task decision;
- explicit V02-01/widened-alpha/product-ready boundary.

Definition of Done: one compact re-gate report exists and the active queue
points to exactly one next task or a documented blocker.

Verification commands: `git diff --check`; if source is touched, `pnpm
typecheck` and `pnpm test`.

Acceptance criteria: no new implementation plan unless evidence identifies one
bounded next task.

Risk: report-only churn. Mitigation: keep the report short and decision-driven.

Rollback: focused report/plan revert.

Condensation expectation: decide whether next work is V02-01 real operator
intake, another controlled target trial, a bounded repair, or pause for inputs.

Next-task synthesis rule: append the single highest-ROI next task after V27
evidence.

Completed evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v27-controlled-internal-alpha-regate/REPORT.md`.
- Readiness remains controlled-internal-alpha for technical operators, stronger.
- V02-01 remains blocked/deferred until real operator inputs exist.

### V28-00 — Research-To-Brain TypeScript/Codex Decision Trial

Status: complete on 2026-06-27

Goal: run one bounded research-to-brain trial that maps a small source set
through source -> mechanism -> KRN implication -> decision/rejection ->
falsifier.

Product rationale: after the target loop repair batch, KRN should prove it can
condense external and practitioner knowledge into actionable brain decisions
without becoming a research notebook.

Architectural rationale: research is useful only when it changes a KRN rule,
skill, standard, eval candidate, source decision, or explicit rejection with a
falsifier.

Evidence source: V27 report and user direction to use strong Codex/TypeScript
patterns without slop.

Official/external sources: official OpenAI Codex docs/Cookbook; TypeScript
discipline sources; selected research papers only if directly decision-relevant.

Inputs required: current KRN standards/skills, source-to-decision skill, current
Codex docs if OpenAI behavior is referenced.

Files likely touched:

- V28 report under `docs/reviews/controlled-dogfood/`;
- `docs/standards/*` or `.agents/skills/*` only if a decision is accepted;
- `GOAL.md`;
- `PLAN.md`;
- `PLANS.md`.

Allowed writes: KRN docs/standards/skills/plans only; source code only if the
research-to-decision output identifies a tiny implementation guard.

Forbidden writes: source crawler, Research Foundry, dashboard/API/MCP/worker
runtime, broad eval platform, new memory subsystem, product-ready overclaim.

Output requirements:

- source list;
- source -> mechanism -> KRN implication -> decision/rejection -> falsifier
  table;
- accepted decisions;
- rejected/deferred decisions;
- next task recommendation.

Definition of Done: one compact report exists and any accepted decision is
written to the smallest durable surface.

Verification commands: `git diff --check`; if docs only, no typecheck required;
if standards/skills or source are touched, run relevant checks.

Acceptance criteria: no source hoarding, no broad architecture, no uncited
research claims.

Risk: turning research into decorative context. Mitigation: reject sources that
do not produce a concrete KRN decision and falsifier.

Rollback: focused report/plan revert.

Condensation expectation: decide whether to update a skill/standard/eval,
append a bounded implementation task, or reject research expansion.

Next-task synthesis rule: append the highest-ROI next blocker after V28
evidence.

Completed evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v28-research-to-brain-typescript-codex/REPORT.md`.
- `docs/KRN_SOURCES.md` updated with durable Codex ExecPlan, Codex prompting,
  and TypeScript practitioner source decisions.
- V28 rejected Research Foundry/crawler/new research subsystem work and
  promoted a bounded TypeScript boundary application gate.

### V29-00 — TypeScript Boundary Research Application Gate

Status: complete on 2026-06-27

Goal: apply the accepted V28 TypeScript source decisions to current code with a
bounded boundary spot-check and either classify findings or perform one tiny
high-confidence repair.

Product rationale: research-to-brain is only useful if accepted knowledge
changes future code review, verification, or repair decisions. V29 checks
whether KRN's current TypeScript code still respects the source-backed boundary
rules without creating a broad audit subsystem.

Architectural rationale: TypeScript boundary quality belongs to standards,
tests, parsers, and targeted repairs. It must not resurrect `krn audit`,
quality theater, broad semantic scanners, or cleanup by inertia.

Evidence source: V28 report, `docs/KRN_SOURCES.md`, and current TypeScript
standards.

Official/external sources: V28 source map only; do not expand research unless a
finding depends on a new source.

Inputs required: current TypeScript standards, current package source, targeted
`rg` scans for high-risk boundary patterns.

Files likely touched:

- V29 report under `docs/reviews/controlled-dogfood/`;
- `GOAL.md`;
- `PLAN.md`;
- `PLANS.md`;
- optionally a tiny TypeScript source/test repair only if the spot-check finds
  a high-confidence boundary bug.

Allowed writes: KRN report/plans; bounded TypeScript source/tests only if
directly justified by a concrete finding.

Forbidden writes: broad audit subsystem, `krn audit`, source crawler, Research
Foundry, dashboard/API/MCP/worker runtime, broad eval platform, global
`ts-reset` in core/schema/public APIs, broad cleanup/refactor.

Output requirements:

- bounded scan commands and results;
- classification of each finding as accepted boundary, test-only, repair
  candidate, no issue, or insufficient evidence;
- proof/non-proof boundaries;
- source-to-decision implication for any accepted repair or rejection;
- next task recommendation.

Definition of Done: one compact V29 report exists, and either no source repair
is needed or one tiny source repair is implemented with focused verification.

Verification commands: targeted `rg` scans, `git diff --check`; if source is
touched, run relevant tests and `pnpm typecheck`.

Acceptance criteria: no broad audit, no generic cleanup, no uncited research
claim, no source repair without a direct boundary finding.

Risk: V29 becomes old audit theater under a new name. Mitigation: scan only the
patterns named by V28/standards and classify rather than fixing by aesthetics.

Rollback: focused report/plan revert, plus focused source revert if a tiny
repair is made.

Condensation expectation: decide whether current TypeScript boundary health is
sufficient, whether one repair is needed, or whether a narrow guard/test should
be added.

Next-task synthesis rule: append the highest-ROI next blocker after V29
evidence.

Completed evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v29-typescript-boundary-research-application/REPORT.md`.
- Production `JSON.parse` is limited to `packages/cli/src/cliFileBoundary.ts`
  and already uses `unknown` plus a local object guard.
- Targeted scans found no `as any`, `as unknown as`, `@ts-ignore`, or
  `@ts-expect-error` under `packages`.
- No TypeScript source repair was justified by V29 evidence.

### V30-00 — Codex Surface Context-Budget Application Gate

Status: complete on 2026-06-27

Goal: apply the accepted V28 Codex surface decisions to current repo instruction
and skill surfaces, then decide whether any compactness, trigger, or context
budget repair is needed.

Product rationale: V28 accepted Codex surface decisions for `AGENTS.md`, Goals,
ExecPlans, and skills. V30 checks whether the current durable instruction
surfaces remain compact and useful, instead of becoming hidden context bloat.

Architectural rationale: Codex surfaces are adapters over KRN truth. `AGENTS.md`
should stay small, `GOAL.md`/`PLAN.md` should stay compact, `PLANS.md` should
carry execution detail, and skills should cover repeated workflows without
becoming a skill zoo.

Evidence source: V28 report, V29 report, Codex manual source decisions in
`docs/KRN_SOURCES.md`, current `AGENTS.md`, `.agents/skills/*`, `GOAL.md`,
`PLAN.md`, and `PLANS.md`.

Official/external sources: V28 source map only; do not expand research unless a
finding depends on a new Codex surface claim.

Inputs required: current instruction files, repo-local skills, and active plan
surfaces.

Files likely touched:

- V30 report under `docs/reviews/controlled-dogfood/`;
- `GOAL.md`;
- `PLAN.md`;
- `PLANS.md`;
- optionally a tiny skill or instruction-file refinement only if a concrete
  trigger/context-budget gap is found.

Allowed writes: KRN report/plans; bounded skill/instruction docs only if direct
evidence proves a compactness or trigger bug.

Forbidden writes: new broad skill set, hook implementation, MCP server,
subagent framework, dashboard/API/worker runtime, source crawler, Research
Foundry, product-ready overclaim, large `AGENTS.md` expansion.

Output requirements:

- current size/shape summary for `AGENTS.md`, `GOAL.md`, `PLAN.md`,
  `PLANS.md`, and repo-local skills;
- classification of each surface as keep, refine, split, reject expansion, or
  insufficient evidence;
- proof/non-proof boundaries;
- next task recommendation.

Definition of Done: one compact V30 report exists and either no surface repair
is needed or one tiny skill/instruction repair is implemented with focused
verification.

Verification commands: `git diff --check`; if skill/instruction files are
touched, run relevant text checks and inspect trigger descriptions.

Acceptance criteria: no new surface without evidence, no AGENTS bloat, no
parallel roadmap, no broad hook/MCP/subagent implementation.

Risk: V30 becomes meta-document churn. Mitigation: classify existing surfaces
first and only edit if evidence shows a direct continuation/trigger problem.

Rollback: focused report/plan revert, plus focused skill/instruction revert if
needed.

Condensation expectation: decide whether Codex surface hygiene is sufficient or
whether a bounded trigger/context-budget repair is needed.

Next-task synthesis rule: append the highest-ROI next blocker after V30
evidence.

Completed evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v30-codex-surface-context-budget/REPORT.md`.
- Root `PLAN.md` was condensed from 19,877 bytes to 4,004 bytes.
- Stale active V28 lower section was removed from `PLAN.md`.
- No new skill, hook, MCP, subagent framework, or `AGENTS.md` expansion was
  justified.

### V31-00 — Product Readiness Re-Gate After Research And Surface Hygiene

Status: complete on 2026-06-27

Goal: inspect V27 through V30 evidence and decide the next product step after
target loop repairs, research-to-brain source decisions, TypeScript boundary
application, and Codex surface context-budget repair.

Product rationale: after V27-V30, KRN needs a product decision rather than
another meta-surface cleanup. The next work should be selected from evidence:
real operator intake, target trial, activation/read-model repair, or an
explicit pause/blocker.

Architectural rationale: KRN's continuous loop must periodically condense
completed slices into readiness and next-task decisions. Otherwise the plan
becomes self-referential maintenance.

Evidence source: V27, V28, V29, and V30 reports plus current remote CI.

Official/external sources: none required unless a readiness claim depends on a
new Codex/OpenAI surface.

Inputs required: V27-V30 reports, current `GOAL.md`, `PLAN.md`, `PLANS.md`,
latest commit/CI state.

Files likely touched:

- V31 report under `docs/reviews/controlled-dogfood/`;
- `GOAL.md`;
- `PLAN.md`;
- `PLANS.md`.

Allowed writes: KRN reports/plans only unless re-gate finds a tiny blocking
source bug.

Forbidden writes: target repo edits, new architecture, dashboard/API/MCP/worker
runtime, source crawler, Research Foundry, product-ready overclaim, fake V02-01
proof, broad activation/reflection rewrite.

Output requirements:

- readiness verdict;
- what V27-V30 proved;
- what remains unproved;
- exactly one next task decision;
- explicit V02-01/widened-alpha/product-ready boundary.

Definition of Done: one compact V31 re-gate report exists and the active queue
points to exactly one next task or a documented blocker.

Verification commands: `git diff --check`; if source is touched, `pnpm
typecheck` and `pnpm test`.

Acceptance criteria: no new implementation plan unless evidence identifies one
bounded next task.

Risk: report-only churn. Mitigation: keep the report short and decision-driven.

Rollback: focused report/plan revert.

Condensation expectation: decide whether next work is V02-01 real operator
intake, another controlled target trial, a bounded repair, or pause for inputs.

Next-task synthesis rule: append the single highest-ROI next task after V31
evidence.

Completed evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v31-product-readiness-regate-after-research-surface/REPORT.md`.
- V31 kept readiness at controlled-internal-alpha for technical operators:
  stronger.
- Product-ready, widened alpha, and V02-01 remain unproved.
- V31 promoted one next product proof: V32 controlled target repair trial.

### V32-00 — Controlled Target Repair Trial

Status: complete

Goal: run one bounded KRN-guided repair against a safe target checkout with
explicit allowed files, forbidden files, pre/post dirty state, rollback, target
commands, KRN plan/evidence/readback, and a report.

Product rationale: previous real target loops were observation-only. The next
product question is whether KRN can guide a small target change while preserving
scope, evidence, target safety, and rollback.

Architectural rationale: target repair proof must be explicit and governed.
KRN should not mutate living repos casually, and target writes must be tied to a
bounded task contract, evidence capture, and rollback path.

Evidence source: V31 report, V20-V26 target loop reports, target-repo testing
skill, and current target checkout state.

Official/external sources: none required unless target tooling requires current
external docs.

Inputs required:

- one safe target checkout under the local workspace;
- target preflight `git status --short --branch`;
- one bounded target task;
- explicit allowed files;
- explicit forbidden files;
- rollback method before editing.

Files likely touched:

- V32 report under `docs/reviews/controlled-dogfood/`;
- `GOAL.md`;
- `PLAN.md`;
- `PLANS.md`;
- a bounded set of target repo files only after allowed files and rollback are
  recorded.

Allowed writes:

- KRN reports/plans;
- target repo files explicitly listed in the V32 report before editing.

Forbidden writes:

- target commits;
- target `git reset`, `git clean`, or destructive cleanup;
- target files not listed as allowed;
- target production/runtime secrets;
- broad target refactor;
- KRN package source unless the trial exposes a tiny blocking KRN bug and the
  plan is updated first;
- product-ready/V02-01/widened-alpha overclaim;
- dashboard/API/MCP/worker runtime/source crawler/Research Foundry.

Output requirements:

- target path and mode;
- target pre/post dirty state;
- allowed files and forbidden files;
- rollback method;
- KRN plan/evidence/readback commands if DB/CLI are available;
- target commands and proof/non-proof boundaries;
- repair diff summary;
- readiness implication and next-task decision.

Definition of Done: V32 either completes one bounded target repair trial or
records the exact blocker preventing a safe repair trial.

Verification commands: target-specific commands selected before editing,
`git diff --check` in KRN repo; if KRN source changes, `pnpm typecheck` and
`pnpm test`; if DB-backed KRN flow is used, `pnpm db:ready`.

Acceptance criteria:

- no target write before allowed files and rollback are recorded;
- no target commit;
- no destructive target cleanup;
- no V02-01/product-ready/widened-alpha overclaim;
- target pre/post state is recorded.

Risk: accidental target damage or product overclaim. Mitigation: target
preflight, explicit allowed writes, rollback before edit, and report-only
blocker if no safe target exists.

Rollback: restore only the explicitly edited target files using the recorded
method; revert KRN report/plan commit if necessary.

Condensation expectation: decide whether KRN target repair is useful enough to
run another controlled target repair, whether a KRN repair is needed, or
whether real operator intake is again the next blocker.

Next-task synthesis rule: append the highest-ROI next blocker after V32
evidence.

Completed evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v32-controlled-target-repair/REPORT.md`.
- Target repo `/home/krn/coding/krn/active/krn-elektroinstal-ogar` remained
  uncommitted with exactly two KRN-owned target file edits.
- DB-backed KRN flow persisted plan, evidence, observe, reflect, and readback.
- Main finding: reused project init/connect printed new FAQ owner-file inputs,
  but subsequent plan selected older/stale owner files and omitted both FAQ
  files.

### V33-00 — Reused Project Owner-File Refresh Repair

Status: complete

Goal: inspect and repair the reused-project owner-file refresh/read-model path
so new `krn init --owner-file` entries are available to planning or stale
owner-file/read-model state is reported explicitly.

Product rationale: V32 proved a governed target repair, but the planning
context did not include the exact newly supplied owner files for the reused
target project. This raises review burden and weakens KRN target-repair
usefulness before any wider alpha.

Architectural rationale: owner-file recall should depend on explicit typed
read-model state, not stale persisted project metadata. The repair should
target owner-file refresh/readback before any activation scoring rewrite or
target source crawler.

Evidence source: V32 report, V17 owner-file contract, V24 owner-file priority
repair, and DB-backed run `e6c68ed8-4c90-436c-bb33-7673f7ed683b`.

Official/external sources: none required unless source inspection proves a
current external API/tooling decision is needed.

Inputs required:

- current KRN DB ready;
- V32 reused target project ID `e83b4509-6889-426c-90e2-bc4e6394ba26`;
- two FAQ owner-file entries from V32;
- source inspection of init/connect persistence and plan read-model assembly.

Files likely touched:

- V33 report under `docs/reviews/controlled-dogfood/`;
- `packages/cli/src/runInitCommand.ts` or adjacent init persistence code if the
  refresh gap is there;
- `packages/cli/src/runPlanCommand.ts` or adjacent read-model code if the gap is
  there;
- focused tests for reused project owner-file refresh;
- `GOAL.md`;
- `PLAN.md`;
- `PLANS.md`.

Allowed writes:

- KRN source only if source inspection confirms the refresh/read-model bug;
- KRN report/plans.

Forbidden writes:

- target repo edits;
- target commits;
- target `git reset` or `git clean`;
- activation scoring rewrite;
- source crawler;
- dashboard/API/MCP/worker runtime/Research Foundry;
- product-ready/V02-01/widened-alpha overclaim.

Output requirements:

- source finding: where owner files are created, updated, merged, or ignored for
  reused projects;
- minimal repair or explicit stale-state warning if repair is not correct yet;
- DB-backed replay proving the two FAQ owner files become selected/visible or
  stale-state warning is emitted;
- proof/non-proof boundaries;
- next-task decision.

Definition of Done: V33 either repairs reused-project owner-file refresh with
tests and DB-backed replay, or records the exact blocker/source reason that
prevents a safe repair.

Verification commands: targeted tests for touched package, `pnpm typecheck`,
`pnpm test`, `pnpm db:ready`, DB-backed init/connect/plan replay, and
`git diff --check`.

Acceptance criteria:

- no target repo writes;
- no activation scoring rewrite;
- no source crawler;
- no product-ready/V02-01/widened-alpha overclaim;
- reused-project owner-file behavior is proven by current-state evidence.

Risk: fixing a symptom in plan ranking instead of the real owner-file refresh
path. Mitigation: inspect persistence/read-model path first and keep scoring
out of scope unless source evidence proves it is the only owner.

Rollback: revert the focused KRN source/report/plan commit if necessary.

Condensation expectation: decide whether owner-file refresh is now sufficient
for another controlled target repair or whether target planning still needs a
separate read-model visibility repair.

Completed evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v33-reused-project-owner-file-refresh/REPORT.md`.
- Source repair changed `runInitCommand`, `runPlanCommand`, init-connect smoke,
  and smoke rendering.
- DB-backed replay on the V32 target project now reports only the two FAQ owner
  files and includes both plus trust exclusions in context.

### V34-00 — Target Repair Re-Gate After Owner-File Refresh

Status: complete

Goal: decide the next product move after V32/V33 without creating another
implementation stream by inertia.

Product rationale: V32 proved one governed target repair and V33 repaired the
owner-file refresh gap found by that repair. The target repo still has the V32
patch dirty, and product-ready, widened alpha, and V02-01 remain unproved.

Architectural rationale: after a source repair, KRN should re-gate from
evidence instead of immediately stacking another feature. The decision must
respect target safety, patch handoff, operator readiness, and current CI.

Evidence source: V32 report, V33 report, current target dirty state, current
KRN CI/verification state.

Official/external sources: none required.

Inputs required:

- KRN git status and latest pushed CI result;
- target repo dirty state;
- V32/V33 reports;
- V02-01 input availability check.

Files likely touched:

- V34 report under `docs/reviews/controlled-dogfood/`;
- `GOAL.md`;
- `PLAN.md`;
- `PLANS.md`.

Allowed writes:

- KRN report/plans only.

Forbidden writes:

- target repo edits;
- target commit;
- target reset/clean;
- KRN source changes unless the re-gate identifies a tiny blocking bug and
  promotes a new task first;
- product-ready/V02-01/widened-alpha overclaim;
- dashboard/API/MCP/worker runtime/source crawler/Research Foundry.

Output requirements:

- readiness verdict after V32/V33;
- target patch handoff/dirty-state decision;
- next recommended task;
- proof/non-proof boundaries.

Definition of Done: V34 either promotes the next bounded product task or records
that real operator inputs/target patch handoff are the honest blocker.

Verification commands: `git diff --check`; inspect target `git status
--short --branch`; check pushed CI if a commit is made.

Acceptance criteria:

- no target writes;
- no V02-01 substitution;
- no product-ready overclaim;
- active plan points to the next concrete task.

Completed evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v34-target-repair-regate-after-owner-file-refresh/REPORT.md`.
- KRN worktree was clean before the re-gate.
- Latest KRN CI run `28289476246` was passed.
- Target repo remained dirty with exactly the two V32 patch files.

### V35-00 — Target Patch Handoff Packet

Status: complete

Goal: create a KRN-side handoff packet for the V32 target patch so the target
dirty state is explicit, reviewable, and operator-owned before any next target
repair.

Product rationale: V34 found the immediate blocker is not another KRN feature
but target patch ownership. The V32 patch is useful evidence, but it is still
only dirty state in a living target checkout.

Architectural rationale: KRN must not treat target working-tree dirt as hidden
state or silently commit/revert external code. Target patch handoff should be a
bounded report artifact with exact diff, proof boundaries, and operator choices.

Evidence source: V32 report, V34 report, current target diff/status.

Official/external sources: none required.

Inputs required:

- current target `git status --short --branch`;
- current target focused diff for the two V32 files;
- V32 verification commands;
- V34 readiness decision.

Files likely touched:

- V35 report under `docs/reviews/controlled-dogfood/`;
- optional KRN-side `.patch`/`.diff` artifact under the same V35 report folder;
- `GOAL.md`;
- `PLAN.md`;
- `PLANS.md`.

Allowed writes:

- KRN report/plans and optional KRN-side patch artifact only.

Forbidden writes:

- target repo edits;
- target commit;
- target reset/clean;
- KRN source changes;
- product-ready/V02-01/widened-alpha overclaim.

Output requirements:

- exact target patch diff or patch artifact;
- target files changed;
- commands already run;
- proof/non-proof boundaries;
- operator choices: keep/apply, commit in target workflow, revert manually, or
  request more verification;
- statement that KRN did not commit target code.

Definition of Done: V35 creates the handoff packet and either promotes another
bounded target proof if safe or records that target owner/operator decision is
the honest blocker.

Verification commands: `git diff --check`; inspect target `git status
--short --branch`; do not modify target.

Acceptance criteria:

- no target writes;
- no target commit/revert;
- no product-ready/V02-01 overclaim;
- patch ownership is explicit.

Completed evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v35-target-patch-handoff/REPORT.md`.
- `docs/reviews/controlled-dogfood/2026-06-27-v35-target-patch-handoff/FAQ_ARIA_PATCH.diff`.
- Target repo remained dirty with exactly the two V32 patch files; KRN did not
  edit/commit/revert target code in V35.

### V36-00 — Target Patch Handoff Re-Gate

Status: complete

Goal: decide the next product move after target patch handoff.

Product rationale: V35 made the V32 target patch explicit and handoff-safe.
KRN now needs a decision: wait for target owner/operator action, run stronger
observation-only verification, pick another clean target proof, or resume
V02-01 only if real second-operator inputs exist.

Architectural rationale: KRN should not continue target work while target patch
ownership is ambiguous. Re-gate before any additional target repair or product
readiness claim.

Evidence source: V35 handoff report, target status, current KRN CI.

Official/external sources: none required.

Inputs required:

- V35 report and patch artifact;
- target `git status --short --branch`;
- KRN status and latest CI;
- V02-01 input availability check.

Files likely touched:

- V36 report under `docs/reviews/controlled-dogfood/`;
- `GOAL.md`;
- `PLAN.md`;
- `PLANS.md`.

Allowed writes:

- KRN report/plans only.

Forbidden writes:

- target repo edits;
- target commit;
- target reset/clean;
- KRN source changes unless a new task is promoted first;
- product-ready/V02-01/widened-alpha overclaim.

Output requirements:

- next product/task decision;
- target ownership status;
- proof/non-proof boundaries;
- active plan update.

Definition of Done: V36 either promotes the next bounded task or records target
owner/operator decision as the honest blocker.

Verification commands: `git diff --check`; inspect target status; check CI if
V36 is committed.

Acceptance criteria:

- no target writes;
- no fake V02-01;
- no product-ready overclaim;
- next active task is explicit.

Evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v36-target-patch-handoff-regate/REPORT.md`.
- KRN latest CI `28289750736` passed for V35.
- Target repo remains dirty with exactly the two V32 patch files.

Outcome:

- V36 rejected same-target repair while the target patch is unresolved.
- V36 rejected V02-01 without real second-operator inputs.
- V36 promoted V37 to make target patch lifecycle handling durable in the
  target-repo workflow surface.

### V37-00 — Target Patch Lifecycle Rule Condensation

Status: complete

Goal: condense V32-V36 target patch lifecycle evidence into durable target-repo
workflow rules.

Product rationale: V32 proved a controlled headless target repair, V35 made the
patch handoff-safe, and V36 showed the handed-off patch remains unresolved.
Future target trials need a small durable rule so unresolved dirty target
patches do not become ambiguous state before another repair.

Architectural rationale: KRN target workflows must separate target patch
ownership from KRN product evidence. The right surface is the existing
target-repo skill/runbook, not a new subsystem.

Evidence source: V32 repair report, V35 handoff packet, V36 re-gate report,
current target status.

Official/external sources: none required.

Inputs required:

- `docs/reviews/controlled-dogfood/2026-06-27-v35-target-patch-handoff/REPORT.md`;
- `docs/reviews/controlled-dogfood/2026-06-27-v36-target-patch-handoff-regate/REPORT.md`;
- `.agents/skills/target-repo-testing/SKILL.md`;
- `docs/runbooks/target-repo-testing.md` if present/relevant.

Files likely touched:

- `.agents/skills/target-repo-testing/SKILL.md`;
- `docs/runbooks/target-repo-testing.md`;
- `GOAL.md`;
- `PLAN.md`;
- `PLANS.md`.

Allowed writes:

- KRN workflow docs/skills/plans only.

Forbidden writes:

- target repo edits;
- target commit;
- target reset/clean;
- KRN source changes;
- fake V02-01 proof;
- product-ready/widened-alpha overclaim;
- new dashboard/API/MCP/worker/eval platform.

Output requirements:

- durable patch lifecycle rule;
- explicit unresolved-patch stop condition;
- target report fields for patch lifecycle state;
- active plan update.

Definition of Done: V37 updates the target-repo workflow surface so a future
Codex continuation can identify `handed_off_unresolved` target patches and avoid
same-target repair unless owner action, stronger observation-only verification,
or clean target selection is explicit.

Verification commands: `git diff --check`; inspect target status only if needed.

Acceptance criteria:

- no target writes;
- unresolved target patch state is represented explicitly;
- same-target repair stop condition is durable;
- next active task is explicit.

Evidence:

- `.agents/skills/target-repo-testing/SKILL.md`.
- `docs/runbooks/target-repo-testing.md`.
- `docs/reviews/controlled-dogfood/2026-06-27-v37-target-patch-lifecycle-rule/REPORT.md`.

Outcome:

- V37 added `target_patch_lifecycle` states to the target-repo skill/runbook.
- V37 added `handed_off_unresolved` as a same-target repair stop condition.
- V37 promoted clean target selection as the next bounded gate.

### V38-00 — Clean Target Selection Gate

Status: complete

Goal: decide whether another clean/safe target proof path exists without
touching the unresolved `krn-elektroinstal-ogar` FAQ patch.

Product rationale: KRN should continue learning from target trials, but not by
mixing evidence with an unresolved handed-off patch in the same living target.

Architectural rationale: target selection is a gate, not a crawler or broad
benchmark lane. It should choose one safe path or record an honest blocker.

Evidence source: V36 re-gate, V37 lifecycle rule, current target availability.

Official/external sources: none required.

Inputs required:

- current KRN status and latest CI;
- target repo status for `krn-elektroinstal-ogar`;
- read-only listing of plausible target repos under `active/`;
- V02-01 input availability check.

Files likely touched:

- V38 report under `docs/reviews/controlled-dogfood/`;
- `GOAL.md`;
- `PLAN.md`;
- `PLANS.md`.

Allowed writes:

- KRN report/plans only.

Forbidden writes:

- target repo edits;
- target commit;
- target reset/clean;
- same-target repair on `krn-elektroinstal-ogar` while FAQ patch is
  `handed_off_unresolved`;
- fake V02-01 proof;
- product-ready/widened-alpha overclaim;
- new dashboard/API/MCP/worker/eval platform.

Output requirements:

- selected next target path or explicit blocker;
- target patch lifecycle status for any inspected target;
- proof/non-proof boundaries;
- active plan update.

Definition of Done: V38 either selects one clean/safe target path for the next
bounded proof or records target owner/operator decision as the honest blocker.

Verification commands: `git diff --check`; read-only target status/listing.

Acceptance criteria:

- no target writes;
- no same-target repair while FAQ patch remains unresolved;
- no fake V02-01;
- next active task is explicit.

Evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v38-clean-target-selection-gate/REPORT.md`.
- Active repo status inventory.
- `wilq-seo` status, README, AGENTS, package scripts.

Outcome:

- V38 selected `/home/krn/coding/krn/active/wilq-seo` as the next clean/safe
  target path.
- V38 rejected same-target `krn-elektroinstal-ogar` repair while FAQ patch is
  `handed_off_unresolved`.
- V38 promoted an observation-only WILQ baseline before any target repair.

### V39-00 — WILQ Clean Target Observation-Only Baseline

Status: complete

Goal: run an observation-only baseline on the clean `wilq-seo` target before
any bounded repair.

Product rationale: KRN should prove it can read and plan against another real
clean target without touching it before attempting another controlled repair.

Architectural rationale: target baseline separates discovery from repair and
keeps target owner/context rules visible.

Evidence source: V38 selected `wilq-seo` as clean/safe target; target
`AGENTS.md`, README, package scripts, and active plans.

Official/external sources: none required.

Inputs required:

- `wilq-seo` target status before/after;
- `wilq-seo/AGENTS.md`;
- `wilq-seo/README.md`;
- `wilq-seo/package.json`;
- `wilq-seo/PLAN.md` and `wilq-seo/PLANS.md` if needed;
- optional non-destructive command list, but do not run heavy verification
  unless it is explicitly useful and reported.

Files likely touched:

- V39 report under `docs/reviews/controlled-dogfood/`;
- `GOAL.md`;
- `PLAN.md`;
- `PLANS.md`.

Allowed writes:

- KRN report/plans only.

Forbidden writes:

- `wilq-seo` edits;
- target commit/push/reset/clean;
- target repair;
- fake V02-01 proof;
- product-ready/widened-alpha overclaim;
- broad benchmark lane.

Output requirements:

- mode: observation-only;
- target dirty before/after;
- target patch lifecycle;
- command evidence and proof/non-proof boundaries;
- candidate owner files or missing owner-file read-model note;
- decision whether a bounded WILQ repair trial is safe later.

Definition of Done: V39 records a WILQ baseline and either promotes a bounded
repair/prep task or records why no safe target work should proceed.

Verification commands: `git diff --check`; read-only target status before/after.

Acceptance criteria:

- no target writes;
- no fake V02-01;
- no product-ready overclaim;
- next active task is explicit.

Evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v39-wilq-observation-baseline/REPORT.md`.
- `wilq-seo` target status before baseline.
- `wilq-seo` AGENTS, README, context/progress/goal/plan files, package and
  Python config.

Outcome:

- V39 found `wilq-seo` became dirty between V38 selection and V39 baseline.
- V39 kept the work observation-only and rejected immediate WILQ repair.
- V39 promoted target selection freshness rule condensation.

### V40-00 — Target Selection Freshness Rule Condensation

Status: complete

Goal: condense V39 target volatility into the target-repo workflow: clean target
selection must be revalidated immediately before use.

Product rationale: Active target repos can change between selection and
execution. KRN must not use stale clean-state assumptions to justify target
repair or readiness proof.

Architectural rationale: target clean/dirty state is runtime evidence, not a
durable property. The workflow surface should require fresh status before
target commands and before promotion from selection to repair.

Evidence source: V38 selected `wilq-seo` as clean; V39 found it dirty before
baseline.

Official/external sources: none required.

Inputs required:

- V38 selection report;
- V39 WILQ observation baseline report;
- `.agents/skills/target-repo-testing/SKILL.md`;
- `docs/runbooks/target-repo-testing.md`.

Files likely touched:

- `.agents/skills/target-repo-testing/SKILL.md`;
- `docs/runbooks/target-repo-testing.md`;
- `GOAL.md`;
- `PLAN.md`;
- `PLANS.md`.

Allowed writes:

- KRN workflow docs/skills/plans only.

Forbidden writes:

- target repo edits;
- target commit/push/reset/clean;
- target repair;
- fake V02-01 proof;
- product-ready/widened-alpha overclaim;
- broad target crawler/benchmark lane.

Output requirements:

- target clean-state freshness rule;
- explicit downgrade behavior when selected target becomes dirty;
- active plan update.

Definition of Done: V40 makes target selection freshness durable so a clean
selection cannot be reused after target state changes.

Verification commands: `git diff --check`.

Acceptance criteria:

- no target writes;
- stale clean-state assumption is forbidden;
- next active task is explicit.

Evidence:

- `.agents/skills/target-repo-testing/SKILL.md`.
- `docs/runbooks/target-repo-testing.md`.
- `docs/reviews/controlled-dogfood/2026-06-27-v40-target-selection-freshness-rule/REPORT.md`.

Outcome:

- V40 added `target_status_freshness` states to target-repo workflow guidance.
- V40 made stale clean-state assumptions invalid for target repair/readiness
  proof.
- V40 promoted target trial availability re-gate.

### V41-00 — Target Trial Availability Re-Gate

Status: complete

Goal: decide whether target trials should continue immediately or pause until a
clean or explicitly writable target state exists.

Product rationale: The current target loop found two separate target-state
boundaries: unresolved target patch ownership and selected-clean target
volatility. Continuing target work without re-gating would create false product
confidence.

Architectural rationale: target trial availability is a product gate. It should
choose one evidence-backed next direction, not grow into target crawling or
substitute V02-01.

Evidence source: V36-V40 target patch lifecycle, clean target selection, WILQ
volatility, and target workflow rule updates.

Official/external sources: none required.

Inputs required:

- V36-V40 reports;
- current KRN status and latest CI;
- current status of `krn-elektroinstal-ogar`;
- current status of `wilq-seo`;
- V02-01 input availability check.

Files likely touched:

- V41 report under `docs/reviews/controlled-dogfood/`;
- `GOAL.md`;
- `PLAN.md`;
- `PLANS.md`.

Allowed writes:

- KRN report/plans only.

Forbidden writes:

- target repo edits;
- target commit/push/reset/clean;
- target repair;
- fake V02-01 proof;
- product-ready/widened-alpha overclaim.

Output requirements:

- next product direction;
- target availability status;
- proof/non-proof boundaries;
- active plan update.

Definition of Done: V41 either selects a safe next target/KRN path or records
target-owner/clean-target availability as the honest blocker.

Verification commands: `git diff --check`; read-only target status.

Acceptance criteria:

- no target writes;
- no fake V02-01;
- no product-ready overclaim;
- next active task is explicit.

Evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v41-target-trial-availability-regate/REPORT.md`.
- Current KRN status, latest CI, and target statuses.

Outcome:

- V41 found `krn-elektroinstal-ogar` remains blocked by
  `handed_off_unresolved`.
- V41 found `wilq-seo` is clean again at fresh check time.
- V41 promoted a WILQ fresh observation-only baseline retry.

### V42-00 — WILQ Fresh Observation-Only Baseline Retry

Status: complete

Goal: retry WILQ observation-only baseline with fresh target status at task
start.

Product rationale: WILQ is currently the only clean/safe target candidate. KRN
should complete a read-only baseline before any bounded repair.

Architectural rationale: this task applies the V40 freshness rule. It must
re-check target state at start instead of trusting V41.

Evidence source: V41 availability re-gate found WILQ clean at fresh check time.

Official/external sources: none required.

Inputs required:

- WILQ target status at V42 start;
- WILQ AGENTS, README, context/progress/goal/plan;
- WILQ package/verification surfaces;
- V40 target freshness rule.

Files likely touched:

- V42 report under `docs/reviews/controlled-dogfood/`;
- `GOAL.md`;
- `PLAN.md`;
- `PLANS.md`.

Allowed writes:

- KRN report/plans only.

Forbidden writes:

- WILQ target edits;
- target commit/push/reset/clean;
- target repair;
- fake V02-01 proof;
- product-ready/widened-alpha overclaim.

Output requirements:

- target status freshness;
- observation-only baseline;
- repair safety decision;
- active plan update.

Definition of Done: V42 completes a fresh WILQ observation-only baseline if the
target remains clean, or stops and records volatility if it becomes dirty again.

Verification commands: `git diff --check`; read-only WILQ target status before
and after.

Acceptance criteria:

- no target writes;
- no fake V02-01;
- no product-ready overclaim;
- next active task is explicit.

Evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v42-wilq-baseline-retry-stop/REPORT.md`.
- Fresh KRN, WILQ and elektroinstal target statuses.

Outcome:

- V42 found WILQ dirty again at task start.
- V42 stopped before baseline or repair.
- V42 promoted target stability window gate.

### V43-00 — Target Stability Window Gate

Status: complete

Goal: decide the next target work only after a stable clean target window,
explicit dirty-state permission, real second-operator input, or switch back to
KRN internal source hardening.

Product rationale: actively changing target repos are useful evidence, but not
safe repair targets without owner coordination or a stable window.

Architectural rationale: target volatility is an availability constraint. KRN
should not chase moving target states as if they were product proof.

Evidence source: V39 and V42 WILQ volatility; elektroinstal unresolved patch
lifecycle; V40 freshness rule.

Official/external sources: none required.

Inputs required:

- V39-V42 reports;
- current target status only if needed;
- V02-01 input availability check.

Files likely touched:

- V43 report under `docs/reviews/controlled-dogfood/`;
- `GOAL.md`;
- `PLAN.md`;
- `PLANS.md`.

Allowed writes:

- KRN report/plans only.

Forbidden writes:

- target repo edits;
- target commit/push/reset/clean;
- target repair;
- fake V02-01 proof;
- product-ready/widened-alpha overclaim.

Output requirements:

- target stability decision;
- next product direction;
- proof/non-proof boundaries;
- active plan update.

Definition of Done: V43 selects a stable target protocol, target owner request,
V02-01 wait, or KRN internal hardening direction.

Verification commands: `git diff --check`.

Acceptance criteria:

- no target writes;
- no fake V02-01;
- no product-ready overclaim;
- next active task is explicit.

Evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v43-target-stability-window-gate/REPORT.md`.
- Current target statuses and source inspection for target evidence fields.

Outcome:

- V43 paused live target repair/baseline trials because both real targets are
  currently unavailable for safe repair.
- V43 found target workflow lifecycle/freshness fields are not yet first-class
  target evidence.
- V43 promoted V44 KRN internal source hardening.

### V44-00 — Target Evidence Lifecycle And Freshness Fields

Status: complete

Goal: make target status freshness and patch lifecycle first-class target
evidence fields in KRN source/CLI/readback.

Product rationale: target workflow now requires lifecycle/freshness state, but
target evidence persistence/readback does not carry those fields. Operators
should not have to reconstruct them from prose reports.

Architectural rationale: this belongs in the existing target evidence metadata
path, not a DB migration or new product surface.

Evidence source: V37-V43 target lifecycle/freshness reports and V43 source
inspection.

Official/external sources: none required.

Inputs required:

- `packages/core/src/evidenceBundle.ts`;
- `packages/core/src/evidenceBundle.test.ts`;
- `packages/cli/src/parseEvidenceArgs.ts`;
- `packages/cli/src/parseEvidenceArgs.test.ts`;
- `packages/cli/src/runEvidenceCaptureCommand.ts`;
- `packages/cli/src/runRunShowCommand.ts`;
- related CLI tests.

Files likely touched:

- `packages/core/src/evidenceBundle.ts`;
- `packages/core/src/evidenceBundle.test.ts`;
- `packages/cli/src/parseEvidenceArgs.ts`;
- `packages/cli/src/parseEvidenceArgs.test.ts`;
- `packages/cli/src/runEvidenceCaptureCommand.ts`;
- `packages/cli/src/runRunShowCommand.ts`;
- focused CLI tests;
- V44 report;
- `GOAL.md`;
- `PLAN.md`;
- `PLANS.md`.

Allowed writes:

- KRN source/tests/docs/plans only.

Forbidden writes:

- target repo edits;
- target commit/push/reset/clean;
- DB migration unless source proves metadata cannot carry fields;
- fake V02-01 proof;
- product-ready/widened-alpha overclaim;
- dashboard/API/MCP/worker/new eval platform.

Output requirements:

- typed target status freshness field;
- typed target patch lifecycle field;
- optional handoff artifact and target owner decision text;
- CLI parse/render/readback coverage;
- focused tests.

Definition of Done: V44 can capture and read back target lifecycle/freshness in
target evidence without relying on report prose.

Verification commands:

```sh
pnpm --filter @krn/core test -- evidenceBundle
pnpm --filter @krn/cli test -- parseEvidenceArgs runRunShowCommand runCli evidenceCaptureGoldenBehavior
pnpm typecheck
pnpm test
git diff --check
```

Acceptance criteria:

- no target writes;
- no DB migration unless justified;
- target lifecycle/freshness fields round-trip through target evidence;
- next active task is explicit.

Outcome:

- V44 added typed `targetStatusFreshness` and `targetPatchLifecycle` fields to
  target evidence.
- V44 added optional `handoffArtifact` and `targetOwnerDecision`.
- V44 covered CLI parse, evidence capture render, run show readback, JSON
  readback, and golden behavior without DB migration.

### V45-00 — Target Availability Re-Gate With Typed Lifecycle Evidence

Status: complete

Goal: run a fresh observation-only target availability gate using the new typed
target evidence lifecycle/freshness fields.

Product rationale: V43 paused live target trials because candidate target repos
were dirty or had unresolved patch lifecycle state. V44 made that state
first-class evidence. The next step is to re-check availability and record it
with typed target evidence before any further target trial or repair.

Architectural rationale: target selection and repair safety must depend on
fresh evidence, not stale clean-state assumptions or prose-only lifecycle notes.

Evidence source: V43 target stability gate and V44 target evidence source
repair.

Official/external sources: none required.

Inputs required:

- `docs/reviews/controlled-dogfood/2026-06-27-v44-target-evidence-lifecycle-freshness/REPORT.md`;
- `.agents/skills/target-repo-testing/SKILL.md`;
- `docs/runbooks/target-repo-testing.md`;
- fresh `git status --short --branch` for candidate target repos.

Files likely touched:

- V45 report under `docs/reviews/controlled-dogfood/`;
- `GOAL.md`;
- `PLAN.md`;
- `PLANS.md`.

Allowed writes:

- KRN reports/plans only.

Forbidden writes:

- target repo edits;
- target commit/push/reset/clean;
- same-target repair when patch lifecycle is `handed_off_unresolved`;
- fake V02-01 proof;
- product-ready/widened-alpha overclaim;
- dashboard/API/MCP/worker/new eval platform.

Output requirements:

- fresh target availability status;
- target status freshness classification;
- target patch lifecycle classification;
- handoff artifact/owner decision if applicable;
- decision: repair target / observation-only target / wait / choose different
  target / internal KRN hardening.

Definition of Done: V45 states whether a safe next target trial exists and
records the decision with typed target evidence fields.

Verification commands:

```sh
git status --short --branch
git diff --check
```

Acceptance criteria:

- no target writes;
- no stale target state used as current evidence;
- no product-ready or V02-01 overclaim;
- next active task is explicit.

Outcome:

- V45 re-checked WILQ and elektroinstal with fresh target status.
- V45 used typed target evidence fields in `krn evidence capture` preview for
  both target states.
- V45 found no safe headless repair target: WILQ is dirty/external-context
  only, elektroinstal remains `handed_off_unresolved`, and the broader active
  checkout inventory is dirty/noisy.

### V46-00 — Target Owner Coordination Packet

Status: complete

Goal: create a compact coordination packet listing the exact owner/stability
inputs required to resume target repair or V02-01 without inventing another
local substitute.

Product rationale: repeated target gates now show KRN can inspect and classify
target state, but repair/product proof needs external owner/stability input.
The next useful artifact is a minimal packet that makes those missing inputs
explicit.

Architectural rationale: KRN should not create more local substitutes when the
next proof depends on owner acceptance, explicit dirty-state write scope, a
stable clean target window, or real second-operator transcript.

Evidence source: V45 target availability re-gate.

Official/external sources: none required.

Inputs required:

- `docs/reviews/controlled-dogfood/2026-06-27-v45-target-availability-regate-typed-evidence/REPORT.md`;
- V35 target patch handoff report if referenced;
- `.agents/skills/target-repo-testing/SKILL.md`;
- `docs/runbooks/target-repo-testing.md`.

Files likely touched:

- coordination packet under `docs/reviews/controlled-dogfood/`;
- `GOAL.md`;
- `PLAN.md`;
- `PLANS.md`.

Allowed writes:

- KRN reports/plans only.

Forbidden writes:

- target repo edits;
- target commit/push/reset/clean;
- fake V02-01 proof;
- another local substitute for missing operator inputs;
- product-ready/widened-alpha overclaim;
- dashboard/API/MCP/worker/new eval platform.

Output requirements:

- exact inputs needed for WILQ dirty-state repair permission;
- exact inputs needed for elektroinstal patch lifecycle decision;
- exact inputs needed for V02-01 real second-operator proof;
- what KRN may do while waiting;
- what KRN must not do while waiting.

Definition of Done: V46 produces a compact operator-facing packet that can be
used to unblock the next target proof without rereading V35-V45.

Verification commands:

```sh
git status --short --branch
git diff --check
```

Acceptance criteria:

- no target writes;
- no new local substitute;
- no product-ready or V02-01 overclaim;
- next active task is explicit.

Outcome:

- V46 produced a compact owner/stability coordination packet.
- The packet states exact WILQ dirty-state repair inputs, elektroinstal patch
  lifecycle decision inputs, V02-01 real second-operator inputs, and allowed
  internal work while waiting.

### V47-00 — Internal Hardening Re-Gate After Target Coordination

Status: complete

Goal: choose the next bounded internal KRN hardening task while target repair
and V02-01 wait for owner/operator inputs.

Product rationale: V46 prevents more local target substitutes. KRN should keep
improving internally, but only by selecting one bounded task that reduces
future target/review/context burden.

Architectural rationale: when external proof is blocked by missing owner input,
the loop should re-gate and pick a small internal repair from evidence rather
than grow plan sprawl.

Evidence source: V44-V46 target evidence, target availability, and coordination
reports.

Official/external sources: none required unless the selected internal hardening
task depends on a source decision.

Inputs required:

- `docs/reviews/controlled-dogfood/2026-06-27-v45-target-availability-regate-typed-evidence/REPORT.md`;
- `docs/reviews/controlled-dogfood/2026-06-27-v46-target-owner-coordination-packet/PACKET.md`;
- `PLANS.md` Generated Task Backlog and Condensation Queue.

Files likely touched:

- V47 report under `docs/reviews/controlled-dogfood/`;
- `GOAL.md`;
- `PLAN.md`;
- `PLANS.md`.

Allowed writes:

- KRN reports/plans only unless the selected next task is promoted after V47.

Forbidden writes:

- target repo edits;
- target commit/push/reset/clean;
- fake V02-01 proof;
- another local target substitute;
- product-ready/widened-alpha overclaim;
- dashboard/API/MCP/worker/new eval platform.

Output requirements:

- one selected next internal hardening task;
- rationale from evidence;
- explicit rejected alternatives;
- exact non-goals and verification for the selected task.

Definition of Done: V47 picks one next active internal hardening task or records
that owner/operator input is required before any useful progress.

Verification commands:

```sh
git status --short --branch
git diff --check
```

Acceptance criteria:

- no target writes;
- no new local substitute;
- no giant roadmap;
- next active task is explicit.

Outcome:

- V47 selected continuous pattern source-to-decision as the next internal
  hardening task.
- V47 rejected another target substitute, activation scoring repair, reflection
  rewrite, and dashboard/API/MCP/worker work for the current moment.

### V48-00 — Continuous Pattern Source-To-Decision Gate

Status: active

Goal: create a standing gate for applying high-quality source-backed patterns
to every KRN stage.

Product rationale: KRN should continuously improve from the strongest
available patterns: our own standards, public docs, high-quality courses,
papers, battle-tested infra practices, harness/eval patterns, CI/release
patterns, and target-repo evidence. Every significant slice should ask whether
there is a better known pattern and either adopt, reject, or lab-test it.

Architectural rationale: patterns should enter KRN through the existing
source-to-decision lane and become durable only when they change future
execution behavior through a consumer: standard, skill, ADR, eval/golden test,
memory/source candidate, CLI/readback behavior, CI check, or bounded repair.

Evidence source: V47 report, `docs/KRN_SOURCES.md`, source-to-decision skill,
target-repo testing skill, TypeScript standards, OpenAI Codex/Cookbook source
decisions, and user direction that pattern condensation must exist at every
stage.

Official/external sources: use only legal/public or user-provided sources. Do
not copy paid course content into KRN. Convert accessible sources into
mechanisms, decisions, and falsifiers.

Inputs required:

- `docs/reviews/controlled-dogfood/2026-06-27-v47-internal-hardening-regate/REPORT.md`;
- `docs/KRN_SOURCES.md`;
- `.agents/skills/source-to-decision/SKILL.md`;
- `.agents/skills/typescript-type-safety/SKILL.md`;
- `.agents/skills/target-repo-testing/SKILL.md`;
- current standards, ADRs, CI/eval docs, and runbooks as needed.

Files likely touched:

- V48 report under `docs/reviews/controlled-dogfood/`;
- `PLANS.md` operating rules;
- `GOAL.md`;
- `PLAN.md`;
- optionally one small skill/standard/runbook update if directly justified;

Allowed writes:

- KRN reports/plans;
- one small standards, skill, runbook, ADR, or eval-candidate update if
  directly justified by V48.

Forbidden writes:

- target repo edits;
- broad course indexing;
- copying paid/proprietary course material into KRN;
- broad quality scanner or audit subsystem;
- broad source rewrite;
- product-ready/V02-01 overclaim;
- dashboard/API/MCP/worker/new eval platform.

Output requirements:

- a permanent per-slice pattern-intake rule;
- source categories and trust tiers;
- consumer routing: standard / skill / ADR / eval / memory-source candidate /
  CLI behavior / CI check / bounded repair / reject;
- falsifier rule for pattern misuse;
- context-condensation rule so research does not become active-context sludge;
- one chosen durable consumer or explicit rejection;
- proof/non-proof boundaries.

Definition of Done: V48 creates a usable gate for continuous pattern
condensation across future KRN slices without source hoarding.

Verification commands:

```sh
git status --short --branch
git diff --check
```

If source or skill files change:

```sh
pnpm typecheck
pnpm test
git diff --check
```

Acceptance criteria:

- no broad source archive;
- no target writes;
- no product-ready or V02-01 overclaim;
- next active task is explicit.

## 13. Generated Task Backlog

Codex must append here whenever evidence creates new work. Do not execute backlog items until they are promoted to `Active Task Queue`.

Template:

```txt
### <ID> — <Name>
Status: proposed
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
```

Seed backlog:

### V06-00 — Activation / Owner-File Recall Below Target Roots

Status: promoted to active on 2026-06-27

Goal: Improve or re-gate target owner-file recall below named source roots after target-aware evidence capture is stable.

Product rationale: Superior KRN must reduce manual target file discovery, not merely show high-level source roots.

Architectural rationale: Activation is admission control; owner-file recall should be typed/read-model based before any scoring rewrite.

Evidence source: V03/V04 owner-file recall limits and V05 target evidence.

Official/external sources: KRN context supply chain doctrine; Codex Goals evidence-based completion.

Inputs required: V05 re-gate, current activation/read-model code, target fixture.

Files likely touched: activation/read-model code, tests, reports.

Allowed writes: KRN source/tests/reports only.

Forbidden writes: broad activation scoring rewrite without repeated miss evidence.

Output requirements: exact owner-file candidate or typed abstain reason.

Definition of Done: target planning exposes file-level candidates or explicit missing-read-model reason.

Verification commands: `pnpm typecheck`, `pnpm test`, relevant DB/activation smoke, `git diff --check`.

Acceptance criteria: improvement measured by a controlled scenario.

Risk: overfitting to fixture. Mitigation: proof/non-proof section.

Rollback: focused revert.

Condensation expectation: guard if behavior is accepted.

Next-task synthesis rule: if successful, append memory/source usefulness task.

### V07-00 — Target Memory/Source Usefulness Loop

Status: proposed

Goal: Prove one target-aware memory/source candidate can be reviewed, activated later, and marked helped/stale without automatic mutation.

Product rationale: The brain must learn from target work.

Architectural rationale: Memory/source feedback loops must remain reviewed and source-grounded.

Evidence source: V05/V06 target scenario output.

Official/external sources: agent improvement loop; KRN memory doctrine.

Inputs required: stable target evidence and activation behavior.

Files likely touched: memory/source/harness tests, reports.

Allowed writes: KRN source/tests/reports only.

Forbidden writes: auto-promotion or runtime markdown memory.

Output requirements: reviewed candidate path and later activation proof.

Definition of Done: one candidate has review decision and later feedback classification.

Verification commands: `pnpm typecheck`, `pnpm test`, `pnpm db:smoke:memory-governance`, `git diff --check`.

Acceptance criteria: useful/stale feedback is visible and does not mutate memory automatically.

Risk: fake usefulness. Mitigation: require proof/non-proof and reviewer burden notes.

Rollback: focused revert/report correction.

Condensation expectation: guard or GoldenTask only if behavior is real.

Next-task synthesis rule: if successful, append skill/guard integration task.

### V08-00 — Skill-First Workflow Expansion Gate

Status: proposed

Goal: Decide whether to add `source-to-decision` or `controlled-scenario` as a small repo skill after V05-V07 evidence.

Product rationale: KRN should compress repeated workflows into reusable surfaces.

Architectural rationale: Skills are preferred before MCP/hooks/subagents when the workflow is local and repeatable.

Evidence source: repeated report/runbook friction.

Official/external sources: Codex Skills progressive disclosure and AGENTS guidance.

Inputs required: evidence of repeated manual workflow.

Files likely touched: `.agents/skills/*/SKILL.md`, tests/guards, reports.

Allowed writes: at most one new skill unless evidence justifies two.

Forbidden writes: skill zoo, generic marketing skill, stack-specific agent.

Output requirements: skill with trigger/purpose/inputs/outputs/forbidden/verification/removal condition.

Definition of Done: scenario proves the skill reduces ambiguity or repeated explanation.

Verification commands: `pnpm typecheck`, `pnpm test`, skill-specific guard, `git diff --check`.

Acceptance criteria: skill is small and invoked by real evidence.

Risk: skill bloat. Mitigation: line-count and removal condition.

Rollback: delete skill and report rejection.

Condensation expectation: accepted skill or rejected candidate.

Next-task synthesis rule: if skill accepted, append hook/MCP/subagent screening only if repeated bottleneck remains.

## 14. Verification Matrix

Use the narrowest relevant verification. Do not skip verification because a task is “only docs” if it changes active plans or skill instructions.

Always for source changes:

```sh
pnpm typecheck
pnpm test
git diff --check
```

For DB-related changes:

```sh
pnpm db:ready
pnpm db:smoke
pnpm --filter @krn/db db:check
```

For evidence/readback/brain guards:

```sh
pnpm eval:brain-battle:smoke
pnpm eval:promptfoo:smoke
```

For CLI-specific changes:

```sh
pnpm --filter @krn/cli test -- <relevant pattern>
pnpm krn doctor
```

Before commit:

```sh
git diff --check
git status --short
git diff --stat
git diff -- <touched-files>
```

After commit/push:

```sh
gh run list --branch main --limit 5
gh run watch <run-id> --exit-status
```

If `gh` is unavailable, record the limitation and use connector/remote evidence when possible.

## 15. Progress

Update continuously.

Initial entry:

```txt
- [x] V05-00 complete: reconciled completed V04 goal into continuous
  `PLANS.md`-driven V05+ goal.
- [x] V05-01 complete: target evidence capture current-state investigation
  confirmed the code/readback gap and selected minimal metadata-backed repair.
- [x] V05-02 complete: minimal target-aware evidence capture/readback repair
  implemented with explicit CLI inputs, metadata persistence, readback, and tests.
- [x] V05-03 complete: deterministic golden guard/replay scenario added for
  target-aware evidence capture.
- [x] V05-04 complete: target-aware evidence re-gate selected V06.
- [x] V06-00 complete: target owner-file recall now reports typed
  `owner_files_available` or `missing_owner_file_read_model` assessment in plan
  output and metadata.
- [x] V07-00 complete: current-shell target harness smoke proved memory
  usefulness readback and identified source usefulness as lineage-only.
- [x] V07-01 complete: source decision candidates are now visible in feedback
  proposal summary and run readback.
- [x] V07-02 complete: V07 re-gate accepted V08 skill-first workflow expansion.
- [x] V08-00 complete: refined existing `handoff-compact` skill for continuous
  `PLANS.md` resume state and rejected new skill/hook/MCP/subagent work now.
- [x] V09-00 complete: runtime hooks rejected/deferred; hook projection-first
  boundary preserved.
- [x] V10-00 complete: MCP server and new subagent framework rejected/deferred;
  existing `ts-type-critic` remains read-only/proposal-only.
- [x] V11-00 complete: product readiness re-gate kept KRN controlled-internal-alpha
  stronger, not widened-alpha, not product-ready.
- [x] V12-00 complete: second-operator packet refreshed with V12 intake, trial
  modes, transcript schema, failure taxonomy, and evidence checklist.
- [x] V13-00 complete: source-to-decision skill refined with research intake
  rules and consumer boundaries.
- [x] V14-00 complete: TypeScript standard repaired to remove missing audit
  authority and describe targeted boundary verification.
- [x] V15-00 complete: Promptfoo kept as smoke/result adapter; golden behavior
  tests kept as behavior proof authority.
- [x] V16-00 complete: activation scoring rewrite rejected; target owner-file
  read-model completeness accepted as next blocker.
- [x] V17-00 complete: `krn init --owner-file` now provides an explicit
  owner-file read-model contract without source crawler or scoring rewrite.
- [x] V18-00 complete: owner-file contract works in target fixture, exact
  owner-file task selects `tests/readiness.test.ts`, and dry-run next command
  preserves owner-file flags.
- [x] V19-00 complete: readiness remains controlled-internal-alpha stronger;
  widened alpha/product-ready/V02-01 remain unproven; V20 real target
  observation-only trial accepted.
- [x] V20-00 complete: real target observation-only owner-file trial succeeded
  on `krn-elektroinstal-ogar` without target writes; V21 target evidence
  defaults/readback repair accepted.
- [x] V21-00 complete: observation-only target evidence now defaults safe write
  boundaries and run readback list clarity improved.
- [x] V22-00 complete: missing DB config errors now include copyable recovery
  guidance without silent direct-CLI DB defaulting.
- [x] V23-00 complete: real target rerun proved observation-only target
  evidence defaults persist without explicit forbidden-write flags.
- [x] V24-00 complete: explicit target owner files now outrank covered source
  seeds and adjacent agent guidance in owner-file-heavy target planning.
- [x] V25-00 complete: real target rerun proved repaired owner-file priority,
  observation-only target evidence defaults, and target clean state.
- [x] V26-00 complete: CLI accepts run/run-id aliases for evidence/observe and
  explicit `--target-changed-file none`.
- [x] V27-00 complete: controlled-internal-alpha remains stronger; V02-01 and
  product-ready remain unproved.
- [x] V28-00 complete: research-to-brain trial mapped Codex/TypeScript sources
  into durable source decisions and rejected research subsystem expansion.
- [x] V29-00 complete: TypeScript boundary spot-check found no source repair
  candidate; production JSON parsing already follows unknown-first narrowing.
- [x] V30-00 complete: Codex surface gate repaired root `PLAN.md`
  context-budget drift and kept skills/AGENTS unchanged.
- [x] V31-00 complete: readiness remains controlled-internal-alpha stronger;
  V32 controlled target repair trial accepted as the next product proof.
- [x] V32-00 complete: controlled target repair trial succeeded as governed
  headless repair, but exposed reused-project owner-file refresh/selection gap.
- [x] V33-00 complete: reused-project owner-file refresh now creates a fresh
  ProjectKernel snapshot when metadata changes and planning treats latest
  kernel owner files as the active snapshot.
- [x] V34-00 complete: re-gate kept readiness at controlled-internal-alpha
  stronger and promoted target patch handoff as the next blocker.
- [x] V35-00 complete: target patch handoff packet and KRN-side patch artifact
  created without target writes/commit/revert.
- [x] V36-00 complete: re-gate rejected same-target repair while the target FAQ
  patch remains handed off but unresolved, and promoted target patch lifecycle
  rule condensation.
- [x] V37-00 complete: target patch lifecycle states and
  `handed_off_unresolved` stop condition added to the target-repo workflow
  skill/runbook.
- [x] V38-00 complete: selected clean `wilq-seo` as next target path and
  promoted observation-only baseline before any repair.
- [x] V39-00 complete: WILQ baseline found target became dirty before use,
  rejected immediate repair, and promoted target selection freshness rule.
- [x] V40-00 complete: target status freshness states added to target workflow
  guidance and stale clean-state assumptions forbidden.
- [x] V41-00 complete: WILQ is clean again at fresh status check, elektroinstal
  remains blocked by unresolved patch lifecycle, and V42 was promoted.
- [x] V42-00 complete: WILQ was dirty again at task start, so the baseline
  stopped and target stability window gate was promoted.
- [x] V43-00 complete: live target trials paused, target evidence
  lifecycle/freshness source gap identified, and V44 internal hardening
  promoted.
- [x] V44-00 complete: target lifecycle/freshness fields are typed target
  evidence and round-trip through CLI capture/readback without DB migration.
- [x] V45-00 complete: fresh target availability was re-gated with typed
  lifecycle evidence; no safe headless repair target is available right now.
- [x] V46-00 complete: target owner/stability coordination packet created.
- [ ] V47-00 active: Internal Hardening Re-Gate After Target Coordination.
```

## 16. Surprises & Discoveries

Record every unexpected fact in this format:

```txt
- Discovery: <fact>
  Evidence: <file/command/report>
  Impact: <how this changes task choice>
  Date/Author: <date / Codex>
```

```txt
- Discovery: EvidenceBundle persistence can carry first target evidence through existing JSON metadata, but no typed target evidence/readback surface exists.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-target-aware-evidence-current-state/REPORT.md`; `packages/db/src/schema/harness.ts`; `packages/cli/src/runRunShowCommand.ts`.
  Impact: V05-02 should avoid a DB migration and focus on typed metadata helpers, CLI inputs, capture rendering, and readback rendering.
  Date/Author: 2026-06-27 / Codex

- Discovery: Target-aware evidence capture preview caught a missing intended-file entry while target evidence was present.
  Evidence: first V05-02 preview capture classified `packages/cli/src/parseArgs.ts` as unrelated; second preview capture marked it intended after explicit `--intended-file`.
  Impact: target evidence did not weaken existing KRN dirty-context review-burden behavior.
  Date/Author: 2026-06-27 / Codex

- Discovery: Owner-file recall already surfaced exact target owner files when
  `ownerFiles` existed, but missing owner-file read-model state was only prose in
  plan output.
  Evidence: `packages/harness/src/activation/ownerFileRecall.ts`;
  `packages/cli/src/runPlanCommand.ts`; V06 report.
  Impact: V06-00 should add typed assessment/readback before any scoring rewrite.
  Date/Author: 2026-06-27 / Codex

- Discovery: Reused target project init/connect can print newly supplied
  owner-file inputs while subsequent planning still selects older/stale owner
  files.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-v32-controlled-target-repair/REPORT.md`;
  V32 run `e6c68ed8-4c90-436c-bb33-7673f7ed683b`.
  Impact: V33 should inspect/repair owner-file refresh/read-model state before
  any activation scoring rewrite or target source crawler.
  Date/Author: 2026-06-27 / Codex

- Discovery: Latest ProjectKernel metadata is the correct owner-file snapshot
  boundary for reused project planning; repo installation owner files should be
  fallback only.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-v33-reused-project-owner-file-refresh/REPORT.md`;
  replay run `cea1450b-07c2-4d4c-b190-331a242b47e8`.
  Impact: V33 repaired read-model freshness without activation scoring rewrite
  or source crawler.
  Date/Author: 2026-06-27 / Codex

- Discovery: Current target harness smoke proves memory usefulness but source
  usefulness remains source-lineage support, not first-class selected/used/helped
  feedback.
  Evidence: `pnpm db:smoke:target-repo-harness`;
  `docs/reviews/controlled-dogfood/2026-06-27-v07-memory-source-usefulness/REPORT.md`.
  Impact: V07 should continue with source usefulness application/readback before
  moving to skill/research expansion.
  Date/Author: 2026-06-27 / Codex

- Discovery: Source decision candidates already existed in
  `FeedbackDelta.sourceDecisions`, but proposal summary/readback omitted them
  from candidate counts.
  Evidence: `packages/core/src/feedbackDelta.ts`;
  `packages/cli/src/runRunShowCommand.ts`;
  `docs/reviews/controlled-dogfood/2026-06-27-v07-source-usefulness-readback/REPORT.md`.
  Impact: V07-01 could repair source usefulness visibility without a new
  persistence model.
  Date/Author: 2026-06-27 / Codex

- Discovery: V07 memory/source usefulness no longer blocks skill-first workflow
  expansion, but source helped/stale outcome feedback remains unproven.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-v07-memory-source-re-gate/REPORT.md`.
  Impact: V08 can start as a bounded skill gate; do not build hooks/MCP/subagents
  yet.
  Date/Author: 2026-06-27 / Codex

- Discovery: `handoff-compact` already owns continuation after compaction, but
  did not explicitly require active stream/task or verified commit/push/CI
  state.
  Evidence: `.agents/skills/handoff-compact/SKILL.md`; `GOAL.md`;
  `docs/reviews/controlled-dogfood/2026-06-27-v08-skill-first-workflow-gate/REPORT.md`.
  Impact: V08 should refine the existing skill instead of creating a new
  continuous-goal skill.
  Date/Author: 2026-06-27 / Codex

- Discovery: KRN has hook expectation projections and hook policy ADRs, but no
  repo-local `.codex/hooks` runtime surface and no repeated post-V08 mechanical
  failure that survived skills/tests/projections.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-v09-hooks-candidate-decision/REPORT.md`;
  `docs/decisions/ADR-0022-policy-hooks-boundary.md`;
  `packages/codex-adapter/src/renderHookExpectations.ts`.
  Impact: V09 should reject/defer hook implementation and move to V10 MCP /
  subagent candidate screening.
  Date/Author: 2026-06-27 / Codex

- Discovery: Current KRN product questions are still served by CLI/files/DB
  readback, reports, skills, and one narrow read-only custom agent; no V10
  evidence proves a need for KRN MCP server or new subagent framework.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-v10-mcp-subagent-candidate-gate/REPORT.md`;
  `docs/decisions/ADR-0023-read-only-run-readback-boundary.md`;
  `.codex/agents/ts-type-critic.toml`.
  Impact: V10 should reject/defer MCP/subagent implementation and move to V11
  product readiness re-gate.
  Date/Author: 2026-06-27 / Codex

- Discovery: `TargetActivationReadModel.ownerFiles` had fixture and metadata
  support, but `krn init --connect` had no operator-facing input for exact
  owner files.
  Evidence: `packages/cli/src/runInitCommand.ts`;
  `packages/cli/src/runPlanCommand.ts`;
  `docs/reviews/controlled-dogfood/2026-06-27-v17-target-owner-file-read-model-contract/REPORT.md`.
  Impact: V17 repaired init/connect with explicit `--owner-file` input instead
  of adding crawler inference or activation scoring changes.
  Date/Author: 2026-06-27 / Codex

- Discovery: `krn init --dry-run` showed owner-file proposals but omitted
  `--owner-file` flags from its generated `Next command`.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-v18-target-owner-file-contract-regate/REPORT.md`;
  `packages/cli/src/runInitCommand.ts`; `packages/cli/src/runCli.test.ts`.
  Impact: V18 repaired the dry-run next command so operators do not lose
  owner-file inputs when copying the connect command.
  Date/Author: 2026-06-27 / Codex

- Discovery: After V17/V18, the immediate owner-file contract blocker is gone,
  but all proof is still local/fixture or self-operated.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-v19-product-readiness-after-owner-file-contract/REPORT.md`.
  Impact: V20 should use a real target checkout in observation-only mode instead
  of adding another fixture or product surface.
  Date/Author: 2026-06-27 / Codex

- Discovery: Real target owner-file recall works on `krn-elektroinstal-ogar`
  when explicit owner files are provided.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-v20-real-target-observation-only-owner-file-trial/REPORT.md`;
  DB-backed run `dd69eb5a-8552-46d1-89fc-4a7617acb59c`.
  Impact: the next blocker is not target selection for this proof; it is target
  evidence ergonomics and safety-boundary readback clarity.
  Date/Author: 2026-06-27 / Codex

- Discovery: `--target-mode observation-only` can still read back
  `forbiddenWrites: none` unless the operator supplies explicit
  `--target-forbidden-write` flags.
  Evidence: V20 first evidence bundle
  `8f3a0c8f-24a0-45dc-ae00-5026806ef342` vs corrected bundle
  `7f01243f-cf81-4caa-b819-b4443188177e`.
  Impact: V21 should repair or explicitly reject observation-only target
  evidence defaults/readback behavior before more target trials.
  Date/Author: 2026-06-27 / Codex

- Discovery: Target evidence safety defaults belong in core normalization, not
  CLI rendering only.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-v21-target-evidence-observation-only-defaults/REPORT.md`.
  Impact: V21 repaired observation-only defaults once for capture, persistence,
  and readback instead of adding a separate display-only warning.
  Date/Author: 2026-06-27 / Codex

- Discovery: Missing DB config should not silently default direct persisted CLI
  writes to local Postgres.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-v22-persisted-cli-db-url-recovery/REPORT.md`.
  Impact: V22 repaired operator friction with copyable recovery guidance while
  preserving explicit DB env override and avoiding hidden local writes.
  Date/Author: 2026-06-27 / Codex

- Discovery: V21 target evidence defaults work in a real persisted target
  workflow.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-v23-real-target-rerun-after-ergonomics/REPORT.md`;
  evidence bundle `42d6853a-367a-4dfc-993e-10457f0751cb`.
  Impact: target safety evidence defaults are no longer only unit/golden proof.
  Date/Author: 2026-06-27 / Codex

- Discovery: target owner-file recall is useful but can spend budget on
  adjacent/duplicate agent guidance before all direct owner files are included.
  Evidence: V23 plan output for run
  `43e08455-6123-465b-990b-5d7abaf842b3`.
  Impact: V24 should inspect owner-file candidate assembly/deduplication before
  any broad activation scoring rewrite.
  Date/Author: 2026-06-27 / Codex
```

## 17. Decision Log

Record every decision in this format:

```txt
- Decision: <decision>
  Rationale: <why>
  Evidence: <files/commands/sources>
  Does not prove: <boundary>
  Falsifier: <what would reverse this>
  Date/Author: <date / Codex>
```

Initial decisions:

```txt
- Decision: Start V05 with target-aware evidence capture repair.
  Rationale: V04 final re-gate named it as the next best bounded product gap.
  Evidence: V04 internal brain usefulness report.
  Does not prove: product readiness or second-operator usability.
  Falsifier: V05-01 proves current evidence capture already handles target state clearly.
  Date/Author: 2026-06-27 / planner

- Decision: Use root `PLANS.md` as the continuous long-run plan.
  Rationale: the new objective explicitly asks root `PLAN.md` to stay compact
  and `PLANS.md` to hold the detailed long-run execution plan.
  Evidence: new goal objective; root `GOAL.md`; root `PLAN.md`; root `PLANS.md`.
  Does not prove: V05 target-aware evidence capture is implemented.
  Falsifier: future repo convention moves long-run ExecPlans back under
  `docs/plans/**`.
  Date/Author: 2026-06-27 / Codex

- Decision: Keep MCP, hooks, and subagents deferred.
  Rationale: V04 compression screening found no repeated scenario requiring those surfaces yet.
  Evidence: V04 compression screening report and Codex surface docs.
  Does not prove: KRN will never need them.
  Falsifier: repeated scenario needs live external state, deterministic enforcement, or parallel read-heavy roles.
  Date/Author: 2026-06-27 / planner

- Decision: Implement target-aware evidence capture as explicit operator-supplied metadata before any hidden target git runner.
  Rationale: V05-01 found current capture only reads KRN `runtime.cwd`, while target reports need target repo mode, dirty state, ownership, allowed/forbidden writes, and proof/non-proof boundaries. Existing DB metadata can carry the first repair without migration.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-target-aware-evidence-current-state/REPORT.md`; `packages/cli/src/runEvidenceCaptureCommand.ts`; `packages/cli/src/runRunShowCommand.ts`; `docs/runbooks/target-repo-testing.md`.
  Does not prove: automatic target status execution is unnecessary forever, product readiness, or V02-01 usability.
  Falsifier: V05-02 source implementation proves explicit inputs cannot preserve target evidence reliably.
  Date/Author: 2026-06-27 / Codex

- Decision: Close V06 with typed owner-file recall assessment, not an activation
  scoring rewrite.
  Rationale: source inspection showed exact owner-file candidates already work
  when the read model has `ownerFiles`; the live gap was missing-read-model
  visibility and replayability.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-v06-owner-file-recall/REPORT.md`;
  `packages/harness/src/activation/ownerFileRecall.ts`;
  `packages/harness/src/compiler/index.test.ts`;
  `packages/cli/src/runCli.test.ts`.
  Does not prove: owner-file discovery completeness, activation scoring quality,
  or product readiness.
  Falsifier: future DB-backed target run has owner files available but activation
  repeatedly fails to surface them.
  Date/Author: 2026-06-27 / Codex

- Decision: Continue V07 with source usefulness readback instead of moving
  directly to skill/research expansion.
  Rationale: current-shell DB smoke already proves memory helped feedback, while
  SourceClaim remains lineage/support rather than its own usefulness feedback
  path.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-v07-memory-source-usefulness/REPORT.md`;
  `packages/cli/src/targetRepoHarnessSmoke.ts`.
  Does not prove: source usefulness requires a new DB table or subsystem.
  Falsifier: source inspection shows an existing first-class source usefulness
  path already covers selected/used/helped/stale readback.
  Date/Author: 2026-06-27 / Codex

- Decision: Represent source usefulness proposals through existing
  `FeedbackDelta.sourceDecisions` before adding any source application subsystem.
  Rationale: evidence capture already produces source decision candidates; the
  missing piece was summary/readback visibility.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-v07-source-usefulness-readback/REPORT.md`;
  `packages/core/src/feedbackDelta.ts`; `packages/cli/src/runRunShowCommand.ts`.
  Does not prove: helped/stale source application feedback is unnecessary.
  Falsifier: repeated runs need source outcome feedback beyond proposal
  visibility.
  Date/Author: 2026-06-27 / Codex

- Decision: Move from V07 to V08 skill-first workflow expansion gate.
  Rationale: controlled memory usefulness and source decision readback are
  sufficient to stop treating memory/source usefulness as the active blocker.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-v07-memory-source-re-gate/REPORT.md`.
  Does not prove: product readiness, V02-01, or need for hooks/MCP/subagents.
  Falsifier: V08 inspection finds no repeated workflow that should become a
  skill.
  Date/Author: 2026-06-27 / Codex

- Decision: Refine existing `handoff-compact` rather than creating a new skill.
  Rationale: continuation/compaction is repeated and high-risk for the
  continuous goal, and `handoff-compact` is the existing owning surface.
  Evidence: `GOAL.md`; `PLANS.md`; `.agents/skills/handoff-compact/SKILL.md`;
  `docs/reviews/controlled-dogfood/2026-06-27-v08-skill-first-workflow-gate/REPORT.md`.
  Does not prove: hooks, MCP, or subagents are never needed.
  Falsifier: future compact/resume failures persist despite using the refined
  skill.
  Date/Author: 2026-06-27 / Codex

- Decision: Reject/defer runtime hooks in V09.
  Rationale: current candidates are covered by skills, tests, runbooks, or
  adapter projections; no repeated deterministic failure justifies trusted hook
  implementation.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-v09-hooks-candidate-decision/REPORT.md`;
  ADR-0022; V04 compression screening; target repo testing skill guard.
  Does not prove: hooks will never be useful.
  Falsifier: future repeated mechanical violations occur despite current
  guidance and can be blocked by a tiny trusted hook.
  Date/Author: 2026-06-27 / Codex

- Decision: Reject KRN MCP server and new subagent framework in V10.
  Rationale: CLI/files/DB readback and reports cover current product questions;
  subagent evidence supports only the existing read-only `ts-type-critic`.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-v10-mcp-subagent-candidate-gate/REPORT.md`;
  Codex manual MCP/subagent sections; ADR-0023; `.codex/agents/ts-type-critic.toml`.
  Does not prove: MCP/subagents will never be useful.
  Falsifier: repeated scenarios need live typed resources or parallel read-heavy
  roles with stable output contracts.
  Date/Author: 2026-06-27 / Codex

- Decision: Implement explicit `krn init --owner-file` instead of a target
  source crawler or activation scoring rewrite.
  Rationale: V17 found `ownerFiles` were already consumed from metadata, but
  normal init/connect had no operator-facing input path. Explicit input keeps
  owner-file recall honest and bounded.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-v17-target-owner-file-read-model-contract/REPORT.md`;
  `packages/cli/src/runInitCommand.ts`; `packages/cli/src/runPlanCommand.ts`;
  live init/connect/plan replay.
  Does not prove: owner-file completeness, activation product quality, or
  second-operator usability.
  Falsifier: future target trials provide owner files through init but planning
  still reports `missing_owner_file_read_model` or operators cannot use the
  contract from checked-in docs.
  Date/Author: 2026-06-27 / Codex

- Decision: Re-gate product readiness after V18 instead of starting another
  local substitute.
  Rationale: V18 proved the owner-file contract in a target fixture and fixed
  one operator-friction issue; the next honest question is claim boundary and
  readiness, not more local confidence.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-v18-target-owner-file-contract-regate/REPORT.md`.
  Does not prove: widened alpha, V02-01, product readiness, or arbitrary target
  owner-file completeness.
  Falsifier: V19 finds a concrete local repair still blocks real operator or
  real target execution.
  Date/Author: 2026-06-27 / Codex

- Decision: Keep readiness at controlled-internal-alpha and move to real target
  observation-only evidence.
  Rationale: owner-file contract work strengthened target readiness, but did
  not produce real operator or real target proof.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-v19-product-readiness-after-owner-file-contract/REPORT.md`;
  latest green CI on `main`.
  Does not prove: widened alpha, V02-01, product readiness, or arbitrary target
  owner-file quality.
  Falsifier: V20 cannot identify a safe real target checkout; then the blocker
  becomes target selection/intake.
  Date/Author: 2026-06-27 / Codex

- Decision: Promote target evidence observation-only defaults/readback clarity
  as V21.
  Rationale: V20 proved a real target observation-only trial can work, but also
  showed a safety evidence footgun: omitted forbidden-write flags make readback
  say `forbiddenWrites: none` despite observation-only mode.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-v20-real-target-observation-only-owner-file-trial/REPORT.md`.
  Does not prove: source repair shape, product readiness, V02-01, or activation
  quality.
  Falsifier: V21 source inspection proves current behavior is already
  intentionally sufficient and better documented than changing defaults.
  Date/Author: 2026-06-27 / Codex

- Decision: Promote persisted CLI DB URL default consistency as V22.
  Rationale: after target evidence safety defaults were repaired, the next
  observed operator-friction gap is inconsistent DB URL handling between
  `pnpm db:ready` and persisted CLI commands.
  Evidence: V20 report and V21 report.
  Does not prove: the correct fix shape, DB schema needs, or product readiness.
  Falsifier: V22 source inspection proves the explicit env requirement is
  intentional and already accompanied by exact operator remediation.
  Date/Author: 2026-06-27 / Codex

- Decision: Promote real target observation rerun after V21/V22 repairs as V23.
  Rationale: target evidence defaults and DB recovery guidance should be proven
  in the target workflow before adding more source repairs.
  Evidence: V20, V21, and V22 reports.
  Does not prove: V02-01, product readiness, or real operator usability.
  Falsifier: V23 cannot find a safe real target checkout or the target becomes
  actively dirty in a way that prevents observation-only proof.
  Date/Author: 2026-06-27 / Codex

- Decision: Promote owner-file recall deduplication/budget priority as V24.
  Rationale: after V23, the next observed gap is not evidence or DB ergonomics
  but direct owner-file inclusion precision.
  Evidence: V23 report and plan output.
  Does not prove: broad activation scoring is wrong or source crawling is
  needed.
  Falsifier: V24 source inspection proves owner-file/source-seed behavior is
  already intentionally prioritized and V23 was a task-specific acceptable
  tradeoff.
  Date/Author: 2026-06-27 / Codex

- Decision: Promote real target observation rerun after owner-file priority
    repair as V25.
  Rationale: V24 repaired source behavior and target plan replay, but the next
    product proof should exercise the full real target observation-only loop
    after the repair.
  Evidence: V24 report and DB-backed target plan replay
    `12318455-bfa6-4838-a168-5866f0e5dfbd`.
  Does not prove: V02-01, product readiness, widened alpha, or full target
    runtime correctness.
  Falsifier: V25 cannot run safely without target writes or the target checkout
    is dirty in a way that prevents observation-only proof.
  Date/Author: 2026-06-27 / Codex

- Decision: Promote CLI run reference and empty target changed-files ergonomics
    as V26.
  Rationale: V24/V25 both exposed small CLI friction in otherwise successful
    dogfood loops; fixing tiny adapter friction reduces operator burden without
    changing brain semantics.
  Evidence: V24 `observe --run-id` failure and V25 `--target-changed-file none`
    failure.
  Does not prove: evidence semantics are wrong, DB schema needs migration, or
    activation needs scoring changes.
  Falsifier: source inspection proves aliases would create ambiguity or current
    help already documents the intended spelling clearly enough.
  Date/Author: 2026-06-27 / Codex

- Decision: Promote controlled internal alpha re-gate after target loop repairs
    as V27.
  Rationale: after V20-V26, the target loop has enough evidence to make a
    readiness/next-task decision instead of continuing source repairs by
    inertia.
  Evidence: V20 through V26 reports and CI.
  Does not prove: product readiness or V02-01 second-operator usability.
  Falsifier: V27 finds an unclosed blocking implementation bug that prevents
    honest re-gating.
  Date/Author: 2026-06-27 / Codex

- Decision: Promote research-to-brain TypeScript/Codex decision trial as V28.
  Rationale: after target-loop repairs, the next self-improving capability is
    controlled knowledge condensation from strong external/practitioner sources
    into KRN decisions and falsifiers.
  Evidence: V27 report and user direction.
  Does not prove: a crawler, Research Foundry, or broad eval platform is needed.
  Falsifier: source review produces no concrete KRN decision or durable surface
    update.
  Date/Author: 2026-06-27 / Codex

- Decision: Promote TypeScript boundary research application gate as V29.
  Rationale: V28 accepted TypeScript source decisions mostly by confirming
    existing standards; the next proof should apply those decisions to current
    source evidence without recreating `krn audit`.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-v28-research-to-brain-typescript-codex/REPORT.md`;
    `docs/KRN_SOURCES.md`; `docs/standards/typescript-excellence.md`;
    `docs/standards/typescript-boundaries.md`.
  Does not prove: a broad cleanup/refactor, global `ts-reset`, or quality
    scanner is needed.
  Falsifier: V29 spot-check finds no boundary findings needing action or finds
    that existing tests/standards already cover the relevant risks.
  Date/Author: 2026-06-27 / Codex

- Decision: Promote Codex surface context-budget application gate as V30.
  Rationale: V28 accepted both TypeScript boundary decisions and Codex surface
    decisions; V29 applied the TypeScript half, so the next bounded proof should
    apply the Codex surface half to current instructions and skills.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-v29-typescript-boundary-research-application/REPORT.md`;
    `docs/reviews/controlled-dogfood/2026-06-27-v28-research-to-brain-typescript-codex/REPORT.md`;
    `docs/KRN_SOURCES.md`.
  Does not prove: a new skill, hook, MCP server, subagent framework, or AGENTS
    expansion is needed.
  Falsifier: V30 finds current surfaces are already compact, focused, and
    triggerable enough.
  Date/Author: 2026-06-27 / Codex

- Decision: Promote product readiness re-gate after research and surface
    hygiene as V31.
  Rationale: V28-V30 completed a research/context-hygiene loop; the next
    product move should be a readiness and next-task decision, not another
    meta-surface cleanup by inertia.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-v30-codex-surface-context-budget/REPORT.md`;
    V27-V29 reports; current green CI.
  Does not prove: product readiness, V02-01, widened alpha, or a new
    implementation stream.
  Falsifier: V31 finds a concrete blocking source bug that must be repaired
    before any readiness decision.
  Date/Author: 2026-06-27 / Codex

- Decision: Promote controlled target repair trial as V32.
  Rationale: V31 found KRN remains controlled-internal-alpha stronger, but the
    last real target loops were observation-only; the next product proof should
    test one bounded target change with explicit allowed writes and rollback.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-v31-product-readiness-regate-after-research-surface/REPORT.md`;
    V20-V26 target loop reports; current green CI.
  Does not prove: product readiness, V02-01, widened alpha, or arbitrary target
    repair safety.
  Falsifier: V32 cannot identify a safe target checkout/task, or the trial
    shows KRN cannot preserve scope/rollback/evidence during a target repair.
  Date/Author: 2026-06-27 / Codex

- Decision: Promote reused project owner-file refresh repair as V33.
  Rationale: V32 proved the target repair workflow, but the DB-backed plan
    omitted the two exact FAQ owner files supplied through init/connect for the
    reused target project and selected older/stale owner files instead.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-v32-controlled-target-repair/REPORT.md`;
    V32 run `e6c68ed8-4c90-436c-bb33-7673f7ed683b`.
  Does not prove: activation scoring is broadly wrong, source crawling is
    needed, or product-ready/widened-alpha/V02-01 is achieved.
  Falsifier: V33 source inspection proves the V32 owner-file miss came from
    operator input misuse rather than reused-project read-model refresh.
  Date/Author: 2026-06-27 / Codex

- Decision: Promote target repair re-gate after owner-file refresh as V34.
  Rationale: V33 repaired the immediate reused-project owner-file refresh gap;
    the next product decision should account for the dirty V32 target patch and
    readiness boundaries before another implementation task.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-v33-reused-project-owner-file-refresh/REPORT.md`;
    V33 replay run `cea1450b-07c2-4d4c-b190-331a242b47e8`.
  Does not prove: product readiness, V02-01, widened alpha, or full target
    runtime correctness.
  Falsifier: V34 finds an unclosed blocking source bug that must be repaired
    before any readiness/patch-handoff decision.
  Date/Author: 2026-06-27 / Codex

- Decision: Promote target patch handoff packet as V35.
  Rationale: V34 found the target repo still has the V32 patch dirty and
    uncommitted. KRN must not silently commit, revert, or forget target dirty
    state before another target repair.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-v34-target-repair-regate-after-owner-file-refresh/REPORT.md`;
    target `git status --short --branch`.
  Does not prove: target owner accepted the patch, V02-01 is complete, product
    readiness is achieved, or another target repair is safe before handoff.
  Falsifier: V35 shows the target patch has already been resolved by the target
    owner before handoff is needed.
  Date/Author: 2026-06-27 / Codex

- Decision: Promote target patch handoff re-gate as V36.
  Rationale: V35 made the target patch explicit but did not resolve target owner
    acceptance or target repo dirty state. KRN should decide the next product
    step from that evidence before touching another target.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-v35-target-patch-handoff/REPORT.md`;
    `docs/reviews/controlled-dogfood/2026-06-27-v35-target-patch-handoff/FAQ_ARIA_PATCH.diff`.
  Does not prove: target owner accepted the patch, V02-01 is complete, or
    product readiness is achieved.
  Falsifier: V36 finds target owner/operator has already resolved the patch and
    a new bounded target proof is safe.
  Date/Author: 2026-06-27 / Codex

- Decision: Promote target patch lifecycle rule condensation as V37.
  Rationale: V36 found the target FAQ patch remains handed off but unresolved.
    KRN must not start another repair in the same dirty target, and this rule
    should live in the reusable target-repo workflow surface rather than chat
    memory.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-v36-target-patch-handoff-regate/REPORT.md`;
    target `git status --short --branch`; KRN CI `28289750736`.
  Does not prove: target owner accepted the patch, product readiness is
    achieved, V02-01 is complete, or a new target repair is safe in the same
    unresolved target.
  Falsifier: V37 finds the existing skill/runbook already fully prevents
    same-target repair with handed-off unresolved patches.
  Date/Author: 2026-06-27 / Codex

- Decision: Promote clean target selection gate as V38.
  Rationale: V37 encoded the lifecycle rule, but the current target FAQ patch
    remains `handed_off_unresolved`. The next proof must either select a clean
    target path or explicitly record target owner/operator action as the honest
    blocker.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-v37-target-patch-lifecycle-rule/REPORT.md`;
    `.agents/skills/target-repo-testing/SKILL.md`;
    `docs/runbooks/target-repo-testing.md`.
  Does not prove: another target is safe, product readiness is achieved,
    widened alpha is ready, or V02-01 is complete.
  Falsifier: V38 finds no clean/safe target path and no real second-operator
    inputs, in which case the honest result is a blocker/handoff rather than a
    substitute proof.
  Date/Author: 2026-06-27 / Codex

- Decision: Promote WILQ clean target observation-only baseline as V39.
  Rationale: V38 found `wilq-seo` is the only clearly clean/synced non-KRN
    target under `active/`. The next step should inspect it in observation-only
    mode before any target repair.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-v38-clean-target-selection-gate/REPORT.md`;
    `wilq-seo` `git status --short --branch`; `wilq-seo` README/AGENTS/package
    scripts.
  Does not prove: WILQ repair scope is safe, target commands pass, V02-01 is
    complete, or product readiness is achieved.
  Falsifier: V39 finds WILQ target context is unsafe for further KRN work or
    becomes dirty/active before the baseline completes.
  Date/Author: 2026-06-27 / Codex

- Decision: Promote target selection freshness rule condensation as V40.
  Rationale: V39 found `wilq-seo` changed from clean at selection time to dirty
    at baseline time. Clean target selection is not durable evidence and must be
    revalidated immediately before use.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-v38-clean-target-selection-gate/REPORT.md`;
    `docs/reviews/controlled-dogfood/2026-06-27-v39-wilq-observation-baseline/REPORT.md`;
    `wilq-seo` `git status --short --branch`.
  Does not prove: WILQ is unsafe as a product, target owner caused the changes,
    product readiness is achieved, or V02-01 is complete.
  Falsifier: V40 finds the existing skill/runbook already states clean target
    selection expires and must be revalidated before use.
  Date/Author: 2026-06-27 / Codex

- Decision: Promote target trial availability re-gate as V41.
  Rationale: V40 completed the freshness rule, but the current target evidence
    now says `krn-elektroinstal-ogar` is blocked by unresolved patch ownership
    and `wilq-seo` became dirty before baseline. KRN needs a product direction
    gate before more target work.
  Evidence: V36-V40 reports and target workflow rule updates.
  Does not prove: no target can ever be used, product readiness is blocked
    permanently, or V02-01 is complete.
  Falsifier: V41 finds a clean/explicitly writable target state or real
    second-operator input that safely unlocks target work.
  Date/Author: 2026-06-27 / Codex

- Decision: Promote WILQ fresh observation-only baseline retry as V42.
  Rationale: V41 found WILQ is clean again at fresh check time, while
    elektroinstal remains blocked by unresolved patch lifecycle. The safe next
    target step is a fresh observation-only baseline, not repair.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-v41-target-trial-availability-regate/REPORT.md`;
    WILQ and elektroinstal `git status --short --branch`; KRN CI `28290281793`.
  Does not prove: WILQ will remain clean at V42 start, WILQ repair is safe,
    V02-01 is complete, or product readiness is achieved.
  Falsifier: V42 start status finds WILQ dirty again.
  Date/Author: 2026-06-27 / Codex

- Decision: Promote target stability window gate as V43.
  Rationale: V42 found WILQ dirty again at task start. Together with the
    unresolved elektroinstal patch, this means current target work needs a
    stability/owner-coordination gate before more target trials.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-v42-wilq-baseline-retry-stop/REPORT.md`;
    fresh target statuses.
  Does not prove: target work should stop forever, product readiness is blocked
    permanently, or V02-01 is complete.
  Falsifier: V43 receives explicit stable target window, dirty-state permission,
    or real second-operator inputs.
  Date/Author: 2026-06-27 / Codex

- Decision: Promote target evidence lifecycle and freshness fields as V44.
  Rationale: V43 paused live target trials and found the new workflow-required
    target lifecycle/freshness state is still prose-only. It should round-trip
    through existing target evidence metadata/readback.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-v43-target-stability-window-gate/REPORT.md`;
    `packages/core/src/evidenceBundle.ts`;
    `packages/cli/src/parseEvidenceArgs.ts`;
    target workflow skill/runbook.
  Does not prove: product readiness, target repair safety, V02-01, or that live
    targets are stable.
  Falsifier: V44 source inspection finds target evidence already carries these
    fields through parse/capture/readback.
  Date/Author: 2026-06-27 / Codex

- Decision: Promote target availability re-gate with typed lifecycle evidence
    as V45.
  Rationale: V44 closed the source gap by making lifecycle/freshness first-class
    target evidence. The next product question is whether any live target repo
    is safe for observation or repair under the new evidence model.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-v44-target-evidence-lifecycle-freshness/REPORT.md`;
    focused core/CLI tests.
  Does not prove: target repair safety, target owner acceptance, V02-01, or
    product readiness.
  Falsifier: V45 finds no safe target window and no useful observation-only
    task; then the next task must remain KRN internal hardening or wait for
    operator inputs.
  Date/Author: 2026-06-27 / Codex

- Decision: Promote target owner coordination packet as V46.
  Rationale: V45 used typed lifecycle evidence and found no safe repair target:
    WILQ is dirty/external-context only, elektroinstal is
    `handed_off_unresolved`, and the wider active checkout inventory is
    dirty/noisy. The next unlock requires owner/stability inputs, not another
    local substitute.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-v45-target-availability-regate-typed-evidence/REPORT.md`.
  Does not prove: target work should stop forever, V02-01 is impossible, or
    product readiness.
  Falsifier: operator provides explicit dirty-state write scope, target owner
    patch lifecycle decision, stable clean target window, or real V02-01
    inputs.
  Date/Author: 2026-06-27 / Codex
```

## 18. Evidence Ledger

Append evidence in this format:

```txt
- Evidence ID:
  Source:
  Command/report/file:
  Result:
  Proves:
  Does not prove:
  Follow-up task:
```

Seed evidence:

```txt
- Evidence ID: E-V04-REGATE
  Source: docs/reviews/controlled-dogfood/2026-06-27-v04-internal-brain-usefulness/REPORT.md
  Result: internal brain utility improved; target-aware evidence capture remains unimplemented.
  Proves: V04 loop produced durable surfaces and a next bounded gap.
  Does not prove: product readiness, V02-01, target-aware evidence capture implementation.
  Follow-up task: V05-01.

- Evidence ID: E-V05-00
  Source: root `GOAL.md`, root `PLAN.md`, root `PLANS.md`
  Command/report/file: commit `02c83d2`; CI run `28282925114`.
  Result: committed, pushed, CI passed.
  Proves: active repo state now points to V05 target-aware evidence capture and
    root `PLANS.md` as the detailed continuous ExecPlan.
  Does not prove: V05-01 investigation or V05-02 implementation.
  Follow-up task: V05-01.

- Evidence ID: E-V05-01
  Source: `docs/reviews/controlled-dogfood/2026-06-27-target-aware-evidence-current-state/REPORT.md`
  Command/report/file: V05-01 current-state investigation.
  Result: current evidence capture/readback can persist target facts only as unstructured metadata/prose; no CLI/readback target evidence surface exists.
  Proves: V05-02 should implement minimal target-aware evidence capture/readback.
  Does not prove: V05-02 implementation, product readiness, V02-01 usability, or need for automatic target git execution.
  Follow-up task: V05-02.

- Evidence ID: E-V05-02
  Source: `docs/reviews/controlled-dogfood/2026-06-27-target-aware-evidence-capture-repair/REPORT.md`
  Command/report/file: source diff plus targeted tests, full tests, typecheck, diff check, and CLI preview capture.
  Result: target-aware evidence capture/readback implemented without DB migration or automatic target git execution.
  Proves: explicit target evidence can be captured, rendered, persisted in metadata, and exposed by run readback.
  Does not prove: DB-backed replay in a live run, product readiness, V02-01 usability, target correctness, or target write safety.
  Follow-up task: V05-03.

- Evidence ID: E-V05-03
  Source: `docs/reviews/controlled-dogfood/2026-06-27-target-aware-evidence-replay/REPORT.md`
  Command/report/file: golden fixture, CLI golden behavior test, schema fixture expectation, typecheck, full test suite, brain-battle smoke, diff check.
  Result: target-aware evidence capture is guarded by deterministic real CLI execution.
  Proves: target evidence output cannot disappear without failing the golden guard.
  Does not prove: DB-backed live replay, product readiness, V02-01 usability, target correctness, or target write safety.
  Follow-up task: V05-04.

- Evidence ID: E-V05-04
  Source: `docs/reviews/controlled-dogfood/2026-06-27-v05-target-aware-evidence-re-gate/REPORT.md`
  Command/report/file: V05 re-gate report.
  Result: V05 improved target evidence clarity and selected V06 as next stream.
  Proves: target-aware evidence representation/guard work is sufficient to move to owner-file/context ROI.
  Does not prove: product readiness, V02-01, target correctness, or owner-file recall quality.
  Follow-up task: V06-00.

- Evidence ID: E-V06-00
  Source: `docs/reviews/controlled-dogfood/2026-06-27-v06-owner-file-recall/REPORT.md`
  Command/report/file: V06 source repair, targeted harness/CLI tests.
  Result: target owner-file recall now exposes typed
    `owner_files_available | missing_owner_file_read_model` assessment in plan
    output, execution metadata, and retrieval metadata.
  Proves: target planning can expose exact owner-file availability or explicit
    missing-read-model reason without scoring rewrite.
  Does not prove: owner-file discovery completeness, product readiness, V02-01,
    live DB readback, or activation scoring quality.
  Follow-up task: V07-00.

- Evidence ID: E-V07-00
  Source: `docs/reviews/controlled-dogfood/2026-06-27-v07-memory-source-usefulness/REPORT.md`
  Command/report/file: current-shell `pnpm db:smoke:target-repo-harness`.
  Result: memory included, `MemoryApplication outcome=helped`, usefulness
    readback matched, positive feedback count 1, automatic MemoryRecord mutation
    none, cleanup remaining marker count 0.
  Proves: controlled target-like memory usefulness loop remains working after
    V05/V06.
  Does not prove: product-wide memory usefulness, external target readiness, or
    first-class source usefulness feedback.
  Follow-up task: V07-01.

- Evidence ID: E-V07-01
  Source: `docs/reviews/controlled-dogfood/2026-06-27-v07-source-usefulness-readback/REPORT.md`
  Command/report/file: core feedback summary and run readback source repair.
  Result: source decision candidates now appear as
    `source_decision_candidate` in feedback proposal summary and run readback.
  Proves: existing source decision candidate path can be made reviewable without
    new persistence surface.
  Does not prove: source helped/stale outcome feedback or product readiness.
  Follow-up task: V07-02.

- Evidence ID: E-V07-02
  Source: `docs/reviews/controlled-dogfood/2026-06-27-v07-memory-source-re-gate/REPORT.md`
  Command/report/file: V07 re-gate report.
  Result: V07 accepted V08 skill-first workflow expansion as the next active
    stream.
  Proves: memory/source usefulness is no longer the highest active blocker.
  Does not prove: product readiness, V02-01, or need for hooks/MCP/subagents.
  Follow-up task: V08-00.

- Evidence ID: E-V08-00
  Source: `docs/reviews/controlled-dogfood/2026-06-27-v08-skill-first-workflow-gate/REPORT.md`
  Command/report/file: V08 skill-first workflow gate and
    `.agents/skills/handoff-compact/SKILL.md` refinement.
  Result: existing `handoff-compact` skill now preserves active stream/task and
    verified commit/push/CI state for continuous `PLANS.md` goals.
  Proves: one repeated workflow was condensed into a bounded existing skill
    without AGENTS bloat or new hook/MCP/subagent surfaces.
  Does not prove: product readiness, V02-01, automatic future skill triggering,
    or needlessness of hooks forever.
  Follow-up task: V09-00.

- Evidence ID: E-V09-00
  Source: `docs/reviews/controlled-dogfood/2026-06-27-v09-hooks-candidate-decision/REPORT.md`
  Command/report/file: V09 hook candidate screening.
  Result: runtime hooks rejected/deferred; hook projection-first boundary
    preserved; no repo-local `.codex/hooks` runtime surface found.
  Proves: no current hook candidate has enough repeated deterministic evidence
    for implementation.
  Does not prove: hooks will never be useful, product readiness, or V02-01.
  Follow-up task: V10-00.

- Evidence ID: E-V10-00
  Source: `docs/reviews/controlled-dogfood/2026-06-27-v10-mcp-subagent-candidate-gate/REPORT.md`
  Command/report/file: V10 MCP/subagent candidate screening and current Codex
    manual read.
  Result: KRN MCP server and new subagent framework rejected/deferred; existing
    `ts-type-critic` kept as read-only/proposal-only.
  Proves: no current MCP/subagent candidate has enough evidence for
    implementation.
  Does not prove: MCP/subagents will never be useful, product readiness, or
    V02-01.
  Follow-up task: V11-00.

- Evidence ID: E-V17-00
  Source: `docs/reviews/controlled-dogfood/2026-06-27-v17-target-owner-file-read-model-contract/REPORT.md`
  Command/report/file: source repair, CLI/parser tests, typecheck, full tests,
    DB readiness, target harness smoke, live init/connect/plan owner-file replay,
    evidence/observe/reflect persisted run.
  Result: `krn init --owner-file "path|root|kind|reason"` provides explicit
    operator owner-file input and `krn plan --project` reads it as
    `ownerFiles=2` with `owner_files_available`.
  Proves: exact target owner files can enter the read model through a normal
    operator CLI path without crawler inference.
  Does not prove: owner-file completeness, activation product quality, V02-01,
    widened alpha, or product readiness.
  Follow-up task: V18-00.

- Evidence ID: E-V18-00
  Source: `docs/reviews/controlled-dogfood/2026-06-27-v18-target-owner-file-contract-regate/REPORT.md`
  Command/report/file: target fixture init/connect/plan/evidence/observe/reflect,
    target fixture test, CLI dry-run next-command repair, targeted CLI tests,
    typecheck, full tests, diff check.
  Result: owner-file-heavy target task selected `tests/readiness.test.ts` first,
    target evidence persisted cleanly, and dry-run next command now preserves
    `--owner-file` flags.
  Proves: explicit owner-file contract works in a controlled DB-backed target
    fixture and exact owner-file activation works when the task names the owner
    file.
  Does not prove: real operator usability, product readiness, V02-01, or
    owner-file completeness on arbitrary repos.
  Follow-up task: V19-00.

- Evidence ID: E-V19-00
  Source: `docs/reviews/controlled-dogfood/2026-06-27-v19-product-readiness-after-owner-file-contract/REPORT.md`
  Command/report/file: readiness report inspecting V11/V12/V17/V18 and current
    remote CI.
  Result: controlled-internal-alpha for technical operators remains yes /
    stronger; widened alpha, V02-01, and product-ready remain unproven; V20 real
    target observation-only trial accepted.
  Proves: owner-file contract work changed the next blocker from fixture
    contract repair to real target evidence.
  Does not prove: real target success, real operator usability, widened alpha,
    or product readiness.
  Follow-up task: V20-00.

- Evidence ID: E-V20-00
  Source: `docs/reviews/controlled-dogfood/2026-06-27-v20-real-target-observation-only-owner-file-trial/REPORT.md`
  Command/report/file: DB-backed real target observation-only trial on
    `/home/krn/coding/krn/active/krn-elektroinstal-ogar`.
  Result: `krn init --connect --persist`, `krn plan --persist`,
    target checks, evidence capture, observe, reflect, and run readback
    completed without target writes.
  Proves: explicit owner-file read model works on a real target checkout in
    observation-only mode, and target evidence can persist mode, dirty state,
    target commands, allowed writes, forbidden writes, and does-not-prove
    boundaries.
  Does not prove: V02-01, real second-operator usability, product readiness,
    full target verification, or reflection extraction quality.
  Follow-up task: V21-00.

- Evidence ID: E-V21-00
  Source: `docs/reviews/controlled-dogfood/2026-06-27-v21-target-evidence-observation-only-defaults/REPORT.md`
  Command/report/file: source repair for target evidence observation-only
    defaults and readback clarity.
  Result: core target evidence normalization now supplies safe observation-only
    write-boundary defaults; CLI usage/readback tests and golden behavior cover
    the output.
  Proves: omitted `--target-forbidden-write` flags no longer make
    observation-only target evidence read back as no forbidden writes.
  Does not prove: product readiness, V02-01, target runtime correctness, or
    activation quality.
  Follow-up task: V22-00.

- Evidence ID: E-V22-00
  Source: `docs/reviews/controlled-dogfood/2026-06-27-v22-persisted-cli-db-url-recovery/REPORT.md`
  Command/report/file: source repair for centralized missing DB config recovery
    guidance in `runCli`.
  Result: missing `KRN_DATABASE_URL` errors now include exact recovery guidance
    and does-not-prove boundary while preserving explicit env override.
  Proves: direct persisted CLI commands are less likely to stall operators on a
    bare missing-env error.
  Does not prove: DB readiness, product readiness, V02-01, or command-specific
    persistence success.
  Follow-up task: V23-00.

- Evidence ID: E-V23-00
  Source: `docs/reviews/controlled-dogfood/2026-06-27-v23-real-target-rerun-after-ergonomics/REPORT.md`
  Command/report/file: real target observation-only rerun after V21/V22 repairs.
  Result: target evidence omitted explicit write-boundary flags but persisted
    and read back safe observation-only defaults; target repo stayed clean.
  Proves: V21 target evidence defaults work in the real target workflow.
  Does not prove: V02-01, product readiness, full target runtime verification,
    or general activation quality.
  Follow-up task: V24-00.

- Evidence ID: E-V24-00
  Source: `docs/reviews/controlled-dogfood/2026-06-27-v24-owner-file-recall-dedup-budget/REPORT.md`
  Command/report/file: source repair plus DB-backed target plan replay after
    owner-file priority change.
  Result: plan replay included all five explicit target owner files plus target
    trust exclusions; covered source seeds and adjacent guidance no longer
    crowded out direct owner files.
  Proves: explicit target owner files now have bounded priority over covered
    source seeds for owner-file-heavy target planning.
  Does not prove: V02-01, product readiness, full target runtime verification,
    or broad activation scoring quality.
  Follow-up task: V25-00.

- Evidence ID: E-V25-00
  Source: `docs/reviews/controlled-dogfood/2026-06-27-v25-target-rerun-after-owner-file-priority/REPORT.md`
  Command/report/file: real target observation-only rerun after V24 repair.
  Result: target plan included all five explicit owner files plus trust
    exclusions; target commands passed; target remained clean; evidence
    readback preserved observation-only defaults.
  Proves: V24 owner-file priority works in the full real target target loop.
  Does not prove: V02-01, product readiness, widened alpha, or full target
    runtime correctness.
  Follow-up task: V26-00.

- Evidence ID: E-V26-00
  Source: `docs/reviews/controlled-dogfood/2026-06-27-v26-cli-run-reference-target-none-ergonomics/REPORT.md`
  Command/report/file: bounded CLI parser repair.
  Result: evidence capture accepts `--run`; observe accepts `--run-id`;
    evidence capture accepts explicit `--target-changed-file none`.
  Proves: repeated V24/V25 operator-friction items were repaired without
    evidence semantic changes.
  Does not prove: product readiness, V02-01, or universal CLI naming
    consistency.
  Follow-up task: V27-00.

- Evidence ID: E-V27-00
  Source: `docs/reviews/controlled-dogfood/2026-06-27-v27-controlled-internal-alpha-regate/REPORT.md`
  Command/report/file: readiness re-gate after V20-V26.
  Result: controlled-internal-alpha for technical operators is stronger;
    product-ready, widened alpha, and V02-01 remain unproved.
  Proves: target loop repair batch is coherent enough to re-gate and move to a
    new self-improvement lane.
  Does not prove: second-operator usability or product readiness.
  Follow-up task: V28-00.

- Evidence ID: E-V28-00
  Source: `docs/reviews/controlled-dogfood/2026-06-27-v28-research-to-brain-typescript-codex/REPORT.md`
  Command/report/file: V28 source-to-decision report and
    `docs/KRN_SOURCES.md` update.
  Result: Codex/TypeScript sources were mapped to concrete KRN decisions,
    rejections, consumers, and falsifiers without creating a research subsystem.
  Proves: KRN can retain useful external/practitioner knowledge only when it
    changes a durable decision or rejection.
  Does not prove: current TypeScript code has no boundary drift, product
    readiness, or need for broad research intake.
  Follow-up task: V29-00.

- Evidence ID: E-V29-00
  Source: `docs/reviews/controlled-dogfood/2026-06-27-v29-typescript-boundary-research-application/REPORT.md`
  Command/report/file: targeted `rg` scans for `JSON.parse`, unsafe casts, and
    TypeScript suppressions.
  Result: production direct `JSON.parse` is limited to
    `packages/cli/src/cliFileBoundary.ts` and already uses `unknown` plus a
    local object guard; unsafe cast/suppression scans found no matches.
  Proves: V28 TypeScript boundary decisions are currently respected for the
    scanned high-risk patterns under `packages`.
  Does not prove: every public API is ideal, non-package scripts are clean, or
    product readiness.
  Follow-up task: V30-00.

- Evidence ID: E-V30-00
  Source: `docs/reviews/controlled-dogfood/2026-06-27-v30-codex-surface-context-budget/REPORT.md`
  Command/report/file: Codex surface size/shape inspection and root `PLAN.md`
    condensation.
  Result: `PLAN.md` was reduced from 19,877 bytes to 4,004 bytes and stale
    active V28 plan detail was removed; `AGENTS.md` and repo-local skills were
    kept unchanged.
  Proves: the active root plan is again compact enough to serve as product SSOT
    while `PLANS.md` carries detailed execution history.
  Does not prove: product readiness, V02-01 usability, or future surface drift
    cannot recur.
  Follow-up task: V31-00.

- Evidence ID: E-V31-00
  Source: `docs/reviews/controlled-dogfood/2026-06-27-v31-product-readiness-regate-after-research-surface/REPORT.md`
  Command/report/file: readiness re-gate over V27-V30 plus current CI.
  Result: controlled-internal-alpha remains yes / stronger; product-ready,
    widened alpha, and V02-01 remain unproved; controlled target repair trial
    promoted as the next product proof.
  Proves: the research/context-hygiene loop should stop and the next task
    should test bounded target repair utility.
  Does not prove: target repair success, product readiness, V02-01, or widened
    alpha.
  Follow-up task: V32-00.

- Evidence ID: E-V32-00
  Source: `docs/reviews/controlled-dogfood/2026-06-27-v32-controlled-target-repair/REPORT.md`
  Command/report/file: bounded headless repair in
    `/home/krn/coding/krn/active/krn-elektroinstal-ogar`, DB-backed
    init/connect/plan/evidence/observe/reflect/readback, target PHP/JS syntax
    checks, and target diff check.
  Result: FAQ trigger `aria-expanded` target repair was made in exactly two
    allowed target files without target commit; target evidence persisted
    allowed/forbidden writes, dirty state, command proof, observe, reflect, and
    no Memory Core mutation. Planning missed the two newly supplied FAQ owner
    files for the reused project.
  Proves: KRN can govern one bounded target repair with explicit target
    evidence and rollback boundaries.
  Does not prove: product readiness, V02-01, widened alpha, full target runtime
    correctness, or reused-project owner-file refresh correctness.
  Follow-up task: V33-00.

- Evidence ID: E-V33-00
  Source: `docs/reviews/controlled-dogfood/2026-06-27-v33-reused-project-owner-file-refresh/REPORT.md`
  Command/report/file: source repair, full typecheck/test, DB init-connect
    smoke, DB-backed init/connect/plan replay, evidence capture, observe,
    reflect, and readback.
  Result: reused project reconnect creates a fresh ProjectKernel snapshot when
    metadata changes; planning treats latest ProjectKernel owner files as the
    active snapshot and repo installation owner files as fallback only. V32
    target replay selected exactly the two FAQ owner files plus trust
    exclusions.
  Proves: the V32 owner-file refresh gap has a focused source repair and
    current-shell replay.
  Does not prove: product readiness, V02-01, widened alpha, full target runtime
    correctness, or activation scoring quality.
  Follow-up task: V34-00.

- Evidence ID: E-V34-00
  Source: `docs/reviews/controlled-dogfood/2026-06-27-v34-target-repair-regate-after-owner-file-refresh/REPORT.md`
  Command/report/file: KRN status, latest CI status, target status, and target
    focused diff summary.
  Result: readiness remains controlled-internal-alpha stronger; product-ready,
    widened alpha, and V02-01 remain unproved. The immediate blocker is target
    patch ownership because the V32 patch remains dirty in the target repo.
  Proves: next work should make the target patch explicit and handoff-safe
    instead of starting another feature/repair by inertia.
  Does not prove: target owner accepted the patch, product readiness, V02-01, or
    full target runtime correctness.
  Follow-up task: V35-00.

- Evidence ID: E-V35-00
  Source: `docs/reviews/controlled-dogfood/2026-06-27-v35-target-patch-handoff/REPORT.md`
  Command/report/file: V35 report and KRN-side patch artifact
    `FAQ_ARIA_PATCH.diff`.
  Result: the V32 target patch is captured as explicit KRN-side handoff
    evidence with operator choices and proof/non-proof boundaries; target repo
    remains dirty and uncommitted.
  Proves: KRN no longer relies on implicit target dirty state for the V32 patch.
  Does not prove: target owner accepted the patch, product readiness, V02-01, or
    full target runtime correctness.
  Follow-up task: V36-00.

- Evidence ID: E-V36-00
  Source: `docs/reviews/controlled-dogfood/2026-06-27-v36-target-patch-handoff-regate/REPORT.md`
  Command/report/file: V36 re-gate report; KRN status; target status; GitHub
    Actions run list.
  Result: the V32 target patch remains handed off but unresolved; V35 CI passed;
    KRN worktree is clean; same-target repair is rejected until ownership or
    stronger observation-only verification is explicit.
  Proves: KRN must condense target patch lifecycle handling before additional
    target repair work.
  Does not prove: target owner acceptance, product readiness, V02-01, widened
    alpha, or target browser/runtime correctness.
  Follow-up task: V37-00.

- Evidence ID: E-V37-00
  Source: `docs/reviews/controlled-dogfood/2026-06-27-v37-target-patch-lifecycle-rule/REPORT.md`
  Command/report/file: target-repo testing skill and runbook edits.
  Result: target patch lifecycle states are now part of the reusable target repo
    workflow, including a `handed_off_unresolved` stop condition for same-target
    repair.
  Proves: the V32-V36 lifecycle lesson is durable in workflow guidance.
  Does not prove: target owner acceptance, V02-01, product readiness, or that
    another target path is safe.
  Follow-up task: V38-00.

- Evidence ID: E-V38-00
  Source: `docs/reviews/controlled-dogfood/2026-06-27-v38-clean-target-selection-gate/REPORT.md`
  Command/report/file: active repo status inventory; WILQ target status and
    read-only file inspection.
  Result: `wilq-seo` is clean and synced; most other active repos are dirty,
    ahead, or untracked; `krn-elektroinstal-ogar` remains blocked for same-target
    repair by `handed_off_unresolved`.
  Proves: WILQ is the next clean/safe target path for observation-only baseline.
  Does not prove: WILQ repair scope, target verification, V02-01, widened alpha,
    or product readiness.
  Follow-up task: V39-00.

- Evidence ID: E-V39-00
  Source: `docs/reviews/controlled-dogfood/2026-06-27-v39-wilq-observation-baseline/REPORT.md`
  Command/report/file: WILQ target status and read-only baseline inspection.
  Result: `wilq-seo` became dirty between V38 selection and V39 baseline.
  Proves: clean target selection must be revalidated immediately before target
    use.
  Does not prove: WILQ repair is unsafe forever, target owner intent, V02-01, or
    product readiness.
  Follow-up task: V40-00.

- Evidence ID: E-V40-00
  Source: `docs/reviews/controlled-dogfood/2026-06-27-v40-target-selection-freshness-rule/REPORT.md`
  Command/report/file: target-repo testing skill and runbook edits.
  Result: target status freshness states are part of the reusable target
    workflow.
  Proves: stale clean-state evidence cannot authorize future target repair or
    readiness proof.
  Does not prove: a clean target exists, V02-01, product readiness, or target
    repair safety.
  Follow-up task: V41-00.

- Evidence ID: E-V41-00
  Source: `docs/reviews/controlled-dogfood/2026-06-27-v41-target-trial-availability-regate/REPORT.md`
  Command/report/file: current KRN/WILQ/elektroinstal statuses and CI.
  Result: WILQ is clean again at fresh check time; elektroinstal remains blocked
    by unresolved target patch lifecycle.
  Proves: WILQ fresh observation-only baseline retry is currently the safest
    target path.
  Does not prove: WILQ repair scope, WILQ verification, V02-01, or product
    readiness.
  Follow-up task: V42-00.

- Evidence ID: E-V42-00
  Source: `docs/reviews/controlled-dogfood/2026-06-27-v42-wilq-baseline-retry-stop/REPORT.md`
  Command/report/file: fresh WILQ and elektroinstal status checks.
  Result: WILQ was dirty again at V42 task start, so baseline stopped before
    target reads/repair.
  Proves: target trials need stability window or owner coordination before
    continuing.
  Does not prove: target work is impossible, V02-01, product readiness, or WILQ
    code quality.
  Follow-up task: V43-00.

- Evidence ID: E-V43-00
  Source: `docs/reviews/controlled-dogfood/2026-06-27-v43-target-stability-window-gate/REPORT.md`
  Command/report/file: target statuses and target evidence source inspection.
  Result: live target trials are paused; lifecycle/freshness fields exist in
    workflow docs but not target evidence domain/CLI/readback.
  Proves: the next highest-ROI move is KRN internal target evidence hardening.
  Does not prove: product readiness, V02-01, or target repair safety.
  Follow-up task: V44-00.

- Evidence ID: E-V44-00
  Source: `docs/reviews/controlled-dogfood/2026-06-27-v44-target-evidence-lifecycle-freshness/REPORT.md`
  Command/report/file: core/CLI source repair and focused tests.
  Result: target lifecycle/freshness fields now round-trip through typed target
    evidence, CLI capture output, run show text/JSON readback, and golden
    behavior without DB migration.
  Proves: V44 source gap is closed for existing target evidence metadata.
  Does not prove: target repo readiness, target owner acceptance, V02-01, or
    product readiness.
  Follow-up task: V45-00.

- Evidence ID: E-V45-00
  Source: `docs/reviews/controlled-dogfood/2026-06-27-v45-target-availability-regate-typed-evidence/REPORT.md`
  Command/report/file: fresh target statuses, active checkout inventory, and
    typed target evidence capture previews.
  Result: WILQ remains dirty/external-context only; elektroinstal remains
    handed_off_unresolved; no obvious clean idle product target was found.
  Proves: no safe headless repair target is currently available from the
    inspected local checkout set.
  Does not prove: target work should stop forever, target repos are bad, V02-01
    is impossible, or product readiness.
  Follow-up task: V46-00.

- Evidence ID: E-V46-00
  Source: `docs/reviews/controlled-dogfood/2026-06-27-v46-target-owner-coordination-packet/PACKET.md`
  Command/report/file: owner/stability coordination packet.
  Result: exact WILQ dirty-state repair inputs, elektroinstal patch lifecycle
    decision inputs, V02-01 real second-operator inputs, and allowed internal
    waiting work are explicit.
  Proves: missing owner/operator inputs are now concrete and do not require
    rereading V35-V45.
  Does not prove: any owner has accepted a patch, target repair is safe, V02-01
    is complete, or product readiness.
  Follow-up task: V47-00.
```

## 19. Condensation Queue

Append each candidate and update status.

```txt
- Candidate:
  Source evidence:
  Surface:
  Status: proposed / accepted / rejected / deferred
  Reason:
  Task:
```

Seed queue:

```txt
- Candidate: target-aware evidence capture
  Source evidence: V04 re-gate and target-repo-testing skill boundary
  Surface: source repair + guard + scenario report
  Status: accepted as V05 stream
  Reason: repeated/high-risk target proof boundary gap
  Task: V05-01..V05-04

- Candidate: target write prevention hook
  Source evidence: V04 compression screening
  Surface: hook candidate
  Status: deferred
  Reason: skill/runbook/guard exist; hook needs repeated violation and trusted deterministic policy
  Task: revisit after V05/V06 if repeated target-write attempt appears

- Candidate: KRN MCP server
  Source evidence: V04 compression screening
  Surface: MCP candidate
  Status: deferred
  Reason: CLI/files/DB suffice for current scenarios
  Task: revisit only if live typed state/tool access becomes blocking

- Candidate: explicit target evidence metadata/readback
  Source evidence: V05-01 current-state investigation
  Surface: source repair + CLI/readback tests
  Status: complete as V05-02
  Reason: target trial proof boundaries currently live in report prose, not EvidenceBundle/readback output
  Task: V05-02

- Candidate: target evidence persisted replay guard
  Source evidence: V05-02 target-aware capture/readback repair
  Surface: deterministic guard + controlled replay report
  Status: complete as V05-03
  Reason: target evidence must be proven through persisted/readback behavior, not only unit tests and preview output
  Task: V05-03

- Candidate: target-aware evidence stream re-gate
  Source evidence: V05-01 through V05-03
  Surface: re-gate report + next stream selection
  Status: complete as V05-04
  Reason: source repair and guard are complete; KRN needs product decision before more feature work
  Task: V05-04

- Candidate: activation / owner-file / context ROI utility
  Source evidence: V05 re-gate and prior target owner-file recall gaps
  Surface: V06 source repair or re-gate
  Status: complete as V06-00
  Reason: target evidence is clearer; next repeated bottleneck is exact owner-file recall below target roots
  Task: V06-00

- Candidate: memory/source usefulness loop
  Source evidence: V06 owner-file recall assessment and prior controlled runs
  Surface: controlled scenario + possible readback/rendering repair
  Status: partially complete as V07-00; source usefulness follow-up active
  Reason: after target evidence and owner-file recall are explicit, next product
    question is whether memory/source signals are later selected and useful
  Task: V07-00..V07-01

- Candidate: source usefulness application/readback path
  Source evidence: V07-00 current-shell smoke and report
  Surface: source/readback repair or re-gate
  Status: complete as V07-01
  Reason: source usefulness is currently lineage-only; selected/used/helped
    source feedback is not first-class
  Task: V07-01

- Candidate: V07 memory/source usefulness re-gate
  Source evidence: V07-00 and V07-01
  Surface: report + next stream selection
  Status: complete as V07-02
  Reason: after source decision readback repair, decide whether V08 can start
  Task: V07-02

- Candidate: skill-first workflow expansion
  Source evidence: V07 re-gate and repeated controlled workflow patterns
  Surface: skill gate
  Status: complete as V08-00
  Reason: skills are the next lowest-risk Codex surface for repeated workflows
  Task: V08-00

- Candidate: handoff compact continuation refinement
  Source evidence: GOAL continuation rules, continuous `PLANS.md` protocol, and
    V08 skill-first workflow gate
  Surface: existing skill refinement
  Status: complete as V08-00
  Reason: active stream/task and verified commit/push/CI state reduce future
    context loss without a new skill
  Task: V08-00

- Candidate: deterministic hooks screening
  Source evidence: V04 compression screening, V08 handoff skill refinement
  Surface: hook candidate decision
  Status: complete as V09-00
  Reason: after skill-first refinement, screen whether any repeated mechanical
    boundary still needs a hook; do not implement by default
  Task: V09-00

- Candidate: MCP / subagent screening
  Source evidence: V04 compression screening and V09 hook rejection
  Surface: MCP/subagent candidate gate
  Status: complete as V10-00
  Reason: after hooks remain deferred, screen whether live tool/read-model or
    parallel read-heavy role bottlenecks exist
  Task: V10-00

- Candidate: product readiness re-gate
  Source evidence: V05-V10 completed stream reports
  Surface: readiness gate
  Status: complete as V11-00
  Reason: major post-V04 surface candidates have been repaired, bounded, or
    rejected; readiness must be re-evaluated before more architecture work
  Task: V11-00

- Candidate: widened alpha trial launch packet
  Source evidence: V11 product readiness re-gate
  Surface: operator launch packet / trial boundary
  Status: complete as V12-00
  Reason: V11 found the next blocker is missing operator-trial evidence, not
    another architecture surface
  Task: V12-00

- Candidate: research-to-brain decision lane gate
  Source evidence: user requirement for research/standards-backed senior
    engineering patterns; KRN kernel source-to-decision law; V08/V10 official
    docs source decisions
  Surface: research/source decision gate
  Status: complete as V13-00
  Reason: if real operator inputs remain unavailable, the internal engineering
    loop should improve knowledge ingestion without creating a research hoard
  Task: V13-00

- Candidate: TypeScript boundary drift gate
  Source evidence: V13 research-to-brain decision lane and existing TypeScript
    excellence/boundary standards
  Surface: TypeScript boundary report or bounded repair
  Status: complete as V14-00
  Reason: practitioner/standards guidance should be proven through current code
    boundary health, not passive citation
  Task: V14-00

- Candidate: Promptfoo / golden behavior role gate
  Source evidence: V14 next recommendation, CI Promptfoo smoke, existing golden
    behavior tests
  Surface: eval role gate
  Status: complete as V15-00
  Reason: Promptfoo smoke needs an explicit proof/non-proof boundary before it
    is mistaken for product-quality evidence
  Task: V15-00

- Candidate: activation relevance evidence gate
  Source evidence: V11 readiness partial activation verdict, V06 owner-file
    recall report, V07 memory/source usefulness reports
  Surface: activation evidence gate
  Status: complete as V16-00
  Reason: activation quality remains partial and should be repaired only from
    repeated evidence, not vague dissatisfaction
  Task: V16-00

- Candidate: target owner-file read-model contract gate
  Source evidence: V16 activation gate, V06 owner-file recall report, current
    target read-model construction
  Surface: read-model contract gate
  Status: complete as V17-00
  Reason: owner-file recall works when ownerFiles exist; the next gap is making
    the owner-file input contract explicit for target trials
  Task: V17-00

- Candidate: target owner-file contract re-gate / trial application
  Source evidence: V17 owner-file contract repair and live init/connect/plan
    replay
  Surface: target trial/re-gate report
  Status: complete as V18-00
  Reason: after owner files can enter through normal init, the next question is
    whether a bounded target trial benefits or exposes operator friction,
    owner-file quality issues, or activation misses after ownerFiles exist
  Task: V18-00

- Candidate: product readiness re-gate after owner-file contract
  Source evidence: V18 target owner-file contract application and friction fix
  Surface: readiness gate
  Status: complete as V19-00
  Reason: the immediate owner-file contract blocker is gone; readiness and next
    proof boundary must be re-evaluated before another local substitute
  Task: V19-00

- Candidate: real target observation-only owner-file trial
  Source evidence: V19 readiness re-gate
  Surface: target trial report
  Status: accepted as V20-00
  Reason: after fixture/local owner-file proof, the next product evidence must
    come from a real target checkout without target writes or V02-01 overclaim
  Task: V20-00

- Candidate: target evidence observation-only defaults and readback clarity
  Source evidence: V20 real target observation-only trial
  Surface: CLI evidence capture/readback
  Status: accepted as V21-00
  Reason: observation-only target evidence can preserve forbidden write
    boundaries, but omitted flags read back as `forbiddenWrites: none`; target
    safety evidence should be harder to under-specify before more target trials
  Task: V21-00

- Candidate: persisted CLI DB URL default consistency
  Source evidence: V20 real target observation-only trial and V21 report
  Surface: CLI database runtime / persisted command ergonomics
  Status: accepted as V22-00
  Reason: `pnpm db:ready` uses a default local DB URL, but persisted CLI
    commands can fail without explicit `KRN_DATABASE_URL`; this is the next
    operator-friction item in target/dogfood loops
  Task: V22-00

- Candidate: real target observation rerun after evidence and DB ergonomics
    repairs
  Source evidence: V20, V21, and V22 reports
  Surface: target trial report
  Status: accepted as V23-00
  Reason: prove the newly repaired target evidence defaults and DB recovery
    guidance in the real target workflow before more source repairs
  Task: V23-00

- Candidate: target owner-file recall deduplication and budget priority
  Source evidence: V23 real target rerun
  Surface: activation/read-model source
  Status: accepted as V24-00
  Reason: V23 selected useful owner-file context but spent budget on adjacent
    agent guidance while some direct owner files were absent; inspect bounded
    read-model precision before broad activation scoring changes
  Task: V24-00

- Candidate: real target observation rerun after owner-file priority repair
  Source evidence: V24 source repair and DB-backed target plan replay
  Surface: target trial report
  Status: accepted as V25-00
  Reason: V24 proved the repair in source/tests/plan replay; the next product
    loop should prove the full observation-only target workflow uses the
    repaired owner-file priority without target writes
  Task: V25-00

- Candidate: CLI run reference and empty target changed-files ergonomics
  Source evidence: V24/V25 dogfood command friction
  Surface: CLI parsers/help/tests
  Status: accepted as V26-00
  Reason: `--run-id` vs `--run` and invalid `--target-changed-file none`
    created avoidable operator friction during successful dogfood loops
  Task: V26-00

- Candidate: controlled internal alpha re-gate after target loop repairs
  Source evidence: V20-V26 reports and CI
  Surface: readiness report / plan gate
  Status: accepted as V27-00
  Reason: target loop repairs should be condensed into a product readiness and
    next-task decision before more implementation work
  Task: V27-00

- Candidate: research-to-brain TypeScript/Codex decision trial
  Source evidence: V27 report and user direction
  Surface: source-to-decision report / standards / skills
  Status: complete as V28-00
  Reason: KRN should condense strong external/practitioner knowledge into
    decisions and falsifiers, but only through a bounded trial
  Task: V28-00

- Candidate: TypeScript boundary research application gate
  Source evidence: V28 report and durable source map
  Surface: bounded TypeScript boundary report / optional tiny repair
  Status: complete as V29-00
  Reason: accepted research decisions should be applied to current source
    evidence before adding more research or architecture
  Task: V29-00

- Candidate: Codex surface context-budget application gate
  Source evidence: V28 and V29 reports
  Surface: instruction/skill surface report / optional tiny skill or instruction
    refinement
  Status: complete as V30-00
  Reason: V28 Codex surface decisions should be applied to current AGENTS,
    goal/plan, and skill surfaces before adding more architecture
  Task: V30-00

- Candidate: product readiness re-gate after research and surface hygiene
  Source evidence: V27-V30 reports and current CI
  Surface: readiness report / next-task decision
  Status: complete as V31-00
  Reason: after target repairs plus research/context hygiene, the next step
    should be a product decision rather than more meta cleanup
  Task: V31-00

- Candidate: controlled target repair trial
  Source evidence: V31 readiness re-gate and V20-V26 target loop evidence
  Surface: target repair trial report / optional target working-tree diff
  Status: complete as V32-00
  Reason: the next product proof should test whether KRN can govern a bounded
    target change, not only observe target state
  Task: V32-00

- Candidate: reused project owner-file refresh repair
  Source evidence: V32 controlled target repair trial
  Surface: init/connect persistence + planning read-model repair or explicit
    stale-state warning
  Status: complete as V33-00
  Reason: V32 supplied two exact FAQ owner files to init/connect for a reused
    target project, but the subsequent plan omitted both and selected older
    owner files; fix refresh/read-model before activation scoring rewrite
  Task: V33-00

- Candidate: target repair re-gate after owner-file refresh
  Source evidence: V32 and V33 reports
  Surface: readiness/patch-handoff report
  Status: complete as V34-00
  Reason: after V33, the next product move should be decided from evidence,
    including the still-dirty V32 target patch and unchanged V02-01/product
    boundaries
  Task: V34-00

- Candidate: target patch handoff packet
  Source evidence: V34 re-gate and current target dirty state
  Surface: target patch handoff report + optional patch artifact
  Status: complete as V35-00
  Reason: KRN must not leave target code changes as implicit dirty state before
    another target repair or readiness claim
  Task: V35-00

- Candidate: target patch handoff re-gate
  Source evidence: V35 handoff packet
  Surface: readiness/next-task report
  Status: accepted as V36-00
  Reason: after making the patch explicit, decide whether target owner action is
    the blocker or another bounded target proof is safe
  Task: V36-00

- Candidate: target patch lifecycle rule
  Source evidence: V36 re-gate and unresolved handed-off target patch state
  Surface: `.agents/skills/target-repo-testing/SKILL.md` and target testing
    runbook
  Status: accepted as V37-00
  Reason: prevent unresolved dirty target patches from becoming ambiguous state
    before same-target repair, readiness claims, or future target trials
  Task: V37-00

- Candidate: clean target selection gate
  Source evidence: V37 lifecycle rule and unresolved current target patch
  Surface: target selection report / active plan gate
  Status: accepted as V38-00
  Reason: continue product proof only through a clean/safe target path or honest
    blocker, not by reusing the unresolved same target
  Task: V38-00

- Candidate: WILQ clean target observation-only baseline
  Source evidence: V38 target selection report
  Surface: target baseline report
  Status: accepted as V39-00
  Reason: inspect clean target context before any repair and preserve target
    dirty-state discipline
  Task: V39-00

- Candidate: target selection freshness rule
  Source evidence: V39 WILQ baseline found target changed after clean selection
  Surface: target-repo skill/runbook
  Status: accepted as V40-00
  Reason: prevent stale clean-state assumptions from authorizing target repair
    or product proof
  Task: V40-00

- Candidate: target trial availability re-gate
  Source evidence: V36-V40 target ownership and freshness gates
  Surface: readiness/next-direction report
  Status: accepted as V41-00
  Reason: after target workflow rule condensation, decide whether target trials
    can continue or should pause until a clean/explicitly writable target exists
  Task: V41-00

- Candidate: WILQ fresh observation-only baseline retry
  Source evidence: V41 availability re-gate
  Surface: target baseline report
  Status: accepted as V42-00
  Reason: use current clean WILQ state only after revalidating freshness at V42
    start
  Task: V42-00

- Candidate: target stability window gate
  Source evidence: V42 WILQ baseline stop
  Surface: readiness/next-direction report
  Status: accepted as V43-00
  Reason: avoid chasing actively changing target repos without owner
    coordination or a stable window
  Task: V43-00

- Candidate: target evidence lifecycle/freshness fields
  Source evidence: V43 target stability gate and source inspection
  Surface: core target evidence + CLI capture/readback
  Status: implemented in V44-00
  Reason: workflow-required target availability state should be typed evidence,
    not report prose
  Task: V44-00

- Candidate: target availability re-gate with typed lifecycle evidence
  Source evidence: V44 target evidence source repair
  Surface: observation-only target report + typed evidence capture inputs
  Status: implemented in V45-00
  Reason: target trials should resume only after fresh target status/lifecycle
    evidence, not stale prior selection
  Task: V45-00

- Candidate: target owner coordination packet
  Source evidence: V45 target availability re-gate
  Surface: operator-facing coordination packet
  Status: implemented in V46-00
  Reason: the next target proof depends on owner/stability inputs, and local
    substitutes would overstate readiness
  Task: V46-00

- Candidate: internal hardening re-gate after target coordination
  Source evidence: V46 owner coordination packet
  Surface: controlled dogfood report / active plan
  Status: accepted as V47-00
  Reason: while owner/operator inputs are missing, KRN should choose one
    bounded internal hardening task instead of another target substitute
  Task: V47-00
```

## 20. Outcomes & Retrospective

Update at every re-gate and at budget/blocker handoff.

Template:

```txt
## Outcome <date>

Completed:
- ...

Evidence:
- ...

What improved:
- ...

What did not improve:
- ...

Product readiness verdict:
- controlled-internal-alpha: yes/no/stronger
- widened internal alpha: yes/no
- product-ready: yes/no
- V02-01: complete/blocked/deferred

Next active stream:
- ...
```

## Outcome 2026-06-27 V28

Completed:

- V28 research-to-brain TypeScript/Codex decision trial.
- Durable source decisions added to `docs/KRN_SOURCES.md`.

Evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v28-research-to-brain-typescript-codex/REPORT.md`.
- `docs/KRN_SOURCES.md`.

What improved:

- External/practitioner source intake is now explicitly mapped to KRN
  decisions, consumers, rejections, and falsifiers.
- Codex ExecPlan/Goal/skill/AGENTS and TypeScript boundary choices have clearer
  source-backed proof/non-proof boundaries.

What did not improve:

- Product readiness.
- V02-01 second-operator proof.
- Current TypeScript source boundary health; V29 must inspect that separately.

Product readiness verdict:

- controlled-internal-alpha: yes / stronger source discipline
- widened internal alpha: no
- product-ready: no
- V02-01: blocked/deferred

Next active stream:

- V29 TypeScript Boundary Research Application Gate.

## Outcome 2026-06-27 V29

Completed:

- V29 TypeScript boundary research application gate.
- Bounded scans for `JSON.parse`, unsafe casts, TS suppressions, and direct
  json-fetch patterns.

Evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v29-typescript-boundary-research-application/REPORT.md`.
- `packages/cli/src/cliFileBoundary.ts`.

What improved:

- V28 TypeScript decisions were checked against current source evidence.
- No source repair was made without a direct boundary bug.

What did not improve:

- Product readiness.
- V02-01 second-operator proof.
- Codex surface/context-budget hygiene; V30 must inspect that separately.

Product readiness verdict:

- controlled-internal-alpha: yes / stronger TypeScript boundary confidence
- widened internal alpha: no
- product-ready: no
- V02-01: blocked/deferred

Next active stream:

- V30 Codex Surface Context-Budget Application Gate.

## Outcome 2026-06-27 V30

Completed:

- V30 Codex surface context-budget application gate.
- Root `PLAN.md` compactness repair.

Evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v30-codex-surface-context-budget/REPORT.md`.
- `PLAN.md`.

What improved:

- Root `PLAN.md` returned to compact current-state SSOT.
- Historical completed-stream details remain in `PLANS.md`, not duplicated in
  active context.
- Repo-local skills and `AGENTS.md` were inspected and kept unchanged.

What did not improve:

- Product readiness.
- V02-01 second-operator proof.
- Target/operator evidence; V31 must decide the next product step.

Product readiness verdict:

- controlled-internal-alpha: yes / stronger context hygiene
- widened internal alpha: no
- product-ready: no
- V02-01: blocked/deferred

Next active stream:

- V31 Product Readiness Re-Gate After Research And Surface Hygiene.

## Outcome 2026-06-27 V31

Completed:

- V31 product readiness re-gate after research and surface hygiene.

Evidence:

- `docs/reviews/controlled-dogfood/2026-06-27-v31-product-readiness-regate-after-research-surface/REPORT.md`.
- Current green CI on `faf8ee1`.

What improved:

- V27-V30 were condensed into one readiness and next-task decision.
- The plan exits the research/context hygiene loop and returns to target product
  proof.

What did not improve:

- Product readiness.
- V02-01 second-operator proof.
- Widened alpha readiness.
- Actual target repair usefulness; V32 must test that separately.

Product readiness verdict:

- controlled-internal-alpha: yes / stronger
- widened internal alpha: no
- product-ready: no
- V02-01: blocked/deferred

Next active stream:

- V32 Controlled Target Repair Trial.

## Outcome 2026-06-27 V08

Completed:
- V08-00 refined existing `handoff-compact` for continuous `PLANS.md` resume
  state.
- New skill, AGENTS expansion, hooks, MCP, and subagents were rejected/deferred
  for V08.

Evidence:
- `docs/reviews/controlled-dogfood/2026-06-27-v08-skill-first-workflow-gate/REPORT.md`.
- `.agents/skills/handoff-compact/SKILL.md`.

What improved:
- Future compact/resume handoffs now preserve active stream/task and verified
  commit/push/CI state explicitly.

What did not improve:
- Product readiness.
- V02-01 second-operator proof.
- Runtime enforcement through hooks.

Product readiness verdict:
- controlled-internal-alpha: yes / stronger
- widened internal alpha: no
- product-ready: no
- V02-01: blocked/deferred

Next active stream:
- V09 — Deterministic Hooks Candidate Decision.

## Outcome 2026-06-27 V09

Completed:
- V09-00 rejected/deferred runtime hook implementation.
- Hook expectation projection remains the correct current surface.

Evidence:
- `docs/reviews/controlled-dogfood/2026-06-27-v09-hooks-candidate-decision/REPORT.md`.
- `docs/decisions/ADR-0022-policy-hooks-boundary.md`.

What improved:
- Hook candidates are no longer vague backlog pressure; each candidate has a
  current decision and falsifier.

What did not improve:
- Runtime hook enforcement.
- Product readiness.
- V02-01 second-operator proof.

Product readiness verdict:
- controlled-internal-alpha: yes / stronger
- widened internal alpha: no
- product-ready: no
- V02-01: blocked/deferred

Next active stream:
- V10 — MCP / Subagent Candidate Gate.

## Outcome 2026-06-27 V10

Completed:
- V10-00 rejected/deferred KRN MCP server implementation.
- V10-00 rejected/deferred new subagent framework.
- Existing `ts-type-critic` remains the only accepted custom agent surface,
  read-only and proposal-only.

Evidence:
- `docs/reviews/controlled-dogfood/2026-06-27-v10-mcp-subagent-candidate-gate/REPORT.md`.
- Current Codex manual MCP/subagent sections.
- `docs/decisions/ADR-0023-read-only-run-readback-boundary.md`.

What improved:
- MCP/subagent backlog pressure now has current source-backed decisions and
  falsifiers.

What did not improve:
- Product readiness.
- V02-01 second-operator proof.
- External live MCP integration.

Product readiness verdict:
- controlled-internal-alpha: yes / stronger
- widened internal alpha: no
- product-ready: no
- V02-01: blocked/deferred

Next active stream:
- V11 — Product Readiness Re-Gate.

## Outcome 2026-06-27 V11

Completed:
- V11-00 re-gated product readiness after V05-V10.
- KRN remains controlled-internal-alpha for technical operators, stronger than
  before, but not widened-alpha or product-ready.
- V12 was accepted as the next bounded blocker stream.

Evidence:
- `docs/reviews/controlled-dogfood/2026-06-27-v11-product-readiness-re-gate/REPORT.md`.
- Latest listed `main` CI runs were green through V10.

What improved:
- Product readiness is now explicitly re-gated after target evidence,
  owner-file recall, memory/source usefulness, skill, hook, MCP, and subagent
  gates.
- The next work is constrained to real operator / widened-alpha launch
  evidence instead of another architecture surface.

What did not improve:
- V02-01 second-operator proof.
- Widened internal alpha.
- Product readiness.

Product readiness verdict:
- controlled-internal-alpha: yes / stronger
- widened internal alpha: no
- product-ready: no
- V02-01: blocked/deferred

Next active stream:
- V12 — Widened Alpha Trial Launch Packet.

## Outcome 2026-06-27 V12

Completed:
- V12-00 refreshed the existing second-operator alpha packet.
- The packet now includes V12 intake, trial modes and claim boundaries,
  transcript schema, support classification, failure taxonomy, evidence
  checklist, and expanded verdict labels.

Evidence:
- `docs/reviews/controlled-dogfood/2026-06-27-v12-widened-alpha-trial-launch-packet/REPORT.md`.
- `docs/runbooks/second-operator-alpha-trial.md`.

What improved:
- A future real operator or widened-alpha trial can start or block from
  checked-in docs without reconstructing chat context.
- Self/headless and observation-only modes are explicitly prevented from being
  renamed into V02-01 or widened-alpha proof.

What did not improve:
- V02-01 second-operator proof.
- Widened internal alpha.
- Product readiness.

Product readiness verdict:
- controlled-internal-alpha: yes / stronger
- widened internal alpha: no
- product-ready: no
- V02-01: blocked/deferred

Next active stream:
- V13 — Research-To-Brain Decision Lane Gate.

## Outcome 2026-06-27 V13

Completed:
- V13-00 refined existing `source-to-decision`.
- New research subsystem, research crawler, MCP, subagent workflow, and passive
  research archive were rejected.

Evidence:
- `docs/reviews/controlled-dogfood/2026-06-27-v13-research-to-brain-decision-lane/REPORT.md`.
- `.agents/skills/source-to-decision/SKILL.md`.

What improved:
- Research-like inputs now have explicit intake rules, preferred consumers,
  decision kinds, and candidate output guidance.
- Papers/docs/practitioner writing must become decisions, rejections,
  hypotheses, candidates, standards, skills, or falsifiers.

What did not improve:
- Product readiness.
- Widened internal alpha.
- V02-01 second-operator proof.
- TypeScript boundary health in source code.

Product readiness verdict:
- controlled-internal-alpha: yes / stronger
- widened internal alpha: no
- product-ready: no
- V02-01: blocked/deferred

Next active stream:
- V14 — TypeScript Boundary Drift Gate.

## Outcome 2026-06-27 V14

Completed:
- V14-00 inspected TypeScript boundary drift.
- No production TypeScript source repair was needed from the scanned patterns.
- `docs/standards/typescript-excellence.md` was repaired to remove a missing
  `runTypeSafetyAudit` enforcement claim.

Evidence:
- `docs/reviews/controlled-dogfood/2026-06-27-v14-typescript-boundary-drift/REPORT.md`.
- `docs/standards/typescript-excellence.md`.

What improved:
- TypeScript standard now names actual targeted verification surfaces:
  typecheck, targeted scans, parser/schema tests, golden behavior tests, and
  `ts-type-critic`.
- The standard explicitly rejects reintroducing broad `krn audit` or semantic
  quality engine as a substitute for ownership.

What did not improve:
- Product readiness.
- Widened internal alpha.
- V02-01 second-operator proof.
- Exhaustive manual review of every public TypeScript boundary.

Product readiness verdict:
- controlled-internal-alpha: yes / stronger
- widened internal alpha: no
- product-ready: no
- V02-01: blocked/deferred

Next active stream:
- V15 — Promptfoo / Golden Behavior Role Gate.

## Outcome 2026-06-27 V15

Completed:
- V15-00 clarified Promptfoo's current role.
- Promptfoo remains a smoke/result adapter.
- Golden behavior tests remain behavior proof authority.
- Broad eval platform and Promptfoo authority layer were rejected.

Evidence:
- `docs/reviews/controlled-dogfood/2026-06-27-v15-promptfoo-golden-role-gate/REPORT.md`.
- `docs/architecture/promptfoo-adapter-boundary.md`.
- `docs/architecture/golden-task-promotion.md`.
- `docs/decisions/ADR-0016-eval-candidates-remain-proposal-only.md`.

What improved:
- Promptfoo smoke cannot be confused with product-quality or KRN behavior proof.
- The next eval-related work now needs a protected failure, not aspiration.

What did not improve:
- Product readiness.
- Widened internal alpha.
- V02-01 second-operator proof.
- Activation quality.

Product readiness verdict:
- controlled-internal-alpha: yes / stronger
- widened internal alpha: no
- product-ready: no
- V02-01: blocked/deferred

Next active stream:
- V16 — Activation Relevance Evidence Gate.

## Outcome 2026-06-27 V16

Completed:
- V16-00 inspected activation relevance evidence.
- Activation scoring rewrite was rejected.
- Target owner-file read-model completeness was accepted as the next blocker.

Evidence:
- `docs/reviews/controlled-dogfood/2026-06-27-v16-activation-relevance-evidence-gate/REPORT.md`.
- `docs/reviews/controlled-dogfood/2026-06-27-v06-owner-file-recall/REPORT.md`.
- `packages/harness/src/activation/ownerFileRecall.ts`.
- `packages/harness/src/activation/ownerFileRecall.test.ts`.

What improved:
- Activation partial-readiness is now classified more precisely: current misses
  point to target read-model completeness, not proven scoring failure.

What did not improve:
- Product readiness.
- Widened internal alpha.
- V02-01 second-operator proof.
- Target owner-file discovery/completeness.

Product readiness verdict:
- controlled-internal-alpha: yes / stronger
- widened internal alpha: no
- product-ready: no
- V02-01: blocked/deferred

Next active stream:
- V17 — Target Owner-File Read-Model Contract Gate.

## Outcome 2026-06-27 V17

Completed:
- V17-00 inspected target owner-file read-model construction and repaired the
  missing operator-facing input contract.
- `krn init` now accepts repeatable
  `--owner-file "path|root|kind|reason"` entries.
- Owner files are persisted through project, repo installation, and project
  kernel metadata without DB migration.
- Target runbook, second-operator packet, and target-repo testing skill now
  describe the owner-file read-model contract.

Evidence:
- `docs/reviews/controlled-dogfood/2026-06-27-v17-target-owner-file-read-model-contract/REPORT.md`.
- Targeted CLI/parser tests, full typecheck, full tests, DB readiness, target
  harness smoke, live init/connect/plan replay, evidence capture, observe, and
  reflect.

What improved:
- Exact target owner files are no longer fixture-only metadata or hidden
  operator lore.
- `krn plan --project` can report `owner_files_available` from owner files
  provided through normal init/connect flow.
- Missing owner files remain read-model incompleteness, not scoring failure.

What did not improve:
- Product readiness.
- Widened internal alpha.
- V02-01 second-operator proof.
- Owner-file completeness on arbitrary target repos.
- Activation scoring quality.

Product readiness verdict:
- controlled-internal-alpha: yes / stronger
- widened internal alpha: no
- product-ready: no
- V02-01: blocked/deferred

Next active stream:
- V18 — Target Owner-File Contract Re-Gate / Trial Application.

## Outcome 2026-06-27 V18

Completed:
- V18-00 applied the explicit owner-file contract in a DB-backed target fixture
  flow.
- A generic target task proved `ownerFiles=2` and target evidence persistence.
- An owner-file-heavy target task selected `tests/readiness.test.ts` as the
  first context inclusion.
- `krn init --dry-run` now preserves `--owner-file` flags in its generated
  `Next command`.

Evidence:
- `docs/reviews/controlled-dogfood/2026-06-27-v18-target-owner-file-contract-regate/REPORT.md`.
- Persisted runs `c7aadb3a-43e9-4cfd-ac5e-3250a886d41e` and
  `d833dfa0-eb8f-40e8-8e3e-eeddde9ee303`.
- Targeted CLI tests, typecheck, full test suite, and diff check.

What improved:
- Owner-file contract has a full controlled target application, not just a
  source repair.
- Owner-file-heavy activation works when the target task names the exact file.
- Operator copy-path friction in init dry-run was repaired.

What did not improve:
- Product readiness.
- Widened internal alpha.
- V02-01 second-operator proof.
- Owner-file quality/completeness for arbitrary repos.
- Real operator comprehension of owner-file entries.

Product readiness verdict:
- controlled-internal-alpha: yes / stronger
- widened internal alpha: no
- product-ready: no
- V02-01: blocked/deferred

Next active stream:
- V19 — Product Readiness Re-Gate After Owner-File Contract.

## Outcome 2026-06-27 V19

Completed:
- V19-00 re-gated readiness after V17/V18 owner-file contract work.
- KRN remains controlled-internal-alpha for technical operators, stronger.
- Widened alpha, V02-01, and product-ready claims remain unproven.
- V20 real target observation-only owner-file trial was accepted as the next
  evidence step.

Evidence:
- `docs/reviews/controlled-dogfood/2026-06-27-v19-product-readiness-after-owner-file-contract/REPORT.md`.
- V11/V12/V17/V18 reports and latest green main CI.

What improved:
- Readiness claims now account for the owner-file contract and dry-run handoff
  repair.
- The next proof is no longer another checked-in fixture.

What did not improve:
- Product readiness.
- Widened internal alpha.
- V02-01 second-operator proof.
- Real target behavior after owner-file contract.

Product readiness verdict:
- controlled-internal-alpha: yes / stronger
- widened internal alpha: no / ready to attempt only with real operator inputs
- product-ready: no
- V02-01: blocked/deferred

Next active stream:
- V20 — Real Target Observation-Only Owner-File Trial.

## Outcome 2026-06-27 V20

Completed:
- V20-00 ran a real target observation-only owner-file trial on
  `/home/krn/coding/krn/active/krn-elektroinstal-ogar`.
- The target repo stayed clean before and after the trial.
- KRN persisted init/connect, plan, evidence, observe, reflect, and run readback
  for execution run `dd69eb5a-8552-46d1-89fc-4a7617acb59c`.
- DB-backed activation selected useful target owner files and trust exclusions.

Evidence:
- `docs/reviews/controlled-dogfood/2026-06-27-v20-real-target-observation-only-owner-file-trial/REPORT.md`.
- Evidence bundle `7f01243f-cf81-4caa-b819-b4443188177e`.
- Observation group `389ee6a3-4437-43af-861a-1cc57494e9f9`.
- Reflection record `75dce5dc-6ce8-4ebd-af06-a7f334b64cd0`.

What improved:
- Owner-file read model is now proven on a real target checkout, not just a
  checked-in fixture.
- Target evidence preserved observation-only mode, clean dirty state, target
  commands, and explicit allowed/forbidden write boundaries.
- No target writes were made.

What did not improve:
- Product readiness.
- V02-01 second-operator proof.
- Widened internal alpha.
- Full target runtime verification.
- Reflection extraction quality.

New blocker:
- Observation-only target evidence can be under-specified. If the operator omits
  explicit `--target-forbidden-write` flags, readback can show
  `forbiddenWrites: none`.

Product readiness verdict:
- controlled-internal-alpha: yes / stronger
- widened internal alpha: no
- product-ready: no
- V02-01: blocked/deferred

Next active stream:
- V21 — Target Evidence Observation-Only Defaults And Readback Clarity.

## Outcome 2026-06-27 V21

Completed:
- V21-00 repaired target evidence observation-only defaults and run readback
  clarity.
- Observation-only target evidence now defaults `allowedWrites` to `none` and
  supplies standard forbidden write boundaries when omitted.
- CLI usage examples now model target safety boundaries explicitly.
- `run show` target evidence nested lists are easier to scan.

Evidence:
- `docs/reviews/controlled-dogfood/2026-06-27-v21-target-evidence-observation-only-defaults/REPORT.md`.
- DB-backed run `ecf288e9-b8e7-400a-b34b-222bbc61769c`.
- Evidence bundle `69620092-fb5a-4f6d-bde8-78481196bbd5`.
- Observation group `87302501-a9a6-4cd7-bb5b-be3779f365d8`.
- Reflection record `3e9f7cfd-63a4-4fbf-b41c-b179fad507c6`.

What improved:
- Target evidence safety boundaries are harder to under-specify.
- The fix lives in core normalization and therefore applies to capture,
  persistence, and readback.
- Explicit operator-provided write boundaries still work.

What did not improve:
- Product readiness.
- V02-01 second-operator proof.
- Widened internal alpha.
- General activation quality; V21 plan abstained.

New blocker:
- Persisted CLI commands still have DB URL ergonomics friction: `pnpm db:ready`
  has a default URL, while persisted commands can require explicit
  `KRN_DATABASE_URL`.

Product readiness verdict:
- controlled-internal-alpha: yes / stronger
- widened internal alpha: no
- product-ready: no
- V02-01: blocked/deferred

Next active stream:
- V22 — Persisted CLI DB URL Default Consistency.

## Outcome 2026-06-27 V22

Completed:
- V22-00 repaired missing DB config recovery guidance for direct persisted CLI
  commands.
- `runCli` now appends copyable recovery guidance and a does-not-prove boundary
  when command runners throw `KRN_DATABASE_URL is required...`.
- Existing command-specific remediation is not duplicated when it already
  includes `Next action:`.

Evidence:
- `docs/reviews/controlled-dogfood/2026-06-27-v22-persisted-cli-db-url-recovery/REPORT.md`.
- DB-backed run `3c56703d-9570-4ba1-8e35-71cd935d3427`.
- Evidence bundle `22bad4a4-277c-4ed8-a141-b299b1e85661`.
- Observation group `d4a3d864-1d6d-4492-824b-038ae1f24d63`.
- Reflection record `aca9bfa0-8528-4334-ac3b-6b6d4c554cf8`.

What improved:
- Operators get exact DB recovery guidance instead of a bare missing-env error.
- Direct persisted commands still do not silently default to local Postgres.
- Explicit DB env override remains the write boundary.

What did not improve:
- Product readiness.
- V02-01 second-operator proof.
- Widened internal alpha.
- DB readiness itself.

New blocker:
- V21/V22 repairs should be proven together in one real target observation-only
  rerun before further source repairs.

Product readiness verdict:
- controlled-internal-alpha: yes / stronger
- widened internal alpha: no
- product-ready: no
- V02-01: blocked/deferred

Next active stream:
- V23 — Real Target Observation Re-Run After Evidence/DB Ergonomics Repairs.

## Outcome 2026-06-27 V23

Completed:
- V23-00 reran a real target observation-only owner-file trial after V21/V22.
- Evidence capture omitted explicit target write-boundary flags and still
  persisted safe observation-only defaults.
- Target repo stayed clean before and after.

Evidence:
- `docs/reviews/controlled-dogfood/2026-06-27-v23-real-target-rerun-after-ergonomics/REPORT.md`.
- DB-backed run `43e08455-6123-465b-990b-5d7abaf842b3`.
- Evidence bundle `42d6853a-367a-4dfc-993e-10457f0751cb`.
- Observation group `a6cd29fa-003f-4628-ae8c-56dc68814c83`.
- Reflection record `49be01ca-aa00-4a29-a203-03a35233dff9`.

What improved:
- V21/V22 repairs are proven in the real target workflow.
- Target evidence readback is clearer and safer.
- No target writes occurred.

What did not improve:
- Product readiness.
- V02-01 second-operator proof.
- Widened internal alpha.
- Full target runtime verification.
- Owner-file recall precision.

New blocker:
- Owner-file recall should avoid spending budget on duplicate/adjacent agent
  guidance when direct owner files are available for an owner-file-heavy target
  task.

Product readiness verdict:
- controlled-internal-alpha: yes / stronger
- widened internal alpha: no
- product-ready: no
- V02-01: blocked/deferred

Next active stream:
- V24 — Target Owner-File Recall Deduplication And Budget Priority.

## Outcome 2026-06-27 V32

Completed:
- V32-00 ran one bounded headless repair in
  `/home/krn/coding/krn/active/krn-elektroinstal-ogar`.
- Target edits were limited to the two predeclared FAQ files.
- KRN DB-backed plan/evidence/observe/reflect/readback completed.
- No target commit, target reset, target clean, KRN source change, product-ready
  overclaim, widened-alpha overclaim, or V02-01 overclaim occurred.

Evidence:
- `docs/reviews/controlled-dogfood/2026-06-27-v32-controlled-target-repair/REPORT.md`.
- DB-backed run `e6c68ed8-4c90-436c-bb33-7673f7ed683b`.
- Evidence bundle `2fa1837c-82d7-4ed2-8735-9bd563d806f5`.
- Observation group `9e1b444d-6469-4cc2-bf6a-615085dd6e90`.
- Reflection record `88616d08-eba9-4af8-a339-af65e4dcf3c0`.

What improved:
- KRN proved it can govern one bounded target repair with explicit allowed
  writes, forbidden writes, target dirty state, command proof, rollback, and DB
  readback.
- The target FAQ accordion trigger now carries and updates `aria-expanded`
  while preserving item state for existing CSS.

What did not improve:
- Product readiness.
- V02-01 second-operator proof.
- Widened internal alpha.
- Full target runtime/browser/accessibility verification.
- Reused-project owner-file refresh.

New blocker:
- `krn init --owner-file` for a reused target project printed the newly supplied
  FAQ owner files, but the subsequent plan selected older/stale owner files and
  omitted both FAQ files.

Product readiness verdict:
- controlled-internal-alpha: yes / stronger
- widened internal alpha: no
- product-ready: no
- V02-01: blocked/deferred

Next active stream:
- V33 — Reused Project Owner-File Refresh Repair.

## Outcome 2026-06-27 V33

Completed:
- V33-00 repaired reused-project owner-file refresh.
- `init --connect` now writes a fresh ProjectKernel snapshot when current
  target source/owner metadata differs from the latest kernel.
- `plan --project` now treats latest ProjectKernel owner files as the active
  snapshot and repo installation owner files as fallback only.

Evidence:
- `docs/reviews/controlled-dogfood/2026-06-27-v33-reused-project-owner-file-refresh/REPORT.md`.
- V33 source run `d0092ebd-7c4d-4ed5-a910-98757bb5530a`.
- Evidence bundle `beeb7a90-fcc3-41ea-ba99-b7b4264d1409`.
- Observation group `53af9a8e-421f-4d2a-b87a-fda119ca552a`.
- Reflection record `dd1e31c6-efe6-4f5a-ac88-c7cef0269d39`.
- V33 target replay run `cea1450b-07c2-4d4c-b190-331a242b47e8`.

What improved:
- Reused-project owner-file refresh no longer silently leaves planning on old
  owner-file metadata.
- V32 target replay now selects the two FAQ owner files and target trust
  exclusions, not stale unrelated owner files.
- DB init-connect smoke now proves refreshed ProjectKernel version 2.

What did not improve:
- Product readiness.
- V02-01 second-operator proof.
- Widened internal alpha.
- Full target runtime/browser/accessibility verification.
- Source activation for the KRN repair itself; V33 plan abstained.

New blocker:
- The V32 target patch is still intentionally dirty and uncommitted in the
  target repo; next work must decide patch handoff/rollback or another safe
  target proof without overclaiming V02-01/product readiness.

Product readiness verdict:
- controlled-internal-alpha: yes / stronger
- widened internal alpha: no
- product-ready: no
- V02-01: blocked/deferred

Next active stream:
- V34 — Target Repair Re-Gate After Owner-File Refresh.

## Outcome 2026-06-27 V34

Completed:
- V34-00 re-gated target repair readiness after V32/V33.
- Confirmed latest KRN CI `28289476246` passed.
- Confirmed KRN worktree was clean before V34 docs.
- Confirmed target repo still has exactly the two V32 patch files dirty.

Evidence:
- `docs/reviews/controlled-dogfood/2026-06-27-v34-target-repair-regate-after-owner-file-refresh/REPORT.md`.
- KRN `git status --short --branch`.
- Target `git status --short --branch`.
- Target focused `git diff --stat`.

What improved:
- The next blocker is explicit: target patch ownership/handoff, not another
  KRN source feature.
- Readiness remains honestly bounded after the target repair and owner-file
  refresh work.

What did not improve:
- Product readiness.
- V02-01 second-operator proof.
- Widened internal alpha.
- Target owner acceptance of the patch.
- Full target browser/runtime/accessibility verification.

New blocker:
- The target patch must be made explicit and handoff-safe before another target
  repair or readiness claim.

Product readiness verdict:
- controlled-internal-alpha: yes / stronger
- widened internal alpha: no
- product-ready: no
- V02-01: blocked/deferred

Next active stream:
- V35 — Target Patch Handoff Packet.

## Outcome 2026-06-27 V35

Completed:
- V35-00 created a KRN-side target patch handoff packet.
- Captured exact V32 target patch in
  `docs/reviews/controlled-dogfood/2026-06-27-v35-target-patch-handoff/FAQ_ARIA_PATCH.diff`.
- Recorded operator choices and proof/non-proof boundaries.
- Did not edit, commit, reset, clean, or normalize the target repo.

Evidence:
- `docs/reviews/controlled-dogfood/2026-06-27-v35-target-patch-handoff/REPORT.md`.
- `docs/reviews/controlled-dogfood/2026-06-27-v35-target-patch-handoff/FAQ_ARIA_PATCH.diff`.
- Target `git status --short --branch`.

What improved:
- The V32 target patch is no longer hidden dirty state.
- Target patch ownership is explicit and operator-facing.

What did not improve:
- Target owner acceptance.
- Product readiness.
- V02-01 second-operator proof.
- Widened internal alpha.
- Full target browser/runtime/accessibility verification.

New blocker:
- Decide whether to wait for target owner/operator action, run stronger
  observation-only verification, select another clean target proof, or resume
  V02-01 only with real operator inputs.

Product readiness verdict:
- controlled-internal-alpha: yes / stronger
- widened internal alpha: no
- product-ready: no
- V02-01: blocked/deferred

Next active stream:
- V36 — Target Patch Handoff Re-Gate.

## Outcome 2026-06-27 V36

Completed:
- V36-00 re-gated after the V35 target patch handoff.
- Confirmed KRN HEAD `2144644` was clean and latest CI `28289750736` passed.
- Confirmed the target repo still has exactly the two V32 FAQ patch files dirty.
- Rejected same-target repair while the patch is handed off but unresolved.

Evidence:
- `docs/reviews/controlled-dogfood/2026-06-27-v36-target-patch-handoff-regate/REPORT.md`.
- KRN `rtk git status --short --branch`.
- Target `rtk git status --short --branch`.
- `rtk gh run list --branch main --limit 8`.

What improved:
- The next product move is explicit.
- Target owner/operator ownership remains separated from KRN product proof.

What did not improve:
- Target owner acceptance.
- Product readiness.
- V02-01 second-operator proof.
- Widened internal alpha.
- Target runtime/browser/accessibility proof.

New task:
- Condense target patch lifecycle state into the target-repo testing workflow
  surface so future target trials cannot bypass unresolved patch ownership.

Product readiness verdict:
- controlled-internal-alpha: yes / stronger
- widened internal alpha: no
- product-ready: no
- V02-01: blocked/deferred

Next active stream:
- V37 — Target Patch Lifecycle Rule Condensation.

## Outcome 2026-06-27 V37

Completed:
- V37-00 condensed target patch lifecycle handling into
  `.agents/skills/target-repo-testing/SKILL.md`.
- Updated `docs/runbooks/target-repo-testing.md` with target patch lifecycle
  states and required report fields.
- Added `handed_off_unresolved` as a stop condition for same-target repair.

Evidence:
- `docs/reviews/controlled-dogfood/2026-06-27-v37-target-patch-lifecycle-rule/REPORT.md`.
- `.agents/skills/target-repo-testing/SKILL.md`.
- `docs/runbooks/target-repo-testing.md`.

What improved:
- The target patch ownership lesson is no longer only in reports.
- Future Codex continuations can detect unresolved handed-off target patches
  before starting another target repair.

What did not improve:
- Target owner acceptance.
- Product readiness.
- V02-01 second-operator proof.
- Widened internal alpha.
- Target runtime/browser/accessibility proof.

New task:
- Decide whether a clean/safe target proof path exists without touching the
  unresolved `krn-elektroinstal-ogar` FAQ patch.

Product readiness verdict:
- controlled-internal-alpha: yes / stronger
- widened internal alpha: no
- product-ready: no
- V02-01: blocked/deferred

Next active stream:
- V38 — Clean Target Selection Gate.

## Outcome 2026-06-27 V38

Completed:
- V38-00 inspected active repo statuses read-only.
- Rejected `krn-elektroinstal-ogar` for same-target repair while its FAQ patch
  remains `handed_off_unresolved`.
- Selected `/home/krn/coding/krn/active/wilq-seo` as the next clean/safe target
  path.

Evidence:
- `docs/reviews/controlled-dogfood/2026-06-27-v38-clean-target-selection-gate/REPORT.md`.
- Active repo `git status --short --branch` inventory.
- `wilq-seo` README, AGENTS, package scripts, and status.

What improved:
- KRN has a clean target path that does not depend on unresolved target patch
  ownership.
- The next task is observation-only, so target repair is not smuggled into
  selection.

What did not improve:
- Product readiness.
- V02-01 second-operator proof.
- Widened internal alpha.
- WILQ target repair safety.
- Target command verification.

New task:
- Run a WILQ observation-only baseline before any bounded repair.

Product readiness verdict:
- controlled-internal-alpha: yes / stronger
- widened internal alpha: no
- product-ready: no
- V02-01: blocked/deferred

Next active stream:
- V39 — WILQ Clean Target Observation-Only Baseline.

## Outcome 2026-06-27 V39

Completed:
- V39-00 started WILQ observation-only baseline.
- Found `wilq-seo` dirty before any V39 target write.
- Inspected WILQ recovery docs, active goal/plan, package scripts and Python
  config read-only.
- Rejected immediate WILQ repair because the clean target premise expired.

Evidence:
- `docs/reviews/controlled-dogfood/2026-06-27-v39-wilq-observation-baseline/REPORT.md`.
- `wilq-seo` `git status --short --branch`.
- WILQ AGENTS, README, CONTEXT, PROGRESS, goal/plan, package and pyproject
  reads.

What improved:
- KRN caught target volatility before editing.
- The plan now distinguishes clean target selection from fresh target state at
  execution time.

What did not improve:
- Product readiness.
- V02-01 second-operator proof.
- WILQ target repair safety.
- Target command verification.

New task:
- Condense target selection freshness into the target-repo workflow.

Product readiness verdict:
- controlled-internal-alpha: yes / stronger
- widened internal alpha: no
- product-ready: no
- V02-01: blocked/deferred

Next active stream:
- V40 — Target Selection Freshness Rule Condensation.

## Outcome 2026-06-27 V40

Completed:
- V40-00 added target status freshness guidance to
  `.agents/skills/target-repo-testing/SKILL.md`.
- Updated `docs/runbooks/target-repo-testing.md` with freshness states:
  `fresh_current_task`, `stale_prior_selection`, and
  `changed_since_selection`.
- Required downgrade to observation-only when selected clean target becomes
  dirty at task start.

Evidence:
- `docs/reviews/controlled-dogfood/2026-06-27-v40-target-selection-freshness-rule/REPORT.md`.
- `.agents/skills/target-repo-testing/SKILL.md`.
- `docs/runbooks/target-repo-testing.md`.

What improved:
- Target selection freshness is durable workflow guidance.
- Stale clean-state evidence cannot justify target repair.

What did not improve:
- Product readiness.
- V02-01 second-operator proof.
- Availability of a clean target.
- WILQ repair safety.

New task:
- Re-gate target trial availability and pick the next product direction.

Product readiness verdict:
- controlled-internal-alpha: yes / stronger
- widened internal alpha: no
- product-ready: no
- V02-01: blocked/deferred

Next active stream:
- V41 — Target Trial Availability Re-Gate.

## Outcome 2026-06-27 V41

Completed:
- V41-00 re-gated target trial availability.
- Confirmed KRN latest commit `a4d6ce5` had CI `28290281793` passed.
- Confirmed WILQ is clean again at fresh status check.
- Confirmed elektroinstal remains dirty with the V32 FAQ patch and is not
  available for same-target repair.

Evidence:
- `docs/reviews/controlled-dogfood/2026-06-27-v41-target-trial-availability-regate/REPORT.md`.
- KRN, WILQ and elektroinstal `git status --short --branch`.
- KRN CI run list.

What improved:
- Target availability is no longer based on stale V39 state.
- WILQ can be retried safely as observation-only if V42 start status remains
  clean.

What did not improve:
- Product readiness.
- V02-01 second-operator proof.
- WILQ repair safety.
- Target runtime verification.

New task:
- Retry WILQ observation-only baseline with fresh status at task start.

Product readiness verdict:
- controlled-internal-alpha: yes / stronger
- widened internal alpha: no
- product-ready: no
- V02-01: blocked/deferred

Next active stream:
- V42 — WILQ Fresh Observation-Only Baseline Retry.

## Outcome 2026-06-27 V42

Completed:
- V42-00 checked WILQ target status at task start.
- Found WILQ dirty again with four changed files.
- Stopped before baseline or repair.
- Confirmed elektroinstal remains blocked by unresolved patch lifecycle.

Evidence:
- `docs/reviews/controlled-dogfood/2026-06-27-v42-wilq-baseline-retry-stop/REPORT.md`.
- KRN, WILQ and elektroinstal `git status --short --branch`.
- KRN CI run list.

What improved:
- KRN obeyed the freshness rule immediately.
- Target volatility is now an explicit product availability issue.

What did not improve:
- Product readiness.
- V02-01 second-operator proof.
- WILQ baseline completion.
- Target repair availability.

New task:
- Decide target stability window / owner coordination / internal hardening
  direction.

Product readiness verdict:
- controlled-internal-alpha: yes / stronger
- widened internal alpha: no
- product-ready: no
- V02-01: blocked/deferred

Next active stream:
- V43 — Target Stability Window Gate.

## Outcome 2026-06-27 V43

Completed:
- V43-00 re-gated target stability.
- Confirmed `wilq-seo` and `krn-elektroinstal-ogar` are unavailable for safe
  target repair.
- Inspected KRN target evidence source and found lifecycle/freshness fields are
  not first-class target evidence.
- Promoted V44 internal source hardening.

Evidence:
- `docs/reviews/controlled-dogfood/2026-06-27-v43-target-stability-window-gate/REPORT.md`.
- KRN, WILQ and elektroinstal statuses.
- Target evidence source inspection in `packages/core` and `packages/cli`.

What improved:
- KRN stopped chasing volatile target repos.
- The next task is a concrete source hardening gap, not another docs-only
  target loop.

What did not improve:
- Product readiness.
- V02-01 second-operator proof.
- Target repair availability.
- Target runtime verification.

New task:
- Add lifecycle/freshness fields to typed target evidence.

Product readiness verdict:
- controlled-internal-alpha: yes / stronger
- widened internal alpha: no
- product-ready: no
- V02-01: blocked/deferred

Next active stream:
- V44 — Target Evidence Lifecycle And Freshness Fields.

## Outcome 2026-06-27 V44

Completed:
- V44-00 added typed target lifecycle/freshness fields to core target evidence.
- Added CLI flags for `--target-status-freshness`,
  `--target-patch-lifecycle`, `--target-handoff-artifact`, and
  `--target-owner-decision`.
- Added capture output and run show readback for the new fields.
- Covered core normalization, metadata readback, CLI parse, capture render,
  run show text/JSON, and golden behavior.

Evidence:
- `docs/reviews/controlled-dogfood/2026-06-27-v44-target-evidence-lifecycle-freshness/REPORT.md`.
- `packages/core/src/evidenceBundle.ts`.
- `packages/cli/src/parseEvidenceArgs.ts`.
- `packages/cli/src/runEvidenceCaptureCommand.ts`.
- `packages/cli/src/runRunShowCommand.ts`.

What improved:
- Target lifecycle/freshness state is no longer prose-only.
- Future target availability gates can record first-class evidence for stale,
  changed, unresolved, accepted, or rejected target states.

What did not improve:
- Product readiness.
- V02-01 second-operator proof.
- Target repo availability.
- Target owner acceptance of any patch.

New task:
- Re-gate target availability using typed lifecycle/freshness evidence.

Product readiness verdict:
- controlled-internal-alpha: yes / stronger
- widened internal alpha: no
- product-ready: no
- V02-01: blocked/deferred

Next active stream:
- V45 — Target Availability Re-Gate With Typed Lifecycle Evidence.

## Outcome 2026-06-27 V45

Completed:
- V45-00 re-gated target availability using fresh target status checks.
- Used typed target evidence fields in `krn evidence capture` preview for WILQ
  and elektroinstal.
- Confirmed no safe headless repair target is currently available from the
  inspected local checkout set.

Evidence:
- `docs/reviews/controlled-dogfood/2026-06-27-v45-target-availability-regate-typed-evidence/REPORT.md`.
- Fresh `git status --short --branch` in WILQ and elektroinstal.
- Read-only active checkout inventory.
- Typed target evidence capture previews.

What improved:
- Target availability decisions now use first-class lifecycle/freshness fields.
- KRN avoided target writes while target state is unresolved or external.

What did not improve:
- Product readiness.
- V02-01 second-operator proof.
- Availability of a clean/stable target repair window.
- Target owner decision for the elektroinstal patch.

New task:
- Create a compact owner/stability coordination packet.

Product readiness verdict:
- controlled-internal-alpha: yes / stronger
- widened internal alpha: no
- product-ready: no
- V02-01: blocked/deferred

Next active stream:
- V46 — Target Owner Coordination Packet.

## Outcome 2026-06-27 V46

Completed:
- V46-00 created the target owner/stability coordination packet.
- The packet lists exact WILQ dirty-state repair inputs, elektroinstal patch
  lifecycle decision inputs, V02-01 real second-operator inputs, and allowed
  internal waiting work.

Evidence:
- `docs/reviews/controlled-dogfood/2026-06-27-v46-target-owner-coordination-packet/PACKET.md`.
- V45 target availability re-gate.
- Target repo testing skill/runbook.

What improved:
- Missing owner/operator inputs are explicit and operator-facing.
- KRN no longer needs another local substitute to explain target blockers.

What did not improve:
- Product readiness.
- V02-01 second-operator proof.
- Target owner decision for elektroinstal.
- WILQ dirty-state write permission.

New task:
- Re-gate internal hardening and pick one bounded next task while waiting for
  target owner/operator inputs.

Product readiness verdict:
- controlled-internal-alpha: yes / stronger
- widened internal alpha: no
- product-ready: no
- V02-01: blocked/deferred

Next active stream:
- V47 — Internal Hardening Re-Gate After Target Coordination.

## 21. Final Response Format For Codex Runs

Every continuation or completed slice must end with:

```txt
Read:
- ...

Changed:
- ...

DB used:
- yes/no; if yes, commands and DB URL class

Commands run:
- ...

Reports/artifacts:
- ...

Commits/CI:
- ...

What this proves:
- ...

What this does not prove:
- ...

Condensation decisions:
- ...

Tasks appended to PLANS.md:
- ...

Next active task:
- ...

Blocked/budget-limited:
- yes/no; if yes, what unlocks progress
```

## 22. Compact GOAL.md Contract To Pair With This Plan

The root `GOAL.md` should not duplicate this file. It should say only:

```txt
Current objective: execute KRN Continuous Brain Growth from PLANS.md.
Active stream: V48 Continuous Pattern Source-To-Decision Gate.
Read: PLAN.md, GOAL.md, PLANS.md.
Continue by evidence. After every slice, update PLANS.md and append next tasks.
Do not mark complete after one slice. Complete only on explicit operator stop, product-ready gate, or budget/blocker handoff.
```

## 23. Plan Revision Note

2026-06-27: Created generic continuous `PLANS.md` after V04 completed. This revision converts KRN from one-off long-run batches into a continuously growing evidence-driven product plan. It sets V05 target-aware evidence capture as the next active stream, preserves V02-01 as external second-operator proof, and requires Codex to append new tasks from evidence before stopping.
