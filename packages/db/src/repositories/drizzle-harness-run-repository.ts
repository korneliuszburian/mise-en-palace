import {
  and,
  asc,
  eq,
  inArray,
  desc,
  sql
} from "drizzle-orm";
import type {
  SQL,
  SQLWrapper
} from "drizzle-orm";
import type {
  ContextAssembly,
  EvidenceBundle,
  EvidenceCommand,
  ExecutionRun,
  FeedbackDelta,
  HarnessPlan,
  EvidenceCommandReadback,
  OperatorIntent,
  ReviewAssessment,
  TaskContract
} from "@krn/core";
import {
  toEvidenceCommandReadback,
  readMetadataString
} from "@krn/core";
import {
  parseEvidenceCaptureInput
} from "@krn/core";
import type {
  CreateContextAssemblyInput,
  CreateEvidenceBundleInput,
  CreateEvalFeedbackDeltaOnceInput,
  CreateEvalFeedbackDeltaOnceResult,
  CreateExecutionRunInput,
  CreateFeedbackDeltaInput,
  FeedbackSubjectReference,
  CreateHarnessPlanInput,
  CreateOperatorIntentInput,
  CreateReviewAssessmentInput,
  CreateTaskContractInput,
  HarnessRunAggregate,
  HarnessRunRepository,
  ListFeedbackDeltasForSubjectsInput,
  UpdateExecutionRunStatusInput
} from "@krn/core/repositories/internal";

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
  activationDecisions,
  retrievalCandidates
} from "../schema/retrieval.js";
import {
  fromIsoTimestamp,
  requireReturnedRow
} from "./repository-value-readers.js";
import {
  mapActivationDecision,
  mapContextAssembly,
  mapEvidenceBundle,
  mapExecutionRun,
  mapFeedbackDelta,
  mapHarnessPlan,
  mapOperatorIntent,
  mapRetrievalCandidate,
  mapRunEvent,
  mapReviewAssessment,
  mapTaskContract
} from "./mappers.js";

const requireLinkedRow = <T>(row: T | undefined, operation: string): T => {
  if (row === undefined) {
    throw new Error(`${operation} did not find a linked row`);
  }

  return row;
};

export const evidenceCommandsForPersistence = (
  commands: readonly EvidenceCommand[]
): EvidenceCommandReadback[] =>
  commands.map(toEvidenceCommandReadback);

const feedbackMetadataSubjectMatch = (
  field: "knowledgeId" | "sourceClaimId" | "sourceDecisionId",
  id: string
): SQL => {
  switch (field) {
    case "knowledgeId":
      return sql`exists (
        select 1
        from jsonb_array_elements(
          coalesce(${feedbackDeltas.metadata}->'knowledgeUsefulnessOutcomes', '[]'::jsonb)
        ) as outcome
        where outcome->>'knowledgeId' = ${id}
      )`;
    case "sourceClaimId":
      return sql`exists (
        select 1
        from jsonb_array_elements(
          coalesce(${feedbackDeltas.metadata}->'sourceUsefulnessOutcomes', '[]'::jsonb)
        ) as outcome
        where outcome->>'sourceClaimId' = ${id}
      )`;
    case "sourceDecisionId":
      return sql`exists (
        select 1
        from jsonb_array_elements(
          coalesce(${feedbackDeltas.metadata}->'sourceUsefulnessOutcomes', '[]'::jsonb)
        ) as outcome
        where outcome->>'sourceDecisionId' = ${id}
      )`;
  }
};

const feedbackMetadataCandidateMatch = (
  field: "sourceClaimCandidates" | "sourceDecisionCandidates",
  id: string
): SQL => {
  const candidates = field === "sourceClaimCandidates"
    ? sql`coalesce(${feedbackDeltas.metadata}->'sourceClaimCandidates', '[]'::jsonb)`
    : sql`coalesce(${feedbackDeltas.metadata}->'sourceDecisionCandidates', '[]'::jsonb)`;

  return sql`exists (
    select 1
    from jsonb_array_elements(${candidates}) as candidate
    where candidate->>'id' = ${id}
  )`;
};

