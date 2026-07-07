# KRN Agent Instructions

KRN is a Codex Operating Layer / AI Engineering Control Plane.

Codex executes. KRN supplies bounded context, service/store-backed memory,
source grounding, policy, skills, eval expectations, traces, review gates, and
feedback.

Current product goal: build a temporal Memory Core that gives Codex a governed
decision packet: selected current knowledge, stale/rejected paths, source
support, task-specific use, and falsifiers. Do not optimize for more notes,
prompt bloat, decorative platform wiring, or proof theater.

Before editing:

1. Read `KRN_ROADMAP.md`.
2. Read only the files needed for the current task.
3. Do not copy old repo topology.
4. Do not build dashboard, benchmark lane, broad multi-agent system, or
   file-backed runtime memory.
5. Do not treat historical docs as required reading.
6. If a decision depends on a source, map it through source -> mechanism -> KRN
   implication -> decision/rejection.

For architecture, naming, context-boundary, or product-shape changes:

- map the current code path before editing;
- compare the intended behavior against `KRN_ROADMAP.md` and any official docs
  that define platform mechanics;
- state the smallest decision that makes the roadmap more true;
- reject or defer ideas whose consumer, falsifier, or owner is unclear;
- prefer one direct model over aliases, compatibility shims, or parallel
  abstractions;
- do not proceed from a vague concept to code until the runtime consumer and
  non-proof boundary are explicit.

For TypeScript changes:

- preserve strict type boundaries;
- keep external data as `unknown` until validated;
- avoid `any` unless isolated and justified;
- run typecheck before claiming completion;
- use `rtk proxy pnpm typecheck` for the root workspace typecheck so RTK does
  not collapse the command into a bare `tsc` invocation.

For code quality:

- treat Fallow as an additional required quality layer for JS/TS work;
- use `pnpm quality:fallow` for broad JS/TS quality, dead-code, duplication,
  and health audits when touching architecture, package surfaces, or cleanup;
- treat Fallow findings as review evidence, not automatic truth;
- fix true positives, configure intentional fixtures/generated/typecheck proof
  exceptions explicitly, and never delete runtime/fixture files without owner
  evidence;
- CI runs `pnpm quality:fallow:ci` as the changed-files Fallow gate.

For naming and API shape:

- name modules, functions, classes, files, and types by the concept they own,
  not by pipeline history, temporary state, or implementation ceremony;
- avoid vague lifecycle words such as `new`, `final`, `normalized`, `manager`,
  `processor`, `helper`, and `utils` unless the domain meaning is explicit and
  unavoidable;
- do not hide bad exported names behind local aliases; fix the exported boundary
  or file a Beads cleanup before building more on top of it;
- prefer one small domain boundary over adapter chains, duplicate read models,
  or "from X to Y" conversion names that expose storage plumbing to product code.

For tests:

- test risky behavior, contracts, parsers, migrations, and authority boundaries;
- do not add tests that only freeze prose, file topology, command lists, docs
  wording, or implementation ceremony;
- one focused behavior test is better than broad snapshots that make refactors
  harder without proving product value;
- when a test exists only to protect cleanup/process theater, delete or replace
  it with a real behavior falsifier.

For git history:

- use Semantic/Conventional Commits only, for example
  `fix(scope): concise imperative summary`;
- prefer `fix`, `feat`, `refactor`, `test`, `docs`, and `chore` according to
  the actual change.

For complex KRN implementation work, use Beads as the active execution plan.
Product and architecture direction lives in `KRN_ROADMAP.md`.

For larger migration or audit-hardening slices, Codex may use an external
reviewer only as advisory evidence:

- compact handoff of current repo state, changed files, verification, proof and
  non-proof;
- prefer local tests, DB smokes, Fallow, and code evidence over reviewer prose;
- triage reviewer output into must-fix, evidence-gap, rejected-with-evidence, or
  follow-up Beads work;
- continue implementation without waiting for the operator unless the finding
  requires a product decision, budget decision, or explicit human tradeoff.

Do not treat external review as a gate while the repo-local Claude skill is
deferred; factual claims from reviewers must be checked against the current
code and verification output.

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

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:7510c1e2 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.
Use the repo-local `beads` skill at `.agents/skills/beads/SKILL.md` for
workflow guidance before issue operations.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
bd prime              # Refresh workflow context after compact/resume
```

### Rules

- Use the repo-local `beads` skill at `.agents/skills/beads/SKILL.md` before issue operations when Beads workflow details are needed.
- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` after context compaction, resume, or a new session before choosing or continuing Beads-tracked work
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files
- Do not recreate root `GOAL.md`, `PLAN.md`, or `PLANS.md`; use Beads for active task graph and follow-up tracking; use `KRN_ROADMAP.md` for product and architecture truth

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->
