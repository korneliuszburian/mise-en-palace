# KRN Sources

Every source retained here must pass:

```txt
source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier
```

Every retained source must also name source class, decision kind, primary
consumer, falsifier, and what it does not prove. If a source has no consumer or
cannot be falsified locally, keep it out of active KRN guidance.

## Codex Native Surfaces

### AGENTS.md

- URL: https://developers.openai.com/codex/guides/agents-md
- Trust tier: high.
- Source class: official docs.
- Decision kind: adopt.
- Mechanism: Codex discovers durable project instructions from `AGENTS.md`
  layers before work.
- KRN implication: keep `AGENTS.md` thin and use it for repo guidance only.
- Decision: active instructions point to `KRN_ROADMAP.md` and forbid broad
  rereads.
- Consumer: root `AGENTS.md` and `KRN_ROADMAP.md` guidance.
- Falsifier: repeated Codex runs need broad rereads or miss kernel constraints
  because durable repo guidance is too thin or unclear.
- Does not prove: that a giant `AGENTS.md` improves results.

### Skills

- URL: https://developers.openai.com/codex/skills
- Trust tier: high.
- Source class: official docs.
- Decision kind: adopt.
- Mechanism: skills package reusable workflows with progressive disclosure.
- KRN implication: repo-local KRN workflows belong in `.agents/skills/`.
- Decision: create engineering-discipline skills, not custom prompts or stack
  agents.
- Consumer: repo-local `.agents/skills/*` workflows.
- Falsifier: repeated KRN workflows still require copying long prompt blocks
  into chat or root plans instead of loading a targeted skill.
- Does not prove: that many skills are useful by default.

### Matt Pocock Skills

- URL: https://github.com/mattpocock/skills
- Trust tier: medium.
- Source class: practitioner writing.
- Decision kind: adopt.
- Mechanism: small, adaptable, composable skills encode software-engineering
  feedback loops, shared language, issue-tracker routing, TDD, debugging,
  architecture review, and handoff instead of a single process monolith.
- KRN implication: KRN skills should encode repeated kernel-building
  disciplines and later brain-backed Codex workflows; they must not become a
  decorative skill zoo or alternate runtime authority.
- Decision: keep operational repo-local skills only when they have a clear
  trigger, workflow, forbidden behavior, verification, consumer, and removal
  condition. Treat future brain skills as consumers of KRN memory/source/eval
  readbacks, not as prompt packs.
- Consumer: `KRN_ROADMAP.md` Skills Direction, `.agents/skills/*/SKILL.md`,
  and skill invariants.
- Falsifier: a retained skill cannot reduce repeated work, cannot name its
  KRN consumer, or claims brain/runtime authority without an executing
  memory/source/eval path.
- Does not prove: Matt Pocock's skill topology should be copied wholesale,
  every KRN workflow deserves a skill, or skills are product readiness.

### Matt Pocock Shared Language

- URL: https://github.com/mattpocock/skills
- Trust tier: medium.
- Source class: practitioner writing.
- Decision kind: adopt.
- Mechanism: the skills README treats shared project language as a way to make
  variables, functions, and files consistent and easier for agents to navigate.
- KRN implication: KRN naming should encode the governed brain model and package
  authority boundaries, not decorative AI/control-plane vocabulary.
- Decision: use `AGENTS.md` naming rules and `KRN_ROADMAP.md` as the active
  naming contract; reject broad vanity rename sweeps. Rename only when evidence
  shows review cost, duplicated domain language, hidden authority, failed
  retrieval, or unsafe boundary confusion.
- Consumer: `AGENTS.md`, `KRN_ROADMAP.md`, and future naming Beads.
- Falsifier: a future naming slice changes many names without evidence refs, or
  keeps names such as `helper`, `common`, `final`, `new`, or `normalized` when
  they obscure the domain boundary they serve.
- Does not prove: every current KRN name is correct, or Matt Pocock's docs
  should override local evidence and tests.

### Google TypeScript Naming

- URL: https://google.github.io/styleguide/tsguide.html#naming
- Trust tier: medium.
- Source class: practitioner writing.
- Decision kind: adopt.
- Mechanism: identifiers should be descriptive and clear to a new reader, with
  consistent casing and limited abbreviations.
- KRN implication: KRN should prefer names that reveal the domain responsibility
  and review boundary to a reader who has not been in the audit thread.
- Decision: avoid vague catch-all names (`common`, `utils`, `helper`) unless
  they are backed by a precise local convention; prefer package/domain nouns.
- Consumer: `AGENTS.md` naming rules and future bounded rename issues.
- Falsifier: a new exported type, file, or helper can be understood only by
  reading several call sites because the name hides the domain concept.
