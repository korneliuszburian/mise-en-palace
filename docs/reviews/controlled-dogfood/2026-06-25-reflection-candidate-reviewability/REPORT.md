# Reflection Candidate Reviewability Dogfood Report

Status: DB-backed KRN-on-KRN source repair.

Date: 2026-06-25

Evaluator: Codex using KRN plan/reporting discipline

DB available in current shell: yes.

## Executive Verdict

This slice moved candidate reviewability from a CLI-only evidence-capture helper
into `@krn/core`, then reused it from the reflection candidate writer. Reflection
candidate metadata now carries deterministic `reviewability` and
`reviewabilityReasons` for memory, anti-memory, source-claim, policy, and eval
candidate proposals without changing reflection extraction, review gates,
promotion behavior, or DB schema.

Brain usefulness verdict: positive. DB-backed activation selected useful
guardrails around weak evidence, reflection quality, and Memory Core
write-authority, while source inspection found a real reuse point.

## Scope

Objective: apply candidate reviewability to reflection candidate output if
source inspection confirms reflection proposals lack reviewability labels.

Persisted KRN run:
- executionRun: `a0407c7a-ffca-478e-b209-539488b2bd4c`
- taskContract: `c658fe5d-7023-44e2-b903-cac88d722282`
- contextAssembly: `e5840082-126c-4615-ae8c-94af498128ab`

Changed files:
- `packages/core/src/candidateReviewability.ts`
- `packages/core/src/candidateReviewability.test.ts`
- `packages/core/src/index.ts`
- `packages/cli/src/runEvidenceCaptureCommand.ts`
- `packages/cli/src/candidateReviewability.ts` removed
- `packages/cli/src/candidateReviewability.test.ts` removed
- `packages/harness/src/reflection/reflectionCandidateWriter.ts`
- `packages/harness/src/reflection/reflectionCandidateWriter.test.ts`
- `PLAN.md`
- `GOAL.md`
- `docs/reviews/controlled-dogfood/2026-06-25-reflection-candidate-reviewability/REPORT.md`

Non-goals preserved:
- no activation scoring change;
- no memory scoring change;
- no reflection extraction rewrite;
- no candidate promotion;
- no review gate behavior change;
- no DB schema or migration;
- no dashboard, worker runtime, API/MCP server, broad eval platform,
  `krn audit`, or anti-slop scanner.

## KRN Plan Output Summary

Command:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn plan \
  --task "Apply candidate reviewability to reflection candidate output if source inspection confirms reflection proposals lack reviewability labels, without changing reflection extraction or promotion behavior" \
  --persist
