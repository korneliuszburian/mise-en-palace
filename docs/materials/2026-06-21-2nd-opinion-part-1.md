## Architecture verdict

The operator is right. The current slice names are drifting toward **feature artifacts** instead of the harness spine.

`ContextPacket`, `requiredSkills`, `krn context build`, and `krn review capture` are useful, but they are not the architecture. They are projections of a deeper domain flow. KRN’s core promise is not “make a context packet”; it is “compile operator intent into a bounded, source-linked, policy-checked Codex execution run, then fold verified evidence back into memory/source/eval feedback.” That matches the uploaded doctrine: KRN is defined as the operating layer around Codex, supplying bounded context, store-backed memory, source grounding, policy, traces, review gates, and feedback loops, not a prompt pack, dashboard app, benchmark lab, or skill zoo.

So the corrected center is:

```text
OperatorIntent
  -> TaskContract
  -> HarnessPlan
  -> ContextAssembly
  -> ExecutionContract
  -> CodexAdapterPlan
  -> ExecutionRun
  -> EvidenceBundle
  -> ReviewAssessment
  -> FeedbackDelta
  -> MemoryCandidate / SourceDecision / EvalCandidate
```

`ContextPacket` is a materialized working-set artifact inside this chain. It is not the brain.

---

## Direct answers

### 1. Is `ContextPacket` too small/wrong as a central abstraction?

Yes, **too small as the central abstraction**, but not wrong as an artifact.

It cannot represent the full harness lifecycle: operator intent, success criteria, non-goals, policy decisions, execution authority, expected evidence, review burden, diff risk, rollback path, or feedback dispositions. The KRN doctrine already frames context as a supply chain that selects, applies, verifies, and expires context rather than dumping more content.

Keep `ContextPacket`, but demote it to:

```text
ContextAssembly -> ContextPacket -> ExecutionContract
```

A good `ContextPacket` should be a frozen, reviewable input snapshot. It should not own memory lifecycle, source graph lifecycle, skill selection, or CLI workflow identity.

### 2. Should `requiredSkills` exist in core domain objects?

No, not as `requiredSkills: string[]` in core objects.

Core should express **capability requirements** or **engineering disciplines**, not Codex skill IDs. Codex skills are an adapter surface: OpenAI’s docs describe skills as reusable workflow packages that Codex can load progressively; Codex initially sees skill name/description/path and loads full `SKILL.md` only when it uses that skill. That is exactly adapter metadata, not core domain truth. ([OpenAI Developers][1])

Use this split:

```ts
// core
type CapabilityRequirement = {
  id: string;
  kind:
    | "context-selection"
    | "source-grounding"
    | "memory-application"
    | "pre-edit-gate"
    | "review-capture"
    | "type-safety"
    | "policy-control";
  reason: string;
  required: boolean;
};

// codex-adapter
type CodexSkillBinding = {
  capabilityId: string;
  skillName: string;
  invocation: "implicit" | "explicit";
  reason: string;
};
```

`SkillManifest` can exist in the model as a lifecycle object for skills KRN emits or validates. But task contracts and context packets should not depend on Codex skill names.

### 3. Should CLI commands be only adapters over a harness domain?

Yes. CLI commands must never define the architecture.

Correct layering:

```text
packages/core:
  compileOperatorIntent()
  buildHarnessPlan()
  assembleContext()
  createExecutionContract()
  recordEvidence()
  assessReview()
  distillFeedback()

packages/cli:
  krn init
  krn doctor
  krn context build
  krn review capture
```

The uploaded architecture already says `packages/core` owns types, contracts, and pure logic, while `packages/cli` owns command output, shell/git interactions, and command adapters.

So `krn context build` should call `assembleContext()` and render a `ContextPacket`; `krn review capture` should call `recordEvidence() -> assessReview() -> distillFeedback()`. The CLI should be replaceable by Codex MCP, API, app, or test fixture without changing the domain.

### 4. Should Memory Core contracts exist from the first typed model?

Yes. Absolutely.

Even if the implementation is `NullMemoryStore` or `InMemoryMemoryStore`, the contract must exist from day one. Otherwise markdown memory will creep back in through “temporary” files. The doctrine is explicit that runtime memory must be store/service-backed, queryable, temporal, source-linked, confidence-aware, TTL-aware, invalidatable, feedback-aware, and retrievable as small packets; files may be export/audit/seed/source-bank, but not Memory Core.

The first implementation can return `abstain`, but the interface must encode:

```ts
type MemoryRetrievalResult =
  | { status: "selected"; entries: AppliedMemory[] }
  | { status: "abstained"; reason: string };

interface MemoryStore {
  search(query: MemoryQuery): Promise<MemoryRetrievalResult>;
  propose(candidate: MemoryCandidate): Promise<void>;
  recordApplication(event: MemoryApplicationEvent): Promise<void>;
  invalidate(memoryId: string, reason: string): Promise<void>;
}
```

The key is not persistence yet. The key is preventing “read `docs/memory/**`” from becoming architecture.

---

## Minimal final-pattern type model

This is the smallest model I would accept as final-pattern-first. Some fields can be thin, but the objects should exist.

```ts
type Id<T extends string> = string & { readonly __brand: T };

type Confidence = "low" | "medium" | "high";
type Verdict = "accepted" | "needs_changes" | "rejected" | "blocked";
type RiskLevel = "low" | "medium" | "high";

export type OperatorIntent = {
  id: Id<"OperatorIntent">;
  actor: string;
  rawText: string;
  projectHint?: string;
  requestedAt: string;
};

export type TaskContract = {
  id: Id<"TaskContract">;
  intentId: Id<"OperatorIntent">;
  projectId: Id<"Project">;
  objective: string;
  nonGoals: string[];
  successCriteria: string[];
  stopCondition: string;
  allowedChange: "read-only" | "propose-only" | "workspace-write";
  riskBudget: RiskLevel;
  requiredEvidence: EvidenceRequirement[];
};

export type HarnessPlan = {
  id: Id<"HarnessPlan">;
  taskContractId: Id<"TaskContract">;
  contextPlan: ContextPlan;
  policyPlan: PolicyGate[];
  executionPlan: ExecPlan;
  feedbackPlan: FeedbackPlan;
  capabilityRequirements: CapabilityRequirement[];
};

export type ContextAssembly = {
  id: Id<"ContextAssembly">;
  harnessPlanId: Id<"HarnessPlan">;
  selectedSources: AppliedSource[];
  selectedMemory: AppliedMemory[];
  omissions: ContextOmission[];
  budget: ContextBudget;
  selectorTrace: SelectorTrace[];
};

export type ContextPacket = {
  id: Id<"ContextPacket">;
  contextAssemblyId: Id<"ContextAssembly">;
  projectId: Id<"Project">;
  objective: string;
  nonGoals: string[];
  sources: AppliedSource[];
  memory: AppliedMemory[];
  policyWarnings: string[];
  expectedEvidence: EvidenceRequirement[];
  nextAction: string;
  budget: ContextBudget;
};

export type ExecutionContract = {
  id: Id<"ExecutionContract">;
  taskContractId: Id<"TaskContract">;
  contextPacketId: Id<"ContextPacket">;
  allowedTools: ToolPolicy[];
  writeBoundary: "read-only" | "propose-only" | "workspace-write";
  preEditGate: PreEditGate;
  rollbackExpectation: string;
};

export type ExecutionRun = {
  id: Id<"ExecutionRun">;
  executionContractId: Id<"ExecutionContract">;
  executor: "codex";
  startedAt: string;
  completedAt?: string;
  status: "planned" | "running" | "completed" | "failed" | "blocked";
};

export type EvidenceBundle = {
  id: Id<"EvidenceBundle">;
  executionRunId: Id<"ExecutionRun">;
  changedFiles: string[];
  diffSummary: string;
  commandsRun: CommandEvidence[];
  testEvidence: CommandEvidence[];
  typecheckEvidence: CommandEvidence[];
  policyGateResults: PolicyGateResult[];
  transcriptRefs: string[];
};

export type ReviewAssessment = {
  id: Id<"ReviewAssessment">;
  evidenceBundleId: Id<"EvidenceBundle">;
  reviewer: string;
  verdict: Verdict;
  reviewBurden: RiskLevel;
  diffRisk: RiskLevel;
  rollbackPath: string;
  unsupportedDecisions: string[];
  notes: string;
};

export type FeedbackDelta = {
  id: Id<"FeedbackDelta">;
  reviewAssessmentId: Id<"ReviewAssessment">;
  memoryCandidates: MemoryCandidate[];
  sourceDecisions: SourceDecision[];
  evalCandidates: EvalCandidate[];
  rejectedCandidates: RejectedCandidate[];
};
```

Supporting primitives:

