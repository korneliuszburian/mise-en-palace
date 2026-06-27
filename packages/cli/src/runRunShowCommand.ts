import postgres from "postgres";
import {
  createKrnDatabase
} from "@krn/db";
import {
  DrizzleHarnessRunRepository
} from "@krn/db/adapters";
import {
  normalizeEvidenceCommand,
  summarizeFeedbackCandidateProposals,
  targetEvidenceFromMetadata
} from "@krn/core";
import type {
  CandidateReviewability,
  EvidenceCommand,
  FeedbackDelta,
  FeedbackCandidateProposalKind,
  NormalizedEvidenceCommand,
  TargetEvidence
} from "@krn/core";
import type {
  HarnessRunAggregate,
  HarnessRunRepository
} from "@krn/harness/repositories";

import type {
  DatabaseRuntimeInput
} from "./databaseRuntime.js";

export interface RunShowCommandRuntime {
  env: Record<string, string | undefined>;
  now(): string;
  createId(prefix: string): string;
  runId: string;
  format: RunReadbackOutputFormat;
  createDatabaseRuntime?: CreateRunShowDatabaseRuntime;
}

export interface RunShowCommandResult {
  stdout: string;
}

export type RunReadbackOutputFormat = "text" | "json";

export interface RunReadbackCommandResource {
  command: string;
  status: EvidenceCommand["status"];
  provenance: NormalizedEvidenceCommand["provenance"];
  doesNotProve: string;
}

export interface RunReadbackChangedFilesResource {
  all: string[];
  classification: {
    source: "metadata" | "not_recorded";
    intended: string[];
    unrelated: string[];
    unknown: string[];
  };
}

export interface RunReadbackResource {
  kind: "krn.run.readback.v1";
  access: "read_only";
  mutation: "none";
  run: {
    id: string;
    status: string;
    adapter: string;
    createdAt: string;
    updatedAt: string;
  };
  task: {
    id: string;
    title: string;
    objective: string;
    status: string;
  };
  context: {
    status: string;
    inclusions: number;
    exclusions: number;
  };
  evidenceBundles: {
    id: string;
    status: string;
    diffRisk: string;
    reviewBurden: string;
    rollbackPath: string;
    changedFiles: RunReadbackChangedFilesResource;
    commands: RunReadbackCommandResource[];
    targetEvidence?: TargetEvidence;
  }[];
  reviewAssessments: {
    id: string;
    status: string;
    reviewer: string;
  }[];
  feedbackDeltas: {
    id: string;
    status: string;
    memoryRecordMutation: "none";
    candidateCounts: {
      memory: number;
      source: number;
      sourceClaim: number;
      sourceDecision: number;
      antiMemory: number;
      eval: number;
      observation: number;
    };
    candidates: RunReadbackCandidateResource[];
  }[];
  proof: {
    proves: string[];
    doesNotProve: string[];
  };
}

export interface RunReadbackCandidateResource {
  kind: FeedbackCandidateProposalKind;
  id: string;
  status: string;
  summary: string;
  reviewability: CandidateReviewability;
  reviewabilityReasons: string[];
}

interface ReadOnlyHarnessRuntime {
  harnessRunRepository: Pick<HarnessRunRepository, "getHarnessRunByExecutionRunId">;
  close(): Promise<void>;
}

export type CreateRunShowDatabaseRuntime = (
  input: DatabaseRuntimeInput
) => Promise<ReadOnlyHarnessRuntime>;

const defaultWorkspaceSlug = "local";
const defaultProjectSlug = "mise-en-palace";
const localDatabaseUrl = "postgres://krn:krn@localhost:54329/krn";

export const missingRunShowDatabaseUrlMessage = [
  "KRN_DATABASE_URL is required for krn run show",
  `Next action: export KRN_DATABASE_URL=${localDatabaseUrl} and run pnpm db:ready before readback`,
  "Does not prove: setting KRN_DATABASE_URL does not prove the requested run exists, commands executed, or Memory Core mutated"
].join("\n");

