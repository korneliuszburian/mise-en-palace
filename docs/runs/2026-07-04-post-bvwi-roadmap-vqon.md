# Post-BVWI Brain Kernel Queue

Status: implementation planning report for `mise-en-palace-vqon`.

## Context

After `mise-en-palace-bvwi`, the Beads queue was empty. Current evidence says:

- `63816119` is pushed and KRN CI is green;
- DB-backed multi-session brain-search memory proof is closed;
- `eval:memory-advantage` already covers retrieval, learning, long-range, and
  forgetting at the brain-search selectedKnowledge level;
- `searchVector` and `searchHybrid` already require `embeddingModelId`;
- dashboard/API/MCP, worker executor, and naming sweeps remain non-goals unless
  a brain-loop proof makes them necessary.

## Claude Review

`second-opinion-claude` first returned `block` / `HIGH`.

Accepted findings:

- F1: no concrete Beads were visible to review;
- F2: no ready executable Bead existed;
- F3: Bead shape had not been verified;
- F4: duplicate-closed-work exclusion was not demonstrated.

## Queue Created

Topological order:

1. `mise-en-palace-m448` - ready.
   Prove DB-backed MemoryRecord evidence changes the plan/Codex brief consumer
   surface, not only brain-search selectedKnowledge.
2. `mise-en-palace-112w` - blocked by `m448`.
   Add a plan-and-brief memory advantage comparator after the consumer-surface
   proof exists.
3. `mise-en-palace-cyhk` - blocked by `m448` and `112w`.
   Broaden source/brain ranking quality with real distractors and metrics,
   without docs-prose sentinels.

## Shape Check

Each new Bead includes:

- why this exists;
- duplicate-work boundary;
- scope;
- acceptance criteria;
- explicit non-goals;
- verification commands.

`bd ready` shows `mise-en-palace-m448` as the single executable next slice.
`bd dep cycles` reports no dependency cycles.

Raw ready output:

```txt
mise-en-palace-m448: memory: prove DB-backed memory changes plan and Codex brief
```

Raw cycle output:

```txt
No dependency cycles detected.
```

Dependency tree:

```txt
mise-en-palace-cyhk [blocked]
  depends on mise-en-palace-112w [blocked]
    depends on mise-en-palace-m448 [ready]
```

## Bead Bodies

`mise-en-palace-m448`

```txt
Why: bvwi proves DB-backed multi-session brain-search selection, but the next
brain advantage step is proving the selected MemoryRecord changes the actual
plan/brief surface that Codex consumes.

Dedupe: not duplicate bvwi; bvwi ends at brain-search selectedKnowledge. This
slice compares a baseline plan/brief without Session A memory against a
grounded plan/brief with DB-backed promoted MemoryRecord and accepted source
support.

Scope: use existing compileHarnessPlan/Codex adapter paths and live DB
repositories where practical; add a deterministic smoke or focused
CLI/harness test.

Acceptance: baseline cannot include the target MemoryRecord; grounded run
includes it in ContextAssembly; rendered Codex brief exposes memory/context
expected use and proof boundary; readback reports selected memory/source ids
and approximate context size; no automatic memory mutation is introduced.

Non-goals: no dashboard/API/MCP, worker executor, broad eval framework,
duplicate memory-advantage fixture case unless needed as a thin wrapper, or
vanity naming sweep.

Verification: focused harness/codex-adapter tests as touched, pnpm typecheck,
git diff --check, DB smoke only if live repositories are touched.
```

`mise-en-palace-112w`

```txt
Why: after the plan/brief proof exists, the eval surface should compare
no-memory/simple retrieval/KRN memory at the plan-or-brief outcome level, not
only brain-search selectedKnowledge.

Dependency: blocked by m448.

Dedupe: not duplicate 87w0/ebxq/jmfl; those already gave
competency/readback metrics at brain-search level. This is the next
consumer-surface comparator.

Acceptance: at least one company-pattern case fails baseline and passes KRN at
the plan/brief surface; output includes baseline class, selected
MemoryRecord/SourceClaim ids, brief/context evidence, and doesNotProve
arbitrary Codex output quality.

Non-goals: no LLM judge, external benchmark platform, broad paper suite, or DB
migration.

Verification: focused memory-advantage tests, pnpm eval:memory-advantage,
pnpm typecheck, git diff --check.
```

`mise-en-palace-cyhk`

```txt
Why: PLAN still names pattern/research brain quality and source/graph ranking
quality across broader corpora as product gaps.

Dependency: blocked by m448 and 112w so ranking work is judged by consumer
impact, not standalone metric chasing.

Dedupe: not duplicate existing brain-ranking/source-graph-ranking; this must
target newly observed consumer-surface weaknesses and avoid prose/doc-lint
checks.

Acceptance: fixture has named corpus size, distractor classes, expected ids,
baseline/failure rationale, metrics readback, and proof/non-proof; no
docs-prose sentinel-only tests.

Non-goals: no LLM judge, external benchmark harness, broad crawler,
dashboard/API/MCP.

Verification: pnpm eval:brain-ranking, pnpm eval:source-graph-ranking,
pnpm eval:krn:smoke if package scripts touched, pnpm typecheck,
git diff --check.
```

## Proof Boundary

Proves:

- post-`bvwi` execution now has a concrete ordered queue;
- the next ready task advances memory advantage toward Codex-facing plan/brief
  context;
- duplicate memory-eval and vector-search work was not re-opened.

Does not prove:

- `m448` is implemented;
- memory improves arbitrary Codex output;
- ranking quality is broad enough;
- product readiness.
