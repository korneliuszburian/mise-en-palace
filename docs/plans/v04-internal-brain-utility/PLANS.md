# V04 Long-Run ExecPlan: Internal Brain Utility, Pattern Condensation, and Skill-First KRN

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, `Evidence Ledger`, `Condensation Queue`, and `Outcomes & Retrospective` must be updated as work proceeds. It is designed for a long overnight-and-next-day Codex Goal run, but elapsed time is not a completion condition. The run is complete only when the evidence gates below are satisfied, or when a real blocker or budget stop condition is recorded honestly.

This file is an execution plan for one long run. Root `PLAN.md` remains the product single source of truth. If this file is checked into the repository, root `PLAN.md` and `GOAL.md` must explicitly authorize it as the current V04 execution plan so it does not become a competing roadmap.

## Purpose / Big Picture

KRN already has a controlled-internal-alpha spine for technical operators: DB recovery proof, target fixture proof, owner-file recall, evidence/readback, memory usefulness, brain-battle guards, and operator preflight guidance have been established in prior V02/V03 work. The product still needs a stronger internal brain loop: KRN must become brutally useful for our own work by turning real controlled runs into reusable knowledge, not just reports.

After this run, an operator should be able to use KRN to run controlled scenarios, capture evidence, classify what the scenario proves and does not prove, and condense repeated findings into durable product surfaces: small AGENTS rules, repo skills, deterministic tests/golden guards, evidence/readback improvements, memory/source candidates, or hook candidates. The result should be visible through repo changes, scenario reports, skill files, guard tests, CLI/report outputs, and CI-confirmed verification.

The product win is not “one more document”. The product win is a repeatable learning loop:

```txt
controlled scenario
  -> evidence
  -> finding
  -> condensation target
  -> rule / skill / guard / report / memory-source candidate
  -> next scenario with less manual context and less repeated explanation
```

## Non-Negotiable Product Direction

1. Build KRN for our own workflows first. V02-01 remains the external second-operator proof, but it does not block internal brain development.
2. Controlled self/headless scenarios are engineering proof and knowledge-distillation material. They are not product-readiness proof and must never be renamed into second-operator proof.
3. Knowledge must be condensed. A finding that stays only in long reports is not product improvement. A repeated finding must become a durable surface or be explicitly rejected.
4. Skills are the next product surface. Use small repo skills for repeated workflows before building MCP, dashboards, broad subagents, or automation infrastructure.
5. Hooks are for deterministic hard guards only. Do not hide semantic reasoning inside hooks.
6. MCP is deferred until KRN needs live external systems or typed read models that CLI/files cannot provide.
7. Subagents are deferred until stable read-heavy roles and output contracts exist. Do not create an agent zoo.
8. Do not simplify by losing usefulness. Every simplification must reduce future review burden, context waste, or repeated explanation.

## Definitions Used In This Plan

- **KRN Brain**: the operating layer around Codex: context selection, memory application, source grounding, policy control, evidence capture, review intelligence, and feedback condensation.
- **Controlled Scenario**: a bounded, named run with explicit allowed writes, forbidden writes, commands, expected KRN behavior, and proof/non-proof boundaries.
- **Engineering Proof**: evidence that a KRN mechanism works or fails under controlled conditions. It can justify product repairs but does not prove market readiness.
- **Product Proof**: evidence that an intended user can succeed with KRN under the claimed product boundary. V02-01 is product usability proof for a second operator; self-runs cannot replace it.
- **Knowledge Condensation**: converting a finding into a durable future-use surface: AGENTS rule, skill, deterministic test, golden/eval guard, evidence/readback output, memory/source candidate, or hook candidate.
- **Skill**: a Codex-readable reusable workflow package with trigger, purpose, inputs, outputs, forbidden behavior, verification, owner/removal condition, and minimal context footprint.
- **Guard**: a deterministic check that catches regression or unsafe behavior. A guard should be runnable by tests, a golden task, a CLI smoke, Promptfoo smoke, or CI.
- **Hook Candidate**: a repeated deterministic policy problem that may later become a Codex hook. Candidate status does not authorize hook implementation.
- **MCP Candidate**: a need for live external data/tool access that cannot be served by current CLI/readback/files. Candidate status does not authorize MCP server implementation.

## Current Baseline To Verify At Start

Do not assume this section is current. Verify it before editing.

Expected baseline from the operator conversation:

- V02-03 through V02-08 were completed, pushed, and CI-confirmed.
- V03-00 through V03-06 were completed, pushed, and CI-confirmed.
- KRN remains `controlled-internal-alpha for technical operators`.
- KRN is not product-ready and not widened internal alpha.
- V02-01 remains blocked/deferred until real second-operator inputs exist: operator identity, source, target repo, DB mode, support boundary, and transcript.
- V03 removed the earlier local DB caveat by proving current-shell DB recovery, target fixture proof, owner-file recall, evidence/readback, memory usefulness loop, and operator preflight guidance.
- Recent target/headless work may have left or proposed changes around:
  - `docs/runbooks/target-repo-testing.md`
  - `docs/runbooks/second-operator-alpha-trial.md`
  - `docs/reviews/controlled-dogfood/2026-06-27-headless-wilq-seo-target-trial/REPORT.md`
- A concrete candidate friction may exist: generic KRN `db:smoke` idempotency after fresh Docker volume recovery.

Start by proving or correcting this baseline from the repository.

## Official Process Constraints Adopted

This ExecPlan follows the OpenAI Codex ExecPlan and Goals patterns:

- The plan must be self-contained and novice-guiding.
- Progress, discoveries, decisions, outcomes, and evidence must be kept live.
- Every milestone must have a story: goal, work, result, proof.
- A Goal should define outcome, verification surface, constraints, boundaries, iteration policy, and blocked stop condition.
- Work continues by evidence, not by vibes. The Goal is not complete because one slice passed.
- Budget or elapsed time is not completion. At a budget stop, summarize progress and next steps without claiming completion.

Reference URLs:

- `https://developers.openai.com/cookbook/articles/codex_exec_plans`
- `https://developers.openai.com/cookbook/examples/codex/using_goals_in_codex`

## Hard Non-Goals

Do not build or claim any of the following in this run:

- fake V02-01 second-operator proof;
- product-ready claim;
- widened internal-alpha claim unless the final re-gate evidence explicitly supports it and root `PLAN.md` acceptance criteria allow it;
- dashboard;
- API server;
- MCP server;
- worker daemon;
- source crawler;
- broad eval platform;
- generic multi-agent system;
- stack-specific agent zoo;
- runtime markdown memory;
- `.krn` runtime truth;
- broad rewrite of activation scoring without evidence from controlled scenarios;
- broad rewrite of reflection extraction without evidence from controlled scenarios;
- living target repo writes without explicit target, allowed files, and rollback path;
- hidden semantic policy in hooks;
- `git add .` or broad commits without reviewing the diff.

