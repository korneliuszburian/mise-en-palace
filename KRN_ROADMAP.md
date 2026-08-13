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
- how to verify whether the remembered knowledge helped.

For an ordinary task like "start a new frontend project", KRN should recall the
right template, package choices, UI conventions, testing standard, deployment
shape, known rejected shortcuts, and project-specific constraints. Plain Codex
will not remember this across projects. A folder of notes will not know which
note is current. A vector RAG can retrieve similar text but cannot decide that a
newer-but-wrong comment lost to an older consensus, or that a once-correct
standard expired.

KRN is being built to beat plain Codex plus notes plus grep on governance,
temporal correctness, rejected-path recall, source fidelity, abstention, and
task usefulness. A first matched three-case internal-alpha series shows one
bounded temporal-correctness win and two quality ties against plain Codex under
the combined KRN MCP-plus-skill treatment. Those authored cases initially used
more model tokens in every KRN arm. After removing duplicate DecisionPacket
text at the MCP boundary, one independently sourced historical repair produced
an equal-quality result (7:7) while the KRN arm used 12.51% fewer input tokens,
13.59% fewer cached-input tokens, 15.56% fewer output tokens, 27.34% fewer
reasoning-output tokens, and completed 21.99% faster in that run. A second
independently sourced historical repair from a different repository and failure
family produced a KRN quality win (7:6) with 37.85% fewer input and 39.11% fewer
cached-input tokens, but 3.59% more output, 51.08% more reasoning output, and
19.68% more wall time. A third independently sourced historical repair from a
third repository produced an 8:8 tie: both arms correctly gated unmapped Google
Ads metrics, while KRN used 49.51% more input, 53.57% more cached input, 15.09%
more output, 12.63% more reasoning output, and 43.76% more wall time. Across the
three independent tasks KRN has one quality win, two ties, and no losses, but no
repeatable efficiency advantage. This is bounded evidence that the combined KRN
capability is usable without observed quality regression on these tasks and can
improve a load-bearing boundary; it is not isolated MCP or skill causality,
arbitrary-repository portability, total-cost advantage, or broad superiority.
KRN does not need to win raw recall against a comprehensive notes dump.

## Product Shape

The operator-facing product is a governed decision packet (`DecisionPacket` in
`@krn/core`):

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
- one DB-backed DecisionPacket return loop with evidence, review, feedback, and
  explicit memory/source non-promotion boundaries;
- a minimal read-only `krn_decision_packet` MCP transport with one bounded
  target-repo consumer proof;
- one real mutating dogfood loop whose checksum-bound usefulness feedback
  changed the next DecisionPacket readback;
- retained paired-live evidence for three matched Codex tasks across async-job,
  temporal-policy, and weak-input failure families;
- one preregistered, independently sourced historical `krn-search` repair in
  which plain Codex and KRN both scored 7:7 while KRN used fewer observed
  tokens and less wall time;
- one preregistered, independently sourced historical `krn-llm-wiki` CLI input
  repair in which KRN won 7:6 with lower input usage but higher output,
  reasoning, and wall time;
- one preregistered, independently sourced historical `seo` performance-
  authority repair in which both arms scored 8:8 and KRN used more tokens and
  wall time while structurally consuming current and rejected authority;
- one post-trial ordinary `krn-seo` working-tree review dogfood in which an
  initial false target-fit match on the generic token `real` was reproduced and
  repaired; the subsequent checksum-bound packet correctly abstained without a
  governing decision, and repository authority—not KRN context—produced two
  review findings while five included memories were recorded as noise;
- deterministic behavior gates and DB smokes;
- Beads task graph for durable implementation planning.

Not product-ready:

- no dashboard/API or broad MCP product surface beyond the minimal read-only
  `krn_decision_packet` wrapper;
- no external operator/product proof beyond bounded target-repo harnesses;
- no broad quality-advantage claim: the authored matched series produced one
  KRN quality win and two ties, while the three independently sourced tasks
  produced one KRN win and two ties with mixed cost signals;
- no broad benchmark suite;
- no autonomous maintenance daemon or scheduler;
- no large-scale ingest pipeline;
- no complete temporal consensus engine;
- no markdown-backed runtime memory.

