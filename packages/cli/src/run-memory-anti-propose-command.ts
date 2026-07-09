import type {
  ProjectId
} from "@krn/core";
import {
  rankSourceAuthority
} from "@krn/core";
import type {
  CreateAntiMemoryCandidateInput,
  RejectedSourceDecisionKnowledgeSource
} from "@krn/core/repositories";

import type { BaseCommandRuntime } from "./command-runtime-support.js";
import {
  createMemoryCommandDatabaseRuntime
} from "./memory-command-support.js";
import type { CreateMemoryCommandDatabaseRuntime } from "./memory-command-support.js";
import {
  formatSourceDecisionProposalResult,
  proposeSourceDecisionCandidates,
  sourceDecisionIdsFromMetadata
} from "./memory-proposal-command-support.js";
import type { CliCommand } from "./parse-args.js";

type MemoryAntiProposeCommand = Extract<CliCommand, { kind: "memoryAntiPropose" }>;

export interface MemoryAntiProposeCommandRuntime extends BaseCommandRuntime {
  command: MemoryAntiProposeCommand;
  createDatabaseRuntime?: CreateMemoryCommandDatabaseRuntime;
}

export interface MemoryAntiProposeCommandResult {
  stdout: string;
}

const PROPOSED_BY = "krn memory anti propose";
const DUPLICATE_SCAN_LIMIT = 1000;
const DEFAULT_REJECTED_SOURCE_DECISION_LIMIT = 25;

export const rejectedSourceDecisionToAntiMemoryCandidateInput = (
  source: RejectedSourceDecisionKnowledgeSource,
  projectId: ProjectId,
  now: string
): CreateAntiMemoryCandidateInput => ({
  projectId,
  proposedBy: PROPOSED_BY,
  key: `rejected-source-decision:${source.sourceDecision.id}`,
  rejectedClaim: source.sourceRejection.attemptedClaim,
  reason: source.sourceRejection.reason,
  invalidatedBySourceClaimIds: [source.sourceClaim.id],
  appliesTo: source.sourceDecision.consumer,
  summary: source.sourceRejection.title,
  body: [
    source.sourceRejection.attemptedClaim,
    "",
    `Rejected because: ${source.sourceRejection.reason}`,
    `Mechanism: ${source.sourceClaim.mechanism}`,
    `KRN implication: ${source.sourceClaim.krnImplication}`,
    `Decision rationale: ${source.sourceDecision.rationale}`
  ].join("\n"),
  owner: source.sourceDecision.consumer,
  confidence: Math.min(100, rankSourceAuthority(source.sourceClaim.sourceAuthority)),
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
      sourceId: source.sourceRejection.id,
      note: source.sourceRejection.reason
    }
  ],
  validFrom: now,
  metadata: {
    source: "rejected_source_decision_anti_memory_proposal",
    sourceDecisionId: source.sourceDecision.id,
    sourceRejectionId: source.sourceRejection.id,
    sourceClaimId: source.sourceClaim.id,
    rejectedBecause: source.sourceRejection.rejectedBecause,
    sourceAuthority: source.sourceClaim.sourceAuthority,
    supportType: source.sourceClaim.supportType,
    mechanism: source.sourceClaim.mechanism,
    krnImplication: source.sourceClaim.krnImplication,
    consumer: source.sourceDecision.consumer,
    falsifier: source.sourceDecision.falsifier,
    doesNotProve: source.sourceRejection.doesNotProve
  }
});

export const runMemoryAntiProposeCommand = async (
  runtime: MemoryAntiProposeCommandRuntime
): Promise<MemoryAntiProposeCommandResult> => {
  const db = await createMemoryCommandDatabaseRuntime(
    runtime,
    "KRN_DATABASE_URL is required for krn memory anti propose"
  );

  try {
    const projectId = runtime.command.projectId ?? db.projectId;
    const limit = runtime.command.limit ?? DEFAULT_REJECTED_SOURCE_DECISION_LIMIT;

    if (db.sourceRepository.listRejectedSourceDecisionKnowledgeSources === undefined) {
      throw new Error("Rejected SourceDecision anti-memory proposal read model is unavailable");
    }

    if (db.memoryRepository.listAntiMemoryCandidates === undefined) {
      throw new Error("AntiMemoryCandidate duplicate read model is unavailable");
    }

    if (db.memoryRepository.listAntiMemoryForProject === undefined) {
      throw new Error("AntiMemoryRecord duplicate read model is unavailable");
    }

    const sources = await db.sourceRepository.listRejectedSourceDecisionKnowledgeSources(
      projectId,
      limit
    );
    const existingCandidates = await db.memoryRepository.listAntiMemoryCandidates(
      projectId,
      DUPLICATE_SCAN_LIMIT
    );
    const existingRecords = await db.memoryRepository.listAntiMemoryForProject(
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
      summarize: (source) => source.sourceRejection.title,
      createCandidate: (source) =>
        db.memoryRepository.createAntiMemoryCandidate(
          rejectedSourceDecisionToAntiMemoryCandidateInput(source, projectId, runtime.now())
        )
    });

    return {
      stdout: formatSourceDecisionProposalResult({
        title: "KRN Memory Anti Propose",
        projectId,
        sourceCountLabel: "Rejected source decisions read",
        sourceCount: sources.length,
        proposed,
        persist: runtime.command.persist,
        previewTarget: "create AntiMemoryCandidate rows",
        noPromotionLine: "No AntiMemoryRecord promotion performed.",
        entriesTitle: "Rejected source decisions:"
      })
    };
  } finally {
    await db.close();
  }
};
