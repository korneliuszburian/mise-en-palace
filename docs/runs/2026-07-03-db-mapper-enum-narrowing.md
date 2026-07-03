# DB Mapper Enum Narrowing

Date: 2026-07-03

Bead: `mise-en-palace-283u`

## Scope

Remove the highest-risk ad hoc enum casts in
`packages/db/src/repositories/mappers.ts` without changing Drizzle schema or
mapper ownership.

## Change

The mapper now uses explicit enum predicates backed by `ReadonlySet<string>`
instead of repeated `value as DomainEnum` checks for:

- operator intent source;
- evidence diff risk;
- evidence command status;
- evidence command provenance;
- source decision status;
- source trust tier.

Focused tests prove unknown operator intent sources and unknown evidence diff
risks throw instead of entering domain records.

## Verification

```txt
pnpm --filter @krn/db test -- mappers
pnpm -C packages/db typecheck
pnpm quality:fallow:ci
git diff --check
```

Additional grep:

```txt
rg "value as OperatorIntentSource|value as DiffRisk|value as EvidenceCommandStatus|value as EvidenceCommandProvenance|value as SourceDecision|value as SourceTrustTier" packages/db/src/repositories/mappers.ts
```

returned no matches.

## Proof Boundary

Proves:

- selected DB enum/string boundaries no longer rely on repeated mapper-local
  casts;
- invalid source/diff-risk DB strings fail closed in focused tests.

Does not prove:

- every mapper cast in the repository is gone;
- DB schema enum drift cannot happen elsewhere;
- broad mapper simplification or camelCase schema migration;
- KRN product readiness.
