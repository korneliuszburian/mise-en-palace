# KRN Skills Bundle

This is a repomix-style single document for reading, searching, and copying the
current repo-local KRN skills. It is generated from `.agents/skills/**`.

## Strip Decisions

| Skill/procedure | strip_decision | Owner skill | Target | Reason |
|---|---|---|---|---|
| activation-engine | merged | krn-implementation | `references/activation.md` | Activation is implementation procedure, not an independent top-level workflow. |
| beads | active | beads | `SKILL.md` | Durable task graph, planning modes, blocker edges, frontier, and handoff state need one tracker substrate. |
| brain-store-schema | merged | krn-implementation | `references/store-schema.md` | Store schema work is implementation procedure with DB-specific verification. |
| code-review | active | code-review | `SKILL.md` | Checker behavior and evidence review belong behind one review entrypoint. |
| codebase-design | merged | domain-modeling | `references/codebase-design.md` | Architecture seams and names are part of domain concept ownership. |
| codex-adapter-plan | merged | krn-implementation | `references/codex-adapter.md` | Codex adapter rendering is a specialized implementation boundary. |
| diagnosing-bugs | new | diagnosing-bugs | `SKILL.md` | Diagnosis needs an explicit red-capable repro gate that TDD did not cover. |
| domain-modeling | active | domain-modeling | `SKILL.md` | Vocabulary, context, ADR, and codebase-design decisions share the same concept ownership lane. |
| evidence-review-loop | merged | code-review | `references/evidence-review.md` | Evidence capture is checker procedure under code review. |
| handoff-compact | merged | beads | `templates/handoff.md` | Handoff is Beads state transfer, not a separate public skill. |
| krn-implementation | new | krn-implementation | `SKILL.md` | Unifies maker procedures that were too narrow to remain top-level invocation skills. |
| source-to-decision | active | source-to-decision | `SKILL.md` | Source evidence still needs a distinct mechanism-to-decision gate. |
| target-repo-testing | active | target-repo-testing | `SKILL.md` | Target-repo dirty-state and write-authority checks remain a distinct proof boundary. |
| tdd | merged | krn-implementation | `references/tdd.md` | TDD is a maker reference used inside implementation, not a standalone KRN workflow. |
| typescript-type-safety | merged | krn-implementation | `references/type-safety.md` | Type safety is a reusable implementation boundary reference. |

## File Index

| # | Skill | Role | File |
|---|---|---|---|
| 1 | beads | router | `.agents/skills/beads/agents/openai.yaml` |
| 2 | beads | router | `.agents/skills/beads/references/planning-modes.md` |
| 3 | beads | router | `.agents/skills/beads/SKILL.md` |
| 4 | beads | router | `.agents/skills/beads/templates/handoff.md` |
| 5 | beads | router | `.agents/skills/beads/templates/spec.md` |
| 6 | beads | router | `.agents/skills/beads/templates/ticket.md` |
| 7 | beads | router | `.agents/skills/beads/templates/wayfinding-map.md` |
| 8 | code-review | checker | `.agents/skills/code-review/references/evidence-review.md` |
| 9 | code-review | checker | `.agents/skills/code-review/SKILL.md` |
| 10 | code-review | checker | `.agents/skills/code-review/templates/pr-review-comment.md` |
| 11 | diagnosing-bugs | maker | `.agents/skills/diagnosing-bugs/SKILL.md` |
| 12 | domain-modeling | decision | `.agents/skills/domain-modeling/references/adr-format.md` |
| 13 | domain-modeling | decision | `.agents/skills/domain-modeling/references/codebase-design.md` |
| 14 | domain-modeling | decision | `.agents/skills/domain-modeling/references/context-format.md` |
| 15 | domain-modeling | decision | `.agents/skills/domain-modeling/SKILL.md` |
| 16 | krn-implementation | maker | `.agents/skills/krn-implementation/references/activation.md` |
| 17 | krn-implementation | maker | `.agents/skills/krn-implementation/references/codex-adapter.md` |
| 18 | krn-implementation | maker | `.agents/skills/krn-implementation/references/store-schema.md` |
| 19 | krn-implementation | maker | `.agents/skills/krn-implementation/references/tdd.md` |
| 20 | krn-implementation | maker | `.agents/skills/krn-implementation/references/type-safety.md` |
| 21 | krn-implementation | maker | `.agents/skills/krn-implementation/SKILL.md` |
| 22 | source-to-decision | decision | `.agents/skills/source-to-decision/SKILL.md` |
| 23 | target-repo-testing | checker | `.agents/skills/target-repo-testing/agents/openai.yaml` |
| 24 | target-repo-testing | checker | `.agents/skills/target-repo-testing/SKILL.md` |

## Files

## 1. .agents/skills/beads/agents/openai.yaml

skill: beads
role: router

```markdown
interface:
  display_name: "Beads"
  short_description: "Project task tracking with bd"
  default_prompt: "Use $beads to inspect ready work and manage durable project tasks."
```

## 2. .agents/skills/beads/references/planning-modes.md

skill: beads
role: router

```markdown
# Beads Planning Modes

Use this reference when Beads is being used for planning, not only claim/close
task tracking.

## to-spec Mode

Use when a conversation or rough idea needs a settled build artifact before
ticket slicing.

Use `templates/spec.md`.

Rules:

- Write the spec as the smallest decision that can create tickets.
- Keep open questions explicit; do not answer them for the operator.
- State non-goals so `to-tickets` cannot smuggle in extra work.
- Do not create implementation tickets while the spec still has requirement
  ambiguity.

Stop when the spec is specific enough to slice into agent-sized tickets without
inventing requirements.

## to-tickets Mode

Use when a spec or plan is ready to become Beads issues.

Use `templates/ticket.md`.

Rules:

- Prefer tracer-bullet vertical slices.
- Each ticket should fit one fresh agent context.
- Use native Beads dependency edges for blockers.
- The frontier is `bd ready`.
- Use expand-contract for wide refactors that cannot land as vertical slices.
- Every ticket must name a consumer, acceptance criteria, proof, non-proof, and
  rollback or contraction condition when relevant.
- Reject tickets that only name a package layer, file move, or ceremony.

Stop when every ticket has acceptance criteria, proof boundaries, and blocker
edges.

## wayfinding Mode

Use when the destination is clear enough to name, but the route is still foggy.
This is not implementation planning. It is decision discovery.

Use `templates/wayfinding-map.md`.

Child issue types:

- `research`: external or local investigation;
- `prototype`: concrete throwaway artifact to make a decision easier;
- `grilling`: human-in-the-loop question;
- `task`: manual work required before a decision can be made.

Rules:

- Work one ticket per fresh context.
- Claim before work.
- Record the answer in the ticket, then close it.
- Add newly visible tickets only after the current answer makes them specific.
- Keep the map as an index; detailed answers live in child tickets.
- A map issue is not done until child tickets are small enough for one agent
  session and their blockers are dependency edges.
- If the next step is still vague, create a question ticket, not an
  implementation ticket.

Stop when the route to the destination is clear or the remaining fog has become
specific tickets, with native dependency edges and a `bd ready` frontier.

## handoff Mode

Use when a current run needs compact continuation state after meaningful work,
before auto-compaction, resume, pause, transfer, or session end.

Use `templates/handoff.md`.

Rules:

- State the active Beads issue, status, and next action.
- State commit, push, CI, DB, and worktree state without pretending missing
  checks passed.
- List only changed files and context selectors needed to resume.
- Do not turn the handoff into product brain or a task ledger.

Stop when a fresh agent can resume without broad reread and without mistaking
unverified work for pushed or CI-proven work.
```

