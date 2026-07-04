# Source Search No-Id Document Support

Bead: `mise-en-palace-8vug`

## Problem

Live dogfood query:

```sh
krn source search --query "worker embedding model scope source chunk memory record" --json
```

returned `answerUsefulness: partly_useful_missing_claim` because the answer
package counted an included `search_document` candidate with no
`searchDocumentId` as supporting SearchDocument evidence. The same candidate's
readback already said `Search candidate has no SearchDocument id.`

## Change

`buildSourceSearchAnswerPackage` now counts a `search_document` candidate as
supporting document evidence only when `searchDocumentId` is present. No-id
search candidates remain visible in `neutralOrNoise` and `includedCandidates`.

## Verification

- `pnpm --filter @krn/cli test -- runSourceSearchCommand`
- `pnpm -C packages/cli typecheck`
- live `krn source search --query "worker embedding model scope source chunk memory record" --json`
- live `krn brain search --query "worker embedding model scope source chunk memory record" --json`

## Proof

- source-search no longer upgrades owner-file/no-id search candidates into
  supporting SearchDocument evidence;
- brain-search no longer treats that source-search readback as useful
  source/link evidence.

## Non-Proof

- does not prove ranking quality;
- does not prove source truth;
- does not change activation retrieval;
- does not add embeddings, crawler, worker runtime, dashboard, API, or MCP.