- Does not prove: Google casing/file rules should be copied wholesale.

### TypeScript Contributor Style

- URL: https://github.com/microsoft/TypeScript/wiki/Coding-guidelines
- Trust tier: medium.
- Source class: practitioner writing.
- Decision kind: adopt.
- Mechanism: a large TypeScript codebase keeps coding guidelines close to its
  contribution workflow and treats diagnostic/message naming as part of review.
- KRN implication: KRN naming rules belong in the active code vocabulary
  standard and should be enforced by review/Beads, not buried in historical
  ledgers.
- Decision: route naming decisions through source-to-decision and bounded Beads;
  do not leave naming as an operator preference or one-off chat instruction.
- Consumer: `AGENTS.md`, Beads descriptions, and future reviewer prompts only
  after the reviewer skill is reactivated.
- Falsifier: naming rules are repeatedly re-explained in chat because the repo
  standard is missing or too vague to apply.
- Does not prove: every TypeScript contributor rule is relevant to KRN.

### Angular Style Guide Naming

- URL: https://angular.dev/style-guide
- Trust tier: medium.
- Source class: official docs.
- Decision kind: lab_test.
- Mechanism: Angular guidance emphasizes organizing code by feature area and
  giving methods meaningful names rather than hiding behavior under lifecycle
  or generic containers.
- KRN implication: KRN can use the same mechanism for CLI and kernel files:
  name files by the feature boundary they own, not by generic staging words.
- Decision: use this only as supporting evidence for feature-boundary file
  names; do not import Angular-specific file or suffix conventions.
- Consumer: future CLI/kernel file-boundary rename issues.
- Falsifier: a KRN file is renamed to match a framework convention while losing
  local package authority meaning.
- Does not prove: Angular naming or folder topology fits KRN packages.

### Subagents

- URL: https://developers.openai.com/codex/subagents
- Trust tier: high.
- Source class: official docs.
- Decision kind: lab_test.
- Mechanism: Codex can explicitly spawn bounded agents with separate context and
  inherited sandbox/approval controls.
- KRN implication: use subagents as organs for bounded review/exploration.
- Decision: start with only `ts-type-critic`.
- Consumer: `.codex/agents/ts-type-critic.toml` and future read-heavy review
  gates only after evidence.
- Falsifier: read-heavy review tasks repeatedly exceed context budget or miss
  TypeScript boundary problems that a read-only critic could catch.
- Does not prove: that broad swarms improve KRN early.

### Claude Code Headless Review

- URLs:
  - https://code.claude.com/docs/en/headless
  - https://code.claude.com/docs/en/cli-reference
- Trust tier: high.
- Source class: official docs.
- Decision kind: lab_test.
- Mechanism: Claude Code supports non-interactive `--print` mode, structured
  JSON output, bare mode, budget caps, turn caps, and resumable sessions; KRN
  treats workflow fit as lab-test evidence, not authority.
- KRN implication: completed implementation slices can request bounded
  second-opinion review without adding a dashboard, multi-agent runtime, or
  broad automation surface.
- Decision: keep `second-opinion-claude` deferred until a trustworthy reviewer
  backend is available; use the existing skill only as a parked lab artifact.
- Consumer: `.agents/deferred/skills/second-opinion-claude/SKILL.md` and future
  larger KRN migration/audit-hardening handoffs after reactivation.
- Falsifier: the review loop burns budget without finding actionable issues,
  encourages broad rewrites, or replaces local tests and source evidence with
  model authority.
- Does not prove: Claude's review is correct, CI passed, product readiness, or
  that back-and-forth model debate should run without a human budget decision.

### Hooks

- URL: https://developers.openai.com/codex/hooks
- Trust tier: high.
- Source class: official docs.
- Decision kind: defer.
- Mechanism: lifecycle hooks can run deterministic command handlers and require
  trust review.
- KRN implication: hooks are mechanical gates and audit surfaces.
- Decision: no hidden semantic architecture in hooks.
- Consumer: future hook ADR/policy only when a deterministic command gate is
  accepted.
- Falsifier: a repeated mechanical pre/post action remains manually enforced
  and creates review misses despite a small deterministic hook being available.
- Does not prove: that hooks are sufficient safety control.

### MCP

- URL: https://developers.openai.com/codex/mcp
- Trust tier: high.
- Source class: official docs.
- Decision kind: defer.
- Mechanism: MCP gives Codex tools/resources/prompts with configuration,
  allowlists, auth, and approval modes.
- KRN implication: MCP is a typed tool boundary, not memory.
- Decision: KRN MCP server is later, after CLI/store contracts exist.
- Consumer: future MCP ADR and typed read-model/tool boundary.
- Falsifier: operators repeatedly need structured KRN readback/tool access that
  cannot be served by CLI/DB read models without brittle shell parsing.
