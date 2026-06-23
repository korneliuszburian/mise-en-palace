# QG-04 — Code Smell And Bloat Audit

> Historical audit/planning ledger.
> Not current execution truth.
> Current canonical execution plan: `/PLAN.md`.
> Reset decision, 2026-06-23: QG-06/productized audit automation is rejected as
> active product direction. Treat QG-06 references below as historical evidence
> or quarry for bounded internal guards only.

Date: 2026-06-23

Status: complete as audit; repair slices are queued before feature work resumes.

## Scope

QG-04 reviews production TypeScript, colocated tests, and current quality
standards for:

- placeholder/stub/fake/mock/temp vocabulary;
- oversized files and command modules;
- duplicated helper families;
- over-broad utility patterns;
- tests that normalize temporary architecture;
- stale current-state docs.

It does not implement broad refactors. Large file splits must be done as
separate behavior-preserving slices with focused tests, because careless
cleanup would be more dangerous than the smell it removes.

## Evidence Commands

```sh
find packages -path '*/src/*.ts' -o -path '*/src/**/*.ts' | grep -v '\.test\.ts$' | xargs wc -l | sort -nr | head -35
rg -n "placeholder|fake|dummy|TODO|HACK|workaround|as unknown as|as any as|@ts-ignore|@ts-expect-error" packages tests --glob '*.{ts,tsx}'
rg -n "const readJsonObject|const findRepoRoot|const pathExists|const parseConfidence|const confidenceAliases|rejectPrivateReasoningMetadata|rejectForbiddenMetadata|TextListSchema|const normalizeOutcome|const normalizeRisk|const riskValues" packages --glob '*.ts'
pnpm --filter @krn/db test -- mappers
```

## Cleanup Applied Now

The retrieval substrate smoke used `placeholder` vocabulary for deterministic
local embedding proof rows. That was technically harmless, but it violated the
repo rule that tests and smokes must not normalize temporary-looking language.

Changed:

- `placeholderVector` -> `deterministicSmokeVector`;
- provider `local-placeholder` -> `local-smoke`;
- model `placeholder-1536` -> `smoke-1536`;
- content hash prefix `retrieval-placeholder-*` -> `retrieval-smoke-*`;
- mapper test fixtures now use `local-smoke`, `smoke-1536`, and `smoke-hash`.

Focused verification:

```sh
pnpm --filter @krn/db test -- mappers
```

Result: 23 files passed, 65 tests passed.

Post-cleanup vocabulary scan over `packages` and `tests` reports only
intentional audit test inputs for double assertion and TypeScript suppression
markers.

## Blocking Findings

### QG-04A — CLI Filesystem And JSON Boundary Helpers Are Duplicated

Evidence:

- `packages/cli/src/runDoctorCommand.ts` defines local `pathExists`,
  `findRepoRoot`, and `readJsonObject`.
- `packages/cli/src/runInitCommand.ts` defines local `pathExists` and
  `readJsonObject`.
- `packages/cli/src/runDbReadinessCommand.ts` and
  `packages/cli/src/runDbSmokeCommand.ts` define local `pathExists` and
  `findRepoRoot`.

Why this matters:

These helpers sit on external file/JSON boundaries. Duplicating them invites
slightly different unknown narrowing, error handling, and repo-root behavior.

Repair task:

Create a small CLI boundary module for filesystem existence, repo-root
discovery, and JSON-object reading. Keep returned JSON as `unknown` until the
calling command validates the exact shape.

Falsifier:

A CLI command still defines its own JSON/object parser or repo-root walk after
the shared boundary module exists.

### QG-04B — `parseArgs.ts` Is A Command Parser Monolith

Evidence:

- `packages/cli/src/parseArgs.ts`: 2181 production lines.

Why this matters:

The file owns many unrelated command syntaxes. It is hard to review whether a
new command changed only its own surface, and it encourages append-only parser
growth.

Repair task:

Split command parsing by command family while preserving one public
`parseArgs` entrypoint. Add table-driven tests for representative commands
before moving logic.

Falsifier:

A new command can only be added by editing a multi-thousand-line parser file.

### QG-04C — `runDoctorCommand.ts` Mixes Too Many Readiness Concerns

Evidence:

- `packages/cli/src/runDoctorCommand.ts`: 2124 production lines.

Why this matters:

Doctor should remain read-only and explain readiness. A large mixed command
module makes it harder to prove that checks do not mutate state or quietly
become hidden quality gates.

Repair task:

Split doctor checks into focused read-only modules and keep
`runDoctorCommand.ts` as orchestration/rendering. Preserve current CLI output
with tests before extraction.

Falsifier:

