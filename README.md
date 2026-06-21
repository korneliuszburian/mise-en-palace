# KRN Kernel

KRN is a Codex Operating Layer / AI Engineering Control Plane.

Codex executes. KRN supplies bounded context, service/store-backed memory,
source grounding, policy, skills, eval expectations, traces, review gates, and
feedback.

This repository starts as a kernel workspace, not as an application. Its first
job is to encode the language, boundaries, and Codex-native surfaces that keep
future implementation work small, source-grounded, and reviewable.

## Start Here

1. Read `AGENTS.md`.
2. Read `docs/KRN_KERNEL.md`.
3. Use `GOAL.md` as the compact activation contract.
4. Use `PLAN.md` as the living execution map for complex implementation work.
5. Treat `docs/materials/` as raw source quarantine, not default context.

## Not Built Yet

- No CLI implementation.
- No dashboard.
- No benchmark lane.
- No runtime memory in markdown.
- No broad subagent system.
- No plugin package.
- No KRN MCP server.

## Current Phase

Final Harness Spine planning is installed. The next slice is brain-store ADR
and package boundaries.

The current foundation includes kernel docs, raw onboarding material
quarantine, source map, ADRs, repo-local skills, one TypeScript critic
subagent, and a strict pnpm TypeScript workspace spine.

The next typed-model direction is governed by
`docs/decisions/ADR-0009-canonical-harness-spine.md`.
