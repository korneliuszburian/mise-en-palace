# Goal: Full KRN Repo Reset Audit Against Raw Memory Research

You are working in `/home/krn/coding/krn/active/mise-en-palace`.

This is not an implementation slice.
This is a full read-only architecture and engineering reset audit.

The current concern is that the repo may contain conceptually wrong layers,
over-abstracted control surfaces, stale plans, and "quality" or "memory"
machinery that sounds governed but may actually be slop dressed as system
architecture.

The audit must be harsh, concrete, and evidence-based.

## Core Thesis To Verify

KRN is supposed to be a Codex Operating Layer / AI Engineering Control Plane.

Codex executes.
KRN supplies bounded context, source-grounded memory, policy, skills, eval
expectations, traces, review gates, and feedback.

KRN must not become:

- a dashboard-first app;
- a prompt pack;
- a benchmark lab;
- a generic multi-agent framework;
- a stack-specific agent zoo;
- a markdown memory folder;
- a Research Foundry;
- a Pattern Vault;
- an "anti-slop subsystem";
- a fake quality engine;
- a CLI theater layer that pretends to replace engineering judgment;
- a pile of tables/tests/docs that looks governed but does not prove behavior.

## Non-Negotiable Correction

Anti-slop is not a KRN product feature.
Anti-slop is a general engineering discipline.

Do not solve quality by building a new `krn audit` layer, quality engine,
smell-scanner product, or meta-system.

Quality must come from:

- correct architecture;
- strict package boundaries;
- explicit domain models;
- TypeScript excellence;
- small focused files;
- honest naming;
- behavior tests tied to real invariants;
- review discipline;
- no placeholder architecture;
- no fake "thin slice now, real system later";
- no abstractions that make bad ideas look formal.

Existing CLI checks may be inspected, criticized, reduced, renamed, or removed.
Do not assume they are valid because they exist.

## Required Reading Order

Read these files before forming conclusions:

1. `AGENTS.md`
2. `docs/KRN_KERNEL.md`
3. `README.md`
4. `GOAL.md`
5. `PLAN.md`
6. `REVIEW.md`
7. `docs/plans/memory-ideal-state/GOAL.md`
8. `docs/plans/memory-ideal-state/PLAN.md`
9. `docs/plans/memory-ideal-state/QG-00-REPO-INVENTORY.md`
10. `docs/plans/memory-ideal-state/QG-04-SMELL-BLOAT-AUDIT.md`
11. `docs/plans/memory-ideal-state/QG-04H-SMELL-SCAN-AUTOMATION-REQUIREMENTS.md`
12. `docs/plans/memory-ideal-state/QG-05-PROMPTFOO-DECISION.md`
13. `docs/standards/code-quality.md`
14. `docs/standards/typescript-excellence.md`
15. `docs/standards/code-vocabulary.md`
16. `docs/standards/typescript-boundaries.md`
17. `docs/materials/2026-06-22-big-brain.md`
18. `docs/materials/2026-06-22-big-brain-part-2.md`

Then inspect every tracked repo file that participates in current architecture.
Use:

```sh
git ls-files
```

Exclude only:

- `.git/`;
- `node_modules/`;
- generated build outputs;
- `.local-lab/`;
- raw untracked local files except the two required `docs/materials/*` research
  files above.

Do not rely on summaries alone.
Every package must be understood as part of the infrastructure:

- `packages/core`
- `packages/schema`
- `packages/db`
- `packages/harness`
- `packages/cli`
- `packages/codex-adapter`
- `packages/workers`
- `tests/fixtures`
- root scripts/configs/docs/handoff surfaces

## Raw Materials Audit Requirement

The two raw research materials are not implementation truth.
They must be analyzed through:

```txt
source -> mechanism -> KRN implication -> decision/rejection -> falsifier
```

For each retained research mechanism, record:

- source file;
- mechanism;
- what it actually proves;
- what it does not prove;
- KRN implication;
- current repo support;
- current repo contradiction;
- decision: adopt, reject, defer, or lab-test;
- falsifier;
- affected files/packages;
- next required action.

