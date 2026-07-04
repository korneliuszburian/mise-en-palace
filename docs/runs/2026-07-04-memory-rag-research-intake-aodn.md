# Memory/RAG Research Intake

Date: 2026-07-04
Bead: `mise-en-palace-aodn`

## Purpose

Map current memory-agent and RAG research into KRN decisions without creating a
research archive. Each retained source below has a mechanism, KRN implication,
consumer, falsifier, and non-proof boundary.

## Source Decisions

```yaml
source_id: memory-agent-bench-2026
title: Evaluating Memory in LLM Agents via Incremental Multi-Turn Interactions
url: https://arxiv.org/abs/2507.05257
trust_tier: medium
source_class: papers
mechanism: Defines memory-agent evaluation around accurate retrieval, test-time learning, long-range understanding, and selective forgetting in incremental multi-turn interactions.
krn_implication: KRN memory advantage evals should report these competencies explicitly instead of only proving that selected ids appear in context.
decision_kind: adopt
decision: Use the four-competency taxonomy to shape the next company-pattern memory advantage task pack.
consumer: `mise-en-palace-5zhb`
falsifier: A memory advantage eval can pass while omitting retrieval, learning, long-range, or forgetting coverage and no test fails.
does_not_prove: Does not prove KRN memory quality, source truth, or that MemoryAgentBench tasks match our company coding workflows.
candidate_output:
  type: EvalCandidate
  reviewability: ready
next_action: Add competency labels and at least one forgetting/distractor case to the company-pattern eval pack.
```

```yaml
source_id: microsoft-state-bench-2026
title: STATE-Bench: benchmark for AI agent memory
url: https://opensource.microsoft.com/blog/2026/05/19/introducing-state-bench-a-benchmark-for-ai-agent-memory/
trust_tier: high
source_class: practitioner writing
mechanism: Evaluates whether memory improves realistic procedural, stateful enterprise tasks, not only whether retrieval returns an old fact.
krn_implication: KRN must prove memory changes a task decision or execution contract, not just selectedKnowledge readback.
decision_kind: adopt
decision: Require future KRN-vs-baseline comparators to report task-level decision improvement and deterministic state/assertion proxies.
consumer: `mise-en-palace-jeqw`
falsifier: A comparator reports only retrieved cards/source ids while no task-level contract, decision, state assertion, or failure mode changes.
does_not_prove: Does not prove STATE-Bench domains should be copied, that KRN needs an enterprise benchmark suite, or that live Codex execution is ready.
candidate_output:
  type: EvalCandidate
  reviewability: ready
next_action: Make the Codex-vs-KRN comparator report baseline contract, KRN contract, and expected evidence/state assertions.
```

```yaml
source_id: memoryarena-2026
title: MemoryArena: Benchmarking Agent Memory in Interdependent Multi-Session Agentic Tasks
url: https://digitaleconomy.stanford.edu/publication/memoryarena-benchmarking-agent-memory-in-interdependent-multi-session-agentic-tasks/
trust_tier: medium
source_class: papers
mechanism: Couples memory acquisition with later action in multi-session agent-environment loops; memory is useful only when earlier experience changes later task success.
krn_implication: KRN should keep proving Session A evidence/review/feedback can shape Session B planning/output contracts, rather than treating memory as static recall.
decision_kind: adopt
decision: Extend memory advantage fixtures toward interdependent multi-session tasks after the current company-pattern pack.
consumer: `mise-en-palace-5zhb`
falsifier: Multi-session KRN evals can pass when Session B does not depend on Session A evidence, feedback, or a changed decision.
does_not_prove: Does not prove web-navigation/browser tasks are needed, that KRN should build a broad environment simulator, or that memory mutation should be automatic.
candidate_output:
  type: EvalCandidate
  reviewability: ready
next_action: Add one Session A -> Session B dependency directly to `mise-en-palace-5zhb`; split only if a failing fixture proves the slice is too large.
```

