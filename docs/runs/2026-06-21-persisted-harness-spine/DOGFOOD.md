# Dogfood

## Slice 09 persisted harness loop dogfood

Task:

```bash
krn plan --task "improve KRN doctor harness persistence readiness" --persist
```

Persisted entities:

- operator intent: `9114aae8-9634-4d5a-9afa-75cf81a4ae34`
- task contract: `32c8b8c8-d709-4fd3-984f-ddef522e1fd3`
- harness plan: `e21c2cba-fcac-40e2-8b93-b5e0a025fbd8`
- context assembly: `e5de7b52-acd7-4b86-9908-24ede5cdfbbf`
- execution run: `66626e90-0cf5-4803-9bc7-f477b28b47c4`
- evidence bundle: `94cf92cf-a826-406f-bcad-9d9ebb7a0a8e`
- review assessment: `630d46ec-e323-4974-a90e-4a1a03571499`
- feedback delta: `21c93ea7-2f2e-4e0c-8d80-ed07138e57f8`

SQL readback for execution run `66626e90-0cf5-4803-9bc7-f477b28b47c4`:

- status: `planned`
- evidence contract present in harness plan metadata: `true`
- evidence bundles: `1`
- review assessments: `1`
- feedback deltas: `1`
- run events: `2`

What this proves:

- `krn plan --persist` writes the first persisted harness run identity.
- `krn evidence capture --run-id --persist` links evidence, review, and
  feedback candidate records to that execution run.
- `krn doctor` can report harness persistence readiness from read-only
  inspection.
- `pnpm db:smoke:harness-plan` and `pnpm db:smoke:harness-evidence` still pass
  after the dogfood run and clean their marker rows.

What this does not prove:

- Memory/source/eval candidates are not applied automatically.
- Context activation still abstains for this task because no durable source or
  memory corpus has been loaded yet.
- Worker execution, retries, leasing, and background processing remain later
  scope.
- This is not production external proof; it is local Postgres proof.

Review burden:

Low to medium. Slice 09 is docs/run evidence plus live command proof. The main
risk is over-claiming: this dogfood proves the persisted harness loop spine, not
full Memory Core, Source Graph activation, workers, or production deployment.

Rollback path:

Revert the focused Slice 09 docs commit. The dogfood DB rows are intentionally
kept as local proof rows; smoke rows were marker-cleaned.

Next missing capability:

Slice 10 anti-rot audit should verify the whole M21 surface and forbidden
non-goals. After M21 finalization, the next product capability should make
feedback candidates feed durable memory/source candidate pipelines without
auto-applying them.
