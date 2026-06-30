# IMR-04 Store-Backed Selected Knowledge Readback

Status: complete.

## Executive Verdict

`krn brain search --store-only` now returns selected brain knowledge packets from
Postgres-backed source/search evidence. The file-backed brain catalog remains
skipped in store-only mode, and the readback still records proof/non-proof
boundaries. This moves the brain surface closer to runtime store evidence
instead of markdown/JSON catalog artifacts.

## Source-To-Decision

- Source: `mise-en-palace-06v`, IMR-02 store-only readback, `docs/KRN_KERNEL.md`,
  and live source-search answer-package output.
- Mechanism: source-search supporting claims already carry governed
  SourceClaim fields through activation metadata: claim, mechanism,
  KRN implication, consumer, falsifier, and doesNotProve.
- KRN implication: store-only brain search can surface selected knowledge from
  persisted source/search evidence without treating file-backed catalog cards as
  runtime memory.
- Decision: derive `selectedKnowledge` packets from source-search supporting
  claims in store-only mode; weak/incomplete claims stay visible as
  `needs_more_evidence`.
- Consumer: pattern/research brain, multi-repo internal operator loop, and
  pre-coding Pattern Application Gate.
- Falsifier: a store-only brain query with governed source evidence returns
  empty `selectedKnowledge` or marks missing mechanism/falsifier evidence as
  ready.

## Changed

- `packages/harness/src/activation/rankCandidates.ts`
  - carries SourceClaim claim/mechanism/KRN implication/falsifier in activation
    metadata.
- `packages/cli/src/runSourceSearchCommand.ts`
  - exposes those governed SourceClaim fields in JSON answer packages.
- `packages/cli/src/runBrainSearchCommand.ts`
  - derives store-only selected knowledge packets from source-search claims.
- CLI tests cover ready, weak, empty, and non-mutating store-only behavior.

## Live Readback

Command:

```sh
rtk env KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn brain search --query "source-to-decision retention gate" --store-only --limit 3 --json
```

Observed:

- `brainKnowledgeReadback: "store_only"`;
- file catalog counts remained zero;
- `selectedKnowledge` returned two `source_search` packets;
- both packets were `reviewability: "ready"`;
- each packet included consumer, falsifier, and doesNotProve;
- mutation remained `none`.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk pnpm --filter @krn/cli test -- runBrainSearchCommand runSourceSearchCommand` | passed | CLI behavior covers ready, weak, empty, and answer-package projection cases. | Does not prove live DB contents or ranking quality. |
| `rtk pnpm --filter @krn/harness test -- activation` | passed | Activation tests still pass after adding SourceClaim metadata to candidates. | Does not prove production activation relevance. |
| `rtk pnpm -r --workspace-concurrency=1 --if-present typecheck` | passed | Strict TypeScript boundaries compile across packages. | Does not prove product usefulness. |
| `rtk pnpm quality:fallow:ci` | passed | Changed-file Fallow gate has no dead-code/complexity/duplication issues. | Does not prove inherited duplication is fixed. |
| `rtk pnpm test` | passed | Workspace tests pass after the change. | Does not prove external operator readiness. |
| `rtk pnpm db:ready` | passed | Local Postgres is reachable with migrations and pgvector ready. | Does not prove remote/CI DB state. |
| live `krn brain search --store-only --json` | passed | Store-only brain search can return source-backed selected knowledge from current DB state. | Does not prove source truth, semantic ranking, embeddings, graph retrieval, product readiness, or Memory Core mutation. |

## Brain Usefulness

Verdict: positive.

The slice reduces reliance on file-backed catalog readback for active agent
context. It also keeps weak source evidence reviewable instead of hidden or
promoted. The useful pattern is now:

```txt
persisted SourceClaim/SearchDocument evidence
-> source-search answer package
-> store-only brain selectedKnowledge
-> proof/non-proof boundary
```

## Remaining Gaps

- No new ranking or semantic scorer was added.
- No Memory Core mutation or promotion path was changed.
- No ontology/graph traversal/dreaming/consensus runtime was built.
- Inherited Fallow duplication in activation remains outside this slice.

## Next Recommended Action

Run one bounded source/product slice that uses `krn brain search --store-only`
as the pre-coding pattern gate and records whether the returned packets helped,
were noise, or missed needed knowledge.
