# KRN Roadmap

KRN is a temporal Memory Core for engineering agents.

Codex edits code. KRN decides which remembered context is relevant, current,
trusted, rejected, stale, or unknown; renders a bounded decision packet for
Codex; observes the result; and updates the memory system without turning the
repo into a markdown archive.

This file is the canonical product and architecture roadmap. Root execution
docs can exist while useful, but they are not the brain. Durable runtime memory
belongs in the store.

## North Star

The target is not "better notes" and not a bigger RAG window. The target is a
living engineering memory that can answer, for the current task:

- what standards apply here;
- why they apply;
- when they became true;
- what superseded them;
- what failed before and should not be repeated;
- which evidence supports the answer;
- where the evidence is weak, contested, stale, or missing;
- what Codex should do now;
- how to verify whether the remembered pattern helped.

For an ordinary task like "start a new frontend project", KRN should recall the
right template, package choices, UI conventions, testing standard, deployment
shape, known rejected shortcuts, and project-specific constraints. Plain Codex
will not remember this across projects. A folder of notes will not know which
note is current. A vector RAG can retrieve similar text but cannot decide that a
newer-but-wrong comment lost to an older consensus, or that a once-correct
standard expired.

KRN is being built to beat plain Codex plus notes plus grep on governance,
temporal correctness, rejected-path recall, source fidelity, abstention, and
task usefulness. That is not proven yet. The near-term work is to build the
mechanisms and falsifiers that can measure it honestly. KRN does not need to
win raw recall against a comprehensive notes dump.

## Product Shape

The operator-facing product is a governed decision packet:

```txt
operator intent
  -> task contract
  -> task and repo recognition
  -> temporal memory/source activation
  -> conflict and authority filtering
  -> bounded Codex brief
  -> implementation
  -> evidence capture
  -> review and usefulness feedback
  -> memory/source/eval candidates
  -> governed promotion, demotion, rejection, or abstention
  -> next run reuses or rejects the knowledge
```

A decision packet is useful only if it changes Codex behavior in a verifiable
way. It should not merely summarize everything the system knows. It should tell
Codex what to do, what not to do, why, and how to prove the result.
The review and feedback step is intentionally tied to usefulness, not ceremony.

## Current Boundary

Current label: controlled internal alpha for technical operators.

Built enough to keep:

- strict TypeScript package spine;
- source and memory activation;
- DB-backed source, memory, evidence, review, retrieval, and feedback paths;
- Codex brief rendering;
- deterministic behavior gates and DB smokes;
- governed second-opinion review through `.agents/skills/second-opinion-claude`;
- Beads task graph for durable implementation planning.

Not product-ready:

- no dashboard/API/MCP product surface;
- no external operator proof;
- no broad benchmark suite;
- no autonomous worker daemon or scheduler;
- no large-scale ingest pipeline;
- no final temporal consensus engine;
- no markdown-backed runtime memory.

The next phase is not a UI phase. It is the phase where KRN builds enough
MemoryCoordinator, decision-packet, feedback, and temporal-consensus machinery
to run honest comparisons against Codex plus notes plus grep.
The existing DB-backed source/memory/evidence/review paths are the minimum
store-backed proof surface; retrieval and feedback must strengthen that surface,
not become a second authority model.

## Kernel Law

Do not build more context. Build the machinery that selects, applies, verifies,
and forgets context.

Corollaries:

- Markdown is not runtime memory.
- context is a liability until selected for a task;
- raw evidence is not promoted knowledge;
- newest source is not automatically true;
- accepted memory must remain falsifiable;
- rejected paths are first-class memory;
- abstention is better than fabricated authority;
- markdown may document the system but must not become the runtime memory
  substrate.

## Durable Memory Rule

Not every thought becomes memory, and durable memory does not mean a file in the
repo.

Scratch reasoning, exploratory research, and failed hunches disappear unless
they change a decision or create a falsifiable follow-up. A promoted standard or
pattern needs a current consumer, validity boundary, source/evidence refs, and a
falsifier in the store-backed memory path.

Large source corpora stay as raw evidence outside active context. The brain
stores spans, claims, relations, decisions, temporal state, and usefulness
events. It does not copy every post, mail, log, or proof into repo markdown.

Repo JSON and markdown are allowed only as:

