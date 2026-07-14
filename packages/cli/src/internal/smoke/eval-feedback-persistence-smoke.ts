import { readFileSync } from "node:fs";
import path from "node:path";
import postgres from "postgres";

import {
  createKrnDatabase
} from "@krn/db";
import {
  cleanupHarnessCompilerSmokeRows,
  createCompiledSmokeExecution,
  createSmokeRuntime,
  requireSmokeReadbackValue,
  assertSmokeReadbackChecks
} from "@krn/db/dev";
import {
  DrizzleHarnessRunRepository
} from "@krn/db/adapters";
import {
  decisionPacketBindingReadbackFromMetadata,
  knowledgeUsefulnessOutcomesFromMetadata,
  sourceUsefulnessOutcomesFromMetadata
} from "@krn/core";

import {
  parseDecisionPacketEvalFixture,
  loadDecisionPacketEvalFixture
} from "../../decision-packet-fixture.js";
import {
  runDecisionPacketEval
} from "../eval/run-decision-packet-eval.js";
import {
  persistDecisionPacketEvalFailures
} from "../eval/run-decision-packet-eval-persistence.js";

export interface EvalFeedbackPersistenceSmokeInput {
  databaseUrl: string;
  migrationsFolder: string;
  repoRoot: string;
  smokeId: string;
}

export interface EvalFeedbackPersistenceSmokeReport {
  smokeId: string;
  projectId: string;
  executionRunId: string;
  failingEvalCandidateCount: number;
  persistedEvalCandidateCount: number;
  firstPersistenceCreated: boolean;
  retryPersistenceCreated: boolean;
  retryFeedbackDeltaId: string;
  readbackFeedbackDeltaId: string;
  passingEvalPersisted: boolean;
  cleanupRemainingMarkerCount: number;
  cleanedUp: boolean;
}

const failingFixture = (repoRoot: string) => {
  const fixturePath = path.join(
    repoRoot,
    "tests/fixtures/notes-baseline/decision-packet-vs-notes.json"
  );
  const rawFixture: unknown = JSON.parse(readFileSync(fixturePath, "utf8"));

  if (typeof rawFixture !== "object" || rawFixture === null || Array.isArray(rawFixture)) {
    throw new Error("Eval feedback persistence smoke fixture must be an object");
  }

  const fixtureRecord = rawFixture as Record<string, unknown>;
  const cases = fixtureRecord["cases"];

  if (!Array.isArray(cases)) {
    throw new Error("Eval feedback persistence smoke fixture must include cases");
  }

  fixtureRecord["cases"] = cases.filter((testCase) =>
    typeof testCase === "object" &&
    testCase !== null &&
    !Array.isArray(testCase) &&
    testCase["expectedEvidenceGap"] === undefined
  );

  return parseDecisionPacketEvalFixture(rawFixture);
};