```yaml
source_id: hipporag-2024
title: HippoRAG: Neurobiologically Inspired Long-Term Memory for Large Language Models
url: https://arxiv.org/abs/2405.14831
trust_tier: medium
source_class: papers
mechanism: Uses a knowledge graph plus Personalized PageRank-style traversal as a memory index for multi-hop retrieval over new experiences.
krn_implication: KRN source graph evals should test relation traversal and held-out relation shapes before adding heavier graph infrastructure.
decision_kind: lab_test
decision: Keep graph relation evals as bounded proxy tests; add broader multi-hop relation cases only when a product query needs them.
consumer: future source-graph eval Bead
falsifier: A source graph ranking eval claims graph-memory quality while relation-linked cases do not beat flat/no-relation baselines.
does_not_prove: Does not prove KRN needs a graph database, PPR runtime, or that graph retrieval improves our coding tasks.
candidate_output:
  type: EvalCandidate
  reviewability: needs_more_evidence
next_action: Create a follow-up only after company-pattern memory eval exposes a graph-dependent miss.
```

```yaml
source_id: a-mem-2025
title: A-MEM: Agentic Memory for LLM Agents
url: https://arxiv.org/abs/2502.12110
trust_tier: medium
source_class: papers
mechanism: Creates structured memory notes with contextual descriptions, keywords, tags, dynamic links, and memory evolution as new notes are integrated.
krn_implication: KRN can use structured note/link/evolution ideas as reviewable candidate generation, but automatic memory rewrites remain unsafe without MemoryReviewGate evidence.
decision_kind: lab_test
decision: Defer automatic memory evolution; use A-MEM only to shape future reviewed memory-candidate metadata and link proposals.
consumer: future memory candidate review Bead
falsifier: KRN auto-updates MemoryRecords or links without explicit review/evidence while claiming A-MEM as justification.
does_not_prove: Does not prove dynamic memory evolution is safe, that KRN should add autonomous reflection, or that agentic memory structure improves our local tasks.
candidate_output:
  type: MemoryCandidate
  reviewability: needs_more_evidence
next_action: Park until company-pattern eval shows a miss caused by missing memory links or stale memory attributes.
```

```yaml
source_id: memgpt-2023
title: MemGPT: Towards LLMs as Operating Systems
url: https://arxiv.org/abs/2310.08560
trust_tier: medium
source_class: papers
mechanism: Separates memory tiers and uses virtual-context management to page relevant information into a limited LLM context window.
krn_implication: KRN should keep explicit select/apply/verify boundaries and context-size readback rather than dumping memory into prompts.
decision_kind: adopt
decision: Treat KRN bounded context assembly and context-size reporting as the local implementation of memory-tier discipline.
consumer: `mise-en-palace-jeqw`
falsifier: A KRN execution contract includes broad memory dumps without selected ids, expected use, exclusions, or context-size readback.
does_not_prove: Does not prove MemGPT architecture should be copied, that Codex will obey paged context, or that KRN memory ranking is good.
candidate_output:
  type: EvalCandidate
  reviewability: ready
next_action: Ensure the Codex-vs-KRN comparator records selected context size and excludes broad dumps.
```

## Follow-Up Routing

- `mise-en-palace-5zhb`: consume MemoryAgentBench and MemoryArena decisions.
- `mise-en-palace-jeqw`: consume STATE-Bench and MemGPT decisions.
- HippoRAG reactivation hook: if `mise-en-palace-5zhb` or `mise-en-palace-jeqw`
  exposes a miss caused by missing relation traversal, create a source-graph
  eval Bead with HippoRAG as the source decision.
- A-MEM reactivation hook: if `mise-en-palace-5zhb` exposes a miss caused by
  missing memory links, stale memory attributes, or missing note metadata,
  create a memory-candidate review Bead with A-MEM as the source decision.
- No new graph/runtime Bead yet: HippoRAG and A-MEM stay lab-test/deferred until
  those concrete misses appear.

## Beads Verification

`mise-en-palace-5zhb` and `mise-en-palace-jeqw` were updated with source-derived
requirements. The auditable tracker diff is `.beads/issues.jsonl`; verify with:

```sh
git diff --cached -- .beads/issues.jsonl
```

## Non-Proof

This intake does not prove KRN memory quality, source truth, broad benchmark
quality, live Codex output quality, autonomous memory mutation safety, graph
retrieval quality, or product readiness.