## 3. .agents/skills/beads/SKILL.md

skill: beads
role: router

```markdown
---
name: beads
description: Use for durable project state: triage, claims, blockers, to-spec, to-tickets, wayfinding, handoff, follow-up work, or any task that must survive the current chat.
---

# Beads

Use Beads as the shared project task system. If work must survive the current
chat, it belongs in Beads or it does not exist as project state.

## Trigger

Use when durable task state, issue dependencies, blocker management, follow-up
work, or multi-session recovery matters.

## First Step

Run:

```bash
rtk bd prime
```

If that prints nothing, check whether the repository has an active Beads workspace:

```bash
rtk bd where
```

## Mode Dispatch

Choose the narrowest mode before mutating issues:

| Mode | Input | Output | Stop gate |
|---|---|---|---|
| `triage` | backlog, blocker, follow-up, status question | claimed/updated/closed issue or new follow-up | next action is represented in Beads |
| `to-spec` | rough idea or conversation | one settled spec issue/body | spec can be sliced without inventing requirements |
| `to-tickets` | spec or concrete plan | agent-sized issues plus dependency edges | `bd ready` shows the frontier |
| `wayfinding` | named destination with foggy route | map issue plus decision tickets | destination, map, blockers, and frontier are visible |
| `handoff` | meaningful repo/task state | compact continuation state | fresh agent can resume without broad reread |

For planning modes, read `references/planning-modes.md` and use the matching
template from `templates/`.

If a request spans multiple modes, finish the earlier artifact before starting
the later one. Do not skip from fog to implementation tickets.

## Core CLI Steps

1. Find work:

```bash
rtk bd ready
rtk bd list --status=open
rtk bd list --status=in_progress
```

2. Inspect before editing:

```bash
rtk bd show <id>
```

3. Claim work atomically:

```bash
rtk bd update <id> --claim
```

4. Create durable follow-up work when implementation reveals new tasks:

```bash
rtk bd create "Short title" --description="Why this exists and what needs to be done" --type=task --priority=2
```

5. Wire blocking edges when one issue must finish before another can start:

```bash
rtk bd dep <blocker-id> --blocks <blocked-id>
```

6. Close completed work:

```bash
rtk bd close <id> --reason="Completed"
```

## Planning Work

When turning a roadmap slice, audit, spec, or conversation into Beads, create
Beads issues directly. Do not create `tickets.md`, local TODO files, or a second
planning artifact.

For `to-spec`, `to-tickets`, or `wayfinding` planning, read
`references/planning-modes.md` before creating or rewriting issues.

Use tracer-bullet issues for product work:

- each issue delivers one narrow, verifiable path through the affected runtime
  boundary;
- each issue fits one fresh agent context;
- each issue states acceptance criteria and proof/non-proof boundaries;
- blockers are native Beads dependencies, not prose-only references;
- the frontier is `bd ready`: open work whose blockers are done.

If a planned issue has no runtime consumer, falsifier, or owner, reject it or
record it as a question before creating implementation work.

Reject horizontal layer tickets like "build database", "add tests", or
"refactor activation" unless the issue names the end-to-end behavior it proves.

For foggy roadmap work, use wayfinding inside Beads instead of creating a
separate top-level skill or parallel map document.

Wayfinding stop condition:

- the destination is named;
- the map issue exists and uses `templates/wayfinding-map.md`;
- child decision tickets are agent-sized and one-ticket-per-session;
- blocker edges are native Beads dependencies;
- the frontier is visible through `bd ready`.

## Steps

Use Beads before durable work:

1. Run `bd prime` after compaction, resume, or a fresh session.
2. Inspect ready/in-progress work before choosing a slice.
3. Claim an existing issue, or create one when the work must survive handoff.
4. Keep implementation notes in Beads comments or issue descriptions when they are durable; keep root KRN plans compact.
5. Close the Beads issue only after verification, commit, push, and CI status are recorded or explicitly marked unavailable.

## Handoff Mode

Use `templates/handoff.md` before compaction, pause, transfer, or session end
when meaningful repo state changed. Keep it compact and store durable task
state in Beads, not in a markdown ledger.

## What Belongs In Beads

Use Beads for:

- shared project tasks
- blockers and dependencies
- discovered follow-up work
- work that must survive thread reset, compaction, or handoff
- status that another person or agent should be able to resume

## Output

- Claimed, created, updated, blocked, or closed Beads issue.
- Dependency edge when one task gates another.
- Mode used and why.
- Closing reason or issue note with verification and non-proof boundary.
- No markdown TODO or parallel task ledger.

## Forbidden

- Do not create markdown TODO files as the source of truth when Beads is available.
- Do not use `bd edit`; it opens an interactive editor. Use `bd update` flags instead.
- Prefer `--json` when parsing `bd` output programmatically.
- If hooks are installed, `bd prime` may already be injected. Run it manually when context is missing.
- Do not auto-close or mutate tasks unless the work is actually complete.
- Do not create broad epics disguised as ready work.
- Do not represent blockers only in prose; use native dependency edges.
- Do not use Beads as a research archive.

## Stop Condition

Stop when the active work has a claimed Bead or a justified local-only plan, new
durable follow-up work is represented in Beads, blockers are dependency edges
or explicit human decisions, and completed issues have verification recorded.

## Verification

For Beads workflow changes, verify the CLI and repository handoff surface:

```bash
rtk bd --version
rtk bd prime
rtk bd ready --json
rtk git diff --check
```

If Beads work changes package manifests or generated skills, also rely on the repository CI skill invariants before claiming the integration is complete.
```

## 4. .agents/skills/beads/templates/handoff.md

skill: beads
role: router

```markdown
# Handoff

Objective:
Active Beads task:
Last verified state:
Commit/push/CI:
Changed files:
Decisions:
Blockers/risks:
Context selectors:
Next action:
Do not reread:
```

## 5. .agents/skills/beads/templates/spec.md

skill: beads
role: router

```markdown
# Spec

## Problem Statement

## Solution

## Operator/User Stories

## Implementation Decisions

## Testing Decisions

## Out Of Scope

## Open Questions
```

## 6. .agents/skills/beads/templates/ticket.md

skill: beads
role: router

```markdown
# Ticket

## What To Build

## Acceptance Criteria

## Proof / Non-Proof

Proof:

Non-proof:

## Blocked By

Use native Beads dependency edges for blockers; do not rely on this section
alone.
```

## 7. .agents/skills/beads/templates/wayfinding-map.md

skill: beads
role: router

