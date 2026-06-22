import type {
  ObservationProvenanceKind,
  ObservationSourceRangeType
} from "@krn/core";
import {
  buildObserverInput
} from "@krn/harness";
import {
  createDatabaseRuntime
} from "./databaseRuntime.js";
import type {
  CreateDatabaseRuntime
} from "./runPlanCommand.js";

export interface ObserveCliCommand {
  kind: "observeRun";
  runId: string;
  persist: boolean;
}

export interface ObserveCommandRuntime {
  env: Record<string, string | undefined>;
  now(): string;
  command: ObserveCliCommand;
  createDatabaseRuntime?: CreateDatabaseRuntime;
}

export interface ObserveCommandResult {
  stdout: string;
}

const defaultWorkspaceSlug = "local";
const defaultProjectSlug = "mise-en-palace";

const persistenceLabel = (persist: boolean): string =>
  persist
    ? "enabled (Postgres, explicit --persist)"
    : "disabled (preview only; use --persist to write observations)";

const sourceTypeToProvenance = (
  sourceType: ObservationSourceRangeType
): ObservationProvenanceKind => {
  if (sourceType === "operator_input") {
    return "local_operator_note";
  }

  return sourceType;
};

export const runObserveCommand = async (
  runtime: ObserveCommandRuntime
): Promise<ObserveCommandResult> => {
  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for krn observe --run");
  }

  const createRuntime = runtime.createDatabaseRuntime ?? createDatabaseRuntime;
  const databaseRuntime = await createRuntime({
    databaseUrl,
    workspaceSlug: defaultWorkspaceSlug,
    projectSlug: defaultProjectSlug,
    now: runtime.now,
    createId: () => ""
  });

  try {
    const aggregate = await databaseRuntime.harnessRunRepository
      .getHarnessRunByExecutionRunId(runtime.command.runId);

    if (aggregate === undefined) {
      throw new Error(`No persisted harness run found for --run ${runtime.command.runId}`);
    }

    const observerInput = buildObserverInput({
      executionRunId: aggregate.executionRun.id,
      generatedAt: runtime.now(),
      events: aggregate.runEvents,
      evidenceBundles: aggregate.evidenceBundles,
      reviewAssessments: aggregate.reviewAssessments,
      feedbackDeltas: aggregate.feedbackDeltas
    });
    const lines = [
      "KRN Observe Run",
      `Generated at: ${observerInput.generatedAt}`,
      `Persistence: ${persistenceLabel(runtime.command.persist)}`,
      `Run ID: ${aggregate.executionRun.id}`,
      `Observer input items: ${observerInput.items.length}`,
      `Redactions: ${observerInput.redactions.length}`,
      `Truncations: ${observerInput.truncations.length}`,
      "Memory mutation: none",
      "MemoryRecord created: no"
    ];

    if (!runtime.command.persist) {
      lines.push("Observation group: preview only", "Observation items: preview only");

      return {
        stdout: `${lines.join("\n")}\n`
      };
    }

    if (databaseRuntime.observationRepository === undefined) {
      throw new Error("Observation repository is required for krn observe --run --persist");
    }

    const scope = {
      workspaceId: databaseRuntime.workspaceId,
      projectId: databaseRuntime.projectId,
      executionRunId: aggregate.executionRun.id,
      taskContractId: aggregate.taskContract.id
    };
    const group = await databaseRuntime.observationRepository.createGroup({
      scope,
      title: `Observed run ${aggregate.executionRun.id}`,
      summary: `Deterministic observation staging for ${observerInput.items.length} run evidence items.`,
      source: "krn observe --run",
      metadata: {
        observerInputGeneratedAt: observerInput.generatedAt,
        observerInputCounts: observerInput.counts,
        redactionCount: observerInput.redactions.length,
        truncationCount: observerInput.truncations.length,
        observerRuntime: "deterministic",
        modelCall: false,
        memoryMutation: "none"
      }
    });
    const items = await databaseRuntime.observationRepository.addItems(
      group.id,
      observerInput.items.map((item) => {
        const sourceRange = {
          sourceType: item.sourceType,
          sourceId: item.sourceId,
          executionRunId: aggregate.executionRun.id,
          ...(item.sourceType === "run_event" ? { runEventId: item.sourceId } : {}),
          ...(item.sourceType === "evidence_bundle" ? { evidenceBundleId: item.sourceId } : {}),
          ...(item.sourceType === "review_assessment" ? { reviewAssessmentId: item.sourceId } : {}),
          ...(item.sourceType === "feedback_delta" ? { feedbackDeltaId: item.sourceId } : {}),
          locator: item.locator,
          excerpt: item.text,
          capturedAt: item.observedAt,
          metadata: {
            observerPayload: item.payload
          }
        };

        return {
          kind: "fact",
          status: "candidate",
          priority: item.sourceType === "run_event" ? "medium" : "low",
          confidence: "medium",
          provenanceKind: sourceTypeToProvenance(item.sourceType),
          subject: item.sourceType,
          summary: item.text,
          body: item.payload,
          temporalScope: {
            observedAt: item.observedAt,
            eventTime: item.observedAt,
            ingestedAt: runtime.now(),
            referencedAt: item.observedAt,
            referenceTime: item.observedAt,
            relativeTimeBase: runtime.now()
          },
          sourceRanges: [sourceRange],
          metadata: {
            generatedBy: "krn observe --run",
            observationIsMemory: false,
            sourceLocator: item.locator
          }
        };
      })
    );

    lines.push(
      `Observation group: ${group.id}`,
      `Observation items: ${items.length}`
    );

    return {
      stdout: `${lines.join("\n")}\n`
    };
  } finally {
    await databaseRuntime.close();
  }
};
