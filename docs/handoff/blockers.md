# Blockers

Hard blockers:

- None for MM-29A.

Closed in MM-29:

- Negative memory application feedback affects activation ranking.
- Activation candidate metadata exposes feedback counters and penalty.
- Feedback is no longer only a passive DB counter.

Closed in MM-28:

- `invalidateMemoryRecord` exists at repository boundary.
- Live memory-governance smoke proves invalidated memory is excluded from active
  memory.
- Live memory-governance smoke proves the MemoryRecordVersion remains present
  after invalidation.

Closed in MM-27:

- MemoryReviewGate exists in harness.
- Public `krn memory candidate promote --persist` requires
  `--evidence-reviewed-ref` and passes through MemoryReviewGate.
- Missing raw evidence review reference and missing linked SourceClaim block
  promotion before low-level repository promotion.

Closed in MM-26A:

- Public `krn memory candidate promote --persist` no longer enters DB runtime.
- Public promote reports that MemoryReviewGate is required and no MemoryRecord
  is created.
- Low-level repository promotion remains internal DB/smoke infrastructure only.

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
- Observational memory staging is built and dogfooded through MM-17F.
- Reflection staging is built through MM-25.
- Governed promotion via MemoryReviewGate is built through MM-27.
- Review-required demotion/invalidation candidates, anti-memory expansion, and
  golden proof remain planned later work in
  `docs/plans/memory-ideal-state/PLAN.md`.
- Public memory promotion without MemoryReviewGate/evidence review reference is
  intentionally blocked.

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
