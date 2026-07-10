import { describe, expect, it } from "vitest";
import path from "node:path";

import type {
  CreateAntiMemoryCandidateInput,
  CreateEvidenceBundleInput,
  CreateExecutionRunInput,
  CreateFeedbackDeltaInput,
  CreateMemoryFeedbackEventInput,
  CreateMemoryCandidateInput,
  InvalidateMemoryRecordInput,
  PromoteAntiMemoryCandidateInput,
  PromoteMemoryCandidateInput,
  RejectAntiMemoryCandidateInput,
  RejectMemoryCandidateInput,
  RecordMemoryApplicationInput,
  CreateReviewAssessmentInput,
  CreateEvidenceFeedbackOnceInput,
  HarnessRunAggregate
} from "@krn/core/repositories/internal";
import { buildDecisionPacketFromReadModel } from "@krn/core";

import { createNoStoreCompilerDependencies } from "../no-store-repositories.js";
import type { DatabaseRuntime } from "../database-runtime.js";
import { buildDecisionPacketReadModel } from "../decision-packet-read-model-builders.js";
import {
  authorizePacketUsefulness,
  currentDecisionPacketBindingForAggregate
} from "../packet-usefulness-authorization.js";
import { runCli } from "../run-cli.js";

const now = "2026-06-21T12:00:00.000Z";

const unusedMemoryRepository = {
  async createMemoryCandidate(_input: CreateMemoryCandidateInput): Promise<never> {
    throw new Error("createMemoryCandidate should not be called");
  },
  async getMemoryCandidateById(_id: string): Promise<never> {
    throw new Error("getMemoryCandidateById should not be called");
  },
  async promoteReviewedMemoryCandidate(_input: PromoteMemoryCandidateInput): Promise<never> {
    throw new Error("promoteReviewedMemoryCandidate should not be called");
  },
  async rejectMemoryCandidate(_input: RejectMemoryCandidateInput): Promise<never> {
    throw new Error("rejectMemoryCandidate should not be called");
  },
  async invalidateMemoryRecord(_input: InvalidateMemoryRecordInput): Promise<never> {
    throw new Error("invalidateMemoryRecord should not be called");
  },
  async getMemoryRecordById(_id: string): Promise<never> {
    throw new Error("getMemoryRecordById should not be called");
  },
  async listMemoryRecordsForProject(): Promise<never> {
    throw new Error("listMemoryRecordsForProject should not be called");
  },
  async recordMemoryApplication(_input: RecordMemoryApplicationInput): Promise<never> {
    throw new Error("recordMemoryApplication should not be called");
  },
  async createMemoryFeedbackEvent(_input: CreateMemoryFeedbackEventInput): Promise<never> {
    throw new Error("createMemoryFeedbackEvent should not be called");
  },
  async createAntiMemoryCandidate(_input: CreateAntiMemoryCandidateInput): Promise<never> {
    throw new Error("createAntiMemoryCandidate should not be called");
  },
  async getAntiMemoryCandidateById(_id: string): Promise<never> {
    throw new Error("getAntiMemoryCandidateById should not be called");
  },
  async promoteReviewedAntiMemoryCandidate(_input: PromoteAntiMemoryCandidateInput): Promise<never> {
    throw new Error("promoteReviewedAntiMemoryCandidate should not be called");
  },
  async rejectAntiMemoryCandidate(_input: RejectAntiMemoryCandidateInput): Promise<never> {
    throw new Error("rejectAntiMemoryCandidate should not be called");
  }
};

const unusedSourceRepository = {
  async createSourceArtifact(): Promise<never> {
    throw new Error("createSourceArtifact should not be called");
  },
  async createSourceClaim(): Promise<never> {
    throw new Error("createSourceClaim should not be called");
  },
  async getSourceClaimById(): Promise<never> {
    throw new Error("getSourceClaimById should not be called");
  },
  async listClaimsForProject(): Promise<never> {
    throw new Error("listClaimsForProject should not be called");
  },
  async createSourceClaimEdge(): Promise<never> {
    throw new Error("createSourceClaimEdge should not be called");
  },
  async listSourceClaimEdgesForClaim(): Promise<never> {
    throw new Error("listSourceClaimEdgesForClaim should not be called");
  },
  async listSourceDecisionEdgesForClaim(): Promise<never> {
    throw new Error("listSourceDecisionEdgesForClaim should not be called");
  },
  async createSourceDecisionEdge(): Promise<never> {
    throw new Error("createSourceDecisionEdge should not be called");
  },
  async getSourceDecisionEdgeById(): Promise<never> {
    throw new Error("getSourceDecisionEdgeById should not be called");
  },
  async createSourceRejection(): Promise<never> {
    throw new Error("createSourceRejection should not be called");
  }
} satisfies DatabaseRuntime["sourceRepository"];

interface EvidencePersistenceCapture {
  commands?: CreateEvidenceBundleInput["commands"];
  evidenceBundle?: CreateEvidenceBundleInput;
  sourceDecisions?: CreateFeedbackDeltaInput["sourceDecisions"];
  memoryCandidates?: CreateFeedbackDeltaInput["memoryCandidates"];
  feedbackDeltaMetadata?: CreateFeedbackDeltaInput["metadata"];
  maintenanceQueueInputs?: EnqueueMaintenanceQueueInput[];
}

type NoStoreCompilerDependencies = ReturnType<typeof createNoStoreCompilerDependencies>;
type EvidenceHarnessRunRepository =
  NoStoreCompilerDependencies["harnessRunRepository"] &
  DatabaseRuntime["harnessRunRepository"];
type EnqueueMaintenanceQueueInput = Parameters<
  NonNullable<DatabaseRuntime["maintenanceQueueRepository"]>["enqueueMaintenanceQueue"]
>[0];

export const createEvidencePersistenceAggregate = (): HarnessRunAggregate => ({
  operatorIntent: {
    id: "operator-intent-1",
    workspaceId: "workspace-1",
    projectId: "project-1",
    source: "cli",
    rawIntent: "persist harness run",
    status: "received",
    metadata: {},
    createdAt: now
  },
  taskContract: {
    id: "task-contract-1",
    operatorIntentId: "operator-intent-1",
    projectId: "project-1",
    title: "persist harness run",
    objective: "persist harness run",
    constraints: [],
    nonGoals: [],
    acceptance: [],
    status: "active",
    metadata: {},
    createdAt: now,
    updatedAt: now
  },
  harnessPlan: {
    id: "harness-plan-1",
    taskContractId: "task-contract-1",
    version: 1,
    status: "ready",
    summary: "persist harness run",
    metadata: {},
    createdAt: now,
    updatedAt: now
  },
  contextAssembly: {
    id: "context-assembly-1",
    harnessPlanId: "harness-plan-1",
    status: "assembled",
    inclusions: [{
      subjectType: "source_claim",
      subjectId: "source-claim-1",
      reason: "Selected source claim.",
      expectedUse: "Use for current task evidence.",
      sourceAuthority: "project-decision"
    }, {
      subjectType: "source_claim",
      subjectId: "source-claim-current",
      reason: "Selected source claim.",
      expectedUse: "Use for current task evidence.",
      sourceAuthority: "project-decision"
    }, {
      subjectType: "source_claim",
      subjectId: "source-claim-stale",
      reason: "Selected source claim.",
      expectedUse: "Use for current task evidence.",
      sourceAuthority: "project-decision"
    }, {
      subjectType: "memory_record",
      subjectId: "knowledge:ts-boundary-unknown-first-result-state",
      reason: "Selected retained knowledge.",
      expectedUse: "Use for current task evidence.",
      sourceAuthority: "project-decision"
    }, {
      subjectType: "memory_record",
      subjectId: "knowledge:frontend-template",
      reason: "Selected retained knowledge.",
      expectedUse: "Use for current task evidence.",
      sourceAuthority: "project-decision"
    }],
    exclusions: [],
    metadata: {},
    createdAt: now
  },
  executionRun: {
    id: "execution-run-1",
    harnessPlanId: "harness-plan-1",
    adapter: "codex",
    status: "planned",
    metadata: {},
    createdAt: now,
    updatedAt: now
  },
  evidenceBundles: [],
  reviewAssessments: [],
  feedbackDeltas: [],
  runEvents: [{
    id: "run-event-1",
    executionRunId: "execution-run-1",
    sequence: 1,
    type: "plan.persisted",
    severity: "info",
    message: "plan persisted",
    payload: {},
    occurredAt: now
  }]
});

