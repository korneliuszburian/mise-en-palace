import type {
  MemoryCandidate,
  MemoryRecord,
  ProjectId
} from "@krn/core";
import type {
  CreateMemoryCandidateInput,
  SourceDecisionKnowledgeSource
} from "@krn/core/repositories";

import {
  persistenceLine,
  postgresPersistedLabel,
  previewOnlyPersistenceLabel
} from "./command-runtime-support.js";
import type { BaseCommandRuntime } from "./command-runtime-support.js";
import {
  createMemoryCommandDatabaseRuntime
} from "./memory-command-support.js";
import type { CreateMemoryCommandDatabaseRuntime } from "./memory-command-support.js";
import type { CliCommand } from "./parse-args.js";

type MemoryKnowledgeProposeCommand = Extract<CliCommand, { kind: "memoryKnowledgePropose" }>;

export interface MemoryKnowledgeProposeCommandRuntime extends BaseCommandRuntime {
  command: MemoryKnowledgeProposeCommand;
  createDatabaseRuntime?: CreateMemoryCommandDatabaseRuntime;
}

export interface MemoryKnowledgeProposeCommandResult {
  stdout: string;
}

interface ProposedKnowledgeCandidate {
  readonly sourceDecisionId: string;
  readonly sourceClaimId: string;
  readonly summary: string;
  readonly candidateId?: string;
  readonly skipped: boolean;
}

const PROPOSED_BY = "krn memory knowledge propose";
const DUPLICATE_SCAN_LIMIT = 1000;
const DEFAULT_SOURCE_DECISION_LIMIT = 25;

const confidenceValue = (
  confidence: SourceDecisionKnowledgeSource["sourceDecisionEdge"]["confidence"]
): number =>
  confidence === "high" ? 90 : confidence === "medium" ? 60 : 30;

const metadataSourceDecisionId = (
  item: Pick<MemoryCandidate | MemoryRecord, "metadata">
): string | undefined => {
  const sourceDecisionId = item.metadata["sourceDecisionId"];

  return typeof sourceDecisionId === "string" && sourceDecisionId.trim().length > 0
    ? sourceDecisionId
    : undefined;
};

const existingSourceDecisionIds = (
  candidates: readonly MemoryCandidate[],
  records: readonly MemoryRecord[]
): Set<string> => {
  const ids = new Set<string>();

  for (const item of [...candidates, ...records]) {
    const sourceDecisionId = metadataSourceDecisionId(item);

    if (sourceDecisionId !== undefined) {
      ids.add(sourceDecisionId);
    }
  }

  return ids;
};

export const sourceDecisionKnowledgeSourceToMemoryCandidateInput = (
  source: SourceDecisionKnowledgeSource,
  projectId: ProjectId,
  now: string
): CreateMemoryCandidateInput => ({
  projectId,
  proposedBy: PROPOSED_BY,
  kind: "procedure",
  summary: source.sourceDecision.decision,
  body: [
    source.sourceDecision.decision,
    "",
    `Mechanism: ${source.sourceClaim.mechanism}`,
    `KRN implication: ${source.sourceClaim.krnImplication}`,
    `Decision rationale: ${source.sourceDecision.rationale}`
  ].join("\n"),
  owner: source.sourceDecision.consumer,
  confidence: confidenceValue(source.sourceDecisionEdge.confidence),
  applicationGuidance: source.sourceDecision.decision,
  invalidationRule: source.sourceDecision.falsifier,
  sourceClaimIds: [source.sourceClaim.id],
  sourceLineage: [
    {
      sourceId: source.sourceClaim.id,
      note: source.sourceClaim.claim
    },
    {
      sourceId: source.sourceDecision.id,
      note: source.sourceDecision.rationale
    },
    {
      sourceId: source.sourceDecisionEdge.id,
      note: source.sourceDecisionEdge.notes
    }
  ],
  isUserPreference: false,
  validFrom: now,
  metadata: {
    source: "source_decision_knowledge_proposal",
    sourceDecisionId: source.sourceDecision.id,
    sourceDecisionEdgeId: source.sourceDecisionEdge.id,
    sourceClaimId: source.sourceClaim.id,
    sourceAuthority: source.sourceClaim.sourceAuthority,
    supportType: source.sourceDecisionEdge.supportType,
    mechanism: source.sourceClaim.mechanism,
    krnImplication: source.sourceClaim.krnImplication,
    consumer: source.sourceDecision.consumer,
    falsifier: source.sourceDecision.falsifier,
    doesNotProve: source.sourceClaim.doesNotProve
  }
});

