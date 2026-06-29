# V326 Extraction Candidate Reviewability Noise Gate

Status: complete.
Date: 2026-06-29

## Executive Verdict

V326 repairs the extraction preview from V325 so noisy source-decision/YAML
fences and weak lead-in fragments no longer appear as globally ready claim
candidates. `krn source artifact preview --extract-candidates` now separates
`claimCandidates` from `deferredClaimCandidates`, preserving source ranges and
candidate-only proof boundaries.

## Source To Decision

Source: V325 report, ADR-0021 live preview output, and
`pattern:evidence-proof-non-proof-boundary`.

Mechanism: extraction candidates can influence graph brain follow-up work, so
candidate output must not make fenced metadata or incomplete fragments look like
review-ready product knowledge.

KRN implication: improve deterministic candidate classification/rendering
before any persistence bridge, graph ranking, crawler, UI/API/MCP, worker, or
consensus work.

Decision: keep extraction preview local and candidate-only; render noisy claim
blocks under `deferredClaimCandidates` with `reviewability:
needs_more_evidence` and a reason.

Consumer: future source artifact ingest, graph-aware retrieval, contradiction
and duplicate detection, temporal slices, consensus candidate evaluation, and
knowledge search.

Falsifier: fenced source-decision/YAML/code blocks or lead-in fragments render
as ready claim candidates while tests pass.

Does not prove: extraction quality, source truth, entity identity, relation
correctness, graph retrieval quality, product readiness, or Memory Core
mutation.

## Changed

- `packages/cli/src/runSourceArtifactPreviewCommand.ts`
  - added per-claim `reviewability` and `reviewabilityReason`.
  - added `deferredClaimCandidates`.
  - defers fenced/code/source-decision metadata blocks.
  - defers lead-in fragments ending with `:`.
  - keeps relations scoped only to ready claim candidates.
- `packages/cli/src/runSourceArtifactPreviewCommand.test.ts`
  - added coverage for ready direct prose claims.
  - added coverage for deferred fenced blocks and lead-in fragments.

No schema, migration, persistence, graph ranking, crawler, UI/API/MCP, worker
daemon, consensus runtime, target-repo write, or Memory Core mutation was
added.

## Live Preview Proof

Persisted KRN plan:

```txt
executionRun: 1539edef-3155-4ce7-ae82-d71f3ab831e3
taskContract: cc47e991-fb41-45b9-be96-c4c2287de210
contextAssembly: 75832454-9c3a-4f89-84a1-0e37c45a1b73
```

Evidence/observe/reflect:

```txt
evidenceBundle: 7f64ad5d-4bba-4887-8e0e-9b48ec99f215
reviewAssessment: f10ff08d-3ada-42ea-a505-d0453ef77568
feedbackDelta: f7e1db1a-7efb-45b0-8502-81d0615e69a8
observationGroup: 712b0502-9ae0-4c9f-adbb-d583d6a3f00a
observationItems: 5
reflectionRecord: 298c1494-3d2f-442d-a237-2426d09337af
candidateRowsWritten: no
MemoryRecord created: no
```

Live command:

```txt
krn source artifact preview \
  --file docs/decisions/ADR-0021-temporal-claim-graph.md \
  --chunk-lines 80 \
  --limit-chunks 1 \
  --extract-candidates
```

Output now includes ready direct claims:

```txt
claimCandidates:
- reviewability: ready
  text: This is enough to prove the graph shape, but not enough to model...
```

and deferred noisy candidates:

```txt
deferredClaimCandidates:
- reviewability: needs_more_evidence
  text: The current edge model already supports:
  reason: Lead-in fragment ends with ':' and needs following evidence...

- reviewability: needs_more_evidence
  text: ```yaml ...
  reason: Fenced/code or source-decision metadata block requires human extraction...
```

## Verification

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `pnpm --filter @krn/cli test -- runSourceArtifactPreviewCommand` | passed | extraction preview tests cover ready vs deferred claims | extraction quality at scale |
| `pnpm typecheck` | passed | strict workspace typecheck passes | runtime source truth |
| `pnpm test` | passed | workspace test suite passes | product readiness |
| `pnpm db:ready` | passed | current-shell Postgres, migrations, and pgvector are ready | CI/remote DB state |
| `krn source artifact preview --extract-candidates` | passed | live ADR-0021 preview separates ready/deferred candidates | graph retrieval quality |
| `git diff --check` | passed | whitespace diff is clean | behavioral completeness |

## Dogfood Usefulness

Pattern gate:

```txt
first query: no match for "extraction candidate reviewability source range noisy weak claim"
second query: pattern:evidence-proof-non-proof-boundary helped
```

DB-backed plan selected useful graph-brain guardrails:

```txt
source_claim:931e7faa-a982-498f-a265-6a938800f707: helped
source_claim:578d247c-caa7-4cf2-8b27-0a211a00c778: helped
source_claim:e3a72d7f-0fbf-4263-a2f8-cf8c93cc9c27: neutral
```

Owner-file recall was mixed again: activation selected guardrails and generic
owner files, while source inspection found the exact renderer/test owner files.

Brain ROI: positive. KRN kept the slice focused on candidate reviewability
instead of jumping to persistence, ranking, crawler, UI/API/MCP, or graph
runtime.

## Candidate Outputs

MemoryCandidate:

```txt
claim: Local extraction previews should separate ready claim candidates from
deferred noisy candidates before any persistence bridge.
evidence: this report; live ADR-0021 preview output.
doesNotProve: this does not prove extraction quality or graph retrieval quality.
reviewability: ready
decision: review
```

EvalCandidate:

```txt
claim: `krn source artifact preview --extract-candidates` should render fenced
source-decision/YAML blocks and lead-in fragments as deferred candidates, not
ready claims.
evidence: focused CLI tests and live preview.
doesNotProve: product graph quality.
reviewability: ready
decision: review
```

## Next Recommended Action

V327 should add the smallest explicit reviewed extraction persistence bridge if
source inspection confirms existing `--claim`/`--graph-edge-*` inputs are too
manual for accepted extraction candidates. It must not auto-promote extracted
candidates, add schema, graph ranking, crawler, UI/API/MCP, worker, consensus,
or Memory Core mutation.