- compact human-facing docs;
- bootstrap seeds;
- test fixtures;
- source artifacts;
- handoffs;
- temporary migration aids.

They are not the final memory substrate.

## Authority Surfaces

Active authority should be small:

- `AGENTS.md` for agent operating rules.
- `KRN_ROADMAP.md`: product direction and architecture roadmap.
- Beads for durable task graph, dependencies, blockers, and follow-up work.
- Repo-local skills: repeated execution workflows.
- DB/corpus/eval read models for brain memory.
- Store-backed read models for runtime memory, source, retrieval, feedback, and
  evaluation state.
- Compact handoffs: temporary transfer material when another agent needs context.

Root `GOAL.md`, `PLAN.md`, and `PLANS.md` are not active authority surfaces. Do
not recreate them as compatibility shims. Active task state lives in Beads;
product and architecture direction lives here.

Docs folders are not the brain. Any remaining docs dependency must be either a
real source artifact, a real fixture, a compact operator surface, or a migration
target scheduled for deletion.

## Decision Rule

Every retained source, pattern, standard, or architecture rule must map through:

```txt
source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier
```

Definitions:

- source: the paper, repo evidence, operator rule, code behavior, command output,
  or review that introduced the claim;
- mechanism: why this source changes the system, not just what it says;
- KRN implication: what changes in memory, retrieval, activation, eval, or brief
  rendering;
- decision/rejection: the accepted path or rejected path;
- consumer: the runtime path that uses the decision;
- falsifier: the test, smoke, eval, review condition, or observed failure that
  would force demotion or rejection.

If the chain is missing, do not promote the knowledge. Keep it as a bounded
source artifact, reject it, or file a Beads task to prove it.

## Target Architecture

The brain has six durable layers.

### 1. Raw Evidence Ground Truth

Raw evidence is the immutable-enough base layer:

- code refs;
- diffs;
- command outputs;
- review verdicts;
- external source spans;
- target-repo observations;
- user/operator instructions;
- source artifacts;
- task outcomes;
- usefulness feedback.

Raw evidence is citable but not authoritative by itself. A single retrieved
post, stale doc, or confident review does not become a standard until promoted
through a decision path.

Raw evidence can be large. It may live in a database, object store, external
corpus, repo fixture, or source system. KRN stores enough identity, span,
timestamp, checksum, owner, and retrieval metadata to cite it without stuffing
the active repo with files.

### 2. Temporal Claims

Temporal claims are the unit of remembered knowledge:

- memory records;
- source claims;
- project standards;
- repo facts;
- skill rules;
- boilerplate choices;
- rejected shortcuts;
- task conventions;
- evaluation expectations.

Each claim needs:

- observed time;
- validity window or unknown validity;
- owner/source trust;
- review status;
- promotion/rejection path;
- supersession links;
- support/conflict evidence;
- target scope;
- consumer path;
- falsifier.

The system must preserve history. A claim can be true in 2024, false in 2026,
and still useful for explaining why older code or decisions look the way they
do.

### 3. Typed Relation Graph

Claims and entities connect through typed edges:

- implements;
- supersedes;
- conflicts_with;
- rejects;
- supports;
- derived_from;
- used_for;
- compatible_with;
- belongs_to_repo;
- applies_to_project_kind;
- owned_by;
- verified_by;
- failed_in;
- refreshed_by.

The relation graph is not decorative GraphRAG. It is navigation and precision:
when a task mentions a repo, stack, package, UI surface, migration, target
runtime, or coding standard, edges help activate the right current claims and
the right rejected paths.

Edges are evidence-weighted and reviewable. Edge status matters. Candidate edges
are not authority. Rejected edges are useful because they prevent repeated bad
reasoning.

### 4. Consensus And Conflict

The brain must distinguish:

- accepted;
- contested;
- stale;
- superseded;
- rejected;
- unknown.

Consensus is not majority text retrieval. It is a readback of support,
conflict, authority, recency, owner expertise, task scope, and observed outcome.

For engineering work, consensus examples include:

- "This frontend template is current for new SaaS tools."
- "This database migration pattern was rejected because rollback was unsafe."
- "This test style is accepted for CLI command tests but not runtime source."
- "This package was removed; do not reintroduce it without new evidence."
- "This naming convention is preferred, but exceptions exist for public API
  compatibility."

Conflict is first-class. If KRN cannot resolve a conflict, it should render an
abstention or evidence gap, not a confident instruction.