const createReadOnlyHarnessRuntime = async (
  databaseUrl: string
): Promise<ReadOnlyHarnessRuntime> => {
  const client = postgres(databaseUrl, { max: 1 });
  const db = createKrnDatabase(client);

  return {
    harnessRunRepository: new DrizzleHarnessRunRepository(db),
    async close(): Promise<void> {
      await client.end();
    }
  };
};

const resolveReadOnlyRuntime = async (
  runtime: RunShowCommandRuntime,
  databaseUrl: string
): Promise<ReadOnlyHarnessRuntime> => {
  if (runtime.createDatabaseRuntime === undefined) {
    return createReadOnlyHarnessRuntime(databaseUrl);
  }

  return runtime.createDatabaseRuntime({
    databaseUrl,
    workspaceSlug: defaultWorkspaceSlug,
    projectSlug: defaultProjectSlug,
    now: runtime.now,
    createId: runtime.createId
  });
};

const metadataString = (
  metadata: Record<string, unknown>,
  key: string
): string | undefined => {
  const value = metadata[key];

  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
};

const metadataStringList = (
  metadata: Record<string, unknown>,
  key: string
): string[] => {
  const value = metadata[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string =>
    typeof item === "string" && item.trim().length > 0
  );
};

const changedFileClassification = (
  bundle: HarnessRunAggregate["evidenceBundles"][number]
): RunReadbackChangedFilesResource["classification"] => {
  const group = bundle.metadata.changedFileClassification;

  if (
    typeof group !== "object" ||
    group === null ||
    Array.isArray(group)
  ) {
    return {
      source: "not_recorded",
      intended: [],
      unrelated: [],
      unknown: bundle.changedFiles
    };
  }

  const record = group as Record<string, unknown>;

  return {
    source: "metadata",
    intended: metadataStringList(record, "intended"),
    unrelated: metadataStringList(record, "unrelated"),
    unknown: metadataStringList(record, "unknown")
  };
};

const metadataArrayLength = (
  metadata: Record<string, unknown>,
  groupKey: string,
  key: string
): string => {
  const group = metadata[groupKey];

  if (
    typeof group !== "object" ||
    group === null ||
    Array.isArray(group)
  ) {
    return "unknown";
  }

  const value = (group as Record<string, unknown>)[key];

  return Array.isArray(value) ? String(value.length) : "unknown";
};

const renderCommand = (command: EvidenceCommand): string[] => {
  const normalized = normalizeEvidenceCommand(command) as NormalizedEvidenceCommand;

  return [
    `- ${normalized.command}: ${normalized.status} | provenance=${normalized.provenance}`,
    `  doesNotProve: ${normalized.doesNotProve}`
  ];
};

const renderCommands = (commands: readonly EvidenceCommand[]): string[] =>
  commands.length === 0
    ? ["- none"]
    : commands.flatMap(renderCommand);

const renderList = (values: readonly string[]): string[] =>
  values.length === 0
    ? ["    - none"]
    : values.map((value) => `    - ${value}`);

const renderTargetEvidence = (targetEvidence: TargetEvidence | undefined): string[] => {
  if (targetEvidence === undefined) {
    return [
      "  targetEvidence:",
      "  - none"
    ];
  }

  return [
    "  targetEvidence:",
    `  - repo: ${targetEvidence.targetRepo}`,
    `  - mode: ${targetEvidence.mode}`,
    `  - dirtyBefore: ${targetEvidence.dirtyBefore}`,
    `  - dirtyAfter: ${targetEvidence.dirtyAfter}`,
    `  - ownedChanges: ${targetEvidence.ownedChanges}`,
    `  - targetStatusFreshness: ${targetEvidence.targetStatusFreshness}`,
    `  - targetPatchLifecycle: ${targetEvidence.targetPatchLifecycle}`,
    `  - handoffArtifact: ${targetEvidence.handoffArtifact ?? "none"}`,
    `  - targetOwnerDecision: ${targetEvidence.targetOwnerDecision ?? "none"}`,
    "  - allowedWrites:",
    ...renderList(targetEvidence.allowedWrites),
    "  - forbiddenWrites:",
    ...renderList(targetEvidence.forbiddenWrites),
    "  - changedFiles:",
    ...(targetEvidence.changedFiles.length === 0
      ? ["    - none"]
      : targetEvidence.changedFiles.map((file) =>
          `    - ${file.status} ${file.path} | ownership=${file.ownership}`
        )),
    "  - commands:",
    ...renderList(targetEvidence.commands),
    "  - doesNotProve:",
    ...renderList(targetEvidence.doesNotProve)
  ];
};