Adding one readiness check requires editing unrelated doctor logic.

### QG-04D — Memory Confidence Parsing Is Duplicated

Evidence:

- `packages/cli/src/runMemoryCandidateAddCommand.ts` has
  `confidenceAliases` and `parseConfidence`.
- `packages/cli/src/runMemoryAntiAddCommand.ts` has another
  `confidenceAliases` and `parseConfidence`.

Why this matters:

Confidence drives memory governance. Candidate and anti-memory commands must
not drift in accepted labels, defaults, or error messages.

Repair task:

Create one CLI memory-confidence parser with explicit default behavior for
candidate and anti-memory commands.

Falsifier:

The two commands accept different aliases or ranges for confidence.

### QG-04E — Schema Metadata Guards Are Repeated

Evidence:

- `packages/schema/src/auditBundle.ts` and
  `packages/schema/src/observation.ts` each define
  `rejectPrivateReasoningMetadata`.
- `packages/schema/src/goldenTask.ts` and
  `packages/schema/src/reflection.ts` each define
  `rejectForbiddenMetadata`.
- `TextListSchema` is repeated across audit bundle, golden task, and
  reflection schemas.

Why this matters:

No-chain-of-thought and metadata hygiene are product safety rules. Repeating
them across schema files makes drift likely.

Repair task:

Add schema-local shared validators for forbidden metadata keys and text-list
shape. Do not import `packages/core` runtime exports into schema to avoid
package-boundary drift.

Falsifier:

A new schema can accept private reasoning metadata because it copied an older
guard or missed the guard entirely.

### QG-04F — Review Signal Normalization Is Repeated

Evidence:

- `packages/core/src/reviewAssessment.ts` and
  `packages/core/src/feedbackDelta.ts` each define `riskValues`,
  `normalizeOutcome`, and `normalizeRisk`.
- `packages/cli/src/runReviewAssessCommand.ts` also has risk normalization
  vocabulary.

Why this matters:

Review outcome, review burden, and diff risk are shared governance language.
Duplicate normalization can cause review evidence and feedback evidence to
mean different things.

Repair task:

Move shared review signal vocabulary into one pure core module and have
ReviewAssessment, FeedbackDelta, and CLI parsing consume it through explicit
types.

Falsifier:

The CLI accepts a risk/outcome value that core would reject, or vice versa.

### QG-04G — Large Persistence And Mapper Files Need Domain Splits

Evidence:

- `packages/db/src/repositories/DrizzleObservationRepository.ts`: 943 lines.
- `packages/db/src/repositories/mappers.ts`: 939 lines.
- `packages/db/src/repositories/DrizzleMemoryRepository.ts`: 648 lines.
- `packages/db/src/repositories/DrizzleSourceRepository.ts`: 511 lines.
- `packages/db/src/repositories/DrizzleRetrievalRepository.ts`: 444 lines.

Why this matters:

Repository adapters can be larger than pure domain files, but mapper and
repository growth makes invariants harder to audit. The highest-risk areas are
observation lineage, memory promotion/invalidation, and source decision
support.

Repair task:

Split mapper files by domain first, then split repository internals only when
tests cover the invariant being moved. Keep public repository interfaces
stable.

Falsifier:

Observation lineage or memory governance logic remains buried in a large file
with unrelated mapping/persistence code.

### QG-04H — Smell Scans Are Not Yet Automated In `krn audit`

Evidence:

QG-04 used direct `rg`, `find`, and line-count commands. The audit CLI does not
yet expose large-file, duplicate-helper, or placeholder-vocabulary findings as
first-class quality gate output.

Why this matters:

Manual smell scans will be forgotten during feature slices.

Repair task:

QG-06 must add audit automation for accepted QG-04 checks with allowlists and
expiry dates.

Falsifier:

`krn audit slice --fail-on warning` can pass while a new production file
introduces placeholder vocabulary or a new large command module.

## Warnings

- `packages/harness/src/audit/auditChecks.ts` is 971 lines. It is currently
  cohesive around audit categories, but QG-06 will likely need a category-file
  split while preserving one audit entrypoint.
- Several DB smoke files exceed 400 lines. They are acceptable for now because
  each owns one proof path, but any smoke file that starts owning multiple
  unrelated proof surfaces should be split.
- Colocated tests are accepted by ADR-0012, but test files still participate in
  smell scans because tests can normalize poor architecture.

## Decision

QG-04 completes the smell/bloat audit and removes one low-risk smell
immediately. It does not certify the repo as fully clean. The repo cannot
return to memory/eval feature work until QG-04A through QG-04H are resolved or
explicitly reclassified with evidence.