const createCapturingAtomicEvidenceFeedbackResult = (
  input: CreateEvidenceFeedbackOnceInput
) => ({
  evidenceBundle: {
    id: "evidence-bundle-1",
    executionRunId: input.executionRunId,
    status: input.evidence.status ?? "captured",
    changedFiles: input.evidence.changedFiles,
    commands: input.evidence.commands,
    diffRisk: input.evidence.diffRisk,
    reviewBurden: input.evidence.reviewBurden,
    rollbackPath: input.evidence.rollbackPath,
    metadata: input.evidence.metadata ?? {},
    createdAt: now,
    updatedAt: now
  },
  reviewAssessment: {
    id: "review-assessment-1",
    evidenceBundleId: "evidence-bundle-1",
    status: input.review.status ?? "pending",
    reviewer: input.review.reviewer,
    summary: input.review.summary,
    findings: input.review.findings,
    metadata: input.review.metadata ?? {},
    createdAt: now,
    updatedAt: now
  },
  feedbackDelta: {
    id: "feedback-delta-1",
    reviewAssessmentId: "review-assessment-1",
    status: input.feedback.status ?? "candidate",
    memoryCandidates: input.feedback.memoryCandidates,
    sourceDecisions: input.feedback.sourceDecisions,
    evalCandidates: input.feedback.evalCandidates,
    metadata: input.feedback.metadata ?? {},
    createdAt: now,
    updatedAt: now
  },
  ...(input.maintenance === undefined
    ? {}
    : { feedbackMaintenanceQueueRecordId: "maintenance-queue-record-1" }),
  created: true
});

const createCapturingEvidenceHarnessRunRepository = (
  dependencies: NoStoreCompilerDependencies,
  aggregate: HarnessRunAggregate,
  capture: EvidencePersistenceCapture
): EvidenceHarnessRunRepository => ({
  ...dependencies.harnessRunRepository,
  async createExecutionRun(_input: CreateExecutionRunInput) {
    return aggregate.executionRun;
  },
  async getHarnessRunByExecutionRunId() {
    return aggregate;
  },
  async createEvidenceBundle(input: CreateEvidenceBundleInput) {
    capture.evidenceBundle = input;
    capture.commands = input.commands;

    return {
      id: "evidence-bundle-1",
      executionRunId: input.executionRunId,
      status: input.status ?? "captured",
      changedFiles: input.changedFiles,
      commands: input.commands,
      diffRisk: input.diffRisk,
      reviewBurden: input.reviewBurden,
      rollbackPath: input.rollbackPath,
      metadata: input.metadata ?? {},
      createdAt: now,
      updatedAt: now
    };
  },
  async createReviewAssessment(input: CreateReviewAssessmentInput) {
    return {
      id: "review-assessment-1",
      evidenceBundleId: input.evidenceBundleId,
      status: input.status ?? "pending",
      reviewer: input.reviewer,
      summary: input.summary,
      findings: input.findings,
      metadata: input.metadata ?? {},
      createdAt: now,
      updatedAt: now
    };
  },
  async createFeedbackDelta(input: CreateFeedbackDeltaInput) {
    capture.memoryCandidates = input.memoryCandidates;
    capture.sourceDecisions = input.sourceDecisions;
    capture.feedbackDeltaMetadata = input.metadata;

    return {
      id: "feedback-delta-1",
      reviewAssessmentId: input.reviewAssessmentId,
      status: input.status ?? "candidate",
      memoryCandidates: input.memoryCandidates,
      sourceDecisions: input.sourceDecisions,
      evalCandidates: input.evalCandidates,
      metadata: input.metadata ?? {},
      createdAt: now,
      updatedAt: now
    };
  },
  async createEvidenceFeedbackOnce(input: CreateEvidenceFeedbackOnceInput) {
    capture.evidenceBundle = {
      ...input.evidence,
      executionRunId: input.executionRunId
    };
    capture.commands = input.evidence.commands;
    capture.memoryCandidates = input.feedback.memoryCandidates;
    capture.sourceDecisions = input.feedback.sourceDecisions;
    capture.feedbackDeltaMetadata = input.feedback.metadata;

    if (input.maintenance !== undefined) {
      capture.maintenanceQueueInputs = [{
        jobType: "review_feedback_delta",
        payload: {
          projectId: input.projectId,
          feedbackDeltaId: "feedback-delta-1",
          reason: input.maintenance.reason
        }
      }];
    }

    return createCapturingAtomicEvidenceFeedbackResult(input);
  }
});

const createCapturingMaintenanceQueueRepository = (
  capture: EvidencePersistenceCapture
): NonNullable<DatabaseRuntime["maintenanceQueueRepository"]> => ({
  async enqueueMaintenanceQueue(input) {
    capture.maintenanceQueueInputs = [
      ...(capture.maintenanceQueueInputs ?? []),
      input
    ];

    return {
      id: "maintenance-queue-record-1",
      jobType: input.jobType,
      queueKey: `${input.jobType}:project-1:feedback-delta-1`,
      status: "queued",
      payload: { ...input.payload },
      attempts: 0,
      maxAttempts: input.maxAttempts ?? 3,
      runAfter: input.runAfter ?? now,
      createdAt: now,
      updatedAt: now
    };
  }
});

const expectPersistedEvidenceCaptureStdout = (stdout: string): void => {
  expect(stdout).toContain("Persistence: enabled (Postgres, explicit --persist)");
  expect(stdout).toMatch(/Environment fingerprint: [a-f0-9]{64}/u);
  expect(stdout).toContain("Run ID: execution-run-1");
  expect(stdout).toContain("Persisted IDs:");
  expect(stdout).toContain("evidenceBundle: evidence-bundle-1");
  expect(stdout).toContain("reviewAssessment: review-assessment-1");
  expect(stdout).toContain("feedbackDelta: feedback-delta-1");
  expect(stdout).toContain("Memory mutation: none");
  expect(stdout).toContain("memoryCandidates:");
  expect(stdout).toContain("memory-candidate-proposal-1");
  expect(stdout).toContain("No MemoryCandidate row created");
  expect(stdout).toContain("sourceDecisionCandidates:");
  expect(stdout).toContain("sourceUsefulnessOutcomes:");
  expect(stdout).toContain("outcome=selected sourceClaim=source-claim-1 sourceDecision=none");
  expect(stdout).toContain("reason: Source claim kept knowledge-intake proof boundaries visible");
  expect(stdout).toContain("evidenceRef: packet:");
  expect(stdout).toContain("doesNotProve: Does not prove future source selector quality");
  expect(stdout).toContain("knowledgeUsefulnessOutcomes:");
  expect(stdout).toContain("outcome=selected knowledge=knowledge:ts-boundary-unknown-first-result-state");
  expect(stdout).toContain("reason: Memory selected the unknown-first parser shape");
  expect(stdout).toContain("doesNotProve: Does not prove future memory recall quality");
};

