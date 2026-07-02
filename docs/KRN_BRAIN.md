# KRN Brain Target Architecture

Status: target knowledge source.
Scope: what `mise-en-palace` is meant to become, how it strengthens Codex, and
which local decisions, patterns, algorithms, and papers shape the design.

This document is not a product-readiness claim. The repo is still a controlled
internal alpha. The target brain is the destination; current proof comes only
from implemented types, tests, DB smokes, reports, and CI gates.

## One-Sentence Definition

`mise-en-palace` is a KRN brain: a Codex operating layer that turns repeated AI
coding work into a source-grounded, memory-aware, reviewable, evidence-backed
execution loop.

Codex still writes and edits code. KRN decides what Codex should know, why that
context is allowed, what it must not infer, how the result is proven, and which
new knowledge can be reused later.

## What We Are Building

The final tool is not a prompt pack, dashboard, MCP server, benchmark lab, or
generic agent framework. It is a governed work loop around Codex:

```txt
operator intent
  -> task contract
  -> source and memory activation
  -> bounded Codex brief
  -> Codex implementation
  -> evidence capture
  -> review assessment
  -> feedback delta
  -> reviewable memory/source/eval candidates
  -> human or governed promotion/rejection
  -> next run reuses or rejects the knowledge
```

The key product promise:

```txt
same repo + same operator + many real tasks
  -> less context rereading
  -> fewer stale assumptions
  -> stronger source grounding
  -> lower review burden
  -> better repeatability after compaction
  -> reusable decisions instead of markdown archaeology
```

## Core Law

```txt
Do not build more context.
Build the machinery that selects, applies, verifies, and forgets context.
```

This is why the brain is store-backed and review-gated. A larger prompt is not
memory. A long markdown ledger is not memory. A green smoke test is not product
truth. A selected source is not automatically trusted. A reflection is not
automatic memory mutation.

## Codex Without KRN

```txt
             Human
               |
               v
       free-form prompt
               |
               v
             Codex
               |
       +-------+--------+
       |                |
       v                v
   code edits       explanation
       |
       v
  manual review
       |
       v
  scattered notes / chat history / maybe docs
```

Typical failure modes:

```txt
context rot:
  old plan, stale chat, random docs, and current task all compete

source drift:
  Codex cites or follows claims without source -> mechanism -> decision

memory illusion:
  useful lessons stay in chat or markdown and are not retrieved next run

review burden:
  reviewer must reconstruct what changed, why, and what was actually proven

repeatability gap:
  one good run does not become a governed reusable pattern

overconfidence:
  tests passed, but no one states what the tests do not prove
```

## Codex With KRN

```txt
                         Human / Operator
                                |
                                v
                        OperatorIntent
                                |
                                v
                         TaskContract
                                |
                                v
      +------------------ Harness / Activation ------------------+
      |                                                          |
      |  Memory Core        Source Graph       Patterns          |
      |      |                 |                / Recipes         |
      |      v                 v                   |             |
      |  candidates ----> admission control <------'             |
      |                     |                                    |
      |                     v                                    |
      |              ContextAssembly                             |
      +---------------------+------------------------------------+
                            |
                            v
                    Codex ExecutionBrief
               objective / constraints / context
               proof boundaries / forbidden writes
               expected evidence / rollback / next action
                            |
                            v
                          Codex
                            |
                            v
                       implementation
                            |
                            v
                      EvidenceBundle
                            |
                            v
                    ReviewAssessment
                            |
                            v
                      FeedbackDelta
                            |
            +---------------+----------------+
            |               |                |
            v               v                v
    MemoryCandidate   SourceDecision    EvalCandidate
            |               |                |
            +-------- review gate -----------+
                            |
                            v
               accepted / rejected / deferred
                            |
                            v
                 next run activation changes
```

The core strengthening effect is that Codex receives a smaller but stronger
working set:

```txt
Without KRN:
  many tokens, unclear authority, stale context, vague proof

With KRN:
  selected tokens, named authority, exclusions, non-proof, feedback loop
```

## The Brain As A System