The next phase is not a UI or executor phase. It is repeated use on ordinary
engineering tasks: strengthen task-standard activation and temporal consensus
where observed failures demand it, then replicate the independently sourced
quality and efficiency measurements without growing a benchmark platform. The
first retained independent result is paired-live evidence
`393cf6af-80cf-482a-bb57-d7c413a1cd27`, bound to DecisionPacket checksum
`ea9bb76b10db7d6f6698d12344804124e1bffd0cb875eefd16598b5798a70014`
and immutable artifact SHA-256
`4ccbd05d065d2efdeeaccd0162d704cd0fbbeb2f676b9706eec1278ee8ae9f60`.
Two earlier attempts were excluded before scoring because their invocation or
timeout contract prevented a comparable completed pair. The second retained
independent result is paired-live evidence
`6123c8d4-fe4b-4c94-864b-05d8b9386b9e`, bound to DecisionPacket checksum
`9bec2232834066129759ba73d359d484ad0cf4c67afb54298bfe5cace65bf4ac`
and immutable artifact SHA-256
`4b64a39ef6c12a5023ae53d0cd2effdb426ff834afe899b064e185513f43e463`.
Its first attempt was excluded because the KRN arm timed out before a usage
event. The third retained independent result is paired-live evidence
`3f2c44f3-0fb7-4ee6-ae86-8fdaf90fc95b`, bound to DecisionPacket checksum
`c6a447fa1568670ea7f6897dab2b3eb2cd1a0e28e5037db6a76d4eea31952732`
and immutable artifact SHA-256
`cee2d93f6b272020f4fa74251c41da3ca54448e355d51dcf54ad3eaf4b505ac0`.
All three valid attempts were read back after persistence and their retained
fixtures were removed through guarded cleanup with zero owned rows remaining
and unrelated project counts unchanged. The second cleanup also exposed and
falsified an incomplete project-owned retrieval deletion, repaired at the
production cleanup seam. This provenance makes the three results auditable; it
does not turn three stochastic tasks into a causal or general advantage claim.
The first post-trial ordinary-work dogfood is execution run
`6cc50181-009a-44b3-bf94-8e017ca0eb9d`, bound to DecisionPacket checksum
`a488d8590f33e2e9b90cd78508e26f440daf4acfbbae6c2b900be16e824a56ad`
and evidence bundle `5f622125-52c3-407e-beee-6f1af33b7be0`. It proves that the
feedback loop exposed a real selection defect and that the repaired packet
abstained; it does not prove KRN improved the substantive review, target-project
resolution was correct, or context overhead is acceptable.
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
knowledge decision needs a current consumer, validity boundary, source/evidence
refs, and a falsifier in the store-backed memory path.

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

They are not the target memory substrate.

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

Every retained source, knowledge decision, standard, or architecture rule must map through:

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
- "This database migration procedure was rejected because rollback was unsafe."
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

`DecisionPacket` is the product control surface. `DecisionPacketReadModel` is
the operator readback for persisted run, evidence, review, feedback, activation,
and proof/non-proof state. The read model can be larger than the packet because
it explains what happened; it must not become a second authority model.

### 6. Feedback, Maintenance, And Dreaming

Execution evidence records whether the selected memory helped:

- did Codex use the selected standard;
- did the standard prevent a known mistake;
- did it cause churn;
- did tests prove the intended behavior;
- did review reject the memory as stale or wrong;
- did a better knowledge decision appear;
- did the task reveal a gap.

Maintenance/dreaming is maintenance, not magic. It proposes:

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
- existing local knowledge and procedures;
- risky boundaries;
- previous similar tasks;
- failed shortcuts;
- minimal verification commands;
- dirty-state constraints.

The packet should prevent Codex from inventing knowledge that conflicts with the
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
and whether the selected knowledge helped. It should also detect if the old packet is
stale because dependencies, project goals, or coding standards changed.

## Data Model Direction

The target memory model should be store-backed and compact:

- evidence items: raw cited spans and command/review artifacts;
- claims: canonical remembered statements with lifecycle and validity;
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
- external reviewer findings checked against local code and verification before
  they affect implementation;
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

Reusable engineering procedure belongs to the private global skill system:
implementation with proportional proof and TypeScript boundaries, diagnosis,
code review, codebase design, domain modeling, source-to-decision mapping,
target-repo work, skill authoring, and explicit advisory review.

This repository keeps only two local extensions:

- `beads` for the tracker substrate and durable planning modes;
- `krn-memory-core` for `DecisionPacket`, activation, temporal source/memory
  authority, persistence, evidence/feedback, Codex rendering, and owner-file
  read-model invariants.

The domain extension composes with the selected global workflow; it does not
copy maker, reviewer, diagnosis, TypeScript, source-intake, or target-repo
procedure. Skill vocabulary must not leak into runtime contracts unless the
product implements it.

## Artifact Contract

KRN artifacts exist only when they make the loop more predictable. A useful
artifact names the trigger, the bounded context to inspect, the workflow, the
output, the stop condition, the verification, and the proof/non-proof boundary.
This applies to skills, Beads issues, source decisions, rare ADR-like decision
records, and onboarding surfaces.