Do not treat "Observational Memory", "dreaming", "reflection", "anti-memory",
"eval", "audit", or "quality gate" as automatically valid layers.
Each must justify its existence against the kernel thesis and actual repo code.

## Current Suspect Areas

Treat these as suspect until proven otherwise:

1. `krn audit`
   - Is it a useful bounded diagnostic?
   - Is it pretending to be system review?
   - Does it encourage meta-layer theater?
   - Should it be renamed, reduced, split, or removed?

2. QG-04H / QG-06 framing
   - Does "smell scan automation" encode the wrong abstraction?
   - Did the plan confuse engineering discipline with product functionality?

3. Memory implementation state
   - Are observations, reflection, candidates, Memory Core, SourceClaims,
     anti-memory, activation, and evals cleanly separated?
   - Are there direct promotion/governance bypasses?
   - Are "candidate", "record", "claim", "decision", "observation",
     "reflection", and "truth" used precisely?

4. CLI surface area
   - Are CLI commands real operator workflows or prematurely exposed internal
     mechanisms?
   - Are they creating product theater instead of enforcing real invariants?

5. TypeScript and code structure
   - Are files focused?
   - Are helpers duplicated?
   - Are names honest?
   - Are tests colocated intentionally and safely?
   - Are public exports clean?
   - Are metadata keys hiding behavior?
   - Are broad barrels exposing internals?

6. Promptfoo/eval lane
   - Is official Promptfoo integration now real and bounded?
   - Does it protect behavior, or is it another compatibility artifact?

7. Plans/docs/handoffs
   - Are they current?
   - Do they contradict each other?
   - Are they creating plan-sprawl?
   - Is there one canonical current-state surface?

## Context-Loss Protocol

This audit may exceed one context window.

Before reading or changing large areas, create and keep updated:

```txt
docs/reviews/repo-reset-audit/STATE.md
```

This file is the audit scratchpad and resume surface.
It must be updated after each major package/doc group.

It must contain:

- latest verified commit;
- current branch/status;
- files read so far;
- files not yet read;
- current package-by-package understanding;
- raw-material mechanisms extracted so far;
- confirmed bad assumptions;
- suspected bad assumptions;
- open questions;
- decisions not yet made;
- next exact read/action;
- commands already run and their results;
- what to read first after context loss.

If context is compacted or lost, the next agent must first read:

1. `docs/reviews/repo-reset-audit/STATE.md`
2. this file: `GOAL_REPO_RESET_AUDIT.md`
3. `docs/KRN_KERNEL.md`
4. the current `git status --short --branch`

Then continue from the first unchecked item in `STATE.md`.

## Required Output Artifacts

Create these artifacts during the audit:

```txt
docs/reviews/repo-reset-audit/STATE.md
docs/reviews/repo-reset-audit/FULL_REPO_AUDIT.md
docs/reviews/repo-reset-audit/RAW_MATERIALS_LEDGER.md
docs/reviews/repo-reset-audit/WRONG_ABSTRACTIONS.md
docs/reviews/repo-reset-audit/REPAIR_PLAN.md
```

### `STATE.md`

Living state and context-loss recovery file.

### `FULL_REPO_AUDIT.md`

Harsh current-state audit.

Must include:

- executive verdict;
- current architecture map;
- package-by-package findings;
- docs/plan consistency findings;
- TypeScript/code-quality findings;
- memory/governance findings;
- eval/promptfoo findings;
- CLI/operator-surface findings;
- exact file references;
- severity: critical, important, minor;
- what proves each finding;
- what would falsify each finding.

### `RAW_MATERIALS_LEDGER.md`

Maps both raw research files into source-to-decision entries.

Must explicitly say where current repo:

- already matches the research;
- partially matches it;
- contradicts it;
- over-implemented it;
- under-implemented it;
- misunderstood it.

### `WRONG_ABSTRACTIONS.md`

