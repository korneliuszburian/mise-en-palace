# KRN Skills Bundle

This is a repomix-style single document for reading, searching, and copying the
current repo-local KRN skills. It is generated from `.agents/skills/*/SKILL.md`.

## File Index

| # | Skill | Role | File |
|---|---|---|---|
| 1 | activation-engine | maker | `.agents/skills/activation-engine/SKILL.md` |
| 2 | beads | router | `.agents/skills/beads/SKILL.md` |
| 3 | brain-store-schema | maker | `.agents/skills/brain-store-schema/SKILL.md` |
| 4 | code-review | checker | `.agents/skills/code-review/SKILL.md` |
| 5 | codebase-design | decision | `.agents/skills/codebase-design/SKILL.md` |
| 6 | codex-adapter-plan | maker | `.agents/skills/codex-adapter-plan/SKILL.md` |
| 7 | domain-modeling | decision | `.agents/skills/domain-modeling/SKILL.md` |
| 8 | evidence-review-loop | checker | `.agents/skills/evidence-review-loop/SKILL.md` |
| 9 | handoff-compact | router | `.agents/skills/handoff-compact/SKILL.md` |
| 10 | source-to-decision | decision | `.agents/skills/source-to-decision/SKILL.md` |
| 11 | target-repo-testing | checker | `.agents/skills/target-repo-testing/SKILL.md` |
| 12 | tdd | maker | `.agents/skills/tdd/SKILL.md` |
| 13 | typescript-type-safety | maker | `.agents/skills/typescript-type-safety/SKILL.md` |

## Files

## 1. .agents/skills/activation-engine/SKILL.md

name: activation-engine
role: maker
invocation: model-invoked

```markdown
---
name: activation-engine
description: Use when implementing or changing KRN context selection, retrieval candidate ranking, memory/source activation, owner-file/read-model recall, context exclusions, trust filters, temporal filters, abstention, or context ROI behavior.
---

# Activation Engine

Use this skill to keep active context small, justified, and reviewable.

## Trigger

- A task needs memory/source retrieval, ranking, inclusion, exclusion, or
  abstention behavior.
- A change affects trust, time, lexical/vector/graph scores, or context budget.

## Steps

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

Before changing scoring or widening recall:

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

## Output

- Query terms and filters.
- Ranked candidates.
- Context inclusions.
- Context exclusions.
- Abstention reason if applicable.
- Owner-file/read-model source or missing-read-model reason when relevant.
- Test or proof command.

## Stop Condition

Stop when the packet has the smallest justified inclusion set, every rejected
high-scoring candidate has an exclusion reason, and weak context is represented
as abstention or missing-read-model evidence.

## Forbidden

- Do not activate raw materials by default.
- Do not include context because it is nearby, recent, or long.
- Do not hide selection policy inside CLI, DB, or Codex adapter code.
- Do not omit exclusion records for rejected high-scoring candidates.

## Verification

Tests should prove high-signal inclusion, invalid/stale exclusion, source-safety
exclusion, budget behavior, and abstention for weak context.
```

## 2. .agents/skills/beads/SKILL.md

name: beads
role: router
invocation: model-invoked