export const runEvalFeedbackPersistenceSmokeCheck = async (
  input: EvalFeedbackPersistenceSmokeInput
): Promise<EvalFeedbackPersistenceSmokeReport> => {
  const runtime = await createSmokeRuntime({
    databaseUrl: input.databaseUrl,
    migrationsFolder: input.migrationsFolder,
    projectSlug: "eval-feedback-persistence",
    smokeId: input.smokeId,
    smokeName: "eval feedback persistence smoke",
    workspacePrefix: "krn-eval-feedback-persistence-smoke"
  });
  const { client, db, marker, projectSlug, workspaceSlug } = runtime;
  let feedbackDeltaId: string | undefined;
  let retrievalRunId: string | undefined;

  const cleanup = async (): Promise<number> => cleanupHarnessCompilerSmokeRows({
    db,
    feedbackDeltaId,
    marker,
    retrievalRunId,
    workspaceSlug
  });

  try {
    await cleanup();
    const compiled = await createCompiledSmokeExecution({
      acceptance: "persist deterministic eval failures as reviewable candidates",
      command: "db:smoke:eval-feedback-persistence",
      constraints: ["do not promote eval candidates automatically"],
      db,
      includeEvidenceContract: false,
      marker,
      nonGoals: ["do not mutate memory or source authority"],
      projectSlug,
      task: `eval feedback persistence smoke ${marker}`,
      workspaceSlug
    });
    retrievalRunId = compiled.retrievalRunId;
    const failingResult = await runDecisionPacketEval(failingFixture(input.repoRoot));
    if (failingResult.status !== "fail" || failingResult.evalCandidates.length !== 1) {
      throw new Error(
        `Eval feedback persistence smoke fixture expected one failing candidate (status=${failingResult.status}, candidates=${failingResult.evalCandidates.map((candidate) => `${candidate.caseId}:${candidate.failureClass}`).join(",")})`
      );
    }
    const passingResult = await runDecisionPacketEval(
      loadDecisionPacketEvalFixture(
        path.join(input.repoRoot, "tests/fixtures/notes-baseline/decision-packet-vs-notes.json")
      )
    );
    const persistenceInput = {
      result: failingResult,
      executionRunId: compiled.executionRun.id,
      projectId: compiled.project.id,
      evalCommand: "pnpm --filter @krn/cli eval:decision-packet --persist-failures",
      now: "2026-07-09T12:00:00.000Z",
      harnessRunRepository: compiled.harnessRunRepository
    } as const;
    const retryClient = postgres(input.databaseUrl, { max: 1, onnotice: () => undefined });

    try {
      const retryRepository = new DrizzleHarnessRunRepository(createKrnDatabase(retryClient));
      const [firstPersistence, retryPersistence] = await Promise.all([
        persistDecisionPacketEvalFailures(persistenceInput),
        persistDecisionPacketEvalFailures({
          ...persistenceInput,
          harnessRunRepository: retryRepository
        })
      ]);
      feedbackDeltaId = firstPersistence?.feedbackDelta.id;

      if (firstPersistence === undefined || retryPersistence === undefined) {
        throw new Error(
          `Eval feedback persistence smoke did not persist a failing eval (status=${failingResult.status}, candidates=${failingResult.evalCandidates.map((candidate) => `${candidate.id}:${candidate.failureClass}`).join(",")})`
        );
      }

      const passingPersistence = await persistDecisionPacketEvalFailures({
        ...persistenceInput,
        result: passingResult
      });
      const readbackClient = postgres(input.databaseUrl, { max: 1, onnotice: () => undefined });

      try {
        const readbackRepository = new DrizzleHarnessRunRepository(createKrnDatabase(readbackClient));
        const aggregate = await readbackRepository.getHarnessRunByExecutionRunId(
          compiled.executionRun.id
        );
        const readbackFeedbackDelta = aggregate?.feedbackDeltas[0];
        const readbackEvidenceBundle = aggregate?.evidenceBundles[0];

        assertSmokeReadbackChecks([
          {
            label: "failing eval has typed candidates",
            passed: failingResult.status === "fail" && failingResult.evalCandidates.length > 0
          },
          {
            label: "one concurrent persistence wins",
            passed:
              firstPersistence.created !== retryPersistence.created &&
              firstPersistence.feedbackDelta.id === retryPersistence.feedbackDelta.id
          },
          {
            label: "retry has no independent feedback delta",
            passed: retryPersistence.feedbackDelta.id === firstPersistence.feedbackDelta.id
          },
          {
            label: "readback contains one feedback delta",
            passed: aggregate?.feedbackDeltas.length === 1
          },
          {
            label: "readback contains one evidence bundle",
            passed: aggregate?.evidenceBundles.length === 1
          },
          {
            label: "readback contains one pending review assessment",
            passed:
              aggregate?.reviewAssessments.length === 1 &&
              aggregate.reviewAssessments[0]?.status === "pending"
          },
          {
            label: "readback preserves eval candidate count",
            passed: readbackFeedbackDelta?.evalCandidates.length === failingResult.evalCandidates.length
          },
          {
            label: "readback preserves candidate evidence",
            passed: readbackFeedbackDelta?.evalCandidates.every((candidate) =>
              candidate.sourceEvidence.length > 0 &&
              typeof candidate.metadata["doesNotProve"] === "string" &&
              Array.isArray(candidate.metadata["evidenceRefs"])
            ) === true
          },
          {
            label: "readback keeps memory and source mutations empty",
            passed:
              readbackFeedbackDelta?.memoryCandidates.length === 0 &&
              readbackFeedbackDelta.sourceDecisions.length === 0
          },
          {
            label: "eval persistence remains outside DecisionPacket authority",
            passed:
              readbackEvidenceBundle !== undefined &&
              decisionPacketBindingReadbackFromMetadata(
                readbackEvidenceBundle.metadata
              ).status === "unbound" &&
              readbackFeedbackDelta !== undefined &&
              decisionPacketBindingReadbackFromMetadata(
                readbackFeedbackDelta.metadata
              ).status === "unbound" &&
              sourceUsefulnessOutcomesFromMetadata(readbackFeedbackDelta.metadata).length === 0 &&
              knowledgeUsefulnessOutcomesFromMetadata(readbackFeedbackDelta.metadata).length === 0
          },
          {
            label: "passing eval creates no persistence",
            passed: passingPersistence === undefined && aggregate?.feedbackDeltas.length === 1
          }
        ], "Eval feedback persistence smoke readback did not match");

        const persistedEvalCandidateCount = requireSmokeReadbackValue(
          readbackFeedbackDelta?.evalCandidates.length,
          "persisted eval candidate count",
          "Eval feedback persistence smoke readback did not match"
        );

        const cleanupRemainingMarkerCount = await cleanup();

        return {
          smokeId: marker,
          projectId: compiled.project.id,
          executionRunId: compiled.executionRun.id,
          failingEvalCandidateCount: failingResult.evalCandidates.length,
          persistedEvalCandidateCount,
          firstPersistenceCreated: firstPersistence.created,
          retryPersistenceCreated: retryPersistence.created,
          retryFeedbackDeltaId: retryPersistence.feedbackDelta.id,
          readbackFeedbackDeltaId: readbackFeedbackDelta?.id ?? "missing",
          passingEvalPersisted: passingPersistence !== undefined,
          cleanupRemainingMarkerCount,
          cleanedUp: cleanupRemainingMarkerCount === 0
        };
      } finally {
        await readbackClient.end();
      }
    } finally {
      await retryClient.end();
    }
  } finally {
    await client.end();
  }
};
