# tnvb Evidence Enum Normalizer

Date: 2026-07-02

Issue: `mise-en-palace-tnvb`

Commit: this commit; final SHA is recorded in the session summary.

## Goal

Verify the current audit finding about repeated enum normalization in
`packages/core/src/evidenceBundle.ts` and, if still true, apply one bounded
production-code simplification without changing evidence semantics.

## Source To Decision

Source:

- current repo source: `packages/core/src/evidenceBundle.ts`;
- current tests: `packages/core/src/evidenceBundle.test.ts`;
- audit finding: repeated `normalizeToken -> Set.has -> cast -> fallback`
  normalizers for target evidence enum-ish fields;
- retained reference-implementation recipe principle: code should carry the
  reusable shape when a local pattern is clearer than repeated prose.

Mechanism:

- The previous implementation had five separate `Set<T>` values and five
  nearly identical normalizer functions.
- Each function repeated the same type cast at the call site.
- A single local helper can centralize token normalization, allowed-value
  lookup, fallback behavior, and the one necessary cast.

KRN implication:

- This is an appropriate production-code repair because it reduces repeated
  normalizer shape in the evidence core while preserving the public normalizer
  functions and existing behavior tests.

Decision:

- Adopt a small local `createTokenNormalizer(values, fallback)` helper.
- Represent each target evidence vocabulary as `as const satisfies readonly T[]`.
- Keep the exported normalizer names unchanged.
- Do not redesign `EvidenceBundle`, metadata validation, command provenance, DB
  schema, CLI behavior, or review-domain types.

Consumer:

- target evidence normalization in `@krn/core`;
- existing CLI evidence capture paths that call target evidence normalization;
- future small parser/normalizer cleanup slices.

Falsifier:

- existing target evidence tests fail;
- hyphenated inputs like `observation-only` or `changed-since-selection` stop
  normalizing to underscore vocabulary;
- unknown values no longer fall back to `unknown`;
- public exported normalizer names change.

## KRN Plan Readback

Command:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
pnpm --filter @krn/cli krn plan \
  --task "Simplify evidence enum normalization with one local typed factory in packages/core/src/evidenceBundle.ts if the repeated normalizeToken Set.has cast boilerplate is still present; preserve TargetEvidence semantics and focused tests; no EvidenceBundle redesign, metadata schema migration, DB schema, CLI behavior change, command provenance rewrite, or review-domain consolidation" \
  --persist
```

Persisted IDs:

```txt
executionRun: e20b459f-6bdf-4758-a48e-354ebd5fabe7
taskContract: b184582f-f40f-4b45-b2f3-27871ce42467
contextAssembly: f8998d67-a7e6-40f5-97e4-bcf1cd5eb0d5
```

Activation usefulness:

```txt
weak for owner-file recall; source inspection found evidenceBundle.ts
```

Retained pattern selection:

```txt
none selected
```

This is useful negative evidence: the repair still proceeded through local
source inspection rather than forcing an unrelated retained pattern match.

## Changed

- Added `createTokenNormalizer` in `packages/core/src/evidenceBundle.ts`.
- Replaced five repeated target evidence normalizer implementations with local
  vocabulary arrays and helper calls.
- Kept exported normalizer names stable.
- Net production diff before final docs:

```txt
46 insertions
54 deletions
```

## Verification

Focused verification passed:

```sh
pnpm --filter @krn/core test -- evidenceBundle
pnpm typecheck
```

Observed:

```txt
@krn/core evidenceBundle focused run: 14 files / 73 tests passed
workspace typecheck: passed
```

Full verification passed:

```txt
pnpm test
pnpm quality:fallow:ci
pnpm db:ready
pnpm --filter @krn/harness test -- activePlanInvariants
git diff --check
```

Full test result:

```txt
@krn/core: 14 files / 73 tests passed
@krn/harness: 34 files / 188 tests passed
@krn/schema: 3 files / 27 tests passed
@krn/workers: 6 files / 40 tests passed
@krn/codex-adapter: 4 files / 9 tests passed
@krn/db: 27 files / 84 tests passed
@krn/cli: 41 files / 322 tests passed
```

Fallow:

```txt
Audit scope: 2 changed files vs 30b6262b15a3
No issues in changed files
```

DB readiness:

```txt
Postgres reachable
14/14 migrations applied
pgvector available
Brain store readiness ready
```

## Proof

This proves:

- the audit finding was still current;
- one local typed helper can remove repeated enum normalization logic without
  changing the tested target evidence behavior;
- the public normalizer surface stayed stable enough for existing tests and
  typecheck.

This does not prove:

- all `EvidenceBundle.metadata` typing gaps are solved;
- command provenance normalization needs no future work;
- all audit findings are still true;
- product readiness.

## Review Burden Delta

Before:

```txt
reviewers had to inspect five nearly identical normalizer functions and five
casts to confirm identical fallback behavior
```

After:

```txt
reviewers inspect one helper and five vocabulary arrays with satisfies checks
```

Verdict:

```txt
positive, bounded
```

## Second-Opinion Prompt

Use this prompt after the commit to force critical review:

```md
# Review Prompt: tnvb Evidence Enum Normalizer

Review commit `<sha>` in `mise-en-palace`.

Focus only on:

1. Did `createTokenNormalizer` simplify the repeated target evidence enum
   normalizers without weakening type safety?
2. Do the `as const satisfies readonly T[]` vocabularies preserve the intended
   domain values?
3. Do existing tests still prove hyphen-to-underscore normalization and unknown
   fallback behavior?
4. Is the single internal cast acceptable, or should the helper be reshaped?
5. Did the slice avoid EvidenceBundle redesign, metadata schema changes, CLI
   behavior changes, DB schema changes, and command provenance rewrites?

Return findings first, ordered by severity. If there are no issues, say that
clearly and name the remaining risk.
```

## Evidence Loop

Persisted evidence capture:

```txt
evidenceBundle: 78cd4214-5d46-4684-9487-d97bdeade3b4
reviewAssessment: e04be056-488e-4f4d-be31-36614f307429
feedbackDelta: 81143350-a187-49da-b6e3-78a133db6989
changed files: 7 intended, 0 unrelated, 0 unknown
commands: 7 operator_reported / passed
sourceUsefulnessOutcomes: none
patternUsefulnessOutcomes: none
```

Persisted observe/reflect:

```txt
observationGroup: 13d6f9e1-1162-4802-bb72-402379779d6b
observationItems: 5
reflectionRecord: ef339848-4a52-481d-ba08-48fba09ae56f
observationsSelectedByReflect: 5
findings: 0
candidateRowsWritten: no
memoryMutation: none
```

## Next Task

Created follow-up:

```txt
mise-en-palace-tsa4 Tighten EvidenceBundle metadata readback typing
```

Why:

```txt
tnvb removed repeated enum normalization boilerplate; the next bounded audit
finding is the evidence metadata `Record<string, unknown>` escape hatch where
readback already has a narrow known-field shape.
```
