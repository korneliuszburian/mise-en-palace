# Activation Hybrid Retrieval Boundary Assessment

Slice: `mise-en-palace-3vqp`

Decision:
- Do not wire vector/hybrid retrieval into activation yet.

Evidence:
- `RetrieveActivationCandidatesInput` carries task, memory/source query, target read model, limits, and repositories, but no query embedding or embedding model id.
- `ActivationCandidateRepositories.retrievalRepository` is currently `Pick<RetrievalRepository, "searchLexical">`.
- `SearchVectorInput` and `SearchHybridInput` require both `embedding` and `embeddingModelId`.
- `DrizzleRetrievalRepository.searchVector/searchHybrid` already reject missing `embeddingModelId`, so the mixed-model defect is not live.
- `retrievalSubstrateSmoke` already proves DB lexical/vector/hybrid substrate with an explicit embedding model.

KRN implication:
- Activation can safely keep lexical retrieval until KRN has an explicit query-embedding source and model-scope contract.
- Adding hybrid retrieval now would either invent an embedding generator/provider path or compare vectors without a governed query embedding source.

Follow-up shape:
- Only open implementation work when there is a concrete `queryEmbedding + embeddingModelId` producer/contract.
- A future slice should first define that contract and its proof boundary, then use `second-opinion-claude` because it changes retrieval authority.

Non-proof:
- This does not prove lexical retrieval is sufficient, vector ranking quality is good, or hybrid activation should never exist.
