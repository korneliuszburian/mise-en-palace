# MM-00 Decisions

## Accepted Decisions

D1. Observational Memory is not Memory Core.

D2. Observations are event-derived, source-ranged, temporal records. They are
derived from run events, source chunks, tool traces, diffs, evidence bundles,
review assessments, feedback deltas, and explicit operator corrections.

D3. Factual observations require source ranges. Preference or local operator
note observations may omit source ranges only when explicitly marked as such and
scoped to user/project.

D4. Observations are not approved memory. They can inform activation and
candidate generation, but they do not equal `MemoryRecord`.

D5. Reflections create candidates, not final truth. Reflection may propose
`MemoryCandidate`, `SourceClaim`, `AntiMemoryCandidate`, `PolicyCandidate`, and
`EvalCandidate`; it must not mutate Memory Core directly.

D6. Raw evidence remains canonical for exact claims. Any exact factual answer
must be able to recall source ranges instead of relying on a summary.

D7. Anti-memory is first-class. The system must model stale, unsafe,
contradicted, or overconfident inferences as governed negative knowledge.

D8. Source-to-decision ledger is mandatory before adopting a research mechanism.
Research enters KRN through mechanism, implication, decision/rejection,
consumer, does-not-prove, falsifier, and next slice.

D9. Observer and Reflector are later workers, not autonomous hidden agents now.
MM-00 creates no worker runtime.

D10. Stable observation prefix is an activation primitive, not a context dump.
It must be bounded, explainable, source-aware, and conflict-aware.

D11. No chain-of-thought storage. Store externalized evidence, decisions,
observations, confidence, uncertainty, and gaps; do not store private reasoning
traces.

D12. No markdown runtime memory. Markdown can be source, audit, export, seed, or
handoff; it is not Memory Core.

D13. No source crawler in MM-00.

D14. No observer worker in MM-00.

D15. No reflector worker in MM-00.

D16. No new DB tables in MM-00. Schema work starts only in later slices after
the ADR, ledger, decisions, rejections, falsifiers, and roadmap exist.

D17. No dashboard, API, MCP server, plugin, or broad eval suite in MM-00.

D18. Postgres + pgvector remains the canonical brain store. No separate
first-spine vector or graph database is introduced for observational memory.

D19. PolicyCandidate is a planned candidate family, not an implemented MM-00
type or table. It remains a roadmap concept until a later slice defines its
contract and review gate.

D20. Local raw research materials are quarry. MM-00 extracts mechanisms into
the ledger; the raw files are not treated as canonical truth or runtime memory.

D21. `docs/plans/memory-ideal-state/PLAN.md` is the canonical Memory Brain
ExecPlan. Root `PLAN.md` remains the repo-wide KRN ExecPlan.

D22. Research Foundry, Pattern Vault, meta-researcher runtime, autoresearch
product behavior, research DB/CLI, and pattern inspect/promote CLI are rejected
as Memory Brain product architecture.

D23. Cookbook, course, and local research materials may provide process,
evaluation, or source-to-decision evidence only. They do not create product
subsystems.

D24. Golden memory behavior tests are allowed inside the normal eval lane. They
must protect real memory/context/source/evidence/audit behavior and must not
become benchmark theater.

D25. Pre-plan work in `acca6d2` created pure observation contracts. The
controlled plan does not automatically mark MM-08 complete; MM-08 must audit and
reconcile those contracts when reached.

## Implementation Consequence

Every MM-01..MM-97 implementation slice must point back to the decision it
implements and the falsifier it must not violate.
