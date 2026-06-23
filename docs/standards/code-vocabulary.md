# KRN Code Vocabulary Standard

This standard defines how KRN names code so that names describe the authority
the code actually has. It complements `docs/standards/typescript-boundaries.md`;
it does not replace TypeScript boundary rules.

## Doctrine

KRN code should be boring, explicit, and hard to overread.

- A name must not imply persistence, promotion, approval, extraction, or model
  inference unless the implementation really performs that action.
- A helper name should describe the smallest true operation.
- Domain terms must preserve KRN's governance boundary:
  `Observation` is staging, `Reflection` proposes, `Candidate` awaits review,
  and `MemoryRecord` is approved Memory Core.
- Public exported types should make invalid authority difficult to express.
- Prefer small pure helpers with behavior-focused tests over clever generic
  abstractions.

The intended TypeScript style is close to Matt Pocock's discipline: clear
domain vocabulary, discriminated unions where they buy safety, explicit public
types, `as const` for narrow vocabularies, unknown-first IO boundaries, and no
type weakening to move faster.

## Authority Ladder

Use the weakest accurate verb.

| Verb | Use when | Do not use when |
| --- | --- | --- |
| `summarize` | reporting counts, refs, labels, or already-structured facts | parsing prose, creating records, or changing state |
| `normalize` | deriving stable labels from existing structured fields | approving truth or hiding missing evidence |
| `assess` | returning findings, reasons, verdicts, or review burden | throwing hard validation errors as the main behavior |
| `validate` | enforcing a contract and rejecting invalid input | producing advisory findings only |
| `select` | choosing a subset from already available inputs | fetching, mutating, or authorizing new state |
| `build` | constructing a pure object from trusted inputs | writing to DB or creating product truth |
| `create` | creating a new value or persisted row in the owning layer | summarizing, selecting, or assessing existing data |
| `persist` | writing durable state through an adapter | previewing or building a pure object |
| `promote` | moving a reviewed candidate across a governance gate | direct repository convenience outside the gate |
| `extract` | deterministic parsing from a structured source or owned parser | freeform text mining, LLM inference, or proposal summaries |

If two verbs seem plausible, choose the one with less authority.

## Proposal, Candidate, And Truth

- `proposal`: a structured suggestion or pointer. It has no persistence or
  review authority by itself.
- `candidate`: a reviewable object. It is not approved truth.
- `review`: a decision or assessment by an explicit reviewer or gate.
- `MemoryRecord`: approved Memory Core. It requires lineage, confidence,
  owner/application guidance, and invalidation or validity strategy when
  temporal.
- `SourceClaim`: a governed source-graph claim with mechanism,
  implication, `doesNotProve`, trust, consumer, and falsifier.
- `SourceDecision`: a governed decision over source claims. It is not a
  decorative citation.
- `Observation`: event-derived staging material. It is not memory, not a
  source claim, and not final truth.
- `Reflection`: candidate generation and gap/contradiction analysis. It must
  not mutate Memory Core directly.

Use suffixes when the authority would otherwise be ambiguous:

- `*Summary` for aggregate/read-only reporting.
- `*Finding` for reviewable issue output.
- `*Proposal` for non-authoritative suggestions.
- `*Candidate` for reviewable proposed objects.
- `*Gate` for the only approved promotion or rejection boundary.
- `*Record` only for persisted canonical records in the owning package.

## Naming Examples

Good:

- `summarizeFeedbackCandidateProposals`: summarizes already structured
  proposal fields and explicitly does not create Memory Core.
- `assessEvidenceBundleRollbackPath`: produces findings about rollback
  evidence.
- `scoreEvidenceBundleReviewRisk`: returns deterministic risk scoring and
  reasons.
- `selectObservationPrefix`: chooses from supplied observations without
  fetching or approving memory.

Avoid:

- `extractFeedbackCandidates` when the implementation only summarizes already
  structured candidate/proposal arrays.
- `promoteMemoryCandidate` in runtime code that does not pass through
  `MemoryReviewGate`.
- `createMemoryRecord` outside low-level repository, smoke, migration, or gate
  internals.
- `learnFromFeedback` unless it really records governed learning output and
  states the review path.
- `introspectReasoning`, `storeThoughts`, or similar private reasoning terms.

## Package Authority

- `packages/core`: pure domain contracts and pure helpers only. No DB, CLI,
  filesystem, process, network, Zod, Drizzle, or runtime authority.
- `packages/schema`: IO validation. External inputs become domain-safe values
  here or in local boundary parsers.
- `packages/db`: Drizzle schema, migrations, repositories, and persistence
  invariants.
- `packages/harness`: planning, activation, review gates, selection, and
  assembly logic.
- `packages/codex-adapter`: Codex-facing rendering. It does not own domain
  truth.
- `packages/cli`: terminal/filesystem/env adapter behavior. CLI commands may
  preview by default and persist only through explicit write paths.

Names must not smuggle authority across those package boundaries.

## TypeScript Elegance Rules

- Keep public APIs explicit. Export named types instead of leaking anonymous
  object shapes at boundaries.
- Use narrow literal unions for domain vocabularies.
- Prefer discriminated unions when state changes meaning by `kind`, `status`,
  or `subjectType`.
- Treat external data as `unknown` until schema or parser validation.
- Avoid `any`; isolate and justify unavoidable exceptions.
- Avoid double assertions. If a value is hard to type, model the boundary
  instead of forcing it.
- Avoid generic catch-all metadata for facts that govern behavior. Promote
  repeated metadata keys into typed fields.
- Tests should name behavior, not implementation details.
- Do not add an abstraction until it removes real duplication or protects a
  real boundary.

## Review Checklist

Before merging a helper, exported type, CLI command, or repository method:

- Does the verb match the actual authority?
- Could a reviewer mistake a proposal/candidate/observation for final truth?
- Does the name imply LLM extraction, freeform mining, or persistence when none
  exists?
- Is the package allowed to do what the name says?
- Are IO boundaries unknown-first and validated?
- Is Memory Core mutation impossible unless the path goes through the review
  gate?
- Would a future maintainer understand the helper's limits from the name alone?