```ts
export type AppliedSource = {
  sourceId: Id<"SourceRef">;
  excerpt?: string;
  mechanism: string;
  applicationGuidance: string;
  doesNotProve: string;
};

export type AppliedMemory = {
  memoryId: Id<"MemoryEntry">;
  excerpt: string;
  confidence: Confidence;
  validUntil?: string;
  applicationGuidance: string;
  selectorReason: string;
};

export type MemoryEntry = {
  id: Id<"MemoryEntry">;
  projectId: Id<"Project">;
  type:
    | "decision"
    | "constraint"
    | "failure"
    | "pattern"
    | "preference"
    | "source-summary"
    | "review-lesson"
    | "architecture-boundary";
  content: string;
  sourceLineage: string[];
  owner: string;
  confidence: Confidence;
  validFrom?: string;
  validUntil?: string;
  invalidationRule?: string;
  applicationGuidance: string;
  feedback: {
    appliedCount: number;
    correctedCount: number;
    rejectedCount: number;
    lastOutcome?: "helped" | "hurt" | "neutral" | "stale";
  };
};

export type SourceRef = {
  id: Id<"SourceRef">;
  title: string;
  url?: string;
  type:
    | "official-docs"
    | "spec"
    | "paper"
    | "repo"
    | "practitioner-writing"
    | "competitor-docs"
    | "security-standard"
    | "benchmark";
  trustTier: Confidence;
  mechanism: string;
  krnImplication: string;
  doesNotProve: string;
  use: "now" | "later" | "lab" | "reject";
};

export type SourceDecisionEdge = {
  sourceId: Id<"SourceRef">;
  decisionId: Id<"Decision">;
  supportType:
    | "mechanism"
    | "risk"
    | "rejection"
    | "eval-design"
    | "implementation-boundary";
  confidence: Confidence;
  notes: string;
};
```

The key correction is that `ContextPacket` contains applied source/memory slices, not the whole Memory Core, and no `requiredSkills`. Skill selection belongs to `CapabilityRequirement -> CodexSkillBinding`.

---

## Rejected abstractions

Reject these explicitly:

| Abstraction                                           |                          Verdict | Why                                                                                                   |
| ----------------------------------------------------- | -------------------------------: | ----------------------------------------------------------------------------------------------------- |
| `ContextPacket` as central domain                     | Reject centrality, keep artifact | It is a working-set snapshot, not the harness run.                                                    |
| `requiredSkills` in `TaskContract` or `ContextPacket` |                           Reject | Codex skill IDs are adapter metadata, not domain truth.                                               |
| CLI command names as architecture                     |                           Reject | CLI is only an adapter over core use cases.                                                           |
| Markdown runtime memory                               |                           Reject | Files can be audit/export/seed, not Memory Core.                                                      |
| Goal as product brain                                 |                           Reject | Goal should hold objective, constraints, evidence, stop condition, next action—not product doctrine.  |
| Dashboard-first state                                 |                       Reject now | Dashboard before typed objects is vanity UI.                                                          |
| Broad benchmark lane                                  |                       Reject now | Benchmarks should follow real failures/golden tasks, not precede dogfood traces.                      |
| Skill zoo / stack agents                              |                           Reject | Skills should be reusable engineering disciplines, not stack-specific mini-agents.                    |
| MCP as magic memory                                   |                           Reject | MCP is a typed boundary for tools/resources, not memory or safety by itself.                          |
| Hooks as hidden architecture brain                    |                           Reject | Hooks should be deterministic gates/audit, not hidden semantic decision-makers.                       |

---

## Mapping OpenAI Codex-native surfaces to KRN