const commandResource = (command: EvidenceCommand): RunReadbackCommandResource => {
  const normalized = normalizeEvidenceCommand(command) as NormalizedEvidenceCommand;

  return {
    command: normalized.command,
    status: normalized.status,
    provenance: normalized.provenance,
    doesNotProve: normalized.doesNotProve
  };
};

const candidateReviewabilityReasons = (
  metadata: Record<string, unknown>
): string[] => metadataStringList(metadata, "reviewabilityReasons");

const candidateReviewabilityLabels = new Set<CandidateReviewability>([
  "ready",
  "needs_more_evidence",
  "too_vague",
  "duplicate",
  "not_useful",
  "unknown"
]);

const candidateReviewability = (
  metadata: Record<string, unknown>
): CandidateReviewability => {
  const value = metadataString(metadata, "reviewability");

  return value !== undefined && candidateReviewabilityLabels.has(value as CandidateReviewability)
    ? value as CandidateReviewability
    : "unknown";
};

const objectListMetadata = (
  metadata: Record<string, unknown>,
  key: string
): Record<string, unknown>[] => {
  const value = metadata[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is Record<string, unknown> =>
    typeof item === "object" && item !== null && !Array.isArray(item)
  );
};

const candidateResource = (input: {
  kind: FeedbackCandidateProposalKind;
  id: string;
  status: string | undefined;
  summary: string;
  metadata: Record<string, unknown>;
}): RunReadbackCandidateResource => {
  const reviewability = candidateReviewability(input.metadata);
  const reviewabilityReasons = candidateReviewabilityReasons(input.metadata);

  return {
    kind: input.kind,
    id: input.id,
    status: input.status ?? "unknown",
    summary: input.summary,
    reviewability,
    reviewabilityReasons:
      reviewabilityReasons.length > 0
        ? reviewabilityReasons
        : ["Reviewability reasons were not present in candidate metadata."]
  };
};

const metadataCandidateResources = (
  metadata: Record<string, unknown>,
  key: string,
  kind: FeedbackCandidateProposalKind,
  summaryField: string
): RunReadbackCandidateResource[] =>
  objectListMetadata(metadata, key).flatMap((item) => {
    const id = metadataString(item, "id");
    const summary = metadataString(item, summaryField) ?? metadataString(item, "summary");

    if (id === undefined || summary === undefined) {
      return [];
    }

    return [candidateResource({
      kind,
      id,
      status: metadataString(item, "status"),
      summary,
      metadata: item
    })];
  });

const runReadbackCandidateResources = (
  feedback: FeedbackDelta
): RunReadbackCandidateResource[] => [
  ...feedback.memoryCandidates.map((candidate) => candidateResource({
    kind: "memory_candidate",
    id: candidate.id,
    status: candidate.status,
    summary: candidate.summary,
    metadata: candidate.metadata
  })),
  ...metadataCandidateResources(
    feedback.metadata,
    "sourceClaimCandidates",
    "source_claim_candidate",
    "claim"
  ),
  ...feedback.sourceDecisions.map((decision) => candidateResource({
    kind: "source_decision_candidate",
    id: decision.id,
    status: decision.status,
    summary: decision.decision,
    metadata: decision.metadata
  })),
  ...metadataCandidateResources(
    feedback.metadata,
    "antiMemoryCandidates",
    "anti_memory_candidate",
    "rejectedClaim"
  ),
  ...feedback.evalCandidates.map((candidate) => candidateResource({
    kind: "eval_candidate",
    id: candidate.id,
    status: candidate.status,
    summary: candidate.title,
    metadata: candidate.metadata
  })),
  ...metadataCandidateResources(
    feedback.metadata,
    "observationCandidates",
    "observation_candidate",
    "summary"
  )
];

