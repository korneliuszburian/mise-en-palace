# V04 Controlled Scenario Batch Plan

Status: active V04-05 scenario batch plan.
Date: 2026-06-27.

This batch uses the V04 controlled scenario contract from
`docs/architecture/controlled-scenario-factory.md`.

## Scenario Queue

| Scenario | Mode | Product question | Status | Condensation target |
|---|---|---|---|---|
| V04-SC-001 DB Smoke Fresh DB Idempotency | db-backed-replay | Does generic `pnpm db:smoke` still fail after fresh DB recovery with enum re-create errors? | executed | none; repair rejected |
| V04-SC-002 Target Repo Skill Boundary Guard | source-repair | Can the high-risk target write-boundary finding condense into a repo skill plus deterministic guard? | executed as replay | skill + guard |
| V04-SC-003 WILQ SEO Observation-Only Boundary | observation-only | Does `$target-repo-testing` correctly keep a living dirty target repo as observation-only evidence? | executed | no new surface; keep skill/runbook |
| V04-SC-004 Evidence Review Loop Skill Fit | observation-only | Is the existing `$evidence-review-loop` skill sufficient for V04 evidence/report condensation without another workflow surface? | executed | no new skill now |
| V04-SC-005 Target-Aware Evidence Capture Candidate | source-repair | Should KRN evidence capture classify target changed files separately from KRN changed files? | planned | bounded source repair candidate |
| V04-SC-006 Hook/MCP/Subagent Candidate Screening | observation-only | Do current V04 findings justify hooks, MCP, or subagents now? | planned | rejection/defer decision |

## Coverage

Required V04-05 coverage:

| Coverage | Scenario |
|---|---|
| KRN-on-KRN repair | V04-SC-002 |
| DB-backed replay/readiness/smoke | V04-SC-001 |
| Headless target observation | V04-SC-003 |
| Skill/evidence-review loop | V04-SC-004 |

## Stop Rules

- Do not write to `wilq-seo` unless a later scenario explicitly authorizes a
  headless repair.
- Do not rename any scenario into V02-01.
- Do not build hooks, MCP, subagents, dashboards, or broad evals from this
  batch unless a scenario produces repeated/high-risk evidence and the
  condensation gate accepts the smallest durable surface.
- If a planned repair lacks a current owner file or verification path, record it
  as a candidate instead of implementing speculative code.

