# Trust-Aware Target Activation Read Model Repair

Status: V01-R01 completion report.

Date: 2026-06-25
Final validation run: `5ca9755f-6d82-4e17-a89b-5aa511891741`
Evidence bundle: `8da44cd4-ce82-40b3-b3e5-4a23f2a74f1a`
Review assessment: `1f96e643-729d-4b64-90b6-7bd72ff18030`
Feedback delta: `e686f69f-2408-4442-90bd-94f161c13441`
Observation group: `8dec977e-ea7d-4f6c-826c-0cd23a4c8b4f`
Reflection record: `eab600ce-84d3-4b9e-99fc-4b1e482a8f41`
DB available: yes

## Executive Verdict

V01-R01 is complete. Project-scoped planning for the connected `muke-v2`
target now uses a typed target activation read model instead of blindly adding
the static KRN owner-file recall catalog.

The final DB-backed plan surfaced target-specific context:

- `evals` as a target source seed for eval/report/test owner-file recall;
- target trust exclusions for `.env*`, `.muke/`, `.git/`, `node_modules/`,
  `dist/`, `build/`, and `.supersearch/runtime/`;
- target instruction/docs seeds: `AGENTS.md`, `CLAUDE.md`, and `docs`.

The final plan did not select stale KRN DB-readiness owner-file recall as target
context.

## What Changed

Source changes:

- `packages/cli/src/runInitCommand.ts`
  - expanded named source seed detection to include workspace/config/docs/evals/MCP/scripts roots;
  - exported the existing source seed detector for plan-time target read-model use.
- `packages/cli/src/runPlanCommand.ts`
  - builds a target activation read model from project kernel metadata, repo installation metadata, and live named source seed detection from `localPathHint`;
  - adds explicit target trust exclusions;
  - renders a target read-model summary in `krn plan --project` output;
  - stores target read-model counts/paths in execution run metadata.
- `packages/harness/src/activation/ownerFileRecall.ts`
  - added typed target read-model candidates;
  - disables static KRN owner-file recall when a target read model is supplied;
  - emits DB-valid deterministic UUID subject IDs for synthetic target search candidates.
- `packages/harness/src/activation/activationEngine.ts`
  - passes the optional target read model into owner-file recall.
- `packages/harness/src/compiler/compileHarnessPlan.ts`
  - accepts optional target read model and records target read-model counts in retrieval metadata.
- tests in CLI, activation, and compiler.

## Boundary Kept

No source crawler was added. The repair checks only named source seed paths and
known trust-exclusion patterns. No DB schema migration, scoring rewrite,
reflection rewrite, dashboard, worker runtime, MCP/API, eval platform,
automatic memory/source mutation, or target repo write was added.

## Final DB-Backed Plan Proof

