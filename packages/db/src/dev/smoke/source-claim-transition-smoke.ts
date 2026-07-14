import postgres from "postgres";
import { and, eq, sql } from "drizzle-orm";
import type {
  SourceClaim,
  SourceDecisionStatus
} from "@krn/core";
import type { SourceRepository } from "@krn/core/repositories";

import { createKrnDatabase, type KrnDatabase } from "../../database.js";
import {
  DrizzleProjectRepository,
  DrizzleSourceRepository
} from "../../repositories/index.js";
import {
  outboxEvents,
  sourceClaims,
  sourceDecisions
} from "../../schema/index.js";
import { assertSmokeReadbackChecks } from "./db-smoke-support.js";

export interface SourceClaimTransitionSmokeInput {
  databaseUrl: string;
  db: KrnDatabase;
  marker: string;
  projectId: string;
  workspaceId: string;
  sourceRepository: Pick<
    SourceRepository,
    | "createSourceArtifact"
    | "createSourceChunk"
    | "createSourceClaim"
    | "createSourceDecision"
  >;
}

interface SourceClaimTransitionCaseReadback {
  claimStatus: SourceClaim["status"] | undefined;
  decisionCount: number;
  decisionProjectIds: (string | null)[];
  decisionStatuses: SourceDecisionStatus[];
  fulfilledCount: number;
  outboxCount: number;
}

export interface SourceClaimTransitionSmokeReport {
  adoptRejectRace: SourceClaimTransitionCaseReadback;
  doubleAdoptRace: SourceClaimTransitionCaseReadback;
  doubleRejectRace: SourceClaimTransitionCaseReadback;
  crossProject: SourceClaimTransitionCaseReadback & { rejected: boolean };
  derivedProject: SourceClaimTransitionCaseReadback & { projectMatched: boolean };
  terminalReplay: SourceClaimTransitionCaseReadback & { rejected: boolean };
  nonTerminalReview: SourceClaimTransitionCaseReadback;
}

const capturedCurrentEvidenceMetadata = (
  marker: string,
  label: string
): Record<string, string> => ({
  evidenceStatus: "captured",
  evidenceContentHash: `sha256:source-claim-transition-evidence:${marker}:${label}`,
  evidenceFreshness: "current"
});

const createProbeClaim = async (
  input: SourceClaimTransitionSmokeInput,
  label: string,
  options: { captureEvidence?: boolean } = {}
): Promise<SourceClaim> => {
  const captureEvidence = options.captureEvidence ?? true;
  const metadata = {
    smokeId: input.marker,
    transitionProbe: label,
    ...(captureEvidence
      ? capturedCurrentEvidenceMetadata(input.marker, label)
      : {})
  };
  const sourceArtifact = await input.sourceRepository.createSourceArtifact({
    projectId: input.projectId,
    kind: "operator_input",
    sourceAuthority: "project-decision",
    uri: `operator://source-claim-transition/${input.marker}/${label}`,
    title: `Source claim transition ${label}`,
    contentHash: `source-claim-transition-${input.marker}-${label}`,
    metadata
  });
  const sourceChunk = captureEvidence
    ? await input.sourceRepository.createSourceChunk({
      sourceArtifactId: sourceArtifact.id,
      ordinal: 0,
      content: `Captured source claim transition evidence for ${label}.`,
      contentHash: `source-claim-transition-${input.marker}-${label}-chunk-bytes`,
      metadata
    })
    : undefined;

  return input.sourceRepository.createSourceClaim({
    sourceArtifactId: sourceArtifact.id,
    ...(sourceChunk === undefined ? {} : { sourceChunkId: sourceChunk.id }),
    claim: `Source claim transition probe ${label} must have one terminal winner.`,
    mechanism: "The source claim transition is owned by a guarded PostgreSQL write.",
    krnImplication: "Concurrent source reviews must not create competing authority.",
    doesNotProve: "This probe does not prove that the winning review is correct.",
    sourceAuthority: "project-decision",
    supportType: "implementation-boundary",
    consumer: "source claim transition smoke",
    falsifier: "Two terminal decisions or outbox events persist for one claim.",
    revisitWhen: "2026-12-31T00:00:00.000Z",
    metadata
  });
};

