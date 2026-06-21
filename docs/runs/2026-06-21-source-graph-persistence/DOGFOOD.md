# Source Graph Dogfood

Date: 2026-06-21.

Objective: use the M22 source graph commands on M22 itself.

## Persisted Run

- Execution run: `4370785f-b177-45d7-89d9-08053a3e640d`
- Operator intent: `442efdbf-82fc-4c15-8ea0-6d502036773d`
- Task contract: `5eb7da1d-90f0-4f5d-a779-149e78749a95`
- Harness plan: `fab70775-b737-4930-b2dd-7fd4eae9c394`
- Context assembly: `4349cbde-75f4-4621-9c84-65e82045a4d8`

Command:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn plan --task "persist SourceClaims and source-to-decision edges" --persist
```

## Source Claim

- Source artifact: `4e7d2c27-3a50-4c1e-9d69-25dca221fdb5`
- Source claim: `212815bc-477c-4985-8992-31825f5c5897`
- Linked run: `4370785f-b177-45d7-89d9-08053a3e640d`

Claim:

`M22 should model source graph with Postgres-backed relational edges before any separate graph database or crawler`

Mechanism:

`KRN already uses Postgres as canonical harness state; source-to-decision edges need transactional linkage to harness runs and feedback artifacts`

Does not prove:

`This does not prove retrieval quality, ranking quality, or long-term graph traversal performance`

## Decision Edge

- Source decision edge: `9869be50-642b-4ddf-b60b-60360f9ea8ce`
- Source claim: `212815bc-477c-4985-8992-31825f5c5897`
- Target: `harness_run/4370785f-b177-45d7-89d9-08053a3e640d`
- Support type: `implementation-boundary`
- Confidence: `medium`

Notes:

`Used to justify first Postgres-backed source graph slice`

## Source Rejection

- Source rejection: `c35e59c2-587b-4875-b7b4-32118daf6966`
- Linked run: `4370785f-b177-45d7-89d9-08053a3e640d`
- Rejected because: `no_mechanism`
- Attempted claim: `Interesting AI engineering link`
- Reason: `No mechanism, consumer, falsifier, or decision support`

The rejection path confirmed that decorative material does not create a
SourceClaim.

## Evidence Capture

- Evidence bundle: `dfa38982-a410-451c-a9e4-473cfaa3ad64`
- Review assessment: `39476e2e-b5ee-46a2-9146-d2a33d09f4b9`
- Feedback delta: `600c8b44-2df7-4096-8a53-369411b19e50`

Evidence capture found no changed files at that point, so it persisted no source
decision candidates for this dogfood run.

## Follow-Up Proof

Live doctor reported:

- Source graph schema: ready (8/8 tables present)
- SourceRepository read path: reachable
- Source graph runtime proof: ready (claims 2, edges 2, rejections 2)
- Source graph readiness: ready

Live source graph smoke passed with cleanup remaining marker count `0`.

Smoke IDs:

- Execution run: `2948fad1-c54b-48a9-82db-c60b313f7e13`
- Source artifact: `cda0b680-d1d5-49ad-b59f-839bdc199d70`
- Source claim: `6e64c337-ef44-4149-925f-c76b830ee1e4`
- Source decision edge: `6579bacf-7ee2-4b5a-9cbf-b4534987614e`
- Source rejection: `909deb68-a48f-46be-8b9a-77fc80ab74a4`

## Proven

- M22 can persist a harness run and attach a SourceClaim to that run.
- M22 can link that SourceClaim to a harness-run target through a typed
  SourceDecisionEdge.
- M22 can persist a SourceRejection for decorative or unsupported source input.
- M22 evidence capture can persist review and feedback records for the same
  run.
- `krn doctor` reports DB-backed source graph readiness without writing.
- `pnpm db:smoke:source-graph` still passes and cleans up smoke rows.

## Not Proven

- Retrieval quality, ranking quality, and graph traversal quality are not
  proven by this dogfood pass.
- The source graph does not yet perform automatic memory promotion.
- Source candidates still require explicit claim/link/rejection commands before
  they become trusted source graph records.

## Next Safest Action

M22.12 anti-rot and final handoff update.
