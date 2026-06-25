# GoldenTask Promotion Lane Report

Status: D-00 completion report.

Date: 2026-06-25

## Executive Verdict

D-00 defined a bounded GoldenTask promotion policy and promoted the first
non-evidence dogfood-derived behavior case. The new case protects Codex brief
review-contract rendering from C-03 without turning Promptfoo into product
truth or creating a broad eval platform.

## Scope

Changed:

- `docs/architecture/golden-task-promotion.md`;
- `tests/fixtures/golden-tasks/codex-brief-behavior.json`;
- `packages/schema/src/goldenTask.test.ts`;
- `packages/codex-adapter/src/codexBriefGoldenBehavior.test.ts`;
- `PLAN.md`;
- `GOAL.md`.

Not changed:

- Promptfoo adapter behavior;
- Memory Core promotion;
- activation scoring;
- reflection extraction;
- DB schema;
- dashboard/API/MCP/worker runtime.

## Policy

GoldenTask promotion is now documented at:

```txt
docs/architecture/golden-task-promotion.md
```

The policy allows promotion only for repeated dogfood failures, one critical
invariant, or reviewed candidates with concrete evidence and a deterministic
behavior runner. Promptfoo remains adapter evidence, not KRN behavior proof.

## GoldenTask Case

Added fixture:

```txt
tests/fixtures/golden-tasks/codex-brief-behavior.json
```

Case:

```txt
golden-task-codex-brief-001
golden-case-codex-brief-001-a
```

Protected invariant:

```txt
Codex-facing briefs must render constraints, acceptance, review burden,
rollback, selected context, exclusions, and does-not-prove statements.
```

Behavior proof:

```txt
packages/codex-adapter/src/codexBriefGoldenBehavior.test.ts
```

The proof executes the real Codex adapter renderer and passes the case through
`runGoldenTaskFixtures` with `krn_behavior_execution` provenance.

## DB-Backed Dogfood

KRN plan run:

```txt
fee5bc30-edf3-4525-b0ab-2f5c62e22d4d
```

Persisted IDs:

```txt
operatorIntent: 85cf6da4-dc96-4a8c-b036-a9b3e0df7e6d
taskContract: effe28d0-d906-4b21-887b-8e459638f3ee
harnessPlan: 5df2d908-b58f-482a-9655-c116e7a03197
contextAssembly: d477ce09-ad5f-41d5-8e22-efca57529493
executionRun: fee5bc30-edf3-4525-b0ab-2f5c62e22d4d
evidenceBundle: f5f38d4c-631d-40bf-8530-497165609759
reviewAssessment: ddb488ff-23f3-4c6a-8ddc-4edaa9d59b7d
feedbackDelta: 03eeb6cc-6a61-4894-abe8-43e6affa324e
observationGroup: c22fef47-3143-49f2-8b81-115a1d7f1f6d
reflectionRecord: c97b58d8-d4d0-442c-834a-2a8800301ab1
Memory mutation: none
MemoryRecord created: no
```

Activation selected useful guardrails for weak evidence, AGENTS compactness,
MemoryReviewGate authority, stale audit exclusion, and eval-candidate caution.
It did not directly select the codex-adapter fixture/test owner files. Source
inspection supplied those. This is acceptable for D-00, but remains an owner-file
recall observation for future activation coverage.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `pnpm --filter @krn/schema test -- goldenTask` | passed | GoldenTask fixture schema accepts the new Codex brief fixture and rejects shape-only fixtures. | Does not prove rendered behavior. |
| `pnpm --filter @krn/codex-adapter test -- codexBriefGoldenBehavior` | passed | Real Codex adapter rendering satisfies the dogfood-derived GoldenTask case. | Does not prove Codex executed the brief. |
| `pnpm db:ready` | passed | Current shell has reachable Postgres, applied migrations, and pgvector. | Does not prove CI/remote DB readiness. |
| `krn plan --task ... --persist` | passed | D-00 was planned through the DB-backed KRN path. | Does not prove activation found owner files. |
| `krn evidence capture --run-id ... --persist` | passed | Persisted D-00 changed-file classification, command provenance, review assessment, and feedback delta. | Does not prove GoldenTask product coverage is broad enough. |
| `krn observe --run ... --persist` | passed | Persisted observation group without Memory Core mutation. | Does not prove observation extraction quality at scale. |
| `krn reflect --scope run:... --persist` | passed | Persisted reflection record without MemoryRecord creation or candidate rows. | Does not prove reflection candidate quality. |

Final full verification is recorded in the commit evidence.

## Dogfood Brain Usefulness Section

### Brain Usefulness Summary

Brain ROI:
- positive

Overall verdict:
- KRN helped keep D-00 bounded to a real dogfood-derived invariant and avoided
  Promptfoo/eval-platform creep.

What this run proves:
- Dogfood findings can become GoldenTask fixtures only through explicit policy,
  source refs, protected failure modes, and deterministic behavior proof.
- The first non-evidence GoldenTask case protects Codex brief rendering.

What this run does not prove:
- Promptfoo is behavior proof;
- Codex follows generated briefs;
- GoldenTask coverage is broad enough for product readiness;
- activation consistently finds owner files.

DB used in current shell:
- yes

### Activated Context Usefulness

| Item | Type | Used? | Helped? | Notes |
| --- | --- | --- | --- | --- |
| weak evidence source claim | source | yes | helped | Reinforced does-not-prove and proof boundary language. |
| AGENTS compact guidance claim | source | yes | helped | Prevented putting promotion policy into AGENTS. |
| MemoryReviewGate authority memory | memory | yes | neutral/helped | Kept promotion language away from Memory Core mutation. |
| eval-candidate caution claim | source | yes | helped | Prevented fake EvalCandidate persistence. |
| stale audit exclusion | anti-memory | yes | helped | Prevented returning to audit/eval theater. |
| codex adapter owner files | raw source | yes | helped | Found by source inspection, not activation. |

### Evidence And Review Burden

| Evidence item | Strength | What it proves | Review burden impact |
| --- | --- | --- | --- |
| Schema fixture test | strong | Fixture is valid GoldenTask shape with protected behavior. | reduced |
| Codex adapter golden behavior test | strong | Real renderer satisfies the protected invariant. | reduced |
| Promotion policy doc | medium | Operator rules are explicit. | reduced |
| DB-backed plan | medium | KRN planned the slice and recorded context. | reduced |

### Candidate Quality

No candidate was promoted. A future EvalCandidate may be reviewable if another
dogfood case needs the same GoldenTask promotion rule.

### Brain ROI

| Dimension | Verdict | Evidence |
| --- | --- | --- |
| Context waste | lower | D-00 stayed policy + one behavior case. |
| Review burden | lower | GoldenTask promotion rules are explicit. |
| Resume quality | better | Report records run ID and proof locations. |
| Decision grounding | better | Promptfoo boundary remains explicit. |
| Memory usefulness | mixed | Memory helped as guardrail, not owner-file recall. |
| Operator friction | lower | Future dogfood-to-golden decisions have a policy. |

## Product Readiness Signal

Verdict:

```txt
evaluation lane is stronger, not product-complete.
```

Remaining gaps:

- broader dogfood-derived case population;
- Promptfoo adapter boundary hardening in D-01;
- operator readback UX in D-02;
- no CI proof for this lane yet.

## Next Recommended Action

Continue to:

```txt
D-01 — Promptfoo Adapter Boundary Hardening
```

D-01 should keep Promptfoo bounded to runner/result adapter evidence and ensure
its smoke cannot be mistaken for KRN behavior proof.
