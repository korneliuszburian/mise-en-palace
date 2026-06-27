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
controlled-internal-alpha for technical operators: yes / stronger
product-ready: no
widened internal alpha: no
V02-01 real second-operator proof: blocked/deferred
active stream: V14 TypeScript boundary drift gate
current task: V14-00 TypeScript Boundary Drift Gate
```

Evidence already recorded in repo:

- `PLAN.md` current product state and V04 queue.
- `GOAL.md` current V04 completion state and continuation rules.
- `docs/plans/v04-internal-brain-utility/PLANS.md` V04 long-run execution record.
- `docs/reviews/controlled-dogfood/2026-06-27-v04-internal-brain-usefulness/REPORT.md` final V04 re-gate.
- `.agents/skills/target-repo-testing/SKILL.md` first durable target-repo workflow skill.
- `.github/workflows/ci.yml` remote CI verification path.

Known current gap:

```txt
V12 must turn the V11 readiness verdict into an operator-ready launch packet
for a real second-operator or widened-alpha trial without creating fake proof.
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

Status: active

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
- [ ] V14-00 active: TypeScript boundary drift gate.
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
  Status: accepted as V14-00
  Reason: practitioner/standards guidance should be proven through current code
    boundary health, not passive citation
  Task: V14-00
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
Active stream: V12 Widened Alpha Trial Launch Packet.
Read: PLAN.md, GOAL.md, PLANS.md.
Continue by evidence. After every slice, update PLANS.md and append next tasks.
Do not mark complete after one slice. Complete only on explicit operator stop, product-ready gate, or budget/blocker handoff.
```

## 23. Plan Revision Note

2026-06-27: Created generic continuous `PLANS.md` after V04 completed. This revision converts KRN from one-off long-run batches into a continuously growing evidence-driven product plan. It sets V05 target-aware evidence capture as the next active stream, preserves V02-01 as external second-operator proof, and requires Codex to append new tasks from evidence before stopping.
