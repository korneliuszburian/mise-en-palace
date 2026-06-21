import { eq } from "drizzle-orm";
import type {
  ContextAssembly,
  EvidenceBundle,
  ExecutionRun,
  FeedbackDelta,
  HarnessPlan,
  OperatorIntent,
  ReviewAssessment,
  TaskContract
} from "@krn/core";
import type {
  CreateContextAssemblyInput,
  CreateEvidenceBundleInput,
  CreateExecutionRunInput,
  CreateFeedbackDeltaInput,
  CreateHarnessPlanInput,
  CreateOperatorIntentInput,
  CreateReviewAssessmentInput,
  CreateTaskContractInput,
  HarnessRunRepository,
  UpdateExecutionRunStatusInput
} from "@krn/harness";

import type { KrnDatabase } from "../database.js";
import {
  contextAssemblies,
  evidenceBundles,
  executionRuns,
  feedbackDeltas,
  harnessPlans,
  operatorIntents,
  outboxEvents,
  reviewAssessments,
  runEvents,
  taskContracts
} from "../schema/index.js";
import {
  fromIsoTimestamp,
  requireReturnedRow
} from "./common.js";
import {
  mapContextAssembly,
  mapEvidenceBundle,
  mapExecutionRun,
  mapFeedbackDelta,
  mapHarnessPlan,
  mapOperatorIntent,
  mapReviewAssessment,
  mapTaskContract
} from "./mappers.js";

export class DrizzleHarnessRunRepository implements HarnessRunRepository {
  constructor(private readonly db: KrnDatabase) {}

  async createOperatorIntent(input: CreateOperatorIntentInput): Promise<OperatorIntent> {
    const row = requireReturnedRow(
      await this.db
        .insert(operatorIntents)
        .values({
          workspaceId: input.workspaceId,
          ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
          source: input.source,
          rawIntent: input.rawIntent,
          ...(input.normalizedIntent === undefined
            ? {}
            : { normalizedIntent: input.normalizedIntent }),
          metadata: input.metadata ?? {}
        })
        .returning(),
      "createOperatorIntent"
    );

    return mapOperatorIntent(row);
  }

  async createTaskContract(input: CreateTaskContractInput): Promise<TaskContract> {
    const row = requireReturnedRow(
      await this.db
        .insert(taskContracts)
        .values({
          operatorIntentId: input.operatorIntentId,
          ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
          title: input.title,
          objective: input.objective,
          constraints: input.constraints,
          nonGoals: input.nonGoals,
          acceptance: input.acceptance,
          status: "active",
          metadata: input.metadata ?? {}
        })
        .returning(),
      "createTaskContract"
    );

    return mapTaskContract(row);
  }

  async createHarnessPlan(input: CreateHarnessPlanInput): Promise<HarnessPlan> {
    const row = requireReturnedRow(
      await this.db
        .insert(harnessPlans)
        .values({
          taskContractId: input.taskContractId,
          version: input.version,
          status: input.status ?? "draft",
          summary: input.summary,
          ...(input.nextAction === undefined ? {} : { nextAction: input.nextAction }),
          metadata: input.metadata ?? {}
        })
        .returning(),
      "createHarnessPlan"
    );

    return mapHarnessPlan(row);
  }

  async createContextAssembly(input: CreateContextAssemblyInput): Promise<ContextAssembly> {
    const row = requireReturnedRow(
      await this.db
        .insert(contextAssemblies)
        .values({
          harnessPlanId: input.harnessPlanId,
          status: input.status ?? "assembled",
          ...(input.tokenBudget === undefined ? {} : { tokenBudget: input.tokenBudget }),
          inclusionCount: input.inclusions.length,
          exclusionCount: input.exclusions.length,
          selectedContext: {
            inclusions: input.inclusions
          },
          excludedContext: {
            exclusions: input.exclusions
          },
          metadata: input.metadata ?? {}
        })
        .returning(),
      "createContextAssembly"
    );

    return mapContextAssembly(row);
  }

