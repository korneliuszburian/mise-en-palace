# Memory Brain Audit Dogfood

Date: 2026-06-22

Scope: MM-07, dogfood the new audit CLI on the current KRN repo after
`400b4c7 feat(cli): add memory brain audit gate`.

## Commands

- `pnpm typecheck`
- `pnpm test`
- `pnpm --filter @krn/cli krn audit repo --repo ../.. --json`
- `pnpm --filter @krn/cli krn audit slice --since HEAD~1 --repo ../.. --json`
- forbidden directory scan for rejected runtime/product surfaces
- forbidden dependency scan for Redis/Kafka/separate vector or graph DB packages

## Results

Repo audit:

- scope: `repo`
- verdict: `advisory`
- findingCount: `2`
- blockingCount: `0`
- warningCount: `2`
- findings:
  - `packages/cli/src/runDoctorCommand.ts`: unchecked `JSON.parse` boundary
  - `packages/cli/src/runInitCommand.ts`: unchecked `JSON.parse` boundary

Slice audit for `HEAD~1..HEAD`:

- scope: `slice`
- verdict: `advisory`
- findingCount: `1`
- blockingCount: `0`
- warningCount: `1`
- finding:
  - `Handoff compact missing`

Forbidden surface/dependency proof:

- no forbidden directories were found for Research Foundry, Pattern Vault,
  dashboard, API/MCP, `.krn`, or rejected package surfaces.
- no direct package dependency was found for Redis, Kafka, Neo4j, Qdrant,
  Chroma, Pinecone, or Weaviate.

## Assessment

The audit CLI is usable as a repo and slice gate. It returns non-zero for seeded
blocking violations in tests and returns advisory for the current KRN state.

The two repo warnings are legitimate future cleanup candidates, not MM-07
blockers:

- parse `package.json` in `runDoctorCommand.ts` through an unknown-first helper.
- parse target repo metadata in `runInitCommand.ts` through an unknown-first
  helper or schema-owned validator.

The slice warning is expected until AuditBundle/handoff persistence is wired
into the slice gate. The current PLAN carries the compact handoff for MM-07.

## Next Recommendation

Proceed to MM-08 and reconcile the existing pure observation contracts from
`acca6d2` against the controlled plan before adding schemas, DB tables, CLI, or
workers.
