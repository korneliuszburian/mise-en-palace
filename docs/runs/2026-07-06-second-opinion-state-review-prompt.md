# Second-Opinion Prompt: Strategic State Review + Forward Plan

Paste the block below into a fresh Claude session (the reviewer has NO project
context). It is self-contained. If that session has repo access
(/home/krn/coding/krn/active/mise-en-palace), it should read the files listed
under "verify" to ground its claims; if not, the narrative below is enough to
answer.

---

You are a senior engineering reviewer giving a SECOND OPINION on a project. You
have no prior context. Be skeptical and concrete: falsify optimistic claims,
refuse to approve on vibes, and give a forward plan a working engineer could
execute on Monday. Do not pad with encouragement. If information is missing,
name exactly what you need.

## 1. What the project is

**Repo:** `mise-en-palace`, internally called **KRN**. It is a **governed RAG
memory / source / review / feedback layer that wraps a coding agent** (Codex or
Claude). The kernel contract: KRN is machinery that **selects, applies,
verifies, and forgets** task-specific context for an agent. It is explicitly
NOT a worker daemon, dashboard, REST API, crawler, generic knowledge graph,
broad benchmark lab, prompt framework, or autonomous memory-evolution system.
Those directions are REJECTED by the project's own product law until a named
product loop justifies them.

TypeScript monorepo (pnpm, strict, Fallow quality gate, Vitest):
`@krn/core` (domain model), `@krn/harness` (activation/retrieval/compilation),
`@krn/db` (Postgres + pgvector), `@krn/cli` (commands), `@krn/workers`
(contract/readback ONLY — no executor, by decision), `@krn/codex-adapter`.

Task tracking is **Beads** (`bd` CLI), persisted in-repo at `.beads/issues.jsonl`.

## 2. Architecture reality (how it actually works today)

- Live Postgres brain store: `source_artifacts` -> `source_claims` ->
  `source_decisions` -> `source_decision_edges` (decision-link support) ->
  `search_documents` (lexical+pgvector); plus `memory_records` (review-gated).
- Recall: `krn source search --query "..."` and `krn brain search` drive the
  real activation/retrieval path over the live DB.
- Source-search ranking: `totalScore = lexical + vector + graph + temporal +
  contextRoi + feedback + trust`. A `SourceDecisionEdge` adds a decision-linked
  boost (confidence-weighted). IMPORTANT: a SourceClaim with NO
  SourceDecisionEdge is INVISIBLE to source-search (this was a real finding).
- Teach loop (product CLI, no DB-hacking): `krn source decision adopt --persist
  --link --link-target-type ... --link-target-id ...` creates a SourceDecision
  AND a SourceDecisionEdge in one command; `krn source decision gaps` (read-only)
  reports accepted-but-unlinked AND un-adopted claims.
- Verification gate: `pnpm typecheck`, `pnpm test`, `pnpm -w run
  quality:fallow:ci` (dead-code/duplication audit), `pnpm docs:lint`, plus DB
  smokes (`pnpm db:smoke:*`) and deterministic evals (`pnpm eval:*`).

## 3. Current state — what is actually PROVEN (be brutal verifying these)

Deterministic eval layer (in-memory fixtures, proxy labels):
- `eval:memory-advantage` — 25 cases; per-case `implementation_decision`
  (decision_before_memory -> decision_after_krn); win/neutral/rejection classes;
  multi-session, firm-pattern challenges, source ablation.
- `eval:source-graph-ranking` — 10 relation-linked cases, 8 SourceClaimEdge
  kinds, distractor-competition flat-comparison, held-out split.
- `eval:codex-output-comparator`, `eval:brain-ranking`, `eval:determinism`.

Live-DB proof layer (this week, on real repo governing decisions seeded from
real docs/ADRs):
- `db:smoke:real-recall-advantage`: seeds 3 REAL governing decisions (worker
  contract-only, unknown-first input boundary, bounded-loop-before-surfaces)
  plus lexically-stronger distractors with LOW-confidence edges; proves the
  brain's HIGH-confidence governing decision beats the distractor at rank 1
  (3/3 advantage wins, reproducible). Baseline (distractor only) picks the
  distractor.
