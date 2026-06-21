# Verification

Final M19 verification commands:

- `pnpm typecheck`
- `pnpm test`
- `pnpm --filter @krn/cli krn plan --task "improve KRN doctor brain store readiness"`
- `pnpm --filter @krn/cli krn doctor`
- `pnpm --filter @krn/cli krn evidence capture`
- `find . -maxdepth 3 -type d | sort`
- `grep -R "requiredSkills" packages/core && exit 1 || true`

Forbidden-surface checks:

- no `apps/`;
- no `packages/dashboard`;
- no `packages/api`;
- no `.krn` runtime truth;
- no broad eval suite;
- no broad subagent system;
- no Codex adapter imports in `packages/core`;
- no separate vector, graph, search, or queue store.

Status:

- Final command set was rerun after normalizing handoff files under
  `docs/handoff/` and adding the `GOAL.md` operational skill-use constraint.
- `pnpm typecheck`: passed.
- `pnpm test`: passed.
- `pnpm --filter @krn/cli krn plan --task "improve KRN doctor brain store readiness"`:
  passed; no-store preview with context abstention.
- `pnpm --filter @krn/cli krn doctor`: passed; reports
  `Brain store readiness: preview only...`.
- `pnpm --filter @krn/cli krn evidence capture`: passed; printed evidence and
  no memory mutation.
- `find . -maxdepth 3 -type d | sort`: run.
- `grep -R "requiredSkills" packages/core && exit 1 || true`: passed with no
  matches.
- Safer targeted check `if grep -R "requiredSkills" packages/core; then exit 1; fi`:
  passed with no matches.
- `git diff --check`: passed.
- Forbidden directories `apps`, `packages/dashboard`, `packages/api`, and
  `.krn`: absent.
- Separate store dependencies Redis/Kafka/Neo4j/Qdrant/LanceDB/Elastic/OpenSearch:
  absent from package manifests and lockfile.
- Codex adapter imports in `packages/core`: absent.
- `.codex/agents`: only `ts-type-critic.toml`.
- Broad eval/benchmark directories: absent.
