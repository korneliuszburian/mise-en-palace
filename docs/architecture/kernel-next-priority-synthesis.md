# KRN Next Priority Synthesis

Status: current queue seed after cleanup/refactor wave.

Update 2026-07-04: `mise-en-palace-3jee` is complete as a deterministic
store-path proxy proof. `mise-en-palace-54ty` maps current agent-memory
research into local eval design and seeds `mise-en-palace-jmfl` as the next P1:
multi-session memory advantage through prior evidence and later retrieval.

## Decision

Next work should maximize measured Codex advantage from memory, source, and
bounded context before adding product surfaces or more orchestration.

The immediate priority is to extend the memory advantage proof from one
store-path proxy case into multi-session learning: a prior run creates reviewed
evidence, and a later run succeeds only if KRN selects and applies it.

## Falsification Table

| Candidate next priority | Decision | Why | Falsifier |
| --- | --- | --- | --- |
| DB/store-backed memory advantage proof | done, keep as proxy | Directly tests whether KRN memory/source context beats baseline Codex on a company-pattern task. It now routes through real brain/source command paths over an in-memory eval store. | If KRN cannot select the needed memory/source without preselected fixture context, the brain is not yet a useful advantage layer. |
| Multi-session memory advantage | do next | Agent-memory research points to interdependent sessions and test-time learning as the next useful proof shape. | If the case can be solved from one prompt or fixture-selected context, it is not memory advantage. |
| Embedding model provenance in vector retrieval | do next / parallel only if small | Mixed-model vector comparison can silently corrupt retrieval quality. This is a retrieval correctness issue, not decoration, but it does not replace the strategic memory-advantage proof. | If vector retrieval already requires and records one model per query/candidate, no code change is needed. |
| MemoryEval / agent-memory research intake | done for next slice | Research improved eval shape by mapping retrieval, test-time learning, long-range carryover, forgetting, temporal/adversarial recall, and cost readback into local Beads. | If source intake does not change a concrete eval or memory behavior, reject it as bibliography work. |
| Worker executor or worker downscope | done, keep contract/readback | `mise-en-palace-0ul0` rechecked current consumers and write-boundary tables; workers remain contract/readback until memory/retrieval loops need background execution. | If a DB-backed memory advantage proof requires scheduled maintenance or job execution, reopen as a product dependency. |
| Eval cleanup / doc-lint split | defer | Useful hygiene, but lower ROI than proving memory advantage and retrieval correctness. | If eval signal blocks future memory advantage work or CI cost becomes material, reopen. |
| Dashboard/API/MCP | reject now | No evidence that UI/API surfaces are needed to prove the kernel advantage. | A concrete target workflow requires a surface that CLI/runbooks cannot exercise. |

## Seeded Beads

- `mise-en-palace-3jee`: memory: prove DB-backed memory advantage over baseline
- `mise-en-palace-jmfl`: eval: add multi-session memory advantage case
- `mise-en-palace-qgt6`: retrieval: require embedding model provenance for vector search
- `mise-en-palace-54ty`: research: map MemoryEval-style patterns into KRN eval design
- `mise-en-palace-87w0`: eval: expand memory advantage competency cases
- `mise-en-palace-ebxq`: eval: expose memory advantage cost and baseline readback
- `mise-en-palace-0ul0`: workers: decide contract-only package vs minimal executor
- `mise-en-palace-1na8`: eval: split behavior smoke from doc-lint smoke

## Bead Contract Summary

| Bead | Priority | Dependency | Acceptance summary | Verification | Non-goals |
| --- | --- | --- | --- | --- | --- |
| `mise-en-palace-3jee` | P1 | none | Baseline without memory misses; KRN retrieves/selects useful memory/source through store/retrieval, records evidence ids, usefulness, proof, and non-proof. | Focused tests, eval command, typecheck, Fallow if architecture changed, diff check. | Dashboard/API/MCP, worker daemon, broad benchmark, fixture-only selected context. |
| `mise-en-palace-jmfl` | P1 | none | Session A creates reviewed evidence; Session B succeeds only when KRN selects and applies that memory/source signal through the real command path. | Focused eval tests, eval command, typecheck, diff check. | External benchmark gym, LLM-as-judge scoring, dashboard/API/MCP, worker runtime. |
| `mise-en-palace-qgt6` | P2 | none | Vector/hybrid retrieval requires or records `embeddingModelId`; readback exposes provenance; missing/mismatched behavior is tested or constrained. | Focused retrieval tests, typecheck, relevant DB smoke when available, diff check. | New vector provider, embedding generation service, broad retrieval rewrite. |
| `mise-en-palace-54ty` | P2 | none | Memory-eval sources map to mechanisms, KRN implications, consumers, falsifiers, and concrete local eval candidates; rejected patterns stay rejected. | Source/doc invariant checks; implementation Beads only for adopted mechanisms. | Bibliography work, broad benchmark platform, prompt theater, dashboard/API/MCP. |
| `mise-en-palace-87w0` | P2 | `mise-en-palace-jmfl` | Add retrieval, learning, long-range, and forgetting competency cases, including temporal/adversarial negatives. | Focused eval tests, eval command, typecheck, diff check. | Broad benchmark platform, LLM-as-judge scoring. |
| `mise-en-palace-ebxq` | P2 | `mise-en-palace-jmfl` | Expose selected ids, approximate selected-context size, and baseline class for memory advantage cases. | Focused eval tests, eval command, typecheck, diff check. | Borrowed Mem0 benchmark proof, broad metrics platform. |
| `mise-en-palace-0ul0` | P3 | none | Done: worker consumers and write-boundary tables audited; decision keeps contract/readback and rejects executor work without product-loop evidence. | `docs/runs/2026-07-04-worker-contract-decision-0ul0.md`; focused workers tests; typecheck. | Daemon/scheduler/leases/retries without product evidence. |
| `mise-en-palace-1na8` | P3 | none | Eval/docs smoke scripts are classified by behavior vs doc-lint; implement only if signal improves without losing a real gate. | Focused harness tests, eval smoke, typecheck, docs lint, diff check. | Broad benchmark lane, promptfoo revival, dashboard/API/MCP, historical rename sweep. |

## Proof Boundary

Proves:

- the post-cleanup queue is no longer empty;
- next work is tied to measured memory/source/context advantage;
- deferred areas have explicit falsifiers.

Does not prove:

- the memory advantage has been achieved through live retrieval;
- external memory-eval research applies to KRN without local falsification;
- worker runtime, dashboard/API/MCP, or broad eval cleanup should be built now.