The canonical skill shape is:

```txt
name -> description -> trigger -> steps -> output -> stop_condition -> verification -> forbidden
```

In `SKILL.md`, `name` and `description` live in YAML frontmatter. The body uses
`Trigger`, `Steps`, `Output`, `Stop Condition`, `Verification`, and `Forbidden`
where they change behavior. A skill can omit an optional section when the
contract is obvious, but it must still have checkable steps, stop condition, and
verification path. Keep detailed branches behind progressive disclosure when
they would bloat `SKILL.md`.

External methods, including practitioner workflows, public course material, and
loop-engineering articles, must enter KRN through source-to-decision:

```txt
source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier
```

Adopt the mechanism only when it has a current KRN consumer. For current skill
work, the adopted mechanisms are small composable skills, TypeScript/static
feedback, red-green behavior falsifiers, vertical tracer-bullet task slices,
maker/checker separation, durable task state, worktree/PR isolation for larger
or quality-critical slices when the operator wants it, and explicit stop
conditions. This does not prove those external sources are product authority.

Skill operating artifacts are allowed when they make repeated agent work more
predictable. `CONTEXT.md` owns shared vocabulary, `CONVENTIONS.md` owns skill
and artifact rules, and `docs/adr/` owns rare hard-to-reverse decisions. These
files must stay compact and must not become runtime memory, task state,
scratchpads, or a substitute for implemented behavior.

ADR-like records remain rare. Prefer Beads for task state, source decisions for
evidence-backed knowledge, store-backed memory/source/eval candidates for
runtime learning, and `KRN_ROADMAP.md` for compact product and architecture
direction. Create a separate ADR only when the decision is hard to reverse,
surprising without context, has a current owner, has a consumer, and has a
falsifier.

## External Review Rule

External review is optional advisory evidence, not an implementation gate:

- use it only when the slice is large enough that independent critique is worth
  the cost;
- ask reviewers to falsify "done" and require evidence refs;
- reject factual claims that conflict with current code, live smoke output, or
  other local verification;
- triage findings as accept-and-fix, counterargue-with-evidence, follow-up Bead,
  or human decision;
- do not use it as a replacement for local verification.

For large strategy reviews, the prompt should request proposed Beads with
dependencies, acceptance criteria, and non-goals. The output should update the
task graph, not create another prose forest.

The old Claude-based repo skill remains removed after local reviewer output
hallucinated basic repository facts. The explicit global
`second-opinion-review` skill may now provide advisory evidence because it runs
tool-free from isolated context and binds findings to current local line hashes.
It is still invalid when factual claims fail deterministic local validation.

## Milestone Roadmap

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

Status: complete for the internal-alpha boundary; retain and extend only when a
new product claim needs a distinct falsifier.

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

Status: complete for the internal-alpha boundary. A real mutating dogfood task
returned checksum-bound usefulness, and the latest feedback changed subsequent
selection/readback without promoting truth by side effect.

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
- KRN can explain why knowledge was demoted or retained.

### Phase 4: Task-Standard Activation

Status: partially proven. The bounded public loop works and temporal context
changed one held-out result; repeatability across ordinary repositories remains
the next product risk.

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

Goal: add maintenance/dreaming only after the local loop proves useful.

Work:

1. Keep maintenance execution explicit and per-record.
2. Persist queue records with deterministic queue keys, claim/settle/retry/
   dead-letter lifecycle, and write-boundary readbacks.
3. Check handler-declared writes against job memory boundaries before handler
   execution.
4. Maintenance proposes memory/source candidates; it does not silently promote
   truth.
5. Reject daemon, scheduler, and always-on dreaming language until a runtime
   consumer and falsifier justify them.

Done when:

- runtime authority matches naming;
- maintenance jobs have real consumers;
- no package pretends to enforce a boundary it only describes;
- crashes, stuck running records, and scheduler recovery are not implied unless
  a dedicated executor recovery path proves them.

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

Chosen first surface:

- headless CLI request/response commands for agent use;
- minimal MCP wrapper only as read-only transport over the CLI
  `DecisionPacket` contract;
- no dashboard or broad API until an external operator needs it.

Reason: the first real consumer is a headless coding agent asking for a
DecisionPacket and returning evidence/feedback. CLI keeps the contract local,
scriptable, and testable; the current MCP wrapper proves transport only and must
not make the adapter or dashboard the product core.