const decisionInput = (input: {
  claimId: string;
  label: string;
  marker: string;
  projectId?: string;
  status: SourceDecisionStatus;
}) => ({
  ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
  sourceClaimId: input.claimId,
  status: input.status,
  decision: `${input.status} source claim transition probe ${input.label}.`,
  rationale: "The transition probe exercises source authority arbitration.",
  falsifier: "Concurrent source claim reviews create competing terminal authority.",
  consumer: "source claim transition smoke",
  metadata: {
    smokeId: input.marker,
    transitionProbe: input.label
  }
});

const readTransition = async (
  db: KrnDatabase,
  claimId: string,
  fulfilledCount: number
): Promise<SourceClaimTransitionCaseReadback> => {
  const decisions = await db
    .select({
      projectId: sourceDecisions.projectId,
      status: sourceDecisions.status
    })
    .from(sourceDecisions)
    .where(eq(sourceDecisions.sourceClaimId, claimId));
  const [claim] = await db
    .select({ status: sourceClaims.status })
    .from(sourceClaims)
    .where(eq(sourceClaims.id, claimId));
  const [outbox] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(outboxEvents)
    .where(and(
      eq(outboxEvents.topic, "source.decision.created"),
      sql`${outboxEvents.payload}->>'sourceClaimId' = ${claimId}`
    ));

  return {
    claimStatus: claim?.status,
    decisionCount: decisions.length,
    decisionProjectIds: decisions.map((decision) => decision.projectId),
    decisionStatuses: decisions.map((decision) => decision.status),
    fulfilledCount,
    outboxCount: outbox?.count ?? 0
  };
};

const runRace = async (input: {
  databaseUrl: string;
  db: KrnDatabase;
  claim: SourceClaim;
  marker: string;
  projectId?: string;
  statuses: readonly [SourceDecisionStatus, SourceDecisionStatus];
  label: string;
}): Promise<SourceClaimTransitionCaseReadback> => {
  const clients = [
    postgres(input.databaseUrl, { max: 1, onnotice: () => undefined }),
    postgres(input.databaseUrl, { max: 1, onnotice: () => undefined })
  ];

  try {
    await Promise.all(clients.map((client) => client`select 1`));
    const repositories = clients.map((client) =>
      new DrizzleSourceRepository(createKrnDatabase(client))
    );
    const [firstRepository, secondRepository] = repositories;

    if (firstRepository === undefined || secondRepository === undefined) {
      throw new Error("Source claim transition smoke did not create two repositories");
    }

    const results = await Promise.allSettled([
      firstRepository.createSourceDecision(decisionInput({
        claimId: input.claim.id,
        label: input.label,
        marker: input.marker,
        ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
        status: input.statuses[0]
      })),
      secondRepository.createSourceDecision(decisionInput({
        claimId: input.claim.id,
        label: input.label,
        marker: input.marker,
        ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
        status: input.statuses[1]
      }))
    ]);

    return readTransition(
      input.db,
      input.claim.id,
      results.filter((result) => result.status === "fulfilled").length
    );
  } finally {
    await Promise.all(clients.map((client) => client.end()));
  }
};

const createSingleDecision = async (input: {
  repository: Pick<SourceRepository, "createSourceDecision">;
  claim: SourceClaim;
  marker: string;
  projectId?: string;
  status: SourceDecisionStatus;
  label: string;
}) => input.repository.createSourceDecision(decisionInput({
  claimId: input.claim.id,
  label: input.label,
  marker: input.marker,
  ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
  status: input.status
}));