```markdown
# Wayfinding Map

## Destination

## Decisions So Far

## Not Yet Specified

## Out Of Scope

## Frontier

List child Beads issue IDs that are ready or will become ready after native
dependency edges are satisfied.
```

## 8. .agents/skills/code-review/references/evidence-review.md

skill: code-review
role: checker

```markdown
# Evidence Review

Use this reference after or around execution, when proof must become reviewable
state without mutating memory automatically.

## Procedure

1. Record changed files and scope.
2. Record each command with status and provenance; distinguish statuses
   `passed`, `failed`, `skipped`, `missing`, and `not_run`, plus provenance
   `operator_reported`, `captured_output_file`, `command_runner`, and
   `default_template`.
3. State diff risk and review burden.
4. State rollback path.
5. Separate hard evidence from interpretation.
6. If a source, course, paper, docs page, or local evidence shaped the work,
   record source usefulness with `--source-usefulness` or state why it was not
   measured.
7. For same-run persisted loops, run `krn observe --persist` to completion
   before `krn reflect --persist`. Do not start observe and reflect in parallel
   for the same run.
8. If run-scoped reflect selects `0` observations when the run should have
   persisted evidence, treat it as a sequencing failure until observe
   completion is verified. Do not use that result as reflection-quality
   evidence.
9. Create feedback candidates; do not apply them automatically.
10. Append run/outbox evidence only when persistence is configured.

## Output

- Evidence summary.
- Command proof with provenance and what it does not prove.
- Diff risk.
- Review burden.
- Rollback path.
- Feedback candidates.
- Source usefulness outcomes when source/knowledge input shaped the run.
- Observe-before-reflect sequencing status for persisted same-run loops.
- Persistence status.

## Verification

Evidence must let a reviewer see what changed, what was actually run, what risk
remains, and how to roll back.

For persisted same-run loops, evidence must also show that observe completed
before reflect, or explicitly mark reflection output as sequencing-weak.

## Forbidden

- Do not claim skipped commands passed.
- Do not treat default_template, skipped, missing, or not_run command rows as
  strong verification proof.
- Do not mutate Memory Core without explicit acceptance.
- Do not invent execution runs when DB/run IDs are absent.
- Do not promote eval/source/memory candidates as a side effect of capture.
- Do not run same-run `krn observe --persist` and `krn reflect --persist` in
  parallel.
```

## 9. .agents/skills/code-review/SKILL.md

skill: code-review
role: checker

```markdown
---
name: code-review
description: Use for KRN reviews of diffs, PRs, migrations, cleanup, architecture, or naming; checks Standards, Spec, proof gaps, test theater, and Fowler-style smells.
---

# Code Review

Review the diff against a fixed point, usually the merge base with `origin/main`.

## Trigger

Use when the user asks for a review, or when a KRN diff, PR, migration,
cleanup, architecture, or naming slice needs checker evidence.

## Steps

1. Resolve the fixed point with `git rev-parse`.
2. Inspect `git diff <fixed-point>...HEAD` and relevant commits.
3. Find the Beads issue, `AGENTS.md`, `KRN_ROADMAP.md`, and relevant skills.
4. Do not read historical docs unless a current authority surface references
   them for the reviewed slice.
5. For execution evidence capture, proof/non-proof boundaries, rollback path,
   or feedback candidates, read `references/evidence-review.md`.

## Axes

Keep findings separated:

- Standards: repo rules, Roadmap, skills, TypeScript/store boundaries, tests,
  naming, and proof/non-proof boundaries.
- Spec: Beads acceptance criteria, user request, and intended product behavior.

## Smell Baseline

Flag these as judgment calls unless a repo rule makes them hard blockers:

- Mysterious Name
- Duplicated Code
- Feature Envy
- Data Clumps
- Primitive Obsession
- Repeated Switches
- Shotgun Surgery
- Divergent Change
- Speculative Generality
- Message Chains
- Middle Man
- Refused Bequest
- Test Theater
- Prompt/Context Bloat
- Markdown Authority Drift

## Review Rules

- Findings first, severity ordered, with file:line refs.
- Each finding needs evidence and a minimal fix.
- Do not praise green tests as proof of product readiness.
- Reject reviewer claims contradicted by current code or verification output.
- If no issue is found, say so and name residual test or proof gaps.
- For PR-comment back-and-forth review, use
  `templates/pr-review-comment.md`.

## Output

- Standards:
- Spec:
- Verification:
- Follow-up Beads:

## Stop Condition

Stop when findings are severity ordered with file/line evidence, standards and
spec risks are separated, verification gaps are named, and false reviewer claims
are rejected with current evidence.

## Verification

Verify by inspecting the fixed-point diff, relevant commits, active Beads
issue, current roadmap/agent rules, and any command output the change claims.

## Forbidden

- Do not rewrite or fix the diff during review.
- Do not merge Standards and Spec findings into one vague verdict.
- Do not treat green tests as proof that product behavior is correct.
```

## 10. .agents/skills/code-review/templates/pr-review-comment.md

skill: code-review
role: checker

```markdown
# PR Review Comment Template

Use this shape for future PR-comment back-and-forth between a checker agent and
Codex.

```md
## Finding

<bug, risk, spec drift, smell, or proof gap>

## Evidence

- File/line:
- Observed behavior or diff:
- Relevant convention/source:

## Requested Change

<smallest change or evidence needed>

## Stop Condition

<what would close this thread>
```

## Codex Response Shape

```md
## Response

<accepted / rejected with evidence / needs product decision>

## Change

<commit, diff summary, or why no code changed>

## Proof

<command output or explicit non-proof boundary>
```
```

## 11. .agents/skills/diagnosing-bugs/SKILL.md

skill: diagnosing-bugs
role: maker

```markdown
---
name: diagnosing-bugs
description: Use for unknown broken, throwing, failing, flaky, slow, or regressed KRN behavior; requires a red-capable repro before hypotheses or fixes.
---

# Diagnosing Bugs

Use this skill for unknown failures. No repro, no hypothesis.

## Trigger

- A command, test, CLI flow, migration, activation path, DecisionPacket, store
  path, or target-repo trial is broken, failing, flaky, slow, or regressed.
- The task asks to diagnose, debug, investigate, or fix a symptom whose cause is
  not already proven.

## Steps

1. State the reported symptom and the exact boundary where it appears.
2. Find or create a red-capable repro command before naming hypotheses or
   editing code.
3. Run the repro command and record whether it is red, green, flaky, missing,
   or not yet specific enough.
4. Minimize the repro to the smallest command, fixture, input, or code path that
   still observes the symptom.
5. Only after a red-capable repro exists, form hypotheses from evidence.
6. Instrument narrowly when the repro does not reveal the cause.
7. Fix the smallest proven cause.
8. Add or update a regression test only when it protects runtime behavior,
   parser boundaries, authority boundaries, or a user-facing flow.
9. Rerun the repro, focused regression check, typecheck for TypeScript changes,
   and any relevant Fallow gate.
10. Remove temporary instrumentation and record proof/non-proof.

## Repro Ladder

Use the lowest rung that can still fail:

1. single unit/fixture command;
2. focused package test;
3. CLI command with fixture input;
4. DB smoke or migration check;
5. target-repo command;
6. broad suite only when narrower repro cannot observe the symptom.

If every rung is green, the task is not a bug fix yet. Report the missing repro
or turn it into a question/observation Bead.

## Output

- Symptom:
- Boundary:
- Repro command:
- Repro status:
- Minimal failing case:
- Cause:
- Fix:
- Regression proof:
- Non-proof:
- Follow-up Beads:

## Stop Condition

Stop when a red-capable repro has been run, the cause is supported by evidence,
the fix removes the repro failure, focused verification passes or is reported
honestly, and remaining uncertainty is represented as non-proof or follow-up
Beads work.

## Verification

Verification requires the before-fix repro result, after-fix repro result, any
regression test result, and typecheck when TypeScript changed.

## Forbidden

- Do not propose hypotheses before a red-capable repro command exists and has
  been run.
- Do not fix by inspection only when the symptom can be reproduced.
- Do not broaden the change beyond the proven cause.
- Do not leave temporary logging, probes, or fixture mutations behind.
- Do not call a broad failing suite a cause.
```