## Completion Criteria For The Whole V04 Run

Do not mark the Goal complete unless all required criteria are met or explicitly deferred with evidence and a root-plan update.

Required completion:

1. Root `PLAN.md` and `GOAL.md` reflect V04 as the current or completed run and preserve V02-01 as external proof, not faked by self-runs.
2. Any dirty governance/runbook/report changes present at start are either verified and committed, or explicitly rejected/restored with evidence.
3. At least one concrete product friction from recent evidence is repaired or explicitly proven already fixed. Preference: `db:smoke` idempotency after fresh Docker volume recovery if still valid.
4. At least **two** bounded product repairs are completed, verified, committed, pushed, and CI-confirmed unless evidence proves there are fewer safe repairs; docs-only clarification counts only if it removes real operator ambiguity found in a scenario.
5. A minimal Controlled Scenario Factory exists as docs and, where useful, a schema/fixture/test guard. It must classify scenario modes and proof/non-proof boundaries.
6. A Knowledge Condensation Gate exists and is used by every new scenario report.
7. At least one and at most two repo skills are created or materially improved. Preferred first skills: `target-repo-testing` and `evidence-review-loop`.
8. At least **six** controlled scenarios are planned through the new discipline with proof/non-proof and condensation targets.
9. At least **four** controlled scenarios are executed or replayed through the new discipline and produce reports with condensation decisions. They must cover at least three modes/functions across KRN-on-KRN repair, DB replay/readiness/smoke, headless target observation, skill/evidence-review loop, activation/owner-file recall, source decision, memory/anti-memory, or readback proof boundary.
10. At least **three** concrete condensations are accepted and implemented. Examples: skill + guard + AGENTS rule; deterministic eval + evidence/readback improvement + source/memory candidate; runbook compression + CLI output improvement + GoldenTask.
11. At least one deterministic regression guard is added or strengthened through existing project mechanisms: unit test, GoldenTask, brain-battle smoke, Promptfoo smoke adapter, or CLI smoke. Do not create a broad eval platform.
12. An internal brain usefulness re-gate report exists and states whether KRN is more useful for our own workflows after V04.
13. Verification passes locally where possible: `pnpm typecheck`, `pnpm test`, `git diff --check`, and relevant smoke/eval/DB commands for touched surfaces.
14. Changes are committed, pushed, and CI result is recorded. If CI cannot be checked, record that as a blocker or limitation.
15. Worktree ends clean or the final response explicitly lists uncommitted files and why they remain.

## Long-Run Expansion Rule

The milestone list is a spine, not a cap. If M0-M14 are finished but the completion criteria above are not met, continue by selecting the next controlled scenario or bounded repair from the backlog and add a new timestamped Progress item. Do not stop because the written milestone list ended. Stop only when evidence gates are met, a real blocker appears, or a budget stop requires handoff.

After the first scenario succeeds, run another scenario that stresses a different brain function. After a repair succeeds, run a scenario or guard that proves the repair changed future behavior. This alternation is the core long-run loop.

## Continuation / Auto-Compact Recovery Rule

After auto-compact, resume, context loss, or a new `/goal` continuation, do not
restart the project from conversation memory. Reconstruct current truth from the
repo and keep moving the active slice forward.

Required recovery order:

1. Read root `GOAL.md`.
2. Read root `PLAN.md`.
3. Read this V04 ExecPlan.
4. Run the current-state preflight from `Start Every Continuation With`.
5. Inspect `Progress`, `Evidence Ledger`, `Decision Log`, and
   `Condensation Queue`.
6. Identify the first incomplete V04 milestone or the current active slice.
7. If a slice was committed but not pushed or CI-checked, finish push/CI before
   starting unrelated implementation.
8. If a slice is complete, update this plan, choose the next unmet completion
   criterion, and continue with the smallest evidence-backed product action.

Do not stop after a minor doc/report repair if the V04 completion criteria are
still unmet. Do not ask the operator what to do next when the next action is
discoverable from this plan, current repo state, and evidence.

New work discovery rule:

```txt
new evidence
  -> finding
  -> condensation decision
  -> bounded task in this ExecPlan
  -> verification
  -> commit/push/CI
  -> next scenario or repair
```

Research condensation rule:

```txt
source -> mechanism -> KRN implication -> decision/rejection -> falsifier
```

Research that does not produce a decision, rejection, falsifier, durable
surface, or scenario candidate should not be retained in active context.

## Stop Conditions

Stop and report instead of continuing if any of these occur:

- A step requires real second-operator inputs. Do not fake them.
- A step requires writing to a living target repo without explicit allowed files and rollback path.
- Local or remote DB is unavailable and the active step specifically requires DB truth; record blocker and switch only if the next milestone does not depend on DB.
- A verification failure indicates possible data loss, secret exposure, destructive write, or memory/source poisoning.
- CI fails and the cause is within this run’s changes; fix before continuing.
- The run reaches budget/time limit. Stop substantive work, summarize progress, do not mark complete unless evidence gates are met.
- The plan itself becomes misleading. Update `Decision Log`, `Progress`, and root `PLAN.md` before continuing.

## Work Protocol

### Start Every Continuation With

```sh
git fetch --prune
git status --short --branch
git log --oneline -n 8
sed -n '1,220p' PLAN.md
sed -n '1,160p' GOAL.md
```

Then inspect relevant current files instead of relying on memory:

```sh
rg -n "V02-01|V03|V04|controlled|scenario|condensation|target-repo|db:smoke|brain-battle|skill|AGENTS|hook|MCP|subagent" PLAN.md GOAL.md docs packages tests .agents .codex 2>/dev/null || true
```

### Progress Updates Inside The Plan

After each milestone or meaningful blocker, update `Progress` with:

```txt
- [x] (YYYY-MM-DD HH:MM TZ) Milestone/task completed. Evidence: command/report/commit.
- [ ] Remaining: specific next task.
```

If progress is partial, split it into done vs remaining. Do not leave ambiguous “mostly done” entries.

### Commit Discipline

Use focused commits. Before each commit:

```sh
git diff --check
git status --short
git diff --stat
git diff -- <touched files>
```

Avoid broad staging. Stage named files only.

After each major milestone or repair:

```sh
git status --short --branch
git commit -m "<scope>: <specific outcome>"
git push
```

Then check CI if GitHub CLI is available:

```sh
gh run list --branch main --limit 5
gh run watch <run-id> --exit-status
```

If CI fails because of this run, fix before proceeding to unrelated work.

### Verification Commands

