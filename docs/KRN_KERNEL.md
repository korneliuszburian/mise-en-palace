# KRN Kernel Contract

## Product Thesis

KRN is a Codex Operating Layer / AI Engineering Control Plane.

Codex executes. KRN supplies:

- bounded context;
- service/store-backed memory;
- source grounding;
- policy;
- skills;
- eval expectations;
- traces;
- review gates;
- feedback.

## Kernel Law

Do not build more context. Build the machinery that selects, applies, verifies,
and forgets context.

## Current Bootstrap Boundary

This repo starts as a kernel workspace, not an application. Commit 0/1 encodes
the language, hard stops, source map, pattern gate, repo-local skills, and one
read-only TypeScript critic.

## What KRN Is Not

- prompt pack;
- dashboard-first app;
- benchmark lab;
- alternative executor for Codex;
- IDE agent;
- generic multi-agent framework;
- stack-specific agent zoo;
- markdown memory folder;
- archive of intentions.

## Runtime Truth

- Project memory must be store/service-backed.
- Markdown may be source, export, audit, seed, or backup.
- Raw onboarding material is quarantined in `docs/materials/`.
- Active context must be small, selected, and task-specific.

## Decision Rule

Every retained source or pattern must pass:

```text
source -> mechanism -> KRN implication -> decision/rejection -> falsifier
```

If a next step requires broad historical reread, copying old topology, or
building dashboard/evals before typed primitives and dogfood traces, stop and
re-scope.