## 12. .agents/skills/domain-modeling/references/adr-format.md

skill: domain-modeling
role: decision

```markdown
# ADR Format

Use this format when a KRN operating or architecture decision should survive a
fresh agent context.

ADRs live in `docs/adr/` and use sequential numbering:

```txt
0001-short-slug.md
0002-short-slug.md
```

## Template

```md
# Short title

One to three sentences: what was the context, what did we decide, and why.
```

## Optional Sections

Add only when they carry real information:

- `Status: proposed | accepted | deprecated | superseded by ADR-NNNN`
- `Considered Options`
- `Consequences`
- `Consumer`
- `Falsifier`
- `Verification`

## Creation Test

Create an ADR only when all are true:

1. hard to reverse;
2. surprising without context;
3. a real trade-off was made;
4. a future agent is likely to rediscover or undo the decision.
```

## 13. .agents/skills/domain-modeling/references/codebase-design.md

skill: domain-modeling
role: decision

```markdown
# Codebase Design

Use this reference before architecture or naming edits that change a public
seam. It provides vocabulary for keeping KRN modules smaller, deeper, and
owned by a real consumer.

## Vocabulary

- Module: a function, file, package, or runtime slice with one interface and
  implementation.
- Interface: everything callers must know: types, invariants, ordering, error
  modes, config, and proof/non-proof boundaries.
- Seam: where callers or tests cross a module interface.
- Adapter: a concrete implementation at a seam.
- Depth: behavior gained per unit of interface learned.
- Leverage: capability callers get from the interface.
- Locality: change concentrated in one module instead of scattered callers.

## Procedure

1. Map current caller -> interface -> implementation -> persistence/runtime
   path.
2. Run the deletion test: if deleting the module removes complexity, it is
   likely middle-man; if complexity reappears across callers, it earns depth.
3. Classify dependencies before adding a seam:
   - in-process: deepen directly and test through the interface;
   - local-substitutable: use the real local substitute, not a mock layer;
   - remote-owned: define a port only when production and test adapters both
     earn the seam;
   - true external: inject the dependency and mock only that boundary.
4. Count adapters: one adapter is usually a hypothetical seam; two real
   adapters can justify a seam.
5. Prefer one direct domain model over adapter chains, duplicate read models,
   or compatibility aliases.
6. Test at the highest public seam that proves behavior; replace shallow tests
   with seam tests instead of layering both.
7. Reject tests that freeze file topology, prose, command lists, or ceremony.
8. Reject new abstractions without a runtime consumer, falsifier, and owner.
9. State the smallest design decision before editing.

## Output

- Current path:
- Decision:
- Consumer:
- Falsifier:
- Non-proof:
- Verification:

## Verification

Verify with the smallest behavior/type checks that touch the changed seam, plus
targeted `rg` proof for removed aliases, duplicate read models, or rejected
public terms when relevant.
```

## 14. .agents/skills/domain-modeling/references/context-format.md

skill: domain-modeling
role: decision

```markdown
# Context Format

Use this format when `domain-modeling` resolves shared KRN vocabulary.

```md
# KRN Context

One or two sentences describing what this context owns.

## Language

**Term**:
One or two sentences defining what the term is in this repository.
_Avoid_: rejected synonym, overloaded phrase
```

## Rules

- Add only KRN-specific operating or domain terms.
- Define what the term is, not every place it appears.
- Prefer one canonical word and list rejected alternatives under `_Avoid_`.
- Do not add generic programming concepts.
- Do not use `CONTEXT.md` as a spec, plan, task list, or runtime memory.
```

## 15. .agents/skills/domain-modeling/SKILL.md

skill: domain-modeling
role: decision