  async createExecutionRun(input: CreateExecutionRunInput): Promise<ExecutionRun> {
    return this.db.transaction(async (tx) => {
      const row = requireReturnedRow(
        await tx
          .insert(executionRuns)
          .values({
            harnessPlanId: input.harnessPlanId,
            adapter: input.adapter,
            status: input.status ?? "planned",
            ...(input.startedAt === undefined
              ? {}
              : { startedAt: fromIsoTimestamp(input.startedAt) }),
            metadata: input.metadata ?? {}
          })
          .returning(),
        "createExecutionRun"
      );

      await tx.insert(runEvents).values({
        executionRunId: row.id,
        sequence: input.initialEvent.sequence,
        type: input.initialEvent.type,
        severity: input.initialEvent.severity ?? "info",
        message: input.initialEvent.message,
        payload: input.initialEvent.payload ?? {}
      });

      return mapExecutionRun(row);
    });
  }

  async updateExecutionRunStatus(input: UpdateExecutionRunStatusInput): Promise<ExecutionRun> {
    return this.db.transaction(async (tx) => {
      const row = requireReturnedRow(
        await tx
          .update(executionRuns)
          .set({
            status: input.status,
            ...(input.completedAt === undefined
              ? {}
              : { completedAt: fromIsoTimestamp(input.completedAt) }),
            ...(input.metadata === undefined ? {} : { metadata: input.metadata })
          })
          .where(eq(executionRuns.id, input.executionRunId))
          .returning(),
        "updateExecutionRunStatus"
      );

      await tx.insert(runEvents).values({
        executionRunId: row.id,
        sequence: input.event.sequence,
        type: input.event.type,
        severity: input.event.severity ?? "info",
        message: input.event.message,
        payload: input.event.payload ?? {}
      });

      return mapExecutionRun(row);
    });
  }

  async createEvidenceBundle(input: CreateEvidenceBundleInput): Promise<EvidenceBundle> {
    return this.db.transaction(async (tx) => {
      const row = requireReturnedRow(
        await tx
          .insert(evidenceBundles)
          .values({
            executionRunId: input.executionRunId,
            status: input.status ?? "captured",
            changedFiles: input.changedFiles,
            commands: input.commands,
            diffRisk: input.diffRisk,
            reviewBurden: input.reviewBurden,
            rollbackPath: input.rollbackPath,
            metadata: input.metadata ?? {}
          })
          .returning(),
        "createEvidenceBundle"
      );

      await tx.insert(runEvents).values({
        executionRunId: input.executionRunId,
        sequence: input.event.sequence,
        type: input.event.type,
        severity: input.event.severity ?? "info",
        message: input.event.message,
        payload: input.event.payload ?? {}
      });

      return mapEvidenceBundle(row);
    });
  }

  async createReviewAssessment(input: CreateReviewAssessmentInput): Promise<ReviewAssessment> {
    const row = requireReturnedRow(
      await this.db
        .insert(reviewAssessments)
        .values({
          evidenceBundleId: input.evidenceBundleId,
          status: input.status ?? "pending",
          reviewer: input.reviewer,
          summary: input.summary,
          findings: input.findings,
          metadata: input.metadata ?? {}
        })
        .returning(),
      "createReviewAssessment"
    );

    return mapReviewAssessment(row);
  }

  async createFeedbackDelta(input: CreateFeedbackDeltaInput): Promise<FeedbackDelta> {
    return this.db.transaction(async (tx) => {
      const row = requireReturnedRow(
        await tx
          .insert(feedbackDeltas)
          .values({
            reviewAssessmentId: input.reviewAssessmentId,
            status: input.status ?? "candidate",
            memoryCandidates: input.memoryCandidates,
            sourceDecisions: input.sourceDecisions,
            evalCandidates: input.evalCandidates,
            metadata: input.metadata ?? {}
          })
          .returning(),
        "createFeedbackDelta"
      );

      await tx.insert(outboxEvents).values({
        topic: "feedback.delta.created",
        payload: {
          feedbackDeltaId: row.id,
          reviewAssessmentId: row.reviewAssessmentId
        }
      });

      return {
        ...mapFeedbackDelta(row),
        memoryCandidates: input.memoryCandidates,
        sourceDecisions: input.sourceDecisions,
        evalCandidates: input.evalCandidates
      };
    });
  }
}