const expectPersistedEvidenceCandidates = (capture: EvidencePersistenceCapture): void => {
  expect(capture.memoryCandidates).toHaveLength(1);
  const [memoryCandidate] = capture.memoryCandidates ?? [];
  expect(memoryCandidate).toMatchObject({
    projectId: "project-1",
    executionRunId: "execution-run-1",
    status: "proposed",
    sourceLineage: []
  });
  expect(memoryCandidate?.invalidationRule).toBeUndefined();
  expect(memoryCandidate?.applicationGuidance).toContain("Incomplete");
  expect(memoryCandidate?.metadata).toMatchObject({
    completeness: "incomplete",
    reviewability: "too_vague",
    reviewabilityReasons: ["Candidate does not name a concrete future use."],
    persistence: "feedback-delta-proposal-only"
  });

  expect(capture.sourceDecisions).toHaveLength(1);
  const [sourceDecision] = capture.sourceDecisions ?? [];
  expect(sourceDecision).toMatchObject({
    status: "defer",
    consumer: "krn evidence capture"
  });
  expect(sourceDecision?.metadata).toMatchObject({
    reviewability: "too_vague",
    reviewabilityReasons: ["Candidate does not name a concrete future use."]
  });
};

const expectPersistedEvidenceMetadata = (capture: EvidencePersistenceCapture): void => {
  expect(capture.feedbackDeltaMetadata).toMatchObject({
    environmentFingerprint: {
      kind: "krn.environmentFingerprint.v1",
      id: expect.stringMatching(/^[a-f0-9]{64}$/u)
    }
  });
  expect(capture.feedbackDeltaMetadata).toMatchObject({
    sourceUsefulnessOutcomes: [{
      sourceClaimId: "source-claim-1",
      outcome: "selected",
      reason: "Source claim kept knowledge-intake proof boundaries visible",
      evidenceRefs: [expect.stringMatching(/^packet:/)],
      doesNotProve: "Does not prove future source selector quality"
    }],
    knowledgeUsefulnessOutcomes: [{
      knowledgeId: "knowledge:ts-boundary-unknown-first-result-state",
      outcome: "selected",
      reason: "Memory selected the unknown-first parser shape",
      evidenceRefs: [expect.stringMatching(/^packet:/)],
      doesNotProve: "Does not prove future memory recall quality"
    }]
  });
  expect(capture.evidenceBundle?.reviewBurden).toBe(
    "Review changed files, command proof, residual risk, and rollback path. Review target repo mode, dirty state, ownership, allowed/forbidden writes, target command proof, and target does-not-prove boundaries separately."
  );
  expect(capture.evidenceBundle?.metadata).toMatchObject({
    environmentFingerprint: {
      kind: "krn.environmentFingerprint.v1",
      id: expect.stringMatching(/^[a-f0-9]{64}$/u)
    },
    intendedFiles: ["KRN_ROADMAP.md"],
    changedFileClassification: {
      intended: ["KRN_ROADMAP.md"],
      unrelated: [],
      unknown: [],
      unmatchedIntendedFiles: []
    },
    dirtyContext: {
      hasUnrelatedFiles: false,
      unrelatedFileCount: 0
    },
    targetEvidence: {
      targetRepo: "../wilq-seo",
      mode: "observation_only",
      dirtyBefore: "dirty",
      dirtyAfter: "dirty",
      ownedChanges: "external",
      targetStatusFreshness: "fresh_current_task",
      targetPatchLifecycle: "none",
      targetOwnerDecision: "no target patch",
      allowedWrites: ["none"],
      forbiddenWrites: [
        "target source edits",
        "target commits",
        "target resets or cleans",
        "target production/runtime writes"
      ],
      changedFiles: [{
        status: "M",
        path: "apps/dashboard/src/App.tsx",
        ownership: "external"
      }],
      commands: ["wilq-seo scripts/test.sh"],
      doesNotProve: [
        "Target evidence does not prove KRN source correctness.",
        "Target evidence does not prove full target verification unless every target gate is represented by command evidence.",
        "Target evidence does not prove product readiness or V02-01 second-operator usability."
      ]
    }
  });
};

const expectDefaultTemplateCommands = (
  commands: CreateEvidenceBundleInput["commands"] | undefined
): void => {
  const doesNotProve =
    "This command row does not prove the command executed; it is default template evidence only.";

  expect(commands).toEqual([
    {
      kind: "default_template",
      command: "pnpm typecheck",
      status: "not_run",
      provenance: "default_template",
      doesNotProve
    },
    {
      kind: "default_template",
      command: "pnpm test",
      status: "not_run",
      provenance: "default_template",
      doesNotProve
    },
    {
      kind: "default_template",
      command: "git diff --check",
      status: "not_run",
      provenance: "default_template",
      doesNotProve
    }
  ]);
};

