# Verification

## Slice 00

Commands run:

```sh
git status --short --branch
sed -n '1,220p' docs/KRN_KERNEL.md
sed -n '1,520p' packages/db/src/schema/retrieval.ts
sed -n '1,320p' packages/db/src/repositories/DrizzleRetrievalRepository.ts
sed -n '130,210p' packages/harness/src/repositories/types.ts
sed -n '780,850p' packages/db/src/repositories/mappers.ts
sed -n '1,230p' packages/db/src/migrations/0002_shocking_post.sql
rg -n "fullTextSearch|tsvector|to_tsvector|plainto_tsquery|websearch_to_tsquery|vector readiness|pgvector|embedding" packages/db/src packages/cli/src packages/harness/src -g '*.ts'
rg -n "smoke|readiness|memory-governance|source-graph|harness-evidence|harness-plan" packages/cli/src packages/db/src packages/harness/src -g '*.ts'
cat package.json
```

Results:

- Repository was clean before Slice 00 docs were created.
- Kernel contract confirms M24 must select/apply/verify/forget context rather
  than build broader context.
- Retrieval schema and migration already contain the M24 durable tables.
- Repository port/adapter already cover retrieval runs, candidates, activation
  decisions, and context selection.
- Repository port/adapter do not yet cover search document creation, lexical
  search, embedding model creation, or embedding row storage.
- Root scripts and CLI DB smoke routing do not yet expose
  `retrieval-substrate`.

Post-doc verification:

- `pnpm typecheck`: passed.
- `git diff --check`: passed.