const renderFeedbackDelta = (feedback: FeedbackDelta): string[] => {
  const summary = summarizeFeedbackCandidateProposals(feedback);
  const candidateDetails = runReadbackCandidateResources(feedback).flatMap((candidate) => [
    `  - ${candidate.kind}:${candidate.id} | status=${candidate.status} | ${candidate.summary}`,
    `    reviewability: ${candidate.reviewability}`,
    ...candidate.reviewabilityReasons.map((reason) => `    reviewabilityReason: ${reason}`)
  ]);

  return [
    `- ${feedback.id}: status=${feedback.status}`,
    `  memoryRecordMutation: ${summary.memoryRecordMutation}`,
    `  candidates: memory=${summary.counts.memoryCandidates}, source=${summary.counts.sourceClaimCandidates + summary.counts.sourceDecisionCandidates}, source_claim=${summary.counts.sourceClaimCandidates}, source_decision=${summary.counts.sourceDecisionCandidates}, anti_memory=${summary.counts.antiMemoryCandidates}, eval=${summary.counts.evalCandidates}, observation=${summary.counts.observationCandidates}`,
    ...(
      candidateDetails.length === 0
        ? ["  candidate details: none"]
        : candidateDetails
    )
  ];
};

const renderEvidenceBundle = (
  aggregate: HarnessRunAggregate
): string[] => {
  if (aggregate.evidenceBundles.length === 0) {
    return ["Evidence Bundles:", "- none"];
  }

  return [
    "Evidence Bundles:",
    ...aggregate.evidenceBundles.flatMap((bundle) => {
      const targetEvidence = targetEvidenceFromMetadata(bundle.metadata.targetEvidence);

      return [
        `- ${bundle.id}: status=${bundle.status} diffRisk=${bundle.diffRisk}`,
        `  changedFiles: ${bundle.changedFiles.length}`,
        "  changed file classification:",
        `  - intended=${metadataArrayLength(bundle.metadata, "changedFileClassification", "intended")}`,
        `  - unrelated=${metadataArrayLength(bundle.metadata, "changedFileClassification", "unrelated")}`,
        `  - unknown=${metadataArrayLength(bundle.metadata, "changedFileClassification", "unknown")}`,
        `  reviewBurden: ${bundle.reviewBurden}`,
        `  rollbackPath: ${bundle.rollbackPath}`,
        "  commands:",
        ...renderCommands(bundle.commands).map((line) => `  ${line}`),
        ...renderTargetEvidence(targetEvidence)
      ];
    })
  ];
};

const renderFeedbackDeltas = (feedbackDeltas: readonly FeedbackDelta[]): string[] => [
  "Feedback Deltas:",
  ...(feedbackDeltas.length === 0
    ? ["- none"]
    : feedbackDeltas.flatMap(renderFeedbackDelta))
];