- Does not prove: that MCP is safe by default.

### Rules

- URL: https://developers.openai.com/codex/rules
- Trust tier: high.
- Source class: official docs.
- Decision kind: reject.
- Mechanism: rules control command prefixes outside the sandbox and are
  experimental.
- KRN implication: rules are command-policy controls only.
- Decision: do not encode semantic architecture in rules.
- Consumer: local Codex command-policy config only.
- Falsifier: semantic/product behavior is encoded in command rules instead of
  typed KRN plans, skills, tests, or policy gates.
- Does not prove: that rules should be a product brain.

### Permissions And Security

- URLs:
  - https://developers.openai.com/codex/permissions
  - https://developers.openai.com/codex/agent-approvals-security
- Trust tier: high.
- Source class: official docs.
- Decision kind: adopt.
- Mechanism: sandbox, approvals, permission profiles, network policy, and
  destructive tool approval define the local trust boundary.
- KRN implication: do not mix permission profiles and legacy sandbox settings in
  one active config path.
- Decision: bootstrap posture is read/propose for review/subagents,
  workspace-write only for implementation, network off unless explicitly
  allowed.
- Consumer: security/trust-boundary docs, skills, and future permission ADRs.
- Falsifier: a future KRN surface mixes sandbox/approval concepts or grants
  broader execution/network authority without explicit proof and rollback.
- Does not prove: that broad access is acceptable for speed.

### Custom Prompts

- URL: https://developers.openai.com/codex/custom-prompts
- Trust tier: high.
- Source class: official docs.
- Decision kind: reject.
- Mechanism: custom prompts are deprecated in favor of skills.
- KRN implication: reusable KRN workflows should be skills.
- Decision: reject custom prompt library.
- Consumer: skill-first workflow policy and `.agents/skills/*`.
- Falsifier: reusable KRN workflows move into custom prompt snippets instead of
  skills, tests, runbooks, or task contracts.
- Does not prove: that every instruction must become a skill.

## OpenAI Cookbook Patterns

### Goals In Codex

- URL: https://developers.openai.com/cookbook/examples/codex/using_goals_in_codex
- Trust tier: high.
- Source class: official docs.
- Decision kind: adopt.
- Mechanism: goals support continuation with explicit objective and evidence.
- KRN implication: continuation needs explicit objective, evidence, and active
  task state, but KRN should not implement that as a root markdown ledger.
- Decision: keep continuation state in Beads and governed handoffs, with product
  direction in `KRN_ROADMAP.md`.
- Consumer: Beads task graph, handoff-compact skill, and second-opinion context
  packs.
- Falsifier: a fresh continuation follows old chat or a deleted markdown plan
  instead of the current Beads task and roadmap boundary.
- Does not prove: that goal files should exist in repo root.

### Iterative Repair Loops

- URL:
  https://developers.openai.com/cookbook/examples/codex/build_iterative_repair_loops_with_codex
- Trust tier: high.
- Source class: official docs.
- Decision kind: adopt.
- Mechanism: review, repair, and validation close the loop.
- KRN implication: KRN repair loops should move through bounded task, evidence,
  review assessment, feedback delta, and verified repair instead of feature
  momentum.
- Decision: use current evidence/review/feedback surfaces for bounded repair
  loops; do not route future work through stale review-capture or doctor-first
  wording.
- Consumer: bounded repair loop tasks, evidence/review/feedback commands, and
  Beads next-task synthesis.
- Falsifier: KRN keeps adding features without a failing check, repair, and
  verification loop tied to one behavior.
- Does not prove: that broad automation should run before kernel spine.

### Agent Improvement Loop

- URL: https://developers.openai.com/cookbook/examples/agents_sdk/agent_improvement_loop
- Trust tier: high.
- Source class: official docs.
- Decision kind: adopt.
- Mechanism: traces and feedback feed eval candidates and improvement.
- KRN implication: eval candidates should come from real traces.
- Decision: no broad benchmark lane before dogfood evidence.
- Consumer: eval/golden candidates and Promptfoo smoke adapter.
- Falsifier: eval cases are added without trace/run evidence or without a
  proof/non-proof boundary.
- Does not prove: that green evals prove product quality.

### Memory And Compaction

- URL:
  https://developers.openai.com/cookbook/examples/agents_sdk/building_reliable_agents_memory_compaction
- Trust tier: high.
- Source class: official docs.
- Decision kind: adopt.
- Mechanism: separate working context from durable memory and compact selected
  state.