```markdown
---
name: domain-modeling
description: Use for KRN terms, public names, concept ownership, context/ADR decisions, grill questions, codebase-design seams, CLI/API wording, or stale vocabulary removal.
---

# Domain Modeling

Keep KRN's language coherent across `CONTEXT.md`, `CONVENTIONS.md`, roadmap,
Beads, code, CLI/API surfaces, and store-backed knowledge. Resolve concepts by
updating one durable owner, not by adding aliases.

## Trigger

Use when a term, public name, concept boundary, roadmap phrase, CLI/API wording,
or retained-knowledge vocabulary changes or looks logically inconsistent.

## Steps

1. Pin the term or concept under dispute.
   - If the term, owner, or decision is ambiguous, ask the operator one narrow
     question before naming it.
   - Do not self-grill by inventing both sides of an unresolved human decision.
2. Map the current path:
   - `CONTEXT.md` for shared operating vocabulary;
   - `CONVENTIONS.md` for skill/artifact rules;
   - `KRN_ROADMAP.md` for product architecture language;
   - the active Beads issue for current work scope;
   - exported types, CLI commands, readbacks, schemas, and tests that expose the term;
   - `AGENTS.md` only when the term affects agent behavior.
3. Classify the term:
   - product language: what operators see;
   - domain model: durable code concept;
   - storage detail: table/column/repository mechanics;
   - technical generic: regex pattern, path pattern, parser normalization, etc.;
   - stale vocabulary: old scaffold, migration residue, or temporary name.
4. Choose one canonical term at the highest honest boundary.
   - If two terms survive, state the boundary that makes both necessary.
   - If no boundary makes both necessary, delete or defer one.
5. Update the owner:
   - code export when the term is a runtime/domain concept;
   - `CONTEXT.md` when the term is shared operating vocabulary;
   - `CONVENTIONS.md` when the term defines a skill/artifact rule;
   - `KRN_ROADMAP.md` only for compact product or architecture direction;
   - Beads for follow-up work or dependency edges;
   - store-backed memory/source/eval candidates when the term must be learned at runtime;
   - `docs/adr/NNNN-slug.md` only when the ADR rule is satisfied.
6. Remove stale public terms in the same slice when safe. Do not hide them behind
   local aliases or migration fallbacks unless a staged rollout is required.
7. Verify by grepping the rejected term and running the smallest behavior/type
   checks that touch the changed boundary.

For architecture, package seam, public interface, or deep-module decisions, read
`references/codebase-design.md`.

## Grill Gate

Use this gate before naming, splitting, or recording a decision when the human
intent is under-specified.

- Ask one concrete question.
- Ask only when the answer changes the artifact, public name, or implementation
  boundary.
- Do not continue by assuming the answer if a wrong assumption would create a
  durable term, ADR, issue graph, or exported API.
- Once answered, update the smallest owner immediately.

## KRN Naming Rules

- Product/UI/readback language may say `brain` when it helps operators understand
  the system.
- Durable retained knowledge in code is `knowledge`, not `pattern card`.
- Use `memory` for temporal store/lifecycle behavior: promotion, demotion,
  staleness, feedback, forgetting, and activation.
- Use `source` for provenance, authority, claims, support, decisions, and
  rejected paths.
- Use `DecisionPacket` only for the bounded task-facing packet emitted to Codex.
- Keep technical uses of `pattern` when they are literal regex/path/search
  patterns, not retained brain knowledge.

## Context And ADR

- For context format, read `references/context-format.md`.
- For ADR format, read `references/adr-format.md`.
- Update `CONTEXT.md` immediately when a shared operating term is resolved.
- Update `CONVENTIONS.md` when the decision changes skill shape, artifact
  ownership, planning modes, review rules, or debugging rules.
- Offer an ADR only when the decision is hard to reverse, surprising without
  context, and the result of a real trade-off.
- Keep ADRs in `docs/adr/NNNN-slug.md`; do not create per-skill ADR folders.
- Keep ADRs compact and link the consumer, falsifier, and verification path when
  those are not obvious from the decision text.

## Forbidden

- Do not use `CONTEXT.md`, `CONVENTIONS.md`, ADRs, or markdown runbooks as task
  ledgers, runtime memory, or substitutes for implemented behavior.
- Do not preserve bad exported names with local aliases.
- Do not rename storage details into product terms when only repository plumbing
  is involved.
- Do not turn a terminology concern into a broad refactor unless the public
  boundary actually leaks the wrong concept.
- Do not write tests that only freeze vocabulary. Prefer existing behavior tests,
  typecheck, Fallow, and targeted `rg` proof for rejected terms.
- Do not ask yourself a grill question and answer it as if it were operator
  input.
- Do not preserve two names because both appeared in history.
- Do not use `new`, `final`, `normalized`, `manager`, `processor`, `helper`, or
  `utils` at a public boundary unless the domain meaning is explicit.

## Output

- Term:
- Current path:
- Canonical language:
- Decision:
- Owner:
- Consumer:
- Falsifier:
- Verification:
- Rejected language:

## Stop Condition

Stop when the canonical term is owned at the highest honest boundary, stale
public terms are removed or explicitly deferred, and `rg` plus the smallest
type/behavior check prove the rejected vocabulary is not still active.

## Verification

Verify by grepping rejected terms and running the smallest type/behavior checks
that touch the renamed or re-owned boundary.
```

## 16. .agents/skills/krn-implementation/references/activation.md

skill: krn-implementation
role: maker

```markdown
# Activation

Use this reference when implementation changes KRN context selection, retrieval
candidate ranking, memory/source activation, owner-file/read-model recall,
context exclusions, trust filters, temporal filters, abstention, or context ROI.

## Procedure

1. Start from the task contract and context budget.
2. Build query terms from task objective, constraints, non-goals, and
   acceptance evidence.
3. Rank candidates with lexical, vector, graph, temporal, trust, and context
   ROI signals when available.
4. Exclude invalidated, stale, unsafe, unsupported, or low-ROI candidates with a
   concrete reason.
5. Abstain when context is weak instead of padding the packet.
6. Emit inclusions and exclusions with expected use and evidence requirement.

## Owner-File Recall Gate

Use this gate when a task targets a repo, package, source root, CLI command,
test, or behavior with likely owner files.

1. Check whether the task contract, target init/connect data, run readback, or
   source seeds provide exact owner-file signals.
2. Prefer explicit owner-file/read-model evidence over broad lexical proximity.
3. If exact owner-file data is missing, emit a missing-read-model or abstention
   reason instead of inventing files.
4. Use manual source inspection only as execution evidence, not as proof that
   activation selected the owner file.
5. Turn repeated owner-file misses into a bounded read-model/eval/skill repair,
   not a broad activation scoring rewrite.

Does not prove:

- activation scoring is wrong;
- filesystem crawling is needed;
- broad target repo inference is safe.

## Verification

Tests should prove high-signal inclusion, invalid/stale exclusion,
source-safety exclusion, budget behavior, and abstention for weak context.
```

## 17. .agents/skills/krn-implementation/references/codex-adapter.md

skill: krn-implementation
role: maker

```markdown
# Codex Adapter

Use this reference at the Codex brief boundary, not inside core domain logic.

## Trigger

- A KRN `DecisionPacket`, harness plan, or task contract must become a Codex
  execution brief.
- A change risks leaking Codex-specific language into `packages/core`.
- A brief change risks treating skills, hooks, MCP, or adapter metadata as the
  product brain instead of tooling around the `DecisionPacket`.

## Procedure

1. Read the bounded input: task contract, context assembly, selected knowledge,
   source support, rejected/stale paths, capability requirements, and evidence
   expectations.
2. Render only bounded instructions needed by Codex to execute the next slice.
3. Include inclusions, exclusions, rejected paths, and non-proof boundaries.
4. Keep adapter output plain, inspectable, and non-mutating.
5. If a proposed section has no current consumer in the brief contract, reject
   it or file a Beads task instead of adding reserved adapter surface.
6. Keep core package imports one-way: adapter may import core/harness; core must
   not import adapter.

## Verification

Run typecheck/tests, verify the changed brief output, and search that
`packages/core` has no Codex adapter imports or Codex-specific runtime behavior.

## Forbidden

- Do not invoke Codex from the adapter.
- Do not write files, mutate memory, or run shell commands from renderer code.
- Do not make Codex surfaces the product brain.
- Do not render skill, hook, MCP, Goal, or ExecPlan metadata unless a current
  runtime contract consumes it.
- Do not import `@krn/codex-adapter` from `packages/core`.
```

## 18. .agents/skills/krn-implementation/references/store-schema.md

skill: krn-implementation
role: maker

