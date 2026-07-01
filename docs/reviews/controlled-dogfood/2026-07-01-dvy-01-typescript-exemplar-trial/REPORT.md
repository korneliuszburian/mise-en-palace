# DVY-01 TypeScript Exemplar Trial

Status: DB-backed dogfood report.

Date: 2026-07-01.

## Task

Use the retained reference implementation recipe boundary in one tiny local
TypeScript exemplar trial.

Boundaries:

```txt
no recipe runtime
no crawler
no broad skill/subagent system
no DB schema
no dashboard/API/MCP
no graph ranking rewrite
no Memory Core mutation
```

## KRN Plan Readback

Persisted plan:

```txt
executionRun: 684179e3-9e93-46cf-8a6c-51f9568567af
taskContract: fc8fd893-7bd2-4099-8146-1731c3a86f2b
harnessPlan: 2f9c4b92-e1da-4b82-aee4-3dbbc92558d5
contextAssembly: 075e5187-71a1-444c-83f3-b04f3aaf2630
```

Retained pattern selection:

```txt
selected
query: reference implementation recipe boundary
selectedPatternIds:
- reference-implementation-recipe-clone-boundary
```

Useful signal:

```txt
KRN selected the retained recipe boundary, but owner-file recall did not select
packages/harness/src/brainKnowledgeReadModel.ts. The owner file was chosen by
source inspection and prior catalog readback.
```

## Source-To-Decision

### Reference Implementation Recipe Boundary

```yaml
source_id: pattern:reference-implementation-recipe-clone-boundary
trust_tier: medium
source_class: repo-local retained pattern
mechanism: A reviewed local exemplar can act as reusable implementation shape
  only when it is versioned, searchable, verified, reviewable, and falsifiable.
krn_implication: Keep the recipe as brain knowledge and point to concrete code,
  not a new runtime or broad instruction system.
decision_kind: lab_test
decision: Add one local TypeScript parser exemplar pattern card.
consumer: brain knowledge catalog and future TypeScript parser-boundary repairs.
falsifier: A future repair claims the exemplar while trusting external JSON,
  omitting proof-boundary tests, or treating the exemplar as runtime cloning.
does_not_prove: Clone workflows outperform skills, broad code quality,
  product readiness, or recipe runtime need.
```

### TypeScript Unknown-First Boundary

```yaml
source_id: pattern:ts-boundary-unknown-first-result-state
trust_tier: high
source_class: repo-local retained pattern
mechanism: External JSON enters as unknown, finite fields are narrowed at the
  boundary, and invalid records are rejected through tests.
krn_implication: packages/harness/src/brainKnowledgeReadModel.ts is a suitable
  local exemplar for parser-boundary work.
decision_kind: lab_test
decision: Retain the parser as a searchable exemplar instead of changing the
  parser implementation.
consumer: future brain knowledge catalog JSON changes.
falsifier: A parser-boundary repair bypasses unknown-first parsing or proof
  boundaries while the exemplar pattern still appears ready.
does_not_prove: Complete TypeScript quality, semantic ranking, or transfer to
  every parser boundary.
```

## What Changed

Added:

```txt
docs/patterns/retained-patterns/ts-boundary-brain-knowledge-parser-exemplar.json
docs/brain-knowledge/usefulness-feedback/dvy-01-typescript-exemplar-trial.json
docs/reviews/controlled-dogfood/2026-07-01-dvy-01-typescript-exemplar-trial/REPORT.md
```

Updated:

```txt
docs/brain-knowledge/catalog.json
packages/harness/src/brainKnowledgeReadModel.test.ts
packages/harness/src/brainKnowledgeReadModelInvariants.test.ts
packages/cli/src/runKnowledgeCardsCommand.test.ts
packages/cli/src/runCli.test.ts
```

The new retained pattern makes this local exemplar searchable:

```txt
pattern:ts-boundary-brain-knowledge-parser-exemplar
```

It references the actual implementation and tests:

