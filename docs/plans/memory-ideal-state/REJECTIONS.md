# MM-00 Rejections And Kill List

This file records paths that MM-00 rejects before implementation begins.

## Rejected Paths

R1. Observational Memory as Memory Core.

Reason: observations are staging records. Approved memory remains governed
Memory Core with lineage, review state, validity, and application guidance.

R2. Reflection auto-promotion.

Reason: reflection can propose candidates, but it cannot mutate `MemoryRecord`,
`AntiMemoryRecord`, source decisions, or policy directly.

R3. Chain-of-thought storage.

Reason: KRN stores external evidence, decisions, confidence, uncertainty, and
review signals; it does not store private reasoning traces.

R4. Runtime markdown memory.

Reason: markdown is source/export/audit/seed/handoff. It is not runtime memory
or canonical belief state.

R5. Raw research as default context.

Reason: `docs/materials/**` is quarry. Research must pass through
source-to-decision before it influences architecture.

R6. Source hoarding.

Reason: a source without mechanism, KRN implication, decision or rejection,
consumer, does-not-prove, and falsifier is decorative.

R7. Mastra clone.

Reason: Mastra supplies mechanisms worth studying. Its benchmark results and
text-log design do not prove KRN should copy its architecture.

R8. Text-only observation truth.

Reason: KRN requires source ranges, temporal fields, review status, and
relational filters for activation and audit.

R9. New DB tables in MM-00.

Reason: MM-00 is ADR, ledger, decisions, rejections, falsifiers, and roadmap
only.

R10. Observer worker in MM-00.

Reason: worker runtime must follow domain contracts, fixtures, manual CLI, and
review gates.

R11. Reflector worker in MM-00.

Reason: reflection must first be specified as candidate-producing behavior with
fixtures and promotion gates.

R12. Source crawler in MM-00.

Reason: MM-00 maps known sources to decisions. It does not expand source
collection.

R13. Dashboard/API/MCP/server/plugin work in MM-00.

Reason: the memory spine must be proven before product or integration surfaces
are added.

R14. Broad eval suite in MM-00.

Reason: evals must be derived from dogfood failures and golden memory tasks,
not introduced as benchmark theater.

R15. Separate first-spine vector or graph database.

Reason: ADR-0010 selected Postgres + pgvector as the canonical brain store.

R16. Hidden autonomous agent zoo.

Reason: KRN is one operating brain around Codex. Observer and Reflector are
bounded workers later, not independent product actors now.
