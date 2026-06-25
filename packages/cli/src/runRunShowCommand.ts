import postgres from "postgres";
import {
  createKrnDatabase
} from "@krn/db";
import {
  DrizzleHarnessRunRepository
} from "@krn/db/adapters";
import {
  normalizeEvidenceCommand,
  summarizeFeedbackCandidateProposals
} from "@krn/core";
import type {
  EvidenceCommand,
  FeedbackDelta,
  NormalizedEvidenceCommand
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
  createDatabaseRuntime?: CreateRunShowDatabaseRuntime;
}

export interface RunShowCommandResult {
  stdout: string;
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

const renderFeedbackDelta = (feedback: FeedbackDelta): string[] => {
  const summary = summarizeFeedbackCandidateProposals(feedback);
  const memoryCandidateDetails = feedback.memoryCandidates.map((candidate) => [
    `  - memory_candidate:${candidate.id} | status=${candidate.status} | ${candidate.summary}`,
    `    reviewability: ${metadataString(candidate.metadata, "reviewability") ?? "unknown"}`
  ]).flat();
  const otherCandidateDetails = summary.candidates
    .filter((candidate) => candidate.kind !== "memory_candidate")
    .flatMap((candidate) => [
      `  - ${candidate.kind}:${candidate.id} | status=${candidate.status ?? "unknown"} | ${candidate.summary}`,
      "    reviewability: see candidate metadata or source evidence"
    ]);
  const candidateDetails = [
    ...memoryCandidateDetails,
    ...otherCandidateDetails
  ];

  return [
    `- ${feedback.id}: status=${feedback.status}`,
    `  memoryRecordMutation: ${summary.memoryRecordMutation}`,
    `  candidates: memory=${summary.counts.memoryCandidates}, source=${summary.counts.sourceClaimCandidates}, anti_memory=${summary.counts.antiMemoryCandidates}, eval=${summary.counts.evalCandidates}, observation=${summary.counts.observationCandidates}`,
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
    ...aggregate.evidenceBundles.flatMap((bundle) => [
      `- ${bundle.id}: status=${bundle.status} diffRisk=${bundle.diffRisk}`,
      `  changedFiles: ${bundle.changedFiles.length}`,
      "  changed file classification:",
      `  - intended=${metadataArrayLength(bundle.metadata, "changedFileClassification", "intended")}`,
      `  - unrelated=${metadataArrayLength(bundle.metadata, "changedFileClassification", "unrelated")}`,
      `  - unknown=${metadataArrayLength(bundle.metadata, "changedFileClassification", "unknown")}`,
      `  reviewBurden: ${bundle.reviewBurden}`,
      `  rollbackPath: ${bundle.rollbackPath}`,
      "  commands:",
      ...renderCommands(bundle.commands).map((line) => `  ${line}`)
    ])
  ];
};

const renderFeedbackDeltas = (feedbackDeltas: readonly FeedbackDelta[]): string[] => [
  "Feedback Deltas:",
  ...(feedbackDeltas.length === 0
    ? ["- none"]
    : feedbackDeltas.flatMap(renderFeedbackDelta))
];

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
    throw new Error("KRN_DATABASE_URL is required for krn run show");
  }

  const readRuntime = await resolveReadOnlyRuntime(runtime, databaseUrl);

  try {
    const aggregate = await readRuntime.harnessRunRepository.getHarnessRunByExecutionRunId(
      runtime.runId
    );

    if (aggregate === undefined) {
      throw new Error(`Execution run not found: ${runtime.runId}`);
    }

    return {
      stdout: `${renderAggregate(aggregate)}\n`
    };
  } finally {
    await readRuntime.close();
  }
};