```markdown
# Store Schema

Use this reference when implementation touches the Postgres-backed KRN brain
store: Drizzle schema, migrations, repository adapters, mappers, SQL helpers,
memory/source/run ledgers, retrieval tables, outbox events, or worker jobs.

## Procedure

1. Identify the durable object and its lifecycle.
2. Keep stable query fields relational; use JSONB only for unstable metadata.
3. Preserve lineage, invalidation, TTL, confidence, trust, and run/event links
   where relevant.
4. Put external or DB JSON behind adapters that narrow `unknown` before domain
   objects consume it.
5. Pair state changes with run events, outbox events, or worker jobs when the
   audit/work signal is part of the contract.
6. Add or update migrations and inspect generated SQL for critical columns,
   indexes, enums, and extensions.

## Output

- Schema/table changes.
- Repository and mapper impact.
- Migration evidence.
- Query/index rationale.
- Rollback or migration risk.

## Verification

Run relevant tests, `rtk proxy pnpm --filter @krn/db db:generate` when schema
changes, `rtk proxy pnpm --filter @krn/db db:check`, SQL inspection,
`rtk proxy pnpm typecheck`, and `rtk git diff --check`.

## Forbidden

- Do not make markdown or `.krn` runtime truth.
- Do not hide first-class state entirely in JSONB.
- Do not add Redis, Kafka, Neo4j, Qdrant, Elastic, or OpenSearch for the first
  spine.
- Do not trust raw DB JSON as a domain object.
```

## 19. .agents/skills/krn-implementation/references/tdd.md

skill: krn-implementation
role: maker

```markdown
# TDD

Use this reference to create one tight behavior falsifier before implementation.
The goal is not more tests. The goal is a test that would fail for the exact
bug, authority gap, or product behavior being changed.

## Procedure

1. Name the behavior, not the implementation.
2. Pick the highest public seam that observes it:
   - CLI command/readback;
   - core domain function;
   - repository adapter or migration contract;
   - DecisionPacket/eval scorer;
   - MCP transport wrapper only when transport behavior is the point.
3. Write one red test at that seam. The expected value must come from the Bead,
   roadmap rule, fixture fact, or worked example, not from the implementation.
4. Run only the smallest command that proves the test is red.
5. Implement the smallest change that makes it green.
6. Refactor only if the green path exposes real duplication or a shallow seam.
7. Run the local test, `rtk proxy pnpm typecheck`, and the relevant Fallow gate
   through `rtk proxy` before closing the Bead.

## Good KRN Tests

- Prove source and memory authority changes affect activation or a
  DecisionPacket.
- Prove stale, rejected, unsupported, or unsafe knowledge is excluded or
  caveated.
- Prove CLI/parser/persistence boundaries reject malformed input.
- Prove feedback changes a later selection through the store/read model path.
- Use public interfaces and stable fixtures; keep assertions independent and
  literal where possible.

## Bad KRN Tests

- Freeze markdown wording, file counts, command lists, or docs topology.
- Assert constants equal themselves or recompute expected values the same way
  as the implementation.
- Mock internal KRN modules just to observe call order.
- Add broad snapshots when one field-level assertion proves the behavior.
- Create a test only because a rename happened.

## Mocking Rule

Mock true external boundaries only: network APIs, time, randomness, filesystem,
process exit, or a DB when a test DB is not the seam under test. Do not mock
core, CLI, harness, or DB repository collaborators you can exercise through the
public interface.

## Verification

Verification requires the red command, green command, typecheck result, and
relevant Fallow result or an explicit unavailable reason.
```

## 20. .agents/skills/krn-implementation/references/type-safety.md

skill: krn-implementation
role: maker

```markdown
# Type Safety

Use this reference for TypeScript source, tsconfig, public exported types,
validators, JSON/fetch/file/env/CLI/MCP inputs, generics, casts, unknown
narrowing, `any` usage, double assertions, `ts-reset` decisions, or fixes that
might weaken type safety to move faster.

## Procedure

1. Classify the boundary: public API, external input, internal domain type,
   persistence, CLI, MCP/app connector, test fixture, or config.
2. Keep external data as `unknown` until validated.
3. Prefer explicit exported types.
4. Avoid `any`; isolate and justify it if unavoidable.
5. Avoid double assertions unless no better option exists.
6. Put runtime validation near external boundaries.
7. If the work touches an external input boundary, query the retained knowledge
   catalog before implementation when the catalog is available:

   ```sh
   rtk proxy pnpm --filter @krn/cli krn brain recall --fixture-catalog-file tests/fixtures/brain-knowledge/corpus/catalog.json --text unknown-first
   ```

   Use the catalog result as read-only knowledge context. If the command is not
   available, record that catalog readback was not used; do not fall back to a
   markdown knowledge file as runtime authority.
8. State whether `ts-boundary-unknown-first-result-state` applies.
9. Decide whether `ts-type-critic` should review.
10. Run typecheck before completion.

## `ts-reset`

- Consider only for application packages.
- Do not use global `ts-reset` in `packages/core` or public SDK packages.
- Never use it to hide missing validation.

## Verification

The final diff should preserve strict boundaries and include
`rtk proxy pnpm typecheck` or an explicit reason typecheck is unavailable.

## Forbidden

- Do not weaken types to make implementation easier.
- Do not trust `JSON.parse`, `fetch().json()`, file reads, env vars, CLI args,
  MCP responses, connector responses, plugin output, or user config.
- Do not introduce unreviewed `any`.
- Do not apply retained knowledge by vibe; name the knowledge ID, consumer, and
  falsifier or explicitly reject it for the slice.
```

## 21. .agents/skills/krn-implementation/SKILL.md

skill: krn-implementation
role: maker

```markdown
---
name: krn-implementation
description: Use for KRN maker work that needs a tight proof path: activation, store schema, Codex adapter rendering, TDD, TypeScript boundaries, tests, or migrations.
---

# KRN Implementation

Use this skill for maker work inside the KRN kernel. It routes one concrete
runtime slice to the right reference and proof path.

## Trigger

- Changing activation, retrieval, memory/source selection, context budget, or
  owner-file recall.
- Changing Drizzle/Postgres schema, migrations, repository adapters, outbox, or
  worker persistence.
- Rendering `DecisionPacket`, harness output, or task contracts into Codex
  briefs.
- Touching TypeScript boundaries, validators, public types, casts, generics,
  CLI/env/file/JSON/MCP inputs, or tsconfig.
- Adding or changing tests for runtime behavior, parser boundaries,
  migrations, source/memory authority, feedback, or bug fixes.

## Steps

1. Read the active Beads issue, `KRN_ROADMAP.md`, and only the files needed for
   the current runtime boundary.
2. Name the runtime consumer, owner, falsifier, proof command, and non-proof
   boundary before editing.
3. Load exactly the relevant reference, or more only when the slice truly
   crosses boundaries:
   - `references/activation.md` for context selection and owner-file recall;
   - `references/store-schema.md` for DB schema, migrations, and adapters;
   - `references/codex-adapter.md` for Codex execution brief rendering;
   - `references/tdd.md` for red-green runtime behavior work;
   - `references/type-safety.md` for TypeScript boundary discipline.
4. Implement the smallest change that makes the roadmap or Beads acceptance
   criteria more true.
5. Remove compatibility aliases, duplicate read models, and old public paths in
   the same slice when a staged migration is not required.
6. Run the smallest focused behavior check first, then typecheck for
   TypeScript changes, and Fallow when the change touches package surfaces,
   architecture, or cleanup.

## Branch Dispatch

| Change shape | Required reference | First proof |
|---|---|---|
| selection, ranking, owner-file recall, exclusions | `activation.md` | focused activation or owner-file test |
| schema, migration, repository adapter | `store-schema.md` | migration/adapter test or DB check |
| Codex brief or DecisionPacket rendering | `codex-adapter.md` | brief golden or renderer test |
| behavior with known desired outcome | `tdd.md` | red command before implementation |
| TS boundary, parser, env/file/JSON/MCP input | `type-safety.md` | focused test plus typecheck |

If the symptom is unknown, use `diagnosing-bugs` before this skill.

## Output

- Runtime boundary:
- Consumer:
- Owner:
- Falsifier:
- Reference loaded:
- Changed files:
- Proof:
- Non-proof:
- Follow-up Beads:
- Reference rejected:

## Stop Condition

Stop when the runtime consumer, owner, falsifier, changed boundary, proof
command, and remaining non-proof are explicit, focused checks pass or are
reported honestly, and durable follow-up work is represented in Beads.

## Verification

Use the selected reference verification plus `rtk proxy pnpm typecheck` for
TypeScript changes. For broad JS/TS package-surface or cleanup work, run
`rtk proxy pnpm quality:fallow` or record why it is not applicable.

## Forbidden

- Do not implement from a vague concept before naming the consumer and
  falsifier.
- Do not load every reference as ritual.
- Do not add compatibility shims unless a test or staged rollout requires them.
- Do not hide runtime memory in markdown.
- Do not weaken TypeScript or testing boundaries to make a slice green.
- Do not turn package/file topology changes into proof of product behavior.
```

