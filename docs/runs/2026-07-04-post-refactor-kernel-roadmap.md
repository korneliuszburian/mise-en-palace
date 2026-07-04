# Post-Refactor Kernel Roadmap

## Slice

Bead: `mise-en-palace-pb2f`

Purpose: after the cleanup/refactor wave, select next kernel work without making
the operator the router and without drifting into docs, naming, or eval theater.

## Claude Roadmap Review

First `second-opinion-claude` run returned `block` / `MEDIUM`.

Accepted findings:

- F1: no concrete proposed Beads existed yet.
- F2: the review pack had an empty diff while `.beads/issues.jsonl` had tracker
  changes.
- F3: "pb2f claimed" is not completion evidence.

Triage: `accept_and_fix`.

Fix: create concrete Beads, record ROI ranking here, and re-run second opinion
after the artifact exists.

## ROI Ranking

1. **DB-backed brain grounding mini-gate** (`mise-en-palace-8mjf`, P1)
   - Why: directly protects KRN from becoming ungrounded fancy RAG.
   - Product category: correctness / source authority / brain quality.
   - Expected outcome: repeatable proof that selectedKnowledge has source or
     explicit missing-evidence boundaries.

2. **Retrieval embedding-model provenance readback** (`mise-en-palace-48hq`, P1)
   - Why: vector/hybrid search now has validation and model filtering, but
     operator readbacks should expose model provenance when vector retrieval
     affects answers.
   - Product category: retrieval correctness / auditability.
   - Expected outcome: no hidden mixed-model retrieval authority.

3. **Retained-pattern usefulness tied to execution evidence**
   (`mise-en-palace-i3su`, P1, depends on `8mjf`)
   - Why: KRN should learn which retained patterns help actual Codex runs, not
     only which cards are retrievable.
   - Product category: feedback loop / real Codex-output quality.
   - Expected outcome: evidence-backed usefulness updates with proof refs and
     non-proof boundaries.

4. **Source artifact preview domain boundary extraction**
   (`mise-en-palace-q4ym`, P2)
   - Why: extraction is real source-domain logic near CLI. Move only if multiple
     live consumers or package-boundary risk justify it.
   - Product category: architecture cleanup gated by behavior.
   - Expected outcome: either smaller CLI boundary or rejected-by-evidence.

5. **Naming-change evidence guard** (`mise-en-palace-6aw2`, P3, deferred)
   - Why: only useful if naming drift repeats after `td3u`.
   - Product category: cleanup/process guard.
   - Expected outcome: no work now.

## Created Beads

### `mise-en-palace-8mjf`

Title: Add DB-backed brain grounding mini-gate

Likely files:

- `packages/cli/src/__tests__/runBrainSearchCommand.test.ts`;
- `packages/cli/src/__tests__/runSourceSearchCommand.test.ts`;
- DB smoke/readback files only if the chosen proof is DB-backed rather than
  unit-level CLI fixtures.

Acceptance:

- fixed queries cover workers boundary, naming guard, source-to-decision
  retention, and TypeScript boundary;
- source-looking selectedKnowledge has supporting SourceClaim/SearchDocument
  evidence or explicit missingEvidence;
- SourceDecision support is visible or explicitly caveated;
- proof/non-proof recorded.

Verification:

```txt
focused CLI/DB test or smoke
pnpm typecheck
git diff --check
```

Non-goals: ranking rewrite, dashboard/API/MCP, broad benchmark lane, source
truth claims.

Proof boundary: proves a fixed mini-set of brain/source readbacks expose source
grounding or missing-evidence caveats. Does not prove broad retrieval quality or
source truth.

Rollback risk: medium-low. The intended blast radius is a read-only gate/smoke;
failures may expose real ungrounded output but should not require schema changes.

### `mise-en-palace-48hq`

Title: Expose retrieval embedding-model provenance in readback

Likely files:

- `packages/db/src/repositories/DrizzleRetrievalRepository.ts`;
- retrieval mapper/readback types if provenance is not already surfaced;
- `packages/cli/src/runSourceSearchCommand.ts` or related source/brain readback
  helpers;
