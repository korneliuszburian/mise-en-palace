# PLAN.md — KRN M22–M26 Brain Spine Long Run

Repository root:

`/home/krn/coding/krn/active/mise-en-palace`

## Purpose

Execute a restartable long-running KRN implementation run from M22 through M26.

This plan continues after:

- M20: local Postgres/pgvector/migration/runtime proof;
- M21: first persisted harness run spine.

The operator is away. Work must proceed safely, slice by slice, with compact progress records, verified commits, and a final handoff.

Do not optimize for maximum task count.

Optimize for:

- trustworthy repo state;
- final-pattern architecture;
- clean commits;
- type safety;
- no hidden scope expansion;
- no dashboard/API/MCP/server/worker overreach;
- no memory/source/eval theater;
- no review hell for the operator.

A smaller verified spine is better than a larger unreviewable implementation.

---

# 0. Current Known State

M20 is complete.

Verified:

- local `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn`;
- `pnpm db:ready` passed;
- migrations proven, 3/3;
- pgvector available;
- `pnpm db:smoke` passed insert/read/cleanup through Drizzle repository;
- `krn doctor` reports DB readiness accurately.

M21 is complete.

Verified:

- clean `main...origin/main`;
- `pnpm typecheck` passed;
- `pnpm test` passed;
- no-env and live `krn doctor` passed;
- live `pnpm db:ready` passed;
- live `pnpm db:smoke` passed;
- live `pnpm db:smoke:harness-plan` passed;
- live `pnpm db:smoke:harness-evidence` passed;
- smoke cleanup SQL counts were `0,0,0`;
- forbidden dirs/deps/core leak/no-any scans were clean;
- `git diff --check` passed.

Known next safest action:

M22 — SourceClaim persistence + source-to-decision edges.

---

# 1. Strategic Architecture Reminder

KRN is not memory for Codex.

KRN is a Postgres-backed AI Engineering Harness OS for Codex.

Codex executes.
KRN governs activation, trust, execution, evidence, review, and learning.

Canonical flow:

```txt
OperatorIntent
  -> TaskContract
  -> HarnessPlan
  -> ContextAssembly
  -> CapabilityPlan
  -> CodexAdapterPlan
  -> ExecutionRun
  -> EvidenceBundle
  -> ReviewAssessment
  -> FeedbackDelta
  -> Memory / Source / Skill / Policy / Eval updates

The current run must deepen this spine through real target infrastructure:

M22 Source Graph
  -> M23 Memory Governance
  -> M24 Retrieval/Search Substrate
  -> M25 Activation Engine
  -> M26 Codex Adapter + Maintenance Job Skeleton

This is not staged MVP.

Each milestone is a transaction boundary over the final model.

Thin implementation is allowed.
Temporary architecture is not allowed.
Fake architecture is not allowed.

2. Product Doctrine

KRN must solve the real Codex paradoxes:

stateless agent vs stateful project
more context vs worse reasoning
memory helps vs stale memory poisons
sources improve trust vs source bloat
skills standardize excellence vs standardize mistakes
subagents parallelize cognition vs multiply chaos
goals enable autonomy vs drift
hooks enforce policy vs hide semantics
dashboard clarifies vs vanity UI
fast code vs review burden

KRN must not become:

prompt pack;
dashboard-first app;
benchmark lab;
IDE agent;
generic multi-agent framework;
agent zoo;
source library;
markdown memory folder;
giant AGENTS.md;
giant GOAL.md;
another archive of intentions.

KRN builds one operating brain.

Subagents, skills, MCP, hooks, evals, dashboard, workers, and API are organs.
They are not separate brains.

3. Target Stack Is Already Decided

Canonical data plane:

PostgreSQL + pgvector

Local/dev/test mode:

Docker Postgres + pgvector

ORM / migrations:

Drizzle ORM + SQL migrations + raw SQL escape hatches

Validation:

Zod at IO/API/CLI boundaries

Search:

Postgres full-text search + pgvector + relational graph edges

Graph:

Postgres edge tables first, not Neo4j

Queue / async:

Postgres outbox + job table first, not Redis/Kafka

Realtime:

Postgres LISTEN/NOTIFY later for local/live hints, not durable queue

Memory:

typed Memory Core in Postgres, not markdown, not `.krn`

Dashboard:

read-model projection over typed Postgres objects later, not first product surface

Codex integration:

AGENTS.md + Skills + Hooks + MCP adapter + Goals/ExecPlans as adapters

Research:

bounded Research Foundry later; no default swarm in this run
4. Non-Negotiable Boundaries

Do not create:

dashboard UI;
apps/;
public API server;
KRN MCP server;
plugin package;
plugin marketplace packaging;
broad worker runtime;
broad research layer;
source crawler;
broad subagent system;
broad eval suite;
benchmark lane;
runtime markdown memory;
.krn runtime truth;
separate Qdrant/LanceDB/Neo4j/Elastic store;
Redis/Kafka queue;
old repo topology import;
project-oriented skill zoo;
custom prompt library.

Allowed in this plan:

DB schema/migrations for source/memory/retrieval/activation/job records;
Zod IO schemas;
Drizzle repositories;
smoke scripts;
read-only doctor checks;
thin CLI adapters;
candidate-only feedback;
worker job skeleton, not broad worker runtime;
Codex adapter renderer, not Codex execution;
compact run/handoff docs.
5. Required Operational Skills

Use matching repo-local operational skills when their trigger applies.

At minimum:

Always consider
typescript-type-safety
Trigger: TypeScript source, public exports, schema, validation, DB rows, CLI input, casts, unknown, any, tsconfig, public package exports.
Requirement: record type-safety review notes in VERIFICATION.md when risky TS changes happen.
handoff-compact
Trigger: end of each milestone, context compaction, final handoff.
Requirement: first-screen handoff, not historical narrative.
diff-risk-review
Trigger: broad changes, migration/schema changes, CLI behavior changes, repository changes, worker jobs.
Requirement: record diff risk and rollback path.
M22
source-to-decision
Required for SourceClaim, SourceDecisionEdge, SourceRejection design and dogfood.
M23
design-contract
Required for MemoryCandidate -> MemoryRecord promotion boundary.
source-to-decision
Required when memory source lineage depends on source claims.
M24
design-contract
Required for retrieval/search substrate.
type-boundary-review
Required for embedding/search document schemas and unknown input parsing.
M25
investigate-codepath
Required before wiring activation into krn plan.
diff-risk-review
Required because activation can silently change context behavior.
M26
design-contract
Required for Codex adapter execution brief / hook expectations.
repair-loop
Required for smoke failures and worker skeleton issues.

If a matching skill is missing or its trigger is ambiguous, record that in DECISIONS.md or BLOCKERS.md. Do not invent project-specific slop skills during this run.

6. Restart / Context Loss Protocol

If context is lost, compacted, or uncertain, do not guess.

Recover by reading only:

AGENTS.md
GOAL.md
PLAN.md
docs/handoff/handoff.md
docs/handoff/blockers.md
docs/handoff/verification.md
latest current run PROGRESS.md
latest current run HANDOFF.md
latest current run DECISIONS.md
latest current run BLOCKERS.md
git log --oneline -12
files directly touched by the next unchecked slice

Do not recover by reading:

all historical docs;
raw onboarding material;
all old run ledgers;
all ADRs;
all eval reports;
all source maps;
old repo topology.

Do not solve context rot by adding context.

Solve it by:

small current goal;
PLAN.md queue;
compact run ledger;
explicit next action;
typed persisted state;
smoke proof;
first-screen handoff.
7. Repair Loop Protocol

For each implementation slice:

implement
  -> verify
  -> inspect failure
  -> repair attempt 1
  -> verify
  -> repair attempt 2 if needed
  -> if still failing, mark blocked and move to independent slice or final handoff

Never silently weaken:

TypeScript strictness;
schemas;
source claim requirements;
memory promotion gates;
activation filters;
smoke tests;
doctor checks;
tool boundary semantics.

If a slice cannot be completed honestly, mark it blocked.

Do not fake success.

8. Anti-Rot Loop

After every milestone, and after every 3–4 substantial slices, run:

git status --short --branch
pnpm typecheck
pnpm test
krn doctor

If live DB is available, also run relevant smoke commands.

Check:

no dashboard;
no apps/;
no public API;
no KRN MCP server;
no broad workers runtime;
no research layer;
no runtime markdown memory;
no .krn runtime truth;
no separate vector/graph DB;
no Redis/Kafka;
no full auto-memory mutation;
no broad eval suite;
no forbidden dependency;
no any;
no ts-reset in packages/core;
no core import from db/cli/codex adapter;
no requiredSkills core field;
handoff stays first-screen readable.
9. Run Output Files

Create or update:

docs/runs/2026-06-21-m22-m26-brain-spine/
  PROGRESS.md
  HANDOFF.md
  DECISIONS.md
  BLOCKERS.md
  VERIFICATION.md

Keep them compact.

Do not create a sprawling report.

PROGRESS.md format
# Progress — 2026-06-21 M22–M26 Brain Spine

## Current Milestone
- ID:
- Status: pending | in_progress | complete | blocked | skipped
- Started:
- Completed:
- Commit:

## Current Slice
- ID:
- Status:
- Next Action:

## Completed Slices
| Milestone | Slice | Status | Commit | Verification | Notes |
|---|---|---|---|---|---|

## Blocked Slices
| Milestone | Slice | Reason | Evidence | Next Safe Action |
|---|---|---|---|---|

## Skipped Slices
| Milestone | Slice | Reason |
|---|---|---|

## Next Action
One concrete next action only.
HANDOFF.md format
# Handoff — 2026-06-21 M22–M26 Brain Spine

## Last Verified State

## Commits Created

## Verification Passed

## DB Proof Status

## Persisted Harness Status

## Source Graph Status

## Memory Governance Status

## Retrieval/Search Status

## Activation Engine Status

## Codex Adapter / Worker Skeleton Status

## Current Boundaries

## Blockers

## Not Built

## Next Safest Action

## Files To Read After Context Loss
1. AGENTS.md
2. GOAL.md
3. PLAN.md
4. docs/handoff/handoff.md
5. docs/runs/2026-06-21-m22-m26-brain-spine/PROGRESS.md
6. docs/runs/2026-06-21-m22-m26-brain-spine/HANDOFF.md
7. docs/runs/2026-06-21-m22-m26-brain-spine/DECISIONS.md
8. docs/runs/2026-06-21-m22-m26-brain-spine/BLOCKERS.md
9. git log --oneline -12
DECISIONS.md format
# Decisions — 2026-06-21 M22–M26 Brain Spine

| ID | Decision | Alternatives | Why | Revisit When |
|---|---|---|---|---|
BLOCKERS.md format
# Blockers — 2026-06-21 M22–M26 Brain Spine

| Milestone | Slice | Blocker | Evidence | Next Safe Action |
|---|---|---|---|---|
VERIFICATION.md format
# Verification — 2026-06-21 M22–M26 Brain Spine

| Milestone | Slice | Commands | Result | Notes |
|---|---|---|---|---|
10. Commit Protocol

Use Semantic/Conventional Commits only.

Commit only completed, verified slices.

Good examples:

docs(run): add M22-M26 brain spine plan
docs(run): record source graph persistence inventory
feat(db): add source graph persistence schema
feat(schema): add source graph IO schemas
feat(db): add source graph repository methods
test(db): add source graph persistence smoke path
feat(cli): add source claim persistence command
feat(cli): add source-to-decision link command
feat(cli): add source rejection command
feat(cli): report source graph readiness in doctor
docs(run): record source graph dogfood pass

feat(db): add memory governance persistence schema
feat(schema): add memory governance IO schemas
feat(db): add memory repository promotion methods
test(db): add memory promotion smoke path
feat(cli): add memory candidate review commands
feat(cli): report memory governance readiness in doctor

feat(db): add retrieval search substrate schema
feat(db): add search document repository methods
test(db): add retrieval substrate smoke path
feat(cli): report retrieval readiness in doctor

feat(harness): add activation engine v1
test(harness): add noisy brain activation fixture
feat(cli): apply activation in persisted harness plan
docs(run): record activation dogfood pass

feat(codex): add execution brief renderer
feat(codex): add hook expectation projection
feat(workers): add maintenance job skeleton
test(db): add worker job smoke path
docs(handoff): update M22-M26 brain spine status

Avoid:

update
wip
changes
misc
stuff
final
cleanup
fix

Unless scope is precise, do not commit.

11. M22 — SourceClaim Persistence + Source-To-Decision Edges
M22 Objective

Make the Source Graph real enough to persist source claims and link them to KRN decisions / harness artifacts.

Prove:

SourceArtifact
  -> SourceClaim
  -> SourceDecisionEdge
  -> linked harness run / task / plan / review / feedback target

Do not build:

source crawler;
research swarm;
broad source ingestion;
external network fetch;
dashboard/API/MCP server;
automatic source truth.
M22 Source Semantics

Source is not a link.

A retained source must support one of:

mechanism;
decision;
risk;
rejection;
eval design;
implementation boundary.

Every SourceClaim must include:

claim;
mechanism;
doesNotProve;
supportType;
trustTier;
source artifact reference / lineage;
consumer;
optional falsifier or revisit condition.

Decorative sources must become SourceRejection, not trusted SourceClaim.

M22 Target Behavior

With DB configured:

krn source claim add \
  --run-id <harness-run-id> \
  --title "Postgres edge table decision" \
  --type "project-decision" \
  --claim "KRN should model source graph with relational edges first" \
  --mechanism "Postgres already stores canonical harness state and can model graph edges transactionally" \
  --does-not-prove "This does not prove graph edge retrieval quality or long-term source ranking" \
  --support-type "implementation-boundary" \
  --trust-tier "project-decision" \
  --consumer "M22 source graph persistence" \
  --persist

Then:

krn source decision link \
  --run-id <harness-run-id> \
  --source-claim-id <id> \
  --target-type harness_run \
  --target-id <harness-run-id> \
  --support-type implementation-boundary \
  --confidence medium \
  --notes "Used to justify M22 Postgres-backed source graph edge" \
  --persist

And:

krn source claim reject \
  --run-id <harness-run-id> \
  --title "decorative source example" \
  --attempted-claim "Interesting AI engineering link" \
  --rejected-because no_mechanism \
  --reason "No mechanism, consumer, falsifier, or decision support" \
  --persist

Without DB or without --persist:

preview must work;
no crash;
clearly print that no DB writes happened.
M22 Slices
M22.00 — Preflight and run ledger

Run:

git status --short --branch
git log --oneline -12
pnpm typecheck
pnpm test
krn doctor

If live DB is available:

pnpm db:ready
pnpm db:smoke
pnpm db:smoke:harness-plan
pnpm db:smoke:harness-evidence

Create current run docs.

Record:

M21 final state;
DB proof status;
persisted harness proof status;
M22 hard boundaries.

Commit:

docs(run): add M22-M26 brain spine ledger
M22.01 — Inventory source graph surface

Inspect:

DB schema;
migrations;
source core types;
source Zod schemas;
DB repositories;
CLI command structure;
doctor checks;
smoke scripts.

Identify whether these exist:

source_artifacts;
source_chunks;
source_claims;
source_decision_edges;
source_rejections;
SourceClaim;
SourceDecisionEdge;
SourceRepository;
source IO schemas;
source smoke path.

Record in DECISIONS.md.

Verification:

pnpm typecheck

Commit if docs changed:

docs(run): record source graph persistence inventory
M22.02 — Add or tighten source graph schema

Add only missing Drizzle schema/migration needed for M22.

Required entities:

source_artifacts

Minimum:

id;
projectId if current schema supports it;
kind/type;
title;
uri/localRef optional;
contentHash/sourceFingerprint optional;
metadata JSONB if repo style uses metadata;
createdAt.
source_claims

Minimum:

id;
sourceArtifactId;
runId or harnessRunId if available;
claim;
mechanism;
doesNotProve;
supportType;
trustTier;
consumer;
falsifier;
revisitWhen;
status: proposed | accepted | rejected | deprecated;
createdAt.
source_decision_edges

Minimum:

id;
sourceClaimId;
targetType;
targetId;
supportType;
confidence;
notes;
createdAt.

Allowed targetType union:

harness_run;
task_contract;
harness_plan;
context_assembly;
evidence_bundle;
review_assessment;
feedback_delta;
architecture_decision;
memory_record;
eval_candidate.
source_rejections

Minimum:

id;
runId/harnessRunId if available;
title;
attemptedClaim;
reason;
rejectedBecause:
no_mechanism
no_consumer
decorative
stale
conflicting
unsupported
duplicate
createdAt.

Rules:

SourceClaim without mechanism is invalid.
SourceClaim without doesNotProve is invalid.
SourceClaim without consumer is invalid.
SourceDecisionEdge must point to an existing SourceClaim.
SourceRejection is first-class.

Verification:

pnpm typecheck
pnpm db:ready

Commit:

feat(db): add source graph persistence schema
M22.03 — Add source IO schemas

Add/update Zod schemas:

SourceArtifactInput
SourceClaimInput
SourceDecisionEdgeInput
SourceRejectionInput

Rules:

CLI/API input is unknown until parsed.
no any;
supportType is constrained;
trustTier is constrained;
targetType is constrained;
mechanism, doesNotProve, consumer are required for SourceClaim.

Support types:

mechanism;
decision;
risk;
rejection;
eval-design;
implementation-boundary.

Trust tiers:

primary;
official;
project-decision;
source-code;
paper;
practitioner;
secondary;
hypothesis.

Verification:

pnpm typecheck
pnpm test

Commit:

feat(schema): add source graph IO schemas
M22.04 — Add SourceRepository methods

Add repository methods using existing Drizzle style:

createSourceArtifact(input);
createSourceClaim(input);
getSourceClaimById(id);
createSourceDecisionEdge(input);
listSourceDecisionEdgesForRun(runId);
createSourceRejection(input);
listSourceClaimsForRun(runId);
cleanup test source graph records if existing smoke style uses cleanup helpers.

Rules:

return typed read models, not raw DB rows;
no DB imports in packages/core;
no CLI direct SQL if repository pattern exists;
no source crawler;
no external network;
no automatic claim acceptance unless current model already supports reviewed status.

Verification:

pnpm typecheck
pnpm test

Commit:

feat(db): add source graph repository methods
M22.05 — Add source graph smoke path

Add:

pnpm db:smoke:source-graph

It must:

require configured DB;
create/reuse test project/harness run;
create SourceArtifact;
create valid SourceClaim;
create SourceDecisionEdge linked to harness run or task;
create SourceRejection for decorative/invalid source;
read records back;
verify linkage;
cleanup all test rows;
prove cleanup count is zero.

If DB is absent, fail/skip clearly with actionable message.

Verification:

pnpm db:smoke:source-graph
pnpm typecheck
pnpm test

Commit:

test(db): add source graph persistence smoke path
M22.06 — Add CLI krn source claim add

Implement:

krn source claim add ... --persist

Behavior:

parse through SourceClaimInput;
create SourceArtifact if needed;
create SourceClaim;
link to run ID if supplied;
print persisted IDs;
print doesNotProve.

Required fields:

title;
claim;
mechanism;
doesNotProve;
supportType;
trustTier;
consumer.

Optional:

uri;
type;
runId;
falsifier;
revisitWhen;
metadata.

Rules:

no source without mechanism;
no source without doesNotProve;
no decorative source acceptance;
no network fetch;
no crawler.

Verification:

krn source claim add --help
pnpm typecheck
pnpm test

With DB:

krn source claim add ... --persist

Commit:

feat(cli): add source claim persistence command
M22.07 — Add CLI krn source decision link

Implement:

krn source decision link ... --persist

Behavior:

parse input;
verify SourceClaim exists if DB configured;
create SourceDecisionEdge;
print edge ID and target;
print support type and confidence.

Required fields:

sourceClaimId;
targetType;
targetId;
supportType;
confidence;
notes.

Rules:

targetType constrained;
supportType constrained;
confidence constrained;
no untyped arbitrary graph edge;
no automatic inference that source proves whole target.

Verification:

pnpm typecheck
pnpm test

Commit:

feat(cli): add source-to-decision link command
M22.08 — Add CLI krn source claim reject

Implement:

krn source claim reject ... --persist

Behavior:

persist SourceRejection if DB configured;
preview-only if no DB/no persist;
make decorative source rejection visible.

Required fields:

title;
reason or attemptedClaim;
rejectedBecause.

Rules:

rejected source must not become accepted SourceClaim;
rejection reason explicit;
no silent dropping of bad sources.

Verification:

pnpm typecheck
pnpm test

Commit:

feat(cli): add source rejection command
M22.09 — Update evidence capture to surface source candidates

Update krn evidence capture lightly.

Behavior:

output sourceDecisionCandidates section when changed files/review notes imply a source decision;
if --persist and --run-id, persist only if required fields are available;
otherwise emit proposal-only candidates.

Rules:

do not auto-trust source candidates;
no SourceClaim without mechanism/doesNotProve/consumer;
no memory mutation;
candidates explicit.

Verification:

krn evidence capture
pnpm typecheck
pnpm test
pnpm db:smoke:harness-evidence

Commit:

feat(cli): surface source candidates in evidence capture
M22.10 — Doctor source graph readiness

Update krn doctor.

Checks:

source graph schema/migrations available;
SourceRepository reachable if DB configured;
source smoke command available;
source graph smoke proven/unproven;
no source crawler/research layer present;
no separate graph DB.

States:

no DB configured: source graph persistence unproven, preview-only;
DB ready but source smoke not run: runtime unverified;
DB ready and source smoke passed: source graph ready.

No writes.

Verification:

krn doctor
pnpm typecheck
pnpm test

With DB:

pnpm db:smoke:source-graph
krn doctor

Commit:

feat(cli): report source graph readiness in doctor
M22.11 — Dogfood source graph on M22

With live DB:

krn plan --task "persist SourceClaims and source-to-decision edges" --persist

Then add a real claim:

krn source claim add \
  --run-id <id> \
  --title "Postgres edge tables for first source graph" \
  --type "project-decision" \
  --claim "M22 should model source graph with Postgres-backed relational edges before any separate graph database or crawler" \
  --mechanism "KRN already uses Postgres as canonical harness state; source-to-decision edges need transactional linkage to harness runs and feedback artifacts" \
  --does-not-prove "This does not prove retrieval quality, ranking quality, or long-term graph traversal performance" \
  --support-type "implementation-boundary" \
  --trust-tier "project-decision" \
  --consumer "M22 implementation" \
  --persist

Link it:

krn source decision link \
  --run-id <id> \
  --source-claim-id <source-claim-id> \
  --target-type harness_run \
  --target-id <id> \
  --support-type implementation-boundary \
  --confidence medium \
  --notes "Used to justify first Postgres-backed source graph slice" \
  --persist

Reject a decorative example:

krn source claim reject \
  --run-id <id> \
  --title "decorative source without mechanism" \
  --attempted-claim "Interesting AI engineering link" \
  --rejected-because no_mechanism \
  --reason "No mechanism, consumer, falsifier, or decision support" \
  --persist

Run:

krn evidence capture --run-id <id> --persist
krn doctor
pnpm db:smoke:source-graph

Record:

run ID;
source claim ID;
edge ID;
rejection ID;
what was proven;
what was not proven;
next safest action.

Commit:

docs(run): record source graph dogfood pass
M22.12 — M22 anti-rot and handoff update

Run:

git status --short --branch
git log --oneline -12
pnpm typecheck
pnpm test
krn doctor
pnpm db:ready
pnpm db:smoke
pnpm db:smoke:harness-plan
pnpm db:smoke:harness-evidence
pnpm db:smoke:source-graph

Update run docs and docs/handoff/*.

Commit:

docs(handoff): update source graph persistence status

M22 complete when:

source artifacts persisted;
source claims persisted;
source-to-decision edges persisted;
source rejections persisted;
smoke cleanup proven;
doctor reports source graph readiness;
no forbidden surfaces.
12. M23 — MemoryCandidate To Reviewed MemoryRecord Promotion
M23 Objective

Make Memory Governance real enough to persist memory candidates, review/promote them into MemoryRecord versions, record anti-memory, and link memory to source/evidence.

Prove:

EvidenceBundle / ReviewAssessment / FeedbackDelta
  -> MemoryCandidate
  -> MemoryReviewGate
  -> MemoryRecord
  -> MemoryRecordVersion
  -> MemoryApplication / Feedback
  -> AntiMemory when invalidated or rejected

Do not build:

automatic memory mutation;
autonomous memory ingestion;
broad memory worker;
memory crawler;
markdown memory;
vector embedding pipeline yet;
dashboard/API.
M23 Memory Semantics

Memory is not notes.

Memory is a governed resource.

MemoryRecord must include:

type/kind;
content;
source lineage;
owner;
confidence;
valid time / TTL / invalidation policy;
application guidance;
feedback status.

MemoryCandidate is proposal-only until reviewed.

AntiMemory is first-class.

No memory promotion without:

source lineage OR explicit user preference classification;
application guidance;
invalidation policy when temporal;
review status.
M23 Target Behavior
krn memory candidate add \
  --run-id <id> \
  --kind architecture-boundary \
  --content "Source graph should use Postgres edge tables first" \
  --source-claim-id <source-claim-id> \
  --confidence medium \
  --application-guidance "Use when deciding whether to add a separate graph DB before graph-edge scale evidence exists" \
  --invalidation-rule "Revisit when graph traversal or ranking needs exceed Postgres edge-table performance" \
  --persist

Then:

krn memory candidate promote \
  --candidate-id <id> \
  --reviewer operator \
  --decision accepted \
  --persist

Then:

krn memory record apply \
  --run-id <run-id> \
  --memory-id <memory-id> \
  --outcome helped \
  --notes "Guided M23 decision to avoid separate graph DB" \
  --persist

And anti-memory:

krn memory anti add \
  --run-id <run-id> \
  --rejected-claim "Markdown files are KRN runtime memory" \
  --reason "Files can be export/audit/seed/source bank, not Memory Core" \
  --invalidated-by-source-claim-id <source-claim-id> \
  --persist

Without DB/no --persist: preview-only.

M23 Slices
M23.00 — Inventory memory governance surface

Inspect:

memory tables;
memory candidate schema;
anti-memory schema;
source lineage fields;
memory core types;
memory IO schemas;
repository methods;
evidence capture FeedbackDelta candidate output;
existing smoke scripts.

Record in DECISIONS.md.

Verification:

pnpm typecheck

Commit:

docs(run): record memory governance inventory
M23.01 — Add or tighten memory governance schema

Add/tighten:

memory_candidates

Minimum:

id;
runId / feedbackDeltaId optional;
kind;
content;
sourceClaimIds or sourceLineage JSON;
confidence;
owner/proposedBy;
applicationGuidance;
invalidationRule;
validFrom;
validUntil;
status: proposed | accepted | rejected | superseded;
createdAt.
memory_records

Minimum:

id;
projectId;
kind;
currentVersionId;
status: active | deprecated | invalidated;
owner;
confidence;
createdAt;
updatedAt.
memory_record_versions

Minimum:

id;
memoryRecordId;
content;
sourceLineage;
applicationGuidance;
invalidationPolicy;
validFrom;
validUntil;
version;
createdFromCandidateId;
createdAt.
memory_applications

Minimum:

id;
memoryRecordId;
runId;
outcome: helped | hurt | neutral | stale;
notes;
createdAt.
memory_feedback_events

Minimum:

id;
memoryRecordId;
runId;
eventType: strengthened | demoted | invalidated | corrected | stale_detected;
reason;
evidenceRef;
createdAt.
anti_memory_records

Minimum:

id;
rejectedClaim;
reason;
invalidatedBySourceClaimIds;
appliesTo;
mayRevisitWhen;
runId;
createdAt.

Rules:

no MemoryRecord without application guidance;
no temporal memory without invalidation policy;
no auto-promote from candidate;
anti-memory cannot be stored as a normal positive memory.

Verification:

pnpm typecheck
pnpm db:ready

Commit:

feat(db): add memory governance persistence schema
M23.02 — Add memory governance IO schemas

Add/update Zod schemas:

MemoryCandidateInput
MemoryPromotionInput
MemoryApplicationInput
AntiMemoryInput
MemoryFeedbackEventInput

Rules:

all external input unknown until parsed;
no any;
kind constrained;
outcome constrained;
status constrained;
applicationGuidance required;
invalidationRule required for temporal kinds;
sourceLineage required unless kind is explicit user preference.

Verification:

pnpm typecheck
pnpm test

Commit:

feat(schema): add memory governance IO schemas
M23.03 — Add MemoryRepository methods

Methods:

createMemoryCandidate(input);
getMemoryCandidateById(id);
promoteMemoryCandidate(input);
rejectMemoryCandidate(input);
getMemoryRecordById(id);
listMemoryRecordsForProject(projectId);
recordMemoryApplication(input);
createAntiMemoryRecord(input);
listAntiMemoryForRun(runId);
cleanup test memory records if smoke style uses cleanup helpers.

Rules:

promotion is explicit;
repository returns typed read models;
no raw DB rows;
no core imports from db;
no automatic mutation from evidence capture.

Verification:

pnpm typecheck
pnpm test

Commit:

feat(db): add memory governance repository methods
M23.04 — Add memory governance smoke path

Add:

pnpm db:smoke:memory-governance

It must:

require DB;
create/reuse test project/run;
create SourceClaim or use existing smoke helper;
create MemoryCandidate;
promote candidate to MemoryRecord + version;
apply memory to a run with outcome;
create AntiMemoryRecord;
read back all records;
verify linkage;
cleanup rows;
prove cleanup count zero.

Verification:

pnpm db:smoke:memory-governance
pnpm typecheck
pnpm test

Commit:

test(db): add memory governance smoke path
M23.05 — Add CLI krn memory candidate add

Implement:

krn memory candidate add ... --persist

Required:

runId or feedbackDeltaId;
kind;
content;
confidence;
applicationGuidance;
sourceClaimId or sourceLineage;
invalidationRule if temporal.

Preview without persist.

Verification:

pnpm typecheck
pnpm test

Commit:

feat(cli): add memory candidate command
M23.06 — Add CLI krn memory candidate promote/reject

Implement:

krn memory candidate promote --candidate-id <id> --reviewer <name> --decision accepted --persist
krn memory candidate reject --candidate-id <id> --reviewer <name> --reason "..." --persist

Rules:

no promotion without review;
reject stores reason;
output what this memory does not prove if source lineage exists;
no auto-apply.

Verification:

pnpm typecheck
pnpm test

Commit:

feat(cli): add memory candidate review commands
M23.07 — Add CLI krn memory record apply

Implement:

krn memory record apply --run-id <id> --memory-id <id> --outcome helped --notes "..." --persist

Rules:

application feedback must be explicit;
outcome constrained;
stale/hurt outcomes should create feedback event or candidate for demotion.

Verification:

pnpm typecheck
pnpm test

Commit:

feat(cli): add memory application feedback command
M23.08 — Add CLI krn memory anti add

Implement:

krn memory anti add ... --persist

Rules:

anti-memory is not normal positive memory;
requires rejectedClaim and reason;
link to invalidating source/evidence if available.

Verification:

pnpm typecheck
pnpm test

Commit:

feat(cli): add anti-memory command
M23.09 — Update evidence capture to emit memory candidates

Update krn evidence capture.

Behavior:

output memoryCandidates;
persist candidates only if --persist and required fields available;
never promote automatically;
never create MemoryRecord automatically;
if candidate lacks applicationGuidance/sourceLineage, leave as text proposal or mark incomplete.

Verification:

krn evidence capture --run-id <id> --persist
pnpm typecheck
pnpm test
pnpm db:smoke:harness-evidence

Commit:

feat(cli): surface memory candidates in evidence capture
M23.10 — Doctor memory governance readiness

Update krn doctor.

Checks:

memory governance schema/migrations available;
MemoryRepository reachable if DB configured;
memory smoke command available;
memory smoke proven/unproven;
no runtime markdown memory;
no .krn runtime truth;
no automatic memory mutation.

Verification:

krn doctor
pnpm db:smoke:memory-governance
krn doctor
pnpm typecheck
pnpm test

Commit:

feat(cli): report memory governance readiness in doctor
M23.11 — Dogfood memory governance

Use live DB.

Create a run:

krn plan --task "promote reviewed memory from KRN evidence" --persist

Create MemoryCandidate tied to M22 source decision.

Promote it.

Apply it.

Create anti-memory for markdown runtime memory.

Run:

krn evidence capture --run-id <id> --persist
pnpm db:smoke:memory-governance
krn doctor

Record:

memory candidate ID;
memory record ID;
memory version ID;
application ID;
anti-memory ID;
what was proven;
what not proven.

Commit:

docs(run): record memory governance dogfood pass
M23.12 — M23 anti-rot and handoff

Run:

git status --short --branch
git log --oneline -12
pnpm typecheck
pnpm test
krn doctor
pnpm db:ready
pnpm db:smoke
pnpm db:smoke:harness-plan
pnpm db:smoke:harness-evidence
pnpm db:smoke:source-graph
pnpm db:smoke:memory-governance

Update handoff.

Commit:

docs(handoff): update memory governance status

M23 complete when:

memory candidates persisted;
explicit promotion works;
memory records/versions persisted;
memory application feedback persisted;
anti-memory persisted;
smoke cleanup proven;
doctor reports memory readiness;
no automatic memory mutation.
13. M24 — Retrieval/Search Substrate + Activation Trace Persistence
M24 Objective

Make retrieval/search substrate real enough to support M25 activation.

Prove:

SourceClaim / MemoryRecord / Evidence / Decision
  -> SearchDocument
  -> optional Embedding placeholder/vector row
  -> RetrievalRun
  -> RetrievalCandidate
  -> ActivationDecision
  -> ContextItem / ContextExclusion

Do not build:

external embedding service integration;
background embedding worker runtime;
separate vector DB;
separate search engine;
naive RAG context dump;
automatic broad retrieval;
dashboard.
M24 Retrieval Semantics

Retrieval is not activation.

Retrieval gathers candidates.

Activation decides what enters the next run.

Search substrate must support:

lexical search;
vector-ready records;
graph expansion references;
trust metadata;
temporal metadata;
retrieval run audit;
candidate scores;
activation decisions;
explicit exclusions.
M24 Target Behavior
pnpm db:smoke:retrieval-substrate

Must prove:

search document inserted;
lexical query finds it;
embedding placeholder/vector row can be stored or vector readiness is explicitly skipped with reason;
retrieval run recorded;
retrieval candidates recorded;
activation decisions/exclusions recorded;
cleanup count zero.

Optional CLI:

krn retrieval smoke --run-id <id> --query "source graph postgres edge tables" --persist

Only if CLI pattern is already clean.

M24 Slices
M24.00 — Inventory retrieval/search surface

Inspect:

embedding_models;
embeddings;
search_documents;
retrieval_runs;
retrieval_candidates;
activation_decisions;
context_items;
context_exclusions;
existing pgvector extension checks;
FTS support in migrations;
repo conventions for raw SQL.

Record in DECISIONS.md.

Verification:

pnpm typecheck

Commit:

docs(run): record retrieval substrate inventory
M24.01 — Add/tighten retrieval schema

Add/tighten:

search_documents

Minimum:

id;
projectId;
sourceType:
source_claim
memory_record
evidence_bundle
review_assessment
architecture_decision
run_event
sourceId;
title;
body;
searchText / tsvector strategy;
trustTier;
validFrom;
validUntil;
metadata JSONB;
createdAt.
embedding_models

Minimum:

id;
provider;
model;
dimensions;
status;
createdAt.
embeddings

Minimum:

id;
searchDocumentId;
embeddingModelId;
vector;
createdAt.

If vector column type needs raw SQL, use raw SQL carefully and document.

retrieval_runs

Minimum:

id;
runId / taskContractId;
query;
mode: lexical | vector | hybrid | graph | mixed;
budget;
createdAt.
retrieval_candidates

Minimum:

id;
retrievalRunId;
searchDocumentId;
score;
reason;
candidateType;
createdAt.
activation_decisions

Minimum:

id;
retrievalCandidateId;
decision: included | excluded | deferred | conflict | stale;
reason;
contextBudgetCost;
expectedDecisionImpact;
createdAt.
context_items / context_exclusions

Use existing names if present.

Rules:

do not require actual external embedding call;
vector-ready schema must not introduce separate vector DB;
retrieval candidates are not automatically context inclusions;
exclusions are first-class.

Verification:

pnpm typecheck
pnpm db:ready

Commit:

feat(db): add retrieval search substrate schema
M24.02 — Add retrieval IO schemas

Add:

SearchDocumentInput
RetrievalRunInput
RetrievalCandidateInput
ActivationDecisionInput
ContextItemInput
ContextExclusionInput

Rules:

unknown until parsed;
score numeric and bounded if possible;
decision constrained;
mode constrained;
no any.

Verification:

pnpm typecheck
pnpm test

Commit:

feat(schema): add retrieval substrate IO schemas
M24.03 — Add RetrievalRepository methods

Methods:

createSearchDocument(input);
searchLexical(query, filters);
createEmbeddingModel(input);
createEmbeddingPlaceholder(input) or createEmbedding(input);
createRetrievalRun(input);
createRetrievalCandidate(input);
createActivationDecision(input);
listCandidatesForRetrievalRun(id);
listActivationDecisionsForRun(id);
cleanup test retrieval records.

Rules:

repository returns typed models;
no external embedding calls;
no separate vector DB;
lexical search must be useful enough for smoke test;
raw SQL allowed only in db package and documented.

Verification:

pnpm typecheck
pnpm test

Commit:

feat(db): add retrieval repository methods
M24.04 — Add retrieval substrate smoke path

Add:

pnpm db:smoke:retrieval-substrate

It must:

require DB;
create/reuse project/run;
create source claim and memory record or use smoke helpers;
create search documents for source/memory;
prove lexical search can find document;
verify pgvector readiness already available;
create retrieval run;
create candidates;
create activation decisions/exclusions;
read back linkage;
cleanup;
prove cleanup count zero.

Verification:

pnpm db:smoke:retrieval-substrate
pnpm typecheck
pnpm test

Commit:

test(db): add retrieval substrate smoke path
M24.05 — Doctor retrieval readiness

Update krn doctor.

Checks:

retrieval schema/migrations available;
FTS/search document readiness;
pgvector available;
retrieval smoke command available;
retrieval smoke proven/unproven;
no separate vector/search DB;
no naive RAG dump command.

Verification:

krn doctor
pnpm db:smoke:retrieval-substrate
krn doctor
pnpm typecheck
pnpm test

Commit:

feat(cli): report retrieval substrate readiness in doctor
M24.06 — Dogfood retrieval substrate

Create persisted run:

krn plan --task "prove retrieval substrate for KRN activation engine" --persist

Create search docs for one source claim and one memory record.

Run retrieval smoke.

Record:

search doc IDs;
retrieval run ID;
candidate IDs;
activation decision IDs;
what was proven;
what not proven.

Commit:

docs(run): record retrieval substrate dogfood pass
M24.07 — M24 anti-rot and handoff

Run:

git status --short --branch
git log --oneline -12
pnpm typecheck
pnpm test
krn doctor
pnpm db:ready
pnpm db:smoke
pnpm db:smoke:harness-plan
pnpm db:smoke:harness-evidence
pnpm db:smoke:source-graph
pnpm db:smoke:memory-governance
pnpm db:smoke:retrieval-substrate

Update handoff.

Commit:

docs(handoff): update retrieval substrate status

M24 complete when:

search documents persisted;
lexical retrieval proven;
pgvector readiness represented;
retrieval run/candidates persisted;
activation decisions/exclusions persisted;
smoke cleanup proven;
doctor reports retrieval readiness.
14. M25 — Activation Engine V1 Integrated Into Persisted Harness Plan
M25 Objective

Make activation engine real enough that krn plan --persist can retrieve, rank, filter, include, exclude, and persist context decisions using source/memory/search substrate.

Prove:

TaskContract
  -> Source/Memory/Search candidates
  -> Trust filter
  -> Temporal filter
  -> Conflict/staleness filter
  -> ContextROI scoring
  -> ContextAssembly
      -> ContextInclusion[]
      -> ContextExclusion[]
      -> ActivationTrace

Do not build:

LLM-based ranking;
external embedding generation;
broad research;
source crawler;
memory auto-mutation;
dashboard;
API.
M25 Activation Semantics

Activation is the moat.

KRN does not win by storing links.
KRN wins by selecting a small high-signal working set and explicitly excluding the rest.

Activation must answer:

why this item enters;
what it is expected to affect;
what it does not prove;
why excluded items stayed out;
when a stale item should be revisited;
whether memory/source retrieval abstained.

Final output should target:

7–20 high-signal items, explicit exclusions

But implementation may start with smaller fixtures.

M25 Target Behavior
krn plan --task "improve KRN doctor source graph readiness" --persist

With source/memory/retrieval data present, output and persist:

context inclusions;
context exclusions;
retrieval run;
retrieval candidates;
activation decisions;
ContextAssembly linked to run;
evidence contract.

Smoke:

pnpm db:smoke:activation

Must prove noisy fixture compresses into bounded context.

M25 Slices
M25.00 — Inventory activation engine surface

Inspect:

current harness compiler;
assembleContext;
context assembly schema;
context items/exclusions;
retrieval repository;
source/memory repositories;
current krn plan --persist;
evidence contract output.

Record in DECISIONS.md.

Verification:

pnpm typecheck

Commit:

docs(run): record activation engine inventory
M25.01 — Add activation core/domain types if missing

Add/tighten:

ActivationPolicy
TrustAssessment
ContextROI
ActivationTrace
ActivationInput
ActivationResult
ActivationAbstention
ConflictSet
ContextBudget

Rules:

no DB imports in core;
no CLI imports in core;
no Codex skill IDs in core;
no requiredSkills field;
explicit inclusion and exclusion;
activation can abstain.

Verification:

pnpm typecheck
pnpm test

Commit:

feat(core): add activation domain contracts
M25.02 — Implement activation engine v1

Implement in packages/harness or current harness package.

Functions:

buildSourceQuery(task);
buildMemoryQuery(task);
retrieveActivationCandidates(task, repositories);
applyTrustFilter(candidates);
applyTemporalFilter(candidates);
detectConflicts(candidates);
scoreContextROI(candidates);
assembleActivatedContext(task, candidates, policy);
persistActivationTrace(result).

Rules:

deterministic;
conservative;
no external LLM call;
no external embedding generation;
explicit inclusions/exclusions;
every included item has reason and expected use;
every excluded item has reason;
memory/source can abstain;
source does not prove whole decision unless edge says so.

Verification:

pnpm typecheck
pnpm test

Commit:

feat(harness): add activation engine v1
M25.03 — Add noisy brain fixture

Add fixture:

tests/fixtures/activation/noisy-brain-selection.json

Input:

one task;
multiple source claims;
multiple memory records;
stale memory;
anti-memory;
decorative source rejection;
conflicting source claims;
small context budget.

Expected:

bounded inclusions;
explicit exclusions;
conflict flagged;
stale excluded or warning;
anti-memory blocks rejected claim;
source without mechanism excluded/rejected;
evidence contract remains;
no requiredSkills in core.

Verification:

pnpm test
pnpm typecheck

Commit:

test(harness): add noisy brain activation fixture
M25.04 — Add activation DB smoke path

Add:

pnpm db:smoke:activation

It must:

create/reuse project/run;
seed source claims;
seed memory records;
seed anti-memory;
create search documents;
run activation;
persist retrieval run/candidates;
persist activation decisions;
persist context inclusions/exclusions;
read back ContextAssembly linkage;
cleanup;
prove cleanup count zero.

Verification:

pnpm db:smoke:activation
pnpm typecheck
pnpm test

Commit:

test(db): add activation engine smoke path
M25.05 — Wire activation into krn plan --persist

Update krn plan.

With DB and --persist:

create OperatorIntent;
create TaskContract;
retrieve source/memory/search candidates;
run activation engine;
persist RetrievalRun;
persist candidates;
persist ActivationDecisions;
persist ContextAssembly inclusions/exclusions;
print bounded ExecutionBrief-like summary;
print explicit exclusions and abstentions.

Without DB/no --persist:

preview mode still works;
no crash;
no writes.

Rules:

no raw onboarding reads;
no source crawler;
no memory mutation;
no auto-promotion;
no broad context dump.

Verification:

krn plan --task "improve KRN doctor source graph readiness"
krn plan --task "improve KRN doctor source graph readiness" --persist
pnpm typecheck
pnpm test
pnpm db:smoke:activation

Commit:

feat(cli): apply activation in persisted harness plan
M25.06 — Doctor activation readiness

Update krn doctor.

Checks:

activation domain contracts present;
retrieval substrate ready;
source graph ready;
memory governance ready;
activation smoke command available;
activation smoke proven/unproven;
no broad context dump;
no requiredSkills core field.

Verification:

krn doctor
pnpm db:smoke:activation
krn doctor
pnpm typecheck
pnpm test

Commit:

feat(cli): report activation readiness in doctor
M25.07 — Dogfood activation on real next task

Use live DB:

krn plan --task "improve KRN doctor activation readiness" --persist

Inspect output:

bounded inclusions;
explicit exclusions;
source/memory abstentions;
evidence contract;
next action.

Then:

krn evidence capture --run-id <id> --persist
pnpm db:smoke:activation
krn doctor

Record:

run ID;
retrieval run ID;
number of candidates;
number included;
number excluded;
evidence bundle ID;
what helped;
what not proven.

Commit:

docs(run): record activation dogfood pass
M25.08 — M25 anti-rot and handoff

Run full verification:

git status --short --branch
git log --oneline -12
pnpm typecheck
pnpm test
krn doctor
pnpm db:ready
pnpm db:smoke
pnpm db:smoke:harness-plan
pnpm db:smoke:harness-evidence
pnpm db:smoke:source-graph
pnpm db:smoke:memory-governance
pnpm db:smoke:retrieval-substrate
pnpm db:smoke:activation

Update handoff.

Commit:

docs(handoff): update activation engine status

M25 complete when:

activation engine runs deterministically;
noisy brain fixture passes;
activation smoke passes;
krn plan --persist uses activation;
inclusions/exclusions persisted;
doctor reports activation readiness;
no context dump.
15. M26 — Codex Adapter Execution Brief + Hook Expectations + Worker Job Skeleton
M26 Objective

Connect the persisted harness/activation spine to Codex-native adapter outputs and maintenance job skeletons without building MCP server, broad workers, sandbox orchestration, or actual Codex execution.

Prove:

HarnessRun / ContextAssembly / EvidenceContract / CapabilityPlan
  -> CodexAdapterPlan
  -> ExecutionBrief
  -> HookExpectation[]
  -> SkillBindingHints[]
  -> MCPResourceRefs[]
  -> WorkerJob skeleton records

Do not build:

KRN MCP server;
dashboard;
public API;
broad worker runtime;
agent runner;
sandbox orchestration;
actual Codex invocation;
plugin packaging;
broad subagent system.
M26 Codex Adapter Semantics

Codex surfaces are adapters, not core domain.

AGENTS.md: thin repo policy and pointers.
Skills: progressive engineering workflows, selected through capability routing.
Hooks: deterministic guardrails/traces, not semantic brain.
MCP: future typed tool/context boundary, not memory.
Subagents: bounded read/propose probes, not second brain.
Goals/ExecPlans: durable task contracts / restartable plans.

M26 should render instructions and expectations. It should not execute Codex.

M26 Worker Semantics

Workers are maintenance mechanisms, not product proof.

Add job skeletons for:

embed_source_chunk;
embed_memory_record;
compact_memory;
detect_contradiction;
expire_stale_memory;
promote_eval_candidate.

No infinite loop.
No daemon.
No Redis/Kafka.
No external embedding call unless already safely abstracted and skipped by default.
Postgres job/outbox only.

M26 Target Behavior
krn codex brief --run-id <id>

or integrated:

krn plan --task "..." --persist --brief

Outputs:

execution brief;
context inclusions;
explicit exclusions;
evidence contract;
tool boundaries;
hook expectations;
skill binding hints;
MCP resource refs as future references;
no execution.

Smoke:

pnpm db:smoke:codex-adapter
pnpm db:smoke:worker-jobs
M26 Slices
M26.00 — Inventory Codex adapter and worker surfaces

Inspect:

codex-adapter package;
harness compiler output;
CapabilityPlan;
SkillBinding or equivalent;
HookExpectation types;
MCP reference types;
worker_jobs/outbox schema;
existing worker package/scripts;
krn plan output.

Record in DECISIONS.md.

Verification:

pnpm typecheck

Commit:

docs(run): record Codex adapter and worker inventory
M26.01 — Add/tighten Codex adapter contracts

Add/tighten:

CodexAdapterPlan
ExecutionBrief
CodexSkillBindingHint
CodexHookExpectation
CodexMcpResourceRef
CodexGoalRef
CodexExecPlanRef
CodexSubagentProbeHint

Rules:

adapter package may mention Codex;
core remains Codex-agnostic;
skills are hints/bindings, not core requiredSkills;
subagents are hints only;
no MCP server;
no hook scripts unless already conventional and decision-recorded.

Verification:

pnpm typecheck
pnpm test

Commit:

feat(codex): add Codex adapter contracts
M26.02 — Implement execution brief renderer

Render from persisted run/context/evidence contract:

Output sections:

Objective;
Non-goals;
Current task contract;
Included context;
Explicit exclusions;
Source claims used;
Memory records used;
Anti-memory warnings;
Tool boundaries;
Evidence contract;
Stop condition;
Rollback expectation;
Next action;
What this does not prove.

Rules:

brief must be bounded;
no raw onboarding dump;
no full source library;
no full memory dump;
no hidden write authority.

Verification:

pnpm typecheck
pnpm test

Commit:

feat(codex): add execution brief renderer
M26.03 — Add CLI krn codex brief

Implement:

krn codex brief --run-id <id>

Behavior:

loads persisted harness run;
loads context assembly;
renders execution brief;
prints no writes;
with --output json prints structured brief if existing CLI style supports output mode.

Rules:

no Codex invocation;
no MCP server;
no subagent spawn;
no memory mutation.

Verification:

krn codex brief --run-id <id>
pnpm typecheck
pnpm test

Commit:

feat(cli): add Codex execution brief command
M26.04 — Add hook expectation projection

Add renderer/projection for hook expectations:

Expected hook phases:

SessionStart:
inject compact project/run pointer, if configured.
PreToolUse:
warn/deny destructive paths;
warn generated files;
require approval for destructive/write actions;
record tool boundary notes.
PostToolUse:
capture command evidence;
record failure/success signal.
PreCompact:
require compact handoff pointer.
Stop:
require evidence capture suggestion.

Rules:

only expectations/projections;
no hidden semantic decisions;
no actual hook scripts unless already part of repo pattern and explicitly decided.

Verification:

pnpm typecheck
pnpm test

Commit:

feat(codex): add hook expectation projection
M26.05 — Add Codex adapter smoke path

Add:

pnpm db:smoke:codex-adapter

It must:

create/reuse persisted harness run with activated context;
render execution brief;
verify objective/non-goals/exclusions/evidence contract present;
verify source/memory references bounded;
verify hook expectations present;
verify no Codex execution happened;
cleanup rows if created;
prove cleanup count zero.

Verification:

pnpm db:smoke:codex-adapter
pnpm typecheck
pnpm test

Commit:

test(db): add Codex adapter smoke path
M26.06 — Add worker job schema if missing

Add/tighten worker_jobs and maybe outbox_events if not sufficient.

Worker job fields:

id;
jobType:
embed_source_chunk
embed_memory_record
compact_memory
detect_contradiction
expire_stale_memory
promote_eval_candidate
status:
queued
running
succeeded
failed
skipped
payload JSONB;
attempts;
maxAttempts;
runAfter;
lockedAt;
lockedBy;
lastError;
createdAt;
updatedAt.

Rules:

no daemon;
no infinite worker loop;
no Redis/Kafka;
no external embedding call;
job records only.

Verification:

pnpm typecheck
pnpm db:ready

Commit:

feat(db): add worker job skeleton schema
M26.07 — Add WorkerJobRepository methods

Methods:

enqueueWorkerJob(input);
getWorkerJobById(id);
listQueuedWorkerJobs(limit);
markWorkerJobRunning(id);
markWorkerJobSucceeded(id);
markWorkerJobFailed(id, error);
markWorkerJobSkipped(id, reason);
cleanup test worker jobs.

Rules:

typed results;
no daemon;
no external side effects;
no core imports from db;
no job execution beyond status transitions.

Verification:

pnpm typecheck
pnpm test

Commit:

feat(db): add worker job repository methods
M26.08 — Add worker job smoke path

Add:

pnpm db:smoke:worker-jobs

It must:

require DB;
enqueue one job per job type or a representative subset;
read queued jobs;
mark running;
mark succeeded/skipped/failed in controlled way;
verify transitions;
cleanup;
prove cleanup count zero.

Verification:

pnpm db:smoke:worker-jobs
pnpm typecheck
pnpm test

Commit:

test(db): add worker job skeleton smoke path
M26.09 — Doctor Codex adapter / worker readiness

Update krn doctor.

Checks:

Codex adapter renderer available;
execution brief smoke available/proven;
hook expectation projection available;
no Codex execution runner;
no MCP server;
worker job schema available;
worker job smoke available/proven;
no Redis/Kafka;
no broad worker daemon.

Verification:

krn doctor
pnpm db:smoke:codex-adapter
pnpm db:smoke:worker-jobs
krn doctor
pnpm typecheck
pnpm test

Commit:

feat(cli): report Codex adapter and worker readiness in doctor
M26.10 — Dogfood Codex adapter and worker skeleton

Use live DB:

krn plan --task "render Codex execution brief for activated harness run" --persist
krn codex brief --run-id <id>
pnpm db:smoke:codex-adapter
pnpm db:smoke:worker-jobs
krn evidence capture --run-id <id> --persist
krn doctor

Record:

run ID;
execution brief proof;
hook expectation proof;
worker job proof;
what was not built;
next safest action.

Commit:

docs(run): record Codex adapter and worker dogfood pass
M26.11 — Final M22–M26 anti-rot audit

Run full suite:

git status --short --branch
git log --oneline -20
pnpm typecheck
pnpm test
krn doctor
pnpm db:ready
pnpm db:smoke
pnpm db:smoke:harness-plan
pnpm db:smoke:harness-evidence
pnpm db:smoke:source-graph
pnpm db:smoke:memory-governance
pnpm db:smoke:retrieval-substrate
pnpm db:smoke:activation
pnpm db:smoke:codex-adapter
pnpm db:smoke:worker-jobs
git diff --check

Run/record forbidden checks:

test ! -d apps
test ! -d dashboard
test ! -d .krn

Also check, adapting to repo tooling:

grep -R "requiredSkills" packages/core && exit 1 || true
grep -R "from .*packages/db" packages/core && exit 1 || true
grep -R "any" packages/core/src && echo "review any findings" || true

Verify:

no dashboard;
no API;
no MCP server;
no broad workers;
no research layer;
no runtime markdown memory;
no separate vector/graph DB;
no full MemoryStore auto-mutation;
no source crawler;
no broad eval suite;
no forbidden dependencies;
core remains library-safe;
all smoke cleanup counts zero;
handoff first-screen readable.

Commit:

docs(run): record M22-M26 anti-rot audit
M26.12 — Final handoff

Update:

current run PROGRESS.md;
current run HANDOFF.md;
current run DECISIONS.md;
current run BLOCKERS.md;
current run VERIFICATION.md;
docs/handoff/handoff.md;
docs/handoff/blockers.md;
docs/handoff/verification.md.

Final handoff must state:

M22 status;
M23 status;
M24 status;
M25 status;
M26 status;
exact commits;
exact verification;
DB proof status;
persisted harness status;
source graph status;
memory governance status;
retrieval/search status;
activation status;
Codex adapter / worker skeleton status;
residual blockers;
not built;
next safest action.

Commit:

docs(handoff): update M22-M26 brain spine status

Final output must include:

Completed:
- ...

Commits:
- ...

Verification:
- ...

DB proof status:
- configured / unconfigured
- migrations proven / unproven
- pgvector proven / unproven

Persisted harness status:
- plan persistence proven / unproven
- evidence persistence proven / unproven

Source graph status:
- source artifacts persisted / unproven
- source claims persisted / unproven
- source-to-decision edges persisted / unproven
- source rejections persisted / unproven

Memory governance status:
- candidates persisted / unproven
- reviewed promotion proven / unproven
- memory records/versions persisted / unproven
- application feedback persisted / unproven
- anti-memory persisted / unproven

Retrieval/search status:
- search docs persisted / unproven
- lexical search proven / unproven
- pgvector readiness represented / unproven
- retrieval candidates persisted / unproven
- activation decisions persisted / unproven

Activation status:
- noisy fixture passed / unproven
- ContextAssembly inclusions persisted / unproven
- ContextAssembly exclusions persisted / unproven
- krn plan uses activation / unproven

Codex adapter / worker status:
- execution brief rendered / unproven
- hook expectations projected / unproven
- worker jobs enqueued / unproven
- worker job transitions proven / unproven

Residual blockers:
- ...

Not built:
- dashboard
- API
- MCP server
- broad workers runtime
- research layer
- runtime markdown memory
- separate vector/graph DB
- source crawler
- broad eval suite
- plugin package

Next safest action:
- one concrete action only

Commit:

docs(handoff): complete M22-M26 brain spine handoff
16. Priority Rules If Time Or Context Is Limited

Priority order:

M22 source graph persistence.
M22 source graph smoke + dogfood.
M23 memory governance schema/repository/smoke.
M23 memory promotion CLI and dogfood.
M24 retrieval substrate schema/repository/smoke.
M25 activation engine fixture/smoke.
M25 krn plan --persist activation integration.
M26 execution brief renderer.
M26 worker job skeleton.
Final anti-rot + handoff.

If running out of time or context:

finish current slice cleanly;
update run docs;
run available verification;
commit verified work;
skip to M26.12 Final handoff.

Do not leave half-written migrations or broken scripts without blocker documentation.

17. Stop Conditions

Stop and record blocker if next step requires:

dashboard;
API;
KRN MCP server;
broad worker runtime;
research layer;
source crawler;
separate vector/graph DB;
Redis/Kafka;
runtime markdown memory;
automatic memory mutation;
plugin packaging;
weakening TypeScript;
adding dependency without decision;
old repo topology import;
reading all historical docs;
broad eval tooling;
hidden semantic hook behavior;
destructive operations without explicit approval.
18. What M22–M26 Must Prove Together

By the end of the run, the ideal proof is:

krn plan --task "..." --persist
  -> persisted harness run
  -> source claims available
  -> memory candidates/records available
  -> retrieval candidates available
  -> activation selects bounded context
  -> execution brief renders Codex-facing payload
  -> evidence capture writes feedback candidates
  -> worker job skeleton can enqueue future maintenance

This run does not need to prove:

high-quality embedding retrieval;
large-scale graph traversal;
dashboard usefulness;
multi-client API;
MCP server;
autonomous research;
automatic memory quality;
production worker throughput.

This run must prove:

the objects exist;
the DB spine holds them;
the CLI can create/read them;
smoke tests prove persistence;
doctor reports readiness honestly;
no old failure modes returned.
19. Final Operator Reminder

Do not let the run become:

lots of tables
lots of commands
no useful spine

The valuable final shape is:

SourceGraph
  -> MemoryGovernance
  -> RetrievalSubstrate
  -> ActivationEngine
  -> CodexExecutionBrief
  -> EvidenceFeedback

One brain.
Typed objects.
Postgres-backed.
Evidence-gated.
Reviewable.
No theater.


---

# `GOAL.md`

```md
# GOAL.md — M22–M26 KRN Brain Spine