- KRN implication: runtime memory must be selected and store-backed.
- Decision: files are export/audit/seed, not Memory Core.
- Consumer: memory/activation architecture and context-condensation rules.
- Falsifier: markdown files become runtime Memory Core or active context grows
  by accumulation instead of selected, store-backed recall.
- Does not prove: that local markdown memory is enough.

### ExecPlans

- URL: https://developers.openai.com/cookbook/articles/codex_exec_plans
- Trust tier: high.
- Source class: official docs.
- Decision kind: adopt.
- Mechanism: ExecPlans preserve objective, discoveries, decisions, validation,
  and next work for long-running implementation.
- KRN implication: long-running work needs durable objective, discoveries,
  decisions, validation, and next work, but this should be Beads plus compact
  handoff, not root markdown ledgers.
- Decision: reject root `GOAL.md` / `PLAN.md` / `PLANS.md` as active state
  surfaces; keep `KRN_ROADMAP.md` for product direction and Beads for execution.
- Consumer: Beads, governed handoffs, second-opinion context packs, and compact
  final responses.
- Falsifier: a fresh Codex continuation cannot resume from Beads plus the last
  handoff without broad historical markdown rereads.
- Does not prove: that every task needs a verbose ExecPlan document.

### Codex Prompting Guide

- URL:
  https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide
- Trust tier: high.
- Source class: official docs.
- Decision kind: adopt.
- Mechanism: Codex performs better when tasks, constraints, expected outputs,
  and verification are explicit.
- KRN implication: every bounded KRN task needs non-goals, allowed writes,
  forbidden writes, verification, proof/non-proof boundaries, rollback, and
  next-task synthesis.
- Decision: keep task contracts in Beads issue descriptions, second-opinion
  context packs, or bounded prompts; do not recreate root plan ledgers.
- Consumer: Beads tasks, Codex-facing briefs, and second-opinion prompts.
- Falsifier: an active task lacks non-goals, allowed/forbidden writes,
  verification, proof/non-proof boundaries, rollback, or next-task synthesis.
- Does not prove: that every small edit needs a verbose prompt.

## Agent Memory And Retrieval Papers

### MemGPT

- URL: https://arxiv.org/abs/2310.08560
- Trust tier: medium.
- Source class: papers.
- Decision kind: adopt.
- Mechanism: virtual context management treats the LLM context window as a
  managed working set over slower durable memory tiers.
- KRN implication: KRN activation should select and evict context deliberately
  from store-backed memory/source/read models instead of treating long prompts
  or markdown ledgers as runtime memory.
- Decision: keep context assembly as a bounded working set and keep Memory Core
  store-backed; do not build file-backed runtime memory or assume a larger
  context window solves recall quality.
- Consumer: activation/context assembly work, context hygiene invariants, and
  future memory-usefulness benchmark cases.
- Falsifier: a future task improves KRN by adding more always-loaded context or
  markdown runtime memory instead of selected store-backed recall and still
  claims memory quality.
- Does not prove: that KRN should copy MemGPT implementation details, train a
  memory manager now, or skip review-gated memory promotion.

### A-MEM Agentic Memory For LLM Agents

- URL: https://arxiv.org/abs/2502.12110
- Trust tier: medium.
- Source class: papers.
- Decision kind: lab_test.
- Mechanism: agentic memory can create atomic notes with structured
  attributes, then dynamically link related memories and evolve older memory
  representations as new evidence arrives.
- KRN implication: KRN should test whether explicit memory/source relation
  links improve later recall over flat lexical retrieval before building a
  broader graph-memory platform.
- Decision: add a bounded eval candidate for relation-linked memory/source
  usefulness; do not add autonomous memory evolution or unreviewed Memory Core
  rewrites from this paper alone.
- Consumer: source graph ranking eval follow-ups, memory/source relation
  usefulness Beads, and `KRN_ROADMAP.md` eval direction.
- Falsifier: a relation-linked memory/source fixture cannot improve selection,
  explanation, or exclusion compared with flat memory/source packets.
- Does not prove: that KRN needs agent-generated memory rewrites, a graph
  database, autonomous memory evolution, or A-MEM's architecture.

### Letta Memory Blocks

- URL: https://www.letta.com/blog/memory-blocks/
- Trust tier: medium.
- Source class: practitioner writing.
- Decision kind: lab_test.
- Mechanism: memory blocks organize agent context into discrete functional
  context units that can be attached to the active prompt instead of dumping
  undifferentiated history.
- KRN implication: KRN should keep selected memory/source/context packets
  functionally typed and size-visible, while preserving review-gated durable
  memory writes.
- Decision: use memory blocks as a context-management pressure test only; do
  not add tool-editable always-in-context memory blocks as KRN Memory Core.