- Live teach loop proven end-to-end: a missed decision was `adopt --link`-ed and
  re-recalled successfully.
- Senior code review of the session diff: 0 blockers, 0 majors; Fallow fully
  clean (no duplication/dead-code); 401 tests green.

Honest gaps already admitted in-repo:
- Ranking ties: tied candidates (totalScore=95) are broken arbitrarily (DB row
  order) — investigated, deemed genuine ties, not a defect.
- The brain's effective knowledge was ~12/23 claims because most real claims
  were never adopted (no SourceDecisionEdge). Now ~17/23 after manual teaching;
  the diagnostic (`source decision gaps`) was extended to surface this.
- Deterministic proofs are PROXY labels, not live-agent truth.

## 4. The strategic problem (why we need you)

The execution queue keeps emptying into cleanup/investigation. Root cause
(diagnosed in `docs/runs/2026-07-05-roadmap-gap-diagnosis.md`):
1. The deterministic-proof layer is SATURATED (more eval cases = diminishing
   returns).
2. The obvious next leap — "prove advantage over baseline Codex on a REAL task"
   — is EXTERNALLY BLOCKED (Codex API limits are out).
3. There is NO crisp, actionable product END-STATE defined beyond the kernel
   mechanism (select/apply/verify/forget). So once proof is done, "what to
   build next" is undefined.

## 5. What we want from you

Answer, concretely and skeptically:

A. **State evaluation.** Is the brain, as proven today, actually a *useful*
   breakthrough (something an operator/team would pay for over baseline Codex +
   a notes file), or is it "proven-but-not-yet-useful"? Where is the strongest
   honest claim, and where is it weakest? Cite the proof that backs each claim.

B. **Breakthrough end-state.** Define the product end-state concretely enough
   to decompose: what does the brain DO, for whom, in what loop, with what
   falsifier? Prefer an end-state reachable WITHOUT live-Codex execution
   dependency (since that's blocked). If you believe the end-state genuinely
   requires live-agent execution, say so and justify it.

C. **Forward action plan — 3 to 6 actionable slices**, each with: one-line
   objective, acceptance criteria, a falsifier, the verification command, and
   the honest non-proof. Order them by leverage. They must be executable within
   this repo's product law (no daemon/API/MCP/crawler without justification).

D. **Missing information.** What would you need to read or run to make the
   above higher-confidence? List files/commands. (If you have repo access, go
   read them before finalizing.)

## 6. Verify (if you have repo access)

Read these to ground your answer; do not trust this summary blindly:
- `PLAN.md`, `GOAL.md`, `docs/KRN_KERNEL.md` — product law + state.
- `docs/architecture/kernel-next-priority-synthesis.md` — prior prioritization
  + falsification table (note: its seeded beads are now CLOSED).
- `docs/runs/2026-07-05-roadmap-gap-diagnosis.md` — the gap diagnosis.
- `docs/runs/2026-07-05-live-dogfood-recall-teach-loop.md` and
  `docs/runs/2026-07-05-live-dogfood-adopt-link.md` — live dogfood records.
- `packages/cli/src/runRealRecallAdvantageDbSmoke.ts` — the live-DB proof.
- Run, if a DB is up: `pnpm db:ready`; `pnpm db:smoke:real-recall-advantage`;
  `pnpm eval:memory-advantage`; `krn source search --query "should KRN build a
  dashboard" --json` (against the persistent brain store).

Output: (1) state verdict in 5-8 bullets, (2) the breakthrough end-state in
2-3 sentences, (3) the 3-6 slice plan as a table, (4) missing-info list. End
with a one-line overall judgment: is this a breakthrough in progress, a
well-engineered dead end, or somewhere in between — and why.