## 22. .agents/skills/source-to-decision/SKILL.md

skill: source-to-decision
role: decision

```markdown
---
name: source-to-decision
description: Use when external docs, papers, practitioner writing, competitor docs, local evidence, or user material must become a KRN decision with mechanism, consumer, falsifier, and does-not-prove.
---

# Source To Decision

Use this skill to prevent source hoarding.

## Trigger

- A decision depends on external docs, papers, competitor/practitioner writing,
  local repo evidence, or user-provided material.
- A source might otherwise become decorative context.

## Steps

1. Identify the exact source and trust tier.
2. Extract the mechanism, not just the claim.
3. State the KRN implication.
4. Decide: adopt, reject, lab-test, or defer.
5. State what the source does not prove.
6. Name the consumer: roadmap decision, Beads issue, store-backed source or
   memory candidate, skill, type, eval candidate, CLI/readback behavior, or
   runtime contract.
7. Add a falsifier.
8. After execution, close source usefulness feedback or record why it was not
   measured.

## Research Intake Rules

Use this lane for official docs, papers, practitioner writing, course material,
competitor docs, local evidence, and user-provided research.

Before retaining or applying a source or knowledge decision, query the explicit
brain knowledge catalog when retained knowledge context is relevant:

```sh
rtk proxy pnpm --filter @krn/cli krn brain recall --fixture-catalog-file tests/fixtures/brain-knowledge/corpus/catalog.json --text source-to-decision
```

Use catalog results as read-only context. They can guide adoption, rejection,
consumer routing, and falsifiers, but they do not promote memory, mutate source
truth, rank knowledge, or prove product readiness.

For multi-source, course, paper, practitioner method, or operator-facing
intake, keep this skill as the trigger/gate and route durable follow-up through
Beads, store-backed source candidates, eval candidates, or a focused skill
update. Do not create a markdown research runbook as the source of truth.

Keep the gate strict:

- Source without mechanism is decoration.
- Mechanism without KRN implication is a note.
- Implication without decision or rejection is backlog pressure.
- Decision without falsifier is dogma.
- Practitioner or course guidance can shape style, but it does not override
  repo evidence, tests, or KRN architecture law.
- Papers can create hypotheses, eval candidates, or architecture-decision
  evidence, but they do not become product truth without local falsifiers.
- Official docs can define current product mechanics, but still need a KRN
  implication and a proof/non-proof boundary.

Preferred consumers:

- `KRN_ROADMAP.md` for compact product and architecture direction.
- Beads for durable follow-up work and blockers.
- Store-backed source, memory, feedback, and eval candidates for runtime
  learning paths.
- Skills for repeated execution workflows.
- Eval candidates for behavior that can be falsified.
- Memory/source candidates for future review, never automatic promotion.

Reject or defer sources when the consumer is unclear.

## Output

```yaml
source_id:
title:
url:
trust_tier: high | medium | low
source_class: official docs | papers | high-quality public course page | practitioner writing | competitor docs | repo-local evidence | target-repo evidence | user-provided research
mechanism:
krn_implication:
decision_kind: adopt | reject | lab_test | defer
decision:
does_not_prove:
consumer:
falsifier:
```

Optional when useful:

```yaml
candidate_output:
  type: MemoryCandidate | SourceDecision | EvalCandidate | SkillCandidate | none
  reviewability: ready | needs_more_evidence | too_vague | duplicate | not_useful | unknown
source_usefulness_feedback:
  status: measured_with_evidence_capture | not_measured
  outcome: selected | used | helped | neutral | noise | stale | unknown
  reason:
  evidence_refs:
  does_not_prove:
```

## Forbidden

- Do not retain decorative links.
- Do not treat practitioner or competitor claims as Codex truth.
- Do not use a source without `does_not_prove`.
- Do not cite raw onboarding material as default context; cite the derived doc
  unless auditing the raw source.
- Do not create a research archive, source crawler, or broad research backlog
  from a source that has no immediate consumer.

## Continuous Knowledge Gate

Use this gate at every non-trivial KRN slice, not only research-labeled tasks.

Before adopting, rejecting, or implementing retained knowledge, classify whether
the slice touches one of these knowledge surfaces:

```txt
infra / storage / migrations / queues
harness / activation / memory / review gates
CI / release / eval / Promptfoo
Codex surfaces / skills / hooks / MCP / subagents
target-repo workflow
TypeScript boundaries
security / permissions / trust boundaries
operator UX / CLI / readback
```

If it does, either:

- cite an existing KRN source, standard, architecture decision, or skill and
  state the mechanism; or
- add a bounded source decision; or
- explicitly reject/defer source work with a reason.

Allowed source classes:

```txt
official docs
papers
high-quality public course page
practitioner writing
competitor docs
repo-local evidence
target-repo evidence
user-provided research
```

Legal/content boundary:

- Do not copy paid/proprietary course material into KRN.
- Use public pages, personal notes supplied by the user, or short source
  summaries that map to mechanisms and decisions.
- Prefer links and mechanisms over transcripts.

Consumer routing:

```txt
standard:
  durable coding or review rule

skill:
  repeated execution workflow

architecture decision:
  rare source-backed decision; prefer roadmap, Beads, or store-backed
  SourceDecision over markdown ADR files

eval/golden candidate:
  behavior can be falsified

memory/source candidate:
  useful future recall, still review-gated

CLI/readback/CI behavior:
  operator-facing or enforcement surface

bounded repair:
  one small source change with verification

reject:
  source is decorative, unsupported, stale, or mismatched to KRN
