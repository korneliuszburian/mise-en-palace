# KRN Active Plan

Status: active compact root plan. Date: 2026-06-30.

Root `PLAN.md` is the compact product source of truth. Detailed history stays in `PLANS.md`.
Current-task contracts live in `PLANS.md`.

## Product State

```txt
controlled-internal-alpha for technical operators: yes / stronger
product-ready: no
widened internal alpha: no
external/foreign second-operator proof: rejected as wrong product forcing function
active stream: Shared Brain Vertical Loop
current task: WRK-01 Verify and repair worker enqueue atomicity
```

## Compact Checkpoints

```txt
evidence/review loop: DB-backed and useful for dogfood
candidate reviewability: core primitive
source-search readback: usable through CLI and JSON
brain-search preview: usable through CLI and JSON
brain-search selected knowledge: usable pattern packet in preview output
brain-search store-only: source/search evidence can be read without file catalog
brain-search store-only selected knowledge: source/search evidence yields reviewable packets
store-backed pattern gate: source/search packets shaped one retained paper intake
brain knowledge vocabulary: preferred CLI/readback language is `krn brain knowledge`
product loop replay: DB-backed and inspectable
graph-brain readback: relation summary visible through source/brain search
ingest v0/v1: bounded loop readback visible through source artifact preview
heartbeat/dreaming: manual candidate-only runtime loop readback visible through heartbeat preview
heartbeat candidate review: one candidate can be reviewed/deferred with evidence result
heartbeat knowledge acquisition: missing-evidence input can produce reviewable candidate-only acquisition work
heartbeat acquisition bridge: source/brain search JSON missingEvidence can feed candidate-only heartbeat preview
heartbeat acquisition dogfood: live DB-backed source/brain missingEvidence produces acquisition candidates
heartbeat candidate focus: candidate-kind filter can isolate acquisition lane and avoid unrelated repo reads
heartbeat acquisition follow-up: focused candidate triggered bounded source/evidence follow-up and exposed missing query diagnostics
heartbeat acquisition diagnostics: acquisition candidates preserve query-shape diagnostics and recommended follow-up
heartbeat diagnostic follow-up: diagnostics selected a bounded source/evidence split and exposed source-claim/document linkage gap
source claim document link readback: source-search answer packages expose artifact-linked SearchDocument refs for supporting SourceClaims
brain-search linked document summary: sourceClaimDocumentLinks/linkedSearchDocuments visible in sourceSearch summary
heartbeat acquisition linked evidence: linkedDocumentEvidence visible in acquisition candidates
heartbeat acquisition review: linked and missing-only escalation accepted
AMA acquisition lane: persisted AMA source evidence reused; linked-evidence behavior accepted
AMA activation utility: brain search utility readback is useful across current mini batch
AMA activation utility routing: heartbeat preview preserves exploration evidence in candidate-only output
AMA activation utility eval proof: heartbeat-routed exploration candidate has behavior proof
AMA activation utility candidate review: heartbeat-routed candidate accepted for manual source/eval follow-up
AMA activation utility source/eval follow-up: accepted review retained as SourceArtifact/SourceClaim/SourceDecisionEdge evidence
AMA activation utility brain replay: marker/SearchDocument replay works; natural exact SourceClaim/SourceDecisionEdge recall needs bounded repair
AMA activation utility natural recall: exact SourceClaim/SourceDecisionEdge now surface through natural source/brain search readback
source-backed selected knowledge: default brain search can use ready SourceClaim packets when catalog readback misses
source-backed mini Brain-QA: fallback helps Q5 ingest and IMR41; keep behavior, no ranking repair now
multi-repo source artifact readback: second repo README persists and resolves source/brain/heartbeat readbacks
selectedKnowledge target fit: EKOLOGUS packet reaches persisted Codex brief first
shared brain vertical: source-to-decision pattern reached plan, brief, evidence, observe/reflect; next-run priority repaired
retained pattern code-quality vertical: unknown-first pattern improved CLI JSON boundary; persisted plan/evidence bridge gap exposed
retained pattern usefulness bridge: pattern usefulness persists through evidence/run readback without fake SourceClaim feedback
retained pattern plan/brief bridge: selected retained pattern IDs persist through plan metadata and Codex brief readback
retained pattern run readback: run show text/JSON exposes retained pattern selection beside usefulness outcomes
source relation candidate evidence: missing relation evidence is explicit and blocks review-ready status
pattern/research brain: hooks and acquisition escalation retained with consumer/falsifier and brain-knowledge readback
brain-QA pattern coverage: graph relation and heartbeat candidate-only runtime patterns retained; ingest pattern deferred until it changes a decision
mini brain-QA recall/precision: Q4/Q6 recall repaired; Q6 adjacency accepted
second-operator launch packet: historical packet only; no longer active direction
product-ready brain: not complete
```

## Active Task

### WRK-01 Verify And Repair Worker Enqueue Atomicity

Goal: build the shared KRN brain kernel through larger end-to-end vertical
slices, not more defensive or target-bookkeeping closures.

Hard boundary: do not build dashboard, API, MCP, worker daemon, crawler, broad
eval platform, DB schema, or product server. Do not create synthetic proof. Use
real repo work, real evidence, and compact reports.

Latest completed report:

```txt
docs/reviews/controlled-dogfood/2026-07-01-sbv-05-run-show-pattern-selection/REPORT.md
```

Next slice:

```txt
mise-en-palace-60b: Verify and repair worker enqueue atomicity.
```

Point: build one shared memory system that condenses patterns, research, local evidence, and senior standards into reusable decisions that improve future work.

## Recent Completed Streams

```txt
V358-V378: graph/source/ingest/heartbeat/Fallow/consensus foundations, brain search, replay, mini Brain-QA, and current second-operator de-scope completed.
IMR-01-55: selected brain knowledge, store-only pattern readback, acquisition bridge, linked evidence, AMA/source-backed lanes, and EKOLOGUS target-fit precision completed.
SBV-00: retained source-to-decision pattern flows through brain knowledge, plan, Codex brief, evidence, observe, and reflect; next-run check exposes over-budget exclusion before successful reuse.
```

## Remaining Product Gaps

```txt
1. shared brain kernel vertical loop
2. pattern/research brain continuously applied to code quality
3. graph/ingest/heartbeat/consensus vertical loops
4. product UI/API/MCP after usefulness/security gates
```

## Pattern Gate
For non-trivial infra, harness, CI/eval, Codex-surface, TypeScript,
target-workflow, security, operator-UX, or research/paper/course-driven work:

```txt
source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier
```

## Verification Policy
Use the narrowest relevant verification.

```txt
docs/plan-only: git diff --check
source: pnpm typecheck, pnpm test, git diff --check
DB/eval-affecting: pnpm db:ready, pnpm db:smoke, pnpm eval:promptfoo:smoke when relevant
```

If Vitest hits a temporary-directory write error, use
`TMPDIR=/home/krn/.cache/krn-tmp pnpm test`. Do not set `TMPDIR` under the repo checkout:
CLI boundary tests rely on outside-workspace temporary directories.

After each bounded slice, commit, push, and confirm CI with the full SHA.
