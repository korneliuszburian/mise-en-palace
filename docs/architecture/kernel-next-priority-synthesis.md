# KRN Next Priority Synthesis

Status: current queue seed after cleanup/refactor wave.

## Decision

Next work should maximize measured Codex advantage from memory, source, and
bounded context before adding product surfaces or more orchestration.

The immediate priority is a DB/store-backed memory advantage proof where KRN
selects useful company-pattern memory/source evidence through its own retrieval
path, not through fixture-provided selected context.

## Falsification Table

| Candidate next priority | Decision | Why | Falsifier |
| --- | --- | --- | --- |
| DB/store-backed memory advantage proof | do first | Directly tests whether KRN memory/source context beats baseline Codex on a company-pattern task. It extends the existing deterministic fixture proof toward live retrieval. | If KRN cannot select the needed memory/source without preselected fixture context, the brain is not yet a useful advantage layer. |
| Embedding model provenance in vector retrieval | do next / parallel only if small | Mixed-model vector comparison can silently corrupt retrieval quality. This is a retrieval correctness issue, not decoration, but it does not replace the strategic memory-advantage proof. | If vector retrieval already requires and records one model per query/candidate, no code change is needed. |
| MemoryEval / agent-memory research intake | do before broad eval expansion | Research can improve eval shape, but only if mapped to local mechanisms, consumer, and falsifier. | If source intake does not change a concrete eval or memory behavior, reject it as bibliography work. |
| Worker executor or worker downscope | defer | Workers remain contract/readback until memory/retrieval loops need background execution. | If a DB-backed memory advantage proof requires scheduled maintenance or job execution, reopen as a product dependency. |
| Eval cleanup / doc-lint split | defer | Useful hygiene, but lower ROI than proving memory advantage and retrieval correctness. | If eval signal blocks future memory advantage work or CI cost becomes material, reopen. |
| Dashboard/API/MCP | reject now | No evidence that UI/API surfaces are needed to prove the kernel advantage. | A concrete target workflow requires a surface that CLI/runbooks cannot exercise. |

## Seeded Beads

- `mise-en-palace-3jee`: memory: prove DB-backed memory advantage over baseline
- `mise-en-palace-qgt6`: retrieval: require embedding model provenance for vector search
- `mise-en-palace-54ty`: research: map MemoryEval-style patterns into KRN eval design
- `mise-en-palace-0ul0`: workers: decide contract-only package vs minimal executor
- `mise-en-palace-1na8`: eval: split behavior smoke from doc-lint smoke

## Bead Contract Summary

| Bead | Priority | Dependency | Acceptance summary | Verification | Non-goals |
| --- | --- | --- | --- | --- | --- |
| `mise-en-palace-3jee` | P1 | none | Baseline without memory misses; KRN retrieves/selects useful memory/source through store/retrieval, records evidence ids, usefulness, proof, and non-proof. | Focused tests, eval command, typecheck, Fallow if architecture changed, diff check. | Dashboard/API/MCP, worker daemon, broad benchmark, fixture-only selected context. |
| `mise-en-palace-qgt6` | P2 | none | Vector/hybrid retrieval requires or records `embeddingModelId`; readback exposes provenance; missing/mismatched behavior is tested or constrained. | Focused retrieval tests, typecheck, relevant DB smoke when available, diff check. | New vector provider, embedding generation service, broad retrieval rewrite. |
| `mise-en-palace-54ty` | P2 | none | Memory-eval sources map to mechanisms, KRN implications, consumers, falsifiers, and concrete local eval candidates; rejected patterns stay rejected. | Source/doc invariant checks; implementation Beads only for adopted mechanisms. | Bibliography work, broad benchmark platform, prompt theater, dashboard/API/MCP. |
| `mise-en-palace-0ul0` | P3 | none | Worker consumers and write-authority tables are audited; decision chooses contract/readback, downscope/rename, or minimal executor only with product-loop evidence. | `rg` evidence, decision record, follow-up Beads for chosen path. | Daemon/scheduler/leases/retries without product evidence. |
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
