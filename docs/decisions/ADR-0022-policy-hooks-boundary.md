# ADR-0022: Policy Hooks Are Deterministic Guardrails

Status: accepted.

Date: 2026-06-25

## Context

E-00 identified the next trust-boundary risk: KRN Codex briefs can carry
selected source or memory text into Codex execution context, and that text may
come from external or lower-trust sources. The immediate need is a visible
policy/hook expectation, not a prompt-injection classifier or semantic hook
engine.

Official Codex hook guidance says hooks are command lifecycle extensions.
Supported command hooks are reviewed/trusted before running, multiple matching
hooks can run concurrently, and only command handlers run today. Codex security
guidance also distinguishes sandbox/approval policy from semantic correctness.

## Decision

KRN treats hooks as deterministic lifecycle guardrails.

KRN may project hook expectations into Codex-facing briefs for:

- session/run pointer injection;
- pre-tool warning or denial for destructive paths, generated files,
  destructive/write actions, untrusted selected context, and tool-boundary
  drift;
- post-tool command evidence recording;
- pre-compact handoff requirement;
- stop-time evidence capture suggestion.

KRN must not use hooks as:

- Memory Brain;
- semantic prompt-injection classifier;
- autonomous reviewer;
- hidden source/memory promotion path;
- worker runtime;
- Codex invocation path.

## Source-To-Decision Entries

```yaml
source_id: openai-codex-manual:/codex/hooks.md
title: Codex Hooks
trust_tier: official
mechanism: hooks are lifecycle command handlers loaded from config/plugin layers; non-managed command hooks require trust review; multiple matching hooks can run concurrently; only command handlers run today.
krn_implication: KRN hook integration must be deterministic, visible, and projection-first. It cannot rely on one hook preventing all other hooks or on prompt/agent hook handlers as current runtime behavior.
decision: adopt hooks as guardrail projections, not semantic authority.
does_not_prove: KRN hook scripts exist, execute, or enforce semantic source truth.
consumer: codex-adapter hook expectation projection and E-01 implementation.
falsifier: KRN adds hidden hook scripts, semantic hook classification, or Memory Core mutation through a hook path.
```

```yaml
source_id: openai-codex-manual:/codex/agent-approvals-security.md
title: Agent approvals and security
trust_tier: official
mechanism: sandbox mode defines technical permissions and approval policy defines when Codex must ask before actions; prompt injection risk remains when enabling network or untrusted content.
krn_implication: KRN policy gates should map to visible approval/tool boundaries and should not claim to prove product security.
decision: use PreToolUse/PostToolUse/Stop expectations for warning, evidence, and review boundaries.
does_not_prove: security of target repos, prompt-injection resistance, or production deployment posture.
consumer: policy gate design and future hook configuration.
falsifier: KRN treats hook output or green approvals as product security proof.
```

```yaml
source_id: docs/architecture/security-trust-boundaries.md
title: E-00 Security And Trust Boundaries
trust_tier: project-decision
mechanism: selected source/memory context can be useful but may contain hostile external text, while current Codex brief renders trust data without an explicit untrusted-context warning.
krn_implication: the first hook/policy slice should add a deterministic untrusted-context warning expectation in Codex-facing output.
decision: implement untrusted selected context as a PreToolUse hook expectation projection.
does_not_prove: actual hook enforcement or prompt-injection defense.
consumer: codex-adapter output and E-01 report.
falsifier: Codex briefs no longer surface untrusted-context policy expectation before tool use.
```

## Accepted Implementation

E-01 updates the existing Codex adapter hook expectation projection. It adds
`untrusted selected context` to the required `PreToolUse` warning/deny
expectation and records that hooks are lifecycle guardrails, not the semantic
brain.

This does not create hook scripts, `.codex/hooks.json`, MCP resources, worker
runtime, dashboard/API, Memory Core writes, or source/memory promotion.

## Deferred

- Actual repo-local hook scripts.
- Managed hook packaging.
- PermissionRequest projection.
- Hook trust-review UX.
- Prompt-injection corpus tests.
- External target-repo policy gates.

These require a later concrete operator flow and current-state proof.

## Consequences

- Codex briefs now carry a visible hook-policy expectation for untrusted
  selected context.
- KRN still cannot claim hook enforcement exists.
- E-01 remains a bounded adapter/source slice, not a security subsystem.
