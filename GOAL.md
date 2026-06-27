# Goal: Execute KRN Continuous Brain Growth

You are working in:

```txt
/home/krn/coding/krn/active/mise-en-palace
```

KRN is a Codex Operating Layer / AI Engineering Control Plane.

Codex executes. KRN supplies bounded context, store-backed memory, source
grounding, policy, skills, eval expectations, traces, review gates, and
feedback.

## Current Objective

Use root `PLAN.md` as the compact product single source of truth and use root
`PLANS.md` as the detailed continuous ExecPlan.

Active stream:

```txt
V11 — Product Readiness Re-Gate
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

## Current State

```txt
V02-03..V02-08: complete.
V03-00..V03-06: complete.
V04-00..V04-07: complete.
controlled-internal-alpha for technical operators: yes / stronger.
product-ready: no.
widened internal alpha: no.
V02-01 real second-operator proof: blocked/deferred.
V05 target-aware evidence capture repair: complete.
V06 activation / owner-file / context ROI utility: complete.
V07 memory / anti-memory / source usefulness loop: complete.
V08 skill-first workflow expansion: complete.
V09 deterministic hooks candidate decision: complete.
V10 MCP / subagent candidate gate: complete.
active stream: V11 product readiness re-gate.
current task: V11-00 — Product Readiness Re-Gate.
```

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
- Do not reopen archived historical plans as active context.
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

3. Inspect `PLANS.md` sections: `Progress`, `Evidence Ledger`, `Decision Log`,
   `Condensation Queue`, `Active Task Queue`, and `Generated Task Backlog`.
4. Return to the first incomplete active task. Do not restart from conversation
   memory.
5. If a previous slice was committed but not pushed or CI-checked, finish that
   before starting unrelated work.
6. If the current slice is complete, update progress, synthesize next tasks from
   evidence, append them to `PLANS.md`, and continue.
7. Research is useful only when mapped through:

   ```txt
   source -> mechanism -> KRN implication -> decision/rejection -> falsifier
   ```

8. Every scenario should reduce future context waste, repeated explanation,
   review burden, or product uncertainty.