```markdown
---
name: beads
description: Use when working in a repository that uses bd or Beads for durable project task tracking, issue dependencies, blocker management, multi-session handoff, or shared work memory. Trigger when the user asks to find ready work, claim or close tasks, create follow-up work, inspect blockers, recover project context, or choose between local planning and persistent project tracking.
---

# Beads

Use Beads as the shared project task system. Local plans, scratch files, and personal memories are useful, but they are not the durable source of truth for project work.

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

## Preferred Route

Use the `bd` CLI when shell access is available. It is the most compact and direct Beads interface.

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

Use tracer-bullet issues for product work:

- each issue delivers one narrow, verifiable path through the affected runtime
  boundary;
- each issue fits one fresh agent context;
- each issue states acceptance criteria and proof/non-proof boundaries;
- blockers are native Beads dependencies, not prose-only references;
- the frontier is `bd ready`: open work whose blockers are done.

Use expand-contract for wide refactors:

1. expand the new form beside the old only when a single green slice cannot
   migrate the blast radius safely;
2. migrate callers in batches sized by package, directory, or public boundary;
3. contract the old form only after `rg` and typecheck prove no caller remains.

If a planned issue has no runtime consumer, falsifier, or owner, reject it or
record it as a question before creating implementation work.

For foggy roadmap work, use wayfinding inside Beads instead of creating a
separate map document:

- first name the destination: the decision, spec, or runtime change that makes
  the roadmap more true;
- create question issues only for fog that is sharp enough to answer in one
  fresh context;
- keep vague future areas out of implementation tickets until a frontier issue
  makes them specific;
- record each resolved decision in the closing reason or issue notes, not in a
  parallel plan file;
- create newly discovered Beads only after the current question makes their
  blockers and acceptance criteria clear.

## Steps

Use Beads before durable work:

1. Run `bd prime` after compaction, resume, or a fresh session.
2. Inspect ready/in-progress work before choosing a slice.
3. Claim an existing issue, or create one when the work must survive handoff.
4. Keep implementation notes in Beads comments or issue descriptions when they are durable; keep root KRN plans compact.
5. Close the Beads issue only after verification, commit, push, and CI status are recorded or explicitly marked unavailable.

## What Belongs In Beads

Use Beads for:

- shared project tasks
- blockers and dependencies
- discovered follow-up work
- work that must survive thread reset, compaction, or handoff
- status that another person or agent should be able to resume

Use agent-local planning tools only for the current turn's execution checklist. Do not treat them as shared project state.

## Output

- Claimed, created, updated, blocked, or closed Beads issue.
- Dependency edge when one task gates another.
- Closing reason or issue note with verification and non-proof boundary.
- No markdown TODO or parallel task ledger.

## Forbidden

- Do not create markdown TODO files as the source of truth when Beads is available.
- Do not use `bd edit`; it opens an interactive editor. Use `bd update` flags instead.
- Prefer `--json` when parsing `bd` output programmatically.
- If hooks are installed, `bd prime` may already be injected. Run it manually when context is missing.
- Do not auto-close or mutate tasks unless the work is actually complete.

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

## 3. .agents/skills/brain-store-schema/SKILL.md

name: brain-store-schema
role: maker
invocation: model-invoked

```markdown
---
name: brain-store-schema
description: Use when designing or changing KRN Drizzle/Postgres schema, migrations, repository adapters, memory/source/run ledgers, retrieval tables, outbox events, or worker job persistence with unknown narrowing, migration evidence, and rollback risk.
---

# Brain Store Schema

Use this skill when a change touches the Postgres-backed KRN brain store.

## Trigger

- New or changed Drizzle schema, migration, repository adapter, mapper, or SQL
  helper.
- New memory, source graph, retrieval, evidence, feedback, outbox, or worker-job
  persistence behavior.

## Steps

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

## Stop Condition

Stop when the durable object lifecycle, schema/migration diff, adapter
narrowing, rollback risk, and verification commands are all explicit.

## Forbidden

- Do not make markdown or `.krn` runtime truth.
- Do not hide first-class state entirely in JSONB.
- Do not add Redis, Kafka, Neo4j, Qdrant, Elastic, or OpenSearch for the first
  spine.
- Do not trust raw DB JSON as a domain object.

## Verification

Run `rtk proxy pnpm typecheck`, relevant tests, `rtk proxy pnpm --filter
@krn/db db:generate` when schema changes, `rtk proxy pnpm --filter @krn/db
db:check`, SQL inspection, and `rtk git diff --check`.
```

## 4. .agents/skills/code-review/SKILL.md

name: code-review
role: checker
invocation: model-invoked

```markdown
---
name: code-review
description: Use when reviewing KRN diffs, PRs, large local changes, migration slices, cleanup slices, or architecture/naming changes for bugs, spec drift, roadmap drift, test theater, speculative generality, shallow modules, and Fowler-style code smells.
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

## 5. .agents/skills/codebase-design/SKILL.md

name: codebase-design
role: decision
invocation: model-invoked

```markdown
---
name: codebase-design
description: Use when changing KRN architecture, package seams, public interfaces, adapters, runtime/store boundaries, naming, or refactors where the risk is shallow modules, pass-through layers, duplicate read models, speculative seams, or unclear test surfaces.
---

# Codebase Design

Use this skill before architecture or naming edits that change a public seam.

## Trigger

Use before architecture, naming, or seam edits that change what callers,
operators, tests, or persistence paths must understand.

## Purpose

Make KRN smaller and deeper: more behavior behind fewer clearer interfaces, with
a runtime consumer, falsifier, and owner.

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

## Steps

1. Map current caller -> interface -> implementation -> persistence/runtime path.
2. Run the deletion test: if deleting the module removes complexity, it is
   likely middle-man; if complexity reappears across callers, it earns depth.
3. Classify dependencies before adding a seam:
   - in-process: deepen directly and test through the interface;
   - local-substitutable: use the real local substitute, not a mock layer;
   - remote-owned: define a port only when production and test adapters both
     earn the seam;
   - true external: inject the dependency and mock only that boundary.
4. Count adapters: one adapter is usually a hypothetical seam; two real adapters
   can justify a seam.
5. Prefer one direct domain model over adapter chains, duplicate read models, or
   compatibility aliases.
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

## Stop Condition

Stop when the current path, smallest design decision, owner, consumer,
falsifier, non-proof boundary, and verification command are all named.

## Verification

Verify with the smallest behavior/type checks that touch the changed seam, plus
targeted `rg` proof for removed aliases, duplicate read models, or rejected
public terms when relevant.

## Forbidden

- Do not add a seam without a current consumer, falsifier, and owner.
- Do not preserve bad names behind compatibility aliases unless a staged rollout
  is required.
- Do not use prose/topology tests as design proof.
```