Run the narrowest relevant commands first, then broad verification before committing or at milestone boundaries.

Always run after source changes:

```sh
pnpm typecheck
pnpm test
git diff --check
```

Run when eval/golden/brain-battle surfaces are touched:

```sh
pnpm eval:brain-battle:smoke
pnpm eval:promptfoo:smoke
```

Run when DB/runtime surfaces are touched or DB truth is claimed:

```sh
pnpm db:ready
pnpm db:smoke
```

Run when operator/source-workspace readiness is touched:

```sh
pnpm alpha:verify
```

If a command is unavailable or fails due to environment, record the exact output and what it does and does not prove.

## Milestones

### M0 — Baseline Audit And Plan Reconciliation

Goal: establish current truth before editing. At the end of M0, the executor knows whether the repo is clean, whether V03 is complete, whether V02-01 is still blocked, whether recent runbook/report changes exist, and what the first concrete product friction is.

Steps:

1. Run the start commands from `Work Protocol`.
2. Inspect current `PLAN.md` and `GOAL.md` for active task state.
3. Inspect recent V02/V03 reports and the latest CI run references.
4. Inspect recent target/headless files if present:
   - `docs/runbooks/target-repo-testing.md`
   - `docs/runbooks/second-operator-alpha-trial.md`
   - `docs/reviews/controlled-dogfood/2026-06-27-headless-wilq-seo-target-trial/REPORT.md`
5. Search for existing controlled scenario, condensation, skill, and eval/guard surfaces before creating new ones.
6. Update `Progress`, `Surprises & Discoveries`, and `Decision Log` if the baseline differs from expectations.

Acceptance:

- Current branch/worktree state is recorded.
- Current active/blocked task state is recorded.
- Any existing uncommitted changes are named.
- First likely product friction is named or explicitly marked `Unknown`.

### M1 — Close Or Reject Existing Dirty Governance Work

Goal: avoid building V04 on top of ambiguous, half-complete docs. At the end of M1, any dirty runbook/report/governance changes from earlier target/headless discussion are either committed with verification or reverted/rejected with evidence.

Steps:

1. If worktree is clean, mark M1 complete with evidence.
2. If dirty files exist, inspect each diff.
3. Classify each dirty change:
   - `keep and verify`;
   - `edit before keeping`;
   - `reject/revert`;
   - `requires operator input`.
4. For kept governance/report changes, run:
   - `git diff --check`;
   - targeted markdown/link/path sanity checks if applicable;
   - `pnpm typecheck` only if package/source references changed materially.
5. Commit kept changes in a focused governance commit.
6. Push and record CI if any source/test/command surfaces are affected.

Acceptance:

- Worktree is clean after M1.
- Kept changes have clear evidence and commit.
- Rejected changes are explained in `Decision Log`.

### M2 — Authorize V04 In Root PLAN/GOAL Without Replacing V02-01

Goal: root planning state must explain why V04 exists and why it is not a fake substitute for V02-01. At the end of M2, future Codex runs can continue V04 without rereading this chat.

Steps:

1. Update root `PLAN.md` with a compact V04 phase:
   - `V04 — Internal Brain Utility And Knowledge Condensation`.
   - State that V02-01 remains blocked/deferred external usability proof.
   - State that V04 is internal product hardening through controlled scenarios and condensation.
2. Add V04 tasks in dependency order:
   - V04-00 baseline/governance reconciliation;
   - V04-01 first concrete friction repair;
   - V04-02 controlled scenario factory;
   - V04-03 knowledge condensation gate;
   - V04-04 skill-first KRN initial skills;
   - V04-05 controlled scenario execution;
   - V04-06 guard/condensation expansion;
   - V04-07 internal brain usefulness re-gate.
3. Update `GOAL.md` compactly so it points to this V04 run and does not resurrect old completed tasks.
4. If checking this file into root as `PLANS.md`, ensure root `PLAN.md` names it as the living execution plan for V04 only.

Acceptance:

- Root `PLAN.md` is still product SSOT.
- `GOAL.md` is compact.
- V02-01 is not marked complete.
- V04 is authorized as a self/headless engineering-proof stream.

### M3 — Repair First Concrete Product Friction

Goal: make at least one real product improvement before adding more planning structure. The preferred candidate is generic KRN `db:smoke` idempotency after fresh Docker volume recovery, if still valid after inspection.

Steps:

1. Inspect the evidence that mentions the friction.
2. If the `db:smoke` idempotency issue is still valid:
   - identify the owner files through source inspection, not guessing;
   - write or update a failing/guarding test if practical;
   - repair the smallest product path: stable readiness, clear remediation, or idempotent smoke cleanup;
   - run DB commands if local DB is available;
   - record what local DB proof does and does not prove.
3. If the DB issue is already fixed or invalid:
   - document why;
   - choose the next concrete product friction from current reports, not from imagination;
   - apply the same repair discipline.
4. Add or update a controlled-dogfood report for this repair.

Acceptance:

- One concrete friction is fixed or proven invalid.
- A report names evidence, changed files, commands, proof/non-proof, and next condensation candidate.
- `pnpm typecheck`, `pnpm test`, and relevant DB/CI checks pass or blockers are explicit.

### M4 — Minimal Controlled Scenario Factory Contract

Goal: create a small, usable structure for controlled scenarios without building a broad platform. At the end of M4, an operator can define a scenario and understand what it proves, what it does not prove, and how findings condense.

Steps:

1. Search for existing scenario/report templates. Extend rather than duplicate if suitable.
2. Add or update `docs/architecture/controlled-scenario-factory.md` or the most appropriate existing architecture/runbook file.
3. Define scenario modes:
   - `observation-only`: inspect/report, no target writes;
   - `repair-trial`: source change allowed in KRN or target within explicit scope;
   - `source-repair`: bounded code/doc repair with owner files and rollback;
   - `db-backed-replay`: DB runtime behavior proof with current-shell truth;
   - `eval-guard`: deterministic regression guard or golden case.
4. Define required scenario fields:
   - ID;
   - product question;
   - target project/repo/module;
   - allowed reads;
   - allowed writes;
   - forbidden writes/surfaces;
   - setup commands;
   - verification commands;
   - expected KRN behavior;
   - proof boundary;
   - non-proof boundary;
   - condensation target;
   - blocker condition.
5. If the repo has schema/test patterns that make it cheap, add one fixture or validation test. If that would be a platform detour, document candidate-only.

Acceptance:

- Scenario contract is clear enough for a novice operator.
- Contract prevents fake product proof.
- Contract includes proof/non-proof and condensation target fields.
- No broad runner/platform is introduced unless existing code makes it tiny and testable.

### M5 — Knowledge Condensation Gate