| Codex surface | KRN mapping                                                                                                         | Boundary                                                                                                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AGENTS.md`   | Thin durable repo guidance: project norms, hard stops, how to invoke KRN.                                           | Not context storage, not product brain. Codex reads `AGENTS.md` before work and builds an instruction chain from global/project scopes, so bloat here becomes permanent prompt tax. ([OpenAI Developers][2])       |
| Skills        | Adapter bindings for `CapabilityRequirement`.                                                                       | Not core domain requirements. Codex skills are reusable workflow packages with progressive disclosure, so KRN should emit only dogfooded behavior skills with precise triggers. ([OpenAI Developers][1])           |
| Subagents     | Bounded cognitive organs: read-only/proposal-only explorer, critic, type reviewer.                                  | Not autonomous agent zoo. Codex spawns subagents only when explicitly asked, and subagents consume additional tokens and inherit sandbox/approval policy. ([OpenAI Developers][3])                                 |
| Hooks         | Deterministic gates and audit emitters: pre-tool warnings, evidence capture, policy checks, compact/resume capture. | Not complete enforcement and not semantic architecture. OpenAI notes `PreToolUse` is a guardrail rather than complete enforcement and does not intercept every equivalent tool path. ([OpenAI Developers][4])      |
| MCP           | Typed access to KRN resources/stores: project kernel, memory query, source graph, run ledger, review ledger.        | Not memory itself. Codex MCP connects models to tools/context and supports project-scoped config, but KRN still needs least privilege, audit, idempotency, and read/propose/write policy. ([OpenAI Developers][5]) |
| Goals         | `GoalContract`: durable objective, non-goals, validation loop, checkpoints, stop condition.                         | Not product brain. OpenAI frames `/goal` around long-running work with clear success condition, validation loop, and stopping condition. ([OpenAI Developers][6])                                                  |
| ExecPlans     | `ExecPlan`: implementation checkpoints, intended end state, validation after each pass, rollback expectations.      | Not a CLI command and not a document dump. OpenAI describes ExecPlans as documents that keep an overview, spell out intended end state, and log validation after each pass. ([OpenAI Developers][7])               |

This implies a separate adapter object:

```ts
type CodexAdapterPlan = {
  executionContractId: Id<"ExecutionContract">;
  agentsMdGuidanceRefs: string[];
  skillBindings: CodexSkillBinding[];
  subagentRequests: CodexSubagentRequest[];
  hookExpectations: CodexHookExpectation[];
  mcpResources: CodexMcpResourceBinding[];
  goal?: GoalContract;
  execPlan?: ExecPlan;
};
```

That object can mention Codex. Core task contracts should not.

---

## Next 6-hour implementation sequence

The next run should not add more command slices. It should create a **final-pattern walking skeleton** that is thin but structurally correct.

### 0. Architecture checkpoint

Write one ADR:

```text
ADR-0007-harness-run-is-the-core-spine.md
```

Decision:

```text
KRN core centers on TaskContract -> HarnessPlan -> ContextAssembly
-> ExecutionContract -> ExecutionRun -> EvidenceBundle -> ReviewAssessment
-> FeedbackDelta.

CLI commands and Codex surfaces are adapters.
ContextPacket is a materialized context artifact, not the central model.
Codex skills are adapter bindings, not core requiredSkills.
```

### 1. Core type spine

Create:

```text
packages/core/src/domain/
  OperatorIntent.ts
  TaskContract.ts
  HarnessPlan.ts
  ContextAssembly.ts
  ContextPacket.ts
  ExecutionContract.ts
  ExecutionRun.ts
  EvidenceBundle.ts
  ReviewAssessment.ts
  FeedbackDelta.ts
  Memory.ts
  Source.ts
  Policy.ts
  CapabilityRequirement.ts

packages/core/src/ports/
  MemoryStore.ts
  SourceStore.ts
  RunLedger.ts

packages/core/src/adapter-metadata/
  CodexAdapterPlan.ts
