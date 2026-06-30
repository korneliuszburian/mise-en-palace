# Goal: Execute KRN Continuous Brain Growth

KRN is a Codex Operating Layer / AI Engineering Control Plane.

Codex executes. KRN supplies bounded context, store-backed memory, source
grounding, policy, skills, eval expectations, traces, review gates, and
feedback.

## Current Objective

Use root `PLAN.md` as the compact product source of truth and root `PLANS.md`
as the compact execution ledger.

Detailed completed history, evidence, outcomes, and next-task synthesis live in
`PLANS.md` and archived reports.

Current active stream:

```txt
V366 Heartbeat Preview Golden Behavior Proof
```

Current state:

```txt
controlled-internal-alpha for technical operators: yes / stronger
product-ready: no
widened internal alpha: no
V02-01 real second-operator proof: blocked/deferred
current task: V366-00 Heartbeat Preview Golden Behavior Proof.
```

Current task: add one bounded behavior proof for the V365 heartbeat preview
review/eval closure before any daemon, scheduler, crawler, embeddings, schema,
UI/API/MCP, broad benchmark, or autonomous Memory Core/source mutation.

## Direction

Move toward a useful KRN Brain through product-facing vertical slices:

1. source-search answer usefulness;
2. mini Brain-QA readback;
3. ingest v0;
4. graph brain v0;
5. heartbeat/dreaming as candidate generator;
6. consensus as eval/candidate layer;
7. product UI/search/API/MCP only after usefulness and security gates.

Avoid guard-only treadmill work. A task must close a usefulness loop, improve a
bounded product surface, or unblock the next vertical slice.

## Operating Rules

- Keep `GOAL.md`, `PLAN.md`, and `PLANS.md` compact.
- Archive detail in reports, not root files.
- Use Beads (`bd`) as the durable task graph and handoff layer; see
  `docs/runbooks/beads-codex-protocol.md`.
- After compact/resume/new session, run `bd prime` before choosing or
  continuing Beads-tracked work.
- Claim or create a Beads issue before source edits when the work is durable.
- Do not use Beads to replace KRN product truth: `GOAL.md`, `PLAN.md`, and
  `PLANS.md` remain authoritative.
- Do not create a parallel roadmap.
- Do not reopen archived plans as active context.
- Do not mark this continuous goal complete after one slice.
- After each slice: verify, capture evidence, commit, push, check CI, compact
  root state, and continue.
- For every non-trivial infra, harness, CI, eval, Codex-surface, TypeScript,
  target-workflow, security, operator-UX, or research/paper/course-driven slice,
  apply:

  ```txt
  source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier
  ```

## Hard Non-Goals

Do not build dashboard, API, MCP server, worker daemon, crawler, broad eval
platform, generic multi-agent system, `krn audit`, anti-slop scanner, runtime
markdown memory, DB schema, or unsafe target writes unless root `PLANS.md`
authorizes a bounded evidence-backed task.

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

Do not substitute self/headless scenarios for V02-01.

## Continuation After Compact

After auto-compact, resume, context loss, or a new `/goal` continuation:

1. Read `GOAL.md`, `PLAN.md`, `PLANS.md`, and `docs/KRN_KERNEL.md`.
2. Run `bd prime`, then `git fetch --prune`, `git status --short --branch`, and
   `git log --oneline -n 8`.
3. Return to the first incomplete active task.
4. If a pasted objective, attachment, old prompt, or conversation summary names
   a stale stream, read it as historical evidence. Do not roll the active stream backward.
5. If a slice was committed but not pushed or CI-checked, finish that first.
6. If the current slice is complete, synthesize the next highest-ROI task and
   continue.
7. Keep using:

   ```txt
   source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier
   ```
