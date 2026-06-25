# Promptfoo Adapter Boundary Report

Status: D-01 completion report.

Date: 2026-06-25

## Executive Verdict

D-01 hardened Promptfoo as a bounded runner/result adapter. Promptfoo JSONL rows
can now map to reviewable `EvalCandidateProposal` values with
`acceptedAsBehaviorProof=false`, while existing `promptfoo_integration_smoke`
proof rows remain rejected by `runGoldenTaskFixtures` as KRN behavior proof.

## Scope

Changed:

- `packages/harness/src/goldenPromptfooResult.ts`;
- `packages/harness/src/goldenPromptfooResult.test.ts`;
- `docs/architecture/promptfoo-adapter-boundary.md`;
- `PLAN.md`;
- `GOAL.md`.

Not changed:

- Promptfoo fixture suite scope;
- GoldenTask accepted proof provenance;
- Memory Core;
- eval persistence;
- DB schema;
- dashboard/API/MCP/worker runtime.

## Implementation

Added:

```txt
mapPromptfooJsonlRowsToEvalCandidateProposals
```

The mapper:

- parses Promptfoo rows from `unknown`;
- requires row count to match case IDs;
- returns `EvalCandidateProposal`;
- records `acceptedAsBehaviorProof=false`;
- preserves Promptfoo JSONL path in `sourceEvidence`;
- records `doesNotProve` in metadata.

Existing Promptfoo-to-`GoldenBehaviorProof` mapping remains intentionally
non-authoritative with provenance:

```txt
promptfoo_integration_smoke
```

`runGoldenTaskFixtures` continues to reject that provenance as behavior proof.

## DB-Backed Dogfood

KRN plan run:

```txt
a5e934e6-87d8-4157-9ec0-b27b719b9f62
```

Persisted IDs:

```txt
operatorIntent: ecf8504f-b847-489d-957d-9804c951921f
taskContract: 96355fdd-fef8-4735-a54c-6023c23375dc
harnessPlan: 380d99ad-ba9d-477b-a0dd-edc65a31368f
contextAssembly: c84453ed-4440-460b-bd27-9e663f69a6ae
executionRun: a5e934e6-87d8-4157-9ec0-b27b719b9f62
evidenceBundle: 870e62df-2341-4afc-9db9-56071b40bd78
reviewAssessment: d7203bfd-e064-4aa2-85cc-6cb4e041537a
feedbackDelta: 0f5516be-d1ff-4199-a726-acc1b489abd7
observationGroup: 2cff4f5e-0b3f-4b74-8914-692719f7092b
reflectionRecord: 71d3b046-c08c-4791-9790-97f2010c7809
Memory mutation: none
MemoryRecord created: no
```

Activation selected useful guardrails for weak evidence, eval-candidate caution,
MemoryReviewGate write authority, compact AGENTS guidance, and stale audit
exclusion. The Promptfoo owner files were found through source inspection.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `pnpm --filter @krn/harness test -- goldenPromptfooResult goldenRunner index` | passed | Harness tests cover Promptfoo result mapping, GoldenTask rejection of Promptfoo proof provenance, and eval subpath boundary. | Does not prove Promptfoo CLI runtime. |
| `pnpm --filter @krn/harness typecheck` | passed | Harness types compile with EvalCandidateProposal mapping. | Does not prove full workspace health. |
| `pnpm exec promptfoo --version` | passed, `0.121.17` | Promptfoo CLI is installed and runnable in the current shell. | Does not prove KRN behavior. |
| `pnpm eval:promptfoo:smoke` | passed, 2/2 | Promptfoo runner/config/provider/result-output path works and writes `.local-lab/promptfoo/krn-golden-smoke-results.jsonl`. | Does not execute KRN behavior or prove Memory Brain readiness. |
| `krn plan --task ... --persist` | passed | D-01 was planned through DB-backed KRN path. | Does not prove owner-file activation quality. |
| `krn evidence capture --run-id ... --persist` | passed | Persisted D-01 changed-file classification, command provenance, review assessment, and feedback delta. | Does not prove Promptfoo behavior authority. |
| `krn observe --run ... --persist` | passed | Persisted observation group without Memory Core mutation. | Does not prove observation extraction quality at scale. |
| `krn reflect --scope run:... --persist` | passed | Persisted reflection record without MemoryRecord creation or candidate rows. | Does not prove reflection candidate quality. |

Promptfoo emitted a Node experimental warning and `telemetry.shutdown() timed out`
after the successful smoke run. The smoke result still completed and wrote the
JSONL output.

Final full verification is recorded in the commit evidence.

## Dogfood Brain Usefulness Section

### Brain Usefulness Summary

Brain ROI:
- positive

Overall verdict:
- KRN helped preserve the eval boundary and prevented Promptfoo smoke from
  becoming product truth.

What this run proves:
- Promptfoo rows can become reviewable eval proposals without being accepted as
  GoldenTask behavior proof.
- The existing GoldenTask runner boundary still rejects Promptfoo integration
  smoke provenance.

What this run does not prove:
- Promptfoo executes KRN behavior;
- eval candidates have a persistence/review gate;
- product readiness;
- activation consistently selects owner files.

DB used in current shell:
- yes

### Activated Context Usefulness

| Item | Type | Used? | Helped? | Notes |
| --- | --- | --- | --- | --- |
| weak evidence source claim | source | yes | helped | Reinforced does-not-prove language. |
| eval-candidate caution source claim | source | yes | helped | Prevented fake eval persistence. |
| MemoryReviewGate authority memory | memory | yes | helped | Kept write authority unchanged. |
| AGENTS compact guidance claim | source | yes | neutral/helped | Kept policy in architecture doc, not AGENTS. |
| target init memory | memory | no | noise | Not relevant to Promptfoo boundary. |
| Promptfoo owner files | raw source | yes | helped | Found by source inspection, not activation. |

### Evidence And Review Burden

| Evidence item | Strength | What it proves | Review burden impact |
| --- | --- | --- | --- |
| Harness targeted tests | strong | Mapper and proof boundary behavior work. | reduced |
| Promptfoo version/smoke | strong for integration | Current shell can run Promptfoo smoke. | reduced |
| Architecture doc | medium | Boundary is explicit for future operators. | reduced |
| DB-backed plan | medium | KRN tracked this slice. | reduced |

### Candidate Quality

No candidate was promoted. D-01 makes future Promptfoo rows representable as
`EvalCandidateProposal` values, but still does not add eval persistence or a
review gate.

### Brain ROI

| Dimension | Verdict | Evidence |
| --- | --- | --- |
| Context waste | lower | Slice stayed inside harness Promptfoo result boundary. |
| Review burden | lower | Promptfoo proof and eval-candidate boundaries are explicit. |
| Resume quality | better | Report records plan run and command evidence. |
| Decision grounding | better | D-00 policy and ADR-0016 boundaries are preserved. |
| Memory usefulness | mixed | Memory helped as guardrail. |
| Operator friction | lower | Promptfoo role is clearer. |

## Product Readiness Signal

Verdict:

```txt
Promptfoo adapter boundary is stronger, not product-complete.
```

Remaining gaps:

- no persisted EvalCandidate review gate;
- no broad eval platform by design;
- no CI proof for Promptfoo smoke yet;
- D-02 readback UX still needed.

## Next Recommended Action

Continue to:

```txt
D-02 — Operator Readback UX For Runs And Evidence
```

D-02 should make run/evidence readback easier before any dashboard or API.