Current boundary: `mcp:decision-packet` is the bounded KRN MCP product wrapper
over the CLI `DecisionPacket` contract and governed memory repository seams. The
surface exposes exactly `krn_decision_packet`, `recall`, `brief`, `remember`,
and `feedback`. `remember` remains a SQLite-only candidate proposal; `feedback`
is a SQLite-only packet-bound usefulness write. The surface must not add ranking
policy, execute Codex, perform unconstrained capture, or promote memory/source
truth.

Current proof: a bounded target-repo harness can fetch `krn_decision_packet`,
execute a fixture command, and return evidence/review/feedback through explicit
channels with packet checksum binding. This proves the minimal consumer loop; it
does not prove broad MCP product readiness.

MCP product boundary decision (superseded by ADR 0007):

- Product tool name: `krn_decision_packet`.
- Transport role: MCP wraps the proven CLI `DecisionPacket` contract; it does
  not define selection policy.
- Initial input: `{ runId: string }` for an already persisted KRN run.
- Initial output: the existing structured packet, packet checksum/evidence ref,
  proof/non-proof boundary, and explicit evidence/feedback return channels.
- Initial resources: none. A `krn://runs/{runId}/decision-packet` resource is
  deferred until a real consumer needs resource-style reads.
- Auth and mutation boundary: `krn_decision_packet`, `recall`, and `brief` are
  read-only and idempotent; `remember` is an owner-local SQLite-only candidate
  proposal and never creates a MemoryRecord or promotes source truth; `feedback`
  is an idempotent SQLite-only write requiring a real run, issued packet
  checksum, and packet selection of the target record. `hurt` and `stale` also
  require a note.
- Server instructions: concise, self-contained, and focused on "fetch the
  packet, follow its return channels, do not treat MCP as authority."
- The explicit abstention scorer now exists in code, so this scoped lifecycle
  surface is authorized. Broader ranking policy, unconstrained capture, and
  PostgreSQL writes remain separately governed.

Rejected alternatives:

- MCP executes Codex: rejected. Codex executes; KRN supplies governed context.
- MCP writes memory/source truth directly: rejected. Feedback remains explicit
  and goes through existing review gates.
- Resource forest for every read model: rejected. It recreates the old context
  swamp as transport API.
- Treating the MCP tool name as the product name: rejected. The product concept
  is the `DecisionPacket`; MCP exposes `krn_decision_packet` only as transport.

## Current Tranche Status

The useful-kernel-before-surface tranche has a usable internal-alpha loop, but
remains below product proof:

1. The notes-baseline DecisionPacket falsifier is hardened with explicit
   abstention coverage.
2. Store-backed usefulness feedback can change later activation and
   DecisionPacket selection.
3. Task-standard activation has internal behavior coverage for frontend,
   backend, and package coding tasks with current standards, rejected paths, and
   verification commands.
4. The independent matched harness runs baseline and KRN arms in isolated
   target workspaces without importing product internals.
5. Broader MCP/API/dashboard expansion is rejected for now; the only product
   transport is the read-only `krn_decision_packet` wrapper.

The first retained matched live series adds bounded outcome evidence:

- async-job: tie, `7:7`;
- temporal-policy with the current source hidden from the target repo: KRN win,
  `7:6`;
- weak JSON/input boundary: tie, `3:3`.

All three used the same pinned model, Codex profile, sandbox policy, and
checker revision. The baseline had no KRN capabilities; each KRN arm produced
structured MCP and skill-use events plus observed decision application. One
earlier async-job attempt was invalid because the fixture lacked a runnable
local TypeScript compiler and is excluded from quality results. The valid
artifacts were persisted before guarded fixture cleanup.

This proves a useful internal-alpha kernel loop and one bounded combined-
capability temporal-quality advantage. It does not prove repeatable advantage,
isolated MCP-versus-skill causality, token efficiency, commercial validation,
arbitrary-repository portability, broad Codex obedience, or complete temporal
consensus. KRN consumed more model tokens in every valid case.

The current P1 hardening direction is ordinary-task replication and Phase 5
cleanup:

1. Keep source and temporal consensus aligned with activation: accepted, stale,
   superseded, rejected, and unsupported claims must affect packets exactly as
   the roadmap says.
2. Replicate the temporal-quality result on independently sourced ordinary
   tasks and treat higher token use as a product cost to reduce, not hide.
3. Keep feedback-driven demotion, supersession, and rejection in store-backed
   memory/source maintenance paths, with no direct truth mutation.
4. Keep maintenance runtime truth explicit: per-record executor yes; daemon,
   scheduler, and autonomous promotion no.
5. Close corpus/documentation slop by converting useful source-to-decision rows
   into store/eval inputs and deleting decorative files.
6. Reconsider broader MCP/API only when a real consumer needs more than the
   current read-only packet fetch.

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
