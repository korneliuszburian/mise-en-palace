# Repair Contract

Status: controlled target substrate contract.

## Task

Repair the weak user service boundary so external input is validated before it
becomes domain data.

## V252 Baseline Weaknesses

```txt
unsafe JSON.parse
any at IO boundary
trusted env string
mixed IO/domain behavior
null failure state
missing invalid-input tests
```

## V253 Repair Result

The JSON/input/result boundary is now repaired in the current fixture state.
Future work should add a reset/generator or baseline/expected variant so this
substrate can be replayed without relying on git history.

## Must Not Do

```txt
no framework migration
no broad cleanup
no dashboard
no network calls
no external service
no hidden command execution
no product-ready claim
```

## Best-Pattern Pressure

| Pattern | Mechanism | Expected local decision | Falsifier |
|---|---|---|---|
| unknown-first boundary | External input is untrusted until narrowed. | Parse raw JSON to `unknown`, then validate. | Domain code accepts raw parsed values directly. |
| finite result state | Success/failure changes valid fields. | Use a discriminated union for create-user result. | Callers must infer errors from `null` or booleans. |
| proof/non-proof | Tests prove only covered behavior. | Report what `pnpm test` proves and does not prove. | Passing tests are described as product quality. |
| surgical repair | Small target scope reduces review burden. | Touch only config/user service/tests unless needed. | Unrelated refactor appears in diff. |

## Candidate Outputs

A successful KRN trial may produce reviewable candidates:

- MemoryCandidate: target external inputs should stay `unknown` until validated.
- EvalCandidate: weak target substrate should fail review if `JSON.parse` result
  reaches domain logic unchecked.
- SourceDecision: TypeScript finite-state guidance should map to result unions.

Candidates are proposal-only unless explicitly reviewed.
