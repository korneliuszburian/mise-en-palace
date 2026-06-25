# Promptfoo Adapter Boundary

Status: active D-01 boundary.

Promptfoo is a bounded runner/result adapter for KRN eval evidence. It is not a
KRN behavior proof authority.

## Allowed

Promptfoo may:

- run local integration smoke fixtures;
- emit JSONL result evidence;
- prove runner/config/provider/result mapping;
- map rows to non-authoritative `promptfoo_integration_smoke` proof records;
- map rows to `EvalCandidateProposal` values for human review.

## Not Allowed

Promptfoo must not:

- mark GoldenTask behavior cases as passed by itself;
- mutate Memory Core;
- promote eval candidates;
- become a broad eval platform;
- replace deterministic KRN behavior runners;
- imply Memory Brain product readiness.

## Required Mapping

Promptfoo rows that should influence KRN must become one of:

```txt
GoldenBehaviorProof(provenance=promptfoo_integration_smoke)
  -> rejected by runGoldenTaskFixtures as behavior proof

EvalCandidateProposal
  -> status=candidate
  -> metadata.acceptedAsBehaviorProof=false
  -> sourceEvidence includes Promptfoo JSONL output
```

Only `krn_behavior_execution` can satisfy GoldenTask behavior proof today.

## Current Proof

D-01 hardens:

```txt
packages/harness/src/goldenPromptfooResult.ts
packages/harness/src/goldenPromptfooResult.test.ts
```

The tests prove Promptfoo rows can become reviewable eval proposals while still
being rejected as GoldenTask behavior proof.
