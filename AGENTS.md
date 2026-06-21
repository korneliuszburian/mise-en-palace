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