Goal: stop reports from becoming dead ledgers. At the end of M5, every controlled scenario report has to say whether its findings become a durable surface, are deferred, or are rejected.

Steps:

1. Add or update `docs/architecture/knowledge-condensation-gate.md` or integrate into the controlled-scenario doc if that is cleaner.
2. Define the gate:
   - seen once: report only unless high-risk;
   - seen twice: candidate for AGENTS rule, skill, guard, memory/source candidate, or evidence/readback change;
   - seen three times or high-risk deterministic failure: implement or explicitly reject a guard/skill/rule;
   - not actionable: reject and state why.
3. Define allowed condensation targets:
   - `AGENTS rule` for tiny durable repo-wide rule;
   - `skill` for repeated workflow;
   - `test/golden/eval guard` for deterministic regression;
   - `evidence/readback improvement` for proof visibility;
   - `memory candidate` for reviewable durable project knowledge;
   - `source decision` for mechanism/decision/falsifier;
   - `hook candidate` for future deterministic enforcement;
   - `MCP candidate` for future live external integration;
   - `none/reject` for non-actionable or one-off noise.
4. Update the report template or create a reusable section that scenario reports must use.
5. Add a deterministic documentation/test guard if existing infrastructure supports it cheaply.

Acceptance:

- Future reports cannot end without a condensation decision.
- Gate keeps active plan short by moving detail into reports while preserving durable actions.
- No repeated finding remains as report-only without explicit reason.

### M6 — Skill-First KRN: First One Or Two Repo Skills

Goal: convert repeated workflows into Codex-native skills rather than longer AGENTS files or more docs. At the end of M6, KRN has at least one usable repo skill that a future Codex run can load for a repeated workflow.

Preferred skills:

1. `target-repo-testing`
2. `evidence-review-loop`

Steps:

1. Inspect existing skill directories and naming conventions:
   - `.agents/skills/**/SKILL.md`
   - `.codex/skills/**/SKILL.md`
   - any project-specific skill docs.
2. Do not create more than two skills in this run unless `Decision Log` records a high-confidence reason.
3. For each skill, include:
   - purpose;
   - trigger;
   - when not to use;
   - inputs;
   - workflow;
   - outputs;
   - forbidden behavior;
   - verification;
   - report format;
   - removal condition.
4. Keep skills workflow-focused, not KRN marketing.
5. Keep AGENTS tiny. If an AGENTS rule is needed, add only a short pointer to skills and stable hard rules.
6. Add a report or architecture note showing which repeated finding each skill condenses.

Acceptance:

- At least one skill exists and is operationally useful.
- Skills are small enough to load only when triggered.
- No skill zoo is created.
- At least one future workflow becomes easier because of the skill.

### M7 — Deterministic Guard Expansion From Real Failure

Goal: add or strengthen at least one deterministic guard based on prior V02/V03/V04 evidence. At the end of M7, a regression toward a known bad behavior fails a test/smoke/golden case.

Candidate guard areas:

- run readback proof/non-proof separation;
- decorative source rejection;
- scenario reports requiring condensation decisions;
- target dirty-state/write-scope handling;
- DB smoke idempotency/remediation;
- skill manifest required sections;
- target owner-file recall below named roots;
- memory usefulness feedback does not auto-mutate Memory Core.

Steps:

1. Pick one guard from actual repeated or high-risk findings.
2. Use existing guard infrastructure first:
   - unit test;
   - GoldenTask fixture;
   - `eval:brain-battle:smoke`;
   - Promptfoo smoke only as adapter smoke unless behavior proof is already bounded;
   - CLI smoke.
3. Avoid LLM-as-judge unless a deterministic check is impossible and the judge can be validated.
4. Document what the guard proves and does not prove.
5. Run relevant verification.

Acceptance:

- One known bad behavior is now harder to regress.
- Guard is deterministic or explicitly explains why not.
- No broad eval platform is created.

### M8 — Execute Controlled Scenario Batch 1

Goal: use the new scenario and condensation discipline on one real controlled scenario. At the end of M8, there is a scenario report with evidence and a condensation decision.

Preferred scenario types, in order:

1. KRN-on-KRN source repair related to a current friction.
2. DB-backed replay of the repaired runtime behavior.
3. Observation-only target repo trial if a target is available and allowed.
4. Repo-local target fixture if no living target scope exists.

Steps:

1. Create scenario entry from M4 contract.
2. Run scenario setup commands.
3. Use KRN planning/readback/evidence commands where relevant.
4. Execute only allowed writes.
5. Capture evidence.
6. Write report with:
   - scenario ID;
   - product question;
   - commands;
   - selected/used/helped/missing context;
   - proof/non-proof;
   - condensation decision;
   - next bounded repair.
7. Implement one accepted condensation if it is small and safe; otherwise queue it in `Condensation Queue`.

Acceptance:

- Scenario report exists.
- Report uses Knowledge Condensation Gate.
- At least one finding is accepted/rejected/deferred with rationale.
- No fake V02-01/product-ready claim.

### M9 — Execute Controlled Scenario Batch 2 Or Prove Why Not

Goal: avoid overfitting to one scenario if the run still has capacity. At the end of M9, either a second scenario is executed or a clear blocker explains why another scenario would be low-signal or unsafe.

Steps:

1. Choose a scenario mode different from M8 if possible.
2. Prefer an observation-only target/headless scenario or a DB-backed replay.
3. Apply the same report and condensation discipline.
4. If a living target repo is considered, enforce target repo testing rules and no writes without scope.
5. If no credible scenario exists, record why and move to M10.

Acceptance:

- Second scenario report exists, or `Decision Log` explains deferral.
- No scenario is run just to create activity.

### M10 — Implement Accepted Condensations

Goal: turn scenario findings into durable future behavior. At the end of M10, at least two accepted condensations from M5/M8/M9 are implemented.

Steps:

1. Review `Condensation Queue`.
2. Pick the highest product-ROI condensations that are small enough for this run.
3. Implement at least two if possible:
   - one skill/rule/docs condensation;
   - one guard/test/evidence/readback condensation.
4. For each implemented condensation, state:
   - source finding;
   - chosen durable surface;
   - rejected alternatives;
   - verification.
5. If fewer than two can be implemented, record blocker and why the remaining candidates are unsafe/too broad.

Acceptance:

- At least two findings are converted into durable product surfaces, or blockers are explicit.
- Active context is more compressed after the change, not more sprawling.

### M11 — AGENTS And Skill Surface Compression Pass

Goal: ensure durable guidance stays small and skills carry workflows. At the end of M11, AGENTS remains tiny and points to the right surfaces; skills carry repeated workflows.

Steps:

1. Inspect `AGENTS.md` and any repo skill discovery docs.
2. Remove or avoid long narrative additions to AGENTS.
3. Add only tiny durable rules that must always apply.
4. Move longer procedures into skills or runbooks.
5. Verify there are no contradictory instructions across AGENTS, GOAL, PLAN, PLANS, runbooks, and skills.

Acceptance:

- AGENTS is not bloated.
- Skills/runbooks contain workflow detail.
- No contradiction tells future Codex both to avoid and to create the same surface.

### M12 — Hard Guard / Hook Candidate Screening

Goal: decide whether any repeated finding deserves a future hook. At the end of M12, hooks remain deferred unless there is deterministic repeated evidence and a small safe implementation path.

Steps:

1. Review scenario reports and `Condensation Queue` for hook candidates.
2. For each hook candidate, ask:
   - Is it deterministic?
   - Is it a safety/write/destructive boundary?
   - Can it explain denial/warning to the operator?
   - Can it be bypassed accidentally by an equivalent path?
   - Is a test/skill/runbook guard enough for now?
3. Record accepted/rejected/deferred hook candidates.
4. Do not implement a hook unless the evidence is strong, repeated, and the implementation is tiny.

Acceptance:

- Hook logic does not become hidden semantic brain.
- Future hook candidates are explicit.

### M13 — MCP And Subagent Candidate Screening

Goal: prevent premature MCP/subagent work while capturing real future needs. At the end of M13, MCP/subagents are either still deferred or have a sharply bounded candidate with proof.

Steps:

1. Review scenarios for live external data/tool needs.
2. Classify MCP candidates only when current CLI/files/DB readback cannot answer a useful question.
3. Review repeated work that could benefit from read-heavy subagents:
   - repo explorer;
   - test failure analyst;
   - source-to-decision researcher;
   - reviewer.
4. Do not implement MCP/subagents in this run unless root `PLAN.md` already authorizes it and evidence is decisive.
5. Record candidates in `Decision Log` or architecture docs.

Acceptance:

- No MCP/subagent sprawl.
- Future candidates are evidence-backed, not vibes.

### M14 — Internal Brain Usefulness Metrics

Goal: measure whether V04 actually improved our internal use, not just created artifacts. At the end of M14, there is a small evidence-backed scorecard.

Metrics to report qualitatively and, where possible, numerically:

- manual source search reduced: yes/no/evidence;
- owner-file recall improved: yes/no/evidence;
- proof vs non-proof clearer: yes/no/evidence;
- repeated explanation condensed: yes/no/evidence;
- memory/source candidates clearer: yes/no/evidence;
- skills reduce workflow ambiguity: yes/no/evidence;
- review burden reduced: yes/no/evidence;
- context waste reduced: yes/no/evidence;
- active plan shorter or clearer: yes/no/evidence;
- new complexity introduced: yes/no/evidence.

Acceptance:

- Scorecard has evidence, not vibes.
- Any metric marked positive names a command/report/diff that supports it.
- Any unknown is marked `Unknown` or `Requires verification`.

### M15 — Controlled Internal Brain Re-Gate

Goal: decide what KRN is after V04. At the end of M15, root plan has a clear readiness classification and next active work.

Possible verdicts:

- `internal-brain improved; continue scenario/condensation loop`;
- `internal-brain improved; ready for V02-01 real operator when inputs exist`;
- `internal-brain blocked by specific product friction`;
- `internal-brain did not improve; revert/rescope required`.

The verdict must not say product-ready unless all product-ready gates in root `PLAN.md` are met.

Steps:

1. Write report under `docs/reviews/controlled-dogfood/YYYY-MM-DD-internal-brain-utility-v04/REPORT.md` or the current date convention.
2. Include:
   - baseline;
   - work completed;
   - evidence;
   - what improved;
   - what did not improve;
   - V02-01 boundary;
   - next recommended action;
   - condensation queue status.
3. Update `PLAN.md` and `GOAL.md` compactly.

Acceptance:

- Report exists.
- Readiness classification is honest.
- Next action is bounded.

### M16 — Final Verification, CI, And Handoff

Goal: leave the repository in a clean, resumable, verified state. At the end of M16, future Codex or a human can resume from repo state and reports without this chat.

Steps:

1. Run required verification:

```sh
pnpm typecheck
pnpm test
pnpm eval:brain-battle:smoke || true
pnpm eval:promptfoo:smoke || true
git diff --check
git status --short --branch
```

Run DB checks if DB surfaces were touched or DB truth is claimed:

```sh
pnpm db:ready
pnpm db:smoke
```

2. Commit any remaining verified changes.
3. Push.
4. Check CI.
5. Update `Outcomes & Retrospective` and `Evidence Ledger`.
6. Ensure final response can use the required KRN format.

Acceptance:

- Worktree clean.
- main/origin state recorded.
- CI status recorded or limitation stated.
- Goal is complete only if completion criteria are met.

## Stretch Queue If Required Criteria Finish Early

Do not start stretch work until required milestones M0-M16 are complete or honestly deferred. Stretch work exists to support a long run without inventing busywork.

### S1 — Third Controlled Scenario

Run a third scenario only if it answers a new product question not already answered by M8/M9.

### S2 — Source-To-Decision Skill

Create or improve `source-to-decision` skill only if repeated source-hoarding or decorative-source findings appeared in V04.

### S3 — TypeScript Boundary Repair Skill

Create or improve `typescript-boundary-repair` skill only if V04 source repairs exposed repeated TypeScript boundary mistakes.

### S4 — Additional Golden Guard

Add one more deterministic GoldenTask/brain-battle guard only if a known bad behavior is still unprotected.

### S5 — Runbook Compression Pass

Compress runbooks if V04 added too much narrative. Keep high-use procedures in skills and reports; keep active plan compact.

## Progress

Update this section during execution. Initial checklist:

- [x] M0 baseline audit completed.
  Evidence: `git status --short --branch`, `git log --oneline -5`,
  `sed -n '1,180p' GOAL.md`, required `rg` searches, and dirty governance diff
  inspection on 2026-06-27.
- [x] M1 dirty governance work closed or rejected.
  Evidence: commit `9849754 docs(plan): authorize v04 internal brain utility`
  pushed to `origin/main`; GitHub Actions run `28273097780` passed KRN CI,
  including typecheck, tests, Promptfoo smoke, diff check, DB ready, Drizzle
  check, and DB smoke.
- [x] M2 V04 authorized in PLAN/GOAL.
  Evidence: root `PLAN.md` now names V04 as active and points to
  `docs/plans/v04-internal-brain-utility/PLANS.md`; `GOAL.md` points to the
  same ExecPlan and keeps V02-01 blocked/deferred.