```txt
KRN Brain
|
+-- Context selection
|   +-- retrieval candidates
|   +-- activation admission control
|   +-- inclusions, exclusions, abstentions
|   +-- token and review-cost budget
|
+-- Memory Core
|   +-- reviewed MemoryRecord
|   +-- MemoryCandidate
|   +-- AntiMemoryRecord / AntiMemoryCandidate
|   +-- MemoryApplication feedback
|
+-- Source graph
|   +-- source artifacts and chunks
|   +-- source claims
|   +-- source decisions and rejections
|   +-- support, contradiction, qualification, temporal edges
|
+-- Evidence and review
|   +-- EvidenceBundle
|   +-- command provenance
|   +-- changed-file ownership
|   +-- proof / does-not-prove boundaries
|   +-- ReviewAssessment
|   +-- FeedbackDelta
|
+-- Codex adapter
|   +-- ExecutionBrief rendering
|   +-- skill hints
|   +-- hook expectations
|   +-- goal / exec-plan references
|   +-- untrusted-context warnings
|
+-- Pattern and recipe memory
|   +-- retained source-to-decision patterns
|   +-- reference implementation recipes
|   +-- drift checks over local exemplars
|   +-- usefulness feedback
|
+-- Eval and golden behavior
|   +-- GoldenTask fixtures
|   +-- brain-battle invariants
|   +-- Promptfoo adapter smoke
|   +-- proof-boundary manifest
|
+-- Worker contracts
    +-- maintenance job descriptions
    +-- outbox / worker job persistence
    +-- candidate-only previews
    +-- no daemon until runtime proof exists
```

## Canonical Typed Spine

The durable domain spine is:

```txt
OperatorIntent
  -> TaskContract
  -> HarnessPlan
  -> ContextAssembly
  -> ExecutionContract
  -> CodexAdapterPlan
  -> ExecutionRun
  -> EvidenceBundle
  -> ReviewAssessment
  -> FeedbackDelta
  -> MemoryCandidate / SourceDecision / EvalCandidate
```

`ContextAssembly` is the domain object. A prompt or context packet is only a
rendered artifact from it. This prevents prompt text from becoming the system of
record.

## Package Shape

```txt
packages/core
  pure domain types, IDs, memory/source/evidence/review/activation contracts

packages/schema
  unknown-first validation for CLI/file/env/JSON/API boundaries

packages/db
  Drizzle/Postgres/pgvector schema, migrations, repositories, readiness, smokes

packages/harness
  activation, compiler, golden behavior, eval adapters, read models

packages/codex-adapter
  renders Codex-facing briefs and related Codex-native surfaces

packages/workers
  worker contracts and candidate previews; no production daemon yet

packages/cli
  operator commands and readback; adapter, not architecture owner
```

Import direction:

```txt
core
schema -> core
db -> core, schema
harness -> core, schema
codex-adapter -> core, harness
workers -> core, schema, db
cli -> schema, harness, codex-adapter, db
```

## Algorithms And Mechanisms

### 1. Source-To-Decision Gate

Every retained source or pattern must pass:

```txt
source
  -> mechanism
  -> KRN implication
  -> decision or rejection
  -> consumer
  -> falsifier
  -> does-not-prove
```

Mechanism:

```txt
if source has no mechanism:
  reject as decorative
if mechanism has no KRN implication:
  keep as note, not retained knowledge
if implication has no consumer:
  defer or reject
if decision has no falsifier:
  reject as dogma
```

Why it strengthens Codex:

```txt
Codex no longer receives "interesting links".
Codex receives decisions with authority, scope, consumer, and failure test.
```

### 2. Activation As Admission Control

Retrieval finds candidates. Activation decides whether they may enter context.

```txt
retrieve memory/source/pattern candidates
  -> score rough relevance
  -> reject stale / contradicted / unsupported / low-trust items
  -> apply anti-memory blocks
  -> enforce token and review-cost budget
  -> emit inclusions and exclusions
  -> abstain if nothing is safe enough
```

Important rule:

```txt
ranking is not permission
```

Activation must preserve:

```txt
included because:
  expectedUse, trust, source support, temporal validity

excluded because:
  stale, contradicted, over budget, weak evidence, low trust, duplicate,
  anti-memory, unsupported source claim
```

### 3. Evidence Proof / Non-Proof Boundary

Every useful proof must state what it does not prove.

```txt
command evidence:
  provenance = default_template | operator_reported | captured_output_file |
               command_runner | external_log

changed files:
  intended | unrelated | unknown

review risk:
  diff risk + review burden + rollback clarity + command completeness

proof boundary:
  proves X
  does not prove Y
```

Why it strengthens Codex:

```txt
Codex output stops being treated as truth because it looks complete.
Review sees exact evidence and exact non-evidence.
```

### 4. Observation And Reflection As Staging

Observation and reflection are not memory. They are staging records.

