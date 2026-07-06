# Memory Eval Research Refresh

Status: current source-to-decision refresh for `mise-en-palace-micq`.

## Verdict

KRN's memory proof should stay a coding-agent decision-packet benchmark, not a
generic chatbot memory benchmark.

The research direction is aligned with the current kernel, but the next proof
must move from "packet quality is deterministic" toward "the packet changes a
Codex-facing coding decision and can be checked after output." Raw recall is not
the win condition. A maintained notes file can tie recall. KRN's claimed edge is
governed context: evidence refs, decision support, stale exclusion, rejected
paths, selected-context cost, and explicit non-proof.

## Source Decisions

| Source | Mechanism | KRN implication | Decision | Falsifier |
| --- | --- | --- | --- | --- |
| MemoryAgentBench, arXiv:2507.05257 | Memory agents should be evaluated across accurate retrieval, test-time learning, long-range understanding, and selective forgetting in incremental multi-turn settings. | `eval:memory-advantage` must keep a visible competency matrix and fail if future cases lose one of these axes. | Adopt as the local competency taxonomy, not as an external benchmark import. | The eval can pass while one competency has zero cases. |
| Mem0, arXiv:2504.19413 | Memory systems should compare against RAG/full-context baselines and expose cost/latency/token efficiency. | KRN should keep selected evidence ids and context-size/cost readback, and add thresholds only where local dogfood shows cost matters. | Lab-test cost/readback metrics; do not copy Mem0 architecture. | KRN claims memory advantage without selected ids, baseline comparison, or context-cost readback. |
| LoCoMo, arXiv:2402.17753 | Long-term memory benchmarks separate single-hop, multi-hop, temporal, and adversarial recall; temporal reasoning remains hard. | KRN evals need temporal/stale/adversarial source-memory cases, not only positive recall. | Adopt as case-shape pressure, not as product workload. | The suite only tests obvious positive single-hop recall. |
| MemGPT, arXiv:2310.08560 | Treat context as a managed working set over memory tiers instead of dumping all history into prompt. | KRN should continue bounded context assembly over store-backed memory/source evidence, not markdown runtime memory or always-on ledgers. | Adopt the working-set principle; reject copying a memory-manager runtime now. | A future win comes from loading broad history rather than selected governed context. |
| ARES, arXiv:2311.09476 | RAG evaluation separates context relevance, answer faithfulness, and answer relevance. | KRN's live-output checker should separate selected-context relevance from Codex output obedience/faithfulness. | Lab-test as output-evidence dimensions for `we82`. | A live eval reports "Codex used memory" without checking output evidence against the selected packet. |
| Awesome Memory for Agents taxonomy | Distinguishes persistent long-term memory, outcome-validated experience, and long-horizon working context. | KRN should keep MemoryRecord, SourceDecision/rejection, and execution-context packets separate. | Adopt as naming pressure; reject undifferentiated "brain memory" language for eval results. | Future docs or CLI output collapse source truth, memory, notes, and active context into one authority bucket. |

## Current KRN Coverage

Already covered enough for internal alpha:

- `eval:notes-baseline` proves KRN's advantage over comprehensive notes is
  governance/staleness/rejection, not raw recall.
- `eval:decision-packet` proves deterministic pre-code packet quality on KRN
  task framings.
- `eval:second-repo-decision-packet` proves the same shape on one separate
  TypeScript target corpus without self-repo evidence contamination.
- `eval:memory-advantage` already reports retrieval, learning, long-range, and
  forgetting-style cases, plus source-disabled ablations and neutral cases.

Still missing before "brain is useful enough to rely on":

- live or recorded Codex-output obedience check;
- explicit memory-competency coverage gate that fails on missing axes;
- ingestion/product path for adding real decisions without hand-editing JSON;
- at least one more different target repo/failure mode;
- naming/API cleanup so the kernel surface reads like a decision engine, not a
  ceremonial control plane.

## Next Implementation Beads

1. `mise-en-palace-we82`: live or recorded Codex decision-packet obedience eval.
   This is the highest leverage because all current packet evals stop before
   output obedience.
2. Memory competency coverage gate: add a small deterministic checker around
   `eval:memory-advantage` that reports and gates the four MemoryAgentBench
   axes without importing the external benchmark.
3. `mise-en-palace-79ae`: decision corpus ingestion product path. This should
   turn real source-to-decision artifacts into corpus rows with validation,
   staleness/rejection support, and duplicate checks.
4. `mise-en-palace-79cm`: third-repo portability falsifier with a different
   failure mode than weak JSON boundaries.
5. `mise-en-palace-81i0`: naming/API surface audit, guided by the retained
   brain-layer boundary and the outcome-validated memory taxonomy.

## Non-Proof

This refresh does not prove KRN beats vanilla Codex in live coding, does not
prove source truth, does not prove arbitrary repo portability, does not justify
dashboard/API/MCP work, and does not justify copying Mem0, MemGPT, LoCoMo, or
MemoryAgentBench architecture wholesale.
