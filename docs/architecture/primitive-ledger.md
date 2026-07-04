# KRN Primitive Ledger

Status: compact live-vs-reduced boundary for current kernel work.

This ledger is docs guidance, not behavior proof. A `live` row still needs a
CI-invoked guard in `docs/architecture/behavior-gate-matrix.md`; a `rejected`,
`deprecated`, or `reduced` row is a routing boundary, not a deletion command.

## Live Kernel Primitives

| Primitive | Status | Governing evidence | Guard surface | Boundary |
| --- | --- | --- | --- | --- |
| select: activation retrieval, ranking, filtering | live | `docs/KRN_KERNEL.md`; `packages/harness/src/activation/activationEngine.ts`; `packages/harness/src/activation/rankCandidates.ts`; `packages/harness/src/activation/activationFilters.ts` | `pnpm eval:krn:smoke`; `pnpm db:smoke:brain-loop`; `pnpm db:smoke:source-graph` | Does not prove optimal ranking or arbitrary target coverage. |
| apply: compile plan, assemble context, record memory application | live | `docs/KRN_KERNEL.md`; `packages/harness/src/compiler/compileHarnessPlan.ts`; `packages/harness/src/activation/assembleContext.ts`; `packages/db/src/repositories/DrizzleMemoryRepository.ts` | `pnpm eval:krn:smoke`; `pnpm db:smoke:brain-loop` | Does not prove Codex used the context well. |
| verify: evidence, review, feedback, context, activation readback | live | `docs/KRN_KERNEL.md`; `packages/db/src/brainLoopSmoke.ts`; `packages/db/src/repositories/DrizzleHarnessRunRepository.ts` | `pnpm eval:krn:smoke`; `pnpm db:smoke:brain-loop` | Does not prove review judgment or product readiness. |
| forget: hurt/stale feedback and anti-memory exclusion | live | `docs/KRN_KERNEL.md`; `packages/core/src/memory.ts`; `packages/harness/src/activation/activationFilters.ts`; `packages/db/src/brainLoopSmoke.ts` | `pnpm eval:krn:smoke`; `pnpm db:smoke:brain-loop` | Does not prove autonomous pruning or complete stale-claim detection. |

## Supporting Live Surfaces

| Surface | Status | Governing evidence | Boundary |
| --- | --- | --- | --- |
| Codex execution brief renderer | live | `packages/codex-adapter/src/renderExecutionBrief.ts`; `pnpm eval:krn:smoke` | Renders constraints and proof boundaries; does not prove Codex obeys them. |
| Source artifact preview extraction | live, narrow | `packages/core/src/sourceArtifactPreviewExtraction.ts`; GoldenGate source artifact reuse case | Narrow source-to-claim extraction only; broad extractor churn is rejected without new evidence. |
| Brain ranking proxy eval | live, proxy | `pnpm eval:brain-ranking`; `tests/fixtures/brain-ranking/brain-ranking-eval.json` | Proxy labels are not broad ranking truth. |
| Source graph ranking proxy eval | live, proxy | `pnpm eval:source-graph-ranking`; `tests/fixtures/source-graph-ranking/source-graph-ranking-eval.json` | Proxy labels are not source truth or live pgvector quality. |
| Governed second-opinion Claude reviewer | live, advisory | `.agents/skills/second-opinion-claude/SKILL.md` | Reviewer output is advisory; validator and local evidence govern closure. |

## Reduced, Rejected, Or Deprecated Surfaces

| Surface | Status | Governing evidence | Routing rule |
| --- | --- | --- | --- |
| Broad dashboard/API/MCP/product surface | rejected | `docs/KRN_KERNEL.md`; root active plans | Do not build before live kernel primitives need it. |
| Worker daemon / scheduler / leases / retry runtime | reduced | `packages/workers/src/jobTypes.ts`; current worker readback smokes | Keep as contract/readback unless a product loop requires real execution. |
| Promptfoo or LLM-as-judge as behavior authority | reduced | `docs/architecture/promptfoo-adapter-boundary.md`; behavior matrix | Adapter smoke only; not KRN behavior proof authority. |
| `eval:brain-battle:smoke` naming as primary proof route | deprecated | `package.json`; behavior matrix legacy alias section | Keep compatibility alias; active route is `pnpm eval:krn:smoke`. |
| File-backed runtime markdown memory | rejected | `docs/KRN_KERNEL.md` runtime truth | Markdown may be source/export/audit/seed/backup, not runtime project memory. |
| `@krn/schema` package boundary | deprecated | cleanup wave removal; no current workspace package | Do not recreate a duplicate schema package without a live consumer and drift proof. |
| Phantom policy gate surface | deprecated | cleanup wave removal; behavior matrix policy-gate invariant | Do not cite policy gates as implemented evidence without an enforcing runtime. |
| Historical docs/materials as active context | deprecated | `docs/KRN_KERNEL.md`; context hygiene invariants | Read only task-relevant active docs; do not broad-reread ledgers by default. |