List every abstraction/layer/concept that may be wrong.

For each:

- name;
- files involved;
- why it exists;
- whether it should exist;
- whether it is product, infrastructure, test utility, or doc-only;
- whether it should be kept, renamed, narrowed, merged, or deleted;
- immediate risk if kept;
- migration/removal path.

This file must explicitly evaluate:

- `krn audit`;
- QG-04H;
- QG-06;
- AuditBundle;
- GoldenTask / Promptfoo;
- Observation;
- Reflection;
- MemoryCandidate;
- MemoryReviewGate;
- AntiMemory;
- Activation;
- SourceGraph;
- CLI commands as public operator surface.

### `REPAIR_PLAN.md`

Concrete reset plan.

This is not allowed to say "add more audit automation" as a default answer.

It must prioritize:

1. delete/reduce wrong abstractions;
2. rename misleading surfaces;
3. collapse duplicate or fake layers;
4. repair stale docs;
5. strengthen domain models where behavior is real;
6. only then continue feature slices.

For each repair task:

- objective;
- files likely touched;
- non-goals;
- exact verification;
- what not to build;
- commit message;
- rollback path;
- why this makes the final KRN product more true.

## Read-Only First

The first phase is read-only.

Do not edit implementation files until:

- every tracked architecture file has been inspected or explicitly marked
  irrelevant with reason;
- `FULL_REPO_AUDIT.md` exists;
- `WRONG_ABSTRACTIONS.md` exists;
- `RAW_MATERIALS_LEDGER.md` exists;
- the repair plan is written;
- the user approves moving from audit to repair.

Allowed before approval:

- create/update files under `docs/reviews/repo-reset-audit/`;
- update `STATE.md`;
- run read-only commands;
- run tests/typecheck for evidence.

Not allowed before approval:

- changing package source;
- changing DB schemas/migrations;
- changing CLI behavior;
- deleting code;
- renaming public surfaces;
- changing root `GOAL.md` or active `PLAN.md` except to add a pointer if the
  user explicitly asks.

## Commands To Run For Evidence

At minimum:

```sh
git status --short --branch
git log --oneline -20
git ls-files
pnpm typecheck
pnpm test
pnpm exec promptfoo --version
pnpm eval:promptfoo:smoke
git diff --check
```

If local DB is available:

```sh
pnpm db:ready
pnpm --filter @krn/db db:check
pnpm db:smoke
```

Do not claim runtime truth from docs.
Do not claim DB truth unless DB commands were run.
Do not claim repo health from green tests unless the tests actually cover the
requirement being discussed.

## Required Reading Discipline

For each file/package, record:

- what role it plays;
- whether the role is justified;
- whether it duplicates another role;
- whether it violates package boundaries;
- whether names imply more authority than implementation has;
- whether tests prove behavior or just shape;
- whether this should survive the reset.

The audit must not be polite.
The goal is to find bad assumptions early.

Use this standard:

```txt
If a layer exists mainly because it sounds responsible, and not because it
enforces a real product invariant, it is suspect.
```

## Completion Criteria

This goal is complete only when:

- `STATE.md` can resume the audit after context loss;
- `FULL_REPO_AUDIT.md` gives a complete current-state map;
- `RAW_MATERIALS_LEDGER.md` maps both raw research files through
  source-to-decision;
- `WRONG_ABSTRACTIONS.md` identifies wrong/suspect layers with keep/delete/
  rename/reduce decisions;
- `REPAIR_PLAN.md` gives a concrete ordered path to naprostować repo;
- the audit explicitly addresses the `krn audit` abstraction mistake;
- no implementation repair has been done before the audit is complete;
- the final answer states exactly what was read, what remains unread, and what
  the next safest action is.

Commit after the docs-only audit artifacts are complete:

```sh
git add GOAL_REPO_RESET_AUDIT.md docs/reviews/repo-reset-audit
git commit -m "docs(review): add full repo reset audit goal"
git push origin main
```
