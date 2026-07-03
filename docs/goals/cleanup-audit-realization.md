# /goal: Realize KRN audit cleanup via enriched Beads

## Context

A deep health audit of `mise-en-palace` (KRN kernel bootstrap — a Codex/AI operating layer, controlled-internal-alpha, "product-ready: no") produced findings at `docs/audit.md`. The findings have been triaged into **30 Beads issues** (P0=6, P1=6, P2=11, P3=7) that map 1:1 to the audit.

Each bead now carries an **execution-ready description** with:
- `Files:` — concrete paths/symbols to touch
- `Acceptance:` — what "done" means (behavior preserved, tests pass)
- `Verify:` — exact commands (`pnpm typecheck`, `pnpm test`, `pnpm db:smoke:*`, etc.)
- `Note:` — conflict/ordering notes where relevant

A "wave-1" of safe deletions is already staged uncommitted in the working tree (`policy.ts`, `harness/recipes/`, `harness/eval/`, `goldenPromptfoo*`, promptfoo stub, `evalProofBoundaryManifest` renderer — ~1182 deletions). **Do NOT commit or push this yet** — it awaits verification after the full cleanup.

## Objective

Execute the 30 beads to completion, making the repository healthier and more aligned with the anti-Karpathy principle ("if ≤50 lines of straightforward code can achieve the same outcomes, 200+ lines of meta-abstraction is likely AI-slop").

Focus on the **P0 → P1 → P2 → P3** sequence. P0 beads are highest leverage; P3 are minor cleanups. **Do not skip P0 to chase P3**.

### Key decision beads

- **`plnv` (@krn/workers)** — **HUMAN DECISION REQUIRED** before execution. Two branches:
  - *(A) downscope*: delete write-authority tables (`allowedWritesByMemoryCoreGate`/`requiredWritesByMemoryCoreGate`) + authority fields from 5 preview builders; rename/refocus package.
  - *(B) build executor*: build minimal poller/executor that consults authority tables, making `not_enforced` actually enforced.
  - **Park this bead via `bd human` until a human decides**. Do NOT execute plnv without resolving.

- **`35hv` (pgvector)** — implement `searchVector`/`searchHybrid` so the pgvector brain-store is functional (currently only `searchLexical` exists despite HNSW index + embeddings tables). This is a NEW bead created from the audit.

### Conflict/overlap awareness (built into bead Notes)

- `ssb5` ↔ `9sa1`: `assessSourceDecisionReviewSignals` is owned by `9sa1` — excluded from `ssb5` deletion.
- `v1ao` ↔ `wuk7` ↔ `35hv`: all touch DB schema/migrations — batch the drops together to avoid repeated migrations/meta churn.
- `5sqm` (delete @krn/schema) → `ssb5`/`dxn0`/`lugu`/`hhh0`/`w74b`: core moves first; downstream beads reference new paths.
- `f59g` ↔ `zm3d`: same target-fit surface — do together.
- `xhs9` ↔ `a3tl`: eval split + naming — do together.
- `lugu` ↔ `35hv`: retrieval IDs may become used if pgvector lands — re-evaluate after 35hv.

## Execution workflow

1. **Prime beads**: `bd prime` (this loads current state).
2. **Find ready work**: `bd ready` (shows all open issues with no blockers).
3. **Claim a bead**: `bd update <id> --claim` (atomically marks it yours).
4. **Execute the bead**:
   - Read its enriched description (`bd show <id>`) — this gives you exact files, acceptance, verification.
   - Make the changes.
   - Run the `Verify:` command(s).
   - Ensure `Acceptance:` is satisfied.
5. **Close the bead**: `bd close <id> --reason="Completed"`.
6. **Continue** until all P0/P1/P2/P3 beads are closed (except `plnv`, which requires human decision first).

### DO NOT

- **Do NOT commit the uncommitted wave-1 deletions yet** — verify them after the full cleanup, then commit in one batch.
- **Do NOT skip P0 to chase P3**.
- **Do NOT execute `plnv` without human decision**.
- **Do NOT create parallel "cleanup" tasks outside the bead system — everything is in beads.
- **Do NOT "improve" adjacent code while fixing a bead** — only touch what the bead requires. Surgical changes.

### Verification (that execution is complete)

- `bd list --status=open` → should show only `plnv` (if human decision pending) or 0 issues.
- `pnpm alpha:verify:full` → should pass (this is the full gate: typecheck, test, doctor, fallow, brain-battle smoke, promptfoo smoke, db:ready, db:check, db:smoke, db:smoke:brain-loop, git diff --check).
- `git status --short` → only shows the wave-1 uncommitted changes (plus any your execution added).
- `bd search pgvector` → finds `35hv` (the new bead).
- `bd show <id>` for any bead shows the enriched description with Files/Acceptance/Verify/Note.

## Handoff / 2nd-opinion prompt

**After you finish executing the beads**, invoke a second-opinion audit with this prompt:

> "You are a senior TypeScript architect and AI systems reviewer. A cleanup wave based on audit `docs/audit.md` was executed via 30 enriched Beads. Review the execution outcome:
>
> 1. Run `bd list --status=open` — are all non-decision beads closed?
> 2. Run `pnpm alpha:verify:full` — does the full gate pass? If not, what failed and why?
> 3. Check git status — are the changes minimal and surgical, or did cleanup balloon? Are there unintended edits?
> 4. Inspect the wave-1 uncommitted deletions (`policy.ts`, `harness/recipes/`, `harness/eval/`, `goldenPromptfoo*`, promptfoo stub, `evalProofBoundaryManifest` renderer) — are they safe to commit now, or did later changes make them risky?
> 5. Look for missed opportunities — did any bead introduce new duplication/complexity? Are there new anti-Karpathy violations?
> 6. Verify that conflict/overlap notes were honored (e.g., `9sa1` wired `assessSourceDecisionReviewSignals`, so `ssb5` should NOT have deleted it; `5sqm` moved parsers to core, so downstream beads reference new paths correctly).
>
> Produce a structured report with file:symbol findings, risk levels, and recommendations. Be ruthless — if cleanup introduced slop, say so."

This second-opinion step is **required**. Do not skip it.

## Success criteria

- All P0 → P1 → P2 → P3 beads closed (except `plnv` awaiting human decision).
- Full verification gate (`pnpm alpha:verify:full`) passes.
- Git diff shows only the intended changes (cleanup, no scope creep).
- Second-opinion review confirms no new issues introduced.
- Wave-1 deletions are verified safe and can be committed in one batch.

---

**Run `bd ready` to begin. Execute surgically. Verify thoroughly. Close when done. Then invoke the 2nd-opinion audit.**