### 5. Activation And Decision Packets

Activation selects a bounded set of memory/source/retrieval candidates for the
current task. It must consider:

- task kind;
- target repo;
- project kind;
- stack;
- file ownership;
- source trust;
- claim lifecycle;
- temporal validity;
- conflict signals;
- previous usefulness;
- rejected paths;
- token budget.

The resulting decision packet should contain:

- current applicable standards;
- source-backed decisions;
- rejected paths;
- stale or superseded warnings;
- verification expectations;
- relevant skills;
- non-goals;
- proof and non-proof boundaries.

It must not become a dump of everything relevant. The packet is a control
surface for Codex.

### 6. Feedback, Heartbeat, And Dreaming

Execution evidence records whether the selected memory helped:

- did Codex use the selected standard;
- did the standard prevent a known mistake;
- did it cause churn;
- did tests prove the intended behavior;
- did review reject the memory as stale or wrong;
- did a new better pattern appear;
- did the task reveal a gap.

Heartbeat/dreaming is maintenance, not magic. It proposes:

- demotion;
- merge;
- refresh;
- deletion;
- supersession;
- promotion;
- follow-up eval;
- source re-review.

It does not mutate durable truth without review. No background process should
silently promote speculative knowledge.

## Normal Engineering Use Cases

### New Project Setup

Input: "Create a new frontend app for this product."

KRN should activate:

- approved project template;
- package manager and workspace convention;
- UI framework and design constraints;
- test strategy;
- lint/typecheck expectations;
- deployment assumptions;
- accessibility rules;
- rejected boilerplates and why they were rejected;
- examples from previous successful repos.

The packet should not say "use our usual setup" without evidence. It should cite
the current standard and mention stale alternatives.

### Existing Repo Change

Input: "Add feature X in target repo Y."

KRN should activate:

- repo map;
- owner files;
- existing local patterns;
- risky boundaries;
- previous similar tasks;
- failed shortcuts;
- minimal verification commands;
- dirty-state constraints.

The packet should prevent Codex from inventing a pattern that conflicts with the
repo.

### Architecture Decision

Input: "Should we add a worker daemon?"

KRN should activate:

- current product boundary;
- prior rejected daemon work;
- runtime authority requirements;
- proof gaps;
- cost of maintaining extra surface;
- source decisions that justify or reject the move.

If the daemon has no current consumer, KRN should recommend rejection or
deferral.

### Research Intake

Input: "Read this paper/repo/thread and update our standards if useful."

KRN should not ingest the source as truth. It should create source claims with
mechanisms, KRN implications, candidate decisions, and falsifiers. Only claims
with a consumer and proof path graduate into standards.

### Cross-Task Memory

Input: "We are doing another task like the one last week."

KRN should recall the prior decision packet, evidence outcome, review feedback,
and whether the pattern helped. It should also detect if the old packet is
stale because dependencies, project goals, or coding standards changed.

## Data Model Direction

The final memory model should be store-backed and compact:

- evidence items: raw cited spans and command/review artifacts;
- claims: normalized remembered statements with lifecycle and validity;
- decisions: accepted or rejected governance outcomes;
- relations: typed edges between entities, claims, standards, repos, and tasks;
- activations: what was selected for a task and why;
- applications: what Codex was instructed to use;
- feedback events: whether the selection helped, hurt, was unused, or was stale;
- eval cases: controlled tasks proving usefulness against baselines.

Repo files may seed or test these paths, but the system should not depend on
hundreds of markdown files to know itself.

## Evaluation Contract

Recall is not enough. The brain must be evaluated against plain Codex plus notes
plus grep on:

- evidence fidelity: cited source spans actually support the claim;
- temporal correctness: stale decisions are downgraded or superseded;
- consensus correctness: support and conflict are represented honestly;
- rejection recall: known bad paths are remembered before Codex repeats them;
- abstention: the system says "not established" instead of inventing authority;
- task usefulness: selected standards change Codex behavior in a useful,
  verifiable way.

The first make-or-break eval scaffold is a notes-baseline decision-packet test:

```txt
same task
  -> baseline Codex with notes/grep
  -> KRN decision packet
  -> compare whether the current KRN mechanism avoids stale/rejected paths and
     selects current standards
```

