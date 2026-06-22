# MM-00 Falsifiers

These falsifiers convert the MM-00 memory direction into testable constraints.

| ID | Claim | Falsifier | Blocks |
|---|---|---|---|
| F1 | Observations are source-ranged. | A factual observation can be stored without an explicit source range and without being marked as preference/operator note. | MM-03, MM-04, MM-08 |
| F2 | Observations are not Memory Core. | Activation or response code treats an observation as approved `MemoryRecord` without review state. | MM-15, MM-16 |
| F3 | Reflection creates candidates only. | Reflection creates or mutates `MemoryRecord`, `AntiMemoryRecord`, source decisions, or policy directly. | MM-09 through MM-14 |
| F4 | Raw evidence remains canonical. | A user-facing exact claim can only be traced to summary text and cannot recall original run/source/diff/review evidence. | MM-05, MM-17 |
| F5 | Anti-memory is first-class. | Stale or contradicted inference can only be represented as prose or exclusion metadata, not as a governed candidate/record path. | MM-13 |
| F6 | Stable prefix is bounded activation, not a dump. | Observation prefix grows without budget, trust, recency, exclusion, and conflict controls. | MM-15, MM-16 |
| F7 | No chain-of-thought storage. | Observation, reflection, evidence, or feedback persistence stores private reasoning traces instead of externalized evidence and decisions. | MM-07, MM-11, MM-23 |
| F8 | No runtime markdown memory. | Runtime context assembly reads markdown memory as canonical Memory Core instead of using the brain store. | MM-16 |
| F9 | Source-to-decision is mandatory. | A later MM slice adopts a research pattern without mechanism, KRN implication, decision/rejection, consumer, does-not-prove, and falsifier. | All MM slices |
| F10 | No source crawler in MM-00. | MM-00 adds crawler code, crawler package, crawler config, or automated source ingestion. | MM-00 |
| F11 | No observer/reflector runtime in MM-00. | MM-00 adds worker job types, CLI commands, services, daemons, repositories, or tables for observe/reflect runtime. | MM-00 |
| F12 | No dashboard/API/MCP/server/plugin/broad eval in MM-00. | MM-00 creates or changes product/integration surfaces outside decision docs. | MM-00 |
| F13 | Same brain store. | Observational memory requires Redis, Kafka, Neo4j, Qdrant, Elastic, OpenSearch, LanceDB, or another first-spine datastore. | MM-03 |
| F14 | LongMemEval is benchmark class, not proof. | KRN treats external LongMemEval numbers as evidence that KRN memory works without dogfood/golden-task proof. | MM-22 |
| F15 | Gaps are durable. | Known gaps and abstentions remain transient prose and cannot produce observation/eval candidates. | MM-18, MM-22 |
| F16 | Candidate promotion is reviewed. | Candidate promotion skips review state, lineage, validity, or explicit acceptance. | MM-12 through MM-14 |
