# Retrieval Embedding Provenance

## Slice

Bead: `mise-en-palace-48hq`

## Change

Vector and hybrid `SearchDocumentSearchResult` rows now carry explicit embedding
model provenance:

- `embeddingModelId`
- provider
- model name
- dimensions

`searchLexical` remains lexical-only and carries no embedding model. The
retrieval-substrate smoke report now exposes vector/hybrid result model ids and
an explicit `unavailable_lexical_only` lexical provenance state.

`toSearchCandidate` preserves embedding model provenance in candidate metadata so
future vector/hybrid activation readback does not silently drop the model scope.

## Proof

```txt
pnpm --filter @krn/db test -- DrizzleRetrievalRepository
29 files passed, 99 tests passed

pnpm --filter @krn/harness test -- activation
33 files passed, 199 tests passed

pnpm typecheck
git diff --check
```

## Non-Proof

This does not prove embedding quality, mixed-model ranking quality, source truth,
or product readiness. It proves that current vector/hybrid retrieval rows and the
DB smoke readback expose model provenance instead of hiding the model scope.

## Rollback Risk

Medium-low. Public readback type shape is extended with an optional field. No DB
migration is required because the data comes from existing `embedding_models`
rows linked through `embeddings.embedding_model_id`.
