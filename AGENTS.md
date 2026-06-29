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

For code quality:

- use `pnpm quality:fallow` for broad JS/TS quality, dead-code, duplication,
  and health audits when touching architecture, package surfaces, or cleanup;
- treat Fallow findings as review evidence, not automatic truth;
- fix true positives, configure intentional fixtures/generated/typecheck proof
  exceptions explicitly, and never delete runtime/fixture files without owner
  evidence;
- CI runs `pnpm quality:fallow:ci` as the changed-files Fallow gate.

For git history:

- use Semantic/Conventional Commits only; see
  `docs/standards/git-commits.md`.

For complex KRN implementation work, keep root `PLAN.md` current as the living
ExecPlan.

If the next step requires broad historical rereads, stop and re-scope.

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.
