# V349 Brain QA Source Search JSON Consumer Case

Status: complete.

## Executive Verdict

The V348 `krn source search --json` output is usable as a small Brain-QA /
readback consumer input without parsing human text output. A local consumer read
two live DB-backed answer packages with `JSON.parse`, extracted answer,
supporting evidence, missing evidence, proof/non-proof boundaries, and raw
candidate inspectability, and preserved a real missing-document gap.

This lowers review/report parsing burden for technical operators. It does not
prove answer correctness, ranking quality, product readiness, or UI/API/MCP
readiness.

## Scope

No package source was changed.

Artifacts:

```txt
.local-lab/v349/source-to-decision-answer-package.json
.local-lab/v349/heartbeat-consensus-answer-package.json
.local-lab/v349/consumer-summary.json
```

Committed artifact:

```txt
docs/reviews/controlled-dogfood/2026-06-29-v349-brain-qa-source-search-json-consumer-case/REPORT.md
```

## Pattern Gate

Selected patterns:

| Pattern | Outcome | Evidence | Does not prove |
|---|---|---|---|
| `evidence-proof-non-proof-boundary` | helped | Consumer summary extracted `doesNotProve` and `proof.doesNotProve` directly from JSON fields. | Does not prove source truth or ranking quality. |
| `brain-knowledge-read-only-ui-boundary` | helped | V349 consumed read-only CLI JSON and did not build UI/API/MCP or mutation-capable surfaces. | Does not prove future product-surface readiness. |
| `codex-prompt-task-contract-proof-boundary` | neutral | V349 task contract stayed bounded, but no new Codex prompt behavior was implemented. | Does not prove prompt quality. |

## DB And Run Evidence

Preflight:

```txt
git status: clean before work
DB: ready
Postgres: reachable
Migrations applied: 14/14
pgvector: available
```

Persisted plan:

```txt
executionRun: f62a1896-3644-4374-8078-1f506595aed1
taskContract: e30648a5-5677-4b7e-82ec-4dcaf98c22f0
contextAssembly: 475f9c4e-64ad-4cb9-92d2-19f01f80ad58
evidenceBundle: e9e3bb88-32c0-46e0-91ae-2ae1f1bd8db8
reviewAssessment: 60a518d1-98f3-407a-8cb1-620c3ca7d977
feedbackDelta: 5138820c-46af-4863-919f-cd08c7ce1eea
observationGroup: e55fdbfc-c99a-4aa3-9d51-6bb7203ab80f
reflectionRecord: c4cba31e-7cd8-4e31-be19-1afbad2c102f
MemoryRecord created: no
```

Activation usefulness:

```txt
helped:
  - broad guardrails against crawler/UI/API/MCP/worker/schema drift
  - source graph preview context

neutral:
  - owner-file candidates for plan/run/activation code; V349 did not need source code edits

missing:
  - no direct V348 report/source-search JSON consumer context was selected

verdict:
  mixed positive for guardrails, weak for direct owner/report recall
```

## Consumer Case

The consumer used:

```txt
JSON.parse over krn source search --json output
```

It did not parse text output.

Cases:

| Case | Supporting claims | Supporting documents | Included | Excluded | Missing evidence | Parsing burden |
|---|---:|---:|---:|---:|---|---|
| source-to-decision | 5 | 1 | 6 | 6 | none from current diagnostics | lower |
| heartbeat-consensus | 6 | 0 | 6 | 5 | matching SearchDocument evidence for this combined query; topic-specific SearchDocuments may still exist | lower |

Aggregate:

```txt
cases: 2
loweredParsingBurden: 2
allRawCandidatesInspectable: true
allProofBoundariesPresent: true
memoryMutation: none
```

## Review Burden Delta

Before V348/V349:

```txt
Reviewers had to inspect human text output to find answer, missing evidence,
does-not-prove, candidate counts, and non-mutation boundaries.
```

After V349:

```txt
A consumer can extract those fields from JSON deterministically:
answerPackage.answer
answerPackage.supportingClaims
answerPackage.supportingDocuments
answerPackage.missingEvidence
answerPackage.doesNotProve
includedCandidates
excludedCandidates
proof.doesNotProve
runtime.memoryMutation
```

Delta:

```txt
reduced for report/readback consumers
```

## What This Proves

- JSON answer packages can be consumed without parsing text output.
- Consumer can read answer, evidence, missing evidence, proof boundaries, and
  raw candidate counts from typed fields.
- The read-only boundary survived: no UI/API/MCP, crawler, schema, ranking
  rewrite, embeddings, graph runtime, worker, or Memory Core mutation.

## What This Does Not Prove

- answer correctness;
- source truth;
- ranking quality;
- semantic retrieval quality;
- broad benchmark quality;
- UI/API/MCP readiness;
- product readiness;
- Memory Core mutation safety beyond this read-only run.

## Next Recommended Task

```txt
V350 Mini Brain-QA JSON Batch Preview
```

Use the source-search JSON answer package across a small batch of 3-5
Brain-QA/readback questions. Measure answer-package coverage, missing evidence,
raw candidate inspectability, and review parsing burden.

Non-goals:

```txt
no broad benchmark
no UI/API/MCP
no crawler
no ranking rewrite
no schema
no embeddings or graph runtime
no Memory Core mutation
```
