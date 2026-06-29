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
V324 Graph Brain v0 SourceClaimEdge Readback Surface
```

Current state:

```txt
controlled-internal-alpha for technical operators: yes / stronger.
product-ready: no.
widened internal alpha: no.
V02-01 real second-operator proof: blocked/deferred.
current task: V324-00 Graph Brain v0 SourceClaimEdge Readback Surface.
```

Current task:

```txt
Add the smallest operator-facing readback surface for persisted SourceClaimEdge
rows by claim id, using the existing Postgres source graph substrate and
preserving source ranges, consumer, does-not-prove, and no Memory Core mutation.
```

## Remaining Work

The product is not a full living brain yet. The only current high-level blocks
to preserve are:

1. Pattern Brain execution/readback hardening: V307 closed the first usefulness
   loop; keep future search changes evidence-backed.
2. Research/paper/course source decisions: V308 added the first bounded pack;
   future sources still require consumer, falsifier, and does-not-prove.
3. Mini brain-QA benchmark: BQ-015 is executed and covered; BQ-023, BQ-024,
   BQ-025, and BQ-028 are executed; next use the result to start Ingest v0.
4. Ingest v0: local artifact preview, candidate bridge, SearchDocument,
   SourceClaim, SourceDecisionEdge persistence/readback, SourceClaim
   activation, context detail run readback, and marker/hash lexical activation
   over persisted local SearchDocuments exist.
5. Graph brain v0: V323 proved bounded SourceClaimEdge preview/persistence;
   next expose persisted edge readback before ranking, extraction, or graph
   runtime work.
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
7. Research or pattern input must still use `source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier`.
