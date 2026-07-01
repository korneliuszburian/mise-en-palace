# SDT-01 Reference Implementation Pattern

Date: 2026-07-01.

## Task

Use the CPR-01 repaired retained-pattern bridge in one bounded source-to-decision slice.

Decision target:

```txt
Should KRN retain the user-provided reference implementation / clone recipe
workflow as reusable brain knowledge for future code-quality pattern intake?
```

## KRN Plan Readback

Persisted plan:

```txt
executionRun: dbb6b006-ba58-4a53-8630-334e2c3f536f
taskContract: 3c8c5a7a-d0f0-40b8-861c-eec270db20c6
harnessPlan: 28adc475-0ec1-4834-aded-ba507f88cd56
contextAssembly: fecb37c7-1365-4d83-902b-2606b963b410
```

Retained pattern selection:

```txt
selected
query: consensus heartbeat review boundary
selectedPatternIds:
- consensus-relation-heartbeat-review-boundary
```

Run show and Codex brief both read back:

```txt
Retained pattern selection: selected
Retained pattern IDs: consensus-relation-heartbeat-review-boundary
```

## Source-To-Decision

### User-Provided Practitioner Screenshots

```yaml
source_id: user-reference-implementation-clone-screenshots-2026-07-01
title: Reference implementation / clone recipe practitioner notes
url_or_ref: user-provided screenshots in current thread
trust_tier: low
source_class: user-provided research
mechanism: Keep one reviewed local exemplar as the source of implementation shape, version or hash the exemplar, and reuse it as a recipe so future code aligns to proven structure instead of repeatedly interpreting broad markdown instructions.
krn_implication: KRN can retain this as a lab-test pattern for future TypeScript/code-quality intake, but only when the exemplar is local, reviewed, verified, source-to-decision mapped, and falsifiable.
decision_kind: lab_test
decision: Retain a deferred/lab pattern, not an adopted runtime workflow.
consumer: future TypeScript pattern intake and code-quality pattern gates
falsifier: A future KRN slice treats a recipe/example as authoritative without verification, source-to-decision mapping, drift evidence, reviewability reasons, or proof/non-proof boundaries.
does_not_prove: The screenshots do not prove that clone workflows outperform skills, that all examples are good, or that KRN should build a recipe runtime now.
```

### Public TypeScript Articles

```yaml
source_id: public-typescript-pattern-articles-2026-07-01
title: Public TypeScript mechanism articles
url_or_ref:
  - https://4markdown.com/inferring-iterables-with-typescript/
  - https://greenonsoftware.com/articles/research/types-vs-interfaces-in-typescript-fully-explained/
  - https://4markdown.com/mapped-types-in-typescript/
  - https://4markdown.com/5-game-changing-typescript-utility-types-you-should-master/
trust_tier: medium
source_class: practitioner writing
mechanism: The articles expose concrete TypeScript mechanisms such as infer, mapped types, type/interface tradeoffs, and utility-type modeling that can be encoded as local exemplars.
krn_implication: Use public articles as source refs and mechanism hints for future local TypeScript exemplars; do not copy article content wholesale or promote them as product truth without local tests.
decision_kind: lab_test
decision: Keep as supporting sources for the retained recipe pattern.
consumer: future TypeScript pattern intake
falsifier: A TypeScript recipe pattern claims readiness while lacking local compiled examples, tests, or evidence refs.
does_not_prove: These articles do not prove KRN code quality, local applicability, performance claims, or that every TypeScript pattern should be retained.
```

## Retained Pattern Decision

Added:

```txt
docs/patterns/retained-patterns/reference-implementation-recipe-clone-boundary.json
```

Cataloged in:

```txt
docs/brain-knowledge/catalog.json
```

Decision:

```txt
adoptionStatus: lab
confidence: medium
reviewability: ready
nextAction: review
```

Rationale:

```txt
The mechanism is plausible and directly matches the project direction:
condense useful patterns into reusable brain knowledge that improves future
code. It is not ready for adopt_now because this slice did not run a local
exemplar/clone trial and did not prove quality improvement.
```

## Retained Pattern Usefulness

Selected retained pattern:

```txt
pattern:consensus-relation-heartbeat-review-boundary
```

Classification:

```txt
helped as governance boundary
neutral for clone-workflow domain content
```

How it helped:

```txt
It constrained the slice to relation/review usefulness, evidence refs,
candidate reviewability, mutation none, and explicit decision options before
any runtime, schema, crawler, subagent, MCP, graph ranking, or Memory Core
mutation work.
```

What it did not do:

```txt
It did not supply the clone-workflow mechanism. That content came from the
user-provided sources and public TypeScript articles.
```

## Verification Results

Verification after implementation:

```txt
pnpm db:ready: passed
krn brain knowledge --catalog-file docs/brain-knowledge/catalog.json --text "reference implementation clone recipe TypeScript" --json: passed
pnpm --filter @krn/harness test -- brainKnowledgeReadModel: passed
pnpm --filter @krn/cli test -- runKnowledgeCardsCommand: passed
pnpm typecheck: passed
pnpm test: passed
pnpm quality:fallow:ci: passed
git diff --check: passed
krn evidence capture --persist: passed
krn observe --persist: passed
krn reflect --persist: passed
```

Typecheck note:

```txt
`rtk pnpm typecheck` returned a wrapper-level nonzero status while the captured
TypeScript output said no errors. Re-running through `rtk proxy bash -lc 'pnpm
typecheck'` returned a normal zero exit code and all package typechecks passed.
```

Persisted evidence:

```txt
evidenceBundle: d7bd80ad-c4eb-4d35-bdbc-fe1c073c0c75
reviewAssessment: d7b6fe7f-3a79-4eee-a403-39d5c4498c79
feedbackDelta: bf8769af-ab83-41ff-9bdb-eb9758fffeb7
observationGroup: 6936942d-bf3c-47cb-959d-5bfdb3218574
reflectionRecord: c559eef5-d046-456b-ac6d-613835e6deda
```

Dirty-context readback:

```txt
intended: 11
unrelated: 0
unknown: 0
```

## What This Proves

```txt
- The repaired plan bridge selected the retained consensus relation pattern.
- The selected pattern reached run show and Codex brief readback.
- User-provided practitioner/source material was condensed through source-to-decision instead of retained as decorative context.
- The new reference implementation recipe pattern is cataloged and can be searched through brain knowledge readback.
```

## What This Does Not Prove

```txt
- clone workflow quality;
- recipe runtime readiness;
- TypeScript pattern superiority;
- broad skill/subagent/MCP need;
- source truth;
- product readiness;
- Memory Core mutation;
- graph/ranking/worker behavior.
```

## Candidate Output

```yaml
type: SourceDecision
reviewability: ready
decision: review
summary: Reference implementation recipes may be lab-tested as local, verified, source-mapped exemplars for future code-quality pattern intake.
evidence_refs:
  - docs/reviews/controlled-dogfood/2026-07-01-sdt-01-reference-implementation-pattern/REPORT.md
  - docs/patterns/retained-patterns/reference-implementation-recipe-clone-boundary.json
doesNotProve: Candidate does not prove clone workflow quality, runtime readiness, or source truth.
```

## Next Recommended Action

```txt
Use the retained pattern in one tiny TypeScript exemplar trial: pick one local
well-reviewed TypeScript boundary pattern, make the exemplar searchable through
brain knowledge, then verify whether it reduces implementation/review burden in
one real code slice.
```

Follow-up:

```txt
mise-en-palace-dvy Use reference implementation recipe pattern in one TypeScript exemplar trial
```