## Objective

Execute `PLAN.md` from M22 through M26 as far as safely possible.

Build the next final-pattern KRN brain spine:

```txt
M22 Source Graph persistence
  -> M23 Memory Governance persistence
  -> M24 Retrieval/Search substrate
  -> M25 Activation Engine v1
  -> M26 Codex Adapter execution brief + worker job skeleton

This is not MVP staging.

Each milestone must implement part of the final architecture through thin, verified slices.

Repository

Use:

/home/krn/coding/krn/active/mise-en-palace
Current Verified State

M20 proved local Postgres/pgvector/migrations/runtime smoke.

M21 proved persisted harness run spine:

OperatorIntent
  -> TaskContract
  -> HarnessPlan
  -> ContextAssembly
  -> EvidenceBundle
  -> ReviewAssessment
  -> FeedbackDelta

The worktree was reported clean on main...origin/main.

Product Doctrine

KRN is a Postgres-backed AI Engineering Harness OS for Codex.

Codex executes.
KRN governs activation, trust, execution, evidence, review, and learning.

Canonical flow:

OperatorIntent
  -> TaskContract
  -> HarnessPlan
  -> ContextAssembly
  -> CapabilityPlan
  -> CodexAdapterPlan
  -> ExecutionRun
  -> EvidenceBundle
  -> ReviewAssessment
  -> FeedbackDelta
  -> Memory / Source / Skill / Policy / Eval updates

Do not implement contracts disconnected from target infrastructure.

The target architecture remains:

PostgreSQL + pgvector as canonical KRN brain store;
Drizzle for schema/migrations;
Zod for IO/API/CLI boundaries;
Postgres full-text search + pgvector + relational edge tables for retrieval;
Postgres run events / outbox / worker jobs for audit and async skeletons;
Memory Core is Postgres-backed, not markdown and not .krn;
Source Graph is Postgres-backed;
CLI is an adapter;
Codex surfaces are adapters;
dashboard is a later read-model over typed objects, not current product proof.
Required Operational Skill Use

Use matching repo-local operational skills when their trigger applies.

Required or expected:

source-to-decision for M22 source claims, source edges, source rejections.
design-contract for M23 memory promotion and M24/M25 activation contracts.
investigate-codepath before wiring activation into existing krn plan.
typescript-type-safety for TypeScript public exports, DB schemas, Zod schemas, repositories, CLI input, and any unknown/any/cast boundary.
diff-risk-review before large schema/repository/CLI changes.
repair-loop for failing smoke tests.
handoff-compact for every milestone handoff and final handoff.

If a skill is unavailable, record that in run docs and continue with equivalent discipline. Do not create project-specific skill slop.

Hard Non-Goals

Do not create:

dashboard;
apps/;
public API;
KRN MCP server;
broad worker runtime;
broad research layer;
source crawler;
broad subagent system;
broad eval suite;
benchmark lane;
runtime markdown memory;
.krn runtime truth;
separate Qdrant/LanceDB/Neo4j/Elastic store;
Redis/Kafka queue;
plugin package;
custom prompt library;
automatic memory mutation;
old repo topology import.
Success Evidence

This goal is successful if the run leaves a verified repo state with as many completed milestones as possible, in order:

M22 Source Graph

Evidence:

SourceArtifact persists.
SourceClaim persists.
SourceDecisionEdge persists.
SourceRejection persists.
Source claims require mechanism, doesNotProve, supportType, trustTier, consumer.
pnpm db:smoke:source-graph passes.
krn doctor reports source graph readiness honestly.
M23 Memory Governance

Evidence:

MemoryCandidate persists.
Candidate promotion/rejection is explicit and reviewed.
MemoryRecord + MemoryRecordVersion persist.
MemoryApplication feedback persists.
AntiMemoryRecord persists.
No automatic memory mutation.
pnpm db:smoke:memory-governance passes.
krn doctor reports memory governance readiness honestly.
M24 Retrieval/Search

Evidence:

SearchDocument persists.
Lexical retrieval is proven.
pgvector readiness is represented.
RetrievalRun and RetrievalCandidate persist.
ActivationDecision / ContextExclusion records persist.
pnpm db:smoke:retrieval-substrate passes.
No separate vector/search/graph DB is added.
M25 Activation Engine

Evidence:

ActivationPolicy / ContextROI / TrustAssessment / ActivationTrace semantics exist.
Noisy brain fixture selects bounded high-signal context.
Exclusions are explicit.
krn plan --persist uses activation when DB is ready.
pnpm db:smoke:activation passes.
No context dump.
No requiredSkills core field.
M26 Codex Adapter + Worker Job Skeleton

Evidence:

ExecutionBrief renderer exists.
krn codex brief --run-id <id> or equivalent renders bounded Codex-facing brief.
Hook expectations are projected as adapter output, not hidden semantic logic.
WorkerJob schema/repository skeleton exists.
Worker jobs can be enqueued and transition states in smoke test.
No Codex execution runner.
No MCP server.
No broad worker runtime.
pnpm db:smoke:codex-adapter and pnpm db:smoke:worker-jobs pass if M26 is reached.
Verification Commands

Run before starting:

git status --short --branch
git log --oneline -12
pnpm typecheck
pnpm test
krn doctor

Run live DB checks when DB is available:

pnpm db:ready
pnpm db:smoke
pnpm db:smoke:harness-plan
pnpm db:smoke:harness-evidence

As milestones complete, add:

pnpm db:smoke:source-graph
pnpm db:smoke:memory-governance
pnpm db:smoke:retrieval-substrate
pnpm db:smoke:activation
pnpm db:smoke:codex-adapter
pnpm db:smoke:worker-jobs

Final audit should include:

git status --short --branch
git log --oneline -20
pnpm typecheck
pnpm test
krn doctor
pnpm db:ready
pnpm db:smoke
pnpm db:smoke:harness-plan
pnpm db:smoke:harness-evidence
git diff --check

And all available milestone smoke commands.

Run Ledger

Create/update:

docs/runs/2026-06-21-m22-m26-brain-spine/
  PROGRESS.md
  HANDOFF.md
  DECISIONS.md
  BLOCKERS.md
  VERIFICATION.md

Update these after every completed, blocked, or skipped slice.

Also update final global handoff files:

docs/handoff/handoff.md
docs/handoff/blockers.md
docs/handoff/verification.md
Context Loss Protocol

If context is lost or compacted, do not guess.

Recover by reading only:

AGENTS.md
GOAL.md
PLAN.md
docs/handoff/handoff.md
docs/handoff/blockers.md
docs/handoff/verification.md
docs/runs/2026-06-21-m22-m26-brain-spine/PROGRESS.md
docs/runs/2026-06-21-m22-m26-brain-spine/HANDOFF.md
docs/runs/2026-06-21-m22-m26-brain-spine/DECISIONS.md
docs/runs/2026-06-21-m22-m26-brain-spine/BLOCKERS.md
git log --oneline -12
files directly touched by the next unchecked slice.

Do not reread raw onboarding materials.
Do not read all historical docs.
Do not solve context loss with broader context.

Commit Rules

Use Semantic/Conventional Commit titles only.

Commit only verified slices.

Every commit must have:

clear scope;
completed behavior or docs;
verification recorded;
no hidden unrelated changes.
Stop Conditions

Stop and record a blocker if the next action requires:

dashboard;
API;
MCP server;
broad worker runtime;
research layer;
source crawler;
separate vector/graph/search DB;
Redis/Kafka;
runtime markdown memory;
automatic memory mutation;
plugin packaging;
weakening TypeScript;
dependency adoption without decision;
broad eval tooling;
old repo topology import;
destructive command without explicit approval.

If blocked, update BLOCKERS.md, run available verification, commit verified docs if appropriate, and leave final handoff.

Final Output

At the end, return:

Completed:
- ...

Commits:
- ...

Verification:
- ...

DB proof status:
- ...

Persisted harness status:
- ...

Source graph status:
- ...

Memory governance status:
- ...

Retrieval/search status:
- ...

Activation status:
- ...

Codex adapter / worker status:
- ...

Residual blockers:
- ...

Not built:
- dashboard
- API
- MCP server
- broad workers runtime
- research layer
- runtime markdown memory
- separate vector/graph DB
- source crawler
- broad eval suite
- plugin package

Next safest action:
- one concrete action only
Next Action

Start at PLAN.md M22.00.

Do not skip the run ledger.

Do not batch unrelated milestones into one monolithic commit.

If time/context is low, finish the current slice honestly and jump to final handoff.


---

# Co realnie ma się wydarzyć po tym planie

Ten run ma dać KRN pierwszy prawdziwy “mózgowy” spine po M21:

```txt
M21 persisted harness
  + M22 source-to-decision graph
  + M23 governed memory promotion
  + M24 retrieval substrate
  + M25 activation decisions
  + M26 execution brief / worker job skeleton

To nadal nie jest dashboard, API ani autopamięć. To jest zaczyn realnego brain store + activation layer, czyli dokładnie miejsce, w którym KRN zaczyna odróżniać się od “mamy linki i notatki”. Stare materiały jasno mówią, że source bez mechanizmu i decyzji to dekoracja, memory w plikach to pseudo-memory, a eval/dashboard bez review-burden evidence to theater.

Najważniejsze: po powrocie sprawdzasz tylko:

git status --short --branch
git log --oneline -20
pnpm typecheck
pnpm test
krn doctor
pnpm db:ready

plus smoke’y, które M22–M26 faktycznie dodały. Then patrzysz w docs/runs/2026-06-21-m22-m26-brain-spine/HANDOFF.md, a nie w historię czatu.