## 6. .agents/skills/codex-adapter-plan/SKILL.md

name: codex-adapter-plan
role: maker
invocation: model-invoked

```markdown
---
name: codex-adapter-plan
description: Use when rendering KRN DecisionPacket or harness output into Codex-facing execution briefs with bounded context, evidence expectations, proof boundaries, and non-mutating adapter behavior.
---

# Codex Adapter Plan

Use this skill at the Codex brief boundary, not inside core domain logic.

## Trigger

- A KRN `DecisionPacket`, harness plan, or task contract must become a Codex
  execution brief.
- A change risks leaking Codex-specific language into `packages/core`.
- A brief change risks treating skills, hooks, MCP, or adapter metadata as the
  product brain instead of tooling around the `DecisionPacket`.

## Steps

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

## Output

- Execution brief.
- DecisionPacket context inclusion/exclusion section.
- Current knowledge/source support, stale boundaries, and rejected paths.
- Evidence contract.
- Non-goals and stop conditions.
- Proof and non-proof boundary.

## Stop Condition

Stop when the rendered brief is bounded, inspectable, non-mutating, has explicit
proof/non-proof boundaries, and no Codex-specific product authority leaked into
core packages.

## Forbidden

- Do not invoke Codex from the adapter.
- Do not write files, mutate memory, or run shell commands from renderer code.
- Do not make Codex surfaces the product brain.
- Do not render skill, hook, MCP, Goal, or ExecPlan metadata unless a current
  runtime contract consumes it.
- Do not import `@krn/codex-adapter` from `packages/core`.

## Verification

Run typecheck/tests, verify the changed brief output, and search that
`packages/core` has no Codex adapter imports or Codex-specific runtime behavior.
```

## 7. .agents/skills/domain-modeling/SKILL.md

name: domain-modeling
role: decision
invocation: model-invoked

```markdown
---
name: domain-modeling
description: Use when changing or judging KRN terminology, public names, concept ownership, domain vocabulary, CLI/API wording, roadmap wording, or when the user flags logical divergence in names such as brain, memory, knowledge, source, activation, DecisionPacket, retained knowledge, pattern, card, normalized, final, or new.
---

# Domain Modeling

Keep KRN's language coherent across roadmap, Beads, code, CLI/API surfaces, and
store-backed knowledge. Resolve domain terms by changing the owning boundary,
not by creating another glossary file.

## Trigger

Use when a term, public name, concept boundary, roadmap phrase, CLI/API wording,
or retained-knowledge vocabulary changes or looks logically inconsistent.

## Steps

1. Pin the term or concept under dispute.
2. Map the current path:
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
5. Update the owner:
   - code export when the term is a runtime/domain concept;
   - `KRN_ROADMAP.md` only for compact architecture truth;
   - Beads for follow-up work or dependency edges;
   - store-backed memory/source/eval candidates when the term must be learned at runtime.
6. Remove stale public terms in the same slice when safe. Do not hide them behind
   local aliases or migration fallbacks unless a staged rollout is required.
7. Verify by grepping the rejected term and running the smallest behavior/type
   checks that touch the changed boundary.

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

## Forbidden

- Do not create `CONTEXT.md`, `CONVENTIONS.md`, ADR folders, glossary docs, or
  markdown runbooks as a default authority surface.
- If an ADR-like decision is truly needed, keep it compact and require the
  roadmap Artifact Contract: source, mechanism, KRN implication,
  decision/rejection, owner, consumer, falsifier, and verification.
- Do not preserve bad exported names with local aliases.
- Do not rename storage details into product terms when only repository plumbing
  is involved.
- Do not turn a terminology concern into a broad refactor unless the public
  boundary actually leaks the wrong concept.
- Do not write tests that only freeze vocabulary. Prefer existing behavior tests,
  typecheck, Fallow, and targeted `rg` proof for rejected terms.

## Source-To-Decision

When external writing, papers, or reference implementations influence a term,
record the decision in this shape:

```yaml
source:
mechanism:
krn_implication:
decision:
rejection:
consumer:
falsifier:
does_not_prove:
```

## Output

- Term:
- Current path:
- Canonical language:
- Decision:
- Owner:
- Consumer:
- Falsifier:
- Verification:

## Stop Condition

Stop when the canonical term is owned at the highest honest boundary, stale
public terms are removed or explicitly deferred, and `rg` plus the smallest
type/behavior check prove the rejected vocabulary is not still active.

## Verification

Verify by grepping rejected terms and running the smallest type/behavior checks
that touch the renamed or re-owned boundary.
```

