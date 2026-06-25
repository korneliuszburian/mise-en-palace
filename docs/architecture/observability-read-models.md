# Observability Read Models

Status: D-03 proposal.

Purpose: define the first typed read models KRN needs before dashboard/API work.
These models are derived views over existing typed state. They are not new
source-of-truth tables in this slice.

## Rules

- Read models are read-only projections.
- Source of truth remains persisted run/evidence/context/memory state.
- Each model must name the operator action it supports.
- Each model must carry a falsifier so it cannot become decorative telemetry.
- No dashboard, API, MCP, worker runtime, or metrics warehouse is authorized by
  this document.

## ReviewBurdenReadModel

Owner: evidence/review loop.

Purpose: show whether a run became easier or harder to review.

Data sources:

- `ExecutionRun`;
- `EvidenceBundle.diffRisk`;
- `EvidenceBundle.reviewBurden`;
- `EvidenceBundle.commands`;
- `EvidenceBundle.metadata.changedFileClassification`;
- `ReviewAssessment.status`;
- `ReviewAssessment.findings`;
- `FeedbackDelta` candidate counts.

Fields:

```ts
type ReviewBurdenReadModel = {
  runId: string;
  evidenceBundleId?: string;
  diffRisk: "low" | "medium" | "high" | "unknown";
  commandProof: "strong" | "weak_default" | "mixed" | "missing";
  dirtyContext: "none" | "unrelated" | "unknown" | "missing_intent";
  candidateReviewLoad: "none" | "low" | "medium" | "high";
  reviewStatus: "pending" | "accepted" | "changes_requested" | "rejected" | "unknown";
  nextAction: string;
  doesNotProve: string;
};
```

Operator action:

- accept review;
- request changes;
- capture missing command evidence;
- split unrelated dirty context;
- reject vague candidates.

Falsifier:

```txt
If the model cannot tell whether command proof is operator-reported,
captured-output, default-template, or missing, it is not useful.
```

## ContextROIReadModel

Owner: activation/readback.

Purpose: show whether selected context reduced rereads or introduced noise.

Data sources:

- `ContextAssembly.inclusions`;
- `ContextAssembly.exclusions`;
- raw recall/search document inclusions;
- dogfood usefulness reports;
- `MemoryApplication` outcomes when available;
- source decision edges when available.

Fields:

```ts
type ContextROIReadModel = {
  runId: string;
  contextAssemblyId?: string;
  inclusionCount: number;
  exclusionCount: number;
  helpedCount: number;
  neutralCount: number;
  noiseCount: number;
  missingOwnerFiles: string[];
  rawRecallUsed: boolean;
  nextAction: string;
  doesNotProve: string;
};
```

Operator action:

- keep activation as-is;
- add owner-file recall case;
- demote noisy memory/source;
- add source claim or anti-memory;
- open bounded activation repair.

Falsifier:

```txt
If selected context cannot be classified as used/helped/noise/missing from run
evidence or dogfood report evidence, the model must report unknown instead of
claiming ROI.
```

## MemoryUsefulnessReadModel

Owner: memory governance.

Purpose: show whether memory selected in one run helped, hurt, or stayed unused.

Data sources:

- `MemoryRecord`;
- `MemoryCandidate`;
- `MemoryApplication`;
- `MemoryFeedbackEvent`;
- `AntiMemoryRecord`;
- `ContextAssembly.inclusions/exclusions`;
- source lineage and invalidation metadata.

Fields:

```ts
type MemoryUsefulnessReadModel = {
  memoryId: string;
  runId?: string;
  status: "active" | "stale" | "invalidated" | "superseded" | "unknown";
  selected: boolean;
  appliedOutcome: "helped" | "hurt" | "neutral" | "stale" | "unknown";
  positiveFeedbackCount: number;
  negativeFeedbackCount: number;
  antiMemoryConflict: boolean;
  recommendedAction:
    | "keep"
    | "strengthen"
    | "demote"
    | "invalidate"
    | "convert_to_anti_memory"
    | "no_action"
    | "unknown";
  doesNotProve: string;
};
```

Operator action:

- keep memory;
- strengthen memory with evidence;
- demote stale or noisy memory;
- invalidate memory;
- create/review anti-memory candidate.

Falsifier:

```txt
If memory was selected but no application feedback exists, usefulness is
unknown. Selected does not mean helped.
```

## Deferred Models

Deferred until more product evidence exists:

- dashboard aggregate metrics;
- team/user metrics;
- cross-repo metrics;
- model/provider performance metrics;
- worker throughput;
- source crawler coverage.

## Next Build Candidate

The next implementation slice may add pure read-model helpers over existing
aggregates only if D-03 is accepted. It should not add persistence or dashboard
surface first.
