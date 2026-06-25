# Research-To-Brain Minimal Ingestion Report

Status: B-02 completion report.

Date: 2026-06-25

## Executive Verdict

B-02 completed one bounded research-to-brain ingestion without creating a
research-foundry product layer, source crawler, dashboard, API, MCP server, or
new package. One official OpenAI Codex source was mapped through
source-to-decision discipline, persisted as a `SourceClaim`, linked to a KRN
architecture decision, and later selected by DB-backed activation.

## Selected Source

```txt
Source: OpenAI Codex Manual
Section: Custom instructions with AGENTS.md
Local fetched manual: /tmp/openai-docs-cache/codex-manual.md
Relevant lines inspected: 7577-7708
Source URL: https://developers.openai.com/codex/guides/agents-md.md
Trust tier: official
```

## Source To Decision

```yaml
source_id: openai-codex-agents-md-guidance
title: OpenAI Codex AGENTS.md guidance
url: https://developers.openai.com/codex/guides/agents-md.md
trust_tier: official
mechanism: Codex builds an instruction chain from global and project AGENTS
  files before work; closer project files override broader guidance, and the
  chain is bounded by project_doc_max_bytes.
krn_implication: KRN should keep durable repo guidance small and scoped, while
  using PLAN.md, DB state, and run evidence for changing execution state instead
  of bloating AGENTS.md.
decision: adopt as an implementation-boundary SourceClaim for PLAN/GOAL
  discipline and future Codex adapter guidance.
does_not_prove: This source does not prove KRN memory, activation, source graph,
  or product quality.
consumer: B-02 research-to-brain minimal ingestion.
falsifier: A future official Codex manual removes AGENTS.md discovery or changes
  it so project guidance is no longer loaded before work.
```

## Persisted Records

| Record | ID |
|---|---|
| SourceArtifact | `3c2fcae0-da2e-415b-b7a1-18b96d4d2f5f` |
| SourceClaim | `8c7f97ce-8868-4fc2-bda8-4600d2f050f7` |
| SourceDecisionEdge | `179247f4-cacb-463c-b6c4-c28832b800a0` |
| Later activation run | `164e9158-d03b-4957-a3cd-72bee3ce3dd1` |

The source decision edge links the claim to:

```txt
architecture_decision/PLAN.md#operating-rules
```

## Later Activation Proof

After ingestion, a DB-backed `krn plan --persist` for:

```txt
Keep KRN durable AGENTS.md guidance compact while PLAN.md carries active roadmap execution state
```

selected the ingested claim as the first context inclusion:

```txt
source_claim:8c7f97ce-8868-4fc2-bda8-4600d2f050f7
trust=official
expected_use=KRN should keep durable repo guidance small and scoped, while using PLAN.md and run evidence for changing execution state instead of bloating AGENTS.md.
```

This proves the minimal ingestion was not decorative: the source became
activation-visible for a matching task.

## Candidate Outputs

### MemoryCandidate

```yaml
summary: Keep durable Codex guidance small and scoped.
body: AGENTS.md should hold stable repo execution rules. PLAN.md, DB state, run
  ledgers, and reports should carry changing roadmap/progress state.
evidence_refs:
  - SourceClaim 8c7f97ce-8868-4fc2-bda8-4600d2f050f7
  - activation run 164e9158-d03b-4957-a3cd-72bee3ce3dd1
does_not_prove: This does not prove AGENTS.md content is currently optimal.
reviewability: ready
decision: review
```

### EvalCandidate

```yaml
title: Research-ingested SourceClaim activates for matching guidance task.
scenario: After ingesting a Codex AGENTS.md source claim, a PLAN/AGENTS
  guidance task should include that SourceClaim or explicitly exclude it with a
  typed reason.
expected_signal: Ingested source claim appears in context inclusions for a
  matching task.
evidence_refs:
  - SourceClaim 8c7f97ce-8868-4fc2-bda8-4600d2f050f7
  - activation run 164e9158-d03b-4957-a3cd-72bee3ce3dd1
does_not_prove: This does not prove broad research-to-brain quality.
reviewability: ready
decision: defer
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `node /home/krn/.codex/skills/.system/openai-docs/scripts/fetch-codex-manual.mjs` | passed | Codex manual was available locally and current per helper output. | Does not prove all OpenAI docs were reviewed. |
| `krn source claim add ... --persist` without `KRN_DATABASE_URL` | failed as expected | CLI requires explicit DB URL for persistence. | Does not prove ingestion failed when configured. |
| `KRN_DATABASE_URL=... krn source claim add ... --persist` | passed | Official Codex source was persisted as a SourceClaim. | Does not prove the source is generally useful. |
| `KRN_DATABASE_URL=... krn source decision link ... --persist` | passed | SourceClaim was linked to a KRN architecture decision target. | Does not prove Memory Core mutation. |
| `KRN_DATABASE_URL=... krn plan --task ... --persist` | passed | The ingested SourceClaim was later selected by activation for a matching task. | Does not prove target-repo product readiness. |

## What Was Not Built

- no source crawler;
- no research-foundry product layer;
- no dashboard/API/MCP/server;
- no worker runtime;
- no Memory Core mutation;
- no automatic promotion;
- no package source changes.

## Next Recommended Action

Continue to:

```txt
B-03 — Memory Application Feedback And Demotion Loop
```

B-03 should use existing memory application and dogfood evidence. It should
produce reviewable strengthen/demote/anti-memory candidates, not automatic
memory demotion.