- Consumer: activation/context assembly readback, memory advantage context-size
  metrics, and future operator-facing context packet review.
- Falsifier: KRN claims memory improvement by pinning broad always-on context or
  allowing tools to edit durable memory without MemoryReviewGate.
- Does not prove: Letta's runtime model should be copied, memory blocks are
  sufficient for source truth, or KRN needs a separate agent runtime.

### Reflexion

- URL: https://arxiv.org/abs/2303.11366
- Trust tier: medium.
- Source class: papers.
- Decision kind: adopt.
- Mechanism: language-agent feedback can be converted into reflective memory
  that improves later trials without model weight updates.
- KRN implication: KRN feedback deltas and review assessments should create
  reviewable memory/source/eval candidates for future runs, not mutate durable
  truth automatically.
- Decision: retain feedback-to-candidate as the default improvement path and
  reject autonomous reflection writes to final Memory Core.
- Consumer: evidence/review loop, MemoryCandidate review, and future heartbeat
  candidate generation.
- Falsifier: a future reflection/feedback path writes final MemoryRecord truth
  without review or cannot show that feedback changed a later task.
- Does not prove: that verbal reflection is sufficient evidence, that candidate
  quality is good, or that KRN should optimize weights.

### Self-RAG

- URL: https://arxiv.org/abs/2310.11511
- Trust tier: medium.
- Source class: papers.
- Decision kind: lab_test.
- Mechanism: retrieval should be adaptive and critique-aware rather than always
  retrieving a fixed amount of context.
- KRN implication: brain-QA and activation work should test when KRN retrieves,
  abstains, critiques retrieved material, or records that evidence is
  insufficient.
- Decision: keep Self-RAG as an eval hypothesis for mini brain-QA; do not add a
  trained reflection-token model or hidden semantic hook.
- Consumer: V309 mini brain-QA benchmark sketch and future activation
  relevance tests.
- Falsifier: mini brain-QA cannot express cases where retrieval should be
  skipped, expanded, critiqued, or marked insufficient.
- Does not prove: that KRN has adaptive retrieval quality, citation accuracy,
  or a trained Self-RAG-style model.

### GraphRAG

- URL: https://arxiv.org/abs/2404.16130
- Trust tier: medium.
- Source class: papers.
- Decision kind: lab_test.
- Mechanism: global questions over a corpus can require entity graph structure
  and community summaries rather than nearest-neighbor passage retrieval.
- KRN implication: graph brain v0 should start from entities, claims, edges,
  and summary candidates with source ranges before widening corpus ingest.
- Decision: keep GraphRAG as a graph-brain benchmark hypothesis, not as a reason
  to build a broad graph platform now.
- Consumer: graph brain v0 design and mini brain-QA global-question cases.
- Falsifier: KRN graph work cannot answer or evaluate any corpus-level question
  that lexical/vector-only retrieval misses.
- Does not prove: that GraphRAG is the right implementation, that community
  summaries are accurate, or that KRN should build dashboard/API/MCP first.

### HippoRAG

- URL: https://arxiv.org/abs/2405.14831
- Trust tier: medium.
- Source class: papers.
- Decision kind: lab_test.
- Mechanism: knowledge graphs plus graph traversal/ranking can support
  multi-hop retrieval over integrated external knowledge.
- KRN implication: graph brain v0 should preserve entity/claim edges in a form
  that can later be evaluated for multi-hop retrieval, instead of only storing
  isolated chunks and embeddings.
- Decision: retain HippoRAG as a falsifiable multi-hop graph retrieval
  hypothesis after graph/ingest v0 exists.
- Consumer: future graph retrieval tests and multi-hop brain-QA cases.
- Falsifier: graph v0 produces edges that cannot improve or even be evaluated
  on multi-hop questions compared with lexical/vector readback.
- Does not prove: that KRN needs PageRank now, that a separate graph database is
  justified, or that graph retrieval is product-ready.

### Towards Autonomous Memory Agents

- URL: https://arxiv.org/abs/2602.22406
- Trust tier: medium.
- Source class: papers.
- Decision kind: lab_test.
- Mechanism: autonomous memory agents actively acquire, validate, and curate
  missing knowledge using a cost-aware extraction cascade and memory-selection
  exploration/exploitation, instead of only storing information that happens to
  appear in prior conversations.
- KRN implication: KRN heartbeat/dreaming should be able to propose
  candidate-only knowledge-acquisition or escalation work when source/brain
  search reports missing, stale, contradictory, or low-confidence evidence.
- Decision: lab-test a bounded acquisition/escalation candidate lane; do not
  add autonomous Memory Core mutation, crawler/API/MCP, ranking rewrite, or
  product claims from this paper alone.
