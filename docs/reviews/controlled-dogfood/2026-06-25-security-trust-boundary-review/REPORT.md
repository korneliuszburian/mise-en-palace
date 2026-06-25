# Security And Trust Boundary Review Report

Status: E-00 completion report.

Date: 2026-06-25

## Executive Verdict

E-00 found no critical source fix required before the next bounded roadmap
slice. Current KRN is acceptable for continued DB-backed dogfood with operator
oversight. It is not ready for public product use or external target-repo alpha
until untrusted context is surfaced in Codex-facing output and target-repo
secret redaction is validated with real evidence.

## Scope

Changed:

- `docs/architecture/security-trust-boundaries.md`;
- `docs/reviews/controlled-dogfood/2026-06-25-security-trust-boundary-review/REPORT.md`;
- `PLAN.md`;
- `GOAL.md`.

Not changed:

- package source;
- DB schema;
- CLI behavior;
- memory/source/eval promotion behavior;
- dashboard/API/MCP/worker runtime.

## KRN Plan Output

```txt
executionRun: 4945aaa6-a96a-4894-83f5-884413c85030
taskContract: 6799e293-04a3-446f-b812-b4c58b405151
harnessPlan: bb85bbdf-864d-4211-a68c-0b6425368731
contextAssembly: 9eaea0d0-e9f6-43db-bffd-7a1468a4c598
```

Activation selected useful governance context: weak evidence must not be
overtrusted, source-to-decision records need mechanism/falsifier, target init
must expose no-write/source-seed boundaries, and AGENTS.md should stay small.
It did not select every owner file, so source inspection still supplied the
actual boundary review.

## Boundary Findings

| Boundary | Verdict | Evidence | Next implication |
| --- | --- | --- | --- |
| CLI args/schema | good | Command parsers feed Zod schema/domain parsers for durable inputs. | Keep unknown-first and explicit `--persist`. |
| File IO | good with operator trust | `cliFileBoundary.ts` uses unknown-first `JSON.parse`; init/connect reads known seed paths. | Do not add automatic target writes without scoped task. |
| Command evidence | good | Evidence capture records supplied outcomes and only runs `git status --short` via `execFile`. | Future command execution needs allowlist/output refs. |
| DB runtime | mixed | `KRN_DATABASE_URL` is required; readiness redacts credentials. | Production backup/auth policy remains G-01. |
| Observation redaction | good but heuristic | `observerInput.ts` redacts secret-shaped keys/values before truncation. | Add target-repo corpus once external alpha starts. |
| Source claims | good but injection-sensitive | Source claims require mechanism, implication, does-not-prove, consumer, falsifier, proposed status. | Add untrusted-context warning before broader target use. |
| Memory promotion | good | MemoryReviewGate rejects missing lineage/evidence and default-template proof. | Add untrusted-source checklist before external target use. |
| Reflection candidates | good | Candidate-only contract and reviewability metadata exist; no Memory Core mutation. | Keep source claim review explicit. |
| Codex adapter | mixed | Adapter renders boundaries and does-not-prove but not explicit untrusted-context warning. | E-01 should handle deterministic policy/hook warning. |
| Future interfaces | deferred | Worker/API/MCP/dashboard are not built. | Do not build until read/propose/write gates exist. |

## Bounded Repair Queue

| Repair | Priority | Why | Target |
| --- | --- | --- | --- |
| SEC-01: Untrusted context warning in Codex brief | P0 before external target alpha | Selected source/memory can contain hostile text even with trust metadata. | E-01 policy/hook boundary design. |
| SEC-02: Target-repo redaction corpus | P1 before external target alpha | Observation redaction is heuristic and needs real target evidence. | First target repo trial. |
| SEC-03: Memory promotion untrusted-source checklist | P1 | Promotion gate verifies evidence shape, not full poisoning risk. | Memory review UX/policy. |
| SEC-04: Future command execution allowlist | P2 until command runner exists | Evidence capture currently avoids hidden execution; preserve that boundary. | Future command-runner ADR only. |

