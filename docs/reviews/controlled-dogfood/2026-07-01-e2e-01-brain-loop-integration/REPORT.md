# E2E-01: Governed Evidence-To-Memory Activation Integration Proof

Date: 2026-07-01

Beads issue: `mise-en-palace-7v3`

Persisted KRN plan run: `4e3cfa44-69ce-4c34-9726-0aeec9ff176a`

Persisted evidence:

- EvidenceBundle: `d159709e-5952-43dc-b25f-4a34dad351d1`
- ReviewAssessment: `bf5b7087-b2c9-4203-86a0-e49c6261748f`
- FeedbackDelta: `ac8e3648-6099-498a-906e-b35f1ff70add`
- ObservationGroup: `e2a2e87b-b563-49fb-bf69-fdb15c5f2ec2`
- ReflectionRecord: `f44fceb6-4583-4350-b8e5-6b9f650efe55`

## Summary

This slice added the smallest harness-level integration proof for the core KRN
brain loop:

```txt
EvidenceBundle
-> ObserverInput
-> ReflectionRecord candidate output
-> MemoryCandidate
-> MemoryReviewGate promotion or blocking
-> MemoryRecord
-> next activation reuse or explicit abstention
```

No production code, DB schema, worker runtime, crawler, dashboard, API, MCP, or
activation scoring changed.

## Source To Decision

```yaml
source_id: e2e-01-current-audit-and-repo-evidence
title: Missing compact integration proof for the core KRN brain loop
trust_tier: high
source_class: user-provided audit + repo-local evidence
mechanism: >
  KRN already had separate behavior tests and smokes for evidence, observation,
  reflection candidates, memory review gates, and activation, but no single
  compact proof that data can cross the governed loop without reflection
  mutating Memory Core automatically.
krn_implication: >
  The product claim depends on a small end-to-end proof of the governed loop
  before broader cleanup, worker runtime, DB-backed expansion, or UI/API/MCP
  work.
decision_kind: adopt
decision: >
  Add a test-only harness integration spec using existing domain functions:
  `buildObserverInput`, `writeReflectionCandidates`,
  `promoteMemoryCandidateThroughGate`, `retrieveActivationCandidates`, and
  `assembleContext`.
does_not_prove: >
  This does not prove autonomous reflection quality, DB-backed persistence,
  retrieval ranking quality, worker runtime behavior, product readiness, or
  memory quality at scale.
consumer: >
  Future DB-backed brain-loop smoke, future product-loop regression gates,
  future evidence/review/memory/activation repairs.
falsifier: >
  A future change can break evidence lineage, MemoryReviewGate promotion,
  weak-evidence blocking, or next activation reuse while this integration test
  still passes.
```

## KRN Plan Output

`krn plan --persist` succeeded after setting `KRN_DATABASE_URL` explicitly.

Selected context:

- bounded ingest/source-claim guardrails;
- activation context selection guardrails;
- one paper/source claim about candidate-only acquisition;
- owner file: `packages/harness/src/activation/activationEngine.ts`;
- owner file misses: reflection candidate writer, memory review gate, observer
  input.

Activation usefulness: mixed positive.

It kept non-goals visible and selected useful guardrails, but owner-file recall
missed the direct memory/reflection/observer owners. Manual source inspection
found those files.

## Changed

Added:

- `packages/harness/src/brainLoopIntegration.test.ts`

The test proves two paths:

1. `operator_reported` evidence can flow through observer input, reflection
   candidate writing, MemoryReviewGate promotion, MemoryRecord creation, and
   next activation inclusion.
2. weak `default_template` candidate evidence is blocked before it can create a
   candidate/MemoryRecord, and next activation explicitly abstains with
   `no_candidates`.

## Verification

```txt
pnpm --filter @krn/harness test -- brainLoopIntegration.test.ts
pnpm run typecheck
TMPDIR=/home/krn/.cache/krn-tmp pnpm test
pnpm quality:fallow:ci
pnpm quality:fallow
git diff --check
pnpm db:ready
krn evidence capture --persist
krn observe --persist
krn reflect --persist
```

All commands passed in the current shell.

Fallow changed-file result: no issues in the new integration test.
KRN observe selected 5 persisted observation items before reflect. KRN reflect
selected 5 observations and wrote one ReflectionRecord with no Memory Core
mutation.

## Proof

Proves:

- the existing harness primitives can carry one reviewed candidate from evidence
  staging to memory activation;
- reflection output remains candidate-only until MemoryReviewGate promotion;
- weak default-template candidate evidence is structurally blocked before
  activation can reuse it;
- next activation can include the promoted MemoryRecord and abstain when no
  MemoryRecord exists.
- persisted same-run observe-before-reflect sequencing works for this run.

Does not prove:

- DB-backed full-loop persistence;
- autonomous extraction quality;
- product readiness;
- ranking quality;
- worker heartbeat/dreaming runtime;
- source truth quality;
- broad benchmark performance.

## Next Recommended Action

Run the same proof shape through DB-backed smoke/readback:

```txt
mise-en-palace-txr: Add DB-backed evidence-to-memory activation smoke
```

That is higher ROI than broad cleanup because it upgrades the in-memory loop
proof into persisted product evidence.