- [x] M3 first concrete product friction repaired or invalidated.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-db-smoke-fresh-db-idempotency/REPORT.md`.
  Outcome: generic `db:smoke` fresh DB idempotency repair candidate rejected
  for now because current CI, local DB, and scratch DB checks passed.
- [x] M4 Controlled Scenario Factory contract added.
  Evidence: `docs/architecture/controlled-scenario-factory.md`.
- [x] M5 Knowledge Condensation Gate added.
  Evidence: `docs/architecture/controlled-scenario-factory.md` and
  `docs/reviews/controlled-dogfood/2026-06-27-db-smoke-fresh-db-idempotency/REPORT.md`.
- [x] M6 first one/two repo skills created or improved.
  Evidence: `.agents/skills/target-repo-testing/SKILL.md` and
  `docs/architecture/skill-first-krn.md`.
- [x] M7 deterministic guard expanded from real failure.
  Evidence: `packages/cli/src/targetRepoTestingSkill.test.ts` and focused
  `pnpm --filter @krn/cli test -- targetRepoTestingSkill` pass.
- [ ] M8 first controlled scenario executed with condensation decision.
- [ ] M9 second scenario executed or honestly deferred.
- [ ] M10 accepted condensations implemented.
- [ ] M11 AGENTS/skill surface compression pass completed.
- [ ] M12 hook candidates screened.
- [ ] M13 MCP/subagent candidates screened.
- [ ] M14 internal brain usefulness metrics written.
- [ ] M15 internal brain re-gate report written.
- [ ] M16 final verification/CI/handoff completed.

## Surprises & Discoveries

Append observations here as they occur.

- Observation: Root `PLAN.md` had been expanded into the full V04 long-run
  ExecPlan, which conflicted with the goal requirement that root `PLAN.md`
  remain the product single source of truth.
  Evidence: `git diff -- PLAN.md` showed the old compact V03 root plan replaced
  by a 1000+ line V04 plan.
  Impact: moved the long-run V04 ExecPlan to
  `docs/plans/v04-internal-brain-utility/PLANS.md` and restored root
  `PLAN.md` as a compact active plan.

- Observation: A root-level untracked `PLANS.md` existed alongside the intended
  `docs/plans/v04-internal-brain-utility/PLANS.md`.
  Evidence: `git status --short --branch` listed both `?? PLANS.md` and
  `?? docs/plans/v04-internal-brain-utility/`.
  Impact: removed root `PLANS.md` to avoid a competing execution plan.

- Observation: The headless `wilq-seo` target trial report previously implied a
  target repair boundary that was too broad for an observation/headless proof.
  Evidence: report diff corrected target edits as attempted but out-of-scope for
  this KRN report/commit, and added `docs/runbooks/target-repo-testing.md` as
  the durable boundary.
  Impact: V04-00 includes target repo testing rules as governance repair before
  further target scenarios.

- Observation: The live `wilq-seo` checkout is currently dirty and includes
  target-owned changes across skills, dashboard, tests, scripts, and Python
  source.
  Evidence: `git status --short --branch` run in
  `/home/krn/coding/krn/active/wilq-seo` during M0.
  Impact: V04 must not normalize, commit, or revert that target state. Target
  dirty files are external context unless a later target-repair slice explicitly
  authorizes target writes.

- Observation: Generic `pnpm db:smoke` fresh DB idempotency did not reproduce as
  a current failure.
  Evidence: CI run `28273097780` passed DB ready/check/smoke; local main DB
  `pnpm db:ready` and `pnpm db:smoke` passed; scratch DB `krn_v04_smoke`
  passed `db:ready` and repeated `db:smoke`.
  Impact: M3 rejects DB smoke source repair for now and preserves the historical
  failure as a scenario report, not source churn.

- Observation: Scenario reports need a mandatory condensation decision to keep
  V04 from becoming report sprawl.
  Evidence: `docs/architecture/controlled-scenario-factory.md` defines required
  report fields and `## Condensation Decision`.
  Impact: M4/M5 are complete as a minimal scenario/condensation operating
  contract.

- Observation: `target-repo-testing` is the first V04 skill-worthy workflow
  because the `wilq-seo` trial exposed a high-risk mode confusion: observation
  proof drifted into target repair.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-headless-wilq-seo-target-trial/REPORT.md`
  and `docs/runbooks/target-repo-testing.md`.
  Impact: M6 created a repo skill and M7 added a deterministic CLI-package test
  that protects the skill's target write boundary.

Template:

```txt
- Observation: ...
  Evidence: command/report/diff/log ...
  Impact: plan change or no change ...
```

## Decision Log

Initial decisions:

- Decision: V04 continues internal product hardening while V02-01 remains external proof.
  Rationale: self/headless scenarios are useful engineering proof but cannot prove second-operator usability.
  Consequence: V04 may run many controlled scenarios, but final reports must preserve V02-01 as blocked/deferred.

- Decision: Skills before MCP/subagents/dashboard.
  Rationale: repeated workflows can be condensed into Codex-native skills with low architecture cost; MCP/subagents/dashboard require stable workflows and stronger evidence.
  Consequence: first durable product surfaces are skills, guards, tiny AGENTS rules, reports, and memory/source candidates.

- Decision: Every scenario requires proof and non-proof boundaries.
  Rationale: KRN previously risks artifact theater; proof boundaries prevent overclaiming.
  Consequence: reports without proof/non-proof and condensation decisions are incomplete.

- Decision: Keep the V04 long-run plan under `docs/plans/v04-internal-brain-utility/PLANS.md`, not root `PLAN.md`.
  Rationale: root `PLAN.md` must remain compact product truth, while the V04
  ExecPlan is a detailed living execution artifact.
  Alternatives considered: keep the full V04 plan in root `PLAN.md`; keep a root
  `PLANS.md`.
  Consequence: future Codex runs load root `PLAN.md` first and opt into the
  detailed V04 plan only through the explicit pointer.
  Evidence: current `PLAN.md`, `GOAL.md`, and `docs/plans/v04-internal-brain-utility/PLANS.md`.

- Decision: Observation-only target trials must not patch target source/tests after verification failure.
  Rationale: the `wilq-seo` headless trial attempted target test fixes, then the
  operator clarified that the target checkout was a living project and target
  repair was not authorized.
  Alternatives considered: treat the attempted target patch as a target repair
  proof.
  Consequence: target failures in observation-only mode become evidence and
  recommendations, not direct target edits.
  Evidence: `docs/runbooks/target-repo-testing.md` and corrected
  `docs/reviews/controlled-dogfood/2026-06-27-headless-wilq-seo-target-trial/REPORT.md`.

- Decision: V04 continuations must resume from the current active slice and
  repository state, not from remembered conversation context.
  Rationale: auto-compact and long-running goals can otherwise restart old
  work, stop after a small task, or preserve stale assumptions.
  Alternatives considered: rely on chat memory or the latest assistant summary.
  Consequence: `GOAL.md` and this ExecPlan now define a fixed continuation
  recovery order; new findings must become bounded tasks or condensation
  decisions instead of context bloat.
  Evidence: `GOAL.md` Continuation After Compact and this plan's
  Continuation / Auto-Compact Recovery Rule.

- Decision: Do not modify DB migration/smoke code for the historical fresh-volume
  enum re-create failure without a current reproducer.
  Rationale: V04 scratch DB replay and CI both show current generic DB smoke
  passes; source changes would be speculative.
  Alternatives considered: make migration readiness skip migrator when
  migrations are already applied; rewrite enum migrations to `IF NOT EXISTS`;
  broaden DB smoke cleanup.
  Consequence: M3 is closed as a rejected repair candidate; future failures must
  include exact command output before source changes.
  Evidence: `docs/reviews/controlled-dogfood/2026-06-27-db-smoke-fresh-db-idempotency/REPORT.md`.

- Decision: Condense the target repo write-boundary finding into a repo skill
  plus deterministic text guard.
  Rationale: target repo mode confusion is high-risk and repeated guidance in
  `AGENTS.md` would bloat startup context.
  Alternatives considered: keep only the runbook; add a hook; build target-aware
  CLI enforcement immediately.
  Consequence: future target trials can trigger `$target-repo-testing`; hook/CLI
  enforcement remains candidate-only until more scenarios prove the need.
  Evidence: `.agents/skills/target-repo-testing/SKILL.md`,
  `docs/architecture/skill-first-krn.md`, and
  `packages/cli/src/targetRepoTestingSkill.test.ts`.

Append future decisions with this template:

```txt
- Decision: ...
  Rationale: ...
  Alternatives considered: ...
  Consequence: ...
  Evidence: ...
