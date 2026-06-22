# Dogfood

Dogfood ID: `m24-retrieval-dogfood-2026-06-22`

Objective: create durable retrieval substrate proof rows from a real persisted
KRN plan/run, not from the self-cleaning smoke command.

Persisted plan/run inputs:

- operator intent: `d1f92b0a-6a7b-4b02-bc81-07b4b26bb720`
- task contract: `26a9e961-f462-4e29-b97d-0705309fe93f`
- harness plan: `fb01f089-9640-4881-913e-a276be0891c0`
- context assembly: `b3aba586-5158-4149-aee6-ef58a5cacaa6`
- execution run: `83722c20-f897-4335-a7b1-d1d64046b3cf`
- source claim: `212815bc-477c-4985-8992-31825f5c5897`
- memory record: `7dda35fd-b89d-4bd4-94bd-7937022d99e7`

Durable retrieval rows:

- source SearchDocument: `49e24752-6ffb-45b7-b11c-c22ec1dd882f`
- memory SearchDocument: `741e8b2e-7934-4653-ba03-9a6f803fabd5`
- embedding model: `6d57fc7b-4922-4a6c-9ac5-fa25fd6957cc`
- embedding row: `ebc314e9-f5f7-4daa-99e3-0a1139832f9b`
- retrieval run: `76d529b2-2a3e-45bf-b710-e94ee074a539`
- included candidate: `43a100ff-5ae0-4e9f-9510-c7db038e8c36`
- excluded candidate: `76cc2097-2d76-445f-8089-3f185c7a3e15`
- included activation decision: `7c13adbb-4662-41f3-9c65-ebb85c45cacf`
- excluded activation decision: `eb72ee84-1192-4d0a-9a47-bb9a06cd8579`
- dogfood context item: `a2c1b8c1-016c-4ed3-b89b-ff5c9550d833`
- dogfood context exclusion: `65781b65-7e30-41ef-87d2-43ab882a6e3e`

Selection:

- Query terms: `Postgres backed relational edges`.
- Included: source-grounded SearchDocument for the M22/M24 Postgres source
  graph boundary.
- Excluded: memory SearchDocument because it is valid background but lower
  context ROI for this proof.
- Context assembly now contains the original persisted plan context plus the
  dogfood retrieval inclusion/exclusion.

Counts after self-cleaning smoke rerun:

- SearchDocuments with dogfood marker: `2`
- EmbeddingModels with dogfood marker: `1`
- Embeddings with dogfood marker: `1`
- RetrievalRuns with dogfood marker: `1`
- RetrievalCandidates with dogfood marker: `2`
- ActivationDecisions with dogfood marker: `2`
- ContextItems for the dogfood context assembly: `4`
- ContextExclusions for the dogfood context assembly: `1`

Verification:

- Initial dogfood lexical query
  `source graph postgres edge tables` failed before new inserts because the
  existing SearchDocument did not contain `tables`; the source document did
  match `retrieval substrate source claim`, `Postgres backed relational edges`,
  and `separate graph database crawler`.
- Durable dogfood creation passed with `lexicalResultCount: 2`.
- `krn doctor` now reports retrieval runtime proof as `ready`.
- `pnpm db:smoke:retrieval-substrate` still passes and cleans marker rows to
  `0`, proving smoke cleanup is separate from durable dogfood proof.

Still not proven:

- final M25 ranking quality;
- external embedding provider behavior;
- background embedding worker behavior;
- separate vector/search infrastructure, intentionally out of scope.