const runCrossProjectTransition = async (
  input: SourceClaimTransitionSmokeInput
): Promise<SourceClaimTransitionSmokeReport["crossProject"]> => {
  const claim = await createProbeClaim(input, "cross-project");
  const crossProject = await new DrizzleProjectRepository(input.db).createProject({
    workspaceId: input.workspaceId,
    slug: `source-claim-transition-cross-project-${input.marker}`,
    displayName: "Source claim transition cross-project probe",
    metadata: {
      smokeId: input.marker,
      transitionProbe: "cross-project"
    }
  });
  let rejected = false;

  try {
    await createSingleDecision({
      repository: input.sourceRepository,
      claim,
      marker: input.marker,
      projectId: crossProject.id,
      status: "adopt",
      label: "cross-project"
    });
  } catch {
    rejected = true;
  }

  return {
    ...(await readTransition(input.db, claim.id, 0)),
    rejected
  };
};

const runDerivedProjectTransition = async (
  input: SourceClaimTransitionSmokeInput
): Promise<SourceClaimTransitionSmokeReport["derivedProject"]> => {
  const claim = await createProbeClaim(input, "derived-project");
  await createSingleDecision({
    repository: input.sourceRepository,
    claim,
    marker: input.marker,
    status: "adopt",
    label: "derived-project"
  });
  const readback = await readTransition(input.db, claim.id, 1);

  return {
    ...readback,
    projectMatched: readback.decisionProjectIds.length === 1 &&
      readback.decisionProjectIds[0] === input.projectId
  };
};

const runTerminalReplayTransition = async (
  input: SourceClaimTransitionSmokeInput
): Promise<SourceClaimTransitionSmokeReport["terminalReplay"]> => {
  const claim = await createProbeClaim(input, "terminal-replay");
  await createSingleDecision({
    repository: input.sourceRepository,
    claim,
    marker: input.marker,
    projectId: input.projectId,
    status: "adopt",
    label: "terminal-replay-initial"
  });
  let rejected = false;

  try {
    await createSingleDecision({
      repository: input.sourceRepository,
      claim,
      marker: input.marker,
      projectId: input.projectId,
      status: "reject",
      label: "terminal-replay-overwrite"
    });
  } catch {
    rejected = true;
  }

  return {
    ...(await readTransition(input.db, claim.id, 1)),
    rejected
  };
};

const runNonTerminalTransition = async (
  input: SourceClaimTransitionSmokeInput
): Promise<SourceClaimTransitionCaseReadback> => {
  const claim = await createProbeClaim(input, "non-terminal");
  for (const status of ["adopt", "defer", "lab_test"] as const) {
    await createSingleDecision({
      repository: input.sourceRepository,
      claim,
      marker: input.marker,
      projectId: input.projectId,
      status,
      label: `non-terminal-${status}`
    });
  }

  return readTransition(input.db, claim.id, 3);
};

const hasOneWinner = (caseReadback: SourceClaimTransitionCaseReadback): boolean =>
  caseReadback.fulfilledCount === 1 &&
  caseReadback.decisionCount === 1 &&
  caseReadback.outboxCount === 1;

const hasTerminalWinner = (
  caseReadback: SourceClaimTransitionCaseReadback,
  status: SourceDecisionStatus,
  claimStatus: SourceClaim["status"]
): boolean => hasOneWinner(caseReadback) &&
  caseReadback.decisionStatuses.length === 1 &&
  caseReadback.decisionStatuses[0] === status &&
  caseReadback.claimStatus === claimStatus;