The benchmark should not reward confident hallucination. A cautious packet that
abstains correctly should beat a confident answer that cites irrelevant or stale
evidence.

## Quality Bar

Every implementation slice should satisfy:

- minimal mechanism that solves the current product problem;
- no speculative subsystem without a runtime consumer;
- strict TypeScript boundaries;
- unknown at IO boundaries until validated;
- no `any` as a shortcut;
- no broad docs/prose tests masquerading as behavior tests;
- no retained markdown ledger unless it is a compact operator surface;
- second-opinion review after larger refactors or authority-boundary changes;
- Beads issue graph updated with follow-up work instead of TODO files.

If a change adds more surface than it removes, it must justify the new consumer.

## Cleanup Direction

The repo should become smaller and sharper:

- delete historical docs instead of archiving them when they no longer serve a
  current consumer;
- remove empty folders;
- collapse duplicate root execution docs;
- replace docs-as-contract tests with code, DB, corpus, or eval contracts;
- delete or demote prompt/prose surfaces that do not change behavior;
- keep skills only when they encode repeatable operating behavior;
- move durable feedback out of JSON/markdown and into store-backed events;
- keep `KRN_ROADMAP.md` as the product/architecture map, not as a session log.

The goal is not minimal file count for its own sake. The goal is that every
remaining file has a reason a senior engineer would accept.

## Naming Direction

Names should describe role and lifecycle, not temporary editing state.

Avoid vague names like:

- final;
- new;
- normalized;
- enhanced;
- manager;
- helper;
- processor;
- service;
- engine;
- v2;
- current.

Use names that expose the domain role:

- `DecisionPacket`;
- `TemporalClaim`;
- `SourceDecision`;
- `RejectedPath`;
- `ActivationTrace`;
- `UsefulnessFeedback`;
- `ProjectStandard`;
- `EvidenceSpan`;
- `ConsensusReadback`;
- `StaleDecision`.

Existing vague names should be cleaned only through bounded slices with tests.
Do not launch cosmetic rename storms that hide behavior changes.

## Skills Direction

Skills are not runtime memory. They are operational tools for agents.

Keep a skill if it:

- encodes a repeatable workflow;
- reduces operator coordination;
- prevents known mistakes;
- has a current user;
- can be validated or smoke-tested;
- does not pretend to be product architecture.

Delete or rewrite a skill if it only contains motivational prose, stale project
state, decorative vocabulary, or instructions better expressed in `AGENTS.md`.

The target is a small set of sharp skills:

- Beads workflow;
- second-opinion Claude review;
- source-to-decision mapping;
- evidence review;
- activation/context work;
- type-safety;
- target-repo testing;
- handoff only if real handoffs continue to exist.

Skills for building the kernel may stay if they encode real project discipline,
but their vocabulary must not leak into runtime contracts unless implemented.

## Second-Opinion Rule

Claude review is advisory but governed:

- run it after larger implementation, cleanup, authority, roadmap, or eval
  slices;
- ask it to falsify "done";
- require evidence refs;
- validate the verdict JSON;
- bind the review to the current diff;
- triage findings as accept-and-fix, counterargue-with-evidence, follow-up Bead,
  or human decision;
- do not use it as a replacement for local verification.

For large strategy reviews, the prompt should request proposed Beads with
dependencies, acceptance criteria, and non-goals. The output should update the
task graph, not create another prose forest.

## Near-Term Roadmap

### Phase 1: Clean Authority Surface

Goal: make the repo understandable.

Work:

1. Collapse remaining roadmap authority into this file, Beads, skills, and
   store-backed read models.
2. Delete or merge root execution docs that duplicate roadmap state.
3. Remove historical docs and empty folders that are not active source
   artifacts, fixtures, or runbooks.
4. Replace docs-as-contract tests with behavior, DB, corpus, or eval contracts.
5. Keep only compact handoff/runbook material that has a current consumer.

Done when:

- a new agent can read `AGENTS.md`, `KRN_ROADMAP.md`, Beads, and relevant skills
  without crawling historical docs;
- docs count is low enough that every remaining file has a named consumer;
- no active test depends on stale markdown prose as product truth.

### Phase 2: Decision-Packet Falsifier

Goal: create the first Global Workspace falsifier that can later prove or
disprove whether KRN beats notes plus grep on engineering tasks.

Work:

