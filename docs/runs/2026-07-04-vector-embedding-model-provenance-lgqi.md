# Vector Embedding Model Provenance

Status: closed as already enforced for `mise-en-palace-lgqi`.

## Evidence

The current retrieval implementation already prevents silent mixed-model vector
comparison:

- `SearchVectorInput` requires `embeddingModelId`;
- `SearchHybridInput` extends `SearchVectorInput`;
- `DrizzleRetrievalRepository.searchVector` calls `requireEmbeddingModelId`;
- the vector SQL filters `embeddings.embeddingModelId` to the requested model;
- vector results include `embeddingModel.embeddingModelId`, provider, model,
  and dimensions;
- `searchHybrid` passes the same required model id through `searchVector`;
- lexical-only results leave embedding provenance absent.

## Verification

```sh
rtk pnpm --filter @krn/db test -- DrizzleRetrievalRepository
rtk pnpm -C packages/db typecheck
```

The current CI DB smoke also exercises vector/hybrid provenance through
`retrievalSubstrateSmoke`.

## Proof Boundary

Proves:

- vector and hybrid retrieval cannot omit the embedding model id at the
  repository boundary;
- vector search is scoped to one embedding model id;
- vector/hybrid readback exposes embedding model provenance.

Does not prove:

- embedding quality;
- provider/model choice;
- production semantic retrieval quality;
- external embedding generation.
