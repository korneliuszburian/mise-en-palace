# Goal: MM-00 — Memory ideal-state ADR and source-to-decision ledger

Context:
M27 is complete.

Verified:
- pnpm typecheck passed
- pnpm test passed: 29 files, 134 tests
- DB-aware krn doctor passed
- pnpm db:ready passed: 8/8 migrations, pgvector available
- all M22-M27 DB smokes passed
- forbidden surface/dependency/core-safety scans passed
- git diff --check passed
- Slice 14 checks for memory plan passed

Current status:
- target repo dry-run/connect/project-scoped plan/Codex brief/evidence capture are proven
- target readiness is ready
- observational memory implementation is not built yet
- memory ideal-state plan exists at docs/plans/memory-ideal-state/GOAL.md
- branch main is ahead by 15 commits
- only untracked raw research materials remain:
  - docs/materials/2026-06-22-big-brain.md
  - docs/materials/2026-06-22-big-brain-part-2.md

Task:
Start MM-00 from docs/plans/memory-ideal-state/GOAL.md.

MM-00 is a planning/decision slice only.
Do not implement observational memory runtime yet.

Create or update:
- docs/decisions/ADR-0011-observational-memory-as-staging-layer.md
- docs/plans/memory-ideal-state/SOURCE_LEDGER.md
- docs/plans/memory-ideal-state/DECISIONS.md
- docs/plans/memory-ideal-state/REJECTIONS.md
- docs/plans/memory-ideal-state/FALSIFIERS.md
- docs/plans/memory-ideal-state/MM-ROADMAP.md
- docs/plans/memory-ideal-state/GOAL.md if needed

Core decision to encode:
Observational Memory is not Memory Core.
It is an event-derived, source-ranged, temporal staging layer that turns
run/source/tool/review history into observations and reflections.
Reflections may produce MemoryCandidate, SourceClaim, AntiMemoryCandidate,
PolicyCandidate and EvalCandidate records, but must not mutate Memory Core directly.

Required source-to-decision ledger entries:
- Mastra Observational Memory research
- Mastra Observational Memory blog
- Adam/Bobbin/Astropolis demo analysis
- KRN State of the Art memory doctrine
- KRN Postgres brain store/final infra decision
- local raw research materials if they exist and are relevant

For each retained source, record:
- mechanism
- KRN implication
- decision / rejection / hypothesis
- consumer
- doesNotProve
- falsifier
- next slice

Decisions that must be explicit:
- observations require source ranges unless explicitly marked as user preference or local operator note
- observations are not approved memory
- reflections create candidates, not final truth
- raw evidence remains canonical for exact claims
- anti-memory is first-class
- no chain-of-thought storage
- no markdown runtime memory
- no source crawler in MM-00
- no observer worker in MM-00
- no reflector worker in MM-00
- no new DB tables in MM-00 unless GOAL.md explicitly requires a docs-only schema sketch
- no dashboard/API/MCP/server/plugin/broad eval suite

Roadmap:
Define MM-01..MM-24 as thin vertical slices, but do not implement them.
The roadmap must distinguish:
- ADR/ledger slices
- schema slices
- repository slices
- activation integration
- observer worker
- reflector worker
- candidate promotion gates
- anti-memory integration
- eval/golden-task slices
- dogfood slices

Verification:
- pnpm typecheck
- pnpm test
- git diff --check
- any existing slice checks for memory plan
- grep or equivalent proves no forbidden runtime surfaces were added:
  - no dashboard
  - no API
  - no MCP server
  - no runtime markdown memory
  - no separate vector/graph DB
  - no broad workers runtime
  - no source crawler
  - no broad eval suite

Stop condition:
MM-00 is complete when the ADR, source-to-decision ledger, decisions,
rejections, falsifiers and MM roadmap exist, and all verification passes.

Commit:
docs(memory): add observational memory ideal-state ADR and ledger
