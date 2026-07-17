import { execFile } from "node:child_process";
import crypto from "node:crypto";
import { rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import {
  createKrnDatabase
} from "@krn/db";
import {
  currentDecisionPacketBindingForHarnessRun
} from "@krn/core";
import type {
  EvalCandidateProposal
} from "@krn/core";
import {
  createCompiledSmokeExecution,
  migrateDatabase
} from "@krn/db/dev";
import postgres from "postgres";
import {
  describe,
  expect,
  it
} from "vitest";

import {
  defaultProjectSlug,
  defaultWorkspaceSlug
} from "../database-runtime.js";
import { runEvidenceCaptureCommand } from "../run-evidence-capture-command.js";

const databaseUrl = process.env.KRN_DATABASE_URL?.trim();
const execFileAsync = promisify(execFile);
const repoRoot = fileURLToPath(new URL("../../../../", import.meta.url));
const migrationsFolder = path.join(repoRoot, "packages", "db", "src", "migrations");

const databaseUrlFor = (input: string, databaseName: string): string => {
  const parsed = new URL(input);
  parsed.pathname = `/${databaseName}`;
  return parsed.toString();
};

const createDisposableDatabase = async (input: string): Promise<{
  readonly databaseUrl: string;
  readonly cleanup: () => Promise<void>;
}> => {
  const databaseName = `krn_evidence_capture_retry_${crypto.randomUUID().replaceAll("-", "")}`;
  const adminClient = postgres(databaseUrlFor(input, "postgres"), {
    max: 1,
    onnotice: () => undefined
  });

  await adminClient.unsafe(`create database ${databaseName}`);

  return {
    databaseUrl: databaseUrlFor(input, databaseName),
    cleanup: async () => {
      try {
        await adminClient.unsafe(`drop database if exists ${databaseName} with (force)`);
      } finally {
        await adminClient.end();
      }
    }
  };
};

const runEvidenceCaptureCli = async (input: {
  readonly databaseUrl: string;
  readonly runId: string;
  readonly packetChecksum: string;
  readonly packetGeneratedAt: string;
  readonly sourceUsefulness: string;
  readonly intendedFile: string;
}) => execFileAsync("pnpm", [
  "--silent",
  "--filter",
  "@krn/cli",
  "krn",
  "evidence",
  "capture",
  "--run-id",
  input.runId,
  "--decision-packet-checksum",
  input.packetChecksum,
  "--decision-packet-generated-at",
  input.packetGeneratedAt,
  "--source-usefulness",
  input.sourceUsefulness,
  "--intended-file",
  input.intendedFile,
  "--verification",
  "pnpm typecheck=passed",
  "--persist"
], {
  cwd: repoRoot,
  encoding: "utf8",
  env: {
    ...process.env,
    KRN_DATABASE_URL: input.databaseUrl
  }
});

const captureIdentityFrom = (stdout: string): string => {
  const match = /^captureIdentity: (.+)$/mu.exec(stdout);

  if (match?.[1] === undefined) {
    throw new Error("evidence capture CLI did not emit a capture identity");
  }

  return match[1];
};

const memoryCandidateIdFrom = (stdout: string): string => {
  const match = /^- (memory-candidate-proposal-[^:]+):/mu.exec(stdout);

  if (match?.[1] === undefined) {
    throw new Error("evidence capture CLI did not render its persisted memory candidate identity");
  }

  return match[1];
};

describe("evidence capture retry boundary", () => {
  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
    "keeps a sequential changed-file retry in one evidence chain across CLI processes",
    // fallow-ignore-next-line complexity -- one disposable PostgreSQL smoke owns source, eval, transient-failure, idempotency, and proposal-only readbacks
    async () => {
      const disposableDatabase = await createDisposableDatabase(databaseUrl!);
      const client = postgres(disposableDatabase.databaseUrl, {
        max: 1,
        onnotice: () => undefined
      });
      const intendedFile = `.krn-evidence-capture-retry-source-fixture-${crypto.randomUUID()}.ts`;

      try {
        await writeFile(
          path.join(repoRoot, intendedFile),
          "evidence capture retry changed-file fixture\n"
        );
        await migrateDatabase({
          databaseUrl: disposableDatabase.databaseUrl,
          migrationsFolder
        });
        let selectedSourceClaimId: string | undefined;
        const compiled = await createCompiledSmokeExecution({
          acceptance: "persist one semantic evidence capture across CLI retries",
          command: "evidence-capture-retry-test",
          db: createKrnDatabase(client),
          marker: "evidence-capture-retry",
          projectSlug: defaultProjectSlug,
          task: "falsify sequential evidence capture retry",
          workspaceSlug: defaultWorkspaceSlug,
          prepare: async ({ project, sourceRepository }) => {
            const evidenceMetadata = {
              evidenceStatus: "captured",
              evidenceContentHash: "sha256:evidence-capture-retry-selected-source",
              evidenceFreshness: "current"
            };
            const artifact = await sourceRepository.createSourceArtifact({
              projectId: project.id,
              kind: "run",
              uri: "operator://evidence-capture-retry/selected-source",
              title: "Sequential evidence capture retry authority",
              contentHash: "evidence-capture-retry-selected-source",
              sourceAuthority: "project-decision",
              metadata: evidenceMetadata
            });
            const chunk = await sourceRepository.createSourceChunk({
              sourceArtifactId: artifact.id,
              ordinal: 0,
              content: "Sequential evidence capture retry must remain one semantic chain.",
              contentHash: "evidence-capture-retry-selected-source-chunk",
              metadata: evidenceMetadata
            });
            const claim = await sourceRepository.createSourceClaim({
              sourceArtifactId: artifact.id,
              sourceChunkId: chunk.id,
              claim: "Sequential evidence capture retry must remain one semantic chain.",
              mechanism: "A stable request identity resolves exact retries to stored evidence.",
              krnImplication: "Evidence capture avoids duplicate review and feedback chains.",
              doesNotProve: "This source fixture does not prove distributed exactly-once delivery.",
              sourceAuthority: "project-decision",
              supportType: "decision",
              consumer: "evidence capture retry test",
              falsifier: "Two CLI retries persist different chains.",
              status: "proposed",
              metadata: evidenceMetadata
            });
            const decision = await sourceRepository.createSourceDecision({
              projectId: project.id,
              sourceClaimId: claim.id,
              status: "adopt",
              decision: "Use stable semantic identity for evidence capture retries.",
              rationale: "The retry must resolve the original stored chain.",
              falsifier: "A retry creates a second chain.",
              consumer: "evidence capture retry test",
              metadata: evidenceMetadata
            });
            await sourceRepository.createSourceDecisionEdge({
              sourceClaimId: claim.id,
              sourceDecisionId: decision.id,
              targetType: "architecture_decision",
              targetId: "architecture-decision:evidence-capture-retry",
              supportType: "decision",
              confidence: "high",
              notes: "Canonical support for the retry falsifier.",
              metadata: evidenceMetadata
            });
            selectedSourceClaimId = claim.id;
          }
        });
        const aggregate = await compiled.harnessRunRepository
          .getHarnessRunByExecutionRunId(compiled.executionRun.id);
        if (aggregate === undefined) {
          throw new Error("compiled evidence capture retry run is missing");
        }
        if (
          selectedSourceClaimId === undefined ||
          !aggregate.contextAssembly?.inclusions.some(
            (inclusion) => inclusion.subjectId === selectedSourceClaimId
          )
        ) {
          throw new Error("evidence capture retry source claim was not selected");
        }
        const packetBinding = currentDecisionPacketBindingForHarnessRun({
          aggregate,
          packetGeneratedAt: "2026-07-15T00:00:00.000Z",
          sha256Hex: (value) => crypto.createHash("sha256").update(value).digest("hex")
        });
        const first = await runEvidenceCaptureCli({
          databaseUrl: disposableDatabase.databaseUrl,
          runId: compiled.executionRun.id,
          packetChecksum: packetBinding.packetChecksum,
          packetGeneratedAt: packetBinding.packetGeneratedAt,
          intendedFile,
          sourceUsefulness: `claim:${selectedSourceClaimId}=stale|Selected retry guidance was stale|${packetBinding.packetEvidenceRef}|One stale report does not prove future source selection quality`
        });
        const readChainCounts = async () => client<{
          evidenceBundleCount: number;
          reviewAssessmentCount: number;
          feedbackDeltaCount: number;
          memoryCandidateProposalCount: number;
          sourceDecisionProposalCount: number;
          evalCandidateProposalCount: number;
          materializedMemoryCandidateCount: number;
          outboxEventCount: number;
          maintenanceCount: number;
        }[]>`
          select
            (select count(*)::int from evidence_bundles
              where execution_run_id = ${compiled.executionRun.id}) as "evidenceBundleCount",
            (select count(*)::int from review_assessments review
              inner join evidence_bundles bundle on bundle.id = review.evidence_bundle_id
              where bundle.execution_run_id = ${compiled.executionRun.id}) as "reviewAssessmentCount",
            (select count(*)::int from feedback_deltas feedback
              inner join review_assessments review on review.id = feedback.review_assessment_id
              inner join evidence_bundles bundle on bundle.id = review.evidence_bundle_id
              where bundle.execution_run_id = ${compiled.executionRun.id}) as "feedbackDeltaCount",
            (select coalesce(sum(jsonb_array_length(feedback.memory_candidates)), 0)::int
              from feedback_deltas feedback
              inner join review_assessments review on review.id = feedback.review_assessment_id
              inner join evidence_bundles bundle on bundle.id = review.evidence_bundle_id
              where bundle.execution_run_id = ${compiled.executionRun.id}) as "memoryCandidateProposalCount",
            (select coalesce(sum(jsonb_array_length(feedback.source_decisions)), 0)::int
              from feedback_deltas feedback
              inner join review_assessments review on review.id = feedback.review_assessment_id
              inner join evidence_bundles bundle on bundle.id = review.evidence_bundle_id
              where bundle.execution_run_id = ${compiled.executionRun.id}) as "sourceDecisionProposalCount",
            (select coalesce(sum(jsonb_array_length(feedback.eval_candidates)), 0)::int
              from feedback_deltas feedback
              inner join review_assessments review on review.id = feedback.review_assessment_id
              inner join evidence_bundles bundle on bundle.id = review.evidence_bundle_id
              where bundle.execution_run_id = ${compiled.executionRun.id}) as "evalCandidateProposalCount",
            (select count(*)::int from memory_candidates
              where execution_run_id = ${compiled.executionRun.id}) as "materializedMemoryCandidateCount",
            (select count(*)::int from outbox_events
              where topic = 'feedback.delta.created'
                and payload->>'projectId' = ${compiled.project.id}) as "outboxEventCount",
            (select count(*)::int from maintenance_queue_records
              where payload->>'projectId' = ${compiled.project.id}) as "maintenanceCount"
        `;
        let transientFailure: { stderr?: string } | undefined;
        try {
          await runEvidenceCaptureCli({
            databaseUrl: "postgres://127.0.0.1:0/krn",
            runId: compiled.executionRun.id,
            packetChecksum: packetBinding.packetChecksum,
            packetGeneratedAt: packetBinding.packetGeneratedAt,
            intendedFile,
            sourceUsefulness: `claim:${selectedSourceClaimId}=stale|Selected retry guidance was stale|${packetBinding.packetEvidenceRef}|One stale report does not prove future source selection quality`
          });
        } catch (error) {
          transientFailure = error as { stderr?: string };
        }
        expect(transientFailure?.stderr).toContain("evidence_capture (disposition=transient, retryable)");
        expect(await readChainCounts()).toEqual([{
          evidenceBundleCount: 1,
          reviewAssessmentCount: 1,
          feedbackDeltaCount: 1,
          memoryCandidateProposalCount: 1,
          sourceDecisionProposalCount: 1,
          evalCandidateProposalCount: 0,
          materializedMemoryCandidateCount: 0,
          outboxEventCount: 1,
          maintenanceCount: 1
        }]);

        const retry = await runEvidenceCaptureCli({
          databaseUrl: disposableDatabase.databaseUrl,
          runId: compiled.executionRun.id,
          packetChecksum: packetBinding.packetChecksum,
          packetGeneratedAt: packetBinding.packetGeneratedAt,
          intendedFile,
          sourceUsefulness: `claim:${selectedSourceClaimId}=stale|Selected retry guidance was stale|${packetBinding.packetEvidenceRef}|One stale report does not prove future source selection quality`
        });
        const counts = await readChainCounts();

        expect(captureIdentityFrom(retry.stdout)).toBe(captureIdentityFrom(first.stdout));
        expect(memoryCandidateIdFrom(retry.stdout)).toBe(memoryCandidateIdFrom(first.stdout));
        expect(retry.stdout).toContain(`decisionPacketEvidenceRef: ${packetBinding.packetEvidenceRef}`);
        expect(retry.stdout).not.toContain("packetBinding: unbound");
        expect(retry.stdout).toContain(`outcome=stale sourceClaim=${selectedSourceClaimId}`);
        expect(counts[0]).toEqual({
          evidenceBundleCount: 1,
          reviewAssessmentCount: 1,
          feedbackDeltaCount: 1,
          memoryCandidateProposalCount: 1,
          sourceDecisionProposalCount: 1,
          evalCandidateProposalCount: 0,
          materializedMemoryCandidateCount: 0,
          outboxEventCount: 1,
          maintenanceCount: 1
        });

        const evalExecutionRun = await compiled.harnessRunRepository.createExecutionRun({
          harnessPlanId: compiled.result.harnessPlan.id,
          adapter: "codex",
          metadata: { smokeId: "evidence-capture-eval-retry" }
        });
        const evalAggregate = await compiled.harnessRunRepository
          .getHarnessRunByExecutionRunId(evalExecutionRun.id);
        if (evalAggregate === undefined) {
          throw new Error("compiled eval retry run is missing");
        }
        const evalPacketBinding = currentDecisionPacketBindingForHarnessRun({
          aggregate: evalAggregate,
          packetGeneratedAt: "2026-07-15T00:00:00.000Z",
          sha256Hex: (value) => crypto.createHash("sha256").update(value).digest("hex")
        });
        const evalProposal: EvalCandidateProposal = {
          id: "eval-candidate-postgres-retry" as EvalCandidateProposal["id"],
          status: "candidate",
          title: "Postgres retry eval proposal",
          scenario: "A transient persistence failure occurs",
          expectedSignal: "The same eval proposal is retained exactly once",
          sourceEvidence: [evalPacketBinding.packetEvidenceRef],
          metadata: { consumer: "evidence capture retry smoke" },
          createdAt: "2026-07-15T00:00:00.000Z"
        };
        const runEvalCapture = (url: string) => runEvidenceCaptureCommand({
          env: { KRN_DATABASE_URL: url },
          cwd: repoRoot,
          persist: true,
          runId: evalExecutionRun.id,
          decisionPacketChecksum: evalPacketBinding.packetChecksum,
          decisionPacketGeneratedAt: evalPacketBinding.packetGeneratedAt,
          intendedFiles: [intendedFile],
          evalCandidateProposals: [evalProposal],
          now: () => "2026-07-15T00:00:00.000Z",
          createId: (prefix) => `${prefix}-eval-retry`,
          readGitStatus: async () => `?? ${intendedFile}`
        });
        const evalFirst = await runEvalCapture(disposableDatabase.databaseUrl);
        let evalTransientError: unknown;
        try {
          await runEvalCapture("postgres://127.0.0.1:0/krn");
        } catch (error) {
          evalTransientError = error;
        }
        expect(evalTransientError).toBeInstanceOf(Error);
        expect((evalTransientError as Error).message).toMatch(/ECONNREFUSED|connect/i);
        const evalCountsAfterFailure = await client<{ count: number }[]>`
          select coalesce(sum(jsonb_array_length(feedback.eval_candidates)), 0)::int as count
          from feedback_deltas feedback
          inner join review_assessments review on review.id = feedback.review_assessment_id
          inner join evidence_bundles bundle on bundle.id = review.evidence_bundle_id
          where bundle.execution_run_id = ${evalExecutionRun.id}
        `;
        expect(evalCountsAfterFailure[0]?.count).toBe(1);
        const evalRetry = await runEvalCapture(disposableDatabase.databaseUrl);
        const evalCountsAfterRetry = await client<{ count: number }[]>`
          select coalesce(sum(jsonb_array_length(feedback.eval_candidates)), 0)::int as count
          from feedback_deltas feedback
          inner join review_assessments review on review.id = feedback.review_assessment_id
          inner join evidence_bundles bundle on bundle.id = review.evidence_bundle_id
          where bundle.execution_run_id = ${evalExecutionRun.id}
        `;
        expect(evalCountsAfterRetry[0]?.count).toBe(1);
        expect(evalFirst.stdout).toContain("evalCandidateProposals: 1");
        expect(evalRetry.stdout).toContain("evalCandidateProposals: 1");
        expect(captureIdentityFrom(evalRetry.stdout)).toBe(captureIdentityFrom(evalFirst.stdout));
      } finally {
        await rm(path.join(repoRoot, intendedFile), { force: true });
        await client.end();
        await disposableDatabase.cleanup();
      }
    },
    60_000
  );
});
