# Goal: Execute KRN Continuous Brain Growth

KRN is a Codex Operating Layer / AI Engineering Control Plane.

Codex executes. KRN supplies bounded context, store-backed memory, source
grounding, policy, skills, eval expectations, traces, review gates, and
feedback.

## Current Objective

Use root `PLAN.md` as the compact product single source of truth and root
`PLANS.md` as the detailed continuous ExecPlan.

Active stream:

```txt
V164 Post Controlled Scenario Pattern Gate Chain Re-Gate
```

Current product loop:

```txt
controlled scenario
  -> evidence
  -> finding
  -> condensation decision
  -> rule / skill / guard / eval / memory candidate / source decision / repair
  -> append next task to PLANS.md
  -> continue
```

Current state:

```txt
controlled-internal-alpha for technical operators: yes / stronger.
product-ready: no.
widened internal alpha: no.
V02-01 real second-operator proof: blocked/deferred.
V100..V109: active-surface, handoff, and PLANS freshness guards complete.
V110..V163: revision-note, checkpoint rollup, smoke coverage, pattern-gate,
task-contract, final-response, TypeScript boundary, source trust metadata,
pattern-intake output, source location scheme, source-to-decision skill, and
current-smoke description, Promptfoo adapter boundary, source classification,
latest-outcome source-to-decision, source-to-decision skill output, and
source-class vocabulary, verification TMPDIR, and TypeScript boundary re-scan
plus stale attachment objective and compact stale-objective contract guards
plus progress stale-active, root PLAN pattern-gate, and brain-battle smoke
description plus compact pattern-gate contract and continuation-chain guards
plus kernel and controlled-scenario pattern-gate chain guards complete.
current task: V164-00 Post Controlled Scenario Pattern Gate Chain Re-Gate.
```

Detailed completed history, evidence, outcomes, and next-task synthesis live in
`PLANS.md`, not here.

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
material. They must not be described as second-operator proof or product-ready
proof.

## Operating Rules

- Keep `GOAL.md` compact.
- Keep root `PLAN.md` compact and authoritative.
- Keep detailed work in root `PLANS.md`.
- Do not create another parallel roadmap.
- Do not reopen archived plans as active context.
- Do not build dashboard, API, MCP server, worker runtime, source crawler,
  broad eval platform, `krn audit`, anti-slop scanner, generic multi-agent
  system, runtime markdown memory, or hidden semantic hooks unless `PLANS.md`
  explicitly authorizes a bounded evidence-backed task.
- Do not write to living target repos unless the active task explicitly allows
  target writes, allowed files, rollback, and verification.
- After each bounded slice, verify, commit, push, and check CI when relevant.
- Do not mark this continuous goal complete after one slice, one report, one
  repair, one skill, or one scenario.
- After every completed slice, update `PLANS.md`, append any new tasks
  discovered from evidence, and continue with the next highest-ROI task.
- For every non-trivial infra, harness, CI, eval, Codex-surface, TypeScript,
  target-workflow, or research/paper/course-driven slice, apply the pattern
  gate: source -> mechanism -> KRN implication -> decision/rejection ->
  consumer -> falsifier.
- Completion requires explicit operator stop, product-ready gate evidence, or an
  honest blocked/budget-limited handoff. Budget limit is not success.

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
6. If the current slice is complete, synthesize next tasks from evidence,
   append them to `PLANS.md`, update compact active state, and continue.
7. Research is useful only when mapped through:

   ```txt
   source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier
   ```