const feedbackMemorySourceClaimMatch = (id: string): SQL => sql`exists (
  select 1
  from jsonb_array_elements(coalesce(${feedbackDeltas.memoryCandidates}, '[]'::jsonb)) as candidate,
       jsonb_array_elements_text(coalesce(candidate->'sourceClaimIds', '[]'::jsonb)) as source_claim_id
  where source_claim_id = ${id}
)`;

const feedbackJsonCandidateSubjectMatch = (
  column: SQLWrapper,
  id: string
): SQL => sql`exists (
  select 1
  from jsonb_array_elements(coalesce(${column}, '[]'::jsonb)) as candidate
  where candidate->>'id' = ${id}
)`;

const feedbackSubjectMatch = (subject: FeedbackSubjectReference): SQL => {
  switch (subject.kind) {
    case "knowledge":
      return feedbackMetadataSubjectMatch("knowledgeId", subject.id);
    case "memory_record": {
      const knowledgeMatch = feedbackMetadataSubjectMatch("knowledgeId", subject.id);
      const candidateMatch = feedbackJsonCandidateSubjectMatch(
        feedbackDeltas.memoryCandidates,
        subject.id
      );

      return sql`(${knowledgeMatch}) or (${candidateMatch})`;
    }
    case "source_claim":
      return sql`(
        ${feedbackMetadataSubjectMatch("sourceClaimId", subject.id)}
      ) or (
        ${feedbackMetadataCandidateMatch("sourceClaimCandidates", subject.id)}
      ) or (
        ${feedbackMemorySourceClaimMatch(subject.id)}
      )`;
    case "source_decision": {
      const usefulnessMatch = feedbackMetadataSubjectMatch("sourceDecisionId", subject.id);
      const proposalMatch = feedbackMetadataCandidateMatch("sourceDecisionCandidates", subject.id);
      const candidateMatch = feedbackJsonCandidateSubjectMatch(
        feedbackDeltas.sourceDecisions,
        subject.id
      );

      return sql`(${usefulnessMatch}) or (${proposalMatch}) or (${candidateMatch})`;
    }
  }
};

export const validateEvidenceBundleInputForPersistence = (
  input: CreateEvidenceBundleInput
): CreateEvidenceBundleInput => {
  const parsed = parseEvidenceCaptureInput({
    changedFiles: input.changedFiles,
    commands: input.commands,
    diffRisk: input.diffRisk,
    reviewBurden: input.reviewBurden,
    rollbackPath: input.rollbackPath,
    metadata: input.metadata ?? {}
  });

  return {
    ...input,
    changedFiles: parsed.changedFiles,
    commands: parsed.commands,
    diffRisk: parsed.diffRisk,
    reviewBurden: parsed.reviewBurden,
    rollbackPath: parsed.rollbackPath,
    metadata: parsed.metadata
  };
};

const insertEvidenceBundleAndEvent = async (
  tx: KrnDatabase,
  input: CreateEvidenceBundleInput,
  operation: string
) => {
  const row = requireReturnedRow(
    await tx
      .insert(evidenceBundles)
      .values({
        executionRunId: input.executionRunId,
        status: input.status ?? "captured",
        changedFiles: input.changedFiles,
        commands: evidenceCommandsForPersistence(input.commands),
        diffRisk: input.diffRisk,
        reviewBurden: input.reviewBurden,
        rollbackPath: input.rollbackPath,
        metadata: input.metadata ?? {}
      })
      .returning(),
    operation
  );

  await tx.insert(runEvents).values({
    executionRunId: input.executionRunId,
    sequence: input.event.sequence,
    type: input.event.type,
    severity: input.event.severity ?? "info",
    message: input.event.message,
    payload: input.event.payload ?? {}
  });

  return row;
};

export class DrizzleHarnessRunRepository implements HarnessRunRepository {
  constructor(private readonly db: KrnDatabase) {}

