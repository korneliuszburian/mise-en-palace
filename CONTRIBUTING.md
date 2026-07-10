# Contributing to KRN

KRN is an internal technical alpha. Contributions are reviewed for this
repository's current Memory Core scope; a contribution is not permission to
expand it into a dashboard, broad MCP server, autonomous worker, or external
release.

Before changing code:

1. Read `AGENTS.md` and use `rtk` for repository shell commands.
2. Read `KRN_ROADMAP.md`; also read `CONTEXT.md` and `CONVENTIONS.md` when the
   change touches terminology, artifacts, planning, review, or debugging.
3. Claim or create a Beads issue. Record what the change proves and does not
   prove before closing it.
4. Keep the consumer, falsifier, and non-proof boundary explicit. Use the
   repo-local skill required by the task.

Beads history validation, retention, and redaction ownership are defined in
`docs/BEADS_OPERATIONS.md`; run its validator before any manual archive.

For a code change, run the smallest relevant proof path and then the root gates:

```sh
rtk pnpm toolchain:check
rtk proxy pnpm typecheck
rtk proxy pnpm test
rtk proxy pnpm quality:fallow:ci
rtk git diff --check
```

Changes touching Postgres, migrations, retrieval, authority, evidence, or
feedback also require the relevant current DB readiness/smoke and eval proof.
If Postgres or Codex is unavailable, report the result as blocked or
unverified; do not call it passed.

Use Conventional Commits. Keep pull requests narrow, include falsifying tests
for risky behavior, and do not include unrelated cleanup. `.github/CODEOWNERS`
identifies the review owner for authority, migrations, CI, and security paths.
The owner may require additional review for those boundaries.