1. Build notes-baseline eval runner.
2. Use tasks where plain recall is insufficient: stale standards, rejected
   paths, conflicting evidence, project-specific conventions, and abstention.
3. Score evidence fidelity, temporal correctness, rejection recall,
   consensus/conflict readback, abstention, and task usefulness.
4. Record failures as memory/eval candidates, not prose outcomes.

Done when:

- the eval can fail KRN for stale or unsupported advice;
- the scaffold exposes at least one meaningful task where governed current
  context should beat more context, without claiming broad product victory;
- the result is reproducible without human vibes.

### Phase 3: Store-Backed Feedback Loop

Goal: stop using JSON/markdown ledgers for memory evolution.

Work:

1. Move usefulness feedback into store-backed events.
2. Record whether activated standards helped, hurt, were ignored, or became
   stale.
3. Add readbacks for memory demotion, supersession, and rejection.
4. Keep fixtures tiny and representative.

Done when:

- a useful or harmful activation changes the next run through the store path;
- repo files are not the durable feedback database;
- KRN can explain why a pattern was demoted or retained.

### Phase 4: Task-Standard Activation

Goal: make KRN useful for normal coding work.

Work:

1. Classify project/task kind.
2. Activate current standards by stack, repo, file area, and task type.
3. Include rejected paths and stale warnings.
4. Render a small Codex brief with verification commands and non-goals.
5. Capture whether Codex followed the packet and whether it helped.

Done when:

- a new frontend/backend/package task gets the right current standards without
  the operator restating them;
- KRN prevents at least one repeated mistake;
- selected context is smaller and better than a notes dump.

### Phase 5: Temporal Consensus And Graph

Goal: make accepted knowledge explainable over time.

Work:

1. Promote typed relation edges only when supported.
2. Track supersession and conflict.
3. Distinguish raw metadata refs from validated decision support.
4. Build consensus readbacks that show support, dissent, and missing evidence.
5. Add staleness and recency behavior that does not blindly prefer newest text.

Done when:

- KRN can answer why a standard changed, when it changed, and what evidence
  caused it;
- accepted claims without decision support are visibly caveated;
- rejected and superseded claims remain useful as history, not active authority.

### Phase 6: Maintenance Runtime

Goal: add heartbeat/dreaming only after the local loop proves useful.

Work:

1. Decide whether workers are real executors or contract/readback helpers.
2. If real, build the smallest scheduler/executor that consults authority
   tables and records idempotent outcomes.
3. If not real, downscope names and docs honestly.
4. Maintenance proposes memory changes; it does not silently promote truth.

Done when:

- runtime authority matches naming;
- maintenance jobs have real consumers;
- no package pretends to enforce a boundary it only describes.

### Phase 7: External Product Surface

Goal: expose the brain only after the kernel wins locally.

Possible surfaces:

- CLI product commands;
- MCP;
- API;
- dashboard;
- target-repo integration;
- research ingestion.

Do not start this phase until decision packets and feedback loops prove useful
inside this repo.

## Current P1 Queue

The current P1 direction is:

1. Finish this roadmap slice and keep it as the architecture source.
2. Collapse remaining roadmap authority and docs dependencies.
3. Build the notes-baseline decision-packet eval.
4. Move usefulness feedback to store-backed events.
5. Prove second-repo dry run.
6. Revisit workers only after deciding whether they execute or only preview.

Beads is the durable source for exact issue IDs, dependencies, and status.

## Non-Goals

Do not build next:

- dashboard-first product;
- broad benchmark lab before the first falsifier;
- generic multi-agent framework;
- autonomous daemon without an authority model;
- file-backed runtime memory;
- markdown archive of every decision;
- skill zoo that substitutes for implemented behavior;
- cosmetic rename storm;
- schema/table expansion without a reader and writer;
- product claims not backed by eval or DB behavior.

## Definition Of A Useful Brain

KRN is useful when, on real engineering tasks, it consistently:

- selects the right current standards without being reminded;
- cites evidence that actually supports its advice;
- remembers rejected paths before Codex repeats them;
- handles time and supersession;
- surfaces conflict instead of hiding it;
- abstains when memory is insufficient;
- makes Codex produce better code with less prompt babysitting;
- learns from feedback through the store, not through a growing pile of docs.

That is the destination. Everything else is scaffolding and should be deleted,
downscoped, or justified by a direct path to that outcome.
