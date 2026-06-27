# KRN Security And Trust Boundaries

Status: E-00 threat model.

Purpose: identify KRN trust boundaries that must remain explicit before policy
hooks, worker runtime, integrations, dashboard/API, or target-repo alpha. This
document is a review artifact, not a new security subsystem.

## Scope

Reviewed current boundaries:

- CLI arguments and command routing;
- file IO used by target repo init/connect;
- evidence capture and command provenance;
- observation redaction/truncation;
- source claim ingestion and source-to-decision records;
- memory and anti-memory candidate review gates;
- reflection candidate writing;
- Codex adapter brief rendering;
- DB runtime/readiness and persisted state;
- worker/API/MCP/dashboard absence.

Not reviewed in this slice:

- production hosting;
- CI secrets;
- browser/dashboard security;
- MCP server security;
- worker daemon execution;
- external source crawler ingestion;
- multi-user authorization.

## Current Trust Boundary Map

| Boundary | Current mechanism | Existing control | Residual risk | Next action |
| --- | --- | --- | --- | --- |
| CLI args | `parseArgs.ts` routes command families; command parsers collect strings; schema parsers validate durable domain inputs. | Zod schemas in `@krn/schema`; preview vs `--persist` is visible. | Parser output can still carry hostile text into source/memory/evidence records when the operator persists it. | Keep CLI as explicit operator boundary; add policy-gate review before broader external inputs. |
| File IO | `cliFileBoundary.ts` reads JSON as `unknown`, validates object shape, and target init reads known source seed paths. | Unknown-first `JSON.parse`; no target repo writes in dry-run; source seed output is visible. | Arbitrary operator-provided repo paths are trusted as operator intent; no sandbox claim. | Preserve dry-run/no-write output and do not add automatic file writes without explicit task scope. |
| Command evidence | `krn evidence capture` records supplied outcomes; it does not execute verification commands. It only runs `git status --short` through `execFile` for changed-file detection. | Command provenance and `doesNotProve`; no hidden shell runner; weak default rows remain weak. | Operator-reported command proof can be false or stale; `git status` read boundary is implicit in source. | Keep command provenance visible; if more commands are executed later, require an allowlist and output refs. |
| DB runtime | Persisted commands require `KRN_DATABASE_URL`; readiness redacts credentials and labels current-shell truth. | `runDbReadinessCommand` redacts endpoint credentials; DB truth is only claimed after runtime commands. | Local DB is a trust root; backup, restore, auth, and environment policy are not production-ready. | Defer to G-01 migration/backup policy and G-00 CI verification. |
| Observation | `buildObserverInput` sanitizes secret-shaped keys/values before truncation. | Redaction tests cover tokens, bearer values, private keys, and delayed secret suffixes. | Redaction patterns are heuristic; unknown secret formats can still leak into persisted observations. | Add redaction corpus expansion when target-repo alpha introduces new secret patterns. |
| Source claims | `SourceClaimInputSchema` requires mechanism, KRN implication, `doesNotProve`, consumer, falsifier, and proposed status. | Source-to-decision discipline prevents decorative sources. | Hostile source text may still be selected into context or Codex brief if accepted by operator workflow. | Add untrusted-context/taint warning in Codex brief or policy gate before external repo alpha. |
| Memory promotion | `MemoryReviewGate` requires review, source lineage/application guidance, candidate evidence provenance, evidence refs, and rejects `default_template`. | Promotion is explicit; observe/reflect do not mutate Memory Core. | Human reviewer can still promote poisoned or stale content if provenance is weak but non-default. | Add promotion checklist/policy gate for untrusted source lineage before broader target use. |
| Reflection candidates | Reflection writer keeps candidate metadata and reviewability; policy candidates remain unsupported; eval candidates remain proposal-only. | Candidate-only contract; no automatic Memory Core mutation. | Candidate writer can create source claims if repository and artifact are supplied, so source claim review remains important. | Keep source claims proposed and require source decision review before use as authority. |
| Codex adapter | Brief renderer includes context inclusions, untrusted-context warnings, exclusions, source claims used, memory records used, tool boundaries, evidence contract, hooks, and does-not-prove. | Adapter does not invoke Codex, mutate memory, or create MCP resources. | Warning is trust-tier based and does not prove prompt-injection resistance. | Keep deterministic warning covered by Codex adapter tests; expand only with target evidence. |
| Workers/API/MCP/dashboard | Not built. | Package boundary docs forbid treating absent surfaces as product proof. | Future interfaces could bypass read/propose/write unless designed over typed read models and policy gates. | Keep deferred until E-00/E-01/G gates are satisfied. |

## Source-To-Decision Entries

```yaml
source_id: packages/cli/src/runEvidenceCaptureCommand.ts
title: Evidence capture command boundary
trust_tier: high
mechanism: evidence capture uses execFile only for git status readback and records operator-supplied command outcomes without executing them.
krn_implication: command evidence must stay provenance-bound and must not become a hidden runner.
decision: adopt as current safe boundary.
does_not_prove: operator-reported commands actually ran or future command execution is safe.
consumer: evidence CLI, E-01 policy gates.
falsifier: evidence capture starts executing arbitrary operator commands or renders default evidence as passed proof.
```

