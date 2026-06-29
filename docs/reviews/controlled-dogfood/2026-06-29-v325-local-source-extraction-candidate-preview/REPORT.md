# V325 Local Source Extraction Candidate Preview

Status: complete.
Date: 2026-06-29

## Executive Verdict

V325 adds a candidate-only extraction preview to `krn source artifact preview`.
With `--extract-candidates`, the command renders deterministic local
entity/claim/relation candidates with source ranges, reviewability, explicit
`doesNotProve`, and no accepted source truth. It does not persist extracted
candidates, run graph ranking, crawl sources, mutate Memory Core, or prove
extraction quality.

## Source To Decision

Source: ADR-0021, V323/V324 reports, and retained pattern
`pattern:evidence-proof-non-proof-boundary`.

Mechanism: Graph brain work needs candidate inspection before graph runtime.
Local source preview already owns file readability, chunk hashes, source ranges,
candidate bridge output, and proof/non-proof boundaries.

KRN implication: add extraction preview to the existing source artifact preview
surface before persistence, ranking, crawler, UI/API/MCP, worker, or consensus
work.

Decision: add repeatable operator flag `--extract-candidates` and render
candidate-only deterministic entity/claim/relation preview.

Consumer: future source artifact ingest, graph-aware retrieval, duplicate and
contradiction detection, temporal slices, consensus candidate evaluation, and
knowledge search.

Falsifier: extraction preview implies accepted graph truth, omits source ranges,
persists extracted candidates automatically, or mutates Memory Core.

Does not prove: source truth, entity identity, claim truth, relation correctness,
graph retrieval quality, extraction quality, product readiness, or Memory Core
mutation.

## Changed

- `packages/cli/src/parseArgs.ts`
  - added `extractCandidates?: boolean` to the source artifact preview command.
- `packages/cli/src/parseSourceArgs.ts`
  - added `--extract-candidates` parser and usage text.
- `packages/cli/src/runSourceArtifactPreviewCommand.ts`
  - added deterministic local extraction candidate preview.
  - extracts markdown heading and inline-code entity candidates.
  - extracts block-based claim candidates to avoid broken line-continuation
    fragments.
  - renders heading-scoped relation candidates.
  - preserves candidate-only proof boundaries.
- CLI tests
  - cover parser support, default non-generation without the flag, candidate
    rendering, source ranges, reviewability, and no source/graph/memory
    mutation.

No schema, migration, graph runtime, crawler, UI/API/MCP, worker daemon,
consensus runtime, target-repo write, or Memory Core mutation was added.

## Live DB And Preview Proof

DB readiness:

```txt
DB mode: ready
Postgres: reachable
Migrations expected: 14
Migrations applied: 14
pgvector: available
Brain store readiness: ready
```

Persisted KRN plan:

```txt
executionRun: f0eab601-7fe2-4077-97a4-90dd8c9c4e4e
taskContract: 54d022b7-81c3-4fd7-a299-150c620e4c19
contextAssembly: fb32e5bc-3282-42b4-9aaf-d0f53aaefb72
```

Evidence/observe/reflect:

```txt
evidenceBundle: ba679c10-7dcd-4de4-932e-a4ae449fdc3b
reviewAssessment: 369fd9e4-929a-48f9-8ac5-eff88287ca5a
feedbackDelta: b18f15b4-cf89-4200-bb12-396c78d7da6a
observationGroup: c1129075-c6ab-4884-8636-d49bb3514ea6
observationItems: 5
reflectionRecord: 16b86f7b-9d93-4c0d-9263-ce6d30594c65
reflectionFindings: 0
candidateRowsWritten: no
MemoryRecord created: no
```

Live preview:

```txt
krn source artifact preview \
  --file docs/decisions/ADR-0021-temporal-claim-graph.md \
  --chunk-lines 80 \
  --limit-chunks 1 \
  --extract-candidates
```

Output included:

```txt
extractionCandidatePreview:
- status: candidate
  mode: deterministic_local_heuristic
  reviewability: ready
  entityCandidates: markdown_heading and inline_code candidates with sourceRange
  claimCandidates: block-based candidates with sourceRange
  relationCandidates: scoped_by_heading candidates with sourceRange
  No SourceClaim row created from extraction candidates
  No SourceClaimEdge row created from extraction candidates
  Graph runtime: none
  Memory mutation: none
```

Dogfood caveat: the preview correctly stayed candidate-only, but some extracted
claim candidates from fenced source-decision/YAML blocks are noisy. That argues
for a next reviewability/noise gate before any persistence path.

## Repomix Context Cleanup

Requested cleanup checked these paths:

```txt
docs/context/
docs/contexts/
docs/context-pack.md
docs/**/*repomix*
```

No such active repomix context artifact exists in the current tree, so no file
was removed.

## Verification

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `pnpm --filter @krn/cli test -- parseSourceArgs runSourceArtifactPreviewCommand` | passed | parser and extraction preview rendering are covered | extraction quality at scale |
| `pnpm typecheck` | passed | strict workspace type boundaries still compile | runtime source truth |
| `pnpm test` | passed | workspace test suite passes | product readiness |
| `pnpm db:ready` | passed | current-shell Postgres, migrations, and pgvector are ready | CI/remote DB state |
| `krn source artifact preview --extract-candidates` | passed | local candidate preview renders source ranges and proof boundaries | graph retrieval quality |
| `git diff --check` | passed | whitespace diff is clean | behavioral completeness |

## Dogfood Usefulness

Pattern gate:

```txt
first query: no match for "source extraction candidate source ranges doesNotProve graph brain"
second query: pattern:evidence-proof-non-proof-boundary helped
```

DB-backed plan selected useful source claims:

```txt
3afb4c95-eaad-4df1-aa72-e8c739f385dd: helped
931e7faa-a982-498f-a265-6a938800f707: helped
e3a72d7f-0fbf-4263-a2f8-cf8c93cc9c27: neutral/helped
```

Activation helped with guardrails and graph-brain sequencing. Owner-file recall
was still mixed; source inspection found the concrete CLI owner files.

Brain ROI: positive. KRN kept the slice bounded and prevented a jump to graph
runtime, crawler, UI/API/MCP, or persistence before a reviewable candidate
preview existed.

## Candidate Outputs

MemoryCandidate:

```txt
claim: Local source extraction preview should stay candidate-only until
per-candidate reviewability and noise handling are stronger.
evidence: this report; live ADR-0021 preview with extracted candidates.
doesNotProve: this does not prove extraction quality or graph retrieval quality.
reviewability: ready
decision: review
```

EvalCandidate:

```txt
claim: `krn source artifact preview --extract-candidates` should render
entity/claim/relation candidates with source ranges, doesNotProve, Graph runtime
none, and Memory mutation none.
evidence: CLI parser/runner tests and live preview.
doesNotProve: product graph quality.
reviewability: ready
decision: review
```

## Next Recommended Action

V326 should repair extraction candidate reviewability/noise before persistence.
Specifically: keep the candidate-only preview, but avoid presenting fenced
source-decision/YAML blocks and weak fragments as globally `ready` claim
candidates. Do not add schema, persistence, graph ranking, crawler, UI/API/MCP,
worker, consensus, or Memory Core mutation.