- Consumer: heartbeat/dreaming candidate runtime, pattern/research brain,
  source-search missing-evidence readback, and future brain-QA/eval candidates.
- Falsifier: a future missing-evidence run cannot create a reviewable
  acquisition/escalation candidate, or an acquisition path mutates durable
  memory without review-gated acceptance.
- Does not prove: KRN product readiness, source truth, that benchmark gains
  transfer to KRN, that "Oxford" is the paper affiliation, or that autonomous
  retrieval should bypass source/review gates.

### MemoryAgentBench

- URL: https://arxiv.org/abs/2507.05257
- Trust tier: medium.
- Source class: papers.
- Decision kind: adopt.
- Mechanism: memory-agent evaluation should cover accurate retrieval,
  test-time learning, long-range understanding, and selective forgetting in
  incremental multi-turn settings rather than only static long-context recall.
- KRN implication: KRN memory evals need separate cases for recall, learning
  from run feedback, long-range source/evidence carryover, and forgetting or
  anti-memory behavior.
- Decision: extend the memory-advantage eval roadmap around these four
  competencies; do not treat one company-pattern hit as full memory quality.
- Consumer: future memory eval fixtures, future KRN behavior gate cases, and
  `KRN_ROADMAP.md` eval direction.
- Falsifier: KRN can pass `pnpm eval:memory-advantage` while lacking a local
  eval for retrieval, test-time learning, long-range carryover, or selective
  forgetting.
- Does not prove: KRN has mastered these competencies, MemoryAgentBench
  transfers directly to coding-agent work, or a broad benchmark platform should
  be built now.

### MemoryArena

- URLs:
  - https://arxiv.org/abs/2602.16313
  - https://memoryarena.github.io/
- Trust tier: medium.
- Source class: papers.
- Decision kind: adopt.
- Mechanism: agent memory should be evaluated in interdependent multi-session
  loops where earlier actions and feedback must be distilled into memory and
  used to guide later tasks.
- KRN implication: KRN needs an eval lane where a prior slice creates reviewed
  memory/source evidence and a later slice succeeds only if that evidence is
  selected and applied through the kernel path.
- Decision: create a bounded multi-session coding-pattern eval candidate after
  the current single-slice memory-advantage proof, using local company-pattern
  tasks and explicit baseline comparison.
- Consumer: follow-up Beads eval tasks, future memory-advantage fixtures, and
  `KRN_ROADMAP.md` eval direction.
- Falsifier: a KRN memory eval can be solved from a single prompt or preseeded
  selected context without relying on prior run feedback or persisted evidence.
- Does not prove: MemoryArena task domains map one-to-one to KRN, KRN needs a
  full external benchmark gym, or memory alone guarantees better coding-agent
  decisions.

### Mem0

- URL: https://arxiv.org/abs/2504.19413
- Trust tier: medium.
- Source class: papers.
- Decision kind: lab_test.
- Mechanism: long-term memory can outperform full-context and simple RAG when
  salient facts are extracted, consolidated, retrieved, and optionally
  represented with graph relations, while tracking latency and token cost.
- KRN implication: KRN evals should measure memory usefulness against a
  no-memory baseline and a broad-context or simple-retrieval baseline, with
  selected evidence ids and token/readback cost kept visible.
- Decision: lab-test cost-aware memory advantage metrics before adding broad
  memory automation; keep graph memory as a hypothesis tied to source claims
  and decision edges, not a new platform.
- Consumer: memory-advantage eval readback, future graph/source eval
  candidates, and `KRN_ROADMAP.md` eval direction.
- Falsifier: KRN claims memory advantage without showing selected evidence ids,
  baseline comparison, or cost/readback overhead for the selected context.
- Does not prove: Mem0 architecture should be copied, graph memory always helps
  KRN, LLM-as-judge metrics are sufficient, or token savings transfer to Codex
  without local measurement.

### LoCoMo

- URL: https://snap-research.github.io/locomo/
- Trust tier: medium.
- Source class: papers.
- Decision kind: adopt.
- Mechanism: long-term memory evaluation separates single-hop, multi-hop,
  temporal, commonsense/world-knowledge, and adversarial recall, and shows that
  temporal reasoning and hallucination remain hard even for long-context and
  RAG approaches.
- KRN implication: KRN source/memory evals need temporal and adversarial cases,
  not only positive recall cases where the correct memory is easy to retrieve.
- Decision: add temporal/source-grounded and adversarial negative cases to the
  memory eval roadmap before claiming broad memory advantage.
- Consumer: future memory/source fixtures, anti-memory/staleness behavior gates,
  and `KRN_ROADMAP.md` eval direction.