```txt
raw event / run / diff / source / review
  -> Observation
  -> ReflectionRecord
  -> MemoryCandidate | SourceClaim | AntiMemoryCandidate | EvalCandidate
  -> review gate
  -> durable accepted state or rejection
```

Forbidden:

```txt
reflection -> MemoryRecord directly
observation -> MemoryRecord directly
worker preview -> MemoryRecord directly
```

### 5. Memory Lifecycle

```txt
candidate proposed
  -> reviewability assessed
  -> accepted | rejected | deferred
  -> MemoryRecord
  -> activated in later run
  -> application feedback recorded
  -> helped | neutral | noise | stale | hurt
  -> update review signals
  -> keep | revise | invalidate | anti-memory candidate
```

Memory must carry:

```txt
lineage
confidence
validity / TTL / invalidation rule
owner
application guidance
feedback counters
source support
review status
```

### 6. Anti-Memory

Anti-memory stores what must not be reused.

```txt
old inference becomes false / unsafe / stale / overgeneralized
  -> AntiMemoryCandidate
  -> review
  -> AntiMemoryRecord
  -> activation block or warning
```

Why it matters:

```txt
normal memory says "remember this"
anti-memory says "do not infer this again"
```

### 7. Temporal Source Claim Graph

Source truth changes over time. KRN models that as reviewed source-claim edges.

```txt
SourceClaim A
  supports / contradicts / qualifies / depends_on / supersedes / duplicates
  narrows / invalidates / expires
SourceClaim B
```

Activation must understand temporal pressure:

```txt
if claim is expired:
  exclude or require refresh
if claim is invalidated:
  block or warn
if claim is narrowed:
  use only inside scope
if claim is superseded:
  prefer newer accepted claim for the named consumer
```

### 8. Pattern And Recipe Retention

KRN uses source-backed patterns and local reference recipes to avoid rewriting
the same instructions.

```txt
external practitioner pattern or local exemplar
  -> source-to-decision map
  -> local reference implementation
  -> checksum over selected code/docs
  -> failing drift test
  -> future task can clone the approach
```

The recipe lab currently proves only one bounded mechanism:

```txt
selected local code/docs changed
  -> checksum mismatch
  -> drift test fails
```

It does not prove recipe truth, source truth, semantic quality, or product
readiness.

### 9. Eval Candidate Pipeline

Evaluations are not added because they look smart. They come from traces.

```txt
real run trace
  -> evidence
  -> failure or repeated risk
  -> EvalCandidate
  -> golden task or Promptfoo smoke only when bounded
  -> proof-boundary manifest says what the gate proves
```

Promptfoo is an adapter smoke here, not behavior truth.

### 10. Worker Boundary

Workers are currently contracts and previews, not a daemon.

```txt
maintenance need
  -> job contract
  -> input schema
  -> allowed writes
  -> forbidden writes
  -> idempotency key pattern
  -> persisted worker_job / outbox event
  -> future one-shot executor proof
```

Current rule:

```txt
no background loop
no autonomous Memory Core writes
no worker daemon until idempotency, locks, retry, failure, and write gates exist
```

## Paper And Source Map

### Official Codex / OpenAI Sources

```txt
AGENTS.md docs
  mechanism: durable repo instructions
  KRN decision: keep AGENTS thin; point to kernel docs and active plan

Skills docs
  mechanism: reusable workflows with progressive disclosure
  KRN decision: repo-local skills are engineering disciplines, not prompt blobs

Subagents docs
  mechanism: bounded agents with separate context
  KRN decision: lab-test only for narrow review/exploration roles

Hooks docs
  mechanism: deterministic lifecycle command handlers
  KRN decision: future mechanical gates only; no hidden semantic architecture

MCP docs
  mechanism: typed tool/resource boundary
  KRN decision: later KRN MCP server only after CLI/store contracts prove need

Codex goals / ExecPlans / prompting guide
  mechanism: persistent objectives, discoveries, validation, constraints
  KRN decision: GOAL/PLAN/PLANS split and bounded task contracts

Agent improvement loop
  mechanism: traces + feedback -> eval/improvement
  KRN decision: eval candidates come from real traces, not benchmark theater

Memory compaction
  mechanism: separate working context from durable memory
  KRN decision: store-backed selected memory, not markdown runtime memory
```

### Papers