  private async findHarnessRunSpineRows(executionRunId: string) {
    const executionRunRow = await this.db.query.executionRuns.findFirst({
      where: eq(executionRuns.id, executionRunId)
    });

    if (executionRunRow === undefined) {
      return undefined;
    }

    const harnessPlanRow = requireLinkedRow(
      await this.db.query.harnessPlans.findFirst({
        where: eq(harnessPlans.id, executionRunRow.harnessPlanId)
      }),
      "getHarnessRunByExecutionRunId.harnessPlan"
    );
    const taskContractRow = requireLinkedRow(
      await this.db.query.taskContracts.findFirst({
        where: eq(taskContracts.id, harnessPlanRow.taskContractId)
      }),
      "getHarnessRunByExecutionRunId.taskContract"
    );
    const operatorIntentRow = requireLinkedRow(
      await this.db.query.operatorIntents.findFirst({
        where: eq(operatorIntents.id, taskContractRow.operatorIntentId)
      }),
      "getHarnessRunByExecutionRunId.operatorIntent"
    );

    return {
      executionRunRow,
      harnessPlanRow,
      taskContractRow,
      operatorIntentRow
    };
  }

  private async findEvidenceReviewFeedbackRows(executionRunId: string) {
    const evidenceBundleRows = await this.db.query.evidenceBundles.findMany({
      where: eq(evidenceBundles.executionRunId, executionRunId)
    });
    const evidenceBundleIds = evidenceBundleRows.map((row) => row.id);
    const reviewAssessmentRows =
      evidenceBundleIds.length === 0
        ? []
        : await this.db.query.reviewAssessments.findMany({
            where: inArray(reviewAssessments.evidenceBundleId, evidenceBundleIds)
          });
    const reviewAssessmentIds = reviewAssessmentRows.map((row) => row.id);
    const feedbackDeltaRows =
      reviewAssessmentIds.length === 0
        ? []
        : await this.db.query.feedbackDeltas.findMany({
            where: inArray(feedbackDeltas.reviewAssessmentId, reviewAssessmentIds)
          });

    return {
      evidenceBundleRows,
      reviewAssessmentRows,
      feedbackDeltaRows
    };
  }

  private async findActivationTrace(contextAssembly: ContextAssembly | undefined) {
    if (contextAssembly === undefined) {
      return undefined;
    }

    const retrievalRunId = readMetadataString(contextAssembly.metadata, "retrievalRunId");

    if (retrievalRunId === undefined) {
      return undefined;
    }

    const retrievalCandidateRows = await this.db.query.retrievalCandidates.findMany({
      where: eq(retrievalCandidates.retrievalRunId, retrievalRunId)
    });
    const activationDecisionRows = await this.db.query.activationDecisions.findMany({
      where: eq(activationDecisions.retrievalRunId, retrievalRunId)
    });

    return {
      retrievalRunId,
      candidates: retrievalCandidateRows.map(mapRetrievalCandidate),
      decisions: activationDecisionRows.map(mapActivationDecision)
    };
  }

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
    const evidenceInput = validateEvidenceBundleInputForPersistence(input);

