# Context Selection Quality Audit

Bead: `mise-en-palace-qzai`.

## Scope

Small dogfood sample for current KRN brain/source recall. This is not a broad
benchmark and does not tune ranking.

## Commands

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn brain search --query "workers are not codex exec candidate maintenance contracts plnv" --json
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn source search --query "workers are not codex exec candidate maintenance contracts plnv" --json
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn brain search --query "naming standard no vanity rename helper extraction rule" --json
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn source search --query "context selection relevance source grounding brain quality" --json
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn brain search --query "source-to-decision retention gate consumer falsifier" --json
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn brain search --query "typescript unknown first result state JSON parse boundary" --json
```

Artifacts are in `.local-lab/qzai/*.json`.

## Sample Results

| Query | Selected knowledge | Source support | Score | Failure mode |
| --- | ---: | ---: | --- | --- |
| workers are not codex exec candidate maintenance contracts plnv | 0 | 0 claims / 0 docs | 1/5 | under-inclusion for active architecture concept |
| naming standard no vanity rename helper extraction rule | 0 | 0 claims / 0 docs | 1/5 | under-inclusion for active naming/scope guard |
| context selection relevance source grounding brain quality | n/a | 0 claims / 0 docs, 1 included non-supporting candidate | 1/5 | over-inclusion without support |
| source-to-decision retention gate consumer falsifier | 1 target-specific ready pattern | 0 claims / 1 document | 4/5 | useful retained pattern; missing governed SourceClaim support |
| typescript unknown first result state JSON parse boundary | 1 target-specific ready pattern | 0 claims / 0 docs | 4/5 | useful retained pattern; source support absent |

## Findings

1. The recall path is not globally broken. Known retained patterns such as
   `source-to-decision-retention-gate` and
   `ts-boundary-unknown-first-result-state` are selected as target-specific and
   ready.
2. New active concepts from the current work session are not yet retained:
   workers-as-candidate-contracts, KRN-as-governed-RAG, no vanity naming sweep,
   and no helper-for-everything rule all return no selected knowledge.
3. Source-search abstention is mostly honest: for weak queries it returns
   `not_useful` and missing-evidence messages instead of pretending to have
   support.
4. Running CLI commands through `pnpm --filter ... krn --json` prepends package
   runner text before JSON. The KRN payload is still parseable from the first
   `{`, but artifact consumers should prefer a direct CLI invocation or strip
   runner noise.

## Recommended Next Beads

- `mise-en-palace-g1cg`: run the source-grounding spot-check next.
- New follow-up: retain the KRN brain layer model as governed source/brain
  evidence so workers/naming questions become retrievable before ranking work.
- `mise-en-palace-td3u`: proceed only after qzai/g1cg evidence shapes the naming
  standard.

## Proof Boundary

Proves: six current CLI readbacks were sampled; known retained patterns can
still be selected; current active brain-layer/naming concepts are not yet
retrievable as selected knowledge.

Does not prove: broad ranking quality, source truth, DB corpus completeness,
product readiness, or that algorithm changes are needed.