```

Core domain should not import CLI code. Core should also not require Codex skill names.

### 2. Constructors and validators

Implement pure constructors that accept `unknown` and validate before creating domain objects. Reject:

```text
- task without objective;
- task without non-goals;
- task without stop condition;
- context source without mechanism;
- context source without doesNotProve;
- memory without lineage unless explicit preference;
- memory without applicationGuidance;
- temporal memory without invalidationRule;
- feedback without reviewBurden/diffRisk;
- ContextPacket containing requiredSkills;
```

This aligns with the doctrine that TypeScript boundary discipline is a first-commit concern, not a later cleanup.

### 3. Thin compiler pipeline

Implement deterministic, thin functions:

```ts
compileOperatorIntent(intent: OperatorIntent): TaskContract
planHarness(contract: TaskContract): HarnessPlan
assembleContext(plan: HarnessPlan, stores: Stores): ContextAssembly
materializeContextPacket(assembly: ContextAssembly): ContextPacket
createExecutionContract(packet: ContextPacket): ExecutionContract
createCodexAdapterPlan(contract: ExecutionContract): CodexAdapterPlan
```

Selectors can be primitive. Memory can abstain. Source store can be an in-memory fixture. The point is the shape of the final harness.

### 4. One golden fixture

Add one fixture:

```text
tests/fixtures/harness-run/add-doctor-check.intent.json
```

Expected generated artifacts:

```text
TaskContract
HarnessPlan
ContextAssembly
ContextPacket
ExecutionContract
CodexAdapterPlan
```

This gives reviewers a concrete trace without requiring a full Codex run.

### 5. Contract tests

Add tests for the old failure modes:

```text
- rejects markdown memory as runtime source;
- rejects dashboard/benchmark output from init proposals;
- rejects source without mechanism/doesNotProve;
- rejects MemoryEntry without applicationGuidance;
- verifies memory retrieval can abstain;
- verifies no requiredSkills field exists in core ContextPacket;
- verifies CodexAdapterPlan can map capability -> skill binding;
- verifies policy gate requires read/propose/write classification;
```

The KRN plan already calls for typed primitives, valid/invalid fixtures, and known-bad fixtures before behavior expansion.

### 6. Minimal CLI only if time remains

Only after the domain works, add one adapter command:

```text
krn harness compile --intent tests/fixtures/harness-run/add-doctor-check.intent.json
```

It should emit JSON and perform no writes. Do not build `krn context build` or `krn review capture` deeper until they can call the domain pipeline rather than invent their own model.

Evidence at the end:

```text
pnpm typecheck
pnpm test
file tree
generated golden harness JSON
explicit not-built list
```

---

## Risks

The biggest risk is **over-correcting into abstract model theater**. Avoid that by requiring one golden fixture that flows through the full spine.

The second risk is **adapter leakage**: Codex terms like skills, hooks, subagents, and MCP can contaminate core domain objects. Keep them in `adapter-metadata` or a future `packages/codex-adapter`.

The third risk is **hook overconfidence**. Hooks are useful, but OpenAI’s hook docs explicitly characterize `PreToolUse` as a guardrail rather than complete enforcement, with incomplete interception across equivalent tool paths. Treat hooks as audit/gates, not as the whole safety model. ([OpenAI Developers][4])

The fourth risk is **skill-list bloat**. Since Codex includes an initial skills list under a context budget and may shorten or omit skills when many are installed, KRN should emit few, high-signal skills with clear trigger descriptions. ([OpenAI Developers][1])

The fifth risk is **review capture becoming another report artifact**. `EvidenceBundle` must drive `ReviewAssessment` and `FeedbackDelta`; otherwise it repeats the old artifact factory failure where reports existed but did not prove the daily workflow.

---

## Test and verification strategy

Use behavior-contract tests, not broad benchmarks.

Minimum test lanes:

```text
1. Domain validation tests
   Prove invalid TaskContract, MemoryEntry, SourceRef, ContextPacket,
   EvidenceBundle, and ReviewAssessment fail loudly.

2. Adapter-boundary tests
   Prove packages/core has no CLI imports and no requiredSkills field.
   Prove Codex skill bindings only appear in CodexAdapterPlan.

3. Context assembly tests
   Prove selected sources and memory entries require application guidance.
   Prove context assembly can abstain instead of broad dumping.

4. Memory contract tests
   Prove no runtime markdown memory.
   Prove stale/temporal memory requires invalidation strategy.
   Prove application feedback can strengthen, demote, or invalidate.

5. Source graph tests
   Prove source without mechanism and doesNotProve is rejected.
   Prove decisions require SourceDecisionEdge or explicit unsupported status.

6. Policy tests
   Prove every execution contract has read/propose/write boundary.
   Prove destructive/write actions require explicit gate results.

7. Review/evidence tests
   Prove review capture includes changed files, command evidence,
   test/typecheck status, review burden, diff risk, and rollback path.

8. Anti-theater tests
   Prove init/harness compile does not create dashboard, benchmark lane,
   or docs/memory runtime files.
```

The success criterion for the next run is not “many commands exist.” It is:

```text
A reviewer can inspect one generated HarnessRun fixture and see:
operator intent -> contract -> plan -> context -> execution contract
-> Codex adapter bindings -> evidence expectations -> feedback targets.
```

That is thin implementation of the final architecture, not a crippled MVP.

[1]: https://developers.openai.com/codex/skills "Agent Skills – Codex | OpenAI Developers"
[2]: https://developers.openai.com/codex/guides/agents-md "Custom instructions with AGENTS.md – Codex | OpenAI Developers"
[3]: https://developers.openai.com/codex/subagents "Subagents – Codex | OpenAI Developers"
[4]: https://developers.openai.com/codex/hooks "Hooks – Codex | OpenAI Developers"
[5]: https://developers.openai.com/codex/mcp "Model Context Protocol – Codex | OpenAI Developers"
[6]: https://developers.openai.com/codex/use-cases/follow-goals "Follow a goal | Codex use cases"
[7]: https://developers.openai.com/codex/use-cases/code-migrations "Run code migrations | Codex use cases"
