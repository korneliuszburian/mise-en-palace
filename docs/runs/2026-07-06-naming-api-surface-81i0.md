# Naming And API Surface Audit

Bead: `mise-en-palace-81i0`.

## Outcome

The first implemented batch removes one misleading exported `normalized`
surface:

- `NormalizedEvidenceCommand` -> `EvidenceCommandReadback`;
- `BaseNormalizedEvidenceCommand` -> `BaseEvidenceCommandReadback`;
- `normalizeEvidenceCommand` -> `toEvidenceCommandReadback`;
- `normalizedEvidenceCommandOrUndefined` -> `evidenceCommandReadbackOrUndefined`.

This is intentionally narrow. The DB column `normalized_intent` remains because
renaming a persisted column is not justified by this slice.

## Source Decisions

```yaml
source_id: google-typescript-style-descriptive-names
title: Google TypeScript Style Guide, descriptive names
url: https://google.github.io/styleguide/tsguide.html
trust_tier: high
source_class: official docs
mechanism: names should be descriptive and clear to new readers, and avoid
  ambiguous abbreviations.
krn_implication: KRN names should reveal the smallest true authority boundary,
  especially around proof, readback, promotion, and persistence.
decision_kind: adopt
decision: use as external support for the local anti-vanity naming gate.
does_not_prove: does not decide KRN domain vocabulary or justify broad renames.
consumer: docs/standards/code-vocabulary.md
falsifier: a future naming slice uses this source to rename precise domain
  vocabulary without local review-cost evidence.
```

```yaml
source_id: microsoft-typescript-coding-guidelines-names
title: Microsoft TypeScript coding guidelines, names
url: https://github.com/microsoft/TypeScript-wiki/blob/main/Coding-guidelines.md
trust_tier: high
source_class: official docs
mechanism: PascalCase for type names, camelCase for functions/properties/locals,
  and whole words when possible.
krn_implication: KRN should keep ordinary TypeScript casing boring and spend
  review attention on semantic authority, not style novelty.
decision_kind: adopt
decision: retain as support for explicit public type naming and whole-word
  replacements.
does_not_prove: does not prove whether a domain term such as Gate is valid.
consumer: docs/standards/code-vocabulary.md
falsifier: a KRN public type uses casing or abbreviation that makes authority
  less clear while tests still pass.
```

```yaml
source_id: typescript-eslint-naming-convention
title: typescript-eslint naming-convention
url: https://typescript-eslint.io/rules/naming-convention/
trust_tier: high
source_class: official docs
mechanism: identifier naming can be enforced with selectors and formats.
krn_implication: style automation is useful only after KRN defines semantic
  rules; linters cannot know whether a name overclaims authority.
decision_kind: defer
decision: do not add a naming linter in this slice; keep the standard and
  focused renames first.
does_not_prove: does not prove repo naming quality or semantic correctness.
consumer: follow-up Beads only if repeated drift appears.
falsifier: future renames keep recurring in the same classes of identifiers and
  review cost exceeds the cost of a scoped linter rule.
```

## Audit Decisions

Accepted:

- `NormalizedEvidenceCommand` was a poor public type name. The value is not
  "normal" truth; it is the readback shape after evidence command proof
  canonicalization.
- `packages/schema` wording in the code vocabulary standard was stale after the
  package deletion and now points to pure parsers beside domain types. After
  second-opinion review, the wording explicitly limits Zod to
  `packages/core/src/parsing/`.
- `normalizeEvidenceCommand` was too generic for an exported function returning
  the `EvidenceCommandReadback` shape, so it became
  `toEvidenceCommandReadback`.

Rejected:

- Broad removal of `Gate`: many gates are real enforcement or explicit
  proof-boundary names.
- Broad removal of local `normalize*` helpers: several internal helpers really
  canonicalize structured input and are locally precise.
- DB migration for `normalized_intent`: persisted-column churn is not justified.
- Historical docs cleanup: grep cleanliness is not worth rewriting history.

## Next Safe Batches

1. Review `final` in active docs and ADR names. Rename only if it implies truth
   rather than output stage or historical state.
2. Review `handler`/`manager` in CLI parser files. Rename only where the table
   owns parsing semantics, for example `*OptionParsers` instead of
   `*OptionHandlers`.
3. Review package authority docs for stale package references after large
   cleanup waves.

## Second Opinion

`second-opinion-claude` returned `approve_with_fixes` / `MEDIUM`.

Accepted fixes:

- the package-authority wording now records the local evidence that Zod parsing
  lives only under `packages/core/src/parsing/`;
- the exported conversion function was renamed from `normalizeEvidenceCommand`
  to `toEvidenceCommandReadback`;
- the report records the grep evidence requested by the reviewer.

Reviewer-requested grep evidence:

```txt
packages/schema tracked files: none after the schema package deletion.
packages/core Zod imports: packages/core/src/parsing/*.ts only.
stale TS symbol refs: no NormalizedEvidenceCommand, BaseNormalizedEvidenceCommand,
or normalizeEvidenceCommand refs outside this report's before/after notes.
```

Focused re-review after those fixes returned `approve` / `LOW` with no
findings or evidence gaps.

## Verification

Run after implementation:

```sh
pnpm -r --workspace-concurrency=1 --if-present typecheck
pnpm --filter @krn/cli test -- runShowReadback evidenceCaptureBehavior
pnpm --filter @krn/db test -- mappers DrizzleHarnessRunRepository
pnpm docs:lint
pnpm quality:fallow:ci
git diff --check
```

## Proof Boundary

Proves:

- one exported misleading `normalized` evidence-command type was removed;
- one exported generic `normalize*` evidence-command function was renamed to the
  readback conversion it performs;
- active vocabulary docs no longer cite deleted `packages/schema`;
- external naming sources were mapped through mechanism, KRN implication,
  decision, consumer, and falsifier.

Does not prove:

- whole-repo naming is clean;
- every `normalized`, `final`, `new`, `manager`, `handler`, or `gate` occurrence
  is justified;
- an automated naming linter is needed;
- product readiness.
