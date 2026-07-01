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
Shared Brain Vertical Loop
```

Current state:

```txt
controlled-internal-alpha for technical operators: yes / stronger
product-ready: no
widened internal alpha: no
external/foreign second-operator proof: rejected as wrong product forcing function
current task: mise-en-palace-5f9 Canonicalize anti-memory invalidation source claim field.
```

Current task: build the shared KRN brain kernel as the foundation for future
agentic/harness work: multi-layer memory, source-to-decision, pattern/research
condensation, evidence/review, graph, heartbeat/dreaming, and benchmarked reuse.
Use multi-repo internal work as evidence when useful, but do not let it become
the product goal.

Latest slice:

```txt
mise-en-palace-568 complete: removed the transparent
`enqueueMaintenanceJob` pass-through while keeping typed enqueue request/result
and `MaintenanceJobQueueRepository` contracts.
Report:
docs/reviews/controlled-dogfood/2026-07-02-568-maintenance-enqueue-wrapper/REPORT.md
Next: `mise-en-palace-5f9` canonicalizes the anti-memory invalidation
source-claim field shape if source inspection confirms the dual-field drift.
```

## Direction

Move toward a useful KRN Brain through product-facing vertical slices:

1. close end-to-end product loop;
2. consensus/eval lane usefulness;
3. graph brain v1;
4. ingest v0/v1;
5. heartbeat/dreaming candidate runtime;
6. pattern/research brain;
7. real benchmarks;
8. multi-repo shared-brain usefulness proof.

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

## Senior Execution Doctrine

Every implementation slice must preserve:

1. Think before coding: state assumptions, ambiguity, tradeoffs, and the simpler
   path before changing files.
2. Simplicity first: write the smallest final-pattern solution; no speculative
   flexibility, broad abstraction, or "in case we need it" code.
3. Surgical changes: touch only files required by the slice; every changed line
   must trace to the objective; unrelated cleanup becomes a finding, not a diff.
4. Goal-driven execution: define success criteria, test behavior that can break,
   verify, and state what evidence proves and does not prove.
5. Quality evidence: use TypeScript strictness, Fallow, tests, DB readiness, and
   source-to-decision as evidence layers. Treat findings as evidence, not
   automatic truth.

If a slice cannot satisfy these rules, rescope before coding.

## Hard Non-Goals

Do not build dashboard, API, MCP server, worker daemon, crawler, broad eval
platform, generic multi-agent system, `krn audit`, anti-slop scanner, runtime
markdown memory, DB schema, or unsafe target writes unless root `PLANS.md`
authorizes a bounded evidence-backed task.

## Product Boundary

Do not block product progress on a foreign operator. The real validation path is:

```txt
our operator loop
-> multiple real repos
-> one shared KRN brain
-> plan/context/brief/execution/evidence/review
-> candidates
-> promotion or rejection
-> next run demonstrably reuses or rejects the knowledge
```

Do not fake user proof. Do not run synthetic demos as product proof. Use controlled
internal work, real repos, real evidence, and compact reports.

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