```

## Evidence Ledger

Record commands, reports, commits, and CI here.

- Evidence ID: E-20260627-01
  Milestone: M0
  Command/report/commit: `git log --oneline -5`; `git status --short --branch`;
    `sed -n '1,180p' GOAL.md`; required `rg` searches across plan/report/runbook
    surfaces.
  Result: pass.
  Proves: V03 latest public/local baseline is visible from current repo state;
    V02-01 is still blocked/deferred; V04 planning terms and dirty governance
    changes were discoverable.
  Does not prove: V04 completion, product readiness, or CI for this slice.

- Evidence ID: E-20260627-02
  Milestone: M1/M2
  Command/report/commit: inspected and edited `PLAN.md`, `GOAL.md`,
    `docs/plans/v04-internal-brain-utility/PLANS.md`,
    `docs/runbooks/target-repo-testing.md`,
    `docs/runbooks/second-operator-alpha-trial.md`, and
    `docs/reviews/controlled-dogfood/2026-06-27-headless-wilq-seo-target-trial/REPORT.md`.
  Result: pass; committed as `9849754 docs(plan): authorize v04 internal brain
    utility`, pushed to `origin/main`, CI run `28273097780` passed.
  Proves: V04-00/M1 governance reconciliation is persisted remotely and did not
    break KRN CI, including DB smoke.
  Does not prove: V04 completion, product readiness, or the next product repair.

- Evidence ID: E-20260627-03
  Milestone: M1
  Command/report/commit: `gh run watch 28273097780 --exit-status`.
  Result: pass.
  Proves: pushed commit `9849754` passed typecheck, tests, Promptfoo smoke, diff
    check, DB ready, Drizzle check, and DB smoke in CI.
  Does not prove: local DB truth for the current shell or `db:smoke`
    idempotency under fresh-volume edge cases beyond CI's configured flow.

- Evidence ID: E-20260627-04
  Milestone: M3
  Command/report/commit: local main DB `pnpm db:ready`; local main DB
    `pnpm db:smoke`; scratch DB `krn_v04_smoke` create, `db:ready`, repeated
    `db:smoke`, and drop.
  Result: pass.
  Proves: current generic DB smoke passes locally and is repeatable after fresh
    scratch DB migration.
  Does not prove: every named DB smoke target or future Docker volume recreation.

- Evidence ID: E-20260627-05
  Milestone: M4/M5
  Command/report/commit: `docs/architecture/controlled-scenario-factory.md` and
    `docs/reviews/controlled-dogfood/2026-06-27-db-smoke-fresh-db-idempotency/REPORT.md`.
  Result: pass in working tree, pending commit/CI.
  Proves: V04 now has a minimal scenario contract and mandatory condensation
    decision format.
  Does not prove: scenario factory adoption by future reports until used again.

- Evidence ID: E-20260627-06
  Milestone: M6
  Command/report/commit: `.agents/skills/target-repo-testing/SKILL.md`,
    `.agents/skills/target-repo-testing/agents/openai.yaml`, and
    `docs/architecture/skill-first-krn.md`.
  Result: pass in working tree, pending commit/CI.
  Proves: V04 has one repo skill that condenses the high-risk target write
    boundary workflow.
  Does not prove: future target scenarios will invoke the skill correctly.

- Evidence ID: E-20260627-07
  Milestone: M7
  Command/report/commit: `pnpm --filter @krn/cli test -- targetRepoTestingSkill`.
  Result: pass.
  Proves: deterministic test coverage protects the target-repo-testing skill
    name, metadata, observation-only default, and forbidden target writes.
  Does not prove: target-aware CLI enforcement or arbitrary target repo safety.

Template:

```txt
- Evidence ID: E-YYYYMMDD-NN
  Milestone: M#
  Command/report/commit: ...
  Result: pass/fail/blocked
  Proves: ...
  Does not prove: ...
```

## Condensation Queue

Use this queue for findings that should become durable product surfaces.

Template:

```txt
- Finding: ...
  Source scenario/report: ...
  Frequency: first / repeated / high-risk
  Candidate target: AGENTS / skill / guard / evidence-readback / memory / source / hook-candidate / MCP-candidate / none
  Decision: accepted / rejected / deferred
  Reason: ...
  Implemented in: file/commit or N/A