## Command Evidence

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `pnpm db:ready` | passed before E-00 | Current shell can reach local KRN DB. | Does not prove production DB posture. |
| `krn plan --task security trust boundary review --persist` | passed | E-00 has a persisted planning run and selected context. | Does not prove security findings are correct. |
| `pnpm typecheck` | passed | TypeScript workspace still typechecks after docs/plan updates. | Does not prove security findings are complete. |
| `pnpm test` | passed | Existing workspace tests still pass after docs/plan updates. | Does not prove public product security. |
| `git diff --check` | passed | Docs diff has no whitespace errors. | Does not prove runtime security. |
| `krn evidence capture --persist` | passed | E-00 evidence, review assessment, feedback delta, changed-file classification, and command proof were persisted. | Does not prove source/security correctness. |
| `krn observe --persist` | passed | E-00 observation staging was persisted without Memory Core mutation. | Does not prove final memory truth. |
| `krn reflect --persist` | passed | E-00 reflection record was persisted without candidate row writes or Memory Core mutation. | Does not prove useful extraction at scale. |

## Persistence Evidence

```txt
executionRun: 4945aaa6-a96a-4894-83f5-884413c85030
taskContract: 6799e293-04a3-446f-b812-b4c58b405151
harnessPlan: bb85bbdf-864d-4211-a68c-0b6425368731
contextAssembly: 9eaea0d0-e9f6-43db-bffd-7a1468a4c598
evidenceBundle: d129c92c-4a66-4cdc-bcb6-d8401af4cc1e
reviewAssessment: 4a84295a-b954-4286-ae85-1eab7a04a4d4
feedbackDelta: cad320de-e6a2-4406-9efc-d935ee2b31e5
observationGroup: c2341832-44bd-4384-b33d-3cae2926c9a8
reflectionRecord: dfa21695-4706-4fb3-bde3-cbf3ab0b0459
Memory mutation: none
MemoryRecord created: no
```

## Dogfood Brain Usefulness Section

### Brain Usefulness Summary

Brain ROI:
- positive

Overall verdict:
- DB-backed planning selected useful governance guardrails for security review,
  but source inspection still carried the owner-file boundary work.

What this run proves:
- KRN can guide a bounded security/trust review without creating a security
  subsystem.
- The review produced concrete repair candidates with source-to-decision shape.

What this run does not prove:
- public product security;
- target-repo alpha safety;
- prompt-injection resistance;
- production secret handling;
- policy hook implementation.

DB used in current shell:
- yes for persisted KRN plan, evidence, observe, and reflect.

### Activated Context Usefulness

| Item | Type | Used? | Helped? | Notes |
| --- | --- | --- | --- | --- |
| Weak evidence source claim | source claim | yes | helped | Kept command proof from becoming security proof. |
| Target init/connect source claim | source claim/memory | yes | helped | Anchored no-write/source-seed trust boundary. |
| AGENTS.md source claim | source claim | yes | helped | Kept durable guidance small and scoped. |
| Source graph health claim | source claim | yes | neutral | Relevant to source trust but not the main security owner. |
| Owner files | source inspection | yes | helped | Found actual CLI/schema/harness/adapter boundaries. |

### Evidence And Review Burden

| Evidence item | Strength | What it proves | Review burden impact |
| --- | --- | --- | --- |
| Threat model doc | medium | Boundaries and repair queue are explicit. | reduced |
| Source inspection | medium | Findings map to current files. | reduced |
| No package source changed | strong | E-00 stayed review-only. | reduced |

### Candidate Quality

No memory/source/eval candidate was promoted. Repair candidates remain bounded
implementation follow-ups.

## Product Readiness Signal

Verdict:

```txt
safety posture is clearer, not product-ready.
```

## Next Recommended Action

Continue to:

```txt
E-01 — Policy Gates And Hook Boundary Design
```

E-01 should start with SEC-01: deterministic untrusted-context warning in the
Codex brief/policy-gate boundary. Do not build hooks as semantic brain.