Command:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn plan --project 11c941f1-26d6-470d-a19e-3d4b15980d33 --task "Repair muke-v2 eval tests so acceptance report linked surgical proof errors are stable and target trust exclusions stay explicit" --persist
```

Result:

```txt
executionRun: 5ca9755f-6d82-4e17-a89b-5aa511891741
taskContract: 6f23b00c-4b13-4295-9f15-1105df8beb19
harnessPlan: 50dd26da-c0aa-433a-acc1-a6e8d3f074d8
contextAssembly: ddb00768-6105-419e-88cb-3ae3a4166dbb
Target read model: sourceSeeds=10, trustExclusions=7
Context included: 5
```

Included context:

| Item | Type | Helped? | Evidence |
| --- | --- | --- | --- |
| `evals` | target source seed | helped | Final plan selected `Target source seed: evals`. |
| target trust exclusions | target read model | helped | Final plan selected exclusions for `.env*`, `.muke/`, `.git/`, `node_modules/`, `dist/`, `build/`, `.supersearch/runtime/`. |
| `AGENTS.md` | target instruction seed | neutral/helped | Selected as target Codex instruction context. |
| `CLAUDE.md` | target instruction seed | neutral | Selected as adjacent target agent instruction context; useful to know, not direct owner file. |
| `docs` | target docs seed | neutral | Selected as target documentation context. |

Missing/stale context:

| Item | Verdict | Evidence |
| --- | --- | --- |
| Static KRN DB-readiness owner-file recall | no longer selected | Final plan contains no `packages/cli/src/runDbReadinessCommand*` context. |
| More precise target file under `evals/` | still missing | This repair exposes named target roots, not a crawler or file index. |

## Important Implementation Finding

The first DB-backed plan after the implementation failed because synthetic
target candidates used string subject IDs such as `target-source-seed:evals`.
The real DB schema requires UUID `subject_id` values for retrieval candidates.

Repair:

- target read-model candidates now use deterministic DB-valid UUID subject IDs;
- tests assert UUID-shaped target subject IDs.

This matters because fixture-only tests would not have caught the persistence
boundary.

## Dogfood Brain Usefulness Section

### Brain Usefulness Summary

Brain ROI:
- positive

Overall verdict:
- KRN helped this slice by making the exact target activation weakness explicit,
  preserving the DB-backed proof boundary, and forcing evidence/readback after
  implementation.

What this run proves:
- project-scoped planning can surface target source seeds and trust exclusions;
- static KRN owner-file recall is not used when target read model is present;
- the new candidate shape persists through the real DB retrieval path;
- observe/reflect can run after this repair without Memory Core mutation.

What this run does not prove:
- target activation can identify exact files below a target root;
- activation scoring is product-ready;
- reflection extraction quality is improved;
- broad target ingestion or secret redaction is cleared;
- internal-alpha readiness is granted.

DB used in current shell:
- yes

### Activated Context Usefulness

| Item | Type | Why selected | Used? | Helped? | Missing/Stale/Noise? | Evidence | Follow-up |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `evals` | search/read-model | target eval/report/test owner seed | yes | helped | none | run `5ca9755f...` | keep |
| target trust exclusions | search/read-model | target trust boundary | yes | helped | none | run `5ca9755f...` | keep |
| `AGENTS.md` | search/read-model | target Codex instructions | unclear | neutral/helped | none | run `5ca9755f...` | keep |
| `CLAUDE.md` | search/read-model | adjacent target agent instructions | unclear | neutral | possible noise | run `5ca9755f...` | keep under observation |
| `docs` | search/read-model | target documentation root | unclear | neutral | possible noise | run `5ca9755f...` | keep under observation |

### Missing Context

| Missing item | Expected source | Why it mattered | Evidence | Repair implication |
| --- | --- | --- | --- | --- |
| Exact owner files under `evals/` | target file index or future source decision | Would reduce source inspection further. | Final plan selects `evals` root only. | no action now; source crawler/file index remains non-goal |

### Memory Usefulness

| Memory/Candidate | Selected? | Used? | Outcome | Evidence provenance | Reviewability | Follow-up |
| --- | --- | --- | --- | --- | --- | --- |
| Memory records | no | no | unknown | final plan selected none | unknown | no action |
| Evidence feedback candidate | no row created | no | too vague | evidence capture output | too vague | reject/defer |

### Source Grounding Usefulness

| Source/Claim | Supported decision? | Prevented overclaim? | Decorative/noise? | Missing conflict? | Evidence | Follow-up |
| --- | --- | --- | --- | --- | --- | --- |
| V01-03 decision report | yes | yes | no | no | `docs/reviews/controlled-dogfood/2026-06-25-activation-reflection-usefulness-decision/REPORT.md` | keep |
| V01-02 target trust report | yes | yes | no | no | `docs/reviews/controlled-dogfood/2026-06-25-target-trust-redaction/REPORT.md` | keep |

### Evidence And Review Burden

| Evidence item | Strength | What it proves | What it does not prove | Review burden impact |
| --- | --- | --- | --- | --- |
| `pnpm --filter @krn/harness test -- ownerFileRecall compiler` | strong | Focused activation/compiler behavior is covered. | Does not prove product readiness. | reduced |
| `pnpm --filter @krn/cli test -- runCli` | strong | CLI project plan/read-model output remains covered. | Does not prove real DB persistence. | reduced |
| `pnpm typecheck` | strong | TypeScript boundaries compile. | Does not prove behavior quality. | reduced |
| `pnpm test` | strong | Workspace tests pass. | Does not prove target repo readiness. | reduced |
| `pnpm db:ready` | strong | Current-shell Postgres is reachable with 14/14 migrations and pgvector. | Does not prove hosted DB/CI DB readiness. | reduced |
| final `krn plan --project ... --persist` | strong | Target read-model candidates persist in a real DB-backed plan. | Does not prove exact file recall below roots. | reduced |
| `krn evidence capture --persist` | strong | EvidenceBundle/ReviewAssessment/FeedbackDelta persisted for this run. | Does not prove command runner execution; outcomes were operator-reported. | reduced |
| `krn observe --persist` / `krn reflect --persist` | strong for persistence | Observation/reflection records were written without Memory mutation. | Does not prove reflection usefulness. | unchanged |

### Observation And Reflection Usefulness

| Observation/Reflection | Output | Useful? | Evidence refs | Follow-up |
| --- | --- | --- | --- | --- |
| Observation group `8dec977e-ea7d-4f6c-826c-0cd23a4c8b4f` | 5 observation items | useful ledger | observe output | keep |
| Reflection record `eab600ce-84d3-4b9e-99fc-4b1e482a8f41` | 0 findings, 0 gaps, 0 candidates | correctly empty/ledger-only | reflect output | judge reflection after V01-04 |

### Candidate Quality

| Candidate | Type | Evidence refs | Reviewability | Decision | Follow-up |
| --- | --- | --- | --- | --- | --- |
| `memory-candidate-proposal-1782406281130-1` | MemoryCandidate proposal | evidence capture output | too vague | reject/defer | no promotion |

### Brain ROI

| Dimension | Verdict | Evidence |
| --- | --- | --- |
| Context waste | lower | Static KRN DB-readiness owner-file recall no longer selected for target plan. |
| Review burden | lower | Target trust exclusions and `evals` seed are visible in plan output. |
| Resume quality | better | Evidence/run IDs and target read-model summary are persisted. |
| Decision grounding | better | Repair follows V01-00/V01-02/V01-03 evidence. |
| Memory usefulness | unknown | No memory selected. |
| Operator friction | lower | Plan now points at target roots/trust boundaries before manual search. |

Brain ROI verdict:
- positive

### Command Evidence

| Command | Result | Proof strength | What it proves | What it does not prove |
| --- | --- | --- | --- | --- |
| `pnpm --filter @krn/harness test -- ownerFileRecall compiler` | passed | strong | Focused activation/compiler tests pass. | Product readiness. |
| `pnpm --filter @krn/cli test -- runCli` | passed | strong | CLI plan/init paths are covered. | DB runtime truth. |
| `pnpm typecheck` | passed | strong | Strict TypeScript compilation passes. | Runtime behavior quality. |
| `pnpm test` | passed | strong | Full workspace tests pass. | Target repo readiness. |
| `pnpm db:ready` | passed | strong | Local DB is ready in current shell. | Hosted/CI DB readiness. |
| `git diff --check` | passed | strong | Diff has no whitespace errors. | Product value. |

### Next Slice Candidates

| Candidate slice | Why | Evidence | Non-goals | Verification |
| --- | --- | --- | --- | --- |
| V01-04 internal alpha re-gate | V01-R01 closed the blocker selected by V01-03. | Final DB-backed target plan and evidence IDs above. | no product-ready claim | release checklist, CI, reports, command evidence |

## Product Readiness Signal

This repair moves KRN closer to internal-alpha readiness because project-scoped
planning now has target read-model/trust boundary evidence. It does not by
itself grant internal-alpha readiness. The next step is `V01-04`.