const assertRaceReadback = (report: SourceClaimTransitionSmokeReport): void => {
  const adoptRejectWinner = hasOneWinner(report.adoptRejectRace) && (
    hasTerminalWinner(report.adoptRejectRace, "adopt", "accepted") ||
    hasTerminalWinner(report.adoptRejectRace, "reject", "rejected")
  );

  assertSmokeReadbackChecks([
    {
      label: "adopt versus reject has one winner",
      passed: adoptRejectWinner
    },
    {
      label: "double adopt has one winner",
      passed: hasTerminalWinner(report.doubleAdoptRace, "adopt", "accepted")
    },
    {
      label: "double reject has one winner",
      passed: hasTerminalWinner(report.doubleRejectRace, "reject", "rejected")
    }
  ], "Source claim transition race falsifier failed");
};

const assertProjectReadback = (report: SourceClaimTransitionSmokeReport): void => {
  assertSmokeReadbackChecks([
    {
      label: "cross-project decision is rejected before writes",
      passed: report.crossProject.rejected &&
        report.crossProject.decisionCount === 0 &&
        report.crossProject.outboxCount === 0 &&
        report.crossProject.claimStatus === "proposed"
    },
    {
      label: "source project is derived from artifact",
      passed: report.derivedProject.projectMatched &&
        report.derivedProject.claimStatus === "accepted"
    }
  ], "Source claim transition project-boundary falsifier failed");
};

const assertLifecycleReadback = (report: SourceClaimTransitionSmokeReport): void => {
  assertSmokeReadbackChecks([
    {
      label: "terminal replay preserves winning authority",
      passed: report.terminalReplay.rejected &&
        report.terminalReplay.decisionCount === 1 &&
        report.terminalReplay.outboxCount === 1 &&
        report.terminalReplay.claimStatus === "accepted"
    },
    {
      label: "defer and lab_test preserve terminal authority",
      passed: report.nonTerminalReview.decisionCount === 3 &&
        report.nonTerminalReview.outboxCount === 3 &&
        report.nonTerminalReview.claimStatus === "accepted" &&
        report.nonTerminalReview.decisionStatuses.includes("defer") &&
        report.nonTerminalReview.decisionStatuses.includes("lab_test")
    }
  ], "Source claim transition lifecycle falsifier failed");
};

const assertSourceClaimTransitionSmokeReport = (
  report: SourceClaimTransitionSmokeReport
): void => {
  assertRaceReadback(report);
  assertProjectReadback(report);
  assertLifecycleReadback(report);
};

export const runSourceClaimTransitionSmokeCheck = async (
  input: SourceClaimTransitionSmokeInput
): Promise<SourceClaimTransitionSmokeReport> => {
  const adoptRejectClaim = await createProbeClaim(input, "adopt-reject");
  const adoptRejectRace = await runRace({
    databaseUrl: input.databaseUrl,
    db: input.db,
    claim: adoptRejectClaim,
    marker: input.marker,
    projectId: input.projectId,
    statuses: ["adopt", "reject"],
    label: "adopt-reject"
  });
  const doubleAdoptClaim = await createProbeClaim(input, "double-adopt");
  const doubleAdoptRace = await runRace({
    databaseUrl: input.databaseUrl,
    db: input.db,
    claim: doubleAdoptClaim,
    marker: input.marker,
    projectId: input.projectId,
    statuses: ["adopt", "adopt"],
    label: "double-adopt"
  });
  const doubleRejectClaim = await createProbeClaim(input, "double-reject", {
    captureEvidence: false
  });
  const doubleRejectRace = await runRace({
    databaseUrl: input.databaseUrl,
    db: input.db,
    claim: doubleRejectClaim,
    marker: input.marker,
    projectId: input.projectId,
    statuses: ["reject", "reject"],
    label: "double-reject"
  });
  const report = {
    adoptRejectRace,
    doubleAdoptRace,
    doubleRejectRace,
    crossProject: await runCrossProjectTransition(input),
    derivedProject: await runDerivedProjectTransition(input),
    terminalReplay: await runTerminalReplayTransition(input),
    nonTerminalReview: await runNonTerminalTransition(input)
  } satisfies SourceClaimTransitionSmokeReport;

  assertSourceClaimTransitionSmokeReport(report);
  return report;
};