```yaml
source_id: packages/harness/src/observations/observerInput.ts
title: Observation redaction boundary
trust_tier: high
mechanism: observer input sanitizes secret-shaped keys and values before payload truncation.
krn_implication: observation can persist run evidence with reduced leakage risk, but redaction remains heuristic.
decision: adopt with corpus-expansion follow-up for target repo alpha.
does_not_prove: all secret formats are covered.
consumer: observe CLI, E-00 repair queue.
falsifier: a target repo run persists an unredacted secret-shaped value in observation payloads.
```

```yaml
source_id: packages/harness/src/memory/memoryReviewGate.ts
title: Memory promotion boundary
trust_tier: high
mechanism: promotion requires review, source lineage, application guidance, evidence provenance, evidence refs, and rejects weak default-template evidence.
krn_implication: Memory Core writes are gated and do not come directly from observation/reflection output.
decision: adopt as the current Memory Core write boundary.
does_not_prove: reviewer judgment is correct or source lineage is non-poisoned.
consumer: memory governance, policy gates.
falsifier: a MemoryRecord is created from missing evidence, missing source lineage, or default-template proof.
```

```yaml
source_id: packages/codex-adapter/src/renderExecutionBrief.ts
title: Codex brief rendering boundary
trust_tier: high
mechanism: the adapter renders selected context, exclusions, tool boundaries, evidence expectations, hooks, and does-not-prove without invoking Codex.
krn_implication: Codex execution remains external, but untrusted selected context still enters the brief as text.
decision: adopt current adapter boundary with deterministic untrusted-context warning before broader target-repo alpha.
does_not_prove: prompt-injection resistance or safe execution by Codex.
consumer: E-01 policy gate design, Codex adapter.
falsifier: Codex brief renders untrusted external text without warning labels once target-repo alpha starts.
```

## Threats And Required Follow-Up

| ID | Threat | Current severity | Existing evidence | Required action |
| --- | --- | --- | --- | --- |
| E00-T1 | Untrusted source or memory text influences Codex through selected context. | reduced after V69 | Source claims and memory have trust/evidence metadata; Codex brief now renders deterministic untrusted-context warnings for non-trusted tiers. | Keep warning covered by adapter tests; do not claim prompt-injection resistance. |
| E00-T2 | Secrets leak into persisted observation/evidence payloads. | medium | Observation redaction exists and is tested; evidence metadata can still carry operator text. | Add target-repo redaction corpus tests when first external repo trial starts. |
| E00-T3 | Operator-reported command evidence is overtrusted. | medium | Evidence commands carry provenance and `doesNotProve`; readback shows proof/non-proof. | Keep review burden readback; do not add hidden execution without allowlist/output refs. |
| E00-T4 | Memory promotion accepts poisoned or weakly sourced candidates. | medium | Review gate rejects missing evidence/source lineage and default template proof. | Add promotion checklist for untrusted source lineage before external target-repo use. |
| E00-T5 | Future worker/API/MCP/dashboard bypasses read/propose/write boundaries. | high if built prematurely | Package boundaries and PLAN defer these surfaces. | Keep deferred until read-only boundary proof and policy gates exist. |

## Security Posture Verdict

No critical source fix is required in E-00. Current KRN is acceptable for
continued DB-backed dogfood with operator oversight.

KRN is not ready for public product use or external target-repo alpha until
secret redaction is validated against target repo evidence and untrusted-context
warning behavior is exercised in target-like runs.

## Bounded Repair Queue

### SEC-01: Untrusted Context Warning In Codex Brief

Status: implemented in V69.

Why:
- Codex brief currently renders selected source/memory context with trust data,
  but needs an explicit warning when the context is external or untrusted.

Files likely touched:
- `packages/codex-adapter/src/renderExecutionBrief.ts`;
- `packages/codex-adapter/src/contracts.ts`;
- related adapter tests.

Non-goals:
- no prompt-injection scanner;
- no semantic classifier;
- no Codex invocation.

Verification:
- codex adapter tests;
- golden behavior proof if the brief contract changes.

Outcome:
- `ExecutionBrief` now carries `untrustedContextWarnings`.
- Rendered briefs include an `Untrusted Context Warnings` section.
- Warning is deterministic from selected-context trust tier and does not inspect
  source text.

### SEC-02: Observation/Evidence Redaction Corpus For Target Repo Alpha

Why:
- Observation redaction exists, but target repos may introduce new secret
  shapes in command output, package scripts, env files, or logs.

Files likely touched:
- `packages/harness/src/observations/observerInput.test.ts`;
- maybe evidence capture tests if evidence payload redaction becomes explicit.

Non-goals:
- no DLP product;
- no broad scanner.

Verification:
- targeted observation/evidence tests;
- target-repo dogfood report.

### SEC-03: Memory Promotion Untrusted-Source Checklist

Why:
- Review gate enforces evidence and lineage, but does not classify poisoning
  risk for external source lineage.

Files likely touched:
- memory review CLI output or policy docs;
- memory gate tests only if behavior changes.

Non-goals:
- no auto-rejection by LLM;
- no source crawler.

Verification:
- memory review gate/CLI tests;
- no Memory Core mutation without reviewed evidence.

### SEC-04: Future Command Execution Allowlist

Why:
- Evidence capture currently does not run verification commands. If that ever
  changes, it needs an explicit allowlist, output refs, capturedAt, exitCode,
  and does-not-prove.

Files likely touched:
- none now.

Non-goals:
- no hidden shell runner.

Verification:
- future ADR/test before any command-runner behavior is added.
