# Blockers

Hard blockers:

- None for M27.

Closed in M27:

- Target repo fixture exists and has no forbidden KRN runtime surfaces.
- `krn init --dry-run --repo <fixture>` is proven read-only.
- `krn init --connect --repo <fixture> --persist` is proven with Project,
  RepoInstallation, and ProjectKernel create/reuse behavior.
- `pnpm db:smoke:init-connect` is proven with readback, idempotency, and
  cleanup count `0`.
- `krn plan --project <project-id> --task "improve test script readiness" --persist`
  is proven with explicit Project lookup, ProjectKernel loading, repo
  installation metadata, and no fallback to the default project when explicit
  project lookup fails.
- `pnpm db:smoke:target-repo-harness` is proven with project-scoped persisted
  plan, Codex brief rendering, evidence/review/feedback persistence, target
  project linkage, and cleanup count `0`.
- `krn doctor` target repo readiness is proven.
- M27 anti-rot is proven.

Residual later scope:

- Real external repo mutation is not built.
- Fixture overlay apply mode is not built.
- Production worker leasing/claim/retry execution is not built.
- Actual maintenance jobs are not executed.
- Codex is not invoked by KRN.
- MCP server is not built.
- API and dashboard are not built.
- Source crawler/research layer is not built.
- Broad eval/benchmark suite is not built.
- Plugin packaging is not built.
- Observational memory/reflection layer is not built yet; this is planned for
  the required post-M27 memory ideal-state goal.

Explicit non-blockers:

- No dashboard UI exists by design.
- No API exists by design.
- No MCP server exists by design.
- No source crawler or research layer exists by design.
- No `.krn` runtime truth exists by design.
- No separate vector, graph, search, or queue store exists by design.
- No runtime markdown memory exists by design.
- No broad eval suite exists by design.
- Direct dogfood activation abstained for the empty fixture context. This is
  expected gap-aware behavior, not a blocker.