## 8. .agents/skills/evidence-review-loop/SKILL.md

name: evidence-review-loop
role: checker
invocation: model-invoked

```markdown
---
name: evidence-review-loop
description: Use when capturing KRN execution evidence with command provenance, proof/non-proof boundaries, review risk, feedback deltas, or memory/source/skill/policy/eval candidates after a run.
---

# Evidence Review Loop

Use this skill after or around execution, when proof must become reviewable
state without mutating memory automatically.

## Trigger

- Capturing changed files, command results, typecheck/test status, diff risk,
  review burden, rollback path, or feedback candidates.
- Turning review findings into memory/source/skill/policy/eval candidates.

## Steps

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
   persisted evidence, treat it as a sequencing failure until observe completion
   is verified. Do not use that result as reflection-quality evidence.
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

## Stop Condition

Stop when a reviewer can distinguish hard proof, skipped or weak evidence,
interpretation, rollback path, source usefulness, feedback candidates, and any
remaining proof gaps.

## Forbidden

- Do not claim skipped commands passed.
- Do not treat default_template, skipped, missing, or not_run command rows
  as strong verification proof.
- Do not mutate Memory Core without explicit acceptance.
- Do not invent execution runs when DB/run IDs are absent.
- Do not promote eval/source/memory candidates as a side effect of capture.
- Do not run same-run `krn observe --persist` and `krn reflect --persist` in
  parallel.
- Do not call a zero-observation reflection result a reflection-quality finding
  until observe completion for that run is verified.

## Verification

Evidence must let a reviewer see what changed, what was actually run, what risk
remains, and how to roll back.

For persisted same-run loops, evidence must also show that observe completed
before reflect, or explicitly mark reflection output as sequencing-weak.
```

## 9. .agents/skills/handoff-compact/SKILL.md

name: handoff-compact
role: router
invocation: model-invoked

```markdown
---
name: handoff-compact
description: Use when Codex must preserve current objective, active Beads task, verified commit/push/CI state, decisions, changed files, blockers, context selectors, and next action after meaningful work, before auto-compaction, resume, pause, or transfer of a KRN task.
---

# Handoff Compact

Use this skill to keep continuation state small and useful.

## Trigger

- Meaningful work has changed repo state, decisions, blockers, or next action.
- A continuous KRN goal may compact, transfer, pause, or resume later.
- A slice was committed, pushed, CI-checked, blocked, or left with a precise
  next action.

## Steps

1. State the current objective.
2. State the active Beads task id, status, and next action.
3. State the last verified commit, push, CI, DB, and worktree state.
   - For GitHub Actions CI, prefer `gh run list --commit "$(git rev-parse HEAD)"
     --json databaseId,status,conclusion,headSha,workflowName,url,createdAt`.
   - If commit lookup is empty, use branch readback and match `headSha` to the
     full local SHA.
   - Do not report missing CI from short-SHA lookup alone.
4. List changed files only if relevant.
5. List decisions made.
6. List blockers or risks.
7. Name context selectors to rerun.
8. State the exact next action.
9. State what not to reread.

For continuous KRN goals, prefer the claimed or highest-priority ready Beads
task over any older conversation memory.

## Output

```md
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

## Stop Condition

Stop when a fresh Codex thread can resume the next action from the compact
handoff without broad reread, without losing Beads state, and without mistaking
unverified work for pushed or CI-proven work.

## Forbidden

- Do not write a historical narrative.
- Do not dump raw material.
- Do not include full source lists.
- Do not list completed backlog unless it changes the next action.
- Do not turn the handoff into product brain.
- Do not exceed the first screen unless the task explicitly requires it.

## Verification

