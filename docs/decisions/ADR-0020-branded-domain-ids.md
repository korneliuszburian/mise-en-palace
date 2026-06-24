# ADR-0020: Branded Domain IDs

Status: accepted.

Date: 2026-06-24

Decision status: implemented by TSQ-01 pilot.

## Context

`packages/core/src/ids.ts` has historically defined KRN IDs as plain string
aliases. That kept adapter and fixture code simple, but it also made unrelated
object identities type-compatible. A `SourceClaimId` could be passed where a
`MemoryRecordId` or `ExecutionRunId` was expected once the value was already
typed.

The current Memory Brain spine now passes IDs across core, harness, DB, worker,
and CLI boundaries often enough that accidental cross-ID assignment is a real
modeling risk. The same slice must avoid a whole-repo constructor/parsing
refactor because DB rows, CLI arguments, and fixtures still enter as strings.

## Source Decisions

source_id: `packages/core/src/ids.ts`
trust_tier: high live source.
mechanism: every ID was a `string` alias, so TypeScript could not distinguish
execution-run, memory-record, memory-candidate, and source-claim identities.
krn_implication: high-risk IDs should carry domain identity at compile time.
decision: adopt a branded pilot for the highest-risk IDs.
does_not_prove: runtime ID format validation, DB row semantic validity, or that
every ID family should be converted in one slice.
consumer: `packages/core/src/ids.ts`.
falsifier: cross-ID assignment still compiles after the pilot, or the pilot
forces broad casts across DB/CLI/harness code.

source_id: `docs/standards/typescript-excellence.md`
trust_tier: high repo standard.
mechanism: the standard requires domain types first, explicit public types, and
type shapes that make wrong authority hard to express without weakening strict
boundaries.
krn_implication: ID identity is domain authority and should be visible in the
type system where it reduces real mix-up risk.
decision: adopt branded domain IDs as a narrow type-safety improvement.
does_not_prove: hard opaque constructors are required now.
consumer: TypeScript public boundary rules.
falsifier: the branded model encourages `as any`, double assertions, or
unchecked parsing to keep existing code compiling.

source_id: TSQ-01 local TypeScript soft-brand experiment.
trust_tier: high local compiler evidence for this repo's TypeScript version.
mechanism: `string & { readonly [brand]?: "Brand" }` remains assignable from a
raw `string`, but differently branded values are not assignable to each other.
krn_implication: KRN can gain cross-ID separation without immediately adding
constructors or touching every string-producing IO boundary.
decision: pilot soft brands instead of hard opaque IDs.
does_not_prove: the project should never add runtime ID parsers or hard brands.
consumer: `BrandedKrnId<TBrand>`.
falsifier: soft brands fail to block typed cross-ID assignment under
`pnpm typecheck`, or future slices start treating raw string compatibility as
runtime validation.

## Decision

Adopt soft branded IDs for the current high-risk pilot:

- `ExecutionRunId`;
- `MemoryRecordId`;
- `MemoryCandidateId`;
- `SourceClaimId`.

The brand is intentionally optional:

```ts
type BrandedKrnId<TBrand extends string> = string & {
  readonly [krnIdBrand]?: TBrand;
};
```

This keeps current string-producing fixtures, DB reads, CLI args, and schema
outputs compatible while preventing already-typed IDs from being mixed across
the selected identity families.

The pilot adds a compile-time proof file under `packages/core/src` so
`pnpm typecheck` fails if the selected branded IDs become mutually assignable
again. Runtime behavior stays string-only.

## Rejections

- Hard opaque IDs for every ID family now: rejected because it would require
  constructors/parsers across IO boundaries in one broad diff.
- Runtime wrapper objects: rejected because KRN IDs are persisted and exchanged
  as strings.
- Branding every ID in this slice: rejected as a whole-repo refactor.
- Fixing DB/CLI runtime ID validation now: rejected as a separate IO-boundary
  problem.

## What This Does Not Prove

- Raw strings are semantically valid IDs.
- DB rows contain the correct object identity.
- Every ID family has been hardened.
- Runtime ID format validation exists.

## Rollback

Revert the TSQ-01 commit if the soft-brand pilot causes broad casts, weakens
external boundary validation, or blocks normal repo compilation without a
focused path to parser-owned ID constructors.

## Future Work

- Promote more ID families only when a concrete cross-ID risk is found.
- Add parser-owned runtime ID constructors only at real external boundaries.
- Consider hard brands only after DB/CLI/schema boundary constructors exist.