const formatProposeResult = (
  input: {
    readonly projectId: ProjectId;
    readonly sourceCount: number;
    readonly proposed: readonly ProposedKnowledgeCandidate[];
    readonly persist: boolean;
  }
): string => {
  const createdCount = input.proposed.filter((item) => !item.skipped).length;
  const skippedCount = input.proposed.filter((item) => item.skipped).length;
  const lines = [
    "KRN Memory Knowledge Propose",
    `Project: ${input.projectId}`,
    `Source decisions read: ${input.sourceCount}`,
    `Created candidates: ${input.persist ? createdCount : 0}`,
    `Preview candidates: ${input.persist ? 0 : createdCount}`,
    `Skipped duplicates: ${skippedCount}`,
    persistenceLine(
      input.persist
        ? postgresPersistedLabel
        : previewOnlyPersistenceLabel("create MemoryCandidate rows")
    ),
    "No MemoryRecord promotion performed.",
    "",
    "Source decisions:"
  ];

  for (const proposal of input.proposed) {
    const status = proposal.skipped
      ? "skipped_duplicate"
      : input.persist
        ? `created:${proposal.candidateId ?? "unknown"}`
        : "preview";
    lines.push(
      `- ${proposal.sourceDecisionId} -> ${proposal.sourceClaimId} (${status}) ${proposal.summary}`
    );
  }

  return `${lines.join("\n")}\n`;
};

export const runMemoryKnowledgeProposeCommand = async (
  runtime: MemoryKnowledgeProposeCommandRuntime
): Promise<MemoryKnowledgeProposeCommandResult> => {
  const db = await createMemoryCommandDatabaseRuntime(
    runtime,
    "KRN_DATABASE_URL is required for krn memory knowledge propose"
  );

  try {
    const projectId = runtime.command.projectId ?? db.projectId;
    const limit = runtime.command.limit ?? DEFAULT_SOURCE_DECISION_LIMIT;
    if (db.sourceRepository.listSourceDecisionKnowledgeSources === undefined) {
      throw new Error("SourceDecision knowledge proposal read model is unavailable");
    }

    if (db.memoryRepository.listMemoryCandidates === undefined) {
      throw new Error("MemoryCandidate duplicate read model is unavailable");
    }

    const sources = await db.sourceRepository.listSourceDecisionKnowledgeSources(projectId, limit);
    const existingCandidates = await db.memoryRepository.listMemoryCandidates(
      projectId,
      DUPLICATE_SCAN_LIMIT
    );
    const existingRecords = await db.memoryRepository.listMemoryRecordsForProject(
      projectId,
      DUPLICATE_SCAN_LIMIT
    );
    const alreadyRepresented = existingSourceDecisionIds(existingCandidates, existingRecords);
    const proposed: ProposedKnowledgeCandidate[] = [];

    for (const source of sources) {
      if (alreadyRepresented.has(source.sourceDecision.id)) {
        proposed.push({
          sourceDecisionId: source.sourceDecision.id,
          sourceClaimId: source.sourceClaim.id,
          summary: source.sourceDecision.decision,
          skipped: true
        });
        continue;
      }

      if (!runtime.command.persist) {
        proposed.push({
          sourceDecisionId: source.sourceDecision.id,
          sourceClaimId: source.sourceClaim.id,
          summary: source.sourceDecision.decision,
          skipped: false
        });
        continue;
      }

      const candidate = await db.memoryRepository.createMemoryCandidate(
        sourceDecisionKnowledgeSourceToMemoryCandidateInput(source, projectId, runtime.now())
      );
      alreadyRepresented.add(source.sourceDecision.id);
      proposed.push({
        sourceDecisionId: source.sourceDecision.id,
        sourceClaimId: source.sourceClaim.id,
        summary: source.sourceDecision.decision,
        candidateId: candidate.id,
        skipped: false
      });
    }

    return {
      stdout: formatProposeResult({
        projectId,
        sourceCount: sources.length,
        proposed,
        persist: runtime.command.persist
      })
    };
  } finally {
    await db.close();
  }
};
