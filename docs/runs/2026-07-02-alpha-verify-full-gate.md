# Alpha Verify Full Gate

## Verdict

The audit finding was live. `alpha:verify` was a useful fast local gate, but it
was narrower than the verification story KRN actually needs for audit-hardening
work. Typecheck, tests, `krn doctor`, Fallow, brain-battle, Promptfoo, DB
readiness, Drizzle check, persistence smoke, DB-backed brain-loop smoke, and
diff checks were available as separate proof lanes, but not as one explicit full
alpha verification command.

## Source To Decision

```yaml
source_id: repo-local-audit-481m
title: alpha verification needs fast/full proof boundaries
trust_tier: high
source_class: repo-local evidence
mechanism: fast static checks and DB/product-loop smokes prove different boundaries; a single alpha:verify label hid whether DB runtime and product-loop smoke had run in the current shell.
krn_implication: KRN needs alpha:verify to remain fast for normal edits while a separate alpha:verify:full aggregates the heavier static, eval-adapter, DB-runtime, and product-loop proof lanes.
decision_kind: adopt
decision: Keep alpha:verify as a fast alias, add alpha:verify:fast and alpha:verify:full, add alpha-verify-full to the eval proof-boundary manifest, and document fast/full semantics in README.
does_not_prove: This does not prove worker runtime execution exists, every DB smoke target passed, real LLM behavior is good, or KRN is product-ready.
consumer: package.json; README.md; packages/harness/src/evalProofBoundaryManifest.ts
falsifier: alpha:verify:full omits DB brain-loop smoke, README claims fast alpha:verify proves DB/runtime behavior, or the manifest no longer matches package scripts.
```

## Implementation

- Changed `alpha:verify` to call `alpha:verify:fast`.
- Added `alpha:verify:fast` as the existing fast gate:
  - `pnpm typecheck`;
  - `pnpm test`;
  - `pnpm krn doctor`.
- Added `alpha:verify:full` as the heavier local gate:
  - `pnpm typecheck`;
  - `pnpm test`;
  - `pnpm krn doctor`;
  - `pnpm quality:fallow:ci`;
  - `pnpm eval:brain-battle:smoke`;
  - `pnpm eval:promptfoo:smoke`;
  - `pnpm db:ready`;
  - `pnpm --filter @krn/db db:check`;
  - `pnpm db:smoke`;
  - `pnpm db:smoke:brain-loop`;
  - `git diff --check`.
- Added `alpha-verify-full` to `evalProofBoundaryManifest`.
- Extended manifest tests so the full gate is scoped as product-loop relevant
  while still explicitly non-authoritative for product readiness.
- Updated README verification wording so fast and full alpha gates cannot be
  confused.

## Verification

```txt
rtk pnpm --filter @krn/harness test -- evalProofBoundaryManifest
rtk pnpm -C packages/harness typecheck
rtk pnpm alpha:verify
rtk docker compose up -d krn-postgres
rtk env KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready
rtk env KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm alpha:verify:full
```

Result:

- Focused eval proof-boundary tests: passed.
- Harness package typecheck: passed.
- `alpha:verify`: passed.
- DB readiness before full gate: passed; Postgres reachable, 15/15 migrations
  applied, pgvector available.
- `alpha:verify:full`: passed.
- Full gate included:
  - full workspace typecheck;
  - full workspace tests;
  - `krn doctor` in DB-ready mode;
  - Fallow changed-files audit, no issues;
  - brain-battle smoke;
  - Promptfoo smoke, 2/2 cases passed;
  - DB readiness;
  - Drizzle check;
  - DB persistence smoke;
  - DB-backed brain-loop smoke;
  - diff whitespace check.

## Proof Boundary

Proves:

- KRN now has a documented fast/full split for alpha verification.
- `alpha:verify:full` aggregates the current deterministic static,
  eval-adapter, DB-runtime, and product-loop smoke lanes.
- The full gate ran successfully in the current shell against local
  Postgres/pgvector.
- The DB-backed brain-loop smoke still proves source-decision-accepted memory
  promotion and activation readback after this verification change.

Does not prove:

- Worker runtime execution exists.
- Every DB smoke target passed.
- Real LLM behavior is good.
- KRN is product-ready.
- No further audit-hardening tasks remain.
