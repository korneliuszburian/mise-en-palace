# SBV-02 Retained Pattern Code-Quality Vertical

Status: DB-backed dogfood report.

Date: 2026-07-01

## Executive Verdict

SBV-02 proved that a retained pattern can drive a bounded source improvement:
the `unknown-first` TypeScript boundary pattern was selected through
`krn brain knowledge`, applied to brain knowledge catalog JSON parsing, tested,
captured as evidence, observed, reflected, and replayed. The run also exposed a
real gap: persisted `krn plan` selected the general source-to-decision retention
gate, but did not select the specific TypeScript pattern or owner files for the
changed CLI boundary. Next repair should bridge retained pattern catalog
selection into persisted planning/evidence without inventing a broad roadmap.

## Selected Pattern

```txt
pattern:ts-boundary-unknown-first-result-state
```

Mechanism:

```txt
External JSON/env/file/CLI/MCP inputs should enter as unknown, narrow near the
boundary, and return explicit finite result states when callers need failure
reasons.
```

Consumer:

```txt
brain knowledge catalog JSON file parsing
```

Falsifier:

```txt
invalid catalog files collapse missing/unreadable, invalid JSON, non-object JSON,
and schema-invalid object into the same undefined/generic error path.
```

## What Changed

`packages/cli/src/cliFileBoundary.ts`

- added `JsonObjectReadResult`;
- added `readJsonObjectResult`;
- preserved `readJsonObject` compatibility;
- kept `JSON.parse` unknown-first for the existing invariant suite.

`packages/cli/src/runKnowledgeCardsCommand.ts`

- uses `readJsonObjectResult` for catalog file parsing;
- reports finite failure reasons for unreadable, invalid JSON, non-object JSON,
  or schema-invalid catalog objects.

Tests:

- `packages/cli/src/cliFileBoundary.test.ts`
- `packages/cli/src/runKnowledgeCardsCommand.test.ts`

## DB-Backed Run

```txt
executionRun: f8072186-b509-4aa0-9598-9f7591d0d120
taskContract: 8dda5706-e2e1-4910-8674-b12206f3cda7
contextAssembly: 590c7ba5-a110-43a0-8db6-276a416314d9
evidenceBundle: e426e33c-c1ec-4b87-bb38-1dad8cf499e7
reviewAssessment: 78bbe22a-3b0a-4d12-8e45-9734ab148110
feedbackDelta: 3e013a86-89bf-43e1-8f49-f73bf29f149f
observationGroup: 03a0ebff-43df-4f82-a1a1-af30fecb624f
reflectionRecord: 4ff0dba4-5d43-4bde-a45c-5956e0d78e5c
```

## Pattern Usefulness

| Item | Outcome | Evidence | Caveat |
| --- | --- | --- | --- |
| `pattern:ts-boundary-unknown-first-result-state` | helped | `krn brain knowledge --text "unknown-first"` returned the pattern; code change applies explicit result states at JSON boundary | not persisted as a SourceClaim usefulness outcome because no matching live SourceClaim was selected |
| `source_claim:125366b1-8bd9-4092-92d8-1aa1d2ed46ae` | helped | persisted plan selected the retention gate; evidence capture recorded source usefulness | proves retention-gate usefulness, not specific TypeScript pattern persistence |

## Activation / Planning Finding

The explicit persisted plan:

```txt
Apply retained unknown-first TypeScript boundary pattern to brain knowledge catalog JSON file parsing with explicit finite result states and proof boundaries
```

selected useful guardrails, including:

- `source_claim:125366b1-8bd9-4092-92d8-1aa1d2ed46ae`
- `source_claim:e3a72d7f-0fbf-4263-a2f8-cf8c93cc9c27`

It did not select:

- `pattern:ts-boundary-unknown-first-result-state`;
- `packages/cli/src/cliFileBoundary.ts`;
- `packages/cli/src/runKnowledgeCardsCommand.ts`.

Verdict:

```txt
mixed positive: retained pattern readback helped implementation, but persisted
planning still needs a bridge from selected catalog patterns to owner-file/source
context.
```

## Evidence

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `pnpm --filter @krn/cli test -- cliFileBoundary runKnowledgeCardsCommand` | passed | focused CLI boundary/catalog behavior passes | full repo or DB behavior |
| `pnpm --filter @krn/cli test -- runCli` | passed | CLI entry test suite still passes | brain usefulness or source truth |
| `pnpm run typecheck` | passed | strict TS build passes | runtime behavior |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | full workspace tests pass in current shell | product readiness |
| `pnpm quality:fallow:ci` | passed | changed-files Fallow audit has no issues | broad repo has no findings |
| `git diff --check` | passed | whitespace patch check passes | semantic correctness |
| `pnpm db:ready` | passed earlier in slice | local DB reachable with migrations/vector readiness | remote/CI DB readiness |
| `krn evidence capture --persist` | passed | evidence/review/feedback records persisted | commands were executed by capture |
| `krn observe --persist` | passed | observations persisted without Memory Core mutation | reflection quality |
| `krn reflect --persist` | passed | reflection record persisted without Memory Core mutation | useful candidate generation |

## Readback

`krn run show --run-id f8072186-b509-4aa0-9598-9f7591d0d120`
confirmed:

- 4 intended changed source/test files;
- 1 unrelated dirty file: `.beads/issues.jsonl`;
- 6 operator-reported passed command rows;
- source usefulness outcome for `source_claim:125366...`;
- observe/reflect records;
- Memory mutation: none.

`krn brain knowledge --text "unknown-first" --json` replayed:

- `pattern:source-to-decision-retention-gate`;
- `pattern:ts-boundary-unknown-first-result-state`;
- both with `outcome: helped`.

## Candidate Outputs

Repair candidate:

```txt
Bridge retained pattern catalog selection into persisted planning/evidence.
```

Why:

```txt
SBV-02 used a catalog pattern successfully, but persisted plan/evidence can only
record source usefulness for selected SourceClaims/decisions. This leaves a gap
between file-catalog pattern usefulness and DB-backed source usefulness.
```

Non-goals:

```txt
no dashboard, API, MCP, DB schema, crawler, worker daemon, broad ranking rewrite,
or Memory Core mutation.
```

Verification:

```txt
pattern selected before implementation;
persisted plan/readback can name the selected retained pattern or explicitly
record why it was rejected;
evidence can record pattern usefulness without fake source claims.
```

## Product Readiness Signal

This improves the shared brain kernel, not product readiness. KRN is still
controlled internal alpha. The useful product movement is that retained patterns
now drove a real code-quality improvement and surfaced the next bridge required
for pattern/research brain continuity.

