import type {
  ProjectId
} from "@krn/core";
import type {
  CreateMemoryCandidateInput,
  SourceDecisionKnowledgeSource
} from "@krn/core/repositories";

import type { BaseCommandRuntime } from "./command-runtime-support.js";
import {
  formatSourceDecisionProposalResult,
  proposeSourceDecisionCandidates,
  sourceDecisionIdsFromMetadata
} from "./memory-proposal-command-support.js";
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

const PROPOSED_BY = "krn memory knowledge propose";
const DUPLICATE_SCAN_LIMIT = 1000;
const DEFAULT_SOURCE_DECISION_LIMIT = 25;

const confidenceValue = (
  confidence: SourceDecisionKnowledgeSource["sourceDecisionEdge"]["confidence"]
): number =>
  confidence === "high" ? 90 : confidence === "medium" ? 60 : 30;

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
    const alreadyRepresented = sourceDecisionIdsFromMetadata([
      ...existingCandidates,
      ...existingRecords
    ]);
    const proposed = await proposeSourceDecisionCandidates({
      sources,
      alreadyRepresented,
      persist: runtime.command.persist,
      summarize: (source) => source.sourceDecision.decision,
      createCandidate: (source) =>
        db.memoryRepository.createMemoryCandidate(
          sourceDecisionKnowledgeSourceToMemoryCandidateInput(source, projectId, runtime.now())
        )
    });

    return {
      stdout: formatSourceDecisionProposalResult({
        title: "KRN Memory Knowledge Propose",
        projectId,
        sourceCountLabel: "Source decisions read",
        sourceCount: sources.length,
        proposed,
        persist: runtime.command.persist,
        previewTarget: "create MemoryCandidate rows",
        noPromotionLine: "No MemoryRecord promotion performed.",
        entriesTitle: "Source decisions:"
      })
    };
  } finally {
    await db.close();
  }
};
