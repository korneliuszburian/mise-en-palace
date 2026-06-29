# V348 Source Search Answer Package JSON Readback

Status: complete.

## Executive Verdict

`krn source search` now exposes the existing answer package as typed JSON with
raw included/excluded candidates, proof boundaries, and runtime non-mutation
fields. Text output remains the default. This is a readback/product-consumer
slice, not a new search surface.

## Scope

Changed:

- `packages/cli/src/parseArgs.ts`
- `packages/cli/src/parseSourceArgs.ts`
- `packages/cli/src/runSourceSearchCommand.ts`
- `packages/cli/src/parseSourceArgs.test.ts`
- `packages/cli/src/runSourceSearchCommand.test.ts`

Non-goals preserved:

- no UI/API/MCP;
- no crawler;
- no DB schema or migration;
- no retrieval ranking rewrite;
- no embeddings or graph runtime;
- no worker daemon;
- no Memory Core mutation.

## Pattern Gate

Selected patterns:

| Pattern | Outcome | Evidence | Does not prove |
|---|---|---|---|
| `evidence-proof-non-proof-boundary` | helped | JSON includes `answerPackage.doesNotProve`, `proof.doesNotProve`, and runtime non-mutation fields. | Does not prove source truth or ranking quality. |
| `brain-knowledge-read-only-ui-boundary` | helped | V348 stayed as CLI JSON readback for future consumers and did not build UI/API/MCP. | Does not prove future UI/API/MCP readiness. |
| `ts-boundary-unknown-first-result-state` | neutral | No external JSON input boundary was added; JSON is generated from typed internal candidates. | Does not prove future consumers validate this JSON. |

Initial broad pattern query returned zero results; a narrower `proof boundary`
query selected the applicable retained patterns.

## DB Readback

DB readiness:

```txt
Postgres: reachable
Migrations applied: 14/14
pgvector: available
Brain store readiness: ready
```

Persisted plan:

```txt
executionRun: b7271663-3420-4f14-939d-0e946f526440
evidenceBundle: aa28d5c6-9c45-4cb9-a922-ccb0bb603f22
reviewAssessment: 9460f597-357b-4658-894a-361f27d5c8f4
feedbackDelta: 91382528-f56c-43d6-b10c-554f25ed8a2a
observationGroup: 3ecee876-1033-46e9-82d6-11fdf92d0237
reflectionRecord: 9b587bfe-eb50-477a-b0ea-da831018aeee
MemoryRecord created: no
```

Readbacks generated under `.local-lab/v348/`:

```txt
source-to-decision-answer-package.json:
  kind: source_search_answer_package
  supportingClaims: 5
  supportingDocuments: 1
  includedCandidates: 6
  excludedCandidates: 6
  memoryMutation: none

broad-composite-answer-package.json:
  kind: source_search_answer_package
  supportingClaims: 6
  supportingDocuments: 0
  includedCandidates: 6
  excludedCandidates: 5
  memoryMutation: none
```

The first JSON readback attempt failed because `KRN_DATABASE_URL` was scoped only
to `cd`; the corrected command exported the variable before running the CLI.

## Verification

| Command | Result | Proves | Does not prove |
|---|---:|---|---|
| `rtk pnpm --filter @krn/cli test -- parseSourceArgs runSourceSearchCommand` | passed | Parser and source-search output tests cover `--json`, text output, answer package, raw candidates, proof boundaries. | Does not prove live DB data quality. |
| `rtk pnpm run typecheck` | passed | Workspace TypeScript accepts the CLI union and JSON output types. | Does not prove runtime usefulness. |
| `rtk env TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | Workspace tests pass after the change. | Does not prove product readiness. |
| `rtk pnpm db:ready` | passed | Current shell can reach Postgres, migrations, and pgvector. | Does not prove CI DB state. |
| `rtk node ... JSON.parse(...)` | passed | Live JSON readbacks parse and include answer package/proof/runtime fields. | Does not prove answer correctness or ranking quality. |
| `rtk pnpm --filter @krn/cli krn evidence capture --persist` | passed | EvidenceBundle, ReviewAssessment, and FeedbackDelta were persisted for the run. | Does not prove memory/source/eval candidates should be promoted. |
| `rtk pnpm --filter @krn/cli krn observe --persist` | passed | Five observation items were persisted for the run. | Does not prove reflection quality. |
| `rtk pnpm --filter @krn/cli krn reflect --persist` | passed | Five observations were selected and a ReflectionRecord was persisted with no MemoryRecord mutation. | Does not prove candidate extraction quality. |
| `rtk git diff --check` | passed | Diff has no whitespace errors. | Does not prove behavior. |

## Behavior

Text output remains default:

```txt
krn source search --query "..." [--limit <n>] [--max-inclusions <n>]
```

JSON output is opt-in:

```txt
krn source search --query "..." --json
```

The JSON output contains:

- `answerPackage.answer`;
- `answerPackage.supportingClaims`;
- `answerPackage.supportingDocuments`;
- `answerPackage.neutralOrNoise`;
- `answerPackage.missingEvidence`;
- `answerPackage.doesNotProve`;
- `answerPackage.recommendedNextAction`;
- `includedCandidates`;
- `excludedCandidates`;
- `proof.proves`;
- `proof.doesNotProve`;
- `runtime.memoryMutation: none`.

## Usefulness

This reduces future consumer friction: a UI, mini Brain-QA runner, MCP adapter,
or report generator can consume typed JSON later without parsing text output.

It also keeps the current product boundary honest: the JSON package is read-only
and explicitly says it does not prove source truth, ranking quality, embeddings,
graph retrieval, crawler readiness, product readiness, or Memory Core mutation.

## Next Recommended Task

V349 should use this JSON package as an actual consumer, not add another guard.

Recommended next task:

```txt
V349 Brain QA Source Search JSON Consumer Case
```

Goal: consume the JSON answer package in one small Brain-QA/readback case and
measure whether machine-readable output reduces review/report parsing burden.

Non-goals: no UI/API/MCP, no crawler, no ranking rewrite, no schema, no broad
benchmark.