A new Codex thread should be able to continue the next action without broad
reread, without losing the active Beads task, and without repeating
already-verified commit/push/CI work.
```

## 10. .agents/skills/source-to-decision/SKILL.md

name: source-to-decision
role: decision
invocation: model-invoked

```markdown
---
name: source-to-decision
description: Use when Codex cites OpenAI docs, Cookbook examples, papers, practitioner writing, competitor docs, local repo evidence, or user-provided material to justify KRN architecture, policy, skill, memory, context, eval, MCP, hook, subagent, or TypeScript decisions with a consumer and falsifier.
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

## 11. .agents/skills/target-repo-testing/SKILL.md

name: target-repo-testing
role: checker
invocation: model-invoked

```markdown
---
name: target-repo-testing
description: Use when Codex is asked to inspect, test, initialize, plan, verify, or repair a target repository through KRN with explicit mode, dirty-state, write-authority, proof/non-proof, and handoff boundaries, especially when the target repo may be dirty, active, external, headless, writable, or used as evidence for second-operator/internal-alpha readiness.
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

## 12. .agents/skills/tdd/SKILL.md

name: tdd
role: maker
invocation: model-invoked

```markdown
---
name: tdd
description: Use when adding or changing KRN tests for runtime behavior, parser boundaries, migrations, source/memory authority, DecisionPacket selection, feedback effects, or bug fixes that need a red-green falsifier; do not use for prose, topology, command-list, snapshot, or ceremony tests.
---

# TDD

Use TDD to create one tight behavior falsifier before implementation. The goal
is not more tests. The goal is a test that would fail for the exact bug,
authority gap, or product behavior being changed.

## Trigger

Use when a runtime behavior, parser boundary, migration, source/memory
authority rule, DecisionPacket selection, feedback effect, or bug fix needs a
red-green falsifier.

## Steps

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

## Output

- Behavior:
- Seam:
- Red command:
- Green command:
- Non-proof:
- Verification:

## Stop Condition

Stop when the test fails for the intended reason before implementation, passes
after the smallest change, and the local behavior command, typecheck, and
relevant Fallow gate are run or explicitly unavailable.

## Verification

Verification requires the red command, green command, typecheck result, and
relevant Fallow result or an explicit unavailable reason.

## Forbidden

- Do not write tests that freeze prose, topology, command lists, snapshots, or
  implementation ceremony.
- Do not mock internal KRN collaborators that can be exercised through a public
  seam.
- Do not refactor ahead of the red-green slice.

## Source Decision

Source: Matt Pocock `tdd` skill, adapted from public repo
`https://github.com/mattpocock/skills`.
Mechanism: red-green at a public seam prevents implementation-coupled and
tautological tests.
KRN implication: tests must protect source/memory/DecisionPacket behavior, not
repo prose or ceremony.
Consumer: Codex sessions that add or change tests.
Falsifier: a test added under this skill only freezes prose/topology or passes
without observing the intended behavior.
```

## 13. .agents/skills/typescript-type-safety/SKILL.md

name: typescript-type-safety
role: maker
invocation: model-invoked

```markdown
---
name: typescript-type-safety
description: Enforce KRN TypeScript boundary discipline. Use for TypeScript source, tsconfig, public exported types, validators, JSON/fetch/file/env/CLI/MCP inputs, generics, casts, unknown narrowing, any usage, double assertions, ts-reset decisions, or fixes that might weaken type safety to move faster.
---

# TypeScript Type Safety

Use this skill before or during TypeScript changes.

## Trigger

- A change touches TypeScript source, tsconfig, validators, public exports,
  CLI/env/file/JSON boundaries, generics, casts, or dependency declarations.
- A shortcut would weaken strictness to move faster.

## Steps

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

## Output

- Boundary classification.
- Knowledge ID applied or rejected, when retained TypeScript knowledge is relevant.
- Validation or narrowing location.
- Public type changes.
- Any justified type-safety exception.
- Typecheck result.

## `ts-reset`

- Consider only for application packages.
- Do not use global `ts-reset` in `packages/core` or public SDK packages.
- Never use it to hide missing validation.

## Stop Condition

Stop when each external boundary is narrowed from `unknown`, public type
changes are explicit, any exception is justified, and `rtk proxy pnpm
typecheck` passes or is explicitly unavailable.

## Forbidden

- Do not weaken types to make implementation easier.
- Do not trust `JSON.parse`, `fetch().json()`, file reads, env vars, CLI args,
  MCP responses, connector responses, plugin output, or user config.
- Do not introduce unreviewed `any`.
- Do not apply retained knowledge by vibe; name the knowledge ID, consumer, and
  falsifier or explicitly reject it for the slice.
- Do not claim completion without typecheck once TypeScript exists.

## Verification

The final diff should preserve strict boundaries and include a typecheck result
or an explicit reason typecheck is unavailable.
```