```txt
MemGPT
  mechanism: virtual context management over memory tiers
  KRN use: activation selects a bounded working set from slower durable memory
  rejection: do not copy implementation or use markdown as memory

Reflexion
  mechanism: feedback/reflection improves later trials without weight updates
  KRN use: feedback becomes reviewable memory/source/eval candidates
  rejection: no autonomous reflection writes to final Memory Core

Self-RAG
  mechanism: adaptive retrieval and critique of retrieved evidence
  KRN use: brain-QA hypotheses for retrieve / abstain / critique / insufficient
  rejection: no trained reflection-token model or hidden semantic hook now

GraphRAG
  mechanism: corpus-level questions may need entity graph/community summaries
  KRN use: future graph-brain v0 over source claims, edges, and summaries
  rejection: no broad graph platform, dashboard, or crawler now

HippoRAG
  mechanism: graph traversal/ranking can support multi-hop retrieval
  KRN use: preserve claim/entity edges for future multi-hop evaluation
  rejection: no separate graph DB or PageRank system before local falsifier

Towards Autonomous Memory Agents
  mechanism: active acquisition, validation, curation, and cost-aware memory
  KRN use: candidate-only acquisition/escalation lanes for missing evidence
  rejection: no autonomous Memory Core mutation, crawler, or daemon
```

### Competitor / Practitioner / Local Sources

```txt
Mastra Observational Memory
  mechanism: event-derived observations + reflection keep context bounded
  KRN use: observation/reflection staging layer
  rejection: source-reported benchmark numbers are not KRN product proof

Polubis / reference implementation recipe idea
  mechanism: maintain one high-quality exemplar; generate/align future code by
             cloning proven structure rather than rereading large markdown docs
  KRN use: local reference recipe lab with checksum drift tests
  rejection: no recipe platform, crawler, skill zoo, or unreviewed clone runtime

TypeScript official docs and Total TypeScript public sources
  mechanism: unknown-first boundaries, narrowing, exhaustiveness, domain types
  KRN use: make wrong authority/provenance/lifecycle states hard to express
  rejection: no broad type rewrite for style alone

PostgreSQL row locking docs
  mechanism: `FOR UPDATE SKIP LOCKED` can support queue-like row claiming
  KRN use: first candidate for future one-shot worker executor proof
  rejection: no daemon or separate queue until proven necessary
```

## How KRN Strengthens Codex

### 1. It Turns Prompts Into Contracts

Without KRN:

```txt
"Fix this and be careful"
```

With KRN:

```txt
objective:
  exact task
constraints:
  allowed writes, forbidden writes, non-goals
context:
  selected memory/source/patterns with expectedUse
warnings:
  untrusted context, anti-memory, stale claims
evidence:
  required commands and proof/non-proof
stop condition:
  what Codex must not do past this slice
rollback:
  how to undo
```

### 2. It Gives Codex Better Context, Not More Context

```txt
all possible docs/history
  -> too much
  -> stale
  -> contradictory
  -> expensive to review

activated context
  -> selected
  -> source-backed
  -> scoped
  -> warnings included
  -> exclusions recorded
```

### 3. It Converts Work Into Reusable Knowledge

```txt
run result
  -> evidence
  -> review
  -> feedback
  -> candidate
  -> reviewed memory/source/pattern
  -> next run activation
```

The next Codex session does not need the original chat. It needs the reviewed
decision, source, falsifier, and application guidance.

### 4. It Lowers Review Burden

```txt
reviewer asks:
  what changed?
  why?
  what proves it?
  what does not prove it?
  what source authorized it?
  what future memory should change?
  what should never be inferred again?

KRN answer:
  EvidenceBundle + ReviewAssessment + FeedbackDelta + candidates
```

### 5. It Prevents Memory From Becoming Mythology

```txt
memory without lineage:
  "we decided this"

KRN memory:
  claim
  lineage
  source support
  confidence
  validity
  invalidation
  application guidance
  feedback history
  anti-memory conflicts
```

## Current Proof Versus Target

### Already Grounded

```txt
strict TypeScript workspace
Postgres/pgvector-oriented schema and DB smokes
core Memory/Source/Evidence/Activation contracts
Codex brief renderer
GoldenTask and brain-battle invariant tests
Promptfoo bounded smoke
Fallow quality gate
source-to-decision retained patterns
reference recipe drift lab
package-local __tests__ topology pilot
```

### Still Not Fully Proven

```txt
full governed product loop:
  evidence -> observation -> reflection -> candidates -> review -> memory
  -> activation -> golden proof

real second-operator proof
production worker executor
full memory pruning lifecycle
source taxonomy normalization
complete ID/schema canonicalization
provider-neutral LLM adapter contract
dashboard/API/MCP product surfaces
graph/ingest/heartbeat/consensus vertical loops
```