describe("runCli", () => {
  it("prints evidence capture verification examples in help", async () => {
    const result = await runCli(["--help"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain(
      "krn evidence capture [--run-id <id>|--run <id>] [--intended-file <path>] [--target-repo <path>] [--verification \"pnpm typecheck=passed\"] [--source-usefulness \"claim:<id>=helped|reason|evidence|doesNotProve\"] [--memory-usefulness \"<knowledge-id>=helped|reason|evidence|doesNotProve\"] [--persist]"
    );
    expect(result.stdout).toContain(
      "example: krn evidence capture --intended-file packages/cli/src/run-evidence-capture-command.ts --verification \"pnpm typecheck=passed\" --verification \"pnpm test=passed\""
    );
    expect(result.stdout).toContain("source usefulness: krn evidence capture --source-usefulness");
    expect(result.stdout).toContain("memory usefulness: krn evidence capture --memory-usefulness");
    expect(result.stdout).toContain("target: krn evidence capture --target-repo ../target");
    expect(result.stdout).toContain(
      "evidence capture records outcomes; it does not execute commands"
    );
  });

  it("prints evidence capture without mutating memory", async () => {
    const result = await runCli(["evidence", "capture"], {
      env: {},
      cwd: path.resolve(process.cwd(), "../.."),
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      readGitStatus: async () => " M packages/cli/src/run-cli.ts\n?? notes.md\n"
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Evidence Capture");
    expect(result.stdout).toContain("Persistence: disabled");
    expect(result.stdout).toContain("packages/cli/src/run-cli.ts");
    expect(result.stdout).toContain("notes.md");
    expect(result.stdout).toContain("Changed files:\nunknown:");
    expect(result.stdout).toContain("Dirty context: unclassified (no --intended-file provided).");
    expect(result.stdout).toContain("pnpm typecheck: not_run | provenance=default_template");
    expect(result.stdout).toContain("pnpm test: not_run | provenance=default_template");
    expect(result.stdout).toContain("git diff --check: not_run | provenance=default_template");
    expect(result.stdout).toContain(
      "Command provenance is weak: default_template rows are not proof that commands ran."
    );
    expect(result.stdout).toContain("Command execution: none");
    expect(result.stdout).toContain("Memory mutation: none");
    expect(result.stdout).toContain("Feedback candidates:");
    expect(result.stdout).toContain("memoryCandidates:");
    expect(result.stdout).toContain("memory-candidate-proposal-1");
    expect(result.stdout).toContain("status: proposed");
    expect(result.stdout).toContain("reviewability: too_vague");
    expect(result.stdout).toContain("reviewability reasons:\n  - Candidate does not name a concrete future use.");
    expect(result.stdout).toContain("completeness: incomplete");
    expect(result.stdout).toContain("missing: applicationGuidance, sourceLineage, invalidationRule");
    expect(result.stdout).toContain("No MemoryCandidate row created");
    expect(result.stdout).toContain("sourceDecisionCandidates:\n- none");
  });

  it("classifies intended and unrelated changed files during evidence capture", async () => {
    const result = await runCli([
      "evidence",
      "capture",
      "--intended-file",
      "packages/cli/src/run-evidence-capture-command.ts",
      "--intended-file=./packages/cli/src/parse-evidence-args.ts",
      "--intended-file",
      "packages/core/src/candidate-reviewability.ts",
      "--intended-file",
      "review-evidence/controlled-dogfood/run/REPORT.md",
      "--verification",
      "pnpm typecheck=passed"
    ], {
      env: {},
      cwd: process.cwd(),
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      readGitStatus: async () =>
        " M src/run-evidence-capture-command.ts\n" +
        " M src/parse-evidence-args.ts\n" +
        " M ../core/src/candidate-reviewability.ts\n" +
        "?? ../../review-evidence/controlled-dogfood/run/\n" +
        "?? ../../docs/materials/raw-audit.md\n"
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Changed files:\nintended:");
    expect(result.stdout).toContain("- M packages/cli/src/run-evidence-capture-command.ts");
    expect(result.stdout).toContain("- M packages/cli/src/parse-evidence-args.ts");
    expect(result.stdout).toContain("- M packages/core/src/candidate-reviewability.ts");
    expect(result.stdout).toContain("- ?? review-evidence/controlled-dogfood/run");
    expect(result.stdout).not.toContain("../../review-evidence/controlled-dogfood/run");
    expect(result.stdout).not.toContain("- M core/src/candidate-reviewability.ts");
    expect(result.stdout).toContain("unrelated:\n- ?? docs/materials/raw-audit.md");
    expect(result.stdout).toContain("unknown:\n- none");
    expect(result.stdout).toContain("Dirty context: unrelated files present; review burden increased.");
    expect(result.stdout).toContain(
      "Review burden: Review intended files, unrelated dirty files, command proof, residual risk, and rollback path."
    );
    expect(result.stdout).toContain(
      "pnpm typecheck: passed | provenance=operator_reported | doesNotProve=This command result does not prove memory quality, source truth, review correctness, or production readiness."
    );
  });

  it("renders target evidence separately from KRN changed files", async () => {
    const result = await runCli([
      "evidence",
      "capture",
      "--target-repo",
      "../wilq-seo",
      "--target-mode",
      "observation-only",
      "--target-dirty-before",
      "dirty",
      "--target-dirty-after",
      "dirty",
      "--target-owned-changes",
      "external",
      "--target-status-freshness",
      "changed-since-selection",
      "--target-patch-lifecycle",
      "handed-off-unresolved",
      "--target-handoff-artifact",
      "review-evidence/target/HANDOFF.md",
      "--target-owner-decision",
      "stronger verification requested",
      "--target-changed-file",
      "M apps/dashboard/src/App.tsx",
      "--target-command",
      "wilq-seo scripts/test.sh",
      "--target-forbidden-write",
      "wilq-seo/**",
      "--verification",
      "wilq-seo scripts/test.sh=failed"
    ], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      readGitStatus: async () => ""
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Changed files:\n- none");
    expect(result.stdout).toContain("wilq-seo scripts/test.sh: failed | provenance=operator_reported");
    expect(result.stdout).toContain("Target evidence:");
    expect(result.stdout).toContain("- repo: ../wilq-seo");
    expect(result.stdout).toContain("- mode: observation_only");
    expect(result.stdout).toContain("- dirtyBefore: dirty");
    expect(result.stdout).toContain("- dirtyAfter: dirty");
    expect(result.stdout).toContain("- ownedChanges: external");
    expect(result.stdout).toContain("- targetStatusFreshness: changed_since_selection");
    expect(result.stdout).toContain("- targetPatchLifecycle: handed_off_unresolved");
    expect(result.stdout).toContain("- handoffArtifact: review-evidence/target/HANDOFF.md");
    expect(result.stdout).toContain("- targetOwnerDecision: stronger verification requested");
    expect(result.stdout).toContain("- M apps/dashboard/src/App.tsx | ownership=external");
    expect(result.stdout).toContain("- wilq-seo scripts/test.sh");
    expect(result.stdout).toContain("- wilq-seo/**");
    expect(result.stdout).toContain("Target evidence does not prove KRN source correctness.");
    expect(result.stdout).toContain("Review target repo mode, dirty state, ownership");
  });

  it("surfaces proposal-only source decision candidates from source evidence", async () => {
    const result = await runCli(["evidence", "capture"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      readGitStatus: async () =>
        " M KRN_ROADMAP.md\n" +
        " M packages/cli/src/run-source-claim-add-command.ts\n"
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("sourceDecisionCandidates:");
    expect(result.stdout).toContain("source-decision-candidate-1");
    expect(result.stdout).toContain("status: defer");
    expect(result.stdout).toContain("reviewability: too_vague");
    expect(result.stdout).toContain("reviewability reasons:\n  - Candidate does not name a concrete future use.");
    expect(result.stdout).toContain("consumer: krn evidence capture");
    expect(result.stdout).toContain("No SourceClaim created");
  });

  it("requires database config for evidence capture --persist", async () => {
    const result = await runCli(
      ["evidence", "capture", "--run-id", "execution-run-1", "--persist"],
      {
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        readGitStatus: async () => ""
      }
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain(
      "KRN_DATABASE_URL is required for krn evidence capture --persist"
    );
  });

  it("requires run id for evidence capture --persist", async () => {
    const result = await runCli(
      ["evidence", "capture", "--persist"],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        readGitStatus: async () => ""
      }
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("--run-id is required for krn evidence capture --persist");
  });

  it("persists evidence capture for a run id", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    const capture: EvidencePersistenceCapture = {};
    const aggregate = createEvidencePersistenceAggregate();
    const packetBinding = currentDecisionPacketBindingForAggregate(aggregate);
    const harnessRunRepository = createCapturingEvidenceHarnessRunRepository(
      dependencies,
      aggregate,
      capture
    );
    const result = await runCli(
      [
        "evidence",
        "capture",
        "--run-id",
        "execution-run-1",
        "--intended-file",
        "KRN_ROADMAP.md",
        "--target-repo",
        "../wilq-seo",
        "--target-mode",
        "observation-only",
        "--target-dirty-before",
        "dirty",
        "--target-dirty-after",
        "dirty",
        "--target-owned-changes",
        "external",
        "--target-status-freshness",
        "fresh-current-task",
        "--target-patch-lifecycle",
        "none",
        "--target-owner-decision",
        "no target patch",
        "--target-changed-file",
        "M apps/dashboard/src/App.tsx",
        "--target-command",
        "wilq-seo scripts/test.sh",
        "--source-usefulness",
        `claim:source-claim-1=selected|Source claim kept knowledge-intake proof boundaries visible|${packetBinding.packetEvidenceRef}|Does not prove future source selector quality`,
        "--memory-usefulness",
        `knowledge:ts-boundary-unknown-first-result-state=selected|Memory selected the unknown-first parser shape|${packetBinding.packetEvidenceRef}|Does not prove future memory recall quality`,
        "--decision-packet-checksum",
        packetBinding.packetChecksum,
        "--persist"
      ],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        cwd: path.resolve(process.cwd(), "../.."),
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        readGitStatus: async () =>
          " M KRN_ROADMAP.md\n",
        createDatabaseRuntime: async () => ({
          workspaceId: "workspace-1",
          projectId: "project-1",
          compilerDependencies: {
            ...dependencies,
            harnessRunRepository
          },
          harnessRunRepository,
          sourceRepository: unusedSourceRepository,
          memoryRepository: unusedMemoryRepository,
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expectPersistedEvidenceCaptureStdout(result.stdout);
    expectPersistedEvidenceCandidates(capture);
    expectPersistedEvidenceMetadata(capture);
    expectDefaultTemplateCommands(capture.commands);
    expect(capture.maintenanceQueueInputs).toBeUndefined();
  });

  it("downgrades observation-only helped feedback to selected without target application proof", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    const capture: EvidencePersistenceCapture = {};
    const aggregate = createEvidencePersistenceAggregate();
    const packetBinding = currentDecisionPacketBindingForAggregate(aggregate);
    const harnessRunRepository = createCapturingEvidenceHarnessRunRepository(
      dependencies,
      aggregate,
      capture
    );
    const result = await runCli(
      [
        "evidence",
        "capture",
        "--run-id",
        "execution-run-1",
        "--decision-packet-checksum",
        packetBinding.packetChecksum,
        "--target-repo",
        "../typescript-basic",
        "--target-mode",
        "observation-only",
        "--target-dirty-before",
        "clean",
        "--target-dirty-after",
        "clean",
        "--target-owned-changes",
        "external",
        "--target-changed-file",
        "none",
        "--verification",
        "pnpm --dir ../typescript-basic test=passed",
        "--source-usefulness",
        `claim:source-claim-1=helped|Observation-only target command passed without a target application|${packetBinding.packetEvidenceRef}|Does not prove target application or source truth`,
        "--memory-usefulness",
        `knowledge:ts-boundary-unknown-first-result-state=helped|Observation-only target command passed without a target application|${packetBinding.packetEvidenceRef}|Does not prove target application or memory usefulness`,
        "--persist"
      ],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        cwd: path.resolve(process.cwd(), "../.."),
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        readGitStatus: async () => "",
        createDatabaseRuntime: async () => ({
          workspaceId: "workspace-1",
          projectId: "project-1",
          compilerDependencies: {
            ...dependencies,
            harnessRunRepository
          },
          harnessRunRepository,
          sourceRepository: unusedSourceRepository,
          memoryRepository: unusedMemoryRepository,
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("outcome=selected sourceClaim=source-claim-1");
    expect(result.stdout).toContain("outcome=selected knowledge=knowledge:ts-boundary-unknown-first-result-state");
    expect(capture.feedbackDeltaMetadata).toMatchObject({
      sourceUsefulnessOutcomes: [{
        sourceClaimId: "source-claim-1",
        outcome: "selected"
      }],
      knowledgeUsefulnessOutcomes: [{
        knowledgeId: "knowledge:ts-boundary-unknown-first-result-state",
        outcome: "selected"
      }]
    });
    expect(capture.maintenanceQueueInputs).toBeUndefined();
  });

  it("requires current application and verification refs for used and helped", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    const capture: EvidencePersistenceCapture = {};
    const aggregate = createEvidencePersistenceAggregate();
    const packetBinding = currentDecisionPacketBindingForAggregate(aggregate);
    const harnessRunRepository = createCapturingEvidenceHarnessRunRepository(
      dependencies,
      aggregate,
      capture
    );
    const applicationPath = "packages/cli/src/run-evidence-capture-command.ts";
    const verificationCommand = "pnpm --filter @krn/cli test -- evidence";
    const result = await runCli(
      [
        "evidence",
        "capture",
        "--run-id",
        "execution-run-1",
        "--intended-file",
        applicationPath,
        "--decision-packet-checksum",
        packetBinding.packetChecksum,
        "--verification",
        `${verificationCommand}=passed`,
        "--source-usefulness",
        `claim:source-claim-1=helped|Source application and verification both passed|${packetBinding.packetEvidenceRef},${applicationPath},${verificationCommand}|Does not prove source truth`,
        "--memory-usefulness",
        `knowledge:ts-boundary-unknown-first-result-state=used|Memory application was observed|${packetBinding.packetEvidenceRef},${applicationPath}|Does not prove memory usefulness`,
        "--persist"
      ],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        cwd: path.resolve(process.cwd(), "../.."),
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        readGitStatus: async () => ` M ${applicationPath}\n`,
        createDatabaseRuntime: async () => ({
          workspaceId: "workspace-1",
          projectId: "project-1",
          compilerDependencies: {
            ...dependencies,
            harnessRunRepository
          },
          harnessRunRepository,
          sourceRepository: unusedSourceRepository,
          memoryRepository: unusedMemoryRepository,
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(capture.feedbackDeltaMetadata).toMatchObject({
      sourceUsefulnessOutcomes: [{
        sourceClaimId: "source-claim-1",
        outcome: "helped"
      }],
      knowledgeUsefulnessOutcomes: [{
        knowledgeId: "knowledge:ts-boundary-unknown-first-result-state",
        outcome: "used"
      }]
    });
  });

  it("downgrades persisted knowledge usefulness when evidence refs do not match current evidence", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    const capture: EvidencePersistenceCapture = {};
    const aggregate = createEvidencePersistenceAggregate();
    const harnessRunRepository = createCapturingEvidenceHarnessRunRepository(
      dependencies,
      aggregate,
      capture
    );
    const result = await runCli(
      [
        "evidence",
        "capture",
        "--run-id",
        "execution-run-1",
        "--decision-packet-checksum",
        "fake-packet",
        "--intended-file",
        "packages/cli/src/run-evidence-capture-command.ts",
        "--memory-usefulness",
        "knowledge:ts-boundary-unknown-first-result-state=helped|Knowledge allegedly helped without current proof|packet:fake-packet|Does not prove future memory recall quality",
        "--source-usefulness",
        "claim:source-claim-1=helped|Source allegedly helped without current proof|packet:fake-packet|Does not prove future source selection quality",
        "--persist"
      ],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        cwd: path.resolve(process.cwd(), "../.."),
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        readGitStatus: async () => " M packages/cli/src/run-evidence-capture-command.ts\n",
        createDatabaseRuntime: async () => ({
          workspaceId: "workspace-1",
          projectId: "project-1",
          compilerDependencies: {
            ...dependencies,
            harnessRunRepository
          },
          harnessRunRepository,
          sourceRepository: unusedSourceRepository,
          memoryRepository: unusedMemoryRepository,
          maintenanceQueueRepository: createCapturingMaintenanceQueueRepository(capture),
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("outcome=unknown sourceClaim=source-claim-1 sourceDecision=none");
    expect(result.stdout).toContain("outcome=unknown knowledge=knowledge:ts-boundary-unknown-first-result-state");
    expect(result.stdout).toContain("packet checksum is not the current reconstructed packet checksum");
    expect(capture.feedbackDeltaMetadata).toMatchObject({
      sourceUsefulnessOutcomes: [{
        sourceClaimId: "source-claim-1",
        outcome: "unknown",
        reason: expect.stringContaining("packet checksum is not the current reconstructed packet checksum"),
        evidenceRefs: ["packet:fake-packet"],
        doesNotProve: "Does not prove future source selection quality"
      }],
      knowledgeUsefulnessOutcomes: [{
        knowledgeId: "knowledge:ts-boundary-unknown-first-result-state",
        outcome: "unknown",
        reason: expect.stringContaining("packet checksum is not the current reconstructed packet checksum"),
        evidenceRefs: ["packet:fake-packet"],
        doesNotProve: "Does not prove future memory recall quality"
      }]
    });
    expect(capture.maintenanceQueueInputs).toBeUndefined();
    expect(result.stdout).not.toContain("feedbackMaintenanceQueueRecord:");
    expect(result.stdout).not.toContain("feedbackMaintenanceRun:");
  });

  it("does not enqueue maintenance for helped-only persisted usefulness feedback", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    const capture: EvidencePersistenceCapture = {};
    const aggregate = createEvidencePersistenceAggregate();
    const harnessRunRepository = createCapturingEvidenceHarnessRunRepository(
      dependencies,
      aggregate,
      capture
    );
    const result = await runCli(
      [
        "evidence",
        "capture",
        "--run-id",
        "execution-run-1",
        "--source-usefulness",
        "claim:source-claim-current=helped|Current source claim helped|evidence-bundle-1|Does not prove future source selection quality",
        "--memory-usefulness",
        "knowledge:frontend-template=helped|Current knowledge helped|evidence-bundle-1|Does not prove future memory recall quality",
        "--persist"
      ],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        cwd: path.resolve(process.cwd(), "../.."),
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        readGitStatus: async () => "",
        createDatabaseRuntime: async () => ({
          workspaceId: "workspace-1",
          projectId: "project-1",
          compilerDependencies: {
            ...dependencies,
            harnessRunRepository
          },
          harnessRunRepository,
          sourceRepository: unusedSourceRepository,
          memoryRepository: unusedMemoryRepository,
          maintenanceQueueRepository: createCapturingMaintenanceQueueRepository(capture),
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(capture.maintenanceQueueInputs).toBeUndefined();
    expect(result.stdout).not.toContain("feedbackMaintenanceQueueRecord:");
    expect(result.stdout).not.toContain("feedbackMaintenanceRun:");
  });

  it("binds persisted usefulness feedback to the supplied decision packet checksum", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    const capture: EvidencePersistenceCapture = {};
    const aggregate = createEvidencePersistenceAggregate();
    const packetBinding = currentDecisionPacketBindingForAggregate(aggregate);
    const harnessRunRepository = createCapturingEvidenceHarnessRunRepository(
      dependencies,
      aggregate,
      capture
    );
    const result = await runCli(
      [
        "evidence",
        "capture",
        "--run-id",
        "execution-run-1",
        "--decision-packet-checksum",
        packetBinding.packetChecksum,
        "--source-usefulness",
        `claim:source-claim-current=helped|Current packet source helped|${packetBinding.packetEvidenceRef}|Does not prove future source selection quality`,
        "--source-usefulness",
        `claim:source-claim-stale=helped|Stale packet source allegedly helped|${packetBinding.packetEvidenceRef}|Does not prove future source selection quality`,
        "--persist"
      ],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        cwd: path.resolve(process.cwd(), "../.."),
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        readGitStatus: async () => "",
        createDatabaseRuntime: async () => ({
          workspaceId: "workspace-1",
          projectId: "project-1",
          compilerDependencies: {
            ...dependencies,
            harnessRunRepository
          },
          harnessRunRepository,
          sourceRepository: unusedSourceRepository,
          memoryRepository: unusedMemoryRepository,
          maintenanceQueueRepository: createCapturingMaintenanceQueueRepository(capture),
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain(`DecisionPacket: checksum=${packetBinding.packetChecksum} | evidenceRef=${packetBinding.packetEvidenceRef}`);
    expect(result.stdout).toContain(`decisionPacketEvidenceRef: ${packetBinding.packetEvidenceRef}`);
    expect(capture.evidenceBundle?.metadata).toMatchObject({
      decisionPacketChecksum: packetBinding.packetChecksum,
      decisionPacketEvidenceRef: packetBinding.packetEvidenceRef
    });
    expect(capture.feedbackDeltaMetadata).toMatchObject({
      decisionPacketChecksum: packetBinding.packetChecksum,
      decisionPacketEvidenceRef: packetBinding.packetEvidenceRef,
      sourceUsefulnessOutcomes: [{
        sourceClaimId: "source-claim-current",
        outcome: "selected",
        evidenceRefs: [packetBinding.packetEvidenceRef]
      }, {
        sourceClaimId: "source-claim-stale",
        outcome: "selected",
        evidenceRefs: [packetBinding.packetEvidenceRef]
      }]
    });
  });

  it("feeds persisted usefulness feedback into the next DecisionPacket caveats", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    const capture: EvidencePersistenceCapture = {};
    const aggregate = createEvidencePersistenceAggregate();
    const packetBinding = currentDecisionPacketBindingForAggregate(aggregate);
    const harnessRunRepository = createCapturingEvidenceHarnessRunRepository(
      dependencies,
      aggregate,
      capture
    );
    const result = await runCli(
      [
        "evidence",
        "capture",
        "--run-id",
        "execution-run-1",
        "--decision-packet-checksum",
        packetBinding.packetChecksum,
        "--source-usefulness",
        `claim:source-claim-stale=stale|Selected source claim became stale|${packetBinding.packetEvidenceRef}|Does not demote source truth without review`,
        "--memory-usefulness",
        `knowledge:frontend-template=stale|Selected knowledge became stale|${packetBinding.packetEvidenceRef}|Does not demote memory truth without review`,
        "--persist"
      ],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        cwd: path.resolve(process.cwd(), "../.."),
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        readGitStatus: async () => "",
        createDatabaseRuntime: async () => ({
          workspaceId: "workspace-1",
          projectId: "project-1",
          compilerDependencies: {
            ...dependencies,
            harnessRunRepository
          },
          harnessRunRepository,
          sourceRepository: unusedSourceRepository,
          memoryRepository: unusedMemoryRepository,
          maintenanceQueueRepository: createCapturingMaintenanceQueueRepository(capture),
          async close() {
            return undefined;
          }
        })
      }
    );

    if (capture.feedbackDeltaMetadata === undefined) {
      throw new Error("Expected persisted feedback metadata");
    }

    const contextAssembly = aggregate.contextAssembly;

    if (contextAssembly === undefined) {
      throw new Error("Expected aggregate context assembly");
    }

    const nextAggregate: HarnessRunAggregate = {
      ...aggregate,
      contextAssembly: {
        ...contextAssembly,
        inclusions: [{
          subjectType: "source_claim",
          subjectId: "source-claim-stale",
          reason: "Previously selected source claim.",
          expectedUse: "Use only if current.",
          sourceAuthority: "project-decision"
        }, {
          subjectType: "memory_record",
          subjectId: "knowledge:frontend-template",
          reason: "Previously selected retained knowledge.",
          expectedUse: "Use only if current.",
          sourceAuthority: "project-decision"
        }]
      },
      feedbackDeltas: [{
        id: "feedback-delta-1",
        reviewAssessmentId: "review-assessment-1",
        status: "candidate",
        memoryCandidates: [],
        sourceDecisions: [],
        evalCandidates: [],
        metadata: capture.feedbackDeltaMetadata,
        createdAt: now,
        updatedAt: now
      }]
    };
    const packet = buildDecisionPacketFromReadModel(
      buildDecisionPacketReadModel(nextAggregate)
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(packet.caveatedSourceClaimIds).toEqual(["source-claim-stale"]);
    expect(packet.caveatedMemoryRefs).toEqual(["knowledge:frontend-template"]);
    expect(packet.staleKnowledgeIds).toEqual(["knowledge:frontend-template"]);
    expect(packet.sourceConsensus.evidenceGapIds).toContain(
      "evidence-gap:execution-run-1:caveated-source-authority:source-claim-stale"
    );
    expect(packet.sourceConsensus.evidenceGapIds).toContain(
      "evidence-gap:execution-run-1:caveated-memory-authority:knowledge:frontend-template"
    );
    expect(packet.abstentionScore.reasons).toContain("caveated_source_authority");
    expect(packet.abstentionScore.reasons).toContain("caveated_memory_authority");
  });

  it("rejects usefulness bound to a stale reconstructed packet", () => {
    const aggregate = createEvidencePersistenceAggregate();
    const staleBinding = currentDecisionPacketBindingForAggregate(aggregate);
    const contextAssembly = aggregate.contextAssembly;
    if (contextAssembly === undefined) {
      throw new Error("Expected aggregate context assembly");
    }
    const changedAggregate: HarnessRunAggregate = {
      ...aggregate,
      contextAssembly: {
        ...contextAssembly,
        inclusions: [...contextAssembly.inclusions, {
          subjectType: "source_claim",
          subjectId: "newly-selected-claim",
          reason: "Changed packet selection.",
          expectedUse: "Use only if current.",
          sourceAuthority: "project-decision"
        }]
      }
    };

    const authorization = authorizePacketUsefulness({
      aggregate: changedAggregate,
      runId: aggregate.executionRun.id,
      runtimeProjectId: "project-1",
      callerPacketChecksum: staleBinding.packetChecksum,
      subjects: [{
        kind: "source_claim",
        id: "source-claim-1",
        evidenceRefs: [staleBinding.packetEvidenceRef]
      }]
    });

    expect(authorization.authorized).toBe(false);
    expect(authorization.reason).toContain("current reconstructed packet checksum");
  });

  it("rejects a store subject absent from the current packet", () => {
    const aggregate = createEvidencePersistenceAggregate();
    const binding = currentDecisionPacketBindingForAggregate(aggregate);

    const authorization = authorizePacketUsefulness({
      aggregate,
      runId: aggregate.executionRun.id,
      runtimeProjectId: "project-1",
      callerPacketChecksum: binding.packetChecksum,
      subjects: [{
        kind: "source_claim",
        id: "store-only-claim",
        evidenceRefs: [binding.packetEvidenceRef]
      }]
    });

    expect(authorization.authorized).toBe(false);
    expect(authorization.reason).toContain("not selected by the current packet");
  });

  it("does not treat an architecture decision target as a SourceDecision id", () => {
    const aggregate = createEvidencePersistenceAggregate();
    const aggregateWithDecisionTarget: HarnessRunAggregate = {
      ...aggregate,
      activationTrace: {
        retrievalRunId: "retrieval-run-1",
        candidates: [{
          id: "retrieval-candidate-1",
          retrievalRunId: "retrieval-run-1",
          kind: "source",
          status: "included",
          subjectType: "source_claim",
          subjectId: "source-claim-1",
          sourceAuthority: "project-decision",
          lexicalScore: 10,
          vectorScore: 0,
          graphScore: 10,
          temporalScore: 0,
          contextRoiScore: 10,
          totalScore: 30,
          score: 30,
          reason: "Selected source claim supports an architecture target.",
          metadata: {
            sourceDecisionSupportBoost: {
              sourceDecisionEdgeIds: ["source-decision-edge-1"],
              targets: [{
                sourceDecisionEdgeId: "source-decision-edge-1",
                targetType: "architecture_decision",
                targetId: "architecture-target-1"
              }],
              confidence: ["high"],
              supportTypes: ["decision"],
              doesNotProve: "Decision support does not turn its target into a SourceDecision id."
            }
          },
          createdAt: now
        }],
        decisions: []
      }
    };
    const packet = buildDecisionPacketFromReadModel(
      buildDecisionPacketReadModel(aggregateWithDecisionTarget)
    );
    const binding = currentDecisionPacketBindingForAggregate(aggregateWithDecisionTarget);

    expect(packet.sourceDecisionTargets).toEqual([expect.objectContaining({
      targetId: "architecture-target-1"
    })]);

    const authorization = authorizePacketUsefulness({
      aggregate: aggregateWithDecisionTarget,
      runId: aggregate.executionRun.id,
      runtimeProjectId: "project-1",
      callerPacketChecksum: binding.packetChecksum,
      subjects: [{
        kind: "source_decision",
        id: "architecture-target-1",
        evidenceRefs: [binding.packetEvidenceRef]
      }]
    });

    expect(authorization.authorized).toBe(false);
    expect(authorization.reason).toContain("not selected by the current packet");
  });

  it("rejects usefulness when runtime and task projects differ", () => {
    const aggregate = createEvidencePersistenceAggregate();
    const binding = currentDecisionPacketBindingForAggregate(aggregate);

    const authorization = authorizePacketUsefulness({
      aggregate,
      runId: aggregate.executionRun.id,
      runtimeProjectId: "project-b",
      callerPacketChecksum: binding.packetChecksum,
      subjects: [{
        kind: "source_claim",
        id: "source-claim-1",
        evidenceRefs: [binding.packetEvidenceRef]
      }]
    });

    expect(authorization.authorized).toBe(false);
    expect(authorization.reason).toContain("runtime project does not match");
  });

  it("prints supplied evidence command outcomes instead of default skipped rows", async () => {
    const result = await runCli(
      [
        "evidence",
        "capture",
        "--command",
        "pnpm typecheck",
        "--status",
        "passed",
        "--exit-code",
        "0",
        "--output",
        ".local-lab/p7-self-hosting/02-typecheck.txt",
        "--command",
        "pnpm test",
        "--status",
        "failed",
        "--exit-code",
        "1",
        "--output",
        ".local-lab/p7-self-hosting/03-test.txt"
      ],
      {
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        readGitStatus: async () => ""
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain(
      "pnpm typecheck: passed | provenance=captured_output_file | exitCode=0 | output=.local-lab/p7-self-hosting/02-typecheck.txt | doesNotProve=This command result does not prove memory quality, source truth, review correctness, or production readiness."
    );
    expect(result.stdout).toContain(
      "pnpm test: failed | provenance=captured_output_file | exitCode=1 | output=.local-lab/p7-self-hosting/03-test.txt | doesNotProve=This command result does not prove memory quality, source truth, review correctness, or production readiness."
    );
    expect(result.stdout).not.toContain("pnpm typecheck: skipped");
  });

  it("prints explicit verification evidence as operator-reported provenance", async () => {
    const result = await runCli(
      [
        "evidence",
        "capture",
        "--verification",
        "pnpm typecheck=passed",
        "--verification=pnpm test=passed"
      ],
      {
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        readGitStatus: async () => ""
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain(
      "pnpm typecheck: passed | provenance=operator_reported | doesNotProve=This command result does not prove memory quality, source truth, review correctness, or production readiness."
    );
    expect(result.stdout).toContain(
      "pnpm test: passed | provenance=operator_reported | doesNotProve=This command result does not prove memory quality, source truth, review correctness, or production readiness."
    );
    expect(result.stdout).not.toContain(
      "Command provenance is weak: default_template rows are not proof that commands ran."
    );
  });

  it("persists supplied evidence command outcomes for a run id", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    let capturedCommands: CreateEvidenceBundleInput["commands"] | undefined;
    const aggregate: HarnessRunAggregate = {
      operatorIntent: {
        id: "operator-intent-1",
        workspaceId: "workspace-1",
        projectId: "project-1",
        source: "cli",
        rawIntent: "persist harness run",
        status: "received",
        metadata: {},
        createdAt: now
      },
      taskContract: {
        id: "task-contract-1",
        operatorIntentId: "operator-intent-1",
        projectId: "project-1",
        title: "persist harness run",
        objective: "persist harness run",
        constraints: [],
        nonGoals: [],
        acceptance: [],
        status: "active",
        metadata: {},
        createdAt: now,
        updatedAt: now
      },
      harnessPlan: {
        id: "harness-plan-1",
        taskContractId: "task-contract-1",
        version: 1,
        status: "ready",
        summary: "persist harness run",
        metadata: {},
        createdAt: now,
        updatedAt: now
      },
      contextAssembly: {
        id: "context-assembly-1",
        harnessPlanId: "harness-plan-1",
        status: "assembled",
        inclusions: [],
        exclusions: [],
        metadata: {},
        createdAt: now
      },
      executionRun: {
        id: "execution-run-1",
        harnessPlanId: "harness-plan-1",
        adapter: "codex",
        status: "planned",
        metadata: {},
        createdAt: now,
        updatedAt: now
      },
      evidenceBundles: [],
      reviewAssessments: [],
      feedbackDeltas: [],
      runEvents: [{
        id: "run-event-1",
        executionRunId: "execution-run-1",
        sequence: 1,
        type: "plan.persisted",
        severity: "info",
        message: "plan persisted",
        payload: {},
        occurredAt: now
      }]
    };
    const harnessRunRepository = {
      ...dependencies.harnessRunRepository,
      async createExecutionRun(_input: CreateExecutionRunInput) {
        return aggregate.executionRun;
      },
      async getHarnessRunByExecutionRunId() {
        return aggregate;
      },
      async createEvidenceBundle(input: CreateEvidenceBundleInput) {
        capturedCommands = input.commands;

        return {
          id: "evidence-bundle-1",
          executionRunId: input.executionRunId,
          status: input.status ?? "captured",
          changedFiles: input.changedFiles,
          commands: input.commands,
          diffRisk: input.diffRisk,
          reviewBurden: input.reviewBurden,
          rollbackPath: input.rollbackPath,
          metadata: input.metadata ?? {},
          createdAt: now,
          updatedAt: now
        };
      },
      async createReviewAssessment(input: CreateReviewAssessmentInput) {
        return {
          id: "review-assessment-1",
          evidenceBundleId: input.evidenceBundleId,
          status: input.status ?? "pending",
          reviewer: input.reviewer,
          summary: input.summary,
          findings: input.findings,
          metadata: input.metadata ?? {},
          createdAt: now,
          updatedAt: now
        };
      },
      async createFeedbackDelta(input: CreateFeedbackDeltaInput) {
        return {
          id: "feedback-delta-1",
          reviewAssessmentId: input.reviewAssessmentId,
          status: input.status ?? "candidate",
          memoryCandidates: input.memoryCandidates,
          sourceDecisions: input.sourceDecisions,
          evalCandidates: input.evalCandidates,
          metadata: input.metadata ?? {},
          createdAt: now,
          updatedAt: now
        };
      },
      async createEvidenceFeedbackOnce(input: CreateEvidenceFeedbackOnceInput) {
        capturedCommands = input.evidence.commands;

        return {
          evidenceBundle: {
            id: "evidence-bundle-1",
            executionRunId: input.executionRunId,
            status: input.evidence.status ?? "captured",
            changedFiles: input.evidence.changedFiles,
            commands: input.evidence.commands,
            diffRisk: input.evidence.diffRisk,
            reviewBurden: input.evidence.reviewBurden,
            rollbackPath: input.evidence.rollbackPath,
            metadata: input.evidence.metadata ?? {},
            createdAt: now,
            updatedAt: now
          },
          reviewAssessment: {
            id: "review-assessment-1",
            evidenceBundleId: "evidence-bundle-1",
            status: input.review.status ?? "pending",
            reviewer: input.review.reviewer,
            summary: input.review.summary,
            findings: input.review.findings,
            metadata: input.review.metadata ?? {},
            createdAt: now,
            updatedAt: now
          },
          feedbackDelta: {
            id: "feedback-delta-1",
            reviewAssessmentId: "review-assessment-1",
            status: input.feedback.status ?? "candidate",
            memoryCandidates: input.feedback.memoryCandidates,
            sourceDecisions: input.feedback.sourceDecisions,
            evalCandidates: input.feedback.evalCandidates,
            metadata: input.feedback.metadata ?? {},
            createdAt: now,
            updatedAt: now
          },
          created: true
        };
      }
    };
    const result = await runCli(
      [
        "evidence",
        "capture",
        "--run-id",
        "execution-run-1",
        "--persist",
        "--command",
        "pnpm typecheck",
        "--status",
        "passed",
        "--exit-code",
        "0",
        "--output",
        ".local-lab/p7-self-hosting/02-typecheck.txt",
        "--command",
        "pnpm test",
        "--status",
        "passed",
        "--exit-code",
        "0"
      ],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        readGitStatus: async () => "",
        createDatabaseRuntime: async () => ({
          workspaceId: "workspace-1",
          projectId: "project-1",
          compilerDependencies: {
            ...dependencies,
            harnessRunRepository
          },
          harnessRunRepository,
          sourceRepository: unusedSourceRepository,
          memoryRepository: unusedMemoryRepository,
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(capturedCommands).toEqual([
      {
        kind: "captured_output_file",
        command: "pnpm typecheck",
        status: "passed",
        provenance: "captured_output_file",
        exitCode: 0,
        outputPath: ".local-lab/p7-self-hosting/02-typecheck.txt",
        outputRef: ".local-lab/p7-self-hosting/02-typecheck.txt",
        doesNotProve:
          "This command result does not prove memory quality, source truth, review correctness, or production readiness."
      },
      {
        kind: "operator_reported",
        command: "pnpm test",
        status: "passed",
        provenance: "operator_reported",
        exitCode: 0,
        doesNotProve:
          "This command result does not prove memory quality, source truth, review correctness, or production readiness."
      }
    ]);
  });

  it("prints clean evidence capture when there are no changed files", async () => {
    const result = await runCli(["evidence", "capture"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      readGitStatus: async () => ""
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Changed files:\n- none");
    expect(result.stdout).toContain("Diff risk: low");
    expect(result.stdout).toContain("pnpm typecheck: not_run | provenance=default_template");
    expect(result.stdout).toContain(
      "Command provenance is weak: default_template rows are not proof that commands ran."
    );
    expect(result.stdout).toContain("memoryCandidates:\n- none");
    expect(result.stdout).toContain("No changed files; no feedback candidate proposed.");
  });
});
