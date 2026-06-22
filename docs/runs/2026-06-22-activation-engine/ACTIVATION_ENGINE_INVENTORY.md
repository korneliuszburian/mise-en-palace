# Activation Engine Inventory

Goal slice: M25.00 - inventory activation engine surface before wiring more
behavior into `krn plan --persist`.

## Summary

M25 does not start from zero. A deterministic activation path already exists in
`packages/harness/src/activation/` and is already called by
`compileHarnessPlan`. The current path can:

- build source and memory queries from a `TaskContract`;
- rank source and memory candidates with lexical and trust-derived scores;
- filter low-trust and stale/invalidated memory;
- apply a simple context ROI policy with token budget and max inclusion count;
- assemble `ContextAssembly` inclusions/exclusions;
- persist `RetrievalRun`, `RetrievalCandidate`, `ActivationDecision`,
  `ContextItem`, and `ContextExclusion` rows through repository ports.

The current path cannot yet satisfy full M25. It does not activate lexical
`SearchDocument` results, does not consult anti-memory, does not detect
conflict sets, does not expose a stable core `ActivationPolicy`/`ActivationTrace`
contract, has no noisy-brain fixture, has no `pnpm db:smoke:activation`, and
`krn doctor` has no activation readiness section.

## Surface Inventory

| Surface | Current state | M25 implication |
| --- | --- | --- |
| `packages/harness/src/activation/types.ts` | Harness-local candidate/query/ranked/exclusion types exist. | Good seed, but M25.01 still needs stable domain contracts named in `GOAL.md`. |
| `buildMemoryQuery` / `buildSourceQuery` | Deterministic query terms from task title/objective/constraints/non-goals/acceptance. | Keep; extend only if noisy fixture proves weak recall. |
| `rankCandidates` | Converts `MemoryRecord` and `SourceClaim` to activation candidates and scores lexical hits plus trust. | Keep as deterministic v1; add search/anti-memory candidate handling later. |
| `applyTrustFilter` | Excludes candidates below configured trust rank. | Keep; M25 fixture must prove low-trust exclusions. |
| `applyTemporalFilter` | Excludes stale, invalidated, superseded, expired, or invalidated-at candidates. | Keep; fixture must include stale/invalidated cases. |
| `applyContextROI` | Excludes below minimum score, over inclusion count, or over token budget. | Keep; fixture must prove bounded context. |
| `assembleContext` | Produces `ContextAssembly`, enforces `doesNotProve` on source claims. | Keep source-safety gate; add trace/result vocabulary around it. |
| `compileHarnessPlan` | Calls activation path, starts/completes retrieval run, stores candidates, activation decisions, and context selection. | M25.05 can extend this instead of replacing it. |
| `runPlanCommand` | Preview mode abstains with no-store repositories; `--persist` uses DB repositories and prints inclusion/exclusion counts plus execution brief. | Output is usable but must later print explicit exclusions/abstentions from real activation. |
| `ContextAssembly` core type | Core owns inclusion/exclusion shapes and status. | Keep as output artifact; do not add `requiredSkills` to core. |
| `context_assemblies` table | Stores inclusion/exclusion JSON plus counts. | Existing read model remains useful for aggregate run readback. |
| `context_items` / `context_exclusions` tables | Store normalized inclusions/exclusions by context assembly. | Use as durable M25 proof rows. |
| `retrieval_runs` / `retrieval_candidates` / `activation_decisions` | Store retrieval audit and activation decisions. | Use as the primary activation trace persistence for source/memory/search. |
| `memory_activation_traces` | Existing memory-only table. | Do not make this the primary M25 activation trace; it cannot represent source/search candidates. |
| `SourceRepository` | Lists project claims and run claims; supports source decisions/rejections. | Current compiler only uses `listClaimsForProject`. |
| `MemoryRepository` | Lists active memory; can create/list anti-memory for run. | Current compiler does not use anti-memory. |
| `RetrievalRepository` | Can lexical-search SearchDocuments and persist retrieval/activation/context rows. | Current compiler does not use `searchLexical`. |
| `pnpm db:smoke:activation` | Missing. | Required in M25.04. |
| Doctor activation readiness | Missing. | Required in M25.06. |

## Current Runtime Probe

Preview:

```sh
pnpm --filter @krn/cli krn plan --task "improve KRN doctor source graph readiness"
```

Result:

- persistence disabled;
- context included `0`;
- context excluded `0`;
- next action: activation abstained;
- no crash.

Persisted:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn plan --task "improve KRN doctor source graph readiness" --persist
```

Result:

- operator intent: `082fcd7d-4b91-4049-9d09-1908cb38917d`
- task contract: `6ba32edc-0d6e-4372-ae3e-317c71b61972`
- harness plan: `4c939856-199f-47a5-9fbc-7d3ac6095415`
- context assembly: `8ee85cac-8fa7-418a-8a27-9ca06e763d0d`
- execution run: `66f8dfa6-aa46-4ec0-b6cc-364d4d78e9ac`
- context included: `3`
- context excluded: `0`
- persisted context items: `3`
- persisted context exclusions: `0`
- persisted activation decisions for that context assembly: `3`
- persisted retrieval candidates for that retrieval run: `3`

This proves the current persisted path can activate existing source/memory
records, but it does not yet prove noisy corpus compression or explicit
exclusion behavior from real DB data.

## M25 Gaps

- Add or tighten the named M25 domain contracts:
  `ActivationPolicy`, `TrustAssessment`, `ContextROI`, `ActivationTrace`,
  `ActivationInput`, `ActivationResult`, `ActivationAbstention`, `ConflictSet`,
  and `ContextBudget`.
- Decide which contracts belong in `@krn/core` versus harness-local execution.
- Extend activation to include retrieval/search candidates, not only
  `MemoryRecord` and `SourceClaim`.
- Use anti-memory as a blocking/exclusion signal.
- Add conflict detection for contradictory source claims or anti-memory-backed
  rejections.
- Add noisy-brain fixture with bounded inclusions and explicit exclusions.
- Add `pnpm db:smoke:activation`.
- Wire activation output in `krn plan --persist` so it prints explicit
  exclusions and abstentions, not only counts.
- Add doctor activation readiness.

## Non-Gaps

- Do not add LLM ranking.
- Do not add external embedding generation.
- Do not add source crawler, broad research, dashboard, API, or worker runtime.
- Do not replace Postgres/pgvector retrieval substrate.
- Do not use markdown as runtime memory.
