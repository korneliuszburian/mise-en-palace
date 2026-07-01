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
active stream: Internal Multi-Repo Operator Loop
current task: IMR-00 Internal Multi-Repo Operator Loop
```

## Compact Checkpoints

```txt
repo/current-truth hygiene: strong enough for continuation
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
AMA acquisition lane: linked-doc and source-search review useful, but direct AMA paper evidence still missing
source relation candidate evidence: missing relation evidence is explicit and blocks review-ready status
pattern/research brain: hooks and acquisition escalation retained with consumer/falsifier and brain-knowledge readback
mini brain-QA benchmark: seven current local questions ran through brain search JSON readback
brain-QA pattern coverage: graph relation and heartbeat candidate-only runtime patterns retained; ingest pattern deferred until it changes a decision
mini brain-QA recall/precision: Q4/Q6 recall repaired; Q6 adjacency accepted
second-operator launch packet: historical packet only; no longer active direction
product-ready brain: not complete
```

## Active Task

### IMR-00 Internal Multi-Repo Operator Loop

Status: active.

Goal: build the shared KRN brain kernel as the foundation for future
agentic/harness work and prove it through internal multi-repo use.

Hard boundary: do not build dashboard, API, MCP, worker daemon, crawler, broad
eval platform, DB schema, or product server. Do not create synthetic proof. Use
real repo work, real evidence, and compact reports.

Latest completed report:

```txt
docs/reviews/controlled-dogfood/2026-07-01-imr-28-ama-source-search-review/REPORT.md
```

Next slice:

```txt
mise-en-palace-urp: run bounded AMA external source-decision readback.
```

Point: build one shared memory system that condenses patterns, research, local evidence, and senior standards into reusable decisions that improve future work.

## Recent Completed Streams

```txt
V358: graph query-shape diagnostics closure.
V359-V360: Fallow quality gate and bounded legacy cleanup; full Fallow clean.
V361: source-search JSON answer packages expose read-only relationSupport.
V362: second local artifact ingest/readback and source chunk receiver fix.
V363: candidate-only brain heartbeat preview primitive.
V364: heartbeat preview CLI/readback.
V365: heartbeat preview review/eval closure.
V366: heartbeat preview golden behavior proof.
V367: consensus eval/candidate lane completion audit.
V368: brain search product surface preview.
V369: end-to-end product loop replay.
V370: graph brain v1 readback.
V371: ingest v0/v1 bounded input loop readback.
V372: heartbeat/dreaming manual candidate runtime-loop readback.
V373: heartbeat runtime candidate review-result loop.
V374: source relation candidate evidence repair.
V375: Codex hook guardrail pattern intake.
V376: mini Brain-QA benchmark/readback over six current local questions.
V377: retained graph relation and heartbeat runtime patterns; ingest deferred.
V378: prepared current second-operator launch packet without claiming V02-01.
IMR-01: brain search now exposes selected brain knowledge packets for agent use.
IMR-02: brain search store-only mode proves store-backed pattern readback.
IMR-03: preferred brain knowledge vocabulary replaces knowledge-card language in active surfaces.
IMR-04: store-only brain search derives selectedKnowledge from governed source/search evidence.
IMR-05: store-backed pattern packets gated Autonomous Memory Agents paper intake; retained as lab-test source, not product truth.
IMR-06: heartbeat preview can turn explicit missing-evidence readback into candidate-only acquisition work.
IMR-07: heartbeat preview can read source/brain search JSON missingEvidence and route it into acquisition candidates.
IMR-08: live DB-backed source/brain missingEvidence dogfood proved the acquisition bridge and queued focused heartbeat lane readback.
IMR-09: heartbeat preview can focus by candidate kind and isolate knowledge-acquisition readback.
IMR-10: focused acquisition candidate follow-up proved the gap is actionable but
  too terse; next repair carries query diagnostics into acquisition output.
IMR-11: acquisition candidates now carry query diagnostics and recommended
  follow-up without changing mutation, ranking, schema, crawler, worker, API/MCP,
  or Memory Core authority.
IMR-12: diagnostic-bearing acquisition follow-up showed path queries can retrieve
  documents, while claim-text queries miss artifact-linked documents; next repair
  is source claim/document linkage readback.
IMR-13: source-search answer packages now expose sourceClaimDocumentLinks for
  supporting SourceClaims; the live IMR-12 query shows 5 claims, 0 included docs,
  and 5 artifact-linked SearchDocument refs.
IMR-14: brain-search source summaries now expose sourceClaimDocumentLinks and
  linkedSearchDocuments from source-search JSON.
IMR-15: heartbeat acquisition candidates preserve brain-search linkedDocumentEvidence.
IMR-16-17: linked-document candidate review was deferred, then wording now
  directs linked evidence review before new acquisition.
IMR-18-28: acquisition escalation retained, tested, applied to AMA-shaped acquisition, and linked-doc/source-search evidence reviewed.
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