- Falsifier: a memory eval suite contains only positive single-hop recall and
  still claims useful long-term agent memory.
- Does not prove: LoCoMo's conversational setup is the right product workload
  for KRN or that current KRN retrieval handles temporal reasoning well.

### Memory In The Age Of AI Agents

- URL: https://arxiv.org/abs/2512.13564
- Trust tier: medium.
- Source class: papers.
- Decision kind: adopt.
- Mechanism: agent memory should be distinguished from RAG and context
  engineering, with factual, experiential, and working memory managed through
  formation, evolution, and retrieval over time.
- KRN implication: KRN should keep Memory Core, observations/evidence,
  activation working sets, and source-grounded claims as separate layers with
  different review gates and evals.
- Decision: use this taxonomy to reject one-bucket "brain memory" design and
  to route future eval cases by memory function and lifecycle.
- Consumer: `KRN_ROADMAP.md` and future memory/source eval Beads.
- Falsifier: a future KRN design merges evidence, working context, source
  claims, and durable memory into one undifferentiated store while still
  claiming governed memory.
- Does not prove: the survey's taxonomy is complete, every category needs a
  package, or KRN should build multimodal/multi-agent memory now.

### Memory For Autonomous LLM Agents

- URL: https://arxiv.org/abs/2603.07670
- Trust tier: medium.
- Source class: papers.
- Decision kind: adopt.
- Mechanism: agent memory can be modeled as a write-manage-read loop coupled
  to perception and action, with practical risks around contradiction handling,
  latency budgets, privacy governance, and learned forgetting.
- KRN implication: KRN's kernel verbs should stay centered on selected writes,
  managed review/forgetting, and read-time activation, with evals that expose
  contradiction, stale memory, and cost boundaries.
- Decision: use write-manage-read as the memory-eval organizing frame and keep
  worker automation deferred until a product loop proves background management
  is needed.
- Consumer: `KRN_ROADMAP.md`, future memory eval Beads, and future worker
  decision work.
- Falsifier: KRN adds memory write automation or worker execution without a
  local eval showing read/write/manage benefit and bounded cost or trust risk.
- Does not prove: autonomous memory mechanisms are safe, KRN needs a worker
  daemon now, or survey-level claims transfer without local tests.

### MIRIX

- URL: https://arxiv.org/abs/2507.07957
- Trust tier: medium.
- Source class: papers.
- Decision kind: defer.
- Mechanism: separating memory into core, episodic, semantic, procedural,
  resource, and knowledge-vault types can improve long-term recall and
  multimodal personalization when paired with coordinated update/retrieval.
- KRN implication: memory-type separation is useful as a pressure test for
  KRN's layer model, but KRN should not add a multi-agent memory subsystem or
  multimodal capture before text/code memory advantage is proven locally.
- Decision: defer MIRIX-style multi-memory expansion; use it only to check that
  KRN names memory layers by function instead of stuffing everything into one
  store.
- Consumer: `KRN_ROADMAP.md` and future worker/memory architecture decisions.
- Falsifier: KRN introduces multi-agent memory roles, screen capture, or
  multimodal memory without a local text/code memory advantage gap that demands
  it.
- Does not prove: MIRIX results transfer to KRN, multimodal memory is needed
  now, or multiple memory types require multiple packages.

## Agent Memory Practitioner Sources

### Mastra Observational Memory

- URLs:
  - https://mastra.ai/research/observational-memory
  - https://mastra.ai/blog/observational-memory
- Trust tier: medium.
- Source class: competitor docs.
- Decision kind: adopt.
- Mechanism: event-derived observations and periodic reflection can keep agent
  context bounded while retaining recall paths to what happened, changed, and
  was decided.
- KRN implication: observation and reflection stay as staging layers over raw
  evidence; they may create reviewable candidates but must not become Memory
  Core or replace exact source provenance.
- Decision: keep ADR-0013's raw event -> observation -> reflection ->
  candidate -> reviewed promotion architecture, while rejecting text-only
  memory, source hoarding, and benchmark claims as KRN product proof.
- Consumer: `docs/decisions/ADR-0013-observation-is-staging-not-memory.md`.
- Falsifier: a future slice lets observation/reflection directly mutate Memory
  Core, loses raw evidence recall, or treats source-reported memory benchmark
  results as KRN product readiness.
- Does not prove: that KRN should copy Mastra's implementation, add observer or
  reflector workers now, use text-only runtime memory, or build dashboard/API/MCP
  surfaces before local dogfood and golden proof.

## Infrastructure Sources

### PostgreSQL Row Locking For Queue-Like Tables

