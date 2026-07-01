# IMR-51 Generic Target-Fit Acquisition Routing

Status: complete.

Beads issue: `mise-en-palace-zh0`.

## Objective

Route brain-search readbacks where selected brain knowledge is only generic
guardrail context into heartbeat knowledge-acquisition output when source/search
evidence is useful.

## Source Decision

Source: IMR-50 target-fit Brain-QA closure and live `/tmp/krn-imr50/q2.json`.

Mechanism: `krn brain search` can now label `selectedKnowledge` target fit. The
EKOLOGUS query had useful source/search evidence, but
`generic_only_selected_knowledge`; heartbeat acquisition previously emitted zero
candidates because it only consumed explicit `missingEvidence`.

KRN implication: generic-only selected knowledge with useful source evidence is
a knowledge-acquisition gap, not a sufficient context result.

Decision: adopt a bounded candidate-only route from generic-only target-fit
readback into heartbeat acquisition. Do not change activation scoring, ranking,
source truth, DB schema, crawler, worker runtime, API/MCP, eval promotion, target
repo files, or Memory Core.

Consumer: `krn heartbeat preview --candidate-kind knowledge_acquisition
--acquisition-readback-file <brain-search.json>`.

Falsifier: a q2-shaped brain-search JSON with
`targetFitSummary.verdict=generic_only_selected_knowledge` and useful source
evidence emits zero knowledge-acquisition candidates.

Does not prove: source truth, ranking quality, target-specific knowledge quality,
autonomous acquisition, crawler readiness, product readiness, or Memory Core
mutation.

## Changed

- `packages/cli/src/runHeartbeatPreviewCommand.ts`
  - Derives missing acquisition evidence from generic-only target-fit readbacks.
  - Preserves query diagnostics and recommended follow-up for target-specific
    SourceClaim review.
- `packages/cli/src/runHeartbeatPreviewCommand.test.ts`
  - Adds q2-shaped regression coverage.
- `packages/workers/src/knowledgeAcquisitionHeartbeatPreview.ts`
  - Updates proof wording so target-fit gap readbacks are explicitly covered.

## Live Readback

Command:

```sh
rtk env KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn bash -lc 'pnpm --silent --filter @krn/cli krn heartbeat preview --candidate-kind knowledge_acquisition --acquisition-readback-file /tmp/krn-imr50/q2.json --json > /tmp/krn-imr50/q2-heartbeat-zh0.json'
```

Result:

```txt
knowledgeAcquisition: 1
candidate.kind: knowledge_acquisition_candidate
candidate.source: brain_search
candidate.query: EKOLOGUS Brain quality gate
missingEvidence: target-specific SourceClaim evidence for brain-search query "EKOLOGUS Brain quality gate"
reviewability: ready
mutation: none
```

## Verification

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `rtk pnpm --filter @krn/cli test -- runHeartbeatPreviewCommand` | passed | CLI readback route and q2-shaped regression work. | Does not prove live DB data quality. |
| `rtk pnpm --filter @krn/workers test -- knowledgeAcquisitionHeartbeatPreview` | passed | Worker candidate output still validates. | Does not prove autonomous worker execution. |
| `rtk pnpm run typecheck` | passed | TypeScript strict boundaries compile. | Does not prove semantic correctness. |
| `rtk env TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | Full workspace test suite passes. | Does not prove product readiness. |
| `rtk pnpm quality:fallow:ci` | passed | Changed-file Fallow gate has no issues. | Does not prove broad repo cleanup. |
| `rtk pnpm db:ready` | passed | Current shell DB is reachable with migrations and pgvector. | Does not prove CI DB state. |
| `rtk pnpm db:smoke` | passed | Current shell DB smoke persistence works. | Does not prove acquisition mutation, because this slice is mutation-free. |
| `rtk git diff --check` | passed | Diff whitespace is clean. | Does not prove behavior. |

## Pattern Feedback

- `ts-boundary-unknown-first-result-state`: helped. The readback file still
  enters as JSON `unknown`, narrows through `JsonRecord`, and does not trust
  optional target-fit fields.
- `source-to-decision-retention-gate`: helped. The slice kept mechanism,
  implication, consumer, falsifier, and proof/non-proof boundary explicit.
- Fallow changed the implementation: the first version increased
  `brainSearchAcquisitionRequest` complexity, so the final version separates
  source-search narrowing from request construction.

## Next Action

Resolve the emitted candidate: perform one bounded source/evidence follow-up for
the EKOLOGUS target-fit gap and either create/review target-specific SourceClaim
evidence or explicitly reject it.