```

Do not proceed from retained knowledge to implementation unless the consumer and falsifier
are explicit.

## Usefulness Feedback Closure

If a source materially shaped code, infra, harness, CI, eval, TypeScript,
operator UX, or Codex-surface work, close the loop after execution:

```txt
krn evidence capture --source-usefulness "claim:<source-id>=helped|reason|evidence-ref[,ref]|doesNotProve"
```

Use `decision:<id>` instead of `claim:<id>` when the retained object is a
SourceDecision.

If usefulness is not measured, record why in the report or plan outcome. Accept
only bounded reasons:

```txt
no persisted run
source was rejected
source was background context only
no implementation/review decision used it
legal/content boundary
```

Do not leave a course, paper, docs page, practitioner claim, or repo-local
source as decorative authority after it influences implementation.

## Verification

The mapped source must change a decision, reject a path, define a risk, create a
testable hypothesis, constrain implementation, or be closed by source
usefulness feedback with a proof/non-proof boundary.

## Stop Condition

Stop when every used source has a mechanism, KRN implication, decision or
rejection, consumer, falsifier, `does_not_prove`, and usefulness closure or a
bounded reason usefulness was not measured.
```

## 23. .agents/skills/target-repo-testing/agents/openai.yaml

skill: target-repo-testing
role: checker

```markdown
interface:
  display_name: "Target Repo Testing"
  short_description: "Run KRN target-repo trials without corrupting living checkouts."
  default_prompt: "Use $target-repo-testing to classify target repo testing mode, dirty state, allowed writes, evidence, and stop conditions before running target commands."
```

## 24. .agents/skills/target-repo-testing/SKILL.md

skill: target-repo-testing
role: checker

```markdown
---
name: target-repo-testing
description: Use for KRN work against another repo: inspect, init, test, plan, verify, or repair with explicit mode, dirty state, write authority, proof/non-proof, and handoff.
---

# Target Repo Testing

Use this skill before running target-repo commands or writing target-repo
evidence.

## Trigger

- Use for KRN work against a repo other than the active KRN kernel workspace.
- Use before `krn init --repo`, target-repo planning, target test execution,
  headless repair, owner-file read-model capture, or second-operator proof.
- Use when target dirty state, write authority, or handoff ownership could
  affect whether evidence is valid.
- Do not use for ordinary edits inside the current KRN repo unless that repo is
  being treated as an explicit target under a bounded trial.

## Core Rule

Target repositories are not disposable fixtures.

Do not edit, commit, push, reset, clean, or normalize a target repo unless the
current task explicitly allows target writes.

## Steps

Follow these steps before treating target-repo output as KRN evidence.

## Step 1: Classify The Mode

Choose exactly one mode before running target commands:

```txt
observation-only:
  inspect and run non-destructive commands; write only KRN reports/evidence.

headless-repair:
  edit target files only inside explicit target scope.

real-second-operator:
  only mode that can satisfy V02-01; requires real operator inputs/transcript.
```

If the user did not explicitly authorize target writes, default to
`observation-only`.

## Step 2: Record Dirty State

Run target `git status --short --branch` before any target command when the
target is a Git repo.

A previous clean target selection expires at the next target task. Revalidate
status immediately before using the target for observation, planning, evidence,
or repair. Do not rely on a clean status from an earlier slice or report.

Classify:

```txt
target_dirty_before: yes/no
target_status_freshness:
  fresh_current_task
  stale_prior_selection
  changed_since_selection
owned_by_current_krn_run: no / partial / yes
target_patch_lifecycle:
  none
  accepted_by_target_owner
  rejected_by_target_owner
  stronger_verification_requested
  handed_off_unresolved
allowed_writes:
forbidden_writes:
```

If the target is dirty and the mode is observation-only, treat the dirty state
as external operator context.

If a target was selected as clean but is dirty at task start, classify
`target_status_freshness: changed_since_selection`, downgrade to
observation-only, and do not run a repair until a new clean state or explicit
write scope is established.

If a previous headless repair left a KRN-made target patch dirty and that patch
has only been handed off, classify it as `handed_off_unresolved`. Do not start
another repair in that same target repo. Allowed next actions are:

- wait for target owner/operator decision;
- run observation-only verification requested for that patch;
- choose a different clean/safe target;
- record a blocked handoff if no useful progress is possible.

## Step 3: Run Only Mode-Compatible Commands

Observation-only allows:

- inspect `AGENTS.md`, README, docs, scripts, tests, plans;
- run read/status commands;
- run typecheck/test commands when they do not intentionally write source;
- write KRN repo reports and evidence.

Observation-only forbids:

- editing target files;
- fixing target tests;
- reverting target changes;
- committing/pushing target changes;
- calling the run second-operator proof.

Headless repair additionally requires:

- named target files or package surface;
- rollback path;
- focused verification;
- separation of pre-existing dirty files from KRN-made changes.
- a handoff artifact when KRN-made target changes remain dirty after the run.

## Step 4: Capture Evidence Honestly

When a command ran in the target repo, label it as target evidence:

```txt
command: <target-name> <command>
provenance: operator_reported
does_not_prove:
  - KRN source correctness
  - full target verification if any gate was skipped
  - product readiness
  - second-operator usability
```

If KRN evidence capture reports zero changed files while the target repo is
dirty, state:

```txt
KRN EvidenceBundle did not classify target changed files.
```

## Owner-File Read-Model Contract

Exact target owner files are explicit read-model inputs, not automatic crawler
output. If the bounded target task has known owner files, pass them through
`krn init`:

```sh
rtk proxy pnpm krn init --dry-run --repo <target> \
  --owner-file "src/index.ts|src|implementation_entry|implementation entry point"

rtk proxy pnpm krn init --connect --repo <target> --persist \
  --owner-file "src/index.ts|src|implementation_entry|implementation entry point"
```

Each entry is `path|root|kind|reason`. If no owner files are provided, record
`missing_owner_file_read_model` as read-model incompleteness. Do not treat it as
proof that owner files do not exist, and do not repair activation scoring from
that signal alone.

## Stop Condition

Stop and report instead of patching when:

- observation-only target verification fails;
- target writes are needed but not explicitly allowed;
- secrets or generated runtime surfaces appear;
- another active operator/instance is evolving the target;
- the target has a previous KRN-made patch with
  `target_patch_lifecycle: handed_off_unresolved` and the current task is
  another same-target repair;
- the trial would be renamed into V02-01 without a real second operator.

## Verification

Target-repo work is verified only when mode, dirty state, write authority,
commands, proof/non-proof boundaries, and handoff state are recorded.

## Output

Every target trial report must include:

```txt
mode:
target_dirty_before:
target_status_freshness:
target_patch_lifecycle:
handoff_artifact:
allowed_writes:
forbidden_writes:
commands:
what_proved:
what_did_not_prove:
target_dirty_after:
condensation_decision:
```

## Forbidden

- Do not edit, commit, push, reset, clean, or normalize a target repo unless the
  current task explicitly allows target writes.
- Do not treat observation-only output as permission to repair.
- Do not use a dirty target as clean evidence without recording dirty state.
```

