# Dogfood

## M25.07 Activation On Real Next Task

Task:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn plan --task "improve KRN doctor activation readiness" --persist
```

Persisted IDs:

- operatorIntent: `4a015017-5aea-4ac5-8d49-d12e3a7cfc48`
- taskContract: `ab7a1b91-30da-4065-ba5a-9efea8fa7e72`
- harnessPlan: `29473237-787f-4278-96b7-9d1e3a85fd7d`
- contextAssembly: `bb8ad48a-b675-4c79-ac71-edaa665129c9`
- executionRun: `bb33bd3d-02df-4ff3-839b-6f545de88b4c`
- retrievalRun: `d15b1b47-0e0f-48eb-b385-bfaaffa9c0a7`

Activation readback:

- retrieval candidates: `3`
- activation decisions: `3`
- included decisions: `3`
- excluded decisions: `0`
- conflict decisions: `0`
- stale decisions: `0`
- context items: `3`
- context exclusions: `0`

Evidence capture:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn evidence capture --run-id bb33bd3d-02df-4ff3-839b-6f545de88b4c --persist
```

Persisted evidence IDs:

- evidenceBundle: `4bf9c4f4-684e-4a4d-972d-f1def2d80620`
- reviewAssessment: `ab85ce9b-debc-4e19-800e-cf32257d21f1`
- feedbackDelta: `4ed22906-7783-43dd-ab82-91f4c3e52e1f`

What helped:

- The top-level plan output now made the selected context visible before the
  Codex execution brief.
- The persisted context assembly metadata linked back to retrieval run
  `d15b1b47-0e0f-48eb-b385-bfaaffa9c0a7`.
- The task selected a small working set: one memory record and two source
  claims.
- Evidence capture could attach to the persisted execution run without memory
  mutation.

What this does not prove:

- It does not prove noisy-corpus exclusion behavior for the live project corpus;
  this dogfood run had zero exclusions.
- It does not prove final ranking quality.
- It does not prove production-scale search/vector quality.
- It does not prove automatic memory promotion, which remains intentionally out
  of scope.

Post-dogfood checks:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:activation
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn doctor
```

Results:

- activation smoke passed with retrieval candidates `6`, activation decisions
  `6`, included decisions `2`, excluded decisions `2`, conflict decisions `1`,
  stale decisions `1`, context items `2`, context exclusions `4`, and cleanup
  remaining marker count `0`.
- doctor reported activation runtime proof ready with decisions `25`,
  inclusions `24`, exclusions `1`, and activation readiness ready.
