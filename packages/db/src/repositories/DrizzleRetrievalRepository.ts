import { eq } from "drizzle-orm";
import type {
  ActivationDecisionRecord,
  AddRetrievalCandidateInput,
  CompleteRetrievalRunInput,
  RecordActivationDecisionInput,
  RetrievalCandidateRecord,
  RetrievalRepository,
  RetrievalRunRecord,
  StartRetrievalRunInput,
  StoreContextSelectionInput
} from "@krn/harness";

import type { KrnDatabase } from "../database.js";
import {
  activationDecisions,
  contextExclusions,
  contextItems,
  retrievalCandidates,
  retrievalRuns
} from "../schema/index.js";
import {
  fromIsoTimestamp,
  requireReturnedRow
} from "./common.js";
import {
  mapActivationDecision,
  mapRetrievalCandidate,
  mapRetrievalRun
} from "./mappers.js";

const contextExclusionReasons = new Set([
  "stale",
  "invalidated",
  "low_trust",
  "low_context_roi",
  "over_budget",
  "duplicate",
  "irrelevant",
  "unsafe",
  "superseded"
] as const);

type ContextExclusionReason = typeof contextExclusionReasons extends Set<infer T> ? T : never;

const toContextExclusionReason = (reason: string): ContextExclusionReason => {
  if (contextExclusionReasons.has(reason as ContextExclusionReason)) {
    return reason as ContextExclusionReason;
  }

  return "irrelevant";
};

export class DrizzleRetrievalRepository implements RetrievalRepository {
  constructor(private readonly db: KrnDatabase) {}

  async startRetrievalRun(input: StartRetrievalRunInput): Promise<RetrievalRunRecord> {
    const row = requireReturnedRow(
      await this.db
        .insert(retrievalRuns)
        .values({
          ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
          ...(input.taskContractId === undefined ? {} : { taskContractId: input.taskContractId }),
          query: input.query,
          ...(input.tokenBudget === undefined ? {} : { tokenBudget: input.tokenBudget }),
          metadataFilters: input.metadataFilters ?? {},
          metadata: input.metadata ?? {}
        })
        .returning(),
      "startRetrievalRun"
    );

    return mapRetrievalRun(row);
  }

  async completeRetrievalRun(input: CompleteRetrievalRunInput): Promise<RetrievalRunRecord> {
    const row = requireReturnedRow(
      await this.db
        .update(retrievalRuns)
        .set({
          status: input.status,
          completedAt: fromIsoTimestamp(input.completedAt),
          ...(input.metadata === undefined ? {} : { metadata: input.metadata })
        })
        .where(eq(retrievalRuns.id, input.retrievalRunId))
        .returning(),
      "completeRetrievalRun"
    );

    return mapRetrievalRun(row);
  }

  async addCandidate(input: AddRetrievalCandidateInput): Promise<RetrievalCandidateRecord> {
    const row = requireReturnedRow(
      await this.db
        .insert(retrievalCandidates)
        .values({
          retrievalRunId: input.retrievalRunId,
          kind: input.kind,
          status: input.status ?? "candidate",
          subjectType: input.subjectType,
          subjectId: input.subjectId,
          trustTier: input.trustTier,
          ...(input.lexicalScore === undefined ? {} : { lexicalScore: input.lexicalScore }),
          ...(input.vectorScore === undefined ? {} : { vectorScore: input.vectorScore }),
          ...(input.graphScore === undefined ? {} : { graphScore: input.graphScore }),
          ...(input.temporalScore === undefined ? {} : { temporalScore: input.temporalScore }),
          ...(input.contextRoiScore === undefined
            ? {}
            : { contextRoiScore: input.contextRoiScore }),
          ...(input.totalScore === undefined ? {} : { totalScore: input.totalScore }),
          reason: input.reason,
          metadata: input.metadata ?? {}
        })
        .returning(),
      "addRetrievalCandidate"
    );

    return mapRetrievalCandidate(row);
  }

  async recordActivationDecision(
    input: RecordActivationDecisionInput
  ): Promise<ActivationDecisionRecord> {
    const row = requireReturnedRow(
      await this.db
        .insert(activationDecisions)
        .values({
          retrievalRunId: input.retrievalRunId,
          ...(input.contextAssemblyId === undefined
            ? {}
            : { contextAssemblyId: input.contextAssemblyId }),
          subjectType: input.subjectType,
          subjectId: input.subjectId,
          decision: input.decision,
          reason: input.reason,
          ...(input.score === undefined ? {} : { score: input.score }),
          metadata: input.metadata ?? {}
        })
        .returning(),
      "recordActivationDecision"
    );

    return mapActivationDecision(row);
  }

  async storeContextSelection(input: StoreContextSelectionInput): Promise<void> {
    await this.db.transaction(async (tx) => {
      if (input.inclusions.length > 0) {
        await tx.insert(contextItems).values(
          input.inclusions.map((inclusion, index) => ({
            contextAssemblyId: input.contextAssemblyId,
            subjectType: inclusion.subjectType,
            subjectId: inclusion.subjectId,
            position: index + 1,
            reason: inclusion.reason,
            expectedUse: inclusion.expectedUse,
            ...(inclusion.tokenEstimate === undefined
              ? {}
              : { tokenEstimate: inclusion.tokenEstimate }),
            trustTier: inclusion.trustTier,
            metadata: {}
          }))
        );
      }

      if (input.exclusions.length > 0) {
        await tx.insert(contextExclusions).values(
          input.exclusions.map((exclusion) => ({
            contextAssemblyId: input.contextAssemblyId,
            subjectType: exclusion.subjectType,
            subjectId: exclusion.subjectId,
            reason: toContextExclusionReason(exclusion.reason),
            explanation: exclusion.explanation,
            ...(exclusion.score === undefined ? {} : { score: exclusion.score }),
            trustTier: exclusion.trustTier,
            metadata: {
              originalReason: exclusion.reason
            }
          }))
        );
      }
    });
  }
}