- URL: https://www.postgresql.org/docs/current/sql-select.html
- Trust tier: high.
- Source class: official docs.
- Decision kind: defer.
- Mechanism: PostgreSQL row locking supports `FOR UPDATE ... SKIP LOCKED`,
  which can let concurrent consumers skip already locked rows for queue-like
  tables while accepting an inconsistent view that is not suitable for general
  reads.
- KRN implication: if KRN later accepts a worker executor, the first queue
  claim mechanism should be proven against existing Postgres `worker_jobs` and
  `outbox_events` before adding Redis, Kafka, or another queue service.
- Decision: keep worker runtime deferred, but retain PostgreSQL row locking as
  the first candidate locking mechanism for any future one-shot/manual worker
  executor proof.
- Consumer: `KRN_ROADMAP.md` Phase 6 Maintenance Runtime and the workers
  boundary Bead queue.
- Falsifier: a future worker proof cannot express safe claim, lock, retry,
  timeout, idempotency, and audit behavior over Postgres worker-job/outbox
  tables without a separate queue service.
- Does not prove: that a worker daemon should be built now, that
  `SKIP LOCKED` is correct for every KRN read path, or that queue throughput is
  sufficient without a local worker-executor proof.

## TypeScript Official Sources

### TypeScript Narrowing And Exhaustiveness

- URL: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- Trust tier: high.
- Source class: official docs.
- Decision kind: adopt.
- Mechanism: TypeScript control-flow narrowing and `never` exhaustiveness make
  finite union states explicit at the branch where behavior changes.
- KRN implication: KRN status, provenance, lifecycle, and readback metadata
  unions should be narrowed at IO/render boundaries, and behavior-changing
  branches should fail typecheck when a union member is added but not handled.
- Decision: keep a TypeScript standard rule for finite-state narrowing and
  exhaustiveness at public, CLI, persistence, and readback boundaries.
- Consumer: `docs/standards/typescript-excellence.md` and future bounded
  TypeScript repair slices.
- Falsifier: a future KRN union adds a behavior-relevant member while rendering,
  persistence mapping, or review logic keeps compiling without handling the new
  state.
- Does not prove: that every union needs a switch, that broad type rewrites are
  valuable, or that official handbook examples are sufficient product evidence.

## TypeScript Practitioner Sources

### Designing Your Types

- URL:
  https://www.totaltypescript.com/books/total-typescript-essentials/designing-your-types-in-typescript
- Trust tier: medium.
- Source class: high-quality public course page.
- Decision kind: adopt.
- Mechanism: Type design communicates business and domain logic, not just
  compiler satisfaction.
- KRN implication: authority, provenance, lifecycle, and review state should be
  visible in domain types where those facts govern behavior.
- Decision: keep `docs/standards/typescript-excellence.md` doctrine that KRN
  TypeScript should make wrong authority hard to express.
- Consumer: TypeScript standards and future type-boundary repair slices.
- Falsifier: KRN domain types allow wrong authority, provenance, lifecycle, or
  review states to be represented without validation or review.
- Does not prove: that a broad type rewrite is valuable.

### Unions, Literals, And Narrowing

- URL:
  https://www.totaltypescript.com/books/total-typescript-essentials/unions-literals-and-narrowing
- Trust tier: medium.
- Source class: high-quality public course page.
- Decision kind: adopt.
- Mechanism: literal unions and narrowing constrain finite states and valid
  transitions.
- KRN implication: status, provenance, lifecycle, subject type, and candidate
  states should use narrow unions or discriminated unions when valid fields
  differ by state.
- Decision: keep discriminated-union guidance in
  `docs/standards/typescript-excellence.md`.
- Consumer: TypeScript boundary standard and lifecycle model reviews.
- Falsifier: a future lifecycle/status/provenance model uses optional object
  soup where valid fields differ by state.
- Does not prove: that every object needs a discriminant.

### TS Reset

- URL: https://www.totaltypescript.com/ts-reset
- Trust tier: medium.
- Source class: practitioner writing.
- Decision kind: adopt.
- Mechanism: stricter platform typings can turn unsafe defaults such as
  `JSON.parse` returning `any` into safer unknown-first behavior, but global
  type changes are application-scoped.
- KRN implication: use unknown-first parsing at CLI/file/env/JSON boundaries,
  but reject global `ts-reset` in `packages/core` and public package APIs.
- Decision: keep the current `ts-reset` policy in
  `docs/standards/typescript-boundaries.md`.
- Consumer: TypeScript boundary standard and package/app-scope type decisions.
- Falsifier: production code trusts `JSON.parse`, `fetch().json()`, env, CLI,
  file, MCP, or connector output without unknown-first validation.
- Does not prove: that `ts-reset` is forbidden in every private app/test scope.