```

Initial candidate placeholders to verify from repo evidence:

- Finding: DB smoke idempotency/remediation after fresh Docker volume recovery may be weak.
  Source scenario/report: verify from recent target/headless report.
  Frequency: historical one-off; current V04 scenario did not reproduce.
  Candidate target: product repair + guard.
  Decision: rejected for source repair now.
  Reason: current CI, local main DB, and fresh scratch DB replay all pass
  generic `db:smoke`; source changes would be speculative without exact current
  failure output.
  Implemented in: `docs/reviews/controlled-dogfood/2026-06-27-db-smoke-fresh-db-idempotency/REPORT.md`.

- Finding: Target repo testing needs strict write/dirty-state handling.
  Source scenario/report: verify from `target-repo-testing.md` and headless target report.
  Frequency: high-risk after the `wilq-seo` headless trial overstepped target
  write scope.
  Candidate target: runbook + skill + deterministic guard.
  Decision: accepted and implemented.
  Reason: target repo writes can damage a living checkout; the first durable
  surfaces are a clear runbook mode split, repo skill, and text guard before
  automation.
  Implemented in: `docs/runbooks/target-repo-testing.md`;
  `.agents/skills/target-repo-testing/SKILL.md`;
  `packages/cli/src/targetRepoTestingSkill.test.ts`.

- Finding: Evidence/review loop needs compact repeated workflow.
  Source scenario/report: prior V02/V03 reports.
  Frequency: repeated.
  Candidate target: skill.
  Decision: candidate for M6.

## Interfaces And Dependencies

Prefer existing repository patterns. Do not introduce new frameworks unless a milestone explicitly justifies them.

Likely existing surfaces to inspect and reuse:

- Root plan/goals:
  - `PLAN.md`
  - `GOAL.md`
  - `PLANS.md` if checked in for this run
- Runbooks/reports:
  - `docs/runbooks/second-operator-alpha-trial.md`
  - `docs/runbooks/target-repo-testing.md`
  - `docs/reviews/controlled-dogfood/**/REPORT.md`
- Eval/golden surfaces:
  - `packages/harness/src/goldenRunner.ts`
  - `packages/harness/src/goldenKrnBehaviorGate.ts`
  - `tests/fixtures/golden-tasks/**`
  - Promptfoo fixtures under `tests/fixtures/promptfoo/**`
  - root scripts `eval:brain-battle:smoke` and `eval:promptfoo:smoke` if present
- Activation/target surfaces:
  - `packages/harness/src/activation/**`
  - target read-model code discovered by `rg "target" packages/harness packages/cli packages/db`
- CLI/runtime surfaces:
  - `packages/cli/src/**`
  - `packages/db/src/**`
  - root `package.json` scripts
- Skills:
  - `.agents/skills/**/SKILL.md`
  - `.codex/skills/**/SKILL.md`
  - any repo-specific skill directory found by inspection

If paths differ, update this section during M0.

## Expected Report Format For Scenario Reports

Every controlled scenario report should contain:

```md
# <Scenario Title>

Status: complete / blocked / partial
Scenario ID:
Mode: observation-only / repair-trial / source-repair / db-backed-replay / eval-guard
Date:
Operator:
Target:

## Product Question

## Allowed Reads / Writes

## Forbidden Writes / Surfaces

## Setup

## Commands Run

| Command | Result | Proves | Does Not Prove |
| --- | --- | --- | --- |

## KRN Behavior Observed

- selected context:
- excluded context:
- owner-file recall:
- memory/source use:
- evidence/readback:
- review burden:

## Findings

## Knowledge Condensation Decision

- Finding:
- Frequency:
- Candidate target:
- Decision:
- Reason:
- Next bounded repair:

## What This Proves

## What This Does Not Prove

## Next Recommended Action
```

## Final Response Format

The final response to the operator must include:

```txt
Read:
- ...

Changed:
- ...

DB used:
- yes/no; local/CI; what was verified; what remains unverified

Commands run:
- ...

Reports/artifacts:
- ...

Commits pushed:
- ...

CI:
- run id/status or explicit limitation

What this proves:
- ...

What this does not prove:
- ...

Knowledge condensed:
- ...

Candidates proposed/deferred:
- ...

Readiness verdict:
- ...

Next recommended action:
- ...
```

## Embedded `/goal` Activation Prompt

Use this as the Goal prompt if no separate prompt file is used:

```md
# Goal: Execute V04 Long-Run ExecPlan — Internal Brain Utility And Knowledge Condensation

You are working in `/home/krn/coding/krn/active/mise-en-palace`.

Use root `PLAN.md` as the product single source of truth. Use `PLANS.md` as the living execution plan for this V04 long run if it exists in the repo; otherwise create/update it from the attached ExecPlan before continuing. Keep `PLANS.md` updated as a living document.

Outcome:
KRN becomes more useful for our own real workflows by executing controlled scenarios, repairing at least one concrete product friction, and condensing repeated findings into durable surfaces: small AGENTS rules, repo skills, deterministic guards/tests/evals, evidence/readback improvements, memory/source candidates, or future hook/MCP/subagent candidates.

Verification surface:
- updated `PLAN.md` / `GOAL.md`;
- living `PLANS.md` progress, discoveries, decision log, evidence ledger, and retrospective;
- at least one concrete product repair or explicit invalidation with evidence;
- Controlled Scenario Factory contract;
- Knowledge Condensation Gate;
- at least one and at most two repo skills, unless the plan records a strong reason;
- at least one controlled scenario report with proof/non-proof and condensation decision;
- at least one deterministic guard added or strengthened;
- final V04 internal brain usefulness re-gate report;
- `pnpm typecheck`, `pnpm test`, `git diff --check`, and relevant smoke/DB/eval commands;
- pushed commits and CI status.

Constraints:
- do not fake V02-01;
- do not claim product readiness;
- do not build dashboard, API, MCP server, worker daemon, source crawler, broad eval platform, or agent zoo;
- do not write to living target repos without explicit allowed files and rollback path;
- do not create runtime markdown memory or `.krn` runtime truth;
- do not stop after one slice if completion criteria are not met.

Iteration policy:
Follow `PLANS.md` milestones M0 through M16. After each milestone, update `PLANS.md`, verify, commit/push when appropriate, check CI when available, then continue to the next milestone. If a milestone is already complete, verify it and mark it complete with evidence instead of redoing it. If a chosen friction is invalid, choose the next concrete friction from current reports and record the decision.

Blocked stop condition:
Stop only for missing external input, unsafe target writes, unavailable required DB/runtime truth, CI failure caused by this run, budget/time limit, or a safety issue. On budget/time stop, summarize progress and next step; do not mark complete unless the evidence gates are met.
```

## Outcomes & Retrospective

Fill this at the end.

Template:

```txt
Outcome:
- ...

What became easier for future KRN runs:
- ...

What still hurts:
- ...

What was rejected as overengineering:
- ...

What should happen next:
- ...
```

## Revision Notes

- Initial version: created as the proper long-run V04 ExecPlan after operator feedback that the previous plan was too short and looked like a two-hour slice. This version expands the work into a self-contained, evidence-driven, long-running plan with explicit milestones, proof gates, condensation discipline, and continuation policy.