- focused DB/CLI tests.

Acceptance:

- vector/hybrid readbacks carry embedding model id/name/dimension where those
  results contribute;
- lexical-only readbacks stay unchanged;
- missing provenance is explicit.

Verification:

```txt
focused DB/CLI tests
pnpm typecheck
git diff --check
```

Non-goals: embedding service integration, ranking rewrite, schema migration
unless current schema cannot express provenance.

Proof boundary: proves operator readback can see vector/hybrid model provenance
when retrieval uses embeddings. Does not prove embedding quality or ranking
quality.

Rollback risk: medium-low. Mostly additive readback; risk rises only if current
repository contracts cannot carry provenance without API changes.

### `mise-en-palace-i3su`

Title: Tie retained-pattern usefulness to execution evidence

Dependency: `mise-en-palace-8mjf`

Likely files:

- `packages/cli/src/runEvidenceCaptureCommand.ts`;
- `packages/harness/src/brainKnowledgeReadModel.ts`;
- `docs/brain-knowledge/usefulness-feedback/*`;
- focused CLI/harness tests.

Acceptance:

- one persisted plan/run/evidence flow records pattern usefulness with evidence
  refs;
- brain knowledge readback reflects helped/neutral/noise outcome;
- invalid or missing proof refs are rejected or downgraded.

Verification:

```txt
focused CLI/harness tests
pnpm typecheck
git diff --check
```

Non-goals: LLM judging, broad eval platform, automatic memory promotion,
dashboard.

Proof boundary: proves one evidence-backed usefulness path can update/read back
retained-pattern usefulness. Does not prove automatic learning, model judgment,
or that every selected pattern improved a run.

Rollback risk: medium. This touches evidence/readback semantics and may require
careful validation around proof refs.

### `mise-en-palace-q4ym`

Title: Extract source artifact preview domain boundary from CLI

Likely files:

- `packages/core/src/sourceArtifactPreviewExtraction.ts`;
- `packages/cli/src/runSourceArtifactPreviewCommand.ts`;
- `packages/cli/src/sourceArtifactPreview*` helpers;
- focused source artifact preview tests.

Acceptance:

- either behavior-preserving extraction of reusable pure source-domain logic;
- or rejected-by-evidence if current ownership is correct.

Verification:

```txt
source artifact preview tests
pnpm typecheck
git diff --check
```

Non-goals: new package unless justified, parser rewrite, LLM extraction, DB
schema change.

Proof boundary: proves either a cleaner package boundary for existing behavior
or a documented rejection. Does not prove broader source extraction quality.

Rollback risk: medium because source artifact preview is operator-facing and
DB-backed in persisted mode.

### `mise-en-palace-6aw2`

Title: Add naming-change evidence guard if drift repeats

Likely files:

- `packages/harness/src/__tests__/*Invariants.test.ts` only if an invariant is
  justified later;
- `docs/standards/code-vocabulary.md` only if the standard needs clarification.

Acceptance: only start if future naming drift repeats; malformed naming work is
caught without blocking legitimate `normalized`/`final`/`legacy` domain
language.

Verification:

```txt
focused invariant test if added
git diff --check
```

Non-goals: broad grep ban, historical-doc rewrite, repo-wide rename sweep.

Proof boundary: proves only the guard shape if implemented. Does not prove all
names are good.

Rollback risk: low. This is deferred guardrail work.

## Rejected For Next Slot

- Worker executor/runtime: still human-deferred under `plnv`.
- Dashboard/API/MCP: product surface before usefulness/security gates.
- Broad naming sweep: `td3u` explicitly rejects vanity rename work.
- Broad benchmark/eval platform: not needed before a small grounding mini-gate.
- More source-seeding without a repeatable gate: risks turning dogfood into
  one-off proof theater.

## Proof Boundary

Proves:

- next work was selected from current repo state, Beads, and recent run reports;
- product-quality work outranks cleanup-only guardrails;
- concrete Beads now exist for the next implementation queue.

Does not prove:

- any of the proposed slices are implemented;
- retrieval ranking quality;
- source truth;
- product readiness;
- worker runtime behavior.