```

Result:
- persistence: enabled;
- selected context: 6;
- excluded context: 4;
- context status: assembled;
- expected evidence: `pnpm typecheck`, `pnpm test`, `git diff --check`.

Usefulness: positive. The selected context did not name the exact owner file,
but it correctly emphasized weak evidence boundaries, reflection quality caveats,
and Memory Core non-mutation.

## Source Inspection

Inspection confirmed:
- `packages/cli/src/candidateReviewability.ts` owned a reusable reviewability
  classifier that was not CLI-specific.
- `packages/harness/src/reflection/reflectionCandidateWriter.ts` wrote
  reflection candidate metadata without `reviewability` or
  `reviewabilityReasons`.
- Reflection writer already preserved candidate-only behavior and blocked
  final-truth outputs.

Decision:
- move the reviewability helper to `@krn/core`;
- keep CLI as a consumer;
- add reviewability metadata in reflection writer output;
- keep persistence shape in existing metadata JSON; no migration.

## Repair Diff Summary

| Area | Change | Why final-pattern | What was not changed |
| --- | --- | --- | --- |
| Core reviewability | Added `candidateReviewability` to `@krn/core`. | Reviewability is domain/review logic, not CLI-only behavior. | No new subsystem. |
| CLI evidence capture | Reused `assessCandidateReviewability` from core. | Keeps existing evidence output behavior with one implementation. | No evidence capture semantics changed. |
| Reflection writer | Added reviewability metadata for memory, anti-memory, source-claim, policy, and eval candidate proposals. | Reflection candidates become easier to review without promotion behavior changes. | No reflection extraction rewrite. |
| Tests | Added core helper tests and reflection writer metadata assertions. | Protects ready/needs_more_evidence/too_vague and reflection metadata output. | No broad eval lane. |

## Verification

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `pnpm db:ready` | passed | Current-shell DB was reachable with 13/13 migrations and pgvector. | Does not prove product readiness. |
| `krn plan --persist` | passed | DB-backed planning and activation ran for this slice. | Does not prove activation scoring quality. |
| `pnpm --filter @krn/core test -- candidateReviewability` | passed | Core reviewability helper behavior is covered. | Does not prove every candidate surface. |
| `pnpm --filter @krn/cli test -- runCli evidenceCaptureGoldenBehavior` | passed | CLI evidence capture still renders reviewability and dirty-context behavior. | Does not prove reflection output. |
| `pnpm --filter @krn/harness test -- reflectionCandidateWriter` | passed | Reflection candidate writer stores reviewability metadata and preserves candidate-only gates. | Does not prove useful extraction. |
| `pnpm typecheck` | passed | Workspace TypeScript boundaries still compile. | Does not prove runtime behavior. |
| `pnpm test` | passed | Full workspace test suite passes. | Does not prove product value. |
| `pnpm --filter @krn/db db:check` | passed | Drizzle schema/migration files remain consistent. | Does not prove data semantics. |
| `git diff --check` | passed | Diff whitespace is clean. | Does not prove behavior correctness. |

## Persisted Evidence Replay

Evidence capture:
- evidenceBundle: `5cc1ca30-3f49-49a0-afa1-52c09ebcc2b1`
- reviewAssessment: `11eb40ca-e289-4fc2-8726-26881a8f5747`
- feedbackDelta: `921680d7-96bc-416c-8c07-0ccac6fcdca4`

Observe/reflect:
- observationGroup: `84dd4f2f-1434-4953-9187-410a9c8464ae`
- reflectionRecord: `fe938071-2385-468a-bd53-de10f1ec2028`

Readback:
- changed file classification: 11 intended, 0 unrelated, 0 unknown;
- command provenance: 8 `operator_reported` / `passed` commands, each with
  `doesNotProve`;
- feedback candidate reviewability: `too_vague` with reason
  `Candidate does not name a concrete future use.`;
- feedback metadata: `memoryCandidateRowCount: 0`;
- observation items: 5;
- reflection records for run: 1;
- memory candidates for run: 0.

## Dogfood Brain Usefulness Section

### Brain Usefulness Summary

Brain ROI:
- positive

Overall verdict:
- DB-backed KRN helped keep the slice bounded and provided relevant guardrails.
  Source inspection and tests carried the actual implementation.

What this run proves:
- Candidate reviewability can be shared through core and reused outside evidence
  capture.
- Reflection candidate writer can expose reviewability metadata without changing
  candidate promotion or Memory Core write authority.
- DB-backed planning was available for the source repair.

What this run does not prove:
- It does not prove reflection extraction quality.
- It does not prove activation scoring quality.
- It does not prove candidate usefulness at scale.
- It does not prove product readiness.

DB used in current shell:
- yes

### Activated Context Usefulness

| Item | Type | Why selected | Used? | Helped? | Missing/Stale/Noise? | Evidence | Follow-up |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Source claim `58e28e58-d4c8-4196-861e-cb14caeb08e1` | source | Weak evidence must not masquerade as proof. | yes | helped | none | Persisted KRN plan output. | keep |
| Source claim `302f88f7-71b0-4a86-8521-330dee4713fe` | source | Reflection persistence is not reflection quality. | yes | helped | none | Persisted KRN plan output. | keep |
| Memory `f950b8b4-5392-4084-9f98-93881fbe961a` | memory | Memory Core write authority must stay gated. | yes | helped | none | Persisted KRN plan output and non-goals. | keep |
| Other selected source claims | source | General governance/source graph context. | unclear | neutral | possible noise | Persisted KRN plan output. | gather more evidence |

### Missing Context

| Missing item | Expected source | Why it mattered | Evidence | Repair implication |
| --- | --- | --- | --- | --- |
| CRO-00 candidate reviewability report | MemoryRecord or SourceClaim | It directly motivated core reuse. | Manual read / prior report. | memory guidance |
| Reflection candidate writer owner | SourceClaim or raw recall | It determined the implementation surface. | `rg` and source inspection. | raw recall |

### Memory Usefulness

| Memory/Candidate | Selected? | Used? | Outcome | Evidence provenance | Reviewability | Follow-up |
| --- | --- | --- | --- | --- | --- | --- |
| Memory Core write-authority memory | yes | yes | helped | DB-backed activation | ready | keep |
| Candidate reviewability reuse candidate | no | yes | helped | prior dogfood report and source diff | ready | review |

### Source Grounding Usefulness

| Source/Claim | Supported decision? | Prevented overclaim? | Decorative/noise? | Missing conflict? | Evidence | Follow-up |
| --- | --- | --- | --- | --- | --- | --- |
| Weak evidence boundary claim | yes | yes | no | no | KRN plan inclusion and command evidence table. | keep |
| Reflection quality caveat claim | yes | yes | no | no | KRN plan inclusion and non-goal boundary. | keep |
| Reflection writer source | yes | yes | no | no | Source inspection confirmed candidate metadata gap. | keep |

### Evidence And Review Burden

| Evidence item | Strength | What it proves | What it does not prove | Review burden impact |
| --- | --- | --- | --- | --- |
| Core helper tests | strong | Reviewability classification remains deterministic. | Does not prove all candidate surfaces. | reduced |
| CLI tests | strong | Evidence capture remains stable after core move. | Does not prove reflection output. | unchanged |
| Harness reflection writer tests | strong | Reflection candidate metadata includes reviewability labels/reasons. | Does not prove useful extraction. | reduced |
| DB-backed plan | strong | Current-shell activation/context assembly works for this slice. | Does not prove scoring quality. | reduced |

### Observation And Reflection Usefulness

| Observation/Reflection | Output | Useful? | Evidence refs | Follow-up |
| --- | --- | --- | --- | --- |
| Observation | 5 persisted items | ledger-useful | Observation group `84dd4f2f-1434-4953-9187-410a9c8464ae`. | keep |
| Reflection | 1 persisted record, 0 findings/candidates | correctly empty | Reflection record `fe938071-2385-468a-bd53-de10f1ec2028`. | no extraction rewrite from this slice |

### Candidate Quality

| Candidate | Type | Evidence refs | Reviewability | Decision | Follow-up |
| --- | --- | --- | --- | --- | --- |
| Candidate reviewability belongs in core review domain, not CLI-only. | MemoryCandidate | Source diff, core tests, CLI reuse, harness reuse. | ready | review | Consider promoting after one more non-CLI use. |
| Reflection candidate metadata should expose reviewability before human review. | MemoryCandidate | Reflection writer tests and source diff. | ready | review | Keep as bounded behavior invariant. |
| Do not rewrite reflection extraction just to improve candidate reviewability. | AntiMemoryCandidate | This slice reused metadata only. | ready | review | Keep if future reflection work drifts into extraction rewrite. |

### Brain ROI

| Dimension | Verdict | Evidence |
| --- | --- | --- |
| Context waste | lower | DB-backed selected guardrails were relevant; raw recall found owner files. |
| Review burden | lower | Reflection candidate metadata now includes reviewability and reasons. |
| Resume quality | better | Persisted run ID and report record the slice. |
| Decision grounding | better | Source inspection confirmed the gap before implementation. |
| Memory usefulness | mixed positive | One MemoryRecord helped constrain Memory Core mutation. |
| Operator friction | lower | Reviewability helper now has one owning package. |

Brain ROI verdict:
- positive

## Next Recommended Action

Run one more DB-backed KRN-on-KRN repair before activation scoring. If activation
keeps selecting relevant guardrails but misses direct owner files, open a
bounded activation relevance/read-model repair rather than a scoring rewrite.