```txt
packages/harness/src/brainKnowledgeReadModel.ts
packages/harness/src/brainKnowledgeReadModel.test.ts
```

## Verification

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `rtk pnpm --filter @krn/harness test -- brainKnowledgeReadModel` | passed | read-model/parser tests and invariants accept the new exemplar card | full repo behavior |
| `rtk pnpm --filter @krn/cli test -- runKnowledgeCardsCommand` | passed | CLI catalog readback handles the new pattern and feedback | DB-backed behavior |
| `rtk pnpm --filter @krn/cli test -- runCli` | passed | plan/Codex-brief retained-pattern tests accept multi-match recall | product readiness |
| `rtk pnpm --filter @krn/cli krn brain knowledge --catalog-file docs/brain-knowledge/catalog.json --text "brain knowledge parser exemplar unknown-first recipe" --limit 5 --json` | passed | the exemplar is searchable through brain knowledge readback | semantic ranking quality |
| `rtk pnpm --filter @krn/cli krn brain knowledge --catalog-file docs/brain-knowledge/catalog.json --text "unknown first" --limit 5 --json` | passed | natural `unknown first` query returns both the exemplar and the underlying unknown-first pattern | ranking quality or single-best selection |
| `rtk proxy bash -lc 'pnpm typecheck'` | passed | strict TypeScript build passes | runtime behavior |
| `rtk pnpm test` | passed | full workspace test suite passes | product readiness |
| `rtk pnpm quality:fallow:ci` | passed | changed-files Fallow audit reports no issues | broad repo health |
| `rtk pnpm db:ready` | passed | local DB is reachable with migrations and pgvector | remote DB or CI DB readiness |
| `rtk git diff --check` | passed | patch has no whitespace errors | semantic correctness |

Persisted evidence:

```txt
evidenceBundle: c2f8f0fe-8208-4023-8e8f-0bb61d5c5678
reviewAssessment: b9dee4e7-4b10-4844-88e3-f9c677a1fdb6
feedbackDelta: 86f0bf11-5e6f-4249-80ab-0c1976147d0a
observationGroup: 8fd0fbfb-b7b1-4c4a-b9f0-7420b650810a
reflectionRecord: 5491180b-674a-45ba-82b0-da91ebd50dff
```

Run show confirmed:

```txt
intended changed files: 9
unrelated changed files: 0
unknown changed files: 0
operator-reported passed commands: 10
pattern usefulness outcomes: 3 helped
reflection findings: 0
candidate rows written: no
Memory mutation: none
```

## Pattern Usefulness

| Pattern | Outcome | Why | Caveat |
| --- | --- | --- | --- |
| `pattern:reference-implementation-recipe-clone-boundary` | helped | kept the slice on one local reviewed exemplar and blocked runtime/platform expansion | does not prove clone workflow quality |
| `pattern:ts-boundary-unknown-first-result-state` | helped | identified the existing unknown-first parser/test pair as a reusable exemplar | does not prove all parser boundaries should copy this file |
| `pattern:ts-boundary-brain-knowledge-parser-exemplar` | helped | created a searchable/reviewable local code exemplar with source refs, evidence refs, consumer, falsifier, and proof boundary | does not prove transfer at scale |

## What This Proves

```txt
- a retained recipe boundary can produce one concrete local TypeScript exemplar;
- the exemplar is searchable through brain knowledge readback;
- catalog/readback tests protect the new card and usefulness feedback;
- KRN can keep the source of truth in code/tests while making the pattern
  discoverable as brain knowledge.
```

## What This Does Not Prove

```txt
- product readiness;
- runtime clone automation;
- broad TypeScript code quality;
- semantic search or ranking quality;
- DB-backed Memory Core mutation;
- that skills are unnecessary;
- that every parser should copy the exact helper names or file layout.
```

## Next Candidate

```txt
mise-en-palace-9dt: Use parser exemplar in one real evidence metadata boundary repair.
```