## Target End-State ASCII Map

```txt
                              +------------------+
                              |  Operator / Repo  |
                              +---------+--------+
                                        |
                                        v
                              +------------------+
                              |  TaskContract    |
                              +---------+--------+
                                        |
                                        v
        +----------------------+----------------------+----------------------+
        |                                             |                      |
        v                                             v                      v
+---------------+                           +----------------+      +---------------+
| Memory Core   |                           | Source Graph   |      | Pattern Brain |
| reviewed      |                           | claims/edges   |      | recipes/cards |
| memories      |                           | decisions      |      | usefulness    |
+-------+-------+                           +--------+-------+      +-------+-------+
        |                                            |                      |
        +---------------------+----------------------+----------------------+
                              |
                              v
                    +---------------------+
                    | Activation Engine   |
                    | admission control   |
                    +----------+----------+
                               |
             +-----------------+-----------------+
             |                                   |
             v                                   v
   +-------------------+               +--------------------+
   | Context Inclusions|               | Context Exclusions |
   | expectedUse       |               | reason / warning   |
   +---------+---------+               +--------------------+
             |
             v
   +-------------------+
   | ExecutionBrief    |
   | for Codex         |
   +---------+---------+
             |
             v
   +-------------------+
   | Codex edits code  |
   +---------+---------+
             |
             v
   +-------------------+
   | EvidenceBundle    |
   +---------+---------+
             |
             v
   +-------------------+
   | ReviewAssessment  |
   +---------+---------+
             |
             v
   +-------------------+
   | FeedbackDelta     |
   +---------+---------+
             |
             v
   +-------------------+-------------------+-------------------+
   | MemoryCandidate   | SourceDecision    | EvalCandidate     |
   +---------+---------+---------+---------+---------+---------+
             |                   |                   |
             +-------------------+-------------------+
                                 |
                                 v
                         +---------------+
                         | Review Gate   |
                         +-------+-------+
                                 |
                                 v
                       accepted / rejected
                                 |
                                 v
                         next activation
```

## What The Brain Must Refuse

```txt
refuse dashboard-first work
refuse broad benchmark theater
refuse runtime markdown memory
refuse source hoarding
refuse autonomous Memory Core mutation
refuse hidden worker daemon
refuse prompt-only safety contracts
refuse copying external repo topology blindly
refuse giant root docs as active context
refuse "green test = product-ready" claims
```

## Senior-Grade Completion Criteria

The target brain is credible only when these become true:

```txt
1. One full product loop is executable and tested end-to-end.
2. Memory promotion cannot bypass review gates.
3. Activation excludes stale, unsupported, contradicted, or anti-memory-blocked
   context with inspectable reasons.
4. Evidence capture records command provenance and does-not-prove boundaries.
5. Source decisions require mechanism, KRN implication, consumer, and falsifier.
6. Pattern/recipe reuse has local verification and drift falsifiers.
7. DB runtime truth is separated from static type/schema truth.
8. Promptfoo/Fallow/brain-battle/DB smokes report what they prove and do not
   prove under one verification manifest.
9. CLI/readback surfaces reduce review burden instead of exposing every internal
   noun.
10. Root active context stays compact enough that Codex does not need broad
    historical rereads to resume.
```

## Short Mental Model

```txt
Codex is the hands.
KRN is the working memory, source librarian, reviewer, and continuity layer.

Codex makes changes.
KRN decides what context is admitted, what evidence is required, what was
learned, what must not be learned, and what can safely influence the next run.
```

## Source Boundaries

This document uses:

- repo-local source: `docs/KRN_KERNEL.md`, `README.md`,
  `docs/STATE_OF_THE_ART.md`, package-boundary docs, ADRs, retained patterns,
  Brain-QA sketch, and recent audit-hardening reports;
- official OpenAI/Codex docs already retained in `docs/KRN_SOURCES.md`;
- papers retained in `docs/KRN_SOURCES.md`: MemGPT, Reflexion, Self-RAG,
  GraphRAG, HippoRAG, Towards Autonomous Memory Agents;
- competitor/practitioner sources retained in `docs/KRN_SOURCES.md` and
  retained-pattern cards: Mastra Observational Memory and the user-provided
  Polubis/reference-recipe workflow.

This document does not prove those papers transfer to KRN, that Codex follows a
brief, that memory improves product work, or that the repo is product-ready.
It is a target architecture map and knowledge source for future review-gated
implementation.