    return this.db.transaction(async (tx) => {
      const row = await insertEvidenceBundleAndEvent(tx, evidenceInput, "createEvidenceBundle");

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

      return mapFeedbackDelta(row);
    });
  }

  async createEvalFeedbackDeltaOnce(
    input: CreateEvalFeedbackDeltaOnceInput
  ): Promise<CreateEvalFeedbackDeltaOnceResult> {
    const executionIdentity = input.executionIdentity.trim();

    if (executionIdentity.length === 0) {
      throw new Error("createEvalFeedbackDeltaOnce requires execution identity");
    }

    return this.db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtextextended(${executionIdentity}, 0))`
      );

      const existingEvidenceBundleRow = await tx.query.evidenceBundles.findFirst({
        where: and(
          eq(evidenceBundles.executionRunId, input.executionRunId),
          sql`${evidenceBundles.metadata} ->> 'evalExecutionIdentity' = ${executionIdentity}`
        )
      });

      if (existingEvidenceBundleRow !== undefined) {
        const existingReviewAssessmentRow = await tx.query.reviewAssessments.findFirst({
          where: eq(reviewAssessments.evidenceBundleId, existingEvidenceBundleRow.id)
        });

        if (existingReviewAssessmentRow === undefined) {
          throw new Error(
            `Eval feedback persistence is incomplete for ${executionIdentity}: review assessment missing`
          );
        }

        const existingFeedbackDeltaRow = await tx.query.feedbackDeltas.findFirst({
          where: eq(feedbackDeltas.reviewAssessmentId, existingReviewAssessmentRow.id)
        });

        if (existingFeedbackDeltaRow === undefined) {
          throw new Error(
            `Eval feedback persistence is incomplete for ${executionIdentity}: feedback delta missing`
          );
        }

        return {
          evidenceBundle: mapEvidenceBundle(existingEvidenceBundleRow),
          reviewAssessment: mapReviewAssessment(existingReviewAssessmentRow),
          feedbackDelta: mapFeedbackDelta(existingFeedbackDeltaRow),
          created: false
        };
      }

      const evidenceInput = validateEvidenceBundleInputForPersistence({
        ...input.evidence,
        executionRunId: input.executionRunId,
        metadata: {
          ...(input.evidence.metadata ?? {}),
          evalExecutionIdentity: executionIdentity,
          projectId: input.projectId
        }
      });
      const evidenceBundleRow = await insertEvidenceBundleAndEvent(
        tx,
        evidenceInput,
        "createEvalFeedbackDeltaOnce.evidenceBundle"
      );

      const reviewAssessmentRow = requireReturnedRow(
        await tx
          .insert(reviewAssessments)
          .values({
            evidenceBundleId: evidenceBundleRow.id,
            status: input.review.status ?? "pending",
            reviewer: input.review.reviewer,
            summary: input.review.summary,
            findings: input.review.findings,
            metadata: input.review.metadata ?? {}
          })
          .returning(),
        "createEvalFeedbackDeltaOnce.reviewAssessment"
      );
      const feedbackDeltaRow = requireReturnedRow(
        await tx
          .insert(feedbackDeltas)
          .values({
            reviewAssessmentId: reviewAssessmentRow.id,
            status: input.feedback.status ?? "candidate",
            memoryCandidates: input.feedback.memoryCandidates,
            sourceDecisions: input.feedback.sourceDecisions,
            evalCandidates: input.feedback.evalCandidates,
            metadata: input.feedback.metadata ?? {}
          })
          .returning(),
        "createEvalFeedbackDeltaOnce.feedbackDelta"
      );

      await tx.insert(outboxEvents).values({
        topic: "feedback.delta.created",
        payload: {
          feedbackDeltaId: feedbackDeltaRow.id,
          reviewAssessmentId: reviewAssessmentRow.id,
          evalExecutionIdentity: executionIdentity,
          projectId: input.projectId
        }
      });

      return {
        evidenceBundle: mapEvidenceBundle(evidenceBundleRow),
        reviewAssessment: mapReviewAssessment(reviewAssessmentRow),
        feedbackDelta: mapFeedbackDelta(feedbackDeltaRow),
        created: true
      };
    });
  }

  async listFeedbackDeltasForProject(projectId: string, limit = 100): Promise<FeedbackDelta[]> {
    const rows = await this.db
      .select({ feedbackDelta: feedbackDeltas })
      .from(feedbackDeltas)
      .innerJoin(
        reviewAssessments,
        eq(feedbackDeltas.reviewAssessmentId, reviewAssessments.id)
      )
      .innerJoin(
        evidenceBundles,
        eq(reviewAssessments.evidenceBundleId, evidenceBundles.id)
      )
      .innerJoin(
        executionRuns,
        eq(evidenceBundles.executionRunId, executionRuns.id)
      )
      .innerJoin(
        harnessPlans,
        eq(executionRuns.harnessPlanId, harnessPlans.id)
      )
      .innerJoin(
        taskContracts,
        eq(harnessPlans.taskContractId, taskContracts.id)
      )
      .where(eq(taskContracts.projectId, projectId))
      .orderBy(desc(feedbackDeltas.createdAt))
      .limit(limit);

    return rows.map((row) => mapFeedbackDelta(row.feedbackDelta));
  }

  async listFeedbackDeltasForSubjects(
    input: ListFeedbackDeltasForSubjectsInput
  ): Promise<FeedbackDelta[]> {
    const limitPerSubject = input.limitPerSubject ?? 100;

    if (!Number.isInteger(limitPerSubject) || limitPerSubject <= 0) {
      return [];
    }

    const subjects = [...new Map(
      input.subjects
        .map((subject) => ({
          kind: subject.kind,
          id: subject.id.trim()
        }))
        .filter((subject) => subject.id.length > 0)
        .map((subject) => [`${subject.kind}:${subject.id}`, subject] as const)
    ).values()];

    if (subjects.length === 0) {
      return [];
    }

    const rowsBySubject = await Promise.all(subjects.map((subject) =>
      this.db
        .select({ feedbackDelta: feedbackDeltas })
        .from(feedbackDeltas)
        .innerJoin(
          reviewAssessments,
          eq(feedbackDeltas.reviewAssessmentId, reviewAssessments.id)
        )
        .innerJoin(
          evidenceBundles,
          eq(reviewAssessments.evidenceBundleId, evidenceBundles.id)
        )
        .innerJoin(
          executionRuns,
          eq(evidenceBundles.executionRunId, executionRuns.id)
        )
        .innerJoin(
          harnessPlans,
          eq(executionRuns.harnessPlanId, harnessPlans.id)
        )
        .innerJoin(
          taskContracts,
          eq(harnessPlans.taskContractId, taskContracts.id)
        )
        .where(and(
          eq(taskContracts.projectId, input.projectId),
          feedbackSubjectMatch(subject)
        ))
        .orderBy(desc(feedbackDeltas.createdAt), desc(feedbackDeltas.id))
        .limit(limitPerSubject)
    ));
    const uniqueRows = new Map<string, (typeof rowsBySubject)[number][number]["feedbackDelta"]>();

    for (const rows of rowsBySubject) {
      for (const row of rows) {
        uniqueRows.set(row.feedbackDelta.id, row.feedbackDelta);
      }
    }

    return [...uniqueRows.values()]
      .sort((left, right) => {
        const createdAtDifference = right.createdAt.getTime() - left.createdAt.getTime();

        return createdAtDifference === 0
          ? right.id.localeCompare(left.id)
          : createdAtDifference;
      })
      .map(mapFeedbackDelta);
  }

  async getHarnessRunByExecutionRunId(
    executionRunId: string
  ): Promise<HarnessRunAggregate | undefined> {
    const spineRows = await this.findHarnessRunSpineRows(executionRunId);

    if (spineRows === undefined) {
      return undefined;
    }

    const contextAssemblyRow = await this.db.query.contextAssemblies.findFirst({
      where: eq(contextAssemblies.harnessPlanId, spineRows.harnessPlanRow.id)
    });
    const {
      evidenceBundleRows,
      reviewAssessmentRows,
      feedbackDeltaRows
    } = await this.findEvidenceReviewFeedbackRows(executionRunId);
    const runEventRows = await this.db.query.runEvents.findMany({
      where: eq(runEvents.executionRunId, executionRunId),
      orderBy: asc(runEvents.sequence)
    });
    const contextAssembly =
      contextAssemblyRow === undefined ? undefined : mapContextAssembly(contextAssemblyRow);
    const activationTrace = await this.findActivationTrace(contextAssembly);

    return {
      operatorIntent: mapOperatorIntent(spineRows.operatorIntentRow),
      taskContract: mapTaskContract(spineRows.taskContractRow),
      harnessPlan: mapHarnessPlan(spineRows.harnessPlanRow),
      ...(contextAssembly === undefined ? {} : { contextAssembly }),
      ...(activationTrace === undefined ? {} : { activationTrace }),
      executionRun: mapExecutionRun(spineRows.executionRunRow),
      evidenceBundles: evidenceBundleRows.map(mapEvidenceBundle),
      reviewAssessments: reviewAssessmentRows.map(mapReviewAssessment),
      feedbackDeltas: feedbackDeltaRows.map(mapFeedbackDelta),
      runEvents: runEventRows.map(mapRunEvent)
    };
  }
}