export const buildRunReadbackResource = (
  aggregate: HarnessRunAggregate
): RunReadbackResource => ({
  kind: "krn.run.readback.v1",
  access: "read_only",
  mutation: "none",
  run: {
    id: aggregate.executionRun.id,
    status: aggregate.executionRun.status,
    adapter: aggregate.executionRun.adapter,
    createdAt: aggregate.executionRun.createdAt,
    updatedAt: aggregate.executionRun.updatedAt
  },
  task: {
    id: aggregate.taskContract.id,
    title: aggregate.taskContract.title,
    objective: aggregate.taskContract.objective,
    status: aggregate.taskContract.status
  },
  context: {
    status: aggregate.contextAssembly?.status ?? "missing",
    inclusions: aggregate.contextAssembly?.inclusions.length ?? 0,
    exclusions: aggregate.contextAssembly?.exclusions.length ?? 0
  },
  evidenceBundles: aggregate.evidenceBundles.map((bundle) => {
    const targetEvidence = targetEvidenceFromMetadata(bundle.metadata.targetEvidence);

    return {
      id: bundle.id,
      status: bundle.status,
      diffRisk: bundle.diffRisk,
      reviewBurden: bundle.reviewBurden,
      rollbackPath: bundle.rollbackPath,
      changedFiles: {
        all: bundle.changedFiles,
        classification: changedFileClassification(bundle)
      },
      commands: bundle.commands.map(commandResource),
      ...(targetEvidence === undefined ? {} : { targetEvidence })
    };
  }),
  reviewAssessments: aggregate.reviewAssessments.map((assessment) => ({
    id: assessment.id,
    status: assessment.status,
    reviewer: assessment.reviewer
  })),
  feedbackDeltas: aggregate.feedbackDeltas.map((feedback) => {
    const summary = summarizeFeedbackCandidateProposals(feedback);

    return {
      id: feedback.id,
      status: feedback.status,
      memoryRecordMutation: summary.memoryRecordMutation,
      candidateCounts: {
        memory: summary.counts.memoryCandidates,
        source: summary.counts.sourceClaimCandidates + summary.counts.sourceDecisionCandidates,
        sourceClaim: summary.counts.sourceClaimCandidates,
        sourceDecision: summary.counts.sourceDecisionCandidates,
        antiMemory: summary.counts.antiMemoryCandidates,
        eval: summary.counts.evalCandidates,
        observation: summary.counts.observationCandidates
      },
      candidates: runReadbackCandidateResources(feedback)
    };
  }),
  proof: {
    proves: [
      "persisted run/evidence/review/feedback records can be read without ad hoc SQL",
      "this readback surface exposes no write action"
    ],
    doesNotProve: [
      "commands were executed by this readback command",
      "memory quality, source truth, review correctness, or product readiness",
      "Memory Core mutation"
    ]
  }
});

const renderAggregate = (
  aggregate: HarnessRunAggregate
): string =>
  [
    "KRN Run Readback",
    `Run ID: ${aggregate.executionRun.id}`,
    "Persistence: read-only (Postgres)",
    "Mutation: none",
    "",
    "Task:",
    `- id: ${aggregate.taskContract.id}`,
    `- title: ${aggregate.taskContract.title}`,
    `- objective: ${aggregate.taskContract.objective}`,
    `- run status: ${aggregate.executionRun.status}`,
    `- adapter: ${aggregate.executionRun.adapter}`,
    "",
    "Context:",
    `- status: ${aggregate.contextAssembly?.status ?? "missing"}`,
    `- inclusions: ${aggregate.contextAssembly?.inclusions.length ?? 0}`,
    `- exclusions: ${aggregate.contextAssembly?.exclusions.length ?? 0}`,
    "",
    ...renderEvidenceBundle(aggregate),
    "",
    "Review Assessments:",
    ...(aggregate.reviewAssessments.length === 0
      ? ["- none"]
      : aggregate.reviewAssessments.map((assessment) =>
          `- ${assessment.id}: status=${assessment.status} reviewer=${assessment.reviewer}`
        )),
    "",
    ...renderFeedbackDeltas(aggregate.feedbackDeltas),
    "",
    "What This Proves:",
    "- persisted run/evidence/review/feedback records can be read without ad hoc SQL",
    "",
    "What This Does Not Prove:",
    "- commands were executed by this readback command",
    "- memory quality, source truth, review correctness, or product readiness",
    "- Memory Core mutation",
    ""
  ].join("\n");

export const runRunShowCommand = async (
  runtime: RunShowCommandRuntime
): Promise<RunShowCommandResult> => {
  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error(missingRunShowDatabaseUrlMessage);
  }

  const readRuntime = await resolveReadOnlyRuntime(runtime, databaseUrl);

  try {
    const aggregate = await readRuntime.harnessRunRepository.getHarnessRunByExecutionRunId(
      runtime.runId
    );

    if (aggregate === undefined) {
      throw new Error(`Execution run not found: ${runtime.runId}`);
    }

    if (runtime.format === "json") {
      return {
        stdout: `${JSON.stringify(buildRunReadbackResource(aggregate), null, 2)}\n`
      };
    }

    return {
      stdout: `${renderAggregate(aggregate)}\n`
    };
  } finally {
    await readRuntime.close();
  }
};
