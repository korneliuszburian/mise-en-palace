# Memory Eval Design

Status: current design map for turning agent-memory research into KRN eval
work. This is not a benchmark backlog and not a research archive.

## Decision

KRN memory quality should be proven by local coding-agent tasks where memory,
source evidence, feedback, and forgetting change what Codex can do compared
with a no-memory baseline.

The next eval work should move from one controlled company-pattern hit toward
four falsifiable axes:

| Axis | Local question | Current surface | Next eval candidate |
| --- | --- | --- | --- |
| Accurate retrieval | Can KRN select the specific company/source pattern needed for a task? | `pnpm eval:memory-advantage` | Done for the current proxy: one case includes a tempting distractor and a simple lexical retrieval baseline. |
| Test-time learning | Can a prior run's reviewed feedback improve a later task? | DB brain-loop smoke, memory application feedback | Multi-session eval: first task creates reviewed evidence; second task must use it. |
| Long-range understanding | Can KRN carry evidence/source decisions across distant slices without broad rereads? | source decisions, run readback, activation | Fixture with old evidence, later source decision, and no active-doc clue. |
| Selective forgetting | Can KRN block stale/hurt/contradicted memory before context assembly? | anti-memory and stale activation guards | Memory advantage negative case where baseline uses tempting stale memory. |

## Source Decisions Applied

| Source | Decision | KRN mechanism kept | Local consumer | Falsifier |
| --- | --- | --- | --- | --- |
| `docs/KRN_SOURCES.md#memoryagentbench` | adopt | Four memory-agent competencies: retrieval, test-time learning, long-range understanding, selective forgetting. | Future memory eval fixtures and KRN behavior cases. | The suite can pass while missing one competency. |
| `docs/KRN_SOURCES.md#memoryarena` | adopt | Interdependent multi-session tasks where earlier feedback must shape later action. | Follow-up multi-session memory eval Bead. | A case can be solved from one prompt or preselected context. |
| `docs/KRN_SOURCES.md#mem0` | lab_test | Extract/consolidate/retrieve salient facts; compare memory against baseline and cost. | Memory-advantage readback and future cost metrics. | Claims advantage without selected evidence ids or cost/readback overhead. |
| `docs/KRN_SOURCES.md#locomo` | adopt | Single-hop, multi-hop, temporal, adversarial recall split. | Temporal/source-grounded and adversarial negative fixtures. | Suite only tests positive single-hop recall. |
| `docs/KRN_SOURCES.md#memory-in-the-age-of-ai-agents` | adopt | Separate factual, experiential, and working memory lifecycles. | Kernel layer naming and eval routing. | One undifferentiated "brain memory" store returns. |
| `docs/KRN_SOURCES.md#memory-for-autonomous-llm-agents` | adopt | Write-manage-read loop with contradiction, cost, privacy, and forgetting risks. | Worker decision and memory eval framing. | Write automation ships before local read/write/manage benefit is proven. |
| `docs/KRN_SOURCES.md#mirix` | defer | Memory-type separation as a pressure test, not a multi-agent runtime. | Future architecture decision only if text/code memory advantage demands it. | KRN adds multimodal or multi-agent memory before local text/code proof. |

## Adopted Eval Candidates

### Multi-Session Memory Advantage

Follow-up Bead: `mise-en-palace-jmfl`.

Create a deterministic eval where:

1. Session A captures a company pattern, review result, or source decision as
   evidence.
2. The memory/source object is available only through the KRN store/retrieval
   path.
3. Session B asks a related coding task that a no-memory baseline misses.
4. The eval reports selected memory/source ids, application outcome, and
   proof/non-proof boundaries.

This targets MemoryArena-style memorization plus action without importing the
external task gym.

### Memory Competency Matrix

Follow-up Bead: `mise-en-palace-87w0`, blocked by `mise-en-palace-jmfl`.

Extend `pnpm eval:memory-advantage` or a sibling deterministic eval with four
named case groups:

- `retrieval`: needed memory/source selected despite distractors;
- `learning`: prior reviewed feedback changes later selected context;
- `long_range`: old evidence remains reachable without broad docs rereads;
- `forgetting`: stale or hurt memory is excluded before context assembly.

This targets MemoryAgentBench without claiming benchmark equivalence.

### Distractor And Simple Retrieval Baseline

Follow-up Bead: `mise-en-palace-3f1e`.

`pnpm eval:memory-advantage` now reports a `baseline_simple_retrieval`
readback for each case. The retrieval case includes a tempting local-only
distractor that the simple lexical baseline selects first, while KRN still
selects the governed memory/source id through the brain/source command path.

This proves only a local foil against no-memory and naive lexical selection. It
does not prove production retrieval quality or arbitrary Codex superiority.

### Temporal And Adversarial Recall

Follow-up Bead: `mise-en-palace-87w0`, blocked by `mise-en-palace-jmfl`.

Add negative cases where:

- an old pattern was later invalidated;
- a source claim is temporally stale;
- a tempting but unsupported memory conflicts with accepted source evidence.

The expected behavior is abstention or explicit exclusion, not a confident
answer.

### Cost And Evidence Readback

Follow-up Bead: `mise-en-palace-ebxq`, blocked by `mise-en-palace-jmfl`.

For memory-advantage cases, expose:

- selected memory ids;
- selected source claim/document ids;
- excluded stale/noise ids when applicable;
- approximate selected-context token/readback size;
- baseline class compared (`no_memory`, `simple_retrieval`, or
  `broad_context`).

This keeps Mem0-style efficiency as a local measurement rather than a borrowed
claim.

## Rejections

- Do not build a broad external benchmark platform now.
- Do not add LLM-as-judge scoring for memory quality before deterministic
  local cases fail or pass.
- Do not add multimodal memory, screen capture, or multi-agent memory roles
  before text/code memory advantage needs them.
- Do not treat papers as proof that KRN memory helps Codex; they create local
  hypotheses only.

## Proof Boundary

Proves:

- current research intake produced local eval candidates with consumers and
  falsifiers;
- future memory eval work has a smaller target than "build a benchmark";
- KRN should test memory advantage through retrieval, learning, long-range
  carryover, and forgetting.

Does not prove:

- KRN has achieved those behaviors beyond the currently implemented proxy eval;
- external benchmark results transfer to KRN;
- a worker runtime, dashboard, MCP, or broad benchmark lane is needed.
